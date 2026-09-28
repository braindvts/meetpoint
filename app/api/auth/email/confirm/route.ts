import { NextResponse } from "next/server";
import { consumeEmailConfirmation } from "@/lib/emailConfirmStore";
import { rateLimit } from "@/lib/rateLimit";
import { publicError } from "@/lib/safeError";
import { z } from "zod";
import { parseBody } from "@/lib/validation/parse";

const confirmSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
  })
  .strict();

/** Sets emailVerifiedAt only when the token matches that member and address. */
export async function POST(req: Request) {
  const limited = rateLimit(req, { name: "email-confirm", limit: 30, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  try {
    const parsed = await parseBody(req, confirmSchema);
    if (!parsed.ok) return parsed.response;
    const result = await consumeEmailConfirmation(parsed.data.token);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return publicError(e, "Could not confirm email");
  }
}
