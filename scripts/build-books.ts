import fs from "node:fs";
import path from "node:path";
import type {
  BookCatalogEntry,
  BookDetail,
  BookDialogueLine,
  BookDialogueScene,
  BookGrammarItem,
  BookKanjiItem,
  BookLesson,
  BookPracticeItem,
  BookPracticeSection,
  BookReadingParagraph,
  BookReadingQuestion,
  BookReadingSection,
  BookReadingVocabCheckItem,
  BookVocabItem,
} from "../src/data/books";

// --- File Paths ---
const ROOT_DIR = process.cwd();
const BOOKS_MDX_DIR = path.join(ROOT_DIR, "src/data/books");
const PUBLIC_BOOKS_DIR = path.join(ROOT_DIR, "public/data/v1/books");
const VOCAB_DIR = path.join(ROOT_DIR, "public/data/v1/vocabulary");
const GRAMMAR_DIR = path.join(ROOT_DIR, "public/data/v1/grammar");
const DICT_INDEX_PATH = path.join(ROOT_DIR, "public/data/v1/dictionary-index.json");
const AUDIO_MANIFEST_PATH = path.join(ROOT_DIR, "src/data/audio-manifest.generated.ts");
const DEEPL_CACHE_PATH = path.join(ROOT_DIR, "data-raw/deepl-cache.json");

let deeplCache: Record<string, string> = {};
if (fs.existsSync(DEEPL_CACHE_PATH)) {
  try {
    deeplCache = JSON.parse(fs.readFileSync(DEEPL_CACHE_PATH, "utf8"));
  } catch {
    deeplCache = {};
  }
}

function lookupDeepLTranslation(text: string): string | undefined {
  const trimmed = text.trim();
  return (
    deeplCache[`ja->en:sentence:${trimmed}`] ||
    deeplCache[`ja->en:story-sentence:${trimmed}`] ||
    deeplCache[`ja->en:gloss:${trimmed}`]
  );
}

// --- Hepburn Romaji to Kana Converter ---
const ROMAJI_TO_HIRA: Record<string, string> = {
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ", jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ",
  ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wo: "を",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  n: "ん",
};

function romajiToHiragana(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/oo/g, "ou").replace(/ee/g, "ei");
  let result = "";
  let i = 0;
  while (i < s.length) {
    if (/[ \-_'’]/.test(s[i])) {
      i++;
      continue;
    }
    // Sokuon (double consonant)
    if (
      i + 1 < s.length &&
      s[i] === s[i + 1] &&
      /[bcdfghjklmpqrstvwxyz]/.test(s[i]) &&
      s[i] !== "n"
    ) {
      result += "っ";
      i++;
      continue;
    }
    // Syllabic 'n'
    if (s[i] === "n") {
      if (i + 1 >= s.length || (!/[aiueoy]/.test(s[i + 1]) && s[i + 1] !== "y")) {
        result += "ん";
        i++;
        continue;
      }
    }
    // Match 3, 2, or 1 characters
    let matched = false;
    for (const len of [3, 2, 1]) {
      const sub = s.slice(i, i + len);
      if (ROMAJI_TO_HIRA[sub]) {
        result += ROMAJI_TO_HIRA[sub];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += s[i];
      i++;
    }
  }
  return result;
}

const isKanaOnly = (s: string) => /^[\u3040-\u309F\u30A0-\u30FF\u30FC\s]+$/.test(s);

function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// --- Curated Lesson Theme Data ---
interface LessonMeta {
  title: string;
  japaneseTitle: string;
  subtitle: string;
}

const GENKI_LESSON_METAS: Record<number, LessonMeta> = {
  1: {
    title: "Greetings & Introductions",
    japaneseTitle: "第1課 新しい友達",
    subtitle: "Greetings, Numbers & Nationality",
  },
  2: {
    title: "Things, Places & Shopping",
    japaneseTitle: "第2課 買い物",
    subtitle: "Demonstratives & Shopping Expressions",
  },
  3: {
    title: "Daily Life & Making a Date",
    japaneseTitle: "第3課 デートの約束",
    subtitle: "まいにちのせいかつ · Daily Routines & Verbs",
  },
  4: {
    title: "The First Date & Weekends",
    japaneseTitle: "第4課 初めてのデート",
    subtitle: "メアリーさんのしゅうまつ · Existence & Past Tense",
  },
  5: {
    title: "A Trip to Okinawa",
    japaneseTitle: "第5課 沖縄旅行",
    subtitle: "りょこう · Adjectives & Invitations",
  },
  6: {
    title: "A Day in Robert's Life",
    japaneseTitle: "第6課 ロバートさんの一日",
    subtitle: "私のすきなレストラン · Te-form & Requests",
  },
  7: {
    title: "Family Picture & Physical Description",
    japaneseTitle: "第7課 家族の写真",
    subtitle: "メアリーさんのてがみ · Te-iru & Appearance",
  },
  8: {
    title: "Barbecue & Informal Speech",
    japaneseTitle: "第8課 バーベキュー",
    subtitle: "日本の会社員 · Short Forms & Quotations",
  },
  9: {
    title: "Kabuki & Past Experience",
    japaneseTitle: "第9課 歌舞伎",
    subtitle: "ソラさんの日記 · Past Short Forms & Relative Clauses",
  },
  10: {
    title: "Winter Vacation Plans",
    japaneseTitle: "第10課 冬休みの予定",
    subtitle: "昔話「かさじぞう」· Comparisons & Intentions",
  },
  11: {
    title: "After the Vacation",
    japaneseTitle: "第11課 休みのあとで",
    subtitle: "友だち・メンバー募集 · Desires & Experience",
  },
  12: {
    title: "Feeling Ill & Giving Advice",
    japaneseTitle: "第12課 病気",
    subtitle: "七夕 · Explanations, Excess & Obligations",
  },
  13: {
    title: "Looking for a Part-time Job",
    japaneseTitle: "第13課 アルバイト探し",
    subtitle: "日本のおもしろい経験 · Potential Form & Reasons",
  },
  14: {
    title: "Valentine's Day & Giving Advice",
    japaneseTitle: "第14課 バレンタインデー",
    subtitle: "悩みの相談 · Giving/Receiving & Conjecture",
  },
  15: {
    title: "A Trip to Nagano",
    japaneseTitle: "第15課 長野旅行",
    subtitle: "私が好きな所 · Volitional Form & Preparation",
  },
  16: {
    title: "Lost and Found & Favors",
    japaneseTitle: "第16課 忘れ物",
    subtitle: "まんが「ドラえもん」· Favors, Requests & Hopes",
  },
  17: {
    title: "Grumble and Gossip",
    japaneseTitle: "第17課 うわさと不満",
    subtitle: "オノ・ヨーコ · Hearsay, Conditions & Similes",
  },
  18: {
    title: "John's Part-time Job",
    japaneseTitle: "第18課 ジョンのアルバイト",
    subtitle: "大学生活 · Transitivity & Regret",
  },
  19: {
    title: "Meeting the Boss (Honorifics)",
    japaneseTitle: "第19課 出迎え",
    subtitle: "手紙とメール · Sonkeigo & Polite Commands",
  },
  20: {
    title: "Mary Goes Shopping (Humble Speech)",
    japaneseTitle: "第20課 メアリーの買い物",
    subtitle: "猫の皿 · Kenjougo & Ease/Difficulty",
  },
  21: {
    title: "Burglar (Passive Voice)",
    japaneseTitle: "第21課 どろぼう",
    subtitle: "厄年 · Passive Sentences & States",
  },
  22: {
    title: "Education in Japan (Causative)",
    japaneseTitle: "第22課 日本の教育",
    subtitle: "桜さんの日記 · Causative Sentences & Imperatives",
  },
  23: {
    title: "Good-bye (Causative-Passive)",
    japaneseTitle: "第23課 さようなら",
    subtitle: "顔文字と絵文字 · Causative-Passive & Concessions",
  },
};

// --- Canonical JLPT Grammar Mapping Table for Genki Grammar Points ---
const GENKI_GRAMMAR_MAP: Record<string, string> = {
  // Lesson 1
  "1-1": "N5/noun-wa",
  "1-2": "N5/noun-ka-noun-ka",
  // Lesson 2
  "2-1": "N5/dore-demo",
  "2-2": "N5/dono-noun",
  "2-3": "N5/doko",
  "2-5": "N5/noun-mo",
  // Lesson 3
  "3-3": "N5/noun-de",
  "3-5": "N5/verb-masenka",
  // Lesson 4
  "4-1": "N5/arimasu",
  "4-2": "N5/noun-no-mae-ni",
  "4-5": "N5/noun-mo",
  // Lesson 5
  "5-4": "N5/ga-hoshii-desu",
  "5-5": "N5/mashou",
  // Lesson 6
  "6-1": "N5/verb-te",
  "6-2": "N5/verb-te-kudasai",
  "6-3": "N5/te-kara",
  "6-4": "N4/temo-ii",
  "6-5": "N4/te-wa-ikenai",
  "6-7": "N5/mashou-ka",
  // Lesson 7
  "7-1": "N5/verb-te-imasu",
  "7-2": "N4/verb-te-iru",
  "7-3": "N5/i-adjective-te",
  "7-4": "N5/na-adjective-de",
  "7-5": "N5/verb-ni-ikimasu",
  // Lesson 8
  "8-5": "N5/naide-kudasai",
  "8-6": "N5/verb-ru-no",
  "8-8": "N5/nanimo-masen",
  // Lesson 9
  "9-6": "N5/mada-masen",
  // Lesson 10
  "10-1": "N5/a-yori-b-no-hou-ga",
  "10-2": "N5/a-ga-ichiban",
  "10-4": "N4/tsumori",
  "10-5": "N5/na-adjective-ni-narimasu",
  "10-6": "N5/dokoka",
  "10-7": "N5/noun-de",
  "10-8": "N4/verb-te-kuru",
  // Lesson 11
  "11-1": "N5/taidesu",
  "11-2": "N5/tari-tari-shimasu",
  "11-3": "N4/verb-ta-koto-ga-aru",
  // Lesson 12
  "12-1": "N4/no-desu",
  "12-2": "N4/sugiru",
  "12-3": "N4/ta-hou-ga-ii",
  "12-4": "N4/node",
  "12-5": "N4/nakereba-naranai",
  "12-6": "N4/deshou",
  // Lesson 13 (Genki II)
  "13-1": "N4/ru-koto-ga-dekiru",
  "13-2": "N4/shi-shi",
  "13-3": "N4/sou-da",
  "13-4": "N4/te-miru",
  // Lesson 14
  "14-1": "N5/ga-hoshii-desu",
  "14-2": "N4/kamoshirenai",
  "14-3": "N4/noun-wo-ageru",
  "14-4": "N4/tara-doudesuka",
  "14-5": "N4/noun-shika-nai",
  // Lesson 15
  "15-3": "N4/te-oku",
  // Lesson 16
  "16-1": "N4/verb-te-ageru",
  "16-2": "N4/verb-te-itadakemasen-ka",
  "16-4": "N4/verb",
  // Lesson 17
  "17-1": "N4/sou-da",
  "17-4": "N4/nakutemo-ii",
  "17-5": "N4/mitai-da",
  "17-6": "N5/ru-mae-ni",
  // Lesson 18
  "18-2": "N4/verb-te-iru",
  "18-3": "N4/te-shimau",
  "18-5": "N4/nagara",
  // Lesson 20
  "20-6": "N4/yasui",
  // Lesson 21
  "21-2": "N4/verb-te-aru",
  "21-3": "N4/no-aida-ni",
  "21-5": "N4/verb-te-hoshii",
  // Lesson 22
  "22-1": "N4/verb-saseru",
  "22-5": "N4/no-ni",
  // Lesson 23
  "23-1": "N4/verb-saserareru",
  "23-2": "N4/te-mo-demo",
  "23-3": "N4/ru-koto-ni-suru",
  "23-4": "N4/ru-koto-ni-naru",
  "23-6": "N4/hou",
};

// Curated explanations for foundational grammar points in Lessons 1 & 2
const LESSON_1_2_GRAMMAR_CONTENT: Record<
  string,
  {
    explanation: string;
    bulletPoints: string[];
    examples: { ja: string; en: string }[];
  }
> = {
  "1-1": {
    explanation:
      "The core Japanese sentence structure expressing equivalence ('X is Y'). The topic particle は (pronounced 'wa') marks what the sentence is about, and です functions as the polite affirmative copula ('to be').",
    bulletPoints: [
      "Pattern: X は Y です (X is Y / As for X, it is Y).",
      "は is written with the hiragana 'ha' but pronounced 'wa' when used as a topic marker.",
      "です is placed at the end of the sentence and makes the statement polite.",
    ],
    examples: [
      { ja: "私はスミスです。", en: "I am Smith." },
      { ja: "メアリーさんは学生です。", en: "Mary is a student." },
      { ja: "専攻は日本語です。", en: "My major is Japanese." },
    ],
  },
  "1-2": {
    explanation:
      "Adding the question particle か at the end of any sentence turns it into a question without changing the word order.",
    bulletPoints: [
      "Pattern: [Sentence] + か creates a question, functioning like an audible question mark.",
      "Pronounced with rising intonation at the end.",
      "Responses typically begin with はい (yes) or いいえ (no).",
    ],
    examples: [
      { ja: "学生ですか。", en: "Are you a student?" },
      { ja: "何時ですか。", en: "What time is it?" },
      { ja: "専攻は何ですか。", en: "What is your major?" },
    ],
  },
  "1-3": {
    explanation:
      "The particle の links two nouns, with the first noun modifying or describing the second noun (possession, origin, affiliation).",
    bulletPoints: [
      "Pattern: Noun₁ の Noun₂ (Noun₂ of Noun₁ / Noun₁'s Noun₂).",
      "Can denote ownership: 私の本 (my book), メアリーさんの傘 (Mary's umbrella).",
      "Can denote affiliation: さくら大学の学生 (student of Sakura University).",
    ],
    examples: [
      { ja: "私の本です。", en: "It is my book." },
      { ja: "日本語の先生です。", en: "She is a Japanese teacher." },
      { ja: "大学の電話番号は何ですか。", en: "What is the university's phone number?" },
    ],
  },
  "2-1": {
    explanation:
      "Demonstrative pronouns (kore, sore, are, dore) refer to things based on their relative distance from the speaker and listener.",
    bulletPoints: [
      "これ (kore): This thing near the speaker.",
      "それ (sore): That thing near the listener.",
      "あれ (are): That thing far from both speaker and listener.",
      "どれ (dore): Which thing among three or more options?",
    ],
    examples: [
      { ja: "これはペンです。", en: "This is a pen." },
      { ja: "それは何ですか。", en: "What is that?" },
      { ja: "あれは図書館です。", en: "That over there is the library." },
      { ja: "どれですか。", en: "Which one is it?" },
    ],
  },
  "2-2": {
    explanation:
      "Demonstrative adjectives (kono, sono, ano, dono) must directly precede a noun to specify 'this/that/which [noun]'.",
    bulletPoints: [
      "Pattern: この / その / あの / どの + Noun.",
      "Unlike これ/それ/あれ, these forms cannot stand alone and always require a noun.",
      "Use どの when asking 'which [noun]?' among multiple items.",
    ],
    examples: [
      { ja: "この本はいくらですか。", en: "How much is this book?" },
      { ja: "その時計は高くないです。", en: "That watch is not expensive." },
      { ja: "あの人はだれですか。", en: "Who is that person over there?" },
    ],
  },
  "2-3": {
    explanation:
      "Place demonstratives (koko, soko, asoko, doko) specify location relative to the speaker and listener.",
    bulletPoints: [
      "ここ (koko): Here (near speaker).",
      "そこ (soko): There (near listener).",
      "あそこ (asoko): Over there (away from both).",
      "どこ (doko): Where? (interrogative).",
    ],
    examples: [
      { ja: "ここは教室です。", en: "Here is the classroom." },
      { ja: "トイレはどこですか。", en: "Where is the restroom?" },
      { ja: "あそこは郵便局です。", en: "That over there is the post office." },
    ],
  },
  "2-4": {
    explanation:
      "Using だれの (whose) to ask about ownership or belonging.",
    bulletPoints: [
      "Pattern: だれの + Noun (whose noun).",
      "Answers replace だれ with the owner: メアリーさんの本です (It is Mary's book).",
    ],
    examples: [
      { ja: "これはだれのかばんですか。", en: "Whose bag is this?" },
      { ja: "田中さんの傘です。", en: "It is Tanaka's umbrella." },
    ],
  },
  "2-5": {
    explanation:
      "The particle も replaces the topic particle は or subject particle が to express 'also' or 'too'.",
    bulletPoints: [
      "Pattern: [Topic] も [Predicate] (also / too).",
      "Never say はも or もは together; も replaces は directly.",
    ],
    examples: [
      { ja: "私もアメリカ人です。", en: "I am also American." },
      { ja: "これもおいしいです。", en: "This is also delicious." },
    ],
  },
  "2-6": {
    explanation:
      "The negative polite present form of です is じゃないです (conversational) or じゃありません / ではありません (formal).",
    bulletPoints: [
      "Pattern: Noun + じゃないです (is not Noun).",
      "Formal alternative: Noun + じゃありません or ではございません.",
    ],
    examples: [
      { ja: "山田さんは先生じゃないです。", en: "Yamada is not a teacher." },
      { ja: "これは私の傘じゃないです。", en: "This is not my umbrella." },
    ],
  },
  "2-7": {
    explanation:
      "Sentence-ending particles ね and よ add interpersonal nuances to statements.",
    bulletPoints: [
      "ね (ne): 'Isn't it?' / 'Right?' — seeks agreement or confirms shared knowledge.",
      "よ (yo): 'I tell you!' / 'You know' — shares new information with certainty.",
    ],
    examples: [
      { ja: "いい天気ですね。", en: "Nice weather, isn't it?" },
      { ja: "この肉はおいしいですよ。", en: "This meat is really delicious, you know!" },
    ],
  },
};

// --- Helper Data Loaders ---
function loadJsonSafe<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (err) {
    console.warn(`Failed reading JSON at ${filePath}:`, err);
    return fallback;
  }
}

