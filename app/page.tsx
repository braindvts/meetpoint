import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
import { demoEntryEnabled } from "@/lib/demoFlag";
import { pickConclaveLine } from "@/lib/lines";

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
  const line = pickConclaveLine(new Date().getDate());

  return (
    <main className="mp-stage bg-ink text-ivory">
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
                "linear-gradient(105deg, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.86) 38%, rgba(5,5,5,0.42) 100%), linear-gradient(to top, rgba(5,5,5,0.98) 0%, transparent 48%)",
            }}
            aria-hidden
          />
        </div>

        <header className="relative z-10 flex items-center justify-between px-7 py-8 sm:px-12 lg:px-20">
          <span className="mp-kicker">
            Est. MMXXVI
          </span>
          <Link
            href="/login"
            className="border border-accent/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.36em] text-accent-2 transition hover:border-accent hover:bg-accent/10"
          >
            Members
          </Link>
        </header>

        <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 pb-20 text-center">
          <p className="mp-reveal mp-reveal-delay-1 mp-kicker">
            By introduction only
          </p>
          <h1 className="mp-reveal mp-reveal-delay-2 mt-6 font-display text-[clamp(3.75rem,13vw,8.5rem)] font-semibold leading-[0.88] tracking-tight">
            Con<span className="text-accent">clave</span>
          </h1>
          <p className="mp-reveal mp-reveal-delay-3 mt-8 max-w-md font-display text-xl italic leading-snug text-ivory/88 sm:text-2xl">
            {line}
          </p>
          <div className="mp-reveal mp-reveal-delay-4 mt-12 flex flex-col items-center gap-5">
            <Link
              href="/login"
              className="mp-btn-lux inline-flex rounded-none bg-gradient-to-b from-accent-2 to-accent px-14 py-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-ink shadow-[0_16px_48px_rgba(212,196,168,0.22)]"
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
              <Link
                href="/login"
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted underline decoration-accent/30 underline-offset-8 transition hover:text-accent-2"
              >
                Sign in
              </Link>
            </div>
          </div>
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
            <figure
              key={t.city}
              className="mp-card-motion group relative min-h-[70vw] overflow-hidden sm:min-h-[70vh]"
            >
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
            </figure>
          ))}
        </div>
      </section>

      <section className="mp-frame border-t border-line/60 px-6 py-24 sm:px-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Take your seat<span className="italic text-accent">.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Present yourself. We handle the introductions.
          </p>
          <Link
            href="/login"
            className="mp-btn-lux mt-10 inline-flex rounded-none bg-gradient-to-b from-accent-2 to-accent px-12 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink"
          >
            Request entry
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/60 px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          <p className="font-display text-xl font-semibold text-ivory">
            Con<span className="text-accent">clave</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-muted/80">
            Powered by Montevere Co.
          </p>
        </div>
      </footer>
    </main>
  );
}
