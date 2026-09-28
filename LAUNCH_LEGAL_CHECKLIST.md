# Launch legal checklist

Use this before pointing a public audience at Interlink. Checked boxes require a person, not this repository, to confirm them.

- [ ] **Terms reviewed.** `/terms` is a draft (`2026-09-28-draft`). A lawyer has replaced the placeholders and approved the text. The version constant in `lib/legal.ts` was bumped if the meaning changed, so members are asked again.
- [ ] **Privacy reviewed.** `/privacy` is a draft (`2026-09-28-draft-2`). It matches what Production stores, including Stripe, Resend, Twilio, Google Places, first-party page visits and partner-link clicks (no IP or email on those rows), and optional Plausible only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. No third-party ad tracker is loaded. EU/UK and California sections stay marked `[INCLUDE IF SERVING THIS REGION, pending owner decision]` until the owner decides. A lawyer has approved it, and `[SAFETY CONTACT EMAIL]` has been replaced alongside `[CONTACT EMAIL]`.
- [ ] **Trademark checked.** “Interlink” was searched and a decision was recorded. See `LEGAL_REVIEW.md`.
- [ ] **Partner permissions obtained.** BijuuFlow, Grounded Peptides, ONYX Futures, and Edgeable have written permission on file, or their `permission` field is no longer `approved`. The current `approved` value is a display holdover with an explicit TODO.
- [ ] **Third-party licenses checked.** `THIRD_PARTY_LICENSES.md` was re-read against `package-lock.json`. No GPL / AGPL / SSPL / non-commercial dependency is shipping unnoticed. Outfit, Unsplash, and brand icons were accepted or replaced.
- [ ] **Payment and refund policies reviewed.** BLACK prices ($50/mo, $500/yr) and the per-person booking fee match what counsel wants to promise. A refund and cancellation position exists. The product still has no self-serve cancel button; either build one or say so in the approved Terms.
- [ ] **Data deletion tested.** Create a password account and an OAuth account, add a profile, a chat, a connection, and a report, then delete the account. Confirm personal fields are cleared, messages from that member are blank, the report row remains, and the person cannot sign in as the old row. Confirm Stripe still has its own receipt if a charge was made.
- [ ] **Security audit completed.** Server consent checks, deletion re-auth, admin `requireAdmin` on report review and BLACK grant, intro standing checks, SMS destination limits, and live booking payment checks were reviewed. Remaining risks in the pull request are accepted or fixed.
- [ ] **Business entity and ownership reviewed.** `[LEGAL ENTITY NAME]` owns or licenses the repo, the Vercel project, and interlinkgobal.com (spelled “gobal”). Contractor and AI-assisted development assignments are signed.
- [ ] **Insurance and counsel.** A lawyer has reviewed this launch. Insurance (cyber, general liability, or professional) was considered and either purchased or consciously declined.

## Do not launch while these are still true

- Terms or Privacy still show bracketed placeholders.
- Partner marks are public without written permission and without an explicit decision to accept that risk.
- `ADMIN_SECRET`, Stripe, OAuth, and database URLs are only in the host’s environment, never in `NEXT_PUBLIC_*`.
- Production still has `ENABLE_WALKTHROUGH_OWNER` or demo owner passwords set.
