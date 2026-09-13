import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
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
    name: "Member",
    mark: "level-mark level-mark--member",
    copy: "Identity only — photo, name, role, ambitions, looking for. Verification is optional. Skip it and you stay Member.",
  },
  {
    name: "Verified",
    mark: "level-mark level-mark--verified",
    copy: "Add all three: business email, LinkedIn, and resume. Website and portfolio do not replace them.",
  },
  {
    name: "BLACK",
    mark: "level-mark level-mark--black",
    copy: "$50/mo or $500/yr, or earn it through dinners and reputation. Must already be Verified. Peer invites never grant BLACK.",
  },
] as const;

const PLANS = [
  {
    name: "Free",
    price: "$0",
    note: "",
    copy: "Member ↔ Member introductions. Enough to enter the room.",
  },
  {
    name: "Premier",
    price: "$20/mo",
    note: "or $100/yr",
    copy: "Meet Verified and BLACK. Yearly includes a short trial.",
  },
  {
    name: "BLACK",
    price: "$50/mo",
    note: "or $500/yr",
    copy: "Top standing. Meet anyone. Paid or earned — never by invite.",
  },
] as const;

/**
 * Browser marketing site — website first.
 * Native app can wrap this same site later; do not shrink it back into a phone frame.
 */
export default function Landing() {
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
            <Link href="/login" className="mp-btn-lux mp-landing-cta">
              Join {BRAND_NAME}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100dvh-4.25rem)] flex-col justify-center px-6 pb-24 pt-10 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-[40%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl motion-safe:animate-pulse" />
          <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl text-center">
          <p className="mp-reveal mp-kicker">Private network</p>
          <h1 className="mp-reveal mp-reveal-delay-1 mp-landing-hero-mark">{BRAND_MARK}</h1>
          <span className="mp-reveal mp-reveal-delay-2 mp-gold-rule" aria-hidden />
          <p className="mp-reveal mp-reveal-delay-2 mx-auto mt-8 max-w-lg text-[1.1rem] leading-relaxed text-ivory/80 sm:text-[1.2rem]">
            {BRAND_TAGLINE}
          </p>
          <p className="mp-reveal mp-reveal-delay-3 mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Identity makes you a Member. Verification can wait. Dinner cannot.
          </p>
          <div className="mp-reveal mp-reveal-delay-3 mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/login" className="mp-btn-lux mp-landing-cta mp-landing-cta--wide">
              Join {BRAND_NAME}
            </Link>
            <Link href="/login" className="mp-landing-secondary">
              Sign in
            </Link>
          </div>
          {demoEntryEnabled() && (
            <div className="mp-reveal mp-reveal-delay-3 mt-5">
              <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
            </div>
          )}
          <p className="mp-reveal mp-reveal-delay-4 mt-10 text-[11px] tracking-[0.14em] text-muted/90">
            Website first · Native app when the site earns it
          </p>
        </div>
      </section>

      <section id="how" className="mp-landing-section">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mp-kicker">How it works</p>
            <h2 className="mp-landing-h2">Match in the room. Meet at dinner.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              No feed. No blast list. No phone-frame pretending to be a website. A room — then a
              reservation.
            </p>
          </div>
          <ol className="mp-stagger mt-14 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step) => (
              <li key={step.n} className="mp-landing-card">
                <p className="mp-landing-num">{step.n}</p>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-ivory">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="levels" className="mp-landing-section">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mp-kicker">Standing</p>
            <h2 className="mp-landing-h2">Three levels. One metal mark.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Steel, champagne, black. Signup never blocks on verification — Identity is enough to
              enter.
            </p>
          </div>
          <div className="mp-stagger mt-14 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {LEVELS.map((level) => (
              <div key={level.name} className="mp-landing-card">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-ivory ${level.mark}`}
                >
                  <span className="level-mark-sheen" aria-hidden />
                  <span className="relative">{level.name}</span>
                </span>
                <p className="mt-5 text-[14px] leading-relaxed text-muted">{level.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mp-landing-section">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mp-kicker">Plans</p>
            <h2 className="mp-landing-h2">Pay for reach. Standing stays yours.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              Premier is a plan. Member, Verified, and BLACK are standing. Someone can be Verified
              and Free — or Verified and Premier.
            </p>
          </div>
          <div className="mp-landing-plan-frame mt-14">
            <div className="grid gap-px sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div key={plan.name} className="mp-landing-plan">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                    {plan.name}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-ivory">{plan.price}</p>
                  <p className="mt-1 min-h-[1.125rem] text-[12px] text-muted">{plan.note}</p>
                  <p className="mt-5 text-[14px] leading-relaxed text-muted">{plan.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-lg text-center text-[13px] leading-relaxed text-muted">
            <span className="text-ivory/80">BLACK CONNECTION</span> is a black checkmark — a private
            link to a BLACK member. It is not BLACK, and it never becomes BLACK.
          </p>
        </div>
      </section>

      <section className="mp-landing-section mp-landing-section--close">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            Your Identity is enough to enter.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Verification is optional. The table is not.
          </p>
          <Link href="/login" className="mp-btn-lux mp-landing-cta mp-landing-cta--wide mt-10">
            Join {BRAND_NAME}
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-[11px] text-muted sm:flex-row sm:text-left">
          <p>
            {BRAND_NAME} · Private introductions. Real tables.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="transition hover:text-ivory">
              Sign in
            </Link>
            <Link href="/login" className="transition hover:text-ivory">
              Join
            </Link>
            <Link href="/story" className="transition hover:text-ivory">
              Press kit
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
