import {
  loadGrammarData,
  type GrammarExample,
  type GrammarLevel,
  type GrammarPoint,
} from "@/data/grammar";
import { shuffle } from "./random";

export type GrammarQuestionType = "cloze" | "scramble";
export type GrammarQuestionStatus = "correct" | "wrong" | "unanswered";

export interface GrammarSessionSettings {
  levels: GrammarLevel[];
  size: number;
  /** Ratio of Cloze questions in [0, 1]. 1 = Cloze only, 0.5 = 50/50 Mix, 0 = Scramble only. */
  clozeRatio: number;
  grammarIds?: string[];
}

export interface GrammarClozeQuestion {
  id: string;
  type: "cloze";
  grammarId: string;
  grammarSlug: string;
  grammarTitle: string;
  grammarPattern: string;
  shortExplanation: string;
  level: GrammarLevel;
  sentenceJp: string;
  romaji: string;
  en: string;
  before: string;
  after: string;
  correctAnswer: string;
  options: [string, string, string, string];
}

export interface GrammarScrambleQuestion {
  id: string;
  type: "scramble";
  grammarId: string;
  grammarSlug: string;
  grammarTitle: string;
  grammarPattern: string;
  shortExplanation: string;
  level: GrammarLevel;
  sentenceJp: string;
  romaji: string;
  en: string;
  naturalEn?: string;
  literalEn?: string;
  correctChunks: string[];
  scrambledChunks: string[];
}

export type GrammarQuestion = GrammarClozeQuestion | GrammarScrambleQuestion;

export interface StoredGrammarSession {
  sessionId: string;
  settings: GrammarSessionSettings;
  questions: GrammarQuestion[];
}

export interface GrammarQuestionResult {
  id: string;
  type: GrammarQuestionType;
  grammarId: string;
  grammarSlug: string;
  grammarTitle: string;
  grammarPattern: string;
  shortExplanation: string;
  level: GrammarLevel;
  sentenceJp: string;
  romaji: string;
  en: string;
  correctAnswer: string;
  status: GrammarQuestionStatus;
  chosenAnswer?: string;
  timeMs: number;
}

export interface GrammarSessionState {
  sessionId: string;
  settings: GrammarSessionSettings;
  questions: GrammarQuestion[];
  results: GrammarQuestionResult[];
  index: number;
  startedAt: number;
  endedEarly: boolean;
}

export type GrammarSessionAction =
  | { type: "ANSWER_CLOZE"; optionIndex: number; index?: number; timeMs: number }
  | { type: "ANSWER_SCRAMBLE"; chunks: string[]; index?: number; timeMs: number }
  | { type: "NEXT"; index?: number }
  | { type: "END" };

export interface GrammarSessionResult {
  sessionId: string;
  settings: GrammarSessionSettings;
  startedAt: number;
  endedAt: number;
  endedEarly: boolean;
  questions: GrammarQuestionResult[];
}

/**
 * Generates deceptive, grammatically plausible foils for a target cloze answer.
 * Includes tense confusion (e.g. と思います -> と思いました),
 * subtle pronunciation/vowel-drop traps (e.g. と思いました -> と思ました),
 * particle confusions (e.g. どこへも -> どこにも / どこでも),
 * and conjugation/aspect shifts.
 */
