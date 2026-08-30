/** Soft shimmer placeholder while Discover settles. */
export default function SkeletonCard() {
  return (
    <div className="mp-skeleton overflow-hidden rounded-[18px] border border-accent/15 bg-[#12110f]">
      <div className="aspect-[5/4] w-full bg-panel-2" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-2/3 rounded-sm bg-white/[0.06]" />
        <div className="h-3 w-1/2 rounded-sm bg-white/[0.04]" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
          <div className="h-6 w-16 rounded-full bg-white/[0.04]" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-[52px] w-[52px] rounded-full bg-white/[0.05]" />
          <div className="h-[52px] w-[52px] rounded-full bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}
