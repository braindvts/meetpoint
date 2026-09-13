"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import EventCard from "@/components/EventCard";
import MatchCard from "@/components/MatchCard";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import PremierPlanSheet from "@/components/PremierPlanSheet";
import { fetchRankedEvents, saveEventInterest, syncProfileToServer } from "@/lib/apiClient";
import { CONCLAVE_TABLES } from "@/lib/events";
import { rankEvents } from "@/lib/eventMatch";
import type { EventInterest, EventInterestStatus } from "@/lib/eventTypes";
import {
  clearEventInterest,
  loadEventInterests,
  mergeEventInterests,
  setEventInterest,
} from "@/lib/eventStore";
import { filterByPreference, rankMatches } from "@/lib/match";
import { canIntroduceToTier, hasActivePremier } from "@/lib/plans";
import {
  activatePremierPlan,
  ensureSampleInboundRequest,
  getMeetingsAttended,
  getPeerReputation,
  isDemoProfile,
  loadBlockedIds,
  loadConnections,
  loadProfile,
  loadRatings,
  requestConnection,
  saveProfile,
} from "@/lib/store";
import { refreshDirectory, loadDirectory } from "@/lib/directory";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import { tierForPerson, tierForProfile } from "@/lib/tiers";
import type { Connection, LookingFor, MyProfile, Person } from "@/lib/types";
import { LOOKING_FOR_OPTIONS } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import NotifyPrompt from "@/components/NotifyPrompt";
import SkeletonCard from "@/components/SkeletonCard";
import { myBlackConnectionCount, syncBlackFromServer } from "@/lib/blackStore";
import { track } from "@/lib/analytics";

type Filter = "open" | "local" | "tables";

