import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
import TierBadge from "@/components/TierBadge";
import { demoEntryEnabled } from "@/lib/demoFlag";

const STEPS = [
  {
    name: "Identity",
    copy: "Photo, name, role, ambitions, and what you’re looking for. That’s enough to enter as a Member.",
  },
  {
    name: "The room",
    copy: "Discover people who fit — nearby or worldwide. Verification is optional until you want Verified reach.",
  },
  {
    name: "The table",
    copy: "When it clicks, you sit down. Introductions here are meant to end at dinner, not another chat thread.",
  },
] as const;

const STANDING = [
  {
    tier: 3 as const,
    copy: "Paid or earned. The top level — never granted by a friend’s invite.",
  },
  {
    tier: 2 as const,
    copy: "Identity plus business email, LinkedIn, and resume — when you’re ready.",
  },
  {
    tier: 1 as const,
    copy: "You’re in with Identity alone. Skip verification and you stay Member.",
  },
];

/**
 * Browser marketing site — website first.
 * Cool and professional: editorial club, not a SaaS feature grid.
 */
export default function Landing() {
  return (
    <main className="mp-site">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-ivory">
          Interlink
        </p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="mp-press text-[13px] text-muted hover:text-ivory">
            Sign in
          </Link>
          <Link
            href="/login"
            className="mp-btn-lux inline-flex px-4 py-2 text-[12px] font-semibold tracking-wide"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative px-6 pb-20 pt-10 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          <div className="absolute left-[12%] top-24 hidden h-[28rem] w-px bg-white/[0.06] lg:block" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl items-end gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)] lg:gap-20">
          <div>
            <p className="mp-reveal mp-kicker text-accent">Private introductions</p>
            <h1 className="mp-reveal mp-reveal-delay-1 mt-5 max-w-[14ch] text-[clamp(2.4rem,6.4vw,4.35rem)] font-semibold leading-[0.96] tracking-tight text-ivory">
              Meet in the room.
              <span className="block text-accent">Settle it at dinner.</span>
            </h1>
            <p className="mp-reveal mp-reveal-delay-2 mt-6 max-w-md text-[1.05rem] leading-relaxed text-ivory/68">
              Interlink introduces ambitious people, then the conversation leaves
              the screen. Website first — use it in the browser today.
            </p>
            <div className="mp-reveal mp-reveal-delay-3 mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="mp-btn-lux inline-flex min-w-[11.5rem] items-center justify-center px-8 py-3.5 text-[12px] font-semibold tracking-wide"
              >
                Join on the web
              </Link>
              <Link
                href="/login"
                className="mp-btn-ghost mp-press inline-flex min-w-[11.5rem] items-center justify-center rounded-lg px-8 py-3.5 text-[12px] font-medium tracking-wide"
              >
                Sign in
              </Link>
            </div>
            {demoEntryEnabled() && (
              <div className="mp-reveal mp-reveal-delay-3 mt-5">
                <DemoEnterButton label="Enter demo" className="mp-press text-[13px] text-accent" />
              </div>
            )}
          </div>

          <aside className="mp-reveal mp-reveal-delay-2 mp-frame border border-white/[0.08] bg-[#0a0a0a] px-6 py-7 sm:px-8 sm:py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-muted">
              Standing
            </p>
            <ul className="mt-6 space-y-0">
              {STANDING.map((row, i) => (
                <li
                  key={row.tier}
                  className={i === 0 ? "" : "border-t border-white/[0.07] pt-5 mt-5"}
                >
                  <TierBadge tier={row.tier} size="md" />
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">{row.copy}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-t border-white/[0.07] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mp-kicker text-accent">How it works</p>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            Identity. The room. The table.
          </h2>
          <ol className="mt-12 grid gap-0 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.name}
                className={`py-2 sm:px-8 sm:py-0 ${
                  i === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/[0.08]"
                } ${i === 2 ? "sm:pr-0" : ""}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory/80">
                  {step.name}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-white/[0.07] px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="mp-kicker text-accent">Events &amp; conventions</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
              Nearby rooms. Global stages.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Professional dinners, conferences, and conventions in your city —
              or across the world. See who will be there, then sit with them.
            </p>
          </div>
          <Link
            href="/login"
            className="mp-btn-ghost mp-press inline-flex shrink-0 items-center justify-center rounded-lg px-6 py-3 text-[12px] font-medium tracking-wide"
          >
            Sign in to browse Events
          </Link>
        </div>
      </section>

      <section className="border-t border-white/[0.07] px-6 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
              Start on the website today
            </h2>
            <p className="mt-2 text-[14px] text-muted">
              Native app later — after the room is already meeting.
            </p>
          </div>
          <Link
            href="/login"
            className="mp-btn-lux inline-flex items-center justify-center px-8 py-3.5 text-[12px] font-semibold tracking-wide"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-[11px] text-muted">
        Interlink · Private introductions for ambitious people
      </footer>
    </main>
  );
}
