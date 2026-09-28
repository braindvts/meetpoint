#!/usr/bin/env node
/**
 * Apply Prisma migrations with `prisma migrate deploy` only.
 * Never `db push`. Never `--accept-data-loss`.
 *
 * The build runs this script on every deploy, but it applies SQL only when
 * VERCEL_ENV is production, or when MIGRATE_ON_PREVIEW=1 (Preview opt-in,
 * after that database is confirmed separate from production). Otherwise it
 * logs and exits 0 so `next build` still runs. `prisma generate` stays in
 * the build command and is not skipped here.
 *
 * Locally, apply migrations with `npm run db:deploy` (not part of `npm run build`).
 *
 * A database that was evolved with `db push` (Interlink Production) has
 * tables but no `_prisma_migrations` history. `prisma migrate deploy`
 * then exits P3005 ("schema is not empty"). Official fix is to baseline
 * the already-applied init migration, then deploy the rest (additive SQL).
 */
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const INIT = "20260813034540_init";

/**
 * Whether a build should apply migrations.
 * `npm run db:deploy` is decided by the caller (explicit local command).
 */
export function shouldMigrateOnBuild(env = process.env) {
  const vercelEnv = String(env.VERCEL_ENV || "").trim();
  if (vercelEnv === "production") {
    return { run: true, reason: "VERCEL_ENV=production" };
  }
  if (String(env.MIGRATE_ON_PREVIEW || "").trim() === "1") {
    return { run: true, reason: "MIGRATE_ON_PREVIEW=1" };
  }
  const reason = vercelEnv
    ? `VERCEL_ENV is "${vercelEnv}", not production, and MIGRATE_ON_PREVIEW is not 1`
    : "VERCEL_ENV is not production and MIGRATE_ON_PREVIEW is not 1";
  return { run: false, reason };
}

/** Explicit local apply. Not used by the Vercel build command. */
export function isExplicitMigrate(env = process.env, argv = process.argv) {
  return env.npm_lifecycle_event === "db:deploy" || argv.includes("--force");
}

export function migrateSkipLog(reason) {
  return [
    `[interlink] Skipping prisma migrate deploy: ${reason}.`,
    "Migrations run only when VERCEL_ENV=production, or when MIGRATE_ON_PREVIEW=1 (set that only on Vercel Preview after confirming Preview uses its own database).",
    "prisma generate still runs before this step.",
    "This script does not rewrite the live schema and does not fall back to a schema push.",
    "Locally, apply migrations with: npm run db:deploy",
  ].join(" ");
}

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

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

function main() {
  const explicit = isExplicitMigrate();
  const decision = shouldMigrateOnBuild();
  if (!explicit && !decision.run) {
    console.log(migrateSkipLog(decision.reason));
    process.exit(0);
  }

  const why = explicit && !decision.run ? "npm run db:deploy" : decision.reason;
  console.log(`[interlink] Running prisma migrate deploy (${why}).`);

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
}

if (isDirectRun()) main();
