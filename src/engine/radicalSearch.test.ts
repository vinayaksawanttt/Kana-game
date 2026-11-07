import { describe, expect, it } from "vitest";
import type { KanjiRecord } from "@/data/kanji";
import type { RadicalExampleRecord, RadicalIndex, RadicalRecord } from "@/data/radicals";
import {
  getKanjiDetails,
  getKanjiForRadical,
  getKanjiForRadicals,
  getRadicals,
  parseRadicalWikiEntry,
} from "./radicalSearch";

const records: KanjiRecord[] = [
  {
    c: "水",
    jlpt: 5,
    grade: 1,
    meanings: ["water"],
    label: "water",
    on: ["スイ"],
    kun: ["みず"],
    strokes: 4,
    freq: 10,
  },
  {
    c: "氷",
    jlpt: 2,
    grade: 3,
    meanings: ["ice"],
    label: "ice",
    on: ["ヒョウ"],
    kun: ["こおり"],
    strokes: 5,
    freq: null,
  },
];

describe("radical search", () => {
  it("orders the radical chart by available JLPT kanji", () => {
    const radicals: RadicalRecord[] = [
      { character: "水", meaning: "water", reading: "みず", kanjiCount: 1 },
      { character: "一", meaning: "one", reading: "いち", kanjiCount: 3 },
    ];
    expect(getRadicals(radicals).map((radical) => radical.character)).toEqual(["一", "水"]);
  });

  it("filters inverse-index results against both the JLPT pool and selected levels", () => {
    const index: RadicalIndex = { 水: ["水", "氷", "不存在"] };
    expect(getKanjiForRadical("水", index, records, ["N5"] as const).map((item) => item.c)).toEqual([
      "水",
    ]);
    expect(getKanjiForRadical("土", index, records, ["N5", "N2"] as const)).toEqual([]);
  });

  it("returns kanji details with local examples and parses wiki meanings/readings", () => {
    const examples: RadicalExampleRecord[] = [
      { jp: "水を飲みます。", romaji: "Mizu o nomimasu.", en: "I drink water." },
    ];
    expect(getKanjiDetails("水", records, { 水: examples })).toMatchObject({
      c: "水",
      jlpt: 5,
      grade: 1,
      strokes: 4,
      examples,
    });
    expect(getKanjiDetails("未", records, {})).toBeNull();
    expect(parseRadicalWikiEntry("one (いち, ichi, 一)")).toEqual({
      meaning: "one",
      reading: "いち",
    });
  });

  it("intersects multiple radicals to find kanji combinations (e.g. 囗 + 大 = 因)", () => {
    const customRecords: KanjiRecord[] = [
      {
        c: "因",
        jlpt: 3,
        grade: 5,
        meanings: ["cause", "depend on"],
        label: "cause",
        on: ["イン"],
        kun: ["よる"],
        strokes: 6,
        freq: 500,
      },
      {
        c: "大",
        jlpt: 5,
        grade: 1,
        meanings: ["big"],
        label: "big",
        on: ["ダイ"],
        kun: ["おおきい"],
        strokes: 3,
        freq: 10,
      },
      {
        c: "四",
        jlpt: 5,
        grade: 1,
        meanings: ["four"],
        label: "four",
        on: ["シ"],
        kun: ["よん"],
        strokes: 5,
        freq: 20,
      },
    ];
    const index: RadicalIndex = {
      囗: ["因", "四"],
      大: ["因", "大"],
    };
    expect(
      getKanjiForRadicals(["囗", "大"], index, customRecords, ["N3", "N5"]).map(
        (k) => k.c
      )
    ).toEqual(["因"]);
  });
});
