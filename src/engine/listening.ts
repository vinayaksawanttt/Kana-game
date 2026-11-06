import { kanaCharacters, type KanaCharacter, type KanaGroup, type KanaRow } from "@/data/kana";
import type { VocabularyLevel, VocabularyRecord } from "@/data/vocabulary";
import type { StoryRecord } from "@/data/stories";
import { buildStoryAudioQueue, cleanSentenceForAudio, toKanaAudioKey } from "@/engine/audio";
import { checkVocabularyAnswer } from "@/engine/vocabularyMatcher";
import { shuffle } from "@/engine/random";

export type ListeningSubMode = "kana" | "vocabulary" | "sentences";
export type ListeningAnswerFormat = "multiple-choice" | "typing";
export type JlptLevel = 5 | 4 | 3 | 2 | 1;

export interface ListeningSettings {
  subMode: ListeningSubMode;
  answerFormat: ListeningAnswerFormat; // "multiple-choice" (4 options) or "typing" (for kana/vocab)
  levels: JlptLevel[];                 // Used for vocabulary & sentences (default [5])
  kanaScript?: "hiragana" | "katakana" | "both";
  kanaGroups?: ("basic" | "dakuten" | "yoon" | "extended")[];
  size: 10 | 20 | 30;
  questionIds?: string[];              // For "Practice missed items"
}

export interface ListeningOption {
  id: string;
  label: string;       // Display text on option button (e.g. English meaning, or Kana/Kanji)
  subLabel?: string;   // Revealed after answering (e.g. reading/romaji)
}

export interface ListeningQuestion {
  id: string;
  subMode: ListeningSubMode;
  audioPayload: {
    type: "kana" | "vocab" | "sentence";
    charOrWord: string;
    reading?: string;
    sentenceJa?: string;
    audioSrc?: string;
  };
  hiddenPromptJa: string;       // e.g. "大勢" or "学校へ行く。" (kept hidden until answered!)
  hiddenReading: string;        // e.g. "おおぜい" or "ka"
  correctMeaning: string;       // Primary English gloss or romaji
  acceptedAnswers: string[];    // For typing mode (romaji variants or vocab meanings/synonyms)
  options: ListeningOption[];   // 4 shuffled options for multiple-choice
  jlpt?: JlptLevel;
  status: "pending" | "correct" | "wrong" | "skipped";
  mistakes: number;
  userAnswer?: string;
  replaysUsed: number;
  timeMs: number;
}

export interface ListeningSentenceItem {
  id: string;
  ja: string;
  reading: string;
  en: string;
  jlpt: JlptLevel;
  audioSrc?: string;
}

export interface ListeningPoolData {
  kana?: KanaCharacter[];
  vocabulary?: VocabularyRecord[];
  sentences?: ListeningSentenceItem[];
  stories?: StoryRecord[];
}

export interface ListeningSession {
  sessionId: string;
  settings: ListeningSettings;
  questions: ListeningQuestion[];
  index: number;
  startedAt: number;
  completedAt?: number;
  endedEarly?: boolean;
}

export interface ListeningResultSummary {
  sessionId: string;
  settings: ListeningSettings;
  questions: ListeningQuestion[];
  startedAt: number;
  completedAt: number;
  endedEarly: boolean;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  totalTimeMs: number;
  averageReplays: number;
}

export type ListeningAction =
  | { type: "SUBMIT_CHOICE"; optionId: string; timeMs: number }
  | { type: "SUBMIT_TYPED"; input: string; timeMs: number }
  | { type: "INCREMENT_REPLAY" }
  | { type: "SKIP"; timeMs?: number }
  | { type: "NEXT"; forIndex?: number }
  | { type: "END"; endedAt?: number };

