"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import MatchCard from "@/components/MatchCard";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import PremierPlanSheet from "@/components/PremierPlanSheet";
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
import { syncProfileToServer } from "@/lib/apiClient";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import { tierForPerson, tierForProfile } from "@/lib/tiers";
import type { Connection, LookingFor, MyProfile, Person } from "@/lib/types";
import { LOOKING_FOR_OPTIONS } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import NotifyPrompt from "@/components/NotifyPrompt";
import SkeletonCard from "@/components/SkeletonCard";
import { myBlackConnectionCount, syncBlackFromServer } from "@/lib/blackStore";
import { track } from "@/lib/analytics";

type Filter = "open" | "local";

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
    return () => {
      window.removeEventListener("meetpoint:connections-changed", refreshConnections);
      window.removeEventListener("meetpoint:profile-changed", onProfile);
      window.removeEventListener("meetpoint:directory-changed", onDir);
      window.removeEventListener("meetpoint:black-changed", onBlack);
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
  const filtered = useMemo(
    () => pool.filter((m) => !skipped.includes(m.person.id)),
    [pool, skipped]
  );

  const remainingForYou = forYou.filter((m) => !skipped.includes(m.person.id)).length;
  const remainingNearby = nearby.filter((m) => !skipped.includes(m.person.id)).length;

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
        <header className="mp-page-head !items-end px-5 md:!px-0">
          <div>
            <p className="mp-kicker">The room</p>
            <h1>Discover</h1>
            <p className="mt-1.5 max-w-md text-[13px] leading-snug text-muted">
              Ranked by ambition, then seated in person.
            </p>
            {myTier === 1 && !premier && (
              <button
                type="button"
                onClick={() => {
                  setPremierPeerName(undefined);
                  setPremierOpen(true);
                }}
                className="mt-2 text-[12px] font-medium text-accent transition hover:text-accent-2"
              >
                Unlock Premier
              </button>
            )}
          </div>
          <button
            type="button"
            aria-label="Filter"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((v) => !v)}
            className="mp-page-head-action text-accent transition duration-300 hover:text-accent-2 active:scale-90"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
              <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        <div className="px-4 pt-4 md:px-0">
          <div className="flex max-w-md gap-6 border-b border-white/10 md:max-w-lg">
            {(["open", "local"] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`relative pb-2.5 text-[13px] font-medium transition-colors duration-300 ${
                  filter === key ? "text-ivory" : "text-muted hover:text-ivory"
                }`}
              >
                {key === "open"
                  ? `For you · ${remainingForYou}`
                  : `Nearby · ${remainingNearby}`}
                {filter === key ? (
                  <span className="mp-tab-active absolute inset-x-0 -bottom-px h-px bg-accent" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {filterOpen && profile ? (
          <div className="mp-modal-in mx-4 mt-3 border border-accent/25 bg-panel/50 px-3 py-3 md:mx-0">
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
                    className={`rounded-[2px] border px-2.5 py-1 text-[12px] transition duration-300 ${
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
