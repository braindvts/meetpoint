import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conclave — Instagram post",
  robots: { index: false, follow: false },
};

export default function StoryPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-ink px-5 pb-16 pt-10 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Instagram</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ivory">Post this.</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Save the picture. Upload it to Instagram. That&apos;s it.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/conclave-instagram.png"
        alt="Conclave Instagram post"
        className="mx-auto mt-8 w-full max-w-[360px] rounded-lg border border-accent/25"
      />

      <div className="mt-6 flex flex-col gap-2">
        <a
          href="/conclave-instagram.png"
          download="conclave-instagram.png"
          className="rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[12px] font-semibold text-ink"
        >
          Save picture (PNG)
        </a>
        <a
          href="/conclave-instagram.pdf"
          download="conclave-instagram.pdf"
          className="rounded-xl border border-accent/30 py-3.5 text-[12px] font-semibold text-ivory"
        >
          Save PDF
        </a>
        <a
          href="/conclave-instagram-story.png"
          download="conclave-instagram-story.png"
          className="text-[13px] text-accent"
        >
          Story version (vertical)
        </a>
      </div>

      <Link href="/" className="mt-10 inline-block text-[13px] text-muted">
        Back
      </Link>
    </main>
  );
}
