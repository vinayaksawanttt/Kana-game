import { describe, expect, it } from "vitest";
import { createEmptyCard } from "ts-fsrs";
import type { BookDetail, BookDialogueScene, BookLesson, BookPracticeSection } from "@/data/books";
import type { SrsItem } from "@/lib/srs/db";
import {
    buildSrsLookup,
    computeBookProgress,
    computeDashboardOverview,
    computeDetailedLessonOverview,
    computeDialogueProgress,
    computeLessonProgress,
    computePracticeDashboardStats,
    computeStreakDays,
    formatPartOfSpeech,
    formatPracticeTypeLabel,
    formatSectionLabel,
    getAdjacentLessonNumbers,
    getContextualGrammarDetails,
    getContextualKanjiDetails,
    getContextualVocabDetails,
    getDialogueSceneStats,
    getGrammarSrsInfo,
    getKanjiSrsInfo,
    getVocabSrsInfo,
    loadLessonWorkspaceState,
    loadAllLessonWorkspaceStates,
    normalizePracticeString,
    saveLessonWorkspaceState,
    searchAllTextbookContent,
    computeWeakAreas,
    computeWorkloadForecast,
    computeProgressThreeDimensions,
    validatePracticeAnswer,
} from "./progress";

const makeLesson = (lessonNumber: number): BookLesson => ({
    lessonNumber,
    title: `Lesson ${lessonNumber}`,
    vocabulary: [
        {
            id: `v-${lessonNumber}-1`,
            word: `単語${lessonNumber}A`,
            reading: "tango",
            readingKana: "たんご",
            meaning: "word A",
            type: "n",
            hasAudio: false,
        },
        {
            id: `v-${lessonNumber}-2`,
            word: `単語${lessonNumber}B`,
            reading: "tangob",
            readingKana: "たんごb",
            meaning: "word B",
            type: "n",
            hasAudio: false,
        },
    ],
    kanji: [
        {
            id: `k-${lessonNumber}-1`,
            number: 1,
            kanji: "日",
            onyomi: ["ニチ"],
            kunyomi: ["ひ"],
            meaning: "day",
        },
    ],
    grammar: [
        {
            id: `g-${lessonNumber}-1`,
            lessonNumber,
            index: 1,
            title: "Noun wa Noun desu",
            pattern: "A は B です",
            explanation: "Copula",
            bulletPoints: [],
            examples: [],
        },
    ],
    stats: {
        vocabularyCount: 2,
        kanjiCount: 1,
        grammarCount: 1,
    },
});

