import type { Metadata } from "next";
import Link from "next/link";
import StoryArt from "@/components/StoryArt";

export const metadata: Metadata = {
  title: "Story flyer · Conclave",
  description: "Early access is open in your browser. The app is coming soon.",
  robots: { index: false, follow: false },
};

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const { export: exp } = await searchParams;
  const isExport = exp === "1";

  if (isExport) {
    return (
      <main className="h-dvh w-screen overflow-hidden bg-ink" data-story-export="1">
        <StoryArt className="h-full w-full" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center bg-black px-4 py-8 sm:py-12">
      <StoryArt className="aspect-[9/16] w-full max-h-[min(92dvh,1920px)] max-w-[min(100%,calc(92dvh*9/16),420px)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" />
      <div className="mt-8 flex max-w-sm flex-col items-center gap-3 text-center">
        <a
          href="/social/conclave-story.png"
          download="conclave-story.png"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[12px] font-semibold tracking-wide text-ink"
        >
          Download story PNG
        </a>
        <p className="text-[13px] leading-relaxed text-muted">
          1080×1920 — post to Instagram or TikTok. In the story, add a link sticker to your site.
        </p>
        <Link href="/" className="text-[13px] text-accent">
          Back to Conclave
        </Link>
      </div>
    </main>
  );
}
