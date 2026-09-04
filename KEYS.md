# What Conclave still needs from you

A reminder list of every account, key, and setting the app is waiting on — what breaks without it, where to get it, and how to check it worked.

Paste values into `.env.local` for local development, and into your host's environment variables for the live site (Vercel → Project → Settings → Environment Variables). Restart / redeploy after every change — Next.js reads env vars at boot.

Check progress any time at **`/api/health`** (for example `http://127.0.0.1:43123/api/health`). It reports which keys the server can see, without printing any secrets. Tick off your progress in [CHECKLIST.md](./CHECKLIST.md).

---

## Checklist

| # | What | Env vars | Without it |
|---|------|----------|-----------|
| 1 | Postgres database | `DATABASE_URL` | Nothing saves — sign-up and Discover fail |
| 2 | App URL + cookie secret | `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` | OAuth redirects break, sessions are insecure |
| 3 | Welcome email | `RESEND_API_KEY`, `EMAIL_FROM` | New members get no email at all |
| 4 | Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google" bounces back with an error |
| 5 | LinkedIn sign-in | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | "Continue with LinkedIn" bounces back with an error |
| 6 | Apple sign-in | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | "Continue with Apple" bounces back with an error |
| 7 | Stripe payments | `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`) | Premier and the $5/person table fee confirm without charging |
| 8 | Google Places | `GOOGLE_PLACES_API_KEY` | Restaurant suggestions fall back to a curated list |
| 9 | Booking SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Table confirmations show in-app only, no text |
| 10 | Operator BLACK grant | `ADMIN_SECRET` | `/admin/black` stays closed |
| 11 | Analytics (optional) | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | First-party pageviews only |

Email sign-up with a password works today with no keys at all, as long as the database is set (#1).

---

## 1. Postgres database — required

SQLite is local-only; the live site needs hosted Postgres.

1. Create a free database at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string (it looks like `postgresql://user:password@host/dbname?sslmode=require`).
3. Set `DATABASE_URL` in `.env.local` **and** in `.env` (Prisma CLI reads `.env`), plus your host.
4. Create the tables: `npx prisma db push`

Verify: `/api/health` shows `"database": true`, and `/api/members` returns `{"ok":true,"members":[]}`.

## 2. App URL + cookie secret — required

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
AUTH_SECRET=<long random string>
```

`NEXT_PUBLIC_APP_URL` must exactly match the domain people visit — every OAuth redirect is built from it. Generate a secret with `openssl rand -base64 48`.

## 3. Welcome email — Resend

The app sends one welcome email the moment an account is created (email, Google, or Apple sign-up). Until a key exists it logs `[conclave email skipped]` to the server console and sign-up continues normally.

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Add and verify your sending domain under Domains (add the DNS records they show).
3. Set:

```
RESEND_API_KEY=re_...
EMAIL_FROM=Conclave <hello@yourdomain.com>
```

Without a verified domain you can test with Resend's sandbox sender (`onboarding@resend.dev`), which only delivers to your own address.

Verify: create a test account, then check Resend → Emails for the delivery.

**Still not built:** email address verification (a confirm link), password reset, and login codes. Those need a token table plus two more routes — tell me when you want them and I'll add them.

## 4. Google sign-in

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Configure the OAuth consent screen (External, add your email as a test user while in testing).
3. Create Credentials → **OAuth client ID** → Web application.
4. Authorized redirect URI — add both, exactly:
   - `https://yourdomain.com/api/auth/google/callback`
   - `http://127.0.0.1:43123/api/auth/google/callback`
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Verify: the login page's "Continue with Google" reaches Google's account picker instead of returning to `/login?error=google_not_configured`.

## 5. LinkedIn sign-in

1. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps).
2. Products → request **Sign In with LinkedIn using OpenID Connect**.
3. Auth tab → Authorized redirect URLs:
   - `https://yourdomain.com/api/auth/linkedin/callback`
   - `http://127.0.0.1:43123/api/auth/linkedin/callback`
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.

A LinkedIn sign-in also counts as a professional verification on the member's profile.

## 6. Apple sign-in

The fiddliest of the three — skip it until the others work.

1. [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers) (needs the $99/year program).
2. Create a **Services ID**; its identifier (e.g. `com.yourdomain.conclave.web`) becomes `APPLE_CLIENT_ID`.
3. Configure it for Sign In with Apple: domain `yourdomain.com`, return URL `https://yourdomain.com/api/auth/apple/callback`.
4. Keys → create a key with **Sign In with Apple** enabled, download the `AuthKey_XXXXXXXXXX.p8` (one download only), and note the key id and your team id.
5. Apple wants a signed JWT rather than a plain secret. Generate one:

```bash
npm run apple:secret -- \
  --team-id ABCDE12345 \
  --key-id XYZ9876543 \
  --client-id com.yourdomain.conclave.web \
  --key ~/Downloads/AuthKey_XYZ9876543.p8
```

Copy the printed `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET` into your env. The secret expires after six months — re-run the command and update it before then, or Apple sign-in starts failing.

Apple does not accept `127.0.0.1` return URLs, so test this one on the deployed domain.

## 7. Stripe — real money

Already wired to `POST /api/billing/checkout` for Premier ($20/month or $100/year with a 3-day trial) and the $5-per-person table fee. Without a key the sheets confirm locally and no card is charged.

1. Create an account at [dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Copy the **secret key** (`sk_live_...`, or `sk_test_...` while testing) into `STRIPE_SECRET_KEY`.
3. Optional but recommended: add a webhook endpoint for `checkout.session.completed` and put its signing secret in `STRIPE_WEBHOOK_SECRET`, so a closed browser tab can't lose a payment.
4. Complete Stripe's business verification before taking live payments.

Verify: `/api/health` shows `"canTakePayments": true`, and Premier opens a real Stripe Checkout page.

## 8. Google Places — live restaurants

1. In [Google Cloud Console](https://console.cloud.google.com/), enable **Places API**.
2. Create an API key, restrict it to Places API, and set `GOOGLE_PLACES_API_KEY`.
3. Billing must be enabled on the project; Google's monthly free tier covers early usage.

Without it, table suggestions come from the curated Michelin/five-star list already in the app.

## 9. Twilio — booking texts

1. Sign up at [twilio.com](https://www.twilio.com), buy a number with SMS enabled.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (E.164, e.g. `+15550123456`).
3. Optional: set `NOTIFY_SECRET` to lock down `POST /api/notify/sms`.

Trial accounts can only text numbers you've verified in the Twilio console.

## 10. Operator BLACK grant

```
ADMIN_SECRET=<long random string>
```

BLACK is bought or earned by the member. This secret only lets you grant it manually from `/admin/black` — members can never grant it to each other.

## 11. Analytics (optional)

Pageviews already post to the app's own `/api/analytics`. To add Plausible, set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com`.

---

## Suggested order

1. Database, app URL, `AUTH_SECRET` — the app runs and saves people.
2. Resend — new members hear from you.
3. Google sign-in — the one most people expect; LinkedIn next since it doubles as verification.
4. Stripe — start charging.
5. Places, Twilio, Elite, analytics — polish once members are actually booking tables.

Deeper deployment walkthrough: [LAUNCH.md](./LAUNCH.md). Remaining product gaps: [MISSING.md](./MISSING.md).
