import { NextRequest, NextResponse } from "next/server";
import { verifyAppleIdToken } from "@/lib/appleAuth";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { withMemberCookie } from "@/lib/memberAuth";
import { purgeDemoResidue } from "@/lib/purgeDemo";
import { sanitizeName } from "@/lib/sanitize";
import {
  appUrl,
  clearOAuthStateCookie,
  consumeOAuthState,
  withSession,
} from "@/lib/session";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const code = String(form.get("code") || "");
  const state = String(form.get("state") || "");
  const idToken = String(form.get("id_token") || "");
  const userRaw = String(form.get("user") || "");

  if (!code || !state || !idToken) {
    return NextResponse.redirect(appUrl("/login?error=missing_code"));
  }
  const ok = await consumeOAuthState(state);
  if (!ok) return NextResponse.redirect(appUrl("/login?error=invalid_state"));

  try {
    await purgeDemoResidue();
    const claims = await verifyAppleIdToken(idToken);
    const sub = claims.sub;

    let name = "Member";
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw) as { name?: { firstName?: string; lastName?: string } };
        name =
          sanitizeName(
            [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ") || name
          ) || name;
      } catch {
        /* ignore */
      }
    }

    const email = claims.email || null;
    let member = await prisma.member.findFirst({ where: { appleId: sub } });
    if (!member && email) {
      member = await prisma.member.findFirst({ where: { email } });
    }
    if (member) {
      member = await prisma.member.update({
        where: { id: member.id },
        data: {
          appleId: sub,
          email: email || member.email,
          name: member.name && member.name !== "Member" ? member.name : name,
        },
      });
    } else {
      member = await prisma.member.create({
        data: { appleId: sub, email, name },
      });
      if (email) void sendWelcomeEmail(email, member.name);
    }

    const next = member.jobTitle && member.photo ? "/discover" : "/onboarding?apple=1";
    const res = NextResponse.redirect(appUrl(next));
    clearOAuthStateCookie(res);
    withSession(res, {
      id: sub,
      name: member.name,
      email: email || undefined,
      provider: "apple",
    });
    return withMemberCookie(res, member.id);
  } catch (err) {
    console.error("Apple OAuth failed", err);
    return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
  }
}

export async function GET() {
  return NextResponse.redirect(appUrl("/login?error=oauth_failed"));
}
