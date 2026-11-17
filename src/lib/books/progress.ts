import type {
    BookDetail,
    BookDialogueScene,
    BookGrammarItem,
    BookKanjiItem,
    BookLesson,
    BookPracticeSection,
    BookVocabItem,
} from "@/data/books";
import type { DictionaryDataMaps } from "@/data/dictionary";
import type { GrammarPoint } from "@/data/grammar";
import type { SrsItem } from "@/lib/srs/db";

export type LessonState = "not-started" | "in-progress" | "completed" | "review-needed";
export type BookTabKey = "vocab" | "grammar" | "kanji" | "dialogues" | "practice";

export interface LastStudiedLesson {
    bookId: string;
    lessonNumber: number;
    bookTitle: string;
    lessonTitle: string;
    japaneseTitle?: string;
    coverImage?: string;
    lastTab?: BookTabKey;
    updatedAt: number;
}

export interface LessonProgressMetrics {
    total: number;
    inSrs: number;
    mastered: number;
    dueCount: number;
    vocabDue: number;
    kanjiDue: number;
    grammarDue: number;
    percent: number;
    masteryPercent: number;
    state: LessonState;
}

export interface BookProgressSummary {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    reviewNeededLessons: number;
    totalItems: number;
    inSrsItems: number;
    masteredItems: number;
    overallPercent: number;
    masteryPercent: number;
}

export interface DashboardOverviewMetrics {
    lessonsCompleted: number;
    lessonsInProgress: number;
    totalLessons: number;
    overallPercent: number;
    vocabStudied: number;
    vocabMastered: number;
    kanjiStudied: number;
    kanjiMastered: number;
    grammarStudied: number;
    grammarMastered: number;
    due: {
        vocab: number;
        kanji: number;
        grammar: number;
        kana: number;
        total: number;
    };
    streakDays: number;
}

export interface SrsLookup {
    byKey: Map<string, SrsItem>;
    dueById: Set<string>;
    masteredById: Set<string>;
    nowMs: number;
}

export const LAST_STUDIED_STORAGE_KEY = "kanagame_last_studied_book";
export const RECENT_HISTORY_STORAGE_KEY = "kanagame_recent_book_history";

export function formatSectionLabel(tab?: string): string {
    switch (tab) {
        case "vocab":
            return "Vocabulary";
        case "grammar":
            return "Grammar";
        case "kanji":
            return "Kanji";
        case "dialogues":
            return "Dialogues";
        case "practice":
            return "Practice Drills";
        default:
            return "Overview";
    }
}

export function isMasteredSrsItem(item: SrsItem): boolean {
    if (!item.card) return false;
    return Boolean(
        item.card.state === 2 ||
        (typeof item.card.reps === "number" && item.card.reps >= 2) ||
        (typeof item.card.stability === "number" && item.card.stability >= 1)
    );
}

export function isDueSrsItem(item: SrsItem, nowMs: number): boolean {
    if (!item.card || item.card.due === undefined || item.card.due === null) return false;
    const dueMs =
        item.card.due instanceof Date
            ? item.card.due.getTime()
            : new Date(item.card.due).getTime();
    return !Number.isNaN(dueMs) && dueMs <= nowMs;
}

export function buildSrsLookup(srsItems: SrsItem[], nowMs: number = Date.now()): SrsLookup {
    const byKey = new Map<string, SrsItem>();
    const dueById = new Set<string>();
    const masteredById = new Set<string>();

    for (const item of srsItems) {
        byKey.set(item.id, item);
        if (item.prompt) {
            byKey.set(`${item.type}:${item.prompt.trim()}`, item);
        }
        if (isMasteredSrsItem(item)) {
            masteredById.add(item.id);
        }
        if (isDueSrsItem(item, nowMs)) {
            dueById.add(item.id);
        }
    }

    return { byKey, dueById, masteredById, nowMs };
}

export function computeLessonProgress(
    lesson: BookLesson,
    lookup: SrsLookup,
    isVisited: boolean = false
): LessonProgressMetrics {
    const total =
        (lesson.stats?.vocabularyCount ?? lesson.vocabulary.length) +
        (lesson.stats?.kanjiCount ?? lesson.kanji.length) +
        (lesson.stats?.grammarCount ?? lesson.grammar.length);

    if (total === 0) {
        return {
            total: 0,
            inSrs: 0,
            mastered: 0,
            dueCount: 0,
            vocabDue: 0,
            kanjiDue: 0,
            grammarDue: 0,
            percent: 0,
            masteryPercent: 0,
            state: isVisited ? "in-progress" : "not-started",
        };
    }

    let inSrs = 0;
    let mastered = 0;
    let vocabDue = 0;
    let kanjiDue = 0;
    let grammarDue = 0;

    for (const v of lesson.vocabulary) {
        const item = lookup.byKey.get(`vocab:${v.word.trim()}`);
        if (item) {
            inSrs++;
            if (lookup.masteredById.has(item.id)) mastered++;
            if (lookup.dueById.has(item.id)) vocabDue++;
        }
    }

    for (const k of lesson.kanji) {
        const codePoint = k.kanji.codePointAt(0)?.toString(16).toUpperCase() ?? k.kanji;
        const item =
            lookup.byKey.get(`kanji:${codePoint}`) || lookup.byKey.get(`kanji:${k.kanji.trim()}`);
        if (item) {
            inSrs++;
            if (lookup.masteredById.has(item.id)) mastered++;
            if (lookup.dueById.has(item.id)) kanjiDue++;
        }
    }

    for (const g of lesson.grammar) {
        const item =
            lookup.byKey.get(`grammar:${g.linkedGrammarId || g.id}`) ||
            lookup.byKey.get(`grammar:${g.id}`) ||
            lookup.byKey.get(`grammar:${g.pattern.trim()}`);
        if (item) {
            inSrs++;
            if (lookup.masteredById.has(item.id)) mastered++;
            if (lookup.dueById.has(item.id)) grammarDue++;
        }
    }

    const dueCount = vocabDue + kanjiDue + grammarDue;
    const percent = Math.min(100, Math.round((inSrs / total) * 100));
    const masteryPercent = Math.min(100, Math.round((mastered / total) * 100));

    let state: LessonState = "not-started";
    if (dueCount > 0) {
        state = "review-needed";
    } else if (percent >= 80) {
        state = "completed";
    } else if (inSrs > 0 || isVisited) {
        state = "in-progress";
    }

    return {
        total,
        inSrs,
        mastered,
        dueCount,
        vocabDue,
        kanjiDue,
        grammarDue,
        percent,
        masteryPercent,
        state,
    };
}

export function computeBookProgress(
    book: BookDetail | undefined,
    lookup: SrsLookup,
    visitedKeys?: Set<string>
): BookProgressSummary {
    if (!book || book.lessons.length === 0) {
        return {
            totalLessons: book?.totalLessons ?? 0,
            completedLessons: 0,
            inProgressLessons: 0,
            reviewNeededLessons: 0,
            totalItems: 0,
            inSrsItems: 0,
            masteredItems: 0,
            overallPercent: 0,
            masteryPercent: 0,
        };
    }

    let completedLessons = 0;
    let inProgressLessons = 0;
    let reviewNeededLessons = 0;
    let totalItems = 0;
    let inSrsItems = 0;
    let masteredItems = 0;

    for (const lesson of book.lessons) {
        const key = `${book.id}:${lesson.lessonNumber}`;
        const progress = computeLessonProgress(lesson, lookup, visitedKeys?.has(key));
        totalItems += progress.total;
        inSrsItems += progress.inSrs;
        masteredItems += progress.mastered;

        if (progress.state === "completed") completedLessons++;
        else if (progress.state === "review-needed") reviewNeededLessons++;
        else if (progress.state === "in-progress") inProgressLessons++;
    }

    const overallPercent =
        totalItems > 0 ? Math.min(100, Math.round((inSrsItems / totalItems) * 100)) : 0;
    const masteryPercent =
        totalItems > 0 ? Math.min(100, Math.round((masteredItems / totalItems) * 100)) : 0;

    return {
        totalLessons: book.lessons.length,
        completedLessons,
        inProgressLessons,
        reviewNeededLessons,
        totalItems,
        inSrsItems,
        masteredItems,
        overallPercent,
        masteryPercent,
    };
}

