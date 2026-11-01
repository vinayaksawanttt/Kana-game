/**
 * Pure TypeScript Japanese Morphological & Reverse-Keyword Analyzer Engine.
 * Zero React or DOM imports.
 */
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import type {
  DictionaryDataMaps,
  DictionaryKanjiRecord,
  DictionarySentenceRecord,
  DictionaryVocabRecord,
} from "../data/dictionary";

export type AnalyzerInputType = "japanese" | "english";

export interface AnalyzedToken {
  surface: string;
  reading: string;
  pos: string;
  posLabel: string;
  baseForm: string;
  jlptLevel?: string;
  meaning?: string;
  romaji?: string;
  isWord: boolean;
}

export interface JapaneseAnalysisResult {
  type: "japanese";
  query: string;
  tokens: AnalyzedToken[];
  kanji: DictionaryKanjiRecord[];
  vocab: DictionaryVocabRecord[];
  sentences: DictionarySentenceRecord[];
}

export interface EnglishSearchResult {
  type: "english";
  query: string;
  kanji: DictionaryKanjiRecord[];
  vocab: DictionaryVocabRecord[];
  sentences: DictionarySentenceRecord[];
}

export type DictionaryAnalysisResult = JapaneseAnalysisResult | EnglishSearchResult;

const JAPANESE_CHAR_REGEX = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/;
const KANJI_GLOBAL_REGEX = /[\u4e00-\u9faf]/g;

const POS_LABELS: Record<string, string> = {
  名詞: "Noun",
  動詞: "Verb",
  形容詞: "i-Adjective",
  形状詞: "na-Adjective",
  副詞: "Adverb",
  助詞: "Particle",
  助動詞: "Auxiliary Verb",
  連体詞: "Pre-noun Adjectival",
  接続詞: "Conjunction",
  感動詞: "Interjection",
  接頭詞: "Prefix",
  記号: "Symbol",
  フィラー: "Filler",
};

/**
 * Converts Katakana characters (e.g. タベル) into Hiragana (たべる) for clean <ruby> rendering.
 */
export function katakanaToHiragana(input: string): string {
  let result = "";
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    if (code >= 0x30a1 && code <= 0x30f6) {
      result += String.fromCharCode(code - 0x60);
    } else {
      result += input[i];
    }
  }
  return result;
}

/**
 * Detects whether the user query contains Japanese script or is an English keyword query.
 */
export function detectInputLanguage(input: string): AnalyzerInputType {
  return JAPANESE_CHAR_REGEX.test(input) ? "japanese" : "english";
}

/**
 * Extracts all unique Kanji characters from a string using `/[\u4e00-\u9faf]/g`
 * and maps them to their JLPT/Grade dictionary records.
 */
export function extractKanjiFromText(
  input: string,
  dataMaps: DictionaryDataMaps
): DictionaryKanjiRecord[] {
  const matches = input.match(KANJI_GLOBAL_REGEX);
  if (!matches) return [];
  const uniqueChars = [...new Set(matches)];
  const records: DictionaryKanjiRecord[] = [];
  for (const ch of uniqueChars) {
    const record = dataMaps.index.kanji[ch];
    if (record) {
      records.push(record);
    }
  }
  return records;
}

/**
 * Singleton service that initializes and caches the Kuromoji morphological tokenizer.
 */
export class KuromojiService {
  private static tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;
  private static loadingPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;
  private static customDicPath: string | null = null;

  static setDictionaryPath(dicPath: string | null): void {
    this.customDicPath = dicPath;
  }

  static reset(): void {
    this.tokenizerInstance = null;
    this.loadingPromise = null;
  }

  static isReady(): boolean {
    return this.tokenizerInstance !== null;
  }

  private static resolveDefaultDicPath(): string {
    if (this.customDicPath) return this.customDicPath;
    if (typeof process !== "undefined" && process.env?.VITEST) {
      return `${process.cwd()}/public/dict/`;
    }
    if (typeof window !== "undefined") {
      return "/dict/";
    }
    return `${process.cwd()}/public/dict/`;
  }

