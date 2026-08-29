interface Props {
  variant: "story" | "feed" | "portrait";
  className?: string;
}

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{
        aspectRatio: "390 / 844",
        borderRadius: "12.5% / 5.8%",
        boxShadow:
          "0 0 0 0.16cqw #d4c4a8, 0 0 0 0.9cqw #12100e, 0 2.2cqw 4.8cqw rgba(0,0,0,0.78)",
      }}
    >
      <span
        className="absolute left-1/2 z-10 -translate-x-1/2 bg-black"
        style={{ top: "1.2%", width: "30%", height: "3.15%", borderRadius: 999 }}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block h-full w-full object-cover object-top" />
      <span
        className="absolute bottom-[0.85%] left-1/2 z-10 h-[0.42%] w-[34%] -translate-x-1/2 rounded-full bg-white/20"
        aria-hidden
      />
    </div>
  );
}

/** Product ad — live Conclave UI in phone frames, dark studio. No dining photography. */
export default function SocialPost({ variant, className = "" }: Props) {
  const story = variant === "story";
  const feed = variant === "feed";

  return (
    <article
      className={`relative overflow-hidden bg-ink text-center [container-type:size] ${className}`}
      aria-label={`Conclave ${variant} post`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 48% at 50% 46%, rgba(212,196,168,0.16), transparent 62%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-[3%] border border-accent/20" aria-hidden />

      <div
        className={`relative flex h-full flex-col items-center px-[7%] ${
          story ? "pb-[7.5%] pt-[8.5%]" : feed ? "px-[6%] py-[6.5%]" : "pb-[7%] pt-[7.5%]"
        }`}
      >
        <div className="relative z-20 shrink-0">
          <p className="text-[2.5cqw] font-medium uppercase tracking-[0.28em] text-accent">
            Early access
          </p>
          <h1
            className={`font-semibold leading-none tracking-[0.08em] text-accent ${
              feed ? "mt-[2%] text-[10.5cqw]" : "mt-[2.6%] text-[11.5cqw]"
            }`}
          >
            CONCLAVE
          </h1>
          <p
            className={`max-w-[22em] font-normal leading-snug text-ivory ${
              feed ? "mt-[1.8%] text-[3cqw]" : "mt-[2.2%] text-[3.2cqw]"
            }`}
          >
            Networking that ends at a dinner table.
          </p>
        </div>

        <div className="relative mt-[3%] flex min-h-0 w-full flex-1 items-end justify-center overflow-hidden">
          {story ? (
            <div className="relative flex h-full w-full items-end justify-center">
              <Phone
                src="/social/shots/landing.png"
                alt="Conclave website"
                className="absolute bottom-[2%] left-[2%] w-[40%] -rotate-[13deg]"
              />
              <Phone
                src="/social/shots/login.png"
                alt="Conclave sign in"
                className="absolute bottom-[2%] right-[2%] w-[40%] rotate-[12deg]"
              />
              <Phone
                src="/social/shots/discover.png"
                alt="Conclave Discover in the browser"
                className="relative z-10 w-[52%]"
              />
            </div>
          ) : feed ? (
            <div className="flex h-full w-full items-end justify-center gap-[3.5%] pb-[1%]">
              <Phone
                src="/social/shots/landing.png"
                alt="Conclave landing"
                className="w-[38%] -rotate-[6deg]"
              />
              <Phone
                src="/social/shots/discover.png"
                alt="Conclave Discover"
                className="w-[42%] rotate-[5deg]"
              />
            </div>
          ) : (
            <div className="relative flex h-full w-full items-end justify-center">
              <Phone
                src="/social/shots/login.png"
                alt="Conclave sign in"
                className="absolute bottom-[4%] left-[4%] w-[42%] -rotate-[9deg]"
              />
              <Phone
                src="/social/shots/discover.png"
                alt="Conclave Discover"
                className="relative z-10 w-[48%] rotate-[4deg]"
              />
            </div>
          )}
        </div>

        <div className={`relative z-20 shrink-0 ${feed ? "mt-[3.2%]" : "mt-[3%]"}`}>
          <p className="text-[2.7cqw] font-medium uppercase tracking-[0.22em] text-ivory">
            Website now · App soon
          </p>
          <p className="mt-[1.5%] text-[2.9cqw] leading-snug text-ivory/75">
            Beta is open in your browser.
          </p>
        </div>
      </div>
    </article>
  );
}
