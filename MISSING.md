# What’s missing from Conclave

Updated after the backend pass (Prisma SQLite, APIs, Stripe/Places hooks).

**Fake profiles:** Off by default. The Room only shows real members who saved a profile on this server. To bring seed people back for demos, set `NEXT_PUBLIC_ENABLE_DEMO_PROFILES=1`.

**How to add keys:** put values in `.env.local` (and also `.env` for `DATABASE_URL` — Prisma reads `.env`). Restart `npm run dev` after every change.

```bash
cp .env.example .env.local
# edit .env.local
# ensure DATABASE_URL is also in .env for Prisma
npm run dev
```

---

## Critical

| # | Need | Status | Notes |
|---|------|--------|-------|
| 1 | **Database** — profiles, connections, chats server-side | **Done (local SQLite)** | Prisma + `DATABASE_URL`. Fake profiles **off by default**. Production should move to Postgres/Supabase. |
| 2 | **Multi-user network** | **Partial** | Real members via `/api/members`. Room is empty until real people join (unless `NEXT_PUBLIC_ENABLE_DEMO_PROFILES=1`). |
| 3 | **Mutual connect** | **Partial** | DB connections + Accept/Decline. Seed-bot auto-accept only if demo profiles are enabled. |
| 4 | **Realtime chat** | **Partial** | Server chats + **4s polling** on `/api/chats/[id]/messages`. Not WebSocket. LocalStorage chat still works offline. |
| 5 | **Real payments** | **Hooked — needs your key** | `/api/billing/checkout` uses Stripe when `STRIPE_SECRET_KEY` is set; otherwise demo UI. |
| 6 | **Real Premier billing** | **Hooked — needs your key** | Premier sheet tries Stripe Checkout first, then demo activate. |
| 7 | **Real verification** | **Partial** | LinkedIn session auto-attaches LinkedIn verification on profile sync. No email magic-link yet (needs Resend/SendGrid). |
| 8 | **Auth gate** | **Partial** | Member cookie + LinkedIn session bind to DB member. Pages still also use localStorage. |

## Important

| # | Need | Status |
|---|------|--------|
| 9 | `.env.example` + docs | **Done** |
| 10 | Inbound Accept / Decline | **Done** |
| 11 | Use my location | **Done** |
| 12 | Notification prompt | **Done** |
| 13 | Depart clears membership + session | **Done** (+ member cookie) |
| 14 | SMS rate limits | **Done** |
| 15 | Global error screen | **Done** |
| 16 | Live restaurant search | **Hooked — needs `GOOGLE_PLACES_API_KEY`** |
| 17 | Unify meetup planner vs chat booking | Still two paths |
| 18 | Cloud photo storage | **Still missing** (photos can be data URLs / LinkedIn URLs) |
| 19 | Offline / reconnect UX | **Still missing** |

## Nice to have

