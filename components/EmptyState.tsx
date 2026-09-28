"use client";

import Link from "next/link";

interface Props {
  title: string;
  body: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false,
}: Props) {
  return (
    <div
      className={`mp-reveal mp-empty relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] text-center ${
        compact ? "px-4 py-8" : "px-6 py-16"
      }`}
    >
      <div className="relative">
        <span className="mp-empty-mark mx-auto mb-6" aria-hidden="true" />
        <p className={`font-medium tracking-tight text-ivory ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>
          {title}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{body}</p>
        {(actionHref || onAction) && actionLabel && (
          <div className={compact ? "mt-6" : "mt-9"}>
            {actionHref ? (
              <Link
                href={actionHref}
                className="mp-btn-lux inline-flex px-8 py-3 text-[12px] font-semibold"
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="mp-btn-lux inline-flex px-8 py-3 text-[12px] font-semibold"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            className="mt-4 text-[12px] font-medium text-muted underline decoration-white/15 underline-offset-4 hover:text-ivory"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
