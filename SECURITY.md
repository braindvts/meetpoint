# Security

Interlink hardens the API so secrets stay on the server and user input is strictly validated.

## What a visitor with your link can / cannot do

| They can | They cannot |
|----------|-------------|
| See the public UI (HTML/CSS) and the **minified** browser JavaScript every website sends | Download your Next.js **server** code, Prisma schema, or private repo |
| Inspect network calls in DevTools (same as any web app) | Read Stripe / DB / OAuth / `ADMIN_SECRET` / demo passwords from the server |
| Sign up like any member | Clone your database or “duplicate” the full product from a link alone |
| Try common probes (`/.env`, `/.git`, `*.map`) — we return **404** | Get readable source maps in production (`productionBrowserSourceMaps: false`) |

**Honest limit:** anything that runs in the browser can be viewed. That is how the web works. Protection is keeping secrets and business logic on the server, validating every API call, and not leaving owner backdoors open on the live site.

**Repo access is different:** if you give someone git access (or make the repo public), they get the full codebase. A website link alone is not that.

## What’s in place

| Control | Detail |
|---------|--------|
| **No production source maps** | Browser maps disabled; `.map` requests 404 |
| **Walkthrough owner gated** | Provision only when `ENABLE_WALKTHROUGH_OWNER=1` plus server-only mailbox/password env. Unset in production. Never overwrites an existing member |
| **No committed owner credentials** | Mailbox and password are not in the repo; no one-tap owner login |
| **Health endpoint** | Public `/api/health` only says up/misconfigured — full checklist needs admin Bearer |
| **Schema validation** | Zod `.strict()` schemas under `lib/validation/` |
| **Rate limits** | Per-IP limits on auth, billing, Places, SMS, reports, analytics, connections, chats, invites, account deletion, legal consent, and BLACK meeting awards |
| **Login lockout** | After 8 failed password attempts per email+IP, 15-minute cooldown |
| **Sessions** | Signed cookies `iat`/`exp`; **7-day**; `HttpOnly` + `SameSite=Lax` (+ `Secure` in prod). Logout is POST only. Session, OAuth state, reauth proof, reauth bind, and member cookies each use a distinct HMAC input and a required `purpose`. One cannot be presented as another. Email confirmation is a random token stored as a hash. Admin auth compares `ADMIN_SECRET` and does not use these signatures |
| **CSRF** | Mutating `/api/*` needs a matching Origin/Referer in production. Allowed hosts are the configured app origin, `interlinkgobal.com`, `www.interlinkgobal.com`, `meetpoint-flax.vercel.app`, and the exact host in `VERCEL_URL`, `VERCEL_BRANCH_URL`, or `VERCEL_PROJECT_PRODUCTION_URL` when that variable is set. Other `*.vercel.app` origins are rejected. A random Authorization header does not skip the check; the admin or notify secret must match |
| **Legal consent** | Email signup stores Terms and Privacy versions only when both boxes are true. Other signed-in product APIs return 403 until the current versions are on the member |
| **Account deletion** | `DELETE /api/members/me` requires the word DELETE and a fresh re-auth cookie. Password accounts get it from `POST /api/auth/reauth`. Google, Apple, and LinkedIn accounts get it by signing in again. The match is the stored provider account id (Google `sub`, Apple `sub`, LinkedIn `id`), never the email. The OAuth `state` is a new signed value, expires in 10 minutes, is bound to the member who started deletion, and is rejected on replay (the state cookie is deleted and the nonce is stored once). A mismatch does not set the reauth cookie, does not link a provider, and does not replace the session. Personal fields are anonymized; reports and blocks stay |
| **Intro standing** | Connection create and accept use the same Verified / BLACK rules as the product, on the server |
| **SMS** | A member can text only the phone saved on their profile. Service calls need `NOTIFY_SECRET` |
| **Live bookings** | Production does not confirm a table without Stripe checkout. BLACK CONNECTION from a meeting requires a paid booking session when the site is live |
| **Security headers** | CSP, HSTS (prod), frame deny, nosniff, COOP/CORP, Permissions-Policy |
| **OAuth** | Apple exchanges `code` at Apple’s token endpoint, then verifies the returned id_token via JWKs (signature, iss, aud, exp, nonce). Client-posted tokens are ignored. Reauth uses that verified `sub` and does not read a browser `id_token`. Google ID tokens are verified via JWKS. Google reauth also sends `max_age=0` and a nonce stored in the signed state, and accepts the id_token only when that nonce matches and `auth_time` is within 5 minutes. LinkedIn reauth cannot prove a fresh password prompt. The session cookie stays `SameSite=Lax`. The OAuth state cookie and the short reauth-bind cookie are `SameSite=None` and `Secure` in production so Apple’s cross-site form POST can present them |
| **Secrets** | Never `NEXT_PUBLIC_` for passwords/API keys |
| **Members / chats** | Auth required; chats only with connected peers; text sanitized |
| **Error leakage** | Production hides internal exception messages |
| **Passwords** | scrypt |
| **Admin** | Bearer `ADMIN_SECRET`; `/admin` noindex |
| **Probe paths** | `/.env`, `/.git`, `package.json`, backups, etc. → 404 |

## Env (server)

```
AUTH_SECRET=          # required in production
STRIPE_SECRET_KEY=
GOOGLE_PLACES_API_KEY=
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
TWILIO_* /
NOTIFY_SECRET=
ADMIN_SECRET=
# Walkthrough owner (keep OFF on the public site)
# ENABLE_WALKTHROUGH_OWNER=1
# WALKTHROUGH_OWNER_EMAIL=
# WALKTHROUGH_OWNER_PASSWORD=
# NEXT_PUBLIC_ENABLE_DEMO=1   # UI demo only — not a login
```

Never prefix secrets with `NEXT_PUBLIC_`.

## Client rules

- Sync profile with only writable fields (`lib/apiClient.syncProfileToServer`)
- Walkthrough login is never published to the client; the server confirms `demoOwner` only after env-gated credentials match
- Sensitive purchases may prompt `ReauthDialog` when the API returns `needsReauth`

## Limits counsel should see

- The email confirmation link puts the raw token in the URL. The page stashes it and strips the query before Plausible or first-party pageviews can record it. Only the hash is stored, and the token is single-use. Vercel’s request logs can still show the first request URL.
- `NEXT_PUBLIC_PLAUSIBLE_SRC`, when set, replaces the default exclusions script. A replacement script may ignore `data-exclude="/verify-email"`.
- Google and Apple create the member during the OAuth callback, then the consent gate blocks product APIs until the member accepts the current Terms. LinkedIn creates the row on the first profile save. Email signup stores acceptance at signup.

## Optional next steps

- Upstash Redis rate limits / lockouts across serverless isolates
- Stripe webhooks for durable BLACK activation
- Vercel Attack Challenge / WAF for bot abuse
- Keep the git repository **private**
