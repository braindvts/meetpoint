"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProfileForm from "@/components/ProfileForm";
import { clearProfile, loadProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/onboarding");
      return;
    }
    setProfile(p);
    setReady(true);
  }, [router]);

  function reset() {
    if (confirm("Delete your profile and all connections?")) {
      clearProfile();
      router.push("/");
    }
  }

  if (!ready) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-10 pb-24">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Your profile</h1>
          <button
            onClick={reset}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            Reset
          </button>
        </div>
        <ProfileForm initial={profile} />
      </main>
    </>
  );
}
