import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { parseBody } from "@/lib/validation/parse";
import { blockSchema } from "@/lib/validation/safety";

export async function GET() {
  try {
    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: true, blockedIds: [] });

    const rows = await prisma.block.findMany({
      where: { blockerId: me.id },
      select: { blockedId: true },
    });
    return NextResponse.json({
      ok: true,
      blockedIds: rows.map((r) => r.blockedId),
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, { name: "blocks", limit: 40, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    await purgeDemoResidue();
    const me = await getCurrentMember();
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, blockSchema);
    if (!parsed.ok) return parsed.response;

    const peerId = parsed.data.peerId;
    if (peerId === me.id) {
      return NextResponse.json({ ok: false, error: "Invalid peer" }, { status: 400 });
    }

    if (parsed.data.action === "unblock") {
      await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId: peerId } });
    } else {
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: me.id, blockedId: peerId } },
        create: { blockerId: me.id, blockedId: peerId },
        update: {},
      });
      await prisma.connection.deleteMany({
        where: {
          OR: [
            { fromId: me.id, toId: peerId },
            { fromId: peerId, toId: me.id },
          ],
        },
      });
    }

    const rows = await prisma.block.findMany({
      where: { blockerId: me.id },
      select: { blockedId: true },
    });
    return NextResponse.json({ ok: true, blockedIds: rows.map((r) => r.blockedId) });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
