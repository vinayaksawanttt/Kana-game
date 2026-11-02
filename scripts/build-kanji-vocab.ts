import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface KanjiCompositeItem {
  word: string;
  reading: string;
  meaning: string;
  jlpt: number;
}

export interface KanjiCompositeData {
  kanji: string;
  composites: KanjiCompositeItem[];
}

interface RawVocabRow {
  word?: string;
  reading?: string;
  meanings?: string[];
  level?: string;
}

interface KanjiRecord {
  c: string;
  jlpt: number;
}

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const MAX_COMPOSITES_PER_KANJI = 12;

function extractHanCharacters(word: string): string[] {
  return [...new Set([...word].filter((ch) => /\p{Script=Han}/u.test(ch)))];
}

async function main(): Promise<void> {
  const root = process.cwd();
  const vocabDir = resolve(root, "public/data/v1/vocabulary");
  const kanjiDir = resolve(root, "public/data/v1/kanji");
  const outputDir = resolve(root, "public/data/v1/kanji-vocab");

  await mkdir(outputDir, { recursive: true });

  const compositesByKanji = new Map<string, KanjiCompositeItem[]>();
  const seenPerKanji = new Map<string, Set<string>>();

  // Iterate N5 -> N1 so easier/more common JLPT words appear first
  for (const level of LEVELS) {
    const jlptNum = Number.parseInt(level.slice(1), 10);
    const vocabPath = resolve(vocabDir, `${level}.json`);
    const rows = JSON.parse(await readFile(vocabPath, "utf8")) as RawVocabRow[];

    for (const row of rows) {
      const word = typeof row.word === "string" ? row.word.trim() : "";
      const reading = typeof row.reading === "string" ? row.reading.trim() : "";
      const meanings = Array.isArray(row.meanings)
        ? row.meanings
            .filter((m): m is string => typeof m === "string")
            .map((m) => m.trim())
            .filter(Boolean)
        : [];

      if (!word || !reading || meanings.length === 0) continue;

      const hanChars = extractHanCharacters(word);
      if (hanChars.length === 0) continue;

      const meaning = meanings.slice(0, 3).join(", ");

      for (const ch of hanChars) {
        let seen = seenPerKanji.get(ch);
        if (!seen) {
          seen = new Set<string>();
          seenPerKanji.set(ch, seen);
        }
        const dedupeKey = `${word}\u0000${reading}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        let list = compositesByKanji.get(ch);
        if (!list) {
          list = [];
          compositesByKanji.set(ch, list);
        }
        list.push({
          word,
          reading,
          meaning,
          jlpt: jlptNum,
        });
      }
    }
  }

  let totalKanjiWithComposites = 0;

  for (const level of LEVELS) {
    const kanjiPath = resolve(kanjiDir, `${level}.json`);
    const kanjiRecords = JSON.parse(await readFile(kanjiPath, "utf8")) as KanjiRecord[];

    const levelOutput: KanjiCompositeData[] = kanjiRecords.map((record) => {
      const rawList = compositesByKanji.get(record.c) ?? [];
      // Sort by JLPT (N5=5 descending to N1=1) and shorter word length first
      const sorted = [...rawList]
        .sort((a, b) => b.jlpt - a.jlpt || a.word.length - b.word.length)
        .slice(0, MAX_COMPOSITES_PER_KANJI);

      if (sorted.length > 0) {
        totalKanjiWithComposites += 1;
      }

      return {
        kanji: record.c,
        composites: sorted,
      };
    });

    const outPath = resolve(outputDir, `${level}.json`);
    await writeFile(outPath, `${JSON.stringify(levelOutput)}\n`, "utf8");
    console.log(
      `Wrote ${levelOutput.length} kanji composite entries to public/data/v1/kanji-vocab/${level}.json`
    );
  }

  console.log(
    `Kanji composite vocabulary build complete: ${totalKanjiWithComposites} kanji mapped to composite words.`
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

