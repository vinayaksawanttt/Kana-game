import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { execFileSync } from "node:child_process";
import { cleanSentenceForAudio } from "../../src/engine/audio";
import {
  INSTANT_REPLY_ITEMS,
  type InstantReplyItem,
} from "../../src/data/jlpt/instantReplyData";
import {
  STAR_SCRAMBLE_ITEMS,
  type StarScrambleItem,
} from "../../src/data/jlpt/starScrambleData";
import {
  SYNONYM_MATCH_ITEMS,
  type SynonymMatchItem,
} from "../../src/data/jlpt/synonymMatchData";
import {
  PHONETIC_TRAP_ITEMS,
  type PhoneticTrapVocabItem,
} from "../../src/data/jlpt/phoneticTrapData";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const KENPATH_API_KEY = (process.env.KENPATH_LABS_API_KEY || "").trim();
if (!KENPATH_API_KEY) {
  console.error("Missing KENPATH_LABS_API_KEY in .env.local");
  process.exit(1);
}

// Kenpath Labs Voice IDs
export const KENPATH_VOICES = {
  AOI: "sv_qy4oztyr",  // Calm Tokyo female
  KENTA: "sv_71lsoipx", // Warm Tokyo male
  REN: "sv_6q72qb26",   // Calm young Tokyo male
} as const;

const OUTPUT_BASE = path.resolve(process.cwd(), "public/audio");
const MANIFEST_FILE = path.resolve(process.cwd(), "src/data/audio-manifest.generated.ts");

export interface AudioTask {
  id: string;
  category: "instant-reply" | "star-scramble" | "synonym-match" | "phonetic-trap";
  level: string; // "n5", "n4", etc.
  text: string;
  voiceId: string;
  relPath: string;
  targetFile: string;
}

function cleanSpokenText(raw: string): string {
  return cleanSentenceForAudio(raw)
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
}

async function synthesizeKenpathOpus(
  text: string,
  voiceId: string,
  outOpusPath: string,
  apiKey: string
): Promise<number> {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    throw new Error(`Cannot synthesize empty text from: "${text}"`);
  }

  // Skip if already generated and non-empty
  if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).size > 100) {
    return fs.statSync(outOpusPath).size;
  }

  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });

  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.kenpathlabs.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: cleaned,
          voice: voiceId,
          response_format: "opus",
        }),
      });

      if (res.status === 429) {
        const retrySec = Number.parseInt(res.headers.get("retry-after") || "10", 10) || 10;
        console.warn(`\n[Kenpath 429 Rate Limit] Waiting ${retrySec}s for window reset (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, retrySec * 1000));
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Kenpath error ${res.status}: ${errorText}`);
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      if (rawBuffer.length === 0) {
        throw new Error(`Kenpath returned empty audio for "${cleaned}"`);
      }

      const tmpRaw = `${outOpusPath}.raw.opus`;
      fs.writeFileSync(tmpRaw, rawBuffer);

      try {
        // Standardize container to 24kHz mono Opus with volume leveling
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-loglevel", "error",
            "-i", tmpRaw,
            "-ac", "1",
            "-ar", "24000",
            "-c:a", "libopus",
            "-b:a", "32k",
            "-vbr", "on",
            outOpusPath,
          ],
          { stdio: "ignore" }
        );
      } finally {
        if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
      }

      const finalSize = fs.statSync(outOpusPath).size;
      return finalSize;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const backoffMs = 1500 * attempt;
      console.warn(`[Retry ${attempt}/${maxRetries}] ${err instanceof Error ? err.message : err}. Waiting ${backoffMs}ms...`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw new Error(`Failed to synthesize after ${maxRetries} attempts: "${cleaned}"`);
}