function toLocalDayKey(timestampMs: number): string {
    const d = new Date(timestampMs);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function computeStreakDays(
    srsItems: SrsItem[],
    recentHistory: LastStudiedLesson[] = [],
    nowMs: number = Date.now()
): number {
    const activeDays = new Set<string>();

    for (const item of srsItems) {
        if (typeof item.lastReviewedAt === "number" && item.lastReviewedAt > 0) {
            activeDays.add(toLocalDayKey(item.lastReviewedAt));
        } else if (item.card?.last_review) {
            const lr =
                item.card.last_review instanceof Date
                    ? item.card.last_review.getTime()
                    : new Date(item.card.last_review).getTime();
            if (!Number.isNaN(lr) && lr > 0) {
                activeDays.add(toLocalDayKey(lr));
            }
        }
    }

    for (const entry of recentHistory) {
        if (typeof entry.updatedAt === "number" && entry.updatedAt > 0) {
            activeDays.add(toLocalDayKey(entry.updatedAt));
        }
    }

    if (activeDays.size === 0) return 0;

    const oneDayMs = 24 * 60 * 60 * 1000;
    const todayKey = toLocalDayKey(nowMs);
    const yesterdayKey = toLocalDayKey(nowMs - oneDayMs);

    let cursorMs: number | null = null;
    if (activeDays.has(todayKey)) {
        cursorMs = nowMs;
    } else if (activeDays.has(yesterdayKey)) {
        cursorMs = nowMs - oneDayMs;
    }

    if (cursorMs === null) return 0;

    let streak = 0;
    while (activeDays.has(toLocalDayKey(cursorMs))) {
        streak++;
        cursorMs -= oneDayMs;
    }

    return streak;
}

export function computeDashboardOverview(
    allBooks: Record<string, BookDetail>,
    srsItems: SrsItem[],
    lookup: SrsLookup,
    visitedKeys?: Set<string>,
    recentHistory: LastStudiedLesson[] = []
): DashboardOverviewMetrics {
    let lessonsCompleted = 0;
    let lessonsInProgress = 0;
    let totalLessons = 0;
    let totalCurriculumItems = 0;
    let totalInSrsCurriculumItems = 0;

    for (const book of Object.values(allBooks)) {
        const summary = computeBookProgress(book, lookup, visitedKeys);
        totalLessons += summary.totalLessons;
        lessonsCompleted += summary.completedLessons;
        lessonsInProgress += summary.inProgressLessons + summary.reviewNeededLessons;
        totalCurriculumItems += summary.totalItems;
        totalInSrsCurriculumItems += summary.inSrsItems;
    }

    let vocabStudied = 0;
    let vocabMastered = 0;
    let kanjiStudied = 0;
    let kanjiMastered = 0;
    let grammarStudied = 0;
    let grammarMastered = 0;

    let vocabDue = 0;
    let kanjiDue = 0;
    let grammarDue = 0;
    let kanaDue = 0;

    for (const item of srsItems) {
        const mastered = lookup.masteredById.has(item.id);
        const due = lookup.dueById.has(item.id);

        if (item.type === "vocab") {
            vocabStudied++;
            if (mastered) vocabMastered++;
            if (due) vocabDue++;
        } else if (item.type === "kanji") {
            kanjiStudied++;
            if (mastered) kanjiMastered++;
            if (due) kanjiDue++;
        } else if (item.type === "grammar") {
            grammarStudied++;
            if (mastered) grammarMastered++;
            if (due) grammarDue++;
        } else if (item.type === "kana") {
            if (due) kanaDue++;
        }
    }

    const totalDue = vocabDue + kanjiDue + grammarDue + kanaDue;
    const overallPercent =
        totalCurriculumItems > 0
            ? Math.min(100, Math.round((totalInSrsCurriculumItems / totalCurriculumItems) * 100))
            : 0;

    return {
        lessonsCompleted,
        lessonsInProgress,
        totalLessons,
        overallPercent,
        vocabStudied,
        vocabMastered,
        kanjiStudied,
        kanjiMastered,
        grammarStudied,
        grammarMastered,
        due: {
            vocab: vocabDue,
            kanji: kanjiDue,
            grammar: grammarDue,
            kana: kanaDue,
            total: totalDue,
        },
        streakDays: computeStreakDays(srsItems, recentHistory, lookup.nowMs),
    };
}

export function loadLastStudiedLesson(): LastStudiedLesson | null {
    try {
        if (typeof window === "undefined") return null;
        const raw = window.localStorage.getItem(LAST_STUDIED_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.bookId && parsed?.lessonNumber) {
            return parsed as LastStudiedLesson;
        }
        return null;
    } catch {
        return null;
    }
}

export function clearLastStudiedLesson(): void {
    try {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(LAST_STUDIED_STORAGE_KEY);
        }
    } catch {
        // ignore
    }
}

export function loadRecentStudiedLessons(): LastStudiedLesson[] {
    try {
        if (typeof window === "undefined") return [];
        const raw = window.localStorage.getItem(RECENT_HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (entry): entry is LastStudiedLesson =>
                Boolean(entry && typeof entry.bookId === "string" && typeof entry.lessonNumber === "number")
        );
    } catch {
        return [];
    }
}

export function recordStudiedLesson(entry: LastStudiedLesson): void {
    try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(LAST_STUDIED_STORAGE_KEY, JSON.stringify(entry));

        const existing = loadRecentStudiedLessons();
        const filtered = existing.filter(
            (item) => !(item.bookId === entry.bookId && item.lessonNumber === entry.lessonNumber)
        );
        const updated = [entry, ...filtered].slice(0, 6);
        window.localStorage.setItem(RECENT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // ignore localStorage errors
    }
}

export interface DetailedLessonOverview {
    overall: LessonProgressMetrics;
    vocab: { total: number; studied: number; mastered: number; due: number };
    grammar: { total: number; studied: number; mastered: number; due: number };
    kanji: { total: number; studied: number; mastered: number; due: number };
    dialogues: { total: number; completed: number };
    practice: { total: number; attempted: number; mastered: number };
}

export type DialogueLearningMode = "reading" | "listening" | "shadowing" | "roleplay" | "vocab";

export interface DialogueSceneStats {
    lineCount: number;
    uniqueSpeakers: string[];
    hasAudio: boolean;
    audioTrackCount: number;
}

export interface LessonWorkspacePersistedState {
    vocabTypeFilter?: string;
    vocabStatusFilter?: "all" | "new" | "learning" | "mastered" | "due";
    vocabStudyMode?: "show-all" | "hide-en" | "hide-kana";
    vocabViewMode?: "grid" | "list" | "flip";
    vocabLearningMode?: "ja-en" | "en-ja" | "reading" | "typing" | "listening";
    grammarStudyStatus?: Record<string, GrammarStudyStatus>;
    grammarStatusFilter?: "all" | GrammarStudyStatus | "in-srs";
    kanjiViewMode?: "grid" | "list";
    kanjiStatusFilter?: "all" | VocabSrsState;
    kanjiStrokeFilter?: "all" | "1-4" | "5-8" | "9+";
    kanjiJlptFilter?: string;
    selectedPracticePart?: string;
    userPracticeInputs?: Record<string, string>;
    practiceFeedback?: Record<string, "correct" | "incorrect">;
    selfCheckFeedback?: Record<string, "got-it" | "review">;
    completedDialogueIds?: string[];
    dialogueLearningMode?: DialogueLearningMode;
    dialogueActiveSceneId?: string;
    practiceMode?: "worksheet" | "focused";
    practiceCategoryFilter?: string;
}

export function getAdjacentLessonNumbers(
    book: BookDetail | null,
    currentLessonNumber: number
): { prevLessonNumber: number | null; nextLessonNumber: number | null } {
    if (!book || book.lessons.length === 0) {
        return { prevLessonNumber: null, nextLessonNumber: null };
    }

    const orderedNumbers = book.lessons
        .map((l) => l.lessonNumber)
        .sort((a, b) => a - b);
    const currentIdx = orderedNumbers.indexOf(currentLessonNumber);

    if (currentIdx === -1) {
        return { prevLessonNumber: null, nextLessonNumber: null };
    }

    return {
        prevLessonNumber: currentIdx > 0 ? orderedNumbers[currentIdx - 1] : null,
        nextLessonNumber:
            currentIdx < orderedNumbers.length - 1 ? orderedNumbers[currentIdx + 1] : null,
    };
}

