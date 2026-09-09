"use client";

interface Props {
  className?: string;
}

const shell =
  "inline-flex w-full items-center justify-center gap-2.5 rounded-lg px-4 py-2.5 text-[13px] font-semibold tracking-wide transition";

function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M5.3 14.3l-.8.6-2.5 1.9C3.5 20.1 7.5 23 12 23c3 0 5.5-1 7.3-2.7l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9z"
      />
      <path
        fill="#4A90E2"
        d="M3 7.2C2.4 8.4 2 9.7 2 11s.4 2.6 1 3.8l3.3-2.5c-.2-.6-.3-1.2-.3-1.3s.1-.8.3-1.3L3 7.2z"
      />
      <path
        fill="#FBBC05"
        d="M12 4.8c1.6 0 3.1.6 4.2 1.6L19 3.6C17.1 1.8 14.7 1 12 1 7.5 1 3.5 3.9 2 7.2l3.3 2.5C6 7.5 8.5 4.8 12 4.8z"
      />
    </svg>
  );
}

function AppleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden>
      <path d="M16.7 7.5c-.9.1-2-.6-2.6-1.3-.6-.7-1.1-1.9-.9-3 .9.1 1.9.6 2.5 1.3.6.8 1.1 1.9 1 3zM19.5 17c-.4 1-1 2-1.7 2.7-.7.8-1.4 1.3-2.3 1.3-.9 0-1.2-.5-2.3-.5s-1.4.5-2.3.5c-.9 0-1.6-.6-2.3-1.4-1.4-1.7-2.5-4.8-1-7.1.7-1.1 1.9-1.8 3.2-1.8.9 0 1.8.6 2.3.6s1.6-.7 2.7-.6c1.1.1 2 .6 2.6 1.5-2.3 1.3-1.9 4.5.1 5.4z" />
    </svg>
  );
}

/** OAuth entry — brand-colored, compact. */
export default function AuthButtons({ className = "" }: Props) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <a
        href="/api/auth/linkedin"
        className={`${shell} bg-[#0A66C2] text-white hover:bg-[#004182]`}
      >
        <LinkedInIcon />
        LinkedIn
      </a>
      <a
        href="/api/auth/google"
        className={`${shell} border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]`}
      >
        <GoogleIcon />
        Google
      </a>
      <a
        href="/api/auth/apple"
        className={`${shell} bg-black text-white ring-1 ring-white/20 hover:bg-[#111]`}
      >
        <AppleIcon />
        Apple
      </a>
    </div>
  );
}
