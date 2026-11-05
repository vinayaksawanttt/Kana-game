import { describe, expect, it } from "vitest";
import { getAllHomophoneGroups, getHomophoneGroupForKanji } from "../homophones";

describe("Homophone Nuance Engine", () => {
  it("finds homophone group for 見, 観, and 診 with clear distinctions", () => {
    const groupForMiru = getHomophoneGroupForKanji("見");
    expect(groupForMiru).toBeDefined();
    expect(groupForMiru?.reading).toBe("みる");
    expect(groupForMiru?.title).toBe("見る vs 観る vs 診る");

    const kanjiList = groupForMiru?.members.map((m) => m.kanji);
    expect(kanjiList).toEqual(["見", "観", "診"]);

    const kanjiMed = groupForMiru?.members.find((m) => m.kanji === "診");
    expect(kanjiMed?.nuance).toContain("medically");
  });

  it("finds homophone group for 早い vs 速い", () => {
    const groupForHayai = getHomophoneGroupForKanji("速");
    expect(groupForHayai).toBeDefined();
    expect(groupForHayai?.reading).toBe("はやい");

    const fastMember = groupForHayai?.members.find((m) => m.kanji === "速");
    const earlyMember = groupForHayai?.members.find((m) => m.kanji === "早");

    expect(fastMember?.nuance).toContain("speed");
    expect(earlyMember?.nuance).toContain("time");
  });

  it("returns undefined for a kanji not in homophone database", () => {
    expect(getHomophoneGroupForKanji("木")).toBeUndefined();
    expect(getHomophoneGroupForKanji("")).toBeUndefined();
  });

  it("returns all registered homophone groups", () => {
    const all = getAllHomophoneGroups();
    expect(all.length).toBeGreaterThanOrEqual(10);
  });
});