export function collectInstantReplyTasks(): AudioTask[] {
  const tasks: AudioTask[] = [];

  for (const item of INSTANT_REPLY_ITEMS) {
    const levelStr = `n${item.jlpt}`;

    // Prompt clip: alternate between Kenta and Aoi for variety
    const promptVoice = item.jlpt % 2 === 0 ? KENPATH_VOICES.KENTA : KENPATH_VOICES.AOI;
    const promptClean = cleanSpokenText(item.promptJa);
    if (promptClean) {
      const fileName = `${item.id}_prompt.opus`;
      tasks.push({
        id: `${item.id}:prompt`,
        category: "instant-reply",
        level: levelStr,
        text: promptClean,
        voiceId: promptVoice,
        relPath: `/audio/listening/instant-reply/${levelStr}/${fileName}`,
        targetFile: path.join(OUTPUT_BASE, "listening/instant-reply", levelStr, fileName),
      });
    }

    // Option clips: Ren (MC / respondent)
    item.options.forEach((opt, idx) => {
      const optClean = cleanSpokenText(opt.ja);
      if (optClean) {
        const fileName = `${item.id}_opt${idx + 1}.opus`;
        tasks.push({
          id: `${item.id}:opt-${idx + 1}`,
          category: "instant-reply",
          level: levelStr,
          text: optClean,
          voiceId: KENPATH_VOICES.REN,
          relPath: `/audio/listening/instant-reply/${levelStr}/${fileName}`,
          targetFile: path.join(OUTPUT_BASE, "listening/instant-reply", levelStr, fileName),
        });
      }
    });
  }

  return tasks;
}

export function collectStarScrambleTasks(): AudioTask[] {
  const tasks: AudioTask[] = [];

  for (const item of STAR_SCRAMBLE_ITEMS) {
    const levelStr = item.level.toLowerCase();
    const textClean = cleanSpokenText(item.fullSentence);
    if (!textClean) continue;

    const voice = item.jlpt % 2 === 1 ? KENPATH_VOICES.AOI : KENPATH_VOICES.KENTA;
    const fileName = `${item.id}.opus`;

    tasks.push({
      id: `star-scramble:${item.id}`,
      category: "star-scramble",
      level: levelStr,
      text: textClean,
      voiceId: voice,
      relPath: `/audio/jlpt/star-scramble/${levelStr}/${fileName}`,
      targetFile: path.join(OUTPUT_BASE, "jlpt/star-scramble", levelStr, fileName),
    });
  }

  return tasks;
}

export function collectSynonymTasks(): AudioTask[] {
  const tasks: AudioTask[] = [];

  for (const item of SYNONYM_MATCH_ITEMS) {
    const levelStr = `n${item.jlpt}`;
    const textClean = cleanSpokenText(item.sentenceJa);
    if (!textClean) continue;

    const voice = item.jlpt % 2 === 1 ? KENPATH_VOICES.AOI : KENPATH_VOICES.KENTA;
    const fileName = `${item.id}.opus`;

    tasks.push({
      id: `synonym:${item.id}`,
      category: "synonym-match",
      level: levelStr,
      text: textClean,
      voiceId: voice,
      relPath: `/audio/jlpt/synonyms/${levelStr}/${fileName}`,
      targetFile: path.join(OUTPUT_BASE, "jlpt/synonyms", levelStr, fileName),
    });
  }

  return tasks;
}

export function collectPhoneticTrapTasks(): AudioTask[] {
  const tasks: AudioTask[] = [];

  for (const item of PHONETIC_TRAP_ITEMS) {
    const levelStr = item.level.toLowerCase();
    const textClean = cleanSpokenText(item.sentenceJa);
    if (!textClean) continue;

    const voice = item.jlpt % 2 === 1 ? KENPATH_VOICES.AOI : KENPATH_VOICES.KENTA;
    const fileName = `${item.id}.opus`;

    tasks.push({
      id: `phonetic-trap:${item.id}`,
      category: "phonetic-trap",
      level: levelStr,
      text: textClean,
      voiceId: voice,
      relPath: `/audio/jlpt/phonetic-traps/${levelStr}/${fileName}`,
      targetFile: path.join(OUTPUT_BASE, "jlpt/phonetic-traps", levelStr, fileName),
    });
  }

  return tasks;
}

