import { describe, expect, it } from "vitest";
import {
  PHONETIC_TRAP_ITEMS,
  createPhoneticTrapSession,
  generateOrthographyTraps,
  generatePhoneticReadingTraps,
  phoneticTrapReducer,
  summarizePhoneticTrapSession,
} from "@/engine/jlptPhoneticTraps";

describe("jlptPhoneticTraps pure engine", () => {
  it("generates long-vowel traps for りょこう (e.g. りょうこう or りょこ)", () => {
    const traps = generatePhoneticReadingTraps("りょこう");
    expect(traps).toHaveLength(3);
    const trapStrings = traps.map((t) => t.trap);
    expect(new Set(trapStrings).size).toBe(3);
    expect(trapStrings).not.toContain("りょこう");
    expect(
      trapStrings.includes("りょうこう") || trapStrings.includes("りょこ"),
    ).toBe(true);
  });

  it("generates dakuten/rendaku and long-vowel traps for かいぎ (かいき and かいぎい / かぎ)", () => {
    const traps = generatePhoneticReadingTraps("かいぎ");
    expect(traps).toHaveLength(3);
    const trapStrings = traps.map((t) => t.trap);
    expect(new Set(trapStrings).size).toBe(3);
    expect(trapStrings).not.toContain("かいぎ");
    expect(trapStrings).toContain("かいき");
    expect(
      trapStrings.includes("かいぎい") || trapStrings.includes("かぎ"),
    ).toBe(true);
  });

  it("generates geminate っ trap きて for きって", () => {
    const traps = generatePhoneticReadingTraps("きって");
    expect(traps).toHaveLength(3);
    const trapStrings = traps.map((t) => t.trap);
    expect(trapStrings).toContain("きて");
  });

  it("property test across 250+ vocabulary readings: always returns 3 unique valid Hiragana traps", () => {
    const sample = PHONETIC_TRAP_ITEMS.slice(0, 250);
    expect(sample.length).toBeGreaterThanOrEqual(200);

    for (const item of sample) {
      const traps = generatePhoneticReadingTraps(item.reading);
      expect(traps).toHaveLength(3);
      const strings = traps.map((t) => t.trap);
      expect(new Set(strings).size).toBe(3);

      for (const trap of strings) {
        expect(trap).not.toBe(item.reading);
        expect(trap[0]).not.toBe("っ");
        expect(trap[0]).not.toBe("ん");
        expect(trap.endsWith("っ")).toBe(false);
        expect(trap.includes("っっ")).toBe(false);
        expect(/^[\u3041-\u3096]+$/.test(trap)).toBe(true);
      }
    }
  });

  it("generates 3 distinct 2-kanji orthography traps for 会議 and preserves okurigana for 集める", () => {
    const kaigiTraps = generateOrthographyTraps("会議");
    expect(kaigiTraps).toHaveLength(3);
    const kaigiStrings = kaigiTraps.map((t) => t.trap);
    expect(new Set(kaigiStrings).size).toBe(3);
    for (const t of kaigiStrings) {
      expect(t).not.toBe("会議");
      expect([...t]).toHaveLength(2);
    }

    const atsumeruTraps = generateOrthographyTraps("集める");
    expect(atsumeruTraps).toHaveLength(3);
    for (const t of atsumeruTraps) {
      expect(t.trap).not.toBe("集める");
      expect(t.trap.endsWith("める")).toBe(true);
    }
  });

  it("creates a deterministic session with a seeded rng and transitions cleanly through ANSWER, SKIP, NEXT, and END", () => {
    const makeRng = (seedInit = 42) => {
      let seed = seedInit;
      return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    };

    const s1 = createPhoneticTrapSession(
      PHONETIC_TRAP_ITEMS,
      { subMode: "mixed", levels: [5], size: 10, showEnglishHint: true },
      makeRng(99),
      "sess-deterministic",
      1000,
    );
    const s2 = createPhoneticTrapSession(
      PHONETIC_TRAP_ITEMS,
      { subMode: "mixed", levels: [5], size: 10, showEnglishHint: true },
      makeRng(99),
      "sess-deterministic",
      1000,
    );

    expect(s1.questions.map((q) => q.word)).toEqual(
      s2.questions.map((q) => q.word),
    );
    expect(s1.questions[0].mode).toBe("reading");
    expect(s1.questions[1].mode).toBe("orthography");

    // 1. Answer Q0 correctly
    let state = s1;
    const q0 = state.questions[0];
    state = phoneticTrapReducer(state, {
      type: "ANSWER",
      optionIndex: q0.correctOptionIndex,
      timeMs: 1400,
    });
    expect(state.revealed).toBe(true);
    expect(state.lastAnswer?.status).toBe("correct");

    // Advance to Q1
    state = phoneticTrapReducer(state, { type: "NEXT" });
    expect(state.currentIndex).toBe(1);
    expect(state.revealed).toBe(false);

    // 2. Answer Q1 with a wrong option (triggering a trap)
    const q1 = state.questions[1];
    const wrongIdx = q1.options.findIndex((o) => !o.isCorrect);
    state = phoneticTrapReducer(state, {
      type: "ANSWER",
      optionIndex: wrongIdx,
      timeMs: 2100,
    });
    expect(state.lastAnswer?.status).toBe("wrong");
    expect(state.lastAnswer?.trapRuleTriggered).toBeTruthy();

    // 3. Skip Q2
    state = phoneticTrapReducer(state, { type: "NEXT" });
    state = phoneticTrapReducer(state, { type: "SKIP", timeMs: 500 });
    expect(state.lastAnswer?.status).toBe("skipped");

    // 4. End session & summarize
    state = phoneticTrapReducer(state, { type: "END", finishedAt: 9000 });
    expect(state.status).toBe("finished");

    const summary = summarizePhoneticTrapSession(state);
    expect(summary.correctCount).toBe(1);
    expect(summary.wrongCount).toBe(1);
    expect(summary.skippedCount).toBe(1);
    expect(summary.missedItemIds.length).toBeGreaterThanOrEqual(2);
  });
});
