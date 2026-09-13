import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("Vercel / npm build must not mutate Postgres", () => {
  it("runs prisma generate && next build only", () => {
    const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
      buildCommand?: string;
    };
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      scripts?: { build?: string };
    };
    assert.equal(vercel.buildCommand, "prisma generate && next build");
    assert.doesNotMatch(String(vercel.buildCommand), /db push|accept-data-loss/);
    assert.equal(pkg.scripts?.build, "prisma generate && next build");
    assert.doesNotMatch(String(pkg.scripts?.build), /db push|accept-data-loss/);
  });

  it("keeps production Report columns in the schema", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    for (const field of ["alsoBlocked", "category", "notes", "status"]) {
      assert.match(schema, new RegExp(`\\b${field}\\b`));
    }
  });
});
