import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyRsvpCounts, foldInterestCounts, isStoredRsvp } from "@/lib/eventRsvp";
import { getPublishedEvents } from "@/lib/events";
import { getCurrentMember } from "@/lib/memberAuth";
import { blockedPeerIdSet } from "@/lib/moderation";
import { publicError } from "@/lib/safeError";
import { sampleMemberWhere } from "@/lib/sampleAccounts";
import { filterAttendeeIds } from "@/lib/safetyRules";

/**
 * Public catalog for /events.
 * interestedCount and attendeeCount come from EventInterest.
 * The signed-in member also receives their own RSVPs.
 * Blocked attendee ids are removed for that member.
 */
export async function GET() {
  try {
    const published = getPublishedEvents();
    const me = await getCurrentMember();

    let events = published;
    let counts: Record<string, { interested: number; attending: number }> = {};
    let countsFromDb = false;
    try {
      const grouped = await prisma.eventInterest.groupBy({
        by: ["eventId", "status"],
        where: { member: { NOT: sampleMemberWhere() } },
        _count: { _all: true },
      });
      counts = foldInterestCounts(
        grouped.map((row) => ({
          eventId: row.eventId,
          status: row.status,
          n: row._count._all,
        }))
      );
      events = applyRsvpCounts(published, counts);
      countsFromDb = true;
    } catch {
      // Table not present yet. Keep the catalog numbers rather than failing the page.
    }

    let rsvps: Record<string, string> = {};
    if (me) {
      const blocked = await blockedPeerIdSet(me.id);
      events = events.map((event) => ({
        ...event,
        attendeeIds: filterAttendeeIds(event.attendeeIds, blocked),
      }));
      try {
        const mine = await prisma.eventInterest.findMany({
          where: { memberId: me.id },
          select: { eventId: true, status: true },
        });
        for (const row of mine) {
          if (isStoredRsvp(row.status)) rsvps[row.eventId] = row.status;
        }
      } catch {
        rsvps = {};
      }
    }

    return NextResponse.json({
      ok: true,
      signedIn: !!me,
      events,
      countsFromDb,
      counts,
      rsvps,
    });
  } catch (e) {
    return publicError(e, "Failed to load events");
  }
}
