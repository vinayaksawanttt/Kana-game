import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import { tokenizeJapaneseParagraph, type StoryParagraph, type StorySentence } from "../src/data/stories";

interface StoryFile {
  filePath: string;
  id: string;
  title: string;
  titleRomaji: string;
  titleEn: string;
  level: string;
  category: string;
  tags: string[];
  paragraphs: StoryParagraph[];
  quiz: Array<{
    question: string;
    options: string[];
    answerIndex: number;
    explanation?: string;
  }>;
}

const PARTICLE_GLOSSES: Record<string, string> = {
  は: "[topic]",
  が: "[subj]",
  を: "[obj]",
  に: "[at/to]",
  で: "[in/by]",
  へ: "[toward]",
  と: "[with/and]",
  から: "[from]",
  まで: "[until]",
  の: "['s / of]",
  も: "[also]",
  より: "[than]",
  ほど: "[as much as]",
  ね: "[right?]",
  よ: "[you know]",
  か: "[?]",
  ました: "[past polite]",
  ません: "[polite negative]",
  ます: "[polite]",
  たい: "[want to]",
  ている: "[is doing]",
  ていた: "[was doing]",
  て: "[and]",
  た: "[past]",
  だ: "[is]",
  です: "[is]",
  でした: "[was]",
  ない: "[not]",
  なかった: "[was not]",
  さん: "[Mr/Ms]",
  くん: "[honorific]",
  ちゃん: "[honorific]",
};

export function splitJapaneseSentences(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  // Split on Japanese full stop or exclamation/question mark while keeping the punctuation
  const raw = cleaned.split(/(?<=[。！？])/);
  const result: string[] = [];
  for (const part of raw) {
    const trimmed = part.trim();
    if (trimmed) result.push(trimmed);
  }
  return result.length > 0 ? result : [cleaned];
}

export function buildLiteralSentenceGloss(sentence: string): string {
  const tokens = tokenizeJapaneseParagraph(sentence);
  const parts: string[] = [];

  for (const token of tokens) {
    const surface = token.surface.trim();
    if (!surface) continue;

    if (PARTICLE_GLOSSES[surface]) {
      parts.push(PARTICLE_GLOSSES[surface]!);
      continue;
    }

    if (/^[、。！？「」『』（）・…―,."'!?\-:;]+$/.test(surface)) {
      continue;
    }

    if (token.meaning) {
      // Clean up meaning for literal gloss (take first 1-2 words)
      const firstMeaning = token.meaning.split(/[,;/]/)[0]!.trim().replace(/\s*\([^)]*\)/g, "");
      parts.push(firstMeaning);
    } else if (surface.length > 1) {
      parts.push(surface);
    }
  }

  const combined = parts.join(" ").replace(/\s+([,.'!?])/g, "$1").trim();
  return combined.length > 0 ? combined : sentence;
}

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.endsWith(".json") && entry !== "lexicon.json") {
      results.push(full);
    }
  }
  return results;
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limitChars = limitArg ? Number.parseInt(limitArg.split("=")[1]!, 10) : undefined;

  const root = process.cwd();
  const storiesDir = resolve(root, "src/data/content/stories");
  const destDir = resolve(root, "public/data/v1/stories");
  await mkdir(destDir, { recursive: true });

  const storyPaths = findJsonFiles(storiesDir);
  console.log(`Found ${storyPaths.length} story files to enrich.`);

  const client = new DeepLClient();
  await client.loadCache();

  // Collect all unique sentences grouped by paragraph context
  const translationGroups: Array<{ context: string; texts: string[] }> = [];
  const storyFiles: StoryFile[] = [];

  for (const p of storyPaths) {
    const raw = await readFile(p, "utf8");
    const parsed = JSON.parse(raw) as StoryFile;
    parsed.filePath = p;
    storyFiles.push(parsed);

    for (const para of parsed.paragraphs) {
      const sentences = splitJapaneseSentences(para.ja);
      translationGroups.push({
        context: para.ja,
        texts: sentences,
      });
    }
  }

  console.log("Analyzing sentence translation requirements with DeepL contextual pipeline...");
  const { results, stats } = await client.translateGroupedWithContext(translationGroups, {
    mode: "story-sentence",
    dryRun: isDryRun,
    limitChars,
  });

  console.log(`\n=== Stories Sentence Enrichment Summary ===`);
  console.log(`Total sentences across stories : ${stats.totalRequested}`);
  console.log(`Cached sentence translations   : ${stats.cachedHits}`);
  console.log(`Uncached sentences for DeepL   : ${stats.uncachedTexts}`);
  console.log(`Uncached characters           : ${stats.uncachedChars}`);
  if (!isDryRun) {
    console.log(`Translated sentences via DeepL : ${stats.translatedTexts}`);
    console.log(`Translated characters          : ${stats.translatedChars}`);
  }

  if (isDryRun) {
    console.log("\n[DRY RUN complete - no files modified]");
    return;
  }

  // Enrich each story and save
  let totalEnrichedSentences = 0;

  for (const story of storyFiles) {
    for (const para of story.paragraphs) {
      const sentenceTexts = splitJapaneseSentences(para.ja);
      const sentences: StorySentence[] = sentenceTexts.map((sText) => {
        const naturalEn =
          results.get(sText) ||
          client.getCached(sText, "story-sentence") ||
          para.en;
        const literalEn = buildLiteralSentenceGloss(sText);
        const tokens = tokenizeJapaneseParagraph(sText);
        totalEnrichedSentences += 1;
        return {
          ja: sText,
          literalEn,
          naturalEn,
          tokens,
        };
      });

      para.sentences = sentences;
    }

    // Enrich quiz with contextual bilingual evidence explanations
    for (const q of story.quiz) {
      const correctOption = q.options[q.answerIndex] ?? "";
      let evidenceSentence: StorySentence | undefined;

      // 1. Look for a sentence containing the exact correct option
      for (const para of story.paragraphs) {
        evidenceSentence = para.sentences?.find((s) => s.ja.includes(correctOption));
        if (evidenceSentence) break;
      }

      // 2. If not found, look for keyword overlap between question and sentences
      if (!evidenceSentence) {
        const qKeywords = q.question.replace(/[何だれどこいつどうやって？]/g, "").slice(0, 4);
        for (const para of story.paragraphs) {
          evidenceSentence = para.sentences?.find((s) => qKeywords && s.ja.includes(qKeywords));
          if (evidenceSentence) break;
        }
      }

      if (evidenceSentence) {
        q.explanation = `「${correctOption}」 is correct: 「${evidenceSentence.ja}」 (${evidenceSentence.naturalEn})`;
      } else {
        q.explanation = `「${correctOption}」 is the correct answer according to the story.`;
      }
    }

    // Save enriched output to public/data/v1/stories/[id].json
    const destFile = resolve(destDir, `${story.id}.json`);
    await writeFile(destFile, `${JSON.stringify(story, null, 2)}\n`, "utf8");

    // Also update local story file in src/data/content/stories
    await writeFile(story.filePath, `${JSON.stringify(story, null, 2)}\n`, "utf8");
  }

  console.log(`\nSuccessfully enriched ${storyFiles.length} stories with ${totalEnrichedSentences} granular sentence breakdowns!`);
  console.log(`Saved output to public/data/v1/stories/ and updated src/data/content/stories/`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  void main().catch((err: unknown) => {
    console.error("Story enrichment failed:", err);
    process.exitCode = 1;
  });
}

