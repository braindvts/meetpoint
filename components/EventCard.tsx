"use client";

import type { MouseEvent } from "react";
import TiltCard from "@/components/motion/TiltCard";
import { formatEventWhen, tableKindLabel, type EventMatchResult } from "@/lib/eventMatch";
import type { EventInterestStatus } from "@/lib/eventTypes";

interface Props {
  match: EventMatchResult;
  status?: EventInterestStatus;
  onInterest?: (eventId: string, status: EventInterestStatus) => void;
  onClear?: (eventId: string) => void;
}

export default function EventCard({ match, status, onInterest, onClear }: Props) {
  const { event, reasons, topicOverlap, isLocal } = match;
  const when = formatEventWhen(event.startsAt);
  const topics = event.topics.slice(0, 3);
  const reasonLine = reasons.map((r) => r.label).slice(0, 2);

  function setStatus(e: MouseEvent, next: EventInterestStatus) {
    e.stopPropagation();
    if (status === next) onClear?.(event.id);
    else onInterest?.(event.id, next);
  }

  return (
    <TiltCard className="h-full">
    <article className="il-node-card flex h-full min-h-[320px] flex-col">
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[12px] border border-accent/20 bg-black text-accent sm:h-[72px] sm:w-[72px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
            {tableKindLabel(event.kind)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[1.05rem] font-semibold leading-tight tracking-tight text-ivory sm:text-[1.15rem]">
              {event.title}
            </h3>
            {status === "going" ? (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                Going
              </span>
            ) : status === "saved" ? (
              <span className="shrink-0 rounded-full border border-accent/40 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-accent">
                Saved
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] font-medium text-accent">
            {event.hostName}
            <span className="text-ivory/40"> · </span>
            {event.hostRole}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-ivory/55">
            {event.city.name}, {event.city.country}
            {isLocal ? " · Near you" : ""}
            {when ? ` · ${when}` : ""}
          </p>
          <p className="mt-1.5 text-[11px] text-ivory/45">
            {event.venueName} · {event.seats} seats
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 border-t border-white/[0.07] px-4 py-3">
        <p className="line-clamp-3 min-h-[3.6rem] text-[13px] leading-relaxed text-ivory/75">
          {event.description}
        </p>

        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((tag) => {
              const shared = topicOverlap.includes(tag);
              return (
                <span
                  key={tag}
                  className={`rounded-full border px-2 py-[3px] text-[11px] ${
                    shared
                      ? "border-accent/45 bg-accent/10 text-accent"
                      : "border-white/12 bg-white/[0.04] text-ivory/70"
                  }`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="min-h-[1.6rem]" />
        )}

        {event.audience.length > 0 ? (
          <p className="line-clamp-1 text-[12px] text-ivory/65">
            <span className="text-muted">For </span>
            {event.audience.join(", ")}
          </p>
        ) : (
          <p className="min-h-[1.1rem] text-[12px] text-transparent">.</p>
        )}

        <p className="mt-auto line-clamp-1 text-[12px] text-ivory/55">
          {reasonLine.length ? reasonLine.join(" · ") : "\u00a0"}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-white/[0.07] px-4 py-3">
        <button
          type="button"
          aria-label="Pass"
          onClick={(e) => setStatus(e, "passed")}
          className="il-action"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={status === "saved" ? "Unsave" : "Save"}
          onClick={(e) => setStatus(e, "saved")}
          className={`il-action ${
            status === "saved" ? "border-accent/45 text-accent" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 5.5h10v14l-5-3.2-5 3.2v-14z" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={status === "going" ? "Undo going" : "I'm going"}
          onClick={(e) => setStatus(e, "going")}
          className={`il-action ${
            status === "going" ? "border-accent/45 text-accent" : "il-action--fill"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className={`text-[12px] font-medium ${status === "going" ? "text-accent" : "text-ivory/70"}`}>
          {status === "going" ? "Going" : status === "saved" ? "Saved" : "Take a seat"}
        </p>
      </div>
    </article>
    </TiltCard>
  );
}
