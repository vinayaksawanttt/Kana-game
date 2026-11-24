/**
 * Centralized registry mapping Genki I & II dialogue scene IDs
 * to their WebP background art assets under `/images/books/backgrounds/`.
 */

const BG_BASE = "/images/books/backgrounds";

export const GENKI_DIALOGUE_BACKGROUND_IDS: Record<string, string> = {
  // Genki I (Lessons 1–12)
  "l1-scene-i": "01-university-orientation",
  "l1-scene-ii": "02-university-classroom",
  "l2-scene-i": "03-flea-market",
  "l2-scene-ii": "04-tonkatsu-restaurant",
  "l3-scene-i": "05-campus-courtyard",
  "l3-scene-ii": "06-host-family-morning",
  "l4-scene-i": "07-downtown-street",
  "l4-scene-ii": "08-host-family-evening",
  "l4-scene-iii": "09-mary-bedroom-night",
  "l5-scene-i": "10-okinawa-beach",
  "l5-scene-ii": "11-okinawa-souvenir-shop",
  "l5-scene-iii": "02-university-classroom",
  "l6-scene-i": "02-university-classroom",
  "l6-scene-ii": "12-campus-corridor",
  "l6-scene-iii": "13-city-bus-interior",
  "l7-scene-i": "14-dorm-living-room",
  "l7-scene-ii": "14-dorm-living-room",
  "l8-scene-i": "05-campus-courtyard",
  "l8-scene-ii": "15-park-barbecue",
  "l9-scene-i": "05-campus-courtyard",
  "l9-scene-ii": "16-kabuki-theater-lobby",
  "l9-scene-iii": "17-kabuki-concession",
  "l10-scene-i": "18-campus-winter",
  "l10-scene-ii": "19-hokkaido-hotel-lobby",
  "l11-scene-i": "05-campus-courtyard",
  "l11-scene-ii": "20-student-lounge",
  "l11-scene-iii": "20-student-lounge",
  "l12-scene-i": "12-campus-corridor",
  "l12-scene-ii": "21-hospital-clinic-room",

  // Genki II (Lessons 13–23)
  "l13-scene-i": "22-john-apartment-day",
  "l13-scene-ii": "23-little-asia-day",
  "l13-scene-iii": "24-little-asia-evening",
  "l14-scene-i": "25-neighborhood-cafe",
  "l14-scene-ii": "26-park-winter-date",
  "l14-scene-iii": "05-campus-courtyard",
  "l15-scene-i": "20-student-lounge",
  "l15-scene-ii": "27-nagano-station-plaza",
  "l15-scene-iii": "28-travel-info-office",
  "l16-scene-i": "29-professor-office",
  "l16-scene-ii": "30-station-ticket-gate",
  "l16-scene-iii": "12-campus-corridor",
  "l17-scene-i": "30-station-ticket-gate",
  "l17-scene-ii": "25-neighborhood-cafe",
  "l18-scene-i": "23-little-asia-day",
  "l18-scene-ii": "24-little-asia-evening",
  "l18-scene-iii": "31-little-asia-closed",
  "l19-scene-i": "32-airport-arrivals",
  "l19-scene-ii": "33-upscale-restaurant",
  "l19-scene-iii": "34-suburban-house-night",
  "l20-scene-i": "35-electronics-store",
  "l20-scene-ii": "36-rainy-shopping-street",
  "l21-scene-i": "37-landlady-genkan",
  "l21-scene-ii": "38-john-apartment-messy",
  "l21-scene-iii": "22-john-apartment-day",
  "l22-scene-i": "06-host-family-morning",
  "l22-scene-ii": "09-mary-bedroom-night",
  "l22-scene-iii": "26-park-winter-date",
  "l23-scene-i": "08-host-family-evening",
  "l23-scene-ii": "39-airport-express-dusk",
  "l23-scene-iii": "40-airport-departure-gate",
};

