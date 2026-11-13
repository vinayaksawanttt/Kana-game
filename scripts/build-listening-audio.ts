import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Paths
const DATA_DIR = path.resolve(process.cwd(), "public/data/v1/jlpt");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/listening-scenes");
const SCRATCH_ROOT = path.resolve(process.cwd(), "node_modules/.cache/listening-audio-scratch");
const GEMINI_CACHE_DIR = path.resolve(process.cwd(), "node_modules/.cache/gemini-tts-cache");

// TTS Configuration - OpenAI
export const TTS_MODEL = "tts-1-hd";
export const TTS_SPEED = 0.92;
export const VOICE_NARRATOR = process.env.TTS_VOICE_NARRATOR || "alloy";
export const VOICE_FEMALE = process.env.TTS_VOICE_FEMALE || "nova";
export const VOICE_MALE = process.env.TTS_VOICE_MALE || "onyx";

// Edge TTS Configuration
export const EDGE_VOICE_NARRATOR = "ja-JP-NanamiNeural";
export const EDGE_VOICE_FEMALE = "ja-JP-NanamiNeural";
export const EDGE_VOICE_MALE = "ja-JP-KeitaNeural";
export const EDGE_RATE = "-8%";

// Gemini TTS Configuration
export const GEMINI_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
  "gemini-2.5-flash-preview-tts",
];
export const GEMINI_VOICE_NARRATOR = "Aoede";
export const GEMINI_VOICE_FEMALE = "Kore";
export const GEMINI_VOICE_MALE = "Charon";

// VOICEVOX Configuration
export const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();
export const VOICEVOX_SPEAKER_NARRATOR = 30; // No.7 (アナウンス / Announcement)
export const VOICEVOX_SPEAKER_FEMALE_DEFAULT = 2; // 四国めたん
export const VOICEVOX_SPEAKER_MALE_DEFAULT = 11; // 玄野武宏

// Multiple VOICEVOX speaker casting tailored to each exam scenario
export const SCENE_VOICEVOX_SPEAKERS: Record<
  string,
  {
    narrator?: number;
    female?: number;
    male?: number;
  }
> = {
  // N5 Scenes
  "n5-scene-bag-shelf": { narrator: 30, female: 2, male: 21 }, // 四国めたん & 剣崎雌雄
  "n5-scene-sock-shop": { narrator: 30, female: 8, male: 11 }, // 春日部つむぎ & 玄野武宏
  "n5-scene-bus-stop": { narrator: 30, female: 10, male: 13 }, // 雨晴はう & 青山龍星

  // N4 Scenes
  "n4-scene-hospital-gift": { narrator: 30, female: 2, male: 12 }, // 四国めたん & 白上虎太郎
  "n4-scene-library-copier": { narrator: 30, female: 20, male: 21 }, // もち子さん & 剣崎雌雄
  "n4-scene-meeting-room": { narrator: 30, female: 8, male: 11 }, // 春日部つむぎ & 玄野武宏

  // N3 Scenes
  "n3-scene-errands-before-movie": { narrator: 30, female: 20, male: 12 }, // もち子さん & 白上虎太郎
  "n3-scene-welcome-trip-planning": { narrator: 30, female: 10, male: 21 }, // 雨晴はう & 剣崎雌雄
  "n3-scene-house-check-before-leaving": { narrator: 30, female: 23, male: 13 }, // WhiteCUL & 青山龍星

  // N2 Scenes
  "n2-scene-cinema-family-tickets": { narrator: 30, female: 2, male: 11 }, // 四国めたん & 玄野武宏
  "n2-scene-summer-seminar-planning": { narrator: 30, female: 14, male: 99 }, // 冥鳴ひまり & 離途
  "n2-scene-overseas-business-trip-packing": { narrator: 30, female: 8, male: 13 }, // 春日部つむぎ & 青山龍星

  // N1 Scenes
  "n1-scene-restaurant-incident": { narrator: 30, female: 20, male: 11 }, // もち子さん & 玄野武宏
  "n1-scene-internship-selection": { narrator: 30, female: 10, male: 99 }, // 雨晴はう & 離途
  "n1-scene-printer-repair-documents": { narrator: 30, female: 23, male: 21 }, // WhiteCUL & 剣崎雌雄
};

export type AudioProvider = "openai" | "edge" | "gemini" | "voicevox";

// Round-robin state trackers
let currentModelIndex = 0;
let currentKeyIndex = 0;
const exhaustedModelKeyCombos = new Set<string>();

