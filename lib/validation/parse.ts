import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Parse JSON with a Zod schema. Rejects unexpected fields (`.strict()` schemas).
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
  opts?: { maxBytes?: number }
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const maxBytes = opts?.maxBytes ?? 256_000;
  const raw = await req.text();
  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 }),
    };
  }

  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue
      ? `${issue.path.join(".") || "body"}: ${issue.message}`
      : "Invalid request";
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: message, issues: parsed.error.issues.slice(0, 8) },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}
