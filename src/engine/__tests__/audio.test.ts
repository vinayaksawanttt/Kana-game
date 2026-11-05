import { describe, expect, it } from "vitest";
import {
  isExtendedKatakana,
  katakanaToHiragana,
  resolveKanaAudio,
  toKanaAudioKey,
  toTtsText,
  getUniqueKanaSounds,
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
});

