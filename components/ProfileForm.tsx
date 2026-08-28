"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, cityKey, indexOfCity, nearestCity } from "@/lib/cities";
import { IDEA_TAGS, POPULAR_TAGS } from "@/lib/data";
import { formatPhoneDisplay, isValidPhone } from "@/lib/phone";
import { saveProfile } from "@/lib/store";
import { makeVerification, validateVerification } from "@/lib/verifyRules";
import type {
  MyProfile,
  LookingFor,
  PersonWork,
  TravelRange,
  Verification,
  VerificationMethod,
} from "@/lib/types";
import { LOOKING_FOR_OPTIONS, VERIFICATION_OPTIONS } from "@/lib/types";

const PHOTO_SIZE = 320;

function processPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, sx, sy, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

const TRAVEL_OPTIONS: { value: TravelRange; label: string; hint: string }[] = [
  { value: "local", label: "Near me", hint: "Meet within ~100 km" },
  { value: "country", label: "My country", hint: "Willing to travel domestically" },
  { value: "worldwide", label: "Worldwide", hint: "I'll fly for the right person" },
];

function Section({
  num,
  title,
  subtitle,
  children,
}: {
  num: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative border-t border-line/70 pt-3.5 sm:pt-8">
      <div className="mb-2.5 flex items-baseline gap-2 sm:mb-6 sm:gap-4">
        <span className="font-display text-[10px] italic text-accent sm:text-sm">{num}</span>
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-ivory sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 hidden text-sm text-muted sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function TagChip({
  tag,
  selected,
  onClick,
  remove,
}: {
  tag: string;
  selected?: boolean;
  onClick: () => void;
  remove?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={remove ? "Click to remove" : undefined}
      className={`rounded-sm border px-2 py-1 text-left text-[11px] transition sm:px-3 sm:py-1.5 sm:text-sm ${
        selected || remove
          ? "border-accent/50 bg-accent/10 text-accent-2"
          : "border-line/80 bg-transparent text-muted hover:border-accent/35 hover:text-ivory"
      }`}
    >
      {tag}
      {remove ? " ×" : ""}
    </button>
  );
}

export default function ProfileForm({ initial }: { initial?: MyProfile | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cityIdx, setCityIdx] = useState(() => {
    if (!initial) return 0;
    const i = CITIES.findIndex((c) => cityKey(c) === cityKey(initial.city));
    return i >= 0 ? i : 0;
  });
  const [travel, setTravel] = useState<TravelRange>(initial?.travel ?? "worldwide");
  const [lookingFor, setLookingFor] = useState<LookingFor[]>(initial?.lookingFor ?? []);
  const [ideaTags, setIdeaTags] = useState<string[]>(initial?.ideaTags ?? []);
  const [verifyValues, setVerifyValues] = useState<Partial<Record<VerificationMethod, string>>>(
    () => {
      const next: Partial<Record<VerificationMethod, string>> = {};
      for (const v of initial?.verifications || []) next[v.method] = v.value;
      if (initial?.linkedInId && !next.linkedin) next.linkedin = `linkedin:${initial.linkedInId}`;
      return next;
    }
  );
  const [work, setWork] = useState<PersonWork[]>(() =>
    initial?.work?.length ? initial.work : [{ title: "", kind: "project", description: "", url: "" }]
  );
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [tagSearch, setTagSearch] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(tag: string) {
    setIdeaTags((tags) =>
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );
  }

  function toggleLookingFor(item: LookingFor) {
    setLookingFor((list) =>
      list.includes(item) ? list.filter((t) => t !== item) : [...list, item]
    );
  }

  const customTags = ideaTags.filter((t) => !IDEA_TAGS.includes(t));
  const query = tagSearch.trim();

  const searchResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return IDEA_TAGS.filter((t) => t.toLowerCase().includes(q));
  }, [query]);

  const exactExists =
    !!query &&
    [...IDEA_TAGS, ...customTags].some((t) => t.toLowerCase() === query.toLowerCase());

  function addCustomTag() {
    if (!query || exactExists) return;
    setIdeaTags((tags) => [...tags, query]);
    setTagSearch("");
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    try {
      setPhoto(await processPhoto(file));
      setError("");
    } catch {
      setError("Could not read that photo — try a different one.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) return setError("Please add a real photo of yourself.");
    if (!name.trim()) return setError("Please enter your name.");
    if (!jobTitle.trim()) return setError("Please enter your job or role.");
    if (ideaTags.length === 0) return setError("Pick at least one business idea or interest.");
    if (lookingFor.length === 0)
      return setError("Choose what you’re looking for — co-founder, investor, clients, etc.");
    if (phone.trim() && !isValidPhone(phone))
      return setError("Enter a valid mobile number (at least 10 digits), or leave it blank.");

    const verifications: Verification[] = [];
    for (const opt of VERIFICATION_OPTIONS) {
      let raw = (verifyValues[opt.method] || "").trim();
      if (opt.method === "linkedin" && initial?.linkedInId && !raw) {
        raw = `linkedin:${initial.linkedInId}`;
      }
      if (!raw) continue;
      const checked = validateVerification(opt.method, raw);
      if (!checked.ok) return setError(checked.error);
      verifications.push(makeVerification(opt.method, checked.value));
    }
    if (verifications.length === 0) {
      return setError("Add at least one verification — work email, LinkedIn, website, or portfolio.");
    }

    const projects = work
      .map((w) => ({
        title: w.title.trim(),
        kind: w.kind || "project",
        description: w.description.trim(),
        url: w.url?.trim() || undefined,
      }))
      .filter((w) => w.title);

    saveProfile({
      name: name.trim(),
      jobTitle: jobTitle.trim(),
      bio: bio.trim(),
      photo,
      city: CITIES[cityIdx],
      travel,
      meetPreference: "open",
      lookingFor,
      ideaTags,
      verifications,
      work: projects,
      phone: phone.trim() ? formatPhoneDisplay(phone) : undefined,
      linkedInId: initial?.linkedInId,
      meetingsAttended: initial?.meetingsAttended,
      elite: initial?.elite,
      premierPlan: initial?.premierPlan,
    });

    for (const v of verifications) {
      try {
        await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: v.method, value: v.value }),
        });
      } catch {
        /* local profile still saved */
      }
    }

    router.push("/discover");
  }

  const field =
    "w-full border-0 border-b border-line bg-transparent px-0 py-2 text-sm text-ivory outline-none transition placeholder:text-muted/45 focus:border-accent sm:py-3 sm:text-base";
  const labelCls =
    "text-[9px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.22em]";

  return (
    <form onSubmit={submit} className="space-y-5 sm:space-y-12">
      <Section
        num="01"
        title="Identity"
        subtitle="Your photo is the first thing people see — make it count."
      >
        <div className="space-y-4 sm:grid sm:grid-cols-[200px_1fr] sm:items-start sm:gap-8 sm:space-y-0">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative aspect-[3/4] w-full max-w-[280px] overflow-hidden border border-accent/35 bg-panel transition hover:border-accent sm:max-w-none"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt="Your profile photo"
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <span className="grid h-full place-items-center px-4 text-center">
                  <span>
                    <span className="block font-display text-4xl italic text-muted/60">+</span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Add your photo
                    </span>
                  </span>
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-2">
                {photo ? "Change photo" : "Upload photo"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="hidden"
            />
            <p className="text-[11px] leading-relaxed text-muted">
              Real photo of you. Face clear, good light. This is your first impression in The Room.
            </p>
          </div>

          <div className="min-w-0 space-y-3 sm:space-y-6">
            <label className="block">
              <span className={labelCls}>Full name</span>
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Smith"
              />
            </label>
            <label className="block">
              <span className={labelCls}>Job / role</span>
              <input
                className={field}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Truck Driver, Software Engineer…"
              />
            </label>
            <label className="block">
              <span className={labelCls}>Mobile</span>
              <input
                className={field}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </label>
          </div>
        </div>
      </Section>

      {/* Ambitions */}
      <Section
        num="02"
        title="Ambitions"
        subtitle="What you’re building — pick all that fit, or search your own."
      >
        <div className="relative mb-3">
          <input
            className={`${field} pl-0`}
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (searchResults.length === 1) {
                  toggleTag(searchResults[0]);
                  setTagSearch("");
                } else if (!exactExists) {
                  addCustomTag();
                }
              }
            }}
            placeholder="Search ideas… or type your own"
          />
        </div>

        {ideaTags.length > 0 && (
          <div className="mb-3">
            <p className={`mb-1.5 ${labelCls} !text-accent`}>Selected · {ideaTags.length}</p>
            <div className="flex flex-wrap gap-1.5">
              {ideaTags.map((tag) => (
                <TagChip key={tag} tag={tag} selected onClick={() => toggleTag(tag)} remove />
              ))}
            </div>
          </div>
        )}

        {customTags.length > 0 && (
          <div className="mb-3">
            <p className={`mb-1.5 ${labelCls}`}>Your own ideas</p>
            <div className="flex flex-wrap gap-1.5">
              {customTags.map((tag) => (
                <TagChip key={tag} tag={tag} remove onClick={() => toggleTag(tag)} />
              ))}
            </div>
          </div>
        )}

        {query ? (
          <div className="flex flex-wrap gap-1.5">
            {searchResults.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                selected={ideaTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
            {!exactExists && (
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-sm border border-dashed border-accent/45 px-2 py-1 text-[11px] text-accent-2 transition hover:bg-accent/10 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                + Add “{query}”
              </button>
            )}
            {searchResults.length === 0 && exactExists && (
              <p className="text-xs text-muted">Already selected</p>
            )}
          </div>
        ) : (
          <>
            <p className={`mb-1.5 ${labelCls}`}>Most popular</p>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {[
                ...POPULAR_TAGS,
                ...(showAllTags
                  ? []
                  : ideaTags.filter(
                      (t) => !POPULAR_TAGS.includes(t) && IDEA_TAGS.includes(t)
                    )),
              ].map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  selected={ideaTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>

            {showAllTags && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {IDEA_TAGS.filter((t) => !POPULAR_TAGS.includes(t)).map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    selected={ideaTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAllTags((s) => !s)}
              className="text-xs font-medium text-accent transition hover:text-accent-2 sm:text-sm"
            >
              {showAllTags ? "Show less" : `Browse all ${IDEA_TAGS.length} ideas`}
            </button>
          </>
        )}
      </Section>

      <Section
        num="03"
        title="Looking for"
        subtitle="Required. Tell us the introductions you want — matches are built around this."
      >
        <div className="flex flex-wrap gap-1.5">
          {LOOKING_FOR_OPTIONS.map((item) => (
            <TagChip
              key={item}
              tag={item}
              selected={lookingFor.includes(item)}
              onClick={() => toggleLookingFor(item)}
            />
          ))}
        </div>
      </Section>

      <Section
        num="04"
        title="Verification"
        subtitle="Add as many as you have. Work email, LinkedIn, and a site raise your tier."
      >
        <div className="space-y-3">
          {VERIFICATION_OPTIONS.map((o) => (
            <label key={o.method} className="block">
              <span className={labelCls}>{o.label}</span>
              {o.method === "linkedin" && initial?.linkedInId && !verifyValues.linkedin?.startsWith("http") ? (
                <p className="mt-1 border border-accent/30 bg-accent/5 px-3 py-2 text-[11px] text-accent-2">
                  LinkedIn connected — that counts. Add your public URL to show it on your card.
                </p>
              ) : null}
              <input
                className={field}
                value={verifyValues[o.method] || ""}
                onChange={(e) =>
                  setVerifyValues((prev) => ({ ...prev, [o.method]: e.target.value }))
                }
                placeholder={o.placeholder}
              />
              <p className="mt-1 hidden text-[11px] text-muted sm:block">{o.hint}</p>
            </label>
          ))}
        </div>
      </Section>

      <Section num="05" title="Place" subtitle="Where you are — and how far you’ll go to meet.">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-8">
          <div>
            <span className={labelCls}>Your city</span>
            <select
              className={`${field} mt-1.5 cursor-pointer appearance-none sm:mt-3`}
              value={cityIdx}
              onChange={(e) => setCityIdx(Number(e.target.value))}
            >
              {CITIES.map((c, i) => (
                <option key={cityKey(c)} value={i} className="bg-panel text-ivory">
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent transition hover:text-accent-2"
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Location isn’t available in this browser.");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
                    setCityIdx(indexOfCity(city));
                  },
                  () => alert("Couldn’t read your location. Pick a city from the list."),
                  { enableHighAccuracy: false, timeout: 10000 }
                );
              }}
            >
              Use my location
            </button>
          </div>

          <div>
            <span className={labelCls}>Travel range</span>
            <div className="mt-1.5 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-line bg-line sm:mt-3">
              {TRAVEL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  title={o.hint}
                  onClick={() => setTravel(o.value)}
                  className={`bg-ink px-1 py-2.5 text-center text-[10px] font-medium transition sm:px-2 sm:py-4 sm:text-sm ${
                    travel === o.value
                      ? "bg-accent/15 text-accent-2"
                      : "text-muted hover:text-ivory"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section
        num="06"
        title="How introductions work"
        subtitle="In The Room you’ll see For you and Nearby — similar businesses, people who can help, and your profession are merged into For you."
      >
        <div className="border border-line/70 bg-panel/40 px-3 py-3 sm:px-5 sm:py-4">
          <p className="text-[12px] leading-relaxed text-muted sm:text-sm">
            Pick your business ideas and what you&apos;re looking for above. Conclave ranks
            people who share your model, can help you build it, or work in your profession —
            then Nearby narrows that to people close to you.
          </p>
        </div>
      </Section>

      <Section
        num="07"
        title="Projects"
        subtitle="What you’ve built. Each project raises your standing in the room."
      >
        <div className="space-y-4">
          {work.map((item, i) => (
            <div key={i} className="border border-line/60 bg-panel/30 p-3 sm:p-4">
              <input
                className={field}
                value={item.title}
                onChange={(e) =>
                  setWork((list) =>
                    list.map((w, idx) => (idx === i ? { ...w, title: e.target.value } : w))
                  )
                }
                placeholder="Project or company name"
              />
              <input
                className={`${field} mt-2`}
                value={item.url || ""}
                onChange={(e) =>
                  setWork((list) =>
                    list.map((w, idx) => (idx === i ? { ...w, url: e.target.value } : w))
                  )
                }
                placeholder="https://…"
              />
              <textarea
                className={`${field} mt-2 min-h-16 resize-none`}
                value={item.description}
                onChange={(e) =>
                  setWork((list) =>
                    list.map((w, idx) => (idx === i ? { ...w, description: e.target.value } : w))
                  )
                }
                placeholder="What it is — one or two lines."
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setWork((list) => [...list, { title: "", kind: "project", description: "", url: "" }])
            }
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent"
          >
            Add another project
          </button>
        </div>
      </Section>

      <Section num="08" title="About" subtitle="A short note on what you’re building.">
        <textarea
          className={`${field} min-h-20 resize-none leading-relaxed sm:min-h-28`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Owner-operator planning a small fleet. Looking to trade notes with people doing the same…"
        />
      </Section>

      {error && (
        <p className="rounded-sm border border-ivory/25 bg-ivory/5 px-3 py-2 text-[11px] text-ivory sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col items-stretch gap-2.5 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-8">
        <p className="hidden text-xs tracking-wide text-muted sm:block">
          Your profile is what partners see before they sit down with you.
        </p>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-b from-accent-2 to-accent px-10 py-3.5 text-sm font-semibold tracking-wide text-ink shadow-[0_8px_28px_rgba(255,255,255,0.12)] transition hover:brightness-110"
        >
          {initial?.jobTitle || initial?.ideaTags?.length ? "Save profile" : "Start discovering"}
        </button>
      </div>
    </form>
  );
}
