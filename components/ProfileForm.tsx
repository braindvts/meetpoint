"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, cityKey } from "@/lib/cities";
import { IDEA_TAGS } from "@/lib/data";
import { saveProfile } from "@/lib/store";
import type { MyProfile, TravelRange } from "@/lib/types";

const EMOJIS = ["🙂", "🧑🏾‍💻", "👩🏽‍💼", "👨🏻‍🍳", "🏋🏾‍♂️", "👩🏻‍🎨", "🧔🏾", "👩🏾‍⚕️", "🎸", "🧳"];

const TRAVEL_OPTIONS: { value: TravelRange; label: string; hint: string }[] = [
  { value: "local", label: "Near me", hint: "Meet within ~100 km" },
  { value: "country", label: "My country", hint: "Willing to travel domestically" },
  { value: "worldwide", label: "Worldwide", hint: "I'll fly for the right person" },
];

export default function ProfileForm({ initial }: { initial?: MyProfile | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🙂");
  const [cityIdx, setCityIdx] = useState(() => {
    if (!initial) return 0;
    const i = CITIES.findIndex((c) => cityKey(c) === cityKey(initial.city));
    return i >= 0 ? i : 0;
  });
  const [travel, setTravel] = useState<TravelRange>(initial?.travel ?? "worldwide");
  const [ideaTags, setIdeaTags] = useState<string[]>(initial?.ideaTags ?? []);
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setIdeaTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!jobTitle.trim()) return setError("Please enter your job or role.");
    if (ideaTags.length === 0) return setError("Pick at least one business idea or interest.");

    saveProfile({
      name: name.trim(),
      jobTitle: jobTitle.trim(),
      bio: bio.trim(),
      emoji,
      city: CITIES[cityIdx],
      travel,
      ideaTags,
    });
    router.push("/discover");
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none transition focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-8">
      <section>
        <label className="mb-2 block text-sm font-semibold text-slate-300">Avatar</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`grid h-11 w-11 place-items-center rounded-xl border text-xl transition ${
                emoji === e ? "border-accent bg-accent/15" : "border-line bg-panel hover:bg-panel-2"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Your name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Smith" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Job / role</label>
          <input className={inputCls} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Truck Driver, Software Engineer" />
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          Business ideas &amp; interests <span className="font-normal text-slate-500">(pick all that fit)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {IDEA_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                ideaTags.includes(tag)
                  ? "border-accent bg-accent/15 text-accent-2"
                  : "border-line bg-panel text-slate-300 hover:bg-panel-2"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Your city</label>
          <select className={inputCls} value={cityIdx} onChange={(e) => setCityIdx(Number(e.target.value))}>
            {CITIES.map((c, i) => (
              <option key={cityKey(c)} value={i}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">How far will you go to meet?</label>
          <div className="grid grid-cols-3 gap-2">
            {TRAVEL_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                title={o.hint}
                onClick={() => setTravel(o.value)}
                className={`rounded-xl border px-2 py-3 text-xs font-medium transition sm:text-sm ${
                  travel === o.value
                    ? "border-accent bg-accent/15 text-accent-2"
                    : "border-line bg-panel text-slate-300 hover:bg-panel-2"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          Short bio <span className="font-normal text-slate-500">(what are you building?)</span>
        </label>
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="e.g. Owner-operator planning a small fleet. Want to trade notes with people doing the same."
        />
      </section>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-2 sm:w-auto sm:px-10"
      >
        {initial ? "Save changes" : "Start discovering"}
      </button>
    </form>
  );
}
