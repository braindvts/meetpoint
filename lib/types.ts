export type TravelRange = "local" | "country" | "worldwide";

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Person {
  id: string;
  name: string;
  jobTitle: string;
  ideaTags: string[];
  bio: string;
  city: City;
  travel: TravelRange;
  emoji: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  priceLevel: 1 | 2 | 3;
  vibe: string;
}

export type MeetMode = "i-fly" | "they-fly" | "midpoint";

export interface Meetup {
  mode: MeetMode;
  restaurantId: string;
  date: string;
  note?: string;
}

export type ConnectionStatus = "requested" | "connected";

export interface Connection {
  peerId: string;
  status: ConnectionStatus;
  meetup?: Meetup;
}

export interface MyProfile {
  name: string;
  jobTitle: string;
  ideaTags: string[];
  bio: string;
  city: City;
  travel: TravelRange;
  emoji: string;
}
