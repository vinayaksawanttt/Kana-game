import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cleanSentenceForAudio } from "../src/engine/audio";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();
const OUTPUT_BASE = path.resolve(process.cwd(), "public/audio/grammar-examples");
const MANIFEST_FILE = path.resolve(process.cwd(), "src/data/audio-manifest.generated.ts");

// Speaker 2: Shikishima Kuriyo (Articulate, natural standard Japanese)
// Speaker 8: Namahare (Clear neutral male Japanese)
const DEFAULT_SPEAKER_ID = 2;

export interface GrammarSentenceTask {
  id: string; // e.g. "grammar-ex:N5:a-ga-ichiban:0"
  level: string; // "N5", "N4"
  slug: string;
  index: number;
  text: string;
  speakerId: number;
  relPath: string;
  targetFile: string;
}

function cleanSpokenText(raw: string): string {
  return cleanSentenceForAudio(raw)
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
}

async function synthesizeVoicevoxOpus(
  text: string,
  speakerId: number,
  outOpusPath: string
): Promise<number> {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    throw new Error(`Cannot synthesize empty text from: "${text}"`);
  }

  // Skip if already generated and valid
  if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).size > 100) {
    return fs.statSync(outOpusPath).size;
  }

  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });

  // 1. Audio Query
  const queryRes = await fetch(
    `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(cleaned)}&speaker=${speakerId}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX query error ${queryRes.status}: ${await queryRes.text()}`);
  }
  const queryJson = await queryRes.json();

  // Fine-tune prosody: speedScale 0.95 for clear instructional comprehension
  queryJson.speedScale = 0.95;

  // 2. Synthesis
  const synthRes = await fetch(`${VOICEVOX_BASE_URL}/synthesis?speaker=${speakerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queryJson),
  });
  if (!synthRes.ok) {
    throw new Error(`VOICEVOX synthesis error ${synthRes.status}: ${await synthRes.text()}`);
  }

  const wavBuf = Buffer.from(await synthRes.arrayBuffer());
  if (wavBuf.length === 0) {
    throw new Error(`VOICEVOX returned empty audio for "${cleaned}"`);
  }

  const tmpWav = `${outOpusPath}.tmp.wav`;
  fs.writeFileSync(tmpWav, wavBuf);

  try {
    // 3. Ffmpeg conversion to compact 24kHz mono 32k Opus
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel", "error",
        "-i", tmpWav,
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
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  return fs.statSync(outOpusPath).size;
}

export function collectGrammarTasks(level: string): GrammarSentenceTask[] {
  const jsonFile = path.resolve(process.cwd(), `public/data/v1/grammar/${level}.json`);
  if (!fs.existsSync(jsonFile)) {
    throw new Error(`Grammar data file not found: ${jsonFile}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  const tasks: GrammarSentenceTask[] = [];

  for (const pt of (data.points || [])) {
    const slug = pt.slug || pt.id.split("/")[1] || "point";
    const examples = pt.examples || [];

    examples.forEach((ex: { ja?: string; jp?: string }, idx: number) => {
      const rawText = ex.ja || ex.jp;
      if (!rawText) return;
      const cleaned = cleanSpokenText(rawText);
      if (!cleaned) return;

      // Alternate speakers slightly for natural listening variety
      const speakerId = idx % 2 === 0 ? DEFAULT_SPEAKER_ID : 8; // 2 (Kuriyo - female) / 8 (Namahare - male)
      const fileName = `${slug}_${idx}.opus`;
      const relPath = `/audio/grammar-examples/${level}/${fileName}`;
      const targetFile = path.join(OUTPUT_BASE, level, fileName);

      tasks.push({
        id: `grammar-ex:${level}:${slug}:${idx}`,
        level,
        slug,
        index: idx,
        text: cleaned,
        speakerId,
        relPath,
        targetFile,
      });
    });
  }

  return tasks;
}

export function updateAudioManifest(verifiedTasks: GrammarSentenceTask[]): void {
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
  console.log(`[Manifest] Updated with ${added} grammar example clips (${Object.keys(existingMap).length} total lookup keys).`);
}

async function main() {
  const args = process.argv.slice(2);
  const levelArg = args.find((a) => a.startsWith("--level="))?.split("=")[1]?.toUpperCase() || "N5";
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? Number.parseInt(limitArg, 10) : undefined;

  // Check VOICEVOX engine
  try {
    const verRes = await fetch(`${VOICEVOX_BASE_URL}/version`);
    if (!verRes.ok) throw new Error(`HTTP ${verRes.status}`);
    const ver = await verRes.text();
    console.log(`\n=== VOICEVOX Connected (Engine: ${ver.trim()}) ===`);
  } catch (err) {
    console.error(`Cannot connect to VOICEVOX at ${VOICEVOX_BASE_URL}. Ensure VOICEVOX is running!`);
    process.exit(1);
  }

  const allTasks = collectGrammarTasks(levelArg);
  console.log(`Grammar ${levelArg} total example sentences: ${allTasks.length}`);

  const pending = allTasks.filter(
    (t) => !fs.existsSync(t.targetFile) || fs.statSync(t.targetFile).size < 100
  );
  console.log(`Already exists on disk: ${allTasks.length - pending.length}`);
  console.log(`Pending to synthesize: ${pending.length}`);

  const tasksToRun = limit ? pending.slice(0, limit) : pending;
  if (limit && pending.length > limit) {
    console.log(`Limiting execution to first ${limit} items.`);
  }

  const verified: GrammarSentenceTask[] = allTasks.filter(
    (t) => fs.existsSync(t.targetFile) && fs.statSync(t.targetFile).size > 100
  );

  let successCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < tasksToRun.length; i++) {
    const task = tasksToRun[i];
    const progress = `[${i + 1}/${tasksToRun.length}]`;
    const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

    try {
      const bytes = await synthesizeVoicevoxOpus(
        task.text,
        task.speakerId,
        task.targetFile
      );
      verified.push(task);
      successCount++;
      if ((i + 1) % 25 === 0 || i + 1 === tasksToRun.length) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `${progress} [MEM: ${memMb}MB] (${elapsedSec}s elapsed) Synthesized ${task.id} (${(bytes / 1024).toFixed(1)} KB)`
        );
      }
    } catch (err) {
      console.error(`${progress} ERROR for ${task.id}:`, err instanceof Error ? err.message : err);
    }

    // Small yield for Node event loop & garbage collection
    await new Promise((r) => setTimeout(r, 20));
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nSuccessfully synthesized ${successCount} ${levelArg} clips in ${totalSec}s.`);

  updateAudioManifest(verified);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
