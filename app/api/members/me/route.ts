import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember, withMemberCookie } from "@/lib/memberAuth";
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
    return NextResponse.json({
      ok: true,
      profile: memberToProfile(me),
      memberId: me.id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** Upsert the signed-in member — privileged fields are stripped by schema. */
export async function PUT(req: Request) {
  try {
    const limited = rateLimit(req, { name: "members-me", limit: 60, windowMs: 60_000 });
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

    const data = profileToMemberData(parsed.data.profile as never);

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

    const extra = {
      linkedInId: session?.provider === "linkedin" ? session.id : linkedInId,
      googleId: session?.provider === "google" ? session.id : undefined,
      appleId: session?.provider === "apple" ? session.id : undefined,
    };

    let member;
    if (existing) {
      member = await prisma.member.update({
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
          email: session?.email || existing.email,
          linkedInId: extra.linkedInId || existing.linkedInId,
          googleId: extra.googleId || existing.googleId,
          appleId: extra.appleId || existing.appleId,
        },
      });
    } else {
      member = await prisma.member.create({
        data: {
          ...data,
          verificationsJson,
          email: session?.email || null,
          linkedInId: extra.linkedInId || null,
          googleId: extra.googleId || null,
          appleId: extra.appleId || null,
          photo: data.photo || session?.picture || "",
          name: data.name || session?.name || "Member",
        },
      });
    }

    const res = NextResponse.json({
      ok: true,
      profile: memberToProfile(member),
      memberId: member.id,
    });
    return withMemberCookie(res, member.id);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
