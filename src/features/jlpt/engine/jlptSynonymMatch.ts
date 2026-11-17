import {
  SYNONYM_MATCH_ITEMS,
  type SynonymCandidate,
  type SynonymMatchItem,
} from "@/data/jlpt/synonymMatchData";

export {
  SYNONYM_MATCH_ITEMS,
  type SynonymCandidate,
  type SynonymMatchItem,
};

export type JlptNumericLevel = 5 | 4 | 3 | 2 | 1;
export type JlptLabelLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type DisplayScriptMode = "exam-authentic" | "with-furigana";
export type SynonymMatchSessionSize = 10 | 15 | 20;

export interface SynonymMatchSettings {
  levels: (5 | 4 | 3 | 2 | 1)[];
  size: SynonymMatchSessionSize;
  scriptMode: DisplayScriptMode;
  showSentenceTranslationHint: boolean;
  questionIds?: string[];
}

export interface SynonymMatchOption {
  index: 0 | 1 | 2 | 3;
  optionNumber: 1 | 2 | 3 | 4;
  word: string;
  reading: string;
  meaningEn: string;
  furigana: string;
  isCorrect: boolean;
}

export interface SynonymMatchQuestion {
  id: string;
  itemId: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  levelLabel: JlptLabelLevel;
  sentenceJa: string;
  prefix: string;
  targetSurface: string;
  suffix: string;
  sentenceEn: string;
  targetWord: string;
  targetReading: string;
  targetMeaningEn: string;
  correctSynonym: SynonymCandidate;
  sharedNuanceNote: string;
  prefixFurigana: string;
  targetFurigana: string;
  suffixFurigana: string;
  sentenceFurigana: string;
  correctOptionIndex: 0 | 1 | 2 | 3;
  options: [
    SynonymMatchOption,
    SynonymMatchOption,
    SynonymMatchOption,
    SynonymMatchOption,
  ];
}

export interface SynonymMatchAnswerRecord {
  questionId: string;
  itemId: string;
  chosenOptionIndex: 0 | 1 | 2 | 3 | null;
  chosenWord: string | null;
  chosenReading: string | null;
  chosenMeaningEn: string | null;
  correctWord: string;
  correctReading: string;
  correctMeaningEn: string;
  status: "correct" | "wrong" | "skipped";
  timeMs: number;
}

export interface SynonymMatchSession {
  sessionId: string;
  settings: SynonymMatchSettings;
  questions: SynonymMatchQuestion[];
  currentIndex: number;
  status: "playing" | "finished";
  score: number;
  revealed: boolean;
  answers: SynonymMatchAnswerRecord[];
  startedAt: string;
  completedAt?: string;
}

export type SynonymMatchAction =
  | { type: "ANSWER"; optionIndex: 0 | 1 | 2 | 3; timeMs: number }
  | { type: "SKIP"; timeMs?: number }
  | { type: "NEXT"; forIndex: number }
  | { type: "END" };

export interface SynonymMatchReviewRow {
  question: SynonymMatchQuestion;
  answer: SynonymMatchAnswerRecord;
}

export interface SynonymMatchLevelBreakdown {
  jlpt: 5 | 4 | 3 | 2 | 1;
  levelLabel: JlptLabelLevel;
  total: number;
  correct: number;
  accuracy: number;
}

export interface SynonymMatchResultSummary {
  sessionId: string;
  settings: SynonymMatchSettings;
  total: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  totalTimeMs: number;
  byLevel: SynonymMatchLevelBreakdown[];
  missedIds: string[];
  rows: SynonymMatchReviewRow[];
  startedAt: string;
  completedAt: string;
}

export function formatJlptLevel(jlpt: 5 | 4 | 3 | 2 | 1): JlptLabelLevel {
  return `N${jlpt}` as JlptLabelLevel;
}

