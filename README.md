# Interlink

**Networking that ends at a real dinner table.**

Interlink introduces people matched by ambition or profession, then settles it over dinner. The GitHub repo stays `meetpoint`.

**Product handbook (keep this open):** **[CONCLAVE.md](./CONCLAVE.md)** — levels, verification, BLACK, screens, deploy, and where things live in code.

## What’s working now

- Landing waitlist (`/` + `/waitlist`) writes to the Interlink Waitlist Notion database
- Landing, splash (first open only), mobile bottom dock
- Email + password sign-up, and Google / LinkedIn / Apple OAuth once keyed
- Welcome email on sign-up (Resend) — logs and skips until keyed
- **Postgres + Prisma** — profiles, connections, chats persist server-side
- Discover lists real members from `/api/members`
- Circle with Accept / Decline; DB sync when signed in
- Private chats (localStorage + server poll every ~4s)
- Table proposals, booking UI, SMS hook (Twilio optional)
- Premier / tiers UI; Stripe Checkout when `STRIPE_SECRET_KEY` is set
- Restaurant suggestions: Google Places when keyed, else curated
- Geolocation → nearest city, browser notification prompt, report member
- Error boundary, hardened SMS rate limits
- No demo mode: sign-up is the only way in, and every profile is a real member

## Launching this thing

- **[WEBSITE.md](./WEBSITE.md)** — website only, no App Store: what to buy, what it costs, tick-box steps. Start here.
- **[CHECKLIST.md](./CHECKLIST.md)** — the same but including the iPhone app.
- **[LAUNCH.md](./LAUNCH.md)** — everything you have to buy (domain, hosting, database, Stripe, Apple's $99/year, Twilio) with costs and the order to do it in.
- **[KEYS.md](./KEYS.md)** — every account and key the app is waiting on, what breaks without it, and how to verify it worked.
- `/api/health` — JSON showing which keys this server can actually see.

Social sign-in and the welcome email do nothing until those keys exist. Email + password sign-up works with only a database.

## What’s still missing for a real launch

See **[MISSING.md](./MISSING.md)** for the full list. Short version:

1. **Hosted Postgres** (local Postgres is dev only)
2. **True realtime chat** (polling, not WebSockets)
3. **Your Stripe / Places / Twilio / OAuth keys** for live services
4. **Email verification + password reset** (welcome email is wired; confirm links are not)
5. **Cloud photo storage**, push (FCM/APNs), analytics, block list

## Getting started / launch

Local:
```bash
npm install
cp .env.example .env.local
npm run dev
```

**Story flyer (Instagram / TikTok):** open `/story` — download Story, Feed, and Post PNGs and copy a caption. Early access is the website; the app is coming soon. Add your site as the story link sticker.

**To launch for real people + payments**, follow **[LAUNCH.md](./LAUNCH.md)**  
(what to buy, in what order, and what the App Store expects).

Check config after deploy: `/api/health`

### Env vars

Copy from `.env.example`. Important ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | App base URL (OAuth redirects are built from it) |
| `AUTH_SECRET` | Session cookie signing |
| `RESEND_API_KEY` / `EMAIL_FROM` | Welcome email on sign-up |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google sign-in |
| `LINKEDIN_CLIENT_ID` / `SECRET` | LinkedIn OpenID (also verifies the member) |
| `APPLE_CLIENT_ID` / `SECRET` | Apple sign-in |
| `STRIPE_SECRET_KEY` | Real Premier / booking checkout |
| `GOOGLE_PLACES_API_KEY` | Live restaurant search |
| `TWILIO_*` | Optional booking SMS |
| `NOTIFY_SECRET` | Optional SMS API lock |
| `ENABLE_WALKTHROUGH_OWNER` | Server-only walkthrough login gate — leave unset in production |
| `WALKTHROUGH_OWNER_EMAIL` / `WALKTHROUGH_OWNER_PASSWORD` | Walkthrough credentials — never commit values |
| `NOTION_API_KEY` (or `NOTION_TOKEN`) | Writes waitlist signups to Notion |
| `NOTION_WAITLIST_DATABASE_ID` | Interlink Waitlist DB (`a6ffe8d865f94b25a851e2331a31c65b`) |

Step-by-step for each one: **[KEYS.md](./KEYS.md)**.

### LinkedIn

1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → create app  
2. Redirect: `{NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`  
3. Product: **Sign In with LinkedIn using OpenID Connect**  
4. Paste Client ID / Secret into `.env.local` and restart

Without LinkedIn keys you can still sign up with email, Google, or Apple, or fill in a profile manually.

### Waitlist (Notion) — set this on Vercel

Site signups go to the existing **Interlink Waitlist** database: [open it](https://app.notion.com/p/a6ffe8d865f94b25a851e2331a31c65b). Source is set to `Waitlist`.

On **Vercel → Project → Settings → Environment Variables** (Production):

| Variable | Value |
|----------|--------|
| `NOTION_API_KEY` | Internal integration secret from [notion.so/my-integrations](https://www.notion.so/my-integrations) |
| `NOTION_WAITLIST_DATABASE_ID` | `a6ffe8d865f94b25a851e2331a31c65b` |

Then open the database → **••• → Connections** → connect that integration. Redeploy after saving.

If the API key is missing, `/waitlist` still opens the [public Notion form](https://tiny-palladium-a02.notion.site/cc1d0f6fc49348239d2e24fdfa7a41c1?pvs=105) so names still land in the same database. `/api/health` reports `canWriteWaitlist` when the key is present.

## Open in Xcode (iPhone)

The website stays in Cursor. An iOS wrapper lives in `ios/` so you can run Interlink in the iPhone Simulator.

1. Start the site: `npm run dev`
2. Open `ios/Conclave.xcodeproj` in Xcode (internal project name; the app displays as **Interlink**)
3. Signing & Capabilities → your Apple ID (Personal Team)
4. Pick an iPhone simulator → press **▶**
5. **Product → Test** (⌘U) runs the unit tests in `ios/ConclaveTests`

Full steps: **[ios/README.md](./ios/README.md)**

## Tech

- Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 5
- Vercel build: `prisma generate && next build` — do not `db push` on deploy ([prisma/README.md](./prisma/README.md))
- LinkedIn OIDC + signed cookies + member cookie  
- Hybrid: `localStorage` + SQLite APIs for multi-device
