import assert from "node:assert/strict";
import { test } from "node:test";
import { csrfOriginAllowed } from "./csrfOrigin.ts";

const APP = "https://interlinkgobal.com";

test("CSRF allows this project's hosts and rejects other Vercel apps", () => {
  const prev = {
    url: process.env.VERCEL_URL,
    branch: process.env.VERCEL_BRANCH_URL,
    prod: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_BRANCH_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

  try {
    assert.equal(csrfOriginAllowed("https://interlinkgobal.com", APP), true);
    assert.equal(csrfOriginAllowed("https://www.interlinkgobal.com", APP), true);
    assert.equal(csrfOriginAllowed("https://meetpoint-flax.vercel.app", APP), true);
    assert.equal(
      csrfOriginAllowed("https://meetpoint-git-legal-braindvts-projects.vercel.app", APP),
      false
    );
    assert.equal(
      csrfOriginAllowed("https://meetpoint-abc123-braindvts-projects.vercel.app", null),
      false
    );

    process.env.VERCEL_URL = "meetpoint-abc123-braindvts-projects.vercel.app";
    assert.equal(
      csrfOriginAllowed("https://meetpoint-abc123-braindvts-projects.vercel.app", null),
      true
    );
    assert.equal(
      csrfOriginAllowed("https://meetpoint-other-braindvts-projects.vercel.app", null),
      false
    );

    process.env.VERCEL_BRANCH_URL = "meetpoint-git-legal-braindvts-projects.vercel.app";
    assert.equal(
      csrfOriginAllowed("https://meetpoint-git-legal-braindvts-projects.vercel.app", null),
      true
    );

    process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://meetpoint-flax.vercel.app";
    assert.equal(csrfOriginAllowed("https://meetpoint-flax.vercel.app", null), true);

    assert.equal(csrfOriginAllowed("https://evil.vercel.app", APP), false);
    assert.equal(csrfOriginAllowed("https://meetpoint-evil.vercel.app", APP), false);
    assert.equal(
      csrfOriginAllowed("https://notmeetpoint-x-braindvts-projects.vercel.app", APP),
      false
    );
    assert.equal(
      csrfOriginAllowed("https://meetpoint-x-braindvts-projects.vercel.app.evil.com", APP),
      false
    );
    assert.equal(csrfOriginAllowed("https://interlinkgobal.com.evil.com", APP), false);
    assert.equal(csrfOriginAllowed("not a url", APP), false);
  } finally {
    if (prev.url === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = prev.url;
    if (prev.branch === undefined) delete process.env.VERCEL_BRANCH_URL;
    else process.env.VERCEL_BRANCH_URL = prev.branch;
    if (prev.prod === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    else process.env.VERCEL_PROJECT_PRODUCTION_URL = prev.prod;
  }
});
