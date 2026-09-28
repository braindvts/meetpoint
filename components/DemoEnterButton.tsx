"use client";

import { useRouter } from "next/navigation";
import { safeAppPath } from "@/lib/appPath";
import { requestDemoEntry } from "@/lib/demoEntry";

interface Props {
  className?: string;
  label?: string;
  /** Same-site path to open after the guest profile is installed. */
  next?: string | null;
}

export default function DemoEnterButton({
  className = "",
  label = "Enter as Mohammed (skip setup)",
  next,
}: Props) {
  const router = useRouter();

  function enter() {
    void (async () => {
      const ok = await requestDemoEntry();
      if (!ok) return;
      router.push(safeAppPath(next) || "/discover");
    })();
  }

  return (
    <button
      type="button"
      onClick={enter}
      className={
        className ||
        "inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-6 py-3.5 text-[13px] font-medium text-ivory/85 transition hover:border-accent/40 hover:text-accent"
      }
    >
      {label}
    </button>
  );
}
