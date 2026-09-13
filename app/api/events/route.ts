import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CONCLAVE_TABLES } from "@/lib/events";
import { rankEvents } from "@/lib/eventMatch";
import type { EventInterest, EventInterestStatus } from "@/lib/eventTypes";
import { getCurrentMember } from "@/lib/memberAuth";
import { memberToProfile } from "@/lib/memberMap";

function asInterest(status: string): EventInterestStatus | null {
  if (status === "going" || status === "saved" || status === "passed") return status;
  return null;
}

/** Ranked Conclave tables for the signed-in member, plus the catalog. */
export async function GET() {
  try {
    const me = await getCurrentMember();
    let interests: EventInterest[] = [];
    if (me) {
      const rows = await prisma.eventInterest.findMany({
        where: { memberId: me.id },
      });
      interests = rows
        .map((r) => {
          const status = asInterest(r.status);
          return status ? { eventId: r.eventId, status } : null;
        })
        .filter((r): r is EventInterest => !!r);
    }

    const matches = me
      ? rankEvents(memberToProfile(me), CONCLAVE_TABLES, interests)
      : [];

    return NextResponse.json({
      ok: true,
      events: CONCLAVE_TABLES,
      matches,
      interests,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Failed to load tables" },
      { status: 500 }
    );
  }
}
