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

/** Upsert the signed-in / cookie member from a Conclave profile. */
export async function PUT(req: Request) {
  try {
    await purgeDemoResidue();
    const body = (await req.json()) as { profile?: MyProfile };
    if (!body.profile?.name) {
      return NextResponse.json({ ok: false, error: "Missing profile" }, { status: 400 });
    }

    const session = await getSession();
    const existing = await getCurrentMember();
    const data = profileToMemberData({
      ...body.profile,
      linkedInId: body.profile.linkedInId || session?.id,
    });

    if (session?.id) {
      const verifications = JSON.parse(data.verificationsJson || "[]") as {
        method: string;
        value: string;
        verifiedAt: string;
      }[];
      if (session.provider === "linkedin" && !verifications.some((v) => v.method === "linkedin")) {
        verifications.push({
          method: "linkedin",
          value: `linkedin:${session.id}`,
          verifiedAt: new Date().toISOString(),
        });
        data.verificationsJson = JSON.stringify(verifications);
        data.linkedInId = session.id;
      }
    }

    const extra = {
      linkedInId: session?.provider === "linkedin" ? session.id : data.linkedInId,
      googleId: session?.provider === "google" ? session.id : undefined,
      appleId: session?.provider === "apple" ? session.id : undefined,
    };

    let member;
    if (existing) {
      member = await prisma.member.update({
        where: { id: existing.id },
        data: {
          ...data,
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
