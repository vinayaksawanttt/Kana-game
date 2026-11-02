import { type KanjiLevel, kanjiLevels, toKanjiLevel } from "@/data/kanji";

export interface KanjiStrokeData {
  kanji: string;
  paths: string[];
  markers: { x: number; y: number }[];
}

const levelStrokeCache = new Map<KanjiLevel, Promise<KanjiStrokeData[]>>();
const kanjiStrokeMapCache = new Map<KanjiLevel, Promise<Map<string, KanjiStrokeData>>>();

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

export function clearStrokesCache(): void {
  levelStrokeCache.clear();
  kanjiStrokeMapCache.clear();
}

export function getStrokesByLevel(level: KanjiLevel): Promise<KanjiStrokeData[]> {
  const cached = levelStrokeCache.get(level);
  if (cached) return cached;

  const request = (async (): Promise<KanjiStrokeData[]> => {
    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch(`/data/v1/strokes/${level}.json`, {
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch stroke data for ${level} (${response.status})`);
      }
      return (await response.json()) as KanjiStrokeData[];
    }
    return readServerJson(`public/data/v1/strokes/${level}.json`) as KanjiStrokeData[];
  })().catch((error: unknown) => {
    levelStrokeCache.delete(level);
    throw error;
  });

  levelStrokeCache.set(level, request);
  return request;
}

function getStrokeMapByLevel(level: KanjiLevel): Promise<Map<string, KanjiStrokeData>> {
  const cached = kanjiStrokeMapCache.get(level);
  if (cached) return cached;

  const request = getStrokesByLevel(level).then((records) => {
    const map = new Map<string, KanjiStrokeData>();
    for (const record of records) {
      map.set(record.kanji, record);
    }
    return map;
  });

  kanjiStrokeMapCache.set(level, request);
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

export async function getKanjiStrokeData(
  kanji: string,
  levelHint?: KanjiLevel | number | null
): Promise<KanjiStrokeData | null> {
  if (!kanji) return null;

  const preferredLevel = normalizeLevelHint(levelHint);
  if (preferredLevel) {
    const map = await getStrokeMapByLevel(preferredLevel);
    const hit = map.get(kanji);
    if (hit) return hit;
  }

  for (const level of kanjiLevels) {
    if (level === preferredLevel) continue;
    const map = await getStrokeMapByLevel(level);
    const hit = map.get(kanji);
    if (hit) return hit;
  }

  return null;
}

