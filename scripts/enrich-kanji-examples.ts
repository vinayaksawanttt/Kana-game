import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import type { RadicalExampleRecord, RadicalExamples } from "../src/data/radicals";

interface RawKanji {
  kanji: string;
  jlpt: number;
}

interface VocabExample {
  ja: string;
  en: string;
  furigana?: string;
}

interface VocabEntry {
  word: string;
  reading: string;
  meanings: string[];
  examples?: VocabExample[];
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limitChars = limitArg ? Number.parseInt(limitArg.split("=")[1]!, 10) : undefined;

  const root = process.cwd();
  const kanjiPath = resolve(root, "data-raw/kanji_jlpt_only.json");
  const examplesPath = resolve(root, "public/data/v1/radicals/examples.json");

  const rawKanjiData = JSON.parse(await readFile(kanjiPath, "utf8")) as Record<string, RawKanji>;
  const currentExamples = JSON.parse(await readFile(examplesPath, "utf8")) as RadicalExamples;

  const targetKanjiList = Object.values(rawKanjiData)
    .filter((k) => k.jlpt && k.jlpt >= 3 && k.jlpt <= 5) // N5, N4, N3
    .filter((k) => (currentExamples[k.kanji] ?? []).length < 2)
    .map((k) => k.kanji);

  console.log(`\n--- Kanji Examples Enrichment ---`);
  console.log(`Identified ${targetKanjiList.length} N5-N3 Joyo Kanji with fewer than 2 example sentences.`);

  // 1. Gather candidate sentences from vocabulary datasets
  const vocabByKanji = new Map<string, { jp: string; en: string }[]>();

  for (const lvl of ["N5", "N4", "N3", "N2", "N1"]) {
    const vocabFile = resolve(root, `public/data/v1/vocabulary/${lvl}.json`);
    const entries = JSON.parse(await readFile(vocabFile, "utf8")) as VocabEntry[];

    for (const entry of entries) {
      for (const ex of entry.examples ?? []) {
        if (!ex.ja) continue;
        for (const char of targetKanjiList) {
          if (ex.ja.includes(char)) {
            let list = vocabByKanji.get(char);
            if (!list) {
              list = [];
              vocabByKanji.set(char, list);
            }
            if (!list.some((item) => item.jp === ex.ja)) {
              list.push({ jp: ex.ja, en: ex.en || "" });
            }
          }
        }
      }
    }
  }

  // 2. Select up to 2-3 examples per target kanji
  const candidateSentencesToTranslate: { kanji: string; jp: string; existingEn: string }[] = [];
  const finalExamplesByKanji: Record<string, RadicalExampleRecord[]> = { ...currentExamples };

  for (const char of targetKanjiList) {
    const existing = [...(finalExamplesByKanji[char] ?? [])];
    const available = vocabByKanji.get(char) ?? [];

    for (const cand of available) {
      if (existing.length >= 3) break;
      if (existing.some((e) => e.jp === cand.jp)) continue;

      if (!cand.en || cand.en.length < 5) {
        candidateSentencesToTranslate.push({ kanji: char, jp: cand.jp, existingEn: "" });
      } else {
        existing.push({
          jp: cand.jp,
          romaji: "",
          en: cand.en,
        });
      }
    }

    finalExamplesByKanji[char] = existing;
  }

  const client = new DeepLClient();
  await client.loadCache();

  console.log(`Sentences requiring DeepL translation: ${candidateSentencesToTranslate.length}`);

  const textsToTranslate = candidateSentencesToTranslate.map((s) => s.jp);
  const { results, stats } = await client.translateBatch(textsToTranslate, {
    mode: "sentence",
    dryRun: isDryRun,
    limitChars,
  });

  console.log("\nDeepL Translation Stats:");
  console.log(`  Total sentences requested : ${stats.totalRequested}`);
  console.log(`  Cached hits (0 API chars) : ${stats.cachedHits}`);
  console.log(`  Uncached items            : ${stats.uncachedTexts}`);
  console.log(`  Uncached characters       : ${stats.uncachedChars}`);
  console.log(`  Newly translated chars    : ${stats.translatedChars}`);

  if (!isDryRun) {
    for (let i = 0; i < candidateSentencesToTranslate.length; i++) {
      const item = candidateSentencesToTranslate[i]!;
      const translatedEn = results.get(item.jp)?.trim();
      if (translatedEn) {
        const list = finalExamplesByKanji[item.kanji] ?? [];
        list.push({
          jp: item.jp,
          romaji: "",
          en: translatedEn,
        });
        finalExamplesByKanji[item.kanji] = list;
      }
    }

    await writeFile(examplesPath, JSON.stringify(finalExamplesByKanji, null, 2) + "\n", "utf8");
    await client.saveCache();

    let resolvedCount = 0;
    for (const char of targetKanjiList) {
      if ((finalExamplesByKanji[char] ?? []).length >= 2) resolvedCount++;
    }
    console.log(`\nUpdated ${examplesPath}: ${resolvedCount}/${targetKanjiList.length} target kanji now have >= 2 examples.`);
  } else {
    console.log("\n[DRY-RUN] No files modified.");
  }
}

if (process.argv[1]?.endsWith("enrich-kanji-examples.ts")) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}