export function generateDeceptiveGrammarFoils(
  correctAnswer: string,
  rng: () => number = Math.random
): string[] {
  const trimmed = correctAnswer.trim();
  if (!trimmed) return [];

  // Preserve leading tilde/symbols like 〜 or ~
  const prefixMatch = trimmed.match(/^[〜~～\s]+/);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const suffixMatch = trimmed.match(/[。\s]+$/);
  const suffix = suffixMatch ? suffixMatch[0] : "";
  const core = trimmed.slice(prefix.length, trimmed.length - suffix.length).trim();
  if (!core) return [];

  const foils = new Set<string>();
  const add = (candidate: string) => {
    const c = candidate.trim();
    if (c && c !== core) {
      const full = `${prefix}${c}${suffix}`;
      if (full !== trimmed && !foils.has(full)) {
        foils.add(full);
      }
    }
  };

  // 1. Specific Japanese grammar phrase mappings (JLPT N5-N1 high frequency)
  const specificMap: Record<string, string[]> = {
    // 思います and thought/speech
    "と思います": ["と思いました", "と思ました", "と思っています", "思いません", "だと思う"],
    "とおもいます": ["とおもいました", "とおもました", "とおもっています", "とおもいません"],
    "と思いました": ["と思います", "と思ました", "思いませんでした", "と思った", "とおもいました"],
    "とおもいました": ["とおもいます", "とおもました", "とおもいませんでした", "とおもった"],
    "と思っています": ["と思っていました", "と思います", "と思ています"],
    "とおもっています": ["とおもっていました", "とおもいます", "とおもています"],
    "言いました": ["言います", "言ました", "言いませんでした", "言っていた"],
    "いいました": ["いいます", "い言いました", "いいませんでした"],

    // Indefinite pronouns + particles
    "どこへも": ["どこにも", "どこでも", "どこをも", "どこまでも", "どこへ"],
    "どこにも": ["どこへも", "どこでも", "どこまでも", "どこかも"],
    "どこでも": ["どこにも", "どこへも", "どこかも", "どこかで"],
    "だれにも": ["だれでも", "だれへも", "だれかも", "だれとも"],
    "だれでも": ["だれにも", "だれかも", "だれへも", "だれかと"],
    "なにも": ["なんでも", "なにかも", "なんにも", "なにもかも"],
    "いつも": ["いつでも", "いつかも", "いつまでも", "いつからか"],
    "いつまでも": ["いつでも", "いつも", "いつにか"],

    // Obligation / Prohibition
    "てはいけません": ["てはいけませんでした", "てはだめです", "なくてはいけません", "てはいけまさん"],
    "なくてはいけません": ["なくてはいけませんでした", "てはいけません", "なければなりません"],
    "なければなりません": ["なければならなかった", "なくてはなりません", "なければいけません", "ないとなりません"],
    "なければいけません": ["なければいけませんでした", "なければなりません", "なくてはいけません"],
    "なくてはならない": ["なければならない", "なくてはならなかった", "ないといけない"],
    "なければならない": ["なければならなかった", "なくてはならない", "なければいけない", "ないといけない"],
    "ないでください": ["なくてください", "ないで", "ないでくださいました", "なくてはください"],

    // Experience / Advice / Intention
    "たことがある": ["ることがある", "たことがない", "たことがあります", "ていることがある"],
    "たことがあります": ["ることがあります", "たことがありません", "たことがありました"],
    "たほうがいい": ["るほうがいい", "ないほうがいい", "たほうがよかった", "たほうがいいです"],
    "たほうがいいです": ["るほうがいいです", "ないほうがいいです", "たほうがよかったです"],
    "ないほうがいい": ["るほうがいい", "たほうがいい", "ないほうがよかった"],
    "つもりです": ["つもりでした", "よていです", "つもりではあります"],
    "予定です": ["予定でした", "つもりです", "予定であります"],

    // Conjecture, Hearsay & Appearance
    "そうです": ["そうでした", "そです", "ようです", "らしいです"],
    "そうでした": ["そうです", "そでした", "ようでした", "らしいでした"],
    "ようです": ["ようでした", "よです", "そうです", "らしいです"],
    "らしいです": ["らしかったです", "らしいでした", "そうです", "ようです"],
    "かもしれません": ["かもしれませんでした", "かも知れません", "かもしれない", "かもしれせん"],
    "はずです": ["はずでした", "はずがない", "わけです"],
    "はずがない": ["はずです", "わけがない", "はずではなかった"],
    "わけです": ["わけでした", "わけがない", "はずです"],
    "わけがない": ["わけです", "はずがない", "わけではなかった"],

    // Particles & Relational Connectors
    "について": ["にとって", "に対して", "に関して", "によって"],
    "にとって": ["について", "に対して", "によって", "に向けて"],
    "に対して": ["にとって", "について", "に関して", "に向けて"],
    "に関して": ["について", "に対して", "にとって", "により"],
    "によって": ["にとって", "について", "によっても", "により"],
    "によると": ["によれば", "によって", "において", "によりますと"],
    "において": ["について", "における", "によって", "にて"],
    "ために": ["ように", "ための", "ためで", "ためにの"],
    "ように": ["ために", "ような", "ようの", "ようにと"],
    "ばかり": ["だけ", "ほど", "くらい", "ばかりで"],
    "だけ": ["ばかり", "しか", "ほど", "くらい"],
    "しか": ["だけ", "ばかり", "さえ", "しかに"],
    "さえ": ["すら", "こそ", "しか", "さえも"],
    "こそ": ["さえ", "しか", "ばかり", "こそは"],
    "まえに": ["あとで", "まえで", "まえへ", "まえから"],
    "あとで": ["まえに", "あとから", "あとへ", "あとまで"],
    "までに": ["まで", "から", "うちに", "までで"],
    "うちに": ["あいだに", "うちにの", "まえに"],
    "あいだに": ["うちに", "あいだで", "まえに"],
    "ながら": ["つつ", "ながらも", "ながらで"],
    "つつ": ["ながら", "つつも", "つつある"],
    "すぎる": ["すぎた", "すぎます", "すぎて"],
    "すぎます": ["すぎました", "すぎる", "すぎません"],
    "やすい": ["やすかった", "にくい", "やすくて"],
    "にくい": ["にくかった", "やすい", "にくくて"],
    "たびに": ["ごとに", "たびで", "ときに"],
    "ごとに": ["たびに", "ごとで", "おきに"],
  };

  // Direct phrase match
  if (specificMap[core]) {
    for (const foil of specificMap[core]) {
      add(foil);
    }
  }

  // Substring match from specificMap (e.g. if the answer is a compound that contains a key)
  for (const [key, variants] of Object.entries(specificMap)) {
    if (core.includes(key) && core !== key) {
      for (const v of variants) {
        add(core.replace(key, v));
      }
    }
  }

  // 2. Systematic Tense / Aspect Conjugation Substitutions
  const tenseSubs: Array<[RegExp, string]> = [
    [/と思います$/, "と思いました"],
    [/と思いました$/, "と思います"],
    [/とおもいます$/, "とおもいました"],
    [/とおもいました$/, "とおもいます"],
    [/ています$/, "ていました"],
    [/ていました$/, "ています"],
    [/ています$/, "てある"],
    [/てある$/, "ている"],
    [/たいです$/, "たかったです"],
    [/たかったです$/, "たいです"],
    [/たくないです$/, "たくなかったです"],
    [/たい$/, "たかった"],
    [/たかった$/, "たい"],
    [/たくない$/, "たくなかった"],
    [/ました$/, "ます"],
    [/ます$/, "ました"],
    [/ました$/, "ませんでした"],
    [/ません$/, "ませんでした"],
    [/ませんでした$/, "ません"],
    [/でした$/, "です"],
    [/です$/, "でした"],
    [/でしょう$/, "でした"],
    [/だった$/, "だ"],
    [/だ$/, "だった"],
    [/ないで$/, "なくて"],
    [/なくて$/, "ないで"],
    [/なければ$/, "なくては"],
    [/なくては$/, "なければ"],
    [/たら$/, "なら"],
    [/なら$/, "たら"],
    [/れば$/, "たら"],
    [/たことがある$/, "ることがある"],
    [/たことがあります$/, "ることがあります"],
    [/たほうがいい$/, "るほうがいい"],
    [/るほうがいい$/, "たほうがいい"],
    [/ほうがいい$/, "ほうがよかった"],
    [/やすい$/, "にくい"],
    [/にくい$/, "やすい"],
  ];

  for (const [pat, repl] of tenseSubs) {
    if (pat.test(core)) {
      add(core.replace(pat, repl));
    }
  }

  // 3. Pronunciation Traps & Subtle Orthographic Foils (e.g. 思いました -> 思ました, そう -> そ)
  // Dropped vowel 'い' from 'いました' / 'ました' (classic pronunciation trap requested by user)
  if (core.includes("思いました")) {
    add(core.replace("思いました", "思ました"));
  }
  if (core.includes("おもいました")) {
    add(core.replace("おもいました", "おもました"));
  }
  if (core.includes("行きました")) {
    add(core.replace("行きました", "行ました"));
  }
  if (core.includes("聞きました")) {
    add(core.replace("聞きました", "聞ました"));
  }
  if (core.includes("話しました")) {
    add(core.replace("話しました", "話ました"));
  }
  if (core.includes("食べました")) {
    add(core.replace("食べました", "食ました"));
  }
  if (core.includes("買いました")) {
    add(core.replace("買いました", "買ました"));
  }
  if (core.includes("会いました")) {
    add(core.replace("会いました", "会ました"));
  }
  if (core.includes("言いました")) {
    add(core.replace("言いました", "言ました"));
  }
  if (core.includes("そうです")) {
    add(core.replace("そうです", "そです"));
  }
  if (core.includes("どうして")) {
    add(core.replace("どうして", "どして"));
  }
  if (core.includes("でしょう")) {
    add(core.replace("でしょう", "でしょ"));
  }
  if (core.includes("いいです")) {
    add(core.replace("いいです", "いです"));
  }
  if (core.includes("ました") && !core.includes("思いました")) {
    add(core.replace(/ました$/, "まいた"));
  }

  // 4. Particle substitutions
  const particlePairs: Array<[string | RegExp, string]> = [
    ["どこへも", "どこにも"],
    ["どこへも", "どこでも"],
    ["どこへも", "どこをも"],
    [/へも$/, "にも"],
    [/にも$/, "へも"],
    [/でも$/, "にも"],
    [/にも$/, "でも"],
    [/について$/, "にとって"],
    [/にとって$/, "について"],
    [/に対して$/, "にとって"],
    [/によって$/, "について"],
    [/によると$/, "によれば"],
    [/まえに$/, "あとで"],
    [/あとで$/, "まえに"],
    [/までに$/, "まで"],
    [/までに$/, "うちに"],
    [/うちに$/, "あいだに"],
    [/ばかり$/, "だけ"],
    [/だけ$/, "ばかり"],
    [/しか$/, "だけ"],
    [/より$/, "ほど"],
    [/ほど$/, "くらい"],
    [/くらい$/, "ほど"],
    [/ために$/, "ように"],
    [/ように$/, "ために"],
    [/から$/, "ので"],
    [/ので$/, "から"],
  ];

  for (const [target, repl] of particlePairs) {
    if (typeof target === "string" && core.includes(target)) {
      add(core.replace(target, repl));
    } else if (target instanceof RegExp && target.test(core)) {
      add(core.replace(target, repl));
    }
  }

  // Single particles
  const singleParticles: Record<string, string[]> = {
    "に": ["で", "へ", "を", "と"],
    "で": ["に", "を", "へ", "と"],
    "へ": ["に", "で", "まで", "を"],
    "を": ["に", "が", "で", "は"],
    "が": ["は", "を", "に"],
    "は": ["が", "を", "も"],
    "と": ["に", "で", "や"],
    "も": ["は", "が", "でも"],
    "より": ["ほど", "くらい", "から"],
    "から": ["まで", "より", "ので"],
    "まで": ["から", "までに", "ほど"],
  };
  if (singleParticles[core]) {
    for (const p of singleParticles[core]) {
      add(p);
    }
  }

  return shuffle(Array.from(foils), rng);
}

