import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  romaji: string;
  meanings: string[];
  level: string;
  pos?: string[];
  jmdict_id?: number;
  synonyms?: string[];
  examples?: unknown[];
  reversePrompt?: string;
}

const COMMON_SYNONYMS_MAP: Record<string, string[]> = {
  // Common verbs
  "meet": ["encounter", "see", "greet"],
  "eat": ["consume", "have a meal", "dine"],
  "drink": ["beverage", "swallow", "sip"],
  "see": ["look", "watch", "view", "observe"],
  "hear": ["listen", "catch sounds", "perceive"],
  "listen": ["hear", "pay attention", "heed"],
  "speak": ["talk", "say", "converse", "tell"],
  "talk": ["speak", "chat", "converse"],
  "write": ["compose", "inscribe", "pen"],
  "read": ["peruse", "examine"],
  "buy": ["purchase", "acquire", "shop for"],
  "sell": ["vend", "market", "trade"],
  "go": ["travel", "proceed", "head to", "depart"],
  "come": ["arrive", "approach"],
  "return": ["go back", "come back", "head home"],
  "run": ["jog", "sprint", "dash"],
  "walk": ["stroll", "pace", "step"],
  "sleep": ["rest", "slumber", "nap", "fall asleep"],
  "wake up": ["awaken", "get up", "rise"],
  "start": ["begin", "commence", "initiate", "set off"],
  "begin": ["start", "commence", "open"],
  "finish": ["end", "complete", "conclude", "wrap up"],
  "end": ["finish", "conclude", "terminate"],
  "learn": ["study", "acquire knowledge", "master"],
  "study": ["learn", "examine", "cram"],
  "teach": ["instruct", "educate", "guide"],
  "wait": ["await", "hold on", "stand by"],
  "stand": ["rise", "stand up"],
  "sit": ["sit down", "take a seat", "be seated"],
  "enter": ["go in", "come in", "step into"],
  "exit": ["leave", "go out", "depart"],
  "make": ["create", "produce", "build", "craft"],
  "do": ["perform", "execute", "carry out"],
  "give": ["present", "hand over", "provide"],
  "receive": ["get", "accept", "take"],
  "take": ["grab", "hold", "pick up"],
  "use": ["utilize", "apply", "employ"],
  "help": ["assist", "aid", "support"],
  "know": ["understand", "be aware", "recognize"],
  "understand": ["comprehend", "grasp", "realize", "get"],
  "abandon": ["give up", "relinquish", "drop"],
  "give up": ["abandon", "quit", "surrender", "relinquish"],
  "get tired of": ["get bored of", "lose interest in", "tire of"],
  "signal": ["sign", "cue", "gesture"],
  "greeting": ["salutation", "welcome", "regards"],

  // Adjectives
  "big": ["large", "huge", "great", "giant", "vast"],
  "large": ["big", "huge", "great", "immense", "vast"],
  "small": ["little", "tiny", "mini", "compact"],
  "little": ["small", "tiny", "slight"],
  "quick": ["fast", "rapid", "swift", "speedy", "brisk"],
  "fast": ["quick", "rapid", "swift", "speedy"],
  "slow": ["sluggish", "unhurried", "leisurely", "delayed"],
  "good": ["nice", "fine", "excellent", "pleasant", "great"],
  "bad": ["poor", "terrible", "awful", "unfavorable"],
  "new": ["fresh", "recent", "modern", "novel"],
  "old": ["aged", "ancient", "antique", "former"],
  "hot": ["warm", "scorching", "heated", "boiling"],
  "cold": ["chilly", "cool", "freezing", "frigid"],
  "high": ["tall", "elevated", "lofty", "steep"],
  "expensive": ["costly", "pricey", "dear", "high-priced"],
  "cheap": ["inexpensive", "affordable", "low-cost", "budget"],
  "easy": ["simple", "effortless", "straightforward", "uncomplicated"],
  "difficult": ["hard", "challenging", "tough", "arduous"],
  "happy": ["glad", "joyful", "cheerful", "pleased", "content"],
  "sad": ["sorrowful", "unhappy", "depressed", "gloomy"],
  "strong": ["powerful", "mighty", "sturdy", "robust", "firm"],
  "weak": ["frail", "feeble", "delicate", "faint"],
  "clear": ["obvious", "evident", "plain", "distinct"],
  "obvious": ["clear", "evident", "plain", "apparent"],

  // Nouns
  "friend": ["companion", "buddy", "pal", "mate", "associate"],
  "person": ["individual", "human", "someone", "party"],
  "people": ["persons", "crowd", "public", "individuals"],
  "house": ["home", "residence", "dwelling", "abode"],
  "home": ["house", "residence", "household"],
  "room": ["chamber", "space", "quarters"],
  "school": ["academy", "institution", "college"],
  "teacher": ["instructor", "educator", "tutor", "sensei", "master"],
  "student": ["pupil", "learner", "scholar"],
  "car": ["automobile", "vehicle", "motorcar", "auto"],
  "book": ["volume", "tome", "publication", "text"],
  "money": ["currency", "funds", "cash", "coins"],
  "time": ["hour", "moment", "period", "occasion"],
  "water": ["liquid", "aqua", "h2o"],
  "food": ["meal", "fare", "cuisine", "nourishment", "edibles"],
};

