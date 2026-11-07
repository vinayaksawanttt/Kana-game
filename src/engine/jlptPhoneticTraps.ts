import {
  DEFAULT_KANJI_META_MAP,
  PHONETIC_TRAP_ITEMS,
  PHONETIC_TRAP_LEVELS,
  type CompactKanjiMeta,
  type PhoneticTrapLevel,
  type PhoneticTrapVocabItem,
} from "@/data/jlpt/phoneticTrapData";

export {
  DEFAULT_KANJI_META_MAP,
  PHONETIC_TRAP_ITEMS,
  PHONETIC_TRAP_LEVELS,
  type CompactKanjiMeta,
  type PhoneticTrapLevel,
  type PhoneticTrapVocabItem,
};

export type PhoneticTrapSubMode = "reading" | "orthography" | "mixed";
export type PhoneticTrapQuestionMode = "reading" | "orthography";
export type PhoneticTrapSessionSize = 10 | 20 | 30;
export type JlptLevelInput = PhoneticTrapLevel | 5 | 4 | 3 | 2 | 1;

export type TrapRuleLabel =
  | "Long Vowel Trap"
  | "Dakuten / Rendaku Trap"
  | "Small っ / Yōon Trap"
  | "Nasal ん / Mora Trap"
  | "Look-Alike Kanji Trap";

export interface PhoneticReadingTrapCandidate {
  trap: string;
  rule: TrapRuleLabel;
  detail: string;
}

export interface OrthographyTrapCandidate {
  trap: string;
  rule: TrapRuleLabel;
  reason: string;
}

export interface PhoneticTrapOption {
  index: 0 | 1 | 2 | 3;
  optionNumber: 1 | 2 | 3 | 4;
  text: string;
  furiganaText: string;
  isCorrect: boolean;
  trapRule?: TrapRuleLabel;
  trapExplanation?: string;
}

export interface PhoneticTrapQuestion {
  id: string;
  itemId: string;
  mode: PhoneticTrapQuestionMode;
  level: PhoneticTrapLevel;
  jlpt: 5 | 4 | 3 | 2 | 1;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  prefix: string;
  prefixFurigana: string;
  /** Surface highlighted inside 【...】 in the sentence stage (Kanji in Mondai 1, Hiragana in Mondai 2). */
  promptTarget: string;
  promptTargetFurigana: string;
  suffix: string;
  suffixFurigana: string;
  sentenceJa: string;
  sentenceFurigana: string;
  sentenceEn: string;
  correctOptionIndex: 0 | 1 | 2 | 3;
  correctText: string;
  options: [
    PhoneticTrapOption,
    PhoneticTrapOption,
    PhoneticTrapOption,
    PhoneticTrapOption,
  ];
}

export interface PhoneticTrapSettings {
  subMode: PhoneticTrapSubMode;
  levels: JlptLevelInput[];
  size: PhoneticTrapSessionSize;
  showEnglishHint: boolean;
  showFurigana?: boolean;
  questionIds?: string[];
}

export interface PhoneticTrapAnswerRecord {
  questionId: string;
  itemId: string;
  mode: PhoneticTrapQuestionMode;
  chosenOptionIndex: number | null;
  chosenText: string | null;
  correctText: string;
  status: "correct" | "wrong" | "skipped";
  trapRuleTriggered: TrapRuleLabel | null;
  trapExplanation: string | null;
  timeMs: number;
}

export interface PhoneticTrapSession {
  sessionId: string;
  settings: {
    subMode: PhoneticTrapSubMode;
    levels: PhoneticTrapLevel[];
    size: PhoneticTrapSessionSize;
    showEnglishHint: boolean;
    showFurigana?: boolean;
    questionIds?: string[];
  };
  questions: PhoneticTrapQuestion[];
  currentIndex: number;
  revealed: boolean;
  lastAnswer: PhoneticTrapAnswerRecord | null;
  answers: PhoneticTrapAnswerRecord[];
  status: "playing" | "finished";
  startedAt: number;
  finishedAt?: number;
}

export interface PhoneticTrapResultSummary {
  sessionId: string;
  settings: PhoneticTrapSession["settings"];
  total: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracyPercent: number;
  totalTimeMs: number;
  averageTimeMs: number;
  vulnerabilityCounts: Record<TrapRuleLabel, number>;
  questions: PhoneticTrapQuestion[];
  answers: PhoneticTrapAnswerRecord[];
  missedItemIds: string[];
  completedAt: number;
}

export type PhoneticTrapAction =
  | { type: "ANSWER"; optionIndex: number; timeMs: number }
  | { type: "SKIP"; timeMs?: number }
  | { type: "NEXT"; forIndex?: number }
  | { type: "END"; finishedAt?: number };