function loadAudioManifestSet(): Set<string> {
  const result = new Set<string>();
  if (!fs.existsSync(AUDIO_MANIFEST_PATH)) return result;
  const content = fs.readFileSync(AUDIO_MANIFEST_PATH, "utf8");
  const vocabMatch = content.match(
    /export const STATIC_VOCAB_AUDIO = new Set<string>\(\[([\s\S]*?)\]\);/
  );
  if (vocabMatch) {
    for (const m of vocabMatch[1].matchAll(/"([^"]+)"/g)) {
      result.add(m[1]);
    }
  }
  const readingMatch = content.match(
    /export const STATIC_READING_AUDIO = new Set<string>\(\[([\s\S]*?)\]\);/
  );
  if (readingMatch) {
    for (const m of readingMatch[1].matchAll(/"([^"]+)"/g)) {
      result.add(m[1]);
    }
  }
  return result;
}

// --- Main Builder ---
async function main() {
  console.log("=== Building Textbook Data (Genki I & II) ===");

  // 1. Load Auxiliary Data
  const audioManifestSet = loadAudioManifestSet();
  console.log(`Loaded ${audioManifestSet.size} audio manifest clips.`);

  interface DictKanjiEntry {
    strokes?: number;
    jlpt?: number;
    label?: string;
  }
  const dictIndex = loadJsonSafe<{ kanji?: Record<string, DictKanjiEntry> }>(DICT_INDEX_PATH, {});
  const dictKanji = dictIndex.kanji || {};

  // Load all JLPT vocabulary for resolution
  interface JLPTWord {
    id: string;
    word: string;
    reading: string;
    level: string;
    synonyms?: string[];
  }
  const vocabByWord = new Map<string, JLPTWord>();
  const vocabByReading = new Map<string, JLPTWord>();
  for (const level of ["N5", "N4", "N3", "N2", "N1"]) {
    const p = path.join(VOCAB_DIR, `${level}.json`);
    const list = loadJsonSafe<JLPTWord[]>(p, []);
    for (const item of list) {
      if (!vocabByWord.has(item.word)) vocabByWord.set(item.word, item);
      if (!vocabByReading.has(item.reading)) vocabByReading.set(item.reading, item);
    }
  }
  console.log(`Indexed ${vocabByWord.size} vocabulary items across JLPT levels.`);

  // Load JLPT grammar points
  interface JLPTGrammarPoint {
    id: string;
    slug: string;
    level: string;
    title: string;
    pattern: string;
    meaning: string;
    explanation: string;
    examples?: Array<{
      ja: string;
      en?: string;
      promptEn?: string;
    }>;
  }
  const grammarById = new Map<string, JLPTGrammarPoint>();
  const grammarBySlug = new Map<string, JLPTGrammarPoint>();
  for (const level of ["N5", "N4"]) {
    const p = path.join(GRAMMAR_DIR, `${level}.json`);
    const gData = loadJsonSafe<{ points?: JLPTGrammarPoint[] }>(p, {});
    for (const pt of gData.points || []) {
      grammarById.set(pt.id, pt);
      grammarBySlug.set(pt.slug, pt);
    }
  }
  console.log(`Indexed ${grammarById.size} JLPT grammar points.`);

  // 2. Parse Vocabulary MDX Files
  function parseVocabFile(filePath: string): Map<number, BookVocabItem[]> {
    const result = new Map<number, BookVocabItem[]>();
    if (!fs.existsSync(filePath)) return result;
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let currentLesson = 0;
    let itemIdx = 0;

    for (const line of lines) {
      const lessonMatch = line.match(/^## Lesson (\d+)/i);
      if (lessonMatch) {
        currentLesson = parseInt(lessonMatch[1], 10);
        if (!result.has(currentLesson)) result.set(currentLesson, []);
        itemIdx = 0;
        continue;
      }
      if (!line.startsWith("|") || line.includes("---") || line.includes("Word")) {
        continue;
      }
      const parts = line.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 4 && currentLesson > 0) {
        const [rawWord, rawReading, rawMeaning, rawType] = parts;
        itemIdx++;

        // Clean parenthetical parts: e.g. おやすみ（なさい） -> おやすみ
        const cleanWord = rawWord.replace(/[\(（][^\)）]+[\)）]/g, "").trim();

        // 1. Resolve canonical JLPT vocab match
        const matchedVocab = vocabByWord.get(rawWord) || vocabByWord.get(cleanWord);

        // 2. Determine readingKana
        let readingKana = "";
        if (matchedVocab) {
          readingKana = matchedVocab.reading;
        } else if (isKanaOnly(cleanWord)) {
          readingKana = cleanWord;
        } else {
          // Use Hepburn converter
          readingKana = romajiToHiragana(rawReading);
        }

        // 3. Audio check
        const normalizedKana = katakanaToHiragana(readingKana);
        const hasAudio =
          audioManifestSet.has(readingKana) ||
          audioManifestSet.has(normalizedKana) ||
          audioManifestSet.has(cleanWord);
        const audioKey = hasAudio ? readingKana : undefined;

        const item: BookVocabItem = {
          id: matchedVocab ? matchedVocab.id : `v-genki-l${currentLesson}-${itemIdx}`,
          word: rawWord,
          reading: rawReading,
          readingKana,
          meaning: rawMeaning,
          type: rawType,
          linkedVocabId: matchedVocab?.id,
          hasAudio,
          audioKey,
        };

        result.get(currentLesson)!.push(item);
      }
    }
    return result;
  }

  const genki1Vocab = parseVocabFile(path.join(BOOKS_MDX_DIR, "genki-n5-vocabulary.mdx"));
  const genki2Vocab = parseVocabFile(path.join(BOOKS_MDX_DIR, "genki-n4-vocabulary.mdx"));

  // 3. Parse Kanji MDX File (Lessons 3 to 23)
  function parseKanjiFile(filePath: string): Map<number, BookKanjiItem[]> {
    const result = new Map<number, BookKanjiItem[]>();
    if (!fs.existsSync(filePath)) return result;
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    let currentLesson = 0;

    // Fallbacks for characters that might not exist in dictionary-index
    const KANJI_FALLBACKS: Record<string, { strokes: number; jlpt: number; label: string }> = {
      分: { strokes: 4, jlpt: 5, label: "part, minute, understand" },
      的: { strokes: 8, jlpt: 4, label: "target, adjective suffix" },
      無: { strokes: 12, jlpt: 4, label: "nothing, none" },
      々: { strokes: 3, jlpt: 5, label: "symbol of repetition of a kanji" },
      枚: { strokes: 8, jlpt: 4, label: "sheet of..." },
    };

    for (const line of lines) {
      const lessonMatch = line.match(/^### Lesson (\d+)/i);
      if (lessonMatch) {
        currentLesson = parseInt(lessonMatch[1], 10);
        if (!result.has(currentLesson)) result.set(currentLesson, []);
        continue;
      }
      if (!line.startsWith("|") || line.includes("---") || line.includes("Kanji") || line.includes("Part")) {
        continue;
      }
      const parts = line.split("|").slice(1, -1).map((s) => s.trim());
      if (parts.length >= 5 && currentLesson > 0) {
        const [numStr, kanjiChar, onyomiStr, kunyomiStr, meaningStr] = parts;
        const number = parseInt(numStr, 10) || 0;

        const onyomi = onyomiStr
          .split(/[,、]/)
          .map((s) => s.trim())
          .filter((s) => s && s !== "-");
        const kunyomi = kunyomiStr
          .split(/[,、]/)
          .map((s) => s.trim())
          .filter((s) => s && s !== "-");

        const dictEntry = dictKanji[kanjiChar];
        const fallback = KANJI_FALLBACKS[kanjiChar];

        const strokes = dictEntry?.strokes || fallback?.strokes;
        const jlpt = dictEntry?.jlpt || fallback?.jlpt || (currentLesson <= 12 ? 5 : 4);
        const label = dictEntry?.label || fallback?.label || meaningStr;

        const item: BookKanjiItem = {
          id: `k-${String(number).padStart(3, "0")}`,
          number,
          kanji: kanjiChar,
          onyomi,
          kunyomi,
          meaning: meaningStr,
          strokes,
          jlpt,
          label,
          linkedKanjiId: kanjiChar,
        };

        result.get(currentLesson)!.push(item);
      }
    }
    return result;
  }

  const allKanjiByLesson = parseKanjiFile(path.join(BOOKS_MDX_DIR, "genki-n5-n4-kanji.mdx"));

  // 4. Parse Grammar MDX Files
  function parseGrammarFile(filePath: string): Map<number, BookGrammarItem[]> {
    const result = new Map<number, BookGrammarItem[]>();
    if (!fs.existsSync(filePath)) return result;
    const lines = fs.readFileSync(filePath, "utf8").split("\n");

    let currentLesson = 0;
    let currentPoint: Partial<BookGrammarItem> | null = null;
    let pointIndex = 0;

    function flushPoint() {
      if (currentPoint && currentLesson > 0) {
        if (!result.has(currentLesson)) result.set(currentLesson, []);

        const fullPoint = currentPoint as BookGrammarItem;

        // If explanation is empty (like in Lessons 1 and 2), check curated content
        const mapKey = `${currentLesson}-${fullPoint.index}`;
        const curated = LESSON_1_2_GRAMMAR_CONTENT[mapKey];
        if (curated) {
          if (!fullPoint.explanation) fullPoint.explanation = curated.explanation;
          if (fullPoint.bulletPoints.length === 0) fullPoint.bulletPoints = [...curated.bulletPoints];
          if (fullPoint.examples.length === 0) {
            fullPoint.examples = curated.examples.map((eg) => ({
              ja: eg.ja,
              en: eg.en,
              audioKey: eg.ja,
            }));
          }
        }

        // Cross-link with JLPT grammar points
        const targetId = GENKI_GRAMMAR_MAP[mapKey];
        const matchedJLPT = targetId
          ? grammarById.get(targetId) || grammarBySlug.get(targetId.replace(/^N[54]\//, ""))
          : undefined;

        if (matchedJLPT) {
          fullPoint.linkedGrammarId = matchedJLPT.id;
          fullPoint.linkedGrammarTitle = matchedJLPT.title;

          // Merge examples from JLPT if available
          if (matchedJLPT.examples && matchedJLPT.examples.length > 0) {
            for (const eg of matchedJLPT.examples) {
              if (!fullPoint.examples.some((existing) => existing.ja === eg.ja)) {
                fullPoint.examples.push({
                  ja: eg.ja,
                  en: eg.en,
                  promptEn: eg.promptEn,
                  audioKey: eg.ja,
                });
              }
            }
          }
        }

        result.get(currentLesson)!.push(fullPoint);
        currentPoint = null;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const lessonMatch = line.match(/^## Lesson (\d+)/i);
      if (lessonMatch) {
        flushPoint();
        currentLesson = parseInt(lessonMatch[1], 10);
        pointIndex = 0;
        continue;
      }

      const pointMatch = line.match(/^### (\d+)\.\s*(.+)$/);
      if (pointMatch) {
        flushPoint();
        pointIndex = parseInt(pointMatch[1], 10);
        const rawTitle = pointMatch[2].trim();

        // Extract pattern (from backticks if present, or title)
        const codeMatch = rawTitle.match(/`([^`]+)`/);
        const pattern = codeMatch ? codeMatch[1] : rawTitle.replace(/\s*\(.*\)$/, "").trim();

        currentPoint = {
          id: `g-genki-l${currentLesson}-p${pointIndex}`,
          lessonNumber: currentLesson,
          index: pointIndex,
          title: rawTitle,
          pattern,
          explanation: "",
          bulletPoints: [],
          examples: [],
        };
        continue;
      }

      if (currentPoint) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "---") continue;

        // Check for bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bpText = trimmed.replace(/^[-*]\s+/, "");

          // Explicit example line: - **Ex:** `日本語` — English translation
          const exMatch = bpText.match(/^\*\*Ex:\*\*\s*`([^`]+)`(?:\s*[—–-]\s*(.+))?$/);
          if (exMatch) {
            const ja = exMatch[1].trim();
            const en = exMatch[2]?.trim() || lookupDeepLTranslation(ja);
            const existing = currentPoint.examples!.find((e) => e.ja === ja);
            if (existing) {
              if (!existing.en && en) existing.en = en;
              if (!existing.audioKey) existing.audioKey = ja;
            } else {
              currentPoint.examples!.push({ ja, en, audioKey: ja });
            }
            continue;
          }

          currentPoint.bulletPoints!.push(bpText);

          // Extract inline examples inside backticks
          const codeMatches = bpText.matchAll(/`([^`]+)`/g);
          for (const m of codeMatches) {
            const codeContent = m[1];
            if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(codeContent) && codeContent.length >= 2) {
              if (!currentPoint.examples!.some((e) => e.ja === codeContent)) {
                currentPoint.examples!.push({
                  ja: codeContent,
                  en: lookupDeepLTranslation(codeContent),
                  audioKey: codeContent,
                });
              }
            }
          }
        } else if (!trimmed.startsWith("#")) {
          // Paragraph text
          if (currentPoint.explanation) {
            currentPoint.explanation += "\n\n" + trimmed;
          } else {
            currentPoint.explanation = trimmed;
          }

          // Extract inline examples inside backticks
          const codeMatches = trimmed.matchAll(/`([^`]+)`/g);
          for (const m of codeMatches) {
            const codeContent = m[1];
            if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(codeContent) && codeContent.length >= 2) {
              if (!currentPoint.examples!.some((e) => e.ja === codeContent)) {
                currentPoint.examples!.push({
                  ja: codeContent,
                  en: lookupDeepLTranslation(codeContent),
                });
              }
            }
          }
        }
      }
    }
    flushPoint();

    return result;
  }

  const genki1Grammar = parseGrammarFile(path.join(BOOKS_MDX_DIR, "genki1-n5-grammar-patter.mdx"));
  const genki2Grammar = parseGrammarFile(path.join(BOOKS_MDX_DIR, "genki2-n4-grammar-patter.mdx"));

  // 4b. Parse Dialogues
  function parseDialoguesFile(filePath: string): Map<number, BookDialogueScene[]> {
    const map = new Map<number, BookDialogueScene[]>();
    if (!fs.existsSync(filePath)) return map;
    const content = fs.readFileSync(filePath, "utf8");
    const lessonSections = content.split(/^## Lesson\s+(\d+):[^\n]*/m);
    for (let i = 1; i < lessonSections.length; i += 2) {
      const lessonNum = parseInt(lessonSections[i], 10);
      const body = lessonSections[i + 1] || "";
      const sceneSections = body.split(/^### Dialogue\s+([IVXLCDM\d]+)/m);
      const scenes: BookDialogueScene[] = [];
      for (let j = 1; j < sceneSections.length; j += 2) {
        const sceneNum = sceneSections[j].trim();
        const sceneBody = sceneSections[j + 1] || "";
        const settingMatch = sceneBody.match(/\*Setting:\s*([^*]+)\*/);
        const setting = settingMatch ? settingMatch[1].trim() : undefined;

        const lines: BookDialogueLine[] = [];
        const lineRegex = /-\s+\*\*([^:]+):\*\*\s+([^\n]+)\n\s+\*\(([^:]+):\s+([^)]+)\)\*/g;
        let lineMatch: RegExpExecArray | null;
        while ((lineMatch = lineRegex.exec(sceneBody)) !== null) {
          lines.push({
            speakerJa: lineMatch[1].trim(),
            ja: lineMatch[2].trim(),
            speaker: lineMatch[3].trim(),
            en: lineMatch[4].trim(),
          });
        }
        scenes.push({
          id: `l${lessonNum}-scene-${sceneNum.toLowerCase()}`,
          sceneNumber: sceneNum,
          setting,
          lines,
        });
      }
      map.set(lessonNum, scenes);
    }
    return map;
  }

  const genki1Dialogues = parseDialoguesFile(path.join(BOOKS_MDX_DIR, "genki1-dialogues.mdx"));
  const genki2Dialogues = parseDialoguesFile(path.join(BOOKS_MDX_DIR, "genki2-dialogues.mdx"));

  // 4c. Parse Practice Sections
  function parsePracticeFile(filePath: string): Map<number, BookPracticeSection[]> {
    const map = new Map<number, BookPracticeSection[]>();
    if (!fs.existsSync(filePath)) return map;
    const content = fs.readFileSync(filePath, "utf8");
    const lessonSections = content.split(/^## Lesson\s+(\d+):[^\n]*/m);

    for (let i = 1; i < lessonSections.length; i += 2) {
      const lessonNum = parseInt(lessonSections[i], 10);
      const lessonBody = lessonSections[i + 1] || "";
      const sections: BookPracticeSection[] = [];

      // Split by ### Part ...
      const partBlocks = lessonBody.split(/^### Part\s+([IVXLCDM\d]+):/m);
      for (let p = 1; p < partBlocks.length; p += 2) {
        const partNum = partBlocks[p].trim();
        const partContent = partBlocks[p + 1] || "";

        // First line of partContent is title and optional [Grammar X]
        const firstNewline = partContent.indexOf("\n");
        const headerLine = firstNewline !== -1 ? partContent.slice(0, firstNewline) : partContent;
        const partBody = firstNewline !== -1 ? partContent.slice(firstNewline + 1) : "";

        const grammarMatch = headerLine.match(/\[Grammar\s*([^\]]+)\]/);
        const grammarIndexStr = grammarMatch ? grammarMatch[1].trim() : undefined;
        const grammarIndex = grammarIndexStr ? parseInt(grammarIndexStr, 10) || undefined : undefined;
        const partTitle = headerLine.replace(/\[Grammar\s*[^\]]+\]/, "").trim();

        // Check if there is a Reference Table before or in sections
        let refTable: { headers: string[]; rows: string[][] } | undefined;
        const tableMatch = partBody.match(/#### Reference Table:[^\n]*\n([\s\S]*?)(?=#### Section|\n###|$)/);
        if (tableMatch) {
          const tableLines = tableMatch[1]
            .trim()
            .split("\n")
            .filter((l) => l.trim().startsWith("|"));
          if (tableLines.length >= 2) {
            const parseRow = (line: string) =>
              line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim());
            const headers = parseRow(tableLines[0]);
            const rows = tableLines.slice(2).map(parseRow);
            refTable = { headers, rows };
          }
        }

        // Split by #### Section ... (fallback to whole partBody as Section A if no #### Section headers exist)
        const rawSectionBlocks = partBody.split(/^#### Section\s+([A-Za-z0-9-]+):/m);
        const sectionPairs: Array<[string, string]> = [];
        if (rawSectionBlocks.length > 1) {
          for (let s = 1; s < rawSectionBlocks.length; s += 2) {
            sectionPairs.push([rawSectionBlocks[s].trim(), rawSectionBlocks[s + 1] || ""]);
          }
        } else {
          sectionPairs.push(["A", partBody]);
        }

        for (const [sectionLetter, sectionContent] of sectionPairs) {
          const secFirstNewline = sectionContent.indexOf("\n");
          const secHeaderLine = secFirstNewline !== -1 ? sectionContent.slice(0, secFirstNewline) : sectionContent;
          const secBody = rawSectionBlocks.length > 1
            ? (secFirstNewline !== -1 ? sectionContent.slice(secFirstNewline + 1) : "")
            : sectionContent;

          const trackMatch = secHeaderLine.match(/\[Track:\s*([^\]]+)\]/);
          const audioTrack = trackMatch ? trackMatch[1].trim() : undefined;
          const sectionTitle = secHeaderLine.replace(/\[Track:\s*[^\]]+\]/, "").trim();

          // Determine exercise type
          let exerciseType: BookPracticeSection["type"] = "transformation";
          const lowerTitle = (partTitle + " " + sectionTitle).toLowerCase();
          if (lowerTitle.includes("pair work") || lowerTitle.includes("group work")) {
            exerciseType = "pair_work";
          } else if (lowerTitle.includes("question") || lowerTitle.includes("ask") || lowerTitle.includes("q&a")) {
            exerciseType = "qa";
          } else if (
            lowerTitle.includes("chart") ||
            lowerTitle.includes("picture") ||
            lowerTitle.includes("map") ||
            lowerTitle.includes("schedule")
          ) {
            exerciseType = "chart";
          } else if (lowerTitle.includes("read")) {
            exerciseType = "reading";
          } else if (
            lowerTitle.includes("cloze") ||
            lowerTitle.includes("fill") ||
            lowerTitle.includes("particle") ||
            lowerTitle.includes("問題") ||
            lowerTitle.includes("復習")
          ) {
            exerciseType = "cloze";
          }

          // Parse items: lines starting with - \d+\. ... => ... (allowing indented sub-items like "  - 1) ...")
          const items: BookPracticeItem[] = [];
          const itemRegex = /^\s*-\s*(?:(\d+)[.)]\s*)?(.+?)\s*=>\s*(.+)$/gm;
          let m: RegExpExecArray | null;
          let itemIdx = 1;
          while ((m = itemRegex.exec(secBody)) !== null) {
            const rawPrompt = m[2].trim();
            const rawAnswer = m[3].trim();
            const itemNumber = m[1] ? parseInt(m[1], 10) : itemIdx++;

            // Split prompt / cue if has ' / '
            let prompt = rawPrompt;
            let cue: string | undefined;
            if (rawPrompt.includes(" / ")) {
              const parts = rawPrompt.split(" / ");
              prompt = parts[0].trim();
              cue = parts.slice(1).join(" / ").trim();
            }

            items.push({
              id: `l${lessonNum}-p${partNum.toLowerCase()}-${sectionLetter.toLowerCase()}-${itemNumber}`,
              prompt,
              cue,
              answer: rawAnswer,
              hint: lookupDeepLTranslation(rawAnswer),
              audioTrack,
            });
          }

          sections.push({
            id: `l${lessonNum}-p${partNum.toLowerCase()}-${sectionLetter.toLowerCase()}`,
            part: partNum,
            section: sectionLetter,
            title: partTitle,
            subTitle: sectionTitle,
            grammarIndex,
            type: exerciseType,
            referenceTable: refTable,
            audioTrack,
            items,
          });
        }
      }

      map.set(lessonNum, sections);
    }
    return map;
  }

  const genki1Practice = parsePracticeFile(path.join(BOOKS_MDX_DIR, "genki1-practice.mdx"));
  const genki2Practice = parsePracticeFile(path.join(BOOKS_MDX_DIR, "genki2-practice.mdx"));

  // Minna no Nihongo I (Lessons 1–25)
  const mnn1Vocab = parseVocabFile(path.join(BOOKS_MDX_DIR, "mnn1-vocabulary.mdx"));
  const mnn1Grammar = parseGrammarFile(path.join(BOOKS_MDX_DIR, "mnn1-grammar.mdx"));
  const mnn1Dialogues = parseDialoguesFile(path.join(BOOKS_MDX_DIR, "mnn1-dialogues.mdx"));
  const mnn1Practice = parsePracticeFile(path.join(BOOKS_MDX_DIR, "mnn1-charts-practice.mdx"));

  // Minna no Nihongo II (Lessons 26–50)
  const mnn2Vocab = parseVocabFile(path.join(BOOKS_MDX_DIR, "mnn2-vocabulary.mdx"));
  const mnn2Grammar = parseGrammarFile(path.join(BOOKS_MDX_DIR, "mnn2-grammar.mdx"));
  const mnn2Dialogues = parseDialoguesFile(path.join(BOOKS_MDX_DIR, "mnn2-dialogues.mdx"));
  const mnn2Practice = parsePracticeFile(path.join(BOOKS_MDX_DIR, "mnn2-charts-practice.mdx"));

  // Minna no Nihongo III (Lessons 1–12)
  function parseReadingFile(filePath: string): Map<number, BookReadingSection> {
    const map = new Map<number, BookReadingSection>();
    if (!fs.existsSync(filePath)) return map;
    const content = fs.readFileSync(filePath, "utf8");
    const lessonSections = content.split(/^## Lesson\s+(\d+):\s*([^\n]*)/m);

    for (let i = 1; i < lessonSections.length; i += 3) {
      const lessonNum = parseInt(lessonSections[i], 10);
      const rawTitle = (lessonSections[i + 1] || "").trim();
      const body = lessonSections[i + 2] || "";

      const titleReading = body.match(/^\*TitleReading:\*\s*(.+)$/m)?.[1]?.trim();
      const sourceCredit = body.match(/^\*Source:\*\s*(.+)$/m)?.[1]?.trim();

      const extractSection = (headingPrefix: string) => {
        const re = new RegExp(`^### ${headingPrefix}[^\\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## |$(?![\\s\\S]))`, "m");
        return body.match(re)?.[1] || "";
      };

      const parseBulletLines = (sec: string) =>
        sec
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("- "))
          .map((l) => l.replace(/^-\s+(?:\d+\.\s*)?/, "").trim());

      const readingPoints = parseBulletLines(extractSection("Reading Points"));
      const warmupQuestions = parseBulletLines(extractSection("Warmup"));
      const challengePrompts = parseBulletLines(extractSection("Challenge"));

      const vocabSec = extractSection("Vocabulary Check");
      const bankRaw = vocabSec.match(/^\*WordBank:\*\s*(.+)$/m)?.[1]?.trim() || "";
      const vocabWordBank = bankRaw ? bankRaw.split("|").map((s) => s.trim()).filter(Boolean) : [];
      const vocabChecks: BookReadingVocabCheckItem[] = [];
      const vocabRegex = /^-\s*(\d+)\.\s*(.+?)\s*=>\s*(.+)$/gm;
      let vm: RegExpExecArray | null;
      while ((vm = vocabRegex.exec(vocabSec)) !== null) {
        vocabChecks.push({
          id: `mnn3-l${lessonNum}-rvocab-${vm[1]}`,
          prompt: vm[2].trim(),
          answer: vm[3].trim(),
        });
      }

      const passageSec = extractSection("Reading Passage");
      const paragraphs: BookReadingParagraph[] = [];
      const jaMatches = Array.from(passageSec.matchAll(/^-\s*\*\*Para\s+(\d+)\s+JA:\*\*\s*(.+)$/gm));
      const enMap = new Map<string, string>();
      for (const em of passageSec.matchAll(/^-\s*\*\*Para\s+(\d+)\s+EN:\*\*\s*(.+)$/gm)) {
        enMap.set(em[1], em[2].trim());
      }
      for (const jm of jaMatches) {
        paragraphs.push({
          ja: jm[2].trim(),
          en: enMap.get(jm[1]),
        });
      }

      const compSec = extractSection("Comprehension");
      const comprehensionQuestions: BookReadingQuestion[] = [];
      const compRegex = /^-\s*\[(true-false|mcq|open)\]\s*(\d+)\.\s*(.+?)\s*=>\s*(.+)$/gm;
      let cm: RegExpExecArray | null;
      while ((cm = compRegex.exec(compSec)) !== null) {
        comprehensionQuestions.push({
          id: `mnn3-l${lessonNum}-rq-${cm[2]}`,
          type: cm[1] as BookReadingQuestion["type"],
          prompt: cm[3].trim(),
          answer: cm[4].trim(),
        });
      }

      map.set(lessonNum, {
        title: rawTitle,
        titleReading,
        readingPoints,
        warmupQuestions,
        vocabWordBank,
        vocabChecks,
        paragraphs,
        sourceCredit,
        comprehensionQuestions,
        challengePrompts: challengePrompts.length > 0 ? challengePrompts : undefined,
      });
    }
    return map;
  }

  const mnn3Vocab = parseVocabFile(path.join(BOOKS_MDX_DIR, "mnn3-vocabulary.mdx"));
  const mnn3Grammar = parseGrammarFile(path.join(BOOKS_MDX_DIR, "mnn3-grammar.mdx"));
  const mnn3Dialogues = parseDialoguesFile(path.join(BOOKS_MDX_DIR, "mnn3-dialogues.mdx"));
  const mnn3Practice = parsePracticeFile(path.join(BOOKS_MDX_DIR, "mnn3-charts-practice.mdx"));
  const mnn3Reading = parseReadingFile(path.join(BOOKS_MDX_DIR, "mnn3-reading.mdx"));

  // Parse authentic 文型・例文 file and prepend as Core Patterns & Examples card per lesson
  function attachBunkeiFile(
    bunkeiFilePath: string,
    targetGrammarMap: Map<number, BookGrammarItem[]>,
    idPrefix: string,
    bookLabel: string
  ) {
    if (!fs.existsSync(bunkeiFilePath)) return;
    const bunkeiRaw = fs.readFileSync(bunkeiFilePath, "utf8");
    const lessonBlocks = bunkeiRaw.split(/^## Lesson\s+(\d+)/m);
    for (let i = 1; i < lessonBlocks.length; i += 2) {
      const lessonNum = parseInt(lessonBlocks[i], 10);
      const block = lessonBlocks[i + 1] || "";
      const bulletPoints: string[] = [];
      const examples: { ja: string; en?: string; audioKey?: string }[] = [];
      let currentSection = "";
      for (const rawLine of block.split("\n")) {
        const t = rawLine.trim();
        if (t.startsWith("### 文型")) {
          currentSection = "文型";
          continue;
        }
        if (t.startsWith("### 例文")) {
          currentSection = "例文";
          continue;
        }
        const m = t.match(/^-\s*(\d+)\.\s*`([^`]+)`(?:\s*[—–-]\s*(.+))?$/);
        if (m) {
          const num = m[1];
          const ja = m[2].trim();
          const en = m[3]?.trim();
          if (currentSection === "文型") {
            bulletPoints.push(`**文型 ${num}:** \`${ja}\`${en ? ` — ${en}` : ""}`);
          } else {
            bulletPoints.push(`**例文 ${num}:** \`${ja}\`${en ? ` — ${en}` : ""}`);
          }
          examples.push({ ja, en, audioKey: ja });
        }
      }
      if (examples.length > 0) {
        const existingList = targetGrammarMap.get(lessonNum) || [];
        const coreCard: BookGrammarItem = {
          id: `g-${idPrefix}-l${lessonNum}-bunkei`,
          lessonNumber: lessonNum,
          index: 0,
          title: "文型・例文 (Core Sentence Patterns & Example Q&As)",
          pattern: examples[0].ja,
          explanation: `Authentic core sentence patterns (文型) and contextual question-and-answer examples (例文) from the ${bookLabel} main textbook.`,
          bulletPoints,
          examples,
        };
        targetGrammarMap.set(lessonNum, [coreCard, ...existingList]);
      }
    }
  }

  attachBunkeiFile(
    path.join(BOOKS_MDX_DIR, "mnn1-bunkei-reibun.mdx"),
    mnn1Grammar,
    "mnn1",
    "Minna no Nihongo I"
  );
  attachBunkeiFile(
    path.join(BOOKS_MDX_DIR, "mnn2-bunkei-reibun.mdx"),
    mnn2Grammar,
    "mnn2",
    "Minna no Nihongo II"
  );

  // Build lookup of known kanji items from Genki + dictionary-index for MNN Lessons 3–25
  const knownKanjiByChar = new Map<string, BookKanjiItem>();
  for (const list of allKanjiByLesson.values()) {
    for (const k of list) {
      if (!knownKanjiByChar.has(k.kanji)) {
        knownKanjiByChar.set(k.kanji, k);
      }
    }
  }
  const mnn1KanjiMap = new Map<number, BookKanjiItem[]>();
  const seenMnnKanji = new Set<string>();
  let mnnKanjiCounter = 1;
  for (let l = 3; l <= 25; l++) {
    const lessonVocab = mnn1Vocab.get(l) || [];
    const lessonKanji: BookKanjiItem[] = [];
    for (const v of lessonVocab) {
      const chars = v.word.match(/[\u4E00-\u9FAF]/g) || [];
      for (const ch of chars) {
        if (seenMnnKanji.has(ch)) continue;
        const baseK = knownKanjiByChar.get(ch);
        const dictEntry = dictKanji[ch];
        if (!baseK && !dictEntry) continue;
        seenMnnKanji.add(ch);
        lessonKanji.push({
          id: `k-mnn-${String(mnnKanjiCounter).padStart(3, "0")}`,
          number: mnnKanjiCounter++,
          kanji: ch,
          onyomi: baseK?.onyomi || [],
          kunyomi: baseK?.kunyomi || [],
          meaning: baseK?.meaning || dictEntry?.label || v.meaning,
          strokes: baseK?.strokes || dictEntry?.strokes,
          jlpt: baseK?.jlpt || dictEntry?.jlpt || 5,
          label: baseK?.label || dictEntry?.label || v.meaning,
          linkedKanjiId: ch,
        });
        if (lessonKanji.length >= 12) break;
      }
      if (lessonKanji.length >= 12) break;
    }
    if (lessonKanji.length > 0) {
      mnn1KanjiMap.set(l, lessonKanji);
    }
  }

  const mnn2KanjiMap = new Map<number, BookKanjiItem[]>();
  for (let l = 26; l <= 50; l++) {
    const lessonVocab = mnn2Vocab.get(l) || [];
    const lessonKanji: BookKanjiItem[] = [];
    for (const v of lessonVocab) {
      const chars = v.word.match(/[\u4E00-\u9FAF]/g) || [];
      for (const ch of chars) {
        if (seenMnnKanji.has(ch)) continue;
        const baseK = knownKanjiByChar.get(ch);
        const dictEntry = dictKanji[ch];
        if (!baseK && !dictEntry) continue;
        seenMnnKanji.add(ch);
        lessonKanji.push({
          id: `k-mnn-${String(mnnKanjiCounter).padStart(3, "0")}`,
          number: mnnKanjiCounter++,
          kanji: ch,
          onyomi: baseK?.onyomi || [],
          kunyomi: baseK?.kunyomi || [],
          meaning: baseK?.meaning || dictEntry?.label || v.meaning,
          strokes: baseK?.strokes || dictEntry?.strokes,
          jlpt: baseK?.jlpt || dictEntry?.jlpt || 4,
          label: baseK?.label || dictEntry?.label || v.meaning,
          linkedKanjiId: ch,
        });
        if (lessonKanji.length >= 12) break;
      }
      if (lessonKanji.length >= 12) break;
    }
    if (lessonKanji.length > 0) {
      mnn2KanjiMap.set(l, lessonKanji);
    }
  }

  const mnn3KanjiMap = new Map<number, BookKanjiItem[]>();
  const seenMnn3Kanji = new Set<string>();
  for (let l = 1; l <= 12; l++) {
    const lessonVocab = mnn3Vocab.get(l) || [];
    const lessonKanji: BookKanjiItem[] = [];
    for (const v of lessonVocab) {
      const chars = v.word.match(/[\u4E00-\u9FAF]/g) || [];
      for (const ch of chars) {
        if (seenMnn3Kanji.has(ch)) continue;
        const baseK = knownKanjiByChar.get(ch);
        const dictEntry = dictKanji[ch];
        if (!baseK && !dictEntry) continue;
        seenMnn3Kanji.add(ch);
        lessonKanji.push({
          id: `k-mnn3-${String(mnnKanjiCounter).padStart(3, "0")}`,
          number: mnnKanjiCounter++,
          kanji: ch,
          onyomi: baseK?.onyomi || [],
          kunyomi: baseK?.kunyomi || [],
          meaning: baseK?.meaning || dictEntry?.label || v.meaning,
          strokes: baseK?.strokes || dictEntry?.strokes,
          jlpt: baseK?.jlpt || dictEntry?.jlpt || 3,
          label: baseK?.label || dictEntry?.label || v.meaning,
          linkedKanjiId: ch,
        });
        if (lessonKanji.length >= 12) break;
      }
      if (lessonKanji.length >= 12) break;
    }
    if (lessonKanji.length > 0) {
      mnn3KanjiMap.set(l, lessonKanji);
    }
  }

  const MNN_LESSON_METAS: Record<number, { title: string; japaneseTitle: string; subtitle: string }> = {
    1: { title: "Nice to Meet You (Self-Introductions)", japaneseTitle: "第1課 初めまして", subtitle: "N1はN2です · N1はN2じゃありません · N1はN2ですか · N1もN2です" },
    2: { title: "Thank You in Advance (Things & Ownership)", japaneseTitle: "第2課 これから お世話に なります", subtitle: "これは辞書です · それはわたしの傘です · この本はわたしのです" },
    3: { title: "I'll Take This (Places & Shopping)", japaneseTitle: "第3課 これを ください", subtitle: "ここは食堂です · エレベーターはあそこです · 復習A" },
    4: { title: "What Time Are You Open Until? (Time & Verbs)", japaneseTitle: "第4課 そちらは 何時までですか", subtitle: "今4時5分です · 毎朝6時に起きます · きのう勉強しました" },
    5: { title: "Does This Train Go to Koshien? (Movement)", japaneseTitle: "第5課 この 電車は 甲子園へ 行きますか", subtitle: "京都へ行きます · タクシーでうちへ帰ります · 家族と日本へ来ました" },
    6: { title: "Won't You Go Together? (Objects & Invitations)", japaneseTitle: "第6課 いっしょに 行きませんか", subtitle: "本を読みます · 駅で新聞を買います · 〜ませんか · 〜ましょう" },
    7: { title: "Welcome! (Tools, Giving & Receiving)", japaneseTitle: "第7課 いらっしゃい", subtitle: "パソコンで映画を見ます · 花をあげます · もらいました · もう〜ました · 復習B" },
    8: { title: "It's Almost Time to Leave (Adjectives)", japaneseTitle: "第8課 そろそろ 失礼します", subtitle: "桜はきれいです · 富士山は高いです · きれいな花 · 高い山" },
    9: { title: "That's Too Bad, But... (Likes, Ability & Reasons)", japaneseTitle: "第9課 残念ですが", subtitle: "イタリア料理が好きです · 日本語が少しわかります · 〜から、早く帰ります" },
    10: { title: "Do You Have Fish Sauce? (Existence & Locations)", japaneseTitle: "第10課 ナンプラー、ありますか", subtitle: "あそこにコンビニがあります · ロビーに佐藤さんがいます · 〜にあります／います" },
    11: { title: "This One, Please (Counters & Duration)", japaneseTitle: "第11課 これ、お願いします", subtitle: "会議室にテーブルが7つあります · わたしは日本に1年います" },
    12: { title: "How Was the Gion Festival? (Past & Comparisons)", japaneseTitle: "第12課 祇園祭は どうでしたか", subtitle: "雨でした · 寒かったです · 〜より大きいです · いちばん好きです · 復習C" },
    13: { title: "Separate Checks, Please (Desires & Purpose)", japaneseTitle: "第13課 別々に お願いします", subtitle: "車が欲しいです · すしを食べたいです · フランスへ料理を習いに行きます" },
    14: { title: "To Midori-machi, Please (Te-form Requests)", japaneseTitle: "第14課 みどり町まで お願いします", subtitle: "ちょっと待ってください · 荷物を持ちましょうか · 今電話をかけています" },
    15: { title: "What About Your Family? (Permission & State)", japaneseTitle: "第15課 ご家族は？", subtitle: "写真を撮ってもいいですか · サントスさんは電子辞書を持っています" },
    16: { title: "Please Teach Me How to Use It (Joining Clauses)", japaneseTitle: "第16課 使い方を 教えて ください", subtitle: "〜て、〜て、〜ます · 〜てから · 大阪は食べ物がおいしいです · 復習D" },
    17: { title: "What Seems to Be the Matter? (Nai-form & Rules)", japaneseTitle: "第17課 どう しましたか", subtitle: "写真を撮らないでください · 見せなければなりません · 早く起きなくてもいいです" },
    18: { title: "What Are Your Hobbies? (Potential & Before)", japaneseTitle: "第18課 趣味は 何ですか", subtitle: "漢字を読むことができます · 趣味は映画を見ることです · 寝るまえに、日記を書きます" },
    19: { title: "I'll Start My Diet Tomorrow (Ta-form & Experiences)", japaneseTitle: "第19課 ダイエットは あしたから します", subtitle: "相撲を見たことがあります · 〜たり、〜たりします · だんだん暑くなります · 復習E" },
    20: { title: "Wanna Go Together? (Plain Style & Casual Speech)", japaneseTitle: "第20課 いっしょに 行かない？", subtitle: "パーティーに来なかった · 東京は人が多い · 沖縄の海はきれいだった · 僕の誕生日だ" },
    21: { title: "I Think So Too (Opinions, Quotes & Confirmation)", japaneseTitle: "第21課 わたしも そう 思います", subtitle: "あした雨が降ると思います · 父に留学したいと言いました · 疲れたでしょう？" },
    22: { title: "What Kind of Room Are You Looking For? (Clauses)", japaneseTitle: "第22課 どんな 部屋を お探しですか", subtitle: "ミラーさんが作ったケーキ · あそこにいる人はミラーさんです · 復習F" },
    23: { title: "How Do I Get There? (When & Inevitable Result)", japaneseTitle: "第23課 どうやって 行きますか", subtitle: "図書館で本を借りるとき、カードが要ります · このボタンを押すと、お釣りが出ます" },
    24: { title: "Shall I Come Help You? (Giving & Receiving Favors)", japaneseTitle: "第24課 手伝いに 行きましょうか", subtitle: "チョコレートをくれました · レポートを直してもらいました · 送ってくれました · 貸してあげました" },
    25: { title: "Thank You for Everything (Conditionals: 〜たら & 〜ても)", japaneseTitle: "第25課 いろいろ お世話に なりました", subtitle: "雨が降ったら、出かけません · 雨が降っても、出かけます · 復習G · 総復習" },
    // Minna no Nihongo II (Lessons 26–50)
    26: { title: "Where Should I Put Out the Trash? (〜んです & Polite Requests)", japaneseTitle: "第26課 ごみは どこに 出したら いいですか", subtitle: "あしたから旅行なんです · いい先生を紹介していただけませんか · 〜たらいいですか" },
    27: { title: "You Can Make Anything! (Potential Verbs, 見えます/聞こえます & できます)", japaneseTitle: "第27課 何でも 作れるんですね", subtitle: "わたしは日本語が少し話せます · 山がはっきり見えます · 大きいスーパーができました" },
    28: { title: "Frequent Business Trips and Exams Too... (〜ながら & 〜し、〜し)", japaneseTitle: "第28課 出張も 多いし、試験も あるし……", subtitle: "音楽を聞きながら食事します · 毎朝ジョギングをしています · 速いし、安いし" },
    29: { title: "I Left Something Behind (Intransitive State 〜ています & 〜てしまいました)", japaneseTitle: "第29課 忘れ物を して しまったんです", subtitle: "窓が閉まっています · 電車に傘を忘れてしまいました" },
    30: { title: "We Must Prepare an Emergency Bag (〜てあります & 〜ておきます)", japaneseTitle: "第30課 非常袋を 準備して おかないと", subtitle: "交番に町の地図がはってあります · 旅行のまえに、いろいろ調べておきます · 復習H" },
    31: { title: "I'm Thinking of Learning Cooking (Volitional Form, 〜ようと思っています & 〜つもりです)", japaneseTitle: "第31課 料理を 習おうと 思って います", subtitle: "いっしょに行こう · 将来自分の会社を作ろうと思っています · 来月車を買うつもりです" },
    32: { title: "You Had Better Not Push Yourself Too Hard (〜ほうがいいです, 〜でしょう & 〜かもしれません)", japaneseTitle: "第32課 無理を しない ほうが いいですよ", subtitle: "毎日運動したほうがいいです · あしたは雪が降るでしょう · 間に合わないかもしれません" },
    33: { title: "What Does This Mean? (Imperative, Prohibitive, 〜という意味 & 〜と言っていました)", japaneseTitle: "第33課 これは どういう 意味ですか", subtitle: "急げ · 触るな · 立ち入り禁止は入るなという意味です · 来週大阪へ出張すると言っていました" },
    34: { title: "Please Do It Just as I Did (〜とおりに, 〜あとで & 〜ないで)", japaneseTitle: "第34課 わたしが した とおりに、して ください", subtitle: "先生が言ったとおりに、書きます · ごはんを食べたあとで、歯を磨きます · 砂糖を入れないで飲みます" },
    35: { title: "Is There Any Good Place Somewhere? (Conditional Form 〜ば & 〜なら)", japaneseTitle: "第35課 どこか いい 所、ありませんか", subtitle: "春になれば、桜が咲きます · 天気がよければ、向こうに島が見えます · 北海道旅行なら、6月がいいです · 復習I" },
    36: { title: "I Try to Exercise Every Day (〜ように, 〜ようになりました & 〜ようにしています)", japaneseTitle: "第36課 毎日 運動するように して います", subtitle: "速く泳げるように、毎日練習しています · 自転車に乗れるようになりました · 毎日日記を書くようにしています" },
    37: { title: "Kinkakuji Was Built in the 14th Century (Passive Verbs 受身形)", japaneseTitle: "第37課 金閣寺は 14世紀に 建てられました", subtitle: "子どものとき、よく母にしかられました · ラッシュの電車で足を踏まれました · 法隆寺は607年に建てられました" },
    38: { title: "I Like Tidying Up (Nominalization with の: 〜のは / 〜のが / 〜のを)", japaneseTitle: "第38課 片づけるのが 好きなんです", subtitle: "絵をかくのは楽しいです · 星を見るのが好きです · 財布を持って来るのを忘れました · 日本へ来たのは去年の3月です" },
    39: { title: "Sorry I'm Late (Reasons & Causes: 〜て、〜 / 名詞＋で / 〜ので)", japaneseTitle: "第39課 遅れて、すみません", subtitle: "ニュースを聞いて、びっくりしました · 地震でビルが倒れました · 体の調子が悪いので、病院へ行きます" },
    40: { title: "I'm Worried Whether I Made Friends (Embedded Questions 〜か / 〜かどうか & 〜てみます)", japaneseTitle: "第40課 友達が できたか どうか、心配です", subtitle: "JL107便は何時に到着するか、調べてください · 東京へ来るかどうか、まだわかりません · この服を着てみてもいいですか · 復習J" },
    41: { title: "Congratulations on Your Marriage (Honorific/Humble Giving & Receiving: いただきます・くださいます・やります)", japaneseTitle: "第41課 ご結婚 おめでとう ございます", subtitle: "ワット先生に本をいただきました · 先生に漢字のまちがいを直していただきました · 部長の奥さんがお茶を教えてくださいました · 息子に紙飛行機を作ってやりました" },
    42: { title: "What Will You Use Your Bonus For? (Purpose: 〜ために & 〜のに)", japaneseTitle: "第42課 ボーナスは 何に 使いますか", subtitle: "将来自分の店を持つために、貯金しています · この靴は山を歩くのにいいです" },
    43: { title: "Every Day Looks Fun (Appearance 〜そうです & 〜て来ます)", japaneseTitle: "第43課 毎日 楽しそうです", subtitle: "今にも雨が降りそうです · ちょっと切符を買って来ます" },
    44: { title: "Please Make It Look Like This Photo (〜すぎます, 〜やすい/にくい & 〜く/にします)", japaneseTitle: "第44課 この 写真みたいに して ください", subtitle: "ゆうべお酒を飲みすぎました · このパソコンは使いやすいです · ズボンを短くしてください" },
    45: { title: "What Should I Do in Case I Took the Wrong Course? (〜場合は & 〜のに)", japaneseTitle: "第45課 コースを まちがえた 場合は、どう したら いいですか", subtitle: "カードをなくした場合は、すぐカード会社に連絡してください · 約束をしたのに、彼女は来ませんでした · 復習K" },
    46: { title: "Even Though I Just Had It Fixed Last Week... (〜ところです, 〜たばかりです & 〜はずです)", japaneseTitle: "第46課 先週 直して もらった ばかりなのに、また……", subtitle: "会議は今から始まるところです · 3月に大学を卒業したばかりです · ミラーさんは会議室にいるはずです" },
    47: { title: "I Hear They Got Engaged (Hearsay 〜そうです & Conjecture 〜ようです)", japaneseTitle: "第47課 婚約したそうです", subtitle: "天気予報によると、あしたは寒くなるそうです · 隣の部屋にだれかいるようです" },
    48: { title: "Could You Please Let Me Take the Day Off? (Causative Verbs 使役形 & 〜させていただけませんか)", japaneseTitle: "第48課 休ませて いただけませんか", subtitle: "息子をイギリスへ留学させます · 娘にピアノを習わせます" },
    49: { title: "Please Give My Best Regards (Honorific Expressions 尊敬語)", japaneseTitle: "第49課 よろしく お伝え ください", subtitle: "課長は帰られました · 社長はお帰りになりました · 部長はアメリカへ出張なさいます · しばらくお待ちください" },
    50: { title: "I Am Truly Grateful from the Bottom of My Heart (Humble Expressions 謙譲語)", japaneseTitle: "第50課 心から 感謝いたします", subtitle: "今月のスケジュールをお送りします · あした3時に伺います · 私はアメリカから参りました · 復習L · 総復習" },
  };

  const MNN3_LESSON_METAS: Record<number, { title: string; japaneseTitle: string; subtitle: string }> = {
    1: { title: "I Have a Favor to Ask (Requests & Impressions)", japaneseTitle: "第1課 お願いがあるんですが", subtitle: "〜てもらえませんか・〜ていただけませんか · 〜のようだ · 〜ことは／が／を · 〜を〜と言う · 〜という〜 · いつ／どこ／何／だれ／どんなに〜ても" },
    2: { title: "What Does That Mean? (Conditionals, Hearsay & Clarification)", japaneseTitle: "第2課 何のことですか", subtitle: "〜たら、〜た · 〜というのは〜のことだ · …という〜 · …ように言う／注意する／伝える／頼む · 〜みたいだ" },
    3: { title: "It Looks Like I'll Be Late (Permission, Decisions & Appearances)", japaneseTitle: "第3課 遅れそうなんです", subtitle: "〜（さ）せてもらえませんか · …ことにする／している · …ことになる／なっている · 〜てほしい · 〜そうな／なさそう／そうもない" },
    4: { title: "Could You Take a Message? (Phone Messages & Causative-Passive)", japaneseTitle: "第4課 伝言、お願いできますか", subtitle: "…ということだ · …の／…の？ · 〜ちゃう・〜とく・〜てる · 〜（さ）せられる・〜される · 〜である · 〜（た）がる" },
    5: { title: "How Should I Get There? (Directions, Timing & Conjecture)", japaneseTitle: "第5課 どう行ったらいいでしょうか", subtitle: "あ〜・そ〜 · …んじゃない？ · 〜たところに／で · 〜（よ）うとする · …のだろうか · 〜との／での／からの〜 · …だろう" },
    6: { title: "I'd Like Permission to Go (Negotiation & Tendencies)", japaneseTitle: "第6課 行かせていただきたいんですが", subtitle: "…て…／…って… · 〜つもりはない／つもりだった · 〜てばかりいる · …とか… · 〜てくる · 〜てくる・〜ていく" },
    7: { title: "I'm Looking Forward to It / I'll Pass (Obligations & Causative)", japaneseTitle: "第7課 楽しみにしてます・遠慮させてください", subtitle: "〜なくてはならない／いけない · 〜なくちゃ／〜なきゃ · …だけだ · …かな · 〜なんか／〜なんて · 〜（さ）せる／〜（さ）せられる · …なら" },
    8: { title: "I Got Lost! (Time Spans, Causes & Unchanged States)", japaneseTitle: "第8課 迷子になっちゃったんです", subtitle: "〜あいだ／あいだに · 〜まで／までに · 〜た〜 · 〜によって… · 〜まま、… · …からだ" },
    9: { title: "What's the Difference? (Comparisons, Degree & Purpose)", japaneseTitle: "第9課 どこが違うんですか", subtitle: "お〜ます です · 〜てもかまわない · …ほど〜ない · 〜ほど〜はない · …ため［に］ · 〜たら／〜ば、…た" },
    10: { title: "That Can't Be True! (Expectation, Results & Compound Verbs)", japaneseTitle: "第10課 そんなはずはありません", subtitle: "…はずだ／はずがない／はずだった · …ことが／もある · 〜た結果 · 〜出す／始める・終わる・続ける／忘れる・合う・換える" },
    11: { title: "Do You Have Any Recommendations? (Suggestions, Conjecture & Negatives)", japaneseTitle: "第11課 お勧めのところ、ありませんか", subtitle: "〜てくる・〜ていく · 〜たら［どう］？ · …より…ほうが… · 〜らしい · 〜として · 〜ず［に］ · …ている" },
    12: { title: "Sorry for the Trouble (Apologies, Explanations & Gratitude/Blame)", japaneseTitle: "第12課 ご迷惑をかけてすみませんでした", subtitle: "…もの／もんだから · 〜（ら）れる · 〜たり〜たり · 〜っぱなし · …おかげで／…せいで" },
  };

  // 5. Build Lessons & Books
  function buildBook(
    id: "genki-1" | "genki-2" | "mnn-1" | "mnn-2" | "mnn-3",
    title: string,
    japaneseTitle: string,
    level: "N5" | "N4" | "N3",
    lessonStart: number,
    lessonEnd: number,
    description: string,
    vocabMap: Map<number, BookVocabItem[]>,
    grammarMap: Map<number, BookGrammarItem[]>,
    dialoguesMap: Map<number, BookDialogueScene[]>,
    practiceMap?: Map<number, BookPracticeSection[]>,
    options?: {
      series?: string;
      coverImage?: string;
      kanjiMap?: Map<number, BookKanjiItem[]>;
      readingMap?: Map<number, BookReadingSection>;
      lessonMetas?: Record<number, { title: string; japaneseTitle: string; subtitle: string }>;
    }
  ): BookDetail {
    const lessons: BookLesson[] = [];
    let totalVocab = 0;
    let totalKanji = 0;
    let totalGrammar = 0;
    let totalPractice = 0;
    const kanjiSource = options?.kanjiMap ?? allKanjiByLesson;
    const readingSource = options?.readingMap;
    const metasSource = options?.lessonMetas ?? GENKI_LESSON_METAS;
    const coverImage = options?.coverImage || `/images/books/${id}.webp`;

    for (let l = lessonStart; l <= lessonEnd; l++) {
      const vocabList = vocabMap.get(l) || [];
      const kanjiList = kanjiSource.get(l) || [];
      const grammarList = grammarMap.get(l) || [];
      const dialogueList = dialoguesMap.get(l) || [];
      const practiceList = practiceMap?.get(l) || [];
      const readingItem = readingSource?.get(l);

      // Attach offline dialogue audio path if file exists on disk
      for (const scene of dialogueList) {
        scene.lines.forEach((line, idx) => {
          const relAudio = `/audio/books/dialogues/${id}/${scene.id}-${idx}.opus`;
          const absAudio = path.join(ROOT_DIR, "public", relAudio);
          if (fs.existsSync(absAudio)) {
            line.audioSrc = relAudio;
            (line as BookDialogueLine & { hasAudio?: boolean }).hasAudio = true;
          }
        });
      }

      const practiceItemsCount = practiceList.reduce((acc, sec) => acc + sec.items.length, 0);

      totalVocab += vocabList.length;
      totalKanji += kanjiList.length;
      totalGrammar += grammarList.length;
      totalPractice += practiceItemsCount;

      const meta = metasSource[l] || {
        title: `Lesson ${l}`,
        japaneseTitle: `第${l}課`,
        subtitle: "",
      };

      lessons.push({
        lessonNumber: l,
        title: meta.title,
        japaneseTitle: meta.japaneseTitle,
        subtitle: meta.subtitle,
        vocabulary: vocabList,
        kanji: kanjiList,
        grammar: grammarList,
        dialogues: dialogueList.length > 0 ? dialogueList : undefined,
        practice: practiceList.length > 0 ? practiceList : undefined,
        ...(readingItem ? { reading: readingItem } : {}),
        stats: {
          vocabularyCount: vocabList.length,
          kanjiCount: kanjiList.length,
          grammarCount: grammarList.length,
          dialogueCount: dialogueList.length,
          practiceCount: practiceItemsCount,
        },
      });
    }

    return {
      id,
      title,
      japaneseTitle,
      level,
      series: options?.series || "Genki",
      description,
      coverImage,
      totalLessons: lessonEnd - lessonStart + 1,
      lessonRange: [lessonStart, lessonEnd],
      stats: {
        vocabularyCount: totalVocab,
        kanjiCount: totalKanji,
        grammarCount: totalGrammar,
        practiceCount: totalPractice > 0 ? totalPractice : undefined,
      },
      lessons,
    };
  }

  const genki1Detail = buildBook(
    "genki-1",
    "Genki I: An Integrated Course in Elementary Japanese",
    "初級日本語 げんき I",
    "N5",
    1,
    12,
    "Comprehensive foundational textbook covering JLPT N5 vocabulary, essential grammar structures, and 145 kanji across Lessons 1–12.",
    genki1Vocab,
    genki1Grammar,
    genki1Dialogues,
    genki1Practice
  );

  const genki2Detail = buildBook(
    "genki-2",
    "Genki II: An Integrated Course in Intermediate Japanese",
    "初級日本語 げんき II",
    "N4",
    13,
    23,
    "Upper-elementary Japanese textbook covering JLPT N4 vocabulary, complex grammar constructs (honorifics, passives, causatives), and 172 kanji across Lessons 13–23.",
    genki2Vocab,
    genki2Grammar,
    genki2Dialogues,
    genki2Practice
  );

  const mnn1Detail = buildBook(
    "mnn-1",
    "Minna no Nihongo I: Main Textbook & Grammar Companion",
    "みんなの日本語 初級 I",
    "N5",
    1,
    25,
    "Authentic communicative Japanese textbook covering JLPT N5 vocabulary, sentence patterns (文型・例文), 18-character dialogues (会話・練習C), interactive drills (練習A/B・問題), and kanji across Lessons 1–25.",
    mnn1Vocab,
    mnn1Grammar,
    mnn1Dialogues,
    mnn1Practice,
    {
      series: "Minna no Nihongo",
      kanjiMap: mnn1KanjiMap,
      lessonMetas: MNN_LESSON_METAS,
    }
  );

  const mnn2Detail = buildBook(
    "mnn-2",
    "Minna no Nihongo II: Main Textbook & Grammar Companion",
    "みんなの日本語 初級 II",
    "N4",
    26,
    50,
    "Upper-elementary communicative Japanese textbook covering JLPT N4 vocabulary, sentence patterns (文型・例文), 21-character dialogues (会話・練習C), interactive drills (練習A/B・問題), potential/passive/causative/keigo grammar, and kanji across Lessons 26–50.",
    mnn2Vocab,
    mnn2Grammar,
    mnn2Dialogues,
    mnn2Practice,
    {
      series: "Minna no Nihongo",
      kanjiMap: mnn2KanjiMap,
      lessonMetas: MNN_LESSON_METAS,
    }
  );

  const mnn3Detail = buildBook(
    "mnn-3",
    "Minna no Nihongo III: Intermediate I Main Textbook",
    "みんなの日本語 中級 I",
    "N3",
    1,
    12,
    "Intermediate Japanese textbook (Chūkyū I) covering JLPT N3 grammar, speaking/listening strategies (話す・聞く), authentic reading/writing passages (読む・書く), and review problems across Lessons 1–12.",
    mnn3Vocab,
    mnn3Grammar,
    mnn3Dialogues,
    mnn3Practice,
    {
      series: "Minna no Nihongo",
      kanjiMap: mnn3KanjiMap,
      readingMap: mnn3Reading,
      lessonMetas: MNN3_LESSON_METAS,
    }
  );

  const catalog: BookCatalogEntry[] = [
    {
      id: genki1Detail.id,
      title: genki1Detail.title,
      japaneseTitle: genki1Detail.japaneseTitle,
      level: genki1Detail.level,
      series: genki1Detail.series,
      description: genki1Detail.description,
      coverImage: genki1Detail.coverImage,
      totalLessons: genki1Detail.totalLessons,
      lessonRange: genki1Detail.lessonRange,
      stats: genki1Detail.stats,
    },
    {
      id: genki2Detail.id,
      title: genki2Detail.title,
      japaneseTitle: genki2Detail.japaneseTitle,
      level: genki2Detail.level,
      series: genki2Detail.series,
      description: genki2Detail.description,
      coverImage: genki2Detail.coverImage,
      totalLessons: genki2Detail.totalLessons,
      lessonRange: genki2Detail.lessonRange,
      stats: genki2Detail.stats,
    },
    {
      id: mnn1Detail.id,
      title: mnn1Detail.title,
      japaneseTitle: mnn1Detail.japaneseTitle,
      level: mnn1Detail.level,
      series: mnn1Detail.series,
      description: mnn1Detail.description,
      coverImage: mnn1Detail.coverImage,
      totalLessons: mnn1Detail.totalLessons,
      lessonRange: mnn1Detail.lessonRange,
      stats: mnn1Detail.stats,
    },
    {
      id: mnn2Detail.id,
      title: mnn2Detail.title,
      japaneseTitle: mnn2Detail.japaneseTitle,
      level: mnn2Detail.level,
      series: mnn2Detail.series,
      description: mnn2Detail.description,
      coverImage: mnn2Detail.coverImage,
      totalLessons: mnn2Detail.totalLessons,
      lessonRange: mnn2Detail.lessonRange,
      stats: mnn2Detail.stats,
    },
    {
      id: mnn3Detail.id,
      title: mnn3Detail.title,
      japaneseTitle: mnn3Detail.japaneseTitle,
      level: mnn3Detail.level,
      series: mnn3Detail.series,
      description: mnn3Detail.description,
      coverImage: mnn3Detail.coverImage,
      totalLessons: mnn3Detail.totalLessons,
      lessonRange: mnn3Detail.lessonRange,
      stats: mnn3Detail.stats,
    },
  ];

  // 6. Write JSON files to public/data/v1/books/
  if (!fs.existsSync(PUBLIC_BOOKS_DIR)) {
    fs.mkdirSync(PUBLIC_BOOKS_DIR, { recursive: true });
  }

  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "index.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "genki-1.json"),
    JSON.stringify(genki1Detail, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "genki-2.json"),
    JSON.stringify(genki2Detail, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "mnn-1.json"),
    JSON.stringify(mnn1Detail, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "mnn-2.json"),
    JSON.stringify(mnn2Detail, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(PUBLIC_BOOKS_DIR, "mnn-3.json"),
    JSON.stringify(mnn3Detail, null, 2),
    "utf8"
  );

  console.log("\n Output generated successfully:");
  console.log(`- ${path.join(PUBLIC_BOOKS_DIR, "index.json")} (${catalog.length} books)`);
  console.log(
    `- ${path.join(PUBLIC_BOOKS_DIR, "genki-1.json")} (${genki1Detail.totalLessons} lessons, ${genki1Detail.stats.vocabularyCount} vocab, ${genki1Detail.stats.kanjiCount} kanji, ${genki1Detail.stats.grammarCount} grammar, ${genki1Detail.stats.practiceCount || 0} practice items)`
  );
  console.log(
    `- ${path.join(PUBLIC_BOOKS_DIR, "genki-2.json")} (${genki2Detail.totalLessons} lessons, ${genki2Detail.stats.vocabularyCount} vocab, ${genki2Detail.stats.kanjiCount} kanji, ${genki2Detail.stats.grammarCount} grammar, ${genki2Detail.stats.practiceCount || 0} practice items)`
  );
  console.log(
    `- ${path.join(PUBLIC_BOOKS_DIR, "mnn-1.json")} (${mnn1Detail.totalLessons} lessons, ${mnn1Detail.stats.vocabularyCount} vocab, ${mnn1Detail.stats.grammarCount} grammar, ${mnn1Detail.stats.practiceCount || 0} chart drill items)`
  );
  console.log(
    `- ${path.join(PUBLIC_BOOKS_DIR, "mnn-2.json")} (${mnn2Detail.totalLessons} lessons, ${mnn2Detail.stats.vocabularyCount} vocab, ${mnn2Detail.stats.grammarCount} grammar, ${mnn2Detail.stats.practiceCount || 0} chart drill items)`
  );

  // Summary of cross-links
  let totalLinkedVocab = 0;
  let totalAudioVocab = 0;
  let totalLinkedGrammar = 0;
  for (const book of [genki1Detail, genki2Detail, mnn1Detail]) {
    for (const lesson of book.lessons) {
      for (const v of lesson.vocabulary) {
        if (v.linkedVocabId) totalLinkedVocab++;
        if (v.hasAudio) totalAudioVocab++;
      }
      for (const g of lesson.grammar) {
        if (g.linkedGrammarId) totalLinkedGrammar++;
      }
    }
  }

  const grandVocab = genki1Detail.stats.vocabularyCount + genki2Detail.stats.vocabularyCount;
  const grandGrammar = genki1Detail.stats.grammarCount + genki2Detail.stats.grammarCount;
  console.log(`\n Cross-link summary:`);
  console.log(`- Vocabulary JLPT matches: ${totalLinkedVocab}/${grandVocab} (${((totalLinkedVocab / grandVocab) * 100).toFixed(1)}%)`);
  console.log(`- Vocabulary Audio clips: ${totalAudioVocab}/${grandVocab} (${((totalAudioVocab / grandVocab) * 100).toFixed(1)}%)`);
  console.log(`- Grammar JLPT matches: ${totalLinkedGrammar}/${grandGrammar} (${((totalLinkedGrammar / grandGrammar) * 100).toFixed(1)}%)`);
}

main().catch((err) => {
  console.error("Fatal error building books:", err);
  process.exit(1);
});