export function computeDetailedLessonOverview(
    lesson: BookLesson,
    lookup: SrsLookup,
    workspaceState?: LessonWorkspacePersistedState,
    isVisited: boolean = false
): DetailedLessonOverview {
    const overall = computeLessonProgress(lesson, lookup, isVisited);

    let vocabStudied = 0;
    let vocabMastered = 0;
    let vocabDue = 0;
    for (const v of lesson.vocabulary) {
        const item = lookup.byKey.get(`vocab:${v.word.trim()}`);
        if (item) {
            vocabStudied++;
            if (lookup.masteredById.has(item.id)) vocabMastered++;
            if (lookup.dueById.has(item.id)) vocabDue++;
        }
    }

    let kanjiStudied = 0;
    let kanjiMastered = 0;
    let kanjiDue = 0;
    for (const k of lesson.kanji) {
        const codePoint = k.kanji.codePointAt(0)?.toString(16).toUpperCase() ?? k.kanji;
        const item =
            lookup.byKey.get(`kanji:${codePoint}`) || lookup.byKey.get(`kanji:${k.kanji.trim()}`);
        if (item) {
            kanjiStudied++;
            if (lookup.masteredById.has(item.id)) kanjiMastered++;
            if (lookup.dueById.has(item.id)) kanjiDue++;
        }
    }

    let grammarStudied = 0;
    let grammarMastered = 0;
    let grammarDue = 0;
    for (const g of lesson.grammar) {
        const item =
            lookup.byKey.get(`grammar:${g.linkedGrammarId || g.id}`) ||
            lookup.byKey.get(`grammar:${g.id}`) ||
            lookup.byKey.get(`grammar:${g.pattern.trim()}`);
        if (item) {
            grammarStudied++;
            if (lookup.masteredById.has(item.id)) grammarMastered++;
            if (lookup.dueById.has(item.id)) grammarDue++;
        }
    }

    const totalDialogues = lesson.dialogues?.length ?? 0;
    const completedDialogueSet = new Set(workspaceState?.completedDialogueIds ?? []);
    const completedDialogues = lesson.dialogues
        ? lesson.dialogues.filter((d) => completedDialogueSet.has(d.id)).length
        : 0;

    const allPracticeItems = lesson.practice?.flatMap((s) => s.items) ?? [];
    const feedbackMap = workspaceState?.practiceFeedback ?? {};
    let practiceAttempted = 0;
    let practiceMastered = 0;
    for (const item of allPracticeItems) {
        const fb = feedbackMap[item.id];
        if (fb) {
            practiceAttempted++;
            if (fb === "correct") practiceMastered++;
        }
    }

    return {
        overall,
        vocab: {
            total: lesson.stats?.vocabularyCount ?? lesson.vocabulary.length,
            studied: vocabStudied,
            mastered: vocabMastered,
            due: vocabDue,
        },
        grammar: {
            total: lesson.stats?.grammarCount ?? lesson.grammar.length,
            studied: grammarStudied,
            mastered: grammarMastered,
            due: grammarDue,
        },
        kanji: {
            total: lesson.stats?.kanjiCount ?? lesson.kanji.length,
            studied: kanjiStudied,
            mastered: kanjiMastered,
            due: kanjiDue,
        },
        dialogues: {
            total: totalDialogues,
            completed: completedDialogues,
        },
        practice: {
            total: lesson.stats?.practiceCount ?? allPracticeItems.length,
            attempted: practiceAttempted,
            mastered: practiceMastered,
        },
    };
}

export function getLessonWorkspaceStorageKey(bookId: string, lessonNumber: number): string {
    return `kanagame_lesson_workspace:${bookId}:${lessonNumber}`;
}

export function loadLessonWorkspaceState(
    bookId: string,
    lessonNumber: number
): LessonWorkspacePersistedState {
    try {
        if (typeof window === "undefined") return {};
        const raw = window.localStorage.getItem(getLessonWorkspaceStorageKey(bookId, lessonNumber));
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as LessonWorkspacePersistedState) : {};
    } catch {
        return {};
    }
}

export function saveLessonWorkspaceState(
    bookId: string,
    lessonNumber: number,
    state: LessonWorkspacePersistedState
): void {
    try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(
            getLessonWorkspaceStorageKey(bookId, lessonNumber),
            JSON.stringify(state)
        );
    } catch {
        // ignore localStorage errors
    }
}

export type VocabSrsState = "new" | "learning" | "mastered" | "due";

export interface VocabSrsInfo {
    state: VocabSrsState;
    item?: SrsItem;
    srsId: string;
    dueDate?: Date;
    reps: number;
    stability?: number;
}

export interface ContextualVocabExample {
    id: string;
    ja: string;
    en: string;
    source: "dialogue" | "grammar" | "practice" | "dictionary";
    sourceLabel: string;
    audioSrc?: string;
    targetTab?: "dialogues" | "grammar" | "practice";
    targetId?: string;
}

export interface ContextualKanjiEntry {
    char: string;
    meaning: string;
    onyomi: string[];
    kunyomi: string[];
    strokes?: number;
    jlpt?: number;
    inLesson: boolean;
}

export interface ContextualVocabDetails {
    examples: ContextualVocabExample[];
    kanjiBreakdown: ContextualKanjiEntry[];
    relatedVocab: BookVocabItem[];
    partOfSpeechLabel: string;
    dictionaryRecord?: {
        level?: string;
        romaji?: string;
        pos?: string[];
    };
}

const KANJI_CHAR_REGEX = /[\u4E00-\u9FAF\u3400-\u4DBF]/;

export function getVocabSrsInfo(word: string, lookup: SrsLookup): VocabSrsInfo {
    const srsId = `vocab:${word.trim()}`;
    const item = lookup.byKey.get(srsId);
    if (!item) {
        return { state: "new", srsId, reps: 0 };
    }

    let state: VocabSrsState = "learning";
    if (lookup.dueById.has(item.id)) {
        state = "due";
    } else if (lookup.masteredById.has(item.id)) {
        state = "mastered";
    }

    const rawDue = item.card?.due;
    const parsedDue = rawDue ? (rawDue instanceof Date ? rawDue : new Date(rawDue)) : undefined;
    const dueDate = parsedDue && !Number.isNaN(parsedDue.getTime()) ? parsedDue : undefined;

    return {
        state,
        item,
        srsId: item.id,
        dueDate,
        reps: typeof item.card?.reps === "number" ? item.card.reps : 0,
        stability: typeof item.card?.stability === "number" ? item.card.stability : undefined,
    };
}

const POS_LABEL_MAP: Record<string, string> = {
    n: "Noun",
    noun: "Noun",
    nouns: "Noun",
    v: "Verb",
    verb: "Verb",
    verbs: "Verb",
    "u-v": "U-Verb",
    "u-verb": "U-Verb",
    "ru-v": "Ru-Verb",
    "ru-verb": "Ru-Verb",
    irr: "Irregular Verb",
    "irr-v": "Irregular Verb",
    "irr-verb": "Irregular Verb",
    "irregular verb": "Irregular Verb",
    adjective: "Adjective",
    adjectives: "Adjective",
    "i-adj": "い-Adjective",
    "i-adjective": "い-Adjective",
    "na-adj": "な-Adjective",
    "na-adjective": "な-Adjective",
    adv: "Adverb",
    adverb: "Adverb",
    expr: "Expression",
    expression: "Expression",
    expressions: "Expression",
    ctr: "Counter",
    counter: "Counter",
    particle: "Particle",
    conjunction: "Conjunction",
    pronoun: "Pronoun",
};