const CONFUSABLE_ROW_PAIRS: Partial<Record<KanaRow, KanaRow[]>> = {
  k: ["g", "s", "t"],
  g: ["k", "z", "d"],
  s: ["z", "sh", "t"],
  z: ["s", "d", "j"],
  t: ["d", "s", "k"],
  d: ["t", "z", "b"],
  h: ["b", "p", "f" as KanaRow],
  b: ["p", "h", "d"],
  p: ["b", "h"],
  n: ["m", "r"],
  m: ["n", "b"],
  r: ["n", "d"],
  ky: ["gy", "sh", "ch"],
  gy: ["ky", "j", "by"],
  sh: ["j", "ch", "s"],
  j: ["sh", "ch", "gy"],
  ch: ["sh", "j", "ky"],
  ny: ["my", "ry", "hy"],
  hy: ["by", "py", "ky"],
  by: ["py", "hy", "gy"],
  py: ["by", "hy"],
  my: ["ny", "by", "ry"],
  ry: ["ny", "my", "ky"],
};

export function levelStringToNumber(level: VocabularyLevel | string): JlptLevel {
  switch (level.toUpperCase()) {
    case "N1":
      return 1;
    case "N2":
      return 2;
    case "N3":
      return 3;
    case "N4":
      return 4;
    default:
      return 5;
  }
}

export function levelNumberToString(level: JlptLevel): VocabularyLevel {
  return `N${level}` as VocabularyLevel;
}

