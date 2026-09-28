import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/events";
import { getCurrentMember } from "@/lib/memberAuth";
import { blockedPeerIdSet } from "@/lib/moderation";
import { filterAttendeeIds } from "@/lib/safetyRules";

/** Public catalog for /events. Attendee ids are stripped for blocked pairs. */
export async function GET() {
  const events = getPublishedEvents();
  try {
    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: true, events });
    }

    const blocked = await blockedPeerIdSet(me.id);
    return NextResponse.json({
      ok: true,
      events: events.map((event) => ({
        ...event,
        attendeeIds: filterAttendeeIds(event.attendeeIds, blocked),
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, events });
  }
}
