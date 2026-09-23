"use client";

import { useEffect } from "react";
import { loadDirectory } from "@/lib/directory";
import { formatEventDate } from "@/lib/events";
import { fetchPublishedEvents, listPublishedEvents } from "@/lib/eventStore";
import { refreshNotices, type EventNoticeInput } from "@/lib/notifications";
import { loadConnections, loadProfile } from "@/lib/store";
import type { InterlinkEvent } from "@/lib/events";

function toNoticeEvent(event: InterlinkEvent): EventNoticeInput {
  return {
    id: event.id,
    name: event.name,
    kind: event.kind,
    category: event.category,
    city: event.city,
    venue: event.venue,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    published: event.published,
    dateLabel: formatEventDate(event.startsAt),
    image: event.image,
  };
}

/** Keeps the local feed in step with connections, profile city, and events. */
export default function NotificationSync() {
  useEffect(() => {
    let cancelled = false;
    let events = listPublishedEvents();

    const run = () => {
      if (cancelled) return;
      const names: Record<string, string> = {};
      for (const person of loadDirectory()) names[person.id] = person.name;
      refreshNotices({
        connections: loadConnections(),
        names,
        events: events.map(toNoticeEvent),
        city: loadProfile()?.city?.name,
      });
    };

    run();
    void fetchPublishedEvents().then((remote) => {
      if (cancelled) return;
      events = remote;
      run();
    });

    window.addEventListener("meetpoint:connections-changed", run);
    window.addEventListener("meetpoint:events", run);
    window.addEventListener("meetpoint:profile-changed", run);
    window.addEventListener("meetpoint:directory-changed", run);
    return () => {
      cancelled = true;
      window.removeEventListener("meetpoint:connections-changed", run);
      window.removeEventListener("meetpoint:events", run);
      window.removeEventListener("meetpoint:profile-changed", run);
      window.removeEventListener("meetpoint:directory-changed", run);
    };
  }, []);

  return null;
}
