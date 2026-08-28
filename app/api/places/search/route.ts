import { NextResponse } from "next/server";
import { RESTAURANTS } from "@/lib/data";

/**
 * Live restaurant search via Google Places Text Nearby when GOOGLE_PLACES_API_KEY is set.
 * Otherwise returns curated Michelin/5-star seed restaurants filtered by query/city.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const city = (searchParams.get("city") || "").trim().toLowerCase();
  const lat = Number(searchParams.get("lat") || NaN);
  const lng = Number(searchParams.get("lng") || NaN);

  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (key && Number.isFinite(lat) && Number.isFinite(lng)) {
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
          vibe: r.rating ? `Rated ${r.rating}` : "Recommended nearby",
          photoUrl: r.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${r.photos[0].photo_reference}&key=${key}`
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
    places: list.slice(0, 24).map((r) => ({ ...r, live: false })),
    message: key
      ? "Pass lat & lng for live Places results."
      : "Add GOOGLE_PLACES_API_KEY for live restaurant search.",
  });
}
