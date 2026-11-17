import {
  PARAGRAPH_CLOZE_PASSAGES,
  type ClozeBlankItem,
  type ClozeBlankOption,
  type ClozeSentence,
  type ClozeSentenceSegment,
  type ClozeSourceType,
  type DiscourseGrammarCategory,
  type ParagraphClozePassage,
} from "@/data/jlpt/paragraphClozeData";

export {
  PARAGRAPH_CLOZE_PASSAGES,
  type ClozeBlankItem,
  type ClozeBlankOption,
  type ClozeSentence,
  type ClozeSentenceSegment,
  type ClozeSourceType,
  type DiscourseGrammarCategory,
  type ParagraphClozePassage,
};

export type JlptNumericLevel = 5 | 4 | 3 | 2 | 1;
export type JlptLabelLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ClozeSourceFilter = "all" | "exam-only" | "story-scenes";

export interface ParagraphClozeSettings {
  levels: JlptNumericLevel[];
  sourceFilter: ClozeSourceFilter;
  passageCount: 1 | 2 | 3 | 5;
  showEnglishSentenceHints: boolean;
  passageIds?: string[];
}

export interface PassageBlankAnswerRecord {
  blankIndex: number;
  displayNumber: number;
  category: DiscourseGrammarCategory;
  chosenOptionIndex: 0 | 1 | 2 | 3 | null;
  correctOptionIndex: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  chosenTextJa: string | null;
  correctTextJa: string;
  discourseRuleEn: string;
  contextClueQuoteJa: string;
}

export interface PassageSessionResult {
  passageId: string;
  status: "submitted" | "skipped";
  answers: PassageBlankAnswerRecord[];
  timeMs: number;
}

export interface ParagraphClozeSession {
  sessionId: string;
  settings: ParagraphClozeSettings;
  passages: ParagraphClozePassage[];
  currentPassageIndex: number;
  status: "playing" | "finished";
  activeBlankIndex: number;
  selectedOptionByBlank: (number | null)[];
  passageStatus: "filling" | "submitted" | "skipped";
  passageResults: PassageSessionResult[];
  startedAt: string;
  completedAt?: string;
}

export type ParagraphClozeAction =
  | { type: "FOCUS_BLANK"; blankIndex: number }
  | { type: "SELECT_OPTION"; blankIndex: number; optionIndex: 0 | 1 | 2 | 3 }
  | { type: "SUBMIT_PASSAGE"; timeMs: number }
  | { type: "SKIP_PASSAGE"; timeMs?: number }
  | { type: "NEXT_PASSAGE"; forPassageIndex: number }
  | { type: "END" };

