# Interlink — how the product works

Keep this open as your product handbook. Update it when rules change.

**One-liner:** Interlink introduces ambitious people, then settles it over dinner.

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
| **Verified** | Same Identity basics **plus** business email and LinkedIn. |
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

**Short version:** Identity → **Member**. Identity + email + LinkedIn → **Verified**.

### Verified — business email + LinkedIn (optional until they want it)

They become **Verified** only when Identity is done **and** both credentials are added:

1. **Business email**  
2. **LinkedIn**

Optional extras (do not replace those two): resume, website, business registration, portfolio.

Signup must **not** block on verification — only Identity is required to create the account / enter the room.

### BLACK vs BLACK CONNECTION

- **BLACK** = the top membership (paid, earned, or operator-granted). Never given by inviting a friend.  
- **BLACK CONNECTION** = a separate badge for someone connected privately to a BLACK member. It does **not** turn into BLACK.

---

## Plans (money, separate from levels)

| Plan | Price | What you get |
|------|-------|----------------|
| **Free** | $0 | Member ↔ Member intros. Get **Verified** to meet anyone. |
| **BLACK** | $50/mo or $500/yr | Top level · meet anyone · paid or earned |

There is **no Premier**. Standing levels are Member / Verified / BLACK. Want to introduce beyond Members? Become Verified (email + LinkedIn).

Must be **Verified** before activating BLACK.

### BLACK CONNECTION

Separate from BLACK. Shown as a **blue checkmark** next to the name (trusted). Earned when a BLACK member connects you privately — never upgrades you to BLACK.

**BLACK** standing itself uses a **black checkmark** by the name (not a “BLACK” word badge).

---

## Discover cards & filter

- Cards are **even height**; only the important info: name, role, city, level badge, short bio, focus tags, wants, match line.
- Do **not** list how someone verified (email / LinkedIn). The **Verified** level badge is enough.
- Filter (funnel icon): change **what you’re looking for** anytime after signup — Discover updates immediately.

---

## Notifications

The bell in the top nav opens the feed. The same list is at `/notifications`.

- **Connection** — someone accepts an introduction you sent. Accepting their request does not notify you.
- **In {city}** — a published gathering whose city string matches the city on your profile. That is the local signal the catalog already has.
- **Upcoming** — gatherings (including a convention, when the catalog has one) when none match your city, or a convention outside your city.
- Mark read and Clear stay in this browser. There is no notifications table.
- Event rows show the gathering’s photograph (catalog image). Connection rows do not.

## Chats

- **Messenger layout:** left = people you’ve accepted / talk to; right = the selected thread.
- Deep links `/chats/[id]` open `/chats?c=…` in the split view.

## Circle

- **Incoming connections** (accept / decline) and **booked reservations** (planned meetups + confirmed tables).

