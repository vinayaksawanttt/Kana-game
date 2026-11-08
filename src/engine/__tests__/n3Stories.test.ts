import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllStories, getStoriesByLevel, getStoryBySlug } from "@/data/stories";
import { buildStoryAudioQueue } from "@/engine/audio";

describe("JLPT N3 Graded Stories Dataset Integrity", () => {
  const allStories = getAllStories();
  const n3Stories = getStoriesByLevel("N3");

  it("contains exactly 20 N3 stories (10 Anime Legends, 10 Everyday Events)", () => {
    expect(n3Stories.length).toBe(20);

    const animeStories = n3Stories.filter((s) => s.category === "Anime & Pop Culture");
    const everydayStories = n3Stories.filter((s) => s.category === "Everyday Life");

    expect(animeStories.length).toBe(10);
    expect(everydayStories.length).toBe(10);

    const expectedAnimeSlugs = [
      "attack-on-titan",
      "bleach",
      "one-piece",
      "naruto",
      "demon-slayer",
      "death-note",
      "dragon-ball",
      "fullmetal-alchemist",
      "my-hero-academia",
      "jujutsu-kaisen",
    ];

    const expectedEverydaySlugs = [
      "hospital",
      "post-office",
      "hotel-check-in",
      "job-interview",
      "convenience-store-part-time",
      "lost-property",
      "apartment-hunting",
      "train-delay",
      "birthday-party",
      "office-meeting",
    ];

    expect(animeStories.map((s) => s.slug).sort()).toEqual(expectedAnimeSlugs.sort());
    expect(everydayStories.map((s) => s.slug).sort()).toEqual(expectedEverydaySlugs.sort());
  });

  it("strictly enforces >= 18 sentences and >= 600 Japanese characters / 300+ words on EVERY N3 story", () => {
    for (const story of n3Stories) {
      expect(story.id).toBeTruthy();
      expect(story.title).toBeTruthy();
      expect(story.titleEn).toBeTruthy();
      expect(story.level).toBe("N3");
      expect(story.paragraphs.length).toBeGreaterThanOrEqual(4);

      const totalSentences = story.paragraphs.reduce(
        (sum, p) => sum + (p.sentences?.length ?? 0),
        0
      );
      const totalJaChars = story.paragraphs.reduce((sum, p) => sum + p.ja.length, 0);
      const totalTokens = story.paragraphs.reduce(
        (sum, p) =>
          sum + (p.sentences?.reduce((sSum, s) => sSum + (s.tokens?.length ?? 0), 0) ?? 0),
        0
      );

      expect(
        totalSentences,
        `Story ${story.slug} must have >= 18 sentences (actual: ${totalSentences})`
      ).toBeGreaterThanOrEqual(18);

      expect(
        totalJaChars,
        `Story ${story.slug} must have >= 600 Japanese characters (actual: ${totalJaChars})`
      ).toBeGreaterThanOrEqual(600);

      expect(
        totalTokens,
        `Story ${story.slug} must have >= 300 words/tokens (actual: ${totalTokens})`
      ).toBeGreaterThanOrEqual(300);

      // Verify each sentence has non-empty ja and naturalEn
      for (const p of story.paragraphs) {
        expect(p.ja.trim().length).toBeGreaterThan(0);
        expect(p.en.trim().length).toBeGreaterThan(0);
        expect(p.sentences?.length).toBeGreaterThan(0);

        for (const sentence of p.sentences ?? []) {
          expect(sentence.ja.trim().length).toBeGreaterThan(0);
          expect(sentence.naturalEn.trim().length).toBeGreaterThan(0);
          expect(sentence.tokens?.length).toBeGreaterThan(0);
        }
      }

      // Verify quiz structure (3-4 questions with 4 options each)
      expect(story.quiz.length).toBeGreaterThanOrEqual(3);
      for (const q of story.quiz) {
        expect(q.question.trim().length).toBeGreaterThan(0);
        expect(q.questionEn?.trim().length).toBeGreaterThan(0);
        expect(q.options.length).toBe(4);
        expect(q.optionsEn?.length).toBe(4);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(4);
        expect(q.explanation?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("generates valid audio queue segments via buildStoryAudioQueue and verifies mp3 clips exist on disk", () => {
    for (const story of n3Stories) {
      const queue = buildStoryAudioQueue(story);
      expect(
        queue.length,
        `Story ${story.slug} should produce at least 18 audio segments`
      ).toBeGreaterThanOrEqual(18);

      for (const segment of queue) {
        expect(segment.id).toMatch(new RegExp(`^${story.slug}:`));
        expect(segment.rawJa.trim().length).toBeGreaterThan(0);
        expect(segment.ttsText.trim().length).toBeGreaterThan(0);
        expect(segment.src).toContain(`/audio/stories/`);

        const audioDiskPath = path.join(process.cwd(), "public", segment.src);
        expect(
          fs.existsSync(audioDiskPath),
          `Audio file must exist at ${audioDiskPath}`
        ).toBe(true);
        expect(fs.statSync(audioDiskPath).size).toBeGreaterThan(0);
      }
    }
  });

  it("verifies cover images and placeholder SVGs exist on disk for all 20 N3 stories", () => {
    for (const story of n3Stories) {
      const placeholderPath = path.join(process.cwd(), "public", story.coverPlaceholder);
      expect(
        fs.existsSync(placeholderPath),
        `Placeholder SVG must exist at ${story.coverPlaceholder}`
      ).toBe(true);

      const imagePath = path.join(process.cwd(), "public", story.coverImage);
      expect(
        fs.existsSync(imagePath),
        `Cover image must exist at ${story.coverImage}`
      ).toBe(true);
      expect(fs.statSync(imagePath).size).toBeGreaterThan(0);
    }
  });

  it("allows retrieval by slug and level via getStoryBySlug", () => {
    const aot = getStoryBySlug("N3", "attack-on-titan");
    expect(aot).toBeDefined();
    expect(aot?.title).toContain("進撃の巨人");
    expect(aot?.category).toBe("Anime & Pop Culture");

    const hospital = getStoryBySlug("N3", "hospital");
    expect(hospital).toBeDefined();
    expect(hospital?.title).toContain("病院での診察");
    expect(hospital?.category).toBe("Everyday Life");
  });
});
