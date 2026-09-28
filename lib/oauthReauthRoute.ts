import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import {
  decideOAuthReauth,
  oauthReauthSessionGate,
  OAUTH_REAUTH_RETURN,
  type OAuthProviderName,
  type OAuthReauthIntent,
} from "@/lib/oauthReauth";
import { appUrl, clearOAuthStateCookie, withReauth } from "@/lib/session";

function providerId(
  member: { googleId: string | null; appleId: string | null; linkedInId: string | null },
  provider: OAuthProviderName
): string | null {
  if (provider === "google") return member.googleId;
  if (provider === "apple") return member.appleId;
  return member.linkedInId;
}

/**
 * When the OAuth state is a reauth intent, finish here.
 * Returns null for a normal sign-in so the caller can create or resume an account.
 * A reauth result never writes a member and never replaces the session.
 */
export async function oauthReauthResponse(input: {
  intent: OAuthReauthIntent | undefined;
  provider: OAuthProviderName;
  providerSubject: string;
}): Promise<NextResponse | null> {
  if (!input.intent) return null;

  const me = await getCurrentMember();
  const gate = oauthReauthSessionGate(me?.id ?? null, input.intent.memberId);
  if (gate === "switch") {
    const denied = NextResponse.redirect(appUrl("/profile?reauth=mismatch#delete"));
    clearOAuthStateCookie(denied);
    return denied;
  }
  const bound =
    gate === "match" && me
      ? me
      : await prisma.member.findFirst({
          where: { id: input.intent.memberId, deletedAt: null },
        });
  const decision = decideOAuthReauth({
    intent: input.intent,
    nowSec: Math.floor(Date.now() / 1000),
    sessionMemberId: bound?.id ?? null,
    provider: input.provider,
    providerSubject: input.providerSubject,
    memberProviderId: bound ? providerId(bound, input.provider) : null,
  });

  const dest =
    decision.action === "reauth"
      ? OAUTH_REAUTH_RETURN
      : `/profile?reauth=${decision.action === "deny" ? decision.error : "mismatch"}#delete`;
  const res = NextResponse.redirect(appUrl(dest));
  clearOAuthStateCookie(res);
  if (decision.action !== "reauth") return res;
  return withReauth(res, decision.memberId);
}
