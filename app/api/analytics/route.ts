import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";

/** First-party event ingest (no third-party required). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      path?: string;
      meta?: Record<string, unknown>;
    };
    const name = String(body.name || "").trim().slice(0, 80);
    if (!name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });

    const me = await getCurrentMember().catch(() => null);
    await prisma.analyticsEvent.create({
      data: {
        name,
        path: String(body.path || "").slice(0, 240),
        memberId: me?.id || null,
        metaJson: JSON.stringify(body.meta || {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
