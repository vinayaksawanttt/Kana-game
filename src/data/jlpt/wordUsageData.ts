// Word Usage (語彙・用法 — Official JLPT Vocabulary Mondai 5)
// Architecture: Strict data -> engine -> hooks -> components separation.

import { WORD_USAGE_N4_ITEMS } from "./word_usage/n4";
import { WORD_USAGE_N3_ITEMS } from "./word_usage/n3";
import { WORD_USAGE_N2_ITEMS } from "./word_usage/n2";
import { WORD_USAGE_N1_ITEMS } from "./word_usage/n1";

export type WordUsageLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface WordUsageSentenceOption {
  id: string;
  sentenceJa: string;
  sentenceFurigana?: string;
  sentenceEn: string;
  isCorrect: boolean;
  explanation: string;
}

export interface WordUsageItem {
  id: string;
  level: WordUsageLevel;
  jlpt: 5 | 4 | 3 | 2 | 1;
  word: string;
  reading: string;
  romaji?: string;
  meanings: string[];
  pos?: string[];
  correctOptionIndex: 0 | 1 | 2 | 3;
  options: [
    WordUsageSentenceOption,
    WordUsageSentenceOption,
    WordUsageSentenceOption,
    WordUsageSentenceOption,
  ];
}

/**
 * Validates the schema and semantic rules of a WordUsageItem:
 * - 4 options present
 * - exactly 1 correct option
 * - correctOptionIndex matches the correct option
 * - every option has sentenceJa, sentenceEn, explanation
 */
export function validateWordUsageItem(item: WordUsageItem): string[] {
  const errors: string[] = [];

  if (!item.id || typeof item.id !== "string") {
    errors.push(`Item has missing or invalid id: ${item.id}`);
  }
  if (!item.word || typeof item.word !== "string") {
    errors.push(`Item ${item.id} has missing word`);
  }
  if (!item.reading || typeof item.reading !== "string") {
    errors.push(`Item ${item.id} has missing reading`);
  }
  if (!Array.isArray(item.meanings) || item.meanings.length === 0) {
    errors.push(`Item ${item.id} has missing meanings array`);
  }
  if (!["N5", "N4", "N3", "N2", "N1"].includes(item.level)) {
    errors.push(`Item ${item.id} has invalid level: ${item.level}`);
  }

  if (!Array.isArray(item.options) || item.options.length !== 4) {
    errors.push(`Item ${item.id} must have exactly 4 sentence options`);
    return errors;
  }

  const correctIndices: number[] = [];
  item.options.forEach((opt, idx) => {
    if (!opt.id) {
      errors.push(`Item ${item.id} option ${idx} is missing id`);
    }
    if (!opt.sentenceJa || typeof opt.sentenceJa !== "string") {
      errors.push(`Item ${item.id} option ${idx} has empty sentenceJa`);
    }
    if (!opt.sentenceEn || typeof opt.sentenceEn !== "string") {
      errors.push(`Item ${item.id} option ${idx} has empty sentenceEn`);
    }
    if (!opt.explanation || typeof opt.explanation !== "string") {
      errors.push(`Item ${item.id} option ${idx} has empty explanation`);
    }
    if (opt.isCorrect) {
      correctIndices.push(idx);
    }
  });

  if (correctIndices.length !== 1) {
    errors.push(
      `Item ${item.id} must have exactly one correct option, found ${correctIndices.length} (indices: ${correctIndices.join(", ")})`,
    );
  } else if (item.correctOptionIndex !== correctIndices[0]) {
    errors.push(
      `Item ${item.id} correctOptionIndex (${item.correctOptionIndex}) does not match option with isCorrect: true (${correctIndices[0]})`,
    );
  }

  return errors;
}

/** Curated N4, N3, N2, and N1 Word Usage items */
export {
  WORD_USAGE_N4_ITEMS,
  WORD_USAGE_N3_ITEMS,
  WORD_USAGE_N2_ITEMS,
  WORD_USAGE_N1_ITEMS,
};

/** All curated Word Usage items across all levels */
export const WORD_USAGE_ITEMS: readonly WordUsageItem[] = [
  ...WORD_USAGE_N4_ITEMS,
  ...WORD_USAGE_N3_ITEMS,
  ...WORD_USAGE_N2_ITEMS,
  ...WORD_USAGE_N1_ITEMS,
];

let cachedWordUsageItems: readonly WordUsageItem[] | null = null;

/**
 * Client-side typed loader for Word Usage dataset.
 * Fetches compiled JSON from /data/v1/jlpt/word-usage.json with in-memory caching.
 * Falls back to bundled static WORD_USAGE_ITEMS if fetch is unavailable.
 */
export async function loadWordUsageData(): Promise<readonly WordUsageItem[]> {
  if (cachedWordUsageItems) {
    return cachedWordUsageItems;
  }

  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/data/v1/jlpt/word-usage.json");
      if (response.ok) {
        const data = (await response.json()) as WordUsageItem[];
        if (Array.isArray(data) && data.length > 0) {
          cachedWordUsageItems = data;
          return data;
        }
      }
    } catch {
      // Fallback to static bundle if fetch fails
    }
  }

  cachedWordUsageItems = WORD_USAGE_ITEMS;
  return WORD_USAGE_ITEMS;
}

export function getWordUsageCountsByLevel(
  items: readonly WordUsageItem[] = WORD_USAGE_ITEMS,
): Record<WordUsageLevel, number> {
  const counts: Record<WordUsageLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
  };
  for (const item of items) {
    counts[item.level] = (counts[item.level] ?? 0) + 1;
  }
  return counts;
}
