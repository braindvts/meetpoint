"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MatchCard from "@/components/MatchCard";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import { filterByPreference, rankMatches } from "@/lib/match";
import { canIntroduceToTier } from "@/lib/plans";
import { preferConnection } from "@/lib/connectionSync";
import {
  acceptConnection,
  applyServerConnections,
  ensureSampleInboundRequest,
  getMeetingsAttended,
  getPeerReputation,
  isDemoProfile,
  loadBlockedIds,
  loadConnections,
  loadProfile,
  loadRatings,
  openOrCreateDirectChat,
  requestConnection,
  saveProfile,
} from "@/lib/store";
import { findPerson, refreshDirectory, loadDirectory } from "@/lib/directory";
import { fetchServerConnections, syncProfileToServer } from "@/lib/apiClient";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import { gateRedirect, resolveSessionGate } from "@/lib/hydrateSession";
import { TIER_DEFINITIONS, tierForPerson, tierForProfile, type MemberTier } from "@/lib/tiers";
import type { Connection, LookingFor, MyProfile, Person } from "@/lib/types";
import { LOOKING_FOR_OPTIONS } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import NotifyPrompt from "@/components/NotifyPrompt";
import SkeletonCard from "@/components/SkeletonCard";
import TierBadge from "@/components/TierBadge";
import { syncBlackFromServer } from "@/lib/blackStore";
import { track } from "@/lib/analytics";

type Filter = "open" | "local";

const STANDING_OPTIONS: MemberTier[] = [1, 2, 3];

