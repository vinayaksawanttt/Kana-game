import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { learnCategories, jlptLevels, type LearnCategory, type JlptLevel, type LearnDoc, type LearnFrontmatter } from "./learn-schema";

export { learnCategories, jlptLevels } from "./learn-schema";
export type { LearnCategory, JlptLevel, LearnDoc, LearnFrontmatter } from "./learn-schema";

interface LearnFile {
  path: string;
  slug: string;
}

const categoryOrder = new Map(learnCategories.map((category, index) => [category, index]));
const levelOrder = new Map(jlptLevels.map((level, index) => [level, index]));
const learnImageDirectory = path.resolve(process.cwd(), "public/images/learn");
const learnImagesByName = new Map(
  fs
    .readdirSync(learnImageDirectory)
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => [normalizeAssetName(path.basename(name, path.extname(name))), name])
);
const legacyCategories: Record<string, LearnCategory> = {
  "writing & sounds": "Writing and sounds",
  "numbers, time and counting": "Numbers, time and counting",
  adjectives: "Adjectives and adverbs",
  adverbs: "Adjectives and adverbs",
  grammar: "Particles and grammar",
  particles: "Particles and grammar",
  "politeness and communication": "Politeness and communication",
  "reading and exam skills": "Reading and exam skills",
  "japan basics": "Japan basics",
  "reference cards": "Reference cards",
};

