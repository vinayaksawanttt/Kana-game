import fs from "node:fs";
import path from "node:path";
import { DeepLClient } from "./lib/deepl-client";
import type { BookDetail } from "../src/data/books";

const BOOKS_DIR = path.resolve(process.cwd(), "public/data/v1/books");
const TARGET_BOOKS = ["genki-1", "genki-2", "mnn-1", "mnn-2", "mnn-3"];

async function main() {
  console.log("=" .repeat(65));
  console.log("  Textbook Companion DeepL Translation Enrichment  ");
  console.log("=" .repeat(65));

  const client = new DeepLClient();
  const initialUsage = await client.getUsage();
  console.log(`[DeepL Quota Initial] Used: ${initialUsage.character_count.toLocaleString()} / Limit: ${initialUsage.character_limit.toLocaleString()} (${(initialUsage.character_limit - initialUsage.character_count).toLocaleString()} remaining)`);

  const bookData: Record<string, BookDetail> = {};
  const textsToTranslate = new Set<string>();

  // 1. Gather all texts needing translation across the 3 textbooks
  for (const bookId of TARGET_BOOKS) {
    const filePath = path.join(BOOKS_DIR, `${bookId}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] File not found: ${filePath}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as BookDetail;
    bookData[bookId] = data;

    let missingGrammar = 0;
    let missingPractice = 0;

    for (const lesson of data.lessons) {
      // Grammar examples
      for (const g of lesson.grammar || []) {
        for (const ex of g.examples || []) {
          const ja = (ex.ja || "").trim();
          if (ja && (!ex.en || !ex.en.trim())) {
            textsToTranslate.add(ja);
            missingGrammar++;
          }
        }
      }

      // Practice items
      for (const p of lesson.practice || []) {
        for (const it of p.items || []) {
          const answer = (it.answer || "").trim();
          if (answer && (!it.hint || !it.hint.trim())) {
            textsToTranslate.add(answer);
            missingPractice++;
          }
        }
      }
    }

    console.log(`[Loaded] ${data.title} (${bookId}): ${missingGrammar} grammar examples, ${missingPractice} practice items needing EN`);
  }

  const uniqueList = Array.from(textsToTranslate);
  const totalChars = uniqueList.reduce((sum, t) => sum + [...t].length, 0);
  console.log(`\nTotal unique phrases to translate: ${uniqueList.length.toLocaleString()} (${totalChars.toLocaleString()} chars)`);

  if (uniqueList.length === 0) {
    console.log("All grammar examples and practice items are already translated!");
    return;
  }

  // 2. Batch translate via DeepL with sentence mode and persistent caching
  console.log("\n[*] Translating via DeepL API in sentence mode...");
  const { results, stats } = await client.translateBatch(uniqueList, {
    mode: "sentence",
  });

  console.log(`\n[Translation Stats]`);
  console.log(`  - Cache Hits:      ${stats.cachedHits.toLocaleString()}`);
  console.log(`  - Fresh DeepL API: ${stats.translatedTexts.toLocaleString()} phrases (${stats.translatedChars.toLocaleString()} chars consumed)`);

  // 3. Apply translations back to each textbook structure
  console.log("\n[*] Applying translations to textbook data...");
  for (const bookId of TARGET_BOOKS) {
    const data = bookData[bookId];
    if (!data) continue;

    let enrichedGrammarCount = 0;
    let enrichedPracticeCount = 0;

    for (const lesson of data.lessons) {
      for (const g of lesson.grammar || []) {
        for (const ex of g.examples || []) {
          const ja = (ex.ja || "").trim();
          if (ja && (!ex.en || !ex.en.trim())) {
            const translation = results.get(ja);
            if (translation) {
              ex.en = translation;
              enrichedGrammarCount++;
            }
          }
        }
      }

      for (const p of lesson.practice || []) {
        for (const it of p.items || []) {
          const answer = (it.answer || "").trim();
          if (answer && (!it.hint || !it.hint.trim())) {
            const translation = results.get(answer);
            if (translation) {
              it.hint = translation;
              enrichedPracticeCount++;
            }
          }
        }
      }
    }

    const outPath = path.join(BOOKS_DIR, `${bookId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`[Updated] ${bookId}.json -> ${enrichedGrammarCount} grammar examples + ${enrichedPracticeCount} practice hints enriched.`);
  }

  // 4. Save persistent cache
  await client.saveCache();
  console.log("[OK] Persistent translation cache updated in data-raw/deepl-cache.json");

  // 5. Final DeepL Usage Check
  const finalUsage = await client.getUsage();
  const consumed = finalUsage.character_count - initialUsage.character_count;
  console.log("\n" + "=".repeat(65));
  console.log(`Enrichment Complete!`);
  console.log(`Characters consumed this run: ${consumed.toLocaleString()} chars`);
  console.log(`Remaining DeepL limit:       ${(finalUsage.character_limit - finalUsage.character_count).toLocaleString()} chars`);
  console.log("=".repeat(65));
}

main().catch((err) => {
  console.error("[FATAL ERROR]", err);
  process.exit(1);
});
