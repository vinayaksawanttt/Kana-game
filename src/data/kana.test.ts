import { describe, expect, it } from "vitest";
import { countCharacters, getCharacters, kanaCharacters, rowMetadata } from "./kana";

describe("kana dataset integrity", () => {
  it("has unique character ids", () => {
    const ids = kanaCharacters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ensures every kana character has at least one non-empty romaji", () => {
    for (const char of kanaCharacters) {
      expect(char.romaji.length).toBeGreaterThan(0);
      expect(char.romaji.every((r) => typeof r === "string" && r.trim().length > 0)).toBe(true);
    }
  });

  it("has unique row metadata keys", () => {
    const keys = rowMetadata.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("filters and counts characters consistently", () => {
    const filter = { script: "hiragana" as const, rowKeys: ["basic:vowel", "basic:k"] };
    const matched = getCharacters(filter);
    expect(matched).toHaveLength(10);
    expect(countCharacters(filter)).toBe(10);
  });
});
