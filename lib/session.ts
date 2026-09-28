import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeAppPath } from "./appPath";
import { claimOAuthNonceStored } from "./oauthNonceStore";
import {
  evaluateOAuthState,
  type OAuthReauthBind,
  type OAuthReauthIntent,
  type OAuthStatePayload,
} from "./oauthReauth";

export type AuthProvider = "linkedin" | "google" | "apple" | "email";

export interface AuthSession {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: AuthProvider;
  /** Issued-at unix seconds */
  iat?: number;
  /** Expiry unix seconds */
  exp?: number;
}

const COOKIE = "meetpoint_session";
const STATE_COOKIE = "meetpoint_oauth_state";
const REAUTH_COOKIE = "conclave_reauth";
const REAUTH_BIND_COOKIE = "meetpoint_reauth_bind";

/** Session lifetime — short-term credentials (7 days). */
export const SESSION_TTL_SEC = 60 * 60 * 24 * 7;
/** Re-auth window for sensitive actions (10 minutes). */
export const REAUTH_TTL_SEC = 60 * 10;

function secret(): string {
  const s = process.env.AUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return process.env.LINKEDIN_CLIENT_SECRET?.trim() || "meetpoint-dev-secret";
}

export function signValue(payload: string): string {
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyValue(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}

function withExpiry(session: AuthSession, ttlSec: number): AuthSession {
  const iat = Math.floor(Date.now() / 1000);
  return { ...session, iat, exp: iat + ttlSec };
}

export function encodeSession(session: AuthSession): string {
  const full = withExpiry(session, SESSION_TTL_SEC);
  return signValue(Buffer.from(JSON.stringify(full)).toString("base64url"));
}

export function decodeSession(token: string): AuthSession | null {
  const payload = verifyValue(token);
  if (!payload) return null;
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AuthSession;
    if (session.exp && Math.floor(Date.now() / 1000) > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Apple’s callback is a cross-site form POST, which does not include Lax cookies.
 * The OAuth state and the reauth bind cookie use SameSite=None in production
 * so that POST can present them. The session cookie stays Lax.
 */
export function oauthStateCookieOptions(maxAge: number) {
  const crossSite = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    secure: crossSite,
    path: "/",
    maxAge,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function setSession(session: AuthSession): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(session), cookieOpts(SESSION_TTL_SEC));
}

export function withSession(res: NextResponse, session: AuthSession): NextResponse {
  res.cookies.set(COOKIE, encodeSession(session), cookieOpts(SESSION_TTL_SEC));
  return res;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(REAUTH_COOKIE);
}

export type OAuthChallenge = OAuthStatePayload;

export async function createOAuthState(
  nextPath?: string | null,
  reauth?: { memberId: string; provider: OAuthReauthIntent["provider"] }
): Promise<OAuthChallenge & { cookieValue: string }> {
  const state = randomBytes(16).toString("hex");
  const nonce = randomBytes(16).toString("hex");
  const next = safeAppPath(nextPath) || undefined;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + REAUTH_TTL_SEC;
  const payload: OAuthStatePayload = {
    state,
    nonce,
    exp,
    ...(next ? { next } : {}),
    ...(reauth
      ? {
          reauth: {
            purpose: "reauth" as const,
            memberId: reauth.memberId,
            provider: reauth.provider,
            exp,
          },
        }
      : {}),
  };
  return {
    ...payload,
    cookieValue: signValue(JSON.stringify(payload)),
  };
}

export function applyOAuthStateCookie(res: NextResponse, cookieValue: string): NextResponse {
  res.cookies.set(STATE_COOKIE, cookieValue, oauthStateCookieOptions(60 * 10));
  return res;
}

export function buildReauthBindToken(
  bind: OAuthReauthBind,
  nowSec = Math.floor(Date.now() / 1000)
): string {
  const payload = Buffer.from(
    JSON.stringify({ purpose: "reauth-bind", ...bind, iat: nowSec })
  ).toString("base64url");
  return signValue(payload);
}

export function readReauthBindToken(
  token: string,
  nowSec = Math.floor(Date.now() / 1000)
): OAuthReauthBind | null {
  const payload = verifyValue(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      purpose?: string;
      memberId?: string;
      nonce?: string;
      exp?: number;
    };
    if (data.purpose !== "reauth-bind") return null;
    if (!data.memberId || !data.nonce || typeof data.exp !== "number") return null;
    if (nowSec > data.exp) return null;
    return { memberId: data.memberId, nonce: data.nonce, exp: data.exp };
  } catch {
    return null;
  }
}

/** Bind the deletion flow to the member who is signed in when it starts. */
export function applyReauthBindCookie(
  res: NextResponse,
  memberId: string,
  nonce: string
): NextResponse {
  const nowSec = Math.floor(Date.now() / 1000);
  const token = buildReauthBindToken({ memberId, nonce, exp: nowSec + REAUTH_TTL_SEC }, nowSec);
  res.cookies.set(REAUTH_BIND_COOKIE, token, oauthStateCookieOptions(REAUTH_TTL_SEC));
  return res;
}

export async function readReauthBindCookie(): Promise<OAuthReauthBind | null> {
  const jar = await cookies();
  const raw = jar.get(REAUTH_BIND_COOKIE)?.value;
  if (!raw) return null;
  return readReauthBindToken(raw);
}

export function clearReauthBindCookie(res: NextResponse): NextResponse {
  res.cookies.set(REAUTH_BIND_COOKIE, "", { ...oauthStateCookieOptions(0), maxAge: 0 });
  return res;
}

function parseOAuthChallenge(payload: string): OAuthStatePayload | null {
  try {
    const parsed = JSON.parse(payload) as Partial<OAuthStatePayload> & {
      reauth?: Partial<OAuthReauthIntent>;
    };
    if (typeof parsed.state !== "string" || !parsed.state) return null;
    if (typeof parsed.nonce !== "string" || !parsed.nonce) return null;
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) return null;
    const next = safeAppPath(typeof parsed.next === "string" ? parsed.next : null) || undefined;
    let reauth: OAuthReauthIntent | undefined;
    if (parsed.reauth != null) {
      const intent = parsed.reauth;
      const provider = intent.provider;
      if (
        intent.purpose !== "reauth" ||
        (provider !== "google" && provider !== "apple" && provider !== "linkedin") ||
        typeof intent.memberId !== "string" ||
        !intent.memberId ||
        intent.memberId.length > 80 ||
        typeof intent.exp !== "number"
      ) {
        return null;
      }
      reauth = { purpose: "reauth", memberId: intent.memberId, provider, exp: intent.exp };
    }
    return { state: parsed.state, nonce: parsed.nonce, exp: parsed.exp, next, reauth };
  } catch {
    return null;
  }
}

