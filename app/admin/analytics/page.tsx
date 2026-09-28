import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import Nav from "@/components/Nav";
import { ADMIN_COOKIE, canViewAdminDashboard } from "@/lib/adminGate";
import { loadAnalyticsDashboard, parseRange } from "@/lib/analyticsDashboard";
import { getCurrentMember } from "@/lib/memberAuth";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const jar = await cookies();
  let email: string | null = null;
  try {
    const member = await getCurrentMember();
    email = member?.email ?? null;
  } catch {
    email = null;
  }

  const allowed = canViewAdminDashboard({
    email,
    cookie: jar.get(ADMIN_COOKIE)?.value,
    adminEmails: process.env.ADMIN_EMAILS,
    adminSecret: process.env.ADMIN_SECRET,
  });
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
      <Nav />
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
