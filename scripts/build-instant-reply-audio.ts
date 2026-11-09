import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { cleanSentenceForAudio } from "../src/engine/audio";
import {
  INSTANT_REPLY_ITEMS,
  type InstantReplyItem,
} from "../src/data/jlpt/instantReplyData";

const INSTANT_REPLY_AUDIO_DIR = path.resolve(
  process.cwd(),
  "public/audio/listening/instant-reply"
);
const MANIFEST_FILE = path.resolve(
  process.cwd(),
  "src/data/audio-manifest.generated.ts"
);

const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-5%";
const CONCURRENCY = 8;

export interface InstantReplyAudioClip {
  clipId: string;
  itemId: string;
  level: string; // e.g. "n5"
  cleanJa: string;
  relPath: string;
  targetFile: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeFile(
  tts: MsEdgeTTS,
  text: string,
  targetFile: string
): Promise<void> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: SPEECH_RATE });
        const out = fs.createWriteStream(targetFile);

        audioStream.pipe(out);
        out.on("finish", () => resolve());
        out.on("error", (err) => {
          fs.rmSync(targetFile, { force: true });
          reject(err);
        });
        audioStream.on("error", (err) => {
          fs.rmSync(targetFile, { force: true });
          reject(err);
        });
      });

      const stat = fs.statSync(targetFile);
      if (stat.size > 0) {
        return;
      }
      throw new Error(`Generated instant-reply audio file was empty: ${targetFile}`);
    } catch (err) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === maxRetries) {
        throw err;
      }
      await sleep(350 * attempt);
    }
  }
}

export function collectInstantReplyAudioClips(): InstantReplyAudioClip[] {
  const clips: InstantReplyAudioClip[] = [];

  for (const item of INSTANT_REPLY_ITEMS) {
    const levelStr = `n${item.jlpt}`;

    // 1. Prompt clip
    const promptClean = cleanSentenceForAudio(item.promptJa);
    if (promptClean) {
      const promptFileName = `${item.id}_prompt.mp3`;
      clips.push({
        clipId: `${item.id}:prompt`,
        itemId: item.id,
        level: levelStr,
        cleanJa: promptClean,
        relPath: `/audio/listening/instant-reply/${levelStr}/${promptFileName}`,
        targetFile: path.join(INSTANT_REPLY_AUDIO_DIR, levelStr, promptFileName),
      });
    }

    // 2. Options clips (3 options)
    item.options.forEach((opt, idx) => {
      const optClean = cleanSentenceForAudio(opt.ja);
      if (optClean) {
        const optFileName = `${item.id}_opt${idx + 1}.mp3`;
        clips.push({
          clipId: `${item.id}:opt-${idx + 1}`,
          itemId: item.id,
          level: levelStr,
          cleanJa: optClean,
          relPath: `/audio/listening/instant-reply/${levelStr}/${optFileName}`,
          targetFile: path.join(INSTANT_REPLY_AUDIO_DIR, levelStr, optFileName),
        });
      }
    });
  }

  return clips;
}

export function updateInstantReplyAudioManifest(clips: InstantReplyAudioClip[]): void {
  if (!fs.existsSync(MANIFEST_FILE)) {
    throw new Error(`Audio manifest not found at ${MANIFEST_FILE}`);
  }

  const existingContent = fs.readFileSync(MANIFEST_FILE, "utf8");

  // Parse existing map if present
  let existingMap: Record<string, string> = {};
  const mapMatch = existingContent.match(
    /export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = (\{[\s\S]*?\});/
  );
  if (mapMatch && mapMatch[1]) {
    try {
      existingMap = JSON.parse(mapMatch[1]);
    } catch {
      // If parsing fails, extract line by line
      const lines = mapMatch[1].split("\n");
      for (const line of lines) {
        const lineMatch = line.match(/^\s*"([^"]+)":\s*"([^"]+)"/);
        if (lineMatch) {
          existingMap[lineMatch[1]] = lineMatch[2];
        }
      }
    }
  }

  // Merge clips into existing map
  let addedCount = 0;
  for (const c of clips) {
    if (fs.existsSync(c.targetFile) && fs.statSync(c.targetFile).size > 0) {
      existingMap[c.clipId] = c.relPath;
      if (!existingMap[c.cleanJa]) {
        existingMap[c.cleanJa] = c.relPath;
      }
      addedCount++;
    }
  }

  const exportBlock = `export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    existingMap,
    null,
    2
  )};`;

  let updatedContent: string;
  if (/export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = [\s\S]*?;/.test(existingContent)) {
    updatedContent = existingContent.replace(
      /export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = [\s\S]*?;/,
      exportBlock
    );
  } else {
    updatedContent = `${existingContent.trimEnd()}\n\n${exportBlock}\n`;
  }

  fs.writeFileSync(MANIFEST_FILE, updatedContent, "utf8");
  console.log(
    `[Audio Manifest] Updated STATIC_LISTENING_SENTENCE_AUDIO_MAP with ${Object.keys(existingMap).length} total lookup keys (${addedCount} instant-reply clips verified).`
  );
}

export async function buildInstantReplyAudio(): Promise<void> {
  // Ensure subdirectories exist
  const levels = ["n5", "n4", "n3", "n2", "n1"];
  for (const lvl of levels) {
    const dir = path.join(INSTANT_REPLY_AUDIO_DIR, lvl);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const clips = collectInstantReplyAudioClips();
  console.log(`[Instant Reply Audio] Total clips to prepare: ${clips.length} across N5–N1.`);

  const tasks: InstantReplyAudioClip[] = [];
  let existingCount = 0;

  for (const c of clips) {
    if (fs.existsSync(c.targetFile) && fs.statSync(c.targetFile).size > 0) {
      existingCount++;
    } else {
      tasks.push(c);
    }
  }

  console.log(`[Instant Reply Audio] ${existingCount} already exist, ${tasks.length} to synthesize.`);

  if (tasks.length > 0) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const totalToSynthesize = tasks.length;
    let completed = 0;
    const startTime = Date.now();

    async function worker() {
      while (tasks.length > 0) {
        const item = tasks.shift();
        if (!item) break;

        await synthesizeFile(tts, item.cleanJa, item.targetFile);
        completed++;

        if (completed % 25 === 0 || completed === totalToSynthesize) {
          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `[Instant Reply Audio] Progress: ${completed}/${totalToSynthesize} clips (${elapsedSec}s elapsed)...`
          );
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Instant Reply Audio] Completed synthesizing ${completed} clips in ${totalSec}s.`);
  }

  updateInstantReplyAudioManifest(clips);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildInstantReplyAudio().catch((err) => {
    console.error("[Instant Reply Audio Error]", err);
    process.exit(1);
  });
}
