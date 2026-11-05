import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type TranslationMode = "gloss" | "sentence";

export interface DeepLUsage {
  character_count: number;
  character_limit: number;
}

export interface TranslateBatchOptions {
  mode: TranslationMode;
  dryRun?: boolean;
  limitChars?: number;
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
}

