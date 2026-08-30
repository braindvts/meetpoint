import type { Restaurant } from "./types";

export const IDEA_TAGS = [
  "AI / Machine Learning",
  "E-commerce",
  "Food & Restaurants",
  "Fintech",
  "Real Estate",
  "Health & Fitness",
  "Fashion",
  "Trucking & Logistics",
  "Content Creation",
  "Education",
  "Travel",
  "Gaming",
  "Crypto / Web3",
  "Marketing Agency",
  "SaaS",
  "Import / Export",
  "Beauty & Barbering",
  "Music",
  "Sports",
  "Green Energy",
  "Food Truck",
  "Catering",
  "Coffee Shop / Café",
  "Airbnb / Short-Term Rentals",
  "House Flipping & Renovation",
  "Construction & Contracting",
  "Cleaning Services",
  "Landscaping & Lawn Care",
  "Auto Detailing & Car Care",
  "Car Rental / Turo",
  "Vending Machines",
  "Dropshipping",
  "Amazon FBA / Reselling",
  "Print on Demand",
  "Clothing Brand",
  "Photography & Video",
  "Podcasting",
  "YouTube / Streaming",
  "Social Media Influencing",
  "Mobile App Development",
  "Web Design & Development",
  "Cybersecurity",
  "IT Services & Repair",
  "Drones & Aerial Services",
  "3D Printing",
  "Day Trading & Investing",
  "Stocks & Options Trading",
  "Forex Trading",
  "Dividend & Long-Term Investing",
  "Credit Repair",
  "Insurance",
  "Tax & Bookkeeping",
  "Notary & Mobile Services",
  "Event Planning",
  "Wedding Services",
  "Tutoring & Test Prep",
  "Online Courses & Coaching",
  "Childcare & Daycare",
  "Senior & Home Care",
  "Pet Services & Grooming",
  "Barbershop / Salon Owner",
  "Nail Tech & Lashes",
  "Personal Training & Gyms",
  "Meal Prep & Nutrition",
  "Agriculture & Farming",
  "Nonprofit & Community",
  "Franchising",
];

/** The most popular / saturated ideas, shown first so people find them fast. */
export const POPULAR_TAGS = [
  "E-commerce",
  "AI / Machine Learning",
  "Real Estate",
  "Airbnb / Short-Term Rentals",
  "Trucking & Logistics",
  "Dropshipping",
  "Amazon FBA / Reselling",
  "Content Creation",
  "YouTube / Streaming",
  "Day Trading & Investing",
  "Stocks & Options Trading",
  "Forex Trading",
  "Dividend & Long-Term Investing",
  "Clothing Brand",
  "Food Truck",
  "Cleaning Services",
  "Credit Repair",
  "Personal Training & Gyms",
  "Barbershop / Salon Owner",
  "Marketing Agency",
  "Crypto / Web3",
];

