"use client";

import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash only when the app first opens (once per session). */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}
