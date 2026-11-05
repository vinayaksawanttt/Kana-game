import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { resolveKanjiReadingAudio } from "../src/engine/audio";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/readings");
const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-5%";

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
      throw new Error(`Generated reading file was empty: ${targetFile}`);
    } catch (err) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`[Retry ${attempt}/${maxRetries}] Failed for ${text}: ${(err as Error).message}`);
      await sleep(500 * attempt);
    }
  }
}

export async function buildKanjiAudio(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  const onOnly = args.includes("--on-only");

  const levels = ["N5", "N4", "N3", "N2", "N1"];
  const uniqueReadings = new Set<string>();

  for (const lvl of levels) {
    const filePath = path.resolve(process.cwd(), `public/data/v1/kanji/${lvl}.json`);
    if (!fs.existsSync(filePath)) continue;

    const list = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<{
      on?: string[];
      kun?: string[];
    }>;

    for (const k of list) {
      if (Array.isArray(k.on)) {
        for (const o of k.on) {
          const payload = resolveKanjiReadingAudio(o);
          if (!payload.isKanaReuse && payload.ttsText) {
            uniqueReadings.add(payload.ttsText);
          }
        }
      }
      if (!onOnly && (lvl === "N5" || lvl === "N4") && Array.isArray(k.kun)) {
        for (const ku of k.kun) {
          const payload = resolveKanjiReadingAudio(ku);
          if (!payload.isKanaReuse && payload.ttsText) {
            uniqueReadings.add(payload.ttsText);
          }
        }
      }
    }
  }

  let candidates = Array.from(uniqueReadings);
  if (typeof limit === "number" && limit > 0) {
    candidates = candidates.slice(0, limit);
  }

  console.log(`[Kanji Audio Pipeline] Found ${candidates.length} unique multi-mora readings to synthesize.`);

  const toSynthesize: string[] = [];
  let skippedCount = 0;

  for (const reading of candidates) {
    const filePath = path.join(OUTPUT_DIR, `${reading}.mp3`);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      skippedCount++;
    } else {
      toSynthesize.push(reading);
    }
  }

  console.log(`[Kanji Audio Pipeline] ${skippedCount} files cached on disk. ${toSynthesize.length} to synthesize.`);

  if (toSynthesize.length === 0) {
    console.log("[Kanji Audio Pipeline] All kanji reading audio files are up to date!");
    return;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let generatedCount = 0;
  for (let i = 0; i < toSynthesize.length; i++) {
    const reading = toSynthesize[i];
    const targetFile = path.join(OUTPUT_DIR, `${reading}.mp3`);

    process.stdout.write(`[${i + 1}/${toSynthesize.length}] Synthesizing "${reading}"... `);
    await synthesizeFile(tts, reading, targetFile);
    generatedCount++;
    process.stdout.write(`Done (${fs.statSync(targetFile).size} bytes)\n`);

    await sleep(60);
  }

  console.log(`\n[Kanji Audio Pipeline] Complete! Synthesized: ${generatedCount}, Cached: ${skippedCount}, Total: ${candidates.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildKanjiAudio().catch((err) => {
    console.error("[Kanji Audio Pipeline Error]", err);
    process.exit(1);
  });
}

