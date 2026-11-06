import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import kuromoji from "kuromoji";
import {
  extractEndKana,
  extractStartKana,
  hasEnglishGloss,
  hiraganaToRomaji,
  katakanaToHiragana,
  type ShiritoriLevel,
  type ShiritoriWord,
} from "../src/engine/shiritori";
import { DeepLClient, getDeepLConfig } from "./lib/deepl-client";

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

interface RawDictionaryIndex {
  vocab?: Array<{
    word: string;
    reading: string;
    meanings?: string[];
  }>;
  kanji?: Record<
    string,
    {
      label?: string;
      meanings?: string[];
    }
  >;
}

const MEANING_OVERRIDES: Record<string, string> = {
  貘: "tapir",
  バク: "tapir",
  ばく: "tapir",
  ライ: "rye",
  らい: "rye",
  ルーバー: "louver",
  るーばー: "louver",
  散: "scatter, disperse",
  冠木: "lintel; crossbeam",
  歌舞伎: "kabuki (Japanese theatre)",
  区々: "various; diverse",
  九九: "multiplication table",
};

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

function isJapaneseText(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9faf]/.test(text);
}

async function loadKuromojiNouns(
  dicPath: string
): Promise<{ rawReadings: Record<string, string>; kuromojiNouns: Array<{ word: string; kana: string }> }> {
  return new Promise((resolvePromise, rejectPromise) => {
    kuromoji.builder({ dicPath }).build((err, tokenizer) => {
      if (err) return rejectPromise(err);
      const tid = (tokenizer as unknown as { token_info_dictionary: { target_map: Record<string, number[]>; getFeatures: (id: number) => string } }).token_info_dictionary;
      const seenIds = new Set<number>();
      const rawReadings: Record<string, string> = {};
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

            if (!rawReadings[hiragana]) {
              rawReadings[hiragana] = surface;
              kuromojiNouns.push({ word: surface, kana: hiragana });
            }
          }
        }
      }

      resolvePromise({ rawReadings, kuromojiNouns });
    });
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const deduped = new Map<string, ShiritoriWord>();

  // 1. Load DeepL Cache
  const deeplCacheFile = resolve(root, "data-raw/deepl-cache.json");
  let deeplCache: Record<string, string> = {};
  if (existsSync(deeplCacheFile)) {
    try {
      deeplCache = JSON.parse(await readFile(deeplCacheFile, "utf8")) as Record<string, string>;
    } catch {
      deeplCache = {};
    }
  }

  // 2. Load Single-Kanji JLPT dataset
  const kanjiFile = resolve(root, "data-raw/kanji_jlpt_only.json");
  const kanjiMap: Record<string, RawKanji> = existsSync(kanjiFile)
    ? (JSON.parse(await readFile(kanjiFile, "utf8")) as Record<string, RawKanji>)
    : {};

  // 3. Load Main Dictionary Index dataset
  const dictIndexFile = resolve(root, "public/data/v1/dictionary-index.json");
  let dictData: RawDictionaryIndex = {};
  if (existsSync(dictIndexFile)) {
    try {
      dictData = JSON.parse(await readFile(dictIndexFile, "utf8")) as RawDictionaryIndex;
    } catch {
      dictData = {};
    }
  }

  const dictVocabMap = new Map<string, string>();
  if (Array.isArray(dictData.vocab)) {
    for (const v of dictData.vocab) {
      const gloss = v.meanings?.find((m) => m && m.trim())?.trim();
      if (!gloss || isJapaneseText(gloss)) continue;
      const cleanW = v.word?.trim().normalize("NFKC");
      const cleanR = katakanaToHiragana(v.reading?.trim() ?? "").normalize("NFKC");
      if (cleanW && !dictVocabMap.has(cleanW)) dictVocabMap.set(cleanW, gloss);
      if (cleanR && !dictVocabMap.has(cleanR)) dictVocabMap.set(cleanR, gloss);
      if (cleanW && cleanR && !dictVocabMap.has(`${cleanW}\u0000${cleanR}`)) {
        dictVocabMap.set(`${cleanW}\u0000${cleanR}`, gloss);
      }
    }
  }

  const dictKanjiMap = new Map<string, string>();
  if (dictData.kanji) {
    for (const [char, k] of Object.entries(dictData.kanji)) {
      const gloss = k.label?.trim() || k.meanings?.find((m) => m && m.trim())?.trim();
      if (gloss && !isJapaneseText(gloss)) {
        dictKanjiMap.set(char, gloss);
      }
    }
  }

  // 4. Load OpenJLPT and Public JLPT vocabularies
  const jlptVocabMap = new Map<string, string>();
  const levels: Array<{ source: string; level: ShiritoriLevel }> = [
    { source: "n5", level: 5 },
    { source: "n4", level: 4 },
    { source: "n3", level: 3 },
    { source: "n2", level: 2 },
    { source: "n1", level: 1 },
  ];

  for (const { source } of levels) {
    const files = [
      resolve(root, `src/data/openjlpt/vocab/${source}.json`),
      resolve(root, `public/data/v1/vocabulary/${source.toUpperCase()}.json`),
    ];
    for (const file of files) {
      if (!existsSync(file)) continue;
      const rows = JSON.parse(await readFile(file, "utf8")) as RawVocabularyRow[];
      for (const row of rows) {
        if (!isNounPos(row.pos)) continue;
        const w = row.word?.trim().normalize("NFKC") ?? "";
        const r = katakanaToHiragana(row.reading?.trim() ?? "").normalize("NFKC");
        const meaning = row.meanings?.find((m) => m && m.trim())?.trim() ?? "";
        if (!meaning || isJapaneseText(meaning)) continue;
        if (w && !jlptVocabMap.has(w)) jlptVocabMap.set(w, meaning);
        if (r && !jlptVocabMap.has(r)) jlptVocabMap.set(r, meaning);
        if (w && r && !jlptVocabMap.has(`${w}\u0000${r}`)) {
          jlptVocabMap.set(`${w}\u0000${r}`, meaning);
        }
      }
    }
  }

  // Comprehensive Meaning Resolver
  function resolveGloss(word: string, reading: string): string | undefined {
    const cleanW = word.trim().normalize("NFKC");
    const cleanR = katakanaToHiragana(reading.trim()).normalize("NFKC").replace(/[\s・]/g, "");

    // 0. Curated Overrides
    if (MEANING_OVERRIDES[cleanW]) return MEANING_OVERRIDES[cleanW];
    if (MEANING_OVERRIDES[cleanR]) return MEANING_OVERRIDES[cleanR];

    // 1. JLPT Vocab
    const jlptMatch =
      jlptVocabMap.get(`${cleanW}\u0000${cleanR}`) ??
      jlptVocabMap.get(cleanW) ??
      jlptVocabMap.get(cleanR);
    if (jlptMatch && !isJapaneseText(jlptMatch)) return jlptMatch;

    // 2. Dictionary Index Vocab
    const dictMatch =
      dictVocabMap.get(`${cleanW}\u0000${cleanR}`) ??
      dictVocabMap.get(cleanW) ??
      dictVocabMap.get(cleanR);
    if (dictMatch && !isJapaneseText(dictMatch)) return dictMatch;

    // 3. Single-kanji meanings
    if ([...cleanW].length === 1 && /[\u4e00-\u9faf]/.test(cleanW)) {
      const kEntry = kanjiMap[cleanW];
      const kMeaning = kEntry?.meanings?.find((m) => m && m.trim())?.trim();
      if (kMeaning) return kMeaning;

      const dKanjiMeaning = dictKanjiMap.get(cleanW);
      if (dKanjiMeaning) return dKanjiMeaning;
    }

    // 4. DeepL Cache
    const cachedGloss =
      deeplCache[`ja->en:gloss:${cleanW}`] ?? deeplCache[`ja->en:gloss:${cleanR}`];
    if (
      cachedGloss &&
      !isJapaneseText(cachedGloss) &&
      cachedGloss !== cleanW &&
      cachedGloss !== cleanR
    ) {
      return cachedGloss;
    }

    return undefined;
  }

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
      isJapaneseText(resolvedMeaning);

    if (isJapaneseFallback) {
      const found = resolveGloss(cleanWord, cleanReading);
      if (found) {
        resolvedMeaning = found;
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

  // 1. Add Curated Words
  for (const item of CURATED_WORDS) {
    addWord(item.word, item.kana, item.meaning, item.jlpt, "curated");
  }

  // 2. Add OpenJLPT vocabulary
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

  // 3. Add Public JLPT vocabulary datasets
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

  // 4. Add single-kanji kun'yomi noun readings from data-raw/kanji_jlpt_only.json
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
  const { rawReadings, kuromojiNouns } = await loadKuromojiNouns(dicPath);

  // Add rich Kuromoji nouns to ensure words.json has 18,000 words
  for (const { word, kana } of kuromojiNouns) {
    if (deduped.size >= 18000) break;
    if (kana.length >= 2 && kana.length <= 6) {
      const gloss = resolveGloss(word, kana) ?? (word !== kana ? word : kana);
      addWord(word, kana, gloss, 4, "kuromoji");
    }
  }

  // Build raw validReadings map (kana -> surface)
  const validReadingsRaw: Record<string, string> = { ...rawReadings };
  for (const item of CURATED_WORDS) {
    if (!validReadingsRaw[item.kana]) {
      validReadingsRaw[item.kana] = item.word;
    }
  }
  for (const item of deduped.values()) {
    if (!validReadingsRaw[item.kana]) {
      validReadingsRaw[item.kana] = item.word;
    }
  }

  // Convert to Tuple Map: kana -> [surface, meaning]
  const validReadingsTuple: Record<string, [string, string]> = {};
  const missingForDeepL: string[] = [];

  for (const [kana, surface] of Object.entries(validReadingsRaw)) {
    const gloss = resolveGloss(surface, kana) ?? deduped.get(`${surface}\u0000${kana}`)?.meaning;
    if (gloss && !isJapaneseText(gloss) && gloss !== surface && gloss !== kana) {
      validReadingsTuple[kana] = [surface, gloss];
    } else {
      validReadingsTuple[kana] = [surface, "valid noun"];
      if (kana.length >= 2 && kana.length <= 5) {
        missingForDeepL.push(surface);
      }
    }
  }

  // DeepL Batch Pass for missing common 2-5 mora nouns (capped at <= 25,000 characters)
  const { apiKey } = getDeepLConfig();
  if (apiKey && missingForDeepL.length > 0 && !process.argv.includes("--no-deepl")) {
    try {
      const client = new DeepLClient(deeplCacheFile);
      await client.loadCache();
      const uniqueMissing = [...new Set(missingForDeepL)];
      console.log(`[DeepL] Checking batch pass for ${uniqueMissing.length} missing common nouns...`);
      const { results, stats } = await client.translateBatch(uniqueMissing, {
        mode: "gloss",
        limitChars: 25000,
      });

      console.log(
        `[DeepL] Batch finished: ${stats.translatedTexts} translated (${stats.translatedChars} chars).`
      );

      // Apply newly translated results to validReadingsTuple and deduped words
      for (const [kana, [surface, currentMeaning]] of Object.entries(validReadingsTuple)) {
        if (currentMeaning === "valid noun") {
          const fresh = results.get(surface) ?? results.get(kana);
          if (fresh && !isJapaneseText(fresh)) {
            validReadingsTuple[kana] = [surface, fresh];
            const dedupedKey = `${surface}\u0000${kana}`;
            const existingWord = deduped.get(dedupedKey);
            if (existingWord && !hasEnglishGloss(existingWord)) {
              existingWord.meaning = fresh;
            }
          }
        }
      }
    } catch (deeplErr) {
      console.warn("[DeepL] Translation pass encountered error, proceeding gracefully:", deeplErr);
    }
  }

  const outDir = resolve(root, "public/data/v1/shiritori");
  await mkdir(outDir, { recursive: true });

  const outputWords = [...deduped.values()];
  const wordsPath = resolve(outDir, "words.json");
  const validPath = resolve(outDir, "valid-readings.json");

  await writeFile(wordsPath, `${JSON.stringify(outputWords)}\n`, "utf8");
  await writeFile(validPath, `${JSON.stringify(validReadingsTuple)}\n`, "utf8");

  const resolvedTupleCount = Object.values(validReadingsTuple).filter(
    ([, meaning]) => meaning && meaning !== "valid noun"
  ).length;

  console.log(`✓ Built Shiritori rich words: ${outputWords.length} records -> public/data/v1/shiritori/words.json`);
  console.log(
    `✓ Built Shiritori valid readings tuple: ${Object.keys(validReadingsTuple).length} entries (${resolvedTupleCount} with full English definitions) -> public/data/v1/shiritori/valid-readings.json`
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
