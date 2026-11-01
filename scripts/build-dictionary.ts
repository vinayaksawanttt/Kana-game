/**
 * Builds the static Dictionary & Sentence Analyzer index and copies Kuromoji dictionary files.
 *
 * Inputs:
 *   - data-raw/kanji_jlpt_only.json (+ src/data/kanji/meaning-overrides.json)
 *   - src/data/grammar/sentences_output_*.json
 *   - src/data/openjlpt/vocab/n5.json … n1.json
 *   - node_modules/kuromoji/dict/*.dat.gz
 *
 * Outputs:
 *   - public/data/v1/dictionary-index.json
 *   - public/dict/*.dat.gz
 *
 * Run: npm run build:dictionary
 */
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cleanMeanings } from "../src/lib/kanji-data/clean-meanings";

interface RawKanji {
  kanji: string;
  jlpt: number;
  grade: number;
  meanings: string[];
  on_readings: string[];
  kun_readings: string[];
  heisig_en: string | null;
  stroke_count: number;
  freq_mainichi_shinbun: number | null;
}

interface RawSentenceEntry {
  sentence_original?: string;
  sentence_romaji?: string;
  sentence_english?: string;
  key?: string;
}

interface RawVocabEntry {
  id?: string;
  word?: string;
  reading?: string;
  romaji?: string;
  meanings?: string[];
  level?: string;
  pos?: string[];
  examples?: Array<{
    ja?: string;
    en?: string;
  }>;
}

export interface DictionaryKanjiEntry {
  c: string;
  jlpt: number;
  grade: number;
  label: string;
  meanings: string[];
  on: string[];
  kun: string[];
  strokes: number;
}

export interface DictionaryVocabEntry {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  level: string;
  pos: string[];
}

export interface DictionarySentenceEntry {
  id: number;
  jp: string;
  romaji: string;
  en: string;
  key: string;
}

export interface DictionaryIndexBucket {
  k?: string[];   // Kanji characters
  v?: number[];   // Indices into `vocab`
  s?: number[];   // Indices into `sentences`
}

export interface DictionaryIndexPayload {
  version: "v1";
  kanji: Record<string, DictionaryKanjiEntry>;
  vocab: DictionaryVocabEntry[];
  sentences: DictionarySentenceEntry[];
  keywords: Record<string, DictionaryIndexBucket>;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "do", "for", "from",
  "has", "have", "he", "her", "him", "his", "how", "i", "if", "in", "into",
  "is", "it", "its", "me", "my", "no", "not", "of", "on", "one", "or",
  "our", "out", "she", "so", "some", "someone", "something", "that", "the",
  "their", "them", "then", "there", "these", "they", "this", "to", "up",
  "us", "was", "we", "were", "what", "when", "where", "which", "who",
  "whom", "why", "will", "with", "would", "you", "your", "esp", "etc",
  "e.g", "i.e", "ones", "oneself", "sb", "sth",
]);

export function stemEnglishWord(raw: string): string {
  const word = raw.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (word.length <= 3) return word;

  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.endsWith("ing") && word.length > 5) {
    const base = word.slice(0, -3);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2] && !"aeiou".includes(base[base.length - 1])) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (word.endsWith("ed") && word.length > 4) {
    const base = word.slice(0, -2);
    if (base.length >= 3 && base[base.length - 1] === base[base.length - 2] && !"aeiou".includes(base[base.length - 1])) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (word.endsWith("es") && word.length > 4 && /(ches|shes|xes|zes|sses)$/.test(word)) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us") && !word.endsWith("is") && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

export function extractIndexTokens(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s-]/g, " ");
  const parts = cleaned.split(/[\s-]+/).filter(Boolean);
  const tokens = new Set<string>();
  for (const part of parts) {
    if (part.length < 2 || STOP_WORDS.has(part)) continue;
    tokens.add(part);
    const stemmed = stemEnglishWord(part);
    if (stemmed.length >= 2 && !STOP_WORDS.has(stemmed)) {
      tokens.add(stemmed);
    }
  }
  return [...tokens];
}