export interface DialogueLine {
  speaker: string;
  speakerLabelJa?: string;
  speakerLabelEn?: string;
  voiceGender?: "male" | "female" | "narrator" | string;
  textJa: string;
  readingHiragana?: string;
  textEn?: string;
  pauseAfterMs?: number;
}

export interface ValidatedScene {
  id: string;
  jlpt: number;
  titleJa?: string;
  introJa: string;
  questionJa: string;
  dialogueLines: DialogueLine[];
}

/**
 * Resolves chime files from standard directories.
 */
export function resolveChimeFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), "public/audio/sfx", filename),
    path.resolve(process.cwd(), "public/audio", filename),
    path.resolve(process.cwd(), filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return candidate;
    }
  }

  throw new Error(`Required chime file "${filename}" could not be found in any candidate directory.`);
}

/**
 * Generates an MP3 silence file of exact duration using FFmpeg anullsrc.
 */
export function createSilenceChunk(durationSec: number, outPath: string): void {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    return;
  }

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=stereo",
      "-t",
      durationSec.toString(),
      "-acodec",
      "libmp3lame",
      "-b:a",
      "128k",
      outPath,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
}

/**
 * Validates raw JSON object and extracts structured scene fields.
 */
export function validateListeningScene(raw: unknown, fileSource: string): ValidatedScene {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Invalid scene record in ${fileSource}: record is not an object.`);
  }

  const s = raw as Record<string, unknown>;

  if (typeof s.id !== "string" || !s.id.trim()) {
    throw new Error(`Scene in ${fileSource} is missing required string 'id'.`);
  }

  if (typeof s.jlpt !== "number" || s.jlpt < 1 || s.jlpt > 5) {
    throw new Error(`Scene "${s.id}" has invalid 'jlpt' level: ${s.jlpt}`);
  }

  if (!Array.isArray(s.audioSequence) || s.audioSequence.length < 3) {
    throw new Error(`Scene "${s.id}" has invalid or insufficient 'audioSequence' items.`);
  }

  // Extract introJa
  const rawAudioSeq = s.audioSequence as DialogueLine[];
  const explicitIntro = typeof s.introJa === "string" && s.introJa.trim() ? s.introJa.trim() : "";
  const firstSeqIntro = rawAudioSeq[0]?.textJa ? rawAudioSeq[0].textJa.trim() : "";
  const introJa = explicitIntro || firstSeqIntro;

  if (!introJa) {
    throw new Error(`Scene "${s.id}" has missing or empty 'introJa'.`);
  }

  // Extract questionJa
  const explicitQuestion = typeof s.questionJa === "string" && s.questionJa.trim() ? s.questionJa.trim() : "";
  const rawQuestions = Array.isArray(s.questions) ? (s.questions as Array<Record<string, unknown>>) : [];
  const primaryQ = rawQuestions.find((q) => q.isPrimaryMondai) || rawQuestions[0];
  const primaryQText = typeof primaryQ?.questionJa === "string" ? primaryQ.questionJa.trim() : "";
  const secondSeqQuestion = rawAudioSeq[1]?.textJa ? rawAudioSeq[1].textJa.trim() : "";
  const questionJa = explicitQuestion || primaryQText || secondSeqQuestion;

  if (!questionJa) {
    throw new Error(`Scene "${s.id}" has missing or empty 'questionJa'.`);
  }

  // Extract dialogue lines (conversational turns between characters)
  let dialogueLines: DialogueLine[];
  if (
    rawAudioSeq.length >= 4 &&
    rawAudioSeq[0].speaker === "Narrator" &&
    rawAudioSeq[1].speaker === "Narrator" &&
    rawAudioSeq[rawAudioSeq.length - 1].speaker === "Narrator"
  ) {
    dialogueLines = rawAudioSeq.slice(2, -1);
  } else {
    dialogueLines = rawAudioSeq.filter(
      (line, idx) => line.speaker !== "Narrator" && idx > 0
    );
  }

  if (dialogueLines.length === 0) {
    throw new Error(`Scene "${s.id}" has no dialogue lines.`);
  }

  for (let i = 0; i < dialogueLines.length; i++) {
    const line = dialogueLines[i];
    if (!line.textJa || typeof line.textJa !== "string" || !line.textJa.trim()) {
      throw new Error(`Scene "${s.id}" dialogue line index ${i} is missing 'textJa'.`);
    }
  }

  return {
    id: s.id,
    jlpt: s.jlpt,
    titleJa: typeof s.titleJa === "string" ? s.titleJa : undefined,
    introJa,
    questionJa,
    dialogueLines,
  };
}

/**
 * Determines voice selection based on voiceGender or speaker tag.
 */
export function getVoiceForLine(
  line: DialogueLine,
  provider: AudioProvider = "openai"
): string {
  const gender = (line.voiceGender || "").toLowerCase();
  const speaker = (line.speaker || "").toUpperCase();

  if (provider === "voicevox") {
    if (gender === "male" || speaker === "M") {
      return String(VOICEVOX_SPEAKER_MALE_DEFAULT);
    }
    if (gender === "female" || speaker === "F") {
      return String(VOICEVOX_SPEAKER_FEMALE_DEFAULT);
    }
    return String(VOICEVOX_SPEAKER_NARRATOR);
  }

  if (provider === "gemini") {
    if (gender === "male" || speaker === "M") {
      return GEMINI_VOICE_MALE;
    }
    return GEMINI_VOICE_FEMALE;
  }

  if (provider === "edge") {
    if (gender === "male" || speaker === "M") {
      return EDGE_VOICE_MALE;
    }
    return EDGE_VOICE_FEMALE;
  }

  if (gender === "female" || speaker === "F") {
    return VOICE_FEMALE;
  }
  if (gender === "male" || speaker === "M") {
    return VOICE_MALE;
  }
  return VOICE_NARRATOR;
}

/**
 * Returns tailored VOICEVOX speaker ID for a scene dialogue line.
 */
export function getVoicevoxSpeakerForLine(sceneId: string, line: DialogueLine): number {
  const sceneConfig = SCENE_VOICEVOX_SPEAKERS[sceneId] || {};
  const gender = (line.voiceGender || "").toLowerCase();
  const speaker = (line.speaker || "").toUpperCase();

  if (gender === "narrator" || speaker === "NARRATOR" || speaker === "ANNOUNCER") {
    return sceneConfig.narrator ?? VOICEVOX_SPEAKER_NARRATOR;
  }
  if (gender === "female" || speaker === "F" || speaker === "WOMAN") {
    return sceneConfig.female ?? VOICEVOX_SPEAKER_FEMALE_DEFAULT;
  }
  if (gender === "male" || speaker === "M" || speaker === "MAN") {
    return sceneConfig.male ?? VOICEVOX_SPEAKER_MALE_DEFAULT;
  }
  return sceneConfig.narrator ?? VOICEVOX_SPEAKER_NARRATOR;
}

/**
 * Synthesizes a TTS clip using local VOICEVOX engine and encodes to MP3 via ffmpeg.
 */
export async function synthesizeVoicevoxClip(
  text: string,
  speakerId: number,
  outPath: string,
  baseUrl = VOICEVOX_BASE_URL,
  speedScale = 0.96
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
          "128k",
          "-ar",
          "44100",
          "-ac",
          "2",
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
    } catch (err: unknown) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

/**
 * Synthesizes a TTS clip using Edge TTS.
 */
export async function synthesizeEdgeTtsClip(
  text: string,
  voice: string,
  outPath: string
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: EDGE_RATE });
        const output = fs.createWriteStream(outPath);
        audioStream.pipe(output);
        output.on("finish", () => resolve());
        output.on("error", (err) => reject(err));
        audioStream.on("error", (err) => reject(err));
      });

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
        return;
      }
      throw new Error(`Generated empty audio file: ${outPath}`);
    } catch (err: unknown) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
}

/**
 * Synthesizes a TTS clip using Gemini API with persistent caching and round-robin multi-model/multi-key failover.
 */
export async function synthesizeGeminiTtsClip(
  text: string,
  voice: string,
  outPath: string,
  apiKeys: string[]
): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(GEMINI_CACHE_DIR, { recursive: true });

  // Check persistent disk cache first
  const cacheHash = crypto.createHash("md5").update(`${voice}:${text}`).digest("hex");
  const cachePath = path.join(GEMINI_CACHE_DIR, `${cacheHash}.mp3`);

  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 500) {
    fs.copyFileSync(cachePath, outPath);
    return;
  }

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys provided for synthesis.");
  }

  const totalPossibleCombos = GEMINI_MODELS.length * apiKeys.length;
  if (exhaustedModelKeyCombos.size >= totalPossibleCombos) {
    throw new Error("All Gemini API keys and models have exhausted their daily quotas for today.");
  }

  const maxTotalAttempts = totalPossibleCombos * 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxTotalAttempts; attempt++) {
    const model = GEMINI_MODELS[currentModelIndex % GEMINI_MODELS.length];
    const apiKey = apiKeys[currentKeyIndex % apiKeys.length];
    const comboKey = `${apiKey}:${model}`;

    if (exhaustedModelKeyCombos.has(comboKey)) {
      currentModelIndex++;
      currentKeyIndex++;
      continue;
    }

    try {
      const body = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (data.error) {
        const errorMsg = data.error.message || "Gemini TTS error";
        const isQuota = data.error.code === 429 || errorMsg.includes("Quota exceeded") || errorMsg.includes("rate-limit") || errorMsg.includes("exceeded your current quota");

        if (isQuota) {
          if (errorMsg.includes("exceeded your current quota") || errorMsg.includes("Quota exceeded")) {
            exhaustedModelKeyCombos.add(comboKey);
            if (exhaustedModelKeyCombos.size >= totalPossibleCombos) {
              throw new Error("All Gemini daily quotas exhausted for today.");
            }
          }
          // Switch model and key to try a different project bucket immediately
          currentModelIndex++;
          currentKeyIndex++;
          const nextModel = GEMINI_MODELS[currentModelIndex % GEMINI_MODELS.length];
          console.warn(`[WARN] Quota limit on ${model}. Rotating to key ${(currentKeyIndex % apiKeys.length) + 1} / model ${nextModel}...`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }

        throw new Error(errorMsg);
      }

      const candidate = data.candidates?.[0];
      const inlineData = candidate?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) {
        throw new Error(`No audio data returned by model ${model}`);
      }

      const audioBuffer = Buffer.from(inlineData.data, "base64");
      const mimeType = inlineData.mimeType || "";

      if (mimeType.includes("wav")) {
        const tempWav = `${outPath}.wav`;
        fs.writeFileSync(tempWav, audioBuffer);
        execFileSync(
          "ffmpeg",
          ["-y", "-i", tempWav, "-c:a", "libmp3lame", "-b:a", "192k", outPath],
          { stdio: ["ignore", "pipe", "pipe"] }
        );
        if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
      } else {
        // Raw linear PCM (audio/L16 24kHz)
        const tempPcm = `${outPath}.pcm`;
        fs.writeFileSync(tempPcm, audioBuffer);
        execFileSync(
          "ffmpeg",
          ["-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tempPcm, "-c:a", "libmp3lame", "-b:a", "192k", outPath],
          { stdio: ["ignore", "pipe", "pipe"] }
        );
        if (fs.existsSync(tempPcm)) fs.unlinkSync(tempPcm);
      }

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
        // Cache to permanent disk cache
        fs.copyFileSync(outPath, cachePath);
        // Advance round-robin index smoothly for load balancing
        currentModelIndex++;
        return;
      }

      throw new Error(`Generated empty audio file from ${model}`);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Rotate model on any error
      currentModelIndex++;
      if (currentModelIndex % GEMINI_MODELS.length === 0) {
        currentKeyIndex++;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`All Gemini round-robin attempts failed: ${lastError?.message || "Unknown error"}`);
}

/**
 * Synthesizes a TTS clip using Gemini, Edge TTS, or OpenAI tts-1-hd.
 */
export async function synthesizeTtsClip(
  openai: OpenAI | null,
  text: string,
  voice: string,
  outPath: string,
  dryRun: boolean,
  provider: AudioProvider = "openai",
  geminiApiKeys: string[] = []
): Promise<void> {
  if (dryRun) {
    createSilenceChunk(0.8, outPath);
    return;
  }

  if (provider === "voicevox") {
    const speakerId = Number.parseInt(voice, 10) || VOICEVOX_SPEAKER_NARRATOR;
    await synthesizeVoicevoxClip(text, speakerId, outPath);
    return;
  }

  if (provider === "gemini") {
    await synthesizeGeminiTtsClip(text, voice, outPath, geminiApiKeys);
    return;
  }

  if (provider === "edge" || !openai) {
    await synthesizeEdgeTtsClip(text, voice, outPath);
    return;
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.audio.speech.create({
        model: TTS_MODEL,
        voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        input: text,
        speed: TTS_SPEED,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) {
        throw new Error("Received empty audio response from OpenAI TTS API.");
      }
      fs.writeFileSync(outPath, buffer);
      return;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (attempt === maxRetries) {
        throw new Error(`TTS synthesis failed after ${maxRetries} attempts: ${errMsg}`);
      }
      const backoffMs = 1000 * Math.pow(2, attempt - 1);
      console.warn(`[WARN] TTS attempt ${attempt} failed: ${errMsg}. Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

/**
 * Merges a list of audio files into a single MP3 using fluent-ffmpeg.
 */
export async function mergeAudioChunks(
  inputFiles: string[],
  outputFile: string,
  scratchDir: string
): Promise<void> {
  for (const input of inputFiles) {
    if (!fs.existsSync(input) || fs.statSync(input).size === 0) {
      throw new Error(`Cannot merge audio: input chunk is missing or empty: ${input}`);
    }
  }

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    for (const file of inputFiles) {
      cmd.input(file);
    }

    cmd
      .on("error", (err) => {
        reject(err);
      })
      .on("end", () => {
        resolve();
      })
      .mergeToFile(outputFile, scratchDir);
  });
}

