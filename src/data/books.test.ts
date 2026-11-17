import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { enqueueLessonInSrs, getBookById, getBookLesson, getBooksCatalog } from "./books";
import { generateDialogueClozeQuestions } from "@/features/books/engine/dialogueCloze";
import { srsDb } from "@/lib/srs/db";
import { getAllSrsItems } from "@/lib/srs/service";

describe("Textbooks Data Pipeline (Genki I & II)", () => {
  beforeEach(async () => {
    await srsDb.items.clear();
  });
  it("loads the textbook catalog correctly", async () => {
    const catalog = await getBooksCatalog();
    expect(catalog).toBeDefined();
    expect(catalog.length).toBe(3);

    const genki1 = catalog.find((b) => b.id === "genki-1");
    const genki2 = catalog.find((b) => b.id === "genki-2");
    const mnn1 = catalog.find((b) => b.id === "mnn-1");

    expect(mnn1).toBeDefined();
    expect(mnn1?.level).toBe("N5");
    expect(mnn1?.totalLessons).toBe(25);
    expect(mnn1?.lessonRange).toEqual([1, 25]);
    expect(mnn1?.stats.vocabularyCount).toBeGreaterThan(900);
    expect(mnn1?.stats.grammarCount).toBeGreaterThan(100);

    expect(genki1).toBeDefined();
    expect(genki1?.level).toBe("N5");
    expect(genki1?.totalLessons).toBe(12);
    expect(genki1?.lessonRange).toEqual([1, 12]);
    expect(genki1?.stats.vocabularyCount).toBeGreaterThan(600);
    expect(genki1?.stats.kanjiCount).toBeGreaterThan(100);
    expect(genki1?.stats.grammarCount).toBeGreaterThan(70);

    expect(genki2).toBeDefined();
    expect(genki2?.level).toBe("N4");
    expect(genki2?.totalLessons).toBe(11);
    expect(genki2?.lessonRange).toEqual([13, 23]);
    expect(genki2?.stats.vocabularyCount).toBeGreaterThan(500);
    expect(genki2?.stats.kanjiCount).toBeGreaterThan(100);
    expect(genki2?.stats.grammarCount).toBeGreaterThan(50);
  });

  it("loads full detail for Genki I", async () => {
    const book = await getBookById("genki-1");
    expect(book).toBeDefined();
    expect(book?.id).toBe("genki-1");
    expect(book?.lessons.length).toBe(12);

    // Lesson 1 verification
    const l1 = book?.lessons[0];
    expect(l1?.lessonNumber).toBe(1);
    expect(l1?.vocabulary.length).toBeGreaterThan(50);
    expect(l1?.grammar.length).toBeGreaterThan(0);
    // Lessons 1-2 have no kanji in Genki
    expect(l1?.kanji.length).toBe(0);

    // Verify first vocab word in Lesson 1
    const v1 = l1?.vocabulary[0];
    expect(v1?.word).toBe("おはようございます");
    expect(v1?.readingKana).toBe("おはようございます");
    expect(v1?.meaning).toContain("Good morning");

    // Verify Lesson 3 has Kanji (Genki introduces kanji starting Lesson 3)
    const l3 = book?.lessons.find((l) => l.lessonNumber === 3);
    expect(l3).toBeDefined();
    expect(l3?.kanji.length).toBeGreaterThan(0);
    const k1 = l3?.kanji[0];
    expect(k1?.kanji).toBe("一");
    expect(k1?.strokes).toBe(1);
    expect(k1?.jlpt).toBe(5);
  });

  it("loads full detail for Genki II", async () => {
    const book = await getBookById("genki-2");
    expect(book).toBeDefined();
    expect(book?.id).toBe("genki-2");
    expect(book?.lessons.length).toBe(11);

    // Lesson 13 verification
    const l13 = book?.lessons[0];
    expect(l13?.lessonNumber).toBe(13);
    expect(l13?.title).toContain("Part-time Job");
    expect(l13?.vocabulary.length).toBeGreaterThan(50);
    expect(l13?.kanji.length).toBeGreaterThan(0);
    expect(l13?.grammar.length).toBeGreaterThan(0);

    // Verify cross-linking in grammar
    const potentialGrammar = l13?.grammar.find((g) => g.title.includes("Potential Verbs"));
    expect(potentialGrammar).toBeDefined();
    expect(potentialGrammar?.linkedGrammarId).toBe("N4/ru-koto-ga-dekiru");
  });

  it("retrieves a single lesson with getBookLesson()", async () => {
    const lesson = await getBookLesson("genki-1", 6);
    expect(lesson).toBeDefined();
    expect(lesson?.lessonNumber).toBe(6);
    expect(lesson?.title).toContain("Robert's Life");
    expect(lesson?.vocabulary.length).toBeGreaterThan(40);
    expect(lesson?.kanji.length).toBeGreaterThan(10);
    expect(lesson?.grammar.length).toBeGreaterThan(5);

    // Non-existent lesson returns null
    const nonExistent = await getBookLesson("genki-1", 99);
    expect(nonExistent).toBeNull();
  });

  it("returns null for non-existent textbook ID", async () => {
    const book = await getBookById("non-existent-book");
    expect(book).toBeNull();
  });

  it("enqueues lesson vocabulary, kanji, and grammar into FSRS spaced repetition", async () => {
    const lesson = await getBookLesson("genki-1", 3);
    expect(lesson).toBeDefined();

    const result = await enqueueLessonInSrs(lesson!, "N5");
    expect(result.vocabCount).toBe(lesson!.vocabulary.length);
    expect(result.kanjiCount).toBe(lesson!.kanji.length);
    expect(result.grammarCount).toBe(lesson!.grammar.length);
    expect(result.total).toBe(result.vocabCount + result.kanjiCount + result.grammarCount);

    const srsItems = await getAllSrsItems();
    expect(srsItems.length).toBeGreaterThanOrEqual(result.total);

    const vocabItem = srsItems.find((item) => item.prompt === "飲む");
    expect(vocabItem).toBeDefined();
    expect(vocabItem?.type).toBe("vocab");

    const kanjiItem = srsItems.find((item) => item.prompt === "一");
    expect(kanjiItem).toBeDefined();
    expect(kanjiItem?.type).toBe("kanji");
  });

  it("loads structured practice exercises for Genki I lessons", async () => {
    const l1 = await getBookLesson("genki-1", 1);
    expect(l1?.practice).toBeDefined();
    expect(l1?.practice?.length).toBeGreaterThanOrEqual(10);
    expect(l1?.stats.practiceCount).toBeGreaterThan(50);

    const firstPractice = l1?.practice?.[0];
    expect(firstPractice?.part).toBe("I");
    expect(firstPractice?.title).toContain("メアリーさんは アメリカじんです");
    expect(firstPractice?.referenceTable).toBeDefined();
    expect(firstPractice?.referenceTable?.headers).toEqual(["Name", "Nationality", "Year", "Age"]);
    expect(firstPractice?.items.length).toBeGreaterThan(0);

    const firstItem = firstPractice?.items[0];
    expect(firstItem?.prompt).toBe("たけしさん");
    expect(firstItem?.answer).toBe("たけしさんは にほんじんです。");
  });

  it("loads structured practice exercises for Genki II lessons", async () => {
    const l13 = await getBookLesson("genki-2", 13);
    expect(l13?.practice).toBeDefined();
    expect(l13?.practice?.length).toBeGreaterThanOrEqual(6);
    expect(l13?.stats.practiceCount).toBeGreaterThan(50);

    const firstPractice = l13?.practice?.[0];
    expect(firstPractice?.part).toBe("I");
    expect(firstPractice?.title).toContain("一キロ泳げます");
    expect(firstPractice?.items.length).toBeGreaterThan(0);

    const firstItem = firstPractice?.items[0];
    expect(firstItem?.prompt).toBe("話す");
    expect(firstItem?.answer).toBe("話せる");
  });

  it("generates contextual grammar cloze questions from Lesson 13 dialogues", async () => {
    const l13 = await getBookLesson("genki-2", 13);
    expect(l13).toBeDefined();

    const cloze = generateDialogueClozeQuestions(l13!, 10);
    expect(cloze.length).toBeGreaterThan(0);

    const ikeruQ = cloze.find((q) => q.correctAnswer === "行ける");
    expect(ikeruQ).toBeDefined();
    expect(ikeruQ?.maskedJa).toContain("_______");
    expect(ikeruQ?.options).toContain("行ける");
    expect(ikeruQ?.options).toContain("行かせる");
    expect(ikeruQ?.options).toContain("行かせて");
  });

  it("loads Minna no Nihongo I (mnn-1) lessons, vocab, grammar, and reference charts", async () => {
    const l1 = await getBookLesson("mnn-1", 1);
    expect(l1).toBeDefined();
    expect(l1?.vocabulary.length).toBeGreaterThan(30);
    expect(l1?.grammar.length).toBeGreaterThan(4);
    expect(l1?.practice?.[0]?.referenceTable).toBeDefined();

    const l14 = await getBookLesson("mnn-1", 14);
    expect(l14).toBeDefined();
    expect(l14?.practice?.[0]?.title).toContain("動詞の活用");
  });
});
