import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
import { demoEntryEnabled } from "@/lib/demoFlag";

/**
 * Browser marketing site — website first.
 * Native app can wrap this same site later; do not shrink it back into a phone frame.
 */
export default function Landing() {
  return (
    <main className="mp-site">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
          Conclave
        </p>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-[13px] text-muted transition hover:text-ivory">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-b from-accent-2 to-accent px-4 py-2 text-[12px] font-semibold tracking-wide text-ink"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero — one composition: brand, line, CTAs */}
      <section className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col justify-center px-6 pb-20 pt-8">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute left-1/2 top-[42%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/12 blur-3xl motion-safe:animate-pulse" />
          <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-3xl text-center">
          <h1 className="mp-reveal text-[clamp(2.75rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-[0.08em] text-accent">
            CONCLAVE
          </h1>
          <p className="mp-reveal mp-reveal-delay-2 mx-auto mt-6 max-w-md text-[1.05rem] leading-relaxed text-ivory/70 sm:text-lg">
            The private network for ambitious people — introductions that end at a table.
          </p>
          <div className="mp-reveal mp-reveal-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="inline-flex min-w-[12rem] items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent px-8 py-3.5 text-[12px] font-semibold tracking-wide text-ink"
            >
              Join on the web
            </Link>
            <Link
              href="/login"
              className="inline-flex min-w-[12rem] items-center justify-center rounded-xl border border-accent/30 px-8 py-3.5 text-[12px] font-medium tracking-wide text-accent transition hover:bg-accent/5"
            >
              Sign in
            </Link>
          </div>
          {demoEntryEnabled() && (
            <div className="mp-reveal mp-reveal-delay-3 mt-5">
              <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
            </div>
          )}
          <p className="mp-reveal mp-reveal-delay-3 mt-8 text-[11px] tracking-wide text-muted">
            Website first · Native app when you’re ready
          </p>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            How it works
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
            Match in the browser. Meet at dinner.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Build your profile, get Verified with business email, LinkedIn, and resume, then
            discover people who fit — and settle it over a real table.
          </p>
        </div>
      </section>

      <section className="border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
            Levels
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                name: "Member",
                mark: "level-mark level-mark--member",
                copy: "Sign up and you’re in. Finish your profile when you’re ready.",
              },
              {
                name: "Verified",
                mark: "level-mark level-mark--verified",
                copy: "Business email, LinkedIn, and resume — plus a complete profile.",
              },
              {
                name: "BLACK",
                mark: "level-mark level-mark--black",
                copy: "Premium standing. Pay or earn it through dinners and reputation.",
              },
            ].map((level) => (
              <div key={level.name} className="text-center sm:text-left">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-ivory ${level.mark}`}
                >
                  <span className="level-mark-sheen" aria-hidden />
                  <span className="relative">{level.name}</span>
                </span>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">{level.copy}</p>
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
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent px-8 py-3.5 text-[12px] font-semibold tracking-wide text-ink"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/50 px-6 py-8 text-center text-[11px] text-muted">
        Conclave · Private introductions for ambitious people
      </footer>
    </main>
  );
}
