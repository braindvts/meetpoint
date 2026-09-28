# Third-party licenses and services

Draft inventory for Interlink (`braindvts/meetpoint`). This is not a legal opinion. “Commercial use appears permitted” means the public license text or terms we reviewed do not say “non-commercial only.” Counsel should confirm before launch. Versions below match `package.json` ranges; the lockfile pins exact versions.

No GPL, AGPL, or SSPL license was selected as a direct dependency. A seriously restrictive license, if one appears in a future upgrade, should be treated as a launch blocker rather than used silently.

## Direct npm packages

| Package | Used for | License | Commercial use | Review |
| --- | --- | --- | --- | --- |
| `next` | App framework, routing, server rendering | MIT | Appears permitted | Keep the framework’s trademark rules in mind; the MIT license covers the code |
| `react`, `react-dom` | UI | MIT | Appears permitted | — |
| `@prisma/client`, `prisma` | Postgres access and migrations | Apache-2.0 | Appears permitted | Apache patent grant applies. Do not use `prisma db push` on Production |
| `stripe` | Checkout sessions and payment verification | MIT | Appears permitted | The SDK is MIT. Stripe’s **service** terms are separate and required to charge cards |
| `jose` | Verify Google and Apple ID tokens | MIT | Appears permitted | — |
| `zod` | Request validation | MIT | Appears permitted | — |
| `server-only` | Stop server modules from being imported by client components | MIT | Appears permitted | — |
| `tailwindcss`, `@tailwindcss/postcss` | CSS (dev) | MIT | Appears permitted | — |
| `typescript` | Typecheck (dev) | Apache-2.0 | Appears permitted | — |
| `tsx` | Run `node:test` files (dev) | MIT | Appears permitted | — |
| `@types/node`, `@types/react`, `@types/react-dom` | Type declarations (dev) | MIT | Appears permitted | — |

Transitive packages are pulled in by those dependencies (Next.js, Prisma engines, and so on). They were not copied into the repo as source. A scan of installed `package.json` license fields after `npm ci` found no GPL, AGPL, or SSPL packages. It did find **LGPL-3.0-or-later** on `@img/sharp-libvips-linux-x64` and `@img/sharp-libvips-linuxmusl-x64`. Those are native image libraries used by `sharp`, which Next.js uses for image optimization. LGPL is not the same as AGPL, and this app does not modify libvips, but counsel should confirm that shipping the binary with the Next.js server build is acceptable. Re-run the scan at launch. Prisma’s query engine binaries ship under Apache-2.0 with the Prisma project.

## Fonts

| Asset | Used for | License | Commercial use | Review |
| --- | --- | --- | --- | --- |
| Outfit (Google Fonts, loaded with `next/font/google` in `app/layout.tsx`) | UI type | SIL Open Font License 1.1 | Appears permitted | OFL allows use and redistribution. The font itself cannot be sold alone. Reserved font name rules apply if the font is modified |

## Icons and brand marks in the UI

| Asset | Used for | License / terms | Commercial use | Review |
| --- | --- | --- | --- | --- |
| LinkedIn, Google, and Apple marks drawn in `components/AuthButtons.tsx` | Sign-in buttons | Those companies’ brand guidelines, not an open-source license | Only as the guidelines allow | Confirm the buttons match each brand’s “sign in with” rules. Do not treat the SVG paths as Interlink-owned art |
| Partner marks: BijuuFlow, Grounded, ONYX Futures, Edgeable | Landing row, loading splash, Edgeable card | Not established in this repo | Unknown until written permission is on file | Config status is `approved` so the live site does not change. Each entry has a TODO that written permission must be confirmed. See `lib/featuredPartners.ts` and `LEGAL_REVIEW.md` |

## Images and photos

| Asset | Used for | License | Commercial use | Review |
| --- | --- | --- | --- | --- |
| Unsplash URLs in `lib/restaurantPhotos.ts` and some event imagery | Restaurant and event pictures | Unsplash License | Unsplash’s license generally allows commercial use | Unsplash photos are not assigned to Interlink. Do not imply we own them. Keep the Unsplash terms |
| Files under `public/events/` and `public/social/` | Event and social imagery | Not stated in the repo | Unknown | Confirm the photographer or stock license, or replace them |
| `public/conclave-instagram.png` and the matching PDF / story image | A social export page | Not stated in the repo | Unknown | The filename still says “conclave”. Ownership is not documented |
| `public/edgeable-logo.png` and the SVG partner marks | Partner credits | Partner-owned | Pending written permission | Same TODO as the partner config |

## Maps and places

| Service | Used for | Terms | Commercial use | Review |
| --- | --- | --- | --- | --- |
| Google Places (server-side `GOOGLE_PLACES_API_KEY`, `app/api/places/search` and `photo`) | Restaurant search and photo proxy | Google Maps Platform Terms of Service | Allowed only under a billed Google project and those terms | The key must stay server-side. This is not an open-source license |

## Payments, mail, SMS, sign-in, analytics, hosting

| Service | Used for | Terms | Notes |
| --- | --- | --- | --- |
| Stripe | BLACK subscription checkout and table booking charges | Stripe Services Agreement | Card numbers are not stored in Postgres. No self-serve refund API is implemented |
| Google OAuth | Sign-in | Google API Services User Data Policy and OAuth terms | ID tokens are verified with Google’s keys |
| Apple Sign In | Sign-in | Apple Developer Program License Agreement | The app exchanges an authorization code, then verifies the token |
| LinkedIn OAuth | Sign-in | LinkedIn API terms | A member row may be created on the first profile save |
| Resend | Welcome email when `RESEND_API_KEY` is set | Resend’s terms | Mail is skipped when the key is absent. The recipient address is not written to logs by the current sender |
| Twilio | Booking SMS when Twilio env vars are set | Twilio terms | Members can send only to their own profile phone unless `NOTIFY_SECRET` authenticates a service call |
| Plausible | Optional page analytics when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set | Plausible’s terms | The script URL can be overridden with `NEXT_PUBLIC_PLAUSIBLE_SRC`. Off when unset |
| First-party `AnalyticsEvent` | Page and product events in Postgres | n/a (our table) | Stores a path, event name, optional member id, and a small JSON blob. No email column |
| Vercel | Hosting for https://interlinkgobal.com | Vercel terms | Domain spelling is `gobal`, as deployed |

## What this file does not prove

- That Interlink owns its name, logo, domain, or source.
- That partner logos may be shown.
- That any of the service agreements have been signed by [LEGAL ENTITY NAME].
