import { kanaCharacters, type KanaCharacter } from "@/data/kana";

export interface KanaAudioPayload {
  slug: string;
  src: string;
  ttsText: string;
  lang: "ja-JP";
}

/**
 * Extended Katakana set used for foreign loanwords.
 * These combinations have no standard hiragana equivalent or are best
 * pronounced by Japanese speech synthesizers in their native Katakana form.
 */
export const EXTENDED_KATAKANA_CHARS = new Set([
  "ファ", "フィ", "フェ", "フォ",
  "ティ", "トゥ", "ディ", "ドゥ", "デュ",
  "ウィ", "ウェ", "ウォ",
  "シェ", "ジェ", "チェ",
  "ヴァ", "ヴィ", "ヴ", "ヴェ", "ヴォ",
  "ツァ", "ツィ", "ツェ", "ツォ",
  "イェ",
  "クァ", "クィ", "クェ", "クォ",
]);

/**
 * Convert standard Katakana characters to Hiragana.
 * Preserves characters outside the Katakana range.
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Checks if a kana string is part of the extended loanword katakana set.
 */
export function isExtendedKatakana(char: string): boolean {
  return EXTENDED_KATAKANA_CHARS.has(char);
}

/**
 * Normalizes kana to the optimal utterance string for Japanese TTS engines.
 * Converts standard Katakana to Hiragana to prevent TTS from spelling individual letters,
 * while keeping extended loanword Katakana intact.
 */
export function toTtsText(char: string): string {
  if (isExtendedKatakana(char)) {
    return char;
  }
  return katakanaToHiragana(char);
}

// Map each unique kana character to its canonical sound slug
const CHAR_TO_SLUG_MAP = new Map<string, string>();

for (const k of kanaCharacters) {
  if (k.char === "ウォ") {
    CHAR_TO_SLUG_MAP.set(k.char, "who");
  } else {
    CHAR_TO_SLUG_MAP.set(k.char, k.romaji[0].toLowerCase());
  }
}

/**
 * Returns canonical audio filename slug for any Kana character.
 * Maps Hiragana and Katakana equivalents to the exact same audio asset slug.
 *
 * e.g.
 * "あ" -> "a", "ア" -> "a"
 * "しゃ" -> "sha", "シャ" -> "sha"
 * "じ" -> "ji", "ジ" -> "ji", "ぢ" -> "ji", "ヂ" -> "ji"
 * "ず" -> "zu", "づ" -> "zu"
 * "ファ" -> "fa", "ティ" -> "ti", "ヴ" -> "vu", "シェ" -> "she"
 */
export function toKanaAudioKey(charOrKana: string, primaryRomaji?: string): string {
  const trimmed = charOrKana.trim();
  const known = CHAR_TO_SLUG_MAP.get(trimmed);
  if (known) {
    return known;
  }

  // Check if converting Katakana -> Hiragana matches
  const asHira = katakanaToHiragana(trimmed);
  const knownHira = CHAR_TO_SLUG_MAP.get(asHira);
  if (knownHira) {
    return knownHira;
  }

  // Fallback to normalized primary romaji if supplied
  if (primaryRomaji) {
    return primaryRomaji.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  return trimmed.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

/**
 * Resolves full audio payload for a kana character, including static file path,
 * TTS fallback text, and language code.
 */
export function resolveKanaAudio(item: { char: string; romaji?: string[] }): KanaAudioPayload {
  const slug = toKanaAudioKey(item.char, item.romaji?.[0]);
  return {
    slug,
    src: `/audio/kana/${slug}.mp3`,
    ttsText: toTtsText(item.char),
    lang: "ja-JP",
  };
}

export interface UniqueAudioSound {
  slug: string;
  ttsText: string;
  sampleChar: string;
}

/**
 * Returns all unique audio sound entries required to synthesize complete Kana audio clips.
 */
export function getUniqueKanaSounds(): UniqueAudioSound[] {
  const seen = new Map<string, UniqueAudioSound>();

  for (const k of kanaCharacters) {
    const slug = toKanaAudioKey(k.char, k.romaji[0]);
    if (!seen.has(slug)) {
      seen.set(slug, {
        slug,
        ttsText: toTtsText(k.char),
        sampleChar: k.char,
      });
    }
  }

  return Array.from(seen.values());
}

