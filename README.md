# MeetPoint 📍

**Networking that ends at a real dinner table.**

MeetPoint connects you with people who share your business idea or your profession —
in your city or across the world. When two people connect, they plan a meetup at a
restaurant: one person flies to the other, the host picks the spot, or both fly and
meet in the middle.

## Features (MVP)

- **Profile** — your job, business ideas, city, and how far you'll travel (near me / my country / worldwide)
- **Discover** — ranked matches scored by shared ideas, same job, and distance, with filters
- **Connect** — send a connect request (auto-accepted in this demo)
- **Plan a meetup** — choose who travels, pick a restaurant, set a date, add a note

Everything runs in the browser with demo data and `localStorage` — no backend yet.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Works on desktop and phone browsers.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- Demo data + `localStorage` (swap for a real backend later)

## Roadmap ideas

- Real accounts, real-time chat, and mutual accept flow
- Live restaurant search (Google Places / Yelp API)
- Geolocation instead of a city picker
- Flight-price hints for long-distance meetups
- Safety features: verified profiles, public-place-only suggestions