  static getTokenizer(dicPath?: string): Promise<Tokenizer<IpadicFeatures>> {
    if (this.tokenizerInstance) {
      return Promise.resolve(this.tokenizerInstance);
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    const resolvedPath = dicPath ?? this.resolveDefaultDicPath();
    this.loadingPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
      try {
        kuromoji.builder({ dicPath: resolvedPath }).build((err, tokenizer) => {
          if (err || !tokenizer) {
            this.loadingPromise = null;
            reject(err ?? new Error("Failed to initialize Kuromoji tokenizer."));
            return;
          }
          this.tokenizerInstance = tokenizer;
          resolve(tokenizer);
        });
      } catch (error) {
        this.loadingPromise = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return this.loadingPromise;
  }
}

function stemEnglishKeyword(raw: string): string {
  const word = raw.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ing") && word.length > 5) {
    const base = word.slice(0, -3);
    if (
      base.length >= 3 &&
      base[base.length - 1] === base[base.length - 2] &&
      !"aeiou".includes(base[base.length - 1])
    ) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (word.endsWith("ed") && word.length > 4) {
    const base = word.slice(0, -2);
    if (
      base.length >= 3 &&
      base[base.length - 1] === base[base.length - 2] &&
      !"aeiou".includes(base[base.length - 1])
    ) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (word.endsWith("es") && word.length > 4 && /(ches|shes|xes|zes|sses)$/.test(word)) {
    return word.slice(0, -2);
  }
  if (
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is") &&
    word.length > 3
  ) {
    return word.slice(0, -1);
  }
  return word;
}

function fallbackSegmentJapanese(input: string, dataMaps: DictionaryDataMaps): AnalyzedToken[] {
  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter("ja", { granularity: "word" })
      : null;

  if (!segmenter) {
    return [
      {
        surface: input,
        reading: "",
        pos: "名詞",
        posLabel: "Term",
        baseForm: input,
        isWord: true,
      },
    ];
  }

  const tokens: AnalyzedToken[] = [];
  for (const part of segmenter.segment(input)) {
    const surface = part.segment;
    const vocab = dataMaps.vocabByWord.get(surface) ?? dataMaps.vocabByReading.get(surface);
    tokens.push({
      surface,
      reading: vocab ? vocab.reading : "",
      pos: vocab?.pos[0] ?? (part.isWordLike ? "名詞" : "記号"),
      posLabel: part.isWordLike ? "Word" : "Symbol",
      baseForm: vocab?.word ?? surface,
      jlptLevel: vocab?.level,
      meaning: vocab?.meanings.join(", "),
      romaji: vocab?.romaji,
      isWord: Boolean(part.isWordLike),
    });
  }
  return tokens;
}

/**
 * Runs Japanese text through Kuromoji, returning morphological tokens with furigana readings,
 * base forms, JLPT level / meanings, and extracted Kanji cards.
 */
export async function analyzeJapanese(
  input: string,
  dataMaps: DictionaryDataMaps
): Promise<JapaneseAnalysisResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      type: "japanese",
      query: "",
      tokens: [],
      kanji: [],
      vocab: [],
      sentences: [],
    };
  }

  let tokens: AnalyzedToken[] = [];

  try {
    const tokenizer = await KuromojiService.getTokenizer();
    const rawTokens = tokenizer.tokenize(trimmed);

    tokens = rawTokens.map((t) => {
      const surface = t.surface_form;
      const baseForm = t.basic_form && t.basic_form !== "*" ? t.basic_form : surface;
      const rawReading = t.reading && t.reading !== "*" ? katakanaToHiragana(t.reading) : "";

      const matchedVocab =
        dataMaps.vocabByWord.get(baseForm) ??
        dataMaps.vocabByWord.get(surface) ??
        (rawReading ? dataMaps.vocabByReading.get(rawReading) : undefined);

      const reading = rawReading || matchedVocab?.reading || "";
      const singleKanji = surface.length === 1 ? dataMaps.index.kanji[surface] : undefined;

      const jlptLevel =
        matchedVocab?.level ?? (singleKanji ? `N${singleKanji.jlpt}` : undefined);
      const meaning =
        matchedVocab?.meanings.join(", ") ??
        (singleKanji ? singleKanji.meanings.join(", ") : undefined);

      const isSymbol = t.pos === "記号" || /^[\s、。！？「」『』（）・…]+$/.test(surface);

      return {
        surface,
        reading: reading !== surface ? reading : "",
        pos: t.pos,
        posLabel: POS_LABELS[t.pos] ?? t.pos,
        baseForm,
        ...(jlptLevel ? { jlptLevel } : {}),
        ...(meaning ? { meaning } : {}),
        ...(matchedVocab?.romaji ? { romaji: matchedVocab.romaji } : {}),
        isWord: !isSymbol,
      };
    });
  } catch {
    tokens = fallbackSegmentJapanese(trimmed, dataMaps);
  }

  const kanji = extractKanjiFromText(trimmed, dataMaps);

  // Collect matching vocabulary words referenced in the input
  const vocabMatches: DictionaryVocabRecord[] = [];
  const seenVocabIds = new Set<string>();
  for (const token of tokens) {
    if (!token.isWord) continue;
    const entry =
      dataMaps.vocabByWord.get(token.baseForm) ?? dataMaps.vocabByWord.get(token.surface);
    if (entry && !seenVocabIds.has(entry.id)) {
      seenVocabIds.add(entry.id);
      vocabMatches.push(entry);
    }
  }

  // Collect up to 3 demo sentences containing the queried word/kanji
  const demoSentences: DictionarySentenceRecord[] = [];
  for (const sentence of dataMaps.index.sentences) {
    if (
      sentence.key === trimmed ||
      sentence.jp.includes(trimmed) ||
      (vocabMatches[0] && sentence.jp.includes(vocabMatches[0].word))
    ) {
      demoSentences.push(sentence);
      if (demoSentences.length >= 3) break;
    }
  }

