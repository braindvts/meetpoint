import { notFound } from "next/navigation";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { loadAnalyticsDashboard, parseRange } from "@/lib/analyticsDashboard";
import { canViewAdminFromRequest } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const allowed = await canViewAdminFromRequest();
  if (!allowed) notFound();

  const params = await searchParams;
  const range = parseRange(params.range);

  let data = null;
  try {
    data = await loadAnalyticsDashboard(range);
  } catch (err) {
    console.error("admin analytics failed", err instanceof Error ? err.name : "error");
  }

  return (
    <>
      <main className="min-h-dvh bg-ink px-4 py-8 text-ivory sm:px-6 sm:py-12">
        {data ? (
          <AnalyticsDashboard data={data} />
        ) : (
          <p className="mx-auto max-w-5xl text-sm text-muted">
            The database could not be read. Counts are unavailable.
          </p>
        )}
      </main>
    </>
  );
}
