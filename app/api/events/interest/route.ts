import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventById } from "@/lib/events";
import { getCurrentMember } from "@/lib/memberAuth";
import type { EventInterest, EventInterestStatus } from "@/lib/eventTypes";

const STATUSES = new Set<EventInterestStatus>(["going", "saved", "passed"]);

function asStatus(value: unknown): EventInterestStatus | null {
  return typeof value === "string" && STATUSES.has(value as EventInterestStatus)
    ? (value as EventInterestStatus)
    : null;
}

/** Save going / saved / passed on a curated table. Requires a signed-in member. */
export async function POST(req: Request) {
  try {
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Sign in to RSVP" }, { status: 401 });
    }

    const body = (await req.json()) as { eventId?: string; status?: string; clear?: boolean };
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
    if (!eventId || !eventById(eventId)) {
      return NextResponse.json({ ok: false, error: "Unknown table" }, { status: 400 });
    }

    if (body.clear) {
      await prisma.eventInterest.deleteMany({
        where: { memberId: me.id, eventId },
      });
    } else {
      const status = asStatus(body.status);
      if (!status) {
        return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
      }
      await prisma.eventInterest.upsert({
        where: { memberId_eventId: { memberId: me.id, eventId } },
        create: { memberId: me.id, eventId, status },
        update: { status },
      });
    }

    const rows = await prisma.eventInterest.findMany({ where: { memberId: me.id } });
    const interests: EventInterest[] = rows
      .map((r) => {
        const status = asStatus(r.status);
        return status ? { eventId: r.eventId, status } : null;
      })
      .filter((r): r is EventInterest => !!r);

    return NextResponse.json({ ok: true, interests });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
