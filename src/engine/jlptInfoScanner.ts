// JLPT Game 5: Real-World Info Scanner & Noticeboard Detective (情報検索 スピード検索 — Official JLPT Reading Mondai 4–6)
// Pure engine module — ZERO React, DOM, or window dependencies.

import {
  INFO_SCANNER_DOCUMENTS,
  type InfoBlock,
  type InfoBlockType,
  type InfoScannerCategory,
  type InfoScannerDocument,
  type InfoScannerOption,
  type InfoScannerQuestion,
  type InfoTableColumn,
  type InfoTableRow,
} from "@/data/jlpt/infoScannerData";

export {
  INFO_SCANNER_DOCUMENTS,
  type InfoBlock,
  type InfoBlockType,
  type InfoScannerCategory,
  type InfoScannerDocument,
  type InfoScannerOption,
  type InfoScannerQuestion,
  type InfoTableColumn,
  type InfoTableRow,
};

export type InfoScannerLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type InfoScannerCategoryFilter = "all" | InfoScannerCategory;

export interface InfoScannerSettings {
  levels: InfoScannerLevel[];
  categoryFilter: InfoScannerCategoryFilter;
  documentCount: number; // e.g. 3, 5, 10
  showScenarioEnglish: boolean;
  documentIds?: string[];
}

