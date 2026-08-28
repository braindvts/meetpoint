"use client";

interface Props {
  className?: string;
}

const btn =
  "inline-flex w-full items-center justify-center gap-2.5 border border-accent/30 bg-ink/60 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory transition hover:border-accent hover:bg-accent/10";

export default function AuthButtons({ className = "" }: Props) {
  return (
    <div className={`grid gap-2.5 ${className}`}>
      <a href="/api/auth/linkedin" className={btn}>
        Continue with LinkedIn
      </a>
      <a href="/api/auth/google" className={btn}>
        Continue with Google
      </a>
      <a href="/api/auth/apple" className={btn}>
        Continue with Apple
      </a>
    </div>
  );
}
