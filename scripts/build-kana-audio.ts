import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { getUniqueKanaSounds, type UniqueAudioSound } from "../src/engine/audio";
import { synthesizeGeminiTtsClip } from "./build-listening-audio";
import { synthesizeKenpathClip } from "./build-story-audio";

const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/kana");
const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-10%";
const DEFAULT_ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Bella (Natural, clean Japanese mora pronunciation)

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function synthesizeElevenLabsClip(
  text: string,
  voiceId: string,
  outPath: string,
  apiKey: string
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.85,
            similarity_boost: 0.85,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`ElevenLabs error ${res.status}: ${errorText}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error(`ElevenLabs returned empty audio for "${text}"`);
      }

      fs.writeFileSync(outPath, buffer);
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(1000 * attempt);
    }
  }
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

export async function buildKanaAudio(args = process.argv.slice(2)): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const useKenpathExplicit = args.includes("--kenpath");
  const useElevenLabsExplicit = args.includes("--elevenlabs");
  const useGeminiExplicit = args.includes("--gemini");
  const useEdgeExplicit = args.includes("--edge");
  const useBasicOnly = args.includes("--basic") || args.includes("--group=basic");
  const useRemainingOnly = args.includes("--remaining") || args.includes("--non-basic");
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  const kenpathApiKey = (process.env.KENPATH_LABS_API_KEY || "").trim();
  const kenpathVoiceId =
    args.find((a) => a.startsWith("--voice="))?.split("=")[1] ||
    process.env.KENPATH_VOICE_ID ||
    "sv_qy4oztyr"; // Aoi (Calm female voice with Tokyo accent)

  const elevenLabsApiKey = (process.env.ELEVENLABS_API_KEY || "").trim();
  const elevenVoiceId =
    args.find((a) => a.startsWith("--voice="))?.split("=")[1] ||
    process.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_ELEVENLABS_VOICE_ID;

  let provider: "kenpath" | "elevenlabs" | "gemini" | "edge" = "edge";
  if (useElevenLabsExplicit) {
    provider = "elevenlabs";
  } else if (useKenpathExplicit) {
    provider = "kenpath";
  } else if (useGeminiExplicit) {
    provider = "gemini";
  } else if (elevenLabsApiKey) {
    provider = "elevenlabs";
  } else if (kenpathApiKey) {
    provider = "kenpath";
  } else {
    provider = "edge";
  }

  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;

  const geminiApiKeys: string[] = [];
  if (process.env.GEMINI_API_KEY6) geminiApiKeys.push(process.env.GEMINI_API_KEY6.trim());
  if (process.env.GEMINI_API_KEY3) geminiApiKeys.push(process.env.GEMINI_API_KEY3.trim());
  if (process.env.GEMINI_API_KEY) {
    geminiApiKeys.push(
      ...process.env.GEMINI_API_KEY.split(",").map((k) => k.trim()).filter(Boolean)
    );
  }
  for (let i = 1; i <= 20; i++) {
    if (i === 6 || i === 3) continue;
    const val = process.env[`GEMINI_API_KEY${i}`] || process.env[`GEMINI_API_KEY_${i}`];
    if (val && typeof val === "string" && val.trim()) {
      geminiApiKeys.push(val.trim());
    }
  }

  let sounds = getUniqueKanaSounds();
  const basicSlugs = new Set([
    "a", "i", "u", "e", "o", "ka", "ki", "ku", "ke", "ko",
    "sa", "shi", "su", "se", "so", "ta", "chi", "tsu", "te", "to",
    "na", "ni", "nu", "ne", "no", "ha", "hi", "fu", "he", "ho",
    "ma", "mi", "mu", "me", "mo", "ya", "yu", "yo", "ra", "ri",
    "ru", "re", "ro", "wa", "wo", "n"
  ]);
  if (useBasicOnly) {
    sounds = sounds.filter((s) => basicSlugs.has(s.slug));
  } else if (useRemainingOnly) {
    sounds = sounds.filter((s) => !basicSlugs.has(s.slug));
  }

  const scopeLabel = useBasicOnly ? "basic only" : useRemainingOnly ? "remaining only" : "all";
  console.log(`[Audio Pipeline] Found ${sounds.length} unique kana sound definitions (${scopeLabel}).`);
  const activeVoice = provider === "kenpath" ? kenpathVoiceId : provider === "elevenlabs" ? elevenVoiceId : provider === "gemini" ? "Aoede" : "Nanami";
  console.log(`[Audio Pipeline] Provider: ${provider.toUpperCase()} (Voice: ${activeVoice})`);

  let toSynthesize: UniqueAudioSound[] = [];
  let skippedCount = 0;

  for (const sound of sounds) {
    const filePath = path.join(OUTPUT_DIR, `${sound.slug}.mp3`);
    if (!force && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      skippedCount++;
    } else {
      toSynthesize.push(sound);
    }
  }

  if (typeof limit === "number" && limit > 0) {
    toSynthesize = toSynthesize.slice(0, limit);
    console.log(`[Audio Pipeline] Limited to first ${limit} sounds.`);
  }

  console.log(`[Audio Pipeline] ${skippedCount} files cached on disk. ${toSynthesize.length} to synthesize.`);

  if (toSynthesize.length === 0 || dryRun) {
    console.log("[Audio Pipeline] No synthesis needed or dry run.");
    return;
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let generatedCount = 0;
  for (let i = 0; i < toSynthesize.length; i++) {
    const sound = toSynthesize[i];
    const targetFile = path.join(OUTPUT_DIR, `${sound.slug}.mp3`);

    process.stdout.write(`[${i + 1}/${toSynthesize.length}] Synthesizing "${sound.sampleChar}" (${sound.slug})... `);
    const ttsText = sound.sampleChar ? `${sound.sampleChar}。` : (sound.ttsText.endsWith("。") ? sound.ttsText : `${sound.ttsText}。`);
    if (provider === "kenpath" && kenpathApiKey) {
      await synthesizeKenpathClip(ttsText, kenpathVoiceId, targetFile, kenpathApiKey);
    } else if (provider === "elevenlabs" && elevenLabsApiKey) {
      await synthesizeElevenLabsClip(ttsText, elevenVoiceId, targetFile, elevenLabsApiKey);
    } else if (provider === "gemini" && geminiApiKeys.length > 0) {
      try {
        await synthesizeGeminiTtsClip(sound.ttsText, "Aoede", targetFile, geminiApiKeys);
      } catch (geminiErr: unknown) {
        console.warn(`\n[WARN] Gemini quota limit on ${sound.slug}, using Edge fallback...`);
        await synthesizeFile(tts, sound, targetFile);
      }
    } else {
      await synthesizeFile(tts, sound, targetFile);
    }
    generatedCount++;
    process.stdout.write(`Done (${fs.statSync(targetFile).size} bytes)\n`);

    // Polite pause between requests to respect rate limits
    await sleep(provider === "kenpath" ? 1250 : 150);
  }

  console.log(`\n[Audio Pipeline] Complete! Synthesized: ${generatedCount}, Cached: ${skippedCount}, Total: ${sounds.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildKanaAudio().catch((err) => {
    console.error("[Audio Pipeline Error]", err);
    process.exit(1);
  });
}

