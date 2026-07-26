"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { PEOPLE, RESTAURANTS } from "@/lib/data";
import { loadConnections, loadProfile, removeConnection } from "@/lib/store";
import type { Connection, MyProfile } from "@/lib/types";

export default function ConnectionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setConnections(loadConnections()), []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    refresh();
    setReady(true);
    window.addEventListener("meetpoint:connections-changed", refresh);
    return () => window.removeEventListener("meetpoint:connections-changed", refresh);
  }, [router, refresh]);

  function drop(peerId: string) {
    setConnections(removeConnection(peerId));
  }

  if (!ready || !profile) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Your connections</h1>
        <p className="mt-1 mb-8 text-slate-400">
          Once you&apos;re connected, lock in a table and make it real.
        </p>

        {connections.length === 0 ? (
          <div className="rounded-2xl border border-line bg-panel p-10 text-center">
            <p className="text-lg font-semibold">No connections yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Head to{" "}
              <Link href="/discover" className="text-accent underline">
                Discover
              </Link>{" "}
              and connect with someone who shares your idea.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => {
              const person = PEOPLE.find((p) => p.id === conn.peerId);
              if (!person) return null;
              const restaurant = conn.meetup
                ? RESTAURANTS.find((r) => r.id === conn.meetup!.restaurantId)
                : null;

              return (
                <div key={conn.peerId} className="rounded-2xl border border-line bg-panel p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-panel-2 text-2xl">
                        {person.emoji}
                      </span>
                      <div>
                        <h3 className="font-semibold">{person.name}</h3>
                        <p className="text-sm text-slate-400">
                          {person.jobTitle} · {person.city.name}, {person.city.country}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {conn.status === "requested" ? (
                        <span className="rounded-lg bg-panel-2 px-4 py-2 text-sm font-semibold text-slate-400">
                          Waiting for accept…
                        </span>
                      ) : conn.meetup ? (
                        <Link
                          href={`/plan/${person.id}`}
                          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-panel-2"
                        >
                          Edit meetup
                        </Link>
                      ) : (
                        <Link
                          href={`/plan/${person.id}`}
                          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-2"
                        >
                          Plan meetup 🍽️
                        </Link>
                      )}
                      <button
                        onClick={() => drop(conn.peerId)}
                        title="Remove connection"
                        className="rounded-lg border border-line px-3 py-2 text-sm text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {conn.meetup && restaurant && (
                    <div className="mt-4 rounded-xl border border-mint/25 bg-mint/5 p-4 text-sm">
                      <p className="font-semibold text-mint">Meetup locked in ✓</p>
                      <p className="mt-1 text-slate-300">
                        {restaurant.name} ({restaurant.cuisine}) — {restaurant.city}, {restaurant.country}
                      </p>
                      <p className="mt-0.5 text-slate-400">
                        {new Date(conn.meetup.date + "T12:00:00").toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                        {conn.meetup.note ? ` · “${conn.meetup.note}”` : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