  return {
    type: "japanese",
    query: trimmed,
    tokens,
    kanji,
    vocab: vocabMatches,
    sentences: demoSentences,
  };
}

/**
 * Searches the pre-built dictionary index and vocabulary/kanji lists for an English keyword,
 * returning matching kanji, vocabulary words, and up to 3 relevant demo sentences.
 */
export function searchEnglishKeyword(
  keyword: string,
  dataMaps: DictionaryDataMaps
): EnglishSearchResult {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      type: "english",
      query: "",
      kanji: [],
      vocab: [],
      sentences: [],
    };
  }

  const normalizedQuery = trimmed
    .toLowerCase()
    .replace(/^to\s+/, "")
    .trim();
  const queryWords = normalizedQuery
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 2);
  const queryStems = [
    ...new Set([
      ...queryWords,
      ...queryWords.map(stemEnglishKeyword),
    ]),
  ].filter(Boolean);

  const kanjiScores = new Map<string, number>();
  const vocabScores = new Map<number, number>();
  const sentenceScores = new Map<number, number>();

  // 1. Fast lookup from pre-built reverse index
  for (const stem of queryStems) {
    const bucket = dataMaps.index.keywords[stem];
    if (!bucket) continue;

    for (const ch of bucket.k ?? []) {
      kanjiScores.set(ch, (kanjiScores.get(ch) ?? 0) + 2);
    }
    for (const vIdx of bucket.v ?? []) {
      vocabScores.set(vIdx, (vocabScores.get(vIdx) ?? 0) + 2);
    }
    for (const sIdx of bucket.s ?? []) {
      sentenceScores.set(sIdx, (sentenceScores.get(sIdx) ?? 0) + 2);
    }
  }

  // 2. Boost exact/prefix meaning matches across kanji and vocabulary
  for (const [ch, record] of Object.entries(dataMaps.index.kanji)) {
    for (const m of record.meanings) {
      const lower = m.toLowerCase();
      if (lower === normalizedQuery) {
        kanjiScores.set(ch, (kanjiScores.get(ch) ?? 0) + 10);
      } else if (lower.startsWith(normalizedQuery)) {
        kanjiScores.set(ch, (kanjiScores.get(ch) ?? 0) + 4);
      }
    }
  }

  for (let i = 0; i < dataMaps.index.vocab.length; i += 1) {
    const entry = dataMaps.index.vocab[i];
    for (const m of entry.meanings) {
      const lower = m.toLowerCase().replace(/^to\s+/, "");
      if (lower === normalizedQuery || m.toLowerCase() === trimmed.toLowerCase()) {
        vocabScores.set(i, (vocabScores.get(i) ?? 0) + 10);
      } else if (lower.startsWith(normalizedQuery)) {
        vocabScores.set(i, (vocabScores.get(i) ?? 0) + 4);
      }
    }
  }

  const matchedKanji = [...kanjiScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([ch]) => dataMaps.index.kanji[ch])
    .filter((item): item is DictionaryKanjiRecord => Boolean(item));

  const matchedVocab = [...vocabScores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 12)
    .map(([idx]) => dataMaps.index.vocab[idx])
    .filter((item): item is DictionaryVocabRecord => Boolean(item));

  // 3. Pick up to 3 relevant demo sentences (preferring sentences that also use matched vocab/kanji)
  const topWords = new Set(matchedVocab.slice(0, 5).map((v) => v.word));
  const topKanji = new Set(matchedKanji.slice(0, 5).map((k) => k.c));

  for (const [sIdx, baseScore] of sentenceScores.entries()) {
    const sent = dataMaps.index.sentences[sIdx];
    if (!sent) continue;
    let bonus = 0;
    if (topWords.has(sent.key)) bonus += 6;
    for (const w of topWords) {
      if (sent.jp.includes(w)) {
        bonus += 3;
        break;
      }
    }
    for (const k of topKanji) {
      if (sent.jp.includes(k)) {
        bonus += 1;
        break;
      }
    }
    sentenceScores.set(sIdx, baseScore + bonus);
  }

  // Fallback if no sentences were in the stem bucket: scan for sentences containing top matched vocab
  if (sentenceScores.size === 0 && (topWords.size > 0 || topKanji.size > 0)) {
    for (let i = 0; i < dataMaps.index.sentences.length; i += 1) {
      const sent = dataMaps.index.sentences[i];
      if (topWords.has(sent.key)) {
        sentenceScores.set(i, 5);
        if (sentenceScores.size >= 6) break;
      }
    }
  }

  const matchedSentences = [...sentenceScores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([idx]) => dataMaps.index.sentences[idx])
    .filter((item): item is DictionarySentenceRecord => Boolean(item));

  return {
    type: "english",
    query: trimmed,
    kanji: matchedKanji,
    vocab: matchedVocab,
    sentences: matchedSentences,
  };
}

