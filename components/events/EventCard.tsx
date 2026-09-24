"use client";

import Link from "next/link";
import {
  CATEGORY_LABEL,
  formatEventDate,
  formatEventTime,
  type InterlinkEvent,
} from "@/lib/events";

type Props = {
  event: InterlinkEvent;
  interestedCount?: number;
  attendeeCount?: number;
  networkCount?: number;
  interested?: boolean;
  going?: boolean;
  onToggleInterested?: () => void;
  onPass?: () => void;
  matchReasons?: string[];
  compact?: boolean;
};

export default function EventCard({
  event,
  interestedCount,
  attendeeCount,
  networkCount = 0,
  interested,
  going = false,
  onToggleInterested,
  onPass,
  matchReasons,
  compact,
}: Props) {
  const interestedN = interestedCount ?? event.interestedCount;
  const attendeesN = attendeeCount ?? event.attendeeCount;

  return (
    <article
      className={`mp-card-motion group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] ${
        compact ? "" : "mp-scroll-card"
      }`}
    >
      <Link href={`/events/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image}
            alt=""
            className="mp-card-photo h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12110f] via-[#12110f]/35 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-accent/30 bg-ink/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent backdrop-blur-sm">
              {CATEGORY_LABEL[event.category]}
            </span>
            {event.exclusive ? (
              <span className="rounded-md border border-ivory/20 bg-ink/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-ivory/90 backdrop-blur-sm">
                Exclusive
              </span>
            ) : null}
            {event.format === "online" ? (
              <span className="rounded-md border border-line bg-ink/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted backdrop-blur-sm">
                Online
              </span>
            ) : null}
          </div>
        </div>
        <div className="space-y-2.5 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[1.05rem] font-medium leading-snug tracking-tight text-ivory sm:text-lg">
              {event.name}
            </h3>
          </div>
          <p className="text-[12px] leading-relaxed text-muted sm:text-[13px]">
            {formatEventDate(event.startsAt)}
            <span className="text-line"> · </span>
            {formatEventTime(event.startsAt)}
            <span className="text-line"> · </span>
            {event.city}
            {event.format !== "online" ? (
              <>
                <span className="text-line"> · </span>
                {event.venue}
              </>
            ) : null}
          </p>
          <p className="line-clamp-2 text-sm leading-relaxed text-ivory/75">
            {event.shortDescription}
          </p>
          {matchReasons && matchReasons.length > 0 ? (
            <p className="line-clamp-1 text-[11px] leading-relaxed text-accent/90">
              {matchReasons.join(" · ")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted">
            <span>{interestedN.toLocaleString()} interested</span>
            <span className="text-line">·</span>
            <span>{attendeesN.toLocaleString()} attending</span>
            {networkCount > 0 ? (
              <>
                <span className="text-line">·</span>
                <span className="text-accent/90">
                  {networkCount} in your network
                </span>
              </>
            ) : null}
          </div>
          <p className="text-[11px] text-muted/80">Hosted by {event.organizer}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-accent/10 px-4 py-3 sm:px-5">
        <Link
          href={`/events/${event.slug}`}
          className="mp-btn-lux inline-flex flex-1 items-center justify-center rounded-lg bg-ivory px-4 py-2.5 text-[11px] font-semibold text-ink"
        >
          View Event
        </Link>
        {onToggleInterested ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleInterested();
            }}
            aria-pressed={!!interested || going}
            className={`mp-press mp-rsvp rounded-xl border px-3 py-2.5 text-[11px] font-medium ${
              going ? "is-going" : ""
            } ${
              interested || going
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-accent/20 text-muted hover:border-accent/40 hover:text-ivory"
            }`}
          >
            {going ? "Going" : interested ? "Saved" : "Interested"}
          </button>
        ) : null}
        {onPass ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onPass();
            }}
            className="rounded-xl border border-line px-3 py-2.5 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-ivory"
          >
            Pass
          </button>
        ) : null}
      </div>
    </article>
  );
}
