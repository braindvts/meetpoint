#!/usr/bin/env node
/**
 * STOP — do not run this against Production.
 *
 * `prisma db push` rewrites the live database to match schema.prisma. It can
 * DROP columns that still have data. That already happened to Report on
 * Production. Apply changes with `npm run db:deploy` (`prisma migrate deploy`).
 * Never pass `--accept-data-loss`.
 *
 * This command refuses to run when VERCEL_ENV=production, when --accept-data-loss
 * is present, or when DATABASE_URL looks like production (a remote host whose
 * name is not clearly dev, local, staging, preview, test, or ci).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const WARNING = [
  "WARNING: prisma db push can DROP live columns.",
  "Production must use `npm run db:deploy` (prisma migrate deploy) only.",
  "Never use --accept-data-loss.",
].join(" ");

export function dbPushBlockReason(env = process.env, argv = process.argv) {
  if (argv.some((arg) => String(arg).includes("accept-data-loss"))) {
    return "Refusing prisma db push: --accept-data-loss is not allowed. Use prisma migrate deploy.";
  }
  if ((env.VERCEL_ENV || "").trim().toLowerCase() === "production") {
    return "Refusing prisma db push: VERCEL_ENV=production. Use prisma migrate deploy.";
  }
  const url = (env.DATABASE_URL || "").trim();
  if (!url) {
    return "Refusing prisma db push: DATABASE_URL is empty.";
  }
  if (databaseUrlLooksLikeProduction(url)) {
    return "Refusing prisma db push: DATABASE_URL looks like production. Use prisma migrate deploy.";
  }
  return null;
}

/** Remote databases count as production unless the host or db name is clearly non-prod. */
export function databaseUrlLooksLikeProduction(raw) {
  let parsed;
  try {
    parsed = new URL(raw.replace(/^postgres(ql)?:/i, "http:"));
  } catch {
    return true;
  }
  const host = parsed.hostname.toLowerCase();
  const name = decodeURIComponent(parsed.pathname.replace(/^\//, "")).toLowerCase();
  if (!host) return true;
  if (host.includes("interlinkgobal")) return true;
  if (hasProdMarker(host) || hasProdMarker(name)) return true;
  if (isLocalHost(host)) return false;
  return !hasNonProdMarker(host) && !hasNonProdMarker(name);
}

function isLocalHost(host) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

function hasProdMarker(value) {
  return /(^|[._-])prod(uction)?([._-]|$)/i.test(value) || value.includes("production");
}

function hasNonProdMarker(value) {
  return /(dev|local|staging|preview|test|ci|sandbox)/i.test(value);
}

function main() {
  console.error(WARNING);
  const reason = dbPushBlockReason();
  if (reason) {
    console.error(reason);
    process.exit(1);
  }
  const extra = process.argv.slice(2);
  const result = spawnSync("npx", ["prisma", "db", "push", ...extra], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) main();
