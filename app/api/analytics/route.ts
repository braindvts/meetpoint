import { NextResponse } from "next/server";
import { handleAnalyticsPost } from "@/lib/analyticsIngest";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { publicError } from "@/lib/safeError";

/** First-party event ingest. No third-party tracker. IP is not stored. */
export async function POST(req: Request) {
  try {
    const result = await handleAnalyticsPost(req, {
      memberId: async () => {
        const me = await getCurrentMember().catch(() => null);
        return me?.id ?? null;
      },
      create: async (row) => {
        await prisma.analyticsEvent.create({ data: row });
      },
    });
    return NextResponse.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return publicError(e, "Failed");
  }
}
