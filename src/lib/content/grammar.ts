import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import {
  getGrammarByLevel,
  getGrammarIndex,
  grammarLevels,
  isGrammarLevel,
  loadGrammarData,
  parseGrammarId,
  type GrammarExample,
  type GrammarLevel,
  type GrammarCatalogEntry,
  type GrammarPoint,
} from "@/data/grammar";

export interface GrammarDocFrontmatter {
  id: string;
  slug: string;
  level: GrammarLevel;
  title: string;
  pattern: string;
  romaji: string;
  meaning: string;
  explanation: string;
  short: string;
  formation: string[];
  notes?: {
    nuance: string;
    contrast: string;
    pitfalls: string;
  };
}

export interface GrammarDoc {
  point: GrammarPoint;
  frontmatter: GrammarDocFrontmatter;
  content: string;
  mdxSource: MDXRemoteSerializeResult;
}

/**
 * Formats a `GrammarPoint` into a frontmatter + Markdown document suitable for
 * `gray-matter` extraction and `next-mdx-remote` serialization.
 */
export function buildGrammarMarkdown(point: GrammarPoint): string {
  const examplesMd = point.examples
    .map(
      (ex: GrammarExample, idx: number) =>
        `${idx + 1}. **${ex.jp}**\n   - *${ex.romaji}*\n   - ${ex.en}`
    )
    .join("\n\n");

  const notesMd = point.notes
    ? [
        `## Nuance & Usage Notes`,
        `### Nuance\n\n${point.notes.nuance}`,
        `### Contrast\n\n${point.notes.contrast}`,
        `### Common Pitfalls\n\n${point.notes.pitfalls}`,
      ].join("\n\n")
    : "";

  const rawBody = [
    `## Meaning`,
    point.meaning,
    point.formation.length
      ? `## Formation\n\n${point.formation.map((rule) => `- \`${rule}\``).join("\n")}`
      : "",
    point.explanation && point.explanation !== point.meaning
      ? `## Explanation\n\n${point.explanation}`
      : "",
    notesMd,
    examplesMd ? `## Example Sentences\n\n${examplesMd}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return matter.stringify(rawBody, {
    id: point.id,
    slug: point.slug,
    level: point.level,
    title: point.title,
    pattern: point.pattern,
    romaji: point.romaji,
    meaning: point.meaning,
    explanation: point.explanation,
    short: point.short,
    formation: point.formation,
    notes: point.notes,
  });
}

/**
 * Returns all grammar points for a given JLPT level (or all levels if `"All"`).
 */
export async function getGrammarListByLevel(
  level: GrammarLevel | "All" = "All"
): Promise<GrammarPoint[]> {
  if (level === "All") {
    return loadGrammarData(grammarLevels);
  }
  const normalized = level.toUpperCase();
  if (!isGrammarLevel(normalized)) {
    return [];
  }
  return getGrammarByLevel(normalized);
}

/** Returns the compact index records for a level or the complete learning path. */
export async function getGrammarCatalogByLevel(
  level: GrammarLevel | "All" = "All"
): Promise<GrammarCatalogEntry[]> {
  const { points } = await getGrammarIndex();
  if (level === "All") return points;
  const normalized = level.toUpperCase();
  if (!isGrammarLevel(normalized)) return [];
  return points.filter((point) => point.level === normalized);
}

/**
 * Loads a single grammar point by `slug` (e.g. `"a-ga-ichiban"` or `"N5/a-ga-ichiban"`)
 * and optional `level`, parses its frontmatter with `gray-matter`, and compiles
 * the MDX body via `next-mdx-remote/serialize`.
 */
export async function getGrammarDoc(
  slugOrId: string,
  level?: GrammarLevel | string
): Promise<GrammarDoc | null> {
  const parsedId = parseGrammarId(slugOrId);
  const targetSlug = (parsedId?.slug ?? slugOrId).trim().toLowerCase();
  const targetLevel =
    parsedId?.level ??
    (level && isGrammarLevel(level.toUpperCase()) ? (level.toUpperCase() as GrammarLevel) : undefined);

  const pool = targetLevel
    ? await getGrammarByLevel(targetLevel)
    : await loadGrammarData(grammarLevels);

  const point = pool.find(
    (item) =>
      item.slug.toLowerCase() === targetSlug ||
      item.id.toLowerCase() === slugOrId.trim().toLowerCase()
  );

  if (!point) return null;

  const rawMarkdown = buildGrammarMarkdown(point);
  const parsed = matter(rawMarkdown);
  const mdxSource = await serialize(parsed.content, {
    parseFrontmatter: false,
  });

  return {
    point,
    frontmatter: parsed.data as GrammarDocFrontmatter,
    content: parsed.content,
    mdxSource,
  };
}
