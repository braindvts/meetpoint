"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/store";

/** Redirects to onboarding when there is no local membership profile. */
export default function RequireMember({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setOk(true);
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
