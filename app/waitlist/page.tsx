import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";
import Wordmark from "@/components/Wordmark";
import { BRAND, BRAND_LINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Waitlist · ${BRAND}`,
  description: `Request access to ${BRAND} — ${BRAND_LINE}`,
};

export default function WaitlistPage() {
  return (
    <main className="mp-site overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark href="/" size="sm" />
          <Link href="/login" className="il-press text-[13px] text-muted transition hover:text-ivory">
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100dvh-8rem)] flex-col justify-center px-6 pb-20 pt-28">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute left-1/2 top-[38%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-md text-center">
          <p className="il-kicker">{BRAND}</p>
          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ivory">
            Join the waitlist
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ivory/70">
            Leave your email. We’ll write when a seat opens.
          </p>
          <div className="mt-10 text-left">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-10 text-center text-[12px] text-muted">
        {BRAND} · Private introductions for ambitious people
      </footer>
    </main>
  );
}
