import fs from "node:fs";
import path from "node:path";
import { DeepLClient } from "./lib/deepl-client";

const ROOT_DIR = process.cwd();
const DEEPL_CACHE_PATH = path.join(ROOT_DIR, "data-raw/deepl-cache.json");
const MNN_JSON_PATH = path.join(ROOT_DIR, "public/data/v1/books/mnn-1.json");
const VOCAB_MDX_PATH = path.join(ROOT_DIR, "src/data/books/mnn1-vocabulary.mdx");

// 1. Fix truncated vocabulary meanings in mnn1-vocabulary.mdx
function fixVocabMdx() {
  console.log("--> Cleaning truncated vocabulary definitions in mnn1-vocabulary.mdx...");
  let content = fs.readFileSync(VOCAB_MDX_PATH, "utf8");

  const fixes: [RegExp, string][] = [
    [
      /\| that person, he, she\(あの かた is the \|/g,
      "| that person, he, she (あの かた is the polite equivalent of あのひと) |",
    ],
    [
      /\| \(suffix often added to a child's name \|/g,
      "| (suffix often added to a child's name instead of ～さん) |",
    ],
    [
      /\| \(suffix meaning 'a national of '; \|/g,
      "| (suffix meaning 'a national of', e.g. アメリカ人) |",
    ],
    [
      /\| employee of ～ company\(used with a \|/g,
      "| employee of ～ company (used with a company name, e.g. IMCの社員) |",
    ],
    [
      /\| who\(どなた is the polite equivalent of \|/g,
      "| who (どなた is the polite equivalent of だれ) |",
    ],
    [
      /\| h o w o l d \( おいくつ i s t h e p o l i t e \|/g,
      "| how old (おいくつ is the polite equivalent of なんさい) |",
    ],
    [
      /\| Pleased to meet you, too\.\(response to \|/g,
      "| Pleased to meet you, too (response to [どうぞ]よろしく) |",
    ],
    [
      /\| this way, \|/g,
      "| this way, this place (polite equivalent of これ・ここ) |",
    ],
    [
      /\| that way, that place near the listener\(polite \|/g,
      "| that way, that place near the listener (polite equivalent of それ・そこ) |",
    ],
    [
      /\| that way, that place over there\(polite equivalent \|/g,
      "| that way, that place over there (polite equivalent of あれ・あそこ) |",
    ],
    [
      /\| which way, where\(polite equivalent \|/g,
      "| which way, where (polite equivalent of どれ・どこ) |",
    ],
    [
      /\| cherry-blossom viewing\(～を しま \|/g,
      "| cherry-blossom viewing (～を します: view cherry blossoms) |",
    ],
    [
      /\| get tired\(when expressing the condition \|/g,
      "| get tired (when expressing condition: 疲れました) |",
    ],
    [
      /\| get thirsty\(when expressing the \|/g,
      "| get thirsty (when expressing condition: のどが かわきました) |",
    ],
    [
      /\| get hungry\( when expressing the \|/g,
      "| get hungry (when expressing condition: おなかが すきました) |",
    ],
    [
      /\| this way, this place\( an informal \|/g,
      "| this way, this place (an informal equivalent of こちら・ここ) |",
    ],
    [
      /\| that way, that place over there\( an \|/g,
      "| that way, that place over there (an informal equivalent of あちら・あそこ) |",
    ],
    [
      /\| which one\(of two things\), which way, where\( an informal equivalent of \|/g,
      "| which one (of two things), which way, where (an informal equivalent of どちら・どこ) |",
    ],
    [
      /\| quit or retire from \[a company\], stop, \|/g,
      "| quit or retire from [a company], stop, give up |",
    ],
    [
      /\| talk, speech, what one says, story\(～ \|/g,
      "| talk, speech, what one says, story (～を します: have a talk) |",
    ],
  ];

  for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
  }

  fs.writeFileSync(VOCAB_MDX_PATH, content, "utf8");
  console.log("Cleaned mnn1-vocabulary.mdx entries.");
}

async function main() {
  fixVocabMdx();

  const deepl = new DeepLClient(DEEPL_CACHE_PATH);
  await deepl.loadCache();

  // 2. Add manual grammar translations for Lesson 1
  const manualGrammarTranslations: Record<string, string> = {
    "［あなたは］マイク・ミラーさんですか。……はい、［わたしは］マイク・ミラーです。":
      "Are you Mr. Mike Miller? ...Yes, I am Mike Miller.",
    "ミラーさんは学生ですか。……いいえ、［わたしは］学生じゃありません。":
      "Are you a student, Mr. Miller? ...No, I am not a student.",
    "ワンさんは銀行員ですか。……いいえ、［ワンさんは］銀行員じゃありません。医者です。":
      "Is Mr. Wang a bank employee? ...No, he is not a bank employee. He is a doctor.",
    "あの方はどなたですか。……ワットさんです。さくら大学の先生です。":
      "Who is that person? ...That is Mr. Watt. He is a professor at Sakura University.",
    "テレーザちゃんは何歳ですか。……9歳です。":
      "How old is Teresa? ...She is 9 years old.",
    "グプタさんは会社員ですか。……はい、会社員です。カリナさんも会社員ですか。……いいえ、［カリナさんは］学生です。":
      "Is Mr. Gupta a company employee? ...Yes, he is. Is Ms. Karina also a company employee? ...No, she is a student.",
  };

  for (const [ja, en] of Object.entries(manualGrammarTranslations)) {
    (deepl as any).cache[`ja->en:sentence:${ja}`] = en;
  }

  // 3. Collect all missing practice drill answers in MNN 1
  const mnnData = JSON.parse(fs.readFileSync(MNN_JSON_PATH, "utf8"));
  const toTranslate = new Set<string>();

  for (const lesson of mnnData.lessons) {
    for (const p of (lesson.practice || [])) {
      for (const item of (p.items || [])) {
        const a = (item.answer || "").trim();
        if (!a) continue;
        const hit = deepl.getCached(a, "sentence");
        if (!hit) {
          toTranslate.add(a);
        }
      }
    }
  }

  const uniqueList = Array.from(toTranslate);
  console.log(`\nFound ${uniqueList.length} unique practice drill answers requiring DeepL translation.`);

  if (uniqueList.length > 0) {
    const usageBefore = await deepl.getUsage();
    console.log(`DeepL API usage before: ${usageBefore.character_count} / ${usageBefore.character_limit} chars`);

    const { results, stats } = await deepl.translateBatch(uniqueList, {
      mode: "sentence",
    });

    console.log(
      `DeepL batch translation complete: ${stats.translatedTexts} newly translated (${stats.translatedChars} chars).`
    );

    const usageAfter = await deepl.getUsage();
    console.log(`DeepL API usage after: ${usageAfter.character_count} / ${usageAfter.character_limit} chars`);
  } else {
    await deepl.saveCache();
    console.log("All practice drill answers already cached.");
  }
}

main().catch((err) => {
  console.error("DeepL enrichment failed:", err);
  process.exit(1);
});
