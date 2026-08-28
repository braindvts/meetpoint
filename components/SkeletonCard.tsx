/** Soft shimmer placeholder while The Room settles. */
export default function SkeletonCard() {
  return (
    <div className="mp-skeleton overflow-hidden border border-line/50 bg-panel/40">
      <div className="aspect-[4/5] w-full bg-panel-2" />
      <div className="space-y-2.5 p-4">
        <div className="h-3 w-2/3 rounded-sm bg-white/[0.06]" />
        <div className="h-2.5 w-full rounded-sm bg-white/[0.04]" />
        <div className="h-2.5 w-4/5 rounded-sm bg-white/[0.04]" />
      </div>
    </div>
  );
}
