"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { PEOPLE } from "@/lib/data";
import { distanceKm, formatDistance, midpointRestaurants, restaurantsInCity } from "@/lib/match";
import { getConnection, loadProfile, setMeetup } from "@/lib/store";
import type { MeetMode, MyProfile, Restaurant } from "@/lib/types";

const PRICE = ["$", "$$", "$$$"];

export default function Planner({ peerId }: { peerId: string }) {
  const router = useRouter();
  const person = PEOPLE.find((p) => p.id === peerId);

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
          <Link href="/connections" className="mt-2 inline-block text-accent underline">
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
        <main className="mx-auto max-w-xl px-6 py-20 pb-24 text-center">
          <div className="text-6xl">🎉</div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">It&apos;s happening!</h1>
          <p className="mt-3 text-slate-400">
            You and <span className="font-semibold text-slate-200">{person.name}</span> are meeting at{" "}
            <span className="font-semibold text-slate-200">{r?.name}</span> in {r?.city} on{" "}
            {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
          <Link
            href="/connections"
            className="mt-8 inline-block rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition hover:bg-accent-2"
          >
            Back to connections
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6">
        <Link href="/connections" className="text-sm text-slate-400 hover:text-slate-200">
          ← Connections
        </Link>

        <div className="mt-4 mb-8 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-panel-2 text-3xl">{person.emoji}</span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Plan your meetup with {person.name.split(" ")[0]}</h1>
            <p className="text-sm text-slate-400">
              {person.city.name}, {person.city.country} · {formatDistance(km)}
            </p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">1. Who travels?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setMode(m.value);
                  setRestaurantId("");
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === m.value ? "border-accent bg-accent/10" : "border-line bg-panel hover:bg-panel-2"
                }`}
              >
                <p className="font-semibold">{m.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{m.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">2. Pick the restaurant</h2>
          {options.length === 0 ? (
            <p className="rounded-xl border border-line bg-panel p-5 text-sm text-slate-400">
              No listed restaurants here yet — try another option above.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRestaurantId(r.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    restaurantId === r.id ? "border-accent bg-accent/10" : "border-line bg-panel hover:bg-panel-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.name}</p>
                    <span className="text-xs text-slate-500">{PRICE[r.priceLevel - 1]}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {r.cuisine} · {r.city}, {r.country}
                  </p>
                  <p className="mt-2 text-xs italic text-slate-500">“{r.vibe}”</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-300">3. When?</h2>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-300">
              Note <span className="font-normal text-slate-500">(optional)</span>
            </h2>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bringing my pitch deck!"
              className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>
        </section>

        <button
          onClick={confirm}
          disabled={!restaurantId || !date}
          className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 transition enabled:hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-10"
        >
          Confirm meetup
        </button>
      </main>
    </>
  );
}
