# Launch the website

Just the website. No iPhone app, no Apple Developer Program, no App Store.
Everything here is self-contained — you don't need the other docs to finish this list.

(The full version including the iOS app is [CHECKLIST.md](./CHECKLIST.md).)

---

## What the website costs

Prices checked 2 September 2026.

| Cost | Amount | When | Needed? |
|------|--------|------|---------|
| Domain name | $10–15 | Once a year | **Yes** |
| GitHub | $0 | — | **Yes** |
| Vercel hosting | $0 on Hobby (personal use only) · **$20** on Pro once you charge money | Monthly | **Yes** |
| Postgres — Neon or Supabase | $0 free tier · $19–25 later | Monthly | **Yes** |
| Resend email | $0 up to 3,000/month (100/day) · $20 for 50,000 | Monthly | **Yes** |
| Stripe | $0 to open · **2.9% + $0.30** per charge, +1.5% foreign cards, $15 per dispute | Per sale | Only to charge |
| Google sign-in | $0 | — | Recommended |
| LinkedIn sign-in | $0 | — | Recommended |
| Google Places | $0 for 5,000 searches/month, then **$32 per 1,000** | Usage | Optional |
| Twilio texts | $1.15/month per number + ~$0.02 per text + ~$20–60 registration | Monthly | Optional |
| Plausible analytics | ~$9 | Monthly | Optional |

### Totals for a website-only launch

| What you're doing | Per month | First year |
|-------------------|-----------|-----------|
| Free tiers, not charging anyone yet | $0 | **~$12** — the domain, nothing else |
| Charging for Premier — Vercel Pro, free database and email | $20 | **~$252** |
| Once you have real members — paid database and email | $59 | **~$720** |

Stripe's cut on top: $19.12 lands from a $20 Premier, $96.80 from the $100 annual plan, and $19.12 from a four-person table booking charged as one $20 payment.

Skipping the iPhone app saves you the $99/year Apple membership, and it also means **Sign in with Apple can't be enabled** — that button needs the paid Apple program. Google and LinkedIn are free, and email plus password already works.

---

## Phase 1 — Accounts to open · ~$12

- [ ] Buy the domain — [Cloudflare Registrar](https://dash.cloudflare.com) or [Namecheap](https://www.namecheap.com) ($10–15/year)
- [ ] Create a [GitHub](https://github.com) account and push this project to it (free)
- [ ] Create a [Vercel](https://vercel.com) account (free to start)
- [ ] Create a Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free tier)
- [ ] Create a [Resend](https://resend.com) account (free tier)
- [ ] Create a [Stripe](https://dashboard.stripe.com/register) account — only when you're ready to charge
- [ ] Have a bank account ready for Stripe payouts

## Phase 2 — Put the site online · $0–20/month

- [ ] Vercel → Add New → Project → import your GitHub repo
- [ ] Project → Settings → Domains → add your domain and follow the DNS steps
- [ ] Set `DATABASE_URL` to your Postgres connection string
- [ ] Set `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com`
- [ ] Set `AUTH_SECRET` — generate with `openssl rand -base64 48`
- [ ] Redeploy
- [ ] `https://yourdomain.com` loads the landing page
- [ ] `https://yourdomain.com/api/members` returns `{"ok":true,"members":[]}`
- [ ] Switch Vercel to Pro before you take real money (Hobby is non-commercial)
- [x] Database tables are created automatically on every deploy

## Phase 3 — Welcome email · $0

- [ ] Resend → API Keys → create one → set `RESEND_API_KEY`
- [ ] Resend → Domains → add your domain
- [ ] Paste Resend's SPF and DKIM records into your DNS
- [ ] Wait until the domain reads Verified
- [ ] Set `EMAIL_FROM` to `Conclave <hello@yourdomain.com>`
- [ ] Sign up with your own email on the live site and confirm the email lands
- [x] The welcome email itself is written and wired to sign-up
- [ ] Ask me for email verification and password reset — not built yet

## Phase 4 — Google sign-in · $0

- [ ] [Google Cloud → Credentials](https://console.cloud.google.com/apis/credentials)
- [ ] Configure the OAuth consent screen (External, app name, support email)
- [ ] Add yourself under Test users
- [ ] Create Credentials → OAuth client ID → Web application
- [ ] Authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
- [ ] Second redirect URI for local work: `http://localhost:3000/api/auth/google/callback`
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, redeploy
- [ ] Click "Continue with Google" and reach Google's account picker
- [ ] Publish the consent screen — while it's in Testing, only your test users can sign in

## Phase 5 — LinkedIn sign-in · $0

- [ ] Create a LinkedIn company page if you don't have one (required for the app)
- [ ] Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps)
- [ ] Products tab → request **Sign In with LinkedIn using OpenID Connect**
- [ ] Auth tab → redirect URL `https://yourdomain.com/api/auth/linkedin/callback`
- [ ] Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`, redeploy
- [ ] Sign in with LinkedIn successfully (it also verifies the member's profile)

## Phase 6 — Charging money · 2.9% + $0.30 per charge

- [ ] Complete Stripe business verification (legal entity, address, bank account)
- [ ] Set `STRIPE_SECRET_KEY` to your **test** key first, redeploy
- [ ] Stripe → Webhooks → add an endpoint for `checkout.session.completed`
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Buy Premier with test card `4242 4242 4242 4242`
- [ ] Book a table and pay the $5-per-person fee with the test card
- [ ] Swap in the live secret key
- [ ] Charge yourself once for real, then refund it
- [x] Stripe Checkout is already wired for Premier and booking fees

## Phase 7 — Legal pages · $0

- [ ] Write your privacy policy (you collect name, photo, email, city, phone)
- [ ] Write your terms (what the $5 fee buys, your refund position)
- [ ] Set up a support email address on your domain
- [ ] Ask me to add `/privacy` and `/terms` pages to paste them into — not built yet

Stripe and Google's OAuth review both expect these to exist at real URLs.

## Phase 8 — Optional extras · $0 until switched on

- [ ] Google Places for live restaurant search — enable **Places API**, set `GOOGLE_PLACES_API_KEY`
- [ ] Set a Google Cloud budget alert first — it's $32 per 1,000 searches after the free 5,000
- [ ] Twilio for booking texts — buy a number, complete 10DLC registration, set the three `TWILIO_*` vars
- [ ] Set `ELITE_INVITE_CODE` and `ADMIN_SECRET` for Elite invites and `/admin/elite`

Without Places, restaurant suggestions come from the built-in Michelin and five-star list, which is fine to launch on.

## Phase 9 — Test it like a member · $0

- [ ] `https://yourdomain.com/api/health` — everything you set up reads `true`
- [ ] Sign up, finish your profile, land on Discover
- [ ] Get a friend to sign up so you each appear in the other's Discover
- [ ] Send an introduction, accept it, exchange messages
- [ ] Propose a table and complete a booking
- [ ] Delete the test accounts (Profile → Reset)
- [ ] Ask me to move profile photos to cloud storage before real volume — they sit in the database today

## Phase 10 — Open the doors · $0

- [ ] Post the link on LinkedIn and X
- [ ] Message 20–50 people you'd actually want at the table
- [ ] Watch Stripe and `/api/health` for the first week
- [ ] Tell me whatever breaks
