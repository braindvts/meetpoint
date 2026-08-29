interface Props {
  className?: string;
}

/** 9:16 early-access story flyer — website now, app soon. */
export default function StoryArt({ className = "" }: Props) {
  return (
    <article
      className={`relative overflow-hidden bg-ink text-center [container-type:size] ${className}`}
      aria-label="Conclave story flyer"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[32%] h-[42%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/16 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[18px] rounded-[4px] border border-accent/25 sm:inset-6"
        aria-hidden
      />

      <div className="relative flex h-full flex-col items-center px-[11%] pb-[14%] pt-[13%]">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent sm:text-[11px]">
          Early access · Web
        </p>

        <h1 className="mt-[8%] text-[11cqw] font-semibold leading-none tracking-[0.06em] text-accent">
          CONCLAVE
        </h1>
        <p className="mt-4 max-w-[16rem] text-[14px] font-normal leading-snug text-ivory/75 sm:text-[15px]">
          The private network for ambitious people.
        </p>

        <div className="mt-[9%] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/12 bg-[#12110f] text-left shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
            </span>
            <p className="flex-1 truncate rounded-full bg-black/50 px-2.5 py-1 text-center text-[9px] font-medium tracking-wide text-white/45">
              Open in your browser
            </p>
          </div>
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent/80">
              Beta
            </p>
            <p className="mt-3 text-[1.35rem] font-semibold tracking-[0.06em] text-accent">
              CONCLAVE
            </p>
            <p className="mt-3 h-8 w-full max-w-[11rem] rounded-lg bg-gradient-to-b from-accent-2 to-accent text-[10px] font-semibold leading-8 tracking-wide text-ink">
              Get started
            </p>
          </div>
        </div>

        <div className="mt-auto flex w-full max-w-[280px] flex-col items-center">
          <div className="flex w-full items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ivory/80">
            <span>Website now</span>
            <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden />
            <span>App soon</span>
          </div>
          <p className="mt-4 max-w-[17rem] text-[13px] leading-relaxed text-muted">
            Join early access in your browser. The app is coming — the table is already set.
          </p>
          <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.2em] text-accent/70">
            Add your site link to this story
          </p>
        </div>
      </div>
    </article>
  );
}