export function getSynonymMatchCountsByLevel(
  pool: readonly SynonymMatchItem[] = SYNONYM_MATCH_ITEMS,
): Record<JlptLabelLevel, number> {
  const counts: Record<JlptLabelLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  };
  for (const item of pool) {
    const label = formatJlptLevel(item.jlpt);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
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

function toFuriganaString(word: string, reading: string, existing?: string): string {
  if (existing) return existing;
  const hasKanji = /[\u4E00-\u9FFF]/.test(word);
  if (!hasKanji || !reading || word === reading) return word;
  return `{${word}|${reading}}`;
}

export function buildSynonymMatchQuestion(
  item: SynonymMatchItem,
  rng: () => number = Math.random,
): SynonymMatchQuestion {
  const rawCandidates: Array<{ candidate: SynonymCandidate; isCorrect: boolean }> = [
    { candidate: item.correctSynonym, isCorrect: true },
    { candidate: item.distractors[0], isCorrect: false },
    { candidate: item.distractors[1], isCorrect: false },
    { candidate: item.distractors[2], isCorrect: false },
  ];

  const shuffled = shuffleWithRng(rawCandidates, rng);
  let correctOptionIndex: 0 | 1 | 2 | 3 = 0;

  const options = shuffled.map((entry, idx) => {
    const optionIndex = idx as 0 | 1 | 2 | 3;
    if (entry.isCorrect) {
      correctOptionIndex = optionIndex;
    }
    return {
      index: optionIndex,
      optionNumber: (idx + 1) as 1 | 2 | 3 | 4,
      word: entry.candidate.word,
      reading: entry.candidate.reading,
      meaningEn: entry.candidate.meaningEn,
      furigana: toFuriganaString(
        entry.candidate.word,
        entry.candidate.reading,
        entry.candidate.furigana,
      ),
      isCorrect: entry.isCorrect,
    };
  }) as [
    SynonymMatchOption,
    SynonymMatchOption,
    SynonymMatchOption,
    SynonymMatchOption,
  ];

  const prefixFurigana = item.prefixFurigana ?? item.prefix;
  const targetFurigana =
    item.targetFurigana ?? toFuriganaString(item.targetSurface, item.targetReading);
  const suffixFurigana = item.suffixFurigana ?? item.suffix;

  return {
    id: item.id,
    itemId: item.id,
    jlpt: item.jlpt,
    levelLabel: formatJlptLevel(item.jlpt),
    sentenceJa: item.sentenceJa,
    prefix: item.prefix,
    targetSurface: item.targetSurface,
    suffix: item.suffix,
    sentenceEn: item.sentenceEn,
    targetWord: item.targetWord,
    targetReading: item.targetReading,
    targetMeaningEn: item.targetMeaningEn,
    correctSynonym: item.correctSynonym,
    sharedNuanceNote: item.sharedNuanceNote,
    prefixFurigana,
    targetFurigana,
    suffixFurigana,
    sentenceFurigana:
      item.sentenceFurigana ?? `${prefixFurigana}${targetFurigana}${suffixFurigana}`,
    correctOptionIndex,
    options,
  };
}

export function createSynonymMatchSession(
  pool: readonly SynonymMatchItem[],
  settings: SynonymMatchSettings,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: string = new Date().toISOString(),
): SynonymMatchSession {
  const sourcePool = pool.length > 0 ? pool : SYNONYM_MATCH_ITEMS;
  const allowedLevels = new Set<number>(
    settings.levels && settings.levels.length > 0 ? settings.levels : [5],
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
  const pickedItems = shuffledItems.slice(0, Math.min(settings.size, shuffledItems.length));
  const questions = pickedItems.map((item) => buildSynonymMatchQuestion(item, rng));

  const generatedId =
    sessionId ??
    `synonym-${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;

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

export function synonymMatchReducer(
  state: SynonymMatchSession,
  action: SynonymMatchAction,
): SynonymMatchSession {
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
      // One attempt per question; ignore repeat ANSWER while revealed
      if (state.revealed) {
        return state;
      }
      if (action.optionIndex < 0 || action.optionIndex > 3) {
        return state;
      }

      const chosen = currentQuestion.options[action.optionIndex];
      const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
      const isCorrect = action.optionIndex === currentQuestion.correctOptionIndex;

      const record: SynonymMatchAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        chosenOptionIndex: action.optionIndex,
        chosenWord: chosen.word,
        chosenReading: chosen.reading,
        chosenMeaningEn: chosen.meaningEn,
        correctWord: correctOpt.word,
        correctReading: correctOpt.reading,
        correctMeaningEn: correctOpt.meaningEn,
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
      if (state.revealed) {
        return state;
      }
      const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
      const record: SynonymMatchAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        chosenOptionIndex: null,
        chosenWord: null,
        chosenReading: null,
        chosenMeaningEn: null,
        correctWord: correctOpt.word,
        correctReading: correctOpt.reading,
        correctMeaningEn: correctOpt.meaningEn,
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
      // Guard against stale NEXT dispatches
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
      // If current question hasn't been recorded yet, mark remaining as skipped or just close
      if (!state.revealed && updatedAnswers.length === state.currentIndex && currentQuestion) {
        const correctOpt = currentQuestion.options[currentQuestion.correctOptionIndex];
        updatedAnswers.push({
          questionId: currentQuestion.id,
          itemId: currentQuestion.itemId,
          chosenOptionIndex: null,
          chosenWord: null,
          chosenReading: null,
          chosenMeaningEn: null,
          correctWord: correctOpt.word,
          correctReading: correctOpt.reading,
          correctMeaningEn: correctOpt.meaningEn,
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

export function summarizeSynonymMatchSession(
  session: SynonymMatchSession,
): SynonymMatchResultSummary {
  const answerByQuestionId = new Map<string, SynonymMatchAnswerRecord>();
  for (const ans of session.answers) {
    answerByQuestionId.set(ans.questionId, ans);
  }

  const rows: SynonymMatchReviewRow[] = session.questions.map((question) => {
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
        chosenWord: null,
        chosenReading: null,
        chosenMeaningEn: null,
        correctWord: correctOpt.word,
        correctReading: correctOpt.reading,
        correctMeaningEn: correctOpt.meaningEn,
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

  const levelOrder: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];
  const byLevel: SynonymMatchLevelBreakdown[] = [];

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
