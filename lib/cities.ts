import type { City } from "./types";

export const CITIES: City[] = [
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
  { name: "Houston", country: "USA", lat: 29.7604, lng: -95.3698 },
  { name: "Atlanta", country: "USA", lat: 33.749, lng: -84.388 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
];

export function cityKey(c: City): string {
  return `${c.name}, ${c.country}`;
}