export const DEFAULT_PHONETIC_TRAP_SETTINGS: PhoneticTrapSettings = {
  subMode: "reading",
  levels: ["N5"],
  size: 10,
  showEnglishHint: true,
};

const O_ROW_KANA = new Set([
  "お",
  "こ",
  "ご",
  "そ",
  "ぞ",
  "と",
  "ど",
  "の",
  "ほ",
  "ぼ",
  "ぽ",
  "も",
  "よ",
  "ろ",
  "ょ",
]);

const E_OR_I_ROW_KANA = new Set([
  "え",
  "け",
  "げ",
  "せ",
  "ぜ",
  "て",
  "で",
  "ね",
  "へ",
  "べ",
  "ぺ",
  "め",
  "れ",
  "き",
  "ぎ",
  "し",
  "じ",
  "ち",
  "ぢ",
  "に",
  "ひ",
  "び",
  "ぴ",
  "み",
  "り",
]);

const DAKUTEN_SWAP_MAP: Readonly<Record<string, readonly string[]>> = {
  か: ["が"],
  が: ["か"],
  き: ["ぎ"],
  ぎ: ["き"],
  く: ["ぐ"],
  ぐ: ["く"],
  け: ["げ"],
  げ: ["け"],
  こ: ["ご"],
  ご: ["こ"],
  さ: ["ざ"],
  ざ: ["さ"],
  し: ["じ"],
  じ: ["し", "ぢ"],
  す: ["ず"],
  ず: ["す", "づ"],
  せ: ["ぜ"],
  ぜ: ["せ"],
  そ: ["ぞ"],
  ぞ: ["そ"],
  た: ["だ"],
  だ: ["た"],
  ち: ["ぢ", "じ"],
  ぢ: ["ち", "じ"],
  つ: ["づ", "ず"],
  づ: ["つ", "ず"],
  て: ["で"],
  で: ["て"],
  と: ["ど"],
  ど: ["と"],
  は: ["ば", "ぱ"],
  ば: ["は", "ぱ"],
  ぱ: ["ば", "は"],
  ひ: ["び", "ぴ"],
  び: ["ひ", "ぴ"],
  ぴ: ["び", "ひ"],
  ふ: ["ぶ", "ぷ"],
  ぶ: ["ふ", "ぷ"],
  ぷ: ["ぶ", "ふ"],
  へ: ["べ", "ぺ"],
  べ: ["へ", "ぺ"],
  ぺ: ["べ", "へ"],
  ほ: ["ぼ", "ぽ"],
  ぼ: ["ほ", "ぽ"],
  ぽ: ["ぼ", "ほ"],
};

const SOKUON_FOLLOWERS = new Set([
  "か",
  "き",
  "く",
  "け",
  "こ",
  "さ",
  "し",
  "す",
  "せ",
  "そ",
  "た",
  "ち",
  "つ",
  "て",
  "と",
  "ぱ",
  "ぴ",
  "ぷ",
  "ぺ",
  "ぽ",
]);

const INVALID_START_KANA = new Set([
  "っ",
  "ん",
  "ゃ",
  "ゅ",
  "ょ",
  "ぁ",
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
  "ー",
]);

const YOON_BASE_KANA = new Set([
  "き",
  "ぎ",
  "し",
  "じ",
  "ち",
  "ぢ",
  "に",
  "ひ",
  "び",
  "ぴ",
  "み",
  "り",
]);

/**
 * Validates that a candidate Hiragana trap string is well-formed Japanese kana.
 */
export function isValidHiraganaTrap(candidate: string, correctReading: string): boolean {
  if (!candidate || candidate === correctReading) return false;
  if (candidate.length < 2) return false;
  if (!/^[\u3041-\u3096]+$/.test(candidate)) return false;
  if (INVALID_START_KANA.has(candidate[0])) return false;
  if (candidate.endsWith("っ")) return false;
  if (
    candidate.includes("っっ") ||
    candidate.includes("んん") ||
    candidate.includes("っん") ||
    candidate.includes("んっ")
  ) {
    return false;
  }
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (ch === "ゃ" || ch === "ゅ" || ch === "ょ") {
      if (i === 0 || !YOON_BASE_KANA.has(candidate[i - 1])) {
        return false;
      }
    }
  }
  return true;
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * A. Algorithmic Phonetic Trap Generator (Mondai 1: Kanji Reading -> Hiragana)
 * Generates 3 distinct, valid Hiragana phonetic traps prioritized by official JLPT Mondai 1 rules.
 */
