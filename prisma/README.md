# Prisma + Vercel (Interlink)

## Why Production deploy `E496JGuojNtKKCk17LmmedxvqU72` failed

Vercel ran `prisma generate && prisma db push && next build`.

`prisma db push` compares `schema.prisma` to the live Postgres and **changes the database to match the file**. The committed `Report` model only had `id`, `reporterId`, `peerId`, `reason`, `createdAt`. Production still has four extra columns that **already contain data**:

| Column | What it is | Why Prisma wanted it gone |
|--------|------------|---------------------------|
| `alsoBlocked` | Reporter also blocked the peer | Not in the committed schema |
| `category` | Report type (harassment, spam, fake, …) | Not in the committed schema |
| `notes` | Extra reporter/operator notes | Not in the committed schema |
| `status` | Review state (open / reviewed / …) | Not in the committed schema |

Those fields were added on the live database (Prisma Studio, one-off SQL, or a schema that was pushed and never committed). Git history on `main` never listed them. `db push` therefore planned `DROP` for each column. Because the columns have rows, Prisma refused without `--accept-data-loss` and the build exited 1.

**Do not** “fix” this with `--accept-data-loss`. That would wipe Report history.

## What we did

1. Put the four columns back on `Report` so the schema matches production and nothing wants to drop them.
2. Added an **additive** migration (`20260913054500_preserve_report_moderation_fields`) that only `ADD COLUMN IF NOT EXISTS`.
3. Stopped running `prisma db push` on every Vercel / `npm run build`.

The app still writes `reason` (and now defaults `status=open`, `alsoBlocked=false`). Events, Tables, chats, and the waitlist are unchanged.

## Recommended commands

| Where | Command | Why |
|-------|---------|-----|
| **Vercel Production / Preview** | `prisma generate && next build` | Compile only. Does not mutate Postgres. |
| Local first-time empty DB | `npx prisma db push` | Creates tables. Never pass `--accept-data-loss`. |
| Align a DB that is missing the Report columns | apply `prisma/migrations/20260913054500_preserve_report_moderation_fields/migration.sql` | Adds columns; does not drop. |
| Confirm live column types | `npx prisma db pull` | Read-only introspection. Review the diff; do not push a DROP. |

Do **not** put `prisma migrate deploy` on the Vercel build yet. The oldest migration (`20260813034540_init`) is SQLite-shaped (`DATETIME`, `REAL`). Production was evolved with `db push`, so a blind `migrate deploy` can try to replay the wrong history.

## If schema and production drift again

1. `npx prisma db pull` against a **read** URL.
2. Keep any production column that still has meaning or data — especially on `Report`.
3. Write an additive SQL migration. Review it.
4. Apply it **once**, separately from the Next.js build.
5. Deploy with `prisma generate && next build`.
