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
  resumeStep,
  validateAll,
  validateBasics,
  validateInterests,
} from "./onboardingDraft.ts";
import { onboardingResumeApplies } from "./onboardingSession.ts";
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

test("resume redirect skips marketing, login, and the wizard itself", () => {
  assert.equal(onboardingResumeApplies("/"), false);
  assert.equal(onboardingResumeApplies("/login"), false);
  assert.equal(onboardingResumeApplies("/onboarding"), false);
  assert.equal(onboardingResumeApplies("/story"), false);
  assert.equal(onboardingResumeApplies("/discover"), true);
  assert.equal(onboardingResumeApplies("/events"), true);
  assert.equal(onboardingResumeApplies("/circle"), true);
  assert.equal(onboardingResumeApplies("/chats"), true);
  assert.equal(onboardingResumeApplies("/profile"), true);
});
