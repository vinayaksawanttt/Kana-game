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
  naturalEn?: string;
  literalEn?: string;
  furigana?: string;
  /** Scramble pills in correct order; empty when the sentence is unsuitable. */
  chunks: string[];
  /** Where the grammar point sits in the sentence; null when it cannot be located. */
  cloze: GrammarCloze | null;
}

export interface GrammarUsageNotes {
  nuance: string;
  contrast: string;
  pitfalls: string;
}

export interface GrammarRecord {
  /** Stable id, e.g. "N5/a-ga-ichiban". */
  id: string;
  level: GrammarLevel;
  title: string;
  meaning: string;
  formation: string[];
  explanation: string;
  examples: Array<Pick<GrammarExample, "ja" | "en"> & Partial<Pick<GrammarExample, "furigana">>>;
  relatedPatterns?: string[];
  notes?: GrammarUsageNotes;
}

export interface GrammarPoint extends GrammarRecord {
  slug: string;
  /** Japanese part of the title, e.g. "A が いちばん～". */
  pattern: string;
  romaji: string;
  short: string;
  long: string;
  examples: GrammarExample[];
  notes?: GrammarUsageNotes;
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
  points: GrammarCatalogEntry[];
}

export interface GrammarCatalogEntry {
  id: string;
  slug: string;
  level: GrammarLevel;
  title: string;
  pattern: string;
  romaji: string;
  meaning: string;
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
let indexCache: Promise<GrammarIndex> | undefined;

function readServerGrammar(level: GrammarLevel): GrammarPoint[] {
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const content = fs.readFileSync(path.resolve(process.cwd(), `public/data/v1/grammar/${level}.json`), "utf8");
  return normalizeGrammarPoints((JSON.parse(content) as GrammarLevelFile).points);
}

/** Adapts older cached files to the current lesson schema. */
export function normalizeGrammarPoint(point: GrammarPoint): GrammarPoint {
  const legacyPoint = point as Omit<GrammarPoint, "formation" | "explanation"> & {
    formation?: string | string[];
    explanation?: string;
  };
  const formation = Array.isArray(legacyPoint.formation)
    ? legacyPoint.formation
    : typeof legacyPoint.formation === "string" && legacyPoint.formation.trim()
      ? [legacyPoint.formation.trim()]
      : [];

  return {
    ...legacyPoint,
    formation,
    explanation:
      typeof legacyPoint.explanation === "string" && legacyPoint.explanation.trim()
        ? legacyPoint.explanation
        : legacyPoint.long || legacyPoint.meaning || legacyPoint.short || "",
    examples: Array.isArray(legacyPoint.examples) ? legacyPoint.examples : [],
  };
}

function normalizeGrammarPoints(points: GrammarPoint[]): GrammarPoint[] {
  return points.map(normalizeGrammarPoint);
}

function toCatalogEntry(point: GrammarPoint): GrammarCatalogEntry {
  return {
    id: point.id,
    slug: point.slug,
    level: point.level,
    title: point.title,
    pattern: point.pattern,
    romaji: point.romaji,
    meaning: point.meaning,
  };
}

function canUseBrowserFetch(): boolean {
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

export function clearGrammarCache(): void {
  levelCache.clear();
  indexCache = undefined;
}

function readServerGrammarIndex(): GrammarIndex {
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const content = fs.readFileSync(path.resolve(process.cwd(), "public/data/v1/grammar/index.json"), "utf8");
  return JSON.parse(content) as GrammarIndex;
}

/** Loads the compact grammar catalog used for library and lesson navigation. */
export function getGrammarIndex(): Promise<GrammarIndex> {
  if (indexCache) return indexCache;

  indexCache = (async (): Promise<GrammarIndex> => {
    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch("/data/v1/grammar/index.json", {
        cache: "no-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch grammar index (${response.status})`);
      }
      const index = (await response.json()) as Partial<GrammarIndex>;
      if (Array.isArray(index.points)) return index as GrammarIndex;

      const legacyPoints = await loadGrammarData(grammarLevels);
      return {
        ...index,
        total: index.total ?? legacyPoints.length,
        points: legacyPoints.map(toCatalogEntry),
      } as GrammarIndex;
    }
    const index = readServerGrammarIndex() as Partial<GrammarIndex>;
    if (Array.isArray(index.points)) return index as GrammarIndex;
    const legacyPoints = await loadGrammarData(grammarLevels);
    return {
      ...index,
      total: index.total ?? legacyPoints.length,
      points: legacyPoints.map(toCatalogEntry),
    } as GrammarIndex;
  })().catch((error: unknown) => {
    indexCache = undefined;
    throw error;
  });

  return indexCache;
}

/** Loads one level's static grammar file (`/data/v1/grammar/<level>.json`), cached per level. */
export function getGrammarByLevel(level: GrammarLevel): Promise<GrammarPoint[]> {
  const cached = levelCache.get(level);
  if (cached) return cached;

  const request = (async (): Promise<GrammarPoint[]> => {
    if (canUseBrowserFetch()) {
      const response = await globalThis.fetch(`/data/v1/grammar/${level}.json`, {
        cache: "no-cache",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch grammar data for ${level} (${response.status})`);
      }
      return normalizeGrammarPoints(((await response.json()) as GrammarLevelFile).points);
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
