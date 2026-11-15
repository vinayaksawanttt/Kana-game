import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GrammarLevelFile, GrammarPoint, GrammarExample } from "../src/data/grammar";

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

async function translateBatchDeepL(
  texts: string[],
  apiKey: string,
  cache: Record<string, string>
): Promise<string[]> {
  const results: string[] = new Array(texts.length).fill("");
  const toFetchIndices: number[] = [];
  const toFetchTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = `ja->en:active-intent:${texts[i]}`;
    if (cache[key]) {
      results[i] = cache[key];
    } else {
      toFetchIndices.push(i);
      toFetchTexts.push(texts[i]);
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
        "Japanese active production challenge for grammar learning. Translate each sentence into a direct, active communicative intent in natural English (e.g. among all options, you like sushi the best, she swims the fastest in class).",
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
    const rawTranslated = (translations[j]?.text || "").trim();
    results[origIdx] = rawTranslated;
    const cacheKey = `ja->en:active-intent:${texts[origIdx]}`;
    cache[cacheKey] = rawTranslated;
  }

  return results;
}

export function cleanGrammarPattern(pattern: string, title: string): string {
  let p = (pattern || title.split("(")[0] || "").trim();
  p = p.replace(/\s*\([^\)]*\)/g, "");
  p = p.replace(/^[A-Z]\s*/, "");
  p = p.replace(/\s*[A-Z]$/, "");
  p = p.replace(/^A[。、\s]*/, "");
  p = p.replace(/[。、\s]*B[。、\s]*$/, "");
  p = p.replace(/^[Noun|Verb|Adjective|\s\+]+/i, "");
  p = p.replace(/^(い-Adjective|な-adjective|Verb|Noun)\s*/i, "");
  p = p.replace(/[～~]+$/, "").trim();
  p = p.replace(/^[～~]+/, "").trim();
  p = p.replace(/[。、]/g, "").trim();
  p = p.replace(/いちばん/g, "一番");
  p = p.replace(/[AB]/g, "〜");
  p = p.replace(/\s+/g, "");
  p = p.replace(/〜+/g, "〜");
  if (!p.startsWith("〜")) p = "〜" + p;
  return p;
}

export function getGrammarDescriptor(point: GrammarPoint): string {
  const m = (point.meaning + " " + (point.short || "") + " " + point.title).toLowerCase();
  if (m.includes("superlative") || point.title.includes("ichiban") || point.id.includes("ichiban")) return "superlative";
  if (m.includes("not as") || m.includes("hodo ~ nai") || m.includes("hodo ～ arimasen") || point.id.includes("hodo")) return "negative comparison";
  if (m.includes("compar") || m.includes("more than") || m.includes("less than") || m.includes("hou ga") || point.id.includes("yori")) return "comparative";
  if (m.includes("contrast") || m.includes("however") || m.includes("although") || m.includes("but") || m.includes("keredomo") || m.includes("shikashi") || m.includes("demo")) return "contrast";
  if (m.includes("prohibit") || m.includes("must not") || m.includes("wa ikemasen") || m.includes("wa ikenai")) return "prohibition";
  if (m.includes("permiss") || m.includes("may i") || m.includes("may do") || m.includes("allowed") || m.includes("mo ii")) return "permission";
  if (m.includes("obligat") || m.includes("must do") || m.includes("have to") || m.includes("nakereba") || m.includes("nakute wa")) return "obligation";
  if (m.includes("polite request") || m.includes("te kudasai") || m.includes("kudasaimasen ka") || m.includes("onegai")) return "polite request";
  if (m.includes("request") || m.includes("te kure") || m.includes("choudai")) return "request";
  if (m.includes("suggest") || m.includes("invit") || m.includes("let’s") || m.includes("lets") || m.includes("mashou") || m.includes("masen ka") || m.includes("tara dou")) return "suggestion";
  if (m.includes("desire") || m.includes("want") || m.includes("tai") || m.includes("hoshii")) return "desire";
  if (m.includes("intent") || m.includes("plan") || m.includes("tsumori") || m.includes("yotei") || m.includes("koto ni suru")) return "intention";
  if (m.includes("reason") || m.includes("because") || m.includes("since") || m.includes("kara") || m.includes("node")) return "reason";
  if (m.includes("purpose") || m.includes("in order to") || m.includes("tame ni") || m.includes("you ni")) return "purpose";
  if (m.includes("change") || m.includes("become") || m.includes("ku suru") || m.includes("ni naru") || m.includes("ni suru")) return "change of state";
  if (m.includes("condition") || m.includes(" if ") || m.includes("tara") || m.includes(" ba ") || m.includes("nara")) return "conditional";
  if (m.includes("simultaneous") || m.includes("while") || m.includes("nagara")) return "simultaneous action";
  if (m.includes("potential") || m.includes("able to") || m.includes("can ") || m.includes("koto ga dekiru")) return "potential";
  if (m.includes("passive") || m.includes("rareru")) return "passive";
  if (m.includes("causative") || m.includes("saseru")) return "causative";
  if (m.includes("only") || m.includes("nothing but") || m.includes("just") || m.includes("limitation") || m.includes("shika") || m.includes("dake") || m.includes("bakari")) return "limitation";
  if (m.includes("too much") || m.includes("excess") || m.includes("sugiru")) return "excess";
  if (m.includes("listing") || m.includes("such as") || m.includes("toka") || m.includes("tari")) return "listing";
  if (m.includes("experience") || m.includes("koto ga aru")) return "experience";
  if (m.includes("giving") || m.includes("receiving") || m.includes("ageru") || m.includes("kureru") || m.includes("morau")) return "giving and receiving";
  return "";
}

