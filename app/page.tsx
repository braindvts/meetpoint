import type { Metadata } from "next";
import Link from "next/link";
import BlackBadge from "@/components/BlackBadge";
import DemoEnterButton from "@/components/DemoEnterButton";
import EdgeableSpotlight from "@/components/EdgeableSpotlight";
import SponsorLockup from "@/components/SponsorLockup";
import TierBadge from "@/components/TierBadge";
import { formatBlackPrice } from "@/lib/black";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { displayTitle } from "@/lib/displayTitle";
import { EVENTS } from "@/lib/events";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    n: "01",
    title: "Identity",
    copy: "A photo, your name, your role, what you are building, and what you want. That is enough to enter. Business email and LinkedIn can wait.",
  },
  {
    n: "02",
    title: "Introduction",
    copy: "Discover lines people up by what you share. Nearby when you want your own city. Events when the room is the better match.",
  },
  {
    n: "03",
    title: "The table",
    copy: "A private chat, a proposed table, a seat. Interlink makes the introduction. The meeting is the product.",
  },
];

/**
 * Marketing home. Type leads. The photograph sits under the headline,
 * with its caption beside it, never on top of it.
 */
export default function Landing() {
  const published = EVENTS.filter((event) => event.published !== false);
  const table = published.find((event) => event.slug === "founders-table-midtown") ?? published[0];
  const index = published.slice(0, 6);

  return (
    <main className="mp-site">
      <header className="mp-mast">
        <Link href="/" className="mp-wordmark">
          Interlink
        </Link>
        <div className="mp-mast-links">
          <Link href="/login" className="text-[13px] text-muted hover:text-ivory">
            Sign in
          </Link>
          <Link href="/login" className="mp-btn-lux px-4 py-2 text-[12px] font-semibold">
            Join
          </Link>
        </div>
      </header>

      <section className="mp-cover">
        <div className="mp-cover-rail">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">
            Private network
          </p>
          <ol>
            <li>
              <span>01</span> Your name
            </li>
            <li>
              <span>02</span> An introduction
            </li>
            <li>
              <span>03</span> A real table
            </li>
          </ol>
        </div>
        <div className="mp-rise">
          <h1>
            The introduction
            <br />
            ends at dinner.
          </h1>
          <p className="mp-cover-dek">
            Interlink is a private network for ambitious people. You meet someone who is
            building something specific. Then you sit down, for dinner or a business meeting.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/login" className="mp-btn-lux inline-flex px-7 py-3.5 text-[13px] font-semibold">
              Join Interlink
            </Link>
            <Link
              href="/events"
              className="inline-flex border border-line px-7 py-3.5 text-[13px] font-medium text-ivory hover:border-accent"
            >
              See the calendar
            </Link>
          </div>
          {demoEntryEnabled() ? (
            <div className="mt-4">
              <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
            </div>
          ) : null}
          <p className="mt-6 text-[12px] text-muted">Open in the browser. A native app comes later.</p>
        </div>
      </section>

      {table ? (
        <figure className="mp-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={table.image} alt="" />
          <figcaption>
            <strong>{displayTitle(table.name)}</strong>
            {table.city}. {table.venue}. Twelve seats. No decks.
          </figcaption>
        </figure>
      ) : null}

      <section className="mp-band" aria-label="Gatherings on the calendar">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">Calendar</p>
        <h2 className="mt-3 max-w-xl">Dinners, conferences, conventions.</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          In your city, or in someone else&apos;s. Interlink shows who will be in the room before you walk in.
        </p>
        <div className="mp-roll mt-8">
          {index.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image} alt="" />
              <strong>{displayTitle(event.name)}</strong>
              <em>{event.city}</em>
              <em className="hidden md:block">{event.venue}</em>
            </Link>
          ))}
        </div>
        <Link href="/events" className="mt-6 inline-flex text-[13px] font-semibold text-accent">
          Browse events
        </Link>
      </section>

      <section className="mp-band border-t border-line">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">How a meeting starts</p>
        <h2 className="mt-3 max-w-xl">Name, introduction, table.</h2>
        <div className="mt-8">
          {STEPS.map((step) => (
            <article key={step.n} className="mp-rule-row">
              <p>{step.title}</p>
              <p className="text-[15px] leading-relaxed text-muted">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mp-band border-t border-line">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-2">Standing</p>
        <h2 className="mt-3 max-w-xl">Member, Verified, and BLACK.</h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Same room. Different reach. Peer invites award BLACK CONNECTION. They do not award BLACK.
        </p>
        <div className="mp-standing mt-8">
          <article>
            <div>
              <TierBadge tier={1} size="md" />
              <h3 className="mt-2">Member</h3>
            </div>
            <p className="text-[15px] leading-relaxed text-muted">
              Identity on file. You meet other Members. Skip email and LinkedIn and you stay here.
            </p>
          </article>
          <article>
            <div>
              <TierBadge tier={2} size="md" />
              <h3 className="mt-2">Verified</h3>
            </div>
            <p className="text-[15px] leading-relaxed text-muted">
              Add a business email and LinkedIn when you want them. The mark stays a check. Then you can meet anyone.
            </p>
          </article>
          <article>
            <div className="flex items-center gap-2">
              <BlackBadge size="md" />
              <h3>BLACK</h3>
            </div>
            <p className="text-[15px] leading-relaxed text-muted">
              {formatBlackPrice("month")} or {formatBlackPrice("year")}, or earned. You can meet anyone. You need to be Verified first.
            </p>
          </article>
        </div>
      </section>

      <section className="mp-close">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-5">
          <h2 className="font-display text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
            Start with your name.
          </h2>
          <Link href="/login" className="mp-btn-lux inline-flex px-8 py-3.5 text-[13px] font-semibold">
            Join Interlink
          </Link>
        </div>
      </section>

      <footer className="mp-footer">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <SponsorLockup />
          <EdgeableSpotlight />
          <p className="text-[12px] text-muted">Interlink. A private network for ambitious people.</p>
        </div>
      </footer>
    </main>
  );
}