export function formatPartOfSpeech(rawType?: string): string {
    const cleaned = (rawType ?? "").trim();
    if (!cleaned) return "Word";
    const mapped = POS_LABEL_MAP[cleaned.toLowerCase()];
    if (mapped) return mapped;
    return cleaned
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function stripVocabDecorations(value: string): string {
    return value.replace(/[〜～()（）\[\]・]/g, "").trim();
}

export function getContextualVocabDetails(
    vocabItem: BookVocabItem,
    lesson: BookLesson,
    dictMaps?: DictionaryDataMaps | null
): ContextualVocabDetails {
    const cleanWord = stripVocabDecorations(vocabItem.word);
    const cleanKana = stripVocabDecorations(vocabItem.readingKana);
    const matchTokens = Array.from(new Set([cleanWord, cleanKana])).filter(
        (token) => token.length >= 2 || (token.length === 1 && KANJI_CHAR_REGEX.test(token))
    );

    const matchesText = (text?: string): boolean => {
        if (!text) return false;
        return matchTokens.some((token) => text.includes(token));
    };

    const examples: ContextualVocabExample[] = [];
    const seenJa = new Set<string>();
    const addExample = (ex: ContextualVocabExample) => {
        const key = ex.ja.trim();
        if (!key || seenJa.has(key) || examples.length >= 5) return;
        seenJa.add(key);
        examples.push(ex);
    };

    for (const scene of lesson.dialogues ?? []) {
        for (let i = 0; i < scene.lines.length; i++) {
            const line = scene.lines[i];
            if (matchesText(line.ja)) {
                addExample({
                    id: `dlg-${scene.id}-${i}`,
                    ja: line.ja,
                    en: line.en,
                    source: "dialogue",
                    sourceLabel: `Dialogue ${scene.sceneNumber}`,
                    audioSrc: line.audioSrc,
                    targetTab: "dialogues",
                    targetId: scene.id,
                });
            }
        }
    }

    for (const grammar of lesson.grammar ?? []) {
        for (let i = 0; i < grammar.examples.length; i++) {
            const ex = grammar.examples[i];
            if (matchesText(ex.ja)) {
                addExample({
                    id: `gram-${grammar.id}-${i}`,
                    ja: ex.ja,
                    en: ex.en || ex.promptEn || "",
                    source: "grammar",
                    sourceLabel: grammar.pattern,
                    audioSrc: ex.audioSrc,
                    targetTab: "grammar",
                    targetId: grammar.id,
                });
            }
        }
    }

    for (const section of lesson.practice ?? []) {
        for (const item of section.items) {
            if (matchesText(item.answer)) {
                addExample({
                    id: `prac-${section.id}-${item.id}`,
                    ja: item.answer,
                    en: item.prompt,
                    source: "practice",
                    sourceLabel: section.title,
                    audioSrc: item.audioSrc,
                    targetTab: "practice",
                    targetId: section.id,
                });
            }
        }
    }

    if (dictMaps && examples.length < 5) {
        const keywordIndices = new Set<number>([
            ...(dictMaps.index.keywords[cleanWord]?.s ?? []),
            ...(dictMaps.index.keywords[cleanKana]?.s ?? []),
        ]);

        for (const idx of keywordIndices) {
            const sentence = dictMaps.index.sentences[idx];
            if (sentence && matchesText(sentence.jp)) {
                addExample({
                    id: `dict-${sentence.id}`,
                    ja: sentence.jp,
                    en: sentence.en,
                    source: "dictionary",
                    sourceLabel: "Example Bank",
                });
            }
            if (examples.length >= 5) break;
        }

        if (examples.length < 5 && matchTokens.length > 0) {
            for (const sentence of dictMaps.index.sentences) {
                if (matchesText(sentence.jp)) {
                    addExample({
                        id: `dict-${sentence.id}`,
                        ja: sentence.jp,
                        en: sentence.en,
                        source: "dictionary",
                        sourceLabel: "Example Bank",
                    });
                    if (examples.length >= 5) break;
                }
            }
        }
    }

    const lessonKanjiMap = new Map(lesson.kanji.map((k) => [k.kanji.trim(), k]));
    const seenKanji = new Set<string>();
    const kanjiBreakdown: ContextualKanjiEntry[] = [];

    for (const ch of vocabItem.word) {
        if (!KANJI_CHAR_REGEX.test(ch) || seenKanji.has(ch)) continue;
        seenKanji.add(ch);
        const lessonKanji = lessonKanjiMap.get(ch);
        const dictKanji = dictMaps?.index.kanji[ch];
        kanjiBreakdown.push({
            char: ch,
            meaning:
                lessonKanji?.meaning ||
                (dictKanji?.meanings?.length ? dictKanji.meanings.slice(0, 3).join(", ") : "Kanji character"),
            onyomi: lessonKanji?.onyomi ?? dictKanji?.on ?? [],
            kunyomi: lessonKanji?.kunyomi ?? dictKanji?.kun ?? [],
            strokes: lessonKanji?.strokes ?? dictKanji?.strokes,
            jlpt: lessonKanji?.jlpt ?? dictKanji?.jlpt,
            inLesson: Boolean(lessonKanji),
        });
    }

    const targetKanjiSet = new Set(kanjiBreakdown.map((k) => k.char));
    const targetIndex = lesson.vocabulary.findIndex((item) => item.id === vocabItem.id);
    const scoredRelated = lesson.vocabulary
        .map((candidate, idx) => {
            if (candidate.id === vocabItem.id) return null;
            let score = 0;
            for (const ch of candidate.word) {
                if (targetKanjiSet.has(ch)) {
                    score += 5;
                    break;
                }
            }
            if (candidate.type && candidate.type === vocabItem.type) {
                score += 2;
            }
            if (targetIndex >= 0 && Math.abs(idx - targetIndex) <= 3) {
                score += 1;
            }
            return score > 0 ? { candidate, score } : null;
        })
        .filter((entry): entry is { candidate: BookVocabItem; score: number } => entry !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((entry) => entry.candidate);

    const dictEntry =
        dictMaps?.vocabByWord.get(cleanWord) || dictMaps?.vocabByReading.get(cleanKana);

    return {
        examples,
        kanjiBreakdown,
        relatedVocab: scoredRelated,
        partOfSpeechLabel: formatPartOfSpeech(vocabItem.type),
        dictionaryRecord: dictEntry
            ? {
                level: dictEntry.level,
                romaji: dictEntry.romaji,
                pos: dictEntry.pos,
            }
            : undefined,
    };
}

export type GrammarStudyStatus = "not-studied" | "studying" | "understood";

export interface GrammarSrsInfo {
    inSrs: boolean;
    mastered: boolean;
    due: boolean;
    srsId: string;
    reps: number;
}

export interface GrammarPracticeQuestion {
    id: string;
    format: "cloze" | "sentence-completion" | "multiple-choice";
    formatLabel: string;
    promptJa?: string;
    promptEn: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    audioSrc?: string;
}

export interface ContextualGrammarDetails {
    shortMeaning: string;
    readingRomaji?: string;
    jlptLevel: string;
    formationRules: string[];
    usageNotes: Array<{ text: string; isWarning: boolean }>;
    structuredNotes?: {
        nuance?: string;
        contrast?: string;
        pitfalls?: string;
    };
    highlightToken?: string;
    linkedPracticeSections: BookPracticeSection[];
    relatedLessonGrammar: BookGrammarItem[];
    practiceQuestions: GrammarPracticeQuestion[];
}

export function getGrammarSrsInfo(
    grammarItem: BookGrammarItem,
    lookup: SrsLookup
): GrammarSrsInfo {
    const defaultSrsId = `grammar:${grammarItem.linkedGrammarId || grammarItem.id}`;
    const item =
        lookup.byKey.get(`grammar:${grammarItem.linkedGrammarId || grammarItem.id}`) ||
        lookup.byKey.get(`grammar:${grammarItem.id}`) ||
        lookup.byKey.get(`grammar:${grammarItem.pattern.trim()}`);

    if (!item) {
        return {
            inSrs: false,
            mastered: false,
            due: false,
            srsId: defaultSrsId,
            reps: 0,
        };
    }

    return {
        inSrs: true,
        mastered: lookup.masteredById.has(item.id),
        due: lookup.dueById.has(item.id),
        srsId: item.id,
        reps: typeof item.card?.reps === "number" ? item.card.reps : 0,
    };
}

const JAPANESE_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
const WARNING_NOTE_REGEX = /\b(note|trap|exception|warning|careful|irregular|caution|avoid|distinction)\b/i;

function extractGrammarHighlightToken(pattern: string): string | undefined {
    const segments = pattern
        .split(/(?:Noun|Verb|Adj(?:ective)?|Clause|Sentence|[XYAB]|N\d+|[〜~`+\s/／・()（）])+/gi)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && JAPANESE_CHAR_REGEX.test(s));

    if (segments.length === 0) return undefined;
    segments.sort((a, b) => b.length - a.length);
    return segments[0];
}

function buildDeterministicOptions(correct: string, distractors: string[]): string[] {
    const unique = Array.from(
        new Set([correct, ...distractors.map((d) => d.trim()).filter((d) => d && d !== correct)])
    ).slice(0, 4);
    return unique.sort((a, b) => a.localeCompare(b, "ja"));
}

const FALLBACK_CLOZE_DISTRACTORS = ["は", "が", "を", "に", "で", "へ", "です", "ます", "ません"];

export function getContextualGrammarDetails(
    grammarItem: BookGrammarItem,
    lesson: BookLesson,
    linkedPoint?: GrammarPoint | null,
    defaultLevel: string = "N5"
): ContextualGrammarDetails {
    const shortMeaning =
        linkedPoint?.meaning ||
        linkedPoint?.short ||
        grammarItem.linkedGrammarTitle ||
        grammarItem.title;
    const readingRomaji = linkedPoint?.romaji || undefined;
    const jlptLevel =
        grammarItem.linkedGrammarId?.split("/")[0] ||
        linkedPoint?.level ||
        defaultLevel;

    const formationRules =
        linkedPoint?.formation && linkedPoint.formation.length > 0
            ? linkedPoint.formation
            : grammarItem.pattern.trim()
                ? [grammarItem.pattern.trim()]
                : [];

    const usageNotes = grammarItem.bulletPoints.map((text) => ({
        text,
        isWarning: WARNING_NOTE_REGEX.test(text),
    }));

    const structuredNotes = linkedPoint?.notes
        ? {
            nuance: linkedPoint.notes.nuance || undefined,
            contrast: linkedPoint.notes.contrast || undefined,
            pitfalls: linkedPoint.notes.pitfalls || undefined,
        }
        : undefined;

    const highlightToken = extractGrammarHighlightToken(grammarItem.pattern);

    const normalizedPattern = grammarItem.pattern.trim().toLowerCase();
    const normalizedTitle = grammarItem.title.trim().toLowerCase();

    const linkedPracticeSections = (lesson.practice ?? []).filter((sec) => {
        if (sec.grammarIndex !== undefined && sec.grammarIndex === grammarItem.index) {
            return true;
        }
        if (sec.grammarTitle) {
            const gt = sec.grammarTitle.trim().toLowerCase();
            return gt === normalizedTitle || gt === normalizedPattern;
        }
        return false;
    });

    const relatedLessonGrammar = lesson.grammar
        .filter((candidate) => candidate.id !== grammarItem.id)
        .map((candidate) => {
            let score = 0;
            if (Math.abs(candidate.index - grammarItem.index) === 1) score += 4;
            if (candidate.linkedGrammarId && grammarItem.linkedGrammarId) score += 2;
            if (
                highlightToken &&
                (candidate.pattern.includes(highlightToken) || candidate.title.includes(highlightToken))
            ) {
                score += 3;
            }
            return { candidate, score };
        })
        .sort((a, b) => b.score - a.score || a.candidate.index - b.candidate.index)
        .slice(0, 4)
        .map((entry) => entry.candidate);

    const practiceQuestions: GrammarPracticeQuestion[] = [];
    const otherGrammarTokens = lesson.grammar
        .filter((g) => g.id !== grammarItem.id)
        .map((g) => extractGrammarHighlightToken(g.pattern))
        .filter((tok): tok is string => Boolean(tok));

    const baseExplanation = `${grammarItem.title} (${grammarItem.pattern}): ${grammarItem.explanation}`;

    const linkedClozeExample = linkedPoint?.examples.find(
        (ex) => ex.cloze && ex.cloze.answer.trim().length > 0
    );
    if (linkedClozeExample?.cloze) {
        const answer = linkedClozeExample.cloze.answer.trim();
        const options = buildDeterministicOptions(answer, [
            ...otherGrammarTokens,
            ...FALLBACK_CLOZE_DISTRACTORS,
        ]);
        if (options.length >= 2) {
            practiceQuestions.push({
                id: `cloze-${grammarItem.id}`,
                format: "cloze",
                formatLabel: "Fill in the Blank",
                promptJa: `${linkedClozeExample.cloze.before} [ ___ ] ${linkedClozeExample.cloze.after}`,
                promptEn:
                    linkedClozeExample.promptEn ||
                    linkedClozeExample.en ||
                    linkedClozeExample.naturalEn ||
                    grammarItem.title,
                options,
                correctAnswer: answer,
                explanation: `Correct sentence: "${linkedClozeExample.ja}". ${baseExplanation}`,
            });
        }
    } else if (highlightToken) {
        const matchExample = grammarItem.examples.find(
            (ex) => ex.ja.includes(highlightToken) && ex.ja.trim() !== highlightToken && (ex.en || ex.promptEn)
        );
        if (matchExample) {
            const idx = matchExample.ja.indexOf(highlightToken);
            const before = matchExample.ja.slice(0, idx);
            const after = matchExample.ja.slice(idx + highlightToken.length);
            const options = buildDeterministicOptions(highlightToken, [
                ...otherGrammarTokens,
                ...FALLBACK_CLOZE_DISTRACTORS,
            ]);
            if (options.length >= 2) {
                practiceQuestions.push({
                    id: `cloze-${grammarItem.id}`,
                    format: "cloze",
                    formatLabel: "Fill in the Blank",
                    promptJa: `${before} [ ___ ] ${after}`,
                    promptEn: matchExample.promptEn || matchExample.en || grammarItem.title,
                    options,
                    correctAnswer: highlightToken,
                    explanation: `Correct sentence: "${matchExample.ja}" (${matchExample.en || ""}). ${baseExplanation}`,
                    audioSrc: matchExample.audioSrc,
                });
            }
        }
    }

    const translatedExamples = grammarItem.examples.filter(
        (ex) => ex.ja.trim() && (ex.en || ex.promptEn)
    );
    const otherSentences = [
        ...lesson.grammar
            .filter((g) => g.id !== grammarItem.id)
            .flatMap((g) => g.examples.map((e) => e.ja.trim())),
        ...(lesson.dialogues ?? []).flatMap((d) => d.lines.map((l) => l.ja.trim())),
    ].filter(Boolean);

    if (translatedExamples.length > 0 && otherSentences.length > 0) {
        const targetEx = translatedExamples[0];
        const options = buildDeterministicOptions(targetEx.ja.trim(), otherSentences);
        if (options.length >= 2) {
            practiceQuestions.push({
                id: `mcq-${grammarItem.id}`,
                format: "multiple-choice",
                formatLabel: "Correct Sentence",
                promptEn:
                    targetEx.promptEn ||
                    `Choose the Japanese sentence meaning "${targetEx.en}":`,
                options,
                correctAnswer: targetEx.ja.trim(),
                explanation: `"${targetEx.ja}" means "${targetEx.en || targetEx.promptEn}". ${baseExplanation}`,
                audioSrc: targetEx.audioSrc,
            });
        }
    }

    const completionExample = translatedExamples[1] ?? translatedExamples[0];
    if (completionExample && completionExample.ja.trim().length >= 4) {
        const cleanSentence = completionExample.ja.trim().replace(/[。．！？!?]+$/, "");
        const knownEndings = ["ませんか", "ません", "ました", "ましょう", "ています", "ていません", "ですよ", "ですね", "ですか", "です", "ます"];
        const matchedEnding = knownEndings.find(
            (ending) => cleanSentence.endsWith(ending) && cleanSentence.length > ending.length + 1
        );
        if (matchedEnding) {
            const prefix = cleanSentence.slice(0, cleanSentence.length - matchedEnding.length);
            const endingDistractors = ["です", "ます", "ません", "ませんか", "ました", ...otherGrammarTokens];
            const options = buildDeterministicOptions(matchedEnding, endingDistractors);
            if (options.length >= 2) {
                practiceQuestions.push({
                    id: `comp-${grammarItem.id}`,
                    format: "sentence-completion",
                    formatLabel: "Sentence Completion",
                    promptJa: `${prefix} [ ___ ]`,
                    promptEn: `Complete the sentence for "${completionExample.en || completionExample.promptEn}":`,
                    options,
                    correctAnswer: matchedEnding,
                    explanation: `Full sentence: "${completionExample.ja}". ${baseExplanation}`,
                    audioSrc: completionExample.audioSrc,
                });
            }
        }
    }

    if (practiceQuestions.length === 0 && linkedPracticeSections.length > 0) {
        for (const sec of linkedPracticeSections) {
            const targetItem = sec.items.find((it) => it.prompt.trim() && it.answer.trim());
            if (!targetItem) continue;
            const itemDistractors = [
                ...sec.items.map((it) => it.answer.trim()),
                ...grammarItem.examples.map((ex) => ex.ja.trim()),
            ].filter((val) => val && val !== targetItem.answer.trim());
            const options = buildDeterministicOptions(targetItem.answer.trim(), itemDistractors);
            if (options.length >= 2) {
                practiceQuestions.push({
                    id: `prac-${grammarItem.id}-${targetItem.id}`,
                    format: "multiple-choice",
                    formatLabel: "Multiple Choice",
                    promptEn: `${sec.title}: "${targetItem.prompt}${targetItem.cue ? ` (${targetItem.cue})` : ""}"`,
                    options,
                    correctAnswer: targetItem.answer.trim(),
                    explanation: `From Part ${sec.part} (${sec.title}): "${targetItem.answer}". ${baseExplanation}`,
                    audioSrc: targetItem.audioSrc,
                });
                break;
            }
        }
    }

    return {
        shortMeaning,
        readingRomaji,
        jlptLevel,
        formationRules,
        usageNotes,
        structuredNotes,
        highlightToken,
        linkedPracticeSections,
        relatedLessonGrammar,
        practiceQuestions,
    };
}

export interface KanjiSrsInfo {
    state: VocabSrsState;
    item?: SrsItem;
    srsId: string;
    dueDate?: Date;
    reps: number;
}

export interface ContextualKanjiDetails {
    jlptLevel: string;
    lessonVocab: BookVocabItem[];
    hasOnyomi: boolean;
    hasKunyomi: boolean;
}

export function getKanjiSrsInfo(
    kanjiItem: BookKanjiItem,
    lookup: SrsLookup
): KanjiSrsInfo {
    const cleanKanji = kanjiItem.kanji.trim();
    const codePoint = cleanKanji.codePointAt(0)?.toString(16).toUpperCase() ?? cleanKanji;
    const defaultSrsId = `kanji:${codePoint}`;
    const item =
        lookup.byKey.get(defaultSrsId) || lookup.byKey.get(`kanji:${cleanKanji}`);

    if (!item) {
        return {
            state: "new",
            srsId: defaultSrsId,
            reps: 0,
        };
    }

    let state: VocabSrsState = "learning";
    if (lookup.dueById.has(item.id)) {
        state = "due";
    } else if (lookup.masteredById.has(item.id)) {
        state = "mastered";
    }

    const rawDue = item.card?.due;
    const parsedDue = rawDue ? (rawDue instanceof Date ? rawDue : new Date(rawDue)) : undefined;
    const dueDate = parsedDue && !Number.isNaN(parsedDue.getTime()) ? parsedDue : undefined;

    return {
        state,
        item,
        srsId: item.id,
        dueDate,
        reps: typeof item.card?.reps === "number" ? item.card.reps : 0,
    };
}

export function getContextualKanjiDetails(
    kanjiItem: BookKanjiItem,
    lesson: BookLesson,
    defaultJlpt: number = 5
): ContextualKanjiDetails {
    const targetChar = kanjiItem.kanji.trim();
    const lessonVocab = targetChar
        ? lesson.vocabulary.filter((v) => v.word.includes(targetChar))
        : [];

    return {
        jlptLevel: `N${kanjiItem.jlpt || defaultJlpt}`,
        lessonVocab,
        hasOnyomi: kanjiItem.onyomi.some((r) => r.trim().length > 0),
        hasKunyomi: kanjiItem.kunyomi.some((r) => r.trim().length > 0),
    };
}

export function getDialogueSceneStats(scene: BookDialogueScene): DialogueSceneStats {
    const uniqueSpeakers = Array.from(new Set(scene.lines.map((l) => l.speakerJa)));
    const audioTrackCount = scene.lines.filter((l) => !!l.audioSrc).length;
    return {
        lineCount: scene.lines.length,
        uniqueSpeakers,
        hasAudio: audioTrackCount > 0,
        audioTrackCount,
    };
}

export function computeDialogueProgress(
    lesson: BookLesson,
    completedIds: string[] = []
): {
    totalScenes: number;
    completedScenes: number;
    percent: number;
    totalLines: number;
    uniqueSpeakersCount: number;
} {
    const dialogues = lesson.dialogues ?? [];
    const totalScenes = dialogues.length;
    const completedSet = new Set(completedIds);
    const completedScenes = dialogues.filter((d) => completedSet.has(d.id)).length;
    const percent = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;
    const totalLines = dialogues.reduce((sum, d) => sum + d.lines.length, 0);
    const uniqueSpeakers = new Set(dialogues.flatMap((d) => d.lines.map((l) => l.speakerJa)));
    return {
        totalScenes,
        completedScenes,
        percent,
        totalLines,
        uniqueSpeakersCount: uniqueSpeakers.size,
    };
}

export interface PracticeCategoryStats {
    type: string;
    label: string;
    count: number;
    attempted: number;
    correct: number;
}

export interface PracticeDashboardStats {
    totalExercises: number;
    attemptedCount: number;
    correctCount: number;
    missedCount: number;
    accuracyPercent: number;
    categoryBreakdown: PracticeCategoryStats[];
    parts: Array<{ part: string; count: number }>;
}

export function formatPracticeTypeLabel(type: string): string {
    switch (type) {
        case "transformation":
            return "Conjugation & Forms";
        case "cloze":
            return "Fill in the Blank";
        case "qa":
            return "Question & Answer";
        case "chart":
            return "Chart & Information";
        case "pair_work":
            return "Conversational Pair Work";
        case "reading":
            return "Reading Comprehension";
        default:
            return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
}

export function normalizePracticeString(s: string): string {
    return s
        .normalize("NFKC")
        .replace(/[。、\s\t\n\r・！？!?()（）~〜]/g, "")
        .toLowerCase()
        .trim();
}

export function validatePracticeAnswer(userInput: string, expectedAnswer: string): boolean {
    const normInput = normalizePracticeString(userInput);
    if (!normInput) return false;

    // Direct normalized match
    if (normInput === normalizePracticeString(expectedAnswer)) return true;

    // Split alternate answers by slash: A / B / C
    const slashAlts = expectedAnswer.split(/[／/]/).map((a) => a.trim());
    for (const alt of slashAlts) {
        if (normInput === normalizePracticeString(alt)) return true;
        // Strip speaker prefixes like "You: ", "Friend: ", "A: ", "B: "
        const strippedSpeaker = alt.replace(/^[a-zA-Z\u3000-\u9faf]+[:：]\s*/, "").trim();
        if (strippedSpeaker && normInput === normalizePracticeString(strippedSpeaker)) return true;
    }

    // Extract parenthesized alternate readings/answers: e.g. "はたちです。（にじゅっさいです。）"
    const parenMatches = expectedAnswer.match(/\(([^)]+)\)|（([^）]+)）/g);
    if (parenMatches) {
        for (const p of parenMatches) {
            const inner = p.replace(/[()（）]/g, "").trim();
            if (normInput === normalizePracticeString(inner)) return true;
        }
        const withoutParens = expectedAnswer.replace(/\([^)]+\)|（[^）]+）/g, "").trim();
        if (withoutParens && normInput === normalizePracticeString(withoutParens)) return true;
    }

    return false;
}

export function computePracticeDashboardStats(
    sections: BookPracticeSection[],
    feedbackMap: Record<string, "correct" | "incorrect"> = {}
): PracticeDashboardStats {
    let totalExercises = 0;
    let attemptedCount = 0;
    let correctCount = 0;

    const categoryMap = new Map<string, { count: number; attempted: number; correct: number }>();
    const partMap = new Map<string, number>();

    for (const section of sections) {
        const type = section.type;
        if (!categoryMap.has(type)) {
            categoryMap.set(type, { count: 0, attempted: 0, correct: 0 });
        }
        const cat = categoryMap.get(type)!;

        const partKey = section.part;
        partMap.set(partKey, (partMap.get(partKey) || 0) + section.items.length);

        for (const item of section.items) {
            totalExercises++;
            cat.count++;
            const fb = feedbackMap[item.id];
            if (fb) {
                attemptedCount++;
                cat.attempted++;
                if (fb === "correct") {
                    correctCount++;
                    cat.correct++;
                }
            }
        }
    }

    const accuracyPercent =
        attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const missedCount = attemptedCount - correctCount;

    const categoryBreakdown: PracticeCategoryStats[] = Array.from(categoryMap.entries()).map(
        ([type, stats]) => ({
            type,
            label: formatPracticeTypeLabel(type),
            count: stats.count,
            attempted: stats.attempted,
            correct: stats.correct,
        })
    );

    const parts = Array.from(partMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
        .map(([part, count]) => ({ part, count }));

    return {
        totalExercises,
        attemptedCount,
        correctCount,
        missedCount,
        accuracyPercent,
        categoryBreakdown,
        parts,
    };
}

/* -------------------------------------------------------------------------- */
/* Phase 9: Unified Content Search, Analytics, Weak Areas & Workload Forecast */
/* -------------------------------------------------------------------------- */

export type TextbookContentType = "vocab" | "grammar" | "kanji" | "dialogue" | "practice";

export interface GlobalSearchResultItem {
    id: string;
    type: TextbookContentType;
    typeLabel: string;
    title: string;
    reading?: string;
    meaning?: string;
    snippet?: string;
    bookId: string;
    bookTitle: string;
    bookLevel: string;
    lessonNumber: number;
    lessonTitle: string;
    href: string;
}

export interface GlobalSearchSummary {
    query: string;
    totalMatches: number;
    results: GlobalSearchResultItem[];
    byType: Record<TextbookContentType, GlobalSearchResultItem[]>;
    counts: Record<TextbookContentType, number>;
}

export function searchAllTextbookContent(
    allBooks: Record<string, BookDetail>,
    query: string,
    bookFilter: string = "all",
    typeFilter: string = "all",
    limitPerCategory: number = 40
): GlobalSearchSummary {
    const q = query.trim().toLowerCase();
    const byType: Record<TextbookContentType, GlobalSearchResultItem[]> = {
        vocab: [],
        grammar: [],
        kanji: [],
        dialogue: [],
        practice: [],
    };

    if (!q) {
        return {
            query,
            totalMatches: 0,
            results: [],
            byType,
            counts: { vocab: 0, grammar: 0, kanji: 0, dialogue: 0, practice: 0 },
        };
    }

    const booksToSearch =
        bookFilter === "all"
            ? Object.values(allBooks)
            : [allBooks[bookFilter]].filter(Boolean);

    for (const book of booksToSearch) {
        const bookShortTitle = book.title.split(":")[0].trim();

        for (const lesson of book.lessons) {
            const lessonNumber = lesson.lessonNumber;
            const lessonTitle = lesson.title;

            // 1. Vocabulary
            if (typeFilter === "all" || typeFilter === "vocab") {
                for (const v of lesson.vocabulary) {
                    if (byType.vocab.length >= limitPerCategory) break;
                    const matchWord = v.word.toLowerCase().includes(q);
                    const matchMeaning = v.meaning.toLowerCase().includes(q);
                    const matchReading = v.reading.toLowerCase().includes(q);
                    const matchKana = v.readingKana.toLowerCase().includes(q);

                    if (matchWord || matchMeaning || matchReading || matchKana) {
                        byType.vocab.push({
                            id: `search-vocab-${book.id}-${lessonNumber}-${v.id}`,
                            type: "vocab",
                            typeLabel: "Vocabulary",
                            title: v.word,
                            reading: v.readingKana || v.reading,
                            meaning: v.meaning,
                            snippet: `${v.word} (${v.readingKana || v.reading}) — ${v.meaning}`,
                            bookId: book.id,
                            bookTitle: bookShortTitle,
                            bookLevel: book.level,
                            lessonNumber,
                            lessonTitle,
                            href: `/books/${book.id}/${lessonNumber}?tab=vocab`,
                        });
                    }
                }
            }

            // 2. Grammar
            if (typeFilter === "all" || typeFilter === "grammar") {
                for (const g of lesson.grammar) {
                    if (byType.grammar.length >= limitPerCategory) break;
                    const matchPattern = g.pattern.toLowerCase().includes(q);
                    const matchTitle = g.title.toLowerCase().includes(q);
                    const matchExpl = g.explanation.toLowerCase().includes(q);
                    const matchedEx = g.examples.find(
                        (e) =>
                            e.ja.toLowerCase().includes(q) ||
                            (e.en && e.en.toLowerCase().includes(q))
                    );

                    if (matchPattern || matchTitle || matchExpl || matchedEx) {
                        byType.grammar.push({
                            id: `search-grammar-${book.id}-${lessonNumber}-${g.id}`,
                            type: "grammar",
                            typeLabel: "Grammar",
                            title: g.pattern,
                            meaning: g.title,
                            snippet: matchedEx ? `${g.pattern}: ${matchedEx.ja}` : g.explanation.slice(0, 90),
                            bookId: book.id,
                            bookTitle: bookShortTitle,
                            bookLevel: book.level,
                            lessonNumber,
                            lessonTitle,
                            href: `/books/${book.id}/${lessonNumber}?tab=grammar`,
                        });
                    }
                }
            }

            // 3. Kanji
            if (typeFilter === "all" || typeFilter === "kanji") {
                for (const k of lesson.kanji) {
                    if (byType.kanji.length >= limitPerCategory) break;
                    const matchKanji = k.kanji.includes(q);
                    const matchMeaning = k.meaning.toLowerCase().includes(q);
                    const matchOnyomi = k.onyomi.some((o) => o.toLowerCase().includes(q));
                    const matchKunyomi = k.kunyomi.some((ku) => ku.toLowerCase().includes(q));

                    if (matchKanji || matchMeaning || matchOnyomi || matchKunyomi) {
                        const readings = [...k.onyomi, ...k.kunyomi].filter(Boolean).join(" · ");
                        byType.kanji.push({
                            id: `search-kanji-${book.id}-${lessonNumber}-${k.kanji}`,
                            type: "kanji",
                            typeLabel: "Kanji",
                            title: k.kanji,
                            reading: readings,
                            meaning: k.meaning,
                            snippet: `${k.kanji} (${readings}) — ${k.meaning}`,
                            bookId: book.id,
                            bookTitle: bookShortTitle,
                            bookLevel: book.level,
                            lessonNumber,
                            lessonTitle,
                            href: `/books/${book.id}/${lessonNumber}?tab=kanji`,
                        });
                    }
                }
            }

            // 4. Dialogues
            if (typeFilter === "all" || typeFilter === "dialogue") {
                for (const d of lesson.dialogues ?? []) {
                    if (byType.dialogue.length >= limitPerCategory) break;
                    for (const line of d.lines) {
                        if (byType.dialogue.length >= limitPerCategory) break;
                        if (
                            line.ja.toLowerCase().includes(q) ||
                            line.en.toLowerCase().includes(q)
                        ) {
                            byType.dialogue.push({
                                id: `search-dlg-${book.id}-${lessonNumber}-${d.id}-${line.speakerJa}-${line.ja.slice(0, 10)}`,
                                type: "dialogue",
                                typeLabel: "Dialogue",
                                title: line.ja,
                                meaning: line.en,
                                snippet: `[${line.speakerJa}]: ${line.ja} — ${line.en}`,
                                bookId: book.id,
                                bookTitle: bookShortTitle,
                                bookLevel: book.level,
                                lessonNumber,
                                lessonTitle,
                                href: `/books/${book.id}/${lessonNumber}?tab=dialogues`,
                            });
                        }
                    }
                }
            }

            // 5. Practice
            if (typeFilter === "all" || typeFilter === "practice") {
                for (const sec of lesson.practice ?? []) {
                    if (byType.practice.length >= limitPerCategory) break;
                    for (const item of sec.items) {
                        if (byType.practice.length >= limitPerCategory) break;
                        if (
                            item.prompt.toLowerCase().includes(q) ||
                            item.answer.toLowerCase().includes(q)
                        ) {
                            byType.practice.push({
                                id: `search-prac-${book.id}-${lessonNumber}-${sec.id}-${item.id}`,
                                type: "practice",
                                typeLabel: "Practice Drill",
                                title: item.prompt,
                                meaning: item.answer,
                                snippet: `Q: ${item.prompt} ➔ A: ${item.answer}`,
                                bookId: book.id,
                                bookTitle: bookShortTitle,
                                bookLevel: book.level,
                                lessonNumber,
                                lessonTitle,
                                href: `/books/${book.id}/${lessonNumber}?tab=practice`,
                            });
                        }
                    }
                }
            }
        }
    }

    const counts: Record<TextbookContentType, number> = {
        vocab: byType.vocab.length,
        grammar: byType.grammar.length,
        kanji: byType.kanji.length,
        dialogue: byType.dialogue.length,
        practice: byType.practice.length,
    };

    const totalMatches =
        counts.vocab + counts.grammar + counts.kanji + counts.dialogue + counts.practice;

    const results =
        typeFilter === "all"
            ? [
                  ...byType.vocab,
                  ...byType.grammar,
                  ...byType.kanji,
                  ...byType.dialogue,
                  ...byType.practice,
              ]
            : byType[typeFilter as TextbookContentType] || [];

    return {
        query,
        totalMatches,
        results,
        byType,
        counts,
    };
}

export interface WeakAreaItem {
    id: string;
    type: "vocab" | "kanji" | "grammar" | "practice";
    title: string;
    subtitle?: string;
    mistakeCount: number;
    reason: string;
    bookId: string;
    bookTitle: string;
    lessonNumber: number;
    lessonTitle: string;
    href: string;
}

export interface WeakAreaSummary {
    totalWeakItems: number;
    vocab: WeakAreaItem[];
    kanji: WeakAreaItem[];
    grammar: WeakAreaItem[];
    practice: WeakAreaItem[];
}

export function computeWeakAreas(
    srsItems: SrsItem[],
    allBooks: Record<string, BookDetail>,
    allWorkspaceStates: Record<string, LessonWorkspacePersistedState> = {}
): WeakAreaSummary {
    const vocab: WeakAreaItem[] = [];
    const kanji: WeakAreaItem[] = [];
    const grammar: WeakAreaItem[] = [];
    const practice: WeakAreaItem[] = [];

    // Helper map to quickly locate lesson for words, kanji, grammar
    const vocabLocation = new Map<string, { bookId: string; bookTitle: string; lessonNumber: number; lessonTitle: string }>();
    const kanjiLocation = new Map<string, { bookId: string; bookTitle: string; lessonNumber: number; lessonTitle: string }>();
    const grammarLocation = new Map<string, { bookId: string; bookTitle: string; lessonNumber: number; lessonTitle: string }>();

    for (const book of Object.values(allBooks)) {
        const shortTitle = book.title.split(":")[0].trim();
        for (const lesson of book.lessons) {
            const loc = {
                bookId: book.id,
                bookTitle: shortTitle,
                lessonNumber: lesson.lessonNumber,
                lessonTitle: lesson.title,
            };
            for (const v of lesson.vocabulary) {
                vocabLocation.set(v.word.trim(), loc);
            }
            for (const k of lesson.kanji) {
                kanjiLocation.set(k.kanji.trim(), loc);
            }
            for (const g of lesson.grammar) {
                grammarLocation.set(g.id, loc);
                if (g.linkedGrammarId) grammarLocation.set(g.linkedGrammarId, loc);
                grammarLocation.set(g.pattern.trim(), loc);
            }
        }
    }

    // 1. Scan FSRS items for repeated mistakes (lapses >= 2 or high difficulty)
    for (const item of srsItems) {
        const lapses = item.card?.lapses ?? 0;
        const reps = item.card?.reps ?? 0;
        const diff = item.card?.difficulty ?? 0;

        // Requirement: Do not label a topic weak based on a single attempt (lapses >= 2)
        if (lapses >= 2 || (reps >= 2 && diff >= 7.5)) {
            const mistakeCount = Math.max(2, lapses);

            if (item.type === "vocab") {
                const prompt = item.prompt?.trim() || "";
                const loc = vocabLocation.get(prompt);
                if (loc) {
                    vocab.push({
                        id: `weak-vocab-${item.id}`,
                        type: "vocab",
                        title: prompt,
                        subtitle: item.reading,
                        mistakeCount,
                        reason: `${mistakeCount} recall lapses in spaced repetition`,
                        bookId: loc.bookId,
                        bookTitle: loc.bookTitle,
                        lessonNumber: loc.lessonNumber,
                        lessonTitle: loc.lessonTitle,
                        href: `/books/${loc.bookId}/${loc.lessonNumber}?tab=vocab`,
                    });
                }
            } else if (item.type === "kanji") {
                const cleanChar = item.prompt?.replace(/^kanji:/, "").trim() || "";
                const loc = kanjiLocation.get(cleanChar);
                if (loc) {
                    kanji.push({
                        id: `weak-kanji-${item.id}`,
                        type: "kanji",
                        title: cleanChar,
                        subtitle: item.reading,
                        mistakeCount,
                        reason: `${mistakeCount} recall lapses; stroke practice recommended`,
                        bookId: loc.bookId,
                        bookTitle: loc.bookTitle,
                        lessonNumber: loc.lessonNumber,
                        lessonTitle: loc.lessonTitle,
                        href: `/books/${loc.bookId}/${loc.lessonNumber}?tab=kanji`,
                    });
                }
            } else if (item.type === "grammar") {
                const prompt = item.prompt?.trim() || "";
                const loc = grammarLocation.get(prompt) || grammarLocation.get(item.id.replace(/^grammar:/, ""));
                if (loc) {
                    grammar.push({
                        id: `weak-grammar-${item.id}`,
                        type: "grammar",
                        title: prompt,
                        mistakeCount,
                        reason: `${mistakeCount} review lapses in grammar patterns`,
                        bookId: loc.bookId,
                        bookTitle: loc.bookTitle,
                        lessonNumber: loc.lessonNumber,
                        lessonTitle: loc.lessonTitle,
                        href: `/books/${loc.bookId}/${loc.lessonNumber}?tab=grammar`,
                    });
                }
            }
        }
    }

    // 2. Scan Lesson Workspaces for self-check "review" and practice misses
    for (const [key, ws] of Object.entries(allWorkspaceStates)) {
        const [bookId, lessonNumStr] = key.split(":");
        const lessonNum = parseInt(lessonNumStr, 10);
        const book = allBooks[bookId];
        const lesson = book?.lessons.find((l) => l.lessonNumber === lessonNum);
        if (!book || !lesson) continue;
        const shortTitle = book.title.split(":")[0].trim();

        // Grammar self-checks marked "review"
        if (ws.selfCheckFeedback) {
            for (const [gramId, fb] of Object.entries(ws.selfCheckFeedback)) {
                if (fb === "review") {
                    const gramPoint = lesson.grammar.find((g) => g.id === gramId);
                    if (gramPoint && !grammar.some((g) => g.title === gramPoint.pattern)) {
                        grammar.push({
                            id: `weak-selfcheck-${gramId}`,
                            type: "grammar",
                            title: gramPoint.pattern,
                            subtitle: gramPoint.title,
                            mistakeCount: 2,
                            reason: "Marked for review in quick self-check",
                            bookId,
                            bookTitle: shortTitle,
                            lessonNumber: lessonNum,
                            lessonTitle: lesson.title,
                            href: `/books/${bookId}/${lessonNum}?tab=grammar`,
                        });
                    }
                }
            }
        }

        // Practice exercises marked "incorrect"
        if (ws.practiceFeedback) {
            const incorrectCount = Object.values(ws.practiceFeedback).filter((f) => f === "incorrect").length;
            if (incorrectCount >= 2) {
                // Section-level repeated mistakes
                for (const sec of lesson.practice ?? []) {
                    const secMisses = sec.items.filter((it) => ws.practiceFeedback?.[it.id] === "incorrect").length;
                    if (secMisses >= 2) {
                        practice.push({
                            id: `weak-prac-sec-${sec.id}`,
                            type: "practice",
                            title: `${sec.title} (${sec.part})`,
                            subtitle: formatPracticeTypeLabel(sec.type),
                            mistakeCount: secMisses,
                            reason: `${secMisses} missed items in practice exercises`,
                            bookId,
                            bookTitle: shortTitle,
                            lessonNumber: lessonNum,
                            lessonTitle: lesson.title,
                            href: `/books/${bookId}/${lessonNum}?tab=practice`,
                        });
                    }
                }
            }
        }
    }

    const totalWeakItems = vocab.length + kanji.length + grammar.length + practice.length;

    return {
        totalWeakItems,
        vocab,
        kanji,
        grammar,
        practice,
    };
}

export function loadAllLessonWorkspaceStates(): Record<string, LessonWorkspacePersistedState> {
    const result: Record<string, LessonWorkspacePersistedState> = {};
    if (typeof window === "undefined") return result;
    try {
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith("kanagame_lesson_workspace:")) {
                const raw = window.localStorage.getItem(key);
                if (raw) {
                    const lessonKey = key.replace("kanagame_lesson_workspace:", "");
                    result[lessonKey] = JSON.parse(raw);
                }
            }
        }
    } catch {
        // ignore storage access errors
    }
    return result;
}

export interface WorkloadForecast {
    dueToday: number;
    dueTomorrow: number;
    dueThisWeek: number;
    overdue: number;
}

export function computeWorkloadForecast(
    srsItems: SrsItem[],
    nowMs: number = Date.now()
): WorkloadForecast {
    let dueToday = 0;
    let dueTomorrow = 0;
    let dueThisWeek = 0;
    let overdue = 0;

    const oneDayMs = 24 * 60 * 60 * 1000;
    const tomorrowEndMs = nowMs + oneDayMs;
    const weekEndMs = nowMs + 7 * oneDayMs;

    for (const item of srsItems) {
        if (!item.card?.due) continue;
        const dueMs =
            item.card.due instanceof Date
                ? item.card.due.getTime()
                : new Date(item.card.due).getTime();
        if (Number.isNaN(dueMs)) continue;

        if (dueMs <= nowMs) {
            dueToday++;
            if (nowMs - dueMs > oneDayMs) {
                overdue++;
            }
        } else if (dueMs <= tomorrowEndMs) {
            dueTomorrow++;
        } else if (dueMs <= weekEndMs) {
            dueThisWeek++;
        }
    }

    return {
        dueToday,
        dueTomorrow,
        dueThisWeek,
        overdue,
    };
}

export interface ProgressThreeDimensions {
    completion: {
        lessonsCompleted: number;
        lessonsInProgress: number;
        lessonsNotStarted: number;
        totalLessons: number;
        overallPercent: number;
        dialoguesCompleted: number;
        practiceAttemptedCount: number;
    };
    mastery: {
        vocabMastered: number;
        vocabStudied: number;
        kanjiMastered: number;
        kanjiStudied: number;
        grammarMastered: number;
        grammarStudied: number;
        practiceCorrectCount: number;
        practiceAccuracyPercent: number;
        overallMasteryRate: number;
    };
    reviewStatus: {
        dueToday: number;
        dueTomorrow: number;
        dueThisWeek: number;
        totalReviewsCompleted: number;
        byType: {
            vocabDue: number;
            kanjiDue: number;
            grammarDue: number;
            kanaDue: number;
        };
    };
}

export function computeProgressThreeDimensions(
    overview: DashboardOverviewMetrics,
    srsItems: SrsItem[],
    allWorkspaceStates: Record<string, LessonWorkspacePersistedState> = {},
    nowMs: number = Date.now()
): ProgressThreeDimensions {
    let totalDialoguesCompleted = 0;
    let practiceAttemptedCount = 0;
    let practiceCorrectCount = 0;

    for (const ws of Object.values(allWorkspaceStates)) {
        if (ws.completedDialogueIds) {
            totalDialoguesCompleted += ws.completedDialogueIds.length;
        }
        if (ws.practiceFeedback) {
            for (const fb of Object.values(ws.practiceFeedback)) {
                practiceAttemptedCount++;
                if (fb === "correct") practiceCorrectCount++;
            }
        }
    }

    const practiceAccuracyPercent =
        practiceAttemptedCount > 0
            ? Math.round((practiceCorrectCount / practiceAttemptedCount) * 100)
            : 0;

    const totalStudied = overview.vocabStudied + overview.kanjiStudied + overview.grammarStudied;
    const totalMastered = overview.vocabMastered + overview.kanjiMastered + overview.grammarMastered;
    const overallMasteryRate =
        totalStudied > 0 ? Math.round((totalMastered / totalStudied) * 100) : 0;

    const forecast = computeWorkloadForecast(srsItems, nowMs);

    let totalReviewsCompleted = 0;
    for (const item of srsItems) {
        if (typeof item.card?.reps === "number") {
            totalReviewsCompleted += item.card.reps;
        }
    }

    const lessonsNotStarted = Math.max(
        0,
        overview.totalLessons - overview.lessonsCompleted - overview.lessonsInProgress
    );

    return {
        completion: {
            lessonsCompleted: overview.lessonsCompleted,
            lessonsInProgress: overview.lessonsInProgress,
            lessonsNotStarted,
            totalLessons: overview.totalLessons,
            overallPercent: overview.overallPercent,
            dialoguesCompleted: totalDialoguesCompleted,
            practiceAttemptedCount,
        },
        mastery: {
            vocabMastered: overview.vocabMastered,
            vocabStudied: overview.vocabStudied,
            kanjiMastered: overview.kanjiMastered,
            kanjiStudied: overview.kanjiStudied,
            grammarMastered: overview.grammarMastered,
            grammarStudied: overview.grammarStudied,
            practiceCorrectCount,
            practiceAccuracyPercent,
            overallMasteryRate,
        },
        reviewStatus: {
            dueToday: forecast.dueToday,
            dueTomorrow: forecast.dueTomorrow,
            dueThisWeek: forecast.dueThisWeek,
            totalReviewsCompleted,
            byType: {
                vocabDue: overview.due.vocab,
                kanjiDue: overview.due.kanji,
                grammarDue: overview.due.grammar,
                kanaDue: overview.due.kana,
            },
        },
    };
}
