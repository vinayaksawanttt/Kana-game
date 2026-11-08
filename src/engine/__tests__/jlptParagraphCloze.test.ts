import { describe, expect, it } from "vitest";
import {
  PARAGRAPH_CLOZE_PASSAGES,
  calculateParagraphClozeResult,
  createParagraphClozeSession,
  getParagraphClozeCountsByLevel,
  paragraphClozeReducer,
  type ParagraphClozeSettings,
} from "../jlptParagraphCloze";

function createSeededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("JLPT Game 6 — Paragraph Flow Cloze Engine", () => {
  describe("Dataset Integrity", () => {
    it("contains 31 curated passages with at least 135 total blanks", () => {
      expect(PARAGRAPH_CLOZE_PASSAGES.length).toBe(31);
      const totalBlanks = PARAGRAPH_CLOZE_PASSAGES.reduce(
        (sum, p) => sum + p.blanks.length,
        0
      );
      expect(totalBlanks).toBeGreaterThanOrEqual(135);
    });

    it("covers all 5 JLPT levels (N5, N4, N3, N2, N1)", () => {
      const counts = getParagraphClozeCountsByLevel(PARAGRAPH_CLOZE_PASSAGES, "all");
      expect(counts.N5.passages).toBeGreaterThanOrEqual(5);
      expect(counts.N4.passages).toBeGreaterThanOrEqual(5);
      expect(counts.N3.passages).toBeGreaterThanOrEqual(5);
      expect(counts.N2.passages).toBeGreaterThanOrEqual(5);
      expect(counts.N1.passages).toBeGreaterThanOrEqual(5);
    });

    it("includes both official exam archetypes and /stories graded scenes", () => {
      const examPassages = PARAGRAPH_CLOZE_PASSAGES.filter(
        (p) => p.sourceType === "exam-speech" || p.sourceType === "diary-letter"
      );
      const storyPassages = PARAGRAPH_CLOZE_PASSAGES.filter(
        (p) => p.sourceType === "story-scene"
      );

      expect(examPassages.length).toBeGreaterThanOrEqual(15);
      expect(storyPassages.length).toBeGreaterThanOrEqual(8);

      // Verify story scenes carry linkedStory metadata
      for (const sp of storyPassages) {
        expect(sp.linkedStory).toBeDefined();
        expect(sp.linkedStory?.slug).toBeTruthy();
        expect(sp.linkedStory?.titleJa).toBeTruthy();
      }
    });

    it("verifies every blank has 4 distinct options, valid correctIndex, and explanations", () => {
      for (const passage of PARAGRAPH_CLOZE_PASSAGES) {
        expect(passage.blanks.length).toBeGreaterThanOrEqual(4);
        expect(passage.blanks.length).toBeLessThanOrEqual(5);

        for (const blank of passage.blanks) {
          expect(blank.options.length).toBe(4);
          expect(blank.correctIndex).toBeGreaterThanOrEqual(0);
          expect(blank.correctIndex).toBeLessThanOrEqual(3);
          expect(blank.discourseRuleEn.length).toBeGreaterThan(10);
          expect(blank.contextClueQuoteJa.length).toBeGreaterThan(0);

          // All 4 options must be distinct
          const optionTexts = new Set(blank.options.map((o) => o.ja));
          expect(optionTexts.size).toBe(4);
        }
      }
    });

    it("reconstructs completed sentence text identically to rawCompletedJa", () => {
      for (const passage of PARAGRAPH_CLOZE_PASSAGES) {
        const blanksMap = new Map(passage.blanks.map((b) => [b.blankIndex, b]));

        for (const paragraph of passage.paragraphs) {
          for (const sentence of paragraph.sentences) {
            let reconstructed = "";
            for (const seg of sentence.segments) {
              if (seg.type === "text") {
                reconstructed += seg.textJa ?? "";
              } else if (seg.type === "blank") {
                const b = blanksMap.get(seg.blankIndex!);
                expect(b).toBeDefined();
                reconstructed += b!.options[b!.correctIndex].ja;
              }
            }
            expect(reconstructed).toBe(sentence.rawCompletedJa);
          }
        }
      }
    });
  });

  describe("Deterministic Session Factory", () => {
    const defaultSettings: ParagraphClozeSettings = {
      levels: [5, 4],
      sourceFilter: "all",
      passageCount: 2,
      showEnglishSentenceHints: false,
    };

    it("produces identical passages and options with the same seed", () => {
      const rng1 = createSeededRng(12345);
      const session1 = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        defaultSettings,
        rng1
      );

      const rng2 = createSeededRng(12345);
      const session2 = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        defaultSettings,
        rng2
      );

      expect(session1.passages.map((p) => p.id)).toEqual(
        session2.passages.map((p) => p.id)
      );

      // Verify option orders match exactly
      const opts1 = session1.passages[0].blanks[0].options.map((o) => o.id);
      const opts2 = session2.passages[0].blanks[0].options.map((o) => o.id);
      expect(opts1).toEqual(opts2);
    });

    it("filters accurately by level", () => {
      const rng = createSeededRng(999);
      const session = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [3],
          sourceFilter: "all",
          passageCount: 3,
          showEnglishSentenceHints: false,
        },
        rng
      );

      expect(session.passages.length).toBe(3);
      for (const p of session.passages) {
        expect(p.jlpt).toBe(3);
      }
    });

    it("filters accurately by sourceFilter", () => {
      const rng = createSeededRng(456);
      const examSession = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [5, 4, 3],
          sourceFilter: "exam-only",
          passageCount: 3,
          showEnglishSentenceHints: false,
        },
        rng
      );

      for (const p of examSession.passages) {
        expect(p.sourceType).not.toBe("story-scene");
      }

      const storySession = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [5, 4, 3],
          sourceFilter: "story-scenes",
          passageCount: 3,
          showEnglishSentenceHints: false,
        },
        rng
      );

      for (const p of storySession.passages) {
        expect(p.sourceType).toBe("story-scene");
      }
    });

    it("supports targeted practice via passageIds", () => {
      const rng = createSeededRng(777);
      const targetIds = ["n5-exam-favorite-shop-ken", "story-n3-hospital"];
      const session = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [5, 3],
          sourceFilter: "all",
          passageCount: 2,
          showEnglishSentenceHints: false,
          passageIds: targetIds,
        },
        rng
      );

      expect(session.passages.length).toBe(2);
      const ids = session.passages.map((p) => p.id);
      expect(ids).toContain("n5-exam-favorite-shop-ken");
      expect(ids).toContain("story-n3-hospital");
    });
  });

  describe("Reducer Lifecycle & Gameplay", () => {
    it("handles FOCUS_BLANK, SELECT_OPTION with auto-advance, and SUBMIT_PASSAGE", () => {
      const rng = createSeededRng(42);
      const session = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [5],
          sourceFilter: "all",
          passageCount: 2,
          showEnglishSentenceHints: false,
        },
        rng
      );

      const firstPassage = session.passages[0];
      const blankCount = firstPassage.blanks.length;
      expect(session.activeBlankIndex).toBe(0);
      expect(session.selectedOptionByBlank).toEqual(Array(blankCount).fill(null));

      // 1. Manually focus blank 2
      let state = paragraphClozeReducer(session, {
        type: "FOCUS_BLANK",
        blankIndex: 2,
      });
      expect(state.activeBlankIndex).toBe(2);

      // 2. Select option for blank 2 -> should snap option and auto-advance to next empty blank (3)
      state = paragraphClozeReducer(state, {
        type: "SELECT_OPTION",
        blankIndex: 2,
        optionIndex: firstPassage.blanks[2].correctIndex,
      });
      expect(state.selectedOptionByBlank[2]).toBe(
        firstPassage.blanks[2].correctIndex
      );
      expect(state.activeBlankIndex).toBe(3);

      // 3. Select all remaining blanks
      for (let i = 0; i < blankCount; i++) {
        state = paragraphClozeReducer(state, {
          type: "SELECT_OPTION",
          blankIndex: i,
          optionIndex: firstPassage.blanks[i].correctIndex,
        });
      }

      // All blanks are filled
      expect(state.selectedOptionByBlank.every((o) => o !== null)).toBe(true);

      // 4. Change an answer before submitting
      const wrongOpt = ((firstPassage.blanks[0].correctIndex + 1) % 4) as
        | 0
        | 1
        | 2
        | 3;
      state = paragraphClozeReducer(state, {
        type: "SELECT_OPTION",
        blankIndex: 0,
        optionIndex: wrongOpt,
      });
      expect(state.selectedOptionByBlank[0]).toBe(wrongOpt);

      // 5. Submit passage
      state = paragraphClozeReducer(state, {
        type: "SUBMIT_PASSAGE",
        timeMs: 15400,
      });
      expect(state.passageStatus).toBe("submitted");
      expect(state.passageResults.length).toBe(1);

      const result0 = state.passageResults[0];
      expect(result0.passageId).toBe(firstPassage.id);
      expect(result0.timeMs).toBe(15400);

      // Blank 0 was changed to wrong
      expect(result0.answers[0].isCorrect).toBe(false);
      // Blank 1..K were correct
      for (let i = 1; i < blankCount; i++) {
        expect(result0.answers[i].isCorrect).toBe(true);
      }

      // 6. Advance to next passage
      state = paragraphClozeReducer(state, {
        type: "NEXT_PASSAGE",
        forPassageIndex: 0,
      });
      expect(state.currentPassageIndex).toBe(1);
      expect(state.passageStatus).toBe("filling");
      expect(state.activeBlankIndex).toBe(0);

      // 7. Skip second passage
      state = paragraphClozeReducer(state, {
        type: "SKIP_PASSAGE",
        timeMs: 5000,
      });
      expect(state.passageStatus).toBe("skipped");
      expect(state.passageResults.length).toBe(2);

      // 8. Final NEXT_PASSAGE ends the session
      state = paragraphClozeReducer(state, {
        type: "NEXT_PASSAGE",
        forPassageIndex: 1,
      });
      expect(state.status).toBe("finished");
      expect(state.completedAt).toBeDefined();

      // 9. Verify result summary calculation
      const summary = calculateParagraphClozeResult(state);
      expect(summary.totalPassages).toBe(2);
      expect(summary.perfectPassagesCount).toBe(0); // 1 had a wrong blank, 1 skipped
      expect(summary.missedPassageIds.length).toBe(2);
      expect(summary.totalTimeMs).toBe(20400);
      expect(summary.categoryBreakdown.length).toBeGreaterThan(0);
    });

    it("ignores stale NEXT_PASSAGE and prevents options changes after submission", () => {
      const rng = createSeededRng(101);
      const session = createParagraphClozeSession(
        PARAGRAPH_CLOZE_PASSAGES,
        {
          levels: [4],
          sourceFilter: "all",
          passageCount: 2,
          showEnglishSentenceHints: false,
        },
        rng
      );

      // Submit passage
      let state = paragraphClozeReducer(session, {
        type: "SUBMIT_PASSAGE",
        timeMs: 8000,
      });
      expect(state.passageStatus).toBe("submitted");

      // Cannot change options when already submitted
      const prevState = state;
      state = paragraphClozeReducer(state, {
        type: "SELECT_OPTION",
        blankIndex: 0,
        optionIndex: 1,
      });
      expect(state).toBe(prevState);

      // Stale NEXT_PASSAGE (forPassageIndex mismatch) is safely ignored
      state = paragraphClozeReducer(state, {
        type: "NEXT_PASSAGE",
        forPassageIndex: 99,
      });
      expect(state.currentPassageIndex).toBe(0);
    });
  });
});
