/** Soft shimmer placeholder while Discover settles. */
export default function SkeletonCard() {
  return (
    <div className="mp-skeleton overflow-hidden rounded-[18px] border border-accent/15 bg-[#12110f]">
      <div className="flex gap-3.5 px-4 pb-3 pt-4">
        <div className="h-[86px] w-[86px] shrink-0 rounded-[14px] bg-panel-2" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded-sm bg-white/[0.07]" />
          <div className="h-3 w-1/2 rounded-sm bg-white/[0.05]" />
          <div className="h-2.5 w-2/5 rounded-sm bg-white/[0.04]" />
        </div>
      </div>
      <div className="space-y-2.5 border-t border-white/[0.07] px-4 py-3.5">
        <div className="h-2.5 w-full rounded-sm bg-white/[0.04]" />
        <div className="h-2.5 w-11/12 rounded-sm bg-white/[0.04]" />
        <div className="h-2.5 w-3/4 rounded-sm bg-white/[0.04]" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-24 rounded-full bg-white/[0.04]" />
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex gap-3 border-t border-white/[0.07] px-4 py-3">
        <div className="h-11 w-11 rounded-full bg-white/[0.05]" />
        <div className="h-11 w-11 rounded-full bg-white/[0.08]" />
      </div>
    </div>
  );
}
