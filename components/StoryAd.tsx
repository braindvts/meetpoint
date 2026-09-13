import InterlinkMark from "@/components/InterlinkMark";
import { BRAND, BRAND_LINE, BRAND_TAGLINE } from "@/lib/brand";

export type StoryAdVariant = "story" | "feed" | "portrait";

interface Props {
  variant: StoryAdVariant;
  className?: string;
}

const RATIO: Record<StoryAdVariant, string> = {
  feed: "aspect-square",
  portrait: "aspect-[4/5]",
  story: "aspect-[9/16]",
};

/** Live Interlink studio frame — never rasterizes the old Conclave name. */
export default function StoryAd({ variant, className = "" }: Props) {
  const tall = variant === "story";
  return (
    <article
      className={`relative overflow-hidden bg-[#07080c] text-center text-[#f3efe6] ${RATIO[variant]} ${className}`}
      aria-label={`${BRAND} ${variant} ad`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 18%, rgba(212,196,168,0.16), transparent 52%), radial-gradient(ellipse at 80% 88%, rgba(212,196,168,0.08), transparent 40%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(212,196,168,0.55) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div className="absolute inset-[10px] border border-[rgba(212,196,168,0.22)]" aria-hidden />

      <div
        className={`relative flex h-full flex-col items-center justify-center px-[9%] ${
          tall ? "pb-[8%] pt-[14%]" : "py-[10%]"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-black">
            <InterlinkMark size={22} />
          </span>
          <p className="font-display text-[clamp(1.6rem,6vw,2.4rem)] font-semibold tracking-[-0.03em]">
            {BRAND}
          </p>
        </div>

        <span className="mt-8 h-px w-16 bg-[rgba(212,196,168,0.55)]" aria-hidden />

        <h1
          className={`mt-8 max-w-[16ch] font-display font-semibold leading-[0.95] tracking-[-0.035em] ${
            tall ? "text-[clamp(2.4rem,9vw,4.4rem)]" : "text-[clamp(2rem,7vw,3.4rem)]"
          }`}
        >
          {BRAND_TAGLINE.split(". ").map((line, i) => (
            <span key={line} className="block">
              {line}
              {i === 0 ? "." : ""}
            </span>
          ))}
        </h1>

        <p className="mt-6 max-w-[28ch] text-[clamp(0.85rem,2.4vw,1.05rem)] leading-relaxed text-[#c8c0b2]/80">
          {BRAND_LINE}
        </p>

        <div
          className={`rounded-full bg-gradient-to-b from-[#efe6d6] to-[#d4c4a8] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#14110e] ${
            tall ? "mt-14" : "mt-10"
          }`}
        >
          Open in browser
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#8f877a]">
          Website now · App later
        </p>
      </div>
    </article>
  );
}
