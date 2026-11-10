/**
 * JLPT Game 10: Real-World Audio Listening Scene (聴解・問題1 課題理解)
 * Architecture: Strict data -> engine -> hooks -> components separation.
 *
 * Types, static datasets, and validated dataset loaders for all JLPT levels (N5-N1).
 * Statically imports datasets to remain fully compatible with Next.js and Turbopack.
 */

import n5ScenesData from "../../../public/data/v1/jlpt/listening-scenes-n5.json";
import n4ScenesData from "../../../public/data/v1/jlpt/listening-scenes-n4.json";
import n3ScenesData from "../../../public/data/v1/jlpt/listening-scenes-n3.json";
import n2ScenesData from "../../../public/data/v1/jlpt/listening-scenes-n2.json";
import n1ScenesData from "../../../public/data/v1/jlpt/listening-scenes-n1.json";

export type ListeningSceneLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface DialogueLine {
  speaker: "Narrator" | "M" | "F";
  speakerLabelJa: string;
  speakerLabelEn: string;
  voiceGender: "male" | "female" | "narrator";
  textJa: string;
  readingHiragana: string;
  textEn: string;
  pauseAfterMs: number;
}

export interface SceneVisualObject {
  id: string;
  optionNumber: 1 | 2 | 3 | 4;
  labelJa: string;
  labelEn: string;
  attributes?: {
    targetAction?: string;
    targetObject?: string;
    location?: string;
    item?: string;
    amount?: string;
    colors?: string[];
    position?: string;
    size?: "large" | "small" | "long" | "short";
    colorOrPattern?: string;
    documents?: string[];
    [key: string]: unknown;
  };
  coordinates: { xPercent: number; yPercent: number };
}

export interface SceneMcqOption {
  id: string;
  labelJa: string;
  reading: string;
  labelEn: string;
}

export interface SceneMcqQuestion {
  id: string;
  isPrimaryMondai: boolean;
  questionJa: string;
  questionReading: string;
  questionEn: string;
  options: [SceneMcqOption, SceneMcqOption, SceneMcqOption, SceneMcqOption];
  correctIndex: 0 | 1 | 2 | 3;
  eliminationExplanationEn: string;
}

export interface ListeningSceneItem {
  id: string;
  jlpt: 1 | 2 | 3 | 4 | 5;
  mondaiType: "mondai-1-task";
  titleJa: string;
  titleEn: string;
  imagePromptDescription: string;
  recommendedAssetPath: string;
  visualObjects: [
    SceneVisualObject,
    SceneVisualObject,
    SceneVisualObject,
    SceneVisualObject,
  ] | SceneVisualObject[];
  audioSequence: DialogueLine[];
  questions: [SceneMcqQuestion, SceneMcqQuestion, SceneMcqQuestion] | SceneMcqQuestion[];
}

/**
 * Validates a candidate object against the ListeningSceneItem schema.
 * Throws a descriptive error or returns false if required fields are missing or corrupted.
 */