export const RESTAURANTS: Restaurant[] = [
  // New York
  { id: "r1", name: "Le Bernardin", cuisine: "French seafood · ★★★ Michelin", city: "New York", country: "USA", lat: 40.7614, lng: -73.9817, priceLevel: 3, vibe: "Impeccable silence. Seafood of the highest order." },
  { id: "r2", name: "Per Se", cuisine: "French-American · ★★★ Michelin", city: "New York", country: "USA", lat: 40.7685, lng: -73.9828, priceLevel: 3, vibe: "Central Park views. Nine courses of quiet power." },
  { id: "r3", name: "Eleven Madison Park", cuisine: "Contemporary · ★★★ Michelin", city: "New York", country: "USA", lat: 40.7416, lng: -73.9870, priceLevel: 3, vibe: "Plant-forward luxury in a grand Art Deco room." },
  // Los Angeles
  { id: "r4", name: "Providence", cuisine: "Seafood · ★★ Michelin", city: "Los Angeles", country: "USA", lat: 34.0837, lng: -118.3380, priceLevel: 3, vibe: "Hollywood’s most serious table. Unhurried." },
  { id: "r5", name: "n/naka", cuisine: "Kaiseki · ★★ Michelin", city: "Los Angeles", country: "USA", lat: 34.0308, lng: -118.3860, priceLevel: 3, vibe: "Thirteen seats. California kaiseki at its peak." },
  // Chicago
  { id: "r6", name: "Alinea", cuisine: "Molecular · ★★★ Michelin", city: "Chicago", country: "USA", lat: 41.9134, lng: -87.6482, priceLevel: 3, vibe: "Theatre on a plate. Worlds collide over dinner." },
  { id: "r7", name: "Smyth", cuisine: "Contemporary · ★★★ Michelin", city: "Chicago", country: "USA", lat: 41.8580, lng: -87.6460, priceLevel: 3, vibe: "Farm intimacy, three-star precision." },
  // Miami
  { id: "r8", name: "L'Atelier de Joël Robuchon", cuisine: "French · ★★ Michelin", city: "Miami", country: "USA", lat: 25.7907, lng: -80.1400, priceLevel: 3, vibe: "Counter dining. Pure Robuchon craft." },
  { id: "r9", name: "Hiden", cuisine: "Omakase · ★★ Michelin", city: "Miami", country: "USA", lat: 25.7990, lng: -80.2000, priceLevel: 3, vibe: "A hidden door. Eight seats. Absolute focus." },
  // Houston
  { id: "r10", name: "Le Jardinier", cuisine: "French · ★ Michelin", city: "Houston", country: "USA", lat: 29.7370, lng: -95.3900, priceLevel: 3, vibe: "Museum District elegance. Garden-lit rooms." },
  { id: "r11", name: "March", cuisine: "Mediterranean · ★ Michelin", city: "Houston", country: "USA", lat: 29.7420, lng: -95.4200, priceLevel: 3, vibe: "River Oaks refinement. Fire and restraint." },
  // Atlanta
  { id: "r12", name: "Lazy Betty", cuisine: "Contemporary · ★ Michelin", city: "Atlanta", country: "USA", lat: 33.7730, lng: -84.3630, priceLevel: 3, vibe: "Tasting menus with Southern soul, elevated." },
  { id: "r13", name: "Bone & Bourbon", cuisine: "Steakhouse · Five-star", city: "Atlanta", country: "USA", lat: 33.7840, lng: -84.3840, priceLevel: 3, vibe: "Private rooms. Dry-aged cuts. Quiet deals." },
  // Toronto
  { id: "r14", name: "Aloha", cuisine: "Contemporary · ★ Michelin", city: "Toronto", country: "Canada", lat: 43.6450, lng: -79.4000, priceLevel: 3, vibe: "Intimate tasting. Pacific polish." },
  { id: "r15", name: "Shoushin", cuisine: "Sushi · ★★ Michelin", city: "Toronto", country: "Canada", lat: 43.6700, lng: -79.3900, priceLevel: 3, vibe: "Omakase at the highest Canadian standard." },
  // Mexico City
  { id: "r16", name: "Pujol", cuisine: "Mexican · ★★ Michelin", city: "Mexico City", country: "Mexico", lat: 19.4320, lng: -99.1950, priceLevel: 3, vibe: "Mole Madre. Mexico’s most important table." },
  { id: "r17", name: "Quintonil", cuisine: "Mexican · ★★ Michelin", city: "Mexico City", country: "Mexico", lat: 19.4280, lng: -99.1900, priceLevel: 3, vibe: "Polanco gardens. Ingredient worship." },
  // London
  { id: "r18", name: "Restaurant Gordon Ramsay", cuisine: "French · ★★★ Michelin", city: "London", country: "UK", lat: 51.4850, lng: -0.1600, priceLevel: 3, vibe: "Chelsea. Three stars. Absolute discipline." },
  { id: "r19", name: "Sketch Lecture Room", cuisine: "French · ★★★ Michelin", city: "London", country: "UK", lat: 51.5130, lng: -0.1430, priceLevel: 3, vibe: "Mayfair opulence. Pink and gold excess." },
  { id: "r20", name: "Core by Clare Smyth", cuisine: "British · ★★★ Michelin", city: "London", country: "UK", lat: 51.5100, lng: -0.2000, priceLevel: 3, vibe: "Notting Hill. British produce, three-star craft." },
  // Paris
  { id: "r21", name: "Guy Savoy", cuisine: "French · ★★★ Michelin", city: "Paris", country: "France", lat: 48.8570, lng: 2.3350, priceLevel: 3, vibe: "Monnaie de Paris. Artichoke soup of legend." },
  { id: "r22", name: "Le Cinq", cuisine: "French · ★★★ Michelin", city: "Paris", country: "France", lat: 48.8690, lng: 2.3000, priceLevel: 3, vibe: "Four Seasons George V. Pure grandeur." },
  { id: "r23", name: "Alain Ducasse au Plaza Athénée", cuisine: "French · ★★★ Michelin", city: "Paris", country: "France", lat: 48.8660, lng: 2.3040, priceLevel: 3, vibe: "Crystal and naturalité. Untouchable." },
  // Berlin
  { id: "r24", name: "Restaurant Tim Raue", cuisine: "Asian-fusion · ★★ Michelin", city: "Berlin", country: "Germany", lat: 52.5060, lng: 13.3910, priceLevel: 3, vibe: "Kreuzberg edge. Two-star precision." },
  { id: "r25", name: "Facil", cuisine: "French · ★★ Michelin", city: "Berlin", country: "Germany", lat: 52.5080, lng: 13.3730, priceLevel: 3, vibe: "A glassed garden in the Mandala Hotel." },
  // Madrid
  { id: "r26", name: "DiverXO", cuisine: "Avant-garde · ★★★ Michelin", city: "Madrid", country: "Spain", lat: 40.4510, lng: -3.6900, priceLevel: 3, vibe: "Dabiz Muñoz. Chaos, genius, three stars." },
  { id: "r27", name: "Coque", cuisine: "Spanish · ★★ Michelin", city: "Madrid", country: "Spain", lat: 40.4300, lng: -3.7000, priceLevel: 3, vibe: "Family dynasty. Fire and wine cellars." },
  // Lagos
  { id: "r28", name: "Noir", cuisine: "Fine dining · Five-star", city: "Lagos", country: "Nigeria", lat: 6.4500, lng: 3.4300, priceLevel: 3, vibe: "Ikoyi black-tie dining. Soft light, hard deals." },
  { id: "r29", name: "Nok by Alara", cuisine: "African fine dining · Five-star", city: "Lagos", country: "Nigeria", lat: 6.4400, lng: 3.4200, priceLevel: 3, vibe: "Victoria Island. African haute cuisine." },
  // Nairobi
  { id: "r30", name: "Tamarind Nairobi", cuisine: "Seafood · Five-star", city: "Nairobi", country: "Kenya", lat: -1.2700, lng: 36.8000, priceLevel: 3, vibe: "Dhow atmosphere. Coastal luxury inland." },
  { id: "r31", name: "The Lord Erroll", cuisine: "Continental · Five-star", city: "Nairobi", country: "Kenya", lat: -1.2500, lng: 36.8200, priceLevel: 3, vibe: "Runda estate dining. Old-world service." },
  // Dubai
  { id: "r32", name: "Al Muntaha", cuisine: "European · Five-star", city: "Dubai", country: "UAE", lat: 25.1412, lng: 55.1853, priceLevel: 3, vibe: "Burj Al Arab. Two hundred metres above the Gulf." },
  { id: "r33", name: "Trèsind Studio", cuisine: "Indian · ★★★ Michelin", city: "Dubai", country: "UAE", lat: 25.0900, lng: 55.1500, priceLevel: 3, vibe: "Fifteen seats. Indian cuisine reinvented." },
  { id: "r34", name: "Ossiano", cuisine: "Seafood · ★ Michelin", city: "Dubai", country: "UAE", lat: 25.0800, lng: 55.1400, priceLevel: 3, vibe: "Underwater dining at Atlantis. Otherworldly." },
  // Mumbai
  { id: "r35", name: "Masque", cuisine: "Indian · ★ Michelin", city: "Mumbai", country: "India", lat: 19.0000, lng: 72.8300, priceLevel: 3, vibe: "Mill district. India’s modern tasting temple." },
  { id: "r36", name: "Ekaa", cuisine: "Contemporary · ★ Michelin", city: "Mumbai", country: "India", lat: 19.0600, lng: 72.8300, priceLevel: 3, vibe: "Kala Ghoda. Global technique, Indian soul." },
  // Singapore
  { id: "r37", name: "Odette", cuisine: "French · ★★★ Michelin", city: "Singapore", country: "Singapore", lat: 1.2900, lng: 103.8510, priceLevel: 3, vibe: "National Gallery. Soft pastels, hard standards." },
  { id: "r38", name: "Zén", cuisine: "Nordic · ★★★ Michelin", city: "Singapore", country: "Singapore", lat: 1.2800, lng: 103.8450, priceLevel: 3, vibe: "Townhouse intimacy. Three-star Nordic fire." },
  { id: "r39", name: "Les Amis", cuisine: "French · ★★★ Michelin", city: "Singapore", country: "Singapore", lat: 1.3050, lng: 103.8320, priceLevel: 3, vibe: "Orchard Road. Classic French perfection." },
  // Tokyo
  { id: "r40", name: "Sukiyabashi Jiro", cuisine: "Sushi · ★★★ Michelin", city: "Tokyo", country: "Japan", lat: 35.6720, lng: 139.7630, priceLevel: 3, vibe: "Ginza. Twenty minutes that define sushi." },
  { id: "r41", name: "Narisawa", cuisine: "Innovative · ★★ Michelin", city: "Tokyo", country: "Japan", lat: 35.6650, lng: 139.7200, priceLevel: 3, vibe: "Satoyama on a plate. Forest and fire." },
  { id: "r42", name: "L'Effervescence", cuisine: "French · ★★★ Michelin", city: "Tokyo", country: "Japan", lat: 35.6600, lng: 139.7300, priceLevel: 3, vibe: "Nishiazabu. French soul, Japanese seasons." },
  // Seoul
  { id: "r43", name: "Mingles", cuisine: "Korean · ★★★ Michelin", city: "Seoul", country: "South Korea", lat: 37.5250, lng: 127.0400, priceLevel: 3, vibe: "Gangnam. Korean tradition, three-star future." },
  { id: "r44", name: "Gaon", cuisine: "Korean · ★★★ Michelin", city: "Seoul", country: "South Korea", lat: 37.5200, lng: 127.0300, priceLevel: 3, vibe: "Royal court cuisine. Absolute quiet." },
  // Sydney
  { id: "r45", name: "Quay", cuisine: "Contemporary · ★★★ Michelin", city: "Sydney", country: "Australia", lat: -33.8580, lng: 151.2100, priceLevel: 3, vibe: "Harbour Bridge views. Opera House opposite." },
  { id: "r46", name: "Tetsuya's", cuisine: "Japanese-French · ★★★ Michelin", city: "Sydney", country: "Australia", lat: -33.8750, lng: 151.2050, priceLevel: 3, vibe: "A courtyard temple. Confidante confit." },
  // São Paulo
  { id: "r47", name: "D.O.M.", cuisine: "Brazilian · ★★ Michelin", city: "São Paulo", country: "Brazil", lat: -23.5670, lng: -46.6700, priceLevel: 3, vibe: "Alex Atala. Amazon ingredients, global fame." },
  { id: "r48", name: "Evvai", cuisine: "Brazilian · ★ Michelin", city: "São Paulo", country: "Brazil", lat: -23.5600, lng: -46.6800, priceLevel: 3, vibe: "Pinheiros. Modern Brazil on white linen." },
  // Buenos Aires
  { id: "r49", name: "Tegui", cuisine: "Contemporary · Five-star", city: "Buenos Aires", country: "Argentina", lat: -34.5900, lng: -58.4300, priceLevel: 3, vibe: "Palermo. Closed door, open ambition." },
  { id: "r50", name: "Aramburu", cuisine: "Avant-garde · Five-star", city: "Buenos Aires", country: "Argentina", lat: -34.6000, lng: -58.4200, priceLevel: 3, vibe: "Tasting menus that redefine Argentine fine dining." },
];

