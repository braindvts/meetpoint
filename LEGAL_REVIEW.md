# Legal review checklist

Working notes for counsel. Nothing in this file is a claim that Interlink already owns the items below. The repository does not establish a legal entity, a registered office, or an assignment of IP.

Placeholders used in the product copy: `[LEGAL ENTITY NAME]`, `[JURISDICTION]`, `[CONTACT EMAIL]`, `[SAFETY CONTACT EMAIL]`.

Privacy also includes optional EU/UK and California sections, each marked `[INCLUDE IF SERVING THIS REGION, pending owner decision]`. Those sections do not claim the GDPR, UK GDPR, CCPA, or CPRA already applies.

## Trademark — “Interlink”

- [ ] Search the name “Interlink” in the jurisdictions where the product will be offered (word mark and logo).
- [ ] Search similar names in software, social networking, and hospitality.
- [ ] The product name in the interface is **Interlink**. “Conclave” appears in older file names, cookie names (`conclave_member`, `conclave_reauth`), and an Instagram asset. That history is not a trademark filing.
- [ ] “meetpoint” is the GitHub repository and Vercel project name, not the user-facing brand.
- [ ] Do not treat this codebase as evidence of a registration or of a clearance opinion.

## Logo

- [ ] Identify who drew the Interlink wordmark and logo (`components/Wordmark.tsx`, `components/ConclaveLogo.tsx`).
- [ ] Get a written assignment if a contractor or an automated design tool produced it.
- [ ] Confirm the logo does not copy another company’s mark.

## Domain

- [ ] Confirm who owns **interlinkgobal.com** (note the spelling: g-o-b-a-l, not “global”).
- [ ] The same deployment is also referenced as `meetpoint-flax.vercel.app` in `lib/site.ts`.
- [ ] Put the domain in the name of `[LEGAL ENTITY NAME]` or document the licensee.
- [ ] Decide whether the spelling should stay or whether a different domain will be purchased. This repo does not buy or transfer domains.

## Source code

- [ ] Confirm the GitHub org `braindvts` is controlled by the people who should own the product.
- [ ] The repo does not contain a `LICENSE` granting the public rights to the application code. `package.json` is `"private": true`.
- [ ] List every human and tool that wrote code. This product has been built with AI-assisted development (Cursor cloud agents and similar). AI output still needs a human owner and, where the tool’s terms require it, compliance with that vendor’s contract.
- [ ] Contractor agreements should assign IP to `[LEGAL ENTITY NAME]` and should mention AI assistance if that is how the work was produced.

## Third-party assets

- [ ] Partner marks are centralized in `lib/featuredPartners.ts`.
- [ ] BijuuFlow, Grounded (legal name recorded as Grounded Peptides), ONYX Futures, and Edgeable stay visible because Brian approved the partner graphic. Each row is `permission: "pending_written_confirmation"`. Brian must confirm written permission is on file. `permissionReviewBy` is `2026-12-31`.
- [ ] If permission is not confirmed, change that partner to `pending` or `revoked`. Public pages read `publicFeaturedPartners()` and will hide them.
- [ ] Unsplash images and files in `public/events`, `public/social`, and `public/conclave-instagram*` need a recorded license or a replacement. See `THIRD_PARTY_LICENSES.md`.
- [ ] Sign-in buttons use LinkedIn, Google, and Apple artwork. Follow each brand’s guidelines.

## Open source

- [ ] Direct dependencies are MIT or Apache-2.0. See `THIRD_PARTY_LICENSES.md`.
- [ ] Re-scan transitive dependencies at launch. Do not ship a GPL, AGPL, or SSPL dependency without a decision.
- [ ] Outfit is used under the SIL Open Font License.

## Partners and APIs

- [ ] Written logo permission for each partner. Public status is `pending_written_confirmation` until Brian confirms it.
- [ ] Stripe account owned by the entity that will appear on card statements.
- [ ] Google Cloud project for OAuth and Places, with the right API restrictions.
- [ ] Apple Developer account for Sign in with Apple.
- [ ] LinkedIn app review if the API terms require it.
- [ ] Resend domain authentication for the from-address (`RESEND_API_KEY` and `EMAIL_FROM`). Confirmation links and welcome mail both go through Resend. The raw confirmation token is not stored.
- [ ] Twilio account and a registered sender if SMS stays on.
- [ ] Plausible site, only if `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set in production. First-party page visits and partner-click counts do not use an external package. No advertising pixel is loaded.
- [ ] Vercel team ownership.

## Copyright in the product

- [ ] Terms and Privacy text in `app/terms` and `app/privacy` was written for this repo as a **draft**. It is not copied from another company’s policy. It still needs a lawyer.
- [ ] Member-generated profiles, photos, and messages belong to the members, with the license described in the draft Terms. That license is not a substitute for counsel’s wording.

## Data and payments that counsel should read in the code

- Account deletion anonymizes the member row instead of dropping it. It requires a fresh sign-in (`hasRecentReauth`, the same check as `POST /api/auth/reauth`). Safety reports and blocks stay attached to that id, whether the member filed them or was named in them. Block foreign keys are `ON DELETE RESTRICT`. Payment flags stay on the same id. See `DELETE` in `app/api/members/me/route.ts` and `anonymizeDeletedAccount`. Report, block, and account deletion stay available when Terms consent is out of date. Profile Reset is a different action: `POST /api/members/me/reset` clears public profile fields and introductions and leaves the account in place.
- There is no self-serve refund or subscription-cancel screen.
- Event RSVPs are stored on the server in `EventInterest` (interested, going, or passed), one row per member per event. A browser copy may still exist. Public counts skip sample accounts and anonymized members (`deletedAt`).
- Profile rows also store company, industry, and selected interests (`MemberInterest`). Account deletion clears those fields and deletes interest and RSVP rows.
- Account email confirmation is a single-use hashed token emailed through Resend. `emailVerifiedAt` is set only when that link matches the member and address. Saving a business email on the profile does not confirm the account email.
- Verification values on the profile are self-attested. Verified standing on the server requires both business email and LinkedIn to be present on the profile. It is not a check that the email inbox or LinkedIn account was independently proven in every path.
