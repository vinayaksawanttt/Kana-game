import { kanaCharacters } from "@/data/kana";

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
  const hira = katakanaToHiragana(char);
  // Single 'い' requires terminal punctuation to prevent neural TTS glottal artifact / abrupt pitch inflection
  if (hira === "い") {
    return "い。";
  }
  return hira;
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

export interface KanjiReadingAudioPayload {
  slug: string;
  src: string;
  ttsText: string;
  lang: "ja-JP";
  isKanaReuse: boolean;
}

/**
 * Normalizes raw KANJIDIC okurigana reading strings.
 * Strips okurigana dots (.), affix hyphens (-), and normalizes Katakana On'yomi
 * into clean Hiragana phonetic strings.
 *
 * e.g.
 * "まか.せる" -> "まかせる"
 * "-はじ.める" -> "はじめる"
 * "お-" -> "お"
 * "また.の-" -> "またの"
 * "ギョウ" -> "ぎょう"
 * "レッキ" -> "れっき"
 */
export function normalizeKanjiReading(rawReading: string): string {
  if (!rawReading) return "";
  const trimmed = rawReading.trim();
  const stripped = trimmed.replace(/[.\-]/g, "").replace(/^ー+|ー+$/g, "");
  return katakanaToHiragana(stripped);
}

/**
 * Resolves full audio payload for a Kanji reading.
 * If the reading is a single kana mora already in /audio/kana/${slug}.mp3,
 * it reuses that asset directly.
 * Otherwise, it maps to /audio/readings/${encodeURIComponent(hira)}.mp3.
 */
export function resolveKanjiReadingAudio(rawReading: string): KanjiReadingAudioPayload {
  const hira = normalizeKanjiReading(rawReading);
  const kanaSlug = CHAR_TO_SLUG_MAP.get(hira);

  if (kanaSlug) {
    return {
      slug: kanaSlug,
      src: `/audio/kana/${kanaSlug}.mp3`,
      ttsText: hira,
      lang: "ja-JP",
      isKanaReuse: true,
    };
  }

  const safeSlug = encodeURIComponent(hira);
  return {
    slug: hira,
    src: `/audio/readings/${safeSlug}.mp3`,
    ttsText: hira,
    lang: "ja-JP",
    isKanaReuse: false,
  };
}

/**
 * Builds an ordered, deduplicated queue of up to 4 primary readings
 * (up to 2 primary On'yomi + up to 2 primary Kun'yomi) for sequential read-all.
 */
export function buildKanjiReadAllQueue(kanji: { on?: string[]; kun?: string[] }): string[] {
  const result: string[] = [];
  const seenNorm = new Set<string>();

  const onList = Array.isArray(kanji.on) ? kanji.on.slice(0, 2) : [];
  for (const raw of onList) {
    const norm = normalizeKanjiReading(raw);
    if (norm && !seenNorm.has(norm)) {
      seenNorm.add(norm);
      result.push(raw);
    }
  }

  const kunList = Array.isArray(kanji.kun) ? kanji.kun.slice(0, 2) : [];
  for (const raw of kunList) {
    const norm = normalizeKanjiReading(raw);
    if (norm && !seenNorm.has(norm) && result.length < 4) {
      seenNorm.add(norm);
      result.push(raw);
    }
  }

  return result.slice(0, 4);
}

export interface VocabAudioPayload {
  key: string;
  src: string;
  ttsText: string;
  lang: "ja-JP";
}

/**
 * Resolves audio payload for a vocabulary word.
 * Always normalizes the phonetic reading to clean Hiragana so that
 * TTS engines pronounce the exact target reading rather than guessing
 * alternative readings for kanji compounds (e.g. 大勢 -> おおぜい rather than たいせい).
 *
 * If the normalized kana is a single mora or known kana slug, reuses the
 * static kana audio clip directly. Otherwise targets /audio/vocab/{slug}.mp3.
 */
export function resolveVocabAudio(item: {
  word: string;
  reading?: string;
  kana?: string;
}): VocabAudioPayload {
  const raw = (item.reading || item.kana || item.word || "").trim();
  // Strip brackets, furigana notations, and punctuation
  const stripped = raw.replace(/[\[\]\(\)（）\s]/g, "");
  // Convert standard Katakana to Hiragana (preserves 'ー' and extended katakana)
  const normalizedKana = katakanaToHiragana(stripped);

  // If this normalized reading matches a single mora kana slug, reuse it
  const kanaSlug = CHAR_TO_SLUG_MAP.get(normalizedKana);
  if (kanaSlug) {
    return {
      key: normalizedKana,
      src: `/audio/kana/${kanaSlug}.mp3`,
      ttsText: normalizedKana,
      lang: "ja-JP",
    };
  }

  const safeSlug = encodeURIComponent(normalizedKana);
  return {
    key: normalizedKana,
    src: `/audio/vocab/${safeSlug}.mp3`,
    ttsText: normalizedKana,
    lang: "ja-JP",
  };
}

export interface SentenceAudioPayload {
  key: string;
  ttsText: string;
  lang: "ja-JP";
  rate: number;
}

export type PlaybackSpeed = 0.75 | 1 | 1.25;

export interface StoryAudioSegment {
  index: number;
  paragraphIndex: number;
  sentenceIndex: number;
  id: string;
  rawJa: string;
  ttsText: string;
  src: string;
}

/**
 * Cleans Japanese sentences by stripping ruby annotations (<rt>, <rp>, <ruby>),
 * bracketed furigana (e.g. 漢字[かんじ] -> 漢字), markdown formatting (**bold**),
 * and excessive whitespace for natural TTS pronunciation.
 */
export function cleanSentenceForAudio(sentenceJa: string): string {
  if (!sentenceJa) return "";

  const cleaned = sentenceJa
    // Remove ruby pronunciation text first so only base characters remain
    .replace(/<rt[\s\S]*?<\/rt>/gi, "")
    .replace(/<rp[\s\S]*?<\/rp>/gi, "")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove bracketed furigana annotations: 漢字[かんじ] -> 漢字
    .replace(/\[[^\]]+\]/g, "")
    // Remove markdown bold / italic formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Resolves full audio payload for a Japanese sentence.
 */
export function resolveSentenceAudio(
  sentenceJa: string,
  id?: string
): SentenceAudioPayload {
  const cleaned = cleanSentenceForAudio(sentenceJa);
  return {
    key: id || cleaned,
    ttsText: cleaned,
    lang: "ja-JP",
    rate: 0.95,
  };
}

function splitJapaneseSentences(text: string): string[] {
  return (text.match(/[^。！？]+[。！？]?/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function buildStoryAudioQueue(story: {
  slug: string;
  paragraphs: Array<{
    sentences?: Array<{ ja: string }>;
    ja?: string;
  }>;
}): StoryAudioSegment[] {
  const queue: StoryAudioSegment[] = [];

  story.paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = paragraph.sentences?.length
      ? paragraph.sentences.map((sentence) => sentence.ja)
      : splitJapaneseSentences(paragraph.ja ?? "");

    sentences.forEach((rawJa, sentenceIndex) => {
      const { ttsText } = resolveSentenceAudio(rawJa);
      if (!ttsText) return;

      const index = queue.length;
      queue.push({
        index,
        paragraphIndex,
        sentenceIndex,
        id: `${story.slug}:${paragraphIndex}:${sentenceIndex}`,
        rawJa,
        ttsText,
        src: `/audio/stories/${encodeURIComponent(story.slug)}/${index}.mp3`,
      });
    });
  });

  return queue;
}
