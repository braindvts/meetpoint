import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { catalogEvent, foldInterestCounts, isStoredRsvp } from "@/lib/eventRsvp";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sampleMemberWhere } from "@/lib/sampleAccounts";
import { parseBody } from "@/lib/validation/parse";
import { z } from "zod";

const rsvpSchema = z
  .object({
    eventId: z.string().trim().min(1).max(80),
    status: z.enum(["interested", "going", "passed"]).nullable(),
  })
  .strict();

async function countsFor(eventId: string) {
  const grouped = await prisma.eventInterest.groupBy({
    by: ["eventId", "status"],
    where: {
      eventId,
      member: { AND: [{ deletedAt: null }, { NOT: sampleMemberWhere() }] },
    },
    _count: { _all: true },
  });
  const folded = foldInterestCounts(
    grouped.map((row) => ({
      eventId: row.eventId,
      status: row.status,
      n: row._count._all,
    }))
  );
  return folded[eventId] || { interested: 0, attending: 0 };
}

/** Save or clear the signed-in member's RSVP. One EventInterest row per event. */
export async function PUT(req: Request) {
  try {
    const limited = await rateLimit(req, { name: "event-rsvp", limit: 60, windowMs: 60_000 });
    if (!limited.ok) return limited.response;

    const me = await getCurrentMember();
    if (!me) {
      return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    }
    const denied = legalConsentDenied(me);
    if (denied) return denied;

    const parsed = await parseBody(req, rsvpSchema);
    if (!parsed.ok) return parsed.response;

    const event = catalogEvent(parsed.data.eventId);
    if (!event) {
      return NextResponse.json({ ok: false, error: "Unknown event" }, { status: 404 });
    }

    const status = parsed.data.status;
    if (status && !isStoredRsvp(status)) {
      return NextResponse.json({ ok: false, error: "Unknown RSVP" }, { status: 400 });
    }

    if (!status) {
      await prisma.eventInterest.deleteMany({
        where: { memberId: me.id, eventId: event.id },
      });
    } else {
      await prisma.eventInterest.upsert({
        where: { memberId_eventId: { memberId: me.id, eventId: event.id } },
        create: { memberId: me.id, eventId: event.id, status },
        update: { status },
      });
    }

    const counts = await countsFor(event.id);
    return NextResponse.json({
      ok: true,
      eventId: event.id,
      status,
      counts,
    });
  } catch (e) {
    return publicError(e, "Failed to save RSVP");
  }
}