export interface DiscourseCategoryStat {
  category: DiscourseGrammarCategory;
  labelJa: string;
  labelEn: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface ParagraphClozeLevelBreakdown {
  level: JlptNumericLevel;
  levelLabel: JlptLabelLevel;
  totalBlanks: number;
  correctBlanks: number;
  accuracy: number;
}

export interface ParagraphClozeResultSummary {
  sessionId: string;
  settings: ParagraphClozeSettings;
  totalPassages: number;
  perfectPassagesCount: number;
  totalBlanks: number;
  score: number; // total correct blanks
  wrongBlanksCount: number;
  skippedBlanksCount: number;
  accuracy: number; // 0 to 100
  totalTimeMs: number;
  categoryBreakdown: DiscourseCategoryStat[];
  byLevel: ParagraphClozeLevelBreakdown[];
  missedPassageIds: string[];
  passageResults: Array<{
    passage: ParagraphClozePassage;
    status: "submitted" | "skipped";
    answers: PassageBlankAnswerRecord[];
    timeMs: number;
  }>;
  startedAt: string;
  completedAt: string;
}

export const DISCOURSE_CATEGORY_META: Record<
  DiscourseGrammarCategory,
  { labelJa: string; labelEn: string }
> = {
  conjunction: {
    labelJa: "接続詞",
    labelEn: "Conjunctions & Connectors",
  },
  "deixis-perspective": {
    labelJa: "視点・授受表現",
    labelEn: "Perspective & Deixis",
  },
  demonstrative: {
    labelJa: "こそあど指示詞",
    labelEn: "Demonstratives (Anaphora)",
  },
  "particles-topic": {
    labelJa: "助詞・主題",
    labelEn: "Discourse Particles & Topic",
  },
  "modality-ending": {
    labelJa: "文末表現・モダリティ",
    labelEn: "Modality & Sentence Endings",
  },
};

export function formatJlptLevel(jlpt: 5 | 4 | 3 | 2 | 1): JlptLabelLevel {
  return `N${jlpt}` as JlptLabelLevel;
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

export function getParagraphClozeCountsByLevel(
  pool: readonly ParagraphClozePassage[] = PARAGRAPH_CLOZE_PASSAGES,
  sourceFilter: ClozeSourceFilter = "all"
): Record<JlptLabelLevel, { passages: number; blanks: number }> {
  const counts: Record<JlptLabelLevel, { passages: number; blanks: number }> = {
    N5: { passages: 0, blanks: 0 },
    N4: { passages: 0, blanks: 0 },
    N3: { passages: 0, blanks: 0 },
    N2: { passages: 0, blanks: 0 },
    N1: { passages: 0, blanks: 0 },
  };

  for (const item of pool) {
    if (sourceFilter === "exam-only" && item.sourceType === "story-scene") {
      continue;
    }
    if (sourceFilter === "story-scenes" && item.sourceType !== "story-scene") {
      continue;
    }

    const label = formatJlptLevel(item.jlpt);
    if (counts[label]) {
      counts[label].passages += 1;
      counts[label].blanks += item.blanks.length;
    }
  }

  return counts;
}

/**
 * Prepares a passage for gameplay by shuffling each blank's 4 options once
 * and recalculating correctIndex.
 */
export function prepareSessionPassage(
  passage: ParagraphClozePassage,
  rng: () => number = Math.random
): ParagraphClozePassage {
  const shuffledBlanks: ClozeBlankItem[] = passage.blanks.map((b) => {
    const originalCorrect = b.options[b.correctIndex];
    const shuffledOptions = shuffleWithRng(b.options, rng) as [
      ClozeBlankOption,
      ClozeBlankOption,
      ClozeBlankOption,
      ClozeBlankOption,
    ];
    const newCorrectIndex = shuffledOptions.findIndex(
      (opt) => opt.id === originalCorrect.id
    );

    return {
      ...b,
      options: shuffledOptions,
      correctIndex: (newCorrectIndex >= 0 ? newCorrectIndex : 0) as 0 | 1 | 2 | 3,
    };
  });

  return {
    ...passage,
    blanks: shuffledBlanks,
  };
}

/**
 * Creates a deterministic Paragraph Cloze game session.
 */
export function createParagraphClozeSession(
  pool: readonly ParagraphClozePassage[] = PARAGRAPH_CLOZE_PASSAGES,
  settings: ParagraphClozeSettings,
  rng: () => number = Math.random
): ParagraphClozeSession {
  let eligible: ParagraphClozePassage[] = [];

  if (settings.passageIds && settings.passageIds.length > 0) {
    const idSet = new Set(settings.passageIds);
    eligible = pool.filter((p) => idSet.has(p.id));
  } else {
    const levelSet = new Set(settings.levels);
    eligible = pool.filter((p) => {
      if (!levelSet.has(p.jlpt)) return false;
      if (settings.sourceFilter === "exam-only" && p.sourceType === "story-scene") return false;
      if (settings.sourceFilter === "story-scenes" && p.sourceType !== "story-scene") return false;
      return true;
    });
  }

  if (eligible.length === 0) {
    // Fallback to all in pool if filter returned nothing
    eligible = [...pool];
  }

  const shuffledPool = shuffleWithRng(eligible, rng);
  const targetCount = Math.min(settings.passageCount, shuffledPool.length);
  const selectedPassages = shuffledPool
    .slice(0, targetCount)
    .map((p) => prepareSessionPassage(p, rng));

  const firstPassage = selectedPassages[0];
  const blankCount = firstPassage ? firstPassage.blanks.length : 0;

  return {
    sessionId: `cloze-${Date.now()}-${Math.floor(rng() * 1000000)}`,
    settings,
    passages: selectedPassages,
    currentPassageIndex: 0,
    status: "playing",
    activeBlankIndex: 0,
    selectedOptionByBlank: Array(blankCount).fill(null),
    passageStatus: "filling",
    passageResults: [],
    startedAt: new Date().toISOString(),
  };
}

/**
 * Pure state reducer for Paragraph Cloze gameplay.
 */
export function paragraphClozeReducer(
  state: ParagraphClozeSession,
  action: ParagraphClozeAction
): ParagraphClozeSession {
  if (state.status === "finished") {
    return state;
  }

  const currentPassage = state.passages[state.currentPassageIndex];
  if (!currentPassage) {
    return {
      ...state,
      status: "finished",
      completedAt: new Date().toISOString(),
    };
  }

  switch (action.type) {
    case "FOCUS_BLANK": {
      if (
        action.blankIndex >= 0 &&
        action.blankIndex < currentPassage.blanks.length
      ) {
        return {
          ...state,
          activeBlankIndex: action.blankIndex,
        };
      }
      return state;
    }

    case "SELECT_OPTION": {
      if (state.passageStatus !== "filling") {
        return state;
      }
      if (
        action.blankIndex < 0 ||
        action.blankIndex >= currentPassage.blanks.length
      ) {
        return state;
      }

      const nextSelected = [...state.selectedOptionByBlank];
      nextSelected[action.blankIndex] = action.optionIndex;

      // Auto-advance active blank to next unfilled blank if one exists
      let nextActive = action.blankIndex;
      for (let i = 0; i < currentPassage.blanks.length; i++) {
        const candidate = (action.blankIndex + 1 + i) % currentPassage.blanks.length;
        if (nextSelected[candidate] === null) {
          nextActive = candidate;
          break;
        }
      }

      return {
        ...state,
        selectedOptionByBlank: nextSelected,
        activeBlankIndex: nextActive,
      };
    }

    case "SUBMIT_PASSAGE": {
      if (state.passageStatus !== "filling") {
        return state;
      }

      const answers: PassageBlankAnswerRecord[] = currentPassage.blanks.map(
        (blank, idx) => {
          const chosen = state.selectedOptionByBlank[idx];
          const isCorrect = chosen === blank.correctIndex;
          const chosenOpt =
            chosen !== null && chosen !== undefined
              ? blank.options[chosen]
              : null;
          const correctOpt = blank.options[blank.correctIndex];

          return {
            blankIndex: blank.blankIndex,
            displayNumber: blank.displayNumber,
            category: blank.category,
            chosenOptionIndex: (chosen ?? null) as 0 | 1 | 2 | 3 | null,
            correctOptionIndex: blank.correctIndex,
            isCorrect,
            chosenTextJa: chosenOpt ? chosenOpt.ja : null,
            correctTextJa: correctOpt.ja,
            discourseRuleEn: blank.discourseRuleEn,
            contextClueQuoteJa: blank.contextClueQuoteJa,
          };
        }
      );

      const passageResult: PassageSessionResult = {
        passageId: currentPassage.id,
        status: "submitted",
        answers,
        timeMs: Math.max(0, action.timeMs),
      };

      return {
        ...state,
        passageStatus: "submitted",
        passageResults: [...state.passageResults, passageResult],
      };
    }

    case "SKIP_PASSAGE": {
      if (state.passageStatus !== "filling") {
        return state;
      }

      const answers: PassageBlankAnswerRecord[] = currentPassage.blanks.map(
        (blank, idx) => {
          const chosen = state.selectedOptionByBlank[idx];
          const isCorrect = false;
          const chosenOpt =
            chosen !== null && chosen !== undefined
              ? blank.options[chosen]
              : null;
          const correctOpt = blank.options[blank.correctIndex];

          return {
            blankIndex: blank.blankIndex,
            displayNumber: blank.displayNumber,
            category: blank.category,
            chosenOptionIndex: (chosen ?? null) as 0 | 1 | 2 | 3 | null,
            correctOptionIndex: blank.correctIndex,
            isCorrect,
            chosenTextJa: chosenOpt ? chosenOpt.ja : null,
            correctTextJa: correctOpt.ja,
            discourseRuleEn: blank.discourseRuleEn,
            contextClueQuoteJa: blank.contextClueQuoteJa,
          };
        }
      );

      const passageResult: PassageSessionResult = {
        passageId: currentPassage.id,
        status: "skipped",
        answers,
        timeMs: Math.max(0, action.timeMs ?? 0),
      };

      return {
        ...state,
        passageStatus: "skipped",
        passageResults: [...state.passageResults, passageResult],
      };
    }

    case "NEXT_PASSAGE": {
      if (action.forPassageIndex !== state.currentPassageIndex) {
        return state;
      }

      const nextPassageIndex = state.currentPassageIndex + 1;
      if (nextPassageIndex >= state.passages.length) {
        return {
          ...state,
          status: "finished",
          completedAt: new Date().toISOString(),
        };
      }

      const nextPassage = state.passages[nextPassageIndex];
      return {
        ...state,
        currentPassageIndex: nextPassageIndex,
        activeBlankIndex: 0,
        selectedOptionByBlank: Array(nextPassage.blanks.length).fill(null),
        passageStatus: "filling",
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
 * Computes comprehensive result summary and discourse category statistics.
 */
export function calculateParagraphClozeResult(
  session: ParagraphClozeSession
): ParagraphClozeResultSummary {
  const passageMap = new Map(session.passages.map((p) => [p.id, p]));

  let totalBlanks = 0;
  let score = 0;
  let skippedBlanksCount = 0;
  let perfectPassagesCount = 0;
  let totalTimeMs = 0;

  const categoryTally: Record<
    DiscourseGrammarCategory,
    { total: number; correct: number }
  > = {
    conjunction: { total: 0, correct: 0 },
    "deixis-perspective": { total: 0, correct: 0 },
    demonstrative: { total: 0, correct: 0 },
    "particles-topic": { total: 0, correct: 0 },
    "modality-ending": { total: 0, correct: 0 },
  };

  const levelTally: Record<
    JlptNumericLevel,
    { totalBlanks: number; correctBlanks: number }
  > = {
    5: { totalBlanks: 0, correctBlanks: 0 },
    4: { totalBlanks: 0, correctBlanks: 0 },
    3: { totalBlanks: 0, correctBlanks: 0 },
    2: { totalBlanks: 0, correctBlanks: 0 },
    1: { totalBlanks: 0, correctBlanks: 0 },
  };

  const missedPassageIds: string[] = [];
  const detailedPassageResults: ParagraphClozeResultSummary["passageResults"] = [];

  for (const pr of session.passageResults) {
    const passage = passageMap.get(pr.passageId);
    if (!passage) continue;

    totalTimeMs += pr.timeMs;
    let passageAllCorrect = true;

    for (const ans of pr.answers) {
      totalBlanks += 1;
      if (ans.isCorrect) {
        score += 1;
      } else {
        passageAllCorrect = false;
        if (ans.chosenOptionIndex === null) {
          skippedBlanksCount += 1;
        }
      }

      if (categoryTally[ans.category]) {
        categoryTally[ans.category].total += 1;
        if (ans.isCorrect) {
          categoryTally[ans.category].correct += 1;
        }
      }

      if (levelTally[passage.jlpt]) {
        levelTally[passage.jlpt].totalBlanks += 1;
        if (ans.isCorrect) {
          levelTally[passage.jlpt].correctBlanks += 1;
        }
      }
    }

    if (passageAllCorrect && pr.status === "submitted") {
      perfectPassagesCount += 1;
    } else {
      missedPassageIds.push(pr.passageId);
    }

    detailedPassageResults.push({
      passage,
      status: pr.status,
      answers: pr.answers,
      timeMs: pr.timeMs,
    });
  }

  const wrongBlanksCount = totalBlanks - score - skippedBlanksCount;
  const accuracy =
    totalBlanks > 0 ? Math.round((score / totalBlanks) * 100) : 0;

  const categoryBreakdown: DiscourseCategoryStat[] = (
    Object.keys(DISCOURSE_CATEGORY_META) as DiscourseGrammarCategory[]
  )
    .filter((cat) => categoryTally[cat].total > 0)
    .map((cat) => {
      const tally = categoryTally[cat];
      const acc =
        tally.total > 0 ? Math.round((tally.correct / tally.total) * 100) : 0;
      return {
        category: cat,
        labelJa: DISCOURSE_CATEGORY_META[cat].labelJa,
        labelEn: DISCOURSE_CATEGORY_META[cat].labelEn,
        total: tally.total,
        correct: tally.correct,
        accuracy: acc,
      };
    });

  const byLevel: ParagraphClozeLevelBreakdown[] = ([5, 4, 3, 2, 1] as JlptNumericLevel[])
    .filter((lvl) => levelTally[lvl].totalBlanks > 0)
    .map((lvl) => {
      const tally = levelTally[lvl];
      const acc =
        tally.totalBlanks > 0
          ? Math.round((tally.correctBlanks / tally.totalBlanks) * 100)
          : 0;
      return {
        level: lvl,
        levelLabel: formatJlptLevel(lvl),
        totalBlanks: tally.totalBlanks,
        correctBlanks: tally.correctBlanks,
        accuracy: acc,
      };
    });

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    totalPassages: session.passages.length,
    perfectPassagesCount,
    totalBlanks,
    score,
    wrongBlanksCount,
    skippedBlanksCount,
    accuracy,
    totalTimeMs,
    categoryBreakdown,
    byLevel,
    missedPassageIds,
    passageResults: detailedPassageResults,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? new Date().toISOString(),
  };
}
