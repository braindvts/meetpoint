import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember, withMemberCookie } from "@/lib/memberAuth";
import { memberToProfile, profileToMemberData } from "@/lib/memberMap";
import { getSession } from "@/lib/session";
import { ensureSeeded } from "@/lib/seed";
import type { MyProfile } from "@/lib/types";

/** Current membership profile from the database. */
export async function GET() {
  try {
    await ensureSeeded();
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
    await ensureSeeded();
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

    // LinkedIn session counts as verification
    if (session?.id) {
      const verifications = JSON.parse(data.verificationsJson || "[]") as {
        method: string;
        value: string;
        verifiedAt: string;
      }[];
      if (!verifications.some((v) => v.method === "linkedin")) {
        verifications.push({
          method: "linkedin",
          value: `linkedin:${session.id}`,
          verifiedAt: new Date().toISOString(),
        });
        data.verificationsJson = JSON.stringify(verifications);
      }
      data.linkedInId = session.id;
      if (session.email && !data.phone) {
        /* keep phone as-is */
      }
    }

    let member;
    if (existing) {
      member = await prisma.member.update({
        where: { id: existing.id },
        data,
      });
    } else if (session?.id) {
      const byLi = await prisma.member.findUnique({ where: { linkedInId: session.id } });
      member = byLi
        ? await prisma.member.update({ where: { id: byLi.id }, data })
        : await prisma.member.create({
            data: {
              ...data,
              linkedInId: session.id,
              email: session.email || null,
              photo: data.photo || session.picture || "",
              name: data.name || session.name,
            },
          });
    } else {
      member = await prisma.member.create({ data });
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
