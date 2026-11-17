/**
 * JLPT Game 10: Real-World Audio Listening Scene (聴解・問題1 課題理解)
 * Pure TypeScript Engine Module — ZERO React, DOM, window, or browser API dependencies.
 */

import type {
  ListeningSceneItem,
  SceneVisualObject,
  DialogueLine,
  SceneMcqQuestion,
  SceneMcqOption,
} from "@/data/jlpt/listeningScenesData";

export type {
  ListeningSceneItem,
  SceneVisualObject,
  DialogueLine,
  SceneMcqQuestion,
  SceneMcqOption,
};

export type ListeningSceneLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type ListeningScenePhase =
  | "intro"
  | "audio-playing"
  | "answering"
  | "answered";
export type ListeningSceneSessionStatus = "playing" | "finished";

export interface ListeningSceneSettings {
  levels: ListeningSceneLevel[];
  sceneCount: number;
  mode?: "exam" | "study";
  sceneIds?: string[];
}

export interface QuestionResponse {
  questionId: string;
  chosenIndex: 0 | 1 | 2 | 3;
  correctIndex: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  timeMs?: number;
}

export interface SceneResponseRecord {
  sceneId: string;
  level: ListeningSceneLevel;
  primaryAnswer: QuestionResponse | null;
  bonusAnswers: Record<string, QuestionResponse>;
  allCorrect: boolean;
  timeMs?: number;
}

export interface ListeningSceneSession {
  sessionId: string;
  settings: ListeningSceneSettings;
  scenes: ListeningSceneItem[];
  currentSceneIndex: number;
  phase: ListeningScenePhase;
  status: ListeningSceneSessionStatus;
  currentPrimaryAnswer: QuestionResponse | null;
  currentBonusAnswers: Record<string, QuestionResponse>;
  results: SceneResponseRecord[];
  score: number;
  startedAt: string;
  completedAt?: string;
}

export type ListeningSceneAction =
  | { type: "START_AUDIO" }
  | { type: "AUDIO_ENDED" }
  | { type: "ANSWER_PRIMARY"; optionIndex: 0 | 1 | 2 | 3; timeMs?: number }
  | {
      type: "ANSWER_BONUS";
      questionId: string;
      optionIndex: 0 | 1 | 2 | 3;
      timeMs?: number;
    }
  | { type: "NEXT_SCENE"; forIndex?: number }
  | { type: "END" };

export interface ListeningSceneLevelStat {
  total: number;
  correct: number;
  accuracy: number;
}

export interface ListeningSceneSessionResult {
  sessionId: string;
  settings: ListeningSceneSettings;
  totalScenes: number;
  completedScenes: number;
  primaryScore: number;
  primaryAccuracy: number;
  bonusScore: number;
  bonusTotal: number;
  bonusAccuracy: number;
  missedSceneIds: string[];
  levelBreakdown: Record<ListeningSceneLevel, ListeningSceneLevelStat>;
  results: SceneResponseRecord[];
  startedAt: string;
  completedAt?: string;
}

/**
 * Counts scenes in a pool grouped by JLPT level (N5..N1).
 */
export function getListeningSceneCountsByLevel(
  pool: readonly ListeningSceneItem[]
): Record<ListeningSceneLevel, number> {
  const counts: Record<ListeningSceneLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  };

  for (const item of pool) {
    const lvlKey = `N${item.jlpt}` as ListeningSceneLevel;
    if (counts[lvlKey] !== undefined) {
      counts[lvlKey]++;
    }
  }

  return counts;
}

/**
 * Creates an immutable listening scene session with deterministic RNG shuffle and level filtering.
 */
