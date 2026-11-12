import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { buildStoryAudioQueue } from "../src/engine/audio";
import { getAllStories } from "../src/data/stories";
import { synthesizeGeminiTtsClip } from "./build-listening-audio";
import { synthesizeElevenLabsClip } from "./build-kana-audio";

const DATA_DIR = path.resolve(process.cwd(), "public/data/v1/stories");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/stories");
const VOICE = "ja-JP-NanamiNeural";

interface BuiltStoryData {
  id: string;
  paragraphs: Array<{ ja?: string; sentences?: Array<{ ja: string }> }>;
}

interface AudioTask {
  slug: string;
  index: number;
  text: string;
  targetFile: string;
}

function parseLimit(args: string[]): number | undefined {
  const value = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
  if (value === undefined) return undefined;
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("--limit must be a non-negative integer.");
  }
  return limit;
}

function buildTasks(args: string[]): AudioTask[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Story data directory not found: ${DATA_DIR}. Run the data build first.`);
  }

  const requestedSlug = args.find((arg) => arg.startsWith("--story="))?.split("=")[1];
  const requestedSlugs = requestedSlug ? requestedSlug.split(",").map((s) => s.trim()) : null;
  const requestedLevel = args.find((arg) => arg.startsWith("--level="))?.split("=")[1];
  const requestedCategory = args.find((arg) => arg.startsWith("--category="))?.split("=")[1];
  const limit = parseLimit(args);
  const force = args.includes("--force");
  const storiesById = new Map(getAllStories().map((story) => [story.id, story]));
  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith(".json")).sort();
  const tasks: AudioTask[] = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as BuiltStoryData;
    const story = storiesById.get(data.id);
    if (!story) continue;
    if (requestedSlugs && !requestedSlugs.includes(story.slug) && !requestedSlugs.includes(story.id)) continue;
    if (requestedLevel && story.level !== requestedLevel) continue;
    if (requestedCategory && story.category !== requestedCategory) continue;

    for (const segment of buildStoryAudioQueue({ slug: story.slug, paragraphs: data.paragraphs })) {
      const targetFile = path.join(OUTPUT_DIR, story.slug, `${segment.index}.mp3`);
      if (force || !fs.existsSync(targetFile) || fs.statSync(targetFile).size === 0) {
        tasks.push({ slug: story.slug, index: segment.index, text: segment.ttsText, targetFile });
      }
    }
  }

  if (requestedSlugs && !requestedSlugs.every((slug) => getAllStories().some((story) => story.slug === slug || story.id === slug))) {
    throw new Error(`Unknown story slug in: ${requestedSlug}`);
  }

  return typeof limit === "number" ? tasks.slice(0, limit) : tasks;
}

let currentTts: MsEdgeTTS | null = null;
let requestCount = 0;

async function getTTS(forceRefresh = false): Promise<MsEdgeTTS> {
  if (!currentTts || forceRefresh || requestCount >= 20) {
    currentTts = new MsEdgeTTS();
    await currentTts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    requestCount = 0;
  }
  requestCount++;
  return currentTts;
}

async function synthesizeFile(
  text: string,
  targetFile: string
): Promise<void> {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = await getTTS(attempt > 1);
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: "-5%" });
        const output = fs.createWriteStream(targetFile);
        audioStream.pipe(output);
        output.on("finish", resolve);
        output.on("error", reject);
        audioStream.on("error", reject);
      });

      if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 0) return;
      throw new Error(`Generated empty audio file: ${targetFile}`);
    } catch (error) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === 4) throw error;
      console.warn(`[Retry ${attempt}/4] ${text}: ${String(error).slice(0, 80)}`);
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
}

export async function synthesizeKenpathClip(
  text: string,
  voiceId: string,
  outPath: string,
  apiKey: string
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch("https://api.kenpathlabs.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          voice: voiceId,
          response_format: "mp3",
        }),
      });
      if (res.status === 429) {
        const retrySec = Number.parseInt(res.headers.get("retry-after") || "12", 10) || 12;
        console.warn(`\n[Kenpath Rate Limit 429] Waiting ${retrySec}s for window reset (attempt ${attempt}/5)...`);
        await new Promise((resolve) => setTimeout(resolve, retrySec * 1000));
        continue;
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Kenpath error ${res.status}: ${errorText}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error(`Kenpath returned empty audio for "${text}"`);
      }
      fs.writeFileSync(outPath, buffer);
      return;
    } catch (err) {
      if (attempt === 5) throw err;
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

export async function synthesizeVoicevoxClip(
  text: string,
  speakerId: number,
  outPath: string,
  baseUrl = "http://127.0.0.1:50021",
  speedScale = 1.0
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const qRes = await fetch(
        `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
        { method: "POST" }
      );
      if (!qRes.ok) {
        const errText = await qRes.text();
        throw new Error(`VOICEVOX audio_query error ${qRes.status}: ${errText}`);
      }
      const query = (await qRes.json()) as Record<string, unknown>;
      if (speedScale !== 1.0 && Number.isFinite(speedScale)) {
        query.speedScale = speedScale;
      }

      const sRes = await fetch(`${baseUrl}/synthesis?speaker=${speakerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!sRes.ok) {
        const errText = await sRes.text();
        throw new Error(`VOICEVOX synthesis error ${sRes.status}: ${errText}`);
      }
      const wavBuffer = Buffer.from(await sRes.arrayBuffer());
      if (wavBuffer.length === 0) {
        throw new Error(`VOICEVOX returned empty audio for "${text}"`);
      }

      const ff = spawnSync(
        "ffmpeg",
        [
          "-y",
          "-f",
          "wav",
          "-i",
          "pipe:0",
          "-codec:a",
          "libmp3lame",
          "-b:a",
          "48k",
          "-ar",
          "24000",
          "-ac",
          "1",
          outPath,
        ],
        { input: wavBuffer }
      );
      if (ff.status !== 0) {
        throw new Error(`ffmpeg transcode failed: ${ff.stderr?.toString() ?? "unknown error"}`);
      }
      if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
        throw new Error(`Generated empty MP3 file: ${outPath}`);
      }
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function buildStoryAudio(args = process.argv.slice(2)): Promise<void> {
  const tasks = buildTasks(args);
  const dryRun = args.includes("--dry-run");
  const useGemini = args.includes("--gemini");
  const useElevenLabs = args.includes("--elevenlabs");
  const useKenpath = args.includes("--kenpath");
  const useVoicevox = args.includes("--voicevox");
  const voicevoxBaseUrl = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();
  const voicevoxSpeakerId = Number.parseInt(
    args.find((a) => a.startsWith("--speaker="))?.split("=")[1] ||
      process.env.VOICEVOX_DEFAULT_SPEAKER ||
      "3",
    10
  );
  const voicevoxSpeedScale = Number.parseFloat(
    args.find((a) => a.startsWith("--speed="))?.split("=")[1] || "1.0"
  );
  const kenpathApiKey = (process.env.KENPATH_LABS_API_KEY || "").trim();
  const kenpathVoiceId =
    args.find((a) => a.startsWith("--voice="))?.split("=")[1] ||
    process.env.KENPATH_VOICE_ID ||
    "sv_qy4oztyr"; // Aoi (Calm female voice with Tokyo accent)
  const elevenLabsApiKey = (process.env.ELEVENLABS_API_KEY || "").trim();
  const elevenVoiceId =
    args.find((a) => a.startsWith("--voice="))?.split("=")[1] ||
    process.env.ELEVENLABS_VOICE_ID ||
    "pFZP5JQG7iQjIQuC4Bku"; // Lily (Velvety, expressive Japanese storytelling)

  const geminiApiKeys: string[] = [];
  // If GEMINI_API_KEY3 is set, prioritize it first since it has fresh quota
  if (process.env.GEMINI_API_KEY3) {
    geminiApiKeys.push(process.env.GEMINI_API_KEY3.trim());
  }
  if (process.env.GEMINI_API_KEY) {
    geminiApiKeys.push(
      ...process.env.GEMINI_API_KEY.split(",").map((k) => k.trim()).filter(Boolean)
    );
  }
  for (let i = 1; i <= 20; i++) {
    if (i === 3) continue;
    const val = process.env[`GEMINI_API_KEY${i}`] || process.env[`GEMINI_API_KEY_${i}`];
    if (val && typeof val === "string" && val.trim()) {
      geminiApiKeys.push(val.trim());
    }
  }

  const provider = useVoicevox
    ? "VOICEVOX"
    : useKenpath
      ? "KENPATH"
      : useElevenLabs
        ? "ELEVENLABS"
        : useGemini
          ? "GEMINI (Aoede)"
          : "EDGE (Nanami)";
  const activeVoice = useVoicevox
    ? `Speaker ${voicevoxSpeakerId} (speed: ${voicevoxSpeedScale}x)`
    : useKenpath
      ? kenpathVoiceId
      : useElevenLabs
        ? elevenVoiceId
        : "";
  console.log(
    `[Story Audio] ${tasks.length} clips to synthesize${dryRun ? " (dry run)" : ""}. Provider: ${provider}${activeVoice ? ` [Voice: ${activeVoice}]` : ""}`
  );
  if (dryRun || tasks.length === 0) return;

  let currentStory = "";
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]!;
    if (task.slug !== currentStory) {
      currentStory = task.slug;
      console.log(`\n=== Story: ${currentStory} ===`);
    }
    const cleanText = task.text
      .replace(/（[ぁ-んァ-ヶー]+）/g, "")
      .replace(/\([ぁ-んァ-ヶー]+\)/g, "")
      .trim();

    process.stdout.write(`[${index + 1}/${tasks.length}] sentence ${task.index + 1}... `);
    if (useVoicevox) {
      await synthesizeVoicevoxClip(
        cleanText,
        voicevoxSpeakerId,
        task.targetFile,
        voicevoxBaseUrl,
        voicevoxSpeedScale
      );
    } else if (useKenpath && kenpathApiKey) {
      await synthesizeKenpathClip(cleanText, kenpathVoiceId, task.targetFile, kenpathApiKey);
    } else if (useElevenLabs && elevenLabsApiKey) {
      await synthesizeElevenLabsClip(cleanText, elevenVoiceId, task.targetFile, elevenLabsApiKey);
    } else if (useGemini && geminiApiKeys.length > 0) {
      await synthesizeGeminiTtsClip(cleanText, "Aoede", task.targetFile, geminiApiKeys);
    } else {
      await synthesizeFile(cleanText, task.targetFile);
    }
    process.stdout.write(`Done (${fs.statSync(task.targetFile).size} bytes)\n`);
    await new Promise((resolve) => setTimeout(resolve, useKenpath ? 1250 : useVoicevox ? 20 : 200));
  }
  console.log(`\n✓ All ${tasks.length} clips synthesized successfully!`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildStoryAudio().catch((error: unknown) => {
    console.error("[Story Audio Pipeline Error]", error);
    process.exitCode = 1;
  });
}
