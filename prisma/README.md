# Prisma + Vercel (Interlink)

Security (H7): Production must **not** use `prisma db push`. Use `prisma migrate deploy` only. Never `--accept-data-loss`.

## Why Production deploy `E496JGuojNtKKCk17LmmedxvqU72` failed

Vercel ran `prisma generate && prisma db push && next build`.

`prisma db push` rewrites live Postgres to match `schema.prisma`. The committed `Report` model only had `id`, `reporterId`, `peerId`, `reason`, `createdAt`. Production still has four columns that **already contain data**:

| Column | What it is |
|--------|------------|
| `alsoBlocked` | Reporter also blocked the peer |
| `category` | Report type (harassment, spam, fake, …) |
| `notes` | Extra reporter/operator notes |
| `status` | Review state (open / reviewed / …) |

Those fields were added on the live database (Studio, SQL, or an uncommitted schema). `db push` planned `DROP`, saw data, and exited asking for `--accept-data-loss`.

**Do not** “fix” this with `--accept-data-loss`. That would wipe Report history.

## What we do instead

1. `Report` in `schema.prisma` includes the four columns so nothing wants them gone.
2. Migrations are **additive and idempotent** (`IF NOT EXISTS`, no `DROP`). A later additive migration adds `Report.reviewedAt` and status indexes used by the current report queue. `20260928150000_rate_limit_bucket` adds only the `RateLimitBucket` table.
3. Vercel / `npm run build` is `prisma generate && node scripts/prisma-migrate-deploy.mjs && next build`.

That script runs **`prisma migrate deploy` only**. It never calls `db push` and never passes `--accept-data-loss`.

`migrate deploy` applies pending SQL only. It does **not** diff the schema and drop extra columns. Events, Tables, chats, and the waitlist are unchanged.

The oldest migration was SQLite-shaped (`DATETIME`, `REAL`). It is rewritten as Postgres `CREATE TABLE IF NOT EXISTS`. Production was evolved with `db push`, so the first `migrate deploy` would exit **P3005** (schema not empty, no history). The script then baselines `20260813034540_init` with `prisma migrate resolve --applied` (marks it applied, runs no SQL) and deploys the remaining **additive** migrations. Report rows stay.

## Recommended commands

| Where | Command |
|-------|---------|
| **Vercel Production / Preview** | `prisma generate && node scripts/prisma-migrate-deploy.mjs && next build` |
| Apply migrations only | `npm run db:deploy` (same script) |
| Confirm live column types | `npx prisma db pull` (read-only). Review. Never push a DROP. |
| Local empty DB (dev only) | `npx prisma migrate deploy` — **not** `db push` on anything shared with Production |

Never pass `--accept-data-loss`. Never put `prisma db push` in the Vercel build.

## If schema and production drift again

1. `npx prisma db pull` against a **read** URL.
2. Keep any production column that still has meaning or data — especially on `Report`.
3. Write an **additive** migration (`ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`).
4. Review the SQL. No `DROP` on Report.
5. Ship it. Vercel runs `scripts/prisma-migrate-deploy.mjs` (`migrate deploy` only) on the next Production build.

## Merge order with the safety PR

`20260928150000_rate_limit_bucket` (report/block safety work) sorts **before** `20260928160000_member_profile_interests`. Apply the safety migration first. Prisma refuses a later `migrate deploy` if an earlier migration is still missing (`historiesDiverge`). This migration does not create `RateLimitBucket`, `Block`, or `Report`.

When both schema edits land, keep `RateLimitBucket` from the safety PR and `Member.company`, `Member.industry`, `Member.isSample`, `Member.sampleKind`, and `MemberInterest` from this one.

## Event RSVPs

`EventInterest` already exists on the live database and in `20260913040000_event_interest`. It was missing from `schema.prisma`. `20260928180000_event_interest_baseline` creates the same table with `IF NOT EXISTS` (and the same indexes and foreign key). If the table is already there, the migration changes nothing and does not delete RSVP rows. The Prisma model uses those exact columns: `id`, `memberId`, `eventId`, `status`, `createdAt`, `updatedAt`.

## Sample accounts

`20260928160000_member_profile_interests` adds `company`, `industry`, `isSample`, `sampleKind`, and `MemberInterest`. It marks known sample rows. It does not delete them.

Brian has approved deleting bot accounts. The cleanup script is still dry-run unless `--apply` is passed. It is not in `npm run build`, Vercel’s build command, or CI. If those environments start it, it exits without touching the database.

Run it for real only after the owner confirms a database backup and a teammate reviews the dry-run output on a preview:

```
npx tsx scripts/cleanup-sample-accounts.ts           # dry run
npx tsx scripts/cleanup-sample-accounts.ts --apply   # delete, after that review
```

The dry run lists each sample account and what would be removed, kept, or reassigned. Nothing is reassigned. Real members, their RSVPs, and the event catalog stay. See the comment at the top of that script.
