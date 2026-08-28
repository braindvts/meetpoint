"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
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
import EditProfilePopup from "@/components/EditProfilePopup";
import EmptyState from "@/components/EmptyState";
import NotifyPrompt from "@/components/NotifyPrompt";
import RoomNote from "@/components/RoomNote";
import { eveningGreeting } from "@/lib/greeting";
import { track } from "@/lib/analytics";

type Filter = "open" | "local";

export default function DiscoverPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [connections, setConnections] = useState<Connection[]>(() => readClientConnections());
  const [people, setPeople] = useState<Person[]>(() => loadDirectory());
  const [blocked, setBlocked] = useState<string[]>(() => loadBlockedIds());
  const [filter, setFilter] = useState<Filter>("open");
  const [greeting] = useState(() => eveningGreeting());
  const [premierOpen, setPremierOpen] = useState(false);
  const [premierPeerName, setPremierPeerName] = useState<string | undefined>();
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [editPopupOpen, setEditPopupOpen] = useState(false);

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
      <main className="mx-auto max-w-5xl px-3 py-4 pb-28 sm:px-6 sm:py-10">
        <section className="mp-reveal mp-room-banner mb-5 p-4 sm:mb-8 sm:p-8">
          <div className="relative z-[1] flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.36em] text-accent sm:tracking-[0.48em]">
                The room · tonight
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold leading-none tracking-tight sm:text-5xl">
                {greeting},{" "}
                <span className="italic text-accent">{profile.name.split(" ")[0]}</span>
              </h1>
              <p className="mt-3 max-w-lg text-[12px] leading-relaxed text-muted sm:text-sm">
                {filter === "open"
                  ? "Matched by business, mutual help, or profession."
                  : "Relevant people near you."}
                {myTier === 1 && !premier && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setPremierPeerName(undefined);
                        setPremierOpen(true);
                      }}
                      className="text-accent underline decoration-accent/40 underline-offset-2"
                    >
                      Unlock Premier
                    </button>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditPopupOpen(true)}
              className="group relative shrink-0 transition duration-300 hover:scale-[1.03] [-webkit-tap-highlight-color:transparent]"
              aria-label="Edit profile"
            >
              <span className="absolute -inset-1 border border-accent/25 transition group-hover:border-accent/50" />
              <Avatar
                src={profile.photo}
                name={profile.name}
                sizeCls="h-14 w-14 sm:h-20 sm:w-20"
                rounded="rounded-none"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border border-accent/40 bg-ink px-2 py-px text-[8px] font-semibold uppercase tracking-[0.16em] text-accent">
                Edit
              </span>
            </button>
          </div>
        </section>

        <RoomNote />

        <div className="mp-reveal mp-reveal-delay-2 mb-5 flex justify-center sm:mb-8 sm:justify-start">
          <div className="mp-seg">
            <button type="button" onClick={() => setFilter("open")} aria-pressed={filter === "open"}>
              For you
              <span className="ml-1.5 opacity-60">{forYou.length}</span>
            </button>
            <button type="button" onClick={() => setFilter("local")} aria-pressed={filter === "local"}>
              Nearby
              <span className="ml-1.5 opacity-60">{nearby.length}</span>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={
              visiblePeople.length === 0
                ? "The room is quiet"
                : "No introductions for this filter"
            }
            body={
              visiblePeople.length === 0 ? (
                <>
                  No other members yet. Share Conclave with people you want at the table — profiles
                  appear here when they join this same app.
                </>
              ) : profile.lookingFor?.length === 0 ? (
                <>
                  Choose what you&apos;re looking for on{" "}
                  <Link
                    href="/profile"
                    className="text-accent-2 underline decoration-accent/40 underline-offset-4"
                  >
                    your membership
                  </Link>{" "}
                  — co-founder, investor, clients, and more — so introductions stay intentional.
                </>
              ) : filter === "local" ? (
                <>
                  No relevant people nearby yet. Try For you for matches farther out, or refine your
                  ideas in membership.
                </>
              ) : (
                <>
                  Add more business ideas or refine what you&apos;re looking for in membership so we
                  can find stronger fits.
                </>
              )
            }
            actionHref="/profile"
            actionLabel="Open membership"
          />
        ) : (
          <div
            key={filter}
            className="mp-stagger grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          >
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

      <EditProfilePopup
        open={editPopupOpen}
        profile={profile}
        onClose={() => setEditPopupOpen(false)}
        editHref="/profile"
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