describe("Textbook Progress & FSRS Analytics (progress.ts)", () => {
    const now = new Date("2026-11-17T10:00:00Z").getTime();
    const futureDue = new Date("2026-11-25T10:00:00Z");
    const pastDue = new Date("2026-11-16T10:00:00Z");

    it("classifies lessons into all four states: not-started, in-progress, completed, review-needed", () => {
        const lesson = makeLesson(1);

        // 1. Not started
        const emptyLookup = buildSrsLookup([], now);
        expect(computeLessonProgress(lesson, emptyLookup, false).state).toBe("not-started");

        // 2. In progress (visited without FSRS cards)
        expect(computeLessonProgress(lesson, emptyLookup, true).state).toBe("in-progress");

        // 3. Completed (>= 80% enrolled and 0 due)
        const masteredCard = { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 };
        const completedItems: SrsItem[] = [
            { id: "vocab:単語1A", type: "vocab", prompt: "単語1A", answer: "word A", card: masteredCard },
            { id: "vocab:単語1B", type: "vocab", prompt: "単語1B", answer: "word B", card: masteredCard },
            { id: "kanji:65E5", type: "kanji", prompt: "日", answer: "day", card: masteredCard },
            { id: "grammar:g-1-1", type: "grammar", prompt: "A は B です", answer: "Copula", card: masteredCard },
        ];
        const completedLookup = buildSrsLookup(completedItems, now);
        const completedMetrics = computeLessonProgress(lesson, completedLookup);
        expect(completedMetrics.state).toBe("completed");
        expect(completedMetrics.percent).toBe(100);
        expect(completedMetrics.masteryPercent).toBe(100);
        expect(completedMetrics.dueCount).toBe(0);

        // 4. Review needed (any item due <= now)
        const dueCard = { ...createEmptyCard(pastDue), due: pastDue, state: 1, reps: 1 };
        const reviewItems: SrsItem[] = [
            { id: "vocab:単語1A", type: "vocab", prompt: "単語1A", answer: "word A", card: dueCard },
        ];
        const reviewLookup = buildSrsLookup(reviewItems, now);
        const reviewMetrics = computeLessonProgress(lesson, reviewLookup);
        expect(reviewMetrics.state).toBe("review-needed");
        expect(reviewMetrics.dueCount).toBe(1);
        expect(reviewMetrics.vocabDue).toBe(1);
    });

    it("computes dashboard overview metrics, due breakdown, and streak from FSRS and history", () => {
        const lesson1 = makeLesson(1);
        const lesson2 = makeLesson(2);
        const mockBook: BookDetail = {
            id: "genki-1",
            title: "Genki I",
            japaneseTitle: "げんき I",
            level: "N5",
            series: "GENKI",
            description: "Beginner",
            totalLessons: 2,
            lessonRange: [1, 2],
            stats: { vocabularyCount: 4, kanjiCount: 2, grammarCount: 2 },
            lessons: [lesson1, lesson2],
        };

        const masteredFuture = { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 4 };
        const learningDue = { ...createEmptyCard(pastDue), due: pastDue, state: 1, reps: 1 };

        const srsItems: SrsItem[] = [
            {
                id: "vocab:単語1A",
                type: "vocab",
                prompt: "単語1A",
                answer: "word A",
                card: masteredFuture,
                lastReviewedAt: new Date("2026-11-17T08:00:00").getTime(),
            },
            {
                id: "vocab:単語1B",
                type: "vocab",
                prompt: "単語1B",
                answer: "word B",
                card: masteredFuture,
                lastReviewedAt: new Date("2026-11-16T08:00:00").getTime(),
            },
            {
                id: "kanji:65E5",
                type: "kanji",
                prompt: "日",
                answer: "day",
                card: masteredFuture,
            },
            {
                id: "grammar:g-1-1",
                type: "grammar",
                prompt: "A は B です",
                answer: "Copula",
                card: masteredFuture,
            },
            {
                id: "vocab:単語2A",
                type: "vocab",
                prompt: "単語2A",
                answer: "word 2A",
                card: learningDue,
            },
            {
                id: "grammar:g-2-1",
                type: "grammar",
                prompt: "A は B です 2",
                answer: "Copula 2",
                card: learningDue,
            },
        ];

        const lookup = buildSrsLookup(srsItems, now);
        const bookProgress = computeBookProgress(mockBook, lookup);
        expect(bookProgress.completedLessons).toBe(1);
        expect(bookProgress.reviewNeededLessons).toBe(1);

        const overview = computeDashboardOverview(
            { "genki-1": mockBook },
            srsItems,
            lookup,
            new Set(),
            []
        );

        expect(overview.lessonsCompleted).toBe(1);
        expect(overview.vocabStudied).toBe(3);
        expect(overview.vocabMastered).toBe(2);
        expect(overview.kanjiStudied).toBe(1);
        expect(overview.kanjiMastered).toBe(1);
        expect(overview.grammarStudied).toBe(2);
        expect(overview.grammarMastered).toBe(1);
        expect(overview.due).toEqual({ vocab: 1, kanji: 0, grammar: 1, kana: 0, total: 2 });
        expect(
            computeStreakDays(srsItems, [], new Date("2026-11-17T12:00:00").getTime())
        ).toBe(2);
    });

    it("formats section labels reliably", () => {
        expect(formatSectionLabel("vocab")).toBe("Vocabulary");
        expect(formatSectionLabel("grammar")).toBe("Grammar");
        expect(formatSectionLabel("kanji")).toBe("Kanji");
        expect(formatSectionLabel("dialogues")).toBe("Dialogues");
        expect(formatSectionLabel("reading")).toBe("Reading");
        expect(formatSectionLabel("practice")).toBe("Practice Drills");
        expect(formatSectionLabel(undefined)).toBe("Overview");
    });

    it("computes boundary-aware adjacent lessons across textbooks", () => {
        const genki2Book: BookDetail = {
            id: "genki-2",
            title: "Genki II",
            japaneseTitle: "げんき II",
            level: "N4",
            series: "GENKI",
            description: "Intermediate",
            totalLessons: 2,
            lessonRange: [13, 14],
            stats: { vocabularyCount: 4, kanjiCount: 2, grammarCount: 2 },
            lessons: [makeLesson(13), makeLesson(14)],
        };

        // Lesson 13 is the first lesson in Genki II -> prev must be null (do not cross into Genki I L12)
        expect(getAdjacentLessonNumbers(genki2Book, 13)).toEqual({
            prevLessonNumber: null,
            nextLessonNumber: 14,
        });
        // Lesson 14 is the last lesson -> next must be null
        expect(getAdjacentLessonNumbers(genki2Book, 14)).toEqual({
            prevLessonNumber: 13,
            nextLessonNumber: null,
        });
    });

    it("computes detailed lesson overview separating studied vs mastered and persists workspace state", () => {
        const lesson = makeLesson(1);
        lesson.dialogues = [{ id: "d1", sceneNumber: "I", lines: [] }];
        lesson.practice = [
            {
                id: "p1",
                part: "I",
                title: "Practice 1",
                type: "qa",
                items: [
                    { id: "q1", prompt: "Q1", answer: "A1" },
                    { id: "q2", prompt: "Q2", answer: "A2" },
                ],
            },
        ];

        const masteredCard = { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 };
        const learningCard = { ...createEmptyCard(futureDue), due: futureDue, state: 1, reps: 0 };
        const lookup = buildSrsLookup(
            [
                { id: "vocab:単語1A", type: "vocab", prompt: "単語1A", answer: "word A", card: learningCard },
                { id: "vocab:単語1B", type: "vocab", prompt: "単語1B", answer: "word B", card: masteredCard },
            ],
            now
        );

        const overview = computeDetailedLessonOverview(lesson, lookup, {
            completedDialogueIds: ["d1"],
            practiceFeedback: { q1: "correct", q2: "incorrect" },
        });

        expect(overview.vocab).toEqual({ total: 2, studied: 2, mastered: 1, due: 0 });
        expect(overview.dialogues).toEqual({ total: 1, completed: 1 });
        expect(overview.practice).toEqual({ total: 2, attempted: 2, mastered: 1 });

        saveLessonWorkspaceState("genki-1", 1, { vocabTypeFilter: "verb" });
        expect(loadLessonWorkspaceState("genki-1", 1).vocabTypeFilter).toBe("verb");
    });

    it("computes per-vocab FSRS state, POS labels, and contextual details (examples, kanji, related words)", () => {
        const now = Date.now();
        const pastDue = new Date(now - 60_000);
        const futureDue = new Date(now + 86_400_000);

        const lookup = buildSrsLookup(
            [
                {
                    id: "vocab:飲む",
                    type: "vocab",
                    prompt: "飲む",
                    answer: "to drink",
                    card: { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 },
                },
                {
                    id: "vocab:食べる",
                    type: "vocab",
                    prompt: "食べる",
                    answer: "to eat",
                    card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 4 },
                },
                {
                    id: "vocab:本",
                    type: "vocab",
                    prompt: "本",
                    answer: "book",
                    card: { ...createEmptyCard(futureDue), due: futureDue, state: 1, reps: 1 },
                },
            ],
            now
        );

        expect(getVocabSrsInfo("飲む", lookup).state).toBe("mastered");
        expect(getVocabSrsInfo("食べる", lookup).state).toBe("due");
        expect(getVocabSrsInfo("本", lookup).state).toBe("learning");
        expect(getVocabSrsInfo("未学習", lookup).state).toBe("new");

        expect(formatPartOfSpeech("u-v")).toBe("U-Verb");
        expect(formatPartOfSpeech("i-adj")).toBe("い-Adjective");
        expect(formatPartOfSpeech("n")).toBe("Noun");

        const lesson: BookLesson = {
            lessonNumber: 3,
            title: "Making a Date",
            vocabulary: [
                {
                    id: "v-nomu",
                    word: "飲む",
                    reading: "nomu",
                    readingKana: "のむ",
                    meaning: "to drink",
                    type: "u-v",
                    hasAudio: false,
                },
                {
                    id: "v-ocha",
                    word: "お茶",
                    reading: "ocha",
                    readingKana: "おちゃ",
                    meaning: "green tea",
                    type: "n",
                    hasAudio: false,
                },
                {
                    id: "v-taberu",
                    word: "食べる",
                    reading: "taberu",
                    readingKana: "たべる",
                    meaning: "to eat",
                    type: "ru-v",
                    hasAudio: false,
                },
            ],
            kanji: [
                {
                    id: "k-drink",
                    number: 1,
                    kanji: "飲",
                    onyomi: ["イン"],
                    kunyomi: ["の.む"],
                    meaning: "drink",
                    strokes: 12,
                },
            ],
            grammar: [
                {
                    id: "g-masu",
                    lessonNumber: 3,
                    index: 1,
                    title: "Verb Conjugation",
                    pattern: "V-ます",
                    explanation: "Present tense polite verb",
                    bulletPoints: [],
                    examples: [{ ja: "コーヒーを飲みませんか。", en: "Won't you drink coffee?" }],
                },
            ],
            dialogues: [
                {
                    id: "d-1",
                    sceneNumber: "1",
                    lines: [
                        {
                            speaker: "Takeshi",
                            speakerJa: "たけし",
                            ja: "うちで映画を見て、お茶を飲むつもりです。",
                            en: "I plan to watch a movie and drink green tea at home.",
                        },
                    ],
                },
            ],
            stats: { vocabularyCount: 3, kanjiCount: 1, grammarCount: 1 },
        };

        const details = getContextualVocabDetails(lesson.vocabulary[0], lesson, null);
        expect(details.partOfSpeechLabel).toBe("U-Verb");
        expect(details.examples.some((ex) => ex.source === "dialogue" && ex.ja.includes("飲む"))).toBe(true);
        expect(details.kanjiBreakdown).toHaveLength(1);
        expect(details.kanjiBreakdown[0]).toMatchObject({ char: "飲", meaning: "drink", inLesson: true });
        expect(details.relatedVocab.some((r) => r.word === "食べる")).toBe(true);
    });

    it("computes contextual grammar details, linked practice, practice questions, and separates study status from FSRS mastery", () => {
        const now = Date.now();
        const futureDue = new Date(now + 86_400_000);
        const lesson: BookLesson = {
            lessonNumber: 3,
            title: "Making a Date",
            vocabulary: [],
            kanji: [],
            grammar: [
                {
                    id: "g-genki-l3-p1",
                    lessonNumber: 3,
                    index: 1,
                    title: "Verb Conjugation",
                    pattern: "V-ます",
                    explanation: "Present tense polite verb forms.",
                    bulletPoints: ["Watch out for trap u-verbs."],
                    examples: [
                        { ja: "毎日コーヒーを飲みます。", en: "I drink coffee every day." },
                        { ja: "明日映画を見ませんか。", en: "Won't you see a movie tomorrow?" },
                    ],
                },
                {
                    id: "g-genki-l3-p5",
                    lessonNumber: 3,
                    index: 5,
                    title: "Extending Invitations",
                    pattern: "〜ませんか",
                    linkedGrammarId: "N5/verb-masenka",
                    explanation: "Invite someone politely with V-ませんか.",
                    bulletPoints: ["Standard invitation expression.", "Trap warning for negative response."],
                    examples: [
                        { ja: "いっしょに映画を見ませんか。", en: "Won't you see a movie with me?" },
                        { ja: "お茶を飲みませんか。", en: "Won't you have tea?" },
                    ],
                },
            ],
            practice: [
                {
                    id: "l3-pv-a",
                    part: "V",
                    title: "コーヒーを飲みませんか",
                    grammarIndex: 5,
                    type: "transformation",
                    items: [{ id: "i1", prompt: "drink tea", answer: "お茶を飲みませんか。" }],
                },
            ],
            stats: { vocabularyCount: 0, kanjiCount: 0, grammarCount: 2 },
        };

        const lookup = buildSrsLookup(
            [
                {
                    id: "grammar:N5/verb-masenka",
                    type: "grammar",
                    prompt: "〜ませんか",
                    answer: "Extending Invitations",
                    card: { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 2 },
                },
            ],
            now
        );

        const srsInfo = getGrammarSrsInfo(lesson.grammar[1], lookup);
        expect(srsInfo).toMatchObject({ inSrs: true, mastered: true, due: false });

        const details = getContextualGrammarDetails(lesson.grammar[1], lesson, {
            id: "N5/verb-masenka",
            slug: "verb-masenka",
            level: "N5",
            title: "Verb ませんか",
            pattern: "V ませんか",
            romaji: "Verb masenka",
            meaning: "Won't you / Why don't we ...?",
            short: "Won't you ...?",
            long: "Used to extend invitations.",
            formation: ["Verb-stem + ませんか"],
            explanation: "Used to invite someone.",
            examples: [],
        });

        expect(details.jlptLevel).toBe("N5");
        expect(details.formationRules).toEqual(["Verb-stem + ませんか"]);
        expect(details.usageNotes).toEqual([
            { text: "Standard invitation expression.", isWarning: false },
            { text: "Trap warning for negative response.", isWarning: true },
        ]);
        expect(details.highlightToken).toBe("ませんか");
        expect(details.linkedPracticeSections.map((s) => s.id)).toEqual(["l3-pv-a"]);
        expect(details.relatedLessonGrammar.some((g) => g.id === "g-genki-l3-p1")).toBe(true);
        expect(details.practiceQuestions.length).toBeGreaterThanOrEqual(2);

        // Self-reported study status persists separately from FSRS mastery
        saveLessonWorkspaceState("genki-1", 3, {
            grammarStudyStatus: { "g-genki-l3-p1": "understood" },
        });
        expect(loadLessonWorkspaceState("genki-1", 3).grammarStudyStatus).toEqual({
            "g-genki-l3-p1": "understood",
        });

        // Confirm g-genki-l3-p1 (marked Understood in UI) does NOT become FSRS mastered
        const overview = computeDetailedLessonOverview(lesson, lookup);
        expect(overview.grammar).toEqual({ total: 2, studied: 1, mastered: 1, due: 0 });
    });

    it("computes per-kanji FSRS status and contextual kanji vocabulary links", () => {
        const now = Date.now();
        const futureDue = new Date(now + 86_400_000);
        const pastDue = new Date(now - 60_000);
        const codeOne = "一".codePointAt(0)!.toString(16).toUpperCase();
        const codeDay = "日".codePointAt(0)!.toString(16).toUpperCase();

        const lesson: BookLesson = {
            lessonNumber: 4,
            title: "First Date",
            vocabulary: [
                {
                    id: "v-kinou",
                    word: "昨日",
                    reading: "kinou",
                    readingKana: "きのう",
                    meaning: "yesterday",
                    type: "n",
                    hasAudio: false,
                },
                {
                    id: "v-hon",
                    word: "本",
                    reading: "hon",
                    readingKana: "ほん",
                    meaning: "book",
                    type: "n",
                    hasAudio: false,
                },
            ],
            kanji: [
                {
                    id: "k-one",
                    number: 1,
                    kanji: "一",
                    onyomi: ["いち"],
                    kunyomi: [],
                    meaning: "one",
                    strokes: 1,
                    jlpt: 5,
                },
                {
                    id: "k-day",
                    number: 16,
                    kanji: "日",
                    onyomi: ["にち"],
                    kunyomi: ["ひ"],
                    meaning: "day; sun",
                    strokes: 4,
                    jlpt: 5,
                },
                {
                    id: "k-time",
                    number: 15,
                    kanji: "時",
                    onyomi: ["じ"],
                    kunyomi: ["とき"],
                    meaning: "time",
                    strokes: 10,
                    jlpt: 5,
                },
            ],
            grammar: [],
            stats: { vocabularyCount: 2, kanjiCount: 3, grammarCount: 0 },
        };

        const lookup = buildSrsLookup(
            [
                {
                    id: `kanji:${codeOne}`,
                    type: "kanji",
                    prompt: "一",
                    answer: "one",
                    card: { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 },
                },
                {
                    id: `kanji:${codeDay}`,
                    type: "kanji",
                    prompt: "日",
                    answer: "day; sun",
                    card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
                },
            ],
            now
        );

        expect(getKanjiSrsInfo(lesson.kanji[0], lookup).state).toBe("mastered");
        expect(getKanjiSrsInfo(lesson.kanji[1], lookup).state).toBe("due");
        expect(getKanjiSrsInfo(lesson.kanji[2], lookup).state).toBe("new");

        const detailsOne = getContextualKanjiDetails(lesson.kanji[0], lesson, 5);
        expect(detailsOne.hasOnyomi).toBe(true);
        expect(detailsOne.hasKunyomi).toBe(false);
        expect(detailsOne.lessonVocab).toHaveLength(0);

        const detailsDay = getContextualKanjiDetails(lesson.kanji[1], lesson, 5);
        expect(detailsDay.jlptLevel).toBe("N5");
        expect(detailsDay.lessonVocab.map((v) => v.word)).toEqual(["昨日"]);
    });

    it("computes dialogue scene stats and dialogue progress metrics", () => {
        const scene: BookDialogueScene = {
            id: "d1",
            sceneNumber: "I",
            setting: "At the university",
            lines: [
                { speaker: "Mary", speakerJa: "メアリー", ja: "こんにちは", en: "Hello", audioSrc: "/audio/d1_1.opus" },
                { speaker: "Takeshi", speakerJa: "たけし", ja: "こんにちは", en: "Hello" },
                { speaker: "Mary", speakerJa: "メアリー", ja: "さようなら", en: "Goodbye", audioSrc: "/audio/d1_3.opus" },
            ],
        };

        const stats = getDialogueSceneStats(scene);
        expect(stats.lineCount).toBe(3);
        expect(stats.uniqueSpeakers).toEqual(["メアリー", "たけし"]);
        expect(stats.hasAudio).toBe(true);
        expect(stats.audioTrackCount).toBe(2);

        const mockLesson: BookLesson = {
            lessonNumber: 1,
            title: "Lesson 1",
            vocabulary: [],
            grammar: [],
            kanji: [],
            stats: {
                vocabularyCount: 0,
                grammarCount: 0,
                kanjiCount: 0,
            },
            dialogues: [
                scene,
                {
                    id: "d2",
                    sceneNumber: "II",
                    lines: [
                        { speaker: "Takeshi", speakerJa: "たけし", ja: "元気ですか", en: "How are you?" },
                    ],
                },
            ],
        };

        const prog0 = computeDialogueProgress(mockLesson, []);
        expect(prog0.totalScenes).toBe(2);
        expect(prog0.completedScenes).toBe(0);
        expect(prog0.percent).toBe(0);
        expect(prog0.totalLines).toBe(4);
        expect(prog0.uniqueSpeakersCount).toBe(2);

        const prog1 = computeDialogueProgress(mockLesson, ["d1"]);
        expect(prog1.completedScenes).toBe(1);
        expect(prog1.percent).toBe(50);

        const prog2 = computeDialogueProgress(mockLesson, ["d1", "d2"]);
        expect(prog2.completedScenes).toBe(2);
        expect(prog2.percent).toBe(100);
    });

    it("normalizes and validates practice answers with punctuation, variants, and alternatives", () => {
        expect(normalizePracticeString("たけしさんは にほんじんです。")).toBe("たけしさんはにほんじんです");
        expect(normalizePracticeString("34 (Near you: じてんしゃ)")).toBe("34nearyou:じてんしゃ");

        // Exact match with or without punctuation / whitespace
        expect(
            validatePracticeAnswer("たけしさんは にほんじんです。", "たけしさんは にほんじんです。")
        ).toBe(true);
        expect(
            validatePracticeAnswer("たけしさんはにほんじんです", "たけしさんは にほんじんです。")
        ).toBe(true);

        // Full-width vs half-width characters
        expect(validatePracticeAnswer("34", "３４")).toBe(true);
        expect(validatePracticeAnswer("３４", "34")).toBe(true);

        // Slash-separated alternate answers
        expect(
            validatePracticeAnswer(
                "これは じてんしゃです。",
                "Friend: それは なんですか。 / You: これは じてんしゃです。"
            )
        ).toBe(true);

        // Parenthesized alternate answers
        expect(
            validatePracticeAnswer(
                "はたちです",
                "たけしさんは はたちです。（にじゅっさいです。）"
            )
        ).toBe(false); // only partial match of full sentence
        expect(
            validatePracticeAnswer(
                "はたちです",
                "はたちです。（にじゅっさいです。）"
            )
        ).toBe(true);
        expect(
            validatePracticeAnswer(
                "にじゅっさいです",
                "はたちです。（にじゅっさいです。）"
            )
        ).toBe(true);

        // Incorrect answer
        expect(
            validatePracticeAnswer("ちがうこたえ", "たけしさんは にほんじんです。")
        ).toBe(false);
    });

    it("computes practice dashboard metrics, category breakdowns, and part groupings", () => {
        const sections: BookPracticeSection[] = [
            {
                id: "sec-1",
                part: "I",
                title: "Section 1",
                type: "transformation",
                items: [
                    { id: "p1", prompt: "A", answer: "A1" },
                    { id: "p2", prompt: "B", answer: "B1" },
                ],
            },
            {
                id: "sec-2",
                part: "II",
                title: "Section 2",
                type: "chart",
                items: [
                    { id: "p3", prompt: "C", answer: "C1" },
                    { id: "p4", prompt: "D", answer: "D1" },
                    { id: "p5", prompt: "E", answer: "E1" },
                ],
            },
        ];

        const feedback: Record<string, "correct" | "incorrect"> = {
            p1: "correct",
            p2: "incorrect",
            p3: "correct",
        };

        const stats = computePracticeDashboardStats(sections, feedback);
        expect(stats.totalExercises).toBe(5);
        expect(stats.attemptedCount).toBe(3);
        expect(stats.correctCount).toBe(2);
        expect(stats.accuracyPercent).toBe(67);

        expect(stats.parts).toEqual([
            { part: "I", count: 2 },
            { part: "II", count: 3 },
        ]);

        expect(formatPracticeTypeLabel("transformation")).toBe("Conjugation & Forms");
        expect(formatPracticeTypeLabel("chart")).toBe("Chart & Information");
        expect(formatPracticeTypeLabel("pair_work")).toBe("Conversational Pair Work");

        const transformCat = stats.categoryBreakdown.find((c) => c.type === "transformation");
        expect(transformCat?.count).toBe(2);
        expect(transformCat?.attempted).toBe(2);
        expect(transformCat?.correct).toBe(1);
    });

    describe("Phase 9 — Unified Learning System, Progress Analytics & Global Search", () => {
        const mockBook: BookDetail = {
            id: "genki-1",
            title: "Genki I: An Integrated Course in Elementary Japanese",
            japaneseTitle: "初級日本語 げんき I",
            description: "Elementary Japanese",
            series: "Genki",
            level: "N5",
            totalLessons: 1,
            lessonRange: [1, 1],
            stats: {
                vocabularyCount: 2,
                kanjiCount: 1,
                grammarCount: 1,
            },
            lessons: [
                {
                    lessonNumber: 1,
                    title: "New Friends",
                    vocabulary: [
                        {
                            id: "v-1-1",
                            word: "ともだち",
                            reading: "tomodachi",
                            readingKana: "ともだち",
                            meaning: "friend",
                            type: "n",
                            hasAudio: false,
                        },
                        {
                            id: "v-1-2",
                            word: "せんせい",
                            reading: "sensei",
                            readingKana: "せんせい",
                            meaning: "teacher",
                            type: "n",
                            hasAudio: false,
                        },
                    ],
                    kanji: [
                        {
                            id: "k-1-1",
                            number: 1,
                            kanji: "友",
                            onyomi: ["ユウ"],
                            kunyomi: ["とも"],
                            meaning: "friend",
                        },
                    ],
                    grammar: [
                        {
                            id: "g-1-1",
                            lessonNumber: 1,
                            index: 1,
                            title: "X は Y です",
                            pattern: "X は Y です",
                            explanation: "X is Y",
                            bulletPoints: [],
                            examples: [
                                {
                                    ja: "メアリーさんは ともだちです。",
                                    en: "Mary is a friend.",
                                },
                            ],
                        },
                    ],
                    dialogues: [
                        {
                            id: "d-1-1",
                            sceneNumber: "I",
                            setting: "Meeting on Campus",
                            lines: [
                                {
                                    speaker: "Mary",
                                    speakerJa: "メアリー",
                                    ja: "こんにちは、たけしさん。",
                                    en: "Hello, Takeshi.",
                                },
                            ],
                        },
                    ],
                    practice: [
                        {
                            id: "p-1-1",
                            part: "I",
                            title: "Time Practice",
                            type: "transformation",
                            items: [
                                {
                                    id: "prac-item-1",
                                    prompt: "いま なんじですか",
                                    answer: "いちじです",
                                },
                                {
                                    id: "prac-item-2",
                                    prompt: "いま なんぷんですか",
                                    answer: "ごふんです",
                                },
                            ],
                        },
                    ],
                    stats: {
                        vocabularyCount: 2,
                        kanjiCount: 1,
                        grammarCount: 1,
                    },
                },
            ],
        };

        const allBooks = { "genki-1": mockBook };

        it("searches across vocabulary, grammar, kanji, dialogues, and practice drills", () => {
            // Search vocabulary
            const vocabSearch = searchAllTextbookContent(allBooks, "friend");
            expect(vocabSearch.totalMatches).toBeGreaterThan(0);
            expect(vocabSearch.counts.vocab).toBe(1);
            expect(vocabSearch.byType.vocab[0].title).toBe("ともだち");
            expect(vocabSearch.byType.vocab[0].href).toBe("/books/genki-1/1?tab=vocab");

            // Search kanji by meaning and reading
            expect(searchAllTextbookContent(allBooks, "友").counts.kanji).toBe(1);
            expect(searchAllTextbookContent(allBooks, "ユウ").counts.kanji).toBe(1);

            // Search grammar pattern & explanation
            const grammarSearch = searchAllTextbookContent(allBooks, "X は Y");
            expect(grammarSearch.counts.grammar).toBe(1);
            expect(grammarSearch.byType.grammar[0].href).toBe("/books/genki-1/1?tab=grammar");

            // Search dialogue
            const dialogueSearch = searchAllTextbookContent(allBooks, "たけしさん");
            expect(dialogueSearch.counts.dialogue).toBe(1);
            expect(dialogueSearch.byType.dialogue[0].href).toBe("/books/genki-1/1?tab=dialogues");

            // Search practice
            const practiceSearch = searchAllTextbookContent(allBooks, "なんじ");
            expect(practiceSearch.counts.practice).toBe(1);
            expect(practiceSearch.byType.practice[0].href).toBe("/books/genki-1/1?tab=practice");

            // Category filter
            const filteredSearch = searchAllTextbookContent(allBooks, "friend", "all", "kanji");
            expect(filteredSearch.results.every((r) => r.type === "kanji")).toBe(true);

            // Book filter mismatch returns empty
            const bookFiltered = searchAllTextbookContent(allBooks, "friend", "genki-2");
            expect(bookFiltered.totalMatches).toBe(0);
        });

        it("computes weak areas strictly requiring >= 2 lapses or repeated mistakes", () => {
            const now = Date.now();
            const futureDue = new Date(now + 100000);

            // 1 lapse should NOT be classified as weak
            const singleLapseItems: SrsItem[] = [
                {
                    id: "vocab:ともだち",
                    type: "vocab",
                    prompt: "ともだち",
                    reading: "tomodachi",
                    answer: "friend",
                    card: { ...createEmptyCard(futureDue), due: futureDue, lapses: 1, reps: 2 },
                },
            ];

            const emptyWeak = computeWeakAreas(singleLapseItems, allBooks, {});
            expect(emptyWeak.totalWeakItems).toBe(0);
            expect(emptyWeak.vocab).toHaveLength(0);

            // 2 lapses should be classified as weak
            const multiLapseItems: SrsItem[] = [
                {
                    id: "vocab:ともだち",
                    type: "vocab",
                    prompt: "ともだち",
                    reading: "tomodachi",
                    answer: "friend",
                    card: { ...createEmptyCard(futureDue), due: futureDue, lapses: 2, reps: 3 },
                },
                {
                    id: `kanji:${"友".codePointAt(0)?.toString(16).toUpperCase()}`,
                    type: "kanji",
                    prompt: "友",
                    answer: "friend",
                    card: { ...createEmptyCard(futureDue), due: futureDue, lapses: 3, reps: 4 },
                },
                {
                    id: "grammar:g-1-1",
                    type: "grammar",
                    prompt: "X は Y です",
                    answer: "X is Y",
                    card: { ...createEmptyCard(futureDue), due: futureDue, lapses: 2, reps: 2 },
                },
            ];

            const workspaceStates = {
                "genki-1:1": {
                    selfCheckFeedback: {
                        "g-1-1": "review" as const,
                    },
                    practiceFeedback: {
                        "prac-item-1": "incorrect" as const,
                        "prac-item-2": "incorrect" as const,
                    },
                },
            };

            const weakSummary = computeWeakAreas(multiLapseItems, allBooks, workspaceStates);
            expect(weakSummary.totalWeakItems).toBeGreaterThanOrEqual(4);
            expect(weakSummary.vocab[0].title).toBe("ともだち");
            expect(weakSummary.vocab[0].mistakeCount).toBe(2);
            expect(weakSummary.vocab[0].href).toBe("/books/genki-1/1?tab=vocab");

            expect(weakSummary.kanji[0].title).toBe("友");
            expect(weakSummary.kanji[0].mistakeCount).toBe(3);
            expect(weakSummary.kanji[0].href).toBe("/books/genki-1/1?tab=kanji");

            expect(weakSummary.grammar[0].title).toBe("X は Y です");
            expect(weakSummary.grammar[0].href).toBe("/books/genki-1/1?tab=grammar");

            expect(weakSummary.practice[0].title).toContain("Time Practice");
            expect(weakSummary.practice[0].mistakeCount).toBe(2);
            expect(weakSummary.practice[0].href).toBe("/books/genki-1/1?tab=practice");
        });

        it("computes workload forecast for today, tomorrow, this week, and overdue", () => {
            const baseTime = new Date("2026-11-17T12:00:00Z").getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            const items: SrsItem[] = [
                // Overdue (> 1 day ago)
                {
                    id: "c1",
                    type: "vocab",
                    prompt: "a",
                    reading: "a",
                    answer: "a",
                    card: { ...createEmptyCard(), due: new Date(baseTime - 2 * oneDay) },
                },
                // Due today (earlier today)
                {
                    id: "c2",
                    type: "vocab",
                    prompt: "b",
                    reading: "b",
                    answer: "b",
                    card: { ...createEmptyCard(), due: new Date(baseTime - 2 * 60 * 60 * 1000) },
                },
                // Due tomorrow
                {
                    id: "c3",
                    type: "vocab",
                    prompt: "c",
                    reading: "c",
                    answer: "c",
                    card: { ...createEmptyCard(), due: new Date(baseTime + 12 * 60 * 60 * 1000) },
                },
                // Due later this week
                {
                    id: "c4",
                    type: "vocab",
                    prompt: "d",
                    reading: "d",
                    answer: "d",
                    card: { ...createEmptyCard(), due: new Date(baseTime + 4 * oneDay) },
                },
                // Beyond this week
                {
                    id: "c5",
                    type: "vocab",
                    prompt: "e",
                    reading: "e",
                    answer: "e",
                    card: { ...createEmptyCard(), due: new Date(baseTime + 10 * oneDay) },
                },
            ];

            const forecast = computeWorkloadForecast(items, baseTime);
            expect(forecast.dueToday).toBe(2); // c1 + c2
            expect(forecast.overdue).toBe(1); // c1
            expect(forecast.dueTomorrow).toBe(1); // c3
            expect(forecast.dueThisWeek).toBe(1); // c4
        });

        it("computes 3-dimensional progress model separating completion, mastery, and review status", () => {
            const baseTime = Date.now();
            const srsItems: SrsItem[] = [
                {
                    id: "vocab:ともだち",
                    type: "vocab",
                    prompt: "ともだち",
                    reading: "tomodachi",
                    answer: "friend",
                    card: { ...createEmptyCard(), reps: 5, due: new Date(baseTime - 1000) },
                },
            ];

            const lookup = buildSrsLookup(srsItems, baseTime);
            const overview = computeDashboardOverview(allBooks, srsItems, lookup);
            const workspaceStates = {
                "genki-1:1": {
                    completedDialogueIds: ["d-1-1"],
                    practiceFeedback: {
                        "prac-item-1": "correct" as const,
                        "prac-item-2": "incorrect" as const,
                    },
                },
            };

            const threeDim = computeProgressThreeDimensions(overview, srsItems, workspaceStates, baseTime);
            // 1. Completion
            expect(threeDim.completion.dialoguesCompleted).toBe(1);
            expect(threeDim.completion.practiceAttemptedCount).toBe(2);
            expect(threeDim.completion.totalLessons).toBe(1);

            // 2. Mastery
            expect(threeDim.mastery.practiceCorrectCount).toBe(1);
            expect(threeDim.mastery.practiceAccuracyPercent).toBe(50);

            // 3. Review Status
            expect(threeDim.reviewStatus.totalReviewsCompleted).toBe(5);
            expect(threeDim.reviewStatus.dueToday).toBe(1);
        });

        it("loads all lesson workspace states from localStorage", () => {
            localStorage.clear();
            localStorage.setItem(
                "kanagame_lesson_workspace:genki-1:1",
                JSON.stringify({ vocabStudyMode: "hide-en", completedDialogueIds: ["scene-1"] })
            );
            localStorage.setItem(
                "kanagame_lesson_workspace:genki-2:13",
                JSON.stringify({ vocabStudyMode: "hide-kana" })
            );
            localStorage.setItem("unrelated_key", JSON.stringify({ ignore: true }));

            const loaded = loadAllLessonWorkspaceStates();
            expect(Object.keys(loaded)).toHaveLength(2);
            expect(loaded["genki-1:1"].vocabStudyMode).toBe("hide-en");
            expect(loaded["genki-1:1"].completedDialogueIds).toEqual(["scene-1"]);
            expect(loaded["genki-2:13"].vocabStudyMode).toBe("hide-kana");
        });
    });
});
