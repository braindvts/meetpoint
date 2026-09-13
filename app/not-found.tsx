import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center text-ivory">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
        Interlink
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">This page isn’t here.</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        The link may be outdated. Head back to Discover, Events, or Chats.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/discover"
          className="bg-ivory px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink"
        >
          Discover
        </Link>
        <Link
          href="/events"
          className="border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory"
        >
          Events
        </Link>
        <Link
          href="/chats"
          className="border border-line px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory"
        >
          Chats
        </Link>
      </div>
    </main>
  );
}
