import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember, withMemberCookie } from "@/lib/memberAuth";
import { memberToProfile, profileToMemberData } from "@/lib/memberMap";
import { getSession } from "@/lib/session";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import type { MyProfile } from "@/lib/types";

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

type VerificationRow = { method: string; value: string; verifiedAt: string };

function parseVerifications(raw: string | undefined): VerificationRow[] {
  try {
    const parsed = JSON.parse(raw || "[]") as VerificationRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function attachLinkedInVerification(
  session: { id?: string; provider?: string } | null,
  raw: string
): string {
  if (session?.provider !== "linkedin" || !session.id) return raw;
  const verifications = parseVerifications(raw);
  if (verifications.some((v) => v.method === "linkedin")) return raw;
  verifications.push({
    method: "linkedin",
    value: `linkedin:${session.id}`,
    verifiedAt: new Date().toISOString(),
  });
  return JSON.stringify(verifications);
}

/** Upsert the signed-in / cookie member from an Interlink profile. */
export async function PUT(req: Request) {
  try {
    await purgeDemoResidue();
    const body = (await req.json()) as { profile?: MyProfile };
    if (!body.profile?.name) {
      return NextResponse.json({ ok: false, error: "Missing profile" }, { status: 400 });
    }

    const session = await getSession();
    const existing = await getCurrentMember();
    const incoming = profileToMemberData({
      ...body.profile,
      linkedInId: body.profile.linkedInId || session?.id,
    });

    // Premier, dinners, and verifications are not client-writable on update.
    // A doctored profile PUT used to grant Premier / inflate meetings / spoof Verified.
    const {
      meetingsAttended: _meetings,
      premierActive: _premierActive,
      premierInterval: _premierInterval,
      premierStartedAt: _premierStartedAt,
      premierTrialEndsAt: _premierTrialEndsAt,
      verificationsJson: clientVerifications,
      ...identity
    } = incoming;

    const extra = {
      linkedInId: session?.provider === "linkedin" ? session.id : identity.linkedInId,
      googleId: session?.provider === "google" ? session.id : undefined,
      appleId: session?.provider === "apple" ? session.id : undefined,
    };

    let member;
    if (existing) {
      const verificationsJson = attachLinkedInVerification(session, existing.verificationsJson);
      member = await prisma.member.update({
        where: { id: existing.id },
        data: {
          ...identity,
          verificationsJson,
          email: session?.email || existing.email,
          linkedInId: extra.linkedInId || existing.linkedInId,
          googleId: extra.googleId || existing.googleId,
          appleId: extra.appleId || existing.appleId,
        },
      });
    } else {
      const verificationsJson = attachLinkedInVerification(
        session,
        clientVerifications || "[]"
      );
      member = await prisma.member.create({
        data: {
          ...identity,
          verificationsJson,
          email: session?.email || null,
          linkedInId: extra.linkedInId || null,
          googleId: extra.googleId || null,
          appleId: extra.appleId || null,
          photo: identity.photo || session?.picture || "",
          name: identity.name || session?.name || "Member",
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

/** Record one attended dinner. Clients cannot set an arbitrary count. */
export async function POST(req: Request) {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action !== "attended") {
      return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { id: me.id },
      data: { meetingsAttended: { increment: 1 } },
    });

    return NextResponse.json({
      ok: true,
      meetingsAttended: updated.meetingsAttended,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
