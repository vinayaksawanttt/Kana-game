import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const SCENARIOS_DIR = resolve(ROOT, "src/data/dialogue/scenarios");
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

async function translateBatchDeepL(
  texts: string[],
  apiKey: string,
  cache: Record<string, string>
): Promise<string[]> {
  const results: string[] = new Array(texts.length).fill("");
  const toFetchIndices: number[] = [];
  const toFetchTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = `ja->en:dialogue-feedback:${texts[i].trim()}`;
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
  const endpoint = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: toFetchTexts,
      source_lang: "JA",
      target_lang: "EN-US",
      context:
        "Japanese sociopragmatic dialogue game. Translate situational feedback explaining subtle social distance, politeness register mismatch, and interpersonal boundary effects for language learners.",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL Translation API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const translations = data.translations || [];

  for (let j = 0; j < toFetchIndices.length; j++) {
    const origIdx = toFetchIndices[j];
    const trans = (translations[j]?.text || toFetchTexts[j]).trim();
    results[origIdx] = trans;
    const cacheKey = `ja->en:dialogue-feedback:${toFetchTexts[j]}`;
    cache[cacheKey] = trans;
  }

  return results;
}

function buildSocialDistanceGuidance(tier: string, points: number, translatedJa: string): string {
  const cleanTrans = translatedJa.trim().replace(/^"|"$/g, "");

  if (tier === "rude" || points < 0) {
    return `[Social Distance: Blunt Imperative] Using blunt commands or aggressive phrasing severely breaches social boundaries and alarms your listener; courteous inquiries are essential. ${cleanTrans}`;
  }

  if (tier === "casual" && points < 80) {
    return `[Social Distance: Casual Slang] Using informal speech or casual slang breaches interpersonal distance and creates awkwardness; polite forms (desu/masu) maintain comfortable initial boundaries. ${cleanTrans}`;
  }

  if (tier === "awkward" || (points >= 0 && points <= 60)) {
    return `[Social Distance: Pragmatic Mismatch] The phrasing or timing breaches expected conversational etiquette; adjusting your register keeps the interaction smooth. ${cleanTrans}`;
  }

  if (tier === "respectful" && points < 80) {
    return `[Social Distance: Overly Formal] Excessive formal keigo creates an artificial emotional barrier; natural polite speech maintains warm, accessible rapport. ${cleanTrans}`;
  }

  if (tier === "respectful" && points >= 80) {
    return `[Social Distance: Exemplary Keigo] Flawless formal etiquette honoring social hierarchy and professional boundaries. ${cleanTrans}`;
  }

  // tier === "polite" or natural
  return `[Social Distance: Natural Rapport] Maintains ideal social distance with friendly politeness, putting the other person at ease. ${cleanTrans}`;
}

interface ParsedChoiceRef {
  file: string;
  id: string;
  tier: string;
  points: number;
  rawFeedbackJa: string;
  cleanFeedbackJa: string;
  rawFeedbackEn: string;
  fullMatch: string;
  startIdx: number;
  endIdx: number;
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

  const scenarioFiles = readdirSync(SCENARIOS_DIR).filter((f) => f.endsWith(".ts"));
  console.log(`Found ${scenarioFiles.length} scenario files in ${SCENARIOS_DIR}`);

  const allChoices: ParsedChoiceRef[] = [];
  const fileContents: Record<string, string> = {};

