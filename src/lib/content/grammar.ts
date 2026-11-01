import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import {
  getGrammarByLevel,
  grammarLevels,
  isGrammarLevel,
  loadGrammarData,
  parseGrammarId,
  type GrammarExample,
  type GrammarLevel,
  type GrammarPoint,
} from "@/data/grammar";

export interface GrammarDocFrontmatter {
  id: string;
  slug: string;
  level: GrammarLevel;
  title: string;
  pattern: string;
  romaji: string;
  short: string;
  formation: string;
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

  const rawBody = [
    `## Meaning`,
    point.short || point.long,
    point.formation ? `## Formation\n\n\`${point.formation}\`` : "",
    point.long && point.long !== point.short ? `## Explanation\n\n${point.long}` : "",
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
    short: point.short,
    formation: point.formation,
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

