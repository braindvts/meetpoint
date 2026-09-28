import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import {
  decideOAuthReauth,
  providerAccountId,
  resolveReauthMember,
  OAUTH_REAUTH_RETURN,
  type OAuthProviderName,
  type OAuthReauthIntent,
} from "@/lib/oauthReauth";
import { appUrl, clearOAuthStateCookie, clearReauthBindCookie, readReauthBindCookie, withReauth } from "@/lib/session";

/**
 * When the OAuth state is a reauth intent, finish here.
 * Returns null for a normal sign-in so the caller can create or resume an account.
 * A reauth result never writes a member, never links a provider, and never
 * replaces the session. The only success cookie is the 10-minute reauth proof.
 */
export async function oauthReauthResponse(input: {
  intent: OAuthReauthIntent | undefined;
  provider: OAuthProviderName;
  providerSubject: string;
  stateNonce: string;
}): Promise<NextResponse | null> {
  if (!input.intent) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const me = await getCurrentMember();
  const resolved = resolveReauthMember({
    sessionMemberId: me?.id ?? null,
    intentMemberId: input.intent.memberId,
    stateNonce: input.stateNonce,
    bind: await readReauthBindCookie(),
    nowSec,
  });

  const deny = (error: "mismatch" | "expired") => {
    const res = NextResponse.redirect(appUrl(`/profile?reauth=${error}#delete`));
    clearOAuthStateCookie(res);
    clearReauthBindCookie(res);
    return res;
  };

  if (!resolved.ok) return deny(resolved.error);

  const bound =
    me && me.id === resolved.memberId
      ? me
      : await prisma.member.findFirst({
          where: { id: resolved.memberId, deletedAt: null },
        });
  const decision = decideOAuthReauth({
    intent: input.intent,
    nowSec,
    sessionMemberId: bound?.id ?? null,
    provider: input.provider,
    providerSubject: input.providerSubject,
    memberProviderId: bound ? providerAccountId(bound, input.provider) : null,
  });

  if (decision.action !== "reauth") {
    return deny(decision.action === "deny" ? decision.error : "mismatch");
  }

  const res = NextResponse.redirect(appUrl(OAUTH_REAUTH_RETURN));
  clearOAuthStateCookie(res);
  clearReauthBindCookie(res);
  return withReauth(res, decision.memberId);
}
