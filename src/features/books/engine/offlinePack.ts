import { STATIC_BOOK_DIALOGUE_AUDIO_MAP } from "@/data/book-dialogues-audio.generated";
import { getAllCharacterAvatars } from "./characterAvatars";
import { ALL_DIALOGUE_BACKGROUNDS } from "./dialogueBackgrounds";

const TEXTBOOK_DATA_URLS = [
  "/data/v1/books/genki-1.json",
  "/data/v1/books/genki-2.json",
  "/data/v1/books/mnn-1.json",
  "/data/v1/books/mnn-2.json",
  "/data/v1/books/mnn-3.json",
] as const;

const TEXTBOOK_COVER_URLS = [
  "/images/books/genki-1.webp",
  "/images/books/genki-2.webp",
  "/images/books/mnn-1.webp",
  "/images/books/mnn-2.webp",
  "/images/books/mnn-3.webp",
] as const;

/**
 * Collects every static asset URL needed for 100% offline Textbook Companion
 * reading, dialogue backgrounds, character avatars, and Gemini TTS dialogue audio.
 */
export function collectTextbookOfflineAssetUrls(): string[] {
  const urls = new Set<string>([
    ...TEXTBOOK_DATA_URLS,
    ...TEXTBOOK_COVER_URLS,
  ]);

  for (const bgId of ALL_DIALOGUE_BACKGROUNDS) {
    urls.add(`/images/books/backgrounds/${bgId}.webp`);
  }

  for (const avatar of getAllCharacterAvatars()) {
    urls.add(avatar.neutral);
    urls.add(avatar.talking);
  }

  for (const value of Object.values(STATIC_BOOK_DIALOGUE_AUDIO_MAP)) {
    if (value.startsWith("/audio/books/dialogues/")) {
      urls.add(value);
    }
  }

  return Array.from(urls);
}