function cleanGloss(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(to|a|an|the|be)\s+/i, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[.!?]+$/, "")
    .trim();
}

function extractCandidatesFromMeanings(entry: VocabEntry): Set<string> {
  const cands = new Set<string>();
  const meanings = entry.meanings || [];

  for (const m of meanings) {
    const rawClean = cleanGloss(m);
    if (rawClean && rawClean.length > 1) {
      cands.add(rawClean);
      if (COMMON_SYNONYMS_MAP[rawClean]) {
        for (const s of COMMON_SYNONYMS_MAP[rawClean]) cands.add(s);
      }
    }

    // Split on separators (e.g. "greeting, salutation")
    for (const part of m.split(/[,;/]+/)) {
      const p = cleanGloss(part);
      if (p && p.length > 1) {
        cands.add(p);
        if (COMMON_SYNONYMS_MAP[p]) {
          for (const s of COMMON_SYNONYMS_MAP[p]) cands.add(s);
        }
      }
    }
  }

  return cands;
}

const CACHE_FILE = resolve(process.cwd(), "data-raw/deepl-cache.json");

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
    const key = `ja->en:gloss:${texts[i]}`;
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
      target_lang: "EN",
      context:
        "Japanese-English dictionary headword list. Translate each Japanese word into its concise, lowercase English dictionary gloss.",
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
    const rawTranslated = translations[j]?.text || "";
    const clean = cleanGloss(rawTranslated);
    results[origIdx] = clean;
    const cacheKey = `ja->en:gloss:${texts[origIdx]}`;
    cache[cacheKey] = clean;
  }

  return results;
}

