import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  INSTANT_REPLY_ITEMS,
  createInstantReplySession,
  getInstantReplyCountsByLevel,
  instantReplyReducer,
  summarizeInstantReplySession,
  type InstantReplyItem,
} from "@/engine/jlptInstantReply";

function createSeededRng(seed = 101): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("JLPT Game 3: Instant Reply Blitz (即時応答) Engine & Dataset", () => {
  describe("Dataset Integrity (instant-reply.json & INSTANT_REPLY_ITEMS)", () => {
    it("contains 150 triads across N5 (35), N4 (35), N3 (35), N2 (25), and N1 (20)", () => {
      const jsonPath = path.resolve(process.cwd(), "public/data/v1/jlpt/instant-reply.json");
      expect(fs.existsSync(jsonPath)).toBe(true);

      const jsonItems = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as InstantReplyItem[];
      expect(jsonItems).toHaveLength(150);
      expect(INSTANT_REPLY_ITEMS).toHaveLength(150);

      const counts = getInstantReplyCountsByLevel(INSTANT_REPLY_ITEMS);
      expect(counts).toEqual({
        N5: 35,
        N4: 35,
        N3: 35,
        N2: 25,
        N1: 20,
      });
    });

    it("ensures every item has jlpt in 1..5, non-empty prompt/translations, and 3 options with 1 correct", () => {
      for (const item of INSTANT_REPLY_ITEMS) {
        expect([1, 2, 3, 4, 5]).toContain(item.jlpt);
        expect(item.promptJa.trim().length).toBeGreaterThan(0);
        expect(item.promptReading.trim().length).toBeGreaterThan(0);
        expect(item.promptEn.trim().length).toBeGreaterThan(0);
        expect(item.options).toHaveLength(3);

        const correctOpts = item.options.filter((o) => o.isCorrect);
        expect(correctOpts).toHaveLength(1);

        for (const opt of item.options) {
          expect(opt.ja.trim().length).toBeGreaterThan(0);
          expect(opt.reading.trim().length).toBeGreaterThan(0);
          expect(opt.en.trim().length).toBeGreaterThan(0);
          expect(opt.explanation.trim().length).toBeGreaterThan(0);
          if (!opt.isCorrect) {
            expect(opt.trapType).toBeDefined();
          }
        }
      }
    });
  });

  describe("createInstantReplySession", () => {
    it("produces deterministic question order and 3-option shuffle with a seeded rng", () => {
      const settings = {
        levels: [5, 4] as (5 | 4 | 3 | 2 | 1)[],
        size: 10 as const,
        timerSeconds: 8 as const,
        autoSequenceAudio: true,
        showSituationHint: true,
      };

      const s1 = createInstantReplySession(
        INSTANT_REPLY_ITEMS,
        settings,
        createSeededRng(777),
        "reply-seed-1",
        "2026-11-07T00:00:00.000Z",
      );
      const s2 = createInstantReplySession(
        INSTANT_REPLY_ITEMS,
        settings,
        createSeededRng(777),
        "reply-seed-1",
        "2026-11-07T00:00:00.000Z",
      );

      expect(s1).toEqual(s2);
      expect(s1.questions).toHaveLength(10);
      for (const q of s1.questions) {
        expect([5, 4]).toContain(q.jlpt);
        expect(q.options).toHaveLength(3);
        expect(q.options[q.correctOptionIndex]?.isCorrect).toBe(true);
      }
    });
  });

  describe("instantReplyReducer & summarizeInstantReplySession", () => {
    it("handles ANSWER (correct & wrong with trapTriggered), TIMEOUT, SKIP, stale NEXT guard, and END invariants", () => {
      const s0 = createInstantReplySession(
        INSTANT_REPLY_ITEMS,
        {
          levels: [5],
          size: 10,
          timerSeconds: 8,
          autoSequenceAudio: true,
          showSituationHint: true,
        },
        createSeededRng(2026),
        "reply-reducer-session",
      );

      // Q0: Correct answer
      const q0 = s0.questions[0]!;
      const s1 = instantReplyReducer(s0, {
        type: "ANSWER",
        optionIndex: q0.correctOptionIndex,
        timeMs: 2400,
      });
      expect(s1.revealed).toBe(true);
      expect(s1.score).toBe(1);
      expect(s1.questions[0]?.status).toBe("correct");
      expect(s1.questions[0]?.trapTriggered).toBeNull();

      // Stale NEXT ignored
      const s1Stale = instantReplyReducer(s1, { type: "NEXT", forIndex: 5 });
      expect(s1Stale).toBe(s1);

      // Advance to Q1: Wrong answer with trapTriggered
      const s2 = instantReplyReducer(s1, { type: "NEXT", forIndex: 0 });
      expect(s2.index).toBe(1);
      expect(s2.revealed).toBe(false);

      const q1 = s2.questions[1]!;
      const wrongIdx1 = ((q1.correctOptionIndex + 1) % 3) as 0 | 1 | 2;
      const s3 = instantReplyReducer(s2, {
        type: "ANSWER",
        optionIndex: wrongIdx1,
        timeMs: 3600,
      });
      expect(s3.revealed).toBe(true);
      expect(s3.score).toBe(1);
      expect(s3.questions[1]?.status).toBe("wrong");
      expect(s3.questions[1]?.trapTriggered).toBe(q1.options[wrongIdx1]?.trapType);

      // Advance to Q2: TIMEOUT
      const s4 = instantReplyReducer(s3, { type: "NEXT", forIndex: 1 });
      const s5 = instantReplyReducer(s4, { type: "TIMEOUT", timeMs: 8000 });
      expect(s5.revealed).toBe(true);
      expect(s5.questions[2]?.status).toBe("timeout");

      // Advance to Q3: SKIP + INCREMENT_REPLAY
      const s6 = instantReplyReducer(s5, { type: "NEXT", forIndex: 2 });
      const s6Replay = instantReplyReducer(s6, { type: "INCREMENT_REPLAY" });
      expect(s6Replay.questions[3]?.replaysUsed).toBe(1);

      const s7 = instantReplyReducer(s6Replay, { type: "SKIP", timeMs: 1100 });
      expect(s7.revealed).toBe(true);
      expect(s7.questions[3]?.status).toBe("skipped");

      // END session early and verify status counts sum to total
      const sEnd = instantReplyReducer(s7, { type: "END" });
      expect(sEnd.status).toBe("finished");

      const summary = summarizeInstantReplySession(sEnd);
      expect(summary.total).toBe(10);
      expect(summary.passedCount).toBe(1);
      expect(summary.wrongCount).toBe(1);
      expect(summary.timeoutCount).toBe(1);
      expect(summary.skippedCount).toBe(7);
      expect(
        summary.passedCount +
          summary.wrongCount +
          summary.timeoutCount +
          summary.skippedCount,
      ).toBe(summary.total);
      expect(summary.avgResponseTimeMs).toBe(3000);
      expect(summary.trapBreakdown.length).toBeGreaterThanOrEqual(1);
    });
  });
});
