import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import type { GrammarLevelFile, GrammarPoint, GrammarExample } from "../src/data/grammar";

interface TargetExampleRef {
  level: string;
  pointId: string;
  example: GrammarExample;
  textToTranslate: string;
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limitChars = limitArg ? Number.parseInt(limitArg.split("=")[1]!, 10) : undefined;

  const levelsArg = process.argv.find((a) => a.startsWith("--levels="));
  const levels = levelsArg
    ? levelsArg.split("=")[1]!.split(",").map((l) => l.trim().toUpperCase())
    : ["N5", "N4", "N3"];

  const root = process.cwd();
  const client = new DeepLClient();
  await client.loadCache();

  console.log("Setting up DeepL Grammar Glossary...");
  const glossaryId = await client.getOrCreateGrammarGlossary();
  if (glossaryId) {
    console.log(`Enforcing DeepL Grammar Glossary ID: ${glossaryId}`);
  }

  console.log(`\n--- Grammar Drills Scramble Enrichment (Levels: ${levels.join(", ")}) ---`);

  const fileDataByLevel = new Map<string, GrammarLevelFile>();
  const targets: TargetExampleRef[] = [];

  for (const lvl of levels) {
    const filePath = resolve(root, `public/data/v1/grammar/${lvl}.json`);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as GrammarLevelFile;
    fileDataByLevel.set(lvl, data);

    for (const point of data.points ?? []) {
      for (const ex of point.examples ?? []) {
        if (ex.chunks && ex.chunks.length >= 2 && !ex.naturalEn) {
          targets.push({
            level: lvl,
            pointId: point.id,
            example: ex,
            textToTranslate: ex.jp,
          });
        }
      }
    }
  }

  console.log(`Found ${targets.length} scramble drill examples requiring natural translations.`);

  const texts = targets.map((t) => t.textToTranslate);
  const { results, stats } = await client.translateBatch(texts, {
    mode: "sentence",
    glossaryId: glossaryId ?? undefined,
    dryRun: isDryRun,
    limitChars,
  });

  console.log("\nDeepL Translation Stats:");
  console.log(`  Total sentences requested : ${stats.totalRequested}`);
  console.log(`  Cached hits (0 API chars) : ${stats.cachedHits}`);
  console.log(`  Uncached items            : ${stats.uncachedTexts}`);
  console.log(`  Uncached characters       : ${stats.uncachedChars}`);
  console.log(`  Newly translated chars    : ${stats.translatedChars}`);

  if (!isDryRun) {
    let appliedCount = 0;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i]!;
      const naturalEn = results.get(target.textToTranslate)?.trim();
      if (naturalEn) {
        target.example.literalEn = target.example.literalEn || target.example.en;
        target.example.naturalEn = naturalEn;
        target.example.en = naturalEn;
        appliedCount++;
      }
    }

    for (const [lvl, data] of fileDataByLevel.entries()) {
      const filePath = resolve(root, `public/data/v1/grammar/${lvl}.json`);
      await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    }

    await client.saveCache();
    console.log(`\nSuccessfully applied natural translations to ${appliedCount} scramble sentences across ${levels.join(", ")}.`);
  } else {
    console.log("\n[DRY-RUN] No files modified. All translations would be cached.");
  }
}

if (process.argv[1]?.endsWith("enrich-grammar-drills.ts")) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}