function pickClozeDistractors(
  correctAnswer: string,
  grammarId: string,
  level: GrammarLevel,
  allPoints: GrammarPoint[],
  rng: () => number
): string[] {
  // First, generate confusing, grammatically deceptive foils (tense, pronunciation, particles)
  const deceptiveFoils = generateDeceptiveGrammarFoils(correctAnswer, rng);

  const sameLevelCandidates: string[] = [];
  const otherLevelCandidates: string[] = [];

  for (const point of allPoints) {
    if (point.id === grammarId) continue;
    for (const ex of point.examples) {
      const candidate = ex.cloze?.answer?.trim();
      if (!candidate || candidate === correctAnswer) continue;
      if (point.level === level) {
        sameLevelCandidates.push(candidate);
      } else {
        otherLevelCandidates.push(candidate);
      }
    }
  }

  const unique = (items: string[], seen: Set<string>): string[] => {
    const out: string[] = [];
    for (const item of items) {
      if (seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
    return out;
  };

  const used = new Set<string>([correctAnswer]);
  const primaryFoils = unique(deceptiveFoils, used);

  // If we have 3 or more deceptive foils, use them directly
  if (primaryFoils.length >= 3) {
    return primaryFoils.slice(0, 3);
  }

  // Supplement with same-level candidates from the corpus
  const primaryPool = unique(shuffle(sameLevelCandidates, rng), used);
  const combined = [...primaryFoils, ...primaryPool];
  if (combined.length >= 3) {
    return combined.slice(0, 3);
  }

  // Final fallback to other levels if needed
  const fallback = unique(shuffle(otherLevelCandidates, rng), used);
  return [...combined, ...fallback].slice(0, 3);
}

function scrambleNonIdentical(chunks: string[], rng: () => number): string[] {
  if (chunks.length <= 1) return [...chunks];
  const targetJoined = chunks.join("|");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = shuffle(chunks, rng);
    if (candidate.join("|") !== targetJoined) {
      return candidate;
    }
  }
  return [...chunks.slice(1), chunks[0]!];
}

function buildClozeQuestion(
  point: GrammarPoint,
  example: GrammarExample,
  questionIndex: number,
  allPoints: GrammarPoint[],
  rng: () => number
): GrammarClozeQuestion | null {
  if (!example.cloze) return null;
  const { before, answer, after } = example.cloze;
  const distractors = pickClozeDistractors(answer, point.id, point.level, allPoints, rng);
  if (distractors.length < 3) return null;

  const options = shuffle([answer, ...distractors.slice(0, 3)], rng) as [
    string,
    string,
    string,
    string,
  ];

  return {
    id: `${point.id}:cloze:${questionIndex}`,
    type: "cloze",
    grammarId: point.id,
    grammarSlug: point.slug,
    grammarTitle: point.title,
    grammarPattern: point.pattern,
    shortExplanation: point.short,
    level: point.level,
    sentenceJp: example.jp,
    romaji: example.romaji,
    en: example.en,
    before,
    after,
    correctAnswer: answer,
    options,
  };
}

function buildScrambleQuestion(
  point: GrammarPoint,
  example: GrammarExample,
  questionIndex: number,
  rng: () => number
): GrammarScrambleQuestion | null {
  if (!example.chunks || example.chunks.length < 2) return null;
  const correctChunks = [...example.chunks];
  const scrambledChunks = scrambleNonIdentical(correctChunks, rng);

  const naturalEn = example.naturalEn;
  const literalEn = example.literalEn || (example.naturalEn && example.naturalEn !== example.en ? example.en : undefined);

  return {
    id: `${point.id}:scramble:${questionIndex}`,
    type: "scramble",
    grammarId: point.id,
    grammarSlug: point.slug,
    grammarTitle: point.title,
    grammarPattern: point.pattern,
    shortExplanation: point.short,
    level: point.level,
    sentenceJp: example.jp,
    romaji: example.romaji,
    en: naturalEn || example.en,
    naturalEn,
    literalEn,
    correctChunks,
    scrambledChunks,
  };
}

export async function createGrammarSession(
  selection: {
    levels: GrammarLevel[];
    size: number;
    clozeRatio?: number;
    grammarIds?: string[];
    sessionId?: string;
    points?: GrammarPoint[];
  },
  rng: () => number = Math.random
): Promise<StoredGrammarSession> {
  const levels: GrammarLevel[] = selection.levels.length ? [...selection.levels] : ["N5"];
  const allPoints = selection.points ?? (await loadGrammarData(levels));

  const idFilter =
    selection.grammarIds && selection.grammarIds.length > 0
      ? new Set(selection.grammarIds)
      : null;

  const pool = idFilter
    ? allPoints.filter((point) => idFilter.has(point.id) || idFilter.has(point.slug))
    : allPoints;

  if (!pool.length) {
    throw new Error("Cannot create a grammar session with an empty pool.");
  }

  const clozeRatio = Math.max(0, Math.min(1, selection.clozeRatio ?? 0.5));
  const targetSize = Math.max(1, Math.min(selection.size, pool.length));
  const selectedPoints = shuffle(pool, rng).slice(0, targetSize);

  const targetClozeCount = Math.round(selectedPoints.length * clozeRatio);

  // Assign desired types and shuffle the type slots so Cloze & Scramble interleave
  const typeSlots: GrammarQuestionType[] = shuffle(
    selectedPoints.map((_, idx) => (idx < targetClozeCount ? "cloze" : "scramble")),
    rng
  );

  const questions: GrammarQuestion[] = [];

  selectedPoints.forEach((point, idx) => {
    const preferredType = typeSlots[idx] ?? "cloze";
    const clozeExamples = shuffle(
      point.examples.filter((ex) => ex.cloze !== null),
      rng
    );
    const scrambleExamples = shuffle(
      point.examples.filter((ex) => ex.chunks && ex.chunks.length >= 2),
      rng
    );

    let built: GrammarQuestion | null = null;
    if (preferredType === "cloze") {
      if (clozeExamples[0]) {
        built = buildClozeQuestion(point, clozeExamples[0], idx, allPoints, rng);
      }
      if (!built && scrambleExamples[0]) {
        built = buildScrambleQuestion(point, scrambleExamples[0], idx, rng);
      }
    } else {
      if (scrambleExamples[0]) {
        built = buildScrambleQuestion(point, scrambleExamples[0], idx, rng);
      }
      if (!built && clozeExamples[0]) {
        built = buildClozeQuestion(point, clozeExamples[0], idx, allPoints, rng);
      }
    }

    if (built) {
      questions.push(built);
    }
  });

  if (!questions.length) {
    throw new Error("No valid grammar questions could be built for the selected pool.");
  }

  return {
    sessionId: selection.sessionId ?? crypto.randomUUID(),
    settings: {
      levels,
      size: questions.length,
      clozeRatio,
      ...(selection.grammarIds ? { grammarIds: [...selection.grammarIds] } : {}),
    },
    questions,
  };
}

export function createGrammarState(
  session: StoredGrammarSession,
  startedAt = Date.now()
): GrammarSessionState {
  const results: GrammarQuestionResult[] = session.questions.map((q) => ({
    id: q.id,
    type: q.type,
    grammarId: q.grammarId,
    grammarSlug: q.grammarSlug,
    grammarTitle: q.grammarTitle,
    grammarPattern: q.grammarPattern,
    shortExplanation: q.shortExplanation,
    level: q.level,
    sentenceJp: q.sentenceJp,
    romaji: q.romaji,
    en: q.en,
    correctAnswer: q.type === "cloze" ? q.correctAnswer : q.correctChunks.join(" "),
    status: "unanswered",
    timeMs: 0,
  }));

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    questions: session.questions,
    results,
    index: 0,
    startedAt,
    endedEarly: false,
  };
}

