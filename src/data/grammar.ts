export const grammarLevels = ["N5", "N4", "N3", "N2", "N1"] as const;
export type GrammarLevel = (typeof grammarLevels)[number];

export interface GrammarCloze {
  before: string;
  answer: string;
  after: string;
}

export interface GrammarExample {
  jp: string;
  ja: string;
  romaji: string;
  en: string;
  /** Scramble pills in correct order; empty when the sentence is unsuitable. */
  chunks: string[];
  /** Where the grammar point sits in the sentence; null when it cannot be located. */
  cloze: GrammarCloze | null;
}

export interface GrammarRecord {
  /** Stable id, e.g. "N5/a-ga-ichiban". */
  id: string;
  level: GrammarLevel;
  title: string;
  meaning: string;
  formation: string;
  examples: Array<Pick<GrammarExample, "ja" | "en">>;
}

export interface GrammarPoint extends GrammarRecord {
  slug: string;
  /** Japanese part of the title, e.g. "A が いちばん～". */
  pattern: string;
  romaji: string;
  short: string;
  long: string;
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

function readServerGrammar(level: GrammarLevel): GrammarPoint[] {
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const content = fs.readFileSync(path.resolve(process.cwd(), `public/data/v1/grammar/${level}.json`), "utf8");
  return (JSON.parse(content) as GrammarLevelFile).points;
}

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
    return readServerGrammar(level);
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
