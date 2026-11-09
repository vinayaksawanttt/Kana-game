import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  WORD_USAGE_ITEMS,
  WORD_USAGE_N4_ITEMS,
  WORD_USAGE_N3_ITEMS,
  WORD_USAGE_N2_ITEMS,
  WORD_USAGE_N1_ITEMS,
  getWordUsageCountsByLevel,
  validateWordUsageItem,
  loadWordUsageData,
} from "../wordUsageData";
import n4VocabSource from "../../../../public/data/v1/vocabulary/N4.json";
import n3VocabSource from "../../../../public/data/v1/vocabulary/N3.json";
import n2VocabSource from "../../../../public/data/v1/vocabulary/N2.json";
import n1VocabSource from "../../../../public/data/v1/vocabulary/N1.json";

describe("Word Usage Data Contract & Curated Items (語彙・用法 — Mondai 5)", () => {
  it("contains 45 curated N4 items, 20 N3 items, 20 N2 items, and 15 N1 items (100 total)", () => {
    expect(WORD_USAGE_N4_ITEMS).toHaveLength(45);
    expect(WORD_USAGE_N3_ITEMS).toHaveLength(20);
    expect(WORD_USAGE_N2_ITEMS).toHaveLength(20);
    expect(WORD_USAGE_N1_ITEMS).toHaveLength(15);
    expect(WORD_USAGE_ITEMS).toHaveLength(100);

    const counts = getWordUsageCountsByLevel();
    expect(counts.N4).toBe(45);
    expect(counts.N3).toBe(20);
    expect(counts.N2).toBe(20);
    expect(counts.N1).toBe(15);
    expect(counts.N5).toBe(0);
  });

  it("all IDs and target words are unique across all 100 items", () => {
    const seenIds = new Set<string>();
    const seenWords = new Set<string>();

    for (const item of WORD_USAGE_ITEMS) {
      expect(
        seenIds.has(item.id),
        `Duplicate item ID found: ${item.id}`,
      ).toBe(false);
      seenIds.add(item.id);

      expect(
        seenWords.has(item.word),
        `Duplicate item word found: ${item.word}`,
      ).toBe(false);
      seenWords.add(item.word);
    }
  });

  it("every N4 item passes schema and semantic validation", () => {
    for (const item of WORD_USAGE_N4_ITEMS) {
      const errors = validateWordUsageItem(item);
      expect(errors).toEqual([]);

      expect(item.level).toBe("N4");
      expect(item.jlpt).toBe(4);
      expect(item.reading.length).toBeGreaterThan(0);
      expect(item.meanings.length).toBeGreaterThan(0);
      expect(item.options).toHaveLength(4);

      const correctOpts = item.options.filter((o) => o.isCorrect);
      expect(correctOpts).toHaveLength(1);
      expect(item.options[item.correctOptionIndex].isCorrect).toBe(true);

      for (const opt of item.options) {
        expect(opt.sentenceJa.length).toBeGreaterThan(5);
        expect(opt.sentenceEn.length).toBeGreaterThan(5);
        expect(opt.explanation.length).toBeGreaterThan(10);
        if (!opt.isCorrect) {
          expect(opt.explanation).toMatch(/Unnatural|Use/i);
        }
      }
    }
  });

  it("every N3 item passes schema and semantic validation", () => {
    for (const item of WORD_USAGE_N3_ITEMS) {
      const errors = validateWordUsageItem(item);
      expect(errors).toEqual([]);

      expect(item.level).toBe("N3");
      expect(item.jlpt).toBe(3);
      expect(item.reading.length).toBeGreaterThan(0);
      expect(item.meanings.length).toBeGreaterThan(0);
      expect(item.options).toHaveLength(4);

      const correctOpts = item.options.filter((o) => o.isCorrect);
      expect(correctOpts).toHaveLength(1);
      expect(item.options[item.correctOptionIndex].isCorrect).toBe(true);

      for (const opt of item.options) {
        expect(opt.sentenceJa.length).toBeGreaterThan(5);
        expect(opt.sentenceEn.length).toBeGreaterThan(5);
        expect(opt.explanation.length).toBeGreaterThan(10);
        if (!opt.isCorrect) {
          expect(opt.explanation).toMatch(/Unnatural|Use/i);
        }
      }
    }
  });

  it("every N2 item passes schema and semantic validation", () => {
    for (const item of WORD_USAGE_N2_ITEMS) {
      const errors = validateWordUsageItem(item);
      expect(errors).toEqual([]);

      expect(item.level).toBe("N2");
      expect(item.jlpt).toBe(2);
      expect(item.reading.length).toBeGreaterThan(0);
      expect(item.meanings.length).toBeGreaterThan(0);
      expect(item.options).toHaveLength(4);

      const correctOpts = item.options.filter((o) => o.isCorrect);
      expect(correctOpts).toHaveLength(1);
      expect(item.options[item.correctOptionIndex].isCorrect).toBe(true);

      for (const opt of item.options) {
        expect(opt.sentenceJa.length).toBeGreaterThan(5);
        expect(opt.sentenceEn.length).toBeGreaterThan(5);
        expect(opt.explanation.length).toBeGreaterThan(10);
        if (!opt.isCorrect) {
          expect(opt.explanation).toMatch(/Unnatural|Use/i);
        }
      }
    }
  });

  it("every N1 item passes schema and semantic validation", () => {
    for (const item of WORD_USAGE_N1_ITEMS) {
      const errors = validateWordUsageItem(item);
      expect(errors).toEqual([]);

      expect(item.level).toBe("N1");
      expect(item.jlpt).toBe(1);
      expect(item.reading.length).toBeGreaterThan(0);
      expect(item.meanings.length).toBeGreaterThan(0);
      expect(item.options).toHaveLength(4);

      const correctOpts = item.options.filter((o) => o.isCorrect);
      expect(correctOpts).toHaveLength(1);
      expect(item.options[item.correctOptionIndex].isCorrect).toBe(true);

      for (const opt of item.options) {
        expect(opt.sentenceJa.length).toBeGreaterThan(5);
        expect(opt.sentenceEn.length).toBeGreaterThan(5);
        expect(opt.explanation.length).toBeGreaterThan(10);
        if (!opt.isCorrect) {
          expect(opt.explanation).toMatch(/Unnatural|Use/i);
        }
      }
    }
  });

  it("all 100 items have balanced correct answers across all 4 option positions", () => {
    const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const item of WORD_USAGE_ITEMS) {
      distribution[item.correctOptionIndex] =
        (distribution[item.correctOptionIndex] ?? 0) + 1;
    }

    // Out of 100 items, each position should be ~25 (between 23 and 27)
    for (let i = 0; i < 4; i++) {
      expect(distribution[i]).toBeGreaterThanOrEqual(23);
      expect(distribution[i]).toBeLessThanOrEqual(27);
    }
  });

  it("all 15 N1 target words correlate with the enriched N1 vocabulary dataset", () => {
    const enrichedN1WordSet = new Set<string>();
    for (const v of n1VocabSource) {
      enrichedN1WordSet.add(v.word);
      enrichedN1WordSet.add(v.reading);
      if (v.word.endsWith("する")) {
        enrichedN1WordSet.add(v.word.replace(/する$/, ""));
      }
    }

    for (const item of WORD_USAGE_N1_ITEMS) {
      const match =
        enrichedN1WordSet.has(item.word) ||
        enrichedN1WordSet.has(item.reading) ||
        enrichedN1WordSet.has(`${item.word}する`);

      expect(
        match,
        `N1 Word ${item.word} (${item.reading}) should exist in enriched N1 vocabulary`,
      ).toBe(true);
    }
  });

  it("typed loader loadWordUsageData loads all 100 items", async () => {
    const loaded = await loadWordUsageData();
    expect(loaded).toHaveLength(100);
    expect(loaded[0].id).toBe(WORD_USAGE_ITEMS[0].id);
  });

  it("public/data/v1/jlpt/word-usage.json exists and contains exactly 100 valid items", () => {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "v1",
      "jlpt",
      "word-usage.json",
    );
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    const jsonItems = JSON.parse(content);
    expect(Array.isArray(jsonItems)).toBe(true);
    expect(jsonItems).toHaveLength(100);

    const counts = { N4: 0, N3: 0, N2: 0, N1: 0 };
    for (const item of jsonItems) {
      counts[item.level as keyof typeof counts]++;
      expect(item.options).toHaveLength(4);
      expect([0, 1, 2, 3]).toContain(item.correctOptionIndex);
      expect(item.options[item.correctOptionIndex].isCorrect).toBe(true);
    }

    expect(counts).toEqual({ N4: 45, N3: 20, N2: 20, N1: 15 });
  });
});
