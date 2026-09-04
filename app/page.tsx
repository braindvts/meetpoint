import Link from "next/link";
import DemoEnterButton from "@/components/DemoEnterButton";
import { demoEntryEnabled } from "@/lib/demoFlag";

export default function Landing() {
  return (
    <main className="mp-app relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8 text-center">
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />
      <h1 className="mp-reveal relative text-[2.35rem] font-semibold leading-[1.1] tracking-[0.06em] text-accent sm:text-5xl">
        CONCLAVE
      </h1>
      <p className="mp-reveal mp-reveal-delay-2 relative mt-5 max-w-xs text-[15px] font-normal leading-snug text-ivory/70">
        The private network for ambitious people.
      </p>
      <div className="mp-reveal mp-reveal-delay-3 relative mt-12 flex w-full max-w-xs flex-col items-center gap-4">
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent py-3.5 text-[12px] font-semibold tracking-wide text-ink"
        >
          Get started
        </Link>
        <Link href="/login" className="text-[13px] text-muted">
          Sign in
        </Link>
        {demoEntryEnabled() && (
          <DemoEnterButton label="Enter demo" className="text-[13px] text-accent" />
        )}
      </div>
    </main>
  );
}
