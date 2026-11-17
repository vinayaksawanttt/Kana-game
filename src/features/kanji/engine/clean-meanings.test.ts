import { describe, expect, it } from "vitest";
import { cleanMeanings } from "./clean-meanings";

describe("cleanMeanings", () => {
  it("cleans real KANJIDIC records and prioritizes Heisig meanings", () => {
    const sampleRecords: Record<string, { meanings: string[]; heisig_en: string | null }> = {
      万: { meanings: ["ten thousand", "10,000"], heisig_en: "ten thousand" },
      乳: { meanings: ["milk", "breasts"], heisig_en: "milk" },
      京: { meanings: ["capital", "10**16"], heisig_en: "capital" },
      一: { meanings: ["one", "one radical (no.1)"], heisig_en: "one" },
      匁: { meanings: ["monme", "3.75 grams", "(kokuji)"], heisig_en: "monme" },
      乙: { meanings: ["the latter", "duplicate", "strange", "witty", "fishhook radical (no. 5)"], heisig_en: null },
    };
    const clean = (character: string) => cleanMeanings(sampleRecords[character].meanings, sampleRecords[character].heisig_en);

    expect(clean("万")[0]).toBe("ten thousand");
    expect(clean("乳")[0]).toBe("milk");
    expect(clean("京")).not.toContain("10**16");
    expect(clean("一")).not.toContain("one radical (no.1)");
    expect(clean("匁")).toEqual(["monme"]);
    expect(clean("乙").join(" ").toLowerCase()).not.toContain("radical");
  });

  it("deduplicates case-insensitively and removes listed noise", () => {
    expect(cleanMeanings([
      " Meaning ", "meaning", "counter for days", "fishhook radical (no. 5)",
      "4th calendar sign", "(kokuji)", "10**16", "un-", "Esq.", "",
    ], null)).toEqual(["Meaning"]);
  });
});
