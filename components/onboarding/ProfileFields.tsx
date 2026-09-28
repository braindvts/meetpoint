"use client";

import { useId, useRef } from "react";
import { CITIES, cityKey, nearestCity } from "@/lib/cities";
import { INDUSTRIES } from "@/lib/interests";
import { PROFILE_LIMITS, type FieldErrors, type OnboardingDraft } from "@/lib/onboardingDraft";
import { LOOKING_FOR_OPTIONS, type City, type LookingFor } from "@/lib/types";
import { processPhoto } from "./photo";

export const fieldClass =
  "w-full rounded-lg border border-white/12 bg-transparent px-3 py-3 text-[15px] text-ivory outline-none transition placeholder:text-muted/50 focus:border-accent";

export const fieldErrorClass =
  "w-full rounded-lg border border-accent/70 bg-transparent px-3 py-3 text-[15px] text-ivory outline-none transition placeholder:text-muted/50 focus:border-accent";

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-accent-2" role="alert">
      {message}
    </p>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  const over = value > max;
  return (
    <span className={`tabular-nums text-[11px] ${over ? "text-accent-2" : "text-muted"}`}>
      {value}/{max}
    </span>
  );
}

function Label({
  htmlFor,
  children,
  count,
  max,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  count?: number;
  max?: number;
  optional?: boolean;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {children}
        {optional ? <span className="ml-2 font-medium normal-case tracking-normal text-muted/80">Optional</span> : null}
      </label>
      {count != null && max != null ? <Counter value={count} max={max} /> : null}
    </div>
  );
}

export function PhotoField({
  photo,
  name,
  error,
  onChange,
}: {
  photo: string;
  name: string;
  error?: string;
  onChange: (photo: string, error?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onChange(photo, "Choose an image file.");
      return;
    }
    try {
      onChange(await processPhoto(file));
    } catch {
      onChange(photo, "Could not read that photo. Try a different one.");
    }
  }

  return (
    <div>
      <Label>Photo</Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-describedby={error ? errorId : undefined}
          className={`grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border bg-[#0a0a0a] text-lg font-medium text-accent ${
            error ? "border-accent" : "border-white/15"
          }`}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{initials || "+"}</span>
          )}
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[13px] font-medium text-ivory underline decoration-accent/40 underline-offset-4"
          >
            {photo ? "Change photo" : "Upload a photo"}
          </button>
          <p className="mt-1 text-[12px] leading-snug text-muted">A clear photo of you. Square crop.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Upload photo"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  max,
  optional,
  error,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  max: number;
  optional?: boolean;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const errorId = useId();
  return (
    <div>
      <Label htmlFor={id} count={value.trim().length} max={max} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        value={value}
        maxLength={max + 20}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={error ? fieldErrorClass : fieldClass}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function IndustryField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const errorId = useId();
  return (
    <div>
      <Label htmlFor={id} optional>
        Industry
      </Label>
      <select
        id={id}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${error ? fieldErrorClass : fieldClass} cursor-pointer`}
      >
        <option value="" className="bg-ink">
          Select an industry
        </option>
        {INDUSTRIES.map((item) => (
          <option key={item} value={item} className="bg-ink">
            {item}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function CityField({
  city,
  error,
  onChange,
}: {
  city: City;
  error?: string;
  onChange: (city: City) => void;
}) {
  const id = useId();
  const errorId = useId();
  const index = Math.max(0, CITIES.findIndex((item) => cityKey(item) === cityKey(city)));
  return (
    <div>
      <Label htmlFor={id}>City</Label>
      <select
        id={id}
        value={index}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(CITIES[Number(e.target.value)] || CITIES[0])}
        className={`${error ? fieldErrorClass : fieldClass} cursor-pointer`}
      >
        {CITIES.map((item, i) => (
          <option key={cityKey(item)} value={i} className="bg-ink">
            {item.name}, {item.country}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="mt-2 text-[12px] font-medium text-accent"
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => onChange(nearestCity(pos.coords.latitude, pos.coords.longitude)),
            () => undefined,
            { enableHighAccuracy: false, timeout: 10000 }
          );
        }}
      >
        Use my location
      </button>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function LookingForField({
  value,
  error,
  onChange,
}: {
  value: LookingFor[];
  error?: string;
  onChange: (value: LookingFor[]) => void;
}) {
  const errorId = useId();
  function toggle(item: LookingFor) {
    if (value.includes(item)) onChange(value.filter((entry) => entry !== item));
    else if (value.length < PROFILE_LIMITS.lookingFor) onChange([...value, item]);
  }
  return (
    <div>
      <Label count={value.length} max={PROFILE_LIMITS.lookingFor}>
        Looking for
      </Label>
      <div className="flex flex-wrap gap-2" role="group" aria-describedby={error ? errorId : undefined}>
        {LOOKING_FOR_OPTIONS.map((item) => {
          const on = value.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item)}
              className={`min-h-11 rounded-full border px-3.5 py-2 text-[13px] ${
                on
                  ? "border-accent/60 bg-accent/12 text-ivory"
                  : "border-white/12 text-muted hover:border-white/25 hover:text-ivory"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function BioField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const errorId = useId();
  return (
    <div>
      <Label htmlFor={id} count={value.trim().length} max={PROFILE_LIMITS.bio} optional>
        Bio
      </Label>
      <textarea
        id={id}
        value={value}
        rows={6}
        maxLength={PROFILE_LIMITS.bio + 40}
        placeholder="What you’re building, and the kind of conversation you want."
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${error ? fieldErrorClass : fieldClass} min-h-36 resize-y leading-relaxed`}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
