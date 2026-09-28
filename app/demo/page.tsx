import { notFound } from "next/navigation";
import DemoBypass from "@/components/DemoBypass";
import { demoProfilesServerEnabled } from "@/lib/demoProfiles";

/** Guest bypass. Production returns 404 unless ENABLE_DEMO_PROFILES=1. */
export default function DemoBypassPage() {
  if (!demoProfilesServerEnabled()) notFound();
  return <DemoBypass />;
}
