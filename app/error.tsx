"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[conclave]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center text-ivory">
      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">The room had a fault.</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        Try again. If it keeps happening, refresh or re-enter from login.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-gradient-to-b from-accent-2 to-accent px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
        >
          Try again
        </button>
        <Link
          href="/discover"
          className="border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory"
        >
          The Room
        </Link>
      </div>
    </main>
  );
}
