import { describe, expect, it } from "vitest";
import {
  buildShiritoriDictionary,
  chooseBotWord,
  convertRomajiBufferToHiragana,
  createShiritoriState,
  extractEndKana,
  formatShiritoriMeaning,
  getKanaAliases,
  hasEnglishGloss,
  romajiToHiragana,
  useHint,
  validateTurn,
  type ShiritoriSettings,
  type ShiritoriWord,
} from "../shiritori";
import { loadShiritoriData } from "../../data/shiritori";

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

  it("handles live in-place conversion keystroke by keystroke with full variants", () => {
    expect(convertRomajiBufferToHiragana("shya")).toBe("しゃ");
    expect(convertRomajiBufferToHiragana("sha")).toBe("しゃ");
    expect(convertRomajiBufferToHiragana("sya")).toBe("しゃ");
    expect(convertRomajiBufferToHiragana("she")).toBe("しぇ");
    expect(convertRomajiBufferToHiragana("sye")).toBe("しぇ");
    expect(convertRomajiBufferToHiragana("shi")).toBe("し");
    expect(convertRomajiBufferToHiragana("si")).toBe("し");
    expect(convertRomajiBufferToHiragana("rikishi")).toBe("りきし");
    expect(convertRomajiBufferToHiragana("ringo")).toBe("りんご");
    expect(convertRomajiBufferToHiragana("rappa")).toBe("らっぱ");

    // Keystroke progression for rikishi
    expect(convertRomajiBufferToHiragana("r")).toBe("r");
    expect(convertRomajiBufferToHiragana("ri")).toBe("り");
    expect(convertRomajiBufferToHiragana("rik")).toBe("りk");
    expect(convertRomajiBufferToHiragana("riki")).toBe("りき");
    expect(convertRomajiBufferToHiragana("rikis")).toBe("りきs");
    expect(convertRomajiBufferToHiragana("rikish")).toBe("りきsh");
    expect(convertRomajiBufferToHiragana("rikishi")).toBe("りきし");

    // Keystroke progression for ringo (n followed by consonant)
    expect(convertRomajiBufferToHiragana("rin")).toBe("りn");
    expect(convertRomajiBufferToHiragana("ring")).toBe("りんg");
    expect(convertRomajiBufferToHiragana("ringo")).toBe("りんご");

    // Keystroke progression for rappa (geminate consonant)
    expect(convertRomajiBufferToHiragana("rap")).toBe("らp");
    expect(convertRomajiBufferToHiragana("rapp")).toBe("らっp");
    expect(convertRomajiBufferToHiragana("rappa")).toBe("らっぱ");
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
    expect(validateTurn("りんご", state, wrong)).toMatchObject({ valid: false, error: "Must start with 「しゃ」 or 「や」" });
  });

  it("prefers glossed entries on duplicate kana and gives valid-reading fallbacks a safe meaning", () => {
    const opening = word("start", "あめ");
    const untranslated = { ...word("untranslated", "めだか"), word: "目高", meaning: "目高" };
    const translated = { ...word("translated", "めだか"), word: "メダカ", meaning: "killifish" };
    const dictionary = buildShiritoriDictionary([opening, untranslated, translated], {
      めがね: "メガネ",
    });

    expect(dictionary.byKana.get("めだか")?.meaning).toBe("killifish");
    const state = createShiritoriState(settings(), opening);
    const fallbackTurn = validateTurn("めがね", state, dictionary);
    expect(fallbackTurn).toMatchObject({
      valid: true,
      word: { word: "メガネ", kana: "めがね", meaning: "valid noun" },
    });
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

  it("accepts words from extended validReadings and matches rikishi after shiritori", async () => {
    const opening: ShiritoriWord = {
      id: "shiritori-opening",
      word: "しりとり",
      kana: "しりとり",
      romaji: "shiritori",
      meaning: "word-chain game",
      jlpt: 5,
      startKana: "し",
      endKana: "り",
    };

    const dictionary = await loadShiritoriData();
    const state = createShiritoriState(settings(), opening);

    // Player chains "rikishi" after "shiritori" (which ends in "り")
    const result = validateTurn("rikishi", state, dictionary);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.word.kana).toBe("りきし");
      expect(result.word.startKana).toBe("り");
      expect(result.state.nextKana).toBe("し");
    }
  });

  it("prioritizes glossed entries in chooseBotWord and useHint and formats unglossed fallback safely", () => {
    const opening = word("start", "しりとり");
    const unglossed: ShiritoriWord = {
      id: "kuro:りきし",
      word: "枸杞",
      kana: "りきし",
      romaji: "rikishi",
      meaning: "枸杞",
      jlpt: 5,
      startKana: "り",
      endKana: "し",
    };
    const glossed: ShiritoriWord = {
      id: "curated:りんご",
      word: "りんご",
      kana: "りんご",
      romaji: "ringo",
      meaning: "apple",
      jlpt: 4,
      startKana: "り",
      endKana: "ご",
    };

    expect(hasEnglishGloss(unglossed)).toBe(false);
    expect(formatShiritoriMeaning(unglossed)).toBe("valid noun");
    expect(hasEnglishGloss(glossed)).toBe(true);
    expect(formatShiritoriMeaning(glossed)).toBe("apple");

    const dictionary = buildShiritoriDictionary([opening, unglossed, glossed]);
    const state = createShiritoriState(settings("yasashii"), opening);
    expect(chooseBotWord(state, dictionary)?.id).toBe("curated:りんご");
    expect(useHint(state, dictionary).word?.id).toBe("curated:りんご");
  });

  it("provides valid hints matching exact or compound start kana and never shouyu for nyo", async () => {
    const dictionary = await loadShiritoriData();

    // 1. When previous word is 信女 (しんにょ), nextKana is にょ
    const shinnyoWord: ShiritoriWord = {
      id: "shinnyo",
      word: "信女",
      kana: "しんにょ",
      romaji: "shinnyo",
      meaning: "female Buddhist",
      jlpt: 4,
      startKana: "し",
      endKana: "にょ",
    };
    const stateAfterShinnyo = createShiritoriState(settings(), shinnyoWord);
    expect(stateAfterShinnyo.nextKana).toBe("にょ");

    const hintResult = useHint(stateAfterShinnyo, dictionary);
    expect(hintResult.word).toBeDefined();
    const hintWord = hintResult.word!;

    // Hint MUST NOT be しょうゆ (which starts with しょ)
    expect(hintWord.kana).not.toBe("しょうゆ");
    expect(hintWord.kana.startsWith("しょ")).toBe(false);

    // Hint MUST start with either にょ or よ
    const allowed = getKanaAliases(stateAfterShinnyo.nextKana);
    expect(allowed).toEqual(["にょ", "よ"]);
    expect(allowed.some((start) => hintWord.kana.startsWith(start))).toBe(true);

    // Submitting the hinted word must pass validation cleanly
    const validation = validateTurn(hintWord.kana, stateAfterShinnyo, dictionary);
    expect(validation.valid).toBe(true);

    // 2. Decrements hintsRemaining and stops when 0
    expect(hintResult.state.hintsRemaining).toBe(2);
    const zeroState = { ...stateAfterShinnyo, hintsRemaining: 0 };
    expect(useHint(zeroState, dictionary).word).toBeUndefined();
  });
});
