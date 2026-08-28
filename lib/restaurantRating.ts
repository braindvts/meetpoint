import type { Restaurant } from "./types";

export type RestaurantRatingInput = Pick<Restaurant, "cuisine" | "priceLevel"> & {
  rating?: number;
};

/** Michelin stars encoded in the cuisine string (★ / ★★ / ★★★). */
export function michelinStarsFromCuisine(cuisine: string): number {
  return Math.min(3, (cuisine.match(/★/g) || []).length);
}

export function isFiveStarVenue(cuisine: string): boolean {
  return /five-star/i.test(cuisine);
}

/** Cuisine without Michelin / five-star markup — ratings live beside the name. */
export function displayCuisine(cuisine: string): string {
  return cuisine
    .replace(/\s*·\s*★+\s*Michelin/gi, "")
    .replace(/\s*·\s*Five-star/gi, "")
    .replace(/\s*★+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+·\s+$/g, "")
    .trim();
}

/** Guest-style 0–5 score. Uses a live rating when present; otherwise Michelin / venue class. */
export function restaurantScore(r: RestaurantRatingInput): number {
  if (typeof r.rating === "number" && Number.isFinite(r.rating) && r.rating > 0) {
    return Math.round(Math.min(5, Math.max(0, r.rating)) * 10) / 10;
  }
  const michelin = michelinStarsFromCuisine(r.cuisine);
  if (michelin >= 3) return 4.9;
  if (michelin === 2) return 4.7;
  if (michelin === 1) return 4.5;
  if (isFiveStarVenue(r.cuisine)) return 4.8;
  if (r.priceLevel === 3) return 4.4;
  if (r.priceLevel === 2) return 4.1;
  return 3.8;
}

export function filledStars(score: number): number {
  return Math.max(0, Math.min(5, Math.round(score)));
}

export function prestigeRank(r: RestaurantRatingInput): number {
  return (
    michelinStarsFromCuisine(r.cuisine) * 2 +
    (isFiveStarVenue(r.cuisine) ? 2 : 0) +
    restaurantScore(r)
  );
}