function normalizeAssetName(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function categoryAssetSlug(category: LearnCategory): string {
  return category.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveLearnImage(slug: string, title: string, category: LearnCategory): string {
  const imageName = [slug, title, category]
    .map(normalizeAssetName)
    .map((name) => learnImagesByName.get(name))
    .find((name): name is string => Boolean(name));
  const categoryImage = learnImagesByName.get(normalizeAssetName(category));
  const filename = imageName ?? categoryImage ?? `${categoryAssetSlug(category)}.png`;
  return `/images/learn/${filename}`;
}

function walkMdxFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMdxFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

function fileSlug(filePath: string, root: string): string {
  return path
    .relative(root, filePath)
    .replace(/\.mdx$/i, "")
    .split(path.sep)
    .join("-")
    .toLowerCase();
}

function listLearnFiles(): LearnFile[] {
  const contentRoot = path.resolve(process.cwd(), "content/learn");
  const legacyRoot = path.resolve(process.cwd(), "src/data/reference");
  const files = [
    ...walkMdxFiles(legacyRoot).map((filePath) => ({
      path: filePath,
      slug: fileSlug(filePath, legacyRoot),
    })),
    ...walkMdxFiles(contentRoot).map((filePath) => ({
      path: filePath,
      slug: fileSlug(filePath, contentRoot),
    })),
  ];
  const bySlug = new Map<string, LearnFile>();
  for (const file of files) bySlug.set(file.slug, file);
  return [...bySlug.values()];
}

function parseLevels(jlpt: string): JlptLevel[] {
  const matches = [...jlpt.toUpperCase().matchAll(/N[1-5]/g)].map((match) => match[0] as JlptLevel);
  if (!matches.length) throw new Error(`Invalid JLPT range "${jlpt}".`);
  const unique = [...new Set(matches)];
  if (unique.length >= 2 && unique.length === 2) {
    const first = levelOrder.get(unique[0]!);
    const last = levelOrder.get(unique[1]!);
    if (first === undefined || last === undefined) throw new Error(`Invalid JLPT range "${jlpt}".`);
    const low = Math.min(first, last);
    const high = Math.max(first, last);
    return jlptLevels.slice(low, high + 1);
  }
  return unique.sort((left, right) => levelOrder.get(left)! - levelOrder.get(right)!);
}

function normalizeJlpt(jlpt: string, levels: JlptLevel[]): string {
  const hasRange = /N[1-5]\s*[-–—]\s*N[1-5]/i.test(jlpt);
  if (hasRange && levels.length > 1) return `${levels[0]}–${levels[levels.length - 1]}`;
  if (levels.length === 1) return levels[0]!;
  return levels.join(", ");
}

function normalizeCategory(value: unknown, filePath: string): LearnCategory {
  if (typeof value !== "string") throw new Error(`Missing category in ${filePath}.`);
  const normalized = value.trim().toLocaleLowerCase();
  const mapped =
    legacyCategories[normalized] ??
    learnCategories.find((category) => category.toLocaleLowerCase() === normalized);
  if (mapped) return mapped;
  throw new Error(`Unsupported learn category "${value}" in ${filePath}.`);
}

function readFrontmatter(file: LearnFile): LearnFrontmatter {
  const parsed = matter(fs.readFileSync(file.path, "utf8"));
  const data = parsed.data as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const slugValue =
    typeof data.slug === "string"
      ? data.slug.trim()
      : typeof data.id === "string"
        ? data.id.trim()
        : file.slug;
  const slug = slugValue.toLowerCase();
  const jlptValue = data.jlpt ?? data.level;
  const jlpt = typeof jlptValue === "string" ? jlptValue.trim() : "";
  if (!title) throw new Error(`Missing title in ${file.path}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid learn slug "${slugValue}" in ${file.path}.`);
  }
  if (!jlpt) throw new Error(`Missing JLPT range in ${file.path}.`);
  const levels = Array.isArray(data.levels)
    ? data.levels.map((level) => String(level).toUpperCase()).filter((level): level is JlptLevel =>
        (jlptLevels as readonly string[]).includes(level)
      )
    : parseLevels(jlpt);
  if (!levels.length) throw new Error(`No valid JLPT levels in ${file.path}.`);
  const normalizedLevels = [...new Set(levels)].sort(
    (left, right) => levelOrder.get(left)! - levelOrder.get(right)!
  );
  const summaryValue = data.summary ?? data.description;
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((keyword): keyword is string => typeof keyword === "string")
    : Array.isArray(data.tags)
      ? data.tags.filter((keyword): keyword is string => typeof keyword === "string")
      : [];
  const order = typeof data.order === "number" && Number.isFinite(data.order) ? data.order : undefined;

  return {
    title,
    slug,
    category: normalizeCategory(data.category, file.path),
    jlpt: normalizeJlpt(jlpt, normalizedLevels),
    levels: normalizedLevels,
    imageUrl: resolveLearnImage(slug, title, normalizeCategory(data.category, file.path)),
    fallbackSvgUrl: `/images/learn/fallbacks/${categoryAssetSlug(normalizeCategory(data.category, file.path))}.svg`,
    ...(typeof summaryValue === "string" && summaryValue.trim()
      ? { summary: summaryValue.trim() }
      : {}),
    ...(order === undefined ? {} : { order }),
    ...(keywords.length ? { keywords } : {}),
  };
}

function compareLearnDocs(left: LearnFrontmatter, right: LearnFrontmatter): number {
  const categoryDifference =
    categoryOrder.get(left.category)! - categoryOrder.get(right.category)!;
  if (categoryDifference) return categoryDifference;
  const orderDifference = (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER);
  if (orderDifference) return orderDifference;
  return left.title.localeCompare(right.title);
}

export function getAllLearnDocs(): LearnFrontmatter[] {
  const bySlug = new Map<string, LearnFrontmatter>();
  for (const file of listLearnFiles()) {
    const frontmatter = readFrontmatter(file);
    bySlug.set(frontmatter.slug, frontmatter);
  }
  return [...bySlug.values()].sort(compareLearnDocs);
}

function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(content: string): LearnDoc["headings"] {
  const headings: LearnDoc["headings"] = [];
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2]!.replace(/[`*_~]/g, "").trim();
    const baseId = headingId(text);
    const occurrence = seen.get(baseId) ?? 0;
    seen.set(baseId, occurrence + 1);
    headings.push({
      id: occurrence ? `${baseId}-${occurrence + 1}` : baseId,
      text,
      level: match[1]!.length,
    });
  }
  return headings;
}

function normalizeMdxContent(content: string): string {
  return content
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expression: string) => `\`${expression.trim()}\``)
    .replace(/\$([^$\n]+)\$/g, (_, expression: string) => `\`${expression.trim()}\``)
    .replace(/<br\s*\/?>/gi, "<br />");
}

export function getLearnDocBySlug(slug: string): LearnDoc | null {
  const normalizedSlug = slug.trim().toLowerCase();
  const file = listLearnFiles().find((candidate) => {
    const frontmatter = readFrontmatter(candidate);
    return frontmatter.slug === normalizedSlug;
  });
  if (!file) return null;
  const parsed = matter(fs.readFileSync(file.path, "utf8"));
  const content = normalizeMdxContent(parsed.content);
  return {
    frontmatter: readFrontmatter(file),
    content,
    headings: extractHeadings(content),
  };
}
