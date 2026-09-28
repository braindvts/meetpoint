import { NextResponse } from "next/server";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { getCurrentMember, withMemberCookie } from "@/lib/memberAuth";
import { partitionIdeaTags } from "@/lib/interests";
import { memberToProfile, profileToMemberData } from "@/lib/memberMap";
import { getSession } from "@/lib/session";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { membersMePutSchema } from "@/lib/validation/profile";
import { parseBody } from "@/lib/validation/parse";

/** Current membership profile from the database. */
export async function GET() {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, profile: null, memberId: null });
    const full = await prisma.member.findUnique({
      where: { id: me.id },
      include: { interests: true },
    });
    if (!full) return NextResponse.json({ ok: true, profile: null, memberId: null });
    return NextResponse.json({
      ok: true,
      profile: memberToProfile(full),
      memberId: full.id,
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/** Upsert the signed-in member — privileged fields are stripped by schema. */
export async function PUT(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "members-me", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const parsed = await parseBody(req, membersMePutSchema, { maxBytes: 2_200_000 });
    if (!parsed.ok) return parsed.response;

    const session = await getSession();
    const existing = await getCurrentMember();

    // Require a session or existing member cookie for updates
    if (!session && !existing) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }

    const profile = parsed.data.profile;
    const data = profileToMemberData(profile as never);
    const interestSlugs = partitionIdeaTags(profile.ideaTags).canonical.map((item) => item.slug);

    let verificationsJson = existing?.verificationsJson || "[]";
    let linkedInId = existing?.linkedInId || null;

    // First create via LinkedIn: seed verification once
    if (
      !existing &&
      session?.provider === "linkedin" &&
      session.id
    ) {
      const vers = JSON.parse(verificationsJson) as {
        method: string;
        value: string;
        verifiedAt: string;
      }[];
      if (!vers.some((v) => v.method === "linkedin")) {
        vers.push({
          method: "linkedin",
          value: `linkedin:${session.id}`,
          verifiedAt: new Date().toISOString(),
        });
        verificationsJson = JSON.stringify(vers);
      }
      linkedInId = session.id;
    }

    // Stamp linkedInId only onto a new member or the row that already has
    // this LinkedIn id. Never adopt it onto an account found some other way.
    const linkedInForWrite =
      session?.provider === "linkedin" && session.id
        ? !existing || existing.linkedInId === session.id
          ? session.id
          : existing.linkedInId
        : linkedInId;
    const extra = {
      linkedInId: linkedInForWrite,
      googleId: session?.provider === "google" ? session.id : undefined,
      appleId: session?.provider === "apple" ? session.id : undefined,
    };
    let createEmail = session?.email?.trim().toLowerCase() || null;
    if (!existing && session?.provider === "linkedin" && createEmail) {
      const taken = await prisma.member.findFirst({
        where: { email: { equals: createEmail, mode: "insensitive" } },
        select: { id: true },
      });
      if (taken) createEmail = null;
    }

    const member = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.member.update({
            where: { id: existing.id },
            data: {
              ...data,
              // Keep standing fields — never overwrite from client
              verificationsJson: existing.verificationsJson,
              meetingsAttended: existing.meetingsAttended,
              premierActive: existing.premierActive,
              premierInterval: existing.premierInterval,
              premierStartedAt: existing.premierStartedAt,
              premierTrialEndsAt: existing.premierTrialEndsAt,
              black: existing.black,
              blackSince: existing.blackSince,
              blackSource: existing.blackSource,
              email: session?.provider === "linkedin" ? existing.email : session?.email || existing.email,
              linkedInId: extra.linkedInId || existing.linkedInId,
              googleId: extra.googleId || existing.googleId,
              appleId: extra.appleId || existing.appleId,
              isSample: existing.isSample,
              sampleKind: existing.sampleKind,
            },
          })
        : await tx.member.create({
            data: {
              ...data,
              verificationsJson,
              email: session?.provider === "linkedin" ? createEmail : session?.email || null,
              linkedInId: extra.linkedInId || null,
              googleId: extra.googleId || null,
              appleId: extra.appleId || null,
              photo: data.photo || session?.picture || "",
              name: data.name || session?.name || "Member",
            },
          });

      await tx.memberInterest.deleteMany({ where: { memberId: saved.id } });
      if (interestSlugs.length) {
        await tx.memberInterest.createMany({
          data: interestSlugs.map((slug) => ({ memberId: saved.id, slug })),
        });
      }
      return tx.member.findUniqueOrThrow({
        where: { id: saved.id },
        include: { interests: true },
      });
    });

    const res = NextResponse.json({
      ok: true,
      profile: memberToProfile(member),
      memberId: member.id,
    });
    return withMemberCookie(res, member.id);
  } catch (e) {
    return publicError(e, "Failed");
  }
}

/**
 * Clear the signed-in member's public profile and introductions.
 * The account (email, password, OAuth ids) stays so they can sign in again.
 */
export async function DELETE(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "members-me-delete", limit: 10, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const existing = await getCurrentMember();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.memberInterest.deleteMany({ where: { memberId: existing.id } }),
      prisma.connection.deleteMany({
        where: { OR: [{ fromId: existing.id }, { toId: existing.id }] },
      }),
      prisma.member.update({
        where: { id: existing.id },
        data: {
          jobTitle: "",
          bio: "",
          photo: "",
          company: "",
          industry: "",
          phone: null,
          lookingForJson: "[]",
          ideaTagsJson: "[]",
          workJson: "[]",
        },
      }),
    ]);

    return NextResponse.json({ ok: true, profile: null, memberId: existing.id });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