/**
 * Loads all scenes from public/data/v1/jlpt/listening-scenes-n[1-5].json
 */
export function loadAllListeningScenes(): ValidatedScene[] {
  const levels = [5, 4, 3, 2, 1];
  const allScenes: ValidatedScene[] = [];

  for (const level of levels) {
    const fileName = `listening-scenes-n${level}.json`;
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Dataset file not found: ${filePath}`);
    }

    const rawContent = fs.readFileSync(filePath, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr: unknown) {
      throw new Error(`Failed to parse JSON in ${filePath}: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(`Expected an array of scenes in ${filePath}, got ${typeof parsed}`);
    }

    for (let i = 0; i < parsed.length; i++) {
      const validated = validateListeningScene(parsed[i], `${fileName} [index ${i}]`);
      allScenes.push(validated);
    }
  }

  return allScenes;
}

/**
 * Builds the complete audio for a single scene according to the required 11-step stitching specification:
 */
export async function buildSceneAudio(
  scene: ValidatedScene,
  options: {
    openai: OpenAI | null;
    outputDir: string;
    scratchRoot: string;
    firstChimePath: string;
    secondChimePath: string;
    dryRun: boolean;
    force: boolean;
    provider?: AudioProvider;
    geminiApiKeys?: string[];
    mergeFn?: (inputFiles: string[], outputFile: string, scratchDir: string) => Promise<void>;
  }
): Promise<string> {
  const targetMp3 = path.join(options.outputDir, `${scene.id}.mp3`);
  if (!options.force && fs.existsSync(targetMp3) && fs.statSync(targetMp3).size > 1000) {
    console.log(`[SKIP] Scene "${scene.id}" already generated: ${targetMp3}`);
    return targetMp3;
  }

  const provider = options.provider || "voicevox";
  let narratorVoice: string;
  if (provider === "voicevox") {
    narratorVoice = String(SCENE_VOICEVOX_SPEAKERS[scene.id]?.narrator ?? VOICEVOX_SPEAKER_NARRATOR);
  } else if (provider === "gemini") {
    narratorVoice = GEMINI_VOICE_NARRATOR;
  } else if (provider === "edge") {
    narratorVoice = EDGE_VOICE_NARRATOR;
  } else {
    narratorVoice = VOICE_NARRATOR;
  }

  const sceneScratchDir = path.join(options.scratchRoot, scene.id);
  fs.mkdirSync(sceneScratchDir, { recursive: true });

  // Pre-generate required silence chunks in scratch root for efficiency
  const silence500 = path.join(options.scratchRoot, "silence_500ms.mp3");
  const silence1000 = path.join(options.scratchRoot, "silence_1000ms.mp3");
  const silence600 = path.join(options.scratchRoot, "silence_600ms.mp3");
  const silence400 = path.join(options.scratchRoot, "silence_400ms.mp3");
  const silence1200 = path.join(options.scratchRoot, "silence_1200ms.mp3");

  createSilenceChunk(0.5, silence500);
  createSilenceChunk(1.0, silence1000);
  createSilenceChunk(0.6, silence600);
  createSilenceChunk(0.4, silence400);
  createSilenceChunk(1.2, silence1200);

  // Step 3: Narrator reads introJa followed by questionJa
  const chunk03Path = path.join(sceneScratchDir, "chunk_03_narrator_intro_question.mp3");
  const introQuestionText = `${scene.introJa} ${scene.questionJa}`;
  await synthesizeTtsClip(options.openai, introQuestionText, narratorVoice, chunk03Path, options.dryRun, provider, options.geminiApiKeys);

  // Step 7: Dialogue lines in audioSequence order using matching M/F voice
  const dialogueChunkPaths: string[] = [];
  for (let i = 0; i < scene.dialogueLines.length; i++) {
    const line = scene.dialogueLines[i];
    const voice =
      provider === "voicevox"
        ? String(getVoicevoxSpeakerForLine(scene.id, line))
        : getVoiceForLine(line, provider);
    const lineChunkPath = path.join(sceneScratchDir, `chunk_07_dialogue_${i}.mp3`);
    await synthesizeTtsClip(options.openai, line.textJa, voice, lineChunkPath, options.dryRun, provider, options.geminiApiKeys);
    dialogueChunkPaths.push(lineChunkPath);
  }

  // Step 11: Narrator repeats questionJa
  const chunk11Path = path.join(sceneScratchDir, "chunk_11_narrator_repeat_question.mp3");
  await synthesizeTtsClip(options.openai, scene.questionJa, narratorVoice, chunk11Path, options.dryRun, provider, options.geminiApiKeys);

  // Construct ordered list of chunks
  const orderedChunks: string[] = [
    options.firstChimePath,   // 1. first_chime.mp3
    silence500,               // 2. 500 ms silence
    chunk03Path,              // 3. Narrator reads introJa followed by questionJa
    silence1000,              // 4. 1000 ms silence
    options.secondChimePath,  // 5. second_chime.mp3
    silence600,               // 6. 600 ms silence
  ];

  // 7. Dialogue lines with 400 ms silence between turns
  for (let i = 0; i < dialogueChunkPaths.length; i++) {
    orderedChunks.push(dialogueChunkPaths[i]);
    if (i < dialogueChunkPaths.length - 1) {
      orderedChunks.push(silence400);
    }
  }

  // 8. 1200 ms silence
  orderedChunks.push(silence1200);

  // 9. first_chime.mp3
  orderedChunks.push(options.firstChimePath);

  // 10. 500 ms silence
  orderedChunks.push(silence500);

  // 11. Narrator repeats questionJa
  orderedChunks.push(chunk11Path);

  // Merge chunks into destination file
  const tempOutputFile = path.join(sceneScratchDir, `${scene.id}_assembled.mp3`);
  const merge = options.mergeFn || mergeAudioChunks;
  await merge(orderedChunks, tempOutputFile, sceneScratchDir);

  if (!fs.existsSync(tempOutputFile) || fs.statSync(tempOutputFile).size === 0) {
    throw new Error(`Assembled MP3 was not produced or is empty: ${tempOutputFile}`);
  }

  // Move final file to destination
  fs.copyFileSync(tempOutputFile, targetMp3);
  console.log(`[DONE] Scene "${scene.id}" (${(fs.statSync(targetMp3).size / 1024).toFixed(1)} KB) -> ${targetMp3}`);

  return targetMp3;
}

