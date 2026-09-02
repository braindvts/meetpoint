import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Conclave — Setup",
  robots: { index: false, follow: false },
};

type Group = "Required to run" | "Sign-in" | "Money" | "Optional";

interface Item {
  name: string;
  group: Group;
  envs: string[];
  /** True when every env var above is set. */
  done: boolean;
  breaks: string;
  cost: string;
  link?: { label: string; href: string };
  docHref: string;
}

function has(key: string): boolean {
  return !!process.env[key]?.trim();
}

function every(keys: string[]): boolean {
  return keys.every(has);
}

function buildItems(): Item[] {
  const rows: Omit<Item, "done">[] = [
    {
      name: "Domain",
      group: "Required to run",
      envs: ["NEXT_PUBLIC_APP_URL"],
      breaks: "Sign-in redirects and email links have nowhere to point.",
      cost: "~$10–15/year",
      link: { label: "Cloudflare Registrar", href: "https://dash.cloudflare.com/?to=/:account/domains" },
      docHref: "#step-1",
    },
    {
      name: "Postgres database",
      group: "Required to run",
      envs: ["DATABASE_URL"],
      breaks: "Nothing saves — sign-up and Discover fail.",
      cost: "Free tier, then ~$19–25/month",
      link: { label: "Neon", href: "https://neon.tech" },
      docHref: "#step-3",
    },
    {
      name: "Session secret",
      group: "Required to run",
      envs: ["AUTH_SECRET"],
      breaks: "Login cookies aren't signed with your own secret.",
      cost: "Free",
      docHref: "#step-4",
    },
    {
      name: "Welcome email",
      group: "Required to run",
      envs: ["RESEND_API_KEY"],
      breaks: "New members get no email at all.",
      cost: "Free to 3,000/month, then $20/month",
      link: { label: "Resend", href: "https://resend.com/api-keys" },
      docHref: "#step-5",
    },
    {
      name: "Google sign-in",
      group: "Sign-in",
      envs: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      breaks: "“Continue with Google” bounces back with an error.",
      cost: "Free",
      link: { label: "Google Cloud credentials", href: "https://console.cloud.google.com/apis/credentials" },
      docHref: "#google",
    },
    {
      name: "LinkedIn sign-in",
      group: "Sign-in",
      envs: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
      breaks: "“Continue with LinkedIn” fails, and members lose the easiest verification.",
      cost: "Free",
      link: { label: "LinkedIn Developers", href: "https://www.linkedin.com/developers/apps" },
      docHref: "#linkedin",
    },
    {
      name: "Apple sign-in",
      group: "Sign-in",
      envs: ["APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET"],
      breaks: "“Continue with Apple” fails. Needs the paid developer program.",
      cost: "$99/year (same membership as the iPhone app)",
      link: { label: "Apple Developer", href: "https://developer.apple.com/account/resources/identifiers" },
      docHref: "#apple",
    },
    {
      name: "Stripe",
      group: "Money",
      envs: ["STRIPE_SECRET_KEY"],
      breaks: "Premier and the $5 table fee confirm without charging anyone.",
      cost: "2.9% + $0.30 per charge",
      link: { label: "Stripe dashboard", href: "https://dashboard.stripe.com/apikeys" },
      docHref: "#step-7",
    },
    {
      name: "Stripe webhook",
      group: "Money",
      envs: ["STRIPE_WEBHOOK_SECRET"],
      breaks: "A closed browser tab can lose a completed payment.",
      cost: "Free",
      link: { label: "Add endpoint", href: "https://dashboard.stripe.com/webhooks" },
      docHref: "#step-7",
    },
    {
      name: "Google Places",
      group: "Optional",
      envs: ["GOOGLE_PLACES_API_KEY"],
      breaks: "Restaurants come from the built-in curated list instead of live search.",
      cost: "5,000 free/month, then $32 per 1,000 — set a budget alert",
      link: { label: "Google Cloud", href: "https://console.cloud.google.com/apis/library" },
      docHref: "#step-8",
    },
    {
      name: "Booking SMS",
      group: "Optional",
      envs: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
      breaks: "Table confirmations stay in-app, no text message.",
      cost: "$1.15/month + ~$0.02 per text",
      link: { label: "Twilio", href: "https://www.twilio.com/try-twilio" },
      docHref: "#step-8",
    },
    {
      name: "Elite invites + admin",
      group: "Optional",
      envs: ["ELITE_INVITE_CODE", "ADMIN_SECRET"],
      breaks: "Invite redemption and /admin/elite stay closed.",
      cost: "Free",
      docHref: "#step-8",
    },
  ];

  return rows.map((row) => ({ ...row, done: every(row.envs) }));
}

