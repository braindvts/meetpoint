# Conclave

**Networking that ends at a real dinner table.**

Conclave introduces people matched by ambition or profession, then settles it over dinner.

## What’s working now

- Landing, splash (first open only), mobile bottom dock
- LinkedIn OAuth (when env configured) + membership profile
- **SQLite + Prisma** — profiles, connections, chats persist server-side
- Discover merges seed members + live `/api/members`
- Circle with Accept / Decline; DB sync when signed in
- Private chats (localStorage + server poll every ~4s)
- Table proposals, booking UI, SMS hook (Twilio optional)
- Premier / tiers UI; Stripe Checkout when `STRIPE_SECRET_KEY` is set
- Restaurant suggestions: Google Places when keyed, else curated
- Geolocation → nearest city, browser notification prompt, report member
- Error boundary, hardened SMS rate limits
- Demo entry off in production unless `NEXT_PUBLIC_ENABLE_DEMO=1`

## What’s still missing for a real launch

See **[MISSING.md](./MISSING.md)** for the full list. Short version:

1. **Hosted Postgres** (SQLite is local-dev only)
2. **True realtime chat** (polling, not WebSockets)
3. **Your Stripe / Places / Twilio / LinkedIn keys** for live services
4. **Email verification** (not wired — needs Resend/SendGrid)
5. **Cloud photo storage**, push (FCM/APNs), analytics, block list

## Getting started / launch

Local:
```bash
npm install
cp .env.example .env.local
npm run dev
```

**To launch for real people + payments**, follow **[LAUNCH.md](./LAUNCH.md)**  
(Hosting + Postgres + Stripe + Google Places + Twilio).

Check config after deploy: `/api/health`

### Env vars

Copy from `.env.example`. Important ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (`file:./dev.db`) or Postgres URL |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `AUTH_SECRET` | Session cookie signing |
| `LINKEDIN_CLIENT_ID` / `SECRET` | LinkedIn OpenID |
| `STRIPE_SECRET_KEY` | Real Premier / booking checkout |
| `GOOGLE_PLACES_API_KEY` | Live restaurant search |
| `TWILIO_*` | Optional booking SMS |
| `NOTIFY_SECRET` | Optional SMS API lock |

### LinkedIn

1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → create app  
2. Redirect: `{NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`  
3. Product: **Sign In with LinkedIn using OpenID Connect**  
4. Paste Client ID / Secret into `.env.local` and restart

Without LinkedIn keys you can still use **Enter demo** (dev) or create a profile manually.

## Tech

- Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 5  
- LinkedIn OIDC + signed cookies + member cookie  
- Hybrid: `localStorage` + SQLite APIs for multi-device
