import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  SYNONYM_MATCH_ITEMS,
  createSynonymMatchSession,
  getSynonymMatchCountsByLevel,
  summarizeSynonymMatchSession,
  synonymMatchReducer,
  type SynonymMatchItem,
} from "@/engine/jlptSynonymMatch";

function createSeededRng(seed = 42): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("JLPT Game 4: Synonym Paraphrase Match Engine & Dataset", () => {
  describe("Dataset Integrity (synonym-match.json & SYNONYM_MATCH_ITEMS)", () => {
    it("matches public/data/v1/jlpt/synonym-match.json and covers all N5–N1 levels", () => {
      const jsonPath = path.resolve(process.cwd(), "public/data/v1/jlpt/synonym-match.json");
      expect(fs.existsSync(jsonPath)).toBe(true);

      const jsonItems = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as SynonymMatchItem[];
      expect(jsonItems.length).toBe(SYNONYM_MATCH_ITEMS.length);
      expect(SYNONYM_MATCH_ITEMS.length).toBeGreaterThanOrEqual(150);

      const counts = getSynonymMatchCountsByLevel(SYNONYM_MATCH_ITEMS);
      expect(counts.N5).toBeGreaterThanOrEqual(20);
      expect(counts.N4).toBeGreaterThanOrEqual(20);
      expect(counts.N3).toBeGreaterThanOrEqual(20);
      expect(counts.N2).toBeGreaterThanOrEqual(20);
      expect(counts.N1).toBeGreaterThanOrEqual(20);
    });

    it("ensures prefix + targetSurface + suffix reconstructs sentenceJa for every item", () => {
      for (const item of SYNONYM_MATCH_ITEMS) {
        expect(item.prefix + item.targetSurface + item.suffix).toBe(item.sentenceJa);
        expect(item.targetSurface.length).toBeGreaterThan(0);
        expect(item.sentenceEn.length).toBeGreaterThan(0);
      }
    });

    it("includes N5/N4 full-sentence paraphrase items (antonym flips and time conversions)", () => {
      const omoshiroItem = SYNONYM_MATCH_ITEMS.find((i) => i.id === "syn-n5-omoshirokunakatta");
      expect(omoshiroItem).toBeDefined();
      expect(omoshiroItem?.correctSynonym.word).toBe("つまらなかったです");

      const kuraiItem = SYNONYM_MATCH_ITEMS.find((i) => i.id === "syn-n5-kurai");
      expect(kuraiItem).toBeDefined();
      expect(kuraiItem?.correctSynonym.word).toBe("明るくありません");

      const maibanItem = SYNONYM_MATCH_ITEMS.find((i) => i.id === "syn-n5-maiban");
      expect(maibanItem).toBeDefined();
      expect(maibanItem?.correctSynonym.word).toBe("夜はいつも");

      const ninenMaeItem = SYNONYM_MATCH_ITEMS.find((i) => i.id === "syn-n5-ninen-mae");
      expect(ninenMaeItem).toBeDefined();
      expect(ninenMaeItem?.correctSynonym.word).toBe("おととし");

      const tanjoubiItem = SYNONYM_MATCH_ITEMS.find((i) => i.id === "syn-n5-tanjoubi");
      expect(tanjoubiItem).toBeDefined();
      expect(tanjoubiItem?.correctSynonym.word).toBe("6月15日にうまれました");
    });

    it("ensures targetWord and correctSynonym.word are never identical strings", () => {
      for (const item of SYNONYM_MATCH_ITEMS) {
        expect(item.targetWord).not.toBe(item.correctSynonym.word);
        expect(item.targetSurface).not.toBe(item.correctSynonym.word);
      }
    });

    it("ensures every question has 4 distinct Japanese option words and readings", () => {
      for (const item of SYNONYM_MATCH_ITEMS) {
        expect(item.distractors).toHaveLength(3);
        const allCandidates = [item.correctSynonym, ...item.distractors];
        const wordSet = new Set(allCandidates.map((c) => c.word));
        const readingSet = new Set(allCandidates.map((c) => c.reading));

        expect(wordSet.size).toBe(4);
        expect(readingSet.size).toBe(4);

        for (const cand of allCandidates) {
          expect(cand.word.trim().length).toBeGreaterThan(0);
          expect(cand.reading.trim().length).toBeGreaterThan(0);
          expect(cand.meaningEn.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("createSynonymMatchSession", () => {
    it("produces deterministic questions and option ordering with a seeded rng", () => {
      const settings = {
        levels: [5, 4] as (5 | 4 | 3 | 2 | 1)[],
        size: 10 as const,
        scriptMode: "exam-authentic" as const,
        showSentenceTranslationHint: false,
      };

      const sessionA = createSynonymMatchSession(
        SYNONYM_MATCH_ITEMS,
        settings,
        createSeededRng(1337),
        "test-session-1",
        "2026-11-07T00:00:00.000Z",
      );
      const sessionB = createSynonymMatchSession(
        SYNONYM_MATCH_ITEMS,
        settings,
        createSeededRng(1337),
        "test-session-1",
        "2026-11-07T00:00:00.000Z",
      );

      expect(sessionA).toEqual(sessionB);
      expect(sessionA.questions).toHaveLength(10);
      for (const q of sessionA.questions) {
        expect([5, 4]).toContain(q.jlpt);
        expect(q.options).toHaveLength(4);
        expect(q.options[q.correctOptionIndex]?.isCorrect).toBe(true);
      }
    });

    it("supports filtering by explicit questionIds for Practice Missed Pairs", () => {
      const sampleIds = SYNONYM_MATCH_ITEMS.slice(0, 3).map((i) => i.id);
      const session = createSynonymMatchSession(
        SYNONYM_MATCH_ITEMS,
        {
          levels: [5],
          size: 10,
          scriptMode: "with-furigana",
          showSentenceTranslationHint: true,
          questionIds: sampleIds,
        },
        createSeededRng(99),
      );

      expect(session.questions).toHaveLength(3);
      expect(new Set(session.questions.map((q) => q.id))).toEqual(new Set(sampleIds));
    });
  });

  describe("synonymMatchReducer & summarizeSynonymMatchSession", () => {
    it("handles ANSWER (correct/wrong), ignores repeat ANSWER, handles SKIP, guards stale NEXT, and handles END", () => {
      const session0 = createSynonymMatchSession(
        SYNONYM_MATCH_ITEMS,
        {
          levels: [5],
          size: 10,
          scriptMode: "exam-authentic",
          showSentenceTranslationHint: false,
        },
        createSeededRng(2026),
        "reducer-test",
      );

      const q0 = session0.questions[0]!;
      const correctIdx0 = q0.correctOptionIndex;
      const wrongIdx0 = ((correctIdx0 + 1) % 4) as 0 | 1 | 2 | 3;

      // 1. Answer Q0 correctly
      const s1 = synonymMatchReducer(session0, {
        type: "ANSWER",
        optionIndex: correctIdx0,
        timeMs: 1400,
      });
      expect(s1.revealed).toBe(true);
      expect(s1.score).toBe(1);
      expect(s1.answers).toHaveLength(1);
      expect(s1.answers[0]?.status).toBe("correct");

      // 2. Repeat ANSWER on same question is ignored
      const s1Repeat = synonymMatchReducer(s1, {
        type: "ANSWER",
        optionIndex: wrongIdx0,
        timeMs: 500,
      });
      expect(s1Repeat).toBe(s1);

      // 3. Stale NEXT with wrong forIndex is ignored
      const s1StaleNext = synonymMatchReducer(s1, {
        type: "NEXT",
        forIndex: 99,
      });
      expect(s1StaleNext).toBe(s1);

      // 4. Valid NEXT advances to Q1
      const s2 = synonymMatchReducer(s1, {
        type: "NEXT",
        forIndex: 0,
      });
      expect(s2.currentIndex).toBe(1);
      expect(s2.revealed).toBe(false);

      // 5. Answer Q1 wrongly
      const q1 = s2.questions[1]!;
      const wrongIdx1 = ((q1.correctOptionIndex + 1) % 4) as 0 | 1 | 2 | 3;
      const s3 = synonymMatchReducer(s2, {
        type: "ANSWER",
        optionIndex: wrongIdx1,
        timeMs: 2100,
      });
      expect(s3.score).toBe(1);
      expect(s3.revealed).toBe(true);
      expect(s3.answers[1]?.status).toBe("wrong");

      // Advance to Q2 and SKIP
      const s4 = synonymMatchReducer(s3, { type: "NEXT", forIndex: 1 });
      const s5 = synonymMatchReducer(s4, { type: "SKIP", timeMs: 800 });
      expect(s5.revealed).toBe(true);
      expect(s5.answers[2]?.status).toBe("skipped");

      // END session early
      const sEnd = synonymMatchReducer(s5, { type: "END" });
      expect(sEnd.status).toBe("finished");

      const summary = summarizeSynonymMatchSession(sEnd);
      expect(summary.total).toBe(10);
      expect(summary.correctCount).toBe(1);
      expect(summary.wrongCount).toBe(1);
      expect(summary.skippedCount).toBe(8);
      expect(summary.missedIds).toHaveLength(9);
    });
  });
});
