"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import TierBadge from "@/components/TierBadge";
import { blackConnectionWith } from "@/lib/blackStore";
import type { MatchResult } from "@/lib/match";
import { formatDistance } from "@/lib/match";
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

/**
 * Discover card — fixed height, most important info only.
 * Level badge already shows Verified; we don’t list how they verified.
 */
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
  const {
    person,
    sharedIdeas,
    sharedLookingFor,
    helpReasons,
    sameJob,
    tier,
    distance,
    isLocal,
  } = match;

  const settledWithMe = preview ? undefined : blackConnectionWith(person.id);
  const blackConnections =
    person.blackConnections ?? (settledWithMe?.iAmBlack ? 1 : 0);
  const ideas = person.ideaTags.slice(0, 3);
  const looking = person.lookingFor.slice(0, 3);

  const reasons: string[] = [];
  if (sharedIdeas.length) reasons.push(`${sharedIdeas.length} shared interests`);
  if (helpReasons.length) reasons.push(`Can help`);
  if (sharedLookingFor.length) reasons.push(`Both want ${sharedLookingFor[0]}`);
  if (sameJob) reasons.push("Same profession");
  if (isLocal) reasons.push("Nearby");

  const isNew = !preview && !status;
  const connectLocked = preview || status === "connected" || status === "requested";

  function connectAria() {
    if (preview) return "Your card";
    if (status === "connected") return "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Unlock Premier to connect";
    return "Connect";
  }

  function actionLabel() {
    if (preview) return "Your card";
    if (status === "connected") return "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Premier";
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
      className={`flex h-full min-h-[320px] flex-col overflow-hidden rounded-[18px] border border-accent/20 bg-[#12110f] ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      }`}
    >
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border border-accent/20 bg-black sm:h-[72px] sm:w-[72px]">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="grid h-full place-items-center bg-panel-2 text-lg font-semibold text-ivory/40">
              {person.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[1.05rem] font-semibold leading-tight tracking-tight text-ivory sm:text-[1.15rem]">
              {person.name}
            </h3>
            {isNew ? (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                New
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] font-medium text-accent">{person.jobTitle}</p>
          <p className="mt-0.5 truncate text-[12px] text-ivory/55">
            {person.city.name}, {person.city.country}
            {distance > 0 ? ` · ${formatDistance(distance)}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <TierBadge tier={tier} size="sm" />
            {blackConnections > 0 ? (
              <BlackConnectionBadge count={blackConnections} variant="compact" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 border-t border-white/[0.07] px-4 py-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-ivory/75">
          {person.bio || "—"}
        </p>

        {ideas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ideas.map((tag) => {
              const shared = sharedIdeas.includes(tag);
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

        {looking.length > 0 ? (
          <p className="line-clamp-1 text-[12px] text-ivory/65">
            <span className="text-muted">Wants </span>
            {looking.map((item, i) => (
              <span key={item}>
                <span className={sharedLookingFor.includes(item) ? "text-accent" : undefined}>
                  {item}
                </span>
                {i < looking.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        ) : (
          <p className="min-h-[1.1rem] text-[12px] text-transparent">.</p>
        )}

        <p className="mt-auto line-clamp-1 text-[12px] text-ivory/55">
          {!preview && reasons.length > 0 ? reasons.slice(0, 2).join(" · ") : "\u00a0"}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-white/[0.07] px-4 py-3">
        {onSkip && !preview ? (
          <button
            type="button"
            aria-label="Pass"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(person.id);
            }}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/18 text-ivory/80 transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}

        <button
          type="button"
          aria-label={connectAria()}
          disabled={connectLocked && status !== "connected"}
          onClick={handleConnect}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-95 ${
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
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4.5l2.5 1.5" strokeLinecap="round" />
            </svg>
          ) : !canConnect && !preview && !status ? (
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="6" y="11" width="12" height="8" rx="1.5" />
              <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12.5l4.2 4.2L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <p
          className={`text-[12px] font-medium ${
            status === "requested" || (!canConnect && !preview) ? "text-accent" : "text-ivory/70"
          }`}
        >
          {actionLabel()}
        </p>

        {onOpenProfile && !preview ? (
          <span className="ml-auto text-[11.5px] text-muted">Full profile →</span>
        ) : null}
      </div>
    </article>
  );
}
