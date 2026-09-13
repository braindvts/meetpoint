/** Soft shimmer placeholder while Discover settles. */
export default function SkeletonCard() {
  return (
    <div className="mp-skeleton overflow-hidden rounded-[4px] border border-accent/15 bg-[#12110f]">
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="h-16 w-16 shrink-0 rounded-[3px] bg-panel-2" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 bg-white/[0.07]" />
          <div className="h-3 w-1/2 bg-white/[0.05]" />
          <div className="h-2.5 w-2/5 bg-white/[0.04]" />
        </div>
      </div>
      <div className="space-y-2.5 border-t border-white/[0.07] px-4 py-3.5">
        <div className="h-2.5 w-full bg-white/[0.04]" />
        <div className="h-2.5 w-11/12 bg-white/[0.04]" />
        <div className="h-2.5 w-3/4 bg-white/[0.04]" />
      </div>
      <div className="flex gap-3 border-t border-white/[0.07] px-4 py-3">
        <div className="h-11 w-11 bg-white/[0.05]" />
        <div className="h-11 w-11 bg-white/[0.08]" />
      </div>
    </div>
  );
}
