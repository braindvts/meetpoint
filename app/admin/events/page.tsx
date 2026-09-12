"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  EVENT_INDUSTRIES,
  type EventCategory,
  type EventFormat,
  type EventIndustry,
  type InterlinkEvent,
} from "@/lib/events";
import {
  deleteEvent,
  listAllEvents,
  slugify,
  togglePublished,
  upsertEvent,
} from "@/lib/eventStore";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];
const FORMATS: EventFormat[] = ["in-person", "online", "hybrid"];

const emptyForm = (): Partial<InterlinkEvent> => ({
  kind: "event",
  name: "",
  shortDescription: "",
  description: "",
  category: "networking",
  industry: "Business",
  format: "in-person",
  startsAt: "",
  endsAt: "",
  venue: "",
  city: "",
  country: "USA",
  address: "",
  image:
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80&auto=format&fit=crop",
  organizer: "Interlink Hosts",
  organizerTitle: "",
  registrationUrl: "",
  expectedAttendance: undefined,
  interestedCount: 0,
  attendeeCount: 0,
  attendeeIds: [],
  featured: false,
  exclusive: false,
  published: true,
  speakers: [],
  companies: [],
});

const field =
  "w-full rounded-lg border border-accent/20 bg-ink/60 px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent/45";

/** Local admin CRUD for events — unlock with ADMIN_SECRET (same as other admin tools). */
export default function AdminEventsPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [events, setEvents] = useState<InterlinkEvent[]>([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InterlinkEvent>>(emptyForm());
  const [speakersText, setSpeakersText] = useState("");
  const [companiesText, setCompaniesText] = useState("");

  const refresh = useCallback(() => {
    setEvents(
      [...listAllEvents()].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
    );
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    refresh();
    const onEvt = () => refresh();
    window.addEventListener("meetpoint:events", onEvt);
    return () => window.removeEventListener("meetpoint:events", onEvt);
  }, [unlocked, refresh]);

  async function unlock() {
    setMessage("");
    if (!secret.trim()) {
      setMessage("Enter ADMIN_SECRET");
      return;
    }
    // Soft check against reports API — same secret gate as other admin pages
    try {
      const res = await fetch("/api/report?status=open", {
        headers: { Authorization: `Bearer ${secret.trim()}` },
      });
      if (res.status === 401) {
        setMessage("Unauthorized — check ADMIN_SECRET");
        return;
      }
      if (res.status === 503) {
        setMessage(
          "ADMIN_SECRET not set on server. Local edit mode enabled for this browser only."
        );
      }
      setUnlocked(true);
      refresh();
    } catch {
      setMessage("Could not reach server — enabling local edit mode.");
      setUnlocked(true);
      refresh();
    }
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setSpeakersText("");
    setCompaniesText("");
  }

  function startEdit(e: InterlinkEvent) {
    setEditingId(e.id);
    setForm({ ...e });
    setSpeakersText((e.speakers || []).join(", "));
    setCompaniesText((e.companies || []).join(", "));
  }

  function save() {
    if (!form.name?.trim()) {
      setMessage("Name is required");
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      setMessage("Start and end times are required");
      return;
    }
    const id =
      editingId ||
      `evt-${slugify(form.name)}-${Date.now().toString(36).slice(-4)}`;
    const slug = form.slug || slugify(form.name);
    const event: InterlinkEvent = {
      id,
      slug,
      kind: form.kind === "convention" ? "convention" : "event",
      name: form.name.trim(),
      shortDescription: (form.shortDescription || "").trim(),
      description: (form.description || "").trim(),
      category: (form.category || "networking") as EventCategory,
      industry: (form.industry || "Business") as EventIndustry,
      format: (form.format || "in-person") as EventFormat,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      venue: (form.venue || "").trim(),
      city: (form.city || "").trim(),
      country: (form.country || "USA").trim(),
      address: form.address?.trim() || undefined,
      image:
        form.image?.trim() ||
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80&auto=format&fit=crop",
      organizer: (form.organizer || "Interlink Hosts").trim(),
      organizerTitle: form.organizerTitle?.trim() || undefined,
      registrationUrl: form.registrationUrl?.trim() || undefined,
      expectedAttendance: form.expectedAttendance
        ? Number(form.expectedAttendance)
        : undefined,
      interestedCount: Number(form.interestedCount || 0),
      attendeeCount: Number(form.attendeeCount || 0),
      attendeeIds: form.attendeeIds || [],
      featured: !!form.featured,
      exclusive: !!form.exclusive || form.category === "exclusive",
      published: form.published !== false,
      speakers: speakersText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      companies: companiesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    upsertEvent(event);
    setMessage(editingId ? "Event updated" : "Event created");
    startCreate();
    refresh();
  }

  if (!unlocked) {
    return (
      <main className="mx-auto max-w-md space-y-6 px-4 py-16">
        <Link href="/admin/reports" className="text-[12px] text-muted hover:text-accent">
          ← Admin
        </Link>
        <h1 className="text-2xl font-medium text-ivory">Events admin</h1>
        <p className="text-sm text-muted">
          Unlock with the same ADMIN_SECRET used for reports and BLACK grants.
          Edits are stored in this browser until a server API is wired.
        </p>
        <input
          type="password"
          className={field}
          placeholder="ADMIN_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void unlock()}
          className="mp-btn-lux w-full rounded-lg bg-ivory py-3 text-[12px] font-semibold text-ink"
        >
          Unlock
        </button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/events" className="text-[12px] text-muted hover:text-accent">
            ← Events
          </Link>
          <h1 className="mt-2 text-2xl font-medium text-ivory">Manage events</h1>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg border border-accent/30 px-4 py-2 text-[12px] font-medium text-accent"
        >
          New event
        </button>
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <section className="space-y-3 rounded-md border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
        <h2 className="text-lg font-medium text-ivory">
          {editingId ? "Edit event" : "Create event"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Name
            </span>
            <input
              className={field}
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Short description
            </span>
            <input
              className={field}
              value={form.shortDescription || ""}
              onChange={(e) =>
                setForm({ ...form, shortDescription: e.target.value })
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Description
            </span>
            <textarea
              className={`${field} min-h-[100px]`}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Category
            </span>
            <select
              className={field}
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as EventCategory })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Industry
            </span>
            <select
              className={field}
              value={form.industry}
              onChange={(e) =>
                setForm({ ...form, industry: e.target.value as EventIndustry })
              }
            >
              {EVENT_INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Type
            </span>
            <select
              className={field}
              value={form.kind}
              onChange={(e) =>
                setForm({
                  ...form,
                  kind: e.target.value as "event" | "convention",
                })
              }
            >
              <option value="event">Event</option>
              <option value="convention">Convention</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Format
            </span>
            <select
              className={field}
              value={form.format}
              onChange={(e) =>
                setForm({ ...form, format: e.target.value as EventFormat })
              }
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Starts
            </span>
            <input
              type="datetime-local"
              className={field}
              value={toLocalInput(form.startsAt)}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Ends
            </span>
            <input
              type="datetime-local"
              className={field}
              value={toLocalInput(form.endsAt)}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Venue
            </span>
            <input
              className={field}
              value={form.venue || ""}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              City
            </span>
            <input
              className={field}
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Image URL
            </span>
            <input
              className={field}
              value={form.image || ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Organizer
            </span>
            <input
              className={field}
              value={form.organizer || ""}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Registration URL
            </span>
            <input
              className={field}
              value={form.registrationUrl || ""}
              onChange={(e) =>
                setForm({ ...form, registrationUrl: e.target.value })
              }
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Speakers (comma-separated)
            </span>
            <input
              className={field}
              value={speakersText}
              onChange={(e) => setSpeakersText(e.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Companies (comma-separated)
            </span>
            <input
              className={field}
              value={companiesText}
              onChange={(e) => setCompaniesText(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ivory">
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ivory">
            <input
              type="checkbox"
              checked={form.published !== false}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          className="mp-btn-lux mt-2 rounded-lg bg-ivory px-6 py-3 text-[12px] font-semibold text-ink"
        >
          {editingId ? "Save changes" : "Create event"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-ivory">All events</h2>
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-2 rounded-xl border border-accent/15 bg-[#12110f] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ivory">{e.name}</p>
                <p className="text-[12px] text-muted">
                  {e.city} · {CATEGORY_LABEL[e.category]} ·{" "}
                  {e.published === false ? "Unpublished" : "Live"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-accent/25 px-3 py-1.5 text-[11px] text-ivory"
                  onClick={() => startEdit(e)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-accent/25 px-3 py-1.5 text-[11px] text-ivory"
                  onClick={() => {
                    togglePublished(e.id, e.published === false);
                    refresh();
                  }}
                >
                  {e.published === false ? "Publish" : "Unpublish"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] text-red-300/90"
                  onClick={() => {
                    if (confirm(`Delete “${e.name}”?`)) {
                      deleteEvent(e.id);
                      refresh();
                    }
                  }}
                >
                  Delete
                </button>
                <Link
                  href={`/events/${e.slug}`}
                  className="rounded-lg border border-accent/25 px-3 py-1.5 text-[11px] text-accent"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // already local datetime-local string
    return iso.length === 16 ? iso : "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
