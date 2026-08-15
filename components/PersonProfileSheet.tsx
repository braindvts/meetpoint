"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import { getPeerReputation } from "@/lib/store";
import { tierForPerson } from "@/lib/tiers";
import type { ConnectionStatus, Person, WorkKind } from "@/lib/types";

interface Props {
  person: Person | null;
  open: boolean;
  onClose: () => void;
  status?: ConnectionStatus;
  canConnect?: boolean;
  onConnect?: (peerId: string) => void;
  onNeedPremier?: (peerId: string) => void;
  /** When set, shows Edit profile instead of Introduce (self preview). */
  editHref?: string;
  /** Small label above the name area, e.g. “How others see you”. */
  eyebrow?: string;
}

const WORK_LABEL: Record<WorkKind, string> = {
  company: "Company",
  app: "App",
  product: "Product",
  website: "Website",
  content: "Content",
  portfolio: "Portfolio",
  project: "Project",
};

const DISMISS_PX = 100;

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function PersonProfileSheet({
  person,
  open,
  onClose,
  status,
  canConnect = true,
  onConnect,
  onNeedPremier,
  editHref,
  eyebrow,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const lastY = useRef(0);
  const active = useRef(false);

  const tier = useMemo(() => {
    if (!person) return null;
    return tierForPerson(person, getPeerReputation(person.id));
  }, [person]);

  useEffect(() => {
    if (!open) return;
    active.current = false;
    // Reset scroll when opening another profile
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("mp-sheet-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("mp-sheet-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, person?.id]);

  function onHandlePointerDown(e: React.PointerEvent) {
    active.current = true;
    startY.current = e.clientY;
    lastY.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!active.current || !sheetRef.current) return;
    const delta = Math.max(0, e.clientY - startY.current);
    lastY.current = delta;
    sheetRef.current.style.transform = `translate3d(0,${delta}px,0)`;
  }

  function onHandlePointerUp() {
    if (!active.current || !sheetRef.current) return;
    active.current = false;
    const el = sheetRef.current;
    const delta = lastY.current;
    if (delta > DISMISS_PX) {
      el.style.transition = "transform 0.18s ease-in";
      el.style.transform = "translate3d(0,100%,0)";
      window.setTimeout(onClose, 180);
    } else {
      el.style.transition = "transform 0.18s ease-out";
      el.style.transform = "translate3d(0,0,0)";
      window.setTimeout(() => {
        if (el) el.style.transition = "";
      }, 180);
    }
  }

  if (!open || !person) return null;

  const elite = tier === 4;
  const work = person.work ?? [];
  const travelLabel =
    person.travel === "local"
      ? "Near me"
      : person.travel === "country"
        ? "Within country"
        : "Worldwide";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${person.name} profile`}
    >
      <button
        type="button"
        className={`mp-backdrop-in absolute inset-0 [-webkit-tap-highlight-color:transparent] ${
          elite ? "bg-black/80" : "bg-black/70"
        }`}
        aria-label="Dismiss"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="mp-modal-in relative z-10 flex h-[92dvh] w-full max-w-none flex-col sm:h-auto sm:max-h-[88dvh] sm:max-w-[440px] sm:px-4 sm:pb-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[20px] border border-b-0 sm:rounded-[24px] sm:border-b ${
            elite
              ? "elite-profile-shell elite-centurion border-white/20"
              : "border-white/10 bg-[#141414]"
          }`}
        >
          {elite && <span className="elite-sheen" aria-hidden />}

          {/* Drag handle only — does not cover the photo / block scroll */}
          <div
            className="absolute inset-x-0 top-0 z-20 flex h-11 touch-none items-start justify-center pt-2.5 sm:hidden"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            aria-label="Swipe down to close"
          >
            <span className="h-1 w-10 rounded-full bg-white/70 shadow-sm" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 rounded-full bg-black/55 px-3 py-1 text-[12px] text-white/90 sm:right-4 sm:top-4"
          >
            Close
          </button>

          {/* ONE scroll: photo scrolls away with the rest of the profile */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            <div className="relative aspect-[4/5] max-h-[48dvh] w-full bg-black sm:max-h-[380px]">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className={`pointer-events-none h-full w-full object-cover object-top select-none ${
                    elite ? "contrast-[1.05] saturate-[0.9]" : ""
                  }`}
                  draggable={false}
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <Avatar src={undefined} name={person.name} sizeCls="h-28 w-28" />
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-4 pb-4 pt-20"
                aria-hidden
              />
              {elite && (
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.12)_0%,transparent_30%,transparent_62%,rgba(255,255,255,0.05)_100%)]"
                  aria-hidden
                />
              )}
              <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
                {elite && (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Centurion · Top of the room
                  </p>
                )}
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  {person.name}
                </h2>
                <p className="mt-1 text-[13px] font-medium text-white/75">
                  {person.jobTitle}
                </p>
                <div className="mt-2">
                  <TierBadge tier={tier} size="md" />
                </div>
              </div>
            </div>

            <div className={`px-4 pb-6 pt-4 sm:px-5 ${elite ? "bg-black" : ""}`}>
              <p className="text-[14px] leading-relaxed text-white/75">
                {person.bio}
              </p>

              <p className="mt-3 text-[11px] text-white/45">
                {person.city.name}, {person.city.country}
                <span className="mx-1.5 text-white/25">·</span>
                Travels {travelLabel.toLowerCase()}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {person.lookingFor.map((t) => (
                  <span
                    key={t}
                    className="border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80"
                  >
                    Seeks {t}
                  </span>
                ))}
                {person.ideaTags.map((t) => (
                  <span
                    key={t}
                    className="border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
                Links
              </p>
              <div className="mt-2 space-y-1.5">
                {person.linkedInUrl && (
                  <a
                    href={person.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border border-[#0a66c2]/40 bg-[#0a66c2]/10 px-3 py-2.5 text-[13px] text-white"
                  >
                    <span className="font-semibold">LinkedIn</span>
                    <span className="truncate text-[11px] text-white/50">
                      {hostLabel(person.linkedInUrl)}
                    </span>
                  </a>
                )}
                {person.websiteUrl && (
                  <a
                    href={person.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border border-white/12 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white"
                  >
                    <span className="font-semibold">Website</span>
                    <span className="truncate text-[11px] text-white/50">
                      {hostLabel(person.websiteUrl)}
                    </span>
                  </a>
                )}
                {person.portfolioUrl && (
                  <a
                    href={person.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border border-white/12 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white"
                  >
                    <span className="font-semibold">Portfolio</span>
                    <span className="truncate text-[11px] text-white/50">
                      {hostLabel(person.portfolioUrl)}
                    </span>
                  </a>
                )}
                {!person.linkedInUrl && !person.websiteUrl && !person.portfolioUrl && (
                  <p className="text-[12px] text-white/40">No public links yet.</p>
                )}
              </div>

              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40">
                Work & projects
              </p>
              {work.length === 0 ? (
                <p className="mt-2 text-[12px] text-white/40">No work listed yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {work.map((w) => {
                    const inner = (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
                            {WORK_LABEL[w.kind]}
                          </span>
                          {w.url ? (
                            <span className="text-[10px] text-white/55">Open ↗</span>
                          ) : null}
                        </div>
                        <p className="mt-1 font-display text-lg font-semibold text-white">
                          {w.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-white/55">
                          {w.description}
                        </p>
                      </>
                    );
                    return w.url ? (
                      <a
                        key={`${w.title}-${w.kind}`}
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-white/12 bg-white/[0.03] px-3 py-2.5"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        key={`${w.title}-${w.kind}`}
                        className="border border-white/10 bg-white/[0.02] px-3 py-2.5"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {editHref ? (
            <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">
              {eyebrow && (
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  {eyebrow}
                </p>
              )}
              <Link
                href={editHref}
                onClick={onClose}
                className="block w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
              >
                Edit profile
              </Link>
            </div>
          ) : onConnect ? (
            <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">
              {status === "connected" ? (
                <p className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  Already introduced
                </p>
              ) : status === "requested" ? (
                <p className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Waiting for them to accept…
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!canConnect) {
                      onNeedPremier?.(person.id);
                      onClose();
                      return;
                    }
                    onConnect(person.id);
                    onClose();
                  }}
                  className={`w-full rounded-full py-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    canConnect
                      ? "bg-gradient-to-b from-accent-2 to-accent text-ink"
                      : "border border-accent/40 text-accent-2"
                  }`}
                >
                  {canConnect ? "Introduce" : "Premier · Introduce"}
                </button>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 text-[11px] font-medium text-white/40 transition hover:text-white/70"
                  onClick={async () => {
                    const reason = window.prompt("Why are you reporting this member?");
                    if (!reason?.trim()) return;
                    try {
                      await fetch("/api/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ peerId: person.id, reason }),
                      });
                      window.dispatchEvent(
                        new CustomEvent("meetpoint:toast", {
                          detail: { message: "Report received. Thank you." },
                        })
                      );
                    } catch {
                      /* ignore */
                    }
                    onClose();
                  }}
                >
                  Report
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 text-[11px] font-medium text-red-400/70 transition hover:text-red-300"
                  onClick={() => {
                    if (!confirm(`Block ${person.name}? They’ll be removed from your room.`)) {
                      return;
                    }
                    void import("@/lib/store").then(({ blockPeer }) => {
                      blockPeer(person.id);
                      window.dispatchEvent(
                        new CustomEvent("meetpoint:toast", {
                          detail: { message: `${person.name.split(" ")[0]} blocked.` },
                        })
                      );
                      onClose();
                    });
                  }}
                >
                  Block
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
