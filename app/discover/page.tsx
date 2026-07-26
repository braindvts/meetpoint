"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MatchCard from "@/components/MatchCard";
import { PEOPLE } from "@/lib/data";
import { rankMatches } from "@/lib/match";
import { loadConnections, loadProfile, requestConnection } from "@/lib/store";
import type { Connection, MyProfile } from "@/lib/types";

type Filter = "all" | "local" | "same-job" | "same-idea";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All matches" },
  { value: "local", label: "Near me" },
  { value: "same-job", label: "Same job" },
  { value: "same-idea", label: "Same idea" },
];

export default function DiscoverPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    refreshConnections();
    setReady(true);
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    return () => window.removeEventListener("meetpoint:connections-changed", refreshConnections);
  }, [router, refreshConnections]);

  const matches = useMemo(() => (profile ? rankMatches(profile, PEOPLE) : []), [profile]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "local":
        return matches.filter((m) => m.isLocal);
      case "same-job":
        return matches.filter((m) => m.sameJob);
      case "same-idea":
        return matches.filter((m) => m.sharedIdeas.length > 0);
      default:
        return matches;
    }
  }, [matches, filter]);

  function connect(peerId: string) {
    setConnections(requestConnection(peerId));
  }

  if (!ready || !profile) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Hey {profile.name.split(" ")[0]} {profile.emoji}
          </h1>
          <p className="mt-1 text-slate-400">
            People who share your ideas or your line of work — from {profile.city.name} to the rest of the world.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "border-accent bg-accent/15 text-accent-2"
                  : "border-line bg-panel text-slate-300 hover:bg-panel-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-panel p-10 text-center">
            <p className="text-lg font-semibold">No matches for this filter yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Try &ldquo;All matches&rdquo;, or add more ideas to{" "}
              <Link href="/profile" className="text-accent underline">
                your profile
              </Link>{" "}
              to widen the net.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MatchCard
                key={m.person.id}
                match={m}
                status={connections.find((c) => c.peerId === m.person.id)?.status}
                onConnect={connect}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
