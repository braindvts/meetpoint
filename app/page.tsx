import Link from "next/link";
import ConclaveLogo from "@/components/ConclaveLogo";
import DemoEnterButton from "@/components/DemoEnterButton";
import { demoEntryEnabled } from "@/lib/demoFlag";

const TABLES = [
  {
    img: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=90",
    city: "New York",
    line: "A corner table on the fifty-third floor.",
  },
  {
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=90",
    city: "Paris",
    line: "Candlelight, white linen, an unhurried hour.",
  },
  {
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=90",
    city: "Tokyo",
    line: "Twelve seats. One counter. Every one earned.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Present",
    text: "Your profession, ambitions, and how far you travel for the right conversation.",
  },
  {
    num: "02",
    title: "Introduce",
    text: "Quiet matches by business, skill, or profession — nearby or across an ocean.",
  },
  {
    num: "03",
    title: "Settle",
    text: "One flies. One hosts. Or you meet in the middle. Dinner is chosen together.",
  },
];

export default function Landing() {
  return (
    <main className="bg-ink text-ivory">
      {/* Full-bleed hero — brand is the hero */}
      <section className="relative min-h-dvh overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center animate-[kenburns_26s_ease-out_both]"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2800&q=90)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.82) 42%, rgba(5,5,5,0.35) 100%), linear-gradient(to top, rgba(5,5,5,0.98) 0%, transparent 50%)",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 30% 70%, rgba(212,196,168,0.18), transparent 50%)",
            }}
            aria-hidden
          />
        </div>

        <header className="relative z-10 flex items-center justify-between px-5 py-7 sm:px-10 lg:px-16">
          <span className="text-[10px] font-semibold uppercase tracking-[0.42em] text-accent">
            Est. MMXXVI
          </span>
          <Link
            href="/login"
            className="border border-accent/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-accent-2 transition hover:border-accent hover:bg-accent/10"
          >
            Members
          </Link>
        </header>

        <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 pb-20 text-center">
          <div className="mp-reveal mb-8">
            <ConclaveLogo size={72} />
          </div>
          <p className="mp-reveal mp-reveal-delay-1 text-[10px] font-semibold uppercase tracking-[0.5em] text-accent">
            By introduction only
          </p>
          <h1 className="mp-reveal mp-reveal-delay-2 mt-5 text-[clamp(3.5rem,12vw,8rem)] font-semibold leading-[0.9] tracking-tight">
            Con<span className="text-accent">clave</span>
          </h1>
          <p className="mp-reveal mp-reveal-delay-3 mt-8 max-w-md text-lg leading-snug text-ivory/90 sm:text-xl">
            Private introductions. Settled over dinner.
          </p>
          <div className="mp-reveal mp-reveal-delay-4 mt-12 flex flex-col items-center gap-5">
            <Link
              href="/onboarding"
              className="mp-btn-lux inline-flex rounded-none bg-gradient-to-b from-accent-2 to-accent px-12 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink shadow-[0_16px_48px_rgba(212,196,168,0.22)]"
            >
              Request entry
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {demoEntryEnabled() && (
                <DemoEnterButton
                  label="Enter demo"
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted underline decoration-accent/30 underline-offset-8 transition hover:text-accent-2"
                />
              )}
              <a
                href="/api/auth/linkedin"
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted underline decoration-accent/30 underline-offset-8 transition hover:text-accent-2"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-6">
          <span className="h-px w-24 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-line/60 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-display text-2xl italic leading-relaxed text-ivory/90 sm:text-3xl">
            Not a feed. Not a marketplace.
            <br />
            <span className="text-accent">A room.</span>
          </p>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.48em] text-accent">
            How one enters
          </p>
          <div className="mp-stagger mt-12 grid gap-0 border border-line/70 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className={`group relative bg-panel/40 p-8 transition hover:bg-panel-2/60 sm:p-10 ${
                  i < STEPS.length - 1 ? "border-b border-line/70 sm:border-b-0 sm:border-r" : ""
                }`}
              >
                <p className="font-display text-4xl font-medium text-accent/40 transition group-hover:text-accent/70">
                  {s.num}
                </p>
                <h3 className="mt-5 font-display text-2xl font-semibold text-ivory">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-0 py-0">
        <div className="border-t border-line/60 px-6 pb-10 pt-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.48em] text-accent">
              The setting
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Where it is settled<span className="italic text-accent">.</span>
            </h2>
          </div>
        </div>
        <div className="mp-stagger grid sm:grid-cols-3">
          {TABLES.map((t) => (
            <figure key={t.city} className="mp-card-motion group relative min-h-[70vw] overflow-hidden sm:min-h-[70vh]">
              <div
                className="mp-card-photo absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${t.img})` }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.2) 45%, transparent 70%)",
                }}
                aria-hidden
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
                  {t.city}
                </p>
                <p className="mt-2 font-display text-xl italic text-ivory">{t.line}</p>
              </figcaption>
              <span
                className="pointer-events-none absolute inset-4 border border-accent/0 transition duration-500 group-hover:border-accent/35"
                aria-hidden
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="px-6 py-28 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-3xl italic leading-[1.35] text-ivory sm:text-[2.75rem]">
            &ldquo;If you have to ask what it is,
            <br />
            it wasn&apos;t meant for you.&rdquo;
          </p>
          <span className="mx-auto mt-12 block h-px w-16 bg-accent/40" />
        </div>
      </section>

      <section className="mp-frame border-t border-line/60 px-6 py-24 sm:px-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <ConclaveLogo size={44} />
          <h2 className="mt-8 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Take your seat<span className="italic text-accent">.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Present yourself. We handle the introductions.
          </p>
          <Link
            href="/onboarding"
            className="mp-btn-lux mt-10 inline-flex rounded-none bg-gradient-to-b from-accent-2 to-accent px-12 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink"
          >
            Request entry
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/60 px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.48em] text-muted/80">
            Conclave · Private society
          </p>
          <p className="text-xs text-muted/50">Introductions that end at a table.</p>
        </div>
      </footer>
    </main>
  );
}
