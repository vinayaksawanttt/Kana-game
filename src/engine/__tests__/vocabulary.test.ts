import { describe, expect, it } from "vitest";
import {
  checkVocabularyAnswer,
  damerauLevenshteinDistance,
} from "../vocabularyMatcher";

describe("vocabulary answer matching", () => {
  const crowdMeanings = ["great number of people", "crowd"];

  it("matches exact glosses and natural equivalent phrasing", () => {
    expect(checkVocabularyAnswer("great number of people", crowdMeanings)).toMatchObject({
      isMatch: true,
      matchType: "exact",
    });
    for (const answer of ["large crowd", "big crowd", "many people"]) {
      expect(checkVocabularyAnswer(answer, crowdMeanings)).toMatchObject({
        isMatch: true,
        matchType: "synonym",
      });
    }
    expect(checkVocabularyAnswer("crowd", crowdMeanings).isMatch).toBe(true);
  });

  it("accepts transposition typos and rejects unrelated meanings", () => {
    expect(checkVocabularyAnswer("graet number of poeple", crowdMeanings)).toMatchObject({
      isMatch: true,
      matchType: "typo",
      matchedGloss: "great number of people",
    });
    expect(checkVocabularyAnswer("small room", crowdMeanings)).toEqual({
      isMatch: false,
      matchType: "none",
    });
    expect(damerauLevenshteinDistance("great", "graet")).toBe(1);
  });

  it("strips infinitives and articles and expands parenthetical glosses", () => {
    expect(checkVocabularyAnswer("to eat", ["eat"]).matchType).toBe("exact");
    expect(checkVocabularyAnswer("a book", ["book"]).matchType).toBe("exact");
    expect(checkVocabularyAnswer("to run", ["to run (fast)"]).isMatch).toBe(true);
    expect(checkVocabularyAnswer("colour", ["color"]).matchType).toBe("exact");
    expect(checkVocabularyAnswer("3", ["three"]).matchType).toBe("exact");
  });
});
