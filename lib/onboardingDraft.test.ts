import assert from "node:assert/strict";
import { test } from "node:test";
import { IDEA_TAGS } from "./data.ts";
import { CITIES } from "./cities.ts";
import {
  INTEREST_GROUPS,
  ONBOARDING_STEPS,
  PROFILE_LIMITS,
  emptyDraft,
  firstIncompleteStep,
  interestGroupCoverage,
  matchingProgress,
  profileSaveError,
  resumeStep,
  validateAll,
  validateBasics,
  validateInterests,
} from "./onboardingDraft.ts";
import { readFileSync } from "node:fs";
import {
  clearOnboardingStep,
  onboardingResumeApplies,
  readOnboardingStep,
  writeOnboardingStep,
} from "./onboardingSession.ts";
import { clearProfile } from "./store.ts";
import type { MyProfile } from "./types.ts";

function filled(): MyProfile {
  return {
    name: "Amina Laurent",
    jobTitle: "Founder",
    company: "Northline",
    industry: "Technology",
    bio: "Building a quiet network for operators who would rather meet in person than collect contacts.",
    photo: "data:image/svg+xml,abc",
    city: CITIES[0],
    travel: "worldwide",
    meetPreference: "open",
    lookingFor: ["Co-founder"],
    ideaTags: ["SaaS", "Fintech", "AI / Machine Learning"],
    verifications: [],
  };
}

test("interest groups cover every canonical tag once", () => {
  const { missing, duplicate } = interestGroupCoverage();
  assert.deepEqual(missing, []);
  assert.deepEqual(duplicate, []);
  const count = INTEREST_GROUPS.reduce((sum, group) => sum + group.tags.length, 0);
  assert.equal(count, IDEA_TAGS.length);
  assert.equal(IDEA_TAGS.length, 67);
});

test("basics validation matches profile limits", () => {
  const draft = emptyDraft(null);
  const missing = validateBasics(draft);
  assert.equal(missing.name, "Enter your name.");
  assert.equal(missing.photo, "Add a photo.");
  assert.equal(missing.jobTitle, "Enter your headline.");

  draft.name = "A".repeat(PROFILE_LIMITS.name + 1);
  draft.jobTitle = "B".repeat(PROFILE_LIMITS.headline + 1);
  draft.company = "C".repeat(PROFILE_LIMITS.company + 1);
  draft.photo = "data:image/jpeg,abc";
  const over = validateBasics(draft);
  assert.match(over.name || "", /80/);
  assert.match(over.jobTitle || "", /120/);
  assert.match(over.company || "", /120/);
});

test("interests cap at 24 and bio at 800", () => {
  const draft = emptyDraft(filled());
  draft.ideaTags = Array.from({ length: 25 }, (_, i) => `Custom topic ${i}`);
  assert.match(validateInterests(draft).ideaTags || "", /24/);
  draft.ideaTags = ["SaaS"];
  draft.bio = "x".repeat(801);
  assert.match(validateAll(draft).bio || "", /800/);
});

test("custom interests reuse the shared plain-text rules", () => {
  const draft = emptyDraft(filled());
  draft.ideaTags = ["https://example.com", "<script>", "A".repeat(41)];
  assert.equal(validateInterests(draft).ideaTags, "Add at least one interest.");
  draft.ideaTags = ["A".repeat(40), "Night markets"];
  assert.equal(validateInterests(draft).ideaTags, undefined);
});

test("resume returns to the stored step and repairs earlier gaps", () => {
  const draft = emptyDraft(null);
  draft.name = "Amina Laurent";
  assert.equal(firstIncompleteStep(draft), 0);
  assert.equal(resumeStep(draft, null), 0);
  assert.equal(resumeStep(draft, 3), 0);

  const ready = emptyDraft(filled());
  assert.equal(firstIncompleteStep(ready), null);
  assert.equal(resumeStep(ready, null), "done");
  assert.equal(resumeStep(ready, "done"), "done");
  assert.equal(resumeStep(ready, 4), 4);

  ready.lookingFor = [];
  assert.equal(resumeStep(ready, "done"), 2);
  assert.equal(resumeStep(ready, 4), 2);
});

