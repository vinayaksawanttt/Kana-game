import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearKanjiCache,
  countsByLevel,
  countsByLevelGrade,
  getKanjiByLevel,
  getKanjiIndex,
  getKanjiPool,
} from "./kanji";

describe("kanji per-level data loader", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearKanjiCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearKanjiCache();
  });

  it("loads per-level kanji sets and index metadata", async () => {
    const n5 = await getKanjiByLevel("N5");
    expect(n5).toHaveLength(79);
    expect(n5.every((record) => record.jlpt === 5)).toBe(true);

    const index = await getKanjiIndex();
    expect(index.version).toBe("v1");
    expect(index.total).toBe(2208);
    expect(index.levels).toEqual({
      N5: 79,
      N4: 166,
      N3: 366,
      N2: 366,
      N1: 1231,
    });
  });

  it("fetches on-demand and caches responses per JLPT level in the browser", async () => {
    const mockRecords = [
      {
        c: "日",
        jlpt: 5,
        grade: 1,
        meanings: ["day", "sun"],
        label: "day, sun",
        on: ["ニチ"],
        kun: ["ひ"],
        strokes: 4,
        freq: 1,
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRecords,
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const first = await getKanjiByLevel("N5");
    const second = await getKanjiByLevel("N5");

    expect(first).toEqual(mockRecords);
    expect(second).toEqual(mockRecords);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/v1/kanji/N5.json", {
      cache: "force-cache",
    });
  });

  it("computes pool and counts accurately by level and grade", async () => {
    const pool = await getKanjiPool({ levels: [5], grades: [1] });
    expect(pool).toHaveLength(49);

    const gradeCounts = await countsByLevelGrade([5]);
    expect(gradeCounts[1]).toBe(49);
    expect(gradeCounts[2]).toBe(30);

    const levelCounts = await countsByLevel([1, 2]);
    expect(levelCounts[5]).toBe(79);
  });

  it("validates kanji record schema on loaded N5 records", async () => {
    const n5 = await getKanjiByLevel("N5");
    expect(n5.length).toBeGreaterThan(0);
    const seenChars = new Set<string>();
    for (const record of n5) {
      expect(typeof record.c).toBe("string");
      expect(record.c.length).toBe(1);
      expect(seenChars.has(record.c)).toBe(false);
      seenChars.add(record.c);
      expect(record.jlpt).toBe(5);
      expect(typeof record.grade).toBe("number");
      expect(Array.isArray(record.meanings)).toBe(true);
      expect(record.meanings.length).toBeGreaterThan(0);
      expect(typeof record.label).toBe("string");
      expect(Array.isArray(record.on)).toBe(true);
      expect(Array.isArray(record.kun)).toBe(true);
      expect(typeof record.strokes).toBe("number");
      expect(record.strokes).toBeGreaterThan(0);
    }
  });
});

