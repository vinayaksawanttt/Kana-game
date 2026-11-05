import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import kuromoji from "kuromoji";
import {
  extractEndKana,
  extractStartKana,
  hiraganaToRomaji,
  katakanaToHiragana,
  type ShiritoriLevel,
  type ShiritoriWord,
} from "../src/engine/shiritori";

interface RawVocabularyRow {
  id?: string;
  word?: string;
  reading?: string;
  romaji?: string;
  meanings?: string[];
  level?: string;
  pos?: string[];
}

interface RawKanji {
  kanji: string;
  jlpt: number;
  grade: number;
  meanings: string[];
  on_readings: string[];
  kun_readings: string[];
}

const CURATED_WORDS: Array<{
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  jlpt: ShiritoriLevel;
}> = [
  { word: "力士", kana: "りきし", romaji: "rikishi", meaning: "sumo wrestler", jlpt: 3 },
  { word: "リス", kana: "りす", romaji: "risu", meaning: "squirrel", jlpt: 4 },
  { word: "りんご", kana: "りんご", romaji: "ringo", meaning: "apple", jlpt: 5 },
  { word: "料理", kana: "りょうり", romaji: "ryouri", meaning: "cooking; cuisine", jlpt: 5 },
  { word: "旅行", kana: "りょこう", romaji: "ryokou", meaning: "travel; trip", jlpt: 5 },
  { word: "写真", kana: "しゃしん", romaji: "shashin", meaning: "photograph; photo", jlpt: 5 },
  { word: "社会", kana: "しゃかい", romaji: "shakai", meaning: "society", jlpt: 4 },
  { word: "しりとり", kana: "しりとり", romaji: "shiritori", meaning: "word-chain game", jlpt: 5 },
  { word: "歴史", kana: "れきし", romaji: "rekishi", meaning: "history", jlpt: 4 },
  { word: "連絡", kana: "れんらく", romaji: "renraku", meaning: "contact; message", jlpt: 4 },
  { word: "練習", kana: "れんしゅう", romaji: "renshuu", meaning: "practice", jlpt: 5 },
  { word: "冷蔵庫", kana: "れいぞうこ", romaji: "reizouko", meaning: "refrigerator", jlpt: 5 },
  { word: "ろうそく", kana: "ろうそく", romaji: "rousoku", meaning: "candle", jlpt: 3 },
  { word: "廊下", kana: "ろうか", romaji: "rouka", meaning: "corridor; hallway", jlpt: 4 },
  { word: "六", kana: "ろく", romaji: "roku", meaning: "six", jlpt: 5 },
  { word: "ロケット", kana: "ろけっと", romaji: "roketto", meaning: "rocket", jlpt: 3 },
  { word: "ロボット", kana: "ろぼっと", romaji: "robotto", meaning: "robot", jlpt: 3 },
  { word: "理科", kana: "りか", romaji: "rika", meaning: "science", jlpt: 4 },
  { word: "理由", kana: "りゆう", romaji: "riyou", meaning: "reason", jlpt: 4 },
  { word: "理解", kana: "りかい", romaji: "rikai", meaning: "understanding", jlpt: 3 },
  { word: "利用", kana: "りよう", romaji: "riyou", meaning: "use; utilization", jlpt: 4 },
  { word: "留学生", kana: "りゅうがくせい", romaji: "ryuugakusei", meaning: "international student", jlpt: 5 },
  { word: "流行", kana: "りゅうこう", romaji: "ryuukou", meaning: "trend; fashion", jlpt: 3 },
  { word: "両親", kana: "りょうしん", romaji: "ryoushin", meaning: "parents", jlpt: 5 },
  { word: "料金", kana: "りょうきん", romaji: "ryoukin", meaning: "fee; fare", jlpt: 4 },
  { word: "旅館", kana: "りょかん", romaji: "ryokan", meaning: "traditional Japanese inn", jlpt: 4 },
  { word: "緑茶", kana: "りょくちゃ", romaji: "ryokucha", meaning: "green tea", jlpt: 4 },
  { word: "林道", kana: "りんどう", romaji: "rindou", meaning: "woodland path", jlpt: 2 },
  { word: "リンス", kana: "りんす", romaji: "rinsu", meaning: "conditioner; rinse", jlpt: 3 },
  { word: "ゴリラ", kana: "ごりら", romaji: "gorira", meaning: "gorilla", jlpt: 4 },
  { word: "ラッパ", kana: "らっぱ", romaji: "rappa", meaning: "trumpet; horn", jlpt: 4 },
  { word: "パンダ", kana: "ぱんだ", romaji: "panda", meaning: "panda", jlpt: 5 },
  { word: "団子", kana: "だんご", romaji: "dango", meaning: "dumpling", jlpt: 4 },
  { word: "太鼓", kana: "たいこ", romaji: "taiko", meaning: "Japanese drum", jlpt: 4 },
  { word: "独楽", kana: "こま", romaji: "koma", meaning: "spinning top", jlpt: 4 },
  { word: "枕", kana: "まくら", romaji: "makura", meaning: "pillow", jlpt: 4 },
  { word: "毛糸", kana: "けいと", romaji: "keito", meaning: "knitting wool", jlpt: 4 },
  { word: "トマト", kana: "とまと", romaji: "tomato", meaning: "tomato", jlpt: 5 },
  { word: "時計", kana: "とけい", romaji: "tokei", meaning: "clock; watch", jlpt: 5 },
  { word: "机", kana: "つくえ", romaji: "tsukue", meaning: "desk", jlpt: 5 },
  { word: "鉛筆", kana: "えんぴつ", romaji: "enpitsu", meaning: "pencil", jlpt: 5 },
  { word: "鞄", kana: "かばん", romaji: "kaban", meaning: "bag", jlpt: 5 },
  { word: "帽子", kana: "ぼうし", romaji: "boushi", meaning: "hat; cap", jlpt: 5 },
  { word: "眼鏡", kana: "めがね", romaji: "megane", meaning: "glasses", jlpt: 5 },
  { word: "財布", kana: "さいふ", romaji: "saifu", meaning: "wallet", jlpt: 5 },
  { word: "鍵", kana: "かぎ", romaji: "kagi", meaning: "key", jlpt: 5 },
  { word: "車", kana: "くるま", romaji: "kuruma", meaning: "car", jlpt: 5 },
  { word: "電車", kana: "でんしゃ", romaji: "densha", meaning: "train", jlpt: 5 },
  { word: "飛行機", kana: "ひこうき", romaji: "hikouki", meaning: "airplane", jlpt: 5 },
  { word: "船", kana: "ふね", romaji: "fune", meaning: "ship; boat", jlpt: 5 },
  { word: "自転車", kana: "じてんしゃ", romaji: "jitensha", meaning: "bicycle", jlpt: 5 },
];

