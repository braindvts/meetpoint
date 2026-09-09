import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { parseBody } from "@/lib/validation/parse";
import { reportSchema } from "@/lib/validation/safety";

/** Safety: report a member. */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "report", limit: 10, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const me = await getCurrentMember();
  if (!me) {
    return NextResponse.json(
      { ok: false, error: "Sign in so we can attach your report." },
      { status: 401 }
    );
  }

  const parsed = await parseBody(req, reportSchema);
  if (!parsed.ok) return parsed.response;

  await prisma.report.create({
    data: {
      reporterId: me.id,
      peerId: parsed.data.peerId,
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true });
}
