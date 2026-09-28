import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_PLACEHOLDER,
  LEGAL_ENTITY_PLACEHOLDER,
  LEGAL_JURISDICTION_PLACEHOLDER,
  LEGAL_SAFETY_CONTACT_PLACEHOLDER,
  PRIVACY_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Interlink",
  description: "Draft privacy policy for Interlink.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument kicker="Privacy Policy" title="Privacy Policy">
      <p>
        Version {PRIVACY_VERSION}. This draft describes what the Interlink website actually
        collects in the current codebase. It is published for {LEGAL_ENTITY_PLACEHOLDER}. It is not
        a completed privacy notice for {LEGAL_JURISDICTION_PLACEHOLDER}. Counsel must confirm it
        before launch.
      </p>

      <section>
        <h2>1. Who we are</h2>
        <p className="mt-2">
          Interlink is a professional introduction product. The legal entity that operates it is{" "}
          {LEGAL_ENTITY_PLACEHOLDER}. Privacy requests go to {LEGAL_CONTACT_PLACEHOLDER}. Safety
          and abuse reports that you cannot file in the product go to{" "}
          {LEGAL_SAFETY_CONTACT_PLACEHOLDER}.
        </p>
      </section>

      <section>
        <h2>2. Information the product collects</h2>
        <p className="mt-2">Account and sign-in</p>
        <ul className="mt-2">
          <li>Name and email address, when you provide them or a sign-in provider returns them.</li>
          <li>
            A password hash (scrypt) if you use email sign-in. The password itself is not stored
            and should not be logged.
          </li>
          <li>
            A hashed, single-use confirmation token and its expiry when you create an email
            account or ask to change that account email. The raw link is not stored. When the link
            matches that account and address, we store the time the account email was confirmed. A
            business email typed on your profile does not confirm the account email.
          </li>
          <li>Provider identifiers if you use LinkedIn, Google, or Apple.</li>
          <li>
            The time you accepted the Terms and Privacy Policy, and the version ids you accepted.
          </li>
        </ul>
        <p className="mt-3">Profile and business information you choose to add</p>
        <ul className="mt-2">
          <li>Job title, company, industry, bio, and profile photo.</li>
          <li>
            Interests you select. Those are stored as rows tied to your account, separate from free-text
            idea tags.
          </li>
          <li>City name, country, and coordinates you select.</li>
          <li>Travel range, meeting preference, what you are looking for, and idea tags.</li>
          <li>Work or project entries you add.</li>
          <li>Phone number, if you add one. It is optional on the profile and used for booking texts.</li>
          <li>
            Verification values you submit: business email, LinkedIn URL or identifier, and optional
            resume, website, registration, and portfolio links. These are self-entered in the
            current product. They are not a background check.
          </li>
          <li>
            Standing flags the product stores, such as whether BLACK is active, when it started,
            and whether the source was paid, earned, or granted. Legacy premier fields may still
            exist on older rows. Premier is not a current plan.
          </li>
        </ul>
        <p className="mt-3">Networking, bookings, and events</p>
        <ul className="mt-2">
          <li>Introduction requests and their status between members.</li>
          <li>Chat membership and message text.</li>
          <li>Blocks you create, and safety reports you file (category, reason, status, notes).</li>
          <li>BLACK invitations and BLACK CONNECTION records between members.</li>
          <li>
            Table booking details in your browser (restaurant, time, phone, payment method label).
            A live card charge, when Stripe is configured, sends Stripe the checkout amount, your
            account email if we have one, and metadata: charge kind, your member id, chat id, and
            meetup time. The phone number is not copied into Stripe metadata.
          </li>
          <li>
            Event RSVPs (interested, going, or passed) are stored on the server, one row per event.
            A copy of notification state, and sometimes an RSVP, may also stay in this browser’s
            local storage.
          </li>
        </ul>
        <p className="mt-3">Device, analytics, and cookies</p>
        <ul className="mt-2">
          <li>
            Page visits. Interlink records a first-party event named pageview with the path you
            opened. The row may include your member id when you are signed in. It does not store
            your email address or an IP address.
          </li>
          <li>
            Partner-link clicks. When you open a partner website from Interlink, a first-party
            event named partner_click records the partner id and which surface the click came
            from: the scrolling partner row (landing), the loading screen (loading), or the
            Edgeable featured card (featured). That row uses the same limits: no email address and
            no IP address.
          </li>
          <li>
            Those events are written to our own database by a same-origin request. The measurement
            does not use an outside analytics package or an advertising pixel. An admin view reads
            the stored rows. The request IP may be used only as a short-lived in-memory rate-limit
            key. That key is not written onto the analytics row.
          </li>
          <li>
            Optional Plausible. If the public setting NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, a
            Plausible script may also receive page measurements under Plausible’s own terms. When
            that setting is empty, the script is not loaded. Plausible is the only third-party
            analytics tool in the codebase, and it is off unless that setting is present. Interlink
            does not load third-party advertising or ad-analytics trackers. The email confirmation
            page is excluded from these measurements, and the confirmation token is removed from the
            address before a page measurement can record it.
          </li>
          <li>
            Cookies. First-party analytics does not set its own cookie. The signed httpOnly cookies
            already used to keep you signed in may be sent with the same-origin analytics request
            so a member id can be attached: a session cookie, a member cookie, a short-lived
            sign-in state cookie, and a short-lived re-auth cookie after you confirm a password.
          </li>
          <li>
            Local storage holds a copy of your profile, introductions, chats, blocks, event RSVPs,
            and notifications so the interface can load. That copy is on your device.
          </li>
        </ul>
        <p className="mt-3">
          We do not ask for government ID, date of birth, or payment card numbers in our own
          database. Do not put those in your bio or chat.
        </p>
      </section>

      <section>
        <h2>3. How information is used</h2>
        <ul className="mt-2">
          <li>To create and secure your account and keep you signed in.</li>
          <li>To show your profile to other signed-in members according to the product rules.</li>
          <li>To deliver introductions, chats, blocks, and reports.</li>
          <li>To take a BLACK subscription or booking payment through Stripe.</li>
          <li>
            To send a welcome email and an account-email confirmation link when Resend is configured,
            and a booking text when Twilio is configured.
          </li>
          <li>To look up restaurants through Google Places when that key is configured.</li>
          <li>
            To count page visits and partner-link clicks, including which surface a partner click
            came from, for an admin view of product use, and to review safety reports.
          </li>
          <li>To delete or anonymize data when you delete your account.</li>
        </ul>
        <p className="mt-2">
          Public member cards are built without your email, phone, or password hash. Admin report
          review is limited to holders of the server admin secret. Another change in progress may
          narrow what that queue shows. This draft should be updated if that queue stops including
          email.
        </p>
      </section>

      <section>
        <h2>4. Third-party services</h2>
        <p className="mt-2">
          Google, Apple, and LinkedIn receive the sign-in you start with them. Stripe receives
          checkout details and may retain them under Stripe’s policy even after we anonymize our
          copy. Resend receives your email and the message (welcome or confirmation link) when mail
          is enabled. Twilio
          receives the destination number and message body when SMS is enabled; members can only
          trigger a text to the phone saved on their own profile unless a separate server notify
          secret is used. Google Places receives the search. Page visits and partner-link clicks
          described above stay in our database and are not sent to an outside analytics vendor for
          that measurement. Plausible, if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, may also receive a
          page measurement; that script is not loaded when the setting is empty. No third-party
          advertising tracker is loaded. Vercel may process requests as the host. We do not sell
          personal information. This draft does not claim a “sale” or “share” opt-out has been
          legally classified; counsel must decide whether any law requires one.
        </p>
      </section>

      <section>
        <h2>5. Retention</h2>
        <p className="mt-2">
          Profile and account data stay until you delete the account or we close it. Chat text
          stays until it is deleted or blanked. Safety reports are kept after account deletion so
          an abuse record is not erased by the person who was reported or who reported. The member
          id can remain, with personal fields cleared, so a payment flag still has a row to point
          at. Analytics events have the member id removed on deletion. Server logs and provider
          logs may exist for a shorter operational period; this draft does not invent a day count.
          Counsel should set one.
        </p>
      </section>

      <section>
        <h2>6. Deletion</h2>
        <p className="mt-2">
          Profile includes a delete-account control. You must type DELETE. You then confirm a
          fresh sign-in: the account password, or the same Google, Apple, or LinkedIn account
          already linked to this member. A stale session is not enough. A different provider
          account does not confirm deletion. We then clear sign-in identifiers, contact details, profile text, company,
          industry, photo, phone, and verification values; delete selected interests and event
          RSVPs; delete introductions and BLACK invitation or connection rows; blank your
          messages; drop you from chats; and clear the member id on analytics events. The
          anonymized row can keep non-identifying payment flags (such as whether BLACK was paid).
          Safety reports and blocks stay, whether you filed them or were named in them, attributed
          to that anonymized id. Your browser copy is cleared after the server finishes. A demo
          that never created a server account can only be cleared from this browser.
        </p>
        <p className="mt-2">
          Stripe, email, and SMS providers may keep their own records. Write to{" "}
          {LEGAL_CONTACT_PLACEHOLDER} if you need help asking them. We cannot promise they will
          delete data they are allowed or required to keep.
        </p>
      </section>

      <section>
        <h2>7. Your privacy requests</h2>
        <p className="mt-2">
          Depending on {LEGAL_JURISDICTION_PLACEHOLDER}, you may have rights to access, correct,
          delete, or export personal information, or to object to certain uses. This draft does not
          claim those rights exist in every place, and it does not claim we have been certified
          under any privacy law. You can correct most profile fields in the product. You can delete
          the account as described above. For anything else, email {LEGAL_CONTACT_PLACEHOLDER}. For
          a safety or abuse issue, email {LEGAL_SAFETY_CONTACT_PLACEHOLDER}. We may need to confirm
          you control the account before we act. We may refuse a request where the law allows us to
          keep a safety or accounting record.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p className="mt-2">
          The product uses signed httpOnly cookies, password hashing, server-side checks on member
          APIs, Zod validation on request bodies, rate limits on sensitive routes, and security
          headers including a content security policy. Admin changes to reports and BLACK grants
          require a server admin secret. These are controls, not a promise that the service cannot
          be breached. No method of transmission or storage is perfectly secure.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p className="mt-2">
          Interlink is a professional network and is not directed at children. Do not create an
          account if you are under the age required to contract where you live. Counsel should set
          that age. We do not knowingly collect information from children.
        </p>
      </section>

      <section>
        <h2>10. European Union and United Kingdom</h2>
        <p className="mt-2">[INCLUDE IF SERVING THIS REGION, pending owner decision]</p>
        <p className="mt-2">
          If Interlink is offered to people in the European Union or the United Kingdom, counsel
          must add the controller’s identity, a lawful basis for each use (including first-party
          page and partner-click measurement), any international transfer terms, how long each
          category is kept, and how to complain to a supervisory authority. This draft does not
          claim those duties have been met, and it does not claim the GDPR or UK GDPR applies.
        </p>
      </section>

      <section>
        <h2>11. California</h2>
        <p className="mt-2">[INCLUDE IF SERVING THIS REGION, pending owner decision]</p>
        <p className="mt-2">
          If Interlink is offered to California residents, counsel must add the categories of
          personal information, the business purpose for each, whether any information is sold or
          shared as the CCPA/CPRA defines those words, and how to submit an access or deletion
          request. This draft does not claim those duties have been met, and it does not claim the
          CCPA or CPRA applies. The product does not load third-party advertising trackers. Optional
          Plausible, described above, is the only third-party analytics script, and only when it is
          configured.
        </p>
      </section>

      <section>
        <h2>12. Changes and contact</h2>
        <p className="mt-2">
          If this policy’s version id changes, signed-in members are asked to acknowledge the new
          version before continuing. Questions: {LEGAL_ENTITY_PLACEHOLDER}, {LEGAL_CONTACT_PLACEHOLDER}.
          Safety and abuse: {LEGAL_SAFETY_CONTACT_PLACEHOLDER}. No postal address is listed because
          the repository does not establish one.
        </p>
      </section>
    </LegalDocument>
  );
}
