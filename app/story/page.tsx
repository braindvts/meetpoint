import type { Metadata } from "next";
import Link from "next/link";
import CaptionCopy from "@/components/CaptionCopy";
import SocialPost from "@/components/SocialPost";

export const metadata: Metadata = {
  title: "Post Conclave",
  description: "Social posts for early access — website now, app soon.",
  robots: { index: false, follow: false },
};

type Variant = "story" | "feed" | "portrait";

const DOWNLOADS: { variant: Variant; href: string; label: string; size: string }[] = [
  { variant: "story", href: "/social/conclave-story.png", label: "Story", size: "1080×1920" },
  { variant: "feed", href: "/social/conclave-feed.png", label: "Feed", size: "1080×1080" },
  { variant: "portrait", href: "/social/conclave-portrait.png", label: "Post", size: "1080×1350" },
];

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ export?: string }>;
}) {
  const { export: exp } = await searchParams;
  const variant = (["story", "feed", "portrait"] as const).includes(exp as Variant)
    ? (exp as Variant)
    : null;

  if (variant) {
    return (
      <main className="h-dvh w-screen overflow-hidden bg-black" data-story-export="1">
        <SocialPost variant={variant} className="h-full w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-ink px-4 pb-16 pt-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Post this</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ivory">Conclave is live.</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Save a graphic. Paste a caption. Add your site as the link. Website now — app soon.
      </p>

      <SocialPost variant="story" className="mx-auto mt-8 aspect-[9/16] w-full max-w-[340px] rounded-xl" />
      <div className="mx-auto mt-3 grid max-w-[340px] grid-cols-2 gap-2">
        <SocialPost variant="feed" className="aspect-square w-full rounded-lg" />
        <SocialPost variant="portrait" className="aspect-[4/5] w-full rounded-lg" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {DOWNLOADS.map((d) => (
          <a
            key={d.href}
            href={d.href}
            download
            className="flex items-center justify-between rounded-xl bg-gradient-to-b from-accent-2 to-accent px-4 py-3.5 text-[12px] font-semibold text-ink"
          >
            <span>Download {d.label}</span>
            <span className="font-medium text-ink/70">{d.size}</span>
          </a>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ivory">Captions</h2>
      <p className="mt-1 mb-4 text-[13px] text-muted">Copy, then swap in your URL.</p>
      <CaptionCopy />

      <Link href="/" className="mt-10 inline-block text-[13px] text-accent">
        Back to Conclave
      </Link>
    </main>
  );
}
