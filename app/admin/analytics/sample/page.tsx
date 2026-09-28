import { notFound } from "next/navigation";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import Nav from "@/components/Nav";
import { parseRange } from "@/lib/analyticsDashboard";
import { sampleDashboard } from "@/lib/analyticsSample";

export const dynamic = "force-dynamic";

/** Development-only fixture. Production always 404s. */
export default async function SampleAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const data = sampleDashboard(parseRange(params.range));
  return (
    <>
      <Nav />
      <main className="min-h-dvh bg-ink px-4 py-8 text-ivory sm:px-6 sm:py-12">
        <AnalyticsDashboard data={data} sample basePath="/admin/analytics/sample" />
      </main>
    </>
  );
}
