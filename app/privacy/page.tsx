import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_PLACEHOLDER,
  LEGAL_ENTITY_PLACEHOLDER,
  LEGAL_JURISDICTION_PLACEHOLDER,
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
          {LEGAL_ENTITY_PLACEHOLDER}. Privacy requests go to {LEGAL_CONTACT_PLACEHOLDER}.
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
          <li>Provider identifiers if you use LinkedIn, Google, or Apple.</li>
          <li>
            The time you accepted the Terms and Privacy Policy, and the version ids you accepted.
          </li>
        </ul>
        <p className="mt-3">Profile and business information you choose to add</p>
        <ul className="mt-2">
          <li>Job title, bio, and profile photo.</li>
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
            Event RSVPs and notification state may stay in this browser’s local storage rather than
            on the server.
          </li>
        </ul>
        <p className="mt-3">Device, analytics, and cookies</p>
        <ul className="mt-2">
          <li>
            First-party analytics events: an event name, path, optional member id, and a small
            metadata object. The ingest does not ask for your email.
          </li>
          <li>
            If Plausible is configured with a public domain setting, the Plausible script may
            receive page measurements under Plausible’s own terms. It is optional and off when that
            setting is empty.
          </li>
          <li>
            Cookies: a signed session cookie, a signed member cookie, a short-lived sign-in state
            cookie, and a short-lived re-auth cookie after you confirm a password. They are httpOnly.
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
          <li>To send a welcome email when Resend is configured, and a booking text when Twilio is configured.</li>
          <li>To look up restaurants through Google Places when that key is configured.</li>
          <li>To measure basic product use and to review safety reports.</li>
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
          copy. Resend receives your email and the welcome message when mail is enabled. Twilio
          receives the destination number and message body when SMS is enabled; members can only
          trigger a text to the phone saved on their own profile unless a separate server notify
          secret is used. Google Places receives the search. Plausible, if enabled, receives a page
          view. Vercel may process requests as the host. We do not sell personal information. This
          draft does not claim a “sale” or “share” opt-out has been legally classified; counsel
          must decide whether any law requires one.
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
          Profile includes a delete-account control. You must type DELETE. If the account has a
          password, you must enter it again first. We then clear sign-in identifiers, contact
          details, profile text, photo, phone, and verification values; delete introductions,
          blocks, and BLACK invitation or connection rows; blank your messages; drop you from
          chats; and clear the member id on analytics events. The anonymized row can keep
          non-identifying payment flags (such as whether BLACK was paid). Reports stay, attributed
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
          the account as described above. For anything else, email {LEGAL_CONTACT_PLACEHOLDER}. We
          may need to confirm you control the account before we act. We may refuse a request where
          the law allows us to keep a safety or accounting record.
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
        <h2>10. Changes and contact</h2>
        <p className="mt-2">
          If this policy’s version id changes, signed-in members are asked to acknowledge the new
          version before continuing. Questions: {LEGAL_ENTITY_PLACEHOLDER}, {LEGAL_CONTACT_PLACEHOLDER}.
          No postal address is listed because the repository does not establish one.
        </p>
      </section>
    </LegalDocument>
  );
}
