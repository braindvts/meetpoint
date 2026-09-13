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
| **Rate limits** | Per-IP limits on auth, billing, Places, SMS, reports, analytics, connections, chats, invites |
| **Login lockout** | After 8 failed password attempts per email+IP, 15-minute cooldown |
| **Sessions** | Signed cookies `iat`/`exp`; **7-day**; `HttpOnly` + `SameSite=Lax` (+ `Secure` in prod) |
| **CSRF** | Mutating `/api/*` needs matching Origin/Referer in production |
| **Security headers** | CSP, HSTS (prod), frame deny, nosniff, COOP/CORP, Permissions-Policy |
| **OAuth** | Apple exchanges `code` at Apple’s token endpoint, then verifies the returned id_token via JWKs (iss, aud, exp, nonce). Client-posted tokens are ignored. Google ID tokens verified via JWKS |
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

## Optional next steps

- Upstash Redis rate limits / lockouts across serverless isolates
- Stripe webhooks for durable BLACK activation
- Vercel Attack Challenge / WAF for bot abuse
- Keep the git repository **private**
