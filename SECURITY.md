# Security

Conclave hardens the API so secrets stay on the server and user input is strictly validated.

## What’s in place

| Control | Detail |
|---------|--------|
| **Schema validation** | Zod `.strict()` schemas under `lib/validation/` — type checks, length limits, reject unexpected fields |
| **Rate limits** | Per-IP in-memory limits on auth, billing, Places, SMS, reports, analytics, connections |
| **Sessions** | Signed cookies embed `iat`/`exp`; **7-day** session + member cookie (not 30/365) |
| **Re-auth** | `POST /api/auth/reauth` issues a **10-minute** cookie for billing / paid BLACK |
| **Secrets** | Stripe, Twilio, Places, OAuth, `ADMIN_SECRET`, demo password — server-only |
| **Places photos** | Proxied via `/api/places/photo` — API key never in browser URLs |
| **Profile writes** | Cannot set `black`, `meetingsAttended`, `premier*`, or `verifications` via PUT |
| **Passwords** | scrypt (legacy SHA-256 still verified and upgraded on login) |
| **Admin grant** | `Authorization: Bearer <ADMIN_SECRET>` — secret not in JSON body |

## Env (server)

```
AUTH_SECRET=          # required in production
STRIPE_SECRET_KEY=
GOOGLE_PLACES_API_KEY=
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

- Upstash Redis rate limits across serverless isolates
- Apple `id_token` JWKS verification
- Stripe webhooks for durable BLACK activation
- Argon2id if you want a dedicated password KDF package
