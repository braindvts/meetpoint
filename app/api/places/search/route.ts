import { NextResponse } from "next/server";
import { RESTAURANTS } from "@/lib/data";
import { rateLimit } from "@/lib/rateLimit";
import { placesQuerySchema } from "@/lib/validation/safety";

/**
 * Live restaurant search via Google Places when GOOGLE_PLACES_API_KEY is set.
 * Photo URLs go through /api/places/photo — the API key never leaves the server.
 */
export async function GET(req: Request) {
  const limited = rateLimit(req, { name: "places", limit: 40, windowMs: 60_000 });
  if (!limited.ok) return limited.response;

  const { searchParams } = new URL(req.url);
  const parsed = placesQuerySchema.safeParse({
    q: searchParams.get("q") || undefined,
    city: searchParams.get("city") || undefined,
    lat: searchParams.get("lat") || undefined,
    lng: searchParams.get("lng") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 });
  }

  const q = (parsed.data.q || "").toLowerCase();
  const city = (parsed.data.city || "").toLowerCase();
  const lat = parsed.data.lat;
  const lng = parsed.data.lng;

  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (key && lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      url.searchParams.set("location", `${lat},${lng}`);
      url.searchParams.set("radius", "8000");
      url.searchParams.set("type", "restaurant");
      url.searchParams.set("keyword", q || "fine dining michelin");
      url.searchParams.set("key", key);

      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        results?: {
          place_id: string;
          name: string;
          vicinity?: string;
          rating?: number;
          geometry?: { location: { lat: number; lng: number } };
          photos?: { photo_reference: string }[];
        }[];
        status?: string;
        error_message?: string;
      };

      if (data.status === "OK" || data.status === "ZERO_RESULTS") {
        const places = (data.results || []).slice(0, 20).map((r) => ({
          id: r.place_id,
          name: r.name,
          cuisine: "Restaurant",
          city: r.vicinity || city || "",
          country: "",
          lat: r.geometry?.location.lat ?? lat,
          lng: r.geometry?.location.lng ?? lng,
          priceLevel: 3 as const,
          rating: r.rating,
          vibe: r.rating ? `Rated ${r.rating}` : "Recommended nearby",
          photoUrl: r.photos?.[0]
            ? `/api/places/photo?ref=${encodeURIComponent(r.photos[0].photo_reference)}`
            : undefined,
          live: true,
        }));
        return NextResponse.json({ ok: true, live: true, places });
      }

      return NextResponse.json(
        {
          ok: false,
          live: true,
          error: data.error_message || data.status || "Places failed",
        },
        { status: 502 }
      );
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Places failed" },
        { status: 502 }
      );
    }
  }

  let list = RESTAURANTS;
  if (city) list = list.filter((r) => r.city.toLowerCase().includes(city));
  if (q) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.vibe.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    ok: true,
    live: false,
    places: list.slice(0, 20),
  });
}
