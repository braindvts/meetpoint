"use client";

import PageTransition from "@/components/PageTransition";
import PointerField from "@/components/motion/PointerField";
import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash, pointer field, route enter. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <PointerField />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
