import { describe, it, expect } from "vitest";
import {
  computeCharacterDiff,
  findClosestAnswer,
  getCharacterDiff,
} from "./characterDiff";

describe("characterDiff utility", () => {
  it("identifies matching text without mistake", () => {
    const res = computeCharacterDiff("たけしさん", "たけしさん");
    expect(res.hasMistake).toBe(false);
    expect(res.userParts).toEqual([{ type: "equal", text: "たけしさん" }]);
    expect(res.expectedParts).toEqual([{ type: "equal", text: "たけしさん" }]);
    expect(res.missedSummary).toHaveLength(0);
  });

  it("detects incorrect particle or character replacement", () => {
    const res = computeCharacterDiff("わたしが", "わたしは");
    expect(res.hasMistake).toBe(true);
    expect(res.userParts).toEqual([
      { type: "equal", text: "わたし" },
      { type: "wrong", text: "が" },
    ]);
    expect(res.expectedParts).toEqual([
      { type: "equal", text: "わたし" },
      { type: "missing", text: "は" },
    ]);
    expect(res.missedSummary).toEqual([{ user: "が", expected: "は" }]);
  });

  it("detects missed conjugation endings", () => {
    const res = computeCharacterDiff("たべました", "たべてください");
    expect(res.hasMistake).toBe(true);
    expect(res.userParts[0]).toEqual({ type: "equal", text: "たべ" });
    expect(res.userParts[1]).toEqual({ type: "wrong", text: "ました" });
    expect(res.expectedParts[0]).toEqual({ type: "equal", text: "たべ" });
    expect(res.expectedParts[1]).toEqual({ type: "missing", text: "てください" });
  });

  it("handles missing characters (insertions)", () => {
    const res = computeCharacterDiff("にほんじん", "にほんじんです");
    expect(res.hasMistake).toBe(true);
    expect(res.expectedParts).toEqual([
      { type: "equal", text: "にほんじん" },
      { type: "missing", text: "です" },
    ]);
  });

  it("finds the closest answer when multiple alternatives exist", () => {
    const fullAnswer = "たけしさんは にほんじんです。／たけしさんはにほんじんです。";
    const closest = findClosestAnswer("たけしさんはにほんじんでした。", fullAnswer);
    expect(closest).toBe("たけしさんはにほんじんです。");
  });

  it("getCharacterDiff returns both the closest answer and the computed diff", () => {
    const full = "これ／それ";
    const res = getCharacterDiff("これ", full);
    expect(res.closestAnswer).toBe("これ");
    expect(res.diff.hasMistake).toBe(false);
  });
});
