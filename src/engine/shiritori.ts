export type ShiritoriMode = "survival" | "blitz" | "friend";
export type ShiritoriDifficulty = "yasashii" | "futsuu" | "oni";
export type ShiritoriPlayer = "player" | "bot" | "player1" | "player2";
export type ShiritoriStatus = "playing" | "won" | "lost" | "timed-out" | "gave-up";
export type ShiritoriLevel = 1 | 2 | 3 | 4 | 5;

export interface ShiritoriWord {
  id: string;
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  jlpt: ShiritoriLevel;
  startKana: string;
  endKana: string;
}

export interface ShiritoriDictionary {
  words: ShiritoriWord[];
  byKana: Map<string, ShiritoriWord>;
  byWord: Map<string, ShiritoriWord>;
  byStartKana: Map<string, ShiritoriWord[]>;
  validByKana?: Map<string, string>;
  validByWord?: Map<string, string>;
}

export interface ShiritoriSettings {
  mode: ShiritoriMode;
  difficulty: ShiritoriDifficulty;
  turnSeconds: 0 | 15 | 30;
  sound?: boolean;
  allowUnverified: boolean;
}

export interface ShiritoriTurn {
  word: ShiritoriWord;
  player: ShiritoriPlayer;
}

export interface ShiritoriState {
  settings: ShiritoriSettings;
  chain: ShiritoriTurn[];
  nextKana: string;
  usedIds: Set<string>;
  hintsRemaining: number;
  currentPlayer: "player1" | "player2";
  status: ShiritoriStatus;
  message: string;
}

export type TurnValidation =
  | { valid: true; state: ShiritoriState; word: ShiritoriWord; warning?: string }
  | { valid: false; state: ShiritoriState; error: string; loseByN?: boolean };

const SMALL_TO_FULL: Record<string, string> = {
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お",
  ゃ: "や", ゅ: "ゆ", ょ: "よ", っ: "つ", ゎ: "わ",
};

const ROMAJI_TO_KANA: Record<string, string> = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", kye: "きぇ",
  sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ",
  sha: "しゃ", sya: "しゃ", shya: "しゃ",
  shu: "しゅ", syu: "しゅ", shyu: "しゅ",
  sho: "しょ", syo: "しょ", shyo: "しょ",
  she: "しぇ", sye: "しぇ", shye: "しぇ",
  ta: "た", ti: "ち", chi: "ち", tu: "つ", tsu: "つ", te: "て", to: "と",
  cha: "ちゃ", tya: "ちゃ", cya: "ちゃ", chya: "ちゃ",
  chu: "ちゅ", tyu: "ちゅ", cyu: "ちゅ", chyu: "ちゅ",
  cho: "ちょ", tyo: "ちょ", cyo: "ちょ", chyo: "ちょ",
  che: "ちぇ", tye: "ちぇ", cye: "ちぇ", chye: "ちぇ",
  tsa: "つぁ", tsi: "つぃ", tse: "つぇ", tso: "つぉ",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ", nye: "にぇ",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ", hye: "ひぇ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",
  fya: "ふゃ", fyu: "ふゅ", fyo: "ふょ", fye: "ふぇ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  mya: "みゃ", myu: "みゅ", myo: "みょ", mye: "みぇ",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ", rye: "りぇ",
  wa: "わ", wo: "を", wi: "うぃ", we: "うぇ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ", gye: "ぎぇ",
  za: "ざ", zi: "じ", ji: "じ", jyi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  ja: "じゃ", jya: "じゃ", zya: "じゃ",
  ju: "じゅ", jyu: "じゅ", zyu: "じゅ",
  jo: "じょ", jyo: "じょ", zyo: "じょ",
  je: "じぇ", jye: "じぇ", zye: "じぇ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  dya: "ぢゃ", dyu: "ぢゅ", dyo: "ぢょ", dye: "ぢぇ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  bya: "びゃ", byu: "びゅ", byo: "びょ", bye: "びぇ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ", pye: "ぴぇ",
  va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
  xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ",
  la: "ぁ", li: "ぃ", lu: "ぅ", le: "ぇ", lo: "ぉ",
  xya: "ゃ", xyu: "ゅ", xyo: "ょ",
  lya: "ゃ", lyu: "ゅ", lyo: "ょ",
  xtsu: "っ", xtu: "っ", ltsu: "っ", ltu: "っ",
  xwa: "ゎ", lwa: "ゎ",
  xn: "ん",
};
const ROMAJI_KEYS = Object.keys(ROMAJI_TO_KANA).sort((a, b) => b.length - a.length);

