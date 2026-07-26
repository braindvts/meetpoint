import Link from "next/link";

const STEPS = [
  {
    icon: "👤",
    title: "Tell us what you're building",
    text: "Your job, your business ideas, your city, and how far you'd travel — around the block or around the world.",
  },
  {
    icon: "🔍",
    title: "Discover your people",
    text: "We match you with people who share your business ideas or work the same job — nearby first, then worldwide.",
  },
  {
    icon: "🍽️",
    title: "Meet at a real table",
    text: "Once you connect, pick a restaurant together. Host them in your city, fly to theirs, or meet in the middle.",
  },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 pb-16 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-line bg-panel px-4 py-1.5 text-sm text-slate-300">
          <span className="h-2 w-2 rounded-full bg-mint" />
          Networking that ends at a dinner table
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Find your people.
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            Meet them over a meal.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-slate-400">
          MeetPoint connects you with people who share your business idea or your
          profession — in your city or across the world. When you match, you pick
          a restaurant and make it real.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-xl bg-accent px-8 py-3.5 font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-2"
          >
            Create your profile
          </Link>
          <Link
            href="/discover"
            className="rounded-xl border border-line bg-panel px-8 py-3.5 font-semibold text-slate-200 transition hover:bg-panel-2"
          >
            Browse matches
          </Link>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-line bg-panel p-6 text-left">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel-2 text-xl">
                {s.icon}
              </span>
              <span className="text-sm font-semibold text-accent">Step {i + 1}</span>
            </div>
            <h3 className="mb-2 font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{s.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