export interface ProcessScenesOptions {
  scenes: ValidatedScene[];
  openai: OpenAI | null;
  outputDir: string;
  scratchRoot: string;
  firstChimePath: string;
  secondChimePath: string;
  dryRun: boolean;
  force: boolean;
  provider?: AudioProvider;
  geminiApiKeys?: string[];
  mergeFn?: (inputFiles: string[], outputFile: string, scratchDir: string) => Promise<void>;
  buildSceneFn?: typeof buildSceneAudio;
}

export interface ProcessScenesResult {
  success: boolean;
  succeededScenes: string[];
  failedScenes: Array<{ id: string; error: string; scratchDir: string }>;
}

/**
 * Iterates through scenes, catching failures per scene and preserving diagnostic scratch data.
 */
export async function processListeningScenes(
  options: ProcessScenesOptions
): Promise<ProcessScenesResult> {
  const failedScenes: Array<{ id: string; error: string; scratchDir: string }> = [];
  const succeededScenes: string[] = [];
  const builder = options.buildSceneFn || buildSceneAudio;

  fs.mkdirSync(options.outputDir, { recursive: true });
  fs.mkdirSync(options.scratchRoot, { recursive: true });

  for (const scene of options.scenes) {
    const sceneScratchDir = path.join(options.scratchRoot, scene.id);
    try {
      await builder(scene, {
        openai: options.openai,
        outputDir: options.outputDir,
        scratchRoot: options.scratchRoot,
        firstChimePath: options.firstChimePath,
        secondChimePath: options.secondChimePath,
        dryRun: options.dryRun,
        force: options.force,
        provider: options.provider,
        geminiApiKeys: options.geminiApiKeys,
        mergeFn: options.mergeFn,
      });
      succeededScenes.push(scene.id);
    } catch (sceneErr: unknown) {
      const errorMsg = sceneErr instanceof Error ? sceneErr.message : String(sceneErr);
      console.error(`[ERROR] Scene "${scene.id}" failed: ${errorMsg}`);
      failedScenes.push({
        id: scene.id,
        error: errorMsg,
        scratchDir: sceneScratchDir,
      });
    }
  }

  const success = failedScenes.length === 0;
  if (success) {
    try {
      fs.rmSync(options.scratchRoot, { recursive: true, force: true });
      console.log(`Cleaned temporary scratch data at: ${options.scratchRoot}`);
    } catch (cleanErr: unknown) {
      console.warn(`[WARN] Failed to clean scratch directory: ${cleanErr instanceof Error ? cleanErr.message : String(cleanErr)}`);
    }
  }

  return {
    success,
    succeededScenes,
    failedScenes,
  };
}

