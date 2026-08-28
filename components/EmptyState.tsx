"use client";

import Link from "next/link";

interface Props {
  title: string;
  body: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="mp-reveal mp-frame mp-card-poster relative overflow-hidden px-6 py-16 text-center sm:py-20">
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,196,168,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        <span className="mx-auto mb-6 block h-px w-12 bg-accent/50" />
        <p className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
          {title}
          <span className="italic text-accent">.</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{body}</p>
        {(actionHref || onAction) && actionLabel && (
          <div className="mt-9">
            {actionHref ? (
              <Link
                href={actionHref}
                className="mp-btn-lux inline-flex bg-gradient-to-b from-accent-2 to-accent px-9 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="mp-btn-lux inline-flex bg-gradient-to-b from-accent-2 to-accent px-9 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
