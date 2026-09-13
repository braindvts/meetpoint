"use client";

import Link from "next/link";
import { useEffect } from "react";
import DemoEnterButton from "@/components/DemoEnterButton";
import Reveal from "@/components/Reveal";
import TierBadge from "@/components/TierBadge";
import { BRAND_MARK, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { demoEntryEnabled } from "@/lib/demoFlag";

const STEPS = [
  {
    n: "01",
    title: "Identity",
    copy: "Photo, name, role, ambitions, and what you want. That is Member. Skip email, LinkedIn, and resume if you want.",
  },
  {
    n: "02",
    title: "The room",
    copy: "People ranked by shared ambition, complementary asks, and craft. Members meet Members. Premier and Verified reach further.",
  },
  {
    n: "03",
    title: "The table",
    copy: "Propose dinner in a private chat. The introduction is finished when you sit down.",
  },
] as const;

const LEVELS = [
  {
    tier: 1 as const,
    copy: "Identity only — photo, name, role, ambitions, looking for. Verification is optional. Skip it and you stay Member.",
  },
  {
    tier: 2 as const,
    copy: "Add all three: business email, LinkedIn, and resume. Website and portfolio do not replace them.",
  },
  {
    tier: 3 as const,
    copy: "$50/mo or $500/yr, or earn it through dinners and reputation. Must already be Verified. Peer invites never grant BLACK.",
  },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "",
    copy: "Member ↔ Member introductions. Enough to enter the room.",
    featured: false,
  },
  {
    name: "Premier",
    price: "$20/mo",
    note: "or $100/yr · short trial",
    copy: "Meet Verified and BLACK. A plan — not a standing.",
    featured: true,
  },
  {
    name: "BLACK",
    price: "$50/mo",
    note: "or $500/yr",
    copy: "Top standing. Meet anyone. Paid or earned — never by invite.",
    featured: false,
  },
] as const;

export default function LandingView() {
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.classList.toggle("mp-landing-scrolled", window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("mp-landing-scrolled");
    };
  }, []);

  return (
    <main id="top" className="mp-site mp-landing">
      <header className="mp-landing-nav">
        <div className="mp-landing-nav-inner">
          <Link href="/" className="mp-landing-brand">
            {BRAND_NAME}
          </Link>
          <nav className="mp-landing-anchors" aria-label="On this page">
            <a href="#how">How it works</a>
            <a href="#levels">Levels</a>
            <a href="#plans">Plans</a>
          </nav>
          <div className="mp-landing-nav-actions">
            <Link href="/login" className="mp-landing-ghost">
              Sign in
            </Link>
                <Link href="/login" className="mp-btn-lux mp-spot mp-landing-cta">
                  Join {BRAND_NAME}
                </Link>
          </div>
        </div>
      </header>

      <section className="mp-hero">
        <div className="mp-hero-frame">
          <p className="mp-hero-kicker">Private network</p>
          <h1 className="mp-landing-hero-mark">{BRAND_MARK}</h1>
          <span className="mp-hero-rule" aria-hidden />

          <div className="mp-hero-split">
            <p className="mp-hero-lede">{BRAND_TAGLINE}</p>
            <div className="mp-hero-aside">
              <p>Identity makes you a Member. Verification can wait. Dinner cannot.</p>
              <div className="mp-hero-actions">
                <Link href="/login" className="mp-btn-lux mp-spot mp-landing-cta mp-landing-cta--wide">
                  Join {BRAND_NAME}
                </Link>
                <Link href="/login" className="mp-landing-secondary">
                  Sign in
                </Link>
              </div>
              {demoEntryEnabled() && (
                <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
              )}
            </div>
          </div>
        </div>
        <a href="#how" className="mp-scroll-cue" aria-label="How it works">
          <span />
        </a>
        <p className="mp-hero-foot">Website first · Native app when the site earns it</p>
      </section>

      <section id="how" className="mp-landing-section">
        <div className="mp-landing-wrap">
          <Reveal className="mp-section-head">
            <p className="mp-kicker">How it works</p>
            <h2 className="mp-landing-h2">
              Match in the room.
              <br />
              Meet at dinner.
            </h2>
            <p className="mp-section-lede">
              No feed. No blast list. No phone-frame pretending to be a website. A room — then a
              reservation.
            </p>
          </Reveal>

          <ol className="mp-ladder">
            {STEPS.map((step, i) => (
              <li key={step.n}>
                <Reveal delay={i * 90} className="mp-ladder-row">
                  <div className="mp-ladder-rail" aria-hidden>
                    <span className="mp-ladder-n">{step.n}</span>
                    {i < STEPS.length - 1 ? <span className="mp-ladder-line" /> : null}
                  </div>
                  <div className="mp-ladder-body">
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="levels" className="mp-landing-section">
        <div className="mp-landing-wrap">
          <Reveal className="mp-section-head">
            <p className="mp-kicker">Standing</p>
            <h2 className="mp-landing-h2">
              Three levels.
              <br />
              Named, not ranked.
            </h2>
            <p className="mp-section-lede">
              Named standing — not a ranked ladder. Signup never blocks on verification. Identity
              is enough to enter.
            </p>
          </Reveal>

          <div className="mp-board">
            {LEVELS.map((level, i) => (
              <Reveal key={level.tier} delay={i * 80} className="mp-board-row">
                <TierBadge tier={level.tier} size="sm" />
                <p>{level.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mp-landing-section">
        <div className="mp-landing-wrap">
          <Reveal className="mp-section-head">
            <p className="mp-kicker">Plans</p>
            <h2 className="mp-landing-h2">
              Pay for reach.
              <br />
              Standing stays yours.
            </h2>
            <p className="mp-section-lede">
              Premier is a plan. Member, Verified, and BLACK are standing. Someone can be Verified
              and Free — or Verified and Premier.
            </p>
          </Reveal>

          <div className="mp-tariff">
            {PLANS.map((plan, i) => (
              <Reveal
                key={plan.name}
                delay={i * 70}
                className={`mp-tariff-row ${plan.featured ? "is-featured" : ""}`}
              >
                <div className="mp-tariff-name">
                  <p>{plan.name}</p>
                  <span>{plan.copy}</span>
                </div>
                <div className="mp-tariff-price">
                  <strong>{plan.price}</strong>
                  {plan.note ? <em>{plan.note}</em> : null}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <p className="mp-tariff-note">
              <span>BLACK CONNECTION</span> is a black checkmark — a private link to a BLACK member.
              It is not BLACK, and it never becomes BLACK.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mp-landing-section mp-landing-section--close">
        <Reveal className="mp-close">
          <h2>Your Identity is enough to enter.</h2>
          <p>Verification is optional. The table is not.</p>
          <Link href="/login" className="mp-btn-lux mp-spot mp-landing-cta mp-landing-cta--wide">
            Join {BRAND_NAME}
          </Link>
        </Reveal>
      </section>

      <footer className="mp-landing-foot">
        <p>
          {BRAND_NAME} · Private introductions. Real tables.
        </p>
        <div>
          <Link href="/login">Sign in</Link>
          <Link href="/login">Join</Link>
          <Link href="/story">Press kit</Link>
        </div>
      </footer>
    </main>
  );
}