function normalizeGlossToken(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getVocabPrimaryMeaning(record: VocabularyRecord): string {
  if (record.modernMeaning && record.modernMeaning.trim()) {
    return record.modernMeaning.trim();
  }
  return record.meanings[0]?.trim() || record.word;
}

function getAllVocabMeanings(record: VocabularyRecord): string[] {
  const all = new Set<string>();
  if (record.modernMeaning?.trim()) {
    all.add(record.modernMeaning.trim());
  }
  for (const m of record.meanings) {
    if (m.trim()) all.add(m.trim());
  }
  if (Array.isArray(record.synonyms)) {
    for (const s of record.synonyms) {
      if (s.trim()) all.add(s.trim());
    }
  }
  return Array.from(all);
}

function meaningsOverlap(a: VocabularyRecord, b: VocabularyRecord): boolean {
  const aSet = new Set(getAllVocabMeanings(a).map(normalizeGlossToken).filter(Boolean));
  const bList = getAllVocabMeanings(b).map(normalizeGlossToken).filter(Boolean);
  for (const token of bList) {
    if (aSet.has(token)) return true;
  }
  return false;
}

/**
 * Extracts clean listening sentences from graded stories (with static MP3 paths)
 * and JLPT vocabulary examples.
 */
export function extractListeningSentences(
  vocabulary: VocabularyRecord[] = [],
  stories: StoryRecord[] = []
): ListeningSentenceItem[] {
  const items: ListeningSentenceItem[] = [];
  const seenJa = new Set<string>();

  // 1. Story sentences (have pre-built neural MP3s at /audio/stories/<slug>/<index>.mp3)
  for (const story of stories) {
    const queue = buildStoryAudioQueue(story);
    const jlpt = levelStringToNumber(story.level);

    for (const seg of queue) {
      const paragraph = story.paragraphs[seg.paragraphIndex];
      const sentObj = paragraph?.sentences?.[seg.sentenceIndex];
      const en = (sentObj?.naturalEn || sentObj?.literalEn || ( queue.length === story.paragraphs.length ? paragraph?.en : "" ) || "").trim();
      const cleanJa = cleanSentenceForAudio(seg.rawJa);

      if (!cleanJa || !en || cleanJa.length < 4) continue;
      if (seenJa.has(cleanJa)) continue;
      seenJa.add(cleanJa);

      // Build hiragana reading from tokens if available
      const tokens = sentObj?.tokens ?? paragraph?.tokens ?? [];
      const reading = tokens.length > 0
        ? tokens.map((t) => t.reading || t.surface).join("")
        : cleanJa;

      items.push({
        id: `story:${story.slug}:${seg.index}`,
        ja: cleanJa,
        reading,
        en,
        jlpt,
        audioSrc: seg.src,
      });
    }
  }

  // 2. Vocabulary example sentences
  for (const record of vocabulary) {
    const jlpt = levelStringToNumber(record.level);
    if (!Array.isArray(record.examples)) continue;

    for (let idx = 0; idx < record.examples.length; idx++) {
      const ex = record.examples[idx];
      const cleanJa = cleanSentenceForAudio(ex.ja || "");
      const en = (ex.en || "").trim();
      if (!cleanJa || !en || cleanJa.length < 4) continue;
      if (seenJa.has(cleanJa)) continue;
      seenJa.add(cleanJa);

      const reading = ex.furigana
        ? cleanSentenceForAudio(
            ex.furigana.replace(/([^\[\s]+)\[([^\]]+)\]/g, "$2")
          )
        : record.reading;

      items.push({
        id: `vocab-sent:${record.id}:${idx}`,
        ja: cleanJa,
        reading,
        en,
        jlpt,
      });
    }
  }

  return items;
}

function buildKanaDistractors(
  target: KanaCharacter,
  pool: KanaCharacter[],
  rng: () => number
): ListeningOption[] {
  const targetAudioKey = toKanaAudioKey(target.char, target.romaji[0]);
  const sameScriptPool = pool.filter(
    (c) =>
      c.script === target.script &&
      c.id !== target.id &&
      toKanaAudioKey(c.char, c.romaji[0]) !== targetAudioKey
  );
  const fallbackPool = kanaCharacters.filter(
    (c) =>
      c.script === target.script &&
      c.id !== target.id &&
      toKanaAudioKey(c.char, c.romaji[0]) !== targetAudioKey
  );
  const candidates = sameScriptPool.length >= 3 ? sameScriptPool : fallbackPool;

  const confusableRows = new Set<KanaRow>([
    target.row,
    ...(CONFUSABLE_ROW_PAIRS[target.row] ?? []),
  ]);

  // Tier 1: Same or phonetically confusable row
  const tier1 = shuffle(
    candidates.filter((c) => confusableRows.has(c.row)),
    rng
  );
  // Tier 2: Same group (basic, dakuten, yoon, extended)
  const tier2 = shuffle(
    candidates.filter((c) => !confusableRows.has(c.row) && c.group === target.group),
    rng
  );
  // Tier 3: Remaining in same script
  const tier3 = shuffle(
    candidates.filter((c) => !confusableRows.has(c.row) && c.group !== target.group),
    rng
  );

  const chosen: KanaCharacter[] = [];
  const usedAudioKeys = new Set<string>([targetAudioKey]);
  const usedLabels = new Set<string>([target.char]);

  for (const cand of [...tier1, ...tier2, ...tier3]) {
    if (chosen.length >= 3) break;
    const key = toKanaAudioKey(cand.char, cand.romaji[0]);
    if (usedAudioKeys.has(key) || usedLabels.has(cand.char)) continue;
    usedAudioKeys.add(key);
    usedLabels.add(cand.char);
    chosen.push(cand);
  }

  const options: ListeningOption[] = [
    {
      id: target.id,
      label: target.char,
      subLabel: target.romaji[0],
    },
    ...chosen.map((c) => ({
      id: c.id,
      label: c.char,
      subLabel: c.romaji[0],
    })),
  ];

  return shuffle(options, rng);
}

function buildVocabDistractors(
  target: VocabularyRecord,
  allVocab: VocabularyRecord[],
  rng: () => number
): ListeningOption[] {
  const targetMeaning = getVocabPrimaryMeaning(target);
  const sameLevel = shuffle(
    allVocab.filter(
      (v) =>
        v.id !== target.id &&
        v.level === target.level &&
        v.reading !== target.reading &&
        !meaningsOverlap(target, v)
    ),
    rng
  );
  const otherLevels = shuffle(
    allVocab.filter(
      (v) =>
        v.id !== target.id &&
        v.level !== target.level &&
        v.reading !== target.reading &&
        !meaningsOverlap(target, v)
    ),
    rng
  );

  const chosen: VocabularyRecord[] = [];
  const usedLabels = new Set<string>([normalizeGlossToken(targetMeaning)]);

  for (const cand of [...sameLevel, ...otherLevels]) {
    if (chosen.length >= 3) break;
    const meaning = getVocabPrimaryMeaning(cand);
    const norm = normalizeGlossToken(meaning);
    if (!norm || usedLabels.has(norm)) continue;
    if (chosen.some((existing) => meaningsOverlap(existing, cand))) continue;
    usedLabels.add(norm);
    chosen.push(cand);
  }

  const options: ListeningOption[] = [
    {
      id: target.id,
      label: targetMeaning,
      subLabel: `${target.word} (${target.reading})`,
    },
    ...chosen.map((c) => ({
      id: c.id,
      label: getVocabPrimaryMeaning(c),
      subLabel: `${c.word} (${c.reading})`,
    })),
  ];

  return shuffle(options, rng);
}

function buildSentenceDistractors(
  target: ListeningSentenceItem,
  allSentences: ListeningSentenceItem[],
  rng: () => number
): ListeningOption[] {
  const targetLen = target.en.length;
  const eligible = allSentences.filter(
    (s) =>
      s.id !== target.id &&
      s.ja !== target.ja &&
      normalizeGlossToken(s.en) !== normalizeGlossToken(target.en)
  );

  const sameLevel = eligible
    .filter((s) => s.jlpt === target.jlpt)
    .sort((a, b) => Math.abs(a.en.length - targetLen) - Math.abs(b.en.length - targetLen));
  const otherLevel = eligible
    .filter((s) => s.jlpt !== target.jlpt)
    .sort((a, b) => Math.abs(a.en.length - targetLen) - Math.abs(b.en.length - targetLen));

  // Take a window of similar-length sentences and shuffle them for variety
  const nearWindow = shuffle(sameLevel.slice(0, 18), rng);
  const restSame = shuffle(sameLevel.slice(18), rng);
  const restOther = shuffle(otherLevel, rng);

  const chosen: ListeningSentenceItem[] = [];
  const usedEn = new Set<string>([normalizeGlossToken(target.en)]);

  for (const cand of [...nearWindow, ...restSame, ...restOther]) {
    if (chosen.length >= 3) break;
    const norm = normalizeGlossToken(cand.en);
    if (!norm || usedEn.has(norm)) continue;
    usedEn.add(norm);
    chosen.push(cand);
  }

  const options: ListeningOption[] = [
    {
      id: target.id,
      label: target.en,
      subLabel: target.ja,
    },
    ...chosen.map((c) => ({
      id: c.id,
      label: c.en,
      subLabel: c.ja,
    })),
  ];

  return shuffle(options, rng);
}

export function createListeningSession(
  poolData: ListeningPoolData,
  settings: ListeningSettings,
  rng: () => number = Math.random,
  sessionId?: string,
  startedAt: number = Date.now()
): ListeningSession {
  const id =
    sessionId ??
    `listening-${startedAt.toString(36)}-${Math.floor(rng() * 1e8).toString(36)}`;
  const targetIds = settings.questionIds?.length ? new Set(settings.questionIds) : null;

  if (settings.subMode === "kana") {
    const script = settings.kanaScript ?? "hiragana";
    const groups = new Set<KanaGroup>(
      settings.kanaGroups?.length ? settings.kanaGroups : ["basic"]
    );
    const fullKana = poolData.kana?.length ? poolData.kana : kanaCharacters;

    let filtered = fullKana.filter((c) => {
      if (targetIds) return targetIds.has(c.id);
      const scriptMatch =
        script === "both"
          ? true
          : c.group === "extended"
            ? script === "katakana"
            : c.script === script;
      return scriptMatch && groups.has(c.group);
    });

    if (filtered.length === 0) {
      filtered = fullKana.filter((c) => c.script === "hiragana" && c.group === "basic");
    }

    const picked = shuffle(filtered, rng).slice(0, settings.size);
    const questions: ListeningQuestion[] = picked.map((item) => ({
      id: item.id,
      subMode: "kana",
      audioPayload: {
        type: "kana",
        charOrWord: item.char,
        reading: item.romaji[0],
      },
      hiddenPromptJa: item.char,
      hiddenReading: item.romaji[0],
      correctMeaning: item.romaji[0],
      acceptedAnswers: [...item.romaji, item.char],
      options: buildKanaDistractors(item, filtered, rng),
      status: "pending",
      mistakes: 0,
      replaysUsed: 0,
      timeMs: 0,
    }));

    return {
      sessionId: id,
      settings,
      questions,
      index: 0,
      startedAt,
    };
  }

  if (settings.subMode === "vocabulary") {
    const levelStrings = new Set(
      (settings.levels?.length ? settings.levels : ([5] as JlptLevel[])).map(levelNumberToString)
    );
    const allVocab = poolData.vocabulary ?? [];
    let filtered = allVocab.filter((v) =>
      targetIds ? targetIds.has(v.id) : levelStrings.has(v.level)
    );
    if (filtered.length === 0) {
      filtered = allVocab;
    }

    const picked = shuffle(filtered, rng).slice(0, settings.size);
    const questions: ListeningQuestion[] = picked.map((record) => {
      const primaryMeaning = getVocabPrimaryMeaning(record);
      const accepted = getAllVocabMeanings(record);
      return {
        id: record.id,
        subMode: "vocabulary",
        audioPayload: {
          type: "vocab",
          charOrWord: record.word,
          reading: record.reading,
        },
        hiddenPromptJa: record.word,
        hiddenReading: record.reading,
        correctMeaning: primaryMeaning,
        acceptedAnswers: accepted,
        options: buildVocabDistractors(record, allVocab.length >= 4 ? allVocab : filtered, rng),
        jlpt: levelStringToNumber(record.level),
        status: "pending",
        mistakes: 0,
        replaysUsed: 0,
        timeMs: 0,
      };
    });

    return {
      sessionId: id,
      settings,
      questions,
      index: 0,
      startedAt,
    };
  }

  // Sentences mode
  const allowedLevels = new Set<JlptLevel>(settings.levels?.length ? settings.levels : [5]);
  const allSentences =
    poolData.sentences && poolData.sentences.length > 0
      ? poolData.sentences
      : extractListeningSentences(poolData.vocabulary ?? [], poolData.stories ?? []);

  let filtered = allSentences.filter((s) =>
    targetIds ? targetIds.has(s.id) : allowedLevels.has(s.jlpt)
  );
  if (filtered.length === 0) {
    filtered = allSentences;
  }

  const picked = shuffle(filtered, rng).slice(0, settings.size);
  const questions: ListeningQuestion[] = picked.map((item) => ({
    id: item.id,
    subMode: "sentences",
    audioPayload: {
      type: "sentence",
      charOrWord: item.ja,
      reading: item.reading,
      sentenceJa: item.ja,
      audioSrc: item.audioSrc,
    },
    hiddenPromptJa: item.ja,
    hiddenReading: item.reading,
    correctMeaning: item.en,
    acceptedAnswers: [item.en],
    options: buildSentenceDistractors(item, allSentences.length >= 4 ? allSentences : filtered, rng),
    jlpt: item.jlpt,
    status: "pending",
    mistakes: 0,
    replaysUsed: 0,
    timeMs: 0,
  }));

  return {
    sessionId: id,
    settings,
    questions,
    index: 0,
    startedAt,
  };
}

export function checkListeningTypedAnswer(question: ListeningQuestion, rawInput: string): boolean {
  const trimmed = rawInput.trim();
  if (!trimmed) return false;

  if (question.subMode === "kana") {
    const normalized = trimmed.toLowerCase();
    return question.acceptedAnswers.some((ans) => ans.toLowerCase() === normalized);
  }

  // Also accept typing the exact Japanese word or reading
  if (trimmed === question.hiddenPromptJa || trimmed === question.hiddenReading) {
    return true;
  }

  const match = checkVocabularyAnswer(
    trimmed,
    question.acceptedAnswers,
    undefined,
    question.correctMeaning
  );
  return match.isMatch;
}

export function listeningReducer(
  state: ListeningSession,
  action: ListeningAction
): ListeningSession {
  const current = state.questions[state.index];

  switch (action.type) {
    case "INCREMENT_REPLAY": {
      if (!current) return state;
      const questions = state.questions.map((q, idx) =>
        idx === state.index ? { ...q, replaysUsed: q.replaysUsed + 1 } : q
      );
      return { ...state, questions };
    }

    case "SUBMIT_CHOICE": {
      if (!current || current.status !== "pending") return state;
      const chosenOption = current.options.find((o) => o.id === action.optionId);
      const isCorrect =
        action.optionId === current.id ||
        Boolean(
          chosenOption &&
            (chosenOption.label === current.correctMeaning ||
              chosenOption.label === current.hiddenPromptJa)
        );

      const questions = state.questions.map((q, idx) =>
        idx === state.index
          ? {
              ...q,
              status: isCorrect ? ("correct" as const) : ("wrong" as const),
              mistakes: isCorrect ? 0 : q.mistakes + 1,
              userAnswer: chosenOption?.label ?? action.optionId,
              timeMs: Math.max(0, action.timeMs),
            }
          : q
      );
      return { ...state, questions };
    }

    case "SUBMIT_TYPED": {
      if (!current || current.status !== "pending") return state;
      const trimmed = action.input.trim();
      if (!trimmed) return state;

      const isCorrect = checkListeningTypedAnswer(current, trimmed);
      const questions = state.questions.map((q, idx) =>
        idx === state.index
          ? {
              ...q,
              status: isCorrect ? ("correct" as const) : ("wrong" as const),
              mistakes: isCorrect ? 0 : q.mistakes + 1,
              userAnswer: trimmed,
              timeMs: Math.max(0, action.timeMs),
            }
          : q
      );
      return { ...state, questions };
    }

    case "SKIP": {
      if (!current || current.status !== "pending") return state;
      const questions = state.questions.map((q, idx) =>
        idx === state.index
          ? {
              ...q,
              status: "skipped" as const,
              timeMs: action.timeMs !== undefined ? Math.max(0, action.timeMs) : q.timeMs,
            }
          : q
      );
      return { ...state, questions };
    }

    case "NEXT": {
      if (action.forIndex !== undefined && action.forIndex !== state.index) {
        return state;
      }
      if (!current || current.status === "pending") {
        return state;
      }
      if (state.index + 1 < state.questions.length) {
        return {
          ...state,
          index: state.index + 1,
        };
      }
      return {
        ...state,
        completedAt: state.completedAt ?? Date.now(),
      };
    }

    case "END": {
      const hadPending = state.questions.some((q) => q.status === "pending");
      const questions = state.questions.map((q) =>
        q.status === "pending" ? { ...q, status: "skipped" as const } : q
      );
      return {
        ...state,
        questions,
        completedAt: action.endedAt ?? state.completedAt ?? Date.now(),
        endedEarly: hadPending || state.index < state.questions.length - 1,
      };
    }

    default:
      return state;
  }
}

export function summarizeListeningSession(session: ListeningSession): ListeningResultSummary {
  const total = session.questions.length;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalTimeMs = 0;
  let totalReplays = 0;

  for (const q of session.questions) {
    if (q.status === "correct") correct++;
    else if (q.status === "wrong") wrong++;
    else skipped++;
    totalTimeMs += q.timeMs || 0;
    totalReplays += q.replaysUsed || 0;
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const averageReplays = total > 0 ? Number((totalReplays / total).toFixed(1)) : 0;

  return {
    sessionId: session.sessionId,
    settings: session.settings,
    questions: session.questions,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? Date.now(),
    endedEarly: Boolean(session.endedEarly),
    total,
    correct,
    wrong,
    skipped,
    accuracy,
    totalTimeMs,
    averageReplays,
  };
}
