#!/usr/bin/env node
/**
 * Production / Vercel: apply Prisma migrations only.
 * Never `db push`. Never `--accept-data-loss`.
 *
 * A database that was evolved with `db push` (Interlink Production) has
 * tables but no `_prisma_migrations` history. `prisma migrate deploy`
 * then exits P3005 ("schema is not empty"). Official fix is to baseline
 * the already-applied init migration, then deploy the rest (additive SQL).
 */
import { spawnSync } from "node:child_process";

const INIT = "20260813034540_init";

function prisma(args, { capture = false } = {}) {
  return spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: process.env,
  });
}

function echo(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

if (!process.env.DATABASE_URL) {
  console.error("[interlink] DATABASE_URL is required for prisma migrate deploy.");
  process.exit(1);
}

const first = prisma(["migrate", "deploy"], { capture: true });
echo(first);
if (first.status === 0) process.exit(0);

const text = `${first.stdout || ""}${first.stderr || ""}`;
if (!/P3005|schema is not empty/i.test(text)) {
  process.exit(first.status ?? 1);
}

console.log(
  `[interlink] Database already has tables (pre-migrate history). Baselining ${INIT}, then migrate deploy. Report columns are not dropped.`
);

const resolved = prisma(["migrate", "resolve", "--applied", INIT]);
if (resolved.status !== 0) process.exit(resolved.status ?? 1);

const retry = prisma(["migrate", "deploy"]);
process.exit(retry.status ?? 1);
