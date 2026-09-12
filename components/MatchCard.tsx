"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import NameMarks from "@/components/NameMarks";
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
  /** When connected — user must press Chat to open a thread. */
  onChat?: (peerId: string) => void;
  onNeedVerified?: () => void;
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
  onChat,
  onNeedVerified,
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
    if (status === "connected") return onChat ? "Chat" : "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Get Verified to connect";
    return "Connect";
  }

  function actionLabel() {
    if (preview) return "Your card";
    if (status === "connected") return onChat ? "Chat" : "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Verified";
    return "Connect";
  }

  function handleConnect(e: MouseEvent) {
    e.stopPropagation();
    if (preview) return;
    if (status === "connected") {
      onChat?.(person.id);
      return;
    }
    if (!canConnect) {
      onNeedVerified?.();
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
      className={`flex h-full min-h-[320px] flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a] ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      }`}
    >
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black sm:h-[72px] sm:w-[72px]">
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
            <h3 className="flex min-w-0 items-center gap-1.5 text-[1.05rem] font-semibold leading-tight tracking-tight text-ivory sm:text-[1.15rem]">
              <span className="truncate">{person.name}</span>
              <NameMarks
                black={tier === 3 || !!person.black}
                trusted={blackConnections > 0}
                trustedCount={blackConnections}
                size="sm"
              />
            </h3>
            {isNew ? (
              <span className="shrink-0 border border-white/15 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                New
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ivory/70">{person.jobTitle}</p>
          <p className="mt-0.5 truncate text-[12px] text-ivory/55">
            {person.city.name}, {person.city.country}
            {distance > 0 ? ` · ${formatDistance(distance)}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {tier !== 3 ? <TierBadge tier={tier} size="sm" /> : null}
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
                  className={`border px-2 py-[3px] text-[11px] ${
                    shared
                      ? "border-white/25 bg-white/[0.06] text-ivory"
                      : "border-white/10 bg-transparent text-ivory/65"
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

      <div className="mt-auto flex items-center gap-2 border-t border-white/[0.07] px-4 py-3">
        {onSkip && !preview ? (
          <button
            type="button"
            aria-label="Pass"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(person.id);
            }}
            className="rounded-md border border-white/15 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted transition hover:border-white/30 hover:text-ivory active:scale-[0.99]"
          >
            Pass
          </button>
        ) : null}

        <button
          type="button"
          aria-label={connectAria()}
          disabled={
            preview ||
            status === "requested" ||
            (status === "connected" && !onChat) ||
            (!status && !canConnect && !onNeedVerified)
          }
          onClick={handleConnect}
          className={`rounded-md px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition active:scale-[0.99] disabled:opacity-45 ${
            status === "connected"
              ? onChat
                ? "bg-ivory text-ink"
                : "border border-white/15 text-muted"
              : status === "requested"
                ? "border border-white/20 text-muted"
                : !canConnect && !preview
                  ? "border border-accent/40 text-accent"
                  : "bg-ivory text-ink"
          }`}
        >
          {actionLabel()}
        </button>

        {onOpenProfile && !preview ? (
          <span className="ml-auto text-[11.5px] text-muted">Profile →</span>
        ) : null}
      </div>
    </article>
  );
}
