#!/usr/bin/env node
/**
 * Generate APPLE_CLIENT_SECRET — the ES256 JWT Apple wants instead of a plain secret.
 *
 *   node scripts/apple-client-secret.mjs \
 *     --team-id ABCDE12345 \
 *     --key-id XYZ9876543 \
 *     --client-id com.yourdomain.conclave.web \
 *     --key ~/Downloads/AuthKey_XYZ9876543.p8
 *
 * Apple caps these at six months, so re-run it and update the env var before it expires.
 */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const SIX_MONTHS_SECONDS = 15777000;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

const teamId = arg("team-id") || process.env.APPLE_TEAM_ID;
const keyId = arg("key-id") || process.env.APPLE_KEY_ID;
const clientId = arg("client-id") || process.env.APPLE_CLIENT_ID;
const keyPath = arg("key") || process.env.APPLE_KEY_PATH;

const missing = [
  ["--team-id", teamId],
  ["--key-id", keyId],
  ["--client-id", clientId],
  ["--key", keyPath],
].filter(([, value]) => !value);

if (missing.length) {
  console.error(
    `Missing ${missing.map(([flag]) => flag).join(", ")}\n\n` +
      "  --team-id    Apple Developer team id (top right of developer.apple.com)\n" +
      "  --key-id     the 10-character id of your Sign In with Apple key\n" +
      "  --client-id  your Services ID, e.g. com.yourdomain.conclave.web\n" +
      "  --key        path to the downloaded AuthKey_XXXXXXXXXX.p8\n"
  );
  process.exit(1);
}

let privateKey;
try {
  privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME || "~"), "utf8");
} catch {
  console.error(`Could not read the key file at ${keyPath}`);
  process.exit(1);
}

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + SIX_MONTHS_SECONDS;

const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
const payload = base64url(
  JSON.stringify({
    iss: teamId,
    iat: issuedAt,
    exp: expiresAt,
    aud: "https://appleid.apple.com",
    sub: clientId,
  })
);

const signature = createSign("SHA256")
  .update(`${header}.${payload}`)
  .sign({ key: privateKey, dsaEncoding: "ieee-p1363" })
  .toString("base64url");

console.log(`\nAPPLE_CLIENT_ID=${clientId}`);
console.log(`APPLE_CLIENT_SECRET=${header}.${payload}.${signature}`);
console.log(`\nExpires ${new Date(expiresAt * 1000).toISOString().slice(0, 10)} — regenerate before then.\n`);
