import fs from "node:fs";
import path from "node:path";
import kuromoji from "kuromoji";

export interface SynonymCandidate {
  word: string;
  reading: string;
  meaningEn: string;
  furigana?: string;
}

export interface SynonymMatchItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  sentenceJa: string;
  prefix: string;
  targetSurface: string;
  suffix: string;
  sentenceEn: string;
  targetWord: string;
  targetReading: string;
  targetMeaningEn: string;
  correctSynonym: SynonymCandidate;
  distractors: [SynonymCandidate, SynonymCandidate, SynonymCandidate];
  sharedNuanceNote: string;
  prefixFurigana?: string;
  targetFurigana?: string;
  suffixFurigana?: string;
  sentenceFurigana?: string;
}

interface RawVocabEntry {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  modernMeaning?: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  pos: string[];
  examples?: Array<{
    ja: string;
    furigana?: string;
    en: string;
  }>;
  synonyms?: string[];
}

interface CuratedSynonymSeed {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  sentenceJa: string;
  targetSurface: string;
  sentenceEn: string;
  targetWord: string;
  targetReading: string;
  targetMeaningEn: string;
  correctSynonym: SynonymCandidate;
  distractors: [SynonymCandidate, SynonymCandidate, SynonymCandidate];
  sharedNuanceNote?: string;
}

