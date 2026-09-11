"use client";

import Link from "next/link";
import {
  formatEventDate,
  type InterlinkEvent,
} from "@/lib/events";

type Props = {
  event: InterlinkEvent;
};

/** Larger convention / conference card for the conventions strip. */
export default function ConventionCard({ event }: Props) {
  return (
    <article className="mp-reveal group relative flex h-full flex-col overflow-hidden rounded-2xl border border-accent/15 bg-[#12110f] transition hover:border-accent/35">
      <Link href={`/events/${event.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[2/1] overflow-hidden sm:aspect-[21/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12110f] via-[#12110f]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
              {event.industry} · Convention
            </p>
            <h3 className="mt-1.5 text-xl font-medium tracking-tight text-ivory sm:text-2xl">
              {event.name}
            </h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-[12px] text-muted sm:text-[13px]">
            {formatEventDate(event.startsAt)} – {formatEventDate(event.endsAt)}
            <span className="text-line"> · </span>
            {event.venue}, {event.city}
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-ivory/75">
            {event.shortDescription}
          </p>
          {event.expectedAttendance ? (
            <p className="text-[11px] text-muted">
              Expected attendance · {event.expectedAttendance.toLocaleString()}
            </p>
          ) : null}
          {event.speakers?.length ? (
            <p className="text-[11px] text-muted">
              Speakers · {event.speakers.slice(0, 3).join(", ")}
            </p>
          ) : null}
          {event.companies?.length ? (
            <p className="text-[11px] text-muted">
              Featuring · {event.companies.slice(0, 3).join(", ")}
            </p>
          ) : null}
          <p className="mt-auto pt-1 text-[11px] text-muted/80">
            Organized by {event.organizer}
          </p>
        </div>
      </Link>
      <div className="flex gap-2 border-t border-accent/10 px-4 py-3 sm:px-6">
        <Link
          href={`/events/${event.slug}`}
          className="mp-btn-lux inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent px-4 py-2.5 text-[11px] font-semibold text-ink"
        >
          View convention
        </Link>
        {event.registrationUrl ? (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-accent/25 px-4 py-2.5 text-[11px] font-medium text-ivory/90 transition hover:border-accent/50"
          >
            Register
          </a>
        ) : null}
      </div>
    </article>
  );
}