test("matching progress ignores a finished profile and names the next gap", () => {
  const done = matchingProgress(filled());
  assert.equal(done.doneCount, done.total);

  const thin = matchingProgress({
    ...filled(),
    industry: "",
    ideaTags: ["SaaS"],
    bio: "",
  });
  assert.ok(thin.doneCount < thin.total);
  const next = thin.items.find((item) => !item.done);
  assert.equal(next?.id, "industry");
});

test("onboarding steps stay in the published order", () => {
  assert.deepEqual(
    ONBOARDING_STEPS.map((step) => step.id),
    ["basics", "work", "goals", "interests", "bio"]
  );
});

test("resume redirect skips marketing, login, legal pages, and the account page", () => {
  assert.equal(onboardingResumeApplies("/"), false);
  assert.equal(onboardingResumeApplies("/login"), false);
  assert.equal(onboardingResumeApplies("/onboarding"), false);
  assert.equal(onboardingResumeApplies("/story"), false);
  assert.equal(onboardingResumeApplies("/admin"), false);
  assert.equal(onboardingResumeApplies("/admin/reports"), false);
  assert.equal(onboardingResumeApplies("/discover"), true);
  assert.equal(onboardingResumeApplies("/events"), false);
  assert.equal(onboardingResumeApplies("/events/founders-table"), false);
  assert.equal(onboardingResumeApplies("/circle"), true);
  assert.equal(onboardingResumeApplies("/chats"), true);

  for (const path of [
    "/verify-email",
    "/verify-email/token",
    "/terms",
    "/terms/use",
    "/privacy",
    "/privacy/notice",
    "/profile",
    "/profile/delete",
    "/contact",
    "/contact/press",
  ]) {
    assert.equal(onboardingResumeApplies(path), false, path);
  }

  assert.equal(onboardingResumeApplies("/profiles"), true);
  assert.equal(onboardingResumeApplies("/verify-email-help"), true);
  assert.equal(onboardingResumeApplies("/terms-extra"), true);
});

test("sign-out drops the saved setup step and leaves the next person alone", () => {
  const store = new Map<string, string>();
  const g = globalThis as typeof globalThis & {
    window?: { dispatchEvent: (event: Event) => boolean };
    localStorage?: Storage;
  };
  const previousWindow = g.window;
  const previousStorage = g.localStorage;
  g.window = { dispatchEvent: () => true };
  g.localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  try {
    writeOnboardingStep(2);
    assert.equal(readOnboardingStep(), 2);
    clearOnboardingStep();
    assert.equal(readOnboardingStep(), null);
    assert.equal(store.has("interlink.onboarding.step"), false);

    writeOnboardingStep("done");
    store.set("meetpoint.profile", "{}");
    clearProfile();
    assert.equal(store.has("interlink.onboarding.step"), false);
    assert.equal(readOnboardingStep(), null);
  } finally {
    if (previousWindow === undefined) delete g.window;
    else g.window = previousWindow;
    if (previousStorage === undefined) delete g.localStorage;
    else g.localStorage = previousStorage;
  }

  const storeSrc = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const profilePage = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");
  const logout = readFileSync(new URL("../app/api/auth/logout/route.ts", import.meta.url), "utf8");
  assert.match(storeSrc, /clearOnboardingStep\(\)/);
  assert.match(profilePage, /clearOnboardingStep\(\)/);
  assert.equal(logout.includes("onboarding"), false);
});

test("a photo over the server limit is rejected and terms consent is named", () => {
  const draft = emptyDraft(filled());
  draft.photo = "x".repeat(PROFILE_LIMITS.photo + 1);
  assert.match(validateBasics(draft).photo || "", /too large/);
  draft.photo = "x".repeat(PROFILE_LIMITS.photo);
  assert.equal(validateBasics(draft).photo, undefined);
  assert.match(profileSaveError("legal_consent_required"), /Accept the Terms/);
  assert.match(profileSaveError(null), /connection/);
});