export function generatePhoneticReadingTraps(
  correctReading: string,
  rng: () => number = Math.random,
): PhoneticReadingTrapCandidate[] {
  const clean = correctReading.trim();
  const seen = new Set<string>([clean]);

  const rule1Candidates: PhoneticReadingTrapCandidate[] = [];
  const rule2Candidates: PhoneticReadingTrapCandidate[] = [];
  const rule3Candidates: PhoneticReadingTrapCandidate[] = [];
  const rule4Candidates: PhoneticReadingTrapCandidate[] = [];

  const pushCandidate = (
    bucket: PhoneticReadingTrapCandidate[],
    trap: string,
    rule: TrapRuleLabel,
    detail: string,
  ) => {
    if (seen.has(trap)) return;
    if (!isValidHiraganaTrap(trap, clean)) return;
    seen.add(trap);
    bucket.push({ trap, rule, detail });
  };

  // --- Rule 1: Long-Vowel (長音) Flip ---
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    // If current char is in O-row (including ょ)
    if (O_ROW_KANA.has(ch)) {
      if (next === "う") {
        // Drop う: e.g. りょこう -> りょこ, こうこう -> ここう
        const dropped = clean.slice(0, i + 1) + clean.slice(i + 2);
        pushCandidate(
          rule1Candidates,
          dropped,
          "Long Vowel Trap",
          "Long vowel dropped (-う)",
        );
        // Swap おう <-> おお
        const swappedOo = clean.slice(0, i + 1) + "お" + clean.slice(i + 2);
        pushCandidate(
          rule1Candidates,
          swappedOo,
          "Long Vowel Trap",
          "おう vs おお spelling trap",
        );
      } else if (next === "お") {
        const swappedOu = clean.slice(0, i + 1) + "う" + clean.slice(i + 2);
        pushCandidate(
          rule1Candidates,
          swappedOu,
          "Long Vowel Trap",
          "おお vs おう spelling trap",
        );
      } else {
        // Insert う after O-row kana: e.g. りょこう -> りょうこう
        const inserted = clean.slice(0, i + 1) + "う" + clean.slice(i + 1);
        pushCandidate(
          rule1Candidates,
          inserted,
          "Long Vowel Trap",
          "Extra long vowel (+う)",
        );
      }
    }

    // If current char is followed by い (e.g. せんせい -> せんせ, かいぎ -> かぎ)
    if (next === "い") {
      const dropped = clean.slice(0, i + 1) + clean.slice(i + 2);
      pushCandidate(
        rule1Candidates,
        dropped,
        "Long Vowel Trap",
        "Vowel dropped (-い)",
      );
    } else if (
      E_OR_I_ROW_KANA.has(ch) &&
      next !== "ゃ" &&
      next !== "ゅ" &&
      next !== "ょ"
    ) {
      // Insert い after E/I-row kana: e.g. かいぎ -> かいぎい
      const inserted = clean.slice(0, i + 1) + "い" + clean.slice(i + 1);
      pushCandidate(
        rule1Candidates,
        inserted,
        "Long Vowel Trap",
        "Extra vowel lengthening (+い)",
      );
    }
  }

  // --- Rule 2: Dakuten / Handakuten / Rendaku (濁音・連濁) Flip ---
  // Prefer toggling later syllables first (classic rendaku position on 2nd kanji, e.g. かいぎ -> かいき), then 1st syllable
  const indicesByRendakuPriority: number[] = [];
  for (let i = clean.length - 1; i >= 0; i--) {
    indicesByRendakuPriority.push(i);
  }
  for (const idx of indicesByRendakuPriority) {
    const ch = clean[idx];
    const swaps = DAKUTEN_SWAP_MAP[ch];
    if (!swaps) continue;
    for (const replacement of swaps) {
      const mutated = clean.slice(0, idx) + replacement + clean.slice(idx + 1);
      pushCandidate(
        rule2Candidates,
        mutated,
        "Dakuten / Rendaku Trap",
        `Voicing / Rendaku flip (${ch} ↔ ${replacement})`,
      );
    }
  }

  // --- Rule 3: Geminate っ (促音) & Palatal ゃ/ゅ/ょ (拗音) Mutation ---
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    // Remove existing っ: e.g. きって -> きて, がっこう -> がこう
    if (ch === "っ") {
      const removed = clean.slice(0, i) + clean.slice(i + 1);
      pushCandidate(
        rule3Candidates,
        removed,
        "Small っ / Yōon Trap",
        "Removed geminate っ (-っ)",
      );
    }

    // Insert っ before k/s/t/p interior consonant
    if (
      i > 0 &&
      ch !== "っ" &&
      ch !== "ん" &&
      next &&
      SOKUON_FOLLOWERS.has(next)
    ) {
      const inserted = clean.slice(0, i + 1) + "っ" + clean.slice(i + 1);
      pushCandidate(
        rule3Candidates,
        inserted,
        "Small っ / Yōon Trap",
        "Inserted geminate っ (+っ)",
      );
    }

    // Yōon mutations (ゃ <-> ゅ <-> ょ or flatten to big や/ゆ/よ)
    if (ch === "ゃ" || ch === "ゅ" || ch === "ょ") {
      const yoonSwaps =
        ch === "ゃ"
          ? ["ゅ", "ょ", "や"]
          : ch === "ゅ"
            ? ["ょ", "ゃ", "ゆ"]
            : ["ゅ", "ゃ", "よ"];
      for (const ys of yoonSwaps) {
        const mutated = clean.slice(0, i) + ys + clean.slice(i + 1);
        pushCandidate(
          rule3Candidates,
          mutated,
          "Small っ / Yōon Trap",
          `Palatal yōon mutation (${ch} → ${ys})`,
        );
      }
    }
  }

  // --- Rule 4: Nasal ん (撥音) & Mora Swap Fallback ---
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === "ん") {
      const removed = clean.slice(0, i) + clean.slice(i + 1);
      pushCandidate(
        rule4Candidates,
        removed,
        "Nasal ん / Mora Trap",
        "Dropped nasal ん (-ん)",
      );
    } else if (i === 0 || i === 1) {
      const inserted = clean.slice(0, i + 1) + "ん" + clean.slice(i + 1);
      pushCandidate(
        rule4Candidates,
        inserted,
        "Nasal ん / Mora Trap",
        "Inserted nasal ん (+ん)",
      );
    }
  }

  // Fallback vowel/mora suffixes so even 2-mora words like あお always yield 3 distinct valid traps
  for (const suffix of ["う", "い", "ん", "り", "く", "る"]) {
    pushCandidate(
      rule4Candidates,
      clean + suffix,
      "Long Vowel Trap",
      `Trailing mora trap (+${suffix})`,
    );
  }
  if (clean.length >= 2) {
    const swappedFirstTwo = clean[1] + clean[0] + clean.slice(2);
    pushCandidate(
      rule4Candidates,
      swappedFirstTwo,
      "Nasal ん / Mora Trap",
      "Transposed mora trap",
    );
  }

  // Pick a balanced mix across Rules 1, 2, 3, and 4 so signature traps from each rule are represented
  const selected: PhoneticReadingTrapCandidate[] = [];
  const buckets = [
    rule1Candidates,
    rule2Candidates,
    rule3Candidates,
    rule4Candidates,
  ];

  // Round-robin pick across active rule buckets first
  let round = 0;
  while (selected.length < 3 && round < 6) {
    for (const bucket of buckets) {
      if (selected.length >= 3) break;
      if (round < bucket.length) {
        selected.push(bucket[round]);
      }
    }
    round++;
  }

  // Guarantee 3 items even on edge inputs
  const fallbackSyllables = ["かい", "こう", "せい", "たい", "しん"];
  let fbIdx = 0;
  while (selected.length < 3) {
    const candidate = clean + fallbackSyllables[fbIdx % fallbackSyllables.length];
    fbIdx++;
    if (!seen.has(candidate) && isValidHiraganaTrap(candidate, clean)) {
      seen.add(candidate);
      selected.push({
        trap: candidate,
        rule: "Nasal ん / Mora Trap",
        detail: "Phonetic distractor",
      });
    }
  }

  // Keep deterministic variety when rng is used
  if (selected.length > 3) {
    return shuffleWithRng(selected, rng).slice(0, 3);
  }
  return selected.slice(0, 3);
}

