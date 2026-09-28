"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onboardingResumeApplies, readOnboardingStep } from "@/lib/onboardingSession";

/** Sends a member who left setup early back to the step they were on. */
export default function OnboardingResume() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!onboardingResumeApplies(pathname)) return;
    const stored = readOnboardingStep();
    if (stored == null || stored === "done") return;
    router.replace("/onboarding");
  }, [pathname, router]);

  return null;
}
