import type { Metadata } from "next";
import LegalDocument from "@/components/LegalDocument";
import {
  LEGAL_CONTACT_PLACEHOLDER,
  LEGAL_ENTITY_PLACEHOLDER,
  LEGAL_JURISDICTION_PLACEHOLDER,
  LEGAL_SAFETY_CONTACT_PLACEHOLDER,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact | Interlink",
  description: "How to contact Interlink.",
};

export default function ContactPage() {
  return (
    <LegalDocument kicker="Contact" title="Contact">
      <p>
        Interlink does not yet publish a confirmed legal entity, mailing address, or support
        inbox in this repository. Use the placeholders below until counsel fills them in. Do not
        send passwords, payment card numbers, or copies of identity documents.
      </p>
      <p>
        Operator: {LEGAL_ENTITY_PLACEHOLDER}
        <br />
        Email: {LEGAL_CONTACT_PLACEHOLDER}
        <br />
        Safety and abuse: {LEGAL_SAFETY_CONTACT_PLACEHOLDER}
        <br />
        Jurisdiction: {LEGAL_JURISDICTION_PLACEHOLDER}
      </p>
      <p>
        For a safety issue with a member, use Report on their profile while you are signed in.
        For account deletion, use Delete account on your Profile page. Billing questions about a
        Stripe charge should include the date and the email on the account, not the card number.
      </p>
    </LegalDocument>
  );
}
