import type { Metadata } from "next";
import Link from "next/link";
import CaptionCopy from "@/components/CaptionCopy";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Interlink — press kit",
  robots: { index: false, follow: false },
};

export default function StoryPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-16 pt-12 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
        {BRAND_NAME}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ivory">Post this.</h1>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
        Save the picture. Upload it. Copy a caption. The site is the product.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/interlink-instagram.png"
        alt="Interlink Instagram post"
        className="mx-auto mt-8 w-full max-w-[360px] rounded-lg border border-accent/25"
      />

      <div className="mt-6 flex flex-col gap-2">
        <a
          href="/interlink-instagram.png"
          download="interlink-instagram.png"
          className="mp-btn-lux rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[12px] font-semibold text-ink"
        >
          Save picture (PNG)
        </a>
        <a
          href="/interlink-instagram-story.png"
          download="interlink-instagram-story.png"
          className="rounded-xl border border-accent/30 py-3.5 text-[12px] font-semibold text-ivory"
        >
          Story version (vertical)
        </a>
      </div>

      <div className="mt-12 text-left">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
          Captions
        </p>
        <CaptionCopy />
      </div>

      <Link href="/" className="mt-10 inline-block text-[13px] text-muted transition hover:text-ivory">
        Back to {BRAND_NAME}
      </Link>
    </main>
  );
}
