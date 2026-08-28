"use client";

import { useRouter } from "next/navigation";
import { enterAsDemo } from "@/lib/store";

interface Props {
  className?: string;
  label?: string;
}

export default function DemoEnterButton({
  className = "",
  label = "Enter as Mohammed (skip setup)",
}: Props) {
  const router = useRouter();

  function enter() {
    enterAsDemo();
    router.push("/discover");
  }

  return (
    <button
      type="button"
      onClick={enter}
      className={
        className ||
        "inline-flex w-full items-center justify-center rounded-xl border border-accent/40 px-6 py-3.5 text-[13px] font-medium text-accent transition hover:bg-accent/5"
      }
    >
      {label}
    </button>
  );
}
