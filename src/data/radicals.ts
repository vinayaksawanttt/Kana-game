export interface RadicalRecord {
  character: string;
  meaning: string;
  reading: string;
  kanjiCount: number;
}

export type RadicalIndex = Record<string, string[]>;

export interface RadicalExampleRecord {
  jp: string;
  romaji: string;
  en: string;
}

export type RadicalExamples = Record<string, RadicalExampleRecord[]>;

interface RadicalPayload {
  version: "v1";
  radicals: RadicalRecord[];
}

let radicalsCache: Promise<RadicalRecord[]> | null = null;
let indexCache: Promise<RadicalIndex> | null = null;
let examplesCache: Promise<RadicalExamples> | null = null;
let reverseKanjiRadicalsCache: Promise<Map<string, RadicalRecord[]>> | null = null;

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

function readPublicJson<T>(relativePath: string): T {
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const content = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
  return JSON.parse(content) as T;
}

async function loadJson<T>(path: string): Promise<T> {
  if (canUseBrowserFetch()) {
    const response = await globalThis.fetch(path, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Failed to fetch radical data (${response.status}): ${path}`);
    }
    return (await response.json()) as T;
  }
  return readPublicJson<T>(`public${path}`);
}

export function clearRadicalDataCache(): void {
  radicalsCache = null;
  indexCache = null;
  examplesCache = null;
  reverseKanjiRadicalsCache = null;
}

export function loadRadicals(): Promise<RadicalRecord[]> {
  radicalsCache ??= loadJson<RadicalPayload>("/data/v1/radicals/list.json")
    .then((payload) => {
      if (payload.version !== "v1" || !Array.isArray(payload.radicals)) {
        throw new Error("Invalid radical list data.");
      }
      return payload.radicals;
    })
    .catch((error: unknown) => {
      radicalsCache = null;
      throw error;
    });
  return radicalsCache;
}

export function loadRadicalIndex(): Promise<RadicalIndex> {
  indexCache ??= loadJson<RadicalIndex>("/data/v1/radicals/index.json").catch(
    (error: unknown) => {
      indexCache = null;
      throw error;
    }
  );
  return indexCache;
}

export function loadRadicalExamples(): Promise<RadicalExamples> {
  examplesCache ??= loadJson<RadicalExamples>("/data/v1/radicals/examples.json").catch(
    (error: unknown) => {
      examplesCache = null;
      throw error;
    }
  );
  return examplesCache;
}

export async function getRadicalsForKanji(kanji: string): Promise<RadicalRecord[]> {
  if (!kanji) return [];

  reverseKanjiRadicalsCache ??= Promise.all([loadRadicals(), loadRadicalIndex()])
    .then(([radicals, index]) => {
      const radicalByChar = new Map<string, RadicalRecord>();
      for (const rad of radicals) {
        radicalByChar.set(rad.character, rad);
      }

      const byKanji = new Map<string, RadicalRecord[]>();
      for (const [radChar, kanjiList] of Object.entries(index)) {
        const radRecord = radicalByChar.get(radChar);
        if (!radRecord) continue;
        for (const k of kanjiList) {
          let list = byKanji.get(k);
          if (!list) {
            list = [];
            byKanji.set(k, list);
          }
          list.push(radRecord);
        }
      }
      return byKanji;
    })
    .catch((error: unknown) => {
      reverseKanjiRadicalsCache = null;
      throw error;
    });

  const map = await reverseKanjiRadicalsCache;
  return map.get(kanji) ?? [];
}
