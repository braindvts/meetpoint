"use client";

import Avatar from "@/components/Avatar";
import type { Person } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  people: Person[];
  onMessage: (person: Person) => void;
};

/**
 * Interlinks — everyone you’re connected to, as PFPs + Message.
 * Opens a DM only when the user taps Message (or the avatar).
 */
export default function InterlinksSheet({ open, onClose, people, onMessage }: Props) {
  if (!open) return null;

  const count = people.length;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interlinks-title"
        className="relative z-[1] flex max-h-[min(88dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-accent/20 bg-[#12110f] sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-line/50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="interlinks-title" className="text-lg font-medium tracking-tight text-ivory">
                Interlinks
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                {count === 0
                  ? "No connections yet"
                  : `${count} connection${count === 1 ? "" : "s"} · tap Message to open a chat`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] font-medium text-muted hover:text-ivory"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {count === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-muted">
              Accept people in Circle or connect from Discover — they’ll show up here.
            </p>
          ) : (
            <ul className="space-y-1">
              {people.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => onMessage(p)}
                    className="shrink-0 rounded-[12px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    aria-label={`Message ${p.name}`}
                  >
                    <Avatar
                      src={p.photoUrl}
                      name={p.name}
                      sizeCls="h-12 w-12"
                      rounded="rounded-[12px]"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ivory">{p.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {p.jobTitle}
                      {p.city?.name ? ` · ${p.city.name}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMessage(p)}
                    className="shrink-0 rounded-lg border border-accent/35 px-3 py-2 text-[11px] font-semibold text-accent transition hover:border-accent/60 hover:bg-accent/10"
                  >
                    Message
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
