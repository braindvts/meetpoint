import { NextResponse } from "next/server";
import { accountDeletionDecision, anonymizeDeletedAccount } from "@/lib/accountDeletion";
import { publicError } from "@/lib/safeError";
import { prisma } from "@/lib/db";
import { partitionIdeaTags } from "@/lib/interests";
import { hasCurrentLegalConsent } from "@/lib/legal";
import { legalConsentDenied } from "@/lib/legalGuard";
import { clearMemberCookie, getCurrentMember, withMemberCookie } from "@/lib/memberAuth";
import { memberToProfile, profileToMemberData } from "@/lib/memberMap";
import { clearSession, getSession, hasRecentReauth } from "@/lib/session";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { recordSignup } from "@/lib/recordSignup";
import { rateLimit } from "@/lib/rateLimit";
import { deleteAccountSchema } from "@/lib/validation/auth";
import { membersMePutSchema } from "@/lib/validation/profile";
import { parseBody } from "@/lib/validation/parse";

/** Current membership profile from the database. */
export async function GET() {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({
        ok: true,
        profile: null,
        memberId: null,
        legalConsent: false,
        hasPassword: false,
      });
    }
    const full = await prisma.member.findUnique({
      where: { id: me.id },
      include: { interests: true },
    });
    if (!full) {
      return NextResponse.json({
        ok: true,
        profile: null,
        memberId: null,
        legalConsent: false,
        hasPassword: false,
      });
    }
    return NextResponse.json({
      ok: true,
      profile: memberToProfile(full),
      memberId: full.id,
      legalConsent: hasCurrentLegalConsent(full),
      hasPassword: !!full.passwordHash,
      signIn: {
        password: !!full.passwordHash,
        google: !!full.googleId,
        apple: !!full.appleId,
        linkedin: !!full.linkedInId,
      },
      accountEmail: full.email,
      emailVerified: !!full.emailVerifiedAt,
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
    if (existing) {
      const denied = legalConsentDenied(existing);
      if (denied) return denied;
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

    if (!existing) {
      await recordSignup(member.id, session?.provider || "email");
    }

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
 * Anonymize the signed-in account. Requires a fresh /api/auth/reauth cookie.
 * Does not require the current Terms. Reports and blocks stay on the anonymized id.
 * Profile interests and event RSVPs are removed with the public profile.
 */
export async function DELETE(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "account-delete", limit: 5, windowMs: 60 * 60_000 });
    if (!limited.ok) return limited.response;

    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

    const parsed = await parseBody(req, deleteAccountSchema);
    if (!parsed.ok) return parsed.response;

    const decision = accountDeletionDecision({
      confirm: parsed.data.confirm,
      hasPassword: !!me.passwordHash,
      recentReauth: await hasRecentReauth(me.id),
    });
    if (!decision.ok) {
      return NextResponse.json(
        { ok: false, error: decision.error, needsReauth: !!decision.needsReauth },
        { status: decision.status }
      );
    }

    const id = me.id;
    await prisma.$transaction((tx) => anonymizeDeletedAccount(tx, id));

    await clearSession();
    await clearMemberCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return publicError(e, "Failed to delete account");
  }
}
