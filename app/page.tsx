import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
import InterlinkMark from "@/components/InterlinkMark";
import Magnetic from "@/components/motion/Magnetic";
import Reveal from "@/components/motion/Reveal";
import SignalMesh from "@/components/SignalMesh";
import TierBadge from "@/components/TierBadge";
import Wordmark from "@/components/Wordmark";
import { BRAND, BRAND_LINE, BRAND_TAGLINE } from "@/lib/brand";
import { demoEntryEnabled } from "@/lib/demoFlag";

const STEPS = [
  {
    title: "Show up as yourself",
    copy: "Identity is enough to enter — photo, name, role, ambitions. Verification waits until you want it.",
  },
  {
    title: "Get introduced with intent",
    copy: "Discover ranks people by overlap, not a feed. Nearby when you want it. Tables when a dinner is the better match.",
  },
  {
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
    copy: "Business email, LinkedIn, and resume. The checkmarks stay checks. Standing is the signal next to them.",
  },
  {
    tier: 3 as const,
    name: "BLACK",
    copy: "Paid or earned. Meet anyone. Peer invites never grant this — only BLACK CONNECTION.",
  },
];

export default function Landing() {
  return (
    <main className="mp-site overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Wordmark href="/" size="sm" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="il-press text-[13px] text-muted transition hover:text-ivory">
            Sign in
          </Link>
          <Magnetic>
            <Link href="/login" className="il-btn il-landing-cta il-landing-cta--fill !min-w-0 px-4 py-2 text-[12px]">
              Join
            </Link>
          </Magnetic>
        </div>
        </div>
      </header>

      <section className="relative isolate min-h-[calc(100dvh-4.5rem)] px-6 pb-16 pt-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <SignalMesh />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="il-kicker mp-reveal">{BRAND}</p>
            <h1 className="mp-reveal mp-reveal-delay-1 mt-5 font-display text-[clamp(3.1rem,8vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.028em] text-ivory">
              {BRAND_TAGLINE.split(". ").map((line, i) => (
                <span key={line} className="block">
                  {line}
                  {i === 0 ? "." : ""}
                </span>
              ))}
            </h1>
            <p className="mp-reveal mp-reveal-delay-2 mt-6 max-w-md text-[1.05rem] leading-relaxed text-ivory/68">
              {BRAND_LINE} Introductions ranked by ambition — then a table.
            </p>
            <div className="mp-reveal mp-reveal-delay-3 mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <Link href="/login" className="il-btn il-landing-cta il-landing-cta--fill">
                  Enter the room
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/login" className="il-btn il-landing-cta il-landing-cta--ghost">
                  Sign in
                </Link>
              </Magnetic>
            </div>
            {demoEntryEnabled() && (
              <div className="mp-reveal mp-reveal-delay-3 mt-5">
                <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
              </div>
            )}
            <p className="mp-reveal mp-reveal-delay-4 mt-8 text-[12px] text-muted">
              Website first · Native app when the room is paying for itself
            </p>
          </div>

          <div className="mp-reveal mp-reveal-delay-2 relative hidden min-h-[22rem] lg:block">
            <div className="il-node-card absolute left-6 top-4 w-[78%] p-5">
              <p className="il-kicker">Tonight</p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ivory">
                Founders after the raise
              </p>
              <p className="mt-2 text-[13px] text-muted">Eight seats · Dumbo · Thursday</p>
              <div className="mt-5 flex items-center gap-2">
                <span className="stand stand--verified">
                  <span className="stand-node" aria-hidden />
                  <span>Host</span>
                </span>
                <span className="text-[12px] text-ivory/55">Matched to your ambitions</span>
              </div>
            </div>
            <div className="il-node-card absolute bottom-2 right-0 w-[70%] p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-black">
                  <InterlinkMark size={22} />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-ivory">A private thread</p>
                  <p className="text-[12px] text-muted">Then a table. Not a feed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="il-kicker">How the room works</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ivory sm:text-4xl">
              Three moves. No numbered ladder.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 90}>
                <div className="relative">
                  {i < STEPS.length - 1 ? (
                    <span
                      className="pointer-events-none absolute left-[calc(100%+0.4rem)] top-3 hidden h-px w-[calc(100%-0.8rem)] bg-gradient-to-r from-accent/40 to-transparent md:block"
                      aria-hidden
                    />
                  ) : null}
                  <span className="stand-node !h-2.5 !w-2.5 bg-accent" aria-hidden />
                  <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ivory">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="il-kicker">Standing</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ivory sm:text-4xl">
              Three signals. None of them a metal chip.
            </h2>
          </Reveal>
          <div className="stand-path mt-12">
            {STANDING.map((level, i) => (
              <Reveal key={level.name} delay={i * 80} className="stand-path-item">
                {i > 0 ? <span className="stand-path-link" aria-hidden /> : null}
                <div className={`stand-path-card ${level.tier === 3 ? "bg-black" : ""}`}>
                  <TierBadge tier={level.tier} size="md" />
                  <p className="mt-4 font-display text-lg font-semibold text-ivory">{level.name}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{level.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] px-6 py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="il-kicker">Tables</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-ivory sm:text-4xl">
            Hosted dinners already live in Discover
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            For you, Nearby, and Tables — ranked against your interests, role, and what you said
            you want. The product is not a brochure. The tables are in the room.
          </p>
          <Magnetic className="mt-8">
            <Link href="/login" className="il-btn il-landing-cta il-landing-cta--fill">
              Open Discover
            </Link>
          </Magnetic>
        </Reveal>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Wordmark href="/" size="sm" />
          <p className="text-[12px] text-muted">
            {BRAND} · Private introductions for ambitious people
          </p>
        </div>
      </footer>
    </main>
  );
}
