"use client";

import Avatar from "@/components/Avatar";
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
  const { person, sharedIdeas, sameBusiness, canHelp, sameJob, tier } = match;

  const industry = person.ideaTags[0] || sharedIdeas[0] || (sameBusiness ? "Same field" : "Member");
  const meta = `${industry} · ${person.city.name}`;
  const role =
    person.jobTitle ||
    (canHelp ? "Can help" : sameJob ? "Same profession" : "Member");
  const owns = ownerHeadline(person);

  function connectLabel() {
    if (preview) return "Preview";
    if (status === "connected") return "Connected";
    if (status === "requested") return "Waiting";
    if (!canConnect) return "Premier";
    return "Connect";
  }

  const connectLocked = preview || status === "connected" || status === "requested";

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
      className={`mp-person-card relative flex gap-3 p-3 ${
        onOpenProfile || preview ? "cursor-pointer [-webkit-tap-highlight-color:transparent]" : ""
      }`}
    >
      <Avatar
        src={person.photoUrl}
        name={person.name}
        sizeCls="h-[4.5rem] w-[4.5rem]"
        rounded="rounded-[12px]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[1.05rem] font-medium leading-tight text-ivory">
              {person.name}
            </h3>
            <p className="mt-0.5 truncate text-[12px] font-medium text-accent">{role}</p>
          </div>
          <button
            type="button"
            aria-label="Open profile"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.(person.id);
            }}
            className="shrink-0 px-1 py-0.5 text-muted"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <circle cx="6" cy="12" r="1.4" />
              <circle cx="12" cy="12" r="1.4" />
              <circle cx="18" cy="12" r="1.4" />
            </svg>
          </button>
        </div>
        <div className="mt-1">
          <TierBadge tier={tier} size="sm" />
        </div>
        <p className="mt-1 truncate text-[11px] text-ivory/55">{meta}</p>
        {owns && <p className="mt-0.5 truncate text-[11px] font-medium text-accent-2">{owns}</p>}
        <p className="mt-1 line-clamp-1 text-[12px] leading-snug text-muted">{person.bio}</p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={connectLocked && status !== "connected"}
            onClick={(e) => {
              e.stopPropagation();
              if (preview) return;
              if (!canConnect) {
                onNeedPremier?.(person.id);
                return;
              }
              if (!connectLocked) onConnect?.(person.id);
            }}
            className={`rounded-md border px-3 py-1 text-[11px] font-medium ${
              status === "connected"
                ? "border-accent/25 text-muted"
                : "border-accent/55 text-accent"
            }`}
          >
            {connectLabel()}
          </button>
        </div>
      </div>
    </article>
  );
}
