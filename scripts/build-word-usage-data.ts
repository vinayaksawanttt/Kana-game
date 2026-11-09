import fs from "node:fs";
import path from "node:path";
import {
  type WordUsageItem,
  validateWordUsageItem,
} from "../src/data/jlpt/wordUsageData";
import { WORD_USAGE_N4_ITEMS } from "../src/data/jlpt/word_usage/n4";
import { WORD_USAGE_N3_ITEMS } from "../src/data/jlpt/word_usage/n3";
import { WORD_USAGE_N2_ITEMS } from "../src/data/jlpt/word_usage/n2";
import { WORD_USAGE_N1_ITEMS } from "../src/data/jlpt/word_usage/n1";

const OUT_FILE = path.join(
  process.cwd(),
  "public",
  "data",
  "v1",
  "jlpt",
  "word-usage.json",
);

export function buildAndValidateWordUsageData(): WordUsageItem[] {
  const items: WordUsageItem[] = [
    ...WORD_USAGE_N4_ITEMS,
    ...WORD_USAGE_N3_ITEMS,
    ...WORD_USAGE_N2_ITEMS,
    ...WORD_USAGE_N1_ITEMS,
  ];

  if (items.length !== 100) {
    throw new Error(`Expected exactly 100 items, found ${items.length}`);
  }

  const levelCounts: Record<string, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  };
  const seenIds = new Set<string>();
  const seenWords = new Set<string>();
  const answerDist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

  for (const item of items) {
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate item ID found: ${item.id}`);
    }
    seenIds.add(item.id);

    if (seenWords.has(item.word)) {
      throw new Error(`Duplicate target word found: ${item.word}`);
    }
    seenWords.add(item.word);

    levelCounts[item.level] = (levelCounts[item.level] ?? 0) + 1;
    answerDist[item.correctOptionIndex] = (answerDist[item.correctOptionIndex] ?? 0) + 1;

    const validationErrors = validateWordUsageItem(item);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed for item ${item.id} (${item.word}):\n  ${validationErrors.join("\n  ")}`,
      );
    }
  }

  // Verify exact required counts per level
  const expectedCounts = { N4: 45, N3: 20, N2: 20, N1: 15 };
  if (levelCounts.N4 !== expectedCounts.N4) {
    throw new Error(`Expected ${expectedCounts.N4} N4 items, got ${levelCounts.N4}`);
  }
  if (levelCounts.N3 !== expectedCounts.N3) {
    throw new Error(`Expected ${expectedCounts.N3} N3 items, got ${levelCounts.N3}`);
  }
  if (levelCounts.N2 !== expectedCounts.N2) {
    throw new Error(`Expected ${expectedCounts.N2} N2 items, got ${levelCounts.N2}`);
  }
  if (levelCounts.N1 !== expectedCounts.N1) {
    throw new Error(`Expected ${expectedCounts.N1} N1 items, got ${levelCounts.N1}`);
  }

  // Ensure output directory exists
  const dir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), "utf-8");

  console.log(`✓ Validated and emitted ${items.length} Word Usage items to ${OUT_FILE}`);
  console.log(`  Levels: ${JSON.stringify(levelCounts)}`);
  console.log(`  Answer distribution (0..3): ${JSON.stringify(answerDist)}`);

  return items;
}

if (
  process.argv[1]?.endsWith("build-word-usage-data.ts") ||
  process.argv[1]?.endsWith("build-word-usage-data.js")
) {
  buildAndValidateWordUsageData();
}
