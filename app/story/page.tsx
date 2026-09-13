import type { Metadata } from "next";
import Link from "next/link";
import StoryAd from "@/components/StoryAd";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND} — Instagram post`,
  robots: { index: false, follow: false },
};

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const { export: exp } = await searchParams;
  if (exp === "story" || exp === "feed" || exp === "portrait") {
    return (
      <main className="h-dvh w-dvw bg-ink">
        <StoryAd variant={exp} className="h-full w-full !aspect-auto" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-ink px-5 pb-16 pt-10 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Instagram</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ivory">Post this.</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Save the picture. Upload it to Instagram. That&apos;s it.
      </p>

      <div className="mx-auto mt-8 w-full max-w-[360px] overflow-hidden rounded-lg border border-accent/25">
        <StoryAd variant="feed" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <a
          href="/interlink-instagram.png"
          download="interlink-instagram.png"
          className="rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[12px] font-semibold text-ink"
        >
          Save picture (PNG)
        </a>
        <a
          href="/interlink-instagram.pdf"
          download="interlink-instagram.pdf"
          className="rounded-xl border border-accent/30 py-3.5 text-[12px] font-semibold text-ivory"
        >
          Save PDF
        </a>
        <a
          href="/interlink-instagram-story.png"
          download="interlink-instagram-story.png"
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
