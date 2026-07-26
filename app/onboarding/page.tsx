"use client";

import { useEffect, useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { loadProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

export default function OnboardingPage() {
  const [initial, setInitial] = useState<MyProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInitial(loadProfile());
    setReady(true);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 pb-24">
      <h1 className="text-3xl font-extrabold tracking-tight">Create your profile</h1>
      <p className="mt-2 mb-10 text-slate-400">
        This is what your future partners see. Make it count.
      </p>
      {ready && <ProfileForm initial={initial} />}
    </main>
  );
}
