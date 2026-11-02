import { describe, expect, it } from "vitest";
import { normalizeGrammarPoint, type GrammarPoint } from "./grammar";

describe("normalizeGrammarPoint", () => {
  it("adapts a legacy cached grammar record to the current lesson schema", () => {
    const legacyPoint = {
      id: "N5/a-ga-ichiban",
      slug: "a-ga-ichiban",
      level: "N5",
      title: "A が いちばん～",
      pattern: "A が いちばん～",
      romaji: "A ga ichiban",
      meaning: "the most",
      short: "the most",
      long: "Used to express the superlative degree.",
      formation: "Noun + が + いちばん + adjective",
      examples: [],
    } as unknown as GrammarPoint;

    const normalized = normalizeGrammarPoint(legacyPoint);

    expect(normalized.formation).toEqual(["Noun + が + いちばん + adjective"]);
    expect(normalized.explanation).toBe("Used to express the superlative degree.");
    expect(normalized.examples).toEqual([]);
  });
});
