import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  isExplicitMigrate,
  migrateSkipLog,
  shouldMigrateOnBuild,
} from "../scripts/prisma-migrate-deploy.mjs";

const BUILD = "prisma generate && node scripts/prisma-migrate-deploy.mjs && next build";

describe("Vercel / npm build uses migrate deploy only", () => {
  it("runs generate, migrate deploy (via script), then next build", () => {
    const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
      buildCommand?: string;
    };
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      scripts?: { build?: string; "db:deploy"?: string };
    };
    const script = readFileSync(new URL("../scripts/prisma-migrate-deploy.mjs", import.meta.url), "utf8");
    const code = script.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.equal(vercel.buildCommand, BUILD);
    assert.equal(pkg.scripts?.build, BUILD);
    assert.equal(pkg.scripts?.["db:deploy"], "node scripts/prisma-migrate-deploy.mjs");
    assert.match(code, /migrate["']?, ["']deploy["']/);
    assert.match(code, /migrate["']?, ["']resolve["']/);
    assert.match(code, /--applied/);
    assert.doesNotMatch(code, /db push|accept-data-loss|dbPush/);
    assert.match(code, /shouldMigrateOnBuild/);
    assert.match(code, /VERCEL_ENV/);
    assert.match(code, /MIGRATE_ON_PREVIEW/);
    assert.match(code, /Skipping prisma migrate deploy/);
    assert.match(code, /npm_lifecycle_event === "db:deploy"/);
    for (const cmd of [vercel.buildCommand, pkg.scripts?.build, pkg.scripts?.["db:deploy"]]) {
      assert.doesNotMatch(String(cmd), /db push|accept-data-loss/);
    }
  });

  it("migrates on production or MIGRATE_ON_PREVIEW=1 and skips otherwise", () => {
    assert.deepEqual(shouldMigrateOnBuild({ VERCEL_ENV: "production" }), {
      run: true,
      reason: "VERCEL_ENV=production",
    });
    assert.equal(shouldMigrateOnBuild({ VERCEL_ENV: "preview", MIGRATE_ON_PREVIEW: "1" }).run, true);
    assert.equal(shouldMigrateOnBuild({ MIGRATE_ON_PREVIEW: "1" }).reason, "MIGRATE_ON_PREVIEW=1");
    assert.equal(shouldMigrateOnBuild({ VERCEL_ENV: "preview" }).run, false);
    assert.equal(shouldMigrateOnBuild({ VERCEL_ENV: "preview", MIGRATE_ON_PREVIEW: "true" }).run, false);
    assert.equal(shouldMigrateOnBuild({ VERCEL_ENV: "development" }).run, false);
    assert.equal(shouldMigrateOnBuild({}).run, false);
    assert.match(
      migrateSkipLog(shouldMigrateOnBuild({ VERCEL_ENV: "preview" }).reason),
      /VERCEL_ENV is "preview", not production, and MIGRATE_ON_PREVIEW is not 1/
    );
    assert.match(migrateSkipLog("because"), /npm run db:deploy/);
    assert.equal(isExplicitMigrate({ npm_lifecycle_event: "db:deploy" }, []), true);
    assert.equal(isExplicitMigrate({ npm_lifecycle_event: "build" }, []), false);
    assert.equal(isExplicitMigrate({}, ["node", "scripts/prisma-migrate-deploy.mjs", "--force"]), true);
  });

  it("keeps production Report columns in the schema", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    for (const field of ["alsoBlocked", "category", "notes", "status"]) {
      assert.match(schema, new RegExp(`\\b${field}\\b`));
    }
  });

  it("migrations never drop Report columns", () => {
    const root = new URL("../prisma/migrations/", import.meta.url);
    const sqlFiles = readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => {
        const dir = new URL(`${d.name}/`, root);
        return readdirSync(dir)
          .filter((name) => name.endsWith(".sql"))
          .map((name) => ({ name: `${d.name}/${name}`, sql: readFileSync(new URL(name, dir), "utf8") }));
      });
    assert.ok(sqlFiles.length >= 3, "expected committed migrations");
    for (const { name, sql } of sqlFiles) {
      const statements = sql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      assert.doesNotMatch(statements, /DROP\s+TABLE/i, name);
      assert.doesNotMatch(statements, /DROP\s+COLUMN/i, name);
      assert.doesNotMatch(statements, /accept-data-loss/i, name);
    }
  });
});
