import {
  INSTANT_REPLY_ITEMS,
  type InstantReplyItem,
  type InstantReplyOptionData,
  type TrapCategory,
} from "@/data/jlpt/instantReplyData";

export {
  INSTANT_REPLY_ITEMS,
  type InstantReplyItem,
  type InstantReplyOptionData,
  type TrapCategory,
};

export type JlptNumericLevel = 5 | 4 | 3 | 2 | 1;
export type JlptLabelLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type InstantReplyCategory = "quick-response" | "situational-utterance";
export type TimerPreset = 8 | 12 | 0; // 8s Exam Blitz, 12s Relaxed, 0 = Untimed
export type InstantReplySessionSize = 10 | 15 | 20;
export type InstantReplyRoundStatus =
  | "pending"
  | "correct"
  | "wrong"
  | "timeout"
  | "skipped";

export interface InstantReplySettings {
  levels: (5 | 4 | 3 | 2 | 1)[];
  size: InstantReplySessionSize;
  timerSeconds: TimerPreset;
  autoSequenceAudio: boolean;
  showSituationHint: boolean;
  category?: "all" | InstantReplyCategory;
  questionIds?: string[];
}

export interface InstantReplyOption {
  index: 0 | 1 | 2;
  optionNumber: 1 | 2 | 3;
  id: string;
  ja: string;
  reading: string;
  furigana: string;
  en: string;
  isCorrect: boolean;
  trapType?: TrapCategory;
  explanation: string;
}

export interface InstantReplyQuestion {
  id: string;
  itemId: string;
  category: InstantReplyCategory;
  jlpt: 5 | 4 | 3 | 2 | 1;
  levelLabel: JlptLabelLevel;
  situationContext: string;
  speakerRole: string;
  promptJa: string;
  promptReading: string;
  promptFurigana: string;
  promptEn: string;
  correctOptionIndex: 0 | 1 | 2;
  options: [InstantReplyOption, InstantReplyOption, InstantReplyOption];
  status: InstantReplyRoundStatus;
  chosenIndex: 0 | 1 | 2 | null;
  trapTriggered: TrapCategory | null;
  timeMs: number;
  replaysUsed: number;
}

export interface InstantReplySession {
  sessionId: string;
  settings: InstantReplySettings;
  questions: InstantReplyQuestion[];
  index: number;
  status: "playing" | "finished";
  score: number;
  revealed: boolean;
  startedAt: string;
  completedAt?: string;
}

export type InstantReplyAction =
  | { type: "ANSWER"; optionIndex: 0 | 1 | 2; timeMs: number }
  | { type: "TIMEOUT"; timeMs: number }
  | { type: "SKIP"; timeMs?: number }
  | { type: "INCREMENT_REPLAY" }
  | { type: "NEXT"; forIndex: number }
  | { type: "END" };

export interface InstantReplyTrapStat {
  trapType: TrapCategory;
  label: string;
  count: number;
}

export interface InstantReplySessionResult {
  sessionId: string;
  settings: InstantReplySettings;
  total: number;
  score: number;
  passedCount: number;
  wrongCount: number;
  timeoutCount: number;
  skippedCount: number;
  accuracy: number;
  avgResponseTimeMs: number;
  totalTimeMs: number;
  trapBreakdown: InstantReplyTrapStat[];
  missedIds: string[];
  questions: InstantReplyQuestion[];
  startedAt: string;
  completedAt: string;
}

export const TRAP_CATEGORY_LABELS: Record<TrapCategory, string> = {
  "keigo-mismatch": "Keigo Mismatch (敬語の誤用)",
  "homophone-trap": "Homophone Trap (同音・類音トラップ)",
  "register-mismatch": "Register / Set-Phrase Trap (場面・表現の不一致)",
  "wrong-intent": "Wrong Speaker Intent (意図の取り違え)",
  "grammar-tense-trap": "Grammar / Tense Trap (時制・文法の不一致)",
};

export function formatJlptLevel(jlpt: 5 | 4 | 3 | 2 | 1): JlptLabelLevel {
  return `N${jlpt}` as JlptLabelLevel;
}

