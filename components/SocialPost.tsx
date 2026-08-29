interface Props {
  variant: "story" | "feed" | "portrait";
  className?: string;
}

const SRC = {
  story: { src: "/social/conclave-ad-story.png", alt: "Conclave story ad" },
  feed: { src: "/social/conclave-ad-feed.png", alt: "Conclave feed ad" },
  portrait: { src: "/social/conclave-ad-portrait.png", alt: "Conclave portrait ad" },
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