export function cleanDirectiveClause(en: string): string {
  let s = en.trim().replace(/[\.\!]+$/, "").trim();
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/^of these,\s*/i, "among all options, ");
  s = s.replace(/^out of all of these,\s*/i, "among all options, ");
  s = s.replace(/^of all these,\s*/i, "among all options, ");
  s = s.replace(/^among these,\s*/i, "among all options, ");
  s = s
    .replace(/\bI am\b/g, "you are")
    .replace(/\bI'm\b/g, "you are")
    .replace(/\bI have been\b/g, "you have been")
    .replace(/\bI have\b/g, "you have")
    .replace(/\bI've\b/g, "you have")
    .replace(/\bI will\b/g, "you will")
    .replace(/\bI'll\b/g, "you will")
    .replace(/\bI would\b/g, "you would")
    .replace(/\bI'd like\b/g, "you want")
    .replace(/\bI'd\b/g, "you would")
    .replace(/\bI can\b/g, "you can")
    .replace(/\bI cannot\b/g, "you cannot")
    .replace(/\bI can't\b/g, "you cannot")
    .replace(/\bI could\b/g, "you could")
    .replace(/\bI\b/g, "you")
    .replace(/\bmy\b/g, "your")
    .replace(/\bmine\b/g, "yours")
    .replace(/\bme\b/g, "you")
    .replace(/\bwe are\b/g, "you are")
    .replace(/\bwe're\b/g, "you are")
    .replace(/\bwe will\b/g, "you will")
    .replace(/\bwe'll\b/g, "you will")
    .replace(/\bwe\b/g, "you")
    .replace(/\bour\b/g, "your")
    .replace(/\bours\b/g, "yours")
    .replace(/\bus\b/g, "you");
  return s;
}

export function formatActiveDirective(clause: string, point: GrammarPoint, jp: string): string {
  const desc = getGrammarDescriptor(point);
  const pattern = cleanGrammarPattern(point.pattern, point.title);
  const cue = desc ? `using ${desc} ${pattern}` : `using ${pattern}`;

  if (/^please\s+/i.test(clause) || desc === "polite request" || /てください|てくれ/i.test(jp)) {
    const act = clause.replace(/^please\s+/i, "");
    const cleanAct = act.charAt(0).toLowerCase() + act.slice(1);
    return `Politely ask someone to ${cleanAct} ${cue}`;
  }

  if (/^let's\s+/i.test(clause) || desc === "suggestion" || /ましょう|ませんか|ようか|たらどう/i.test(jp)) {
    let act = clause.replace(/^let's\s+/i, "").replace(/^shall we\s+/i, "");
    act = act.charAt(0).toLowerCase() + act.slice(1);
    return `Suggest that you ${act} ${cue}`;
  }

  if (
    clause.endsWith("?") ||
    /^(is it|do you|can you|what|where|when|why|how)\b/i.test(clause) ||
    /か[？\?]?$/.test(jp.trim())
  ) {
    let q = clause.replace(/\?$/, "");
    q = q.charAt(0).toLowerCase() + q.slice(1);
    return `Ask whether ${q} ${cue}`;
  }

  if (desc === "prohibition" || /must not|not allowed/i.test(clause) || /てはいけ/i.test(jp)) {
    let p = clause
      .replace(/^you must not\s+/i, "one must not ")
      .replace(/^you are not allowed to\s+/i, "it is not allowed to ");
    p = p.charAt(0).toLowerCase() + p.slice(1);
    return `Warn that ${p} ${cue}`;
  }

  if (desc === "contrast" || /however|although|but/i.test(clause) || /けれども|しかし|けど/i.test(jp)) {
    let p = clause
      .replace(/\. However,\s*/i, ", but ")
      .replace(/\. But,\s*/i, ", but ")
      .replace(/\. But\s*/i, ", but ");
    p = p.charAt(0).toLowerCase() + p.slice(1);
    return `State that ${p} ${cue}`;
  }

  let p = clause.charAt(0).toLowerCase() + clause.slice(1);
  return `State that ${p} ${cue}`;
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

  const levels = ["N5", "N4"];
  let totalSentencesEnriched = 0;

  for (const lvl of levels) {
    const filePath = resolve(ROOT, `public/data/v1/grammar/${lvl}.json`);
    const rawData = JSON.parse(readFileSync(filePath, "utf8")) as GrammarLevelFile;
    const points = rawData.points || [];

    // Flatten all examples to batch translate uncached sentences
    const sentenceList: { point: GrammarPoint; example: GrammarExample; jp: string }[] = [];
    for (const point of points) {
      for (const ex of point.examples || []) {
        const jp = (ex.ja || ex.jp).trim();
        sentenceList.push({ point, example: ex, jp });
      }
    }

    console.log(`\n[${lvl}] Total points: ${points.length} | Total examples: ${sentenceList.length}`);

    // Batch translate uncached sentences
    const uniqueJp = Array.from(new Set(sentenceList.map((s) => s.jp)));
    const uncachedJp = uniqueJp.filter((jp) => !cache[`ja->en:active-intent:${jp}`]);
    console.log(`  [${lvl}] Uncached sentences to translate with DeepL: ${uncachedJp.length} / ${uniqueJp.length}`);

    const CHUNK_SIZE = 50;
    for (let c = 0; c < uncachedJp.length; c += CHUNK_SIZE) {
      const chunk = uncachedJp.slice(c, c + CHUNK_SIZE);
      try {
        await translateBatchDeepL(chunk, apiKey, cache);
      } catch (err) {
        console.error(`  Error translating chunk at ${c} for ${lvl}:`, err instanceof Error ? err.message : err);
      }
      process.stdout.write(`  [${lvl}] DeepL Progress: ${Math.min(c + CHUNK_SIZE, uncachedJp.length)}/${uncachedJp.length}\r`);
    }

    if (uncachedJp.length > 0) {
      console.log("");
    }

    // Assign promptEn to each example
    for (const item of sentenceList) {
      const translated = cache[`ja->en:active-intent:${item.jp}`] || item.example.naturalEn || item.example.en;
      const clause = cleanDirectiveClause(translated);
      const promptEn = formatActiveDirective(clause, item.point, item.jp);
      item.example.promptEn = promptEn;
      totalSentencesEnriched++;
    }

    // Write back to public/data/v1/grammar/${lvl}.json
    writeFileSync(filePath, `${JSON.stringify(rawData, null, 2)}\n`, "utf8");

    // Also update src/data/grammar/grammar_ja_${lvl}_full_alphabetical_0001.json if it exists
    const srcPath = resolve(ROOT, `src/data/grammar/grammar_ja_${lvl}_full_alphabetical_0001.json`);
    if (existsSync(srcPath)) {
      try {
        const srcRaw = JSON.parse(readFileSync(srcPath, "utf8"));
        if (Array.isArray(srcRaw)) {
          for (let pIdx = 0; pIdx < srcRaw.length && pIdx < points.length; pIdx++) {
            const rawP = srcRaw[pIdx];
            const matchingPoint = points[pIdx];
            if (rawP && matchingPoint && Array.isArray(rawP.examples) && Array.isArray(matchingPoint.examples)) {
              for (let eIdx = 0; eIdx < rawP.examples.length && eIdx < matchingPoint.examples.length; eIdx++) {
                if (matchingPoint.examples[eIdx]?.promptEn) {
                  rawP.examples[eIdx].promptEn = matchingPoint.examples[eIdx].promptEn;
                }
              }
            }
          }
          writeFileSync(srcPath, `${JSON.stringify(srcRaw, null, 2)}\n`, "utf8");
        }
      } catch (err) {
        console.warn(`Could not update ${srcPath}:`, err);
      }
    }
  }

  saveCache(cache);
  console.log(`Saved updated cache (${Object.keys(cache).length.toLocaleString()} total entries).`);

  const usageAfter = await getDeepLUsage(apiKey);
  const charsSpent = usageAfter.used - usageBefore.used;

  console.log(`\n=== Final Summary ===`);
  console.log(`Total sentences enriched with promptEn : ${totalSentencesEnriched.toLocaleString()}`);
  console.log(`Characters spent in DeepL             : ${charsSpent.toLocaleString()} chars`);
  console.log(`Characters remaining                  : ${(usageAfter.limit - usageAfter.used).toLocaleString()} chars (${(((usageAfter.limit - usageAfter.used) / usageAfter.limit) * 100).toFixed(1)}% free)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
