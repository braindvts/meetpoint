import { createHash, createPublicKey, createVerify } from "crypto";

const APPLE_ISS = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const EXP_LEEWAY_MS = 60_000;
const JWKS_TTL_MS = 60 * 60 * 1000;

export type AppleJwk = {
  kty: string;
  kid?: string;
  alg?: string;
  n?: string;
  e?: string;
  use?: string;
};

export type AppleIdClaims = {
  sub: string;
  email?: string;
};

export type VerifyAppleIdTokenOptions = {
  audience: string;
  nonce: string;
  nowMs?: number;
  jwks?: AppleJwk[];
  fetchJwks?: () => Promise<AppleJwk[]>;
};

let jwksCache: { at: number; keys: AppleJwk[] } | null = null;

export function resetAppleJwksCache(): void {
  jwksCache = null;
}

export class AppleIdTokenError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(`Apple id_token rejected (${code})`);
    this.name = "AppleIdTokenError";
    this.code = code;
  }
}

function decodeJson<T>(part: string): T {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
  } catch {
    throw new AppleIdTokenError("malformed");
  }
}

async function loadAppleJwks(
  options: VerifyAppleIdTokenOptions,
  force = false
): Promise<AppleJwk[]> {
  if (options.jwks) return options.jwks;
  if (!force && jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const fetchJwks =
    options.fetchJwks ||
    (async () => {
      const res = await fetch(APPLE_JWKS_URL, { cache: "no-store" });
      if (!res.ok) throw new AppleIdTokenError("jwks");
      const body = (await res.json()) as { keys?: AppleJwk[] };
      if (!Array.isArray(body.keys) || body.keys.length === 0) {
        throw new AppleIdTokenError("jwks");
      }
      return body.keys;
    });
  const keys = await fetchJwks();
  jwksCache = { at: Date.now(), keys };
  return keys;
}

function verifyRs256(signingInput: string, signature: Buffer, jwk: AppleJwk): boolean {
  if (jwk.kty !== "RSA" || !jwk.n || !jwk.e) return false;
  try {
    const key = createPublicKey({
      key: { kty: "RSA", n: jwk.n, e: jwk.e },
      format: "jwk",
    });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(signingInput);
    verifier.end();
    return verifier.verify(key, signature);
  } catch {
    return false;
  }
}

function nonceMatches(claim: unknown, expected: string): boolean {
  if (typeof claim !== "string" || !expected) return false;
  if (claim === expected) return true;
  const hashed = createHash("sha256").update(expected).digest("hex");
  return claim === hashed;
}

function audienceMatches(aud: unknown, expected: string): boolean {
  if (typeof aud === "string") return aud === expected;
  if (Array.isArray(aud)) return aud.includes(expected);
  return false;
}

/**
 * Verify an Apple identity token the same way a web app must: signature
 * against Apple's JWKs, then iss / aud / exp / nonce.
 */
export async function verifyAppleIdToken(
  idToken: string,
  options: VerifyAppleIdTokenOptions
): Promise<AppleIdClaims> {
  if (!idToken || idToken.split(".").length !== 3) {
    throw new AppleIdTokenError("malformed");
  }
  if (!options.audience || !options.nonce) {
    throw new AppleIdTokenError("config");
  }

  const [headerB64, payloadB64, sigB64] = idToken.split(".");
  const header = decodeJson<{ alg?: string; kid?: string; crit?: unknown }>(headerB64);
  const payload = decodeJson<{
    iss?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    sub?: string;
    email?: string;
    nonce?: string;
  }>(payloadB64);

  if (header.crit) throw new AppleIdTokenError("crit");
  if (header.alg !== "RS256") throw new AppleIdTokenError("alg");
  if (!header.kid) throw new AppleIdTokenError("kid");

  let keys = await loadAppleJwks(options);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk && !options.jwks) {
    keys = await loadAppleJwks(options, true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new AppleIdTokenError("kid");

  let signature: Buffer;
  try {
    signature = Buffer.from(sigB64, "base64url");
  } catch {
    throw new AppleIdTokenError("sig");
  }
  if (!verifyRs256(`${headerB64}.${payloadB64}`, signature, jwk)) {
    throw new AppleIdTokenError("sig");
  }

  const now = options.nowMs ?? Date.now();
  if (payload.iss !== APPLE_ISS) throw new AppleIdTokenError("iss");
  if (!audienceMatches(payload.aud, options.audience)) throw new AppleIdTokenError("aud");
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= now - EXP_LEEWAY_MS) {
    throw new AppleIdTokenError("exp");
  }
  if (typeof payload.nbf === "number" && payload.nbf * 1000 > now + EXP_LEEWAY_MS) {
    throw new AppleIdTokenError("nbf");
  }
  if (!nonceMatches(payload.nonce, options.nonce)) throw new AppleIdTokenError("nonce");
  if (!payload.sub || typeof payload.sub !== "string") throw new AppleIdTokenError("sub");

  const email =
    typeof payload.email === "string" && payload.email.includes("@")
      ? payload.email.trim().toLowerCase()
      : undefined;

  return { sub: payload.sub, email };
}
