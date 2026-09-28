import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export type GoogleProfile = {
  sub: string;
  /** Present only when Google says the address is verified. */
  email?: string;
  name?: string;
  picture?: string;
};

/**
 * Take an email off a Google claim only when Google has verified it.
 * An unverified address must not be used to attach this Google account
 * to an existing member.
 */
export function googleProfileFromClaims(payload: {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
}): GoogleProfile {
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const emailVerified = payload.email_verified === true;
  const email =
    emailVerified && typeof payload.email === "string"
      ? payload.email.toLowerCase()
      : undefined;
  return {
    sub,
    email,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

/**
 * Verify Google ID token when present (signature + audience + issuer).
 * Normal sign-in uses this and does not require nonce or auth_time.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const payload = await verifyGoogleJwt(idToken);
  const profile = googleProfileFromClaims(payload);
  if (!profile.sub) throw new Error("Missing sub");
  return profile;
}

/** Reauth must be a sign-in from the last few minutes, plus a little clock skew. */
export const GOOGLE_REAUTH_MAX_AGE_SEC = 5 * 60;
export const GOOGLE_REAUTH_SKEW_SEC = 60;

export class GoogleReauthError extends Error {
  readonly code: "mismatch" | "expired";
  constructor(code: "mismatch" | "expired") {
    super(`Google reauth rejected (${code})`);
    this.name = "GoogleReauthError";
    this.code = code;
  }
}

/**
 * Freshness checks for a Google reauth id_token, after signature, audience,
 * and issuer have already been verified. Missing token, bad nonce, missing
 * or stale auth_time, and a bad exp are rejected.
 */
export function googleReauthClaimsDecision(input: {
  idTokenPresent: boolean;
  exp?: unknown;
  nonce?: unknown;
  authTime?: unknown;
  expectedNonce: string;
  nowSec: number;
}): { ok: true } | { ok: false; error: "mismatch" | "expired" } {
  if (!input.idTokenPresent) return { ok: false, error: "mismatch" };
  if (typeof input.exp !== "number" || !Number.isFinite(input.exp)) {
    return { ok: false, error: "expired" };
  }
  if (input.nowSec > input.exp + GOOGLE_REAUTH_SKEW_SEC) {
    return { ok: false, error: "expired" };
  }
  if (typeof input.nonce !== "string" || !input.expectedNonce || input.nonce !== input.expectedNonce) {
    return { ok: false, error: "mismatch" };
  }
  if (typeof input.authTime !== "number" || !Number.isFinite(input.authTime)) {
    return { ok: false, error: "expired" };
  }
  if (input.authTime > input.nowSec + GOOGLE_REAUTH_SKEW_SEC) {
    return { ok: false, error: "mismatch" };
  }
  const age = input.nowSec - input.authTime;
  if (age > GOOGLE_REAUTH_MAX_AGE_SEC + GOOGLE_REAUTH_SKEW_SEC) {
    return { ok: false, error: "expired" };
  }
  return { ok: true };
}

/**
 * Reauth variant: signature, audience, and issuer, then exp, nonce, and auth_time.
 */
export async function verifyGoogleReauthIdToken(
  idToken: string,
  options: { nonce: string; nowSec?: number }
): Promise<GoogleProfile> {
  let payload: { sub?: unknown; exp?: unknown; nonce?: unknown; auth_time?: unknown };
  try {
    payload = await verifyGoogleJwt(idToken, GOOGLE_REAUTH_SKEW_SEC);
  } catch (err) {
    if (err instanceof GoogleReauthError) throw err;
    throw new GoogleReauthError("mismatch");
  }
  const nowSec = options.nowSec ?? Math.floor(Date.now() / 1000);
  const decision = googleReauthClaimsDecision({
    idTokenPresent: true,
    exp: payload.exp,
    nonce: payload.nonce,
    authTime: payload.auth_time,
    expectedNonce: options.nonce,
    nowSec,
  });
  if (!decision.ok) throw new GoogleReauthError(decision.error);
  const profile = googleProfileFromClaims(payload);
  if (!profile.sub) throw new GoogleReauthError("mismatch");
  return profile;
}

async function verifyGoogleJwt(idToken: string, clockTolerance?: number) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!idToken || idToken.length > 8000) throw new Error("Invalid id_token");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
    ...(clockTolerance !== undefined ? { clockTolerance } : {}),
  });
  return payload;
}
