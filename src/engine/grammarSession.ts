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

function pickClozeDistractors(
  correctAnswer: string,
  grammarId: string,
  level: GrammarLevel,
  allPoints: GrammarPoint[],
  rng: () => number
): string[] {
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
  const primary = unique(shuffle(sameLevelCandidates, rng), used);
  if (primary.length >= 3) return primary.slice(0, 3);

  const fallback = unique(shuffle(otherLevelCandidates, rng), used);
  return [...primary, ...fallback].slice(0, 3);
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
    en: example.en,
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

