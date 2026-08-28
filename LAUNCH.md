# Launch Conclave

I can prepare the code. **You** must create accounts and paste keys — I can’t log into Stripe/Google/Twilio/Vercel for you.

---

## What I already did in the app

- Stripe Checkout for **table booking fees** (redirects to Stripe, returns to chat, completes booking)
- Premier Stripe Checkout (when key is set)
- Google Places hook
- Twilio SMS hook
- Multi-user DB APIs
- `/api/health` — shows what’s configured (no secrets)

---

## What YOU must do (≈ 1–2 hours)

### A. Hosting + database (~15 min) — **required**

1. Push this repo to GitHub  
2. Go to [vercel.com](https://vercel.com) → Import project  
3. Create free Postgres: [supabase.com](https://supabase.com) or [neon.tech](https://neon.tech)  
4. Copy the Postgres connection string  
5. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
6. On Vercel → Settings → Environment Variables, set at least:
   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-URL.vercel.app
   AUTH_SECRET=long-random-string
   ```
7. Redeploy. Run once (Vercel build already runs `prisma generate`):
   ```bash
   npx prisma db push
   ```
   (or add a build command: `prisma generate && prisma db push && next build` — ask me if you want that wired)

**Cost:** $0–$25/mo

---

### B. Stripe (~10 min) — **required for money**

1. [dashboard.stripe.com](https://dashboard.stripe.com) → sign up  
2. Developers → API keys → copy **Secret key** (`sk_test_...` first)  
3. Vercel env: `STRIPE_SECRET_KEY=sk_test_...`  
4. Redeploy  

**Cost:** $0 until someone pays; then ~3% fee

Test card: `4242 4242 4242 4242`

---

### C. Google Places (~15 min) — **required for real restaurants**

1. [console.cloud.google.com](https://console.cloud.google.com)  
2. Enable **Places API**  
3. Create API key  
4. Vercel env: `GOOGLE_PLACES_API_KEY=...`  
5. Redeploy  

**Cost:** often $0 early (free credit); then usage

---

### D. Twilio (~15 min) — **required for SMS**

1. [twilio.com/try-twilio](https://www.twilio.com/try-twilio)  
2. Copy Account SID, Auth Token, phone number  
3. Vercel env:
   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_FROM_NUMBER=+1...
   ```
4. Redeploy  

**Cost:** ~$5–$30/mo light use

---

### E. LinkedIn login (recommended for your LinkedIn posts)

1. [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)  
2. Redirect URL: `https://YOUR-DOMAIN/api/auth/linkedin/callback`  
3. Vercel env: `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET`  

**Cost:** $0

---

## Check you’re ready

Open: `https://YOUR-DOMAIN/api/health`

You want:
- `readyForMoney: true`
- `readyForRestaurants: true`
- `readyForSms: true` (for texts)

---

## Then get people

1. Do one full test: introduce → agree → **pay with Stripe test card** → SMS  
2. Post your link on **LinkedIn + Twitter**  
3. DM 20–50 people personally  

---

## Cost to launch

| Item | About |
|------|--------|
| Hosting + DB | $0–$25/mo |
| Stripe | % of sales only |
| Places | $0–$50/mo early |
| Twilio | $5–$30/mo |
| **Total** | **~$25–$80/mo** |

---

## Say this next

When you’ve created accounts (or want me to switch the schema to Postgres / wire the Vercel build command), tell me:

> “I have Stripe / I have Vercel / switch me to Postgres”

and I’ll do the next code step.
