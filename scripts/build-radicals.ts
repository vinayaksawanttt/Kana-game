/**
 * Builds a compact JLPT radical explorer dataset.
 *
 * Inputs:
 *   - src/data/kanji/radicals/radical-decode(d).json
 *   - src/data/kanji/radicals/radical-wiki.json
 *   - data-raw/kanji_jlpt_only.json
 *   - src/data/grammar/sentences_output_*.json
 *
 * Outputs:
 *   - public/data/v1/radicals/list.json
 *   - public/data/v1/radicals/index.json
 *   - public/data/v1/radicals/examples.json
 */
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { RadicalExampleRecord, RadicalIndex, RadicalRecord } from "../src/data/radicals";
import { parseRadicalWikiEntry } from "../src/engine/radicalSearch";

interface RawKanji {
  kanji: string;
  jlpt: number;
}

interface RawSentence {
  sentence_original?: string;
  sentence_romaji?: string;
  sentence_english?: string;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function requiredPath(...paths: string[]): Promise<string> {
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Missing required source file. Checked: ${paths.join(", ")}`);
}

async function main(): Promise<void> {
  const root = process.cwd();
  const radicalDir = resolve(root, "src/data/kanji/radicals");
  const decodedPath = await requiredPath(
    resolve(radicalDir, "radical-decoded.json"),
    resolve(radicalDir, "radical-decode.json")
  );
  const wikiPath = await requiredPath(resolve(radicalDir, "radical-wiki.json"));
  const kanjiPath = resolve(root, "data-raw/kanji_jlpt_only.json");

  const [decoded, wiki, kanji] = await Promise.all([
    readJson<Record<string, string[]>>(decodedPath),
    readJson<Record<string, string>>(wikiPath),
    readJson<Record<string, RawKanji>>(kanjiPath),
  ]);
  const jlptCharacters = new Set(
    Object.values(kanji)
      .filter((record) => Number.isInteger(record.jlpt) && record.jlpt >= 1 && record.jlpt <= 5)
      .map((record) => record.kanji)
  );

  const radicalCharacters = new Set(Object.keys(wiki));
  for (const character of jlptCharacters) {
    for (const radical of decoded[character] ?? []) radicalCharacters.add(radical);
  }
  const mutableIndex: RadicalIndex = Object.fromEntries(
    [...radicalCharacters].map((character) => [character, []])
  );
  for (const character of jlptCharacters) {
    const radicals = decoded[character];
    if (!Array.isArray(radicals)) continue;
    const knownRadicals = [...new Set(radicals)].filter(
      (radical) => Object.hasOwn(mutableIndex, radical)
    );
    for (const radical of knownRadicals) {
      mutableIndex[radical]!.push(character);
    }
  }

  for (const characters of Object.values(mutableIndex)) {
    characters.sort((left, right) => left.localeCompare(right, "ja"));
  }

  const radicals: RadicalRecord[] = [...radicalCharacters].map((character) => {
    const rawMeaning = wiki[character];
    const parsed = rawMeaning
      ? parseRadicalWikiEntry(rawMeaning)
      : { meaning: "component", reading: "" };
    return {
      character,
      ...parsed,
      kanjiCount: mutableIndex[character]?.length ?? 0,
    };
  });

  const grammarDir = resolve(root, "src/data/grammar");
  const sentenceFiles = (await readdir(grammarDir))
    .filter((name) => name.startsWith("sentences_output_") && name.endsWith(".json"))
    .sort();
  if (!sentenceFiles.length) {
    throw new Error(`Missing local sentence datasets in ${grammarDir}`);
  }

  const examplesByKanji: Record<string, RadicalExampleRecord[]> = {};
  const seenSentences = new Set<string>();
  for (const file of sentenceFiles) {
    const sentences = await readJson<RawSentence[]>(resolve(grammarDir, file));
    if (!Array.isArray(sentences)) throw new Error(`Invalid sentence dataset: ${file}`);
    for (const sentence of sentences) {
      const jp = sentence.sentence_original?.trim() ?? "";
      const en = sentence.sentence_english?.trim() ?? "";
      if (!jp || !en || seenSentences.has(jp)) continue;
      seenSentences.add(jp);
      const example: RadicalExampleRecord = {
        jp,
        romaji: sentence.sentence_romaji?.trim() ?? "",
        en,
      };
      for (const character of new Set([...jp])) {
        if (!jlptCharacters.has(character)) continue;
        const examples = (examplesByKanji[character] ??= []);
        if (examples.length < 3) examples.push(example);
      }
    }
  }

  const outputDir = resolve(root, "public/data/v1/radicals");
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(outputDir, "list.json"),
      `${JSON.stringify({ version: "v1", radicals })}\n`,
      "utf8"
    ),
    writeFile(resolve(outputDir, "index.json"), `${JSON.stringify(mutableIndex)}\n`, "utf8"),
    writeFile(resolve(outputDir, "examples.json"), `${JSON.stringify(examplesByKanji)}\n`, "utf8"),
  ]);

  console.log(
    `Built ${radicals.length} radicals, ${jlptCharacters.size} JLPT kanji memberships, and ${Object.keys(examplesByKanji).length} example lists -> ${outputDir}`
  );
  console.log(
    `Filtered ${Object.keys(decoded).length - jlptCharacters.size} decoded kanji outside the JLPT dataset.`
  );
}

if (process.argv[1]?.endsWith("build-radicals.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
