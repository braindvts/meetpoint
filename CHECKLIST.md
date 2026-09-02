# Conclave launch checklist

Tick these off as you go. Boxes already ticked are done in the code — you don't need to touch them.

Details for any line: [KEYS.md](./KEYS.md) for keys, [LAUNCH.md](./LAUNCH.md) for costs and order.

---

## Phase 1 — Buy

- [ ] Buy the domain (~$10–15/year) — [Cloudflare Registrar](https://dash.cloudflare.com) or [Namecheap](https://www.namecheap.com)
- [ ] Create a [GitHub](https://github.com) account and push this project to it (free)
- [ ] Create a [Vercel](https://vercel.com) account (free to start; $20/month Pro once you charge for Premier)
- [ ] Create a Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free tier)
- [ ] Create a [Resend](https://resend.com) account for email (free to 3,000/month)
- [ ] Create a [Stripe](https://dashboard.stripe.com/register) account (free; 2.9% + $0.30 per charge)
- [ ] Have a bank account ready for Stripe payouts
- [ ] Decide if you need a registered business/LLC for Stripe in your country
- [ ] Later, for the iPhone app: [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- [ ] Optional: [Twilio](https://www.twilio.com/try-twilio) for booking texts ($1.15/month + ~$0.02 per text)
- [ ] Optional: Google Cloud billing enabled for Places (5,000 free/month, then $32 per 1,000)
- [ ] Optional: [Plausible](https://plausible.io) analytics (~$9/month)

## Phase 2 — Get the site live

- [ ] Import the GitHub repo on Vercel
- [ ] Point your domain at Vercel (Project → Settings → Domains)
- [ ] Copy the Postgres connection string into `DATABASE_URL` on Vercel
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real domain, e.g. `https://conclave.app`
- [ ] Generate and set `AUTH_SECRET` (`openssl rand -base64 48`)
- [ ] Redeploy
- [ ] Open `https://yourdomain.com` — the landing page loads
- [ ] Open `https://yourdomain.com/api/members` — returns `{"ok":true,"members":[]}`
- [x] Database schema is created automatically on deploy (`vercel.json` build command)

## Phase 3 — Email

- [ ] Create a Resend API key → set `RESEND_API_KEY`
- [ ] Add your domain in Resend → Domains
- [ ] Paste Resend's SPF and DKIM records into your DNS
- [ ] Wait for the domain to show Verified in Resend
- [ ] Set `EMAIL_FROM`, e.g. `Conclave <hello@yourdomain.com>`
- [ ] Sign up with your own email on the live site and confirm the welcome email arrives
- [x] Welcome email is written and wired to sign-up
- [ ] Ask me to build email verification (confirm link) — not built yet
- [ ] Ask me to build password reset — not built yet

## Phase 4 — Sign-in

### Google

- [ ] [Google Cloud → Credentials](https://console.cloud.google.com/apis/credentials) → configure the OAuth consent screen
- [ ] Add yourself under Test users
- [ ] Create an OAuth client ID → Web application
- [ ] Add redirect URI `https://yourdomain.com/api/auth/google/callback`
- [ ] Add redirect URI for local work, e.g. `http://localhost:3000/api/auth/google/callback`
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, redeploy
- [ ] Click "Continue with Google" on `/login` and reach Google's account picker
- [ ] Publish the consent screen before launch (otherwise only test users can sign in)

### LinkedIn

- [ ] Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps) (needs a company page)
- [ ] Products tab → request **Sign In with LinkedIn using OpenID Connect**
- [ ] Auth tab → add redirect URL `https://yourdomain.com/api/auth/linkedin/callback`
- [ ] Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`, redeploy
- [ ] Click "Continue with LinkedIn" and sign in successfully

### Apple (needs the $99 program)

- [ ] Enrol in the Apple Developer Program
- [ ] Create a **Services ID** → this is `APPLE_CLIENT_ID`
- [ ] Configure Sign In with Apple: your domain + return URL `https://yourdomain.com/api/auth/apple/callback`
- [ ] Create a key with Sign In with Apple enabled and download the `.p8`
- [ ] Run `npm run apple:secret -- --team-id … --key-id … --client-id … --key …`
- [ ] Set `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET`, redeploy
- [ ] Test on the live domain (Apple rejects localhost)
- [ ] Put a calendar reminder to regenerate the Apple secret in 6 months
- [x] Generator script for the Apple secret is in the repo

## Phase 5 — Payments

- [ ] Complete Stripe business verification (legal entity, address, bank account)
- [ ] Copy the **test** secret key into `STRIPE_SECRET_KEY`, redeploy
- [ ] Add a webhook endpoint for `checkout.session.completed`
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Buy Premier with test card `4242 4242 4242 4242`
- [ ] Book a table and pay the $5/person fee with the test card
- [ ] Swap to the live secret key
- [ ] Do one real charge on yourself and refund it
- [x] Stripe Checkout is wired for Premier and booking fees

## Phase 6 — Legal and support (before taking money)

- [ ] Write your privacy policy text (what you collect: name, photo, email, city, phone)
- [ ] Write your terms of service (what the $5 fee buys, refund position)
- [ ] Set up a support email address on your domain
- [ ] Ask me to add `/privacy` and `/terms` pages so you can paste that text in — not built yet

## Phase 7 — Optional services

- [ ] Enable **Places API** in Google Cloud (the legacy one — tell me if it's unavailable and I'll migrate the call)
- [ ] Create a Places API key → set `GOOGLE_PLACES_API_KEY`
- [ ] Set a billing budget alert in Google Cloud (Places is $32 per 1,000 after the free 5,000)
- [ ] Buy a Twilio number with SMS enabled
- [ ] Complete Twilio 10DLC brand and campaign registration
- [ ] Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- [ ] Set `ELITE_INVITE_CODE` and `ADMIN_SECRET` for invites and `/admin/elite`

## Phase 8 — The iPhone app

- [ ] Confirm you have a Mac with Xcode installed
- [ ] Run `python3 ios/install-on-mac.py` and open the project
- [ ] Pick a bundle identifier, e.g. `com.yourdomain.conclave`
- [ ] Make a 1024×1024 app icon
- [ ] Take App Store screenshots at the required device sizes
- [ ] Answer Apple's App Privacy questionnaire
- [ ] Add your privacy policy URL to App Store Connect
- [ ] Create a real member account for the reviewer and put the login in the review notes
- [ ] Decide on payments: sell Premier on the website only for now (Apple's external-link rate is unsettled)
- [ ] Ask me to add native pieces (push, camera, share) so it isn't rejected as a plain web wrapper
- [ ] Submit for review

## Phase 9 — Before you invite anyone

- [ ] Open `/setup` on the live site and confirm everything you paid for shows Connected
- [ ] Sign up as a second person and confirm you each appear in the other's Discover
- [ ] Send an introduction, accept it, and exchange messages
- [ ] Propose a table and complete a booking end to end
- [ ] Delete your test accounts (Profile → Reset)
- [ ] Ask me to move profile photos to cloud storage before real volume — photos sit in the database today

## Phase 10 — Open the doors

- [ ] Post the link on LinkedIn and X
- [ ] Personally message 20–50 people you'd want at the table
- [ ] Watch `/setup` and Stripe for the first week
- [ ] Ask me for whatever breaks
