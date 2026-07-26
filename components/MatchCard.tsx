"use client";

import type { MatchResult } from "@/lib/match";
import { formatDistance } from "@/lib/match";
import type { ConnectionStatus } from "@/lib/types";

interface Props {
  match: MatchResult;
  status?: ConnectionStatus;
  onConnect: (peerId: string) => void;
}

export default function MatchCard({ match, status, onConnect }: Props) {
  const { person, score, sharedIdeas, sameJob, distance, isLocal } = match;

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-panel p-5 transition hover:border-slate-600">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-panel-2 text-2xl">
            {person.emoji}
          </span>
          <div>
            <h3 className="font-semibold leading-tight">{person.name}</h3>
            <p className="text-sm text-slate-400">{person.jobTitle}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            score >= 70 ? "bg-mint/15 text-mint" : score >= 40 ? "bg-accent/15 text-accent-2" : "bg-panel-2 text-slate-400"
          }`}
        >
          {score}% match
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-400">{person.bio}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {sameJob && (
          <span className="rounded-full bg-sky/15 px-2.5 py-1 text-xs font-medium text-sky">
            Same job as you
          </span>
        )}
        {sharedIdeas.map((t) => (
          <span key={t} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-2">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          📍 {person.city.name}, {person.city.country}
          <span className="mx-1.5 text-slate-700">·</span>
          {isLocal ? <span className="text-mint">{formatDistance(distance)}</span> : formatDistance(distance)}
        </span>
        {status === "connected" ? (
          <span className="rounded-lg bg-mint/15 px-4 py-2 text-sm font-semibold text-mint">Connected ✓</span>
        ) : status === "requested" ? (
          <span className="rounded-lg bg-panel-2 px-4 py-2 text-sm font-semibold text-slate-400">Pending…</span>
        ) : (
          <button
            onClick={() => onConnect(person.id)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-2"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