const KANA_TO_ROMAJI_MAP: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho", しぇ: "she",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho", ちぇ: "che",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo", じぇ: "je",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo",
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", ke: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", nu: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", mu: "mu", me: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  が: "ga", ぎ: "gi", gu: "gu", ge: "ge", go: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", zo: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", do: "do",
  ば: "ba", び: "bi", bu: "bu", be: "be", bo: "bo",
  ぱ: "pa", ぴ: "pi", pu: "pu", pe: "pe", po: "po",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
  ゃ: "ya", ゅ: "yu", ょ: "yo",
  ー: "-",
};

export function hiraganaToRomaji(kana: string): string {
  let result = "";
  let i = 0;
  while (i < kana.length) {
    if (kana[i] === "っ") {
      const nextPair = kana.slice(i + 1, i + 3);
      const nextSingle = kana[i + 1];
      const nextRomaji = KANA_TO_ROMAJI_MAP[nextPair] || KANA_TO_ROMAJI_MAP[nextSingle] || "";
      if (nextRomaji) {
        result += nextRomaji[0] === "c" ? "t" : nextRomaji[0];
      }
      i += 1;
      continue;
    }
    const pair = kana.slice(i, i + 2);
    if (KANA_TO_ROMAJI_MAP[pair]) {
      result += KANA_TO_ROMAJI_MAP[pair];
      i += 2;
      continue;
    }
    const single = kana[i];
    result += KANA_TO_ROMAJI_MAP[single] || single;
    i += 1;
  }
  return result;
}

export function katakanaToHiragana(input: string): string {
  return [...input].map((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : character;
  }).join("");
}

function normalizedReading(input: string): string {
  return katakanaToHiragana(input.normalize("NFKC")).replace(/[\s・]/g, "");
}

export function getKanaAliases(kana: string): string[] {
  const normalized = normalizedReading(kana);
  if (!normalized) return [];
  const last = normalized.at(-1) ?? "";
  const full = SMALL_TO_FULL[last];
  const aliases = new Set([normalized]);
  if (full) {
    const compound = normalized.length > 1 && /[きぎしじちぢにひびぴみり]/.test(normalized.at(-2) ?? "") && /[ゃゅょ]/.test(last);
    aliases.add(compound ? full : `${normalized.slice(0, -1)}${full}`);
  }
  return [...aliases];
}

export function extractStartKana(input: string): string {
  const kana = normalizedReading(input);
  if (!kana) return "";
  const first = kana[0];
  return kana.length > 1 && SMALL_TO_FULL[kana[1]] ? `${first}${kana[1]}` : first;
}

export function extractEndKana(input: string): string {
  const kana = normalizedReading(input).replace(/ー+$/g, "");
  if (!kana) return "";
  const last = kana.at(-1) ?? "";
  if (last === "ん") return "ん";
  if (SMALL_TO_FULL[last] && kana.length > 1) return `${kana.at(-2)}${last}`;
  return last;
}

export function getEffectiveEndKana(input: string): string {
  const endKana = extractEndKana(input);
  return endKana === "っ" ? "つ" : endKana;
}

