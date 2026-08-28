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
    <div className="mp-reveal relative overflow-hidden rounded-2xl border border-accent/15 bg-[#12110f] px-6 py-16 text-center">
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,196,168,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        <span className="mx-auto mb-6 block h-px w-12 bg-accent/50" />
        <p className="text-2xl font-medium tracking-tight text-ivory sm:text-3xl">
          {title}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{body}</p>
        {(actionHref || onAction) && actionLabel && (
          <div className="mt-9">
            {actionHref ? (
              <Link
                href={actionHref}
                className="mp-btn-lux inline-flex rounded-xl bg-gradient-to-b from-accent-2 to-accent px-9 py-3.5 text-[12px] font-semibold text-ink"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="mp-btn-lux inline-flex rounded-xl bg-gradient-to-b from-accent-2 to-accent px-9 py-3.5 text-[12px] font-semibold text-ink"
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
