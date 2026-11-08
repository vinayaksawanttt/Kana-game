import fs from "node:fs";
import path from "node:path";
import { ANIME_STORIES } from "./data-n3-anime";
import { EVERYDAY_STORIES } from "./data-n3-everyday";
import { tokenizeJapaneseParagraph, type StoryParagraph } from "../src/data/stories";
import { buildLiteralSentenceGloss } from "./enrich-stories-deepl";

const ROOT = process.cwd();
const N3_DIR = path.join(ROOT, "src/data/content/stories/N3");
const N3_ANIME_DIR = path.join(N3_DIR, "anime");
const PUBLIC_STORIES_DIR = path.join(ROOT, "public/data/v1/stories");

fs.mkdirSync(N3_ANIME_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_STORIES_DIR, { recursive: true });

function processStories(
  stories: typeof ANIME_STORIES,
  targetDir: string,
  isAnime: boolean
) {
  for (const storyDef of stories) {
    const paragraphs: StoryParagraph[] = storyDef.paragraphs.map((p) => {
      const sentenceRecords = p.sentences.map((s) => {
        const ja = s.ja.trim();
        const naturalEn = s.naturalEn.trim();
        const literalEn = buildLiteralSentenceGloss(ja);
        const tokens = tokenizeJapaneseParagraph(ja);
        return {
          ja,
          literalEn,
          naturalEn,
          tokens,
        };
      });

      const paraJa = sentenceRecords.map((s) => s.ja).join("");
      const paraEn = sentenceRecords.map((s) => s.naturalEn).join(" ");
      const paraTokens = tokenizeJapaneseParagraph(paraJa);

      return {
        ja: paraJa,
        en: paraEn,
        tokens: paraTokens,
        sentences: sentenceRecords,
      };
    });

    const storyOutput = {
      id: storyDef.id,
      title: storyDef.title,
      titleRomaji: storyDef.titleRomaji,
      titleEn: storyDef.titleEn,
      level: "N3",
      category: isAnime ? "Anime & Pop Culture" : "Everyday Life",
      tags: storyDef.tags,
      paragraphs,
      quiz: storyDef.quiz,
    };

    // Calculate metrics
    const totalSentences = paragraphs.reduce(
      (sum, p) => sum + (p.sentences?.length ?? 0),
      0
    );
    const totalJaChars = paragraphs.reduce((sum, p) => sum + p.ja.length, 0);
    const totalWords = paragraphs.reduce(
      (sum, p) =>
        sum + (p.sentences?.reduce((sSum, s) => sSum + (s.tokens?.length ?? 0), 0) ?? 0),
      0
    );

    console.log(
      `[${storyDef.slug}] ${totalSentences} sentences, ${totalJaChars} ja chars, ~${totalWords} tokens/words`
    );

    if (totalSentences < 18) {
      throw new Error(`Story ${storyDef.slug} has fewer than 18 sentences: ${totalSentences}`);
    }
    if (totalJaChars < 600) {
      throw new Error(`Story ${storyDef.slug} has fewer than 600 Japanese chars: ${totalJaChars}`);
    }

    const filePath = path.join(targetDir, `${storyDef.slug}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(storyOutput, null, 2)}\n`, "utf8");

    const publicFilePath = path.join(PUBLIC_STORIES_DIR, `${storyDef.id}.json`);
    fs.writeFileSync(publicFilePath, `${JSON.stringify(storyOutput, null, 2)}\n`, "utf8");
  }
}

console.log("=== Generating 10 Anime N3 Stories ===");
processStories(ANIME_STORIES, N3_ANIME_DIR, true);

console.log("\n=== Generating 10 Everyday N3 Stories ===");
processStories(EVERYDAY_STORIES, N3_DIR, false);

console.log("\nAll 20 N3 stories generated successfully!");
