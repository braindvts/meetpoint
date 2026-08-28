"use client";

interface Props {
  className?: string;
}

export default function AuthButtons({ className = "" }: Props) {
  return (
    <div className={`grid gap-2.5 ${className}`}>
      <a
        href="/api/auth/linkedin"
        className="inline-flex w-full items-center justify-center gap-2.5 border border-line/80 bg-[#0a66c2] px-5 py-3 text-[12px] font-semibold tracking-wide text-white transition hover:brightness-110"
      >
        Continue with LinkedIn
      </a>
      <a
        href="/api/auth/google"
        className="inline-flex w-full items-center justify-center gap-2.5 border border-line bg-panel px-5 py-3.5 text-[12px] font-semibold tracking-wide text-ivory transition hover:border-accent/50"
      >
        Continue with Google
      </a>
      <a
        href="/api/auth/apple"
        className="inline-flex w-full items-center justify-center gap-2.5 border border-ivory/20 bg-black px-5 py-3 text-[12px] font-semibold tracking-wide text-white transition hover:bg-white/5"
      >
        Continue with Apple
      </a>
    </div>
  );
}
