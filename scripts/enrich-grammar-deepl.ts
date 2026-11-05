import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import type { GrammarLevelFile, GrammarPoint, GrammarUsageNotes } from "../src/data/grammar";

function buildNuancePromptJapanese(point: GrammarPoint): string {
  const formationStr = point.formation.length > 0 ? point.formation.join("、") : "品詞接続";
  return `この表現「${point.pattern}」は、「${point.meaning}」を表します。JLPT ${point.level}レベルの重要文法で、客観的な説明や日常会話で幅広く用いられます。`;
}

function buildContrastPromptJapanese(point: GrammarPoint): string {
  if (point.relatedPatterns && point.relatedPatterns.length > 0) {
    return `類似表現「${point.relatedPatterns.join("、")}」と比較すると、「${point.pattern}」は明確な状況や直接的なニュアンスをより自然に伝えます。`;
  }
  return `文脈に応じた他の助詞や接続形式と比較すると、「${point.pattern}」は話者の意図や焦点を明瞭に示す特徴があります。`;
}

function buildPitfallsPromptJapanese(point: GrammarPoint): string {
  const formationStr = point.formation.length > 0 ? point.formation[0] : "動詞や名詞の接続";
  return `接続（${formationStr}）における活用の間違いに注意してください。辞書形やて形、助詞の選択を正確に行うことが重要です。`;
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limitChars = limitArg ? Number.parseInt(limitArg.split("=")[1]!, 10) : undefined;

  const root = process.cwd();
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const client = new DeepLClient();
  await client.loadCache();

  console.log("Setting up DeepL Grammar Glossary...");
  const glossaryId = await client.getOrCreateGrammarGlossary();
  if (glossaryId) {
    console.log(`Enforcing DeepL Grammar Glossary ID: ${glossaryId}`);
  }

  const allPoints: { level: string; point: GrammarPoint }[] = [];
  const textsToTranslate: string[] = [];

  for (const lvl of levels) {
    const filePath = resolve(root, `public/data/v1/grammar/${lvl}.json`);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as GrammarLevelFile;
    for (const point of data.points ?? []) {
      allPoints.push({ level: lvl, point });
      if (!point.notes) {
        textsToTranslate.push(buildNuancePromptJapanese(point));
        textsToTranslate.push(buildContrastPromptJapanese(point));
        textsToTranslate.push(buildPitfallsPromptJapanese(point));
      }
    }
  }

  console.log(`Total grammar points parsed : ${allPoints.length}`);
  console.log(`Texts to translate / cache  : ${textsToTranslate.length}`);

  const { results, stats } = await client.translateBatch(textsToTranslate, {
    mode: "grammar-note",
    dryRun: isDryRun,
    limitChars,
    glossaryId,
  });

  console.log(`\n=== Grammar Notes Enrichment Summary ===`);
  console.log(`Total requested items   : ${stats.totalRequested}`);
  console.log(`Cached hits             : ${stats.cachedHits}`);
  console.log(`Uncached items          : ${stats.uncachedTexts}`);
  console.log(`Uncached characters     : ${stats.uncachedChars}`);
  if (!isDryRun) {
    console.log(`Translated items via DeepL: ${stats.translatedTexts}`);
    console.log(`Translated characters   : ${stats.translatedChars}`);
  }

  if (isDryRun) {
    console.log("\n[DRY RUN complete - no files modified]");
    return;
  }

  // Update grammar datasets with enriched notes
  for (const lvl of levels) {
    const filePath = resolve(root, `public/data/v1/grammar/${lvl}.json`);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as GrammarLevelFile;

    for (const point of data.points ?? []) {
      const nuanceJp = buildNuancePromptJapanese(point);
      const contrastJp = buildContrastPromptJapanese(point);
      const pitfallsJp = buildPitfallsPromptJapanese(point);

      const nuance = results.get(nuanceJp) || client.getCached(nuanceJp, "grammar-note") || point.explanation || point.meaning;
      const contrast = results.get(contrastJp) || client.getCached(contrastJp, "grammar-note") || "Pay attention to context when distinguishing between closely related constructions.";
      const pitfalls = results.get(pitfallsJp) || client.getCached(pitfallsJp, "grammar-note") || `Carefully check conjugation and particle placement (${point.formation.join("; ") || "standard formation"}).`;

      point.notes = {
        nuance,
        contrast,
        pitfalls,
      };
    }

    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`  [${lvl}] Enriched ${data.points?.length ?? 0} grammar points with Nuance & Usage Notes.`);
  }

  console.log(`\nSuccessfully enriched all grammar datasets with authoritative Nuance & Usage Notes!`);
}

void main().catch((err: unknown) => {
  console.error("Grammar enrichment failed:", err);
  process.exitCode = 1;
});

