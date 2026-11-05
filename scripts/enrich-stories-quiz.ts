import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import type { StoryQuiz } from "../src/data/stories";

interface StoryFileContent {
  id?: string;
  slug?: string;
  title?: string;
  level?: string;
  quiz?: StoryQuiz[];
  filePath?: string;
  [key: string]: unknown;
}

interface QuestionTarget {
  storyFilePath: string;
  storyIndex: number;
  quizIndex: number;
  questionJa: string;
  optionsJa: string[];
}

async function findStoryFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await findStoryFiles(fullPath);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "lexicon.json") {
      files.push(fullPath);
    }
  }
  return files;
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limitChars = limitArg ? Number.parseInt(limitArg.split("=")[1]!, 10) : undefined;

  const root = process.cwd();
  const contentStoriesDir = resolve(root, "src/data/content/stories");
  const publicStoriesDir = resolve(root, "public/data/v1/stories");

  const storyFiles = await findStoryFiles(contentStoriesDir);
  console.log(`\n--- Story Reading Comprehension Q&A Enrichment ---`);
  console.log(`Found ${storyFiles.length} story files in ${contentStoriesDir}`);

  const targets: QuestionTarget[] = [];
  const parsedStories: { path: string; data: StoryFileContent }[] = [];

  for (let sIdx = 0; sIdx < storyFiles.length; sIdx++) {
    const filePath = storyFiles[sIdx]!;
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as StoryFileContent;
    parsedStories.push({ path: filePath, data });

    for (let qIdx = 0; qIdx < (data.quiz ?? []).length; qIdx++) {
      const q = data.quiz![qIdx]!;
      if (!q.questionEn || !q.optionsEn || q.optionsEn.length !== q.options.length) {
        targets.push({
          storyFilePath: filePath,
          storyIndex: sIdx,
          quizIndex: qIdx,
          questionJa: q.question,
          optionsJa: q.options ?? [],
        });
      }
    }
  }

  console.log(`Found ${targets.length} quiz questions requiring English translations.`);

  // Collect unique texts to translate
  const questionTexts: string[] = [];
  const optionTexts: string[] = [];

  for (const target of targets) {
    questionTexts.push(target.questionJa);
    for (const opt of target.optionsJa) {
      optionTexts.push(opt);
    }
  }

  const client = new DeepLClient();
  await client.loadCache();

  console.log(`Questions to translate: ${questionTexts.length}`);
  console.log(`Options to translate  : ${optionTexts.length}`);

  // Translate questions
  const qResult = await client.translateBatch(questionTexts, {
    mode: "sentence",
    dryRun: isDryRun,
    limitChars,
  });

  // Translate options
  const optResult = await client.translateBatch(optionTexts, {
    mode: "gloss",
    dryRun: isDryRun,
    limitChars,
  });

  const totalChars = qResult.stats.uncachedChars + optResult.stats.uncachedChars;
  console.log("\nDeepL Translation Stats (Questions + Options):");
  console.log(`  Total items requested     : ${qResult.stats.totalRequested + optResult.stats.totalRequested}`);
  console.log(`  Cached hits (0 API chars) : ${qResult.stats.cachedHits + optResult.stats.cachedHits}`);
  console.log(`  Uncached items            : ${qResult.stats.uncachedTexts + optResult.stats.uncachedTexts}`);
  console.log(`  Uncached characters       : ${totalChars}`);
  console.log(`  Newly translated chars    : ${qResult.stats.translatedChars + optResult.stats.translatedChars}`);

  if (!isDryRun) {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const qTranslation = qResult.results.get(target.questionJa)?.trim();
      const optionsEn: string[] = [];

      for (let j = 0; j < target.optionsJa.length; j++) {
        const optJa = target.optionsJa[j]!;
        optionsEn.push(optResult.results.get(optJa)?.trim() || optJa);
      }

      const storyObj = parsedStories[target.storyIndex]!.data;
      const quizObj = storyObj.quiz![target.quizIndex]!;
      if (qTranslation) quizObj.questionEn = qTranslation;
      quizObj.optionsEn = optionsEn;
    }

    // Save back to src/data/content/stories
    for (const item of parsedStories) {
      await writeFile(item.path, JSON.stringify(item.data, null, 2) + "\n", "utf8");
    }

    // Also sync to public/data/v1/stories if matching files exist
    const publicFiles = await findStoryFiles(publicStoriesDir).catch(() => []);
    for (const pubPath of publicFiles) {
      try {
        const raw = await readFile(pubPath, "utf8");
        const pubData = JSON.parse(raw) as StoryFileContent;
        const matchingSrc = parsedStories.find(
          (s) => s.data.id === pubData.id || s.data.slug === pubData.slug
        );
        if (matchingSrc && matchingSrc.data.quiz) {
          pubData.quiz = matchingSrc.data.quiz;
          await writeFile(pubPath, JSON.stringify(pubData, null, 2) + "\n", "utf8");
        }
      } catch {
        // Continue
      }
    }

    await client.saveCache();
    console.log(`\nSuccessfully enriched quiz questions & options across all story files.`);
  } else {
    console.log("\n[DRY-RUN] No files modified.");
  }
}

if (process.argv[1]?.endsWith("enrich-stories-quiz.ts")) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}

