import { NextResponse } from "next/server";

/**
 * Proxy Google Place photos so the server API key never appears in the browser.
 */
export async function GET(req: Request) {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const ref = new URL(req.url).searchParams.get("ref")?.trim() || "";
  if (!key || !ref) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  if (ref.length > 400 || /[\s&?#/\\]/.test(ref)) {
    return NextResponse.json({ ok: false, error: "Invalid reference" }, { status: 400 });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
    url.searchParams.set("maxwidth", "800");
    url.searchParams.set("photo_reference", ref);
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { redirect: "follow" });
    if (!res.ok || !res.body) {
      return NextResponse.json({ ok: false, error: "Photo unavailable" }, { status: 502 });
    }

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Photo unavailable" }, { status: 502 });
  }
}
