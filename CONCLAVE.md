# Conclave — how the app works

Keep this open as your product handbook. Update it when rules change.

**One-liner:** Conclave introduces ambitious people, then settles it over dinner.

**Live code:** GitHub `braindvts/meetpoint` · stack Next.js + Postgres + Prisma · brand dark `#050505` + champagne gold `#d4c4a8`

---

## The three levels

| Level | How you get it |
|-------|----------------|
| **Member** | Create an account (email/password or OAuth). You’re in the room. |
| **Verified** | Finish your profile **and** add all **3** business credentials below. |
| **BLACK** | Pay ($50/mo or $500/yr) **or** earn it (~20 dinners + strong profile + high ratings). Must already be verified to activate. |

There is **no** Trusted / Connector / “Tier 1 · …” anymore — only these three.

### Verified — the 3 required credentials

All three are required. Optional extras help your score but don’t replace these.

1. **Business email** — work email preferred; personal OK if that’s what you use for business  
2. **LinkedIn** — public `linkedin.com/in/…` URL (or LinkedIn sign-in)  
3. **Resume** — HTTPS link to a PDF / Drive / Dropbox resume  

Optional: website, business registration, portfolio.

Also required for a complete profile (alongside the 3): photo, name, job/role, ambitions, what you’re looking for.

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
