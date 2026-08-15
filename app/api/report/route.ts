import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";

/** Safety: report a member. */
export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { peerId?: string; reason?: string };
  if (!body.peerId || !body.reason?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing peerId/reason" }, { status: 400 });
  }

  await prisma.report.create({
    data: {
      reporterId: me.id,
      peerId: body.peerId,
      reason: body.reason.trim().slice(0, 500),
    },
  });

  return NextResponse.json({ ok: true });
}
