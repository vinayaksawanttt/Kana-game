import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { cleanSentenceForAudio } from "../src/engine/audio";

const VOCAB_DATA_DIR = path.resolve(process.cwd(), "public/data/v1/vocabulary");
const LISTENING_AUDIO_DIR = path.resolve(process.cwd(), "public/audio/listening");
const MANIFEST_FILE = path.resolve(process.cwd(), "src/data/audio-manifest.generated.ts");

const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-5%";
const CONCURRENCY = 8;

const TARGET_PER_LEVEL: Record<string, number> = {
  N5: 60,
  N4: 60,
  N3: 80,
  N2: 80,
  N1: 80,
};

interface VocabExample {
  ja?: string;
  furigana?: string;
  en?: string;
}

interface VocabEntry {
  id: string;
  word: string;
  reading: string;
  level: string;
  examples?: VocabExample[];
}

interface CuratedListeningPrompt {
  sentId: string;
  recordId: string;
  exampleIdx: number;
  level: string;
  cleanJa: string;
  en: string;
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
      throw new Error(`Generated listening audio file was empty: ${targetFile}`);
    } catch (err) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === maxRetries) {
        throw err;
      }
      await sleep(300 * attempt);
    }
  }
}

export function selectCuratedListeningPrompts(): CuratedListeningPrompt[] {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const selected: CuratedListeningPrompt[] = [];
  const seenJa = new Set<string>();
  const seenEn = new Set<string>();

  for (const level of levels) {
    const filePath = path.join(VOCAB_DATA_DIR, `${level}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Vocabulary file missing: ${filePath}`);
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const records: VocabEntry[] = Array.isArray(raw) ? raw : raw.records || [];

    const candidates: CuratedListeningPrompt[] = [];
    for (const record of records) {
      if (!Array.isArray(record.examples)) continue;
      for (let idx = 0; idx < record.examples.length; idx++) {
        const ex = record.examples[idx];
        const cleanJa = cleanSentenceForAudio(ex.ja || "");
        const en = (ex.en || "").trim();

        if (!cleanJa || !en) continue;
        if (cleanJa.length < 7 || cleanJa.length > 35) continue;
        if (en.length < 10 || en.length > 90) continue;

        const enKey = en.toLowerCase();
        if (seenJa.has(cleanJa) || seenEn.has(enKey)) continue;

        const sentId = `vocab-sent:${record.id}:${idx}`;
        const fileName = `${record.id}_${idx}.mp3`;
        const relPath = `/audio/listening/${level}/${fileName}`;
        const targetFile = path.join(LISTENING_AUDIO_DIR, level, fileName);

        candidates.push({
          sentId,
          recordId: record.id,
          exampleIdx: idx,
          level,
          cleanJa,
          en,
          relPath,
          targetFile,
        });
        break; // At most 1 sentence per vocab word for maximum topic diversity
      }
    }

    const targetCount = TARGET_PER_LEVEL[level] ?? 60;
    const step = Math.max(1, Math.floor(candidates.length / targetCount));
    let pickedForLevel = 0;

    for (let i = 0; i < candidates.length && pickedForLevel < targetCount; i += step) {
      const c = candidates[i];
      const enKey = c.en.toLowerCase();
      if (seenJa.has(c.cleanJa) || seenEn.has(enKey)) continue;
      seenJa.add(c.cleanJa);
      seenEn.add(enKey);
      selected.push(c);
      pickedForLevel++;
    }

    // Top up if step skipped slightly below targetCount
    for (const c of candidates) {
      if (pickedForLevel >= targetCount) break;
      const enKey = c.en.toLowerCase();
      if (seenJa.has(c.cleanJa) || seenEn.has(enKey)) continue;
      seenJa.add(c.cleanJa);
      seenEn.add(enKey);
      selected.push(c);
      pickedForLevel++;
    }
  }

  return selected;
}

export function updateListeningAudioManifest(prompts: CuratedListeningPrompt[]): void {
  if (!fs.existsSync(MANIFEST_FILE)) {
    throw new Error(`Audio manifest not found at ${MANIFEST_FILE}`);
  }

  const existingContent = fs.readFileSync(MANIFEST_FILE, "utf8");
  const listeningMap: Record<string, string> = {};

  for (const p of prompts) {
    if (fs.existsSync(p.targetFile) && fs.statSync(p.targetFile).size > 0) {
      listeningMap[p.sentId] = p.relPath;
      listeningMap[p.cleanJa] = p.relPath;
    }
  }

  const exportBlock = `export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    listeningMap,
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
    `[Audio Manifest] Updated STATIC_LISTENING_SENTENCE_AUDIO_MAP with ${Object.keys(listeningMap).length} lookup keys.`
  );
}

export async function buildListeningAudio(): Promise<void> {
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  for (const level of levels) {
    const dir = path.join(LISTENING_AUDIO_DIR, level);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const prompts = selectCuratedListeningPrompts();
  console.log(`[Listening Audio] Curated ${prompts.length} vocabulary sentences across N5–N1.`);

  const tasks: CuratedListeningPrompt[] = [];
  let existingCount = 0;

  for (const p of prompts) {
    if (fs.existsSync(p.targetFile) && fs.statSync(p.targetFile).size > 0) {
      existingCount++;
    } else {
      tasks.push(p);
    }
  }

  console.log(`[Listening Audio] ${existingCount} already generated, ${tasks.length} to synthesize.`);

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
            `[Listening Audio] Progress: ${completed}/${totalToSynthesize} clips (${elapsedSec}s elapsed)...`
          );
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Listening Audio] Completed synthesizing ${completed} clips in ${totalSec}s.`);
  }

  updateListeningAudioManifest(prompts);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildListeningAudio().catch((err) => {
    console.error("[Listening Audio Error]", err);
    process.exit(1);
  });
}
