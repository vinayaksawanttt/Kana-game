import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSTANT_REPLY_ITEMS, type InstantReplyItem, type InstantReplyOptionData } from "../src/data/jlpt/instantReplyData";

const ROOT = process.cwd();
const CACHE_FILE = resolve(ROOT, "data-raw/deepl-cache.json");

function loadEnvLocal(): string {
  if (process.env.DEEPL_API_KEY) return process.env.DEEPL_API_KEY.trim();
  const envFile = resolve(ROOT, ".env.local");
  if (!existsSync(envFile)) return "";
  const raw = readFileSync(envFile, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === "DEEPL_API_KEY") return val;
  }
  return "";
}

function loadCache(): Record<string, string> {
  if (existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: Record<string, string>): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

async function getDeepLUsage(apiKey: string): Promise<{ used: number; limit: number }> {
  const isFree = apiKey.endsWith(":fx");
  const endpoint = isFree ? "https://api-free.deepl.com/v2/usage" : "https://api.deepl.com/v2/usage";
  const res = await fetch(endpoint, {
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
  });
  if (!res.ok) throw new Error(`DeepL Usage error: ${res.status}`);
  const data = await res.json();
  return { used: data.character_count, limit: data.character_limit };
}

async function rephraseBatchDeepL(
  texts: string[],
  apiKey: string,
  cache: Record<string, string>
): Promise<string[]> {
  const results: string[] = new Array(texts.length).fill("");
  const toFetchIndices: number[] = [];
  const toFetchTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = `en->en:polished-explanation:${texts[i].trim()}`;
    if (cache[key]) {
      results[i] = cache[key];
    } else {
      toFetchIndices.push(i);
      toFetchTexts.push(texts[i].trim());
    }
  }

  if (toFetchTexts.length === 0) {
    return results;
  }

  const isFree = apiKey.endsWith(":fx");
  const writeUrl = isFree ? "https://api-free.deepl.com/v2/write/rephrase" : "https://api.deepl.com/v2/write/rephrase";

  try {
    const res = await fetch(writeUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: toFetchTexts,
        target_lang: "EN-US",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const improvements = data.improvements || [];
      for (let j = 0; j < toFetchIndices.length; j++) {
        const origIdx = toFetchIndices[j];
        const improved = (improvements[j]?.text || toFetchTexts[j]).trim();
        results[origIdx] = improved;
        const cacheKey = `en->en:polished-explanation:${toFetchTexts[j]}`;
        cache[cacheKey] = improved;
      }
      return results;
    }
  } catch (err) {
    console.warn("DeepL Write API error, falling back to /v2/translate:", err);
  }

  // Fallback: use /v2/translate with context if Write is unavailable
  const translateUrl = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  const res = await fetch(translateUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: toFetchTexts,
      source_lang: "EN",
      target_lang: "EN-US",
      context: "JLPT Listening exam distractor diagnostic rationale. Polish into clear, educational English explaining why this test choice succeeds or fails.",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const translations = data.translations || [];
  for (let j = 0; j < toFetchIndices.length; j++) {
    const origIdx = toFetchIndices[j];
    const trans = (translations[j]?.text || toFetchTexts[j]).trim();
    results[origIdx] = trans;
    const cacheKey = `en->en:polished-explanation:${toFetchTexts[j]}`;
    cache[cacheKey] = trans;
  }

  return results;
}

function formatDiagnosticExplanation(
  rawExplanation: string,
  isCorrect: boolean,
  trapType?: string
): string {
  let exp = rawExplanation.trim();
  // Strip existing tags if already present
  exp = exp.replace(/^\[(Natural Response|Keigo Mismatch Trap|Register Mismatch Trap|Pragmatic Intent Trap|Grammar & Tense Trap|Homophone Trap|Trap Option)\]\s*/i, "");

  if (isCorrect) {
    return `[Natural Response] ${exp}`;
  }

  const prefixMap: Record<string, string> = {
    "keigo-mismatch": "[Keigo Mismatch Trap]",
    "register-mismatch": "[Register Mismatch Trap]",
    "wrong-intent": "[Pragmatic Intent Trap]",
    "grammar-tense-trap": "[Grammar & Tense Trap]",
    "homophone-trap": "[Homophone Trap]",
  };

  const tag = (trapType && prefixMap[trapType]) || "[Trap Option]";
  return `${tag} ${exp}`;
}

async function main(): Promise<void> {
  const apiKey = loadEnvLocal();
  if (!apiKey) {
    throw new Error("DEEPL_API_KEY is missing from .env.local or process.env");
  }

  console.log("=== DeepL API Status Before ===");
  const usageBefore = await getDeepLUsage(apiKey);
  console.log(`Used: ${usageBefore.used.toLocaleString()} / ${usageBefore.limit.toLocaleString()} chars`);
  console.log(`Remaining: ${(usageBefore.limit - usageBefore.used).toLocaleString()} chars\n`);

  const cache = loadCache();
  console.log(`Loaded ${Object.keys(cache).length.toLocaleString()} existing translations from cache.`);

  // Load INSTANT_REPLY_ITEMS from disk directly
  const dataFilePath = resolve(ROOT, "src/data/jlpt/instantReplyData.ts");
  const items: InstantReplyItem[] = JSON.parse(
    JSON.stringify(INSTANT_REPLY_ITEMS)
  );

  console.log(`\nGathering all options across ${items.length} Instant Reply triads...`);
  const allOptions: { item: InstantReplyItem; opt: InstantReplyOptionData; text: string }[] = [];
  for (const item of items) {
    for (const opt of item.options) {
      allOptions.push({ item, opt, text: opt.explanation.trim() });
    }
  }

  console.log(`Total options to process: ${allOptions.length}`);

  // Batch polish in chunks of 50
  const CHUNK_SIZE = 50;
  for (let c = 0; c < allOptions.length; c += CHUNK_SIZE) {
    const chunk = allOptions.slice(c, c + CHUNK_SIZE);
    const texts = chunk.map((o) => o.text);

    try {
      const polished = await rephraseBatchDeepL(texts, apiKey, cache);
      for (let k = 0; k < chunk.length; k++) {
        const target = chunk[k]!;
        const polishedText = polished[k] || target.text;
        target.opt.explanation = formatDiagnosticExplanation(
          polishedText,
          target.opt.isCorrect,
          target.opt.trapType
        );
      }
    } catch (err) {
      console.error(`Error at chunk ${c}:`, err instanceof Error ? err.message : err);
    }

    process.stdout.write(`  DeepL Progress: ${Math.min(c + CHUNK_SIZE, allOptions.length)}/${allOptions.length}\r`);
  }
  console.log("");

  saveCache(cache);

  // Write updated data back to src/data/jlpt/instantReplyData.ts
  const fileHeader = `// Auto-generated by scripts/build-instant-reply-data.ts
// Contains 170 JLPT N5-N1 Instant Reply Blitz (即時応答 — Listening Mondai 4/5) conversational triads.

export type TrapCategory =
  | "keigo-mismatch"
  | "homophone-trap"
  | "register-mismatch"
  | "wrong-intent"
  | "grammar-tense-trap";

export interface InstantReplyOptionData {
  id: string;
  ja: string;
  reading: string;
  furigana?: string;
  en: string;
  isCorrect: boolean;
  trapType?: TrapCategory;
  explanation: string;
}

export interface InstantReplyItem {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  category: "quick-response" | "situational-utterance";
  situationContext: string;
  speakerRole: string;
  promptJa: string;
  promptReading: string;
  promptFurigana?: string;
  promptEn: string;
  options: [
    InstantReplyOptionData,
    InstantReplyOptionData,
    InstantReplyOptionData,
  ];
}

export const INSTANT_REPLY_ITEMS: readonly InstantReplyItem[] = `;

  writeFileSync(
    dataFilePath,
    `${fileHeader}${JSON.stringify(items, null, 2)};\n`,
    "utf8"
  );
  console.log(`Saved updated dataset to ${dataFilePath}`);

  const usageAfter = await getDeepLUsage(apiKey);
  const charsSpent = usageAfter.used - usageBefore.used;

  console.log(`\n=== Final Summary ===`);
  console.log(`Options enriched with diagnostic explanations : ${allOptions.length.toLocaleString()}`);
  console.log(`Characters spent in DeepL                     : ${charsSpent.toLocaleString()} chars`);
  console.log(`Characters remaining                          : ${(usageAfter.limit - usageAfter.used).toLocaleString()} chars (${(((usageAfter.limit - usageAfter.used) / usageAfter.limit) * 100).toFixed(1)}% free)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