export function validateListeningSceneItem(
  item: unknown
): item is ListeningSceneItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const s = item as Partial<ListeningSceneItem>;

  if (typeof s.id !== "string" || !s.id.trim()) {
    throw new Error(`Invalid listening scene: missing or empty 'id'`);
  }
  if (![1, 2, 3, 4, 5].includes(s.jlpt as number)) {
    throw new Error(`Invalid listening scene '${s.id}': invalid jlpt level ${s.jlpt}`);
  }
  if (s.mondaiType !== "mondai-1-task") {
    throw new Error(`Invalid listening scene '${s.id}': invalid mondaiType ${s.mondaiType}`);
  }
  if (typeof s.titleJa !== "string" || !s.titleJa.trim()) {
    throw new Error(`Invalid listening scene '${s.id}': missing 'titleJa'`);
  }
  if (typeof s.titleEn !== "string" || !s.titleEn.trim()) {
    throw new Error(`Invalid listening scene '${s.id}': missing 'titleEn'`);
  }
  if (typeof s.imagePromptDescription !== "string" || !s.imagePromptDescription.trim()) {
    throw new Error(`Invalid listening scene '${s.id}': missing 'imagePromptDescription'`);
  }
  if (typeof s.recommendedAssetPath !== "string" || !s.recommendedAssetPath.trim()) {
    throw new Error(`Invalid listening scene '${s.id}': missing 'recommendedAssetPath'`);
  }
  if (!s.recommendedAssetPath.startsWith("/images/jlpt-scenes/")) {
    throw new Error(
      `Invalid listening scene '${s.id}': asset path '${s.recommendedAssetPath}' must start with '/images/jlpt-scenes/'`
    );
  }

  // Visual objects
  if (!Array.isArray(s.visualObjects) || s.visualObjects.length !== 4) {
    throw new Error(`Invalid listening scene '${s.id}': visualObjects must have length 4`);
  }
  for (let idx = 0; idx < s.visualObjects.length; idx++) {
    const vo = s.visualObjects[idx];
    if (!vo || vo.optionNumber !== (idx + 1)) {
      throw new Error(
        `Invalid listening scene '${s.id}': visualObjects[${idx}] optionNumber must be ${idx + 1}`
      );
    }
    if (typeof vo.labelJa !== "string" || !vo.labelJa.trim()) {
      throw new Error(`Invalid listening scene '${s.id}': visualObjects[${idx}] missing labelJa`);
    }
    if (
      !vo.coordinates ||
      typeof vo.coordinates.xPercent !== "number" ||
      typeof vo.coordinates.yPercent !== "number"
    ) {
      throw new Error(`Invalid listening scene '${s.id}': visualObjects[${idx}] missing coordinates`);
    }
  }

  // Audio sequence
  if (!Array.isArray(s.audioSequence) || s.audioSequence.length < 4) {
    throw new Error(`Invalid listening scene '${s.id}': audioSequence must have at least 4 lines`);
  }
  for (let idx = 0; idx < s.audioSequence.length; idx++) {
    const line = s.audioSequence[idx];
    if (!line || !["Narrator", "M", "F"].includes(line.speaker)) {
      throw new Error(
        `Invalid listening scene '${s.id}': audioSequence[${idx}] invalid speaker '${line?.speaker}'`
      );
    }
    if (typeof line.textJa !== "string" || !line.textJa.trim()) {
      throw new Error(
        `Invalid listening scene '${s.id}': audioSequence[${idx}] missing textJa`
      );
    }
    if (typeof line.readingHiragana !== "string" || !line.readingHiragana.trim()) {
      throw new Error(
        `Invalid listening scene '${s.id}': audioSequence[${idx}] missing readingHiragana`
      );
    }
  }

  // Questions
  if (!Array.isArray(s.questions) || s.questions.length === 0) {
    throw new Error(`Invalid listening scene '${s.id}': questions array cannot be empty`);
  }
  const hasPrimary = s.questions.some((q) => q.isPrimaryMondai);
  if (!hasPrimary) {
    throw new Error(
      `Invalid listening scene '${s.id}': must include at least one primary question (isPrimaryMondai: true)`
    );
  }
  for (let idx = 0; idx < s.questions.length; idx++) {
    const q = s.questions[idx];
    if (!q.id || !q.questionJa || !q.questionReading) {
      throw new Error(`Invalid listening scene '${s.id}': question[${idx}] missing text`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Invalid listening scene '${s.id}': question[${idx}] options must have length 4`);
    }
    if (![0, 1, 2, 3].includes(q.correctIndex)) {
      throw new Error(`Invalid listening scene '${s.id}': question[${idx}] invalid correctIndex`);
    }
  }

  return true;
}

/**
 * Level map backed by static JSON imports.
 * Compatible with Next.js, Turbopack, and Vitest without dynamic filesystem runtime imports.
 */
export const LISTENING_SCENES_BY_LEVEL: Record<
  ListeningSceneLevel,
  readonly ListeningSceneItem[]
> = {
  N5: n5ScenesData as unknown as ListeningSceneItem[],
  N4: n4ScenesData as unknown as ListeningSceneItem[],
  N3: n3ScenesData as unknown as ListeningSceneItem[],
  N2: n2ScenesData as unknown as ListeningSceneItem[],
  N1: n1ScenesData as unknown as ListeningSceneItem[],
};

/**
 * All scenes across all 5 JLPT levels (15 total).
 */
export const ALL_LISTENING_SCENES: readonly ListeningSceneItem[] = [
  ...LISTENING_SCENES_BY_LEVEL.N5,
  ...LISTENING_SCENES_BY_LEVEL.N4,
  ...LISTENING_SCENES_BY_LEVEL.N3,
  ...LISTENING_SCENES_BY_LEVEL.N2,
  ...LISTENING_SCENES_BY_LEVEL.N1,
];

/**
 * Loads listening scenes strictly for the requested JLPT levels.
 * Validates every scene before returning.
 */
export function loadListeningScenesForLevels(
  levels: readonly (ListeningSceneLevel | string)[]
): ListeningSceneItem[] {
  const result: ListeningSceneItem[] = [];
  const seenIds = new Set<string>();

  for (const rawLevel of levels) {
    const upper = rawLevel.toUpperCase();
    const lvlKey = (upper.startsWith("N") ? upper : `N${upper}`) as ListeningSceneLevel;
    const scenes = LISTENING_SCENES_BY_LEVEL[lvlKey];

    if (!scenes) {
      continue;
    }

    for (const scene of scenes) {
      validateListeningSceneItem(scene);
      if (!seenIds.has(scene.id)) {
        seenIds.add(scene.id);
        result.push(scene);
      }
    }
  }

  return result;
}
