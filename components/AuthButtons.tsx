"use client";

interface Props {
  className?: string;
}

const btn =
  "mp-row inline-flex w-full items-center justify-center gap-2.5 rounded-[4px] border border-accent/25 bg-[#12110f] px-5 py-3.5 text-[13px] font-medium text-ivory";

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
