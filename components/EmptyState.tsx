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
    <div className="mp-reveal mp-empty relative rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-6 py-16 text-center">
      <div className="relative">
        <span className="mp-empty-mark mx-auto mb-6" aria-hidden="true" />
        <p className="text-2xl font-medium tracking-tight text-ivory sm:text-3xl">
          {title}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{body}</p>
        {(actionHref || onAction) && actionLabel && (
          <div className="mt-9">
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
      </div>
    </div>
  );
}