/**
 * Main execution entry point.
 */
export async function main(): Promise<void> {
  const isDryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const useVoicevoxExplicit = process.argv.includes("--voicevox");
  const useGeminiExplicit = process.argv.includes("--gemini");
  const useOpenAiExplicit = process.argv.includes("--openai");
  const useEdgeExplicit = process.argv.includes("--edge");

  const geminiApiKeys: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    geminiApiKeys.push(
      ...process.env.GEMINI_API_KEY.split(",").map((k) => k.trim()).filter(Boolean)
    );
  }
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_API_KEY${i}`] || process.env[`GEMINI_API_KEY_${i}`];
    if (val && typeof val === "string" && val.trim()) {
      geminiApiKeys.push(val.trim());
    }
  }

  const openAiApiKey = (process.env.OPENAI_API_KEY || "").trim();

  // Provider resolution: default to voicevox if explicitly requested or default
  let provider: AudioProvider = "voicevox";
  if (useVoicevoxExplicit) {
    provider = "voicevox";
  } else if (useGeminiExplicit) {
    provider = "gemini";
  } else if (useOpenAiExplicit) {
    provider = "openai";
  } else if (useEdgeExplicit) {
    provider = "edge";
  } else {
    // Default to VOICEVOX if engine available, or fallback to gemini/edge
    provider = "voicevox";
  }

  console.log("=== JLPT Listening Scene Audio Builder ===");
  console.log(`Data Directory:    ${DATA_DIR}`);
  console.log(`Output Directory:  ${OUTPUT_DIR}`);
  console.log(`Scratch Root:      ${SCRATCH_ROOT}`);
  console.log(`TTS Provider:      ${provider.toUpperCase()}`);

  if (provider === "voicevox") {
    console.log(`Engine URL:        ${VOICEVOX_BASE_URL}`);
    console.log(`Narrator Speaker:  No.7 アナウンス (ID: ${VOICEVOX_SPEAKER_NARRATOR})`);
    console.log(`Multi-Speaker:     Scene-tailored casting (四国めたん, 春日部つむぎ, 雨晴はう, もち子さん, WhiteCUL, 冥鳴ひまり, 玄野武宏, 剣崎雌雄, 青山龍星, 白上虎太郎, 離途)`);
  } else if (provider === "gemini") {
    console.log(`Model Pool:        ${GEMINI_MODELS.join(", ")}`);
    console.log(`Active API Keys:   ${geminiApiKeys.length}`);
    console.log(`Voice (Narrator):  ${GEMINI_VOICE_NARRATOR} (Aoede)`);
    console.log(`Voice (Female):    ${GEMINI_VOICE_FEMALE} (Kore)`);
    console.log(`Voice (Male):      ${GEMINI_VOICE_MALE} (Charon)`);
    console.log(`Disk Chunk Cache:  ${GEMINI_CACHE_DIR}`);
  } else if (provider === "openai") {
    console.log(`TTS Model:         ${TTS_MODEL}`);
    console.log(`Speech Speed:      ${TTS_SPEED}`);
    console.log(`Voice (Narrator):  ${VOICE_NARRATOR}`);
    console.log(`Voice (Female):    ${VOICE_FEMALE}`);
    console.log(`Voice (Male):      ${VOICE_MALE}`);
  } else {
    console.log(`Speech Rate:       ${EDGE_RATE}`);
    console.log(`Voice (Narrator):  ${EDGE_VOICE_NARRATOR}`);
    console.log(`Voice (Female):    ${EDGE_VOICE_FEMALE}`);
    console.log(`Voice (Male):      ${EDGE_VOICE_MALE}`);
  }
  if (isDryRun) {
    console.log(`Mode:              DRY RUN (synthetic validation audio)`);
  }

  if (provider === "voicevox" && !isDryRun) {
    try {
      const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
      if (!ping.ok) {
        throw new Error(`HTTP ${ping.status}`);
      }
      const version = await ping.json();
      console.log(`VOICEVOX Engine:   v${version} (Connected)`);
    } catch (vvErr: unknown) {
      console.error("================================================================================");
      console.error(`ERROR: Cannot connect to VOICEVOX engine at ${VOICEVOX_BASE_URL}`);
      console.error("Please ensure the VOICEVOX engine is running on port 50021.");
      console.error("================================================================================");
      process.exit(1);
    }
  }

  if (provider === "gemini" && !isDryRun && geminiApiKeys.length === 0) {
    console.error("================================================================================");
    console.error("ERROR: GEMINI_API_KEY environment variable is missing or empty.");
    console.error("Please configure your Gemini API key in .env.local or .env:");
    console.error("  GEMINI_API_KEY=your_gemini_api_key_here");
    console.error("To use free Edge TTS instead without any API key, run with '--edge'.");
    console.error("================================================================================");
    process.exit(1);
  }

  if (provider === "openai" && !isDryRun && !openAiApiKey) {
    console.error("================================================================================");
    console.error("ERROR: OPENAI_API_KEY environment variable is missing or empty.");
    console.error("Please configure your OpenAI API key in .env.local or .env:");
    console.error("  OPENAI_API_KEY=your_openai_api_key_here");
    console.error("================================================================================");
    process.exit(1);
  }

  // Resolve chime files
  let firstChimePath: string;
  let secondChimePath: string;
  try {
    firstChimePath = resolveChimeFile("first_chime.mp3");
    secondChimePath = resolveChimeFile("second_chime.mp3");
    console.log(`Chime 1:           ${firstChimePath}`);
    console.log(`Chime 2:           ${secondChimePath}`);
  } catch (chimeErr: unknown) {
    console.error(`[FATAL] Chime resolution error: ${chimeErr instanceof Error ? chimeErr.message : String(chimeErr)}`);
    process.exit(1);
  }

  // Initialize OpenAI client if using OpenAI provider
  const openai = provider === "openai" && !isDryRun && openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;

  // Load all scenes
  let allScenes: ValidatedScene[];
  try {
    allScenes = loadAllListeningScenes();
    console.log(`Loaded ${allScenes.length} scenes across JLPT N5-N1.`);
  } catch (loadErr: unknown) {
    console.error(`[FATAL] Dataset load error: ${loadErr instanceof Error ? loadErr.message : String(loadErr)}`);
    process.exit(1);
  }

  // Process all scenes
  const result = await processListeningScenes({
    scenes: allScenes,
    openai,
    outputDir: OUTPUT_DIR,
    scratchRoot: SCRATCH_ROOT,
    firstChimePath,
    secondChimePath,
    dryRun: isDryRun,
    force,
    provider,
    geminiApiKeys,
  });

  // Report status and cleanup
  console.log("--------------------------------------------------------------------------------");
  if (result.success) {
    console.log(`[SUCCESS] All ${result.succeededScenes.length} scenes built successfully.`);
    process.exit(0);
  } else {
    console.error(`[FAILURE] ${result.failedScenes.length} of ${allScenes.length} scene(s) failed:`);
    for (const failed of result.failedScenes) {
      console.error(`  - Scene: ${failed.id}`);
      console.error(`    Error: ${failed.error}`);
      console.error(`    Diagnostic scratch location: ${failed.scratchDir}`);
    }
    process.exit(1);
  }
}

// Run main if invoked directly as CLI script
if (require.main === module || process.argv[1]?.endsWith("build-listening-audio.ts")) {
  main().catch((err) => {
    console.error("[FATAL] Unhandled error during build-listening-audio:", err);
    process.exit(1);
  });
}
