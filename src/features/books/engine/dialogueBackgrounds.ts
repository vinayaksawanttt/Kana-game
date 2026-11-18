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

/**
 * Resolves a dialogue scene ID (e.g. "l1-scene-i") to its WebP background URL,
 * or null if no custom background is registered for that scene.
 */
export function getDialogueBackground(sceneId: string): string | null {
  if (!sceneId) return null;
  const normalized = sceneId.trim().toLowerCase();
  const bgId = GENKI_DIALOGUE_BACKGROUND_IDS[normalized];
  if (!bgId) return null;
  return `${BG_BASE}/${bgId}.webp`;
}
