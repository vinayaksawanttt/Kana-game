import { type KanjiLevel, kanjiLevels, toKanjiLevel } from "@/data/kanji";

export interface KanjiCompositeItem {
  word: string;
  reading: string;
  meaning: string;
  jlpt: number;
}

export interface KanjiCompositeData {
  kanji: string;
  composites: KanjiCompositeItem[];
}

const levelCompositeCache = new Map<KanjiLevel, Promise<KanjiCompositeData[]>>();
const kanjiCompositeMapCache = new Map<KanjiLevel, Promise<Map<string, KanjiCompositeData>>>();

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

function readServerJson(relativePath: string): unknown {
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const content = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
  return JSON.parse(content);
}

export function clearKanjiVocabCache(): void {
  levelCompositeCache.clear();
  kanjiCompositeMapCache.clear();
}

export function getKanjiVocabByLevel(level: KanjiLevel): Promise<KanjiCompositeData[]> {
  const cached = levelCompositeCache.get(level);
  if (cached) return cached;

  const request = (async (): Promise<KanjiCompositeData[]> => {
    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch(`/data/v1/kanji-vocab/${level}.json`, {
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch kanji-vocab data for ${level} (${response.status})`);
      }
      return (await response.json()) as KanjiCompositeData[];
    }
    return readServerJson(`public/data/v1/kanji-vocab/${level}.json`) as KanjiCompositeData[];
  })().catch((error: unknown) => {
    levelCompositeCache.delete(level);
    throw error;
  });

  levelCompositeCache.set(level, request);
  return request;
}

function getCompositeMapByLevel(
  level: KanjiLevel
): Promise<Map<string, KanjiCompositeData>> {
  const cached = kanjiCompositeMapCache.get(level);
  if (cached) return cached;

  const request = getKanjiVocabByLevel(level).then((records) => {
    const map = new Map<string, KanjiCompositeData>();
    for (const record of records) {
      map.set(record.kanji, record);
    }
    return map;
  });

  kanjiCompositeMapCache.set(level, request);
  return request;
}

function normalizeLevelHint(levelHint?: KanjiLevel | number | null): KanjiLevel | null {
  if (!levelHint) return null;
  if (typeof levelHint === "number") {
    try {
      return toKanjiLevel(levelHint);
    } catch {
      return null;
    }
  }
  if ((kanjiLevels as readonly string[]).includes(levelHint)) {
    return levelHint;
  }
  return null;
}

export async function getKanjiComposites(
  kanji: string,
  levelHint?: KanjiLevel | number | null
): Promise<KanjiCompositeItem[]> {
  if (!kanji) return [];

  const preferredLevel = normalizeLevelHint(levelHint);
  if (preferredLevel) {
    const map = await getCompositeMapByLevel(preferredLevel);
    const hit = map.get(kanji);
    if (hit) return hit.composites;
  }

  for (const level of kanjiLevels) {
    if (level === preferredLevel) continue;
    const map = await getCompositeMapByLevel(level);
    const hit = map.get(kanji);
    if (hit) return hit.composites;
  }

  return [];
}

