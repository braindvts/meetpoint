import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/**
 * Verify Apple identity token (signature + audience + issuer).
 * Never trust an unsigned JWT payload alone.
 */
export async function verifyAppleIdToken(idToken: string): Promise<{
  sub: string;
  email?: string;
}> {
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("APPLE_CLIENT_ID missing");
  if (!idToken || idToken.length > 4000) throw new Error("Invalid id_token");

  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: clientId,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) throw new Error("Missing sub");

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
  return { sub, email };
}
