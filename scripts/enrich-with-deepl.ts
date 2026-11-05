import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { hasEnglishGloss, type ShiritoriWord } from "../src/engine/shiritori";
import { DeepLClient, getDeepLConfig } from "./lib/deepl-client";

interface VocabExample {
  ja: string;
  furigana: string;
  en: string;
  tatoeba_id?: number;
}

interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  level: string;
  pos?: string[];
  jmdict_id?: number;
  examples?: VocabExample[];
}

interface CorpusSentence {
  sentence_original?: string;
  sentence_english?: string;
  key?: string;
}

function parseArgs(argv: string[]): {
  target: "shiritori" | "vocab-examples" | "all";
  dryRun: boolean;
  limitChars?: number;
} {
  let target: "shiritori" | "vocab-examples" | "all" = "shiritori";
  let dryRun = false;
  let limitChars: number | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("--target=")) {
      const val = arg.split("=")[1];
      if (val === "shiritori" || val === "vocab-examples" || val === "all") {
        target = val;
      }
    } else if (arg === "--target" && argv[i + 1]) {
      const val = argv[i + 1];
      if (val === "shiritori" || val === "vocab-examples" || val === "all") {
        target = val;
        i += 1;
      }
    } else if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.split("=")[1] ?? "", 10);
      if (Number.isFinite(parsed) && parsed > 0) limitChars = parsed;
    } else if (arg === "--limit" && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1] ?? "", 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        limitChars = parsed;
        i += 1;
      }
    }
  }

  return { target, dryRun, limitChars };
}

function buildJapaneseSentenceForWord(entry: VocabEntry): { ja: string; furigana: string } {
  const pos = entry.pos ?? [];
  const w = entry.word;
  const r = entry.reading;
  const furiToken = w !== r && /[\u4e00-\u9faf]/.test(w) ? `{${w}|${r}}` : w;

  if (pos.includes("vs")) {
    return {
      ja: `計画をスムーズに${w}ために、事前の準備を行いました。`,
      furigana: `{計画|けいかく}をスムーズに${furiToken}ために、{事前|じぜん}の{準備|じゅんび}を{行|おこな}いました。`,
    };
  }
  if (pos.some((p) => p.startsWith("v1") || p.startsWith("v5") || p === "vk" || p === "vz")) {
    return {
      ja: `大切な場面でしっかり${w}ことが求められます。`,
      furigana: `{大切|たいせつ}な{場面|ばめん}でしっかり${furiToken}ことが{求|もと}められます。`,
    };
  }
  if (pos.includes("adj-i")) {
    return {
      ja: `この状況は予想していたよりもずっと${w}ようです。`,
      furigana: `この{状況|じょうきょう}は{予想|よそう}していたよりもずっと${furiToken}ようです。`,
    };
  }
  if (pos.includes("adj-na")) {
    return {
      ja: `彼の${w}な対応のおかげで、問題は無事に解決しました。`,
      furigana: `{彼|かれ}の${furiToken}な{対応|たいおう}のおかげで、{問題|もんだい}は{無事|ぶじ}に{解決|かいけつ}しました。`,
    };
  }
  if (pos.includes("adv") || pos.includes("adv-to")) {
    return {
      ja: `${w}作業を進めたので、時間通りに終わりました。`,
      furigana: `${furiToken}{作業|さぎょう}を{進|すす}めたので、{時間通|じかんどお}りに{終|お}わりました。`,
    };
  }
  return {
    ja: `今日の授業で「${w}」という表現の使い方を学びました。`,
    furigana: `{今日|きょう}の{授業|じゅぎょう}で「${furiToken}」という{表現|ひょうげん}の{使|つか}い{方|かた}を{学|まな}びました。`,
  };
}

async function loadLocalSentenceCorpus(root: string): Promise<CorpusSentence[]> {
  const files = [
    "src/data/grammar/sentences_output_N3_tango_p210-213_i-adjectives_1.json",
    "src/data/grammar/sentences_output_N3_tango_p214-223_na-adjectives_1.json",
    "src/data/grammar/sentences_output_N3_tango_verbs_TOTAL.json",
    "src/data/grammar/sentences_output_essential_600_suru_verbs_book.json",
    "src/data/grammar/sentences_output_essential_600_verbs_book.json",
  ];
  const all: CorpusSentence[] = [];
  for (const rel of files) {
    const full = resolve(root, rel);
    if (!existsSync(full)) continue;
    const rows = JSON.parse(await readFile(full, "utf8")) as CorpusSentence[];
    all.push(...rows);
  }
  return all;
}

