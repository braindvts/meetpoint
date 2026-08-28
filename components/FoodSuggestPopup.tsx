"use client";

import type { FoodSuggestion } from "@/lib/foodAi";
import { restaurantPhoto } from "@/lib/restaurantPhotos";

interface Props {
  /** Quiet hint visible — does not block the chat. */
  hintOpen: boolean;
  /** Expanded list of tables. */
  expanded: boolean;
  suggestions: FoodSuggestion[];
  onDismissHint: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onPropose: (s: FoodSuggestion) => void;
}

/**
 * Meeting / food ideas stay quiet first (slim bar), then expand on tap.
 * Avoids slamming a huge popup over the conversation.
 */
export default function FoodSuggestPopup({
  hintOpen,
  expanded,
  suggestions,
  onDismissHint,
  onExpand,
  onCollapse,
  onPropose,
}: Props) {
  if ((!hintOpen && !expanded) || suggestions.length === 0) return null;

  return (
    <>
      {/* Noticeable card at top — still doesn't cover the whole chat */}
      {hintOpen && !expanded && (
        <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex justify-center px-3 pt-2 sm:top-20 sm:pt-3">
          <div className="mp-modal-in pointer-events-auto w-full max-w-md border border-accent/40 bg-[#1c1c1e] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-2">
                  Conclave AI
                </p>
                <p className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ivory">
                  Ready to pick a table?
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted">
                  {suggestions.length} Michelin / five-star spots near you
                  {suggestions[0] ? ` — including ${suggestions[0].restaurant.name}` : ""}.
                </p>
              </div>
              <button
                type="button"
                onClick={onDismissHint}
                className="shrink-0 text-[14px] text-muted transition hover:text-ivory"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              onClick={onExpand}
              className="mp-btn-lux mt-4 w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink hover:brightness-110"
            >
              See table ideas
            </button>
          </div>
        </div>
      )}

      {/* Compact sheet — only after they ask to view */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Meeting spot suggestions"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55 [-webkit-tap-highlight-color:transparent]"
            aria-label="Dismiss"
            onClick={onCollapse}
          />
          <div
            className="relative z-10 max-h-[70dvh] w-full max-w-md overflow-hidden rounded-t-[18px] border border-white/12 border-b-0 bg-[#1c1c1e] sm:rounded-[20px] sm:border-b"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
              <span className="h-1 w-9 rounded-full bg-white/30" />
            </div>
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Conclave AI
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-white">
                  Tables nearby
                </h2>
                <p className="mt-0.5 text-[11px] text-white/50">
                  Propose one — everyone agrees, then $5/person to book.
                </p>
              </div>
              <button
                type="button"
                onClick={onCollapse}
                className="text-[12px] text-white/50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mp-scroll max-h-[52dvh] space-y-3 px-4 pb-4">
              {suggestions.map((s) => (
                <div
                  key={s.restaurant.id}
                  className="overflow-hidden border border-white/10 bg-white/[0.03]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={restaurantPhoto(s.restaurant)}
                      alt={s.restaurant.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 to-transparent"
                      aria-hidden
                    />
                    <p className="absolute bottom-2 left-3 right-3 truncate font-display text-lg font-semibold text-white">
                      {s.restaurant.name}
                    </p>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                        {s.restaurant.cuisine}
                      </p>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        $$$$$
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/45">{s.reason}</p>
                    <p className="mt-1 font-display text-[12px] italic text-white/55">
                      “{s.restaurant.vibe}”
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onPropose(s);
                        onCollapse();
                        onDismissHint();
                      }}
                      className="mt-2.5 w-full rounded-full bg-gradient-to-b from-accent-2 to-accent py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink"
                    >
                      Propose table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
