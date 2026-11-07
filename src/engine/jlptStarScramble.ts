import {
  STAR_SCRAMBLE_ITEMS,
  STAR_SCRAMBLE_LEVELS,
  type StarScrambleItem,
  type StarScrambleLevel,
} from "@/data/jlpt/starScrambleData";

export {
  STAR_SCRAMBLE_ITEMS,
  STAR_SCRAMBLE_LEVELS,
  type StarScrambleItem,
  type StarScrambleLevel,
};

export type StarSlotTuple<T> = [T, T, T, T];

export interface StarScrambleTile {
  id: string;
  text: string;
  correctSlotIndex: 0 | 1 | 2 | 3;
  optionNumber: 1 | 2 | 3 | 4;
}

export interface StarScrambleQuestion {
  id: string;
  itemId: string;
  level: StarScrambleLevel;
  jlpt: 5 | 4 | 3 | 2 | 1;
  prefix: string;
  segments: StarSlotTuple<string>;
  suffix: string;
  fullSentence: string;
  furigana: string;
  romaji: string;
  english: string;
  grammarId: string;
  grammarPoint: string;
  explanation: string;
  /** Official JLPT ★ blank index (0-based: 1 = 2nd slot, 2 = 3rd slot). */
  starSlotIndex: 1 | 2;
  correctOrderIds: StarSlotTuple<string>;
  correctStarTileId: string;
  options: StarSlotTuple<StarScrambleTile>;
}

export type StarScrambleSessionSize = 10 | 15 | 20;

export interface StarScrambleSettings {
  levels: StarScrambleLevel[];
  size: StarScrambleSessionSize;
  showEnglishHint: boolean;
  /** Optional subset of specific item IDs when practicing missed puzzles. */
  onlyItemIds?: string[];
}

export interface StarScrambleAnswerRecord {
  questionId: string;
  itemId: string;
  placedTileIds: StarSlotTuple<string | null>;
  starTileId: string | null;
  correctStarTileId: string;
  starCorrect: boolean;
  fullOrderCorrect: boolean;
  skipped: boolean;
  timeMs: number;
}

export interface StarScrambleSession {
  sessionId: string;
  settings: StarScrambleSettings;
  questions: StarScrambleQuestion[];
  currentIndex: number;
  placedTileIds: StarSlotTuple<string | null>;
  revealed: boolean;
  lastAnswer: StarScrambleAnswerRecord | null;
  answers: StarScrambleAnswerRecord[];
  status: "playing" | "finished";
  startedAt: number;
  finishedAt?: number;
}

export interface StarScrambleResultSummary {
  sessionId: string;
  settings: StarScrambleSettings;
  total: number;
  starCorrectCount: number;
  starAccuracyPercent: number;
  fullOrderCorrectCount: number;
  fullOrderAccuracyPercent: number;
  skippedCount: number;
  averageTimeMs: number;
  questions: StarScrambleQuestion[];
  answers: StarScrambleAnswerRecord[];
  missedItemIds: string[];
  completedAt: number;
}

export type StarScrambleAction =
  | { type: "PLACE_TILE"; tileId: string }
  | { type: "SET_SLOT"; slotIndex: 0 | 1 | 2 | 3; tileId: string | null }
  | { type: "UNDO_LAST" }
  | { type: "CLEAR_SLOTS" }
  | { type: "SUBMIT"; timeMs: number }
  | { type: "SKIP"; timeMs?: number }
  | { type: "NEXT"; forIndex?: number }
  | { type: "END"; finishedAt?: number };

export const DEFAULT_STAR_SCRAMBLE_SETTINGS: StarScrambleSettings = {
  levels: ["N5"],
  size: 10,
  showEnglishHint: true,
};

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
 * Shuffles the 4 segments and guarantees the shuffled tile order is never already `[0, 1, 2, 3]`.
 */