async function enrichShiritori(
  client: DeepLClient,
  root: string,
  options: { dryRun: boolean; limitChars?: number }
): Promise<void> {
  const wordsPath = resolve(root, "public/data/v1/shiritori/words.json");
  const words = JSON.parse(await readFile(wordsPath, "utf8")) as ShiritoriWord[];

  const missingEntries = words.filter((w) => !hasEnglishGloss(w));
  const textsToTranslate = missingEntries.map((w) => w.word);

  const { results, stats } = await client.translateBatch(textsToTranslate, {
    mode: "gloss",
    dryRun: options.dryRun,
    limitChars: options.limitChars,
  });

  console.log(`\n=== Shiritori Enrichment Summary ${options.dryRun ? "(DRY RUN)" : ""} ===`);
  console.log(`Total words in words.json       : ${words.length}`);
  console.log(`Words needing English glosses   : ${missingEntries.length}`);
  console.log(`Unique headwords to translate   : ${stats.totalRequested}`);
  console.log(`Cached hits in deepl-cache.json : ${stats.cachedHits}`);
  console.log(`Uncached texts needing DeepL API: ${stats.uncachedTexts}`);
  console.log(`Uncached character count        : ${stats.uncachedChars} chars`);

  if (options.dryRun) {
    return;
  }

  let updatedCount = 0;
  for (const entry of words) {
    if (!hasEnglishGloss(entry)) {
      const translated = results.get(entry.word) ?? results.get(entry.kana);
      if (translated) {
        entry.meaning = translated;
        updatedCount += 1;
      }
    }
  }

  await writeFile(wordsPath, `${JSON.stringify(words)}\n`, "utf8");
  console.log(`Updated ${updatedCount} entries in public/data/v1/shiritori/words.json`);
}

async function enrichVocabExamples(
  client: DeepLClient,
  root: string,
  options: { dryRun: boolean; limitChars?: number }
): Promise<void> {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const corpus = await loadLocalSentenceCorpus(root);

  const pendingTranslations: Array<{
    level: string;
    entry: VocabEntry;
    ja: string;
    furigana: string;
  }> = [];
  let corpusMatchedCount = 0;
  const entriesByLevel = new Map<string, VocabEntry[]>();

  for (const level of levels) {
    const file = resolve(root, `public/data/v1/vocabulary/${level}.json`);
    if (!existsSync(file)) continue;
    const entries = JSON.parse(await readFile(file, "utf8")) as VocabEntry[];
    entriesByLevel.set(level, entries);

    for (const entry of entries) {
      if (entry.examples && entry.examples.length > 0) continue;

      const match = corpus.find(
        (c) =>
          c.sentence_original &&
          c.sentence_english &&
          (c.key?.replace(/_$/, "") === entry.word || c.sentence_original.includes(entry.word))
      );

      if (match?.sentence_original && match.sentence_english) {
        const furi =
          entry.word !== entry.reading && /[\u4e00-\u9faf]/.test(entry.word)
            ? match.sentence_original.replace(entry.word, `{${entry.word}|${entry.reading}}`)
            : match.sentence_original;
        entry.examples = [
          {
            ja: match.sentence_original,
            furigana: furi,
            en: match.sentence_english,
          },
        ];
        corpusMatchedCount += 1;
      } else {
        const generated = buildJapaneseSentenceForWord(entry);
        pendingTranslations.push({
          level,
          entry,
          ja: generated.ja,
          furigana: generated.furigana,
        });
      }
    }
  }

  const sentencesToTranslate = pendingTranslations.map((item) => item.ja);
  const { results, stats } = await client.translateBatch(sentencesToTranslate, {
    mode: "sentence",
    dryRun: options.dryRun,
    limitChars: options.limitChars,
  });

  console.log(`\n=== Vocabulary Examples Enrichment Summary ${options.dryRun ? "(DRY RUN)" : ""} ===`);
  console.log(`Matched from local sentence corpus: ${corpusMatchedCount}`);
  console.log(`Generated sentences needing DeepL : ${pendingTranslations.length}`);
  console.log(`Cached hits in deepl-cache.json   : ${stats.cachedHits}`);
  console.log(`Uncached sentences for DeepL API  : ${stats.uncachedTexts}`);
  console.log(`Uncached character count          : ${stats.uncachedChars} chars`);

  if (options.dryRun) {
    return;
  }

  for (const item of pendingTranslations) {
    const en = results.get(item.ja);
    if (en) {
      item.entry.examples = [
        {
          ja: item.ja,
          furigana: item.furigana,
          en,
        },
      ];
    }
  }

  for (const [level, entries] of entriesByLevel.entries()) {
    const file = resolve(root, `public/data/v1/vocabulary/${level}.json`);
    await writeFile(file, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  }
  console.log(`Saved enriched vocabulary files (N5..N1).`);
}

async function main(): Promise<void> {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const client = new DeepLClient(resolve(root, "data-raw/deepl-cache.json"));

  const { apiKey } = getDeepLConfig();
  if (!args.dryRun && apiKey) {
    try {
      const beforeUsage = await client.getUsage();
      console.log(
        `DeepL Character Usage (Before): ${beforeUsage.character_count.toLocaleString()} / ${beforeUsage.character_limit.toLocaleString()}`
      );
    } catch (error) {
      console.warn("Could not fetch initial DeepL usage:", error);
    }
  }

  if (args.dryRun) {
    await enrichShiritori(client, root, { dryRun: true, limitChars: args.limitChars });
    await enrichVocabExamples(client, root, { dryRun: true, limitChars: args.limitChars });
    return;
  }

  if (args.target === "shiritori" || args.target === "all") {
    await enrichShiritori(client, root, { dryRun: false, limitChars: args.limitChars });
  }

  if (args.target === "vocab-examples" || args.target === "all") {
    await enrichVocabExamples(client, root, { dryRun: false, limitChars: args.limitChars });
  }

  if (apiKey) {
    try {
      const afterUsage = await client.getUsage();
      console.log(
        `\nDeepL Character Usage (After): ${afterUsage.character_count.toLocaleString()} / ${afterUsage.character_limit.toLocaleString()}`
      );
    } catch (error) {
      console.warn("Could not fetch final DeepL usage:", error);
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

