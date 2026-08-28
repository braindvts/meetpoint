/** Curated dining imagery for table suggestions (Unsplash). */
const PHOTOS = {
  fine: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  seafood: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
  sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  steak: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  french: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=900&q=80",
  mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
  italian: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  room: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  tasting: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  asian: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  outdoor: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
} as const;

const FALLBACK = [
  PHOTOS.fine,
  PHOTOS.room,
  PHOTOS.tasting,
  PHOTOS.french,
  PHOTOS.wine,
  PHOTOS.seafood,
  PHOTOS.asian,
  PHOTOS.steak,
];

export function restaurantPhoto(restaurant: {
  id: string;
  cuisine: string;
  photoUrl?: string;
}): string {
  if (restaurant.photoUrl) return restaurant.photoUrl;

  const c = restaurant.cuisine.toLowerCase();
  if (/\b(sushi|omakase|kaiseki)\b/.test(c)) return PHOTOS.sushi;
  if (/\b(seafood|fish)\b/.test(c)) return PHOTOS.seafood;
  if (/\b(steak|steakhouse)\b/.test(c)) return PHOTOS.steak;
  if (/\b(mexican)\b/.test(c)) return PHOTOS.mexican;
  if (/\b(french)\b/.test(c)) return PHOTOS.french;
  if (/\b(korean|asian|indian)\b/.test(c)) return PHOTOS.asian;
  if (/\b(mediterranean|italian|pasta)\b/.test(c)) return PHOTOS.italian;
  if (/\b(molecular|contemporary|avant)\b/.test(c)) return PHOTOS.tasting;

  const n = Number(restaurant.id.replace(/\D/g, "")) || 0;
  return FALLBACK[n % FALLBACK.length];
}
