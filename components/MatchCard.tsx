"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import TierBadge from "@/components/TierBadge";
import type { MatchResult } from "@/lib/match";
import { formatDistance } from "@/lib/match";
import { otherWork, ownedCompanies, VERIFY_LABEL } from "@/lib/personFacts";
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

const TRAVEL_LABEL = {
  local: "Meets locally",
  country: "Travels in country",
  worldwide: "Travels worldwide",
} as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-[74px] shrink-0 pt-[3px] text-[9.5px] font-semibold uppercase tracking-[0.14em] text-accent/70">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-ivory/80">{children}</div>
    </div>
  );
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

  const owned = ownedCompanies(person);
  const other = otherWork(person);
  const ideas = person.ideaTags.slice(0, 4);
  const looking = person.lookingFor.slice(0, 4);

  const reasons: string[] = [];
  if (sharedIdeas.length)
    reasons.push(
      `${sharedIdeas.length} shared ${sharedIdeas.length === 1 ? "interest" : "interests"}: ${sharedIdeas.slice(0, 2).join(", ")}`
    );
  if (helpReasons.length) reasons.push(`Can help with ${helpReasons.slice(0, 2).join(", ")}`);
  if (sharedLookingFor.length) reasons.push(`Both want ${sharedLookingFor.slice(0, 2).join(", ")}`);
  if (sameJob) reasons.push("Same profession");
  if (isLocal) reasons.push("In your city");

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
      className={`overflow-hidden rounded-[18px] border border-accent/20 bg-[#12110f] ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      }`}
    >
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[14px] border border-accent/20 bg-black">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="grid h-full place-items-center bg-panel-2 text-xl font-semibold text-ivory/40">
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
            <h3 className="truncate text-[1.15rem] font-semibold leading-tight tracking-tight text-ivory">
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
          <div className="mt-1.5 flex items-center gap-2">
            <TierBadge tier={tier} size="sm" />
            <span className="truncate text-[11px] text-muted">
              {TRAVEL_LABEL[person.travel]}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-white/[0.07] px-4 py-3.5">
        <p className="line-clamp-3 text-[13px] leading-relaxed text-ivory/75">{person.bio}</p>

        {owned.length > 0 ? (
          <Row label="Owns">
            <span className="font-medium text-accent-2">{owned[0].title}</span>
            <span className="text-ivory/55"> — {owned[0].description}</span>
            {owned.length > 1 ? (
              <span className="text-muted"> +{owned.length - 1} more</span>
            ) : null}
          </Row>
        ) : null}

        {other.length > 0 ? (
          <Row label="Built">
            {other.slice(0, 2).map((w) => w.title).join(", ")}
            {other.length > 2 ? <span className="text-muted"> +{other.length - 2}</span> : null}
          </Row>
        ) : null}

        {ideas.length > 0 ? (
          <Row label="Focus">
            <span className="flex flex-wrap gap-1.5">
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
            </span>
          </Row>
        ) : null}

        {looking.length > 0 ? (
          <Row label="Wants">
            {looking.map((item, i) => (
              <span key={item}>
                <span
                  className={
                    sharedLookingFor.includes(item) ? "font-medium text-accent" : undefined
                  }
                >
                  {item}
                </span>
                {i < looking.length - 1 ? <span className="text-ivory/35">, </span> : null}
              </span>
            ))}
          </Row>
        ) : null}

        {!preview && reasons.length > 0 ? (
          <Row label="Match">
            <span className="text-ivory/70">{reasons.slice(0, 2).join(" · ")}</span>
          </Row>
        ) : null}

        {person.verifications.length > 0 ? (
          <Row label="Verified">
            <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ivory/70">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 3.5l6.5 2.4v5.3c0 4-2.7 7.2-6.5 8.8-3.8-1.6-6.5-4.8-6.5-8.8V5.9L12 3.5z" strokeLinejoin="round" />
                <path d="M9 12l2.2 2.2L15.2 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {person.verifications.map((v) => VERIFY_LABEL[v]).join(" · ")}
            </span>
          </Row>
        ) : null}
      </div>

      <div className="flex items-center gap-3 border-t border-white/[0.07] px-4 py-3">
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
