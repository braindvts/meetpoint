import { NextResponse } from "next/server";

/** Never leak stack traces or internal messages to clients in production. */
export function publicError(
  e: unknown,
  fallback = "Something went wrong",
  status = 500
): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    const msg = e instanceof Error ? e.message : fallback;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
  if (e instanceof Error) {
    console.error("[api]", e.message);
  } else {
    console.error("[api]", e);
  }
  return NextResponse.json({ ok: false, error: fallback }, { status });
}
