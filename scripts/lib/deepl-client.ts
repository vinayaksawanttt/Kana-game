import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type TranslationMode = "gloss" | "sentence" | "story-sentence" | "grammar-note";

export interface DeepLUsage {
  character_count: number;
  character_limit: number;
}

export interface TranslateBatchOptions {
  mode: TranslationMode;
  dryRun?: boolean;
  limitChars?: number;
  glossaryId?: string;
}

export interface ContextItem {
  text: string;
  context?: string;
}

export interface DeepLGlossaryInfo {
  glossary_id: string;
  name: string;
  ready: boolean;
  source_lang: string;
  target_lang: string;
  creation_time: string;
  entry_count: number;
}

export interface TranslateBatchStats {
  totalRequested: number;
  cachedHits: number;
  uncachedTexts: number;
  uncachedChars: number;
  translatedTexts: number;
  translatedChars: number;
}

const GLOSS_CONTEXT =
  "Japanese-English dictionary headword list. Translate each Japanese noun into a concise, lowercase English dictionary gloss (1 to 4 words, no trailing period).";

const SENTENCE_CONTEXT =
  "Japanese JLPT study example sentences. Translate each Japanese sentence into natural, clear English for language learners.";

export function loadEnvLocal(root = process.cwd()): void {
  if (process.env.DEEPL_API_KEY) return;
  const envFile = resolve(root, ".env.local");
  if (!existsSync(envFile)) return;
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
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

export function getDeepLConfig(): { apiKey: string; baseUrl: string } {
  loadEnvLocal();
  const apiKey = process.env.DEEPL_API_KEY?.trim() ?? "";
  const isFree = apiKey.endsWith(":fx") || !apiKey;
  const baseUrl = isFree ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";
  return { apiKey, baseUrl };
}

export function cleanGloss(rawGloss: string): string {
  let cleaned = rawGloss.trim().replace(/\.+$/, "").trim();
  cleaned = cleaned.replace(/^(a|an|the)\s+/i, "").trim();
  if (!cleaned) return rawGloss.trim();
  const words = cleaned.split(/\s+/);
  // Lowercase first word unless it looks like an acronym or proper name with multiple caps
  if (words[0] && /^[A-Z][a-z]+$/.test(words[0])) {
    words[0] = words[0].toLowerCase();
    cleaned = words.join(" ");
  }
  return cleaned;
}

export class DeepLClient {
  private readonly cachePath: string;
  private cache: Record<string, string> = {};
  private loaded = false;

  constructor(cachePath = resolve(process.cwd(), "data-raw/deepl-cache.json")) {
    this.cachePath = cachePath;
  }

  async loadCache(): Promise<void> {
    if (this.loaded) return;
    if (existsSync(this.cachePath)) {
      try {
        const raw = await readFile(this.cachePath, "utf8");
        this.cache = JSON.parse(raw) as Record<string, string>;
      } catch {
        this.cache = {};
      }
    }
    this.loaded = true;
  }

  async saveCache(): Promise<void> {
    await mkdir(dirname(this.cachePath), { recursive: true });
    const sortedKeys = Object.keys(this.cache).sort();
    const ordered: Record<string, string> = {};
    for (const k of sortedKeys) {
      ordered[k] = this.cache[k]!;
    }
    await writeFile(this.cachePath, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
  }

  private getCacheKey(text: string, mode: TranslationMode): string {
    return `ja->en:${mode}:${text.trim()}`;
  }

  getCached(text: string, mode: TranslationMode): string | undefined {
    return this.cache[this.getCacheKey(text, mode)];
  }

  async getUsage(): Promise<DeepLUsage> {
    const { apiKey, baseUrl } = getDeepLConfig();
    if (!apiKey) {
      throw new Error("DEEPL_API_KEY is not set in .env.local or environment.");
    }
    const res = await fetch(`${baseUrl}/usage`, {
      method: "GET",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`DeepL /v2/usage failed (${res.status}): ${body}`);
    }
    return (await res.json()) as DeepLUsage;
  }

  async translateBatch(
    texts: string[],
    options: TranslateBatchOptions
  ): Promise<{ results: Map<string, string>; stats: TranslateBatchStats }> {
    await this.loadCache();

    const uniqueTexts = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
    const results = new Map<string, string>();
    const uncached: string[] = [];

    for (const text of uniqueTexts) {
      const hit = this.getCached(text, options.mode);
      if (hit !== undefined) {
        results.set(text, hit);
      } else {
        uncached.push(text);
      }
    }

    const uncachedChars = uncached.reduce((sum, t) => sum + [...t].length, 0);
    const stats: TranslateBatchStats = {
      totalRequested: uniqueTexts.length,
      cachedHits: results.size,
      uncachedTexts: uncached.length,
      uncachedChars,
      translatedTexts: 0,
      translatedChars: 0,
    };

    if (options.dryRun || uncached.length === 0) {
      return { results, stats };
    }

    const { apiKey, baseUrl } = getDeepLConfig();
    if (!apiKey) {
      throw new Error("DEEPL_API_KEY is not set in .env.local or environment.");
    }

    const toTranslate: string[] = [];
    let runningChars = 0;
    const maxChars = options.limitChars ?? Number.POSITIVE_INFINITY;

    for (const text of uncached) {
      const len = [...text].length;
      if (runningChars + len > maxChars) break;
      toTranslate.push(text);
      runningChars += len;
    }

    const BATCH_SIZE = 50;
    const context = options.mode === "gloss" ? GLOSS_CONTEXT : SENTENCE_CONTEXT;

    for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
      const chunk = toTranslate.slice(i, i + BATCH_SIZE);
      const res = await fetch(`${baseUrl}/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: chunk,
          source_lang: "JA",
          target_lang: "EN-US",
          context,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`DeepL /v2/translate failed (${res.status}) at batch ${i}: ${errBody}`);
      }

      const payload = (await res.json()) as { translations: Array<{ text: string }> };
      if (!payload.translations || payload.translations.length !== chunk.length) {
        throw new Error(`DeepL returned mismatched translation count for batch ${i}.`);
      }

      for (let j = 0; j < chunk.length; j += 1) {
        const srcText = chunk[j]!;
        const rawTarget = payload.translations[j]!.text;
        const formatted = options.mode === "gloss" ? cleanGloss(rawTarget) : rawTarget.trim();
        this.cache[this.getCacheKey(srcText, options.mode)] = formatted;
        results.set(srcText, formatted);
        stats.translatedTexts += 1;
        stats.translatedChars += [...srcText].length;
      }

      // Persist cache after every batch of 50 so interrupted runs never lose progress
      await this.saveCache();

      const progressPct = Math.round(((i + chunk.length) / toTranslate.length) * 100);
      if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= toTranslate.length) {
        console.log(
          `  [DeepL ${options.mode}] ${i + chunk.length}/${toTranslate.length} (${progressPct}%) - ${stats.translatedChars} chars translated`
        );
      }
    }

    return { results, stats };
  }

  async simplifyGloss(
    wordJa: string,
    reading: string,
    rawGlosses: string[]
  ): Promise<string> {
    await this.loadCache();
    const cacheKey = `ja->en:modern-gloss:${wordJa.trim()}`;
    const cached = this.cache[cacheKey];
    if (cached) return cached;

    const { apiKey, baseUrl } = getDeepLConfig();
    if (!apiKey) return rawGlosses[0] ?? wordJa;

    // Try Write API rephrasing on the raw gloss if single English phrase
    const primaryGloss = rawGlosses[0]?.trim() || wordJa;
    try {
      const writeUrl = baseUrl.includes("api-free")
        ? "https://api-free.deepl.com/v2/write/rephrase"
        : "https://api.deepl.com/v2/write/rephrase";
      const writeRes = await fetch(writeUrl, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [primaryGloss],
          target_lang: "EN-US",
          writing_style: "simple",
        }),
      });

      if (writeRes.ok) {
        const payload = (await writeRes.json()) as { improvements?: Array<{ text: string }> };
        if (payload.improvements && payload.improvements[0]?.text) {
          const simplified = cleanGloss(payload.improvements[0].text);
          if (simplified && simplified.length > 0 && simplified !== primaryGloss) {
            this.cache[cacheKey] = simplified;
            await this.saveCache();
            return simplified;
          }
        }
      }
    } catch {
      // Fall through to /v2/translate
    }

    // Fallback: translate the Japanese headword with modern vocabulary flashcard context
    try {
      const transRes = await fetch(`${baseUrl}/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: [wordJa],
          source_lang: "JA",
          target_lang: "EN-US",
          context: `Japanese vocabulary flashcard for ${reading}. Provide a modern, natural 1-3 word everyday English gloss.`,
        }),
      });

      if (transRes.ok) {
        const payload = (await transRes.json()) as { translations?: Array<{ text: string }> };
        if (payload.translations && payload.translations[0]?.text) {
          const formatted = cleanGloss(payload.translations[0].text);
          this.cache[cacheKey] = formatted;
          await this.saveCache();
          return formatted;
        }
      }
    } catch {
      // Ignore network errors and return primary gloss
    }

    return primaryGloss;
  }

  async getOrCreateGrammarGlossary(): Promise<string | undefined> {
    const { apiKey, baseUrl } = getDeepLConfig();
    if (!apiKey) return undefined;

    // Check if cached in deepl-cache.json
    await this.loadCache();
    const cachedId = this.cache["__meta:grammar_glossary_id__"];
    if (cachedId) {
      return cachedId;
    }

    try {
      const listRes = await fetch(`${baseUrl}/glossaries`, {
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
      });
      if (listRes.ok) {
        const data = (await listRes.json()) as { glossaries: DeepLGlossaryInfo[] };
        const existing = data.glossaries.find((g) => g.name === "KanaGameGrammarGlossary" && g.ready);
        if (existing) {
          this.cache["__meta:grammar_glossary_id__"] = existing.glossary_id;
          await this.saveCache();
          return existing.glossary_id;
        }
      }

      // Create new glossary with grammar terms
      const glossaryEntries = [
        ["て形", "te-form"],
        ["ます形", "masu-form"],
        ["た形", "ta-form"],
        ["ない形", "nai-form"],
        ["辞書形", "dictionary form"],
        ["意向形", "volitional form"],
        ["受身形", "passive form"],
        ["使役形", "causative form"],
        ["仮定形", "conditional form"],
        ["命令形", "imperative form"],
        ["可能形", "potential form"],
        ["普通形", "plain form"],
        ["丁寧形", "polite form"],
      ]
        .map(([ja, en]) => `${ja}\t${en}`)
        .join("\n");

      const createRes = await fetch(`${baseUrl}/glossaries`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "KanaGameGrammarGlossary",
          source_lang: "ja",
          target_lang: "en",
          entries: glossaryEntries,
          entries_format: "tsv",
        }),
      });

      if (createRes.ok) {
        const created = (await createRes.json()) as DeepLGlossaryInfo;
        this.cache["__meta:grammar_glossary_id__"] = created.glossary_id;
        await this.saveCache();
        return created.glossary_id;
      }
    } catch (err) {
      console.warn("Could not setup DeepL grammar glossary:", err);
    }
    return undefined;
  }

  async translateGroupedWithContext(
    groups: Array<{ context: string; texts: string[] }>,
    options: { mode: TranslationMode; dryRun?: boolean; limitChars?: number; glossaryId?: string }
  ): Promise<{ results: Map<string, string>; stats: TranslateBatchStats }> {
    await this.loadCache();

    const results = new Map<string, string>();
    const uncachedGroups: Array<{ context: string; texts: string[] }> = [];
    let totalRequested = 0;
    let cachedHits = 0;
    let uncachedChars = 0;

    for (const group of groups) {
      const needed: string[] = [];
      for (const text of group.texts) {
        const trimmed = text.trim();
        if (!trimmed) continue;
        totalRequested += 1;
        const hit = this.getCached(trimmed, options.mode);
        if (hit !== undefined) {
          cachedHits += 1;
          results.set(trimmed, hit);
        } else {
          needed.push(trimmed);
          uncachedChars += [...trimmed].length;
        }
      }
      if (needed.length > 0) {
        uncachedGroups.push({ context: group.context, texts: needed });
      }
    }

    const stats: TranslateBatchStats = {
      totalRequested,
      cachedHits,
      uncachedTexts: totalRequested - cachedHits,
      uncachedChars,
      translatedTexts: 0,
      translatedChars: 0,
    };

    if (options.dryRun || uncachedGroups.length === 0) {
      return { results, stats };
    }

    const { apiKey, baseUrl } = getDeepLConfig();
    if (!apiKey) {
      throw new Error("DEEPL_API_KEY is not set in .env.local or environment.");
    }

    const maxChars = options.limitChars ?? Number.POSITIVE_INFINITY;
    let runningChars = 0;

    for (let g = 0; g < uncachedGroups.length; g += 1) {
      const group = uncachedGroups[g]!;
      const chunk: string[] = [];
      for (const t of group.texts) {
        const len = [...t].length;
        if (runningChars + len > maxChars) break;
        chunk.push(t);
        runningChars += len;
      }
      if (chunk.length === 0) break;

      const bodyPayload: Record<string, unknown> = {
        text: chunk,
        source_lang: "JA",
        target_lang: "EN-US",
      };
      if (group.context) {
        bodyPayload.context = group.context;
      }
      if (options.glossaryId) {
        bodyPayload.glossary_id = options.glossaryId;
      }

      const res = await fetch(`${baseUrl}/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`DeepL /v2/translate failed (${res.status}) on group ${g}: ${errBody}`);
      }

      const payload = (await res.json()) as { translations: Array<{ text: string }> };
      if (!payload.translations || payload.translations.length !== chunk.length) {
        throw new Error(`DeepL returned mismatched translation count for group ${g}.`);
      }

      for (let j = 0; j < chunk.length; j += 1) {
        const srcText = chunk[j]!;
        const rawTarget = payload.translations[j]!.text.trim();
        this.cache[this.getCacheKey(srcText, options.mode)] = rawTarget;
        results.set(srcText, rawTarget);
        stats.translatedTexts += 1;
        stats.translatedChars += [...srcText].length;
      }

      await this.saveCache();
    }

    return { results, stats };
  }
}

