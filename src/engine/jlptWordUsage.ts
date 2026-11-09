import {
  WORD_USAGE_ITEMS,
  type WordUsageItem,
  type WordUsageLevel,
  type WordUsageSentenceOption,
} from "@/data/jlpt/wordUsageData";

export {
  WORD_USAGE_ITEMS,
  type WordUsageItem,
  type WordUsageLevel,
  type WordUsageSentenceOption,
};

export type JlptNumericLevel = 5 | 4 | 3 | 2 | 1;
export type JlptLabelLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type WordUsageSessionSize = 5 | 10 | 15 | 20;

export interface WordUsageSettings {
  levels: JlptNumericLevel[];
  size: number;
  showEnglishTranslations: boolean;
  questionIds?: string[];
}

export interface WordUsageQuestionOption {
  index: 0 | 1 | 2 | 3;
  optionNumber: 1 | 2 | 3 | 4;
  id: string;
  sentenceJa: string;
  sentenceFurigana?: string;
  sentenceEn: string;
  isCorrect: boolean;
  explanation: string;
}

export interface WordUsageQuestion {
  id: string;
  itemId: string;
  jlpt: JlptNumericLevel;
  levelLabel: JlptLabelLevel;
  word: string;
  reading: string;
  romaji?: string;
  meanings: string[];
  pos?: string[];
  correctOptionIndex: 0 | 1 | 2 | 3;
  options: [
    WordUsageQuestionOption,
    WordUsageQuestionOption,
    WordUsageQuestionOption,
    WordUsageQuestionOption,
  ];
}

export interface WordUsageAnswerRecord {
  questionId: string;
  itemId: string;
  chosenOptionIndex: 0 | 1 | 2 | 3 | null;
  chosenSentenceJa: string | null;
  chosenSentenceEn: string | null;
  correctOptionIndex: 0 | 1 | 2 | 3;
  correctSentenceJa: string;
  correctSentenceEn: string;
  status: "correct" | "wrong" | "skipped";
  timeMs: number;
}

export interface WordUsageSession {
  sessionId: string;
  settings: WordUsageSettings;
  questions: WordUsageQuestion[];
  currentIndex: number;
  status: "playing" | "finished";
  score: number;
  revealed: boolean;
  answers: WordUsageAnswerRecord[];
  startedAt: string;
  completedAt?: string;
}

export type WordUsageAction =
  | { type: "ANSWER"; optionIndex: 0 | 1 | 2 | 3; timeMs: number }
  | { type: "SKIP"; timeMs?: number }
  | { type: "NEXT"; forIndex: number }
  | { type: "END" };

export interface WordUsageReviewRow {
  question: WordUsageQuestion;
  answer: WordUsageAnswerRecord;
}

export interface WordUsageLevelBreakdown {
  jlpt: JlptNumericLevel;
  levelLabel: JlptLabelLevel;
  total: number;
  correct: number;
  accuracy: number;
}

export interface WordUsageResultSummary {
  sessionId: string;
  settings: WordUsageSettings;
  total: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  totalTimeMs: number;
  byLevel: WordUsageLevelBreakdown[];
  missedIds: string[];
  rows: WordUsageReviewRow[];
  startedAt: string;
  completedAt: string;
}

/** Storage key constant used by client-side persistence */
export const WORD_USAGE_SESSION_KEY_PREFIX = "jlpt-usage-session:";

export function getWordUsageSessionStorageKey(sessionId: string): string {
  return `${WORD_USAGE_SESSION_KEY_PREFIX}${sessionId}`;
}

export function formatJlptLevel(jlpt: JlptNumericLevel): JlptLabelLevel {
  return `N${jlpt}` as JlptLabelLevel;
}

