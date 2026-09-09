import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Proxy Google Places photos so GOOGLE_PLACES_API_KEY never reaches the browser.
 */
export async function GET(req: Request) {
  const limited = rateLimit(req, { name: "places-photo", limit: 80, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ ok: false, error: "Photos not configured" }, { status: 503 });
  }

  const ref = new URL(req.url).searchParams.get("ref")?.trim();
  if (!ref || ref.length > 400) {
    return NextResponse.json({ ok: false, error: "Missing ref" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "800");
  url.searchParams.set("photo_reference", ref);
  url.searchParams.set("key", key);

  try {
    const upstream = await fetch(url.toString(), { redirect: "follow" });
    if (!upstream.ok) {
      return NextResponse.json({ ok: false, error: "Photo fetch failed" }, { status: 502 });
    }
    const buf = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Photo fetch failed" }, { status: 502 });
  }
}
