import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_PLACEHOLDER,
  LEGAL_SAFETY_CONTACT_PLACEHOLDER,
  LEGAL_ENTITY_PLACEHOLDER,
  LEGAL_JURISDICTION_PLACEHOLDER,
  TERMS_VERSION,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | Interlink",
  description: "Draft terms of service for Interlink.",
};

export default function TermsPage() {
  return (
    <LegalDocument kicker="Terms of Service" title="Terms of Service">
      <p>
        Version {TERMS_VERSION}. These Terms are a draft published by the operator of Interlink
        (“Interlink”, “we”, “us”). The operator’s legal name is {LEGAL_ENTITY_PLACEHOLDER}. The
        governing law and venue are {LEGAL_JURISDICTION_PLACEHOLDER}. Until those placeholders are
        filled in by counsel, this draft does not choose a court, an arbitration forum, or a
        consumer-law regime.
      </p>
      <p>
        Interlink is a website for professional introductions. It is not a law firm, broker,
        employer, or payment guarantee. By creating an account, or by continuing to use a signed-in
        account after we ask you to accept an updated version, you agree to these Terms and
        acknowledge the Privacy Policy. If you do not agree, do not create an account and stop
        using the signed-in product.
      </p>

      <section>
        <h2>1. Accounts</h2>
        <p className="mt-2">
          You can create an account with email and a password, or with Google, Apple, or LinkedIn
          when those sign-in options are configured. You must provide a name. Identity details
          (photo, role, and what you are looking for) are how the product expects you to appear to
          other members. Business email and LinkedIn are optional at signup. Adding both is what
          the product treats as Verified standing. You are responsible for activity under your
          account and for keeping your password and sign-in methods private. One person should not
          create an account for someone else without authority to do so.
        </p>
        <p className="mt-2">
          A local demo entry, when it is switched on, stays in your browser and is not the same as
          a server account. Do not use the demo to impersonate a real person.
        </p>
      </section>

      <section>
        <h2>2. Acceptable use</h2>
        <p className="mt-2">Use Interlink for professional networking and the meetings the product describes. You agree not to:</p>
        <ul className="mt-2">
          <li>Harass, threaten, or abuse another person.</li>
          <li>Send spam or unwanted solicitations.</li>
          <li>Misrepresent who you are, including impersonation and fake profiles.</li>
          <li>Commit fraud, scams, or other deceptive schemes.</li>
          <li>Post illegal, sexually exploitative, or otherwise unlawful content.</li>
          <li>Probe, scrape, or overload the service, or try to access another member’s private data.</li>
          <li>Upload malware or attempt to break authentication, payments, or admin tools.</li>
          <li>Use another member’s email, phone, or messages for a purpose they did not ask for.</li>
        </ul>
      </section>

      <section>
        <h2>3. User-generated content</h2>
        <p className="mt-2">
          You keep ownership of the text, photos, and other material you submit. You grant{" "}
          {LEGAL_ENTITY_PLACEHOLDER} a non-exclusive license to host, display, and transmit that
          material so the service can operate — for example, to show your profile to other members
          and to deliver your chat messages to people in that chat. The license ends when the
          material is deleted from the service, except for copies we keep where this draft says a
          record is retained (safety reports and payment records) and copies that already reached
          other members.
        </p>
        <p className="mt-2">
          We do not undertake to monitor every message. Members can report a profile. Reports use
          categories that include harassment, spam, fraud, impersonation, inappropriate content,
          and suspicious account, along with older labels that may already exist on stored reports.
          Operators review reports with an admin credential that is not available to ordinary
          members. You can also write to {LEGAL_SAFETY_CONTACT_PLACEHOLDER}. We may remove content,
          refuse an introduction, or suspend an account when we
          believe these Terms were broken. That review is a product operation, not a promise that
          harmful content will be found or removed.
        </p>
      </section>

      <section>
        <h2>4. Professional networking</h2>
        <p className="mt-2">
          Introductions depend on the standing rules in the product. Members can introduce other
          Members. Verified members and BLACK members can introduce across standings. Those rules
          are product rules. They are not a background check, a credit check, or a statement that
          someone is trustworthy, licensed, or able to do business with you. You decide whether to
          meet, hire, invest, or contract. Interlink does not become a party to agreements you make
          with other members.
        </p>
      </section>

      <section>
        <h2>5. Restaurant bookings and events</h2>
        <p className="mt-2">
          Table suggestions and a per-person booking fee (currently described in the product as a
          small fixed fee) are tools inside a chat. A restaurant is not operated by Interlink.
          Confirming a table in the product does not, by itself, reserve a specific restaurant’s
          seats unless that restaurant has actually accepted a reservation outside this website.
          Event and convention listings may be informational. RSVP state may be stored on your
          device. Interlink does not promise ticket inventory, venue access, or that an event will
          take place.
        </p>
      </section>

      <section>
        <h2>6. Payments, subscriptions, cancellation, and refunds</h2>
        <p className="mt-2">
          Paid BLACK membership is offered in the product at the prices shown at checkout (the
          current code uses $50 per month or $500 per year). Charges are processed by Stripe. We do
          not store card numbers on Interlink servers. The product does not currently include a
          self-serve subscription cancellation screen or a self-serve refund button. A charge is
          not refundable merely because this draft is silent. Counsel must set the cancellation and
          refund position before launch, including any rights that {LEGAL_JURISDICTION_PLACEHOLDER}{" "}
          requires. Until that position is written and implemented, send billing questions to{" "}
          {LEGAL_CONTACT_PLACEHOLDER}. We will not treat this paragraph as a promise of any
          particular refund.
        </p>
        <p className="mt-2">
          If Stripe is not configured, checkout cannot complete a live charge. A local confirmation
          used in development is not a payment. BLACK standing that is paid must be tied to a
          verified Stripe session when payments are live. BLACK CONNECTION, a separate credential
          from BLACK, is not itself a paid plan.
        </p>
      </section>

      <section>
        <h2>7. Third-party services</h2>
        <p className="mt-2">
          Sign-in may use Google, Apple, or LinkedIn. Payments use Stripe. Email may be sent with
          Resend. Text messages for a booking may be sent with Twilio to the phone number on your
          profile. Restaurant search may use Google Places. Optional audience measurement may use
          Plausible when that integration is configured. Hosting may be on Vercel. Those providers
          have their own terms. We do not control them. A list kept for launch review is in the
          repository file THIRD_PARTY_LICENSES.md.
        </p>
      </section>

      <section>
        <h2>8. Suspension and termination</h2>
        <p className="mt-2">
          You may delete your account from Profile. Deletion asks you to confirm, and password
          accounts must re-enter the password. We anonymize the profile, sign-in identifiers,
          phone, and verification values, remove introductions, blocks, and BLACK network edges,
          and blank your chat messages. Safety reports and the anonymized member id tied to
          payment flags can remain. Stripe may still hold its own transaction record, which we
          cannot erase from this website alone.
        </p>
        <p className="mt-2">
          We may suspend or stop an account that we believe breaks these Terms, creates risk for
          other members, or is required to be restricted by law. Suspension is not a finding of
          guilt.
        </p>
      </section>

      <section>
        <h2>9. Intellectual property</h2>
        <p className="mt-2">
          The Interlink name, interface, and copy are used by the operator. This draft does not
          claim that a trademark is registered, that a logo assignment exists, or that every asset
          in the repository is owned by {LEGAL_ENTITY_PLACEHOLDER}. Partner marks remain the
          property of those businesses and are shown only under the permission status recorded in
          the product config. You may not copy the product’s branding or another member’s content
          except as the service itself allows.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p className="mt-2">
          The service is provided as available. Profiles, introductions, restaurant suggestions,
          event listings, and member statements may be wrong, incomplete, or out of date. We do not
          warrant uninterrupted access, a particular business outcome, or that another member will
          show up, pay, or tell the truth. Nothing on Interlink is investment, legal, medical, or
          employment advice.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p className="mt-2">
          To the extent {LEGAL_JURISDICTION_PLACEHOLDER} allows a limitation, {LEGAL_ENTITY_PLACEHOLDER}{" "}
          and its operators are not liable for indirect, incidental, special, consequential, or
          lost-profit damages, or for the acts of members and venues. Any direct liability, if a
          court finds it, is limited to the amount you paid Interlink for BLACK or booking fees in
          the three months before the claim, or fifty US dollars if you paid nothing — but only if
          that cap is enforceable where you live. Some places do not allow these limits. This draft
          does not try to waive rights that cannot be waived, including rights counsel identifies
          before launch. This section is not a guarantee of protection.
        </p>
      </section>

      <section>
        <h2>12. Disputes</h2>
        <p className="mt-2">
          Contact {LEGAL_CONTACT_PLACEHOLDER} first and describe the dispute. Counsel must choose
          the forum, any informal notice period, and whether arbitration is appropriate. This draft
          deliberately does not name a city, a court, or an arbitration provider. If you have
          statutory rights in your place of residence, this draft does not remove them.
        </p>
      </section>

      <section>
        <h2>13. Changes</h2>
        <p className="mt-2">
          We may update these Terms by publishing a new version on this page and changing the
          version id above. If you already have an account, the product asks you to accept the
          current version before you continue to use signed-in features. The stored acceptance
          includes a timestamp and the version ids. Silence is not acceptance.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p className="mt-2">
          {LEGAL_ENTITY_PLACEHOLDER}
          <br />
          {LEGAL_CONTACT_PLACEHOLDER}
          <br />
          Safety and abuse: {LEGAL_SAFETY_CONTACT_PLACEHOLDER}
          <br />
          {LEGAL_JURISDICTION_PLACEHOLDER}
        </p>
        <p className="mt-2">
          No street address is stated here because the repository does not establish one.
        </p>
      </section>
    </LegalDocument>
  );
}
