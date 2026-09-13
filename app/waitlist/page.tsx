import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Waitlist · Conclave",
  description: "Request access to Conclave — the private network for ambitious people.",
};

export default function WaitlistPage() {
  return (
    <main className="mp-site">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent"
        >
          Conclave
        </Link>
        <Link href="/login" className="text-[13px] text-muted transition hover:text-ivory">
          Sign in
        </Link>
      </header>

      <section className="relative flex min-h-[calc(100dvh-8rem)] flex-col justify-center px-6 pb-20 pt-8">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute left-1/2 top-[38%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-md text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            Private access
          </p>
          <h1 className="mt-5 text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-ivory">
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

      <footer className="border-t border-line/50 px-6 py-8 text-center text-[11px] text-muted">
        Conclave · Private introductions for ambitious people
      </footer>
    </main>
  );
}
