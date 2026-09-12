"use client";

import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import { createChat, findChatByMembers } from "@/lib/store";
import type { Person } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Connected people available for a group */
  people: Person[];
  onCreated: (chatId: string) => void;
};

/**
 * Create a group chat with people you’re already connected to.
 * Requires two or more members — 1:1 chats start from Chat on a profile/card.
 */
export default function NewChatSheet({ open, onClose, people, onCreated }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const hay = [p.name, p.jobTitle, p.city?.name].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [people, query]);

  if (!open) return null;

  function toggle(id: string) {
    setError("");
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function resetAndClose() {
    setSelected([]);
    setName("");
    setQuery("");
    setError("");
    onClose();
  }

  function start() {
    if (selected.length < 2) {
      setError("Pick at least two people you know to start a group.");
      return;
    }

    const existing = findChatByMembers(selected);
    if (existing) {
      resetAndClose();
      onCreated(existing.id);
      return;
    }

    const members = selected
      .map((id) => people.find((p) => p.id === id))
      .filter(Boolean) as Person[];
    const autoName =
      name.trim() ||
      members
        .slice(0, 3)
        .map((p) => p.name.split(" ")[0])
        .join(", ") + (members.length > 3 ? ` +${members.length - 3}` : "");

    const chat = createChat(autoName, selected);
    resetAndClose();
    onCreated(chat.id);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={resetAndClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-group-title"
        className="relative z-[1] flex max-h-[min(88dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-accent/20 bg-[#12110f] sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-line/50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="new-group-title" className="text-lg font-medium tracking-tight text-ivory">
                New group
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Choose people you’re connected to — two or more.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="text-[12px] font-medium text-muted hover:text-ivory"
            >
              Close
            </button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Search connections</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people you know…"
              className="w-full rounded-sm border border-accent/20 bg-ink/60 px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-muted/60 focus:border-accent/45"
            />
          </label>
          <label className="mt-2 block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Group name (optional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Founders dinner"
              className="w-full rounded-sm border border-accent/20 bg-ink/60 px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-muted/60 focus:border-accent/45"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {people.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">
              Connect with people in Discover first — then start a group with them here.
            </p>
          ) : people.length < 2 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">
              You need at least two connections to create a group. Add more in Discover, or press
              Chat on someone’s profile for a 1:1.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted">No matches.</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        on ? "bg-accent/15 ring-1 ring-accent/35" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <Avatar
                        src={p.photoUrl}
                        name={p.name}
                        sizeCls="h-10 w-10"
                        rounded="rounded-[11px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ivory">{p.name}</p>
                        <p className="truncate text-[12px] text-muted">
                          {p.jobTitle}
                          {p.city?.name ? ` · ${p.city.name}` : ""}
                        </p>
                      </div>
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] ${
                          on
                            ? "border-accent bg-accent text-ink"
                            : "border-line text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-line/50 px-5 py-4">
          {error ? <p className="mb-2 text-[12px] text-red-300/90">{error}</p> : null}
          <button
            type="button"
            onClick={start}
            disabled={selected.length < 2}
            className="mp-btn-lux w-full rounded-sm bg-ivory py-3 text-[12px] font-semibold text-ink disabled:opacity-40"
          >
            {selected.length < 2
              ? "Select 2+ people"
              : `Create group · ${selected.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}
