"use client";

import {
  EVENT_CATEGORIES,
  EVENT_INDUSTRIES,
  type EventCategory,
  type EventDateWindow,
  type EventFilters,
  type EventFormat,
  type EventIndustry,
} from "@/lib/events";

type Props = {
  value: EventFilters;
  onChange: (next: EventFilters) => void;
};

const FORMATS: { id: EventFormat | "all"; label: string }[] = [
  { id: "all", label: "Any format" },
  { id: "in-person", label: "In-person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
];

const KINDS: { id: "all" | "event" | "convention"; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "event", label: "Events" },
  { id: "convention", label: "Conventions" },
];

const DATES: { id: EventDateWindow; label: string }[] = [
  { id: "all", label: "Any date" },
  { id: "week", label: "Next 7 days" },
  { id: "month", label: "Next 30 days" },
  { id: "quarter", label: "Next 90 days" },
];

const field =
  "w-full rounded-sm border border-accent/20 bg-ink/60 px-3 py-2.5 text-sm text-ivory outline-none transition placeholder:text-muted/60 focus:border-accent/45";

export default function EventFiltersBar({ value, onChange }: Props) {
  const set = (patch: Partial<EventFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-[#0a0a0a]/80 p-3 sm:p-4">
      <label className="block">
        <span className="sr-only">Search events</span>
        <input
          type="search"
          value={value.query || ""}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search events, conventions, industries, or locations..."
          className={field}
        />
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <select
          aria-label="Category"
          className={field}
          value={value.category || "all"}
          onChange={(e) =>
            set({ category: e.target.value as EventCategory | "all" })
          }
        >
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Industry"
          className={field}
          value={value.industry || "all"}
          onChange={(e) =>
            set({ industry: e.target.value as EventIndustry | "all" })
          }
        >
          <option value="all">All industries</option>
          {EVENT_INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select
          aria-label="Location"
          className={field}
          value={value.city || ""}
          onChange={(e) => set({ city: e.target.value })}
        >
          <option value="">Any location</option>
          {[
            "New York",
            "San Francisco",
            "London",
            "Miami",
            "Boston",
            "Chicago",
            "Austin",
            "Paris",
            "Dubai",
            "Washington",
            "Online",
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Date"
          className={field}
          value={value.dateWindow || "all"}
          onChange={(e) =>
            set({ dateWindow: e.target.value as EventDateWindow })
          }
        >
          {DATES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Format"
          className={field}
          value={value.format || "all"}
          onChange={(e) =>
            set({ format: e.target.value as EventFormat | "all" })
          }
        >
          {FORMATS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Event type"
          className={field}
          value={value.kind || "all"}
          onChange={(e) =>
            set({ kind: e.target.value as "all" | "event" | "convention" })
          }
        >
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
