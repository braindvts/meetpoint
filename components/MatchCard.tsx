"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import TierBadge from "@/components/TierBadge";
import type { MatchResult } from "@/lib/match";
import { ownerHeadline } from "@/lib/personFacts";
import type { ConnectionStatus } from "@/lib/types";

interface Props {
  match: MatchResult;
  status?: ConnectionStatus;
  canConnect?: boolean;
  onConnect?: (peerId: string) => void;
  onNeedPremier?: (peerId: string) => void;
  onOpenProfile?: (peerId: string) => void;
  onSkip?: (peerId: string) => void;
  preview?: boolean;
}

export default function MatchCard({
  match,
  status,
  canConnect = true,
  onConnect,
  onNeedPremier,
  onOpenProfile,
  onSkip,
  preview = false,
}: Props) {
  const { person, sharedIdeas, sharedLookingFor, sameBusiness, canHelp, sameJob, tier } = match;

  const role =
    person.jobTitle ||
    (canHelp ? "Can help" : sameJob ? "Same profession" : "Member");
  const owns = ownerHeadline(person);
  const tags = (person.ideaTags.length ? person.ideaTags : sharedIdeas).slice(0, 3);
  const sharedLabel =
    sharedIdeas.length > 0
      ? `${sharedIdeas.length} shared ${sharedIdeas.length === 1 ? "interest" : "interests"}`
      : sharedLookingFor.length > 0
        ? `${sharedLookingFor.length} shared ${sharedLookingFor.length === 1 ? "aim" : "aims"}`
        : sameBusiness
          ? "Same field"
          : null;
  const isNew = !preview && !status;

  const connectLocked = preview || status === "connected" || status === "requested";

  function connectAria() {
    if (preview) return "Your card";
    if (status === "connected") return "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Unlock Premier to connect";
    return "Connect";
  }

  function handleConnect(e: MouseEvent) {
    e.stopPropagation();
    if (preview) return;
    if (!canConnect) {
      onNeedPremier?.(person.id);
      return;
    }
    if (!connectLocked) onConnect?.(person.id);
  }

  function handleKey(e: KeyboardEvent) {
    if (!onOpenProfile) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenProfile(person.id);
    }
  }

  return (
    <article
      role={onOpenProfile ? "button" : undefined}
      tabIndex={onOpenProfile ? 0 : undefined}
      onClick={() => onOpenProfile?.(person.id)}
      onKeyDown={handleKey}
      className={`overflow-hidden rounded-[18px] border border-accent/20 bg-[#12110f] ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      }`}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-black">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt=""
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="grid h-full place-items-center bg-panel-2 text-3xl font-semibold text-ivory/40">
            {person.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#12110f] to-transparent"
          aria-hidden
        />
        {isNew ? (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
            New
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-4 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[1.22rem] font-semibold leading-tight tracking-tight text-ivory">
              {person.name}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-ivory/70">
              <span className="font-medium text-accent">{role}</span>
              <span className="text-ivory/40">, </span>
              {person.city.name}
            </p>
          </div>
          <TierBadge tier={tier} size="sm" />
        </div>

        {sharedLabel ? (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ivory/65">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="9" cy="8" r="2.4" />
              <circle cx="16" cy="9" r="2" />
              <path d="M4.5 17.5c.6-2.4 2.3-3.6 4.5-3.6 2.2 0 4 1.2 4.6 3.6" strokeLinecap="round" />
              <path d="M14 16.8c.4-1.6 1.5-2.5 2.4-2.5 1.2 0 2.6.8 3.1 2.5" strokeLinecap="round" />
            </svg>
            {sharedLabel}
          </p>
        ) : null}

        {owns ? <p className="mt-1 truncate text-[12px] font-medium text-accent-2">{owns}</p> : null}

        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] text-ivory/75"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          {onSkip && !preview ? (
            <button
              type="button"
              aria-label="Pass"
              onClick={(e) => {
                e.stopPropagation();
                onSkip(person.id);
              }}
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-white/18 text-ivory/80 transition active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}

          <button
            type="button"
            aria-label={connectAria()}
            disabled={connectLocked && status !== "connected"}
            onClick={handleConnect}
            className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full transition active:scale-95 ${
              status === "connected"
                ? "border border-accent/25 text-muted"
                : status === "requested"
                  ? "border border-accent/45 text-accent"
                  : !canConnect && !preview
                    ? "border border-accent/40 text-accent"
                    : "bg-gradient-to-b from-accent-2 to-accent text-ink shadow-[0_8px_20px_rgba(212,196,168,0.22)]"
            }`}
          >
            {status === "requested" ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4.5l2.5 1.5" strokeLinecap="round" />
              </svg>
            ) : !canConnect && !preview && !status ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="6" y="11" width="12" height="8" rx="1.5" />
                <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {preview ? (
            <p className="text-[12px] font-medium text-muted">Your card</p>
          ) : status === "connected" ? (
            <p className="text-[12px] font-medium text-muted">Connected</p>
          ) : status === "requested" ? (
            <p className="text-[12px] font-medium text-accent">Waiting</p>
          ) : !canConnect ? (
            <p className="text-[12px] font-medium text-accent">Premier</p>
          ) : (
            <p className="text-[12px] font-medium text-ivory/70">Connect</p>
          )}
        </div>
      </div>
    </article>
  );
}
