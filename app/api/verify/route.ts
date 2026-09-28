import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { legalConsentDenied } from "@/lib/legalGuard";
import { getCurrentMember } from "@/lib/memberAuth";
import { accountKey, rateLimit } from "@/lib/rateLimit";
import { VERIFY_IP } from "@/lib/rateCaps";
import { makeVerification, validateVerification } from "@/lib/verifyRules";
import type { Verification } from "@/lib/types";
import { verifySchema } from "@/lib/validation/safety";
import { parseBody } from "@/lib/validation/parse";

export async function POST(req: Request) {
  const limited = await rateLimit(req, VERIFY_IP);
  if (!limited.ok) return limited.response;

  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  const denied = legalConsentDenied(me);
  if (denied) return denied;

  const accountLimited = await rateLimit(req, {
    name: "verify-acct",
    limit: 10,
    windowMs: 60 * 60_000,
    scope: "account",
    keyExtra: accountKey(me.id),
  });
  if (!accountLimited.ok) return accountLimited.response;

  const parsed = await parseBody(req, verifySchema);
  if (!parsed.ok) return parsed.response;

  const { method, value } = parsed.data;
  const checked = validateVerification(method, value);
  if (!checked.ok) {
    return NextResponse.json({ ok: false, error: checked.error }, { status: 400 });
  }

  let current: Verification[] = [];
  try {
    current = JSON.parse(me.verificationsJson || "[]") as Verification[];
  } catch {
    current = [];
  }

  const next = [
    ...current.filter((v) => v.method !== method),
    makeVerification(method, checked.value),
  ];

  await prisma.member.update({
    where: { id: me.id },
    data: {
      verificationsJson: JSON.stringify(next),
      emailVerifiedAt:
        method === "company-email" ? new Date().toISOString() : me.emailVerifiedAt,
    },
  });

  return NextResponse.json({ ok: true, verifications: next });
}