export function parseJlptLevel(level: string | number): JlptNumericLevel {
  if (typeof level === "number") {
    if (level >= 1 && level <= 5) return level as JlptNumericLevel;
    return 4;
  }
  const clean = level.toUpperCase().replace(/^N/, "");
  const num = parseInt(clean, 10);
  if (num >= 1 && num <= 5) return num as JlptNumericLevel;
  return 4;
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Builds a WordUsageQuestion from a WordUsageItem.
 * Shuffles the 4 options once with the provided RNG and updates correctOptionIndex accordingly.
 */
export function buildWordUsageQuestion(
  item: WordUsageItem,
  rng: () => number = Math.random,
): WordUsageQuestion {
  const shuffledOptions = shuffleWithRng(item.options, rng);
  let correctOptionIndex: 0 | 1 | 2 | 3 = 0;

  const options = shuffledOptions.map((opt, idx) => {
    const optionIndex = idx as 0 | 1 | 2 | 3;
    if (opt.isCorrect) {
      correctOptionIndex = optionIndex;
    }
    return {
      index: optionIndex,
      optionNumber: (idx + 1) as 1 | 2 | 3 | 4,
      id: opt.id,
      sentenceJa: opt.sentenceJa,
      sentenceFurigana: opt.sentenceFurigana,
      sentenceEn: opt.sentenceEn,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation,
    };
  }) as [
    WordUsageQuestionOption,
    WordUsageQuestionOption,
    WordUsageQuestionOption,
    WordUsageQuestionOption,
  ];

  return {
    id: item.id,
    itemId: item.id,
    jlpt: item.jlpt as JlptNumericLevel,
    levelLabel: formatJlptLevel(item.jlpt as JlptNumericLevel),
    word: item.word,
    reading: item.reading,
    romaji: item.romaji,
    meanings: item.meanings,
    pos: item.pos,
    correctOptionIndex,
    options,
  };
}

/**
 * Factory for creating a deterministic or randomized Word Usage session.
 * Filters pool by level selection or specific missed question IDs, shuffles items,
 * and shuffles sentence options for each question.
 */
export function createWordUsageSession(
  pool: readonly WordUsageItem[],
  settings: WordUsageSettings,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: string = new Date().toISOString(),
): WordUsageSession {
  const sourcePool = pool.length > 0 ? pool : WORD_USAGE_ITEMS;
  const allowedLevels = new Set<number>(
    settings.levels && settings.levels.length > 0 ? settings.levels : [4],
  );
  const targetIdSet =
    settings.questionIds && settings.questionIds.length > 0
      ? new Set(settings.questionIds)
      : null;

  let filtered = sourcePool.filter((item) =>
    targetIdSet ? targetIdSet.has(item.id) : allowedLevels.has(item.jlpt),
  );
  if (filtered.length === 0) {
    filtered = [...sourcePool];
  }

  const shuffledItems = shuffleWithRng(filtered, rng);
  const pickedItems = shuffledItems.slice(
    0,
    Math.min(settings.size, shuffledItems.length),
  );
  const questions = pickedItems.map((item) => buildWordUsageQuestion(item, rng));

  const generatedId =
    sessionId ??
    `usage-${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;

  return {
    sessionId: generatedId,
    settings,
    questions,
    currentIndex: 0,
    status: questions.length > 0 ? "playing" : "finished",
    score: 0,
    revealed: false,
    answers: [],
    startedAt,
  };
}

/**
 * Pure reducer for Word Usage game session transitions.
 * Handles ANSWER, SKIP, NEXT, and END actions with guards against repeat or out-of-order attempts.
 */
export function wordUsageReducer(
  state: WordUsageSession,
  action: WordUsageAction,
): WordUsageSession {
  if (state.status === "finished") {
    return state;
  }

  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion) {
    return {
      ...state,
      status: "finished",
      completedAt: state.completedAt ?? new Date().toISOString(),
    };
  }

  switch (action.type) {
    case "ANSWER": {
      // Guard: ignore repeat answer attempts while already revealed
      if (state.revealed) {
        return state;
      }
      if (action.optionIndex < 0 || action.optionIndex > 3) {
        return state;
      }

      const chosen = currentQuestion.options[action.optionIndex];
      const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
      const isCorrect = action.optionIndex === currentQuestion.correctOptionIndex;

      const record: WordUsageAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        chosenOptionIndex: action.optionIndex,
        chosenSentenceJa: chosen.sentenceJa,
        chosenSentenceEn: chosen.sentenceEn,
        correctOptionIndex: currentQuestion.correctOptionIndex,
        correctSentenceJa: correctOpt.sentenceJa,
        correctSentenceEn: correctOpt.sentenceEn,
        status: isCorrect ? "correct" : "wrong",
        timeMs: Math.max(0, Math.round(action.timeMs || 0)),
      };

      return {
        ...state,
        score: isCorrect ? state.score + 1 : state.score,
        revealed: true,
        answers: [...state.answers, record],
      };
    }

    case "SKIP": {
      // Guard: ignore skip if already answered/revealed
      if (state.revealed) {
        return state;
      }
      const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
      const record: WordUsageAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        chosenOptionIndex: null,
        chosenSentenceJa: null,
        chosenSentenceEn: null,
        correctOptionIndex: currentQuestion.correctOptionIndex,
        correctSentenceJa: correctOpt.sentenceJa,
        correctSentenceEn: correctOpt.sentenceEn,
        status: "skipped",
        timeMs: Math.max(0, Math.round(action.timeMs ?? 0)),
      };

      return {
        ...state,
        revealed: true,
        answers: [...state.answers, record],
      };
    }

    case "NEXT": {
      // Guard: cannot advance unless currently revealed and dispatching for current index
      if (!state.revealed || action.forIndex !== state.currentIndex) {
        return state;
      }

      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          status: "finished",
          revealed: false,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        revealed: false,
      };
    }

    case "END": {
      const updatedAnswers = [...state.answers];
      // If current question is unrecorded, record as skipped
      if (!state.revealed && updatedAnswers.length === state.currentIndex && currentQuestion) {
        const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
        updatedAnswers.push({
          questionId: currentQuestion.id,
          itemId: currentQuestion.itemId,
          chosenOptionIndex: null,
          chosenSentenceJa: null,
          chosenSentenceEn: null,
          correctOptionIndex: currentQuestion.correctOptionIndex,
          correctSentenceJa: correctOpt.sentenceJa,
          correctSentenceEn: correctOpt.sentenceEn,
          status: "skipped",
          timeMs: 0,
        });
      }

      return {
        ...state,
        status: "finished",
        revealed: false,
        answers: updatedAnswers,
        completedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

/**
 * Aggregates session results and produces comprehensive summary metrics:
 * score, accuracy, by-level breakdown, missed IDs, and review rows.
 */
export function summarizeWordUsageSession(
  session: WordUsageSession,
): WordUsageResultSummary {
  const answerByQuestionId = new Map<string, WordUsageAnswerRecord>();
  for (const ans of session.answers) {
    answerByQuestionId.set(ans.questionId, ans);
  }

  const rows: WordUsageReviewRow[] = session.questions.map((question) => {
    const existing = answerByQuestionId.get(question.id);
    if (existing) {
      return { question, answer: existing };
    }
    const correctOpt = question.options[question.correctOptionIndex];
    return {
      question,
      answer: {
        questionId: question.id,
        itemId: question.itemId,
        chosenOptionIndex: null,
        chosenSentenceJa: null,
        chosenSentenceEn: null,
        correctOptionIndex: question.correctOptionIndex,
        correctSentenceJa: correctOpt.sentenceJa,
        correctSentenceEn: correctOpt.sentenceEn,
        status: "skipped",
        timeMs: 0,
      },
    };
  });

  const total = rows.length;
  const correctCount = rows.filter((r) => r.answer.status === "correct").length;
  const wrongCount = rows.filter((r) => r.answer.status === "wrong").length;
  const skippedCount = rows.filter((r) => r.answer.status === "skipped").length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const totalTimeMs = rows.reduce((acc, r) => acc + (r.answer.timeMs || 0), 0);

  const levelOrder: JlptNumericLevel[] = [5, 4, 3, 2, 1];
  const byLevel: WordUsageLevelBreakdown[] = [];

  for (const jlpt of levelOrder) {
    const levelRows = rows.filter((r) => r.question.jlpt === jlpt);
    if (levelRows.length === 0) continue;
    const lvlCorrect = levelRows.filter((r) => r.answer.status === "correct").length;
    byLevel.push({
      jlpt,
      levelLabel: formatJlptLevel(jlpt),
      total: levelRows.length,
      correct: lvlCorrect,
      accuracy: Math.round((lvlCorrect / levelRows.length) * 100),
    });
  }

  const missedIds = rows
    .filter((r) => r.answer.status !== "correct")
    .map((r) => r.question.itemId);

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    total,
    score: correctCount,
    correctCount,
    wrongCount,
    skippedCount,
    accuracy,
    totalTimeMs,
    byLevel,
    missedIds,
    rows,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? new Date().toISOString(),
  };
}