async function main() {
  const envPath = resolve(process.cwd(), ".env.local");
  let apiKey = "";
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const l of lines) {
      if (l.startsWith("DEEPL_API_KEY=")) {
        apiKey = l.split("=")[1].trim();
      }
    }
  }

  if (!apiKey) {
    console.error("Missing DEEPL_API_KEY in .env.local");
    process.exit(1);
  }

  const usageBefore = await getDeepLUsage(apiKey);
  console.log(`\n=== DeepL API Status Before ===`);
  console.log(`Used: ${usageBefore.used.toLocaleString()} / ${usageBefore.limit.toLocaleString()} chars`);
  console.log(`Remaining: ${(usageBefore.limit - usageBefore.used).toLocaleString()} chars\n`);

  const cache = loadCache();
  console.log(`Loaded ${Object.keys(cache).length.toLocaleString()} existing translations from cache.`);

  const levels = ["N3", "N2", "N1"];
  let totalWordsEnriched = 0;
  let totalSynonymsAdded = 0;

  for (const lvl of levels) {
    const filePath = resolve(process.cwd(), `public/data/v1/vocabulary/${lvl}.json`);
    const openJlptPath = resolve(process.cwd(), `data-raw/openjlpt/vocab/${lvl.toLowerCase()}.json`);

    const raw = readFileSync(filePath, "utf8");
    const entries: VocabEntry[] = JSON.parse(raw);

    // Identify entries needing synonym expansion
    const needTranslation: { index: number; text: string }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const existingSyn = new Set<string>((entry.synonyms || []).map(cleanGloss).filter(Boolean));
      const extracted = extractCandidatesFromMeanings(entry);

      for (const s of extracted) {
        existingSyn.add(s);
      }

      // If synonyms count is still <= 1, queue Japanese word for DeepL translation
      if (existingSyn.size <= 1) {
        needTranslation.push({ index: i, text: entry.word || entry.reading });
      }

      entry.synonyms = Array.from(existingSyn);
    }

    console.log(`[${lvl}] ${entries.length} words total | ${needTranslation.length} words queued for DeepL gloss translation...`);

    // Batch translate in chunks of 50
    const CHUNK_SIZE = 50;
    for (let c = 0; c < needTranslation.length; c += CHUNK_SIZE) {
      const chunk = needTranslation.slice(c, c + CHUNK_SIZE);
      const texts = chunk.map((item) => item.text);

      try {
        const translated = await translateBatchDeepL(texts, apiKey, cache);
        for (let k = 0; k < chunk.length; k++) {
          const entryIdx = chunk[k].index;
          const trans = translated[k];
          if (trans && trans.length > 1) {
            const currentSet = new Set(entries[entryIdx].synonyms || []);
            currentSet.add(trans);
            if (COMMON_SYNONYMS_MAP[trans]) {
              for (const s of COMMON_SYNONYMS_MAP[trans]) currentSet.add(s);
            }
            entries[entryIdx].synonyms = Array.from(currentSet);
          }
        }
      } catch (err) {
        console.error(`Error translating chunk at ${c} for ${lvl}:`, err instanceof Error ? err.message : err);
      }

      process.stdout.write(`  [${lvl}] Progress: ${Math.min(c + CHUNK_SIZE, needTranslation.length)}/${needTranslation.length}\r`);
    }

    console.log(`\n  [${lvl}] Saving updated dataset with enriched synonyms...`);

    // Clean up synonyms: filter out empty, duplicate, or identical to original headword
    for (const entry of entries) {
      const primaryMeanings = new Set((entry.meanings || []).map((m) => cleanGloss(m)));
      const filtered = (entry.synonyms || []).filter(
        (syn) => syn && syn.length > 1 && !primaryMeanings.has(syn)
      );
      entry.synonyms = filtered.length > 0 ? Array.from(new Set(filtered)) : undefined;
      if (entry.synonyms) {
        totalWordsEnriched++;
        totalSynonymsAdded += entry.synonyms.length;
      }
    }

    writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    if (existsSync(openJlptPath)) {
      writeFileSync(openJlptPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
    }
  }

  saveCache(cache);
  console.log(`Saved updated cache (${Object.keys(cache).length.toLocaleString()} total entries).`);

  const usageAfter = await getDeepLUsage(apiKey);
  const charsSpent = usageAfter.used - usageBefore.used;

  console.log(`\n=== Final Summary ===`);
  console.log(`Words with active synonyms: ${totalWordsEnriched.toLocaleString()}`);
  console.log(`Total synonyms available  : ${totalSynonymsAdded.toLocaleString()}`);
  console.log(`Characters spent in DeepL : ${charsSpent.toLocaleString()} chars`);
  console.log(`Characters remaining      : ${(usageAfter.limit - usageAfter.used).toLocaleString()} chars (${((usageAfter.limit - usageAfter.used) / usageAfter.limit * 100).toFixed(1)}% free)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
