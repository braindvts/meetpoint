export const ACCOUNT_DELETE_PHRASE = "DELETE";

export type DeletionDecision =
  | { ok: true }
  | { ok: false; status: 400 | 401; error: string; needsReauth?: boolean };

/**
 * Password accounts must re-enter the password (recent re-auth cookie).
 * Accounts without a password confirm by typing DELETE while signed in.
 */
export function accountDeletionDecision(input: {
  confirm: string;
  hasPassword: boolean;
  recentReauth: boolean;
}): DeletionDecision {
  if (input.confirm !== ACCOUNT_DELETE_PHRASE) {
    return {
      ok: false,
      status: 400,
      error: `Type ${ACCOUNT_DELETE_PHRASE} to confirm account deletion.`,
    };
  }
  if (input.hasPassword && !input.recentReauth) {
    return {
      ok: false,
      status: 401,
      needsReauth: true,
      error: "Confirm your password before deleting this account.",
    };
  }
  return { ok: true };
}

/**
 * Personal fields cleared on the member row. The id stays so payment flags
 * and safety reports can still point at an anonymized record.
 */
export function anonymizedMemberData(now = new Date()) {
  return {
    name: "Deleted member",
    email: null as string | null,
    passwordHash: null as string | null,
    linkedInId: null as string | null,
    googleId: null as string | null,
    appleId: null as string | null,
    phone: null as string | null,
    jobTitle: "",
    bio: "",
    photo: "",
    cityName: "",
    cityCountry: "",
    cityLat: 0,
    cityLng: 0,
    travel: "worldwide",
    meetPreference: "open",
    lookingForJson: "[]",
    ideaTagsJson: "[]",
    verificationsJson: "[]",
    workJson: "[]",
    company: "",
    industry: "",
    emailVerifiedAt: null as string | null,
    deletedAt: now,
  };
}
