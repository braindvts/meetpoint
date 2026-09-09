import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/memberAuth";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { sanitizeText } from "@/lib/sanitize";
import { parseBody } from "@/lib/validation/parse";
import { reportSchema } from "@/lib/validation/safety";

/** Safety: report a member. */
export async function POST(req: Request) {
  try {
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

    const reason = sanitizeText(parsed.data.reason, 500);
    if (reason.length < 3) {
      return NextResponse.json({ ok: false, error: "Reason too short" }, { status: 400 });
    }

    await prisma.report.create({
      data: {
        reporterId: me.id,
        peerId: parsed.data.peerId,
        reason,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return publicError(e, "Failed to submit report");
  }
}
