import { describe, expect, it } from "vitest";
import {
  isExtendedKatakana,
  katakanaToHiragana,
  resolveKanaAudio,
  toKanaAudioKey,
  toTtsText,
  getUniqueKanaSounds,
  normalizeKanjiReading,
  resolveKanjiReadingAudio,
  buildKanjiReadAllQueue,
  resolveVocabAudio,
  resolveSentenceAudio,
  cleanSentenceForAudio,
  buildStoryAudioQueue,
} from "../audio";

describe("audio engine", () => {
  describe("katakanaToHiragana", () => {
    it("converts standard katakana to hiragana", () => {
      expect(katakanaToHiragana("ア")).toBe("あ");
      expect(katakanaToHiragana("カ")).toBe("か");
      expect(katakanaToHiragana("シャ")).toBe("しゃ");
      expect(katakanaToHiragana("ン")).toBe("ん");
    });

    it("preserves hiragana without changes", () => {
      expect(katakanaToHiragana("あ")).toBe("あ");
      expect(katakanaToHiragana("しゃ")).toBe("しゃ");
      expect(katakanaToHiragana("ん")).toBe("ん");
    });
  });

  describe("isExtendedKatakana", () => {
    it("identifies foreign loanword katakana", () => {
      expect(isExtendedKatakana("ファ")).toBe(true);
      expect(isExtendedKatakana("ティ")).toBe(true);
      expect(isExtendedKatakana("ヴ")).toBe(true);
      expect(isExtendedKatakana("シェ")).toBe(true);
      expect(isExtendedKatakana("ウォ")).toBe(true);
    });

    it("returns false for standard kana", () => {
      expect(isExtendedKatakana("ア")).toBe(false);
      expect(isExtendedKatakana("あ")).toBe(false);
      expect(isExtendedKatakana("シャ")).toBe(false);
      expect(isExtendedKatakana("しゃ")).toBe(false);
    });
  });

  describe("toTtsText", () => {
    it("converts standard Katakana to Hiragana for native TTS clarity", () => {
      expect(toTtsText("ア")).toBe("あ");
      expect(toTtsText("カ")).toBe("か");
      expect(toTtsText("シャ")).toBe("しゃ");
      expect(toTtsText("ン")).toBe("ん");
    });

    it("keeps Hiragana intact", () => {
      expect(toTtsText("あ")).toBe("あ");
      expect(toTtsText("しゃ")).toBe("しゃ");
    });

    it("preserves extended loanword Katakana so TTS pronounces foreign phonemes", () => {
      expect(toTtsText("ファ")).toBe("ファ");
      expect(toTtsText("ティ")).toBe("ティ");
      expect(toTtsText("ヴ")).toBe("ヴ");
      expect(toTtsText("シェ")).toBe("シェ");
      expect(toTtsText("ウォ")).toBe("ウォ");
    });
  });

  describe("toKanaAudioKey & resolveKanaAudio", () => {
    it("maps Hiragana and Katakana equivalents to the exact same audio file path", () => {
      // Basic vowels
      expect(resolveKanaAudio({ char: "あ" })).toEqual({
        slug: "a",
        src: "/audio/kana/a.mp3",
        ttsText: "あ",
        lang: "ja-JP",
      });
      expect(resolveKanaAudio({ char: "ア" })).toEqual({
        slug: "a",
        src: "/audio/kana/a.mp3",
        ttsText: "あ",
        lang: "ja-JP",
      });

      // Yōon combination
      expect(resolveKanaAudio({ char: "しゃ" })).toEqual({
        slug: "sha",
        src: "/audio/kana/sha.mp3",
        ttsText: "しゃ",
        lang: "ja-JP",
      });
      expect(resolveKanaAudio({ char: "シャ" })).toEqual({
        slug: "sha",
        src: "/audio/kana/sha.mp3",
        ttsText: "しゃ",
        lang: "ja-JP",
      });

      // Dakuten with phonetic mergers (Yotsugana)
      expect(resolveKanaAudio({ char: "じ" }).src).toBe("/audio/kana/ji.mp3");
      expect(resolveKanaAudio({ char: "ジ" }).src).toBe("/audio/kana/ji.mp3");
      expect(resolveKanaAudio({ char: "ぢ" }).src).toBe("/audio/kana/ji.mp3");
      expect(resolveKanaAudio({ char: "ヂ" }).src).toBe("/audio/kana/ji.mp3");

      expect(resolveKanaAudio({ char: "ず" }).src).toBe("/audio/kana/zu.mp3");
      expect(resolveKanaAudio({ char: "ズ" }).src).toBe("/audio/kana/zu.mp3");
      expect(resolveKanaAudio({ char: "づ" }).src).toBe("/audio/kana/zu.mp3");
      expect(resolveKanaAudio({ char: "ヅ" }).src).toBe("/audio/kana/zu.mp3");
    });

    it("resolves extended katakana to clean slugs without collisions", () => {
      expect(resolveKanaAudio({ char: "ファ" })).toEqual({
        slug: "fa",
        src: "/audio/kana/fa.mp3",
        ttsText: "ファ",
        lang: "ja-JP",
      });

      expect(resolveKanaAudio({ char: "ティ" })).toEqual({
        slug: "ti",
        src: "/audio/kana/ti.mp3",
        ttsText: "ティ",
        lang: "ja-JP",
      });

      expect(resolveKanaAudio({ char: "ヴ" })).toEqual({
        slug: "vu",
        src: "/audio/kana/vu.mp3",
        ttsText: "ヴ",
        lang: "ja-JP",
      });

      expect(resolveKanaAudio({ char: "シェ" })).toEqual({
        slug: "she",
        src: "/audio/kana/she.mp3",
        ttsText: "シェ",
        lang: "ja-JP",
      });

      // を vs ウォ distinction
      expect(resolveKanaAudio({ char: "を" }).slug).toBe("wo");
      expect(resolveKanaAudio({ char: "ヲ" }).slug).toBe("wo");
      expect(resolveKanaAudio({ char: "ウォ" }).slug).toBe("who");
    });

    it("handles fallback to primaryRomaji when char is custom or unmapped", () => {
      expect(toKanaAudioKey("？", "test")).toBe("test");
    });
  });

  describe("getUniqueKanaSounds", () => {
    it("returns valid sound list without duplicate slugs", () => {
      const sounds = getUniqueKanaSounds();
      expect(sounds.length).toBeGreaterThan(100);

      const slugs = new Set<string>();
      for (const sound of sounds) {
        expect(slugs.has(sound.slug)).toBe(false);
        slugs.add(sound.slug);

        expect(sound.slug).toMatch(/^[a-z0-9_-]+$/);
        expect(sound.ttsText.length).toBeGreaterThan(0);
        expect(sound.sampleChar.length).toBeGreaterThan(0);
      }
    });
  });

  describe("normalizeKanjiReading", () => {
    it("strips okurigana dots and affix hyphens while normalizing katakana on'yomi", () => {
      expect(normalizeKanjiReading("まか.せる")).toBe("まかせる");
      expect(normalizeKanjiReading("-はじ.める")).toBe("はじめる");
      expect(normalizeKanjiReading("お-")).toBe("お");
      expect(normalizeKanjiReading("また.の-")).toBe("またの");
      expect(normalizeKanjiReading("ギョウ")).toBe("ぎょう");
      expect(normalizeKanjiReading("レッキ")).toBe("れっき");
      expect(normalizeKanjiReading("-ず.り")).toBe("ずり");
    });

    it("handles empty and whitespace strings gracefully", () => {
      expect(normalizeKanjiReading("")).toBe("");
      expect(normalizeKanjiReading("   ")).toBe("");
    });
  });

  describe("resolveKanjiReadingAudio", () => {
    it("reuses single-mora kana audio when reading matches a known kana mora", () => {
      const resolved = resolveKanjiReadingAudio("カ");
      expect(resolved).toEqual({
        slug: "ka",
        src: "/audio/kana/ka.mp3",
        ttsText: "か",
        lang: "ja-JP",
        isKanaReuse: true,
      });

      const singleHira = resolveKanjiReadingAudio("お-");
      expect(singleHira.src).toBe("/audio/kana/o.mp3");
      expect(singleHira.isKanaReuse).toBe(true);
    });

    it("resolves multi-mora readings to /audio/readings/${encoded}.mp3", () => {
      const resolved = resolveKanjiReadingAudio("コウ");
      expect(resolved).toEqual({
        slug: "こう",
        src: `/audio/readings/${encodeURIComponent("こう")}.mp3`,
        ttsText: "こう",
        lang: "ja-JP",
        isKanaReuse: false,
      });

      const kunMulti = resolveKanjiReadingAudio("まか.せる");
      expect(kunMulti).toEqual({
        slug: "まかせる",
        src: `/audio/readings/${encodeURIComponent("まかせる")}.mp3`,
        ttsText: "まかせる",
        lang: "ja-JP",
        isKanaReuse: false,
      });
    });
  });

  describe("buildKanjiReadAllQueue", () => {
    it("caps queue at 4 readings (up to 2 On + up to 2 Kun) and deduplicates normalized sounds", () => {
      const kanji = {
        on: ["イチ", "イツ", "ワン"],
        kun: ["ひと-", "ひと.つ", "ひとつ"],
      };

      const queue = buildKanjiReadAllQueue(kanji);
      expect(queue).toEqual(["イチ", "イツ", "ひと-", "ひと.つ"]);
      expect(queue.length).toBe(4);
    });

    it("deduplicates readings that normalize to identical phonetic strings", () => {
      const kanji = {
        on: ["コウ"],
        kun: ["こう", "たか.い"],
      };

      // "こう" kun duplicates "コウ" on (both normalize to "こう")
      const queue = buildKanjiReadAllQueue(kanji);
      expect(queue).toEqual(["コウ", "たか.い"]);
    });

    it("handles missing or empty arrays cleanly", () => {
      expect(buildKanjiReadAllQueue({})).toEqual([]);
      expect(buildKanjiReadAllQueue({ on: ["シン"] })).toEqual(["シン"]);
      expect(buildKanjiReadAllQueue({ kun: ["あたらしい"] })).toEqual(["あたらしい"]);
    });
  });

  describe("resolveVocabAudio", () => {
    it("guarantees ttsText uses normalized phonetic reading rather than guessing kanji readings", () => {
      const vocab = resolveVocabAudio({ word: "大勢", reading: "おおぜい" });
      expect(vocab.ttsText).toBe("おおぜい");
      expect(vocab.lang).toBe("ja-JP");
      expect(vocab.src).toBe(`/audio/vocab/${encodeURIComponent("おおぜい")}.mp3`);
      expect(vocab.key).toBe("おおぜい");
    });

    it("reuses single-mora kana static audio if available", () => {
      const vocab = resolveVocabAudio({ word: "絵", reading: "え" });
      expect(vocab.ttsText).toBe("え");
      expect(vocab.src).toBe("/audio/kana/e.mp3");
    });

    it("normalizes Katakana reading to Hiragana", () => {
      const vocab = resolveVocabAudio({ word: "水", reading: "ミズ" });
      expect(vocab.ttsText).toBe("みず");
      expect(vocab.src).toBe(`/audio/vocab/${encodeURIComponent("みず")}.mp3`);
    });

    it("falls back to word when reading/kana are omitted", () => {
      const vocab = resolveVocabAudio({ word: "ありがとう" });
      expect(vocab.ttsText).toBe("ありがとう");
      expect(vocab.src).toBe(`/audio/vocab/${encodeURIComponent("ありがとう")}.mp3`);
    });
  });

  describe("resolveSentenceAudio & cleanSentenceForAudio", () => {
    it("cleanly strips ruby annotations and bracketed furigana", () => {
      const rawRuby = "<ruby>漢字<rt>かんじ</rt></ruby>";
      expect(cleanSentenceForAudio(rawRuby)).toBe("漢字");

      const rawBracket = "漢字[かんじ]";
      expect(cleanSentenceForAudio(rawBracket)).toBe("漢字");
    });

    it("strips markdown formatting and preserves surrounding text", () => {
      const markdown = "**わたし**は毎日*日本語*を勉強します。";
      expect(cleanSentenceForAudio(markdown)).toBe("わたしは毎日日本語を勉強します。");
    });

    it("resolves full sentence audio payload with appropriate speech rate", () => {
      const sentence = "<ruby>学校<rt>がっこう</rt></ruby>へ**行く**[いく]。";
      const resolved = resolveSentenceAudio(sentence, "sent-1");
      expect(resolved.key).toBe("sent-1");
      expect(resolved.ttsText).toBe("学校へ行く。");
      expect(resolved.lang).toBe("ja-JP");
      expect(resolved.rate).toBe(0.95);
    });
  });

  describe("buildStoryAudioQueue", () => {
    it("flattens story sentences with exact coordinates and furigana-free TTS text", () => {
      const queue = buildStoryAudioQueue({
        slug: "test story",
        paragraphs: [
          {
            sentences: [
              { ja: "<ruby>学校<rt>がっこう</rt></ruby>へ行く。" },
              { ja: "友達[ともだち]と会う。" },
            ],
          },
          { ja: "本を読む。家へ帰る！" },
        ],
      });

      expect(queue).toEqual([
        {
          index: 0,
          paragraphIndex: 0,
          sentenceIndex: 0,
          id: "test story:0:0",
          rawJa: "<ruby>学校<rt>がっこう</rt></ruby>へ行く。",
          ttsText: "学校へ行く。",
          src: "/audio/stories/test%20story/0.mp3",
        },
        {
          index: 1,
          paragraphIndex: 0,
          sentenceIndex: 1,
          id: "test story:0:1",
          rawJa: "友達[ともだち]と会う。",
          ttsText: "友達と会う。",
          src: "/audio/stories/test%20story/1.mp3",
        },
        expect.objectContaining({
          index: 2,
          paragraphIndex: 1,
          sentenceIndex: 0,
          ttsText: "本を読む。",
        }),
        expect.objectContaining({
          index: 3,
          paragraphIndex: 1,
          sentenceIndex: 1,
          ttsText: "家へ帰る！",
        }),
      ]);
    });

    it("returns no segments for empty paragraphs", () => {
      expect(buildStoryAudioQueue({ slug: "empty", paragraphs: [{ ja: "。！？" }] })).toEqual([]);
    });
  });
});
