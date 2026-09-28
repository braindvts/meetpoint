import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";

/**
 * Clear the signed-in member's public profile and introductions.
 * The account (email, password, OAuth ids, name) stays so they can sign in again.
 * Account deletion is DELETE /api/members/me and is not this route.
 */
export async function POST(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "members-me-reset", limit: 10, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const existing = await getCurrentMember();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }
    const denied = legalConsentDenied(existing);
    if (denied) return denied;

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
