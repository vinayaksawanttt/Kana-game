import { buildShiritoriDictionary, type ShiritoriDictionary, type ShiritoriLevel, type ShiritoriWord } from "@/engine/shiritori";
import { getShiritoriWordsFromCache } from "@/lib/srs/cacheDb";

export type { ShiritoriLevel, ShiritoriWord };

let cached: Promise<ShiritoriDictionary> | null = null;

function canFetch(): boolean {
  if (typeof globalThis.fetch === "function" && ("mock" in globalThis.fetch || "_isMockFunction" in globalThis.fetch)) return true;
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

async function readShiritoriData(): Promise<{ words: unknown; validReadings: Record<string, string> }> {
  if (typeof window !== "undefined") {
    const cachedWords = await getShiritoriWordsFromCache().catch(() => null);
    if (cachedWords && cachedWords.length > 0) {
      const validRes = await globalThis.fetch("/data/v1/shiritori/valid-readings.json", { cache: "force-cache" }).catch(() => null);
      const validReadings = (validRes && validRes.ok ? await validRes.json() : {}) as Record<string, string>;
      return { words: cachedWords, validReadings };
    }
  }

  if (canFetch()) {
    const [wordsRes, validRes] = await Promise.all([
      globalThis.fetch("/data/v1/shiritori/words.json", { cache: "force-cache" }),
      globalThis.fetch("/data/v1/shiritori/valid-readings.json", { cache: "force-cache" }).catch(() => null),
    ]);
    if (!wordsRes.ok) throw new Error(`Failed to load Shiritori words (${wordsRes.status})`);
    const words = await wordsRes.json();
    const validReadings = (validRes && validRes.ok ? await validRes.json() : {}) as Record<string, string>;
    return { words, validReadings };
  }
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const wordsFile = path.resolve(process.cwd(), "public/data/v1/shiritori/words.json");
  const validFile = path.resolve(process.cwd(), "public/data/v1/shiritori/valid-readings.json");
  const words = JSON.parse(fs.readFileSync(wordsFile, "utf8")) as unknown;
  let validReadings: Record<string, string> = {};
  if (fs.existsSync(validFile)) {
    try {
      validReadings = JSON.parse(fs.readFileSync(validFile, "utf8")) as Record<string, string>;
    } catch {
      validReadings = {};
    }
  }
  return { words, validReadings };
}

function isShiritoriWord(value: unknown): value is ShiritoriWord {
  if (typeof value !== "object" || value === null) return false;
  const word = value as Partial<ShiritoriWord>;
  return typeof word.id === "string" && typeof word.word === "string" &&
    typeof word.kana === "string" && typeof word.romaji === "string" &&
    typeof word.meaning === "string" && [1, 2, 3, 4, 5].includes(word.jlpt as number) &&
    typeof word.startKana === "string" && typeof word.endKana === "string";
}

export function loadShiritoriData(): Promise<ShiritoriDictionary> {
  if (!cached) {
    cached = readShiritoriData().then(({ words: data, validReadings }) => {
      if (!Array.isArray(data)) throw new Error("Shiritori word data is not a JSON array.");
      const words = data.filter(isShiritoriWord);
      if (!words.length) throw new Error("No valid Shiritori words were found.");
      return buildShiritoriDictionary(words, validReadings);
    }).catch((error: unknown) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}