/**
 * Curated visual look-alike & homophone Kanji confusable pairs (Priority 1 for Mondai 2).
 */
export const VISUAL_CONFUSABLE_KANJI: Readonly<Record<string, readonly string[]>> = {
  会: ["合", "絵", "命", "企"],
  議: ["義", "儀", "犠", "技"],
  旅: ["族", "旋", "旗", "派"],
  行: ["往", "待", "征", "街"],
  図: ["団", "困", "囲", "国"],
  書: ["画", "昼", "署", "著"],
  館: ["官", "管", "飯", "飲"],
  集: ["焦", "進", "推", "雑"],
  切: ["功", "初", "別", "折"],
  手: ["毛", "半", "予", "才"],
  新: ["親", "薪", "析", "折"],
  聞: ["問", "開", "閉", "間"],
  先: ["洗", "光", "元", "失"],
  生: ["主", "住", "星", "性"],
  学: ["字", "覚", "栄", "孝"],
  校: ["交", "効", "郊", "較"],
  発: ["廃", "登", "癸", "波"],
  表: ["衣", "俵", "裏", "製"],
  写: ["与", "写真"[0], "考", "号"],
  真: ["直", "具", "慎", "鎮"],
  住: ["主", "注", "柱", "往"],
  所: ["戸", "祈", "折", "近"],
  社: ["礼", "祈", "祉", "土"],
  銀: ["根", "限", "眼", "銅"],
  病: ["痛", "疲", "症", "疾"],
  院: ["完", "官", "館", "陰"],
  映: ["央", "英", "照", "晩"],
  画: ["書", "図", "界", "田"],
  料: ["科", "計", "粉", "粋"],
  理: ["里", "埋", "程", "利"],
  勉: ["免", "晩", "強", "努"],
  強: ["弱", "弓", "弘", "張"],
  練: ["東", "錬", "棟", "凍"],
  習: ["羽", "翌", "翼", "扇"],
  準: ["准", "集", "進", "唯"],
  備: ["偉", "優", "催", "働"],
  紹: ["招", "昭", "沼", "絡"],
  介: ["界", "今", "分", "企"],
  経: ["軽", "径", "怪", "続"],
  験: ["険", "検", "剣", "実験"[1]],
  約: ["的", "釣", "紀", "納"],
  束: ["来", "速", "整", "頼"],
  連: ["運", "週", "達", "通"],
  絡: ["格", "落", "路", "略"],
  相: ["想", "箱", "霜", "目"],
  談: ["淡", "炎", "語", "説"],
  説: ["読", "税", "脱", "鋭"],
  明: ["朋", "盟", "晴", "昭"],
  確: ["石", "破", "研", "硬"],
  認: ["忍", "誌", "識", "語"],
  動: ["働", "重", "勲", "種"],
  働: ["動", "側", "億", "優"],
  待: ["持", "侍", "時", "特"],
  持: ["待", "時", "詩", "特"],
  晴: ["清", "精", "青", "静"],
  清: ["晴", "精", "請", "情"],
  開: ["閉", "問", "間", "関"],
  閉: ["開", "問", "間", "関"],
  配: ["記", "起", "己", "酒"],
  記: ["配", "起", "紀", "忌"],
  土: ["士", "上", "王", "干"],
  士: ["土", "上", "壬", "吉"],
  末: ["未", "本", "木", "札"],
  未: ["末", "味", "妹", "木"],
};

