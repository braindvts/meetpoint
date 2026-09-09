import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

/**
 * Verify Google ID token when present (signature + audience + issuer).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!idToken || idToken.length > 8000) throw new Error("Invalid id_token");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) throw new Error("Missing sub");

  return {
    sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
