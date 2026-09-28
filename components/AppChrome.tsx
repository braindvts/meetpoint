"use client";

import { useEffect } from "react";
import MotionField from "@/components/MotionField";
import NotificationSync from "@/components/NotificationSync";
import SplashScreen from "@/components/SplashScreen";
import { refreshDemoGate } from "@/lib/demoFlag";
import { loadProfile } from "@/lib/store";

/** Global chrome: splash on first open, scroll motion, notification feed. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void refreshDemoGate().then((on) => {
      if (!on) loadProfile();
    });
  }, []);

  return (
    <>
      <SplashScreen />
      <MotionField />
      <NotificationSync />
      {children}
    </>
  );
}
