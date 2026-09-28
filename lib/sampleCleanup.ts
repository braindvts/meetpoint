/**
 * Sample-account cleanup planning. The script in scripts/ is dry-run unless
 * --apply is passed, and it refuses to run in CI or on a Vercel build.
 */

export interface CleanupAccount {
  id: string;
  name: string;
  email: string | null;
  kind: string;
  markers: string[];
}

export interface CleanupPlan {
  accounts: CleanupAccount[];
  remove: {
    members: number;
    eventRsvps: number;
    eventIds: string[];
    connections: number;
    emptyChats: number;
    sampleMessages: number;
    blocks: number;
    blackInvites: number;
    blackConnections: number;
    interests: number;
    analytics: number;
    reportsFiledBySamples: number;
  };
  keep: {
    realMemberRsvps: number;
    chatsSharedWithRealMembers: number;
    reportsAboutSamples: number;
  };
}

type Env = Record<string, string | undefined>;

/** Why the script must not run, or null when an operator may run it by hand. */
export function cleanupBlockedByEnvironment(env: Env = process.env): string | null {
  if (env.CI === "true" || env.CI === "1") return "CI";
  if (env.VERCEL === "1" || env.VERCEL === "true") return "a Vercel deploy";
  if ((env.NOW_BUILDER || "").trim()) return "a Vercel build";
  const life = (env.npm_lifecycle_event || "").trim();
  if (life === "build" || life === "postinstall" || life === "start") {
    return `npm ${life}`;
  }
  return null;
}

function lines(label: string, value: number, detail?: string): string {
  const extra = detail ? ` (${detail})` : "";
  return `- ${value} ${label}${extra}`;
}

/** Human-readable dry-run. Nothing in this string is a delete. */
export function formatCleanupPlan(plan: CleanupPlan, apply: boolean): string {
  const header = apply
    ? "Applying sample cleanup because --apply was passed."
    : [
        "Dry run. Nothing was deleted.",
        "Run for real only after the owner confirms a database backup and a teammate has reviewed this output on a preview:",
        "  npx tsx scripts/cleanup-sample-accounts.ts --apply",
      ].join("\n");

  if (plan.accounts.length === 0) {
    return `${header}\n\nNo sample, guest, or bot accounts matched.`;
  }

  const accountLines = plan.accounts
    .map(
      (row) =>
        `- ${row.id}  ${row.name || "(no name)"}  ${row.email || "(no email)"}  kind=${row.kind}  matched=${(row.markers || []).join(", ") || "unknown"}`
    )
    .join("\n");

  const eventDetail =
    plan.remove.eventIds.length === 0
      ? undefined
      : plan.remove.eventIds.length <= 12
        ? plan.remove.eventIds.join(", ")
        : `${plan.remove.eventIds.slice(0, 12).join(", ")}, and ${plan.remove.eventIds.length - 12} more`;

  return [
    header,
    "",
    `Accounts that would be removed (${plan.accounts.length}):`,
    accountLines,
    "",
    "Would remove:",
    lines("member rows", plan.remove.members),
    lines("EventInterest RSVPs belonging to those accounts", plan.remove.eventRsvps, eventDetail),
    lines("connections touching those accounts", plan.remove.connections),
    lines("chats that would be empty afterward", plan.remove.emptyChats),
    lines("messages sent by those accounts", plan.remove.sampleMessages),
    lines("blocks involving those accounts", plan.remove.blocks),
    lines("BLACK invites involving those accounts", plan.remove.blackInvites),
    lines("BLACK connections involving those accounts", plan.remove.blackConnections),
    lines("canonical interest rows", plan.remove.interests),
    lines("analytics events attributed to those accounts", plan.remove.analytics),
    lines("reports filed by those accounts", plan.remove.reportsFiledBySamples),
    "",
    "Would keep:",
    "- the event catalog (events are not member rows)",
    lines("EventInterest RSVPs filed by real members", plan.keep.realMemberRsvps),
    lines(
      "chats that still include a real member (the sample is detached; the chat stays)",
      plan.keep.chatsSharedWithRealMembers
    ),
    lines("reports a real member filed about a sample", plan.keep.reportsAboutSamples),
    "",
    "Would reassign:",
    "- nothing. No event, RSVP, or chat is given to another member.",
  ].join("\n");
}
