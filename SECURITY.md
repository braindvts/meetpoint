# Security

Conclave hardens the API so secrets stay on the server and user input is strictly validated.

## What’s in place

| Control | Detail |
|---------|--------|
| **Schema validation** | Zod `.strict()` schemas under `lib/validation/` — type checks, length limits, reject unexpected fields |
| **Rate limits** | Per-IP in-memory limits on auth, billing, Places, SMS, reports, analytics, connections, chats, BLACK invites, members list |
| **Login lockout** | After 8 failed password attempts per email+IP, 15-minute cooldown (`lib/authLockout.ts`) |
| **Sessions** | Signed cookies embed `iat`/`exp`; **7-day** session + member cookie; `HttpOnly` + `SameSite=Lax` (+ `Secure` in prod) |
| **CSRF** | Middleware rejects mutating `/api/*` requests in production when Origin/Referer don’t match the app (OAuth callbacks + service auth exempt) |
| **Security headers** | CSP, HSTS (prod), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy; `poweredByHeader: false` |
| **OAuth** | Apple + Google **ID tokens verified via JWKS** (`jose`); OAuth `state` cookies |
| **Re-auth** | `POST /api/auth/reauth` issues a **10-minute** cookie for billing / paid BLACK |
| **Secrets** | Stripe, Twilio, Places, OAuth, `ADMIN_SECRET`, demo password — server-only |
| **Places photos** | Proxied via `/api/places/photo` — API key never in browser URLs |
| **Profile writes** | Cannot set `black`, `meetingsAttended`, `premier*`, or `verifications` via PUT |
| **Members list** | `GET /api/members` requires a signed-in session |
| **Chats** | Create only with **connected** peers; messages sanitized; membership checked |
| **XSS hardening** | User text sanitized (control chars + `<>` stripped) on messages, names, reports |
| **Error leakage** | Production API responses hide internal exception messages (`lib/safeError.ts`) |
| **Passwords** | scrypt (legacy SHA-256 still verified and upgraded on login) |
| **Admin grant** | `Authorization: Bearer <ADMIN_SECRET>` — secret not in JSON body |
| **Probe paths** | `/.env`, `/wp-*`, `/.git`, etc. return 404 from middleware |

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
DEMO_OWNER_PASSWORD=  # optional override; never NEXT_PUBLIC_
```

Never prefix secrets with `NEXT_PUBLIC_`.

## Client rules

- Sync profile with only writable fields (`lib/apiClient.syncProfileToServer`)
- “Continue as Brian” uses `{ mode: "demo-owner" }` — password never ships in the JS bundle
- Sensitive purchases may prompt `ReauthDialog` when the API returns `needsReauth`

## Optional next steps

- Upstash Redis rate limits / lockouts across serverless isolates
- Stripe webhooks for durable BLACK activation
- Argon2id if you want a dedicated password KDF package
- WAF / bot protection at the edge (Vercel Attack Challenge Mode)
