"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import { NotificationFeed } from "@/components/NotificationBell";

export default function NotificationsPage() {
  return (
    <>
      <Nav />
      <main className="mp-app px-4 pb-16 pt-4 md:px-6">
        <PageHeader title="Notifications" />
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Acceptances land here when someone accepts your introduction. Gatherings use your
          profile city when it matches the calendar, and otherwise show as upcoming.
        </p>
        <div className="mp-notice-page mt-6 max-w-xl overflow-hidden border border-accent/25 bg-[#050505]">
          <NotificationFeed />
        </div>
        <p className="mt-4 text-[12px] text-muted">
          Looking for the room?{" "}
          <Link href="/events" className="mp-press text-accent underline-offset-4 hover:underline">
            Browse events
          </Link>
        </p>
      </main>
    </>
  );
}
