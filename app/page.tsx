import type { Metadata } from "next";
import Link from "next/link";
import BlackBadge from "@/components/BlackBadge";
import DemoEnterButton from "@/components/DemoEnterButton";
import SponsorLockup from "@/components/SponsorLockup";
import TierBadge from "@/components/TierBadge";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    n: "01",
    title: "Show up as yourself",
    copy: "Identity is enough to enter — photo, name, role, ambitions. Verification waits until you want it.",
  },
  {
    n: "02",
    title: "Get introduced with intent",
    copy: "Discover ranks people by overlap, not a feed. Nearby when you want it. Events when a room is the better match.",
  },
  {
    n: "03",
    title: "Settle it over dinner",
    copy: "Private chat, a proposed table, a real seat. The network is the introduction. The product is the meal.",
  },
];

const STANDING = [
  {
    tier: 1 as const,
    name: "Member",
    copy: "Identity on file. Meet other Members. Skip credentials and stay here — that’s correct.",
  },
  {
    tier: 2 as const,
    name: "Verified",
    copy: "Business email and LinkedIn when you’re ready. The checkmarks stay checks.",
  },
  {
    tier: 3 as const,
    name: "BLACK",
    copy: "Paid or earned. Meet anyone. Peer invites never grant this — only BLACK CONNECTION.",
  },
];

/**
 * Browser marketing site — website first.
 * Native app can wrap this same site later; do not shrink it back into a phone frame.
 */
export default function Landing() {
  return (
    <main className="mp-site overflow-x-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
          Interlink
        </p>
        <div className="flex items-center gap-5">
          <Link href="/login" className="mp-press text-[13px] text-muted hover:text-ivory">
            Sign in
          </Link>
          <Link href="/login" className="mp-btn-lux px-4 py-2 text-[12px] font-semibold tracking-wide">
            Enter
          </Link>
        </div>
      </header>

      <section className="relative isolate flex min-h-[calc(100dvh-4.5rem)] flex-col justify-center px-6 pb-20 pt-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="mp-site-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_38%_36%,rgba(196,180,150,0.07),transparent_52%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <p className="mp-reveal text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Private introductions
            </p>
            <h1 className="mp-reveal mp-reveal-delay-1 mt-5 text-[clamp(2.6rem,7vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.03em] text-ivory">
              Ambition,
              <span className="block text-accent">then a table.</span>
            </h1>
            <p className="mp-reveal mp-reveal-delay-2 mt-6 max-w-md text-[1.05rem] leading-relaxed text-ivory/70">
              Interlink is a private network for professional introductions — people
              matched by what they’re building, then a real meeting over dinner. A
              room, not a feed.
            </p>
            <div className="mp-reveal mp-reveal-delay-3 mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="mp-btn-lux inline-flex min-w-[11.5rem] items-center justify-center px-8 py-3.5 text-[12px] font-semibold tracking-wide"
              >
                Enter the room
              </Link>
              <Link
                href="/login"
                className="mp-press inline-flex min-w-[11.5rem] items-center justify-center border border-ivory/35 px-8 py-3.5 text-[12px] font-medium tracking-wide text-ivory hover:border-accent/55 hover:text-accent"
              >
                Sign in
              </Link>
            </div>
            {demoEntryEnabled() && (
              <div className="mp-reveal mp-reveal-delay-3 mt-5">
                <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
              </div>
            )}
            <p className="mp-reveal mp-reveal-delay-4 mt-8 text-[11px] tracking-wide text-muted">
              Website first · Native app when you’re ready
            </p>
            <SponsorLockup className="mp-reveal mp-reveal-delay-4 mt-8" />
          </div>

          <aside className="mp-reveal mp-reveal-delay-2 mp-landing-frame hidden px-8 py-9 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-muted">
              The room
            </p>
            <ul className="mt-8 space-y-6">
              {STANDING.map((level) => (
                <li key={level.name} className="border-t border-white/[0.08] pt-5 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-2.5">
                    {level.tier === 3 ? (
                      <>
                        <BlackBadge size="sm" />
                        <span className="mp-level mp-level--black">BLACK</span>
                      </>
                    ) : (
                      <TierBadge tier={level.tier} size="sm" />
                    )}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ivory/62">{level.copy}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-[12px] tracking-wide text-accent/80">
              Introductions that end at dinner.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            How it works
          </p>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            Match in the browser. Meet at dinner.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Interlink makes the introduction. The table is where the business happens.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-accent/80">
                  {step.n}
                </p>
                <h3 className="mt-3 text-[1.15rem] font-semibold tracking-tight text-ivory">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Events &amp; conventions
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
              Nearby rooms. Global stages.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Professional dinners, conferences, and conventions in your city — or
              across the world. Interlink shows who will be in the room before you walk in.
            </p>
            <Link
              href="/login"
              className="mp-press mt-8 inline-flex border border-accent/30 px-6 py-3 text-[12px] font-medium tracking-wide text-accent hover:bg-accent/5"
            >
              Sign in to browse Events
            </Link>
          </div>
          <div className="mp-landing-frame px-7 py-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              On the calendar
            </p>
            <p className="mt-4 text-xl font-semibold tracking-tight text-ivory">
              Founders’ Table — Midtown
            </p>
            <p className="mt-2 text-[13px] text-ivory/65">
              Twelve seats. No decks. Serious operators only.
            </p>
            <p className="mt-6 text-[12px] text-muted">
              New York · The Modern · October
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            Standing
          </p>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            Three ways to be in the room on Interlink. Not a ladder.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STANDING.map((level) => (
              <div key={level.name} className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2.5">
                  {level.tier === 3 ? (
                    <>
                      <BlackBadge size="sm" />
                      <span className="mp-level mp-level--black">BLACK</span>
                    </>
                  ) : (
                    <TierBadge tier={level.tier} size="md" />
                  )}
                </div>
                <p className="mt-4 text-[15px] font-semibold tracking-tight text-ivory">
                  {level.name}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{level.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h2 className="text-xl font-semibold text-ivory sm:text-2xl">
            Start on the website today
          </h2>
          <Link
            href="/login"
            className="mp-btn-lux inline-flex items-center justify-center px-8 py-3.5 text-[12px] font-semibold tracking-wide"
          >
            Enter Interlink
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/50 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center">
          <SponsorLockup />
          <p className="text-[11px] text-muted">
            Interlink · Private introductions for ambitious people
          </p>
        </div>
      </footer>
    </main>
  );
}
