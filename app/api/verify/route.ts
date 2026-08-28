import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { makeVerification, validateVerification } from "@/lib/verifyRules";
import type { Verification, VerificationMethod } from "@/lib/types";

const METHODS: VerificationMethod[] = [
  "company-email",
  "linkedin",
  "website",
  "registration",
  "portfolio",
];

export async function POST(req: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const body = (await req.json()) as { method?: string; value?: string };
  const method = body.method as VerificationMethod;
  if (!METHODS.includes(method)) {
    return NextResponse.json({ ok: false, error: "Unknown verification method." }, { status: 400 });
  }

  const checked = validateVerification(method, String(body.value || ""));
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