export function updateAudioManifest(verifiedTasks: AudioTask[]): void {
  if (!fs.existsSync(MANIFEST_FILE)) return;

  const existingContent = fs.readFileSync(MANIFEST_FILE, "utf8");
  let existingMap: Record<string, string> = {};

  const mapMatch = existingContent.match(
    /export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = (\{[\s\S]*?\});/
  );

  if (mapMatch && mapMatch[1]) {
    try {
      existingMap = JSON.parse(mapMatch[1]);
    } catch {
      const lines = mapMatch[1].split("\n");
      for (const line of lines) {
        const lineMatch = line.match(/^\s*"([^"]+)":\s*"([^"]+)"/);
        if (lineMatch) {
          existingMap[lineMatch[1]] = lineMatch[2];
        }
      }
    }
  }

  let added = 0;
  for (const t of verifiedTasks) {
    if (fs.existsSync(t.targetFile) && fs.statSync(t.targetFile).size > 100) {
      existingMap[t.id] = t.relPath;
      if (!existingMap[t.text]) {
        existingMap[t.text] = t.relPath;
      }
      added++;
    }
  }

  const exportBlock = `export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    existingMap,
    null,
    2
  )};`;

  const updatedContent = existingContent.replace(
    /export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = [\s\S]*?;/,
    exportBlock
  );

  fs.writeFileSync(MANIFEST_FILE, updatedContent, "utf8");
  console.log(`[Manifest] Updated with ${added} new audio clips (${Object.keys(existingMap).length} total lookup keys).`);
}

async function main() {
  const args = process.argv.slice(2);
  const filterCategory = args.find((a) => a.startsWith("--category="))?.split("=")[1]; // "instant-reply" | "star-scramble"
  const filterLevel = args.find((a) => a.startsWith("--level="))?.split("=")[1]?.toLowerCase(); // "n5", "n4", etc.
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number.parseInt(limitArg, 10) : undefined;

  let allTasks: AudioTask[] = [];

  if (!filterCategory || filterCategory === "instant-reply") {
    allTasks.push(...collectInstantReplyTasks());
  }
  if (!filterCategory || filterCategory === "star-scramble") {
    allTasks.push(...collectStarScrambleTasks());
  }
  if (!filterCategory || filterCategory === "synonym-match") {
    allTasks.push(...collectSynonymTasks());
  }
  if (!filterCategory || filterCategory === "phonetic-trap") {
    allTasks.push(...collectPhoneticTrapTasks());
  }

  if (filterLevel) {
    allTasks = allTasks.filter((t) => t.level === filterLevel);
  }

  console.log(`\n=== Phase 1: Kenpath Labs Speech Synthesis ===`);
  console.log(`Total candidate clips in scope: ${allTasks.length}`);

  const pendingTasks = allTasks.filter(
    (t) => !fs.existsSync(t.targetFile) || fs.statSync(t.targetFile).size < 100
  );
  console.log(`Already exists on disk: ${allTasks.length - pendingTasks.length}`);
  console.log(`Pending to synthesize: ${pendingTasks.length}`);

  const tasksToRun = limit ? pendingTasks.slice(0, limit) : pendingTasks;
  if (limit && pendingTasks.length > limit) {
    console.log(`Limiting execution to first ${limit} items as requested.`);
  }

  const verified: AudioTask[] = allTasks.filter(
    (t) => fs.existsSync(t.targetFile) && fs.statSync(t.targetFile).size > 100
  );

  let successCount = 0;
  for (let i = 0; i < tasksToRun.length; i++) {
    const task = tasksToRun[i];
    const progress = `[${i + 1}/${tasksToRun.length}]`;
    const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

    try {
      const bytes = await synthesizeKenpathOpus(
        task.text,
        task.voiceId,
        task.targetFile,
        KENPATH_API_KEY
      );
      verified.push(task);
      successCount++;
      console.log(
        `${progress} [MEM: ${memMb}MB] Generated ${task.id} (${(bytes / 1024).toFixed(1)} KB) -> "${task.text}"`
      );
    } catch (err) {
      console.error(`${progress} ERROR for ${task.id}:`, err instanceof Error ? err.message : err);
    }

    // Pacing delay (1.2s) between API calls to prevent 429
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\nSynthesized ${successCount} new clips successfully.`);
  updateAudioManifest(verified);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