export const MNN_DIALOGUE_BACKGROUND_IDS: Record<string, string> = {
  // Lesson 1: IMC Office
  "mnn-l1-scene-i": "imc-office-day",
  "mnn-l1-scene-ii": "imc-office-day",
  "mnn-l1-scene-iii": "imc-office-day",
  "mnn-l1-scene-iv": "imc-office-day",

  // Lesson 2: Apartment moving day
  "mnn-l2-scene-i": "apartment-moving-day",
  "mnn-l2-scene-ii": "apartment-hallway-genkan",
  "mnn-l2-scene-iii": "imc-office-day",
  "mnn-l2-scene-iv": "imc-office-day",

  // Lesson 3: Department store wine
  "mnn-l3-scene-i": "department-store-wine",
  "mnn-l3-scene-ii": "department-store-wine",
  "mnn-l3-scene-iii": "imc-office-day",
  "mnn-l3-scene-iv": "department-store-wine",

  // Lesson 4: Office breakroom & Art Museum
  "mnn-l4-scene-i": "office-breakroom-lounge",
  "mnn-l4-scene-ii": "art-museum-plaza",
  "mnn-l4-scene-iii": "office-breakroom-lounge",
  "mnn-l4-scene-iv": "office-breakroom-lounge",

  // Lesson 5: Train platform to Koshien
  "mnn-l5-scene-i": "koshien-train-platform",
  "mnn-l5-scene-ii": "osaka-castle-sakura",
  "mnn-l5-scene-iii": "office-breakroom-lounge",
  "mnn-l5-scene-iv": "imc-office-day",

  // Lesson 6: Osaka Castle Cherry Blossoms
  "mnn-l6-scene-i": "osaka-castle-sakura",
  "mnn-l6-scene-ii": "osaka-castle-sakura",
  "mnn-l6-scene-iii": "teishoku-lunch-cashier",
  "mnn-l6-scene-iv": "osaka-castle-sakura",

  // Lesson 7: Yamada living room
  "mnn-l7-scene-i": "yamada-living-room-day",
  "mnn-l7-scene-ii": "yamada-living-room-day",
  "mnn-l7-scene-iii": "yamada-living-room-day",
  "mnn-l7-scene-iv": "yamada-living-room-day",

  // Lesson 8: Yamada living room / life in Japan
  "mnn-l8-scene-i": "yamada-living-room-day",
  "mnn-l8-scene-ii": "office-breakroom-lounge",
  "mnn-l8-scene-iii": "department-store-wine",
  "mnn-l8-scene-iv": "yamada-living-room-day",

  // Lesson 9: Classical concert hall
  "mnn-l9-scene-i": "concert-hall-lobby",
  "mnn-l9-scene-ii": "concert-hall-lobby",
  "mnn-l9-scene-iii": "office-breakroom-lounge",
  "mnn-l9-scene-iv": "concert-hall-lobby",

  // Lesson 10: Supermarket Asia Store & Reception party
  "mnn-l10-scene-i": "supermarket-spice-aisle",
  "mnn-l10-scene-ii": "japanese-bank-atm",
  "mnn-l10-scene-iii": "supermarket-spice-aisle",
  "mnn-l10-scene-iv": "company-buffet-party",

  // Lesson 11: Japan post office & apartment caretaker
  "mnn-l11-scene-i": "japan-post-office",
  "mnn-l11-scene-ii": "apartment-hallway-genkan",
  "mnn-l11-scene-iii": "japan-post-office",
  "mnn-l11-scene-iv": "japan-post-office",

  // Lesson 12: Kyoto Gion matsuri & caretaker
  "mnn-l12-scene-i": "apartment-hallway-genkan",
  "mnn-l12-scene-ii": "kyoto-gion-matsuri",
  "mnn-l12-scene-iii": "kyoto-gion-matsuri",
  "mnn-l12-scene-iv": "kyoto-gion-matsuri",

  // Lesson 13: TV Street Interview / breakroom
  "mnn-l13-scene-i": "office-breakroom-lounge",
  "mnn-l13-scene-ii": "osaka-castle-sakura",
  "mnn-l13-scene-iii": "teishoku-lunch-cashier",
  "mnn-l13-scene-iv": "office-breakroom-lounge",

  // Lesson 14: Teishoku lunch cashier
  "mnn-l14-scene-i": "teishoku-lunch-cashier",
  "mnn-l14-scene-ii": "teishoku-lunch-cashier",
  "mnn-l14-scene-iii": "teishoku-lunch-cashier",
  "mnn-l14-scene-iv": "teishoku-lunch-cashier",

  // Lesson 15: Public library counter
  "mnn-l15-scene-i": "public-library-counter",
  "mnn-l15-scene-ii": "public-library-counter",
  "mnn-l15-scene-iii": "public-library-counter",
  "mnn-l15-scene-iv": "public-library-counter",

  // Lesson 16: Japanese bank ATM & company buffet party
  "mnn-l16-scene-i": "japanese-bank-atm",
  "mnn-l16-scene-ii": "japanese-bank-atm",
  "mnn-l16-scene-iii": "office-breakroom-lounge",
  "mnn-l16-scene-iv": "company-buffet-party",

  // Lesson 17: Real estate agency office
  "mnn-l17-scene-i": "real-estate-office",
  "mnn-l17-scene-ii": "real-estate-office",
  "mnn-l17-scene-iii": "real-estate-office",
  "mnn-l17-scene-iv": "real-estate-office",

  // Lesson 18: Breakroom & hobby talk
  "mnn-l18-scene-i": "office-breakroom-lounge",
  "mnn-l18-scene-ii": "office-breakroom-lounge",
  "mnn-l18-scene-iii": "office-breakroom-lounge",
  "mnn-l18-scene-iv": "office-breakroom-lounge",

  // Lesson 19: Teishoku lunch & tea ceremony
  "mnn-l19-scene-i": "teishoku-lunch-cashier",
  "mnn-l19-scene-ii": "teishoku-lunch-cashier",
  "mnn-l19-scene-iii": "yamada-living-room-day",
  "mnn-l19-scene-iv": "teishoku-lunch-cashier",

  // Lesson 20: Breakroom & casual talk
  "mnn-l20-scene-i": "office-breakroom-lounge",
  "mnn-l20-scene-ii": "office-breakroom-lounge",
  "mnn-l20-scene-iii": "office-breakroom-lounge",
  "mnn-l20-scene-iv": "office-breakroom-lounge",

  // Lesson 21: Summer Hanabi Riverside fireworks
  "mnn-l21-scene-i": "summer-hanabi-riverside",
  "mnn-l21-scene-ii": "summer-hanabi-riverside",
  "mnn-l21-scene-iii": "summer-hanabi-riverside",
  "mnn-l21-scene-iv": "summer-hanabi-riverside",

  // Lesson 22: Real estate office apartment hunt
  "mnn-l22-scene-i": "real-estate-office",
  "mnn-l22-scene-ii": "real-estate-office",
  "mnn-l22-scene-iii": "apartment-hallway-genkan",
  "mnn-l22-scene-iv": "real-estate-office",

  // Lesson 23: Public library counter & road directions
  "mnn-l23-scene-i": "public-library-counter",
  "mnn-l23-scene-ii": "public-library-counter",
  "mnn-l23-scene-iii": "office-breakroom-lounge",
  "mnn-l23-scene-iv": "public-library-counter",

  // Lesson 24 & 25: Japanese taxi ride & farewell
  "mnn-l24-scene-i": "japanese-taxi-interior",
  "mnn-l24-scene-ii": "japanese-taxi-interior",
  "mnn-l24-scene-iii": "imc-office-day",
  "mnn-l24-scene-iv": "japanese-taxi-interior",

  "mnn-l25-scene-i": "japanese-taxi-interior",
  "mnn-l25-scene-ii": "company-buffet-party",
  "mnn-l25-scene-iii": "imc-office-day",
  "mnn-l25-scene-iv": "company-buffet-party",
};