export default function DiscoverPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [connections, setConnections] = useState<Connection[]>(() => readClientConnections());
  const [people, setPeople] = useState<Person[]>(() => loadDirectory());
  const [blocked, setBlocked] = useState<string[]>(() => loadBlockedIds());
  const [filter, setFilter] = useState<Filter>("open");
  const [rankFilter, setRankFilter] = useState<MemberTier[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [exiting, setExiting] = useState<string | null>(null);
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [directoryReady, setDirectoryReady] = useState(() => loadDirectory().length > 0);
  const [gateReady, setGateReady] = useState(() => !!readClientProfile());

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const gate = await resolveSessionGate();
      if (cancelled) return;
      const dest = gateRedirect(gate, "/discover");
      if (dest) {
        router.replace(dest);
        return;
      }
      const p = gate.status === "member" ? gate.profile : null;
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      setGateReady(true);
      setFilter("open");
      refreshConnections();
      ensureSampleInboundRequest();
      if (!isDemoProfile(p)) void syncProfileToServer(p);
      track("discover_open");
      const [list, remoteConnections] = await Promise.all([
        refreshDirectory(),
        fetchServerConnections(),
      ]);
      if (cancelled) return;
      setPeople(list);
      setDirectoryReady(true);
      if (remoteConnections) {
        setConnections(applyServerConnections(remoteConnections));
      }
    })();

    const onProfile = () => setProfile(loadProfile());
    const onDir = () => setPeople(loadDirectory());
    const onBlocks = () => setBlocked(loadBlockedIds());
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    window.addEventListener("meetpoint:profile-changed", onProfile);
    window.addEventListener("meetpoint:directory-changed", onDir);
    void syncBlackFromServer();
    window.addEventListener("meetpoint:blocks-changed", onBlocks);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:connections-changed", refreshConnections);
      window.removeEventListener("meetpoint:profile-changed", onProfile);
      window.removeEventListener("meetpoint:directory-changed", onDir);
      window.removeEventListener("meetpoint:blocks-changed", onBlocks);
    };
  }, [router, refreshConnections]);

  const visiblePeople = useMemo(
    () => people.filter((person) => !blocked.includes(person.id)),
    [people, blocked]
  );

  const matches = useMemo(
    () => (profile ? rankMatches(profile, visiblePeople, loadRatings()) : []),
    [profile, visiblePeople]
  );

  const forYou = useMemo(() => filterByPreference(matches, "open"), [matches]);
  const nearby = useMemo(() => filterByPreference(matches, "local"), [matches]);
  const pool = filter === "open" ? forYou : nearby;

  const byRank = useMemo(
    () =>
      rankFilter.length === 0
        ? pool
        : pool.filter((m) => m.tier != null && rankFilter.includes(m.tier)),
    [pool, rankFilter]
  );

  const filtered = useMemo(
    () => byRank.filter((m) => !skipped.includes(m.person.id)),
    [byRank, skipped]
  );

  const remainingForYou = forYou
    .filter((m) => rankFilter.length === 0 || (m.tier != null && rankFilter.includes(m.tier)))
    .filter((m) => !skipped.includes(m.person.id)).length;
  const remainingNearby = nearby
    .filter((m) => rankFilter.length === 0 || (m.tier != null && rankFilter.includes(m.tier)))
    .filter((m) => !skipped.includes(m.person.id)).length;

  function toggleRank(tier: MemberTier) {
    setRankFilter((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  const myTier = useMemo(() => {
    if (!profile) return null;
    return tierForProfile(profile, getMeetingsAttended(profile));
  }, [profile]);

  function connectionFor(peerId: string) {
    return preferConnection(connections.filter((row) => row.peerId === peerId));
  }

  function connect(peerId: string) {
    const existing = connectionFor(peerId);
    if (existing?.status === "requested" && existing.direction === "in") {
      setConnections(acceptConnection(peerId));
      return;
    }
    setConnections(requestConnection(peerId));
  }

  function startChat(peerId: string) {
    const person = people.find((p) => p.id === peerId) || findPerson(peerId);
    const chat = openOrCreateDirectChat(peerId, person?.name || "Chat");
    router.push(`/chats?c=${encodeURIComponent(chat.id)}`);
  }

  function needVerified() {
    router.push("/profile?verify=1#edit-details");
  }

  function skip(id: string) {
    if (exiting) return;
    setExiting(id);
    window.setTimeout(() => {
      setSkipped((s) => (s.includes(id) ? s : [...s, id]));
      setExiting(null);
    }, 520);
  }

  if (!profile) {
    return (
      <>
        <Nav />
        <main className="mp-app px-5 pb-10 pt-6 md:px-6">
          <h1 className="text-[1.85rem] font-semibold tracking-tight text-ivory">Discover</h1>
          <p className="mt-3 text-sm text-muted">
            {gateReady ? "Opening the room…" : "Loading people…"}
          </p>
        </main>
      </>
    );
  }

  const showSkeletons = !directoryReady && visiblePeople.length === 0;

  return (
    <>
      <Nav />
      <main className="mp-app px-0 pb-10 md:px-6">
        <header className="sticky top-0 z-40 bg-ink/95 px-5 pb-3 pt-4 backdrop-blur-xl md:px-0 md:pt-6">
          <div className="relative flex h-7 items-center justify-center md:justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent md:hidden">
              Interlink
            </p>
            <h1 className="hidden text-[1.85rem] font-semibold tracking-tight text-ivory md:block">
              Discover
              <span className="mp-draw-rule" aria-hidden />
            </h1>
            <button
              type="button"
              aria-label="Filter"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className="absolute right-0 text-accent md:static"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <h1 className="mt-2 text-[1.85rem] font-semibold tracking-tight text-ivory md:hidden">
            Discover
            <span className="mp-draw-rule" aria-hidden />
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-ivory/60 md:mt-2">
            Curated professionals. Meaningful connections.{" "}
            <Link href="/events" className="text-accent underline-offset-4 hover:underline">
              See upcoming events nearby & worldwide
            </Link>
            .
          </p>
          {myTier === 1 && (
            <button
              type="button"
              onClick={() => needVerified()}
              className="mp-press mt-2 text-[12px] font-medium text-accent"
            >
              Get Verified to meet anyone
            </button>
          )}
        </header>

        <div className="px-4 pt-3 md:px-0 md:pt-4">
          <div className="flex max-w-md border border-white/10 bg-[#0a0a0a] p-0.5 md:max-w-lg">
            {(["open", "local"] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`mp-press flex-1 py-2 text-[12px] font-medium ${
                  filter === key
                    ? "bg-ivory text-ink"
                    : "text-ivory/65 hover:text-ivory"
                }`}
              >
                {key === "open"
                  ? `For you · ${remainingForYou}`
                  : `Nearby · ${remainingNearby}`}
              </button>
            ))}
          </div>
        </div>

        {filterOpen && profile ? (
          <div className="mx-4 mt-3 space-y-4 border border-accent/25 bg-panel/50 px-3 py-3 md:mx-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                What you’re looking for
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Change this anytime — Discover updates to match.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {LOOKING_FOR_OPTIONS.map((item) => {
                  const on = profile.lookingFor?.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const next: LookingFor[] = on
                          ? (profile.lookingFor || []).filter((x) => x !== item)
                          : [...(profile.lookingFor || []), item];
                        const updated = { ...profile, lookingFor: next };
                        saveProfile(updated);
                        setProfile(updated);
                      }}
                      className={`mp-press border px-2.5 py-1 text-[12px] ${
                        on
                          ? "border-accent/50 bg-accent/15 text-accent-2"
                          : "border-line/80 text-muted hover:border-accent/35 hover:text-ivory"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Standing
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Show only selected standing. Leave empty to see everyone.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {STANDING_OPTIONS.map((tier) => {
                  const on = rankFilter.includes(tier);
                  const def = TIER_DEFINITIONS.find((t) => t.tier === tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleRank(tier)}
                      className={`mp-press inline-flex items-center gap-1.5 border px-2.5 py-1 text-[12px] ${
                        on
                          ? "border-accent/50 bg-accent/15 text-accent-2"
                          : "border-line/80 text-muted hover:border-accent/35 hover:text-ivory"
                      }`}
                    >
                      <TierBadge tier={tier} size="sm" />
                      <span className="sr-only">{def?.name}</span>
                    </button>
                  );
                })}
              </div>
              {rankFilter.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setRankFilter([])}
                  className="mp-press mt-2 text-[11px] font-medium text-accent"
                >
                  Clear standing
                </button>
              ) : null}
            </div>

            <p className="text-[11px] text-muted">
              For you ranks by overlap. Nearby is people close to your city.
            </p>
          </div>
        ) : null}

        <div className="px-4 pb-6 pt-4 md:px-0">
          {showSkeletons ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : pool.length === 0 ? (
            <EmptyState
              title={visiblePeople.length === 0 ? "The room is quiet" : "No matches for this filter"}
              body={
                visiblePeople.length === 0 ? (
                  <>
                    No other members yet. Share Interlink — profiles appear here when they join this
                    same app.
                  </>
                ) : profile.lookingFor?.length === 0 ? (
                  <>
                    Choose what you&apos;re looking for in{" "}
                    <Link href="/profile" className="text-accent underline underline-offset-2">
                      Profile
                    </Link>{" "}
                    so introductions stay intentional.
                  </>
                ) : filter === "local" ? (
                  !profile.city?.name ? (
                    <>
                      Set your city in{" "}
                      <Link href="/profile" className="text-accent underline underline-offset-2">
                        Profile
                      </Link>{" "}
                      so Nearby can find people close to you.
                    </>
                  ) : (
                    <>No relevant people nearby yet. Try For you, or refine your ideas in Profile.</>
                  )
                ) : (
                  <>Add more business ideas in Profile so we can find stronger fits.</>
                )
              }
              actionHref="/profile"
              actionLabel="Open profile"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                rankFilter.length > 0 && byRank.length === 0
                  ? "No one at this standing"
                  : "You've seen everyone"
              }
              body={
                rankFilter.length > 0 && byRank.length === 0
                  ? "Clear the standing filter or pick a different standing to see more people."
                  : "Skip is just for this session. Restore the list and keep going, or come back later."
              }
              actionLabel={
                rankFilter.length > 0 && byRank.length === 0 ? "Clear standing" : "Restore list"
              }
              onAction={() => {
                if (rankFilter.length > 0 && byRank.length === 0) setRankFilter([]);
                else setSkipped([]);
              }}
            />
          ) : (
            <div key={filter} className="mp-scroll-stagger grid gap-3 md:grid-cols-2 md:gap-4">
              {filtered.map((m) => {
                const allowed = canIntroduceToTier(myTier, m.tier);
                const leaving = exiting === m.person.id;
                const conn = connectionFor(m.person.id);
                return (
                  <div
                    key={m.person.id}
                    className={leaving ? "relative z-[2]" : undefined}
                  >
                    <MatchCard
                      match={m}
                      status={conn?.status}
                      direction={conn?.direction}
                      canConnect={allowed}
                      leaving={leaving}
                      onConnect={connect}
                      onChat={startChat}
                      onSkip={skip}
                      onNeedVerified={needVerified}
                      onOpenProfile={(id) => {
                        const p = people.find((x) => x.id === id) || null;
                        setProfilePerson(p);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PersonProfileSheet
        open={!!profilePerson}
        person={profilePerson}
        onClose={() => setProfilePerson(null)}
        status={profilePerson ? connectionFor(profilePerson.id)?.status : undefined}
        direction={profilePerson ? connectionFor(profilePerson.id)?.direction : undefined}
        canConnect={
          profilePerson
            ? canIntroduceToTier(
                myTier,
                tierForPerson(profilePerson, getPeerReputation(profilePerson.id))
              )
            : true
        }
        onConnect={connect}
        onChat={startChat}
        onNeedVerified={needVerified}
      />

      <NotifyPrompt />
    </>
  );
}
