"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Avatar from "@/components/Avatar";
import EventCard from "@/components/events/EventCard";
import {
  CATEGORY_LABEL,
  formatEventRange,
  getUpcomingSorted,
  type InterlinkEvent,
} from "@/lib/events";
import {
  displayCounts,
  findEvent,
  getRsvp,
  listPublishedEvents,
  loadRsvps,
  networkAttendingCount,
  setRsvp,
} from "@/lib/eventStore";
import { formatMatchReasons, interestsFromRsvps, scoreEvent } from "@/lib/eventMatch";
import { findPerson } from "@/lib/directory";
import { hydrateLocalProfile } from "@/lib/hydrateSession";
import { loadConnections } from "@/lib/store";
import { showToast } from "@/lib/notify";
import type { MyProfile, Person } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [event, setEvent] = useState<InterlinkEvent | null | undefined>(undefined);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setEvent(findEvent(id) ?? null);
    setConnectedIds(
      loadConnections()
        .filter((c) => c.status === "connected")
        .map((c) => c.peerId)
    );
    setTick((n) => n + 1);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await hydrateLocalProfile();
      if (cancelled) return;
      if (!p) {
        router.replace("/onboarding");
        return;
      }
      setProfile(p);
      refresh();
    })();
    const onEvt = () => refresh();
    window.addEventListener("meetpoint:events", onEvt);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:events", onEvt);
    };
  }, [router, refresh]);

  const related = useMemo(() => {
    if (!event) return [];
    return getUpcomingSorted(listPublishedEvents())
      .filter(
        (e) =>
          e.id !== event.id &&
          (e.industry === event.industry ||
            e.category === event.category ||
            e.city === event.city)
      )
      .slice(0, 3);
  }, [event]);

  const match = useMemo(() => {
    if (!event || !profile) return null;
    const scored = scoreEvent(profile, event, {
      catalog: listPublishedEvents(),
      interests: interestsFromRsvps(loadRsvps()),
    });
    return scored.score > 0 ? scored : null;
  }, [event, profile, tick]);

  const attendees = useMemo(() => {
    if (!event) return [] as Person[];
    return event.attendeeIds
      .map((pid) => findPerson(pid))
      .filter((p): p is Person => !!p);
  }, [event]);

  if (event === undefined || !profile) {
    return (
      <div className="mp-app">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">
          <PageHeader title="Event" />
          <p className="mt-8 text-sm text-muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mp-app">
        <Nav />
        <main className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-4">
          <PageHeader title="Event" />
          <EmptyState
            title="Event not found"
            body="This gathering may have been unpublished or the link is outdated."
            actionHref="/events"
            actionLabel="Back to Events"
          />
        </main>
      </div>
    );
  }

  const counts = displayCounts(event);
  const network = networkAttendingCount(event, connectedIds);
  const myRsvp = getRsvp(event.id);
  const mapsQuery = encodeURIComponent(
    event.address || `${event.venue}, ${event.city}, ${event.country}`
  );

  return (
    <div className="mp-app">
      <Nav />
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-28 pt-2 md:px-6">
        <PageHeader
          title="Event"
          action={
            <Link
              href="/events"
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted hover:text-accent"
            >
              All events
            </Link>
          }
        />

        <div className="overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]">
          <div className="relative aspect-[16/9] sm:aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12110f] via-transparent to-transparent" />
          </div>
          <div className="space-y-5 px-4 py-6 sm:px-7 sm:py-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-accent/30 bg-ink/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                {CATEGORY_LABEL[event.category]}
              </span>
              <span className="rounded-md border border-line px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                {event.industry}
              </span>
              <span className="rounded-md border border-line px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                {event.format === "in-person"
                  ? "In-person"
                  : event.format === "online"
                    ? "Online"
                    : "Hybrid"}
              </span>
              {event.exclusive ? (
                <span className="rounded-md border border-ivory/25 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory/90">
                  Exclusive
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-medium tracking-tight text-ivory sm:text-3xl">
              {event.name}
            </h1>
            {match && match.reasons.length > 0 ? (
              <p className="text-sm text-accent/90">
                {formatMatchReasons(match.reasons)}
              </p>
            ) : null}

            <div className="space-y-1.5 text-sm text-muted">
              <p>{formatEventRange(event.startsAt, event.endsAt)}</p>
              <p>
                {event.venue}
                {event.format !== "online" ? (
                  <>
                    {" "}
                    · {event.city}, {event.country}
                  </>
                ) : (
                  " · Online"
                )}
              </p>
              {event.address ? (
                <p className="text-[13px] text-muted/80">{event.address}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
              <span>{counts.attendees.toLocaleString()} attending</span>
              <span>{counts.interested.toLocaleString()} professionals interested</span>
              {network > 0 ? (
                <span className="text-accent">
                  {network} {network === 1 ? "person" : "people"} in your network attending
                </span>
              ) : (
                <span className="text-accent/80">
                  An opportunity to meet other Interlink professionals
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  if (myRsvp === "going") {
                    setRsvp(event.id, null);
                    showToast("Registration cleared");
                  } else {
                    setRsvp(event.id, "going");
                    showToast("You’re marked as attending");
                  }
                  refresh();
                }}
                className="mp-btn-lux inline-flex flex-1 items-center justify-center rounded-lg bg-ivory px-5 py-3.5 text-[12px] font-semibold text-ink"
              >
                {myRsvp === "going" ? "Attending ✓" : "Attend / Register"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (myRsvp === "interested") {
                    setRsvp(event.id, null);
                    showToast("Removed from saved");
                  } else if (myRsvp === "going") {
                    setRsvp(event.id, "interested");
                    showToast("Moved to interested");
                  } else {
                    setRsvp(event.id, "interested");
                    showToast("Saved as interested");
                  }
                  refresh();
                }}
                className={`inline-flex flex-1 items-center justify-center rounded-xl border px-5 py-3.5 text-[12px] font-medium transition sm:flex-none sm:min-w-[140px] ${
                  myRsvp === "interested" || myRsvp === "going"
                    ? "border-accent/45 bg-accent/10 text-accent"
                    : "border-accent/25 text-ivory hover:border-accent/45"
                }`}
              >
                {myRsvp === "interested" || myRsvp === "going"
                  ? "Saved"
                  : "Interested"}
              </button>
              {event.registrationUrl ? (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-accent/25 px-5 py-3.5 text-[12px] font-medium text-ivory/90 transition hover:border-accent/50 sm:flex-none"
                >
                  External register
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-medium tracking-tight text-ivory">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory/80">
            {event.description}
          </p>
        </section>

        <section className="rounded-md border border-white/10 bg-[#0a0a0a] px-5 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
            Organizer
          </p>
          <p className="mt-2 text-base font-medium text-ivory">{event.organizer}</p>
          {event.organizerTitle ? (
            <p className="mt-0.5 text-sm text-muted">{event.organizerTitle}</p>
          ) : null}
        </section>

        {event.speakers?.length || event.companies?.length ? (
          <section className="space-y-3 rounded-md border border-white/10 bg-[#0a0a0a] px-5 py-5">
            {event.speakers?.length ? (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                  Featured speakers
                </p>
                <p className="mt-2 text-sm text-ivory/85">{event.speakers.join(" · ")}</p>
              </div>
            ) : null}
            {event.companies?.length ? (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                  Companies
                </p>
                <p className="mt-2 text-sm text-ivory/85">{event.companies.join(" · ")}</p>
              </div>
            ) : null}
            {event.expectedAttendance ? (
              <p className="text-sm text-muted">
                Expected attendance · {event.expectedAttendance.toLocaleString()}
              </p>
            ) : null}
          </section>
        ) : null}

        {event.format !== "online" ? (
          <section className="space-y-3">
            <h2 className="text-lg font-medium tracking-tight text-ivory">Location</h2>
            <div className="overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]">
              <div className="flex aspect-[2/1] items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(212,196,168,0.08),transparent_60%)] px-6 text-center">
                <div>
                  <p className="text-base font-medium text-ivory">{event.venue}</p>
                  <p className="mt-1 text-sm text-muted">
                    {event.address || `${event.city}, ${event.country}`}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-[12px] font-medium text-accent hover:text-accent-2"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {attendees.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-medium tracking-tight text-ivory">
                People attending
              </h2>
              <p className="mt-1 text-sm text-muted">
                Members already linked to this room — connect before you arrive.
              </p>
            </div>
            <ul className="space-y-2">
              {attendees.map((p) => {
                const inNetwork = connectedIds.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-accent/10 bg-[#12110f] px-3 py-3"
                  >
                    <Avatar name={p.name} src={p.photoUrl} sizeCls="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ivory">{p.name}</p>
                      <p className="truncate text-[12px] text-muted">
                        {p.jobTitle}
                        {p.city?.name ? ` · ${p.city.name}` : ""}
                      </p>
                    </div>
                    {inNetwork ? (
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                        Connected
                      </span>
                    ) : (
                      <Link
                        href="/discover"
                        className="shrink-0 text-[11px] font-medium text-muted hover:text-accent"
                      >
                        Discover
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-medium tracking-tight text-ivory">
              Related events
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  compact
                  interested={
                    getRsvp(e.id) === "interested" || getRsvp(e.id) === "going"
                  }
                  onToggleInterested={() => {
                    const cur = getRsvp(e.id);
                    setRsvp(
                      e.id,
                      cur === "interested" || cur === "going" ? null : "interested"
                    );
                    refresh();
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
