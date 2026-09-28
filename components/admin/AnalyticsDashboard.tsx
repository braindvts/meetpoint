import Link from "next/link";
import { PLACEMENT_LABEL, type PartnerPlacement } from "@/lib/analyticsIngest";
import type { ChartPoint, DashboardData, RangeKey } from "@/lib/analyticsDashboard";

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "all", label: "All time" },
];

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  reviewing: "Reviewing",
  resolved: "Resolved",
  dismissed: "Dismissed",
  going: "Going",
  saved: "Saved",
  passed: "Passed",
  interested: "Interested",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] || status;
}

function Bars({ series }: { series: ChartPoint[] }) {
  const max = Math.max(1, ...series.map((point) => point.count));
  const dense = series.length > 16;
  return (
    <div className="mt-4 w-full min-w-0 max-w-full overflow-x-auto">
      <div
        className="flex h-32 items-end gap-1"
        style={{ minWidth: dense ? `${series.length * 1.35}rem` : undefined }}
        role="img"
        aria-label={series.map((point) => `${point.label}: ${point.count}`).join(", ")}
      >
        {series.map((point) => (
          <div key={point.label} className="flex h-full min-w-[0.7rem] flex-1 flex-col justify-end">
            <div
              className="w-full bg-accent"
              style={{
                height: `${Math.max(point.count > 0 ? 4 : 2, Math.round((point.count / max) * 100))}%`,
                opacity: point.count > 0 ? 1 : 0.28,
              }}
              title={`${point.label}: ${point.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
        <span>{series[0]?.label}</span>
        <span>{series.length > 2 ? series[Math.floor(series.length / 2)]?.label : ""}</span>
        <span>
          {series[series.length - 1]?.label} ET
        </span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-ivory">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}

export default function AnalyticsDashboard({
  data,
  sample = false,
  basePath = "/admin/analytics",
}: {
  data: DashboardData;
  sample?: boolean;
  basePath?: string;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Admin</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Analytics</h1>
        <div className="grid grid-cols-3 gap-2 sm:flex" role="group" aria-label="Date range">
          {RANGES.map((item) => {
            const active = data.range === item.id;
            return (
              <Link
                key={item.id}
                href={`${basePath}?range=${item.id}`}
                aria-current={active ? "true" : undefined}
                className={`inline-flex min-h-11 items-center justify-center px-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  active
                    ? "bg-accent text-ink"
                    : "border border-line text-ivory hover:border-accent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {sample ? (
        <p className="mt-5 border border-accent px-4 py-3 text-sm text-accent">
          Sample data. These figures are fixtures for layout review, not live traffic.
        </p>
      ) : (
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
          Partner clicks and page views count from the deploy that turned this tracking on.
          Accounts, BLACK memberships, event RSVPs, and reports are read from the database
          and include earlier history. Chart days are Eastern Time (ET).
        </p>
      )}

      <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted" aria-label="Admin">
        <Link href="/admin/analytics" className="text-accent">
          Analytics
        </Link>
        <Link href="/admin/reports" className="underline hover:text-ivory">
          Reports
        </Link>
        <Link href="/admin/black" className="underline hover:text-ivory">
          BLACK grant
        </Link>
      </nav>

      <section className="mt-8 min-w-0 border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Stat value={data.clicks.total} label="Partner clicks" />
          <p className="max-w-sm text-[12px] leading-relaxed text-muted">
            Outbound links for BijuuFlow, Grounded, ONYX Futures, and Edgeable. Split by
            landing row, loading screen, and featured card.
          </p>
        </div>
        <Bars series={data.clicks.series} />
        {data.clicks.truncated ? (
          <p className="mt-3 text-[12px] text-muted">Latest 20,000 clicks in this range.</p>
        ) : null}
        <ul className="mt-6 divide-y divide-line border-t border-line">
          {data.clicks.byPartner.map((partner) => (
            <li key={partner.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-medium text-ivory">{partner.name}</p>
                <p className="mt-1 break-words text-[12px] text-muted">
                  {(Object.keys(partner.byPlacement) as PartnerPlacement[])
                    .map((placement) => `${PLACEMENT_LABEL[placement]} ${partner.byPlacement[placement]}`)
                    .join(" · ")}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-accent">{partner.total}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 min-w-0 border border-line bg-panel p-4 sm:p-6">
        <Stat value={data.pageviews.total} label="Page views" />
        <p className="mt-3 text-[12px] text-muted">First-party page views by path. Counting from deploy.</p>
        <Bars series={data.pageviews.series} />
        {data.pageviews.truncated ? (
          <p className="mt-3 text-[12px] text-muted">Latest 20,000 page views in this range.</p>
        ) : null}
        <ol className="mt-6 divide-y divide-line border-t border-line">
          {data.pageviews.top.length === 0 ? (
            <li className="py-4 text-sm text-muted">No page views in this range yet.</li>
          ) : (
            data.pageviews.top.map((row) => (
              <li key={row.path} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="truncate text-ivory">{row.path}</span>
                <span className="tabular-nums text-accent">{row.count}</span>
              </li>
            ))
          )}
        </ol>
      </section>

      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 border border-line bg-panel p-4 sm:p-6">
          <Stat value={data.accounts.total} label="Accounts created" />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Real member rows in this range. Sample ids p1–p18, the demo profile, and the
            shared Mohammed sample login are excluded
            {data.accounts.seededInRange > 0
              ? ` (${data.accounts.seededInRange} in range, ${data.accounts.seededAllTime} all time)`
              : data.accounts.seededAllTime > 0
                ? ` (${data.accounts.seededAllTime} all time)`
                : ""}
            .
          </p>
          <Bars series={data.accounts.series} />
          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Member</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-steel">{data.accounts.byStanding.Member}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">Verified</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-accent">{data.accounts.byStanding.Verified}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">BLACK</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-ivory">{data.accounts.byStanding.BLACK}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            Standing is the account’s level today. Verified means business email and LinkedIn
            are on the profile. Signup events recorded since tracking started:{" "}
            <span className="text-ivory">{data.accounts.signupEvents}</span>.
          </p>
        </div>

        <div className="min-w-0 border border-line bg-panel p-4 sm:p-6">
          <Stat value={data.memberships.blackStarted} label="BLACK memberships started" />
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Counted from blackSince. Paid is confirmed through Stripe. Earned and granted
            are stored on the same member row. There is no separate memberships table.
          </p>
          <Bars series={data.memberships.series} />
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
            {(
              [
                ["Paid", data.memberships.bySource.paid],
                ["Earned", data.memberships.bySource.earned],
                ["Granted", data.memberships.bySource.granted],
                ["Other", data.memberships.bySource.other],
              ] as const
            ).map(([label, count]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-ivory">{count}</dd>
              </div>
            ))}
          </dl>
          {data.memberships.blackMissingDate > 0 ? (
            <p className="mt-4 text-[12px] text-muted">
              {data.memberships.blackMissingDate} BLACK account{data.memberships.blackMissingDate === 1 ? "" : "s"} have
              no start date, so they are not in this chart.
            </p>
          ) : null}
          {data.memberships.premierLegacy > 0 ? (
            <p className="mt-3 text-[12px] text-muted">
              Legacy premier flag on {data.memberships.premierLegacy} account
              {data.memberships.premierLegacy === 1 ? "" : "s"}. That is not a current plan.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 border border-line bg-panel p-4 sm:p-6">
          <Stat value={data.rsvps.available ? data.rsvps.total : 0} label="Event RSVPs" />
          {data.rsvps.available ? (
            <>
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {data.rsvps.byStatus.length === 0 ? (
                  <li className="py-4 text-sm text-muted">No RSVPs stored in this range.</li>
                ) : (
                  data.rsvps.byStatus.map((row) => (
                    <li key={row.status} className="flex items-center justify-between py-3 text-sm">
                      <span>{statusLabel(row.status)}</span>
                      <span className="tabular-nums text-accent">{row.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">The RSVP table could not be read.</p>
          )}
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            Read from EventInterest, one row per member. RSVPs saved only in the browser
            before that change are not counted.
          </p>
        </div>

        <div className="min-w-0 border border-line bg-panel p-4 sm:p-6">
          <Stat value={data.reports.available ? data.reports.total : 0} label="Reports" />
          {data.reports.available ? (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {data.reports.byStatus.length === 0 ? (
                <li className="py-4 text-sm text-muted">No reports in this range.</li>
              ) : (
                data.reports.byStatus.map((row) => (
                  <li key={row.status} className="flex items-center justify-between py-3 text-sm">
                    <span>{statusLabel(row.status)}</span>
                    <span className="tabular-nums text-accent">{row.count}</span>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Reports could not be read.</p>
          )}
          <p className="mt-4 text-[12px] leading-relaxed text-muted">
            Review still lives at Reports, behind the same operator secret.
          </p>
        </div>
      </section>
    </div>
  );
}
