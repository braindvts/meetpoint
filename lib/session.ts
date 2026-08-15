import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface AuthSession {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  provider: "linkedin";
}

const COOKIE = "meetpoint_session";
const STATE_COOKIE = "meetpoint_oauth_state";

function secret(): string {
  return process.env.AUTH_SECRET || process.env.LINKEDIN_CLIENT_SECRET || "meetpoint-dev-secret";
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

export function encodeSession(session: AuthSession): string {
  return signValue(Buffer.from(JSON.stringify(session)).toString("base64url"));
}

export function decodeSession(token: string): AuthSession | null {
  const payload = verifyValue(token);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
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
  jar.set(COOKIE, encodeSession(session), cookieOpts(60 * 60 * 24 * 30));
}

/** Attach session cookie onto a redirect response (reliable in Route Handlers). */
export function withSession(res: NextResponse, session: AuthSession): NextResponse {
  res.cookies.set(COOKIE, encodeSession(session), cookieOpts(60 * 60 * 24 * 30));
  return res;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
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
  return !!expected && expected === state;
}

export function clearOAuthStateCookie(res: NextResponse): NextResponse {
  res.cookies.set(STATE_COOKIE, "", { ...cookieOpts(0), maxAge: 0 });
  return res;
}

export function appUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

export function linkedInConfigured(): boolean {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  const secret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  return !!(id && secret);
}
