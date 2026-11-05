import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { getUniqueKanaSounds, type UniqueAudioSound } from "../src/engine/audio";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/kana");
const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-10%";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeFile(
  tts: MsEdgeTTS,
  item: UniqueAudioSound,
  targetFile: string
): Promise<void> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(item.ttsText, { rate: SPEECH_RATE });
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
      throw new Error(`Generated file was empty: ${targetFile}`);
    } catch (err) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`[Retry ${attempt}/${maxRetries}] Failed for ${item.slug} (${item.ttsText}): ${(err as Error).message}`);
      await sleep(500 * attempt);
    }
  }
}

export async function buildKanaAudio(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sounds = getUniqueKanaSounds();
  console.log(`[Audio Pipeline] Found ${sounds.length} unique kana sound definitions.`);

  const toSynthesize: UniqueAudioSound[] = [];
  let skippedCount = 0;

  for (const sound of sounds) {
    const filePath = path.join(OUTPUT_DIR, `${sound.slug}.mp3`);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      skippedCount++;
    } else {
      toSynthesize.push(sound);
    }
  }

  console.log(`[Audio Pipeline] ${skippedCount} files cached on disk. ${toSynthesize.length} to synthesize.`);

  if (toSynthesize.length === 0) {
    console.log("[Audio Pipeline] All kana audio files are already up to date!");
    return;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let generatedCount = 0;
  for (let i = 0; i < toSynthesize.length; i++) {
    const sound = toSynthesize[i];
    const targetFile = path.join(OUTPUT_DIR, `${sound.slug}.mp3`);

    process.stdout.write(`[${i + 1}/${toSynthesize.length}] Synthesizing "${sound.sampleChar}" (${sound.slug})... `);
    await synthesizeFile(tts, sound, targetFile);
    generatedCount++;
    process.stdout.write(`Done (${fs.statSync(targetFile).size} bytes)\n`);

    // Polite pause between requests
    await sleep(60);
  }

  console.log(`\n[Audio Pipeline] Complete! Synthesized: ${generatedCount}, Cached: ${skippedCount}, Total: ${sounds.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildKanaAudio().catch((err) => {
    console.error("[Audio Pipeline Error]", err);
    process.exit(1);
  });
}

