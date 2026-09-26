import type { Metadata } from "next";
import Link from "next/link";
import BlackBadge from "@/components/BlackBadge";
import DemoEnterButton from "@/components/DemoEnterButton";
import SponsorLockup from "@/components/SponsorLockup";
import TierBadge from "@/components/TierBadge";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { EVENTS } from "@/lib/events";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const COURSES = [
  {
    course: "First",
    title: "Show up as yourself",
    copy: "Identity is enough to enter — photo, name, role, ambitions. Verification waits until you want it.",
  },
  {
    course: "Second",
    title: "Get introduced with intent",
    copy: "Discover ranks people by overlap, not a feed. Nearby when you want it. Events when a room is the better match.",
  },
  {
    course: "Third",
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

const STRIP = EVENTS.filter((event) => event.published !== false).slice(0, 8);

/**
 * Browser marketing site — website first.
 * A night-service layout: the photograph is the room, type sits beside it.
 * Native app can wrap this same site later.
 */
export default function Landing() {
  const reel = [...STRIP, ...STRIP];

  return (
    <main className="mp-site mp-night overflow-x-hidden">
      <header className="mp-night-bar">
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

      <section className="mp-night-hero">
        <div className="mp-night-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/events/hero-service.jpg" alt="" />
          <p className="mp-night-plate">
            <strong>Service</strong>
            <span>A private room. A real table.</span>
          </p>
        </div>

        <div className="mp-night-copy">
          <p className="mp-reveal text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            Private introductions
            <span className="mp-draw-rule" aria-hidden />
          </p>
          <h1 className="mp-reveal mp-reveal-delay-1 mp-night-title mt-5 text-ivory">
            Ambition,
            <span>then a table.</span>
          </h1>
          <p className="mp-reveal mp-reveal-delay-2 mt-6 max-w-md text-[1.05rem] leading-relaxed text-ivory/75">
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
              href="/events"
              className="mp-press inline-flex min-w-[11.5rem] items-center justify-center border border-ivory/35 px-8 py-3.5 text-[12px] font-medium tracking-wide text-ivory hover:border-accent/55 hover:text-accent"
            >
              See the calendar
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
          <SponsorLockup className="mt-8" />
        </div>
      </section>

      <section className="mp-film" aria-label="Gatherings on the calendar">
        <div className="mp-film-track">
          {reel.map((event, index) => (
            <Link
              key={`${event.id}-${index}`}
              href={`/events/${event.slug}`}
              className="mp-film-card"
              tabIndex={index >= STRIP.length ? -1 : undefined}
              aria-hidden={index >= STRIP.length ? true : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image} alt="" />
              <span>
                <strong>{event.name}</strong>
                <em>
                  {event.city} · {event.venue}
                </em>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mp-scroll-reveal">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              The service
            </p>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-ivory sm:text-4xl sm:leading-[1.05]">
              Match in the browser. Meet at dinner.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Interlink makes the introduction. The table is where the business happens.
            </p>
            <span className="mp-scroll-rule" aria-hidden />
          </div>
          <div className="mp-courses mp-scroll-stagger mt-12">
            {COURSES.map((step) => (
              <article key={step.course} className="mp-course">
                <p>{step.course}</p>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mp-night-feature mp-scroll-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/events/founders-table-midtown.jpg" alt="" />
            <p>
              <strong>Founders’ Table — Midtown</strong>
              <span>Twelve seats. No decks. Serious operators only.</span>
            </p>
          </div>
          <div className="mp-scroll-reveal flex flex-col justify-center">
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
              href="/events"
              className="mp-press mt-8 inline-flex w-fit border border-accent/40 px-6 py-3 text-[12px] font-medium tracking-wide text-accent hover:bg-accent/10"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mp-scroll-reveal">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Standing
            </p>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
              Three ways to be in the room on Interlink. Not a ladder.
            </h2>
            <span className="mp-scroll-rule" aria-hidden />
          </div>
          <div className="mp-places mp-scroll-stagger mt-12">
            {STANDING.map((level) => (
              <article key={level.name} className="mp-place">
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
                <h3>{level.name}</h3>
                <p>{level.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mp-scroll-reveal border-t border-white/[0.08] px-6 py-16">
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

      <footer className="border-t border-white/[0.08] px-6 py-10">
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