export function buildShuffledTiles(
  itemId: string,
  segments: StarSlotTuple<string>,
  rng: () => number = Math.random,
): {
  correctOrderIds: StarSlotTuple<string>;
  options: StarSlotTuple<StarScrambleTile>;
} {
  const baseTiles: Array<{ id: string; text: string; correctSlotIndex: 0 | 1 | 2 | 3 }> = [
    { id: `${itemId}-seg-0`, text: segments[0], correctSlotIndex: 0 },
    { id: `${itemId}-seg-1`, text: segments[1], correctSlotIndex: 1 },
    { id: `${itemId}-seg-2`, text: segments[2], correctSlotIndex: 2 },
    { id: `${itemId}-seg-3`, text: segments[3], correctSlotIndex: 3 },
  ];

  const correctOrderIds: StarSlotTuple<string> = [
    baseTiles[0].id,
    baseTiles[1].id,
    baseTiles[2].id,
    baseTiles[3].id,
  ];

  let shuffled = shuffleWithRng(baseTiles, rng);
  const isUnshuffled = shuffled.every((tile, idx) => tile.correctSlotIndex === idx);
  if (isUnshuffled) {
    // Deterministic swap so options are never in [0, 1, 2, 3] order
    shuffled = [shuffled[2], shuffled[0], shuffled[3], shuffled[1]];
  }

  const options: StarSlotTuple<StarScrambleTile> = [
    { ...shuffled[0], optionNumber: 1 },
    { ...shuffled[1], optionNumber: 2 },
    { ...shuffled[2], optionNumber: 3 },
    { ...shuffled[3], optionNumber: 4 },
  ];

  return { correctOrderIds, options };
}

