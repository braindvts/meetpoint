# Conclave — how the product works

Keep this open as your product handbook. Update it when rules change.

**One-liner:** Conclave introduces ambitious people, then settles it over dinner.

**Delivery plan:** **Website first** (browser on laptop/phone). Turn it into a native app later once the website is making money. Do not rebuild the UI as a phone-frame “app shell” for web.

**Live code:** GitHub `braindvts/meetpoint` · stack Next.js + Postgres + Prisma · brand dark `#050505` + champagne gold `#d4c4a8`

---

## Website first (now) → native app (later)

| Now | Later |
|-----|--------|
| Responsive **browser website** (desktop + mobile) | Wrap the same site in iOS/Android (WKWebView / Capacitor) |
| Top nav on every screen (fixed) | Same URLs and product rules |
| Marketing home at `/` for every device | App Store listing when revenue supports it |

**Do not** force a 430px phone column or bounce mobile users away from the landing page.

---

## The three levels

| Level | How you get it |
|-------|----------------|
| **Member** | Sign up + finish **Identity** (photo, name, role, ambitions, looking for). Verification is **not** required. |
| **Verified** | Same Identity basics **plus** all **3** credentials: business email, LinkedIn, resume. |
| **BLACK** | Pay ($50/mo or $500/yr) **or** earn it (~20 dinners + strong profile + high ratings). Must already be verified to activate. |

There is **no** Trusted / Connector / “Tier 1 · …” anymore — only these three.

### Member (Identity only — verification optional)

**Member** = they created an account and filled **Identity**. They do **not** need any verification fields.

To become a Member they need:

- Photo  
- Full name  
- Job / role  
- Ambitions  
- What they’re looking for  

They can **skip** business email, LinkedIn, resume, website, portfolio entirely.

If they skip verification → they stay **Member** (not Verified). That’s correct.

**Short version:** Identity → **Member**. Identity + email + LinkedIn + resume → **Verified**.

### Verified — the 3 credentials (optional until they want it)

They become **Verified** only when Identity is done **and** all 3 credentials are added:

1. **Business email**  
2. **LinkedIn**  
3. **Resume** (HTTPS link to PDF / Drive / Dropbox)

Optional extras (do not replace the three): website, business registration, portfolio.

Signup must **not** block on verification — only Identity is required to create the account / enter the room.

### BLACK vs BLACK CONNECTION

- **BLACK** = the top membership (paid, earned, or operator-granted). Never given by inviting a friend.  
- **BLACK CONNECTION** = a separate badge for someone connected privately to a BLACK member. It does **not** turn into BLACK.

---

## Plans (money, separate from levels)

| Plan | Price | What it unlocks |
|------|-------|-----------------|
| Free Member | $0 | Member ↔ Member intros |
| **Conclave Premier** | $20/mo or $100/yr | Meet Verified & BLACK without being BLACK |
| **BLACK** | $50/mo or $500/yr | Top level + meet anyone |

Premier is a **plan**. Member / Verified / BLACK are **standing levels**. Someone can be Verified + Free, or Verified + Premier, or BLACK.

---

## Main screens

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` | Email + OAuth sign-in |
| `/onboarding` | Profile setup (highlights missing fields) |
| `/discover` | The Room — For you / Nearby match cards |
| `/circle` | Incoming / outgoing connection requests |
| `/chats` | Private DMs (poll ~4s) + table proposals |
| `/profile` | Your card, plans, levels, BLACK card |
| `/demo` | Demo bypass (only if `NEXT_PUBLIC_ENABLE_DEMO=1`) |

---

## How matching works (short)

Discover ranks people by shared ambitions, complementary “looking for,” same profession, and distance. Nearby narrows by city/geo. Members without Premier only introduce to other Members. Verified and BLACK (or Premier) can reach further.

---

## Demo / owner login

| Email | Password | Notes |
|-------|----------|-------|
| `brianasome@gmail.com` | `Brian812` | Always works; recreates on fresh DB; turns on sample people in that browser |

Local-only env flags (do **not** set on production unless you want demo entry):

```
NEXT_PUBLIC_ENABLE_DEMO=1
NEXT_PUBLIC_ENABLE_DEMO_PROFILES=1
```

---

## Tech & data

- **Frontend:** Next.js App Router, TypeScript, Tailwind  
- **DB:** Postgres via Prisma (`Member`, connections, chats, BLACK tables)  
- **Auth:** email/password + Google / LinkedIn / Apple (when keyed)  
- **Payments:** Stripe Checkout (`premier`, `black_month`, `black_year`)  
- **Email:** Resend welcome on sign-up  
- **Health:** `/api/health` shows which keys the server can see  

### Permanent hosting (doesn’t expire with Cursor)

1. Neon Postgres → copy `DATABASE_URL`  
2. Vercel project linked to `braindvts/meetpoint`  
3. Env: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`  
4. Redeploy  

Details: [WEBSITE.md](./WEBSITE.md) · [KEYS.md](./KEYS.md) · [LAUNCH.md](./LAUNCH.md)

---

## Design rules (don’t break these)

- Brand first: Conclave / champagne on dark ink  
- One typeface family (Outfit)  
- Level marks are the same metal shape: steel Member · champagne Verified · black sheen BLACK  
- Signup must show **what** is missing and **where** (Needed sections + sticky chips)  
- No purple AI-default theme, no cream+terracotta cliché  

---

## What’s still missing for full launch

See [MISSING.md](./MISSING.md). Big ones: email verify + password reset links, cloud photo storage, Stripe webhooks for durable Premier/BLACK, true realtime chat, optional iOS app.

---

## Quick “where is this in code?”

| Topic | File |
|-------|------|
| Levels logic | `lib/tiers.ts` |
| Required 3 credentials | `lib/types.ts` → `REQUIRED_VERIFICATIONS` |
| Level badges | `components/TierBadge.tsx`, `BlackBadge.tsx` |
| Signup missing fields | `components/ProfileForm.tsx` |
| BLACK rules | `lib/black.ts` |
| Premier access | `lib/plans.ts` |
| Demo owner login | `lib/demoOwner.ts`, `lib/ensureDemoOwner.ts` |
