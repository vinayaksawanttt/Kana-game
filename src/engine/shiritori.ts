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
}

export interface ShiritoriSettings {
  mode: ShiritoriMode;
  difficulty: ShiritoriDifficulty;
  turnSeconds: 0 | 15 | 30;
  sound: boolean;
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
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ", kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ", sya: "しゃ", sha: "しゃ", syu: "しゅ", shu: "しゅ", syo: "しょ", sho: "しょ",
  ta: "た", ti: "ち", chi: "ち", tu: "つ", tsu: "つ", te: "て", to: "と", tya: "ちゃ", cha: "ちゃ", tyu: "ちゅ", chu: "ちゅ", tyo: "ちょ", cho: "ちょ",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の", nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ", hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も", mya: "みゃ", myu: "みゅ", myo: "みょ",
  ya: "や", yu: "ゆ", yo: "よ", ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ", rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  wa: "わ", wo: "を", ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご", gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ", zya: "じゃ", ja: "じゃ", zyu: "じゅ", ju: "じゅ", zyo: "じょ", jo: "じょ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど", ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
};
const ROMAJI_KEYS = Object.keys(ROMAJI_TO_KANA).sort((a, b) => b.length - a.length);

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

export function romajiToHiragana(input: string, final = false): string {
  const source = input.toLowerCase().replace(/[^a-z'ぁ-ゖァ-ヺー]/g, "");
  let result = "";
  let index = 0;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (/[ぁ-ゖァ-ヺー]/.test(current)) {
      result += katakanaToHiragana(current);
      index += 1;
      continue;
    }
    if (current === "n" && (next === "n" || next === "'")) {
      result += "ん";
      index += next === "'" ? 2 : 2;
      continue;
    }
    if (current === "n" && next && !/[aiueoyn']/.test(next)) {
      result += "ん";
      index += 1;
      continue;
    }
    if (current !== "n" && /[bcdfghjklmpqrstvwxyz]/.test(current) && current === next) {
      result += "っ";
      index += 1;
      continue;
    }
    const match = ROMAJI_KEYS.find((key) => source.startsWith(key, index));
    if (match) {
      result += ROMAJI_TO_KANA[match];
      index += match.length;
      continue;
    }
    if (current === "n" && !next) {
      result += final ? "ん" : "n";
      index += 1;
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

function findWord(input: string, dictionary: ShiritoriDictionary): ShiritoriWord | undefined {
  const normalized = normalizedReading(input).toLowerCase();
  return dictionary.byKana.get(normalized) ?? dictionary.byWord.get(input.trim().normalize("NFKC"));
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
    return { valid: false, state, error: `Must start with 「${state.nextKana}」` };
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
  const candidates = getKanaAliases(state.nextKana)
    .flatMap((kana) => dictionary.byStartKana.get(kana) ?? [])
    .filter((word, index, list) => !state.usedIds.has(word.id) && list.findIndex((entry) => entry.id === word.id) === index);
  if (!candidates.length) return undefined;
  const eligible = candidates.filter((word) => word.endKana !== "ん");
  const pool = state.settings.difficulty === "yasashii"
    ? eligible.filter((word) => word.jlpt >= 4)
    : state.settings.difficulty === "futsuu"
      ? eligible.filter((word) => word.jlpt >= 3)
      : eligible;
  const choices = pool.length ? pool : eligible;
  if (!choices.length) return candidates[0];
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
  const word = getKanaAliases(state.nextKana)
    .flatMap((kana) => dictionary.byStartKana.get(kana) ?? [])
    .filter((candidate, index, list) => !state.usedIds.has(candidate.id) && candidate.endKana !== "ん" && list.findIndex((entry) => entry.id === candidate.id) === index)
    .sort((a, b) => b.jlpt - a.jlpt || a.word.localeCompare(b.word))[0];
  return { state: { ...state, hintsRemaining: state.hintsRemaining - 1 }, word };
}

export function buildShiritoriDictionary(words: ShiritoriWord[]): ShiritoriDictionary {
  const byKana = new Map<string, ShiritoriWord>();
  const byWord = new Map<string, ShiritoriWord>();
  const byStartKana = new Map<string, ShiritoriWord[]>();
  for (const word of words) {
    byKana.set(normalizedReading(word.kana), word);
    byWord.set(word.word.normalize("NFKC"), word);
    for (const start of new Set([word.startKana, ...getKanaAliases(word.startKana)])) {
      const bucket = byStartKana.get(start) ?? [];
      bucket.push(word);
      byStartKana.set(start, bucket);
    }
  }
  return { words, byKana, byWord, byStartKana };
}
