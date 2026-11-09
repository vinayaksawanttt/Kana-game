import { describe, expect, it } from "vitest";
import {
  buildWordUsageQuestion,
  createWordUsageSession,
  wordUsageReducer,
  summarizeWordUsageSession,
  getWordUsageSessionStorageKey,
  type WordUsageSession,
  type WordUsageSettings,
} from "../jlptWordUsage";
import { WORD_USAGE_ITEMS } from "@/data/jlpt/wordUsageData";

function createSeededRng(seed: number = 42): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("jlptWordUsage Pure Engine", () => {
  describe("buildWordUsageQuestion", () => {
    it("shuffles options and updates correctOptionIndex accurately", () => {
      const sampleItem = WORD_USAGE_ITEMS[0]; // N4 案内
      const rng1 = createSeededRng(101);
      const question1 = buildWordUsageQuestion(sampleItem, rng1);

      expect(question1.id).toBe(sampleItem.id);
      expect(question1.word).toBe(sampleItem.word);
      expect(question1.options).toHaveLength(4);

      // Verify correctOptionIndex points to the correct option
      const correctOpt = question1.options[question1.correctOptionIndex];
      expect(correctOpt.isCorrect).toBe(true);

      // Verify the other 3 options are not correct
      const incorrectOpts = question1.options.filter((_, idx) => idx !== question1.correctOptionIndex);
      expect(incorrectOpts).toHaveLength(3);
      for (const opt of incorrectOpts) {
        expect(opt.isCorrect).toBe(false);
      }

      // Shuffling is deterministic with same seed
      const rng2 = createSeededRng(101);
      const question2 = buildWordUsageQuestion(sampleItem, rng2);
      expect(question1.correctOptionIndex).toBe(question2.correctOptionIndex);
      expect(question1.options.map((o) => o.sentenceJa)).toEqual(
        question2.options.map((o) => o.sentenceJa),
      );
    });
  });

  describe("createWordUsageSession", () => {
    it("filters questions by JLPT level and limits session size", () => {
      const rng = createSeededRng(500);
      const settings: WordUsageSettings = {
        levels: [3], // N3 only
        size: 5,
        showEnglishTranslations: true,
      };

      const session = createWordUsageSession(WORD_USAGE_ITEMS, settings, rng, "test-session-n3");
      expect(session.sessionId).toBe("test-session-n3");
      expect(session.questions).toHaveLength(5);
      expect(session.status).toBe("playing");
      expect(session.currentIndex).toBe(0);
      expect(session.score).toBe(0);
      expect(session.revealed).toBe(false);

      // All questions must be JLPT N3
      for (const q of session.questions) {
        expect(q.jlpt).toBe(3);
        expect(q.levelLabel).toBe("N3");
      }
    });

    it("filters questions by specific questionIds for missed-practice flow", () => {
      const rng = createSeededRng(777);
      const targetIds = ["usage-n4-annai", "usage-n3-yobou", "usage-n2-aimai"];
      const settings: WordUsageSettings = {
        levels: [4, 3, 2],
        size: 10,
        showEnglishTranslations: true,
        questionIds: targetIds,
      };

      const session = createWordUsageSession(WORD_USAGE_ITEMS, settings, rng);
      expect(session.questions).toHaveLength(3);
      const sessionIds = session.questions.map((q) => q.id);
      expect(sessionIds.sort()).toEqual(targetIds.sort());
    });

    it("falls back gracefully to full pool if filters match nothing", () => {
      const rng = createSeededRng(999);
      const settings: WordUsageSettings = {
        levels: [5], // N5 has 0 items in current pool
        size: 5,
        showEnglishTranslations: false,
      };

      const session = createWordUsageSession(WORD_USAGE_ITEMS, settings, rng);
      expect(session.questions).toHaveLength(5);
    });
  });

  describe("wordUsageReducer", () => {
    function setupSession(): WordUsageSession {
      const rng = createSeededRng(12345);
      const settings: WordUsageSettings = {
        levels: [4],
        size: 3,
        showEnglishTranslations: true,
      };
      return createWordUsageSession(WORD_USAGE_ITEMS, settings, rng, "reducer-session-1");
    }

    it("handles correct ANSWER: score increments, revealed becomes true", () => {
      let state = setupSession();
      const currentQ = state.questions[0];
      const correctIndex = currentQ.correctOptionIndex;

      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: correctIndex,
        timeMs: 2500,
      });

      expect(state.score).toBe(1);
      expect(state.revealed).toBe(true);
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].status).toBe("correct");
      expect(state.answers[0].chosenOptionIndex).toBe(correctIndex);
      expect(state.answers[0].timeMs).toBe(2500);

      // Repeat answer while revealed must be ignored
      const stateBeforeRepeat = state;
      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: ((correctIndex + 1) % 4) as 0 | 1 | 2 | 3,
        timeMs: 1000,
      });
      expect(state).toBe(stateBeforeRepeat);
      expect(state.score).toBe(1);
    });

    it("handles wrong ANSWER: score remains same, revealed becomes true", () => {
      let state = setupSession();
      const currentQ = state.questions[0];
      const wrongIndex = ((currentQ.correctOptionIndex + 1) % 4) as 0 | 1 | 2 | 3;

      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: wrongIndex,
        timeMs: 3100,
      });

      expect(state.score).toBe(0);
      expect(state.revealed).toBe(true);
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].status).toBe("wrong");
      expect(state.answers[0].chosenOptionIndex).toBe(wrongIndex);
    });

    it("handles SKIP: records skipped status and sets revealed true", () => {
      let state = setupSession();
      state = wordUsageReducer(state, { type: "SKIP", timeMs: 1500 });

      expect(state.score).toBe(0);
      expect(state.revealed).toBe(true);
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].status).toBe("skipped");
      expect(state.answers[0].chosenOptionIndex).toBeNull();
    });

    it("handles NEXT with guards against unrevealed and stale indices", () => {
      let state = setupSession();

      // Guard: Cannot NEXT if not revealed
      const beforeUnrevealedNext = state;
      state = wordUsageReducer(state, { type: "NEXT", forIndex: 0 });
      expect(state).toBe(beforeUnrevealedNext);

      // Answer question 0
      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: state.questions[0].correctOptionIndex,
        timeMs: 1200,
      });
      expect(state.revealed).toBe(true);

      // Guard: Cannot NEXT with mismatched forIndex
      const beforeStaleNext = state;
      state = wordUsageReducer(state, { type: "NEXT", forIndex: 99 });
      expect(state).toBe(beforeStaleNext);

      // Valid NEXT advances index
      state = wordUsageReducer(state, { type: "NEXT", forIndex: 0 });
      expect(state.currentIndex).toBe(1);
      expect(state.revealed).toBe(false);

      // Advance through question 1
      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: state.questions[1].correctOptionIndex,
        timeMs: 1000,
      });
      state = wordUsageReducer(state, { type: "NEXT", forIndex: 1 });
      expect(state.currentIndex).toBe(2);

      // Advance through question 2 (last question in 3-question session)
      state = wordUsageReducer(state, {
        type: "SKIP",
        timeMs: 800,
      });
      state = wordUsageReducer(state, { type: "NEXT", forIndex: 2 });

      // Session completes
      expect(state.status).toBe("finished");
      expect(state.completedAt).toBeDefined();

      // Finished session ignores further actions
      const finishedSnapshot = state;
      state = wordUsageReducer(state, {
        type: "ANSWER",
        optionIndex: 0,
        timeMs: 100,
      });
      expect(state).toBe(finishedSnapshot);
    });

    it("handles END: closes session early and records skipped for active unrevealed question", () => {
      let state = setupSession();
      // Question 0 is active and not revealed yet
      state = wordUsageReducer(state, { type: "END" });

      expect(state.status).toBe("finished");
      expect(state.answers).toHaveLength(1);
      expect(state.answers[0].status).toBe("skipped");
      expect(state.completedAt).toBeDefined();
    });
  });

  describe("summarizeWordUsageSession", () => {
    it("aggregates scores, accuracy, time, missed IDs, and level breakdowns", () => {
      const rng = createSeededRng(888);
      const settings: WordUsageSettings = {
        levels: [4, 3, 2, 1],
        size: 4,
        showEnglishTranslations: true,
      };

      let session = createWordUsageSession(WORD_USAGE_ITEMS, settings, rng, "summary-test");

      // Q0: correct (2000ms)
      session = wordUsageReducer(session, {
        type: "ANSWER",
        optionIndex: session.questions[0].correctOptionIndex,
        timeMs: 2000,
      });
      session = wordUsageReducer(session, { type: "NEXT", forIndex: 0 });

      // Q1: wrong (3000ms)
      const wrongIdx = ((session.questions[1].correctOptionIndex + 1) % 4) as 0 | 1 | 2 | 3;
      session = wordUsageReducer(session, {
        type: "ANSWER",
        optionIndex: wrongIdx,
        timeMs: 3000,
      });
      session = wordUsageReducer(session, { type: "NEXT", forIndex: 1 });

      // Q2: skipped (1000ms)
      session = wordUsageReducer(session, { type: "SKIP", timeMs: 1000 });
      session = wordUsageReducer(session, { type: "NEXT", forIndex: 2 });

      // Q3: correct (4000ms)
      session = wordUsageReducer(session, {
        type: "ANSWER",
        optionIndex: session.questions[3].correctOptionIndex,
        timeMs: 4000,
      });
      session = wordUsageReducer(session, { type: "NEXT", forIndex: 3 });

      expect(session.status).toBe("finished");

      const summary = summarizeWordUsageSession(session);
      expect(summary.total).toBe(4);
      expect(summary.score).toBe(2);
      expect(summary.correctCount).toBe(2);
      expect(summary.wrongCount).toBe(1);
      expect(summary.skippedCount).toBe(1);
      expect(summary.accuracy).toBe(50);
      expect(summary.totalTimeMs).toBe(10000);
      expect(summary.rows).toHaveLength(4);

      // Missed IDs must include Q1 and Q2
      expect(summary.missedIds).toContain(session.questions[1].itemId);
      expect(summary.missedIds).toContain(session.questions[2].itemId);
      expect(summary.missedIds).not.toContain(session.questions[0].itemId);
      expect(summary.missedIds).not.toContain(session.questions[3].itemId);

      // By-level breakdown check
      expect(summary.byLevel.length).toBeGreaterThan(0);
      const totalInBreakdowns = summary.byLevel.reduce((acc, b) => acc + b.total, 0);
      expect(totalInBreakdowns).toBe(4);
    });
  });

  describe("Storage key helper", () => {
    it("returns key following jlpt-usage-session:<sessionId> convention", () => {
      const key = getWordUsageSessionStorageKey("test-abc-123");
      expect(key).toBe("jlpt-usage-session:test-abc-123");
    });
  });
});
