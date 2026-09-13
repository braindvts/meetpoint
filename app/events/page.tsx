"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/events/EventCard";
import ConventionCard from "@/components/events/ConventionCard";
import EventFiltersBar from "@/components/events/EventFiltersBar";
import {
  filterEvents,
  getPublishedEvents,
  getUpcomingSorted,
  type EventFilters,
  type InterlinkEvent,
} from "@/lib/events";
import {
  displayCounts,
  fetchPublishedEvents,
  getRsvp,
  listPublishedEvents,
  loadRsvps,
  networkAttendingCount,
  setRsvp,
} from "@/lib/eventStore";
import { loginUrl } from "@/lib/appPath";
import {
  formatMatchReasons,
  interestsFromRsvps,
  rankEvents,
  type EventMatchResult,
} from "@/lib/eventMatch";
import { hydrateLocalProfile } from "@/lib/hydrateSession";
import { loadConnections } from "@/lib/store";
import { showToast } from "@/lib/notify";
import type { MyProfile } from "@/lib/types";

function Section({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <h2 className="text-lg font-medium tracking-tight text-ivory sm:text-xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}

function hasFilterSignal(filters: EventFilters): boolean {
  return (
    !!(filters.query && filters.query.trim()) ||
    (filters.category && filters.category !== "all") ||
    (filters.industry && filters.industry !== "all") ||
    (filters.format && filters.format !== "all") ||
    (filters.kind && filters.kind !== "all") ||
    (filters.dateWindow && filters.dateWindow !== "all") ||
    !!(filters.city && filters.city.trim())
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [events, setEvents] = useState<InterlinkEvent[]>(() => getPublishedEvents());
  const [catalogReady, setCatalogReady] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    query: "",
    category: "all",
    industry: "all",
    format: "all",
    kind: "all",
    city: "",
    dateWindow: "all",
  });
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [rsvpTick, setRsvpTick] = useState(0);

  const refresh = useCallback(() => {
    setEvents(listPublishedEvents());
    setConnectedIds(
      loadConnections()
        .filter((c) => c.status === "connected")
        .map((c) => c.peerId)
    );
    setRsvpTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setEvents(listPublishedEvents());
      const remote = await fetchPublishedEvents();
      if (cancelled) return;
      setEvents(remote);
      setCatalogReady(true);
      const p = await hydrateLocalProfile();
      if (cancelled) return;
      setProfile(p);
      setConnectedIds(
        loadConnections()
          .filter((c) => c.status === "connected")
          .map((c) => c.peerId)
      );
    })();
    const onEvt = () => refresh();
    window.addEventListener("meetpoint:events", onEvt);
    window.addEventListener("meetpoint:connections-changed", onEvt);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:events", onEvt);
      window.removeEventListener("meetpoint:connections-changed", onEvt);
    };
  }, [refresh]);

  const cityHint = profile?.city?.name || "";

  const ranked = useMemo<EventMatchResult[]>(() => {
    if (!profile) return [];
    return rankEvents(profile, events, interestsFromRsvps(loadRsvps()));
  }, [profile, events, rsvpTick]);

  const rankedById = useMemo(() => {
    const map = new Map<string, EventMatchResult>();
    for (const m of ranked) map.set(m.event.id, m);
    return map;
  }, [ranked]);

  const filtered = useMemo(() => {
    const list = filterEvents(events, filters);
    if (!profile || !hasFilterSignal(filters)) return getUpcomingSorted(list);
    return [...list].sort((a, b) => {
      const sa = rankedById.get(a.id)?.score ?? -1;
      const sb = rankedById.get(b.id)?.score ?? -1;
      if (sb !== sa) return sb - sa;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [events, filters, profile, rankedById]);

  const hasActiveFilters = hasFilterSignal(filters);

  const featured = useMemo(
    () => getUpcomingSorted(events.filter((e) => e.featured)).slice(0, 6),
    [events]
  );
  const upcoming = useMemo(() => getUpcomingSorted(events).slice(0, 6), [events]);
  const popular = useMemo(
    () =>
      [...events]
        .sort(
          (a, b) =>
            b.interestedCount + b.attendeeCount - (a.interestedCount + a.attendeeCount)
        )
        .slice(0, 6),
    [events]
  );
  const nearYou = useMemo(() => {
    if (!cityHint) return getUpcomingSorted(events).slice(0, 6);
    const near = events.filter(
      (e) =>
        e.city.toLowerCase() === cityHint.toLowerCase() ||
        e.format === "online"
    );
    return getUpcomingSorted(near.length ? near : events).slice(0, 6);
  }, [events, cityHint]);

  const byCategory = useCallback(
    (pred: (e: InterlinkEvent) => boolean) =>
      getUpcomingSorted(events.filter(pred)).slice(0, 6),
    [events]
  );

  const networking = byCategory(
    (e) => e.category === "networking" || e.category === "dinner" || e.category === "meetup"
  );
  const conferences = byCategory(
    (e) => e.category === "conference" || e.category === "workshop"
  );
  const industryEvents = byCategory((e) => !!e.industry);
  const exclusive = byCategory((e) => !!e.exclusive || e.category === "exclusive");
  const conventions = useMemo(
    () =>
      getUpcomingSorted(
        events.filter((e) => e.kind === "convention" || e.category === "convention")
      ),
    [events]
  );

  const cardProps = (event: InterlinkEvent, opts?: { forYou?: boolean }) => {
    const counts = displayCounts(event);
    const network = networkAttendingCount(event, connectedIds);
    const rsvp = getRsvp(event.id);
    const interested = rsvp === "interested" || rsvp === "going";
    const match = rankedById.get(event.id);
    const matchReasons = match
      ? formatMatchReasons(match.reasons).split(" · ").filter(Boolean)
      : undefined;
    return {
      event,
      interestedCount: counts.interested,
      attendeeCount: counts.attendees,
      networkCount: network,
      interested,
      matchReasons,
      onToggleInterested: () => {
        if (!profile) {
          router.push(loginUrl("/events"));
          return;
        }
        const cur = getRsvp(event.id);
        if (cur === "interested" || cur === "going") {
          setRsvp(event.id, null);
          showToast("Removed from saved events");
        } else {
          setRsvp(event.id, "interested");
          showToast("Marked interested");
        }
        refresh();
      },
      onPass: opts?.forYou
        ? () => {
            setRsvp(event.id, "passed");
            showToast("Passed — we’ll show fewer like this");
            refresh();
          }
        : undefined,
    };
  };

  if (!catalogReady && events.length === 0) {
    return (
      <div className="mp-app">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:px-6">
          <PageHeader title="Events" />
          <p className="mt-8 text-sm text-muted">Loading events…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mp-app">
      <Nav />
      <main className="mx-auto max-w-5xl space-y-12 px-4 pb-28 pt-2 md:px-6">
        <PageHeader
          title="Events"
          action={
            <Link
              href="#conventions"
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent/90 hover:text-accent"
            >
              Conventions
            </Link>
          }
        />

        <div className="space-y-3">
          <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">
            Upcoming dinners, conferences, and conventions — ranked from what
            you’re into, what you do, and what your profile says you’re seeking.
          </p>
          <div className="flex flex-wrap gap-2">
            {ranked.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    query: "",
                    category: "all",
                    industry: "all",
                    format: "all",
                    kind: "all",
                    city: "",
                    dateWindow: "all",
                  });
                  document.getElementById("for-you")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-lg border border-accent/30 px-3.5 py-1.5 text-[11px] font-medium text-accent transition hover:border-accent/55 hover:bg-accent/10"
              >
                For you · {Math.min(ranked.length, 6)}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const city = cityHint || "";
                setFilters((f) => ({
                  ...f,
                  query: "",
                  category: "all",
                  industry: "all",
                  format: "all",
                  kind: "all",
                  dateWindow: "all",
                  city: city || f.city,
                }));
                document.getElementById("near-you")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-lg border border-line px-3.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-ivory"
            >
              Near you{cityHint ? ` · ${cityHint}` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters({
                  query: "",
                  category: "all",
                  industry: "all",
                  format: "all",
                  kind: "all",
                  city: "",
                  dateWindow: "all",
                });
                document.getElementById("worldwide")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-lg border border-line px-3.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-ivory"
            >
              Around the world
            </button>
            <button
              type="button"
              onClick={() =>
                document.getElementById("conventions")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-lg border border-line px-3.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-ivory"
            >
              Conventions
            </button>
          </div>
          <EventFiltersBar value={filters} onChange={setFilters} />
        </div>

        {!hasActiveFilters && events.length === 0 ? (
          <EmptyState
            title="No events yet"
            body="The calendar is empty on this server. Check back soon, or ask an operator to publish gatherings."
          />
        ) : hasActiveFilters ? (
          <Section
            title="Results"
            subtitle={`${filtered.length} matching ${filtered.length === 1 ? "event" : "events"}${
              ranked.length ? " · stronger fits first" : ""
            }`}
          >
            {filtered.length === 0 ? (
              <EmptyState
                title="No matches"
                body="Try a broader search, another city, or clear a filter."
                actionLabel="Clear filters"
                onAction={() =>
                  setFilters({
                    query: "",
                    category: "all",
                    industry: "all",
                    format: "all",
                    kind: "all",
                    city: "",
                    dateWindow: "all",
                  })
                }
              />
            ) : (
              <Grid>
                {filtered.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            )}
          </Section>
        ) : (
          <>
            {ranked.length > 0 ? (
              <Section
                id="for-you"
                title="For you"
                subtitle="Ranked from your interests, role, and what you’re looking for — not the whole catalog."
              >
                <Grid>
                  {ranked.slice(0, 6).map((m) => (
                    <EventCard key={m.event.id} {...cardProps(m.event, { forYou: true })} />
                  ))}
                </Grid>
              </Section>
            ) : null}

            {featured.length > 0 ? (
              <Section
                title="Featured"
                subtitle="Hand-picked rooms with the strongest networking signal."
              >
                <Grid>
                  {featured.map((e) => (
                    <EventCard key={e.id} {...cardProps(e)} />
                  ))}
                </Grid>
              </Section>
            ) : null}

            <Section title="Upcoming" id="worldwide" subtitle="Soonest on the calendar — cities worldwide.">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="Nothing upcoming"
                  body="No published dates yet. Try Popular or Conventions, or check back later."
                />
              ) : (
                <Grid>
                  {upcoming.map((e) => (
                    <EventCard key={e.id} {...cardProps(e)} />
                  ))}
                </Grid>
              )}
            </Section>

            <Section title="Popular" subtitle="Where professionals are already gathering.">
              <Grid>
                {popular.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section
              id="near-you"
              title="Near you"
              subtitle={
                cityHint
                  ? `Based on ${cityHint} — plus online rooms you can join from anywhere.`
                  : "Online and in-person gatherings across the network. Set your city on Profile to prioritize nearby rooms."
              }
            >
              <Grid>
                {nearYou.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section
              title="Business & networking"
              subtitle="Tables, mixers, and meetups built for introductions."
            >
              <Grid>
                {networking.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section title="Conferences" subtitle="Focused days with decision-makers in the room.">
              <Grid>
                {conferences.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section
              title="Industry events"
              subtitle="From AI and finance to real estate and luxury."
            >
              <Grid>
                {industryEvents.slice(0, 6).map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section
              title="Exclusive"
              subtitle="Invitation-leaning rooms for Verified and BLACK members."
            >
              <Grid>
                {exclusive.map((e) => (
                  <EventCard key={e.id} {...cardProps(e)} />
                ))}
              </Grid>
            </Section>

            <Section
              id="conventions"
              title="Conventions"
              subtitle="Multi-day floors — see who from your network will be on site."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                {conventions.map((e) => (
                  <ConventionCard key={e.id} event={e} />
                ))}
              </div>
              {conventions.length === 0 ? (
                <EmptyState
                  title="No conventions yet"
                  body="Check back as the calendar fills — or browse smaller events above."
                />
              ) : null}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}