## Main screens

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` | Email + OAuth sign-in |
| `/onboarding` | Multi-step setup after sign-up: Basics, Work, Goals, Interests, Bio. Saved on the account. If they leave, they return to the step they stopped on. |
| `/discover` | The Room — For you / Nearby match cards |
| `/events` | Events & conventions — public catalog (RSVP needs an account) |
| `/events/[id]` | Event detail, RSVP, related rooms, people attending |
| `/admin/events` | Create / edit / publish events (ADMIN_SECRET + local overlay) |
| `/circle` | Incoming connects + booked reservations |
| `/notifications` | Acceptances and upcoming gatherings (also the bell in the top nav) |
| `/chats` | People list (left) + open thread (right) |
| `/profile` | Your card, Plans (BLACK · Free), levels |
| `/demo` | Demo bypass (only if server-only `ENABLE_DEMO_PROFILES=1`) |

---

## Profile fields (real members)

Saved on the server in `Member`, not only in this browser. Reset clears the same fields in the database.

| Field | Stored as | Notes |
|-------|-----------|--------|
| Name | `Member.name` | Required for Identity |
| Headline / job title | `Member.jobTitle` | Required for Identity |
| Company | `Member.company` | Optional |
| Industry | `Member.industry` | Optional. One label from the industry list in `lib/interests.ts` |
| City | `cityName`, `cityCountry`, `cityLat`, `cityLng` | |
| Bio | `Member.bio` | Max 800 characters |
| Looking for | `lookingForJson` | Co-founder, Investor, Mentor, Clients, Hiring, Partnership, Networking |
| Interests | `MemberInterest` rows plus `ideaTagsJson` | Up to 24. Catalog labels become rows and are the only matching signal. Custom tags stay in `ideaTagsJson` if they are short plain text (no URLs, links, or control characters). |
| Photo | `Member.photo` | Required for Identity. https or a JPEG/PNG/WebP upload. randomuser.me URLs are rejected. |

Setup (`/onboarding`) and Edit profile use these same limits. Interests are a searchable, grouped picker (up to 24, including custom tags). A quiet “complete your profile” prompt appears when industry, interests, looking-for, or bio would improve matching.

Email and phone stay on the account. They are never sent to other members.

## How matching works (short)

Discover asks the server to rank **real** members. Shared interests rank first, then complementary “looking for,” industry, role, and city. Anyone left is still shown, newest first, with the reason “Recently joined”. Ranking still reads the full real-member pool on the server, selecting only the fields the rank and the public card need (not email, password hash, phone, or OAuth ids). The Discover response is the top 100. `GET /api/members` stays paged (default 50, never more than 100); clients follow `nextCursor`. Cards show a reason such as “3 shared interests: SaaS, AI / Machine Learning, Fintech”. Sample, guest, and bot accounts are excluded. Other members’ cards omit LinkedIn, website, portfolio, and verification badges. So is anyone blocked in either direction, and anyone auto-hidden after open reports from three trusted reporters (`discoverExcludedIds` in `lib/moderation.ts`: verified email, a finished profile, or an account at least a few days old). Brand-new accounts do not count. Nearby narrows by city. The filter also lets you narrow by **standing** (Member / Verified / BLACK). **Members** only introduce to other Members. **Verified** and **BLACK** can meet anyone. Looking-for preferences can be edited from Discover’s filter anytime.

**Events** (`/events`) ranks gatherings with those same saved interest labels, plus job/role, looking-for, industry, and bio intent phrases, against title, description, topics, audience, and host. Hybrid score (canonical tags + related clusters + TF-IDF + intent heuristics). Short match reasons on cards. Precision over dumping the catalog. Sparse profiles fall back to job and looking-for. A signed-in RSVP (interested / going / pass) is stored in `EventInterest` and nudges similar rooms. Attending and interested counts are the rows in that table.

---

## Safety

- Members report another member from their profile or chat (`harassment`, `spam`, `fake_profile`, `inappropriate`, `scam`, `other`) and can block at the same time.
- A block is both ways for visibility: those two people do not appear to each other in Discover, For you, connection requests, chats, or event attendee lists. Either person can unblock only the block they created.
- **Auto-hide:** 3 distinct qualifying reporters with a report still `open` or `reviewing` hides that member from Discover and For you until an admin marks the reports `resolved` or `dismissed`. A report counts when the reporter has a verified email (`emailVerifiedAt` or an OAuth account), a completed Identity profile, or an account at least 3 days old (`AUTO_HIDE_MIN_ACCOUNT_AGE_DAYS`). The cutoff is `OPEN_REPORT_HIDE_THRESHOLD` in `lib/safetyRules.ts`. Crossing into auto-hide lists the member at the top of `/admin/reports` and emails `ADMIN_EMAILS` when mail is configured.
- Admins review the queue at `/admin/reports` with `ADMIN_SECRET` (Bearer). There is no owner password in the repo.

## Demo / walkthrough login

There is **no committed owner mailbox or password**. Sign-in never recreates a privileged owner on an arbitrary database.

A walkthrough owner can be provisioned only when **all** of these **server-only** env vars are set. Leave them unset in production. Do not commit values.

```
ENABLE_WALKTHROUGH_OWNER=1
WALKTHROUGH_OWNER_EMAIL=
WALKTHROUGH_OWNER_PASSWORD=
```

If the gate is off (the production default), email sign-in uses the stored password hash only. Existing members are never overwritten.

Walkthrough owner login also requires the server-only `ENABLE_DEMO_PROFILES` gate below. `NEXT_PUBLIC_ENABLE_DEMO`, `NEXT_PUBLIC_ENABLE_DEMO_PROFILES`, and a flag saved in the browser do not enable it.

The public marketing home does not offer Enter demo, a sample-profile login, or a link to `/demo`. Sign in and Enter go to `/login`. `/demo` stays a direct route for capture scripts and local checks; it is not linked from the home page, nav, or footer, and it returns 404 unless `ENABLE_DEMO_PROFILES` is set on the server. The login page shows sample entry only after that same server check. A preview can set the variable for testing. When it is unset, `GET` and `POST /api/auth/demo` return 404. The route does not create a database member. The browser ignores `NEXT_PUBLIC_` demo flags and any saved walkthrough flag while the server gate is off.

```
ENABLE_DEMO_PROFILES=1
```

These public flags do not enable sample profiles, sample login, or the walkthrough owner. Leave them unset.

```
NEXT_PUBLIC_ENABLE_DEMO=1
NEXT_PUBLIC_ENABLE_DEMO_PROFILES=1
```

When sample profiles are on, the room includes **Member**, **Verified**, and **BLACK** samples. A Member can connect with the Member samples. Those introductions stay in this browser — the server connection list does not erase them, and the samples accept on their own so chat can be tested without a second account.

---

## Tech & data

- **Frontend:** Next.js App Router, TypeScript, Tailwind  
- **DB:** Postgres via Prisma (`Member`, connections, chats, BLACK tables, `Report`, `Block`, `RateLimitBucket`)
- **Vercel build:** `prisma generate && node scripts/prisma-migrate-deploy.mjs && next build`. `prisma generate` always runs. `migrate deploy` runs when `VERCEL_ENV` is `production`, or when `MIGRATE_ON_PREVIEW=1` (Preview only, after that database is confirmed separate). Otherwise the script skips migrations and logs why. Never `prisma db push` on Production (that tried to DROP live `Report` columns). Never `--accept-data-loss`. Locally, apply migrations with `npm run db:deploy`. Details: [prisma/README.md](./prisma/README.md).
- **Auth:** email/password + Google / LinkedIn / Apple (when keyed)  
- **Payments:** Stripe Checkout (`black_month`, `black_year`, table fee)  
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

- Brand first: Interlink / champagne on dark ink  
- One typeface family (Outfit)  
- Standing: typeset steel **Member** · champagne **Verified** · **black check** for BLACK · **blue check** for trusted (BLACK CONNECTION). Not metal chips, not numbered ranks. Check SVGs stay checks.  
- Signup must show **what** is missing and **where** (Needed sections + sticky chips)  
- No purple AI-default theme, no cream+terracotta cliché  

---

## What’s still missing for full launch

See [MISSING.md](./MISSING.md). Big ones: email verify + password reset links, cloud photo storage, Stripe webhooks for durable BLACK, true realtime chat, optional iOS app.

---

## Quick “where is this in code?”

| Topic | File |
|-------|------|
| Levels logic | `lib/tiers.ts` |
| Required credentials (email + LinkedIn) | `lib/types.ts` → `REQUIRED_VERIFICATIONS` |
| Plans (BLACK · Free) | `components/PlansSection.tsx` |
| BLACK CONNECTION checkmark | `components/BlackConnectionBadge.tsx` |
| Discover cards | `components/MatchCard.tsx` |
| Events catalog | `lib/events.ts`, `lib/eventStore.ts` |
| Event ranking | `lib/eventMatch.ts`, `lib/eventTaxonomy.ts`, `lib/eventSignals.ts` |
| Event UI | `components/events/*`, `app/events/*` |
| Notifications | `lib/notifications.ts`, `components/NotificationBell.tsx` |
| Signup missing fields | `components/ProfileForm.tsx` |
| BLACK rules | `lib/black.ts` |
| Intro reach | `lib/plans.ts` (`canIntroduceToTier`) |
| Walkthrough owner (env-gated) | `lib/walkthroughOwner.ts`, `lib/ensureDemoOwner.ts` |
| Reports / migrate deploy | `app/api/report/route.ts`, [prisma/README.md](./prisma/README.md) |
