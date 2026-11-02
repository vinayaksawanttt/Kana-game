/**
 * Builds the static grammar dataset served from /public/data/v1/grammar/.
 *
 * Inputs:
 *   - src/data/grammar/grammar_ja_N{1..5}_full_alphabetical_0001.json (grammar rules)
 *   - src/data/grammar/sentences_output_*.json (local example sentences)
 * Output: public/data/v1/grammar/N5.json … N1.json + index.json
 *
 * Each example sentence is pre-processed for the games:
 *   - `chunks`: ordered scramble pills (Syntax Scramble)
 *   - `cloze`:  before / answer / after split around the grammar point (Sentence Cloze)
 *
 * Run: npm run build:grammar-data
 */
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  GrammarExample,
  GrammarCatalogEntry,
  GrammarIndex,
  GrammarLevel,
  GrammarLevelFile,
  GrammarPoint,
} from "../src/data/grammar";
import {
  chunkSentence,
  extractFragments,
  findMatchingGrammarSentences,
  findCloze,
  type GrammarSentenceCandidate,
  parseTitle,
  shortHash,
  slugify,
} from "../src/lib/grammar-data/process";

interface RawGrammarEntry {
  title: string;
  short_explanation?: string;
  long_explanation?: string;
  formation?: string | string[];
  examples?: Array<{ jp?: string; romaji?: string; en?: string }>;
}

interface RawSentenceEntry extends GrammarSentenceCandidate {
  key?: string;
}

const LEVELS: GrammarLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const MIN_CHUNKS = 3;
const MAX_EXAMPLES = 8;

function parseFormation(value: string | string[] | undefined): string[] {
  const entries = Array.isArray(value) ? value : value ? value.split(/\r?\n|;\s*/) : [];
  return entries.map((entry) => entry.trim()).filter(Boolean);
}

function buildExample(raw: { jp?: string; romaji?: string; en?: string }, fragments: string[]): GrammarExample | null {
  const jp = raw.jp?.trim() ?? "";
  const en = raw.en?.trim() ?? "";
  if (!jp || !en) return null;

  const chunks = chunkSentence(jp);
  const lossless = chunks.join("") === jp.replace(/\s+/g, "");
  const usableChunks = lossless && chunks.length >= MIN_CHUNKS && new Set(chunks).size > 1 ? chunks : [];

  return {
    jp,
    ja: jp,
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
    points: [],
  };

  const sentenceFiles = (await readdir(sourceDir))
    .filter((name) => name.startsWith("sentences_output_") && name.endsWith(".json"))
    .sort();
  if (!sentenceFiles.length) {
    throw new Error(`Missing sentence example sources in ${sourceDir}`);
  }
  const sentenceEntries: RawSentenceEntry[] = [];
  for (const filename of sentenceFiles) {
    const entries = JSON.parse(
      await readFile(resolve(sourceDir, filename), "utf8")
    ) as RawSentenceEntry[];
    if (!Array.isArray(entries)) {
      throw new Error(`Invalid sentence example source: ${filename}`);
    }
    sentenceEntries.push(...entries);
  }
  console.log(`Loaded ${sentenceEntries.length} local example sentences from ${sentenceFiles.length} files`);

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
      const sourceExamples = (entry.examples ?? [])
        .map((example) => buildExample(example, fragments))
        .filter((example): example is GrammarExample => example !== null);
      const usedSentences = new Set(sourceExamples.map((example) => example.jp));
      const localExamples = findMatchingGrammarSentences(
        pattern,
        sentenceEntries.filter(
          (sentence) => !sentence.sentence_original || !usedSentences.has(sentence.sentence_original.trim())
        ),
        Math.max(0, MAX_EXAMPLES - sourceExamples.length)
      )
        .map((sentence) =>
          buildExample(
            {
              jp: sentence.sentence_original,
              romaji: sentence.sentence_romaji,
              en: sentence.sentence_english,
            },
            fragments
          )
        )
        .filter((example): example is GrammarExample => example !== null);
      const examples = [...sourceExamples, ...localExamples].slice(0, MAX_EXAMPLES);
      const meaning = entry.short_explanation?.trim() || entry.long_explanation?.trim() || "";
      const formation = parseFormation(entry.formation);
      const explanation = entry.long_explanation?.trim() || meaning;

      points.push({
        id: `${level}/${slug}`,
        slug,
        level,
        title: entry.title.trim(),
        meaning,
        explanation,
        pattern,
        romaji,
        short: entry.short_explanation?.trim() ?? "",
        long: entry.long_explanation?.trim() ?? "",
        formation,
        examples,
      });
    }

    const file: GrammarLevelFile = { version: "v1", level, points };
    await writeFile(resolve(outDir, `${level}.json`), `${JSON.stringify(file)}\n`, "utf8");

    const cloze = points.filter((point) => point.examples.some((example) => example.cloze)).length;
    const scramble = points.filter((point) => point.examples.some((example) => example.chunks.length)).length;
    index.levels[level] = { points: points.length, cloze, scramble };
    index.total += points.length;
    index.points.push(
      ...points.map(({ id, slug, level: pointLevel, title, pattern, romaji, meaning }) =>
        ({ id, slug, level: pointLevel, title, pattern, romaji, meaning }) satisfies GrammarCatalogEntry
      )
    );
    console.log(`${level}: ${points.length} points · ${cloze} cloze-ready · ${scramble} scramble-ready`);
  }

  await writeFile(resolve(outDir, "index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`Wrote ${index.total} grammar points to ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
