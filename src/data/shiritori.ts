import { buildShiritoriDictionary, type ShiritoriDictionary, type ShiritoriLevel, type ShiritoriWord } from "@/engine/shiritori";

export type { ShiritoriLevel, ShiritoriWord };

let cached: Promise<ShiritoriDictionary> | null = null;

function canFetch(): boolean {
  if (typeof globalThis.fetch === "function" && ("mock" in globalThis.fetch || "_isMockFunction" in globalThis.fetch)) return true;
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

async function readWordRows(): Promise<unknown> {
  if (canFetch()) {
    const response = await globalThis.fetch("/data/v1/shiritori/words.json", { cache: "force-cache" });
    if (!response.ok) throw new Error(`Failed to load Shiritori words (${response.status})`);
    return response.json();
  }
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const file = path.resolve(process.cwd(), "public/data/v1/shiritori/words.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
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
    cached = readWordRows().then((data) => {
      if (!Array.isArray(data)) throw new Error("Shiritori word data is not a JSON array.");
      const words = data.filter(isShiritoriWord);
      if (!words.length) throw new Error("No valid Shiritori words were found.");
      return buildShiritoriDictionary(words);
    }).catch((error: unknown) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}