export const ALL_DIALOGUE_BACKGROUNDS = Array.from(
  new Set([
    ...Object.values(GENKI_DIALOGUE_BACKGROUND_IDS),
    ...Object.values(MNN_DIALOGUE_BACKGROUND_IDS),
  ])
);

/**
 * Resolves a dialogue scene ID (e.g. "l1-scene-i" or "mnn-l1-scene-i") or background name
 * to its WebP background URL, or null if no custom background is registered.
 */
export function getDialogueBackground(sceneId: string, bookId?: string): string | null {
  if (!sceneId) return null;
  const normalized = sceneId.trim().toLowerCase();

  // 1. Direct background name match (e.g. "apartment-hallway-genkan")
  if (ALL_DIALOGUE_BACKGROUNDS.includes(normalized)) {
    return `${BG_BASE}/${normalized}.webp`;
  }

  // 2. Explicit MNN lookup if bookId is mnn-1 or id starts with mnn-
  if (bookId === "mnn-1" || normalized.startsWith("mnn-")) {
    const mnnKey = normalized.startsWith("mnn-") ? normalized : `mnn-${normalized}`;
    const mnnBg = MNN_DIALOGUE_BACKGROUND_IDS[mnnKey] || MNN_DIALOGUE_BACKGROUND_IDS[normalized];
    if (mnnBg) return `${BG_BASE}/${mnnBg}.webp`;
  }

  // 3. Genki scene mapping
  const genkiBg = GENKI_DIALOGUE_BACKGROUND_IDS[normalized];
  if (genkiBg) return `${BG_BASE}/${genkiBg}.webp`;

  // 4. MNN scene mapping fallback
  const mnnFallback =
    MNN_DIALOGUE_BACKGROUND_IDS[`mnn-${normalized}`] ||
    MNN_DIALOGUE_BACKGROUND_IDS[normalized];
  if (mnnFallback) return `${BG_BASE}/${mnnFallback}.webp`;

  return null;
}
