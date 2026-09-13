"use client";

import InteractionLayer from "@/components/InteractionLayer";
import PageTransition from "@/components/PageTransition";
import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash, pointer language, soft route enter. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <InteractionLayer />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