function isNounPos(pos?: string[]): boolean {
  if (!pos || !pos.length) return true;
  return pos.some(
    (p) =>
      p === "n" ||
      p.startsWith("n-") ||
      p === "noun" ||
      p === "vs" ||
      p.includes("noun")
  );
}

async function loadKuromojiNouns(
  dicPath: string
): Promise<{ validReadings: Record<string, string>; kuromojiNouns: Array<{ word: string; kana: string }> }> {
  return new Promise((resolvePromise, rejectPromise) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) return rejectPromise(err);
      const tid = (tokenizer as unknown as { token_info_dictionary: { target_map: Record<string, number[]>; getFeatures: (id: number) => string } }).token_info_dictionary;
      const seenIds = new Set<number>();
      const validReadings: Record<string, string> = {};
      const kuromojiNouns: Array<{ word: string; kana: string }> = [];

      for (const k in tid.target_map) {
        for (const id of tid.target_map[k]) {
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          const feat = tid.getFeatures(id);
          if (!feat) continue;
          const parts = feat.split(",");
          const surface = parts[0]?.trim();
          const pos = parts[1];
          const pos1 = parts[2];
          const katakana = parts[8];

          if (pos === "名詞" && (pos1 === "一般" || pos1 === "サ変接続")) {
            if (!katakana || katakana === "*" || !/^[ァ-ヴー]+$/.test(katakana)) continue;
            if (!surface || surface.includes("、") || surface.includes("。")) continue;
            const hiragana = katakanaToHiragana(katakana).normalize("NFKC");
            if ([...hiragana].length < 2) continue;
            if (!/^[\u3041-\u3096ー]+$/.test(hiragana)) continue;

            if (!validReadings[hiragana]) {
              validReadings[hiragana] = surface;
              kuromojiNouns.push({ word: surface, kana: hiragana });
            }
          }
        }
      }

      resolvePromise({ validReadings, kuromojiNouns });
    });
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const deduped = new Map<string, ShiritoriWord>();

  const deeplCacheFile = resolve(root, "data-raw/deepl-cache.json");
  let deeplCache: Record<string, string> = {};
  if (existsSync(deeplCacheFile)) {
    try {
      deeplCache = JSON.parse(await readFile(deeplCacheFile, "utf8")) as Record<string, string>;
    } catch {
      deeplCache = {};
    }
  }

  const kanjiFile = resolve(root, "data-raw/kanji_jlpt_only.json");
  const kanjiMap: Record<string, RawKanji> = existsSync(kanjiFile)
    ? (JSON.parse(await readFile(kanjiFile, "utf8")) as Record<string, RawKanji>)
    : {};

  const addWord = (
    word: string,
    reading: string,
    meaning: string,
    jlpt: ShiritoriLevel,
    idPrefix = "shiritori"
  ) => {
    const cleanWord = word.trim().normalize("NFKC");
    const cleanReading = katakanaToHiragana(reading.trim()).normalize("NFKC").replace(/[\s・]/g, "");
    if (!cleanWord || !cleanReading) return;
    if (!/^[\u3041-\u3096ー]+$/.test(cleanReading)) return;
    if ([...cleanReading].length < 2) return;

    const startKana = extractStartKana(cleanReading);
    const endKana = extractEndKana(cleanReading);
    if (!startKana || !endKana) return;

    let resolvedMeaning = meaning.trim();
    const isJapaneseFallback =
      !resolvedMeaning ||
      resolvedMeaning === cleanWord ||
      resolvedMeaning === cleanReading ||
      /[\u3040-\u30ff\u4e00-\u9faf]/.test(resolvedMeaning);

    if (isJapaneseFallback) {
      const cachedGloss =
        deeplCache[`ja->en:gloss:${cleanWord}`] ??
        deeplCache[`ja->en:gloss:${cleanReading}`] ??
        kanjiMap[cleanWord]?.meanings?.[0]?.trim();
      if (cachedGloss) {
        resolvedMeaning = cachedGloss;
      }
    }

    const key = `${cleanWord}\u0000${cleanReading}`;
    if (!deduped.has(key)) {
      const romaji = hiraganaToRomaji(cleanReading);
      deduped.set(key, {
        id: `${idPrefix}:${cleanWord}:${cleanReading}`,
        word: cleanWord,
        kana: cleanReading,
        romaji,
        meaning: resolvedMeaning || cleanWord,
        jlpt,
        startKana,
        endKana,
      });
    }
  };

  // 1. Add curated everyday words first
  for (const item of CURATED_WORDS) {
    addWord(item.word, item.kana, item.meaning, item.jlpt, "curated");
  }

  // 2. Load OpenJLPT vocabulary
  const levels: Array<{ source: string; level: ShiritoriLevel }> = [
    { source: "n5", level: 5 },
    { source: "n4", level: 4 },
    { source: "n3", level: 3 },
    { source: "n2", level: 2 },
    { source: "n1", level: 1 },
  ];

  for (const { source, level } of levels) {
    const file = resolve(root, `src/data/openjlpt/vocab/${source}.json`);
    if (!existsSync(file)) continue;
    const rows = JSON.parse(await readFile(file, "utf8")) as RawVocabularyRow[];
    for (const row of rows) {
      if (!isNounPos(row.pos)) continue;
      const word = row.word?.trim() ?? "";
      const reading = row.reading?.trim() ?? "";
      const meaning = row.meanings?.find((m) => m.trim())?.trim() ?? "";
      if (word && reading) {
        addWord(word, reading, meaning, level, `jlpt-${source}`);
      }
    }
  }

  // 3. Load Public JLPT vocabulary datasets
  for (const { source, level } of levels) {
    const file = resolve(root, `public/data/v1/vocabulary/${source.toUpperCase()}.json`);
    if (!existsSync(file)) continue;
    const rows = JSON.parse(await readFile(file, "utf8")) as RawVocabularyRow[];
    for (const row of rows) {
      if (!isNounPos(row.pos)) continue;
      const word = row.word?.trim() ?? "";
      const reading = row.reading?.trim() ?? "";
      const meaning = row.meanings?.find((m) => m.trim())?.trim() ?? "";
      if (word && reading) {
        addWord(word, reading, meaning, level, `pub-${source}`);
      }
    }
  }

  // 4. Load single-kanji kun'yomi noun readings from data-raw/kanji_jlpt_only.json
  for (const [char, k] of Object.entries(kanjiMap)) {
    const jlptLevel = ([1, 2, 3, 4, 5].includes(k.jlpt) ? k.jlpt : 5) as ShiritoriLevel;
    const meaning = k.meanings?.[0]?.trim() ?? char;
    for (const kun of k.kun_readings ?? []) {
      if (kun.includes(".")) continue;
      const cleanKun = kun.replace(/^-|-$/g, "").trim();
      if (cleanKun.length >= 2 && /^[ぁ-ん]+$/.test(cleanKun)) {
        addWord(char, cleanKun, meaning, jlptLevel, "kanji-kun");
      }
    }
  }

  // 5. Load Kuromoji IPADIC Lexicon
  const dicPath = resolve(root, "node_modules/kuromoji/dict");
  const { validReadings, kuromojiNouns } = await loadKuromojiNouns(dicPath);

  // Add rich Kuromoji nouns to ensure words.json has 12,000–20,000+ words
  for (const { word, kana } of kuromojiNouns) {
    if (deduped.size >= 18000) break;
    if (kana.length >= 2 && kana.length <= 6) {
      addWord(word, kana, word !== kana ? word : kana, 4, "kuromoji");
    }
  }

  // Ensure curated words and deduped words are also present in validReadings
  for (const item of CURATED_WORDS) {
    if (!validReadings[item.kana]) {
      validReadings[item.kana] = item.word;
    }
  }
  for (const item of deduped.values()) {
    if (!validReadings[item.kana]) {
      validReadings[item.kana] = item.word;
    }
  }

  const outDir = resolve(root, "public/data/v1/shiritori");
  await mkdir(outDir, { recursive: true });

  const outputWords = [...deduped.values()];
  const wordsPath = resolve(outDir, "words.json");
  const validPath = resolve(outDir, "valid-readings.json");

  await writeFile(wordsPath, `${JSON.stringify(outputWords)}\n`, "utf8");
  await writeFile(validPath, `${JSON.stringify(validReadings)}\n`, "utf8");

  console.log(`✓ Built Shiritori rich words: ${outputWords.length} records -> public/data/v1/shiritori/words.json`);
  console.log(`✓ Built Shiritori valid readings: ${Object.keys(validReadings).length} entries -> public/data/v1/shiritori/valid-readings.json`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