// ============================================================================
// LAYER A: Curated Official JLPT Mondai 5 Archetypes (N5 - N1)
// ============================================================================
const CURATED_SEEDS: CuratedSynonymSeed[] = [
  // --- JLPT N5 ---
  {
    id: "syn-n5-kutabireta",
    jlpt: 5,
    sentenceJa: "きのうはとてもくたびれたので、早く寝ました。",
    targetSurface: "くたびれた",
    sentenceEn: "Yesterday I was exhausted, so I went to bed early.",
    targetWord: "くたびれる",
    targetReading: "くたびれる",
    targetMeaningEn: "to get tired, to be exhausted",
    correctSynonym: { word: "つかれた", reading: "つかれた", meaningEn: "got tired, exhausted" },
    distractors: [
      { word: "おどろいた", reading: "おどろいた", meaningEn: "was surprised" },
      { word: "こまった", reading: "こまった", meaningEn: "was troubled" },
      { word: "よろこんだ", reading: "よろこんだ", meaningEn: "was delighted" },
    ],
    sharedNuanceNote: "Both「くたびれた」and「つかれた」express physical fatigue or exhaustion after effort.",
  },
  {
    id: "syn-n5-taihen",
    jlpt: 5,
    sentenceJa: "きのうの映画はたいへんおもしろかったです。",
    targetSurface: "たいへん",
    sentenceEn: "Yesterday's movie was very interesting.",
    targetWord: "たいへん",
    targetReading: "たいへん",
    targetMeaningEn: "very, greatly",
    correctSynonym: { word: "とても", reading: "とても", meaningEn: "very, exceedingly" },
    distractors: [
      { word: "すこし", reading: "すこし", meaningEn: "a little, slightly" },
      { word: "たまに", reading: "たまに", meaningEn: "occasionally" },
      { word: "あまり", reading: "あまり", meaningEn: "not very (with negative)" },
    ],
    sharedNuanceNote: "When modifying an adjective, both「たいへん」and「とても」mean 'very / extremely'.",
  },
  {
    id: "syn-n5-sugu",
    jlpt: 5,
    sentenceJa: "用事があるので、すぐ帰ります。",
    targetSurface: "すぐ",
    sentenceEn: "I have an errand, so I will go home right away.",
    targetWord: "すぐ",
    targetReading: "すぐ",
    targetMeaningEn: "immediately, right away",
    correctSynonym: { word: "すぐに", reading: "すぐに", meaningEn: "immediately, right away" },
    distractors: [
      { word: "ゆっくり", reading: "ゆっくり", meaningEn: "slowly, leisurely" },
      { word: "ときどき", reading: "ときどき", meaningEn: "sometimes" },
      { word: "あとで", reading: "あとで", meaningEn: "later" },
    ],
    sharedNuanceNote: "Both「すぐ」and「すぐに」mean 'immediately / right away' without delay.",
  },
  {
    id: "syn-n5-dandan",
    jlpt: 5,
    sentenceJa: "春になって、だんだん暖かくなってきました。",
    targetSurface: "だんだん",
    sentenceEn: "Spring has come, and it has gradually gotten warmer.",
    targetWord: "だんだん",
    targetReading: "だんだん",
    targetMeaningEn: "gradually, little by little",
    correctSynonym: { word: "すこしずつ", reading: "すこしずつ", meaningEn: "little by little, gradually" },
    distractors: [
      { word: "きゅうに", reading: "きゅうに", meaningEn: "suddenly" },
      { word: "いつも", reading: "いつも", meaningEn: "always" },
      { word: "ぜんぶ", reading: "ぜんぶ", meaningEn: "all, entirely" },
    ],
    sharedNuanceNote: "Both「だんだん」and「すこしずつ」describe a gradual, step-by-step progression.",
  },
  {
    id: "syn-n5-chittomo",
    jlpt: 5,
    sentenceJa: "この問題は難しくて、ちっともわかりません。",
    targetSurface: "ちっとも",
    sentenceEn: "This question is difficult, so I don't understand it at all.",
    targetWord: "ちっとも",
    targetReading: "ちっとも",
    targetMeaningEn: "not at all (with negative)",
    correctSynonym: { word: "ぜんぜん", reading: "ぜんぜん", meaningEn: "not at all (with negative)" },
    distractors: [
      { word: "だいたい", reading: "だいたい", meaningEn: "mostly, roughly" },
      { word: "かならず", reading: "かならず", meaningEn: "without fail, certainly" },
      { word: "よく", reading: "よく", meaningEn: "well, often" },
    ],
    sharedNuanceNote: "Used with a negative verb, both「ちっとも」and「ぜんぜん」mean 'not at all'.",
  },
  {
    id: "syn-n5-taitei",
    jlpt: 5,
    sentenceJa: "日曜日はたいてい家で本を読んでいます。",
    targetSurface: "たいてい",
    sentenceEn: "On Sundays I usually read books at home.",
    targetWord: "たいてい",
    targetReading: "たいてい",
    targetMeaningEn: "usually, generally, mostly",
    correctSynonym: { word: "いつも", reading: "いつも", meaningEn: "always, usually" },
    distractors: [
      { word: "やっと", reading: "やっと", meaningEn: "finally, at last" },
      { word: "もっと", reading: "もっと", meaningEn: "more" },
      { word: "はじめて", reading: "はじめて", meaningEn: "for the first time" },
    ],
    sharedNuanceNote: "Both「たいてい」and「いつも」describe habitual, regular actions.",
  },
  {
    id: "syn-n5-chikagoro",
    jlpt: 5,
    sentenceJa: "ちかごろ仕事が忙しくて、休みがありません。",
    targetSurface: "ちかごろ",
    sentenceEn: "Lately work has been busy, and I have had no days off.",
    targetWord: "ちかごろ",
    targetReading: "ちかごろ",
    targetMeaningEn: "lately, recently, Nowadays",
    correctSynonym: { word: "さいきん", reading: "さいきん", meaningEn: "recently, lately" },
    distractors: [
      { word: "むかし", reading: "むかし", meaningEn: "long ago, in the past" },
      { word: "あした", reading: "あした", meaningEn: "tomorrow" },
      { word: "まいとし", reading: "まいとし", meaningEn: "every year" },
    ],
    sharedNuanceNote: "Both「ちかごろ」and「さいきん」refer to the recent past up to the present ('lately / recently').",
  },
  {
    id: "syn-n5-ippai",
    jlpt: 5,
    sentenceJa: "公園には子どもがいっぱいいます。",
    targetSurface: "いっぱい",
    sentenceEn: "There are lots of children in the park.",
    targetWord: "いっぱい",
    targetReading: "いっぱい",
    targetMeaningEn: "a lot, full, plenty",
    correctSynonym: { word: "たくさん", reading: "たくさん", meaningEn: "many, a lot" },
    distractors: [
      { word: "ひとり", reading: "ひとり", meaningEn: "one person, alone" },
      { word: "すこし", reading: "すこし", meaningEn: "a few, a little" },
      { word: "ときどき", reading: "ときどき", meaningEn: "sometimes" },
    ],
    sharedNuanceNote: "Both「いっぱい」and「たくさん」express a large quantity or number ('a lot of / many').",
  },
  {
    id: "syn-n5-sakki",
    jlpt: 5,
    sentenceJa: "田中さんなら、さっき帰りましたよ。",
    targetSurface: "さっき",
    sentenceEn: "As for Mr. Tanaka, he went home just a moment ago.",
    targetWord: "さっき",
    targetReading: "さっき",
    targetMeaningEn: "a short while ago, just now",
    correctSynonym: { word: "すこし前", reading: "すこしまえ", meaningEn: "a little while ago" },
    distractors: [
      { word: "ずっと前", reading: "ずっとまえ", meaningEn: "long ago" },
      { word: "これから", reading: "これから", meaningEn: "from now on" },
      { word: "らいしゅう", reading: "らいしゅう", meaningEn: "next week" },
    ],
    sharedNuanceNote: "Both「さっき」and「すこし前」mean 'a short time ago / just a moment ago'.",
  },
  {
    id: "syn-n5-bikkuri",
    jlpt: 5,
    sentenceJa: "大きな音がしたので、びっくりしました。",
    targetSurface: "びっくりしました",
    sentenceEn: "There was a loud sound, so I was startled.",
    targetWord: "びっくりする",
    targetReading: "びっくりする",
    targetMeaningEn: "to be surprised, to be startled",
    correctSynonym: { word: "おどろきました", reading: "おどろきました", meaningEn: "was surprised, astonished" },
    distractors: [
      { word: "わらいました", reading: "わらいました", meaningEn: "laughed, smiled" },
      { word: "なきました", reading: "なきました", meaningEn: "cried" },
      { word: "やすみました", reading: "やすみました", meaningEn: "rested" },
    ],
    sharedNuanceNote: "Both「びっくりする」and「おどろく」mean 'to be surprised / startled'.",
  },
  {
    id: "syn-n5-suteki",
    jlpt: 5,
    sentenceJa: "誕生日にすてきなプレゼントをもらいました。",
    targetSurface: "すてきな",
    sentenceEn: "I received a lovely present on my birthday.",
    targetWord: "すてき",
    targetReading: "すてき",
    targetMeaningEn: "lovely, wonderful, nice",
    correctSynonym: { word: "すばらしい", reading: "すばらしい", meaningEn: "wonderful, splendid" },
    distractors: [
      { word: "つまらない", reading: "つまらない", meaningEn: "boring, dull" },
      { word: "あぶない", reading: "あぶない", meaningEn: "dangerous" },
      { word: "きたない", reading: "きたない", meaningEn: "dirty, messy" },
    ],
    sharedNuanceNote: "Both「すてきな」and「すばらしい」praise something as wonderful or admirable.",
  },
  {
    id: "syn-n5-mottomo",
    jlpt: 5,
    sentenceJa: "一年で最も寒い月は二月です。",
    targetSurface: "最も",
    sentenceEn: "The coldest month of the year is February.",
    targetWord: "最も",
    targetReading: "もっとも",
    targetMeaningEn: "most, extremely",
    correctSynonym: { word: "いちばん", reading: "いちばん", meaningEn: "number one, the most" },
    distractors: [
      { word: "ふつうに", reading: "ふつうに", meaningEn: "normally, ordinarily" },
      { word: "はじめに", reading: "はじめに", meaningEn: "first, at the beginning" },
      { word: "さいごに", reading: "さいごに", meaningEn: "lastly, finally" },
    ],
    sharedNuanceNote: "Both「最も（もっとも）」and「いちばん」form the superlative ('the most').",
  },
  {
    id: "syn-n5-hakkiri",
    jlpt: 5,
    sentenceJa: "きょうは天気がいいので、山がはっきり見えます。",
    targetSurface: "はっきり",
    sentenceEn: "Since the weather is fine today, the mountain can be seen clearly.",
    targetWord: "はっきり",
    targetReading: "はっきり",
    targetMeaningEn: "clearly, distinctly",
    correctSynonym: { word: "よく", reading: "よく", meaningEn: "clearly, well" },
    distractors: [
      { word: "すこし", reading: "すこし", meaningEn: "a little" },
      { word: "やっと", reading: "やっと", meaningEn: "barely, finally" },
      { word: "あまり", reading: "あまり", meaningEn: "not much" },
    ],
    sharedNuanceNote: "With perception verbs like 見える/聞こえる, both「はっきり」and「よく」mean 'clearly / distinctly'.",
  },
  {
    id: "syn-n5-zenbu",
    jlpt: 5,
    sentenceJa: "宿題はぜんぶ終わりました。",
    targetSurface: "ぜんぶ",
    sentenceEn: "I have finished all of my homework.",
    targetWord: "ぜんぶ",
    targetReading: "ぜんぶ",
    targetMeaningEn: "all, everything",
    correctSynonym: { word: "すべて", reading: "すべて", meaningEn: "all, everything" },
    distractors: [
      { word: "はんぶん", reading: "はんぶん", meaningEn: "half" },
      { word: "すこし", reading: "すこし", meaningEn: "a little" },
      { word: "ひとつ", reading: "ひとつ", meaningEn: "one thing" },
    ],
    sharedNuanceNote: "Both「ぜんぶ」and「すべて」mean 'all / everything in its entirety'.",
  },

  // --- JLPT N4 ---
  {
    id: "syn-n4-shitaku",
    jlpt: 4,
    sentenceJa: "出かける前に、旅行の支度をしましょう。",
    targetSurface: "支度",
    sentenceEn: "Let's make preparations for the trip before heading out.",
    targetWord: "支度",
    targetReading: "したく",
    targetMeaningEn: "preparation, getting ready",
    correctSynonym: { word: "準備", reading: "じゅんび", meaningEn: "preparation, arrangement" },
    distractors: [
      { word: "約束", reading: "やくそく", meaningEn: "promise, appointment" },
      { word: "掃除", reading: "そうじ", meaningEn: "cleaning" },
      { word: "相談", reading: "そうだん", meaningEn: "consultation, discussion" },
    ],
    sharedNuanceNote: "Both「支度（したく）」and「準備（じゅんび）」mean 'preparation / getting ready'.",
  },
  {
    id: "syn-n4-yatto",
    jlpt: 4,
    sentenceJa: "三時間探して、やっとなくした鍵が見つかりました。",
    targetSurface: "やっと",
    sentenceEn: "After searching for three hours, the lost key was finally found.",
    targetWord: "やっと",
    targetReading: "やっと",
    targetMeaningEn: "at last, finally",
    correctSynonym: { word: "ようやく", reading: "ようやく", meaningEn: "finally, at long last" },
    distractors: [
      { word: "たまたま", reading: "たまたま", meaningEn: "by chance, accidentally" },
      { word: "かならず", reading: "かならず", meaningEn: "certainly, without fail" },
      { word: "いきなり", reading: "いきなり", meaningEn: "abruptly, suddenly" },
    ],
    sharedNuanceNote: "Both「やっと」and「ようやく」express relief when something long-awaited finally happens.",
  },
  {
    id: "syn-n4-ukagau",
    jlpt: 4,
    sentenceJa: "先生にわからないところをうかがいました。",
    targetSurface: "うかがいました",
    sentenceEn: "I humbly asked the teacher about the parts I didn't understand.",
    targetWord: "うかがう",
    targetReading: "うかがう",
    targetMeaningEn: "to ask, to inquire (humble)",
    correctSynonym: { word: "たずねました", reading: "たずねました", meaningEn: "asked, inquired" },
    distractors: [
      { word: "おしえました", reading: "おしえました", meaningEn: "taught, told" },
      { word: "みせました", reading: "みせました", meaningEn: "showed" },
      { word: "かしました", reading: "かしました", meaningEn: "lent" },
    ],
    sharedNuanceNote: "「うかがう」is the humble (謙譲語) equivalent of「聞く / たずねる」('to ask / inquire').",
  },
  {
    id: "syn-n4-ossharu",
    jlpt: 4,
    sentenceJa: "部長がおっしゃったことをメモしました。",
    targetSurface: "おっしゃった",
    sentenceEn: "I took notes on what the department manager said.",
    targetWord: "おっしゃる",
    targetReading: "おっしゃる",
    targetMeaningEn: "to say, to speak (honorific)",
    correctSynonym: { word: "言った", reading: "いった", meaningEn: "said, spoke" },
    distractors: [
      { word: "聞いた", reading: "きいた", meaningEn: "heard, asked" },
      { word: "書いた", reading: "かいた", meaningEn: "wrote" },
      { word: "読んだ", reading: "よんだ", meaningEn: "read" },
    ],
    sharedNuanceNote: "「おっしゃる」is the respectful (尊敬語) verb corresponding to「言う」('to say').",
  },
  {
    id: "syn-n4-sekkaku",
    jlpt: 4,
    sentenceJa: "せっかく来てくれたのに、留守にしてすみません。",
    targetSurface: "せっかく",
    sentenceEn: "I'm sorry I was out even though you took the trouble to come.",
    targetWord: "せっかく",
    targetReading: "せっかく",
    targetMeaningEn: "with trouble, specially, kindly",
    correctSynonym: { word: "わざわざ", reading: "わざわざ", meaningEn: "go out of one's way, specially" },
    distractors: [
      { word: "ついでに", reading: "ついでに", meaningEn: "incidentally, while at it" },
      { word: "勝手に", reading: "かってに", meaningEn: "arbitrarily, on one's own" },
      { word: "無理に", reading: "むりに", meaningEn: "forcibly, against one's will" },
    ],
    sharedNuanceNote: "When thanking someone's effort, both「せっかく」and「わざわざ」mean 'going out of one's way / specially'.",
  },
  {
    id: "syn-n4-kanarazu",
    jlpt: 4,
    sentenceJa: "明日の会議にはかならず出席してください。",
    targetSurface: "かならず",
    sentenceEn: "Please be sure to attend tomorrow's meeting without fail.",
    targetWord: "かならず",
    targetReading: "かならず",
    targetMeaningEn: "without fail, certainly, definitely",
    correctSynonym: { word: "ぜったいに", reading: "ぜったいに", meaningEn: "absolutely, definitely" },
    distractors: [
      { word: "なるべく", reading: "なるべく", meaningEn: "as much as possible" },
      { word: "めったに", reading: "めったに", meaningEn: "rarely, seldom" },
      { word: "たしかに", reading: "たしかに", meaningEn: "surely, indeed" },
    ],
    sharedNuanceNote: "In requests and obligations, both「かならず」and「ぜったいに」mean 'without fail / definitely'.",
  },
  {
    id: "syn-n4-toutou",
    jlpt: 4,
    sentenceJa: "古い洗濯機がとうとう壊れてしまいました。",
    targetSurface: "とうとう",
    sentenceEn: "The old washing machine finally broke down.",
    targetWord: "とうとう",
    targetReading: "とうとう",
    targetMeaningEn: "finally, at last, in the end",
    correctSynonym: { word: "ついに", reading: "ついに", meaningEn: "finally, at last" },
    distractors: [
      { word: "すぐに", reading: "すぐに", meaningEn: "immediately" },
      { word: "さらに", reading: "さらに", meaningEn: "furthermore" },
      { word: "たまに", reading: "たまに", meaningEn: "occasionally" },
    ],
    sharedNuanceNote: "Both「とうとう」and「ついに」mark a final outcome reached after a long process.",
  },
  {
    id: "syn-n4-rusu",
    jlpt: 4,
    sentenceJa: "きのうは一日中、家が留守でした。",
    targetSurface: "留守",
    sentenceEn: "Yesterday nobody was home all day.",
    targetWord: "留守",
    targetReading: "るす",
    targetMeaningEn: "being away from home, absence",
    correctSynonym: { word: "不在", reading: "ふざい", meaningEn: "absence, being away" },
    distractors: [
      { word: "安全", reading: "あんぜん", meaningEn: "safety" },
      { word: "自由", reading: "じゆう", meaningEn: "freedom" },
      { word: "近所", reading: "きんじょ", meaningEn: "neighborhood" },
    ],
    sharedNuanceNote: "Both「留守（るす）」and「不在（ふざい）」indicate that someone is away from home or their post.",
  },
  {
    id: "syn-n4-gakkari",
    jlpt: 4,
    sentenceJa: "試合に負けて、みんながっかりしていました。",
    targetSurface: "がっかりして",
    sentenceEn: "Having lost the match, everyone was disappointed.",
    targetWord: "がっかりする",
    targetReading: "がっかりする",
    targetMeaningEn: "to be disappointed, to feel dejected",
    correctSynonym: { word: "ざんねんがって", reading: "ざんねんがって", meaningEn: "feeling disappointed / regretful" },
    distractors: [
      { word: "はりきって", reading: "はりきって", meaningEn: "being enthusiastic" },
      { word: "あんしんして", reading: "あんしんして", meaningEn: "feeling relieved" },
      { word: "かんしんして", reading: "かんしんして", meaningEn: "being impressed" },
    ],
    sharedNuanceNote: "Both「がっかりする」and「ざんねんがる」express disappointment over an unfavorable outcome.",
  },
  {
    id: "syn-n4-sukkari",
    jlpt: 4,
    sentenceJa: "約束の時間をすっかり忘れていました。",
    targetSurface: "すっかり",
    sentenceEn: "I completely forgot the appointed time.",
    targetWord: "すっかり",
    targetReading: "すっかり",
    targetMeaningEn: "completely, entirely",
    correctSynonym: { word: "かんぜんに", reading: "かんぜんに", meaningEn: "completely, totally" },
    distractors: [
      { word: "すこしだけ", reading: "すこしだけ", meaningEn: "only a little" },
      { word: "わざと", reading: "わざと", meaningEn: "on purpose" },
      { word: "ようやく", reading: "ようやく", meaningEn: "at last" },
    ],
    sharedNuanceNote: "Both「すっかり」and「かんぜんに」mean 'completely / entirely' (often used with forgetting or changing).",
  },
  {
    id: "syn-n4-henji",
    jlpt: 4,
    sentenceJa: "招待状の返事をまだ出していません。",
    targetSurface: "返事",
    sentenceEn: "I haven't sent a reply to the invitation yet.",
    targetWord: "返事",
    targetReading: "へんじ",
    targetMeaningEn: "reply, answer, response",
    correctSynonym: { word: "回答", reading: "かいとう", meaningEn: "reply, answer, response" },
    distractors: [
      { word: "質問", reading: "しつもん", meaningEn: "question" },
      { word: "連絡", reading: "れんらく", meaningEn: "contact, notice" },
      { word: "挨拶", reading: "あいさつ", meaningEn: "greeting" },
    ],
    sharedNuanceNote: "Both「返事（へんじ）」and「回答（かいとう）」mean 'a reply / response'.",
  },
  {
    id: "syn-n4-tsugou",
    jlpt: 4,
    sentenceJa: "来週の金曜日は都合が悪いです。",
    targetSurface: "都合",
    sentenceEn: "Next Friday is inconvenient for my schedule.",
    targetWord: "都合",
    targetReading: "つごう",
    targetMeaningEn: "circumstances, schedule, convenience",
    correctSynonym: { word: "予定", reading: "よてい", meaningEn: "schedule, plan, arrangement" },
    distractors: [
      { word: "気分", reading: "きぶん", meaningEn: "mood, feeling" },
      { word: "天気", reading: "てんき", meaningEn: "weather" },
      { word: "趣味", reading: "しゅみ", meaningEn: "hobby" },
    ],
    sharedNuanceNote: "When discussing availability, both「都合（つごう）」and「予定（よてい）」refer to one's personal schedule.",
  },
  {
    id: "syn-n4-shikata",
    jlpt: 4,
    sentenceJa: "電車が止まったのだから、遅れても仕方がない。",
    targetSurface: "仕方がない",
    sentenceEn: "Since the train stopped, it can't be helped even if we are late.",
    targetWord: "仕方がない",
    targetReading: "しかたがない",
    targetMeaningEn: "it cannot be helped, unavoidable",
    correctSynonym: { word: "しょうがない", reading: "しょうがない", meaningEn: "it can't be helped" },
    distractors: [
      { word: "つまらない", reading: "つまらない", meaningEn: "boring, trivial" },
      { word: "もったいない", reading: "もったいない", meaningEn: "wasteful" },
      { word: "うらやましい", reading: "うらやましい", meaningEn: "envious" },
    ],
    sharedNuanceNote: "Both「仕方がない」and「しょうがない」express that a situation cannot be helped.",
  },

  // --- JLPT N3 ---
  {
    id: "syn-n3-tachimachi",
    jlpt: 3,
    sentenceJa: "新しいケーキ屋のうわさは、たちまち町中に広がった。",
    targetSurface: "たちまち",
    sentenceEn: "Rumors of the new cake shop spread throughout the town in an instant.",
    targetWord: "たちまち",
    targetReading: "たちまち",
    targetMeaningEn: "in an instant, immediately, right away",
    correctSynonym: { word: "すぐに", reading: "すぐに", meaningEn: "immediately, right away" },
    distractors: [
      { word: "しだいに", reading: "しだいに", meaningEn: "gradually" },
      { word: "ひそかに", reading: "ひそかに", meaningEn: "secretly" },
      { word: "めったに", reading: "めったに", meaningEn: "rarely" },
    ],
    sharedNuanceNote: "Both「たちまち」and「すぐに」describe something happening almost instantaneously.",
  },
  {
    id: "syn-n3-shocchuu",
    jlpt: 3,
    sentenceJa: "弟はしょっちゅうスマホをどこかに置き忘れる。",
    targetSurface: "しょっちゅう",
    sentenceEn: "My younger brother is always leaving his smartphone behind somewhere.",
    targetWord: "しょっちゅう",
    targetReading: "しょっちゅう",
    targetMeaningEn: "all the time, constantly, very often",
    correctSynonym: { word: "いつも", reading: "いつも", meaningEn: "always, all the time" },
    distractors: [
      { word: "たまに", reading: "たまに", meaningEn: "once in a while" },
      { word: "わざと", reading: "わざと", meaningEn: "intentionally" },
      { word: "けっして", reading: "けっして", meaningEn: "never" },
    ],
    sharedNuanceNote: "Both「しょっちゅう」and「いつも」mean 'frequently / all the time'.",
  },
  {
    id: "syn-n3-tabitabi",
    jlpt: 3,
    sentenceJa: "ご迷惑をおかけすることがたびたびありました。",
    targetSurface: "たびたび",
    sentenceEn: "There were many occasions when we caused you trouble.",
    targetWord: "たびたび",
    targetReading: "たびたび",
    targetMeaningEn: "repeatedly, many times, often",
    correctSynonym: { word: "なんども", reading: "なんども", meaningEn: "many times, repeatedly" },
    distractors: [
      { word: "いちども", reading: "いちども", meaningEn: "not even once" },
      { word: "すこしだけ", reading: "すこしだけ", meaningEn: "just a little" },
      { word: "たまたま", reading: "たまたま", meaningEn: "by chance" },
    ],
    sharedNuanceNote: "Both「たびたび」and「なんども」mean 'repeatedly / many times'.",
  },
  {
    id: "syn-n3-omowazu",
    jlpt: 3,
    sentenceJa: "あまりにおかしくて、おもわず笑ってしまった。",
    targetSurface: "おもわず",
    sentenceEn: "It was so funny that I laughed involuntarily without thinking.",
    targetWord: "おもわず",
    targetReading: "おもわず",
    targetMeaningEn: "involuntarily, reflexively, unintentionally",
    correctSynonym: { word: "しらずに", reading: "しらずに", meaningEn: "unconsciously, without realizing" },
    distractors: [
      { word: "むりやり", reading: "むりやり", meaningEn: "forcibly" },
      { word: "わざわざ", reading: "わざわざ", meaningEn: "deliberately, specially" },
      { word: "かならず", reading: "かならず", meaningEn: "without fail" },
    ],
    sharedNuanceNote: "Both「おもわず」and「しらずに（無意識に）」describe doing something reflexively without intending to.",
  },
  {
    id: "syn-n3-kuyashii",
    jlpt: 3,
    sentenceJa: "あと一点で負けてしまい、とてもくやしい。",
    targetSurface: "くやしい",
    sentenceEn: "We lost by just one point, and it is deeply frustrating.",
    targetWord: "くやしい",
    targetReading: "くやしい",
    targetMeaningEn: "frustrating, regrettable, vexing",
    correctSynonym: { word: "ざんねんだ", reading: "ざんねんだ", meaningEn: "regrettable, disappointing" },
    distractors: [
      { word: "うらやましい", reading: "うらやましい", meaningEn: "envious, jealous" },
      { word: "なつかしい", reading: "なつかしい", meaningEn: "nostalgic" },
      { word: "おそろしい", reading: "おそろしい", meaningEn: "terrifying" },
    ],
    sharedNuanceNote: "Both「くやしい」and「ざんねんだ」express bitter regret and disappointment over a loss.",
  },
  {
    id: "syn-n3-namakeru",
    jlpt: 3,
    sentenceJa: "練習をなまけると、すぐに技術が落ちてしまう。",
    targetSurface: "なまける",
    sentenceEn: "If you slack off on practice, your skill will drop quickly.",
    targetWord: "なまける",
    targetReading: "なまける",
    targetMeaningEn: "to slack off, to be lazy, to neglect",
    correctSynonym: { word: "さぼる", reading: "さぼる", meaningEn: "to skip, to slack off" },
    distractors: [
      { word: "つづける", reading: "つづける", meaningEn: "to continue" },
      { word: "あきらめる", reading: "あきらめる", meaningEn: "to give up" },
      { word: "くらべる", reading: "くらべる", meaningEn: "to compare" },
    ],
    sharedNuanceNote: "Both「なまける」and「さぼる」mean 'to neglect one's duties / slack off'.",
  },
  {
    id: "syn-n3-detarame",
    jlpt: 3,
    sentenceJa: "彼の話はでたらめばかりで信用できない。",
    targetSurface: "でたらめ",
    sentenceEn: "His stories are full of nonsense and cannot be trusted.",
    targetWord: "でたらめ",
    targetReading: "でたらめ",
    targetMeaningEn: "nonsense, irresponsible talk, falsehood",
    correctSynonym: { word: "うそ", reading: "うそ", meaningEn: "lie, falsehood, fabrication" },
    distractors: [
      { word: "じまん", reading: "じまん", meaningEn: "boasting, pride" },
      { word: "ひみつ", reading: "ひみつ", meaningEn: "secret" },
      { word: "じょうだん", reading: "じょうだん", meaningEn: "joke" },
    ],
    sharedNuanceNote: "In spoken statements, both「でたらめ」and「うそ」refer to groundless, untrue claims.",
  },
  {
    id: "syn-n3-nonbiri",
    jlpt: 3,
    sentenceJa: "休日は温泉でのんびり過ごしたい。",
    targetSurface: "のんびり",
    sentenceEn: "On my day off, I want to spend time leisurely at a hot spring.",
    targetWord: "のんびり",
    targetReading: "のんびり",
    targetMeaningEn: "leisurely, carefree, at ease",
    correctSynonym: { word: "ゆっくり", reading: "ゆっくり", meaningEn: "slowly, leisurely, restfully" },
    distractors: [
      { word: "しっかり", reading: "しっかり", meaningEn: "firmly, steadily" },
      { word: "はっきり", reading: "はっきり", meaningEn: "clearly" },
      { word: "こっそり", reading: "こっそり", meaningEn: "secretly, stealthily" },
    ],
    sharedNuanceNote: "Both「のんびり」and「ゆっくり」mean 'relaxing / taking one's time without rushing'.",
  },
  {
    id: "syn-n3-totsuzen",
    jlpt: 3,
    sentenceJa: "空が暗くなり、とつぜん激しい雨が降り出した。",
    targetSurface: "とつぜん",
    sentenceEn: "The sky grew dark, and suddenly heavy rain started falling.",
    targetWord: "とつぜん",
    targetReading: "とつぜん",
    targetMeaningEn: "suddenly, abruptly, unexpectedly",
    correctSynonym: { word: "きゅうに", reading: "きゅうに", meaningEn: "suddenly, abruptly" },
    distractors: [
      { word: "しずかに", reading: "しずかに", meaningEn: "quietly" },
      { word: "めったに", reading: "めったに", meaningEn: "rarely" },
      { word: "じゅんばんに", reading: "じゅんばんに", meaningEn: "in order, in turn" },
    ],
    sharedNuanceNote: "Both「とつぜん」and「きゅうに」describe an unexpected, sudden event.",
  },
  {
    id: "syn-n3-tamatama",
    jlpt: 3,
    sentenceJa: "きのう駅で、たまたま高校の友だちに会った。",
    targetSurface: "たまたま",
    sentenceEn: "Yesterday at the station, I ran into a high school friend by chance.",
    targetWord: "たまたま",
    targetReading: "たまたま",
    targetMeaningEn: "by chance, coincidentally",
    correctSynonym: { word: "ぐうぜん", reading: "ぐうぜん", meaningEn: "by chance, coincidentally" },
    distractors: [
      { word: "とうぜん", reading: "とうぜん", meaningEn: "naturally, as a matter of course" },
      { word: "とつぜん", reading: "とつぜん", meaningEn: "suddenly" },
      { word: "ぜんぜん", reading: "ぜんぜん", meaningEn: "not at all" },
    ],
    sharedNuanceNote: "Both「たまたま」and「ぐうぜん」mean 'by chance / coincidentally'.",
  },
  {
    id: "syn-n3-sokkuri",
    jlpt: 3,
    sentenceJa: "彼女は母親に顔がそっくりだ。",
    targetSurface: "そっくりだ",
    sentenceEn: "Her face looks just like her mother's.",
    targetWord: "そっくり",
    targetReading: "そっくり",
    targetMeaningEn: "just like, spitting image, identical",
    correctSynonym: { word: "よく似ている", reading: "よくにている", meaningEn: "resembles closely" },
    distractors: [
      { word: "ぜんぜん違う", reading: "ぜんぜんちがう", meaningEn: "completely different" },
      { word: "とても優しい", reading: "とてもやさしい", meaningEn: "very kind" },
      { word: "すこし若い", reading: "すこしわかい", meaningEn: "a bit younger" },
    ],
    sharedNuanceNote: "Both「そっくりだ」and「よく似ている」describe a striking resemblance.",
  },
  {
    id: "syn-n3-aratameru",
    jlpt: 3,
    sentenceJa: "生活の悪い習慣を改めることにした。",
    targetSurface: "改める",
    sentenceEn: "I decided to reform my bad lifestyle habits.",
    targetWord: "改める",
    targetReading: "あらためる",
    targetMeaningEn: "to reform, to change for the better, to correct",
    correctSynonym: { word: "直す", reading: "なおす", meaningEn: "to correct, to fix, to mend" },
    distractors: [
      { word: "守る", reading: "まもる", meaningEn: "to protect, to obey" },
      { word: "隠す", reading: "かくす", meaningEn: "to hide" },
      { word: "残す", reading: "のこす", meaningEn: "to leave behind" },
    ],
    sharedNuanceNote: "Both「改める（あらためる）」and「直す（なおす）」mean 'to correct / improve a fault or habit'.",
  },
  {
    id: "syn-n3-takuwaeru",
    jlpt: 3,
    sentenceJa: "将来のために少しずつお金を蓄えている。",
    targetSurface: "蓄えて",
    sentenceEn: "I am saving up money little by little for the future.",
    targetWord: "蓄える",
    targetReading: "たくわえる",
    targetMeaningEn: "to store up, to save, to accumulate",
    correctSynonym: { word: "ためて", reading: "ためて", meaningEn: "saving up, accumulating" },
    distractors: [
      { word: "かりて", reading: "かりて", meaningEn: "borrowing" },
      { word: "はらって", reading: "はらって", meaningEn: "paying" },
      { word: "かぞえて", reading: "かぞえて", meaningEn: "counting" },
    ],
    sharedNuanceNote: "Both「蓄える（たくわえる）」and「ためる」mean 'to save up / accumulate resources'.",
  },
  {
    id: "syn-n3-kudaranai",
    jlpt: 3,
    sentenceJa: "そんなくだらないことでけんかするのはやめなさい。",
    targetSurface: "くだらない",
    sentenceEn: "Stop quarreling over such a trivial matter.",
    targetWord: "くだらない",
    targetReading: "くだらない",
    targetMeaningEn: "trivial, pointless, foolish",
    correctSynonym: { word: "つまらない", reading: "つまらない", meaningEn: "trivial, insignificant, boring" },
    distractors: [
      { word: "めずらしい", reading: "めずらしい", meaningEn: "rare, unusual" },
      { word: "すばらしい", reading: "すばらしい", meaningEn: "wonderful" },
      { word: "むずかしい", reading: "むずかしい", meaningEn: "difficult" },
    ],
    sharedNuanceNote: "Both「くだらない」and「つまらない」describe something trifling or not worth attention.",
  },

  // --- JLPT N2 ---
  {
    id: "syn-n2-awatadashii",
    jlpt: 2,
    sentenceJa: "年末は何かとあわただしい日が続く。",
    targetSurface: "あわただしい",
    sentenceEn: "At the end of the year, hectic days continue in one way or another.",
    targetWord: "あわただしい",
    targetReading: "あわただしい",
    targetMeaningEn: "hectic, busy, hurried",
    correctSynonym: { word: "いそがしい", reading: "いそがしい", meaningEn: "busy, occupied" },
    distractors: [
      { word: "やかましい", reading: "やかましい", meaningEn: "noisy, boisterous" },
      { word: "むなしい", reading: "むなしい", meaningEn: "empty, futile" },
      { word: "たのもしい", reading: "たのもしい", meaningEn: "reliable, promising" },
    ],
    sharedNuanceNote: "Both「あわただしい」and「いそがしい」describe being hectically busy.",
  },
  {
    id: "syn-n2-sumiyakani",
    jlpt: 2,
    sentenceJa: "避難指示が出たら、すみやかに建物の外へ出てください。",
    targetSurface: "すみやかに",
    sentenceEn: "When an evacuation order is issued, please exit the building promptly.",
    targetWord: "すみやかに",
    targetReading: "すみやかに",
    targetMeaningEn: "promptly, immediately, without delay",
    correctSynonym: { word: "すぐに", reading: "すぐに", meaningEn: "immediately, right away" },
    distractors: [
      { word: "しずかに", reading: "しずかに", meaningEn: "quietly, calmly" },
      { word: "たしかに", reading: "たしかに", meaningEn: "certainly" },
      { word: "はるかに", reading: "はるかに", meaningEn: "far, by far" },
    ],
    sharedNuanceNote: "「すみやかに」is the formal equivalent of「すぐに / はやく」('promptly / immediately').",
  },
  {
    id: "syn-n2-hikkkirinashini",
    jlpt: 2,
    sentenceJa: "朝から問い合わせの電話がひっきりなしにかかってくる。",
    targetSurface: "ひっきりなしに",
    sentenceEn: "Inquiry phone calls have been coming in incessantly since morning.",
    targetWord: "ひっきりなしに",
    targetReading: "ひっきりなしに",
    targetMeaningEn: "incessantly, continuously, non-stop",
    correctSynonym: { word: "絶えず", reading: "たえず", meaningEn: "constantly, unceasingly" },
    distractors: [
      { word: "まれに", reading: "まれに", meaningEn: "rarely, seldom" },
      { word: "とつぜん", reading: "とつぜん", meaningEn: "suddenly" },
      { word: "しだいに", reading: "しだいに", meaningEn: "gradually" },
    ],
    sharedNuanceNote: "Both「ひっきりなしに」and「絶えず（たえず）」mean 'incessantly / without pause'.",
  },
  {
    id: "syn-n2-abekobe",
    jlpt: 2,
    sentenceJa: "靴下を裏表あべこべに履いてしまった。",
    targetSurface: "あべこべ",
    sentenceEn: "I accidentally put my socks on inside out (the wrong way round).",
    targetWord: "あべこべ",
    targetReading: "あべこべ",
    targetMeaningEn: "contrary, opposite, upside down, reversed",
    correctSynonym: { word: "ぎゃく", reading: "ぎゃく", meaningEn: "reverse, opposite" },
    distractors: [
      { word: "おなじ", reading: "おなじ", meaningEn: "same, identical" },
      { word: "べつべつ", reading: "べつべつ", meaningEn: "separately" },
      { word: "ばらばら", reading: "ばらばら", meaningEn: "scattered, disconnected" },
    ],
    sharedNuanceNote: "Both「あべこべ」and「ぎゃく（反対）」mean 'reversed / the opposite way around'.",
  },
  {
    id: "syn-n2-kossori",
    jlpt: 2,
    sentenceJa: "誰にも気づかれないように、こっそり部屋を出た。",
    targetSurface: "こっそり",
    sentenceEn: "I slipped out of the room stealthily so nobody would notice.",
    targetWord: "こっそり",
    targetReading: "こっそり",
    targetMeaningEn: "stealthily, secretly, quietly",
    correctSynonym: { word: "ひそかに", reading: "ひそかに", meaningEn: "secretly, quietly, privately" },
    distractors: [
      { word: "堂々と", reading: "どうどうと", meaningEn: "boldly, openly" },
      { word: "いっせいに", reading: "いっせいに", meaningEn: "simultaneously, all at once" },
      { word: "しぶしぶ", reading: "しぶしぶ", meaningEn: "reluctantly" },
    ],
    sharedNuanceNote: "Both「こっそり」and「ひそかに」describe doing something secretly out of sight.",
  },
  {
    id: "syn-n2-yamuwoezu",
    jlpt: 2,
    sentenceJa: "台風で飛行機が欠航になり、やむをえず予定を変更した。",
    targetSurface: "やむをえず",
    sentenceEn: "Because the flight was canceled due to the typhoon, I had no choice but to change my plans.",
    targetWord: "やむをえず",
    targetReading: "やむをえず",
    targetMeaningEn: "unavoidably, reluctantly, having no choice",
    correctSynonym: { word: "しかたなく", reading: "しかたなく", meaningEn: "reluctantly, having no other choice" },
    distractors: [
      { word: "よろこんで", reading: "よろこんで", meaningEn: "gladly, willingly" },
      { word: "おもいがけず", reading: "おもいがけず", meaningEn: "unexpectedly" },
      { word: "ためらわずに", reading: "ためらわずに", meaningEn: "without hesitation" },
    ],
    sharedNuanceNote: "Both「やむをえず」and「しかたなく」mean 'unavoidably / having no other choice'.",
  },
  {
    id: "syn-n2-ainiku",
    jlpt: 2,
    sentenceJa: "せっかくの旅行なのに、あいにく雨が降ってしまった。",
    targetSurface: "あいにく",
    sentenceEn: "Even though it was a long-awaited trip, unfortunately it rained.",
    targetWord: "あいにく",
    targetReading: "あいにく",
    targetMeaningEn: "unfortunately, regrettably, ill-timed",
    correctSynonym: { word: "ざんねんなことに", reading: "ざんねんなことに", meaningEn: "unfortunately, regrettably" },
    distractors: [
      { word: "さいわいなことに", reading: "さいわいなことに", meaningEn: "fortunately" },
      { word: "ふしぎなことに", reading: "ふしぎなことに", meaningEn: "strangely enough" },
      { word: "とうぜんなことに", reading: "とうぜんなことに", meaningEn: "naturally" },
    ],
    sharedNuanceNote: "Both「あいにく」and「ざんねんなことに」express regret that circumstances turned out unfavorably.",
  },
  {
    id: "syn-n2-ichijirushii",
    jlpt: 2,
    sentenceJa: "この地域の経済発展はいちじるしい。",
    targetSurface: "いちじるしい",
    sentenceEn: "The economic development of this region is remarkable.",
    targetWord: "著しい",
    targetReading: "いちじるしい",
    targetMeaningEn: "remarkable, striking, notable",
    correctSynonym: { word: "めざましい", reading: "めざましい", meaningEn: "remarkable, striking, brilliant" },
    distractors: [
      { word: "あやしい", reading: "あやしい", meaningEn: "suspicious, dubious" },
      { word: "とぼしい", reading: "とぼしい", meaningEn: "scarce, meager" },
      { word: "けわしい", reading: "けわしい", meaningEn: "steep, grim" },
    ],
    sharedNuanceNote: "Both「著しい（いちじるしい）」and「めざましい」describe striking, rapid progress or change.",
  },
  {
    id: "syn-n2-toboshii",
    jlpt: 2,
    sentenceJa: "彼はまだ実務の経験がとぼしい。",
    targetSurface: "とぼしい",
    sentenceEn: "He is still lacking in practical experience.",
    targetWord: "乏しい",
    targetReading: "とぼしい",
    targetMeaningEn: "scarce, meager, lacking",
    correctSynonym: { word: "すくない", reading: "すくない", meaningEn: "few, scarce, little" },
    distractors: [
      { word: "ゆたかだ", reading: "ゆたかだ", meaningEn: "abundant, rich" },
      { word: "たしかだ", reading: "たしかだ", meaningEn: "certain, reliable" },
      { word: "こまかい", reading: "こまかい", meaningEn: "detailed, small" },
    ],
    sharedNuanceNote: "Both「乏しい（とぼしい）」and「すくない」indicate scarcity or insufficiency.",
  },
  {
    id: "syn-n2-moppara",
    jlpt: 2,
    sentenceJa: "休日はもっぱら家で映画を見て過ごしている。",
    targetSurface: "もっぱら",
    sentenceEn: "On holidays I spend my time mainly watching movies at home.",
    targetWord: "もっぱら",
    targetReading: "もっぱら",
    targetMeaningEn: "mainly, chiefly, exclusively",
    correctSynonym: { word: "おもに", reading: "おもに", meaningEn: "mainly, primarily" },
    distractors: [
      { word: "まれに", reading: "まれに", meaningEn: "rarely" },
      { word: "しぶしぶ", reading: "しぶしぶ", meaningEn: "reluctantly" },
      { word: "かりに", reading: "かりに", meaningEn: "temporarily, supposing" },
    ],
    sharedNuanceNote: "Both「もっぱら」and「おもに」mean 'chiefly / mainly / almost exclusively'.",
  },
  {
    id: "syn-n2-tayasui",
    jlpt: 2,
    sentenceJa: "口で言うのはたやすいが、実行するのは難しい。",
    targetSurface: "たやすい",
    sentenceEn: "It is easy to say in words, but difficult to put into practice.",
    targetWord: "たやすい",
    targetReading: "たやすい",
    targetMeaningEn: "easy, simple, effortless",
    correctSynonym: { word: "かんたんだ", reading: "かんたんだ", meaningEn: "easy, simple" },
    distractors: [
      { word: "ふくざつだ", reading: "ふくざつだ", meaningEn: "complicated" },
      { word: "きけんだ", reading: "きけんだ", meaningEn: "dangerous" },
      { word: "たいくつだ", reading: "たいくつだ", meaningEn: "tedious, boring" },
    ],
    sharedNuanceNote: "Both「たやすい」and「かんたんだ」mean 'easy / simple to do'.",
  },
  {
    id: "syn-n2-tegakeru",
    jlpt: 2,
    sentenceJa: "彼女は多くのヒット商品を手がけてきた。",
    targetSurface: "手がけて",
    sentenceEn: "She has worked on and produced many hit products.",
    targetWord: "手がける",
    targetReading: "てがける",
    targetMeaningEn: "to handle, to work on, to manage",
    correctSynonym: { word: "扱って", reading: "あつかって", meaningEn: "handling, dealing with" },
    distractors: [
      { word: "断って", reading: "ことわって", meaningEn: "refusing" },
      { word: "疑って", reading: "うたがって", meaningEn: "doubting" },
      { word: "恐れて", reading: "おそれて", meaningEn: "fearing" },
    ],
    sharedNuanceNote: "Both「手がける」and「扱う（あつかう）」mean 'to take charge of / work on a project'.",
  },

  // --- JLPT N1 ---
  {
    id: "syn-n1-onozuto",
    jlpt: 1,
    sentenceJa: "努力を続けていれば、道はおのずと開けるだろう。",
    targetSurface: "おのずと",
    sentenceEn: "If you keep making efforts, the path will naturally open up by itself.",
    targetWord: "おのずと",
    targetReading: "おのずと",
    targetMeaningEn: "naturally, of its own accord",
    correctSynonym: { word: "しぜんに", reading: "しぜんに", meaningEn: "naturally, spontaneously" },
    distractors: [
      { word: "強引に", reading: "ごういんに", meaningEn: "coercively, forcefully" },
      { word: "意図的に", reading: "いとてきに", meaningEn: "intentionally" },
      { word: "一斉に", reading: "いっせいに", meaningEn: "simultaneously" },
    ],
    sharedNuanceNote: "Both「おのずと」and「しぜんに」mean 'naturally / of its own accord without forced intervention'.",
  },
  {
    id: "syn-n1-moushibunnai",
    jlpt: 1,
    sentenceJa: "彼の実力は今回のプロジェクトにおいて申し分ない。",
    targetSurface: "申し分ない",
    sentenceEn: "His ability leaves nothing to be desired for this project.",
    targetWord: "申し分ない",
    targetReading: "もうしぶんない",
    targetMeaningEn: "flawless, impeccable, beyond criticism",
    correctSynonym: { word: "完全だ", reading: "かんぜんだ", meaningEn: "complete, flawless, satisfactory" },
    distractors: [
      { word: "不十分だ", reading: "ふじゅうぶんだ", meaningEn: "insufficient, inadequate" },
      { word: "曖昧だ", reading: "あいまいだ", meaningEn: "vague, ambiguous" },
      { word: "控えめだ", reading: "ひかえめだ", meaningEn: "modest, reserved" },
    ],
    sharedNuanceNote: "Both「申し分ない」and「完全だ（十分で文句がない）」mean 'flawless / leaving nothing to be desired'.",
  },
  {
    id: "syn-n1-obitadashii",
    jlpt: 1,
    sentenceJa: "事故現場にはおびただしい数の人が集まっていた。",
    targetSurface: "おびただしい",
    sentenceEn: "A vast number of people had gathered at the scene of the accident.",
    targetWord: "おびただしい",
    targetReading: "おびただしい",
    targetMeaningEn: "vast, immense, innumerable",
    correctSynonym: { word: "たくさんの", reading: "たくさんの", meaningEn: "many, a large number of" },
    distractors: [
      { word: "わずかな", reading: "わずかな", meaningEn: "slight, meager, few" },
      { word: "まれな", reading: "まれな", meaningEn: "rare, uncommon" },
      { word: "おだやかな", reading: "おだやかな", meaningEn: "calm, gentle" },
    ],
    sharedNuanceNote: "Both「おびただしい」and「たくさんの（非常に多い）」describe an overwhelmingly large quantity.",
  },
  {
    id: "syn-n1-niwakani",
    jlpt: 1,
    sentenceJa: "そんなうまい話は、にわかに信じがたい。",
    targetSurface: "にわかに",
    sentenceEn: "Such a convenient story is hard to believe right away.",
    targetWord: "にわかに",
    targetReading: "にわかに",
    targetMeaningEn: "suddenly, immediately, readily",
    correctSynonym: { word: "すぐには", reading: "すぐには", meaningEn: "immediately, right away" },
    distractors: [
      { word: "永久に", reading: "えいきゅうに", meaningEn: "permanently, forever" },
      { word: "部分的に", reading: "ぶぶんてきに", meaningEn: "partially" },
      { word: "交互に", reading: "こうごに", meaningEn: "alternately" },
    ],
    sharedNuanceNote: "With negative expressions like 信じがたい, both「にわかに」and「すぐには」mean 'readily / right away'.",
  },
  {
    id: "syn-n1-hanahadashii",
    jlpt: 1,
    sentenceJa: "最近の彼の遅刻ぶりははなはだしい。",
    targetSurface: "はなはだしい",
    sentenceEn: "His recent tardiness is extreme.",
    targetWord: "甚だしい",
    targetReading: "はなはだしい",
    targetMeaningEn: "extreme, excessive, severe",
    correctSynonym: { word: "ひどい", reading: "ひどい", meaningEn: "severe, extreme, terrible" },
    distractors: [
      { word: "すがすがしい", reading: "すがすがしい", meaningEn: "refreshing, bracing" },
      { word: "めずらしい", reading: "めずらしい", meaningEn: "rare, unusual" },
      { word: "ふさわしい", reading: "ふさわしい", meaningEn: "suitable, worthy" },
    ],
    sharedNuanceNote: "Both「甚だしい（はなはだしい）」and「ひどい」indicate that something exceeds normal bounds.",
  },
  {
    id: "syn-n1-azamuku",
    jlpt: 1,
    sentenceJa: "巧みな言葉で相手をあざむくのは許されない。",
    targetSurface: "あざむく",
    sentenceEn: "Deceiving others with clever words is unforgivable.",
    targetWord: "欺く",
    targetReading: "あざむく",
    targetMeaningEn: "to deceive, to delude, to trick",
    correctSynonym: { word: "だます", reading: "だます", meaningEn: "to trick, to deceive, to cheat" },
    distractors: [
      { word: "なぐさめる", reading: "なぐさめる", meaningEn: "to comfort, to console" },
      { word: "はげます", reading: "はげます", meaningEn: "to encourage" },
      { word: "みとめる", reading: "みとめる", meaningEn: "to recognize, to admit" },
    ],
    sharedNuanceNote: "Both「欺く（あざむく）」and「だます」mean 'to deceive / trick someone'.",
  },
  {
    id: "syn-n1-sukoburu",
    jlpt: 1,
    sentenceJa: "手術後の経過はすこぶる順調だ。",
    targetSurface: "すこぶる",
    sentenceEn: "Progress after the surgery is exceedingly smooth.",
    targetWord: "すこぶる",
    targetReading: "すこぶる",
    targetMeaningEn: "extremely, exceedingly, very",
    correctSynonym: { word: "たいへん", reading: "たいへん", meaningEn: "very, exceedingly" },
    distractors: [
      { word: "いくぶん", reading: "いくぶん", meaningEn: "somewhat, to some extent" },
      { word: "かろうじて", reading: "かろうじて", meaningEn: "barely, narrowly" },
      { word: "からっきし", reading: "からっきし", meaningEn: "not at all" },
    ],
    sharedNuanceNote: "Both「すこぶる」and「たいへん（非常に）」mean 'exceedingly / very'.",
  },
  {
    id: "syn-n1-okkuu",
    jlpt: 1,
    sentenceJa: "寒い日は外へ出るのがおっくうになる。",
    targetSurface: "おっくうに",
    sentenceEn: "On cold days, going outside becomes bothersome.",
    targetWord: "億劫",
    targetReading: "おっくう",
    targetMeaningEn: "troublesome, bothersome, tiresome",
    correctSynonym: { word: "めんどうに", reading: "めんどうに", meaningEn: "troublesome, bothersome" },
    distractors: [
      { word: "楽しみに", reading: "たのしみに", meaningEn: "looking forward to" },
      { word: "誇りに", reading: "ほこりに", meaningEn: "proud of" },
      { word: "気軽に", reading: "きがるに", meaningEn: "lightheartedly" },
    ],
    sharedNuanceNote: "Both「おっくう」and「めんどう」describe feeling reluctant because something seems tiresome.",
  },
  {
    id: "syn-n1-mokuromu",
    jlpt: 1,
    sentenceJa: "彼らは新規事業への参入を目論んでいる。",
    targetSurface: "目論んで",
    sentenceEn: "They are planning to enter the new business sector.",
    targetWord: "目論む",
    targetReading: "もくろむ",
    targetMeaningEn: "to plan, to scheme, to contemplate",
    correctSynonym: { word: "計画して", reading: "けいかくして", meaningEn: "planning, projecting" },
    distractors: [
      { word: "断念して", reading: "だんねんして", meaningEn: "abandoning, giving up" },
      { word: "後悔して", reading: "こうかいして", meaningEn: "regretting" },
      { word: "遠慮して", reading: "えんりょして", meaningEn: "refraining" },
    ],
    sharedNuanceNote: "Both「目論む（もくろむ）」and「計画する」mean 'to plan / scheme toward a goal'.",
  },
  {
    id: "syn-n1-sagesumu",
    jlpt: 1,
    sentenceJa: "他人を蔑むような態度は慎むべきだ。",
    targetSurface: "蔑む",
    sentenceEn: "One should refrain from an attitude that scorns others.",
    targetWord: "蔑む",
    targetReading: "さげすむ",
    targetMeaningEn: "to scorn, to despise, to look down on",
    correctSynonym: { word: "見下す", reading: "みくだす", meaningEn: "to look down on, to despise" },
    distractors: [
      { word: "敬う", reading: "うやまう", meaningEn: "to respect, to revere" },
      { word: "慕う", reading: "したう", meaningEn: "to adore, to yearn for" },
      { word: "労わる", reading: "いたわる", meaningEn: "to care for, to sympathize with" },
    ],
    sharedNuanceNote: "Both「蔑む（さげすむ）」and「見下す（みくだす）」mean 'to look down on / despise'.",
  },
  {
    id: "syn-n1-hakadoru",
    jlpt: 1,
    sentenceJa: "静かな環境のおかげで、原稿の執筆がずいぶん捗った。",
    targetSurface: "捗った",
    sentenceEn: "Thanks to the quiet environment, writing the manuscript progressed smoothly.",
    targetWord: "捗る",
    targetReading: "はかどる",
    targetMeaningEn: "to make good progress, to move right along",
    correctSynonym: { word: "順調に進んだ", reading: "じゅんちょうにすすんだ", meaningEn: "progressed smoothly" },
    distractors: [
      { word: "途中で止まった", reading: "とちゅうでとまった", meaningEn: "stopped halfway" },
      { word: "完全に消えた", reading: "かんぜんにきえた", meaningEn: "disappeared completely" },
      { word: "急に増えた", reading: "きゅうにふえた", meaningEn: "increased suddenly" },
    ],
    sharedNuanceNote: "Both「捗る（はかどる）」and「順調に進む」mean 'work progresses briskly and smoothly'.",
  },
  {
    id: "syn-n1-tsugunau",
    jlpt: 1,
    sentenceJa: "自分が犯した過ちは自分でつぐなわなければならない。",
    targetSurface: "つぐなわなければ",
    sentenceEn: "You must atone for the mistakes you committed yourself.",
    targetWord: "償う",
    targetReading: "つぐなう",
    targetMeaningEn: "to atone for, to compensate, to make amends",
    correctSynonym: { word: "うめあわせなければ", reading: "うめあわせなければ", meaningEn: "must make amends / compensate for" },
    distractors: [
      { word: "くりかえさなければ", reading: "くりかえさなければ", meaningEn: "must repeat" },
      { word: "みのがさなければ", reading: "みのがさなければ", meaningEn: "must overlook" },
      { word: "ひけらかさなければ", reading: "ひけらかさなければ", meaningEn: "must show off" },
    ],
    sharedNuanceNote: "Both「償う（つぐなう）」and「埋め合わせる」mean 'to make amends / compensate for a fault'.",
  },
{
  "id": "syn-n5-omoshirokunakatta",
  "jlpt": 5,
  "sentenceJa": "その映画はおもしろくなかったです。",
  "targetSurface": "おもしろくなかったです",
  "sentenceEn": "That movie was not interesting.",
  "targetWord": "おもしろくない",
  "targetReading": "おもしろくない",
  "targetMeaningEn": "not interesting, not fun",
  "correctSynonym": {
    "word": "つまらなかったです",
    "reading": "つまらなかったです",
    "meaningEn": "was boring"
  },
  "distractors": [
    {
      "word": "短かったです",
      "reading": "みじかかったです",
      "meaningEn": "was short"
    },
    {
      "word": "長かったです",
      "reading": "ながかったです",
      "meaningEn": "was long"
    },
    {
      "word": "楽しかったです",
      "reading": "たのしかったです",
      "meaningEn": "was fun"
    }
  ],
  "sharedNuanceNote": "Negative of「おもしろい」is equivalent to「つまらない」(boring / uninteresting)."
},
{
  "id": "syn-n5-kurai",
  "jlpt": 5,
  "sentenceJa": "この部屋は暗いです。",
  "targetSurface": "暗いです",
  "sentenceEn": "This room is dark.",
  "targetWord": "暗い",
  "targetReading": "くらい",
  "targetMeaningEn": "dark",
  "correctSynonym": {
    "word": "明るくありません",
    "reading": "あかるくありません",
    "meaningEn": "is not bright"
  },
  "distractors": [
    {
      "word": "広くありません",
      "reading": "ひろくありません",
      "meaningEn": "is not spacious"
    },
    {
      "word": "静かではありません",
      "reading": "しずかではありません",
      "meaningEn": "is not quiet"
    },
    {
      "word": "狭くありません",
      "reading": "せまくありません",
      "meaningEn": "is not narrow"
    }
  ],
  "sharedNuanceNote": "Antonym negative flip:「暗い」(dark) =「明るくありません」(not bright)."
},
{
  "id": "syn-n5-maiban",
  "jlpt": 5,
  "sentenceJa": "まいばん国のかぞくに電話します。",
  "targetSurface": "まいばん",
  "sentenceEn": "Every night I call my family in my home country.",
  "targetWord": "毎晩",
  "targetReading": "まいばん",
  "targetMeaningEn": "every night",
  "correctSynonym": {
    "word": "夜はいつも",
    "reading": "よるはいつも",
    "meaningEn": "always at night"
  },
  "distractors": [
    {
      "word": "朝はいつも",
      "reading": "あさはいつも",
      "meaningEn": "always in the morning"
    },
    {
      "word": "昼はいつも",
      "reading": "ひるはいつも",
      "meaningEn": "always in the afternoon"
    },
    {
      "word": "時々夜に",
      "reading": "ときどきよるに",
      "meaningEn": "sometimes at night"
    }
  ],
  "sharedNuanceNote": "Time expression equivalence:「まいばん」(every night) =「夜はいつも」(always at night)."
},
{
  "id": "syn-n5-ninen-mae",
  "jlpt": 5,
  "sentenceJa": "二年前に京都へ行きました。",
  "targetSurface": "二年前に",
  "sentenceEn": "Two years ago, I went to Kyoto.",
  "targetWord": "二年前に",
  "targetReading": "にねんまえに",
  "targetMeaningEn": "two years ago",
  "correctSynonym": {
    "word": "おととし",
    "reading": "おととし",
    "meaningEn": "the year before last"
  },
  "distractors": [
    {
      "word": "きょねん",
      "reading": "きょねん",
      "meaningEn": "last year"
    },
    {
      "word": "さらいねん",
      "reading": "さらいねん",
      "meaningEn": "the year after next"
    },
    {
      "word": "らいねん",
      "reading": "らいねん",
      "meaningEn": "next year"
    }
  ],
  "sharedNuanceNote": "Calendar conversion:「二年前」(two years ago) =「おととし」(the year before last)."
},
{
  "id": "syn-n5-tanjoubi",
  "jlpt": 5,
  "sentenceJa": "たんじょうびは6月15日です。",
  "targetSurface": "たんじょうびは6月15日です",
  "sentenceEn": "My birthday is June 15th.",
  "targetWord": "誕生日",
  "targetReading": "たんじょうび",
  "targetMeaningEn": "birthday",
  "correctSynonym": {
    "word": "6月15日にうまれました",
    "reading": "ろくがつじゅうごにちにうまれました",
    "meaningEn": "was born on June 15th"
  },
  "distractors": [
    {
      "word": "6月15日にけっこんしました",
      "reading": "ろくがつじゅうごにちにけっこんしました",
      "meaningEn": "got married on June 15th"
    },
    {
      "word": "6月15日に日本へ来ました",
      "reading": "ろくがつじゅうごにちににほんへきました",
      "meaningEn": "came to Japan on June 15th"
    },
    {
      "word": "6月15日に学校をおわりました",
      "reading": "ろくがつじゅうごにちにとがっこうをおわりました",
      "meaningEn": "graduated school on June 15th"
    }
  ],
  "sharedNuanceNote": "Life event equivalence:「たんじょうびはX日です」=「X日にうまれました」(was born on X date)."
},
{
  "id": "syn-n5-yasui",
  "jlpt": 5,
  "sentenceJa": "この靴は安いです。",
  "targetSurface": "安いです",
  "sentenceEn": "These shoes are cheap.",
  "targetWord": "安い",
  "targetReading": "やすい",
  "targetMeaningEn": "cheap, inexpensive",
  "correctSynonym": {
    "word": "高くありません",
    "reading": "たかくありません",
    "meaningEn": "are not expensive"
  },
  "distractors": [
    {
      "word": "古くありません",
      "reading": "ふるくありません",
      "meaningEn": "are not old"
    },
    {
      "word": "重くありません",
      "reading": "おもくありません",
      "meaningEn": "are not heavy"
    },
    {
      "word": "新しくありません",
      "reading": "あたらしくありません",
      "meaningEn": "are not new"
    }
  ],
  "sharedNuanceNote": "Antonym negative flip:「安い」(cheap) =「高くありません」(not expensive)."
},
{
  "id": "syn-n5-hima",
  "jlpt": 5,
  "sentenceJa": "昨日はひまでした。",
  "targetSurface": "ひまでした",
  "sentenceEn": "Yesterday I was free.",
  "targetWord": "暇",
  "targetReading": "ひま",
  "targetMeaningEn": "free, unoccupied",
  "correctSynonym": {
    "word": "いそがしくありませんでした",
    "reading": "いそがしくありませんでした",
    "meaningEn": "was not busy"
  },
  "distractors": [
    {
      "word": "元気がありませんでした",
      "reading": "げんきがありませんでした",
      "meaningEn": "had no energy"
    },
    {
      "word": "楽しくありませんでした",
      "reading": "たのしくありませんでした",
      "meaningEn": "was not enjoyable"
    },
    {
      "word": "静かではありませんでした",
      "reading": "しずかではありませんでした",
      "meaningEn": "was not quiet"
    }
  ],
  "sharedNuanceNote": "State negative flip:「ひまでした」(was free) =「いそがしくありませんでした」(was not busy)."
},
{
  "id": "syn-n5-ototoi",
  "jlpt": 5,
  "sentenceJa": "一昨日は雨が降っていました。",
  "targetSurface": "一昨日は",
  "sentenceEn": "The day before yesterday it was raining.",
  "targetWord": "一昨日",
  "targetReading": "おととい",
  "targetMeaningEn": "day before yesterday",
  "correctSynonym": {
    "word": "二日前に",
    "reading": "ふつかまえに",
    "meaningEn": "two days ago"
  },
  "distractors": [
    {
      "word": "昨日",
      "reading": "きのう",
      "meaningEn": "yesterday"
    },
    {
      "word": "先週",
      "reading": "せんしゅう",
      "meaningEn": "last week"
    },
    {
      "word": "あさって",
      "reading": "あさって",
      "meaningEn": "day after tomorrow"
    }
  ],
  "sharedNuanceNote": "Time expression equivalence:「一昨日 (おととい)」=「二日前」(two days ago)."
},
{
  "id": "syn-n5-asatte",
  "jlpt": 5,
  "sentenceJa": "あさって日本語のテストがあります。",
  "targetSurface": "あさって",
  "sentenceEn": "The day after tomorrow there is a Japanese test.",
  "targetWord": "明後日",
  "targetReading": "あさって",
  "targetMeaningEn": "day after tomorrow",
  "correctSynonym": {
    "word": "二日後に",
    "reading": "ふつかごに",
    "meaningEn": "two days later"
  },
  "distractors": [
    {
      "word": "明日",
      "reading": "あした",
      "meaningEn": "tomorrow"
    },
    {
      "word": "来週",
      "reading": "らいしゅう",
      "meaningEn": "next week"
    },
    {
      "word": "昨日",
      "reading": "きのう",
      "meaningEn": "yesterday"
    }
  ],
  "sharedNuanceNote": "Time expression equivalence:「あさって」(day after tomorrow) =「二日後」(two days later)."
},
{
  "id": "syn-n5-sakki",
  "jlpt": 5,
  "sentenceJa": "さっき山田さんが来ましたよ。",
  "targetSurface": "さっき",
  "sentenceEn": "Mr. Yamada came a short while ago.",
  "targetWord": "さっき",
  "targetReading": "さっき",
  "targetMeaningEn": "a short while ago, just now",
  "correctSynonym": {
    "word": "少し前に",
    "reading": "すこしまえに",
    "meaningEn": "a little while ago"
  },
  "distractors": [
    {
      "word": "今から",
      "reading": "いまから",
      "meaningEn": "from now on"
    },
    {
      "word": "ずっと前に",
      "reading": "ずっとまえに",
      "meaningEn": "a long time ago"
    },
    {
      "word": "あとで",
      "reading": "あとで",
      "meaningEn": "later"
    }
  ],
  "sharedNuanceNote": "Temporal equivalence:「さっき」=「少し前に」(a short while ago)."
},
{
  "id": "syn-n5-kyou-wa-yasumi",
  "jlpt": 5,
  "sentenceJa": "今日は会社が休みです。",
  "targetSurface": "休みです",
  "sentenceEn": "Today work is off.",
  "targetWord": "休み",
  "targetReading": "やすみ",
  "targetMeaningEn": "day off, absence",
  "correctSynonym": {
    "word": "仕事がありません",
    "reading": "しごとがありません",
    "meaningEn": "have no work"
  },
  "distractors": [
    {
      "word": "仕事がたくさんあります",
      "reading": "しごとがたくさんあります",
      "meaningEn": "have a lot of work"
    },
    {
      "word": "仕事が遅くなります",
      "reading": "しごとがおそくなります",
      "meaningEn": "work will be late"
    },
    {
      "word": "仕事が好きです",
      "reading": "しごとがすきです",
      "meaningEn": "like work"
    }
  ],
  "sharedNuanceNote": "Condition equivalence:「会社が休みです」=「仕事がありません」(have no work today)."
},
{
  "id": "syn-n5-fukai",
  "jlpt": 5,
  "sentenceJa": "この川は深いですから、気をつけてください。",
  "targetSurface": "深いです",
  "sentenceEn": "This river is deep, so please be careful.",
  "targetWord": "深い",
  "targetReading": "ふかい",
  "targetMeaningEn": "deep",
  "correctSynonym": {
    "word": "浅くありません",
    "reading": "あさくありません",
    "meaningEn": "is not shallow"
  },
  "distractors": [
    {
      "word": "広くありません",
      "reading": "ひろくありません",
      "meaningEn": "is not wide"
    },
    {
      "word": "狭くありません",
      "reading": "せまくありません",
      "meaningEn": "is not narrow"
    },
    {
      "word": "冷たくありません",
      "reading": "つめたくありません",
      "meaningEn": "is not cold"
    }
  ],
  "sharedNuanceNote": "Antonym negative flip:「深い」(deep) =「浅くありません」(not shallow)."
},
{
  "id": "syn-n5-shinsetsu",
  "jlpt": 5,
  "sentenceJa": "あの先生はとても親切です。",
  "targetSurface": "親切です",
  "sentenceEn": "That teacher is very kind.",
  "targetWord": "親切",
  "targetReading": "しんせつ",
  "targetMeaningEn": "kind, helpful",
  "correctSynonym": {
    "word": "やさしいです",
    "reading": "やさしいです",
    "meaningEn": "is gentle and kind"
  },
  "distractors": [
    {
      "word": "厳しいです",
      "reading": "きびしいです",
      "meaningEn": "is strict"
    },
    {
      "word": "忙しいです",
      "reading": "いそがしいです",
      "meaningEn": "is busy"
    },
    {
      "word": "若いです",
      "reading": "わかいです",
      "meaningEn": "is young"
    }
  ],
  "sharedNuanceNote": "Attribute equivalence:「親切です」(kind) =「やさしいです」(gentle/kind)."
},
{
  "id": "syn-n5-isogu-hashiru",
  "jlpt": 5,
  "sentenceJa": "遅刻しそうだったので、急いで学校へ行きました。",
  "targetSurface": "急いで",
  "sentenceEn": "I was about to be late, so I hurried to school.",
  "targetWord": "急ぐ",
  "targetReading": "いそぐ",
  "targetMeaningEn": "to hurry",
  "correctSynonym": {
    "word": "走って",
    "reading": "はしって",
    "meaningEn": "running"
  },
  "distractors": [
    {
      "word": "歩いて",
      "reading": "あるいて",
      "meaningEn": "walking"
    },
    {
      "word": "休んで",
      "reading": "やすんで",
      "meaningEn": "resting"
    },
    {
      "word": "止まって",
      "reading": "とまって",
      "meaningEn": "stopping"
    }
  ],
  "sharedNuanceNote": "Manner paraphrase:「急いで学校へ行く」in context equates to「走って行く」(go running)."
},
{
  "id": "syn-n5-katazukeru",
  "jlpt": 5,
  "sentenceJa": "日曜日、部屋をきれいに片づけました。",
  "targetSurface": "片づけました",
  "sentenceEn": "On Sunday, I tidied up my room nicely.",
  "targetWord": "片づける",
  "targetReading": "かたづける",
  "targetMeaningEn": "to tidy up, to clean up",
  "correctSynonym": {
    "word": "掃除しました",
    "reading": "そうじしました",
    "meaningEn": "cleaned"
  },
  "distractors": [
    {
      "word": "汚しました",
      "reading": "よごしました",
      "meaningEn": "dirtied"
    },
    {
      "word": "壊しました",
      "reading": "こわしました",
      "meaningEn": "broke"
    },
    {
      "word": "借りました",
      "reading": "かりました",
      "meaningEn": "borrowed"
    }
  ],
  "sharedNuanceNote": "Action equivalence:「部屋を片づける」(tidy up room) =「掃除する」(clean)."
},
{
  "id": "syn-n4-oishii-umai",
  "jlpt": 4,
  "sentenceJa": "母が作ったカレーはとてもうまいです。",
  "targetSurface": "うまいです",
  "sentenceEn": "The curry my mother made is very tasty.",
  "targetWord": "うまい",
  "targetReading": "うまい",
  "targetMeaningEn": "delicious, tasty",
  "correctSynonym": {
    "word": "おいしいです",
    "reading": "おいしいです",
    "meaningEn": "is delicious"
  },
  "distractors": [
    {
      "word": "まずいです",
      "reading": "まずいです",
      "meaningEn": "tastes bad"
    },
    {
      "word": "辛いです",
      "reading": "からいです",
      "meaningEn": "is spicy"
    },
    {
      "word": "苦いです",
      "reading": "にがいです",
      "meaningEn": "is bitter"
    }
  ],
  "sharedNuanceNote": "Food praise equivalence:「うまい」=「おいしい」(delicious)."
},
{
  "id": "syn-n4-otona-kodomo-ja-nai",
  "jlpt": 4,
  "sentenceJa": "弟はもう大人です。",
  "targetSurface": "大人です",
  "sentenceEn": "My younger brother is already an adult.",
  "targetWord": "大人",
  "targetReading": "おとな",
  "targetMeaningEn": "adult",
  "correctSynonym": {
    "word": "子どもではありません",
    "reading": "こどもではありません",
    "meaningEn": "is not a child"
  },
  "distractors": [
    {
      "word": "学生ではありません",
      "reading": "がくせいではありません",
      "meaningEn": "is not a student"
    },
    {
      "word": "元気ではありません",
      "reading": "げんきではありません",
      "meaningEn": "is not energetic"
    },
    {
      "word": "先生ではありません",
      "reading": "せんせいではありません",
      "meaningEn": "is not a teacher"
    }
  ],
  "sharedNuanceNote": "Age negative flip:「大人です」(is an adult) =「子どもではありません」(is not a child)."
},
{
  "id": "syn-n4-kega-shita",
  "jlpt": 4,
  "sentenceJa": "サッカーをしていて、足にけがをしました。",
  "targetSurface": "けがをしました",
  "sentenceEn": "While playing soccer, I injured my leg.",
  "targetWord": "けが",
  "targetReading": "けが",
  "targetMeaningEn": "injury, hurt",
  "correctSynonym": {
    "word": "痛めました",
    "reading": "いためました",
    "meaningEn": "hurt / injured"
  },
  "distractors": [
    {
      "word": "洗いました",
      "reading": "あらいました",
      "meaningEn": "washed"
    },
    {
      "word": "冷やしました",
      "reading": "ひやしました",
      "meaningEn": "chilled"
    },
    {
      "word": "温めました",
      "reading": "あたためました",
      "meaningEn": "warmed"
    }
  ],
  "sharedNuanceNote": "Injury expression:「けがをする」(get injured) =「痛める」(hurt/injure)."
},
{
  "id": "syn-n4-shoujiki",
  "jlpt": 4,
  "sentenceJa": "彼はうそをつかない人です。",
  "targetSurface": "うそをつかない人です",
  "sentenceEn": "He is a person who does not tell lies.",
  "targetWord": "正直",
  "targetReading": "しょうじき",
  "targetMeaningEn": "honest",
  "correctSynonym": {
    "word": "正直な人です",
    "reading": "しょうじきなひとです",
    "meaningEn": "is an honest person"
  },
  "distractors": [
    {
      "word": "親切な人です",
      "reading": "しんせつなひとです",
      "meaningEn": "is a kind person"
    },
    {
      "word": "静かな人です",
      "reading": "しずかなひとです",
      "meaningEn": "is a quiet person"
    },
    {
      "word": "厳しい人です",
      "reading": "きびしいひとです",
      "meaningEn": "is a strict person"
    }
  ],
  "sharedNuanceNote": "Character description:「うそをつかない」(does not lie) =「正直な人」(honest person)."
},
{
  "id": "syn-n4-shitsurei",
  "jlpt": 4,
  "sentenceJa": "先輩に対して失礼なことを言ってしまいました。",
  "targetSurface": "失礼な",
  "sentenceEn": "I accidentally said something rude to my senior.",
  "targetWord": "失礼",
  "targetReading": "しつれい",
  "targetMeaningEn": "rude, impolite",
  "correctSynonym": {
    "word": "礼儀のない",
    "reading": "れいぎのない",
    "meaningEn": "without manners, impolite"
  },
  "distractors": [
    {
      "word": "親切な",
      "reading": "しんせつな",
      "meaningEn": "kind"
    },
    {
      "word": "丁寧な",
      "reading": "ていねいな",
      "meaningEn": "polite"
    },
    {
      "word": "面白い",
      "reading": "おもしろい",
      "meaningEn": "interesting"
    }
  ],
  "sharedNuanceNote": "Negative etiquette:「失礼な」(rude) =「礼儀のない」(mannerless)."
},
{
  "id": "syn-n4-totsuzen",
  "jlpt": 4,
  "sentenceJa": "雨がとつぜん降り出しました。",
  "targetSurface": "とつぜん",
  "sentenceEn": "Rain suddenly started falling.",
  "targetWord": "突然",
  "targetReading": "とつぜん",
  "targetMeaningEn": "suddenly",
  "correctSynonym": {
    "word": "急に",
    "reading": "きゅうに",
    "meaningEn": "suddenly"
  },
  "distractors": [
    {
      "word": "ゆっくり",
      "reading": "ゆっくり",
      "meaningEn": "slowly"
    },
    {
      "word": "だんだん",
      "reading": "だんだん",
      "meaningEn": "gradually"
    },
    {
      "word": "静かに",
      "reading": "しずかに",
      "meaningEn": "quietly"
    }
  ],
  "sharedNuanceNote": "Adverbial equivalence:「とつぜん」(suddenly) =「急に」(abruptly/suddenly)."
},
{
  "id": "syn-n4-shousai",
  "jlpt": 4,
  "sentenceJa": "旅行の予定をくわしく教えてください。",
  "targetSurface": "くわしく",
  "sentenceEn": "Please tell me the travel plans in detail.",
  "targetWord": "詳しい",
  "targetReading": "くわしい",
  "targetMeaningEn": "detailed",
  "correctSynonym": {
    "word": "細かく",
    "reading": "こまかく",
    "meaningEn": "finely / in detail"
  },
  "distractors": [
    {
      "word": "簡単に",
      "reading": "かんたんに",
      "meaningEn": "simply"
    },
    {
      "word": "短く",
      "reading": "みじかく",
      "meaningEn": "shortly"
    },
    {
      "word": "大まかに",
      "reading": "おおまかに",
      "meaningEn": "roughly"
    }
  ],
  "sharedNuanceNote": "Degree of detail:「くわしく」(in detail) =「細かく」(specifically / in detail)."
},
{
  "id": "syn-n4-tabun",
  "jlpt": 4,
  "sentenceJa": "明日はたぶん雨が降るでしょう。",
  "targetSurface": "たぶん",
  "sentenceEn": "Tomorrow it will probably rain.",
  "targetWord": "多分",
  "targetReading": "たぶん",
  "targetMeaningEn": "probably, perhaps",
  "correctSynonym": {
    "word": "おそらく",
    "reading": "おそらく",
    "meaningEn": "perhaps, probably"
  },
  "distractors": [
    {
      "word": "きっと",
      "reading": "きっと",
      "meaningEn": "surely"
    },
    {
      "word": "かならず",
      "reading": "かならず",
      "meaningEn": "without fail"
    },
    {
      "word": "ぜったいに",
      "reading": "ぜったいに",
      "meaningEn": "definitely"
    }
  ],
  "sharedNuanceNote": "Probability conjecture:「たぶん」=「おそらく」(probably / likely)."
},
{
  "id": "syn-n4-shibaraku",
  "jlpt": 4,
  "sentenceJa": "ここでしばらくお待ちください。",
  "targetSurface": "しばらく",
  "sentenceEn": "Please wait here for a little while.",
  "targetWord": "暫く",
  "targetReading": "しばらく",
  "targetMeaningEn": "for a while, a moment",
  "correctSynonym": {
    "word": "少しの間",
    "reading": "すこしのあいだ",
    "meaningEn": "for a short period"
  },
  "distractors": [
    {
      "word": "一日中",
      "reading": "いちにちじゅう",
      "meaningEn": "all day long"
    },
    {
      "word": "長い時間",
      "reading": "ながいじかん",
      "meaningEn": "for a long time"
    },
    {
      "word": "今すぐ",
      "reading": "いますぐ",
      "meaningEn": "right now"
    }
  ],
  "sharedNuanceNote": "Duration expression:「しばらく」=「少しの間」(for a short while)."
},
{
  "id": "syn-n4-konna-ni",
  "jlpt": 4,
  "sentenceJa": "こんなにたくさんの人がいるとは思いませんでした。",
  "targetSurface": "こんなに",
  "sentenceEn": "I did not think there would be this many people.",
  "targetWord": "こんなに",
  "targetReading": "こんなに",
  "targetMeaningEn": "this much, so",
  "correctSynonym": {
    "word": "これほど",
    "reading": "これほど",
    "meaningEn": "to this extent"
  },
  "distractors": [
    {
      "word": "あんなに",
      "reading": "あんなに",
      "meaningEn": "that much"
    },
    {
      "word": "少しだけ",
      "reading": "すこしだけ",
      "meaningEn": "only a little"
    },
    {
      "word": "たまに",
      "reading": "たまに",
      "meaningEn": "occasionally"
    }
  ],
  "sharedNuanceNote": "Degree expression:「こんなに」(this much) =「これほど」(to this degree)."
},
];