export default function DiscoverPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [connections, setConnections] = useState<Connection[]>(() => readClientConnections());
  const [people, setPeople] = useState<Person[]>(() => loadDirectory());
  const [blocked, setBlocked] = useState<string[]>(() => loadBlockedIds());
  const [filter, setFilter] = useState<Filter>("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const [premierOpen, setPremierOpen] = useState(false);
  const [premierPeerName, setPremierPeerName] = useState<string | undefined>();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [exiting, setExiting] = useState<string | null>(null);
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [directoryReady, setDirectoryReady] = useState(() => loadDirectory().length > 0);
  const [blackConnections, setBlackConnections] = useState(0);
  const [eventInterests, setEventInterests] = useState<EventInterest[]>(() =>
    loadEventInterests()
  );

  const refreshConnections = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setFilter("open");
    refreshConnections();
    ensureSampleInboundRequest();
    if (!isDemoProfile(p)) void syncProfileToServer(p);
    track("discover_open");
    void refreshDirectory().then((list) => {
      setPeople(list);
      setDirectoryReady(true);
    });
    void fetchRankedEvents().then((data) => {
      if (data?.interests) setEventInterests(mergeEventInterests(data.interests));
    });

    const onProfile = () => setProfile(loadProfile());
    const onDir = () => setPeople(loadDirectory());
    const onBlocks = () => setBlocked(loadBlockedIds());
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    window.addEventListener("meetpoint:profile-changed", onProfile);
    window.addEventListener("meetpoint:directory-changed", onDir);
    const onBlack = () => setBlackConnections(myBlackConnectionCount());
    onBlack();
    void syncBlackFromServer().then(onBlack);
    window.addEventListener("meetpoint:black-changed", onBlack);
    window.addEventListener("meetpoint:blocks-changed", onBlocks);
    const onEvents = () => setEventInterests(loadEventInterests());
    window.addEventListener("meetpoint:events-changed", onEvents);
    return () => {
      window.removeEventListener("meetpoint:connections-changed", refreshConnections);
      window.removeEventListener("meetpoint:profile-changed", onProfile);
      window.removeEventListener("meetpoint:directory-changed", onDir);
      window.removeEventListener("meetpoint:black-changed", onBlack);
      window.removeEventListener("meetpoint:blocks-changed", onBlocks);
      window.removeEventListener("meetpoint:events-changed", onEvents);
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
  const filtered = useMemo(
    () => pool.filter((m) => !skipped.includes(m.person.id)),
    [pool, skipped]
  );

  const remainingForYou = forYou.filter((m) => !skipped.includes(m.person.id)).length;
  const remainingNearby = nearby.filter((m) => !skipped.includes(m.person.id)).length;

  const tableMatches = useMemo(
    () => (profile ? rankEvents(profile, CONCLAVE_TABLES, eventInterests) : []),
    [profile, eventInterests]
  );
  const visibleTables = useMemo(
    () => tableMatches.filter((m) => !skipped.includes(m.event.id)),
    [tableMatches, skipped]
  );

  function setTableInterest(eventId: string, status: EventInterestStatus) {
    setEventInterests(setEventInterest(eventId, status));
    if (!isDemoProfile(profile)) void saveEventInterest(eventId, status);
    if (status === "passed") skip(eventId);
  }

  function undoTableInterest(eventId: string) {
    setEventInterests(clearEventInterest(eventId));
    if (!isDemoProfile(profile)) void saveEventInterest(eventId, null);
  }

  const myTier = useMemo(() => {
    if (!profile) return null;
    return tierForProfile(profile, getMeetingsAttended(profile));
  }, [profile]);

  const premier = hasActivePremier(profile);
  const myBlackConnections = blackConnections;

  function connect(peerId: string) {
    setConnections(requestConnection(peerId));
  }

  function needPremier(peerId: string) {
    const person = people.find((p) => p.id === peerId);
    setPremierPeerName(person?.name);
    setPremierOpen(true);
  }

  function subscribe(interval: "month" | "year") {
    const next = activatePremierPlan(interval);
    if (next) setProfile(next);
    setPremierOpen(false);
  }

  function skip(id: string) {
    if (exiting) return;
    setExiting(id);
    window.setTimeout(() => {
      setSkipped((s) => (s.includes(id) ? s : [...s, id]));
      setExiting(null);
    }, 220);
  }

  if (!profile) return null;

  const showSkeletons = !directoryReady && visiblePeople.length === 0;

  return (
    <>
      <Nav />
      <main className="mp-app px-0 pb-10 md:px-6">
        <header className="sticky top-0 z-40 bg-ink/95 px-5 pb-3 pt-4 backdrop-blur-xl md:px-0 md:pt-6">
          <div className="relative flex h-7 items-center justify-center md:justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent md:hidden">
              Conclave
            </p>
            <h1 className="hidden text-[1.85rem] font-semibold tracking-tight text-ivory md:block">
              Discover
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
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-ivory/60 md:mt-2">
            Curated professionals. Meaningful connections.
          </p>
          {myTier === 1 && !premier && (
            <button
              type="button"
              onClick={() => {
                setPremierPeerName(undefined);
                setPremierOpen(true);
              }}
              className="mt-2 text-[12px] font-medium text-accent"
            >
              Unlock Premier
            </button>
          )}
        </header>

        <div className="px-4 pt-3 md:px-0 md:pt-4">
          <div className="flex max-w-xl rounded-full border border-white/12 bg-[#12110f] p-1 md:max-w-2xl">
            {(["open", "local", "tables"] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex-1 rounded-full py-2 text-[12px] font-medium transition ${
                  filter === key ? "bg-accent text-ink" : "text-ivory/70"
                }`}
              >
                {key === "open"
                  ? `For you · ${remainingForYou}`
                  : key === "local"
                    ? `Nearby · ${remainingNearby}`
                    : `Tables · ${visibleTables.length}`}
              </button>
            ))}
          </div>
        </div>

        {filterOpen && profile ? (
          <div className="mx-4 mt-3 border border-accent/25 bg-panel/50 px-3 py-3 md:mx-0">
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
                    className={`border px-2.5 py-1 text-[12px] transition ${
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
            <p className="mt-2.5 text-[11px] text-muted">
              For you ranks people by overlap. Tables ranks hosted dinners against
              your interests, role, and what your description says you want.
            </p>
          </div>
        ) : null}

        <div className="px-4 pb-6 pt-4 md:px-0">
          {filter !== "tables" && tableMatches.length > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("tables")}
              className="mb-4 w-full border border-accent/25 bg-accent/[0.06] px-4 py-3 text-left transition hover:border-accent/40"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Tables for you
              </p>
              <p className="mt-1 text-[13px] text-ivory/80">
                {tableMatches.length} hosted{" "}
                {tableMatches.length === 1 ? "dinner matches" : "dinners match"} what
                you&apos;re into
                {tableMatches[0] ? ` — ${tableMatches[0].event.title}` : ""}.
              </p>
            </button>
          ) : null}

          {showSkeletons && filter !== "tables" ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filter === "tables" && visibleTables.length === 0 ? (
            <EmptyState
              title={tableMatches.length === 0 ? "No tables for this card yet" : "You've seen these tables"}
              body={
                tableMatches.length === 0 ? (
                  <>
                    Add interests, a role, or a line about what you&apos;re looking for in{" "}
                    <Link href="/profile" className="text-accent underline underline-offset-2">
                      Profile
                    </Link>{" "}
                    — we only surface dinners that are a real fit.
                  </>
                ) : (
                  <>Pass is just for this session. Restore the list, or come back when new tables land.</>
                )
              }
              actionHref={tableMatches.length === 0 ? "/profile" : undefined}
              actionLabel={tableMatches.length === 0 ? "Open profile" : "Restore list"}
              onAction={tableMatches.length === 0 ? undefined : () => setSkipped([])}
            />
          ) : filter === "tables" ? (
            <div key="tables" className="mp-stagger grid gap-3 md:grid-cols-2 md:gap-4">
              {visibleTables.map((m) => (
                <EventCard
                  key={m.event.id}
                  match={m}
                  status={eventInterests.find((i) => i.eventId === m.event.id)?.status}
                  onInterest={setTableInterest}
                  onClear={undoTableInterest}
                />
              ))}
            </div>
          ) : pool.length === 0 ? (
            <EmptyState
              title={visiblePeople.length === 0 ? "The room is quiet" : "No matches for this filter"}
              body={
                visiblePeople.length === 0 ? (
                  <>
                    No other members yet. Share Conclave — profiles appear here when they join this
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
                  <>No relevant people nearby yet. Try For you, or refine your ideas in Profile.</>
                ) : (
                  <>Add more business ideas in Profile so we can find stronger fits.</>
                )
              }
              actionHref="/profile"
              actionLabel="Open profile"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="You've seen everyone"
              body="Skip is just for this session. Restore the list and keep going, or come back later."
              actionLabel="Restore list"
              onAction={() => setSkipped([])}
            />
          ) : (
            <div key={filter} className="mp-stagger grid gap-3 md:grid-cols-2 md:gap-4">
              {filtered.map((m) => {
                const allowed = canIntroduceToTier(myTier, m.tier, premier, myBlackConnections);
                const leaving = exiting === m.person.id;
                return (
                  <div
                    key={m.person.id}
                    className={`transition duration-200 ease-out ${
                      leaving ? "-translate-x-8 opacity-0" : "translate-x-0 opacity-100"
                    }`}
                  >
                    <MatchCard
                      match={m}
                      status={connections.find((c) => c.peerId === m.person.id)?.status}
                      canConnect={allowed}
                      onConnect={connect}
                      onSkip={skip}
                      onNeedPremier={needPremier}
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
        status={
          profilePerson
            ? connections.find((c) => c.peerId === profilePerson.id)?.status
            : undefined
        }
        canConnect={
          profilePerson
            ? canIntroduceToTier(
                myTier,
                tierForPerson(profilePerson, getPeerReputation(profilePerson.id)),
                premier,
                myBlackConnections
              )
            : true
        }
        onConnect={connect}
        onNeedPremier={needPremier}
      />

      <PremierPlanSheet
        open={premierOpen}
        peerName={premierPeerName}
        onClose={() => setPremierOpen(false)}
        onSubscribe={subscribe}
      />

      <NotifyPrompt />
    </>
  );
}
