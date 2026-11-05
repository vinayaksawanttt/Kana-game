import { getDictionaryIndexFromCache } from "@/lib/srs/cacheDb";

export interface DictionaryKanjiRecord {
  c: string;
  jlpt: number;
  grade: number;
  label: string;
  meanings: string[];
  on: string[];
  kun: string[];
  strokes: number;
}

export interface DictionaryVocabRecord {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  level: string;
  pos: string[];
}

export interface DictionarySentenceRecord {
  id: number;
  jp: string;
  romaji: string;
  en: string;
  key: string;
}

export interface DictionaryKeywordBucket {
  k?: string[];
  v?: number[];
  s?: number[];
}

export interface DictionaryIndexData {
  version: "v1";
  kanji: Record<string, DictionaryKanjiRecord>;
  vocab: DictionaryVocabRecord[];
  sentences: DictionarySentenceRecord[];
  keywords: Record<string, DictionaryKeywordBucket>;
}

export interface DictionaryDataMaps {
  index: DictionaryIndexData;
  vocabByWord: Map<string, DictionaryVocabRecord>;
  vocabByReading: Map<string, DictionaryVocabRecord>;
}

let cachedDataMaps: Promise<DictionaryDataMaps> | null = null;

function isMockedFetch(): boolean {
  return (
    typeof globalThis.fetch === "function" &&
    ("mock" in globalThis.fetch || "_isMockFunction" in globalThis.fetch)
  );
}

function canUseBrowserFetch(): boolean {
  if (isMockedFetch()) return true;
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

export function buildDictionaryDataMaps(index: DictionaryIndexData): DictionaryDataMaps {
  const vocabByWord = new Map<string, DictionaryVocabRecord>();
  const vocabByReading = new Map<string, DictionaryVocabRecord>();

  for (const entry of index.vocab) {
    if (!vocabByWord.has(entry.word)) {
      vocabByWord.set(entry.word, entry);
    }
    if (!vocabByReading.has(entry.reading)) {
      vocabByReading.set(entry.reading, entry);
    }
  }

  return {
    index,
    vocabByWord,
    vocabByReading,
  };
}

export function clearDictionaryCache(): void {
  cachedDataMaps = null;
}

export function loadDictionaryDataMaps(): Promise<DictionaryDataMaps> {
  if (cachedDataMaps) return cachedDataMaps;

  cachedDataMaps = (async (): Promise<DictionaryDataMaps> => {
    let rawIndex: DictionaryIndexData;
    if (typeof window !== "undefined") {
      const cached = await getDictionaryIndexFromCache<DictionaryIndexData>().catch(() => null);
      if (cached) {
        return buildDictionaryDataMaps(cached);
      }
    }

    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch("/data/v1/dictionary-index.json", {
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch dictionary index (${response.status})`);
      }
      rawIndex = (await response.json()) as DictionaryIndexData;
    } else {
      const fs = eval("require")("node:fs");
      const path = eval("require")("node:path");
      const content = fs.readFileSync(path.resolve(process.cwd(), "public/data/v1/dictionary-index.json"), "utf8");
      rawIndex = JSON.parse(content) as DictionaryIndexData;
    }
    return buildDictionaryDataMaps(rawIndex);
  })().catch((error: unknown) => {
    cachedDataMaps = null;
    throw error;
  });

  return cachedDataMaps;
}

