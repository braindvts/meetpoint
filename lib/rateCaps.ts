/**
 * Per-IP windows are sized for a shared venue network.
 * Account-scoped caps stay tight and are the real brake.
 */
const HOUR = 60 * 60_000;
const FIFTEEN_MIN = 15 * 60_000;

export const AUTH_EMAIL_IP = { name: "auth-email", limit: 200, windowMs: FIFTEEN_MIN } as const;
export const AUTH_SIGNUP_IP = { name: "auth-signup", limit: 100, windowMs: HOUR } as const;
export const AUTH_SIGNUP_ACCOUNT = {
  name: "auth-signup-acct",
  limit: 3,
  windowMs: HOUR,
  scope: "account" as const,
};
export const REPORT_IP = { name: "report", limit: 120, windowMs: HOUR } as const;
export const REPORT_ACCOUNT = {
  name: "report-acct",
  limit: 5,
  windowMs: HOUR,
  scope: "account" as const,
};
export const CONNECTIONS_POST_IP = { name: "connections-post", limit: 300, windowMs: HOUR } as const;
export const VERIFY_IP = { name: "verify", limit: 80, windowMs: HOUR } as const;
export const OAUTH_IP = { name: "auth-oauth", limit: 200, windowMs: HOUR } as const;
export const OAUTH_CALLBACK_IP = { name: "auth-oauth-cb", limit: 200, windowMs: HOUR } as const;
export const REAUTH_IP = { name: "reauth", limit: 80, windowMs: FIFTEEN_MIN } as const;
