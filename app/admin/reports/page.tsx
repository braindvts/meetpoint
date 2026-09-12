"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  REPORT_CATEGORY_LABEL,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/reportLabels";

type MemberBrief = {
  id: string;
  name: string;
  email?: string | null;
  jobTitle?: string;
  cityName?: string;
  black?: boolean;
  photo?: string;
};

type ReportRow = {
  id: string;
  category: string;
  reason: string;
  status: string;
  notes: string;
  alsoBlocked: boolean;
  createdAt: string;
  reviewedAt: string | null;
  reporter: MemberBrief;
  peer: MemberBrief;
};

const STATUS_FILTERS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
] as const;

function categoryLabel(c: string) {
  return REPORT_CATEGORY_LABEL[c as ReportCategory] || c;
}

function when(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Operator report queue — ADMIN_SECRET via Bearer. */
export default function ReportsAdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("open");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(
    async (tok: string, status: string) => {
      setBusy(true);
      setMessage("");
      try {
        const res = await fetch(`/api/report?status=${encodeURIComponent(status)}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          reports?: ReportRow[];
        };
        if (!data.ok) {
          setMessage(data.error || "Could not load reports");
          setUnlocked(false);
          return;
        }
        setReports(data.reports || []);
        setUnlocked(true);
        setNotesDraft(
          Object.fromEntries((data.reports || []).map((r) => [r.id, r.notes || ""]))
        );
      } catch {
        setMessage("Network error");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!unlocked || !secret) return;
    void load(secret, filter);
  }, [filter, unlocked, secret, load]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!secret.trim()) return;
    await load(secret.trim(), filter);
  }

  async function setStatus(reportId: string, status: ReportStatus) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/report", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          reportId,
          status,
          notes: notesDraft[reportId] || "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setMessage(data.error || "Update failed");
        return;
      }
      setMessage(`Marked ${status}.`);
      await load(secret, filter);
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-ivory">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Reports</h1>
      <p className="mt-2 text-sm text-muted">
        Review member safety reports. Auth uses{" "}
        <code className="text-accent">ADMIN_SECRET</code>.
      </p>

      <nav className="mt-4 flex flex-wrap gap-3 text-[12px] text-muted">
        <Link href="/admin/reports" className="text-accent">
          Reports
        </Link>
        <Link href="/admin/black" className="underline hover:text-ivory">
          BLACK grant
        </Link>
      </nav>

      {!unlocked ? (
        <form onSubmit={unlock} className="mt-8 max-w-md">
          <label className="block text-[11px] uppercase tracking-[0.2em] text-muted">
            Admin secret
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-2 w-full border border-line bg-panel px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !secret.trim()}
            className="mt-4 w-full bg-ivory py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-40"
          >
            {busy ? "Opening…" : "Open queue"}
          </button>
        </form>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  filter === f.value
                    ? "border-accent text-accent"
                    : "border-line text-muted hover:text-ivory"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => void load(secret, filter)}
              className="ml-auto border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ivory disabled:opacity-40"
            >
              Refresh
            </button>
          </div>

          <ul className="mt-6 space-y-4">
            {reports.length === 0 && (
              <li className="border border-line px-4 py-8 text-center text-sm text-muted">
                No reports in this view.
              </li>
            )}
            {reports.map((r) => (
              <li key={r.id} className="border border-line bg-panel/40 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                    {categoryLabel(r.category)} · {r.status}
                  </p>
                  <p className="text-[11px] text-muted">{when(r.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm leading-snug text-ivory">{r.reason}</p>
                <div className="mt-3 grid gap-2 text-[12px] text-muted sm:grid-cols-2">
                  <p>
                    <span className="text-white/40">Reported</span>
                    <br />
                    <span className="text-ivory">{r.peer.name}</span>
                    {r.peer.jobTitle ? ` · ${r.peer.jobTitle}` : ""}
                    <br />
                    <span className="break-all font-mono text-[10px] text-white/30">
                      {r.peer.id}
                    </span>
                  </p>
                  <p>
                    <span className="text-white/40">Reporter</span>
                    <br />
                    <span className="text-ivory">{r.reporter.name}</span>
                    {r.reporter.email ? (
                      <>
                        <br />
                        <span className="text-white/50">{r.reporter.email}</span>
                      </>
                    ) : null}
                    <br />
                    <span className="break-all font-mono text-[10px] text-white/30">
                      {r.reporter.id}
                    </span>
                  </p>
                </div>
                {r.alsoBlocked && (
                  <p className="mt-2 text-[11px] text-accent-2">Reporter also blocked them.</p>
                )}
                <label className="mt-3 block text-[11px] uppercase tracking-[0.16em] text-muted">
                  Operator notes
                  <textarea
                    value={notesDraft[r.id] ?? ""}
                    onChange={(e) =>
                      setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    rows={2}
                    className="mt-1.5 w-full resize-none border border-line bg-ink px-3 py-2 text-sm text-ivory outline-none focus:border-accent"
                    placeholder="Internal notes…"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setStatus(r.id, "reviewing")}
                    className="border border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-ivory disabled:opacity-40"
                  >
                    Reviewing
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setStatus(r.id, "resolved")}
                    className="border border-accent/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setStatus(r.id, "dismissed")}
                    className="border border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-ivory disabled:opacity-40"
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {message && <p className="mt-4 text-sm text-accent-2">{message}</p>}

      <Link href="/profile" className="mt-10 inline-block text-sm text-muted underline">
        Back to profile
      </Link>
    </main>
  );
}