// ============================================================================
// LAYER B: Automated Synonym Cluster Mining from public/data/v1/vocabulary/
// ============================================================================

const STOP_GLOSS_TOKENS = new Set([
  "be",
  "do",
  "go",
  "get",
  "make",
  "take",
  "have",
  "come",
  "put",
  "set",
  "see",
  "say",
  "use",
  "thing",
  "person",
  "place",
  "time",
  "way",
  "one",
  "two",
  "good",
  "bad",
  "up",
  "out",
  "on",
  "in",
]);

function normalizeGloss(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/^to\s+/, "")
    .replace(/^(a|an|the)\s+/, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNormalizedSet(entry: RawVocabEntry): Set<string> {
  const result = new Set<string>();
  for (const m of entry.meanings || []) {
    for (const part of m.split(/[;,/]/)) {
      const norm = normalizeGloss(part);
      if (norm && norm.length >= 3 && !STOP_GLOSS_TOKENS.has(norm)) {
        result.add(norm);
      }
    }
  }
  if (entry.modernMeaning) {
    for (const part of entry.modernMeaning.split(/[;,/]/)) {
      const norm = normalizeGloss(part);
      if (norm && norm.length >= 3 && !STOP_GLOSS_TOKENS.has(norm)) {
        result.add(norm);
      }
    }
  }
  for (const s of entry.synonyms || []) {
    const norm = normalizeGloss(s);
    if (norm && norm.length >= 3 && !STOP_GLOSS_TOKENS.has(norm)) {
      result.add(norm);
    }
  }
  return result;
}

function getPrimaryNormalizedSet(entry: RawVocabEntry): Set<string> {
  const result = new Set<string>();
  for (const m of entry.meanings || []) {
    for (const part of m.split(/[;,/]/)) {
      const norm = normalizeGloss(part);
      if (norm && norm.length >= 3 && !STOP_GLOSS_TOKENS.has(norm)) {
        result.add(norm);
      }
    }
  }
  return result;
}

type PosCategory = "adv" | "noun-vs" | "noun" | "adj-i" | "adj-na" | "verb" | "other";

function classifyPos(posList: string[]): PosCategory {
  const joined = posList.join(",");
  if (posList.includes("adv") || posList.includes("adv-to")) return "adv";
  if (posList.includes("adj-i") || posList.includes("adj-ix")) return "adj-i";
  if (posList.includes("adj-na")) return "adj-na";
  if (posList.includes("vs") && posList.includes("n")) return "noun-vs";
  if (/\bv[15]/.test(joined) || posList.includes("vk") || posList.includes("vz")) return "verb";
  if (posList.includes("n")) return "noun";
  return "other";
}

function hasKanji(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

function buildTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.resolve(process.cwd(), "node_modules/kuromoji/dict") })
      .build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });
}

