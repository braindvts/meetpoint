import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validation/parse";
import { analyticsSchema } from "@/lib/validation/safety";

/** First-party event ingest (no third-party required). */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "analytics", limit: 120, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const parsed = await parseBody(req, analyticsSchema);
    if (!parsed.ok) return parsed.response;

    const me = await getCurrentMember().catch(() => null);
    await prisma.analyticsEvent.create({
      data: {
        name: parsed.data.name,
        path: (parsed.data.path || "").slice(0, 240),
        memberId: me?.id || null,
        metaJson: JSON.stringify(parsed.data.meta || {}),
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
