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
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!idToken || idToken.length > 8000) throw new Error("Invalid id_token");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  const profile = googleProfileFromClaims(payload);
  if (!profile.sub) throw new Error("Missing sub");
  return profile;
}