const KANJI_CHAR_RE = /[\u4E00-\u9FAF]/;

/**
 * B. Algorithmic Visual Kanji Confusable Generator (Mondai 2: Hiragana -> Kanji)
 * Given a target Kanji word (e.g. "会議", "旅行", "集める"), returns 3 distinct confusable Kanji compounds.
 */
export function generateOrthographyTraps(
  targetWord: string,
  kanjiPool: Readonly<Record<string, CompactKanjiMeta>> = DEFAULT_KANJI_META_MAP,
  _radicalMap?: Readonly<Record<string, readonly string[]>>,
  rng: () => number = Math.random,
): OrthographyTrapCandidate[] {
  const chars = [...targetWord];
  const kanjiPositions: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (KANJI_CHAR_RE.test(chars[i])) {
      kanjiPositions.push(i);
    }
  }

  const allPoolKanji = Object.values(kanjiPool);
  const seenCompounds = new Set<string>([targetWord]);
  const candidates: OrthographyTrapCandidate[] = [];

  const addCompoundCandidate = (
    pos: number,
    originalKanji: string,
    replacementKanji: string,
    reasonKind: string,
  ) => {
    if (!replacementKanji || replacementKanji === originalKanji) return;
    if (!KANJI_CHAR_RE.test(replacementKanji)) return;
    const mutatedChars = [...chars];
    mutatedChars[pos] = replacementKanji;
    const trapWord = mutatedChars.join("");
    if (seenCompounds.has(trapWord)) return;
    seenCompounds.add(trapWord);

    const origMeta = kanjiPool[originalKanji];
    const repMeta = kanjiPool[replacementKanji];
    const origLabel = origMeta?.label ? ` (${origMeta.label})` : "";
    const repLabel = repMeta?.label ? ` (${repMeta.label})` : "";

    candidates.push({
      trap: trapWord,
      rule: "Look-Alike Kanji Trap",
      reason: `${reasonKind}: ${replacementKanji}${repLabel} vs ${originalKanji}${origLabel}`,
    });
  };

  for (const pos of kanjiPositions) {
    const orig = chars[pos];
    const origMeta = kanjiPool[orig];

    // Priority 1: Curated visual confusables
    const curated = VISUAL_CONFUSABLE_KANJI[orig] ?? [];
    for (const rep of curated) {
      addCompoundCandidate(pos, orig, rep, "Look-alike kanji");
    }

    if (origMeta) {
      // Priority 2: Same On'yomi reading (Homophone kanji trap)
      if (origMeta.on.length > 0) {
        const primaryOn = origMeta.on[0];
        const homophones = allPoolKanji.filter(
          (k) =>
            k.c !== orig &&
            k.on.includes(primaryOn) &&
            Math.abs(k.jlpt - origMeta.jlpt) <= 1,
        );
        for (const h of homophones.slice(0, 4)) {
          addCompoundCandidate(
            pos,
            orig,
            h.c,
            `Homophone kanji [${primaryOn}]`,
          );
        }
      }

      // Priority 3: Same primary radical & stroke count within ±2
      if (origMeta.radical) {
        const radicalPeers = allPoolKanji.filter(
          (k) =>
            k.c !== orig &&
            k.radical === origMeta.radical &&
            Math.abs(k.strokes - origMeta.strokes) <= 2,
        );
        for (const rp of radicalPeers.slice(0, 4)) {
          addCompoundCandidate(
            pos,
            orig,
            rp.c,
            `Shared radical (${origMeta.radical})`,
          );
        }
      }
    }
  }

  // Fallback if word had unusual kanji not in DEFAULT_KANJI_META_MAP
  const fallbackKanji = ["会", "合", "義", "議", "行", "往", "図", "団", "集", "進"];
  const targetPos = kanjiPositions[0] ?? 0;
  const origChar = chars[targetPos] ?? targetWord[0];
  let fbIdx = 0;
  while (candidates.length < 3 && fbIdx < fallbackKanji.length) {
    addCompoundCandidate(
      targetPos,
      origChar,
      fallbackKanji[fbIdx],
      "Look-alike kanji",
    );
    fbIdx++;
  }

  if (candidates.length > 3) {
    // Keep top curated traps first, with slight rng tie-breaking among later items
    const topTwo = candidates.slice(0, 2);
    const rest = shuffleWithRng(candidates.slice(2), rng);
    return [...topTwo, rest[0]].slice(0, 3);
  }

  return candidates.slice(0, 3);
}