function annotateWithFurigana(
  text: string,
  tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>,
): string {
  if (!text) return "";
  const tokens = tokenizer.tokenize(text);
  return tokens
    .map((t) => {
      const surface = t.surface_form;
      if (!hasKanji(surface) || !t.reading || t.reading === "*") {
        return surface;
      }
      const hira = katakanaToHiragana(t.reading);
      if (hira === surface) return surface;
      return `{${surface}|${hira}}`;
    })
    .join("");
}

function formatWordFurigana(word: string, reading: string): string {
  if (!hasKanji(word) || !reading || word === reading) return word;
  return `{${word}|${reading}}`;
}

function levelStrToNum(level: string): 5 | 4 | 3 | 2 | 1 {
  switch (level) {
    case "N5":
      return 5;
    case "N4":
      return 4;
    case "N3":
      return 3;
    case "N2":
      return 2;
    case "N1":
      return 1;
    default:
      return 5;
  }
}

async function main() {
  console.log("Building JLPT Game 4: Synonym Paraphrase Match dataset...");
  const tokenizer = await buildTokenizer();

  const levels: Array<"N5" | "N4" | "N3" | "N2" | "N1"> = ["N5", "N4", "N3", "N2", "N1"];
  const vocabByLevel = new Map<5 | 4 | 3 | 2 | 1, RawVocabEntry[]>();

  for (const lvl of levels) {
    const filePath = path.resolve(process.cwd(), `public/data/v1/vocabulary/${lvl}.json`);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as RawVocabEntry[];
    vocabByLevel.set(levelStrToNum(lvl), raw);
  }

  const finalItems: SynonymMatchItem[] = [];
  const usedIds = new Set<string>();
  const usedTargetPerLevel = new Map<number, Set<string>>([
    [5, new Set()],
    [4, new Set()],
    [3, new Set()],
    [2, new Set()],
    [1, new Set()],
  ]);

  // 1. Add Curated Official Archetypes first
  for (const seed of CURATED_SEEDS) {
    const idx = seed.sentenceJa.indexOf(seed.targetSurface);
    if (idx === -1) {
      throw new Error(`Target surface "${seed.targetSurface}" not found in "${seed.sentenceJa}"`);
    }
    const prefix = seed.sentenceJa.slice(0, idx);
    const suffix = seed.sentenceJa.slice(idx + seed.targetSurface.length);

    const prefixFurigana = annotateWithFurigana(prefix, tokenizer);
    const targetFurigana = annotateWithFurigana(seed.targetSurface, tokenizer);
    const suffixFurigana = annotateWithFurigana(suffix, tokenizer);

    const item: SynonymMatchItem = {
      id: seed.id,
      jlpt: seed.jlpt,
      sentenceJa: seed.sentenceJa,
      prefix,
      targetSurface: seed.targetSurface,
      suffix,
      sentenceEn: seed.sentenceEn,
      targetWord: seed.targetWord,
      targetReading: seed.targetReading,
      targetMeaningEn: seed.targetMeaningEn,
      correctSynonym: {
        ...seed.correctSynonym,
        furigana: formatWordFurigana(seed.correctSynonym.word, seed.correctSynonym.reading),
      },
      distractors: seed.distractors.map((d) => ({
        ...d,
        furigana: formatWordFurigana(d.word, d.reading),
      })) as [SynonymCandidate, SynonymCandidate, SynonymCandidate],
      sharedNuanceNote:
        seed.sharedNuanceNote ??
        `Both「${seed.targetWord}」and「${seed.correctSynonym.word}」share the meaning '${seed.targetMeaningEn}'.`,
      prefixFurigana,
      targetFurigana,
      suffixFurigana,
      sentenceFurigana: `${prefixFurigana}${targetFurigana}${suffixFurigana}`,
    };

    finalItems.push(item);
    usedIds.add(item.id);
    usedTargetPerLevel.get(seed.jlpt)?.add(seed.targetWord);
    usedTargetPerLevel.get(seed.jlpt)?.add(seed.targetSurface);
  }

  // 2. Mine Additional Authentic Synonym Pairs per JLPT Level
  const TARGET_PER_LEVEL = 45;
  const substitutableCategories = new Set<PosCategory>([
    "adv",
    "noun-vs",
    "noun",
    "adj-na",
    "adj-i",
  ]);

  for (const jlpt of [5, 4, 3, 2, 1] as const) {
    const levelPool = vocabByLevel.get(jlpt) || [];
    const adjacentPool = [
      ...levelPool,
      ...(vocabByLevel.get((jlpt === 5 ? 4 : jlpt + 1) as 5 | 4 | 3 | 2 | 1) || []),
    ];

    const usedTargets = usedTargetPerLevel.get(jlpt)!;

    // Precompute normalized sets and POS categories
    const enrichedLevel = levelPool
      .map((entry) => ({
        entry,
        posCat: classifyPos(entry.pos || []),
        primarySet: getPrimaryNormalizedSet(entry),
        allSet: getNormalizedSet(entry),
        hasKanji: hasKanji(entry.word),
      }))
      .filter(
        (x) =>
          x.entry.word.length >= 2 &&
          x.primarySet.size > 0 &&
          substitutableCategories.has(x.posCat),
      );

    const enrichedAdjacent = adjacentPool
      .map((entry) => ({
        entry,
        posCat: classifyPos(entry.pos || []),
        primarySet: getPrimaryNormalizedSet(entry),
        allSet: getNormalizedSet(entry),
        hasKanji: hasKanji(entry.word),
      }))
      .filter(
        (x) =>
          x.entry.word.length >= 2 &&
          x.primarySet.size > 0 &&
          substitutableCategories.has(x.posCat),
      );

    for (const candidateA of enrichedLevel) {
      const currentLevelCount = finalItems.filter((i) => i.jlpt === jlpt).length;
      if (currentLevelCount >= TARGET_PER_LEVEL) break;

      const wordA = candidateA.entry;
      if (usedTargets.has(wordA.word)) continue;

      // Require a clean example sentence containing wordA.word literally
      const validExample = (wordA.examples || []).find(
        (ex) =>
          ex.ja &&
          ex.en &&
          ex.ja.includes(wordA.word) &&
          ex.ja.length >= 8 &&
          ex.ja.length <= 65,
      );
      if (!validExample) continue;

      // Find best synonym partner B in same or adjacent level
      let bestB: (typeof enrichedAdjacent)[number] | null = null;
      let sharedMeanings: string[] = [];

      for (const candidateB of enrichedAdjacent) {
        const wordB = candidateB.entry;
        if (wordB.word === wordA.word || wordB.reading === wordA.reading) continue;
        if (candidateB.posCat !== candidateA.posCat) continue;
        // Avoid substring containment like 国際 vs 国際的 unless distinct roots
        if (
          wordA.word.includes(wordB.word) ||
          wordB.word.includes(wordA.word)
        ) {
          continue;
        }

        // Check exact primary meaning overlap or >= 2 total synonym overlaps
        const primaryOverlap = [...candidateA.primarySet].filter((m) =>
          candidateB.primarySet.has(m),
        );
        const totalOverlap = [...candidateA.allSet].filter((m) =>
          candidateB.allSet.has(m),
        );

        if (primaryOverlap.length >= 1 || totalOverlap.length >= 2) {
          bestB = candidateB;
          sharedMeanings = primaryOverlap.length > 0 ? primaryOverlap : totalOverlap;
          break;
        }
      }

      if (!bestB) continue;

      // Pick 3 distractors from the same JLPT level and same POS category with zero meaning overlap
      const forbiddenWords = new Set<string>([wordA.word, bestB.entry.word]);
      const forbiddenReadings = new Set<string>([wordA.reading, bestB.entry.reading]);
      const forbiddenMeanings = new Set<string>([
        ...candidateA.allSet,
        ...bestB.allSet,
      ]);

      const distractorPool = enrichedLevel.filter((d) => {
        if (d.posCat !== candidateA.posCat) return false;
        if (forbiddenWords.has(d.entry.word) || forbiddenReadings.has(d.entry.reading)) {
          return false;
        }
        // Check zero overlap in meanings/synonyms
        for (const m of d.allSet) {
          if (forbiddenMeanings.has(m)) return false;
        }
        return true;
      });

      // Prefer distractors matching kanji/kana style of bestB
      const sameScriptDistractors = distractorPool.filter(
        (d) => d.hasKanji === bestB!.hasKanji && Math.abs(d.entry.word.length - bestB!.entry.word.length) <= 2,
      );
      const chosenPool =
        sameScriptDistractors.length >= 3 ? sameScriptDistractors : distractorPool;

      if (chosenPool.length < 3) continue;

      const pickedDistractors: SynonymCandidate[] = [];
      for (const d of chosenPool) {
        if (pickedDistractors.length >= 3) break;
        if (
          forbiddenWords.has(d.entry.word) ||
          forbiddenReadings.has(d.entry.reading)
        ) {
          continue;
        }
        forbiddenWords.add(d.entry.word);
        forbiddenReadings.add(d.entry.reading);
        const meaningEn = d.entry.meanings.slice(0, 2).join(", ");
        pickedDistractors.push({
          word: d.entry.word,
          reading: d.entry.reading,
          meaningEn,
          furigana: formatWordFurigana(d.entry.word, d.entry.reading),
        });
      }

      if (pickedDistractors.length < 3) continue;

      const idx = validExample.ja.indexOf(wordA.word);
      const prefix = validExample.ja.slice(0, idx);
      const suffix = validExample.ja.slice(idx + wordA.word.length);

      const prefixFurigana = annotateWithFurigana(prefix, tokenizer);
      const targetFurigana = formatWordFurigana(wordA.word, wordA.reading);
      const suffixFurigana = annotateWithFurigana(suffix, tokenizer);

      const targetMeaningEn = wordA.meanings.slice(0, 2).join(", ");
      const synMeaningEn = bestB.entry.meanings.slice(0, 2).join(", ");
      const sharedLabel = sharedMeanings.slice(0, 2).join(" / ");

      const itemId = `syn-n${jlpt}-${wordA.id}`;
      if (usedIds.has(itemId)) continue;

      finalItems.push({
        id: itemId,
        jlpt,
        sentenceJa: validExample.ja,
        prefix,
        targetSurface: wordA.word,
        suffix,
        sentenceEn: validExample.en,
        targetWord: wordA.word,
        targetReading: wordA.reading,
        targetMeaningEn,
        correctSynonym: {
          word: bestB.entry.word,
          reading: bestB.entry.reading,
          meaningEn: synMeaningEn,
          furigana: formatWordFurigana(bestB.entry.word, bestB.entry.reading),
        },
        distractors: pickedDistractors as [
          SynonymCandidate,
          SynonymCandidate,
          SynonymCandidate,
        ],
        sharedNuanceNote: `Both「${wordA.word} (${wordA.reading})」and「${bestB.entry.word} (${bestB.entry.reading})」mean '${sharedLabel || targetMeaningEn}'.`,
        prefixFurigana,
        targetFurigana,
        suffixFurigana,
        sentenceFurigana: `${prefixFurigana}${targetFurigana}${suffixFurigana}`,
      });

      usedIds.add(itemId);
      usedTargets.add(wordA.word);
      usedTargets.add(bestB.entry.word);
    }
  }

  // Validate integrity across all generated items
  for (const item of finalItems) {
    if (item.prefix + item.targetSurface + item.suffix !== item.sentenceJa) {
      throw new Error(`Sentence reconstruction failed for ${item.id}`);
    }
    if (item.targetWord === item.correctSynonym.word) {
      throw new Error(`Target word and synonym are identical in ${item.id}`);
    }
    const allOptions = [item.correctSynonym, ...item.distractors];
    const words = new Set(allOptions.map((o) => o.word));
    const readings = new Set(allOptions.map((o) => o.reading));
    if (words.size !== 4) {
      throw new Error(`Duplicate option words in ${item.id}: ${[...words].join(", ")}`);
    }
    if (readings.size !== 4) {
      throw new Error(`Duplicate option readings in ${item.id}: ${[...readings].join(", ")}`);
    }
  }

  const counts = {
    N5: finalItems.filter((i) => i.jlpt === 5).length,
    N4: finalItems.filter((i) => i.jlpt === 4).length,
    N3: finalItems.filter((i) => i.jlpt === 3).length,
    N2: finalItems.filter((i) => i.jlpt === 2).length,
    N1: finalItems.filter((i) => i.jlpt === 1).length,
  };
  console.log("Generated Synonym Match items:", finalItems.length, counts);

  // Write JSON output
  const jsonDir = path.resolve(process.cwd(), "public/data/v1/jlpt");
  fs.mkdirSync(jsonDir, { recursive: true });
  const jsonPath = path.join(jsonDir, "synonym-match.json");
  fs.writeFileSync(jsonPath, JSON.stringify(finalItems, null, 2) + "\n", "utf8");

  // Write typed TypeScript module
  const tsDir = path.resolve(process.cwd(), "src/data/jlpt");
  fs.mkdirSync(tsDir, { recursive: true });
  const tsPath = path.join(tsDir, "synonymMatchData.ts");

  const tsContent = `// Auto-generated by scripts/build-synonym-match-data.ts
// Contains ${finalItems.length} JLPT N5-N1 Synonym Paraphrase Match (言い換え類義 — Mondai 5) items.

export interface SynonymCandidate {
  word: string;
  reading: string;
  meaningEn: string;
  furigana?: string;
}

export interface SynonymMatchItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  sentenceJa: string;
  prefix: string;
  targetSurface: string;
  suffix: string;
  sentenceEn: string;
  targetWord: string;
  targetReading: string;
  targetMeaningEn: string;
  correctSynonym: SynonymCandidate;
  distractors: [SynonymCandidate, SynonymCandidate, SynonymCandidate];
  sharedNuanceNote: string;
  prefixFurigana?: string;
  targetFurigana?: string;
  suffixFurigana?: string;
  sentenceFurigana?: string;
}

export const SYNONYM_MATCH_ITEMS: readonly SynonymMatchItem[] = ${JSON.stringify(finalItems, null, 2)};
`;

  fs.writeFileSync(tsPath, tsContent, "utf8");
  console.log(`Wrote ${jsonPath} and ${tsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
