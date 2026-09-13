interface Props {
  variant: "story" | "feed" | "portrait";
  className?: string;
}

const SRC = {
  story: { src: "/social/interlink-ad-story.png", alt: "Interlink story ad" },
  feed: { src: "/social/interlink-ad-feed.png", alt: "Interlink feed ad" },
  portrait: { src: "/social/interlink-ad-portrait.png", alt: "Interlink portrait ad" },
} as const;

/** Finished studio ads — phone + brand, matching the campaign layout. */
export default function SocialPost({ variant, className = "" }: Props) {
  const art = SRC[variant];
  return (
    <article className={`relative overflow-hidden bg-black ${className}`} aria-label={art.alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art.src} alt={art.alt} className="h-full w-full object-cover object-center" />
    </article>
  );
}
