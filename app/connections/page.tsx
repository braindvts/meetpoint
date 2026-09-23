"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import BlackBadge from "@/components/BlackBadge";
import BlackConnectionBadge from "@/components/BlackConnectionBadge";
import EmptyState from "@/components/EmptyState";
import PersonProfileSheet from "@/components/PersonProfileSheet";
import RateMeeting from "@/components/RateMeeting";
import StarRating, { cuisineLine } from "@/components/StarRating";
import { blackConnectionWith } from "@/lib/blackStore";
import { preferConnection } from "@/lib/connectionSync";
import { RESTAURANTS } from "@/lib/data";
import { fetchServerConnections } from "@/lib/apiClient";
import { gateRedirect, resolveSessionGate } from "@/lib/hydrateSession";
import {
  acceptConnection,
  applyServerConnections,
  declineConnection,
  loadChats,
  loadConnections,
  openOrCreateDirectChat,
} from "@/lib/store";
import { findPerson, refreshDirectory } from "@/lib/directory";
import { readClientConnections, readClientProfile } from "@/lib/clientProfile";
import type { Connection, GroupChat, Meetup, MyProfile, Person } from "@/lib/types";

type Reservation =
  | {
      kind: "meetup";
      id: string;
      peerId: string;
      meetup: Meetup;
      restaurantName: string;
      cuisine?: string;
      city?: string;
      whenLabel: string;
      sortAt: string;
    }
  | {
      kind: "table";
      id: string;
      chat: GroupChat;
      peerIds: string[];
      restaurantName: string;
      cuisine?: string;
      city?: string;
      whenLabel: string;
      sortAt: string;
      feeLabel?: string;
    };

function formatMeetupDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(() => readClientProfile());
  const [connections, setConnections] = useState<Connection[]>(() =>
    readClientConnections()
  );
  const [profilePerson, setProfilePerson] = useState<Person | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setConnections(loadConnections());
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const gate = await resolveSessionGate();
      if (cancelled) return;
      const dest = gateRedirect(gate, "/circle");
      if (dest) {
        router.replace(dest);
        return;
      }
      if (gate.status === "member") setProfile(gate.profile);
      refresh();
      const [remote, _dir] = await Promise.all([
        fetchServerConnections(),
        refreshDirectory(),
      ]);
      if (cancelled) return;
      if (remote) {
        setConnections(applyServerConnections(remote));
      }
      setTick((n) => n + 1);
    })();
    window.addEventListener("meetpoint:connections-changed", refresh);
    window.addEventListener("meetpoint:chats-changed", refresh);
    window.addEventListener("meetpoint:directory-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:connections-changed", refresh);
      window.removeEventListener("meetpoint:chats-changed", refresh);
      window.removeEventListener("meetpoint:directory-changed", refresh);
    };
  }, [router, refresh]);

  const inbound = useMemo(
    () =>
      connections.filter((c) => c.status === "requested" && c.direction === "in"),
    [connections]
  );

  const reservations = useMemo(() => {
    void tick;
    const items: Reservation[] = [];

    for (const conn of loadConnections()) {
      if (!conn.meetup) continue;
      const restaurant = RESTAURANTS.find((r) => r.id === conn.meetup!.restaurantId);
      items.push({
        kind: "meetup",
        id: `meetup-${conn.peerId}`,
        peerId: conn.peerId,
        meetup: conn.meetup,
        restaurantName: restaurant?.name || "Restaurant",
        cuisine: restaurant ? cuisineLine(restaurant.cuisine) : undefined,
        city: restaurant?.city,
        whenLabel: formatMeetupDate(conn.meetup.date),
        sortAt: `${conn.meetup.date}T12:00:00`,
      });
    }

    for (const chat of loadChats()) {
      const tp = chat.tableProposal;
      if (!tp?.booked) continue;
      const when = tp.meetupAt || tp.bookedAt || chat.updatedAt;
      items.push({
        kind: "table",
        id: `table-${chat.id}`,
        chat,
        peerIds: chat.memberIds,
        restaurantName: tp.restaurantName,
        cuisine: tp.cuisine,
        city: tp.city,
        whenLabel: tp.meetupAt ? formatIso(tp.meetupAt) : "Booked",
        sortAt: when,
        feeLabel:
          tp.totalChargedUsd != null
            ? `$${tp.totalChargedUsd} table fee`
            : undefined,
      });
    }

    return items.sort((a, b) => a.sortAt.localeCompare(b.sortAt));
  }, [tick]);

  function openChat(person: Person) {
    const chat = openOrCreateDirectChat(person.id, person.name);
    router.push(`/chats?c=${encodeURIComponent(chat.id)}`);
  }

  function decline(peerId: string) {
    setConnections(declineConnection(peerId));
  }

  if (!profile) {
    return (
      <>
        <Nav />
        <main className="mp-app px-5 pb-10 pt-6 md:px-6">
          <PageHeader title="Circle" />
          <p className="mt-3 text-sm text-muted">Loading your circle…</p>
        </main>
      </>
    );
  }

  const empty = inbound.length === 0 && reservations.length === 0;

  return (
    <>
      <Nav />
      <main className="mp-app px-0 pb-10 md:px-6">
        <PageHeader title="Circle" />
        <div className="px-4 pt-2">
          <p className="text-[14px] text-ivory/70">
            Incoming connects & booked reservations
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {[
              inbound.length
                ? `${inbound.length} incoming`
                : null,
              reservations.length
                ? `${reservations.length} reservation${reservations.length === 1 ? "" : "s"}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Requests and tables you book land here."}
          </p>
        </div>

        <div className="px-4 pb-6 pt-4">
          {empty ? (
            <EmptyState
              title="Your circle is quiet"
              body="When someone wants to connect, or you book a table, it shows up here."
              actionHref="/discover"
              actionLabel="Discover"
            />
          ) : (
            <div className="space-y-8">
              {inbound.length > 0 && (
                <section>
                  <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                    Incoming connections
                  </h2>
                  <div className="mp-stagger space-y-3">
                    {inbound.map((conn) => {
                      const person = findPerson(conn.peerId);
                      const name = person?.name || "Member";
                      return (
                        <div
                          key={conn.peerId}
                          className="mp-person-card border border-accent/20 bg-accent/[0.06] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => person && setProfilePerson(person)}
                              className="flex min-w-0 items-center gap-3 text-left"
                            >
                              <Avatar
                                src={person?.photoUrl}
                                name={name}
                                sizeCls="h-14 w-14"
                                rounded="rounded-[12px]"
                              />
                              <div className="min-w-0">
                                <h3 className="truncate font-display text-xl font-semibold text-ivory">
                                  {name}
                                </h3>
                                <p className="mt-0.5 truncate text-[11px] text-muted">
                                  {person
                                    ? `${person.jobTitle}${person.city?.name ? ` · ${person.city.name}` : ""}`
                                    : "Loading profile…"}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  {person?.black ? <BlackBadge size="xs" /> : null}
                                  {blackConnectionWith(conn.peerId) ? (
                                    <BlackConnectionBadge count={1} />
                                  ) : null}
                                </div>
                                <p className="mt-1 text-[11px] text-accent">
                                  Wants to connect
                                </p>
                              </div>
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConnections(acceptConnection(conn.peerId))}
                                className="mp-btn-lux rounded-md px-3 py-1.5 text-[11px] font-medium"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => decline(conn.peerId)}
                                className="mp-press border border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                  Reservations
                </h2>
                {reservations.length === 0 ? (
                  <p className="border border-line/40 bg-ink/30 px-4 py-6 text-center text-sm text-muted">
                    No booked tables yet. Propose one in{" "}
                    <Link href="/chats" className="text-accent underline underline-offset-4">
                      Chats
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="mp-stagger space-y-4">
                    {reservations.map((item) => {
                      if (item.kind === "meetup") {
                        const person = findPerson(item.peerId);
                        const restaurant = RESTAURANTS.find(
                          (r) => r.id === item.meetup.restaurantId
                        );
                        return (
                          <article
                            key={item.id}
                            className="mp-person-card border border-accent/20 bg-accent/[0.05] p-4"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                              Planned meetup
                            </p>
                            <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                              {item.restaurantName}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {restaurant && <StarRating restaurant={restaurant} />}
                              {item.cuisine && (
                                <span className="text-[13px] text-ivory/55">{item.cuisine}</span>
                              )}
                              {item.city && (
                                <span className="text-[13px] text-muted">· {item.city}</span>
                              )}
                            </div>
                            <p className="mt-3 text-sm text-ivory">{item.whenLabel}</p>
                            {item.meetup.note && (
                              <p className="mt-1 text-sm text-muted">“{item.meetup.note}”</p>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              {person && (
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={person.photoUrl}
                                    name={person.name}
                                    sizeCls="h-9 w-9"
                                    rounded="rounded-[10px]"
                                  />
                                  <span className="text-sm text-ivory">{person.name}</span>
                                </div>
                              )}
                              <Link
                                href={`/plan/${item.peerId}`}
                                className="mp-press border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-ivory"
                              >
                                Edit
                              </Link>
                              {person && (
                                <RateMeeting peerId={person.id} peerName={person.name} />
                              )}
                            </div>
                          </article>
                        );
                      }

                      const peers = item.peerIds
                        .map((id) => findPerson(id))
                        .filter(Boolean);
                      return (
                        <article
                          key={item.id}
                          className="mp-person-card border border-white/10 bg-[#0a0a0a] p-4"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
                            Booked reservation
                          </p>
                          <h3 className="mt-2 font-display text-2xl font-semibold text-ivory">
                            {item.restaurantName}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ivory/55">
                            {item.cuisine && <span>{item.cuisine}</span>}
                            {item.city && <span>· {item.city}</span>}
                            {item.feeLabel && (
                              <span className="text-muted">· {item.feeLabel}</span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-ivory">{item.whenLabel}</p>
                          {peers.length > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {peers.map((p) =>
                                p ? (
                                  <div key={p.id} className="flex items-center gap-2 pr-2">
                                    <Avatar
                                      src={p.photoUrl}
                                      name={p.name}
                                      sizeCls="h-8 w-8"
                                      rounded="rounded-[10px]"
                                    />
                                    <span className="text-[13px] text-ivory">
                                      {p.name.split(" ")[0]}
                                    </span>
                                  </div>
                                ) : null
                              )}
                            </div>
                          )}
                          <Link
                            href={`/chats?c=${encodeURIComponent(item.chat.id)}`}
                            className="mp-press mt-4 inline-flex border border-accent/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ivory hover:border-accent/60"
                          >
                            Open chat
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
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
            ? preferConnection(connections.filter((c) => c.peerId === profilePerson.id))?.status
            : undefined
        }
        direction={
          profilePerson
            ? preferConnection(connections.filter((c) => c.peerId === profilePerson.id))
                ?.direction
            : undefined
        }
        onChat={(peerId) => {
          const person = findPerson(peerId);
          if (!person) return;
          setProfilePerson(null);
          openChat(person);
        }}
      />
    </>
  );
}
