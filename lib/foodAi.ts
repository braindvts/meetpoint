import { searchPlaces } from "./apiClient";
import { distanceKm, midpointRestaurants, restaurantsInCity } from "./match";
import { prestigeRank } from "./restaurantRating";
import type { City, Person, Restaurant } from "./types";

/**
 * Broad, phone-friendly detection — short texts, typos, and casual phrasing.
 * Kept intentional enough that random chat doesn't always fire.
 */
const FOOD_OR_MEET =
  /\b(?:food|eat(?:ing)?|dinner|lunch|brunch|breakfast|restaurant|restaurants|cafe|café|meal|hungry|cuisine|reservation|reserve|takeout|take-out|pizza|sushi|steak|drinks|cocktail|wine|michelin|fine\s*dining|bite|table|tables|meetup|meet-up|meetups|meeting|meetings|meet|hang\s*out|hangout|get\s*together|catch\s*up|sit\s*down|in[\s-]?person|face[\s-]?to[\s-]?face|coffee|tonight|tomorrow|this\s+week|next\s+week|calendar|availability|when\s+works|are\s+you\s+free|fly\s+(?:out|over|in)|host\s+you|visit\s+(?:you|me)|grab\s+(?:a\s+)?(?:bite|dinner|lunch|coffee)|go(?:ing)?\s+out|let'?s\s+(?:meet|eat|grab|do|get)|we\s+should\s+meet|want\s+to\s+meet|can\s+we\s+meet|down\s+to\s+meet|schedule\s+(?:a\s+)?meet|set\s+up\s+(?:a\s+)?meet|book\s+(?:a\s+)?(?:table|meet)|plan\s+(?:a\s+)?meet|pick\s+a\s+(?:spot|place|date|time)|where\s+(?:should|can)\s+we\s+(?:meet|eat|go)|when\s+(?:can|should|do)\s+we\s+meet)\b/i;

export function mentionsFoodOrGoingOut(text: string): boolean {
  return shouldSuggestMeetingSpots(text);
}

/** True when the message is about food, going out, or arranging a meeting. */
export function shouldSuggestMeetingSpots(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t || t.length < 3) return false;
  if (/^suggested table:/i.test(t)) return false;
  // Normalize curly apostrophes / smart quotes from mobile keyboards
  const normalized = t.replace(/[\u2019\u2018]/g, "'");
  return FOOD_OR_MEET.test(normalized);
}

export interface FoodSuggestion {
  restaurant: Restaurant;
  reason: string;
  distanceKm?: number;
}

/** Suggest Michelin / five-star spots near the people in this private chat. */
export function suggestSpotsForChat(
  myCity: City,
  peers: Person[],
  limit = 4
): FoodSuggestion[] {
  const peerCities = peers.map((p) => p.city);
  const cityNames = new Set([myCity.name, ...peerCities.map((c) => c.name)]);

  const byCity: FoodSuggestion[] = [];
  for (const name of cityNames) {
    for (const r of restaurantsInCity(name)) {
      const isMine = name === myCity.name;
      byCity.push({
        restaurant: r,
        reason: isMine
          ? `Near you · ${r.city}`
          : `Near ${peers.find((p) => p.city.name === name)?.name.split(" ")[0] || "them"} · ${r.city}`,
      });
    }
  }

  let mid: FoodSuggestion[] = [];
  if (peerCities.length > 0) {
    const other = peerCities[0];
    if (other.name !== myCity.name) {
      mid = midpointRestaurants(myCity, other, 4).map((r) => ({
        restaurant: r,
        reason: `Between you · ${r.city}`,
        distanceKm: distanceKm(myCity, {
          name: r.city,
          country: r.country,
          lat: r.lat,
          lng: r.lng,
        }),
      }));
    }
  }

  const seen = new Set<string>();
  const merged: FoodSuggestion[] = [];
  for (const s of [...byCity, ...mid]) {
    if (seen.has(s.restaurant.id)) continue;
    seen.add(s.restaurant.id);
    merged.push(s);
  }

  return merged
    .sort((a, b) => prestigeRank(b.restaurant) - prestigeRank(a.restaurant))
    .slice(0, limit);
}

/** Prefer live Google Places when key + coords available; else curated list. */
export async function suggestSpotsForChatLive(
  myCity: City,
  peers: Person[],
  limit = 4
): Promise<{ suggestions: FoodSuggestion[]; live: boolean }> {
  try {
    const data = (await searchPlaces({
      q: "fine dining michelin",
      city: myCity.name,
      lat: myCity.lat,
      lng: myCity.lng,
    })) as {
      ok?: boolean;
      live?: boolean;
      places?: Restaurant[];
    };
    if (data.ok && data.places?.length) {
      return {
        live: !!data.live,
        suggestions: data.places.slice(0, limit).map((restaurant) => ({
          restaurant,
          reason: data.live ? `Near you · live` : `Curated · ${restaurant.city}`,
        })),
      };
    }
  } catch {
    /* fall through */
  }
  return { live: false, suggestions: suggestSpotsForChat(myCity, peers, limit) };
}
