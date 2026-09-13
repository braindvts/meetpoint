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
2. Migrations are **additive and idempotent** (`IF NOT EXISTS`, no `DROP`).
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