  for (const file of scenarioFiles) {
    const filePath = join(SCENARIOS_DIR, file);
    const content = readFileSync(filePath, "utf8");
    fileContents[file] = content;

    const choiceRegex =
      /id:\s*["']([^"']+)["'][\s\S]*?tier:\s*["']([^"']+)["'][\s\S]*?points:\s*(-?\d+)[\s\S]*?feedbackJa:\s*([\s\S]*?),\s*feedbackEn:\s*([\s\S]*?),\s*nextNodeId/g;

    let m;
    while ((m = choiceRegex.exec(content)) !== null) {
      const id = m[1];
      const tier = m[2];
      const points = parseInt(m[3], 10);
      const rawFeedbackJa = m[4].trim();
      const rawFeedbackEn = m[5].trim();

      // Clean unescaped quotes from raw string
      let cleanJa = rawFeedbackJa;
      if ((cleanJa.startsWith('"') && cleanJa.endsWith('"')) || (cleanJa.startsWith("'") && cleanJa.endsWith("'")) || (cleanJa.startsWith("`") && cleanJa.endsWith("`"))) {
        cleanJa = cleanJa.slice(1, -1);
      }
      cleanJa = cleanJa.replace(/\\"/g, '"').replace(/\s+/g, " ").trim();

      allChoices.push({
        file,
        id,
        tier,
        points,
        rawFeedbackJa,
        cleanFeedbackJa: cleanJa,
        rawFeedbackEn,
        fullMatch: m[0],
        startIdx: m.index,
        endIdx: m.index + m[0].length,
      });
    }
  }

  console.log(`Total branching choices parsed: ${allChoices.length}`);

  // Batch translate uncached feedbackJa strings
  const uniqueJaTexts = Array.from(new Set(allChoices.map((c) => c.cleanFeedbackJa).filter(Boolean)));
  const uncachedJa = uniqueJaTexts.filter((ja) => !cache[`ja->en:dialogue-feedback:${ja}`]);
  console.log(`Uncached Japanese feedback strings to translate with DeepL: ${uncachedJa.length} / ${uniqueJaTexts.length}`);

  const CHUNK_SIZE = 50;
  for (let c = 0; c < uncachedJa.length; c += CHUNK_SIZE) {
    const chunk = uncachedJa.slice(c, c + CHUNK_SIZE);
    try {
      await translateBatchDeepL(chunk, apiKey, cache);
    } catch (err) {
      console.error(`Error translating chunk at ${c}:`, err instanceof Error ? err.message : err);
    }
    process.stdout.write(`  DeepL Progress: ${Math.min(c + CHUNK_SIZE, uncachedJa.length)}/${uncachedJa.length}\r`);
  }
  if (uncachedJa.length > 0) {
    console.log("");
  }

  saveCache(cache);

  // Group by file and rewrite scenario files
  for (const file of scenarioFiles) {
    let content = fileContents[file];
    const fileChoices = allChoices.filter((c) => c.file === file);

    for (const choice of fileChoices) {
      const translatedJa = cache[`ja->en:dialogue-feedback:${choice.cleanFeedbackJa}`] || choice.rawFeedbackEn;
      const enhancedFeedbackEn = buildSocialDistanceGuidance(choice.tier, choice.points, translatedJa);

      // Escape quotes for TypeScript file
      const escapedEn = enhancedFeedbackEn.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      // Replace feedbackEn in content for this choice
      const targetPattern = `id: "${choice.id}"`;
      const targetPatternSingle = `id: '${choice.id}'`;

      const idPos = content.indexOf(targetPattern) !== -1 ? content.indexOf(targetPattern) : content.indexOf(targetPatternSingle);
      if (idPos !== -1) {
        const nextNodePos = content.indexOf("nextNodeId", idPos);
        if (nextNodePos !== -1) {
          const choiceSlice = content.slice(idPos, nextNodePos);
          const updatedChoiceSlice = choiceSlice.replace(
            /feedbackEn:\s*[\s\S]*?$/,
            `feedbackEn:\n          "${escapedEn}",\n        `
          );
          content = content.slice(0, idPos) + updatedChoiceSlice + content.slice(nextNodePos);
        }
      }
    }

    const filePath = join(SCENARIOS_DIR, file);
    writeFileSync(filePath, content, "utf8");
    console.log(`  Updated ${file}`);
  }

  const usageAfter = await getDeepLUsage(apiKey);
  const charsSpent = usageAfter.used - usageBefore.used;

  console.log(`\n=== Final Summary ===`);
  console.log(`Total choices enriched with social distance nuance : ${allChoices.length.toLocaleString()}`);
  console.log(`Characters spent in DeepL                          : ${charsSpent.toLocaleString()} chars`);
  console.log(`Characters remaining                               : ${(usageAfter.limit - usageAfter.used).toLocaleString()} chars (${(((usageAfter.limit - usageAfter.used) / usageAfter.limit) * 100).toFixed(1)}% free)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
