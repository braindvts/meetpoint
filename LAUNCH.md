# Launch Conclave — everything to buy and do

Two lists: what costs money, and the order to do it in. Prices were checked on 2 September 2026 and do change — treat them as estimates, not quotes.

Technical detail for every key lives in **[KEYS.md](./KEYS.md)**. This file is the shopping list and the running order.

---

## 1. What you have to buy

| # | What | Where | Cost | Needed for |
|---|------|-------|------|-----------|
| 1 | Domain name | Cloudflare Registrar, Namecheap | about $10–15/year | Everything — sign-in redirects, email sending, App Store listing |
| 2 | Hosting | [Vercel](https://vercel.com) | Hobby $0 (personal, non-commercial only) · **Pro $20/month**, includes $20 of usage | Running the site |
| 3 | Postgres database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Free tier to start; roughly $19–25/month once you outgrow it | Storing members, connections, chats |
| 4 | Email sending | [Resend](https://resend.com) | Free: 3,000/month, capped at 100/day, 1 domain · Pro $20/month for 50,000 | The welcome email, and later verification and password reset |
| 5 | Payments | [Stripe](https://stripe.com) | $0 to open. 2.9% + $0.30 per US card charge, +1.5% on international cards, $15 per dispute. Stripe Billing adds 0.5–0.7% on subscription volume | Premier ($20/month, $100/year) and the $5-per-person table fee |
| 6 | Apple Developer Program | [developer.apple.com](https://developer.apple.com/programs/) | **$99/year** | The iPhone app *and* Sign in with Apple — you cannot ship either without it |
| 7 | Google Play (only if you want Android) | [play.google.com/console](https://play.google.com/console) | about $25, one time | Android listing |
| 8 | Google Places | [Google Cloud](https://console.cloud.google.com) | 5,000 Nearby Search calls free per month, then **$32 per 1,000** | Live restaurant search. Expensive — see the warning in step 8 |
| 9 | Twilio (optional) | [twilio.com](https://www.twilio.com) | Number $1.15/month + roughly $0.012–0.025 per delivered text, plus one-time 10DLC registration (about $20–60) and a small monthly campaign fee | Texting table confirmations |
| 10 | Business entity + bank account | Your jurisdiction | Varies | Stripe pays out to a bank account and verifies your business before going live |
| 11 | Analytics (optional) | [Plausible](https://plausible.io) | about $9/month | Nicer stats than the built-in pageview counter |

**Cheapest way to open the doors:** domain + Vercel + free Postgres + free Resend. That's roughly $10–15 for the year plus $0–20/month. Everything else can wait until people are actually using it. Add Apple's $99/year only when you want the iPhone app.

Free accounts you'll also need but that cost nothing: GitHub, Google Cloud (for sign-in), LinkedIn Developers.

---

## 2. Do it in this order

### Step 1 — Buy the domain

Cheapest at cost is Cloudflare Registrar. Buy the `.com` if you can; the domain shows up in your email address, your OAuth redirects, and your App Store listing, so pick it before wiring anything else.

### Step 2 — Deploy the site

1. Push this repo to GitHub.
2. Import it at [vercel.com](https://vercel.com) → Add New → Project.
3. Add your domain under Project → Settings → Domains and follow the DNS instructions.

The build command is already set in `vercel.json` (`prisma generate && prisma db push && next build`), so deploys create the database tables for you.

Note on Vercel's free plan: Hobby is for personal, non-commercial projects. Since Conclave charges for Premier, budget for Pro at $20/month.

### Step 3 — Create the database

Sign up at Neon or Supabase, create a Postgres database, copy the connection string, and set `DATABASE_URL` in Vercel → Settings → Environment Variables. Redeploy. Then load `/api/members` — `{"ok":true,"members":[]}` means it's connected.

### Step 4 — Set the app URL and cookie secret

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
AUTH_SECRET=<output of: openssl rand -base64 48>
```

`NEXT_PUBLIC_APP_URL` must match the domain people actually visit — every sign-in redirect is built from it.

### Step 5 — Turn on email

Create a Resend API key, add your domain under Domains, and paste in the DNS records they give you (SPF and DKIM). Then set `RESEND_API_KEY` and `EMAIL_FROM`. The welcome email sends on every new account; until the key exists the app logs it and carries on.

### Step 6 — Turn on social sign-in

Google first, then LinkedIn. Full walkthrough in [KEYS.md](./KEYS.md), including the exact redirect URLs. Apple needs the $99 program, so it comes with the iOS work in step 10.

### Step 7 — Turn on payments

1. Open the Stripe account and complete business verification — this takes real information (legal entity, address, bank account) and can take a day or two, so start it early.
2. Copy the secret key into `STRIPE_SECRET_KEY`. Use `sk_test_...` first.
3. Add a webhook endpoint for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`, so a payment isn't lost if someone closes the tab.
4. Test with card `4242 4242 4242 4242`, then swap to the live key.

Until a key is set, the payment sheets confirm locally and no card is charged.

### Step 8 — Restaurants and texts (optional)

**Google Places — read this before enabling.** Google replaced its old $200 monthly credit in March 2025 with per-service free tiers. Nearby Search gives you 5,000 calls a month, then bills $32 per 1,000. A few hundred people browsing restaurants can run into real money, so set a budget alert in Google Cloud and leave this off until you need it. Without a key the app suggests from its own curated Michelin and five-star list, which is good enough to launch.

The app currently calls Google's legacy Nearby Search endpoint, so enable **Places API** in Cloud Console (not only "Places API (New)"). If Google won't let you enable the legacy one on a new project, tell me and I'll move the call to the new endpoint.

**Twilio** is for texting table confirmations. Beyond the number and per-message cost, US business texting requires 10DLC brand and campaign registration, and trial accounts can only text numbers you've verified.

### Step 9 — Legal pages, before you take money

Stripe, Apple, and Google's OAuth review all expect these to exist at real URLs:

- Privacy policy — what you collect (name, photo, email, city, phone) and how to get it deleted
- Terms of service — including what the $5 booking fee buys and your refund position
- A support email address on the domain

These pages are **not built yet**. Tell me when you're ready and I'll add them as routes so you can paste your own text in.

### Step 10 — The iPhone app

See the next section — this is the longest step by far.

---

## 3. The iPhone app, specifically

**What exists in this repo:** an Xcode project in `ios/` that wraps the site, plus `ios/install-on-mac.py` to copy it to your Mac and open it. See [ios/README.md](./ios/README.md).

**What you need to buy or have:**

- A Mac with Xcode (free)
- Apple Developer Program — $99/year
- A bundle identifier, e.g. `com.yourdomain.conclave`
- A 1024×1024 app icon and screenshots at the device sizes Apple requires
- A privacy policy URL (step 9) and answers to Apple's App Privacy questionnaire
- **A real test account for the reviewer.** There's no demo mode anymore, so create an account, complete the profile, and put the email and password in the review notes — otherwise the reviewer hits a sign-up wall and rejects the app.

**Two rejection risks worth knowing before you spend the $99:**

1. *Minimum functionality (guideline 4.2).* A plain web wrapper often gets rejected. The fix is making the shell genuinely native: push notifications, the camera for profile photos, share sheet, sensible offline behavior. Plan on that work rather than assuming the wrapper ships as-is.

2. *Payments (guideline 3.1.1).* Selling Premier inside an iOS app normally has to go through Apple's in-app purchase at 15–30%. Since May 2025, US apps may also link out to a web checkout, and after the Epic ruling Apple is currently collecting **0%** on those external links — but that number is unsettled: the Ninth Circuit sent the rate back to the district court and the Supreme Court took the case in mid-2026, with a decision expected in 2027. The safe launch is to sell Premier on the website only and ship the app without any purchase flow, then revisit once the rate is settled.

Individual accounts usually verify in a day or two (organizations take longer and need a D-U-N-S number). App review itself is typically a day or two per submission.

---

## 4. What isn't built yet

So you don't promise something the app can't do:

- **Email verification and password reset** — the welcome email works; confirm links and reset codes don't exist
- **Realtime chat** — messages poll every few seconds rather than using WebSockets
- **Cloud photo storage** — profile photos are stored inline in the database, which will bloat it; move to S3 or Cloudinary before you have real volume
- **Push notifications on iPhone** — browser notifications only; true push needs the native shell plus Firebase or APNs
- **Privacy policy and terms pages**

Full list with status: [MISSING.md](./MISSING.md).

---

## 5. Rough monthly cost

| Stage | Monthly |
|-------|---------|
| Just launched, web only | $0–20 (plus the domain once a year) |
| Real members, email + payments live | about $20–45, plus Stripe's cut of what you charge |
| Adding restaurants and texts | add $30–80 depending on usage |
| With the iPhone app | add $99/year |

---

## 6. How to know it's working

1. Load `https://yourdomain.com/api/health` — every key you've added shows `true`.
2. Sign up with email on the live site. Check the welcome email arrives.
3. Sign in with Google, then LinkedIn.
4. Have a second person sign up so you both appear in each other's Discover.
5. Introduce, accept, chat, propose a table, and pay with Stripe's test card.
6. Switch Stripe to the live key and do one real charge on yourself.
