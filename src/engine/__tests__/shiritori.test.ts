import { describe, expect, it } from "vitest";
import {
  buildShiritoriDictionary,
  chooseBotWord,
  createShiritoriState,
  extractEndKana,
  getKanaAliases,
  romajiToHiragana,
  validateTurn,
  type ShiritoriSettings,
  type ShiritoriWord,
} from "../shiritori";

const word = (id: string, kana: string, endKana = extractEndKana(kana), jlpt: ShiritoriWord["jlpt"] = 5): ShiritoriWord => ({
  id,
  word: kana,
  kana,
  romaji: "",
  meaning: id,
  jlpt,
  startKana: kana.startsWith("しゃ") ? "しゃ" : kana[0],
  endKana,
});

const settings = (difficulty: ShiritoriSettings["difficulty"] = "futsuu"): ShiritoriSettings => ({
  mode: "survival",
  difficulty,
  turnSeconds: 0,
  sound: false,
  allowUnverified: false,
});

describe("Shiritori engine", () => {
  it("converts romaji, aliases, geminates, and submitted n", () => {
    expect(romajiToHiragana("ringo")).toBe("りんご");
    expect(romajiToHiragana("kikai")).toBe("きかい");
    expect(["shi", "si", "tsu", "tu", "ja", "zya"].map((value) => romajiToHiragana(value)))
      .toEqual(["し", "し", "つ", "つ", "じゃ", "じゃ"]);
    expect(romajiToHiragana("kk")).toBe("っk");
    expect(romajiToHiragana("nn")).toBe("ん");
    expect(romajiToHiragana("n'")).toBe("ん");
    expect(romajiToHiragana("n")).toBe("n");
    expect(romajiToHiragana("n", true)).toBe("ん");
  });

  it("extracts effective end kana for long marks, compound small kana, and n", () => {
    expect(extractEndKana("ミキサー")).toBe("さ");
    expect(extractEndKana("でんしゃ")).toBe("しゃ");
    expect(getKanaAliases("しゃ")).toEqual(["しゃ", "や"]);
    expect(extractEndKana("みかん")).toBe("ん");
  });

  it("rejects duplicates and wrong starts, and supports small-kana flexibility", () => {
    const opening = word("start", "でんしゃ");
    const valid = word("valid", "やさい");
    const dictionary = buildShiritoriDictionary([opening, valid]);
    const state = createShiritoriState(settings(), opening);
    expect(validateTurn("やさい", state, dictionary)).toMatchObject({ valid: true });
    expect(validateTurn("でんしゃ", state, dictionary)).toMatchObject({ valid: false, error: "Already used" });
    expect(validateTurn("りんご", state, dictionary)).toMatchObject({ valid: false, error: "Not in dictionary" });
    const wrong = buildShiritoriDictionary([opening, word("wrong", "りんご")]);
    expect(validateTurn("りんご", state, wrong)).toMatchObject({ valid: false, error: "Must start with 「しゃ」" });
  });

  it("ends on n in standard play and forgives it in yasashii", () => {
    const opening = word("start", "あめ");
    const ending = word("ending", "めん", "ん");
    const dictionary = buildShiritoriDictionary([opening, ending]);
    const standard = createShiritoriState(settings(), opening);
    expect(validateTurn("めん", standard, dictionary)).toMatchObject({ valid: false, loseByN: true, state: { status: "lost" } });
    const gentle = createShiritoriState(settings("yasashii"), opening);
    const gentleResult = validateTurn("めん", gentle, dictionary);
    expect(gentleResult).toMatchObject({ valid: false, state: { status: "playing" } });
    expect(gentleResult).not.toHaveProperty("loseByN");
  });

  it("starts friend mode with player two and can mark configured unverified words", () => {
    const opening = word("start", "りんご");
    const state = createShiritoriState({ ...settings(), mode: "friend", allowUnverified: true }, opening);
    expect(state.currentPlayer).toBe("player2");
    const result = validateTurn("ごまあぶら", state, buildShiritoriDictionary([opening]));
    expect(result).toMatchObject({ valid: true, word: { id: "unverified:ごまあぶら", meaning: "Unverified word" } });
  });

  it("keeps easy bot turns open and lets oni choose the tighter chain", () => {
    const opening = word("start", "いちご");
    const safeReply = word("safe", "ごりら");
    const trapReply = word("trap", "ごま");
    const continuation = word("continue", "らっぱ");
    const dictionary = buildShiritoriDictionary([opening, safeReply, trapReply, continuation]);
    const gentle = createShiritoriState(settings("yasashii"), opening);
    const oni = createShiritoriState({ ...settings("oni") }, opening);
    expect(chooseBotWord(gentle, dictionary)?.id).toBe("safe");
    expect(chooseBotWord(oni, dictionary)?.id).toBe("trap");
  });
});
