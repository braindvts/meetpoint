import { ONBOARDING_STEPS } from "./onboardingDraft";

export const ONBOARDING_STEP_KEY = "interlink.onboarding.step";
const KEY = ONBOARDING_STEP_KEY;

export type StoredOnboardingStep = number | "done" | null;

export function readOnboardingStep(): StoredOnboardingStep {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "done") return "done";
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n >= ONBOARDING_STEPS.length) return null;
    return n;
  } catch {
    return null;
  }
}

export function writeOnboardingStep(step: number | "done"): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, step === "done" ? "done" : String(step));
}

/** Drop saved setup progress. Sign-out must call this so the next person on the device starts clean. */
export function clearOnboardingStep(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

/** Runs in the sign-out response, before the next page can resume someone else's step. */
export function signOutStepScript(): string {
  return `try{localStorage.removeItem(${JSON.stringify(KEY)})}catch(e){}`;
}

const SKIP_RESUME = [
  /^\/$/,
  /^\/login(?:\/|$)/,
  /^\/onboarding(?:\/|$)/,
  /^\/story(?:\/|$)/,
  /^\/demo(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/plan(?:\/|$)/,
  /^\/verify-email(?:\/|$)/,
  /^\/terms(?:\/|$)/,
  /^\/privacy(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/contact(?:\/|$)/,
];

/** App screens that should send an unfinished member back to setup. */
export function onboardingResumeApplies(pathname: string): boolean {
  return !SKIP_RESUME.some((pattern) => pattern.test(pathname));
}
