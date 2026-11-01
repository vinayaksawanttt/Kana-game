import { describe, expect, it } from "vitest";
import { loadDictionaryDataMaps } from "@/data/dictionary";
import {
  analyzeJapanese,
  detectInputLanguage,
  extractKanjiFromText,
  katakanaToHiragana,
  searchEnglishKeyword,
} from "./analyzer";

describe("analyzer engine", () => {
  it("detects Japanese vs English input accurately", () => {
    expect(detectInputLanguage("わたしは毎日勉強します")).toBe("japanese");
    expect(detectInputLanguage("浅い")).toBe("japanese");
    expect(detectInputLanguage("カタカナ")).toBe("japanese");
    expect(detectInputLanguage("shallow")).toBe("english");
    expect(detectInputLanguage("to eat")).toBe("english");
  });

  it("converts katakana readings to hiragana for ruby tags", () => {
    expect(katakanaToHiragana("タベル")).toBe("たべる");
    expect(katakanaToHiragana("ベンキョウ")).toBe("べんきょう");
  });

  it("extracts unique kanji mapped to JLPT/Grade data", async () => {
    const dataMaps = await loadDictionaryDataMaps();
    const extracted = extractKanjiFromText("日本の山と川は美しい、日本の山", dataMaps);
    const chars = extracted.map((k) => k.c);
    expect(chars).toContain("日");
    expect(chars).toContain("本");
    expect(chars).toContain("山");
    expect(chars).toContain("川");
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("analyzes a Japanese sentence via Kuromoji into morphological tokens and kanji", async () => {
    const dataMaps = await loadDictionaryDataMaps();
    const result = await analyzeJapanese("この川は非常に浅いです。", dataMaps);

    expect(result.type).toBe("japanese");
    expect(result.tokens.length).toBeGreaterThan(3);

    const kawaToken = result.tokens.find((t) => t.surface === "川");
    expect(kawaToken).toBeDefined();
    expect(kawaToken?.reading).toBe("かわ");

    const asaiToken = result.tokens.find((t) => t.baseForm === "浅い" || t.surface === "浅い");
    expect(asaiToken).toBeDefined();
    expect(asaiToken?.reading).toBe("あさい");

    expect(result.kanji.map((k) => k.c)).toContain("川");
    expect(result.kanji.map((k) => k.c)).toContain("浅");
  });

  it("performs reverse lookup for English keywords and returns matching kanji, vocab, and up to 3 demo sentences", async () => {
    const dataMaps = await loadDictionaryDataMaps();
    const result = searchEnglishKeyword("shallow", dataMaps);

    expect(result.type).toBe("english");
    expect(result.vocab.some((v) => v.word === "浅い")).toBe(true);
    expect(result.kanji.some((k) => k.c === "浅")).toBe(true);
    expect(result.sentences.length).toBeGreaterThanOrEqual(1);
    expect(result.sentences.length).toBeLessThanOrEqual(3);
    expect(result.sentences[0]?.en.toLowerCase()).toContain("shallow");
  });
});