export function getInstantReplyCountsByLevel(
  pool: readonly InstantReplyItem[] = INSTANT_REPLY_ITEMS,
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

export function buildInstantReplyQuestion(
  item: InstantReplyItem,
  rng: () => number = Math.random,
): InstantReplyQuestion {
  const shuffledOpts = shuffleWithRng(item.options, rng);
  let correctOptionIndex: 0 | 1 | 2 = 0;

  const options = shuffledOpts.map((opt, idx) => {
    const optionIndex = idx as 0 | 1 | 2;
    if (opt.isCorrect) {
      correctOptionIndex = optionIndex;
    }
    return {
      index: optionIndex,
      optionNumber: (idx + 1) as 1 | 2 | 3,
      id: opt.id,
      ja: opt.ja,
      reading: opt.reading,
      furigana: opt.furigana ?? opt.ja,
      en: opt.en,
      isCorrect: opt.isCorrect,
      ...(opt.trapType ? { trapType: opt.trapType } : {}),
      explanation: opt.explanation,
    };
  }) as [InstantReplyOption, InstantReplyOption, InstantReplyOption];

  return {
    id: item.id,
    itemId: item.id,
    category: item.category ?? "quick-response",
    jlpt: item.jlpt,
    levelLabel: formatJlptLevel(item.jlpt),
    situationContext: item.situationContext,
    speakerRole: item.speakerRole,
    promptJa: item.promptJa,
    promptReading: item.promptReading,
    promptFurigana: item.promptFurigana ?? item.promptJa,
    promptEn: item.promptEn,
    correctOptionIndex,
    options,
    status: "pending",
    chosenIndex: null,
    trapTriggered: null,
    timeMs: 0,
    replaysUsed: 0,
  };
}

export function createInstantReplySession(
  pool: readonly InstantReplyItem[],
  settings: InstantReplySettings,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: string = new Date().toISOString(),
): InstantReplySession {
  const sourcePool = pool.length > 0 ? pool : INSTANT_REPLY_ITEMS;
  const allowedLevels = new Set<number>(
    settings.levels && settings.levels.length > 0 ? settings.levels : [5],
  );
  const targetIdSet =
    settings.questionIds && settings.questionIds.length > 0
      ? new Set(settings.questionIds)
      : null;

  let filtered = sourcePool.filter((item) => {
    if (targetIdSet) return targetIdSet.has(item.id);
    if (!allowedLevels.has(item.jlpt)) return false;
    if (settings.category && settings.category !== "all") {
      return (item.category ?? "quick-response") === settings.category;
    }
    return true;
  });
  if (filtered.length === 0) {
    filtered = [...sourcePool];
  }

  const shuffledItems = shuffleWithRng(filtered, rng);
  const pickedItems = shuffledItems.slice(0, Math.min(settings.size, shuffledItems.length));
  const questions = pickedItems.map((item) => buildInstantReplyQuestion(item, rng));

  const generatedId =
    sessionId ??
    `reply-${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;

  return {
    sessionId: generatedId,
    settings,
    questions,
    index: 0,
    status: questions.length > 0 ? "playing" : "finished",
    score: 0,
    revealed: false,
    startedAt,
  };
}

export function instantReplyReducer(
  state: InstantReplySession,
  action: InstantReplyAction,
): InstantReplySession {
  if (state.status === "finished") {
    return state;
  }

  const currentQuestion = state.questions[state.index];
  if (!currentQuestion) {
    return {
      ...state,
      status: "finished",
      completedAt: state.completedAt ?? new Date().toISOString(),
    };
  }

  switch (action.type) {
    case "ANSWER": {
      if (state.revealed || currentQuestion.status !== "pending") {
        return state;
      }
      if (action.optionIndex < 0 || action.optionIndex > 2) {
        return state;
      }

      const chosen = currentQuestion.options[action.optionIndex];
      const isCorrect = action.optionIndex === currentQuestion.correctOptionIndex;
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.index] = {
        ...currentQuestion,
        status: isCorrect ? "correct" : "wrong",
        chosenIndex: action.optionIndex,
        trapTriggered: isCorrect ? null : (chosen.trapType ?? "wrong-intent"),
        timeMs: Math.max(0, Math.round(action.timeMs || 0)),
      };

      return {
        ...state,
        questions: updatedQuestions,
        score: isCorrect ? state.score + 1 : state.score,
        revealed: true,
      };
    }

    case "TIMEOUT": {
      if (state.revealed || currentQuestion.status !== "pending") {
        return state;
      }
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.index] = {
        ...currentQuestion,
        status: "timeout",
        chosenIndex: null,
        trapTriggered: null,
        timeMs: Math.max(0, Math.round(action.timeMs || 0)),
      };

      return {
        ...state,
        questions: updatedQuestions,
        revealed: true,
      };
    }

    case "SKIP": {
      if (state.revealed || currentQuestion.status !== "pending") {
        return state;
      }
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.index] = {
        ...currentQuestion,
        status: "skipped",
        chosenIndex: null,
        trapTriggered: null,
        timeMs: Math.max(0, Math.round(action.timeMs ?? 0)),
      };

      return {
        ...state,
        questions: updatedQuestions,
        revealed: true,
      };
    }

    case "INCREMENT_REPLAY": {
      const updatedQuestions = [...state.questions];
      updatedQuestions[state.index] = {
        ...currentQuestion,
        replaysUsed: currentQuestion.replaysUsed + 1,
      };
      return {
        ...state,
        questions: updatedQuestions,
      };
    }

    case "NEXT": {
      if (!state.revealed || action.forIndex !== state.index) {
        return state;
      }
      const nextIndex = state.index + 1;
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
        index: nextIndex,
        revealed: false,
      };
    }

    case "END": {
      const updatedQuestions = state.questions.map((q) =>
        q.status === "pending" ? { ...q, status: "skipped" as const } : q,
      );
      return {
        ...state,
        questions: updatedQuestions,
        status: "finished",
        revealed: false,
        completedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

export function summarizeInstantReplySession(
  session: InstantReplySession,
): InstantReplySessionResult {
  const finalizedQuestions = session.questions.map((q) =>
    q.status === "pending" ? { ...q, status: "skipped" as const } : q,
  );

  const total = finalizedQuestions.length;
  const passedCount = finalizedQuestions.filter((q) => q.status === "correct").length;
  const wrongCount = finalizedQuestions.filter((q) => q.status === "wrong").length;
  const timeoutCount = finalizedQuestions.filter((q) => q.status === "timeout").length;
  const skippedCount = finalizedQuestions.filter((q) => q.status === "skipped").length;
  const accuracy = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  const answeredQuestions = finalizedQuestions.filter(
    (q) => q.status === "correct" || q.status === "wrong",
  );
  const totalTimeMs = finalizedQuestions.reduce((acc, q) => acc + (q.timeMs || 0), 0);
  const avgResponseTimeMs =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((acc, q) => acc + (q.timeMs || 0), 0) /
            answeredQuestions.length,
        )
      : 0;

  const trapCounts = new Map<TrapCategory, number>();
  for (const q of finalizedQuestions) {
    if (q.trapTriggered) {
      trapCounts.set(q.trapTriggered, (trapCounts.get(q.trapTriggered) ?? 0) + 1);
    }
  }

  const trapBreakdown: InstantReplyTrapStat[] = Array.from(trapCounts.entries())
    .map(([trapType, count]) => ({
      trapType,
      label: TRAP_CATEGORY_LABELS[trapType],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const missedIds = finalizedQuestions
    .filter((q) => q.status !== "correct")
    .map((q) => q.itemId);

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    total,
    score: passedCount,
    passedCount,
    wrongCount,
    timeoutCount,
    skippedCount,
    accuracy,
    avgResponseTimeMs,
    totalTimeMs,
    trapBreakdown,
    missedIds,
    questions: finalizedQuestions,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? new Date().toISOString(),
  };
}
