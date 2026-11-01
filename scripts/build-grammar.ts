/**
 * Builds the static grammar dataset served from /public/data/v1/grammar/.
 *
 * Input:  src/data/grammar/grammar_ja_N{1..5}_full_alphabetical_0001.json (hanabira)
 * Output: public/data/v1/grammar/N5.json … N1.json + index.json
 *
 * Each example sentence is pre-processed for the games:
 *   - `chunks`: ordered scramble pills (Syntax Scramble)
 *   - `cloze`:  before / answer / after split around the grammar point (Sentence Cloze)
 *
 * Run: npm run build:grammar-data
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  GrammarExample,
  GrammarIndex,
  GrammarLevel,
  GrammarLevelFile,
  GrammarPoint,
} from "../src/data/grammar";
import {
  chunkSentence,
  extractFragments,
  findCloze,
  parseTitle,
  shortHash,
  slugify,
} from "../src/lib/grammar-data/process";

interface RawGrammarEntry {
  title: string;
  short_explanation?: string;
  long_explanation?: string;
  formation?: string;
  examples?: Array<{ jp?: string; romaji?: string; en?: string }>;
}

const LEVELS: GrammarLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const MIN_CHUNKS = 3;

function buildExample(raw: { jp?: string; romaji?: string; en?: string }, fragments: string[]): GrammarExample | null {
  const jp = raw.jp?.trim() ?? "";
  const en = raw.en?.trim() ?? "";
  if (!jp || !en) return null;

  const chunks = chunkSentence(jp);
  const lossless = chunks.join("") === jp.replace(/\s+/g, "");
  const usableChunks = lossless && chunks.length >= MIN_CHUNKS && new Set(chunks).size > 1 ? chunks : [];

  return {
    jp,
    romaji: raw.romaji?.trim() ?? "",
    en,
    chunks: usableChunks,
    cloze: findCloze(jp, fragments),
  };
}

async function main(): Promise<void> {
  const root = process.cwd();
  const sourceDir = resolve(root, "src/data/grammar");
  const outDir = resolve(root, "public/data/v1/grammar");
  await mkdir(outDir, { recursive: true });

  const index: GrammarIndex = {
    version: "v1",
    total: 0,
    levels: {} as GrammarIndex["levels"],
  };

  for (const level of LEVELS) {
    const sourcePath = resolve(sourceDir, `grammar_ja_${level}_full_alphabetical_0001.json`);
    try {
      await access(sourcePath);
    } catch {
      throw new Error(`Missing grammar source file: ${sourcePath}`);
    }

    const raw = JSON.parse(await readFile(sourcePath, "utf8")) as RawGrammarEntry[];
    const usedSlugs = new Set<string>();
    const points: GrammarPoint[] = [];

    for (const entry of raw) {
      if (!entry.title?.trim()) continue;
      const { pattern, romaji } = parseTitle(entry.title);
      let slug = slugify(romaji) || slugify(pattern) || `g-${shortHash(entry.title)}`;
      if (usedSlugs.has(slug)) {
        let suffix = 2;
        while (usedSlugs.has(`${slug}-${suffix}`)) suffix += 1;
        slug = `${slug}-${suffix}`;
      }
      usedSlugs.add(slug);

      const fragments = extractFragments(pattern);
      const examples = (entry.examples ?? [])
        .map((example) => buildExample(example, fragments))
        .filter((example): example is GrammarExample => example !== null);

      points.push({
        id: `${level}/${slug}`,
        slug,
        level,
        title: entry.title.trim(),
        pattern,
        romaji,
        short: entry.short_explanation?.trim() ?? "",
        long: entry.long_explanation?.trim() ?? "",
        formation: entry.formation?.trim() ?? "",
        examples,
      });
    }

    const file: GrammarLevelFile = { version: "v1", level, points };
    await writeFile(resolve(outDir, `${level}.json`), `${JSON.stringify(file)}\n`, "utf8");

    const cloze = points.filter((point) => point.examples.some((example) => example.cloze)).length;
    const scramble = points.filter((point) => point.examples.some((example) => example.chunks.length)).length;
    index.levels[level] = { points: points.length, cloze, scramble };
    index.total += points.length;
    console.log(`${level}: ${points.length} points · ${cloze} cloze-ready · ${scramble} scramble-ready`);
  }

  await writeFile(resolve(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`Wrote ${index.total} grammar points to ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

