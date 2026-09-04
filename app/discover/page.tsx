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
} from "@/lib/store";
import { refreshDirectory, loadDirectory } from "@/lib/directory";
import { syncProfileToServer } from "@/lib/apiClient";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import { tierForPerson, tierForProfile } from "@/lib/tiers";
import type { Connection, MyProfile, Person } from "@/lib/types";
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
    if (!p.verifications?.length) {
      router.replace("/profile?verify=1");
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
      <main className="mp-app pb-24">
        <header className="sticky top-0 z-40 bg-ink/95 px-5 pb-3 pt-4 backdrop-blur-xl">
          <div className="relative flex h-7 items-center justify-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
              Conclave
            </p>
            <button
              type="button"
              aria-label="Filter"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className="absolute right-0 text-accent"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <h1 className="mt-2 text-[1.85rem] font-semibold tracking-tight text-ivory">Discover</h1>
          <p className="mt-1 text-[13px] leading-snug text-ivory/60">
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

        <div className="px-4 pt-3">
          <div className="flex rounded-full border border-white/12 bg-[#12110f] p-1">
            {(["open", "local"] as Filter[]).map((key) => (
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
                  : `Nearby · ${remainingNearby}`}
              </button>
            ))}
          </div>
        </div>

        {filterOpen && (
          <p className="px-5 pt-3 text-[12px] leading-relaxed text-muted">
            For you ranks by ambition and overlap. Nearby is people within reach of your city.
          </p>
        )}

        <div className="px-4 pb-6 pt-4">
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
            <div key={filter} className="mp-stagger space-y-3">
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