export function grammarReducer(
  state: GrammarSessionState,
  action: GrammarSessionAction
): GrammarSessionState {
  if (action.type === "END") {
    return state.endedEarly ? state : { ...state, endedEarly: true };
  }
  if (state.endedEarly || state.index >= state.questions.length) return state;
  if (action.index !== undefined && action.index !== state.index) return state;

  const question = state.questions[state.index];
  const current = state.results[state.index];
  if (!question || !current) return state;

  if (action.type === "ANSWER_CLOZE") {
    if (question.type !== "cloze" || current.status !== "unanswered") return state;
    const chosen = question.options[action.optionIndex];
    if (chosen === undefined) return state;

    const updated = [...state.results];
    updated[state.index] = {
      ...current,
      status: chosen === question.correctAnswer ? "correct" : "wrong",
      chosenAnswer: chosen,
      timeMs: Math.max(0, action.timeMs),
    };
    return { ...state, results: updated };
  }

  if (action.type === "ANSWER_SCRAMBLE") {
    if (question.type !== "scramble" || current.status !== "unanswered") return state;
    const chosenJoined = action.chunks.join("");
    const targetJoined = question.correctChunks.join("");
    const isCorrect =
      action.chunks.length === question.correctChunks.length && chosenJoined === targetJoined;

    const updated = [...state.results];
    updated[state.index] = {
      ...current,
      status: isCorrect ? "correct" : "wrong",
      chosenAnswer: action.chunks.join(" "),
      timeMs: Math.max(0, action.timeMs),
    };
    return { ...state, results: updated };
  }

  if (action.type === "NEXT") {
    if (current.status === "unanswered") return state;
    return { ...state, index: Math.min(state.index + 1, state.questions.length) };
  }

  return state;
}

export function buildGrammarResult(
  state: GrammarSessionState,
  endedAt = Date.now()
): GrammarSessionResult {
  return {
    sessionId: state.sessionId,
    settings: state.settings,
    startedAt: state.startedAt,
    endedAt,
    endedEarly: state.endedEarly,
    questions: state.results.map((r) => ({ ...r })),
  };
}

