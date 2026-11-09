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

  it("generates counter rendaku traps for ろっぽん (e.g. ろくぼん, ろくぽん, ろっほん)", () => {
    const traps = generatePhoneticReadingTraps("ろっぽん");
    expect(traps).toHaveLength(3);
    const trapStrings = traps.map((t) => t.trap);
    expect(new Set(trapStrings).size).toBe(3);
    expect(trapStrings).not.toContain("ろっぽん");
    expect(
      trapStrings.some((t) => t === "ろくぼん" || t === "ろくぽん" || t === "ろっほん" || t === "ろくほん"),
    ).toBe(true);
    expect(traps.some((t) => t.rule === "Counter Rendaku Trap")).toBe(true);
  });

  it("generates Katakana loanword traps for シャワー (e.g. シャウー, ツャワー) and エレベーター", () => {
    const shawaTraps = generateOrthographyTraps("シャワー");
    expect(shawaTraps).toHaveLength(3);
    const shawaStrings = shawaTraps.map((t) => t.trap);
    expect(new Set(shawaStrings).size).toBe(3);
    expect(shawaStrings).not.toContain("シャワー");
    expect(
      shawaStrings.some((t) => t === "シャウー" || t === "ツャワー" || t === "ツャウー" || t === "シャワ"),
    ).toBe(true);
    expect(shawaTraps.every((t) => t.rule === "Katakana Loanword Trap")).toBe(true);

    const ereTraps = generateOrthographyTraps("エレベーター");
    expect(ereTraps).toHaveLength(3);
    const ereStrings = ereTraps.map((t) => t.trap);
    expect(ereStrings).toContain("エレベター");
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
        expect(/^[\u3041-\u3096\u30FC]+$/.test(trap)).toBe(true);
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

  describe("Katakana Restriction by Level (N5 vs N4–N1 vs mixed)", () => {
    it("generates Katakana loanword orthography traps when N5 is selected", () => {
      // Find known N5 katakana items (シャワー, エレベーター, etc.)
      const n5KatakanaItems = PHONETIC_TRAP_ITEMS.filter(
        (it) => it.level === "N5" && /[\u30A1-\u30FA]/.test(it.word),
      );
      expect(n5KatakanaItems.length).toBeGreaterThan(0);

      // Session with N5 in orthography mode
      const session = createPhoneticTrapSession(
        PHONETIC_TRAP_ITEMS,
        {
          subMode: "orthography",
          levels: ["N5"],
          size: 30,
          showEnglishHint: true,
          questionIds: n5KatakanaItems.map((k) => k.id),
        },
        () => 0.5,
      );

      // Should have Katakana loanword orthography traps
      const katakanaQuestions = session.questions.filter((q) =>
        /[\u30A1-\u30FA]/.test(q.word),
      );
      expect(katakanaQuestions.length).toBeGreaterThan(0);

      const hasKatakanaTraps = katakanaQuestions.some((q) =>
        q.options.some((opt) => opt.trapRule === "Katakana Loanword Trap"),
      );
      expect(hasKatakanaTraps).toBe(true);

      // Every katakana orthography question has options with Katakana Loanword Trap
      for (const q of katakanaQuestions) {
        expect(q.mode).toBe("orthography");
        const wrongOpts = q.options.filter((o) => !o.isCorrect);
        expect(
          wrongOpts.some((o) => o.trapRule === "Katakana Loanword Trap"),
        ).toBe(true);
      }
    });

    it("restricts Katakana orthography traps and retains Kanji & conjugated verb/adjective traps for N4–N1 pools", () => {
      const nonN5Tiers: Array<"N4" | "N3" | "N2" | "N1"> = ["N4", "N3", "N2", "N1"];

      // 1. Check each non-N5 tier individually in orthography mode
      for (const level of nonN5Tiers) {
        const session = createPhoneticTrapSession(
          PHONETIC_TRAP_ITEMS,
          {
            subMode: "orthography",
            levels: [level],
            size: 30,
            showEnglishHint: true,
          },
          () => 0.35,
        );

        expect(session.questions.length).toBeGreaterThanOrEqual(10);

        // ZERO questions should contain Katakana Loanword Trap
        for (const q of session.questions) {
          expect(q.mode).toBe("orthography");
          for (const opt of q.options) {
            expect(opt.trapRule).not.toBe("Katakana Loanword Trap");
          }
          // Wrong options should be Look-Alike Kanji Traps
          const wrongOpts = q.options.filter((o) => !o.isCorrect);
          expect(
            wrongOpts.every((o) => o.trapRule === "Look-Alike Kanji Trap"),
          ).toBe(true);
        }
      }

      // 2. Check full N4–N1 pool combined in orthography mode
      const combinedSession = createPhoneticTrapSession(
        PHONETIC_TRAP_ITEMS,
        {
          subMode: "orthography",
          levels: ["N4", "N3", "N2", "N1"],
          size: 30,
          showEnglishHint: true,
        },
        () => 0.42,
      );

      expect(combinedSession.questions.length).toBe(30);

      // No Katakana loanword traps across any question
      const allOptions = combinedSession.questions.flatMap((q) => q.options);
      expect(
        allOptions.some((o) => o.trapRule === "Katakana Loanword Trap"),
      ).toBe(false);

      // Retains conjugated verb/adjective traps (e.g. okurigana preserved)
      const conjugatedQuestions = combinedSession.questions.filter((q) =>
        /[ぁ-ん]/.test(q.word),
      );
      expect(conjugatedQuestions.length).toBeGreaterThan(0);
      for (const cq of conjugatedQuestions) {
        // Okurigana ending (e.g. める in 集める, しい in 厳しい/忙しい) should be present
        const okuriganaMatch = cq.word.match(/[ぁ-ん]+$/);
        if (okuriganaMatch) {
          const ending = okuriganaMatch[0];
          for (const opt of cq.options) {
            expect(opt.text.endsWith(ending)).toBe(true);
          }
        }
      }

      // 3. Check N4–N1 combined in mixed mode
      const mixedSession = createPhoneticTrapSession(
        PHONETIC_TRAP_ITEMS,
        {
          subMode: "mixed",
          levels: ["N4", "N3", "N2", "N1"],
          size: 20,
          showEnglishHint: true,
        },
        () => 0.12,
      );

      const mixedOptions = mixedSession.questions.flatMap((q) => q.options);
      expect(
        mixedOptions.some((o) => o.trapRule === "Katakana Loanword Trap"),
      ).toBe(false);
    });

    it("allows Katakana loanword orthography traps in mixed-level selection when N5 is included", () => {
      // Mixed session including N5 and N4
      const mixedN5N4 = createPhoneticTrapSession(
        PHONETIC_TRAP_ITEMS,
        {
          subMode: "orthography",
          levels: ["N5", "N4"],
          size: 30,
          showEnglishHint: true,
        },
        () => 0.25,
      );

      // N5 katakana items can be drawn and generate Katakana Loanword Traps
      const hasKatakanaTraps = mixedN5N4.questions.some((q) =>
        q.options.some((o) => o.trapRule === "Katakana Loanword Trap"),
      );
      expect(hasKatakanaTraps).toBe(true);

      // And N4 kanji/conjugated verb items also generate Look-Alike Kanji Traps
      const hasKanjiTraps = mixedN5N4.questions.some((q) =>
        q.options.some((o) => o.trapRule === "Look-Alike Kanji Trap"),
      );
      expect(hasKanjiTraps).toBe(true);
    });
  });
});
