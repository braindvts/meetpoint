interface Props {
  variant: "story" | "feed" | "portrait";
  className?: string;
}

const ART = {
  story: {
    src: "/social/conclave-bg-story.png",
    alt: "Candlelit table for two",
  },
  feed: {
    src: "/social/conclave-bg-feed.png",
    alt: "Private dinner setting from above",
  },
  portrait: {
    src: "/social/conclave-bg-portrait.png",
    alt: "Private dining room",
  },
} as const;

/** Full-bleed social post — photo + type, not a document. */
export default function SocialPost({ variant, className = "" }: Props) {
  const art = ART[variant];
  const story = variant === "story";
  const feed = variant === "feed";

  return (
    <article
      className={`relative overflow-hidden bg-black text-center [container-type:size] ${className}`}
      aria-label={`Conclave ${variant} post`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.src}
        alt={art.alt}
        className={`absolute inset-0 h-full w-full object-cover ${feed ? "object-center" : "object-[center_70%]"}`}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${
          story
            ? "bg-gradient-to-b from-black/80 via-black/25 to-black/78"
            : feed
              ? "bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.72)_70%)]"
              : "bg-gradient-to-b from-black/78 via-black/30 to-black/70"
        }`}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-[3.5%] border border-accent/35" aria-hidden />

      <div
        className={`relative flex h-full flex-col items-center px-[9%] ${
          story ? "pb-[11%] pt-[12%]" : feed ? "justify-center px-[10%] py-[12%]" : "pb-[10%] pt-[11%]"
        }`}
      >
        <p className="text-[2.8cqw] font-medium uppercase tracking-[0.28em] text-accent">
          Early access
        </p>
        <h1
          className={`font-semibold leading-none tracking-[0.08em] text-accent ${
            feed ? "mt-[4%] text-[13cqw]" : "mt-[5%] text-[12.5cqw]"
          }`}
        >
          CONCLAVE
        </h1>
        <p
          className={`max-w-[22em] font-normal leading-snug text-ivory ${
            feed ? "mt-[4%] text-[3.6cqw]" : "mt-[4.5%] text-[3.8cqw]"
          }`}
        >
          Networking that ends at a dinner table.
        </p>

        <div className={`mt-auto flex w-full flex-col items-center ${feed ? "mt-[9%]" : ""}`}>
          <p className="text-[2.9cqw] font-medium uppercase tracking-[0.22em] text-ivory">
            Website now · App soon
          </p>
          <p className="mt-[3%] max-w-[18em] text-[3.1cqw] leading-snug text-ivory/75">
            Beta is open in your browser.
          </p>
        </div>
      </div>
    </article>
  );
}
