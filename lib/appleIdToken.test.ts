import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import {
  AppleIdTokenError,
  verifyAppleIdToken,
  type AppleJwk,
} from "./appleIdToken.ts";

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signRs256(
  privateKey: string,
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): string {
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
}

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "jwk" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const jwk = publicKey as AppleJwk;
jwk.kid = "test-kid";
jwk.alg = "RS256";
jwk.use = "sig";
const jwks = [jwk];

const nowSec = Math.floor(Date.now() / 1000);
const validClaims = {
  iss: "https://appleid.apple.com",
  aud: "com.conclave.web",
  exp: nowSec + 600,
  sub: "apple-sub-1",
  email: "member@example.com",
  nonce: "nonce-abc",
};

function validToken(overrides: Record<string, unknown> = {}, header: Record<string, unknown> = {}) {
  return signRs256(privateKey, { alg: "RS256", kid: "test-kid", ...header }, { ...validClaims, ...overrides });
}

const opts = {
  audience: "com.conclave.web",
  nonce: "nonce-abc",
  jwks,
};

test("accepts a signature-valid Apple id_token", async () => {
  const claims = await verifyAppleIdToken(validToken(), opts);
  assert.equal(claims.sub, "apple-sub-1");
  assert.equal(claims.email, "member@example.com");
});

test("accepts Apple's SHA-256 hex nonce form", async () => {
  const { createHash } = await import("node:crypto");
  const hashed = createHash("sha256").update("nonce-abc").digest("hex");
  const claims = await verifyAppleIdToken(validToken({ nonce: hashed }), opts);
  assert.equal(claims.sub, "apple-sub-1");
});

test("rejects alg none", async () => {
  const unsigned = `${b64urlJson({ alg: "none", kid: "test-kid" })}.${b64urlJson(validClaims)}.`;
  await assert.rejects(() => verifyAppleIdToken(unsigned, opts), (err: unknown) => {
    assert.ok(err instanceof AppleIdTokenError);
    assert.equal(err.code, "alg");
    return true;
  });
});

test("rejects a token that was not signed by the JWK", async () => {
  const other = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const forged = signRs256(other.privateKey, { alg: "RS256", kid: "test-kid" }, validClaims);
  await assert.rejects(() => verifyAppleIdToken(forged, opts), (err: unknown) => {
    assert.ok(err instanceof AppleIdTokenError);
    assert.equal(err.code, "sig");
    return true;
  });
});

test("rejects wrong issuer, audience, expiry, and nonce", async () => {
  await assert.rejects(
    () => verifyAppleIdToken(validToken({ iss: "https://evil.example" }), opts),
    (err: unknown) => err instanceof AppleIdTokenError && err.code === "iss"
  );
  await assert.rejects(
    () => verifyAppleIdToken(validToken({ aud: "other.client" }), opts),
    (err: unknown) => err instanceof AppleIdTokenError && err.code === "aud"
  );
  await assert.rejects(
    () => verifyAppleIdToken(validToken({ exp: nowSec - 120 }), opts),
    (err: unknown) => err instanceof AppleIdTokenError && err.code === "exp"
  );
  await assert.rejects(
    () => verifyAppleIdToken(validToken({ nonce: "different" }), opts),
    (err: unknown) => err instanceof AppleIdTokenError && err.code === "nonce"
  );
});

test("ignores a client-shaped token without using unverified claims", async () => {
  const payloadOnly = [
    Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-kid" })).toString("base64url"),
    Buffer.from(
      JSON.stringify({
        iss: "https://appleid.apple.com",
        aud: "com.conclave.web",
        exp: nowSec + 600,
        sub: "forged-sub",
        email: "taken@example.com",
        nonce: "nonce-abc",
      })
    ).toString("base64url"),
    Buffer.from("not-a-signature").toString("base64url"),
  ].join(".");
  await assert.rejects(() => verifyAppleIdToken(payloadOnly, opts), (err: unknown) => {
    assert.ok(err instanceof AppleIdTokenError);
    assert.equal(err.code, "sig");
    return true;
  });
});