export function getStarScrambleCountsByLevel(
  pool: readonly StarScrambleItem[] = STAR_SCRAMBLE_ITEMS,
): Record<StarScrambleLevel, number> {
  const counts: Record<StarScrambleLevel, number> = {
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

export function createStarScrambleSession(
  pool: readonly StarScrambleItem[] = STAR_SCRAMBLE_ITEMS,
  settings: StarScrambleSettings = DEFAULT_STAR_SCRAMBLE_SETTINGS,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: number = Date.now(),
): StarScrambleSession {
  const activeLevels: StarScrambleLevel[] =
    settings.levels.length > 0 ? settings.levels : ["N5"];
  const levelSet = new Set<StarScrambleLevel>(activeLevels);

  let candidates = pool.filter((item) => levelSet.has(item.level));
  if (settings.onlyItemIds && settings.onlyItemIds.length > 0) {
    const idSet = new Set(settings.onlyItemIds);
    const filteredById = candidates.filter((item) => idSet.has(item.id));
    if (filteredById.length > 0) {
      candidates = filteredById;
    }
  }

  if (candidates.length === 0) {
    candidates = [...pool];
  }

  const shuffledPool = shuffleWithRng(candidates, rng);
  const selectedItems = shuffledPool.slice(0, Math.min(settings.size, shuffledPool.length));

  const resolvedSessionId =
    sessionId ??
    `jlpt-star-${startedAt.toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`;

  const questions: StarScrambleQuestion[] = selectedItems.map((item, idx) => {
    const starSlotIndex: 1 | 2 = rng() < 0.35 ? 1 : 2;
    const { correctOrderIds, options } = buildShuffledTiles(item.id, item.segments, rng);

    return {
      id: `${resolvedSessionId}-q-${idx + 1}`,
      itemId: item.id,
      level: item.level,
      jlpt: item.jlpt,
      prefix: item.prefix,
      segments: item.segments,
      suffix: item.suffix,
      fullSentence: item.fullSentence,
      furigana: item.furigana,
      romaji: item.romaji,
      english: item.english,
      grammarId: item.grammarId,
      grammarPoint: item.grammarPoint,
      explanation: item.explanation,
      starSlotIndex,
      correctOrderIds,
      correctStarTileId: correctOrderIds[starSlotIndex],
      options,
    };
  });

  return {
    sessionId: resolvedSessionId,
    settings: {
      ...settings,
      levels: activeLevels,
    },
    questions,
    currentIndex: 0,
    placedTileIds: [null, null, null, null],
    revealed: false,
    lastAnswer: null,
    answers: [],
    status: questions.length > 0 ? "playing" : "finished",
    startedAt,
  };
}

export function starScrambleReducer(
  state: StarScrambleSession,
  action: StarScrambleAction,
): StarScrambleSession {
  if (state.status === "finished" && action.type !== "END") {
    return state;
  }

  const currentQuestion = state.questions[state.currentIndex];
  if (!currentQuestion && action.type !== "END") {
    return state;
  }

  switch (action.type) {
    case "PLACE_TILE": {
      if (state.revealed) return state;
      const validTile = currentQuestion.options.some((opt) => opt.id === action.tileId);
      if (!validTile) return state;

      const nextSlots: StarSlotTuple<string | null> = [...state.placedTileIds];
      const existingSlotIndex = nextSlots.indexOf(action.tileId);
      if (existingSlotIndex !== -1) {
        // Clicking an already-placed tile removes it from its slot
        nextSlots[existingSlotIndex] = null;
        return {
          ...state,
          placedTileIds: nextSlots,
        };
      }

      const firstEmptyIndex = nextSlots.indexOf(null);
      if (firstEmptyIndex === -1) {
        return state;
      }

      nextSlots[firstEmptyIndex] = action.tileId;
      return {
        ...state,
        placedTileIds: nextSlots,
      };
    }

    case "SET_SLOT": {
      if (state.revealed) return state;
      const { slotIndex, tileId } = action;
      if (slotIndex < 0 || slotIndex > 3) return state;

      const nextSlots: StarSlotTuple<string | null> = [...state.placedTileIds];
      if (tileId === null) {
        nextSlots[slotIndex] = null;
        return {
          ...state,
          placedTileIds: nextSlots,
        };
      }

      const validTile = currentQuestion.options.some((opt) => opt.id === tileId);
      if (!validTile) return state;

      const prevIndex = nextSlots.indexOf(tileId);
      if (prevIndex !== -1) {
        nextSlots[prevIndex] = nextSlots[slotIndex];
      }
      nextSlots[slotIndex] = tileId;

      return {
        ...state,
        placedTileIds: nextSlots,
      };
    }

    case "UNDO_LAST": {
      if (state.revealed) return state;
      const nextSlots: StarSlotTuple<string | null> = [...state.placedTileIds];
      for (let i = 3; i >= 0; i--) {
        if (nextSlots[i] !== null) {
          nextSlots[i] = null;
          return {
            ...state,
            placedTileIds: nextSlots,
          };
        }
      }
      return state;
    }

    case "CLEAR_SLOTS": {
      if (state.revealed) return state;
      return {
        ...state,
        placedTileIds: [null, null, null, null],
      };
    }

    case "SUBMIT": {
      if (state.revealed) return state;
      // Require all 4 slots to be filled before submitting
      if (state.placedTileIds.some((slot) => slot === null)) {
        return state;
      }

      const starTileId = state.placedTileIds[currentQuestion.starSlotIndex];
      const starCorrect = starTileId === currentQuestion.correctStarTileId;
      const fullOrderCorrect = currentQuestion.correctOrderIds.every(
        (correctId, idx) => state.placedTileIds[idx] === correctId,
      );

      const record: StarScrambleAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        placedTileIds: [...state.placedTileIds],
        starTileId,
        correctStarTileId: currentQuestion.correctStarTileId,
        starCorrect,
        fullOrderCorrect,
        skipped: false,
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
      const record: StarScrambleAnswerRecord = {
        questionId: currentQuestion.id,
        itemId: currentQuestion.itemId,
        placedTileIds: [...state.placedTileIds],
        starTileId: null,
        correctStarTileId: currentQuestion.correctStarTileId,
        starCorrect: false,
        fullOrderCorrect: false,
        skipped: true,
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
      if (typeof action.forIndex === "number" && action.forIndex !== state.currentIndex) {
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
        placedTileIds: [null, null, null, null],
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

export function summarizeStarScrambleSession(
  session: StarScrambleSession,
  completedAt: number = Date.now(),
): StarScrambleResultSummary {
  const total = session.questions.length;
  const starCorrectCount = session.answers.filter((a) => a.starCorrect).length;
  const fullOrderCorrectCount = session.answers.filter((a) => a.fullOrderCorrect).length;
  const skippedCount = session.answers.filter((a) => a.skipped).length;

  const starAccuracyPercent = total > 0 ? Math.round((starCorrectCount / total) * 100) : 0;
  const fullOrderAccuracyPercent =
    total > 0 ? Math.round((fullOrderCorrectCount / total) * 100) : 0;

  const totalTimeMs = session.answers.reduce((acc, a) => acc + a.timeMs, 0);
  const averageTimeMs =
    session.answers.length > 0 ? Math.round(totalTimeMs / session.answers.length) : 0;

  const answeredMap = new Map(session.answers.map((a) => [a.questionId, a]));
  const missedItemIds = session.questions
    .filter((q) => {
      const ans = answeredMap.get(q.id);
      return !ans || !ans.starCorrect || !ans.fullOrderCorrect;
    })
    .map((q) => q.itemId);

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    total,
    starCorrectCount,
    starAccuracyPercent,
    fullOrderCorrectCount,
    fullOrderAccuracyPercent,
    skippedCount,
    averageTimeMs,
    questions: session.questions,
    answers: session.answers,
    missedItemIds,
    completedAt: session.finishedAt ?? completedAt,
  };
}