| # | Need | Status |
|---|------|--------|
| 20 | Report / block | **Done** — report + **Block** (DB `/api/blocks`, hides from Room, drops connection) |
| 21 | Elite invite admin | **Done** — redeem on Profile (`ELITE_INVITE_CODE`) + `/admin/elite` (`ADMIN_SECRET`) |
| 22 | Native push (FCM/APNs) | **Partial** — browser SW notifications + Profile “Enable alerts”. True FCM/APNs still needs native shell + Firebase keys |
| 23 | Hide demo in production | **Done** (off in prod unless `NEXT_PUBLIC_ENABLE_DEMO=1`) |
| 24 | Analytics | **Done** — first-party `/api/analytics` pageviews + optional Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`) |

---

## How to get each missing thing into the app

### 1. Stripe — real Premier + booking payments

**Already wired** to `POST /api/billing/checkout`. Without a key, the UI stays in demo mode.

1. Create an account at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Open **Developers → API keys**
3. Copy the **Secret key** (`sk_test_...` for testing)
4. In `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxx
   ```
5. Restart the app → open Premier / booking → you should get a real Stripe Checkout URL
6. (Later) Add a webhook endpoint for subscription activation:
   - Stripe → **Developers → Webhooks** → add `{YOUR_APP_URL}/api/billing/webhook`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Ask me to implement the webhook route when you’re ready

**Test cards:** [https://docs.stripe.com/testing](https://docs.stripe.com/testing) (e.g. `4242 4242 4242 4242`)

---

### 2. Google Places — live restaurant search

**Already wired** to `GET /api/places/search` and chat food suggestions. Without a key, curated restaurants are used.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services → Library**
3. Enable **Places API** (and **Places API (New)** if offered)
4. **Credentials → Create credentials → API key**
5. Restrict the key (HTTP referrers for client, or IP for server) when you go live
6. In `.env.local`:
   ```env
   GOOGLE_PLACES_API_KEY=AIza...
   ```
7. Restart → mention dinner in a chat → suggestions should say “live” when Places responds

Billing: Google requires a billing account; there is a free monthly credit for Maps/Places.

---

### 3. LinkedIn login — real OAuth

**Already wired** to `/api/auth/linkedin` + callback.

1. Open [LinkedIn Developers](https://www.linkedin.com/developers/apps) → **Create app**
2. Under **Auth**, add redirect URL:
   ```
   {NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback
   ```
   Local example: `http://localhost:3000/api/auth/linkedin/callback`
3. Products → enable **Sign In with LinkedIn using OpenID Connect**
4. Copy Client ID + Client Secret into `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   AUTH_SECRET=any-long-random-string
   LINKEDIN_CLIENT_ID=...
   LINKEDIN_CLIENT_SECRET=...
   ```
5. Restart → use **Continue with LinkedIn** on login

Without LinkedIn you can still use demo entry (dev) or manual profile.

---

### 4. Twilio — booking SMS

**Already wired** to `POST /api/notify/sms`.

1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. From the console, copy **Account SID**, **Auth Token**, and a **From** number
3. In `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxx
   TWILIO_FROM_NUMBER=+1xxxxxxxxxx
   NOTIFY_SECRET=optional-shared-secret
   ```
4. Restart → complete a booking flow that sends SMS

Trial accounts can only text verified numbers until you upgrade.

---

### 5. Production database (Postgres) — replace local SQLite

Local SQLite (`file:./dev.db`) is fine for one machine. For phones / Vercel / multi-user:

1. Create a free Postgres DB:
   - [Supabase](https://supabase.com/) → New project → **Settings → Database → Connection string (URI)**  
   - or [Neon](https://neon.tech/) → copy the connection string
2. In `.env` / host env vars:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
   ```
3. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run:
   ```bash
   npx prisma migrate deploy
   # or: npx prisma db push
   ```
5. Deploy the app with the same `DATABASE_URL` set on the host

Ask me to switch the schema to Postgres when you have the URL.

---

### 6. Email verification (Resend / SendGrid) — **not wired yet**

Code for magic-link email is **not in the app yet**. To prepare:

1. Sign up at [Resend](https://resend.com/) (or [SendGrid](https://sendgrid.com/))
2. Create an API key + verify a sending domain (or use Resend’s onboarding domain for tests)
3. Save for later:
   ```env
   RESEND_API_KEY=re_xxxxxxxx
   EMAIL_FROM=Conclave <onboarding@yourdomain.com>
   ```
4. Tell me you have the key → I’ll add `/api/auth/email` + verify link + profile flag

---

### 7. True realtime chat (Pusher / Ably / Supabase) — **not wired yet**

Today: REST + **4 second polling**. For instant messages:

**Option A — Supabase Realtime** (best if you already use Supabase Postgres)  
1. Create Supabase project  
2. Copy project URL + anon/service keys  
3. Ask me to subscribe chats to Realtime instead of polling  

**Option B — Pusher**  
1. [pusher.com](https://pusher.com/) → create Channels app  
2. Copy `app_id`, `key`, `secret`, `cluster`  
3. Ask me to wire publish on message POST + client subscribe  

**Option C — Ably**  
Same idea: create app → API key → ask me to wire.

---

### 8. Cloud photo storage — **not wired yet**

Needed so profile photos aren’t huge data URLs in the DB.

1. Create a bucket:
   - [Cloudinary](https://cloudinary.com/) (simple upload API), or  
   - [Uploadthing](https://uploadthing.com/) (Next.js friendly), or  
   - Supabase Storage / AWS S3
2. Copy cloud name + API keys into env (exact names depend on provider)
3. Ask me to add an upload route and point onboarding/profile photo to it

---

### 9. Native push (FCM / APNs) — browser done; native still needs keys

**In the app now:** service worker (`/sw.js`), Profile → Enable alerts, intro/table browser notifications.

For true mobile push when the app is closed:

1. Create a Firebase project → Cloud Messaging → get FCM credentials  
2. For iOS: Apple Developer → APNs key  
3. Wrap the web app (Expo/Capacitor) — ask when you’re ready

---

### 10. Analytics — **wired**

**In the app now:** first-party events stored in SQLite via `POST /api/analytics` (pageviews + key actions).

Optional Plausible:

1. Create a [Plausible](https://plausible.io/) site  
2. In `.env.local`:
   ```env
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
   ```
3. Restart — script loads automatically

---

### 11. Block list + Elite invite — **wired**

**Block:** open any member → **Block** (also Report). Stored in DB; they disappear from The Room for you.

**Elite invite (members):** Profile → Elite invite → enter code. Set in env:
```env
ELITE_INVITE_CODE=your-secret-code
```

**Elite admin:** open `/admin/elite`, enter `ADMIN_SECRET` + member id:
```env
ADMIN_SECRET=your-admin-secret
```

---

### 12. Deploy so two phones share one network

1. Push to GitHub  
2. Deploy on [Vercel](https://vercel.com/) (or similar)  
3. Set **all** env vars from `.env.example` in the host dashboard  
4. Set `NEXT_PUBLIC_APP_URL=https://your-domain.com`  
5. Update LinkedIn redirect URL to the production callback  
6. Use Postgres `DATABASE_URL` (not SQLite on serverless)

Then two phones on that URL share the same members/chats.

---

## New API surface

| Route | Purpose |
|-------|---------|
| `GET/PUT /api/members/me` | Load / save your DB profile |
| `GET /api/members` | The Room directory |
| `GET/POST/PATCH /api/connections` | Mutual intros |
| `GET/POST /api/chats` | Private threads |
| `GET/POST /api/chats/[id]/messages` | Messages (+ poll) |
| `POST /api/billing/checkout` | Stripe or demo |
| `GET /api/places/search` | Places or curated |
| `POST /api/report` | Safety report |
| `GET/POST /api/blocks` | Block / unblock |
| `POST /api/elite/redeem` | Redeem invite code |
| `POST /api/elite/grant` | Admin grant Elite |
| `POST /api/analytics` | First-party events |

---

## Suggested order

1. LinkedIn + `AUTH_SECRET` (real login)  
2. Stripe test key (real checkout)  
3. Google Places (live restaurants)  
4. Postgres + deploy (true multi-phone)  
5. Twilio (SMS)  
6. Set `ELITE_INVITE_CODE` / `ADMIN_SECRET` if you want Elite invites  
7. Ask me for: email verify, webhooks, realtime, cloud photos, FCM native push
