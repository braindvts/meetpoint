/**
 * Step-up for accounts that sign in with Google, Apple, or LinkedIn.
 * The OAuth state is signed, expires quickly, and carries a one-time nonce
 * bound to the member who started it. The callback may only set the same
 * 10-minute reauth cookie when the provider id matches that member.
 */

export const OAUTH_REAUTH_TTL_SEC = 60 * 10;
export const OAUTH_REAUTH_RETURN = "/profile#delete";

export type OAuthProviderName = "google" | "apple" | "linkedin";

export type OAuthReauthIntent = {
  purpose: "reauth";
  memberId: string;
  provider: OAuthProviderName;
  exp: number;
};

export type OAuthStatePayload = {
  state: string;
  nonce: string;
  exp: number;
  next?: string;
  reauth?: OAuthReauthIntent;
};

const usedNonces = new Map<string, number>();

export function resetOAuthNoncesForTests(): void {
  usedNonces.clear();
}

function pruneNonces(nowSec: number) {
  for (const [nonce, exp] of usedNonces) {
    if (exp <= nowSec) usedNonces.delete(nonce);
  }
}

/** True the first time this nonce is seen before it expires. */
export function claimOAuthNonce(nonce: string, exp: number, nowSec: number): boolean {
  pruneNonces(nowSec);
  if (!nonce || nowSec > exp) return false;
  if (usedNonces.has(nonce)) return false;
  usedNonces.set(nonce, exp);
  return true;
}

export function evaluateOAuthState(input: {
  payload: OAuthStatePayload | null;
  presentedState: string;
  nowSec: number;
}):
  | { ok: true; payload: OAuthStatePayload }
  | { ok: false; error: "missing" | "mismatch" | "expired" | "replay" } {
  const payload = input.payload;
  if (!payload?.state || !payload.nonce || !payload.exp) return { ok: false, error: "missing" };
  if (payload.state !== input.presentedState) return { ok: false, error: "mismatch" };
  if (input.nowSec > payload.exp) return { ok: false, error: "expired" };
  if (payload.reauth && input.nowSec > payload.reauth.exp) return { ok: false, error: "expired" };
  if (!claimOAuthNonce(payload.nonce, payload.exp, input.nowSec)) {
    return { ok: false, error: "replay" };
  }
  return { ok: true, payload };
}

export type OAuthReauthDecision =
  | { action: "login" }
  | { action: "reauth"; memberId: string }
  | { action: "deny"; error: "expired" | "mismatch" };

/**
 * No intent: continue the normal sign-in.
 * A reauth intent never creates or switches accounts. The provider subject
 * must already be stored on the same signed-in member.
 */
/**
 * Absent session: the signed intent still names who started reauth (Apple’s
 * form POST does not send the Lax session cookie). A different signed-in
 * member is a switch and must not get the cookie.
 */
export function oauthReauthSessionGate(
  sessionMemberId: string | null,
  intentMemberId: string
): "match" | "absent" | "switch" {
  if (!sessionMemberId) return "absent";
  if (sessionMemberId === intentMemberId) return "match";
  return "switch";
}

export function decideOAuthReauth(input: {
  intent: OAuthReauthIntent | undefined;
  nowSec: number;
  sessionMemberId: string | null;
  provider: OAuthProviderName;
  providerSubject: string;
  memberProviderId: string | null;
}): OAuthReauthDecision {
  const intent = input.intent;
  if (!intent) return { action: "login" };
  if (intent.purpose !== "reauth") return { action: "deny", error: "mismatch" };
  if (intent.provider !== input.provider) return { action: "deny", error: "mismatch" };
  if (!intent.memberId || !intent.exp || input.nowSec > intent.exp) {
    return { action: "deny", error: "expired" };
  }
  if (!input.sessionMemberId || input.sessionMemberId !== intent.memberId) {
    return { action: "deny", error: "mismatch" };
  }
  if (!input.providerSubject || input.providerSubject !== input.memberProviderId) {
    return { action: "deny", error: "mismatch" };
  }
  return { action: "reauth", memberId: intent.memberId };
}