export function normalizePhoneticLevel(input: JlptLevelInput): PhoneticTrapLevel {
  if (typeof input === "number") {
    return `N${input}` as PhoneticTrapLevel;
  }
  return input;
}

export function getPhoneticTrapCountsByLevel(
  pool: readonly PhoneticTrapVocabItem[] = PHONETIC_TRAP_ITEMS,
): Record<PhoneticTrapLevel, number> {
  const counts: Record<PhoneticTrapLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  };
  for (const item of pool) {
    counts[item.level] = (counts[item.level] ?? 0) + 1;
  }
  return counts;
}

function katakanaToHiragana(input: string): string {
  return input.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

/**
 * Builds `{漢字|ふりがな}` markup for a synthetic Kanji compound distractor using `DEFAULT_KANJI_META_MAP`.
 */
export function buildKanjiCompoundFurigana(
  compound: string,
  kanjiPool: Readonly<Record<string, CompactKanjiMeta>> = DEFAULT_KANJI_META_MAP,
): string {
  const chars = [...compound];
  const hasOkurigana = chars.some((ch) => !KANJI_CHAR_RE.test(ch));

  return chars
    .map((ch) => {
      if (!KANJI_CHAR_RE.test(ch)) return ch;
      const meta = kanjiPool[ch];
      if (!meta) return ch;
      const rawReading =
        hasOkurigana && meta.kun.length > 0
          ? meta.kun[0].split(".")[0].replace(/-/g, "")
          : meta.on[0]
            ? katakanaToHiragana(meta.on[0].split(".")[0].replace(/-/g, ""))
            : meta.kun[0]
              ? meta.kun[0].split(".")[0].replace(/-/g, "")
              : "";
      return rawReading ? `{${ch}|${rawReading}}` : ch;
    })
    .join("");
}

export function buildPhoneticTrapQuestion(
  item: PhoneticTrapVocabItem,
  mode: PhoneticTrapQuestionMode,
  questionId: string,
  rng: () => number = Math.random,
): PhoneticTrapQuestion {
  const prefixFurigana = item.prefixFurigana ?? item.prefix;
  const targetFurigana = item.targetFurigana ?? `{${item.word}|${item.reading}}`;
  const suffixFurigana = item.suffixFurigana ?? item.suffix;
  const sentenceFurigana =
    item.sentenceFurigana ?? prefixFurigana + targetFurigana + suffixFurigana;

  if (mode === "reading") {
    const traps = generatePhoneticReadingTraps(item.reading, rng);
    const rawOptions: Array<{
      text: string;
      furiganaText: string;
      isCorrect: boolean;
      trapRule?: TrapRuleLabel;
      trapExplanation?: string;
    }> = [
      { text: item.reading, furiganaText: item.reading, isCorrect: true },
      ...traps.map((t) => ({
        text: t.trap,
        furiganaText: t.trap,
        isCorrect: false,
        trapRule: t.rule,
        trapExplanation: `${t.rule}: ${t.detail}`,
      })),
    ];

    const shuffled = shuffleWithRng(rawOptions, rng);
    const correctOptionIndex = shuffled.findIndex((o) => o.isCorrect) as 0 | 1 | 2 | 3;
    const options = shuffled.map((o, idx) => ({
      index: idx as 0 | 1 | 2 | 3,
      optionNumber: (idx + 1) as 1 | 2 | 3 | 4,
      text: o.text,
      furiganaText: o.furiganaText,
      isCorrect: o.isCorrect,
      ...(o.trapRule ? { trapRule: o.trapRule } : {}),
      ...(o.trapExplanation ? { trapExplanation: o.trapExplanation } : {}),
    })) as [
      PhoneticTrapOption,
      PhoneticTrapOption,
      PhoneticTrapOption,
      PhoneticTrapOption,
    ];

    return {
      id: questionId,
      itemId: item.id,
      mode: "reading",
      level: item.level,
      jlpt: item.jlpt,
      word: item.word,
      reading: item.reading,
      romaji: item.romaji,
      meanings: item.meanings,
      prefix: item.prefix,
      prefixFurigana,
      promptTarget: item.word,
      promptTargetFurigana: targetFurigana,
      suffix: item.suffix,
      suffixFurigana,
      sentenceJa: item.sentenceJa,
      sentenceFurigana,
      sentenceEn: item.sentenceEn,
      correctOptionIndex,
      correctText: item.reading,
      options,
    };
  }

  // mode === "orthography" (Mondai 2: Hiragana -> Kanji)
  const orthoTraps = generateOrthographyTraps(
    item.word,
    DEFAULT_KANJI_META_MAP,
    undefined,
    rng,
  );
  const rawOptions: Array<{
    text: string;
    furiganaText: string;
    isCorrect: boolean;
    trapRule?: TrapRuleLabel;
    trapExplanation?: string;
  }> = [
    {
      text: item.word,
      furiganaText: targetFurigana,
      isCorrect: true,
    },
    ...orthoTraps.map((t) => ({
      text: t.trap,
      furiganaText: buildKanjiCompoundFurigana(t.trap),
      isCorrect: false,
      trapRule: t.rule,
      trapExplanation: t.reason,
    })),
  ];

  const shuffled = shuffleWithRng(rawOptions, rng);
  const correctOptionIndex = shuffled.findIndex((o) => o.isCorrect) as 0 | 1 | 2 | 3;
  const options = shuffled.map((o, idx) => ({
    index: idx as 0 | 1 | 2 | 3,
    optionNumber: (idx + 1) as 1 | 2 | 3 | 4,
    text: o.text,
    furiganaText: o.furiganaText,
    isCorrect: o.isCorrect,
    ...(o.trapRule ? { trapRule: o.trapRule } : {}),
    ...(o.trapExplanation ? { trapExplanation: o.trapExplanation } : {}),
  })) as [
    PhoneticTrapOption,
    PhoneticTrapOption,
    PhoneticTrapOption,
    PhoneticTrapOption,
  ];

  return {
    id: questionId,
    itemId: item.id,
    mode: "orthography",
    level: item.level,
    jlpt: item.jlpt,
    word: item.word,
    reading: item.reading,
    romaji: item.romaji,
    meanings: item.meanings,
    prefix: item.prefix,
    prefixFurigana,
    promptTarget: item.reading,
    promptTargetFurigana: item.reading,
    suffix: item.suffix,
    suffixFurigana,
    sentenceJa: item.sentenceJa,
    sentenceFurigana,
    sentenceEn: item.sentenceEn,
    correctOptionIndex,
    correctText: item.word,
    options,
  };
}

/**
 * C. Session Factory (`createPhoneticTrapSession`)
 */
export function createPhoneticTrapSession(
  pool: readonly PhoneticTrapVocabItem[] = PHONETIC_TRAP_ITEMS,
  settings: PhoneticTrapSettings = DEFAULT_PHONETIC_TRAP_SETTINGS,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: number = Date.now(),
): PhoneticTrapSession {
  const normalizedLevels: PhoneticTrapLevel[] =
    settings.levels.length > 0
      ? [...new Set(settings.levels.map(normalizePhoneticLevel))]
      : ["N5"];
  const levelSet = new Set<PhoneticTrapLevel>(normalizedLevels);

  let candidates = pool.filter((item) => levelSet.has(item.level));
  if (settings.questionIds && settings.questionIds.length > 0) {
    const idSet = new Set(settings.questionIds);
    const byId = pool.filter((item) => idSet.has(item.id));
    if (byId.length > 0) {
      candidates = byId;
    }
  }

  if (candidates.length === 0) {
    candidates = [...pool];
  }

  const shuffledPool = shuffleWithRng(candidates, rng);
  const selectedItems = shuffledPool.slice(
    0,
    Math.min(settings.size, shuffledPool.length),
  );

  const resolvedSessionId =
    sessionId ??
    `jlpt-traps-${startedAt.toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;

  const questions: PhoneticTrapQuestion[] = selectedItems.map((item, idx) => {
    const qMode: PhoneticTrapQuestionMode =
      settings.subMode === "reading"
        ? "reading"
        : settings.subMode === "orthography"
          ? "orthography"
          : idx % 2 === 0
            ? "reading"
            : "orthography";

    return buildPhoneticTrapQuestion(
      item,
      qMode,
      `${resolvedSessionId}-q-${idx + 1}`,
      rng,
    );
  });

  return {
    sessionId: resolvedSessionId,
    settings: {
      subMode: settings.subMode,
      levels: normalizedLevels,
      size: settings.size,
      showEnglishHint: settings.showEnglishHint,
      showFurigana: settings.showFurigana ?? false,
      ...(settings.questionIds ? { questionIds: settings.questionIds } : {}),
    },
    questions,
    currentIndex: 0,
    revealed: false,
    lastAnswer: null,
    answers: [],
    status: questions.length > 0 ? "playing" : "finished",
    startedAt,
  };
}

/**
 * Pure Reducer (`phoneticTrapReducer`)
 */
export function phoneticTrapReducer(
  state: PhoneticTrapSession,
  action: PhoneticTrapAction,
): PhoneticTrapSession {
  if (state.status === "finished" && action.type !== "END") {
    return state;
  }

  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion && action.type !== "END") {
    return state;
  }

  switch (action.type) {
    case "ANSWER": {
      if (state.revealed) return state;
      const chosenOption = currentQuestion.options[action.optionIndex];
      if (!chosenOption) return state;

      const isCorrect = chosenOption.isCorrect;
      const record: PhoneticTrapAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        mode: currentQuestion.mode,
        chosenOptionIndex: chosenOption.index,
        chosenText: chosenOption.text,
        correctText: currentQuestion.correctText,
        status: isCorrect ? "correct" : "wrong",
        trapRuleTriggered: isCorrect ? null : (chosenOption.trapRule ?? null),
        trapExplanation: isCorrect ? null : (chosenOption.trapExplanation ?? null),
        timeMs: Math.max(0, Math.round(action.timeMs)),
      };

      return {
        ...state,
        revealed: true,
        lastAnswer: record,
        answers: [...state.answers, record],
      };
    }

    case "SKIP": {
      if (state.revealed) return state;
      const record: PhoneticTrapAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        mode: currentQuestion.mode,
        chosenOptionIndex: null,
        chosenText: null,
        correctText: currentQuestion.correctText,
        status: "skipped",
        trapRuleTriggered: null,
        trapExplanation: "Skipped question",
        timeMs: Math.max(0, Math.round(action.timeMs ?? 0)),
      };

      return {
        ...state,
        revealed: true,
        lastAnswer: record,
        answers: [...state.answers, record],
      };
    }

    case "NEXT": {
      if (!state.revealed) return state;
      if (
        typeof action.forIndex === "number" &&
        action.forIndex !== state.currentIndex
      ) {
        return state;
      }

      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          status: "finished",
          finishedAt: Date.now(),
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        revealed: false,
        lastAnswer: null,
      };
    }

    case "END": {
      return {
        ...state,
        status: "finished",
        finishedAt: action.finishedAt ?? Date.now(),
      };
    }

    default:
      return state;
  }
}

export function summarizePhoneticTrapSession(
  session: PhoneticTrapSession,
  completedAt: number = Date.now(),
): PhoneticTrapResultSummary {
  const total = session.questions.length;
  const correctCount = session.answers.filter((a) => a.status === "correct").length;
  const wrongCount = session.answers.filter((a) => a.status === "wrong").length;
  const skippedCount = session.answers.filter((a) => a.status === "skipped").length;
  const accuracyPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const totalTimeMs = session.answers.reduce((acc, a) => acc + a.timeMs, 0);
  const averageTimeMs =
    session.answers.length > 0 ? Math.round(totalTimeMs / session.answers.length) : 0;

  const vulnerabilityCounts: Record<TrapRuleLabel, number> = {
    "Long Vowel Trap": 0,
    "Dakuten / Rendaku Trap": 0,
    "Small っ / Yōon Trap": 0,
    "Nasal ん / Mora Trap": 0,
    "Look-Alike Kanji Trap": 0,
  };

  for (const ans of session.answers) {
    if (ans.status === "wrong" && ans.trapRuleTriggered) {
      vulnerabilityCounts[ans.trapRuleTriggered] =
        (vulnerabilityCounts[ans.trapRuleTriggered] ?? 0) + 1;
    }
  }

  const answeredMap = new Map(session.answers.map((a) => [a.questionId, a]));
  const missedItemIds = session.questions
    .filter((q) => {
      const ans = answeredMap.get(q.id);
      return !ans || ans.status !== "correct";
    })
    .map((q) => q.itemId);

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    total,
    correctCount,
    wrongCount,
    skippedCount,
    accuracyPercent,
    totalTimeMs,
    averageTimeMs,
    vulnerabilityCounts,
    questions: session.questions,
    answers: session.answers,
    missedItemIds,
    completedAt: session.finishedAt ?? completedAt,
  };
}
