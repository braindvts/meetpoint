import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

export async function createOAuthState(): Promise<{ state: string; cookieValue: string }> {
  const state = randomBytes(16).toString("hex");
  return { state, cookieValue: signValue(state) };
}

export function applyOAuthStateCookie(res: NextResponse, cookieValue: string): NextResponse {
  res.cookies.set(STATE_COOKIE, cookieValue, cookieOpts(60 * 10));
  return res;
}

export async function consumeOAuthState(state: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  if (!raw) return false;
  const expected = verifyValue(raw);
  jar.delete(STATE_COOKIE);
  return !!expected && expected === state;
}

export function clearOAuthStateCookie(res: NextResponse): NextResponse {
  res.cookies.set(STATE_COOKIE, "", { ...cookieOpts(0), maxAge: 0 });
  return res;
}

/** Issue short-lived re-auth proof after password confirmation. */
export function withReauth(res: NextResponse, memberId: string): NextResponse {
  const iat = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ memberId, iat, exp: iat + REAUTH_TTL_SEC })
  ).toString("base64url");
  res.cookies.set(REAUTH_COOKIE, signValue(payload), cookieOpts(REAUTH_TTL_SEC));
  return res;
}

export async function hasRecentReauth(memberId: string): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(REAUTH_COOKIE)?.value;
  if (!raw) return false;
  const payload = verifyValue(raw);
  if (!payload) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      memberId?: string;
      exp?: number;
    };
    if (data.memberId !== memberId) return false;
    if (!data.exp || Math.floor(Date.now() / 1000) > data.exp) return false;
    return true;
  } catch {
    return false;
  }
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
