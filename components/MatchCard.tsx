"use client";

import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
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
  preview?: boolean;
}

export default function MatchCard({
  match,
  status,
  canConnect = true,
  onConnect,
  onNeedPremier,
  onOpenProfile,
  preview = false,
}: Props) {
  const {
    person,
    sharedIdeas,
    sameBusiness,
    canHelp,
    sameJob,
    sharedLookingFor,
    tier,
    distance,
    isLocal,
  } = match;

  const elite = tier === 4;
  const reason = sameBusiness
    ? "Same business"
    : canHelp
      ? "Can help"
      : sameJob
        ? "Same profession"
        : sharedIdeas[0] || "Matched";

  return (
    <article
      role={onOpenProfile ? "button" : undefined}
      tabIndex={onOpenProfile ? 0 : undefined}
      onClick={() => onOpenProfile?.(person.id)}
      onKeyDown={(e) => {
        if (!onOpenProfile) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProfile(person.id);
        }
      }}
      className={`mp-card-motion group relative flex flex-col overflow-hidden ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      } ${
        elite
          ? "elite-centurion"
          : "mp-frame border border-line/80 bg-panel/80 hover:border-accent/40"
      }`}
    >
      {elite && <span className="elite-sheen" aria-hidden />}

      {preview && (
        <p
          className={`absolute left-3 top-3 z-10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            elite
              ? "border border-white/25 bg-black/80 text-white"
              : "bg-ink/80 text-accent"
          }`}
        >
          Your card
        </p>
      )}

      <div className="relative overflow-hidden">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-[4/5]">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl}
              alt={person.name}
              className={`mp-card-photo h-full w-full object-cover object-top ${
                elite ? "contrast-[1.05] saturate-[0.92]" : ""
              }`}
              draggable={false}
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Avatar name={person.name} sizeCls="h-20 w-20" />
            </div>
          )}
          <div
            className={`pointer-events-none absolute inset-0 ${
              elite
                ? "bg-gradient-to-t from-black via-black/50 to-black/10"
                : "bg-gradient-to-t from-ink via-ink/40 to-transparent"
            }`}
            aria-hidden
          />
          {elite && (
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.12)_0%,transparent_28%,transparent_60%,rgba(255,255,255,0.05)_100%)]"
              aria-hidden
            />
          )}

          {!elite && (
            <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
              <span className="border border-accent/40 bg-ink/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent backdrop-blur-sm">
                {reason}
              </span>
            </div>
          )}
          <div className={`absolute top-3 z-10 ${elite ? "left-3 sm:left-4" : "right-3 sm:right-4"}`}>
            <TierBadge tier={tier} />
          </div>
          {elite && (
            <p className="absolute right-3 top-3.5 z-10 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 sm:right-4">
              Centurion
            </p>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3
              className={`truncate text-xl font-semibold leading-tight sm:text-2xl ${
                elite ? "text-white" : "text-ivory"
              }`}
            >
              {person.name}
            </h3>
            <p
              className={`mt-1 truncate text-[12px] font-medium ${
                elite ? "text-white/70" : "text-accent-2/90"
              }`}
            >
              {person.jobTitle}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`relative flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4 ${
          elite ? "bg-black" : ""
        }`}
      >
        {elite && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {reason}
          </p>
        )}
        <p
          className={`line-clamp-2 text-[13px] leading-snug sm:text-[14px] sm:leading-relaxed ${
            elite ? "text-white/65" : "text-muted"
          }`}
        >
          {person.bio}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {sharedLookingFor.slice(0, 2).map((t) => (
            <span
              key={`lf-${t}`}
              className={`border px-2 py-0.5 text-[10px] font-medium ${
                elite
                  ? "border-white/20 bg-white/[0.06] text-white/85"
                  : "border-accent/30 bg-accent/[0.06] text-accent-2"
              }`}
            >
              {t}
            </span>
          ))}
          {sharedIdeas.slice(0, 2).map((t) => (
            <span
              key={t}
              className={`border px-2 py-0.5 text-[10px] font-medium ${
                elite ? "border-white/12 text-white/45" : "border-line text-muted"
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className={`mt-auto flex items-center justify-between gap-2 border-t pt-3.5 sm:pt-4 ${
            elite ? "border-white/12" : "border-line/50"
          }`}
        >
          <span
            className={`min-w-0 truncate text-[12px] ${elite ? "text-white/50" : "text-muted"}`}
          >
            {person.city.name}
            <span className={`mx-1.5 ${elite ? "text-white/25" : "text-accent/50"}`}>·</span>
            <span className={isLocal ? (elite ? "text-white/85" : "text-accent-2") : ""}>
              {formatDistance(distance)}
            </span>
          </span>
          {preview ? (
            <span
              className={`shrink-0 border px-3 py-1.5 text-[11px] font-semibold ${
                elite
                  ? "border-white/25 text-white"
                  : "border-accent/35 text-accent-2"
              }`}
            >
              Preview
            </span>
          ) : status === "connected" ? (
            <span
              className={`shrink-0 border px-3 py-1.5 text-[11px] font-semibold ${
                elite
                  ? "border-white/25 bg-white/[0.06] text-white"
                  : "border-accent/35 bg-accent/10 text-accent-2"
              }`}
            >
              Introduced
            </span>
          ) : status === "requested" ? (
            <span
              className={`shrink-0 border px-3 py-1.5 text-[11px] font-semibold ${
                elite ? "border-white/15 text-white/45" : "border-line text-muted"
              }`}
            >
              Waiting
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!canConnect) {
                  onNeedPremier?.(person.id);
                  return;
                }
                onConnect?.(person.id);
              }}
              className={`mp-btn-lux shrink-0 px-4 py-2 text-[11px] font-semibold ${
                elite
                  ? "border border-white/30 bg-[#0a0a0a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : !canConnect
                    ? "border border-accent/40 text-accent-2"
                    : "bg-gradient-to-b from-accent-2 to-accent text-ink"
              }`}
            >
              {canConnect ? "Introduce" : "Premier"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