async function copyKuromojiDictionaries(root: string): Promise<number> {
  const srcDir = resolve(root, "node_modules/kuromoji/dict");
  const destDir = resolve(root, "public/dict");
  await mkdir(destDir, { recursive: true });

  const entries = await readdir(srcDir);
  const dictFiles = entries.filter((name) => name.endsWith(".dat.gz"));
  await Promise.all(
    dictFiles.map((file) => copyFile(resolve(srcDir, file), resolve(destDir, file)))
  );
  return dictFiles.length;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const copiedCount = await copyKuromojiDictionaries(root);
  console.log(`Copied ${copiedCount} Kuromoji dictionary files to public/dict/`);

  // 1. Load Kanji
  const rawKanjiPath = resolve(root, "data-raw/kanji_jlpt_only.json");
  const overridePath = resolve(root, "src/data/kanji/meaning-overrides.json");
  const rawKanjiMap = JSON.parse(await readFile(rawKanjiPath, "utf8")) as Record<string, RawKanji>;
  let overrides: Record<string, string[]> = {};
  try {
    overrides = JSON.parse(await readFile(overridePath, "utf8")) as Record<string, string[]>;
  } catch {
    // Optional overrides
  }

  const kanjiMap: Record<string, DictionaryKanjiEntry> = {};
  const keywordBuckets = new Map<
    string,
    { k: Set<string>; v: Set<number>; s: Set<number> }
  >();

  const ensureBucket = (token: string) => {
    let bucket = keywordBuckets.get(token);
    if (!bucket) {
      bucket = { k: new Set(), v: new Set(), s: new Set() };
      keywordBuckets.set(token, bucket);
    }
    return bucket;
  };

  for (const [char, item] of Object.entries(rawKanjiMap)) {
    const meanings = cleanMeanings(overrides[char] ?? item.meanings, item.heisig_en);
    if (meanings.length === 0) continue;
    const label = meanings.slice(0, 3).join(", ");
    kanjiMap[item.kanji] = {
      c: item.kanji,
      jlpt: item.jlpt,
      grade: item.grade,
      label,
      meanings: meanings.slice(0, 5),
      on: item.on_readings.slice(0, 4),
      kun: item.kun_readings.slice(0, 4),
      strokes: item.stroke_count,
    };

    for (const meaning of meanings) {
      for (const token of extractIndexTokens(meaning)) {
        const bucket = ensureBucket(token);
        if (bucket.k.size < 20) {
          bucket.k.add(item.kanji);
        }
      }
    }
  }

  // 2. Load Vocabulary (N5 -> N1 so higher-priority beginner words are indexed first)
  const vocabLevels = ["n5", "n4", "n3", "n2", "n1"] as const;
  const vocabList: DictionaryVocabEntry[] = [];
  const seenVocabKeys = new Set<string>();

  for (const lvl of vocabLevels) {
    const vocabPath = resolve(root, `src/data/openjlpt/vocab/${lvl}.json`);
    const rows = JSON.parse(await readFile(vocabPath, "utf8")) as RawVocabEntry[];
    for (const row of rows) {
      const word = row.word?.trim() ?? "";
      const reading = row.reading?.trim() ?? "";
      const romaji = row.romaji?.trim() ?? "";
      const level = row.level?.trim().toUpperCase() ?? lvl.toUpperCase();
      const meanings = (row.meanings ?? []).map((m) => m.trim()).filter(Boolean);
      if (!word || !reading || meanings.length === 0) continue;

      const dedupeKey = `${word}\u0000${reading}`;
      if (seenVocabKeys.has(dedupeKey)) continue;
      seenVocabKeys.add(dedupeKey);

      const vocabIndex = vocabList.length;
      vocabList.push({
        id: row.id?.trim() || `${level}-${vocabIndex}`,
        word,
        reading,
        romaji,
        meanings: meanings.slice(0, 4),
        level,
        pos: (row.pos ?? []).slice(0, 3),
      });

      for (const meaning of meanings) {
        for (const token of extractIndexTokens(meaning)) {
          const bucket = ensureBucket(token);
          if (bucket.v.size < 24) {
            bucket.v.add(vocabIndex);
          }
        }
      }
    }
  }

  // 3. Load Sentences from sentences_output_*.json
  const grammarDir = resolve(root, "src/data/grammar");
  const grammarFiles = (await readdir(grammarDir))
    .filter((name) => name.startsWith("sentences_output_") && name.endsWith(".json"))
    .sort();

  const sentences: DictionarySentenceEntry[] = [];
  const seenSentences = new Set<string>();

  for (const fileName of grammarFiles) {
    const filePath = resolve(grammarDir, fileName);
    const rawList = JSON.parse(await readFile(filePath, "utf8")) as RawSentenceEntry[];
    for (const row of rawList) {
      const jp = row.sentence_original?.trim() ?? "";
      const en = row.sentence_english?.trim() ?? "";
      const romaji = row.sentence_romaji?.trim() ?? "";
      const key = (row.key?.trim() ?? "").replace(/_+$/, "");
      if (!jp || !en || seenSentences.has(jp)) continue;
      seenSentences.add(jp);

      const sentenceId = sentences.length;
      sentences.push({
        id: sentenceId,
        jp,
        romaji,
        en,
        key,
      });

      for (const token of extractIndexTokens(en)) {
        const bucket = ensureBucket(token);
        if (bucket.s.size < 12) {
          bucket.s.add(sentenceId);
        }
      }
    }
  }

  // Convert keywordBuckets to compact JSON object
  const keywords: Record<string, DictionaryIndexBucket> = {};
  const sortedTokens = [...keywordBuckets.keys()].sort();
  for (const token of sortedTokens) {
    const bucket = keywordBuckets.get(token)!;
    const entry: DictionaryIndexBucket = {};
    if (bucket.k.size > 0) entry.k = [...bucket.k];
    if (bucket.v.size > 0) entry.v = [...bucket.v];
    if (bucket.s.size > 0) entry.s = [...bucket.s];
    if (entry.k || entry.v || entry.s) {
      keywords[token] = entry;
    }
  }

  const outDir = resolve(root, "public/data/v1");
  await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, "dictionary-index.json");

  const payload: DictionaryIndexPayload = {
    version: "v1",
    kanji: kanjiMap,
    vocab: vocabList,
    sentences,
    keywords,
  };

  await writeFile(outPath, `${JSON.stringify(payload)}\n`, "utf8");
  console.log(
    `Built dictionary index: ${Object.keys(kanjiMap).length} kanji, ${vocabList.length} vocab, ${sentences.length} sentences, ${Object.keys(keywords).length} indexed English stems -> ${outPath}`
  );
}

if (process.argv[1]?.endsWith("build-dictionary.ts")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}

