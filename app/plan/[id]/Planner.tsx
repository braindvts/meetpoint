"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import StarRating, { cuisineLine } from "@/components/StarRating";
import { findPerson, refreshDirectory } from "@/lib/directory";
import { distanceKm, formatDistance, midpointRestaurants, restaurantsInCity } from "@/lib/match";
import { getConnection, loadProfile, setMeetup } from "@/lib/store";
import type { MeetMode, MyProfile, Person, Restaurant } from "@/lib/types";

export default function Planner({ peerId }: { peerId: string }) {
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [mode, setMode] = useState<MeetMode>("they-fly");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setPerson(findPerson(peerId) || null);
    void refreshDirectory().then(() => setPerson(findPerson(peerId) || null));
    const existing = getConnection(peerId)?.meetup;
    if (existing) {
      setMode(existing.mode);
      setRestaurantId(existing.restaurantId);
      setDate(existing.date);
      setNote(existing.note ?? "");
    }
    setReady(true);
  }, [peerId, router]);

  const options: Restaurant[] = useMemo(() => {
    if (!profile || !person) return [];
    switch (mode) {
      case "they-fly":
        return restaurantsInCity(profile.city.name);
      case "i-fly":
        return restaurantsInCity(person.city.name);
      case "midpoint":
        return midpointRestaurants(profile.city, person.city);
    }
  }, [profile, person, mode]);

  if (!ready || !profile) return null;

  if (!person) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg font-semibold">Person not found</p>
          <Link href="/circle" className="mt-2 inline-block text-accent underline">
            Back to connections
          </Link>
        </main>
      </>
    );
  }

  const km = distanceKm(profile.city, person.city);
  const isLocal = km <= 100;

  const modes: { value: MeetMode; title: string; text: string }[] = isLocal
    ? [
        { value: "they-fly", title: `Meet in ${profile.city.name}`, text: "You're in the same area — pick a spot near you." },
        { value: "i-fly", title: `Their side of town`, text: `Pick a spot near ${person.name.split(" ")[0]}.` },
      ]
    : [
        { value: "they-fly", title: `Host in ${profile.city.name}`, text: `${person.name.split(" ")[0]} flies to you — you pick the restaurant.` },
        { value: "i-fly", title: `Fly to ${person.city.name}`, text: `You make the trip — they show you their city.` },
        { value: "midpoint", title: "Meet in the middle", text: "Both fly to a spot between your two cities." },
      ];

  function confirm() {
    if (!restaurantId || !date) return;
    setMeetup(peerId, { mode, restaurantId, date, note: note.trim() || undefined });
    setSaved(true);
  }

  if (saved) {
    const r = options.find((o) => o.id === restaurantId);
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-xl px-6 py-24 pb-24 text-center">
          <div className="lux-divider mx-auto mb-10 max-w-48">
            <span className="text-accent" aria-hidden>◆</span>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-accent-2">Confirmed</p>
          <h1 className="mt-3 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
            The table is set
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ivory/85">
            You and <span className="font-semibold text-ivory">{person.name}</span> are meeting at{" "}
            <span className="font-semibold text-ivory">{r?.name}</span> in {r?.city} on{" "}
            {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
          <div className="lux-divider mx-auto mt-10 max-w-48">
            <span className="text-accent" aria-hidden>◆</span>
          </div>
          <Link
            href="/circle"
            className="mt-10 inline-block rounded-full bg-gradient-to-b from-accent-2 to-accent px-8 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            Back to your circle
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 pb-24 sm:px-6">
        <Link
          href="/circle"
          className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted transition hover:text-accent-2"
        >
          ← Your circle
        </Link>

        <div className="mt-8 mb-12 flex items-center gap-5">
          <Avatar src={person.photoUrl} name={person.name} sizeCls="h-16 w-16" rounded="rounded-full" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
              Curate the table
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
              Dinner with {person.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {person.city.name}, {person.city.country} · {formatDistance(km)}
            </p>
          </div>
        </div>

        <section className="mb-12 border-t border-line/70 pt-8">
          <div className="mb-6 flex items-baseline gap-4">
            <span className="text-[11px] font-medium tabular-nums text-accent">01</span>
            <h2 className="text-lg font-semibold tracking-tight text-ivory">
              Who travels?
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMode(m.value);
                  setRestaurantId("");
                }}
                className={`border p-5 text-left transition ${
                  mode === m.value
                    ? "border-accent/60 bg-accent/10"
                    : "border-line/70 bg-panel/60 hover:border-accent/30"
                }`}
              >
                <p className="text-base font-semibold text-ivory">{m.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{m.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12 border-t border-line/70 pt-8">
          <div className="mb-6 flex items-baseline gap-4">
            <span className="text-[11px] font-medium tabular-nums text-accent">02</span>
            <h2 className="text-lg font-semibold tracking-tight text-ivory">
              Choose the restaurant
            </h2>
          </div>
          {options.length === 0 ? (
            <p className="border border-line bg-panel/60 p-6 text-sm text-muted">
              No listed restaurants here yet — try another option above.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRestaurantId(r.id)}
                  className={`group border p-5 text-left transition ${
                    restaurantId === r.id
                      ? "border-accent/60 bg-accent/10"
                      : "border-line/70 bg-panel/60 hover:border-accent/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-ivory">{r.name}</p>
                    <StarRating restaurant={r} className="shrink-0" />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {cuisineLine(r.cuisine)} · {r.city}, {r.country}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/70">
                    {r.vibe}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-12 grid gap-8 border-t border-line/70 pt-8 sm:grid-cols-2">
          <div>
            <div className="mb-5 flex items-baseline gap-4">
              <span className="text-[11px] font-medium tabular-nums text-accent">03</span>
              <h2 className="text-lg font-semibold tracking-tight text-ivory">
                The date
              </h2>
            </div>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-0 border-b border-line bg-transparent px-0 py-3 text-base text-ivory outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <div className="mb-5 flex items-baseline gap-4">
              <span className="text-[11px] font-medium tabular-nums text-accent">04</span>
              <h2 className="text-lg font-semibold tracking-tight text-ivory">
                A note <span className="text-base font-normal text-muted">(optional)</span>
              </h2>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bringing my pitch deck…"
              className="w-full border-0 border-b border-line bg-transparent px-0 py-3 text-base text-ivory outline-none transition placeholder:text-muted/45 focus:border-accent"
            />
          </div>
        </section>

        <div className="flex flex-col items-stretch gap-4 border-t border-line/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-wide text-muted">
            Both of you will see the reservation details.
          </p>
          <button
            onClick={confirm}
            disabled={!restaurantId || !date}
            className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-10 py-3.5 text-sm font-semibold tracking-wide text-ink shadow-[0_8px_28px_rgba(255,255,255,0.12)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm the table
          </button>
        </div>
      </main>
    </>
  );
}
