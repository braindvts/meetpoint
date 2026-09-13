import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "ios"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

test("the tree does not publish an owner mailbox or password", () => {
  const banned = ["Brian812", "brianasome@gmail.com"];
  const hits: string[] = [];
  for (const file of walk(ROOT)) {
    if (file.endsWith(".test.ts")) continue;
    const text = readFileSync(file, "utf8");
    for (const needle of banned) {
      if (text.includes(needle)) hits.push(`${file}: ${needle}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("email signup 409s on any existing member, not only password hashes", () => {
  const src = readFileSync(join(ROOT, "app/api/auth/email/route.ts"), "utf8");
  assert.match(src, /emailSignupTaken\(existing\)/);
  assert.doesNotMatch(src, /existing\?\.passwordHash/);
  assert.doesNotMatch(src, /prisma\.member\.update/);
});

test("Apple callback exchanges the code and never reads a form id_token", () => {
  const src = readFileSync(join(ROOT, "app/api/auth/apple/callback/route.ts"), "utf8");
  assert.match(src, /https:\/\/appleid\.apple\.com\/auth\/token/);
  assert.match(src, /verifyAppleIdToken/);
  assert.match(src, /grant_type": "authorization_code"|grant_type: "authorization_code"/);
  assert.doesNotMatch(src, /form\.get\("id_token"\)/);
  assert.doesNotMatch(src, /decodeJwtPayload/);
});
