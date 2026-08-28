"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
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
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);

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
    void syncProfileToServer(p);
    track("discover_open");
    void refreshDirectory().then((list) => setPeople(list));

    const onProfile = () => setProfile(loadProfile());
    const onDir = () => setPeople(loadDirectory());
    const onBlocks = () => setBlocked(loadBlockedIds());
    window.addEventListener("meetpoint:connections-changed", refreshConnections);
    window.addEventListener("meetpoint:profile-changed", onProfile);
    window.addEventListener("meetpoint:directory-changed", onDir);
    window.addEventListener("meetpoint:blocks-changed", onBlocks);
    return () => {
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
  const filtered = filter === "open" ? forYou : nearby;

  const myTier = useMemo(() => {
    if (!profile) return null;
    return tierForProfile(profile, getMeetingsAttended(profile));
  }, [profile]);

  const premier = hasActivePremier(profile);

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

  if (!profile) return null;

  return (
    <>
      <Nav />
      <main className="mp-app pb-24">
        <PageHeader
          title="Discover"
          action={
            <button
              type="button"
              aria-label="Filter"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className="text-accent"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinejoin="round" />
              </svg>
            </button>
          }
        />

        <div className="px-4 pt-2">
          <p className="font-display text-[1.05rem] text-ivory/85">People you might connect with</p>
          {myTier === 1 && !premier && (
            <button
              type="button"
              onClick={() => {
                setPremierPeerName(undefined);
                setPremierOpen(true);
              }}
              className="mt-1 text-[12px] text-accent"
            >
              Unlock Premier
            </button>
          )}
        </div>

        {filterOpen && (
          <div className="mx-4 mt-3 overflow-hidden rounded-xl border border-accent/20 bg-[#12110f]">
            {(["open", "local"] as Filter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key);
                  setFilterOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                  filter === key ? "text-accent" : "text-ivory"
                }`}
              >
                <span>{key === "open" ? "For you" : "Nearby"}</span>
                <span className="text-muted">{key === "open" ? forYou.length : nearby.length}</span>
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pb-6 pt-4">
          {filtered.length === 0 ? (
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
          ) : (
            <div key={filter} className="mp-stagger space-y-3">
              {filtered.map((m) => {
                const allowed = canIntroduceToTier(myTier, m.tier, premier);
                return (
                  <MatchCard
                    key={m.person.id}
                    match={m}
                    status={connections.find((c) => c.peerId === m.person.id)?.status}
                    canConnect={allowed}
                    onConnect={connect}
                    onNeedPremier={needPremier}
                    onOpenProfile={(id) => {
                      const p = people.find((x) => x.id === id) || null;
                      setProfilePerson(p);
                    }}
                  />
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
                premier
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