export function convertRomajiBufferToHiragana(rawInput: string, isSubmit = false): string {
  let result = "";
  let index = 0;
  const source = rawInput.toLowerCase();

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (/[ぁ-ゖァ-ヺー]/.test(current)) {
      result += katakanaToHiragana(current);
      index += 1;
      continue;
    }

    if (current === "-") {
      result += "ー";
      index += 1;
      continue;
    }

    if (current === "n") {
      if (next === "n" || next === "'") {
        result += "ん";
        index += 2;
        continue;
      }
      if (next && !/[aeiouy]/.test(next)) {
        result += "ん";
        index += 1;
        continue;
      }
      if (!next && isSubmit) {
        result += "ん";
        index += 1;
        continue;
      }
    }

    if (current !== "n" && /[bcdfghjklmpqrstvwxyz]/.test(current)) {
      if (current === next || (current === "t" && next === "c")) {
        result += "っ";
        index += 1;
        continue;
      }
    }

    const match = ROMAJI_KEYS.find((key) => source.startsWith(key, index));
    if (match) {
      result += ROMAJI_TO_KANA[match];
      index += match.length;
      continue;
    }

    if (current === "'") {
      index += 1;
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
}

export function romajiToHiragana(input: string, final = false): string {
  return convertRomajiBufferToHiragana(input, final);
}

export function createShiritoriState(settings: ShiritoriSettings, openingWord: ShiritoriWord): ShiritoriState {
  return {
    settings,
    chain: [{ word: openingWord, player: settings.mode === "friend" ? "player1" : "bot" }],
    nextKana: getEffectiveEndKana(openingWord.kana),
    usedIds: new Set([openingWord.id]),
    hintsRemaining: 3,
    currentPlayer: settings.mode === "friend" ? "player2" : "player1",
    status: "playing",
    message: "",
  };
}

export function hasEnglishGloss(entry: Pick<ShiritoriWord, "word" | "kana" | "meaning">): boolean {
  const meaning = entry.meaning.trim();
  return Boolean(
    meaning &&
      meaning !== entry.word &&
      meaning !== entry.kana &&
      meaning !== "Valid word" &&
      meaning !== "Unverified word" &&
      meaning !== "valid noun" &&
      !/[\u3040-\u30ff\u4e00-\u9faf]/.test(meaning)
  );
}

export function formatShiritoriMeaning(entry: Pick<ShiritoriWord, "word" | "kana" | "meaning">): string {
  return hasEnglishGloss(entry) ? entry.meaning : "valid noun";
}

function findWord(input: string, dictionary: ShiritoriDictionary): ShiritoriWord | undefined {
  const trimmed = input.trim();
  const normalized = normalizedReading(trimmed).toLowerCase();
  const directWord = dictionary.byKana.get(normalized) ?? dictionary.byWord.get(trimmed.normalize("NFKC"));
  if (directWord) return directWord;

  if (dictionary.validByKana && dictionary.validByWord) {
    let matchedKana: string | undefined;
    let matchedWord: string | undefined;

    if (dictionary.validByKana.has(normalized)) {
      matchedKana = normalized;
      matchedWord = dictionary.validByKana.get(normalized);
    } else if (dictionary.validByWord.has(trimmed.normalize("NFKC"))) {
      matchedWord = trimmed.normalize("NFKC");
      matchedKana = dictionary.validByWord.get(matchedWord);
    }

    if (matchedKana) {
      const displayWord = matchedWord || matchedKana;
      return {
        id: `valid:${matchedKana}`,
        word: displayWord,
        kana: matchedKana,
        romaji: hiraganaToRomaji(matchedKana),
        meaning: "valid noun",
        jlpt: 5,
        startKana: extractStartKana(matchedKana),
        endKana: extractEndKana(matchedKana),
      };
    }
  }

  return undefined;
}

export function validateTurn(
  input: string,
  state: ShiritoriState,
  dictionary: ShiritoriDictionary
): TurnValidation {
  const submitted = romajiToHiragana(input.trim(), true);
  const normalized = normalizedReading(submitted);
  let word = findWord(submitted, dictionary);
  if (!word && state.settings.allowUnverified && /^[\u3041-\u3096ー]+$/.test(normalized)) {
    word = {
      id: `unverified:${normalized}`,
      word: normalized,
      kana: normalized,
      romaji: "",
      meaning: "Unverified word",
      jlpt: 5,
      startKana: extractStartKana(normalized),
      endKana: extractEndKana(normalized),
    };
  }
  if (!word) return { valid: false, state, error: "Not in dictionary" };
  if (state.usedIds.has(word.id)) return { valid: false, state, error: "Already used" };
  const allowedStarts = getKanaAliases(state.nextKana);
  if (!allowedStarts.some((start) => word.kana.startsWith(start))) {
    const expected = allowedStarts.length > 1
      ? `「${allowedStarts.join("」 or 「")}」`
      : `「${state.nextKana}」`;
    return { valid: false, state, error: `Must start with ${expected}` };
  }
  if (word.endKana === "ん") {
    if (state.settings.difficulty === "yasashii" && state.settings.mode !== "friend") {
      return { valid: false, state, error: "That word ends in ん. Try another word!" };
    }
    return { valid: false, state: { ...state, status: "lost", message: "lose-by-n" }, error: "Words ending in ん lose", loseByN: true };
  }

  const player = state.settings.mode === "friend" ? state.currentPlayer : "player";
  const nextState: ShiritoriState = {
    ...state,
    chain: [...state.chain, { word, player }],
    usedIds: new Set([...state.usedIds, word.id]),
    nextKana: getEffectiveEndKana(word.kana),
    currentPlayer: state.settings.mode === "friend" ? (state.currentPlayer === "player1" ? "player2" : "player1") : state.currentPlayer,
    message: "",
  };
  return { valid: true, state: nextState, word };
}

export function chooseBotWord(state: ShiritoriState, dictionary: ShiritoriDictionary): ShiritoriWord | undefined {
  const allowedStarts = getKanaAliases(state.nextKana);
  const candidates = allowedStarts
    .flatMap((kana) => dictionary.byStartKana.get(kana) ?? [])
    .filter(
      (word, index, list) =>
        !state.usedIds.has(word.id) &&
        allowedStarts.some((start) => word.kana.startsWith(start)) &&
        list.findIndex((entry) => entry.id === word.id) === index
    );
  if (!candidates.length) return undefined;
  const eligible = candidates.filter((word) => word.endKana !== "ん");
  const glossedEligible = eligible.filter(hasEnglishGloss);
  const baseEligible = glossedEligible.length ? glossedEligible : eligible;
  const pool = state.settings.difficulty === "yasashii"
    ? baseEligible.filter((word) => word.jlpt >= 4)
    : state.settings.difficulty === "futsuu"
      ? baseEligible.filter((word) => word.jlpt >= 3)
      : baseEligible;
  const choices = pool.length ? pool : baseEligible;
  if (!choices.length) return candidates.find(hasEnglishGloss) ?? candidates[0];
  const remainingReplies = (word: ShiritoriWord) => new Set(
    getKanaAliases(getEffectiveEndKana(word.kana))
      .flatMap((kana) => dictionary.byStartKana.get(kana) ?? [])
      .filter((next) => next.id !== word.id && !state.usedIds.has(next.id) && next.endKana !== "ん")
      .map((next) => next.id)
  ).size;
  if (state.settings.difficulty === "yasashii") {
    return [...choices].sort((a, b) => remainingReplies(b) - remainingReplies(a) || b.jlpt - a.jlpt || a.word.localeCompare(b.word))[0];
  }
  if (state.settings.difficulty === "oni") {
    return [...choices].sort((a, b) => remainingReplies(a) - remainingReplies(b) || a.word.localeCompare(b.word))[0];
  }
  return [...choices].sort((a, b) => a.jlpt - b.jlpt || a.word.localeCompare(b.word))[0];
}

export function useHint(state: ShiritoriState, dictionary: ShiritoriDictionary): { state: ShiritoriState; word?: ShiritoriWord } {
  if (state.hintsRemaining <= 0 || state.status !== "playing") return { state };
  const allowedStarts = getKanaAliases(state.nextKana);

  // Exact start kana matches first (e.g. for "にょ", try words starting with "にょ")
  const exactChoices = (dictionary.byStartKana.get(state.nextKana) ?? [])
    .filter(
      (candidate) =>
        !state.usedIds.has(candidate.id) &&
        candidate.endKana !== "ん" &&
        candidate.kana.startsWith(state.nextKana)
    );

  // Fallback to alias starts (e.g. for "にょ", try words starting with "よ")
  const aliasChoices = allowedStarts
    .filter((start) => start !== state.nextKana)
    .flatMap((start) => dictionary.byStartKana.get(start) ?? [])
    .filter(
      (candidate) =>
        !state.usedIds.has(candidate.id) &&
        candidate.endKana !== "ん" &&
        allowedStarts.some((s) => candidate.kana.startsWith(s))
    );

  const exactGlossed = exactChoices.filter(hasEnglishGloss);
  const aliasGlossed = aliasChoices.filter(hasEnglishGloss);
  const pool = exactGlossed.length
    ? exactGlossed
    : aliasGlossed.length
      ? aliasGlossed
      : exactChoices.length
        ? exactChoices
        : aliasChoices;

  const word = [...pool]
    .filter((candidate, index, list) => list.findIndex((entry) => entry.id === candidate.id) === index)
    .sort((a, b) => b.jlpt - a.jlpt || a.word.localeCompare(b.word))[0];

  return { state: { ...state, hintsRemaining: state.hintsRemaining - 1 }, word };
}

export function buildShiritoriDictionary(
  words: ShiritoriWord[],
  validReadingsMap?: Record<string, string>
): ShiritoriDictionary {
  const byKana = new Map<string, ShiritoriWord>();
  const byWord = new Map<string, ShiritoriWord>();
  const byStartKana = new Map<string, ShiritoriWord[]>();
  for (const word of words) {
    const normKana = normalizedReading(word.kana);
    const normWord = word.word.normalize("NFKC");
    const existingByKana = byKana.get(normKana);
    if (!existingByKana || (!hasEnglishGloss(existingByKana) && hasEnglishGloss(word))) {
      byKana.set(normKana, word);
    }
    const existingByWord = byWord.get(normWord);
    if (!existingByWord || (!hasEnglishGloss(existingByWord) && hasEnglishGloss(word))) {
      byWord.set(normWord, word);
    }
    const start = word.startKana || extractStartKana(word.kana);
    if (start) {
      const bucket = byStartKana.get(start) ?? [];
      bucket.push(word);
      byStartKana.set(start, bucket);
    }
  }

  const validByKana = new Map<string, string>();
  const validByWord = new Map<string, string>();
  if (validReadingsMap) {
    for (const [kana, word] of Object.entries(validReadingsMap)) {
      const normKana = normalizedReading(kana);
      const normWord = word.trim().normalize("NFKC");
      validByKana.set(normKana, normWord);
      if (!validByWord.has(normWord)) {
        validByWord.set(normWord, normKana);
      }
    }
  }

  return { words, byKana, byWord, byStartKana, validByKana, validByWord };
}
