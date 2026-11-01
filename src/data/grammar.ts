export const grammarLevels = ["N5", "N4", "N3", "N2", "N1"] as const;
export type GrammarLevel = (typeof grammarLevels)[number];

export interface GrammarCloze {
  before: string;
  answer: string;
  after: string;
}

export interface GrammarExample {
  jp: string;
  romaji: string;
  en: string;
  /** Scramble pills in correct order; empty when the sentence is unsuitable. */
  chunks: string[];
  /** Where the grammar point sits in the sentence; null when it cannot be located. */
  cloze: GrammarCloze | null;
}

export interface GrammarPoint {
  /** Stable id, e.g. "N5/a-ga-ichiban". */
  id: string;
  slug: string;
  level: GrammarLevel;
  title: string;
  /** Japanese part of the title, e.g. "A が いちばん～". */
  pattern: string;
  romaji: string;
  short: string;
  long: string;
  formation: string;
  examples: GrammarExample[];
}

export interface GrammarLevelFile {
  version: "v1";
  level: GrammarLevel;
  points: GrammarPoint[];
}

export interface GrammarIndex {
  version: "v1";
  total: number;
  levels: Record<GrammarLevel, { points: number; cloze: number; scramble: number }>;
}

export function isGrammarLevel(value: string): value is GrammarLevel {
  return (grammarLevels as readonly string[]).includes(value);
}

export function grammarId(level: GrammarLevel, slug: string): string {
  return `${level}/${slug}`;
}

export function parseGrammarId(id: string): { level: GrammarLevel; slug: string } | null {
  const [level, slug] = id.split("/");
  return level && slug && isGrammarLevel(level) ? { level, slug } : null;
}

export function grammarGuideHref(id: string): string {
  const parsed = parseGrammarId(id);
  return parsed ? `/grammar/${parsed.level}/${parsed.slug}` : "/grammar";
}

const levelCache = new Map<GrammarLevel, Promise<GrammarPoint[]>>();

const fallbackLoaders: Record<GrammarLevel, () => Promise<{ default: unknown }>> = {
  N5: () => import("../../public/data/v1/grammar/N5.json"),
  N4: () => import("../../public/data/v1/grammar/N4.json"),
  N3: () => import("../../public/data/v1/grammar/N3.json"),
  N2: () => import("../../public/data/v1/grammar/N2.json"),
  N1: () => import("../../public/data/v1/grammar/N1.json"),
};

function canUseBrowserFetch(): boolean {
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

export function clearGrammarCache(): void {
  levelCache.clear();
}

/** Loads one level's static grammar file (`/data/v1/grammar/<level>.json`), cached per level. */
export function getGrammarByLevel(level: GrammarLevel): Promise<GrammarPoint[]> {
  const cached = levelCache.get(level);
  if (cached) return cached;

  const request = (async (): Promise<GrammarPoint[]> => {
    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch(`/data/v1/grammar/${level}.json`, {
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch grammar data for ${level} (${response.status})`);
      }
      return ((await response.json()) as GrammarLevelFile).points;
    }
    const mod = await fallbackLoaders[level]();
    return (mod.default as GrammarLevelFile).points;
  })().catch((error: unknown) => {
    levelCache.delete(level);
    throw error;
  });

  levelCache.set(level, request);
  return request;
}

export async function loadGrammarData(levels: readonly GrammarLevel[]): Promise<GrammarPoint[]> {
  const unique = [...new Set(levels)];
  const perLevel = await Promise.all(unique.map((level) => getGrammarByLevel(level)));
  return perLevel.flat();
}