export function createListeningSceneSession(
  pool: readonly ListeningSceneItem[],
  settings: ListeningSceneSettings,
  rng: () => number = Math.random
): ListeningSceneSession {
  let filtered: ListeningSceneItem[] = [];

  if (settings.sceneIds && settings.sceneIds.length > 0) {
    const idSet = new Set(settings.sceneIds);
    filtered = pool.filter((item) => idSet.has(item.id));
  } else {
    const levelSet = new Set(settings.levels);
    filtered = pool.filter((item) =>
      levelSet.has(`N${item.jlpt}` as ListeningSceneLevel)
    );
  }

  if (filtered.length === 0) {
    filtered = [...pool];
  }

  // Fisher-Yates single shuffle using the supplied RNG
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  const limit =
    settings.sceneCount > 0 ? settings.sceneCount : shuffled.length;
  const selectedScenes = shuffled.slice(0, limit);

  const randSuffix = Math.floor(rng() * 1e9).toString(36);
  const sessionId = `scene-session-${Date.now().toString(36)}-${randSuffix}`;

  return {
    sessionId,
    settings,
    scenes: selectedScenes,
    currentSceneIndex: 0,
    phase: "intro",
    status: "playing",
    currentPrimaryAnswer: null,
    currentBonusAnswers: {},
    results: [],
    score: 0,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Pure state reducer governing the official JLPT listening scene lifecycle.
 * Enforces the strict phase transition: intro -> audio-playing -> answering -> answered.
 * Rejects/ignores any primary or bonus answers until the audio has ended.
 */
export function listeningSceneReducer(
  state: ListeningSceneSession,
  action: ListeningSceneAction
): ListeningSceneSession {
  if (state.status === "finished" && action.type !== "END") {
    return state;
  }

  switch (action.type) {
    case "START_AUDIO": {
      if (state.phase === "intro") {
        return {
          ...state,
          phase: "audio-playing",
        };
      }
      return state;
    }

    case "AUDIO_ENDED": {
      if (state.phase === "audio-playing" || state.phase === "intro") {
        return {
          ...state,
          phase: "answering",
        };
      }
      return state;
    }

    case "ANSWER_PRIMARY": {
      // STRICT RULE: Reject/ignore answers until audio has ended (phase MUST be 'answering')
      if (state.phase !== "answering") {
        return state;
      }
      if (state.currentPrimaryAnswer !== null) {
        return state;
      }

      const scene = state.scenes[state.currentSceneIndex];
      if (!scene) {
        return state;
      }

      const primaryQ =
        scene.questions.find((q) => q.isPrimaryMondai) ?? scene.questions[0];
      if (!primaryQ) {
        return state;
      }

      const isCorrect = action.optionIndex === primaryQ.correctIndex;
      const primaryResponse: QuestionResponse = {
        questionId: primaryQ.id,
        chosenIndex: action.optionIndex,
        correctIndex: primaryQ.correctIndex,
        isCorrect,
        timeMs: action.timeMs,
      };

      return {
        ...state,
        phase: "answered",
        score: state.score + (isCorrect ? 1 : 0),
        currentPrimaryAnswer: primaryResponse,
      };
    }

    case "ANSWER_BONUS": {
      // STRICT RULE: Reject/ignore bonus answers until audio has ended
      if (state.phase === "intro" || state.phase === "audio-playing") {
        return state;
      }

      if (state.currentBonusAnswers[action.questionId] !== undefined) {
        return state;
      }

      const scene = state.scenes[state.currentSceneIndex];
      if (!scene) {
        return state;
      }

      const bonusQ = scene.questions.find((q) => q.id === action.questionId);
      if (!bonusQ || bonusQ.isPrimaryMondai) {
        return state;
      }

      const isCorrect = action.optionIndex === bonusQ.correctIndex;
      const bonusResponse: QuestionResponse = {
        questionId: bonusQ.id,
        chosenIndex: action.optionIndex,
        correctIndex: bonusQ.correctIndex,
        isCorrect,
        timeMs: action.timeMs,
      };

      return {
        ...state,
        currentBonusAnswers: {
          ...state.currentBonusAnswers,
          [action.questionId]: bonusResponse,
        },
      };
    }

    case "NEXT_SCENE": {
      if (
        action.forIndex !== undefined &&
        action.forIndex !== state.currentSceneIndex
      ) {
        return state;
      }

      // Can only advance to the next scene once primary answer has been submitted
      if (state.phase !== "answered" || state.currentPrimaryAnswer === null) {
        return state;
      }

      const currentScene = state.scenes[state.currentSceneIndex];
      const allCorrect = Boolean(
        state.currentPrimaryAnswer?.isCorrect &&
          Object.values(state.currentBonusAnswers).every((b) => b.isCorrect)
      );

      const record: SceneResponseRecord = {
        sceneId: currentScene.id,
        level: `N${currentScene.jlpt}` as ListeningSceneLevel,
        primaryAnswer: state.currentPrimaryAnswer,
        bonusAnswers: state.currentBonusAnswers,
        allCorrect,
      };

      const nextResults = [...state.results, record];
      const nextIndex = state.currentSceneIndex + 1;

      if (nextIndex >= state.scenes.length) {
        return {
          ...state,
          currentSceneIndex: state.currentSceneIndex,
          phase: "answered",
          status: "finished",
          results: nextResults,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        ...state,
        currentSceneIndex: nextIndex,
        phase: "intro",
        currentPrimaryAnswer: null,
        currentBonusAnswers: {},
        results: nextResults,
      };
    }

    case "END": {
      if (state.status === "finished") {
        return state;
      }

      const updatedResults = [...state.results];

      // If current scene was answered but not yet committed via NEXT_SCENE, commit it
      if (state.currentPrimaryAnswer !== null) {
        const currentScene = state.scenes[state.currentSceneIndex];
        const alreadyRecorded = updatedResults.some(
          (r) => r.sceneId === currentScene.id
        );

        if (!alreadyRecorded) {
          const allCorrect = Boolean(
            state.currentPrimaryAnswer?.isCorrect &&
              Object.values(state.currentBonusAnswers).every((b) => b.isCorrect)
          );
          updatedResults.push({
            sceneId: currentScene.id,
            level: `N${currentScene.jlpt}` as ListeningSceneLevel,
            primaryAnswer: state.currentPrimaryAnswer,
            bonusAnswers: state.currentBonusAnswers,
            allCorrect,
          });
        }
      }

      return {
        ...state,
        status: "finished",
        results: updatedResults,
        completedAt: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

/**
 * Summarizes a completed or terminated listening scene session into a final review result.
 */
export function summarizeListeningSceneSession(
  session: ListeningSceneSession
): ListeningSceneSessionResult {
  const totalScenes = session.scenes.length;
  const completedScenes = session.results.length;

  let primaryScore = 0;
  let bonusScore = 0;
  let bonusTotal = 0;
  const missedSceneIds: string[] = [];

  const levelBreakdown: Record<ListeningSceneLevel, ListeningSceneLevelStat> = {
    N5: { total: 0, correct: 0, accuracy: 0 },
    N4: { total: 0, correct: 0, accuracy: 0 },
    N3: { total: 0, correct: 0, accuracy: 0 },
    N2: { total: 0, correct: 0, accuracy: 0 },
    N1: { total: 0, correct: 0, accuracy: 0 },
  };

  for (const record of session.results) {
    const lvl = record.level;
    if (levelBreakdown[lvl]) {
      levelBreakdown[lvl].total++;
    }

    if (record.primaryAnswer?.isCorrect) {
      primaryScore++;
      if (levelBreakdown[lvl]) {
        levelBreakdown[lvl].correct++;
      }
    } else {
      missedSceneIds.push(record.sceneId);
    }

    const bonusValues = Object.values(record.bonusAnswers);
    for (const b of bonusValues) {
      bonusTotal++;
      if (b.isCorrect) {
        bonusScore++;
      }
    }
  }

  for (const key of Object.keys(levelBreakdown) as ListeningSceneLevel[]) {
    const stat = levelBreakdown[key];
    stat.accuracy =
      stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
  }

  const primaryAccuracy =
    completedScenes > 0
      ? Math.round((primaryScore / completedScenes) * 100)
      : 0;

  const bonusAccuracy =
    bonusTotal > 0 ? Math.round((bonusScore / bonusTotal) * 100) : 0;

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    totalScenes,
    completedScenes,
    primaryScore,
    primaryAccuracy,
    bonusScore,
    bonusTotal,
    bonusAccuracy,
    missedSceneIds,
    levelBreakdown,
    results: session.results,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
  };
}
