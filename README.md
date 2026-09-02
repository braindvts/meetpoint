# Conclave

**Networking that ends at a real dinner table.**

Conclave introduces people matched by ambition or profession, then settles it over dinner.

## What’s working now

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

- **[CHECKLIST.md](./CHECKLIST.md)** — tick-box checklist from buying the domain to submitting the iPhone app. Start here.
- **[LAUNCH.md](./LAUNCH.md)** — everything you have to buy (domain, hosting, database, Stripe, Apple's $99/year, Twilio) with costs and the order to do it in.
- **[KEYS.md](./KEYS.md)** — every account and key the app is waiting on, what breaks without it, and how to verify it worked.
- `/setup` in the running app — live status of which keys this server can actually see.

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

Step-by-step for each one: **[KEYS.md](./KEYS.md)**.

### LinkedIn

1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → create app  
2. Redirect: `{NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`  
3. Product: **Sign In with LinkedIn using OpenID Connect**  
4. Paste Client ID / Secret into `.env.local` and restart

Without LinkedIn keys you can still sign up with email, Google, or Apple, or fill in a profile manually.

## Open in Xcode (iPhone)

The website stays in Cursor. An iOS wrapper lives in `ios/` so you can run Conclave in the iPhone Simulator.

1. Start the site: `npm run dev`
2. Open `ios/Conclave.xcodeproj` in Xcode
3. Signing & Capabilities → your Apple ID (Personal Team)
4. Pick an iPhone simulator → press **▶**
5. **Product → Test** (⌘U) runs the unit tests in `ios/ConclaveTests`

Full steps: **[ios/README.md](./ios/README.md)**

## Tech

- Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 5  
- LinkedIn OIDC + signed cookies + member cookie  
- Hybrid: `localStorage` + SQLite APIs for multi-device
