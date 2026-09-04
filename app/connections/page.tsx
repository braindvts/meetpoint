"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import { blackConnectionWith } from "@/lib/blackStore";
import EmptyState from "@/components/EmptyState";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import RateMeeting from "@/components/RateMeeting";
import StarRating, { cuisineLine } from "@/components/StarRating";
import { RESTAURANTS } from "@/lib/data";
import {
  acceptConnection,
  createChat,
  declineConnection,
  loadChats,
  loadConnections,
  loadProfile,
  removeConnection,
} from "@/lib/store";
import { findPerson, refreshDirectory } from "@/lib/directory";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import type { Connection, MyProfile, Person } from "@/lib/types";

export default function ConnectionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [connections, setConnections] = useState<Connection[]>(() => readClientConnections());
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [, setDirectoryTick] = useState(0);

  const refresh = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    refresh();
    void refreshDirectory().then(() => setDirectoryTick((n) => n + 1));
    const onDir = () => setDirectoryTick((n) => n + 1);
    window.addEventListener("meetpoint:connections-changed", refresh);
    window.addEventListener("meetpoint:directory-changed", onDir);
    return () => {
      window.removeEventListener("meetpoint:connections-changed", refresh);
      window.removeEventListener("meetpoint:directory-changed", onDir);
    };
  }, [router, refresh]);

  function drop(peerId: string) {
    setConnections(removeConnection(peerId));
  }

  function accept(peerId: string) {
    setConnections(acceptConnection(peerId));
  }

  function decline(peerId: string) {
    setConnections(declineConnection(peerId));
  }

  function messagePeer(peerId: string, peerName: string) {
    const existing = loadChats().find(
      (c) => c.memberIds.length === 1 && c.memberIds[0] === peerId
    );
    if (existing) {
      router.push(`/chats/${existing.id}`);
      return;
    }
    const chat = createChat(peerName.split(" ")[0], [peerId]);
    router.push(`/chats/${chat.id}`);
  }

  if (!profile) return null;

  const connected = connections.filter((c) => c.status === "connected");
  const inbound = connections.filter(
    (c) => c.status === "requested" && c.direction === "in"
  );
  const outbound = connections.filter(
    (c) => c.status === "requested" && c.direction !== "in"
  );
  const ordered = [...inbound, ...outbound, ...connected];

  return (
    <>
      <Nav />
      <main className="mp-app pb-24">
        <PageHeader title="Circle" />
        <div className="px-4 pt-2">
          <p className="text-[14px] text-ivory/70">Your introductions</p>
          <p className="mt-1 text-[12px] text-muted">
            {connections.length > 0
              ? `${connected.length} connected${
                  inbound.length ? ` · ${inbound.length} to review` : ""
                }${outbound.length ? ` · ${outbound.length} waiting` : ""}`
              : "Introductions you accept live here."}
          </p>
        </div>

        <div className="px-4 pb-6 pt-4">
        {connections.length === 0 ? (
          <EmptyState
            title="Your circle awaits"
            body="Step into the room and connect with someone who shares your ambition."
            actionHref="/discover"
            actionLabel="Discover"
          />
        ) : (
          <div className="mp-stagger space-y-3">
            {inbound.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                Requests for you
              </p>
            )}
            {ordered.map((conn) => {
              const person = findPerson(conn.peerId);
              if (!person) return null;
              const restaurant = conn.meetup
                ? RESTAURANTS.find((r) => r.id === conn.meetup!.restaurantId)
                : null;
              const isInbound = conn.direction === "in" && conn.status === "requested";

              return (
                <div
                  key={conn.peerId}
                  className={`mp-row mp-person-card p-3 ${
                    isInbound ? "bg-accent/[0.06]" : ""
                  }`}
                >
                  <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setProfilePerson(person)}
                      className="flex min-w-0 items-center gap-3 text-left sm:gap-4"
                    >
                      <Avatar
                        src={person.photoUrl}
                        name={person.name}
                        sizeCls="h-14 w-14 sm:h-16 sm:w-16"
                        rounded="rounded-[12px]"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-semibold text-ivory sm:text-2xl">
                          {person.name}
                        </h3>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {person.jobTitle} · {person.city.name}
                        </p>
                        {(person.black || blackConnectionWith(person.id)) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {person.black && <BlackBadge size="xs" />}
                            {blackConnectionWith(person.id) && (
                              <BlackConnectionBadge count={1} variant="compact" />
                            )}
                          </div>
                        )}
                        <p className="mt-1 text-[11px] text-accent">
                          {isInbound ? "Wants an introduction" : "View profile"}
                        </p>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {isInbound ? (
                        <>
                          <button
                            type="button"
                            onClick={() => accept(person.id)}
                            className="rounded-md bg-gradient-to-b from-accent-2 to-accent px-3 py-1.5 text-[11px] font-medium text-ink"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => decline(person.id)}
                            className="border border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                          >
                            Decline
                          </button>
                        </>
                      ) : conn.status === "requested" ? (
                        <span className="border border-line bg-panel-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Awaiting them
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => messagePeer(person.id, person.name)}
                            className="border border-accent/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory transition hover:border-accent/60"
                          >
                            Message
                          </button>
                          <Link
                            href={`/plan/${person.id}`}
                            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              conn.meetup
                                ? "border border-line text-ivory hover:border-accent/40"
                                : "mp-btn-lux bg-gradient-to-b from-accent-2 to-accent text-ink"
                            }`}
                          >
                            {conn.meetup ? "Edit meetup" : "Plan meetup"}
                          </Link>
                        </>
                      )}
                      {!isInbound && (
                        <button
                          type="button"
                          onClick={() => drop(conn.peerId)}
                          title="Remove"
                          className="border border-line px-3 py-2 text-sm text-muted transition hover:text-ivory"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {conn.meetup && restaurant && (
                    <div className="relative mt-4 border border-accent/25 bg-accent/[0.06] p-4 text-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                        The table is set
                      </p>
                      <p className="mt-2 text-lg text-ivory">{restaurant.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StarRating restaurant={restaurant} />
                        <span className="text-[13px] text-ivory/55">
                          {cuisineLine(restaurant.cuisine)}
                        </span>
                      </div>
                      <p className="mt-1 text-muted">
                        {new Date(conn.meetup.date + "T12:00:00").toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                        {conn.meetup.note ? ` · “${conn.meetup.note}”` : ""}
                      </p>
                      {conn.status === "connected" && (
                        <RateMeeting peerId={person.id} peerName={person.name} />
                      )}
                    </div>
                  )}
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
      />
    </>
  );
}
