import assert from "node:assert/strict";
import { test } from "node:test";
import { csrfOriginAllowed } from "./csrfOrigin.ts";

const APP = "https://interlinkgobal.com";

test("CSRF allows this project's hosts and rejects other Vercel apps", () => {
  assert.equal(csrfOriginAllowed("https://interlinkgobal.com", APP), true);
  assert.equal(csrfOriginAllowed("https://www.interlinkgobal.com", APP), true);
  assert.equal(csrfOriginAllowed("https://meetpoint-flax.vercel.app", APP), true);
  assert.equal(
    csrfOriginAllowed("https://meetpoint-git-legal-braindvts-projects.vercel.app", APP),
    true
  );
  assert.equal(
    csrfOriginAllowed("https://meetpoint-abc123-braindvts-projects.vercel.app", null),
    true
  );

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
});