/** Read and drop the one-time OAuth state cookie. Rejects a replay or an expired signature. */
export async function consumeOAuthChallenge(presentedState: string): Promise<OAuthChallenge | null> {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  if (!raw) return null;
  jar.delete(STATE_COOKIE);
  const payload = verifyValue(raw);
  if (!payload) return null;
  const parsed = parseOAuthChallenge(payload);
  const decision = evaluateOAuthState({
    payload: parsed,
    presentedState,
    nowSec: Math.floor(Date.now() / 1000),
  });
  if (!decision.ok) return null;
  const stored = await claimOAuthNonceStored(decision.payload.nonce, decision.payload.exp);
  if (!stored) return null;
  return decision.payload;
}

export async function consumeOAuthState(state: string): Promise<boolean> {
  const challenge = await consumeOAuthChallenge(state);
  return !!challenge;
}

export function clearOAuthStateCookie(res: NextResponse): NextResponse {
  res.cookies.set(STATE_COOKIE, "", { ...oauthStateCookieOptions(0), maxAge: 0 });
  return res;
}

/** Signed 10-minute proof. The cookie helpers store this value. */
export function buildReauthToken(memberId: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const payload = Buffer.from(
    JSON.stringify({ memberId, iat: nowSec, exp: nowSec + REAUTH_TTL_SEC })
  ).toString("base64url");
  return signValue(payload);
}

export function readReauthToken(
  token: string,
  memberId: string,
  nowSec = Math.floor(Date.now() / 1000)
): boolean {
  const payload = verifyValue(token);
  if (!payload) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      memberId?: string;
      exp?: number;
    };
    if (data.memberId !== memberId) return false;
    if (!data.exp || nowSec > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/** Issue short-lived re-auth proof after a password or matching OAuth re-login. */
export function withReauth(res: NextResponse, memberId: string): NextResponse {
  res.cookies.set(REAUTH_COOKIE, buildReauthToken(memberId), cookieOpts(REAUTH_TTL_SEC));
  return res;
}

export async function hasRecentReauth(memberId: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(REAUTH_COOKIE)?.value;
  if (!raw) return false;
  return readReauthToken(raw, memberId);
}

export function appUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

export function linkedInConfigured(): boolean {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  const sec = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  return !!(id && sec);
}

export function googleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function appleConfigured(): boolean {
  return !!(
    process.env.APPLE_CLIENT_ID?.trim() && process.env.APPLE_CLIENT_SECRET?.trim()
  );
}