export interface SessionQuestionItem
  extends Omit<InfoScannerQuestion, "options" | "correctIndex"> {
  options: [InfoScannerOption, InfoScannerOption, InfoScannerOption, InfoScannerOption];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface SessionDocumentItem extends Omit<InfoScannerDocument, "questions"> {
  questions: SessionQuestionItem[];
}

export interface QuestionAnswerRecord {
  questionId: string;
  questionNumber: number;
  chosenOptionIndex: 0 | 1 | 2 | 3 | null;
  correctOptionIndex: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  chosenTextJa: string | null;
  correctTextJa: string;
  evidenceBlockIds: string[];
  explanationJa: string;
  explanationEn: string;
  clueQuoteJa: string;
}

export interface DocumentSessionResult {
  documentId: string;
  status: "answered" | "skipped";
  answers: QuestionAnswerRecord[];
  timeMs: number;
}

export interface InfoScannerSession {
  sessionId: string;
  settings: InfoScannerSettings;
  documents: SessionDocumentItem[];
  currentDocumentIndex: number;
  status: "playing" | "finished";
  documentStatus: "viewing" | "answered" | "skipped";
  selectedOptionByQuestion: (0 | 1 | 2 | 3 | null)[];
  documentResults: DocumentSessionResult[];
  startedAt: string;
  completedAt?: string;
}

export type InfoScannerAction =
  | { type: "SELECT_OPTION"; questionIndex: number; optionIndex: 0 | 1 | 2 | 3 }
  | { type: "SUBMIT_ANSWER"; timeMs: number }
  | { type: "SKIP_DOCUMENT"; timeMs?: number }
  | { type: "NEXT_DOCUMENT"; forDocumentIndex: number }
  | { type: "END" };

export interface ScannerCategoryStat {
  category: InfoScannerCategory;
  labelJa: string;
  labelEn: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface ScannerLevelBreakdown {
  level: InfoScannerLevel;
  total: number;
  correct: number;
  accuracy: number;
}

export interface InfoScannerResultSummary {
  sessionId: string;
  settings: InfoScannerSettings;
  totalDocuments: number;
  perfectDocumentsCount: number;
  totalQuestions: number;
  score: number; // total correct questions
  wrongQuestionsCount: number;
  skippedQuestionsCount: number;
  accuracy: number; // 0 to 100
  totalTimeMs: number;
  categoryBreakdown: ScannerCategoryStat[];
  byLevel: ScannerLevelBreakdown[];
  missedDocumentIds: string[];
  documentResults: DocumentSessionResult[];
  startedAt: string;
  completedAt: string;
}

export const SCANNER_CATEGORY_META: Record<
  InfoScannerCategory,
  { labelJa: string; labelEn: string; description: string }
> = {
  "flyer-store": {
    labelJa: "チラシ・店舗広告",
    labelEn: "Store Flyer & Advertising",
    description: "Time-limited morning sales, bulk purchase conditions, coupon combination rules",
  },
  "memo-notice": {
    labelJa: "伝言メモ・社内連絡",
    labelEn: "Desk Memo & Office Bulletin",
    description: "Urgent call requests, meeting room adjustments, shift swaps, deadline changes",
  },
  "public-guide": {
    labelJa: "公共案内・施設利用",
    labelEn: "Public Guide & Facility Rules",
    description: "Library card registration, recycling sort schedules, clinic appointments, hall fees",
  },
  "schedule-transport": {
    labelJa: "時刻表・日程表",
    labelEn: "Timetable & Route Schedule",
    description: "Express train stop diagrams, bus weekday/weekend tables, flight transit layovers",
  },
  "business-email": {
    labelJa: "業務連絡・お知らせメール",
    labelEn: "Business Email & Inquiries",
    description: "Delivery reschedule confirmations, out-of-stock items, interview booking slots",
  },
  "application-form": {
    labelJa: "募集要項・申込案内",
    labelEn: "Application & Entry Guidelines",
    description: "Volunteer language classes, contest criteria, age brackets, fee waiver clauses",
  },
};

export const INFO_SCANNER_LEVELS: readonly InfoScannerLevel[] = [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
] as const;

export const INFO_SCANNER_CATEGORIES: readonly InfoScannerCategory[] = [
  "flyer-store",
  "memo-notice",
  "public-guide",
  "schedule-transport",
  "business-email",
  "application-form",
] as const;

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
 * Prepares a document for gameplay by shuffling each question's 4 options
 * and recalculating correctIndex.
 */
export function prepareSessionDocument(
  doc: InfoScannerDocument,
  rng: () => number = Math.random
): SessionDocumentItem {
  const shuffledQuestions: SessionQuestionItem[] = doc.questions.map((q) => {
    const originalCorrect = q.options[q.correctIndex];
    const shuffledOptions = shuffleWithRng(q.options, rng) as [
      InfoScannerOption,
      InfoScannerOption,
      InfoScannerOption,
      InfoScannerOption,
    ];
    const newCorrectIndex = shuffledOptions.findIndex(
      (opt) => opt.id === originalCorrect.id
    );

    return {
      ...q,
      options: shuffledOptions,
      correctIndex: (newCorrectIndex >= 0 ? newCorrectIndex : 0) as 0 | 1 | 2 | 3,
    };
  });

  return {
    ...doc,
    questions: shuffledQuestions,
  };
}

/**
 * Creates a deterministic Info Scanner game session.
 */
export function createInfoScannerSession(
  pool: readonly InfoScannerDocument[] = INFO_SCANNER_DOCUMENTS,
  settings: InfoScannerSettings,
  rng: () => number = Math.random
): InfoScannerSession {
  let eligible: InfoScannerDocument[] = [];

  if (settings.documentIds && settings.documentIds.length > 0) {
    const idSet = new Set(settings.documentIds);
    eligible = pool.filter((d) => idSet.has(d.id));
  } else {
    const levelSet = new Set(settings.levels);
    eligible = pool.filter((d) => {
      if (!levelSet.has(d.level)) return false;
      if (settings.categoryFilter !== "all" && d.category !== settings.categoryFilter) {
        return false;
      }
      return true;
    });
  }

  if (eligible.length === 0) {
    eligible = [...pool];
  }

  const shuffledPool = shuffleWithRng(eligible, rng);
  const targetCount = Math.min(settings.documentCount, shuffledPool.length);
  const selectedDocs = shuffledPool
    .slice(0, targetCount)
    .map((d) => prepareSessionDocument(d, rng));

  const firstDoc = selectedDocs[0];
  const firstQCount = firstDoc ? firstDoc.questions.length : 0;

  return {
    sessionId: `scanner-${Date.now()}-${Math.floor(rng() * 1000000)}`,
    settings,
    documents: selectedDocs,
    currentDocumentIndex: 0,
    status: "playing",
    documentStatus: "viewing",
    selectedOptionByQuestion: Array(firstQCount).fill(null),
    documentResults: [],
    startedAt: new Date().toISOString(),
  };
}

/**
 * Pure reducer function driving the Info Scanner session lifecycle.
 */
export function infoScannerReducer(
  state: InfoScannerSession,
  action: InfoScannerAction
): InfoScannerSession {
  if (state.status === "finished") {
    return state;
  }

  const currentDoc = state.documents[state.currentDocumentIndex];
  if (!currentDoc) {
    return {
      ...state,
      status: "finished",
      completedAt: state.completedAt ?? new Date().toISOString(),
    };
  }

  switch (action.type) {
    case "SELECT_OPTION": {
      // Repeat or changed answer attempts are ignored once answered or skipped
      if (state.documentStatus !== "viewing") {
        return state;
      }

      if (
        action.questionIndex < 0 ||
        action.questionIndex >= currentDoc.questions.length
      ) {
        return state;
      }

      const nextSelected = [...state.selectedOptionByQuestion];
      nextSelected[action.questionIndex] = action.optionIndex;

      return {
        ...state,
        selectedOptionByQuestion: nextSelected,
      };
    }

    case "SUBMIT_ANSWER": {
      if (state.documentStatus !== "viewing") {
        return state;
      }

      // Must have answered all questions in the current document
      const hasUnanswered = state.selectedOptionByQuestion.some((ans) => ans === null);
      if (hasUnanswered) {
        return state;
      }

      const answers: QuestionAnswerRecord[] = currentDoc.questions.map((q, idx) => {
        const chosen = state.selectedOptionByQuestion[idx] ?? null;
        const correct = q.correctIndex;
        const isCorrect = chosen === correct;
        const chosenOption = chosen !== null ? q.options[chosen] : null;
        const correctOption = q.options[correct];

        return {
          questionId: q.id,
          questionNumber: q.questionNumber,
          chosenOptionIndex: chosen,
          correctOptionIndex: correct,
          isCorrect,
          chosenTextJa: chosenOption ? chosenOption.ja : null,
          correctTextJa: correctOption ? correctOption.ja : "",
          evidenceBlockIds: q.evidenceBlockIds,
          explanationJa: q.explanationJa,
          explanationEn: q.explanationEn,
          clueQuoteJa: q.clueQuoteJa,
        };
      });

      const docResult: DocumentSessionResult = {
        documentId: currentDoc.id,
        status: "answered",
        answers,
        timeMs: Math.max(0, action.timeMs),
      };

      return {
        ...state,
        documentStatus: "answered",
        documentResults: [...state.documentResults, docResult],
      };
    }

    case "SKIP_DOCUMENT": {
      if (state.documentStatus !== "viewing") {
        return state;
      }

      const answers: QuestionAnswerRecord[] = currentDoc.questions.map((q) => {
        const correct = q.correctIndex;
        const correctOption = q.options[correct];

        return {
          questionId: q.id,
          questionNumber: q.questionNumber,
          chosenOptionIndex: null,
          correctOptionIndex: correct,
          isCorrect: false,
          chosenTextJa: null,
          correctTextJa: correctOption ? correctOption.ja : "",
          evidenceBlockIds: q.evidenceBlockIds,
          explanationJa: q.explanationJa,
          explanationEn: q.explanationEn,
          clueQuoteJa: q.clueQuoteJa,
        };
      });

      const docResult: DocumentSessionResult = {
        documentId: currentDoc.id,
        status: "skipped",
        answers,
        timeMs: Math.max(0, action.timeMs ?? 0),
      };

      return {
        ...state,
        documentStatus: "skipped",
        documentResults: [...state.documentResults, docResult],
      };
    }

    case "NEXT_DOCUMENT": {
      // Guard against stale next actions
      if (action.forDocumentIndex !== state.currentDocumentIndex) {
        return state;
      }

      // Must be answered or skipped before advancing
      if (state.documentStatus === "viewing") {
        return state;
      }

      const nextIndex = state.currentDocumentIndex + 1;
      if (nextIndex >= state.documents.length) {
        return {
          ...state,
          status: "finished",
          completedAt: new Date().toISOString(),
        };
      }

      const nextDoc = state.documents[nextIndex];
      const nextQCount = nextDoc ? nextDoc.questions.length : 0;

      return {
        ...state,
        currentDocumentIndex: nextIndex,
        documentStatus: "viewing",
        selectedOptionByQuestion: Array(nextQCount).fill(null),
      };
    }

    case "END": {
      return {
        ...state,
        status: "finished",
        completedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

/**
 * Calculates accurate aggregated result summary for an Info Scanner session.
 */
export function calculateInfoScannerResult(
  session: InfoScannerSession
): InfoScannerResultSummary {
  let totalQuestions = 0;
  let correctQuestions = 0;
  let skippedQuestions = 0;
  let wrongQuestions = 0;
  let perfectDocumentsCount = 0;
  let totalTimeMs = 0;

  const categoryTotals: Record<InfoScannerCategory, { total: number; correct: number }> = {
    "flyer-store": { total: 0, correct: 0 },
    "memo-notice": { total: 0, correct: 0 },
    "public-guide": { total: 0, correct: 0 },
    "schedule-transport": { total: 0, correct: 0 },
    "business-email": { total: 0, correct: 0 },
    "application-form": { total: 0, correct: 0 },
  };

  const levelTotals: Record<InfoScannerLevel, { total: number; correct: number }> = {
    N5: { total: 0, correct: 0 },
    N4: { total: 0, correct: 0 },
    N3: { total: 0, correct: 0 },
    N2: { total: 0, correct: 0 },
    N1: { total: 0, correct: 0 },
  };

  const missedDocIds: string[] = [];
  const resultsByDocId = new Map(session.documentResults.map((r) => [r.documentId, r]));

  for (const doc of session.documents) {
    const res = resultsByDocId.get(doc.id);
    let allDocQuestionsCorrect = true;

    for (let i = 0; i < doc.questions.length; i++) {
      const q = doc.questions[i];
      totalQuestions += 1;
      categoryTotals[doc.category].total += 1;
      levelTotals[doc.level].total += 1;

      const ans = res?.answers.find((a) => a.questionId === q.id);

      if (!res || res.status === "skipped" || ans?.chosenOptionIndex === null) {
        skippedQuestions += 1;
        allDocQuestionsCorrect = false;
      } else if (ans?.isCorrect) {
        correctQuestions += 1;
        categoryTotals[doc.category].correct += 1;
        levelTotals[doc.level].correct += 1;
      } else {
        wrongQuestions += 1;
        allDocQuestionsCorrect = false;
      }
    }

    if (res) {
      totalTimeMs += res.timeMs;
    }

    if (allDocQuestionsCorrect && doc.questions.length > 0) {
      perfectDocumentsCount += 1;
    } else {
      missedDocIds.push(doc.id);
    }
  }

  const accuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  const categoryBreakdown: ScannerCategoryStat[] = (
    Object.keys(categoryTotals) as InfoScannerCategory[]
  ).map((cat) => {
    const data = categoryTotals[cat];
    const meta = SCANNER_CATEGORY_META[cat];
    const catAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

    return {
      category: cat,
      labelJa: meta.labelJa,
      labelEn: meta.labelEn,
      total: data.total,
      correct: data.correct,
      accuracy: catAcc,
    };
  });

  const byLevel: ScannerLevelBreakdown[] = (["N5", "N4", "N3", "N2", "N1"] as InfoScannerLevel[]).map(
    (lvl) => {
      const data = levelTotals[lvl];
      const lvlAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

      return {
        level: lvl,
        total: data.total,
        correct: data.correct,
        accuracy: lvlAcc,
      };
    }
  );

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    totalDocuments: session.documents.length,
    perfectDocumentsCount,
    totalQuestions,
    score: correctQuestions,
    wrongQuestionsCount: wrongQuestions,
    skippedQuestionsCount: skippedQuestions,
    accuracy,
    totalTimeMs,
    categoryBreakdown,
    byLevel,
    missedDocumentIds: missedDocIds,
    documentResults: session.documentResults,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? new Date().toISOString(),
  };
}

/**
 * Returns available counts of documents and questions per level.
 */
export function getInfoScannerCountsByLevel(
  pool: readonly InfoScannerDocument[] = INFO_SCANNER_DOCUMENTS,
  categoryFilter: InfoScannerCategoryFilter = "all"
): Record<InfoScannerLevel, { documents: number; questions: number }> {
  const counts: Record<InfoScannerLevel, { documents: number; questions: number }> = {
    N5: { documents: 0, questions: 0 },
    N4: { documents: 0, questions: 0 },
    N3: { documents: 0, questions: 0 },
    N2: { documents: 0, questions: 0 },
    N1: { documents: 0, questions: 0 },
  };

  for (const doc of pool) {
    if (categoryFilter !== "all" && doc.category !== categoryFilter) {
      continue;
    }

    if (counts[doc.level]) {
      counts[doc.level].documents += 1;
      counts[doc.level].questions += doc.questions.length;
    }
  }

  return counts;
}
