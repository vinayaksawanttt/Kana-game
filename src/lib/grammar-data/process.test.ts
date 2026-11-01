import { describe, expect, it } from "vitest";
import { findMatchingGrammarSentences } from "./process";

describe("findMatchingGrammarSentences", () => {
  it("finds examples containing the grammar pattern and returns unique sentences", () => {
    const matches = findMatchingGrammarSentences("～てもいいですか", [
      {
        sentence_original: "ここで写真を撮ってもいいですか。",
        sentence_english: "May I take a picture here?",
      },
      {
        sentence_original: "窓を開けてもいいですか。",
        sentence_english: "May I open the window?",
      },
      {
        sentence_original: "ここで写真を撮ってもいいですか。",
        sentence_english: "May I take a picture here?",
      },
      {
        sentence_original: "写真を撮りました。",
        sentence_english: "I took a picture.",
      },
    ], 2);

    expect(matches.map((sentence) => sentence.sentence_original)).toEqual([
      "ここで写真を撮ってもいいですか。",
      "窓を開けてもいいですか。",
    ]);
  });

  it("does not treat a generic grammar fragment as a match", () => {
    expect(
      findMatchingGrammarSentences("～です", [
        { sentence_original: "今日は休みです。", sentence_english: "Today is a day off." },
      ], 5)
    ).toEqual([]);
  });
});
