import { describe, expect, it } from "vitest";
import {
  STAR_SCRAMBLE_ITEMS,
  STAR_SCRAMBLE_LEVELS,
  buildShuffledTiles,
  createStarScrambleSession,
  getStarScrambleCountsByLevel,
  starScrambleReducer,
  summarizeStarScrambleSession,
} from "@/engine/jlptStarScramble";

describe("jlptStarScramble engine & dataset", () => {
  it("contains 250+ curated 4-segment ★ Star Scramble items across N5–N1 with exact sentence reconstruction", () => {
    expect(STAR_SCRAMBLE_ITEMS.length).toBeGreaterThanOrEqual(250);

    const counts = getStarScrambleCountsByLevel(STAR_SCRAMBLE_ITEMS);
    for (const lvl of STAR_SCRAMBLE_LEVELS) {
      expect(counts[lvl]).toBeGreaterThanOrEqual(50);
    }

    for (const item of STAR_SCRAMBLE_ITEMS) {
      expect(item.segments).toHaveLength(4);
      expect(new Set(item.segments).size).toBe(4);
      for (const seg of item.segments) {
        expect(seg.trim().length).toBeGreaterThan(0);
      }
      expect(item.prefix + item.segments.join("") + item.suffix).toBe(item.fullSentence);
      expect(item.english.trim().length).toBeGreaterThan(0);
    }
  });

  it("never produces unshuffled [0, 1, 2, 3] tile order even when rng returns 0.999", () => {
    const { options } = buildShuffledTiles(
      "test-item",
      ["A", "B", "C", "D"],
      () => 0.999,
    );
    const slotOrder = options.map((o) => o.correctSlotIndex);
    expect(slotOrder).not.toEqual([0, 1, 2, 3]);
    expect(options.map((o) => o.optionNumber)).toEqual([1, 2, 3, 4]);
  });

  it("creates a deterministic session filtered by level and evaluates both starCorrect and fullOrderCorrect", () => {
    let seed = 1;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    let session = createStarScrambleSession(
      STAR_SCRAMBLE_ITEMS,
      { levels: ["N5"], size: 10, showEnglishHint: false },
      rng,
      "test-session-1",
      1000,
    );

    expect(session.questions).toHaveLength(10);
    expect(session.questions.every((q) => q.level === "N5")).toBe(true);
    expect(new Set(session.questions.map((q) => q.itemId)).size).toBe(10);

    const q0 = session.questions[0];
    expect([1, 2]).toContain(q0.starSlotIndex);

    // 1. Place all 4 tiles in exact correct order -> both starCorrect & fullOrderCorrect are true
    for (const tileId of q0.correctOrderIds) {
      session = starScrambleReducer(session, { type: "PLACE_TILE", tileId });
    }
    expect(session.placedTileIds).toEqual(q0.correctOrderIds);

    session = starScrambleReducer(session, { type: "SUBMIT", timeMs: 3200 });
    expect(session.revealed).toBe(true);
    expect(session.lastAnswer?.starCorrect).toBe(true);
    expect(session.lastAnswer?.fullOrderCorrect).toBe(true);

    // Advance to question 2
    session = starScrambleReducer(session, { type: "NEXT" });
    expect(session.currentIndex).toBe(1);
    expect(session.placedTileIds).toEqual([null, null, null, null]);

    // 2. Place correct tile on starSlotIndex, but swap two non-star slots -> starCorrect: true, fullOrderCorrect: false
    const q1 = session.questions[1];
    const nonStarIndices = ([0, 1, 2, 3] as const).filter((i) => i !== q1.starSlotIndex);
    const partialOrder: [string, string, string, string] = [...q1.correctOrderIds];
    const tmp = partialOrder[nonStarIndices[0]];
    partialOrder[nonStarIndices[0]] = partialOrder[nonStarIndices[1]];
    partialOrder[nonStarIndices[1]] = tmp;

    for (let idx = 0; idx < 4; idx++) {
      session = starScrambleReducer(session, {
        type: "SET_SLOT",
        slotIndex: idx as 0 | 1 | 2 | 3,
        tileId: partialOrder[idx],
      });
    }

    session = starScrambleReducer(session, { type: "SUBMIT", timeMs: 2500 });
    expect(session.lastAnswer?.starCorrect).toBe(true);
    expect(session.lastAnswer?.fullOrderCorrect).toBe(false);

    // 3. Test SKIP on question 3
    session = starScrambleReducer(session, { type: "NEXT" });
    session = starScrambleReducer(session, { type: "SKIP", timeMs: 800 });
    expect(session.lastAnswer?.skipped).toBe(true);
    expect(session.lastAnswer?.starCorrect).toBe(false);
    expect(session.lastAnswer?.fullOrderCorrect).toBe(false);

    // Summarize session
    const summary = summarizeStarScrambleSession(session);
    expect(summary.starCorrectCount).toBe(2);
    expect(summary.fullOrderCorrectCount).toBe(1);
    expect(summary.skippedCount).toBe(1);
  });
});