const GROUPS: Group[] = ["Required to run", "Sign-in", "Money", "Optional"];

function StatusPill({ done }: { done: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        done
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-white/15 bg-white/[0.03] text-muted"
      }`}
    >
      {done ? "Connected" : "Not set"}
    </span>
  );
}

export default function SetupPage() {
  const items = buildItems();
  const connected = items.filter((i) => i.done).length;
  const required = items.filter((i) => i.group === "Required to run");
  const requiredLeft = required.filter((i) => !i.done);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">Conclave</p>
      <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-ivory sm:text-[2.4rem]">
        Setup
      </h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
        Everything the app is waiting on, and whether this server can see it. Add a key, redeploy,
        then reload this page.
      </p>

      <div className="mt-7 rounded-2xl border border-accent/20 bg-[#12110f] p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[13px] font-medium text-ivory">
            {connected} of {items.length} connected
          </p>
          <p className="text-[12px] text-muted">
            {requiredLeft.length === 0
              ? "Ready to take real members."
              : `${requiredLeft.length} still needed to run`}
          </p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-2 to-accent transition-all"
            style={{ width: `${Math.round((connected / items.length) * 100)}%` }}
          />
        </div>
        {requiredLeft.length > 0 && (
          <p className="mt-3 text-[12px] leading-relaxed text-ivory/70">
            Next up: {requiredLeft.map((i) => i.name).join(", ")}.
          </p>
        )}
      </div>

      {GROUPS.map((group) => {
        const rows = items.filter((i) => i.group === group);
        if (rows.length === 0) return null;
        return (
          <section key={group} className="mt-9">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/80">
              {group}
            </h2>
            <div className="mt-3 space-y-2.5">
              {rows.map((item) => (
                <article
                  key={item.name}
                  className="rounded-2xl border border-white/10 bg-[#12110f] px-4 py-4 sm:px-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-ivory">{item.name}</h3>
                      <p className="mt-1 text-[13px] leading-snug text-muted">
                        {item.done ? "Working on this server." : item.breaks}
                      </p>
                    </div>
                    <StatusPill done={item.done} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {item.envs.map((env) => (
                      <code
                        key={env}
                        className={`rounded-md border px-2 py-1 text-[11px] ${
                          has(env)
                            ? "border-accent/30 bg-accent/[0.07] text-accent"
                            : "border-white/12 bg-white/[0.03] text-ivory/60"
                        }`}
                      >
                        {env}
                      </code>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
                    <span className="text-ivory/55">{item.cost}</span>
                    {item.link && (
                      <a
                        href={item.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent underline underline-offset-2"
                      >
                        {item.link.label} ↗
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-10 rounded-2xl border border-accent/20 bg-[#12110f] px-5 py-5">
        <h2 className="text-[15px] font-semibold text-ivory">Written instructions</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Step-by-step for each key — where to click, which redirect URLs to paste — lives in
          <code className="mx-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-[12px] text-accent">KEYS.md</code>
          and
          <code className="mx-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-[12px] text-accent">LAUNCH.md</code>
          in the project folder.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
          <Link
            href="/api/health"
            className="rounded-full border border-accent/30 px-4 py-2 font-medium text-accent"
          >
            Raw JSON
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 font-medium text-ivory/70"
          >
            Back to the app
          </Link>
        </div>
      </section>

      <p className="mt-8 text-[11px] leading-relaxed text-muted/70">
        This page reads whether a variable exists. It never prints a key, and it isn&apos;t linked
        from anywhere members can see.
      </p>
    </main>
  );
}
