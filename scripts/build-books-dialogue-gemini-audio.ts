import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// Collect all Gemini API keys
const geminiApiKeys: string[] = [];
for (let i = 1; i <= 10; i++) {
  const k = process.env[`GEMINI_API_KEY${i}`] || (i === 1 ? process.env.GEMINI_API_KEY : undefined);
  if (k && k.trim() && !geminiApiKeys.includes(k.trim())) {
    geminiApiKeys.push(k.trim());
  }
}

if (geminiApiKeys.length === 0) {
  console.error("Missing GEMINI_API_KEY in environment or .env.local");
  process.exit(1);
}

console.log(`Loaded ${geminiApiKeys.length} Gemini API keys for synthesis.`);

// Gemini Voices
export const GEMINI_VOICES = {
  AOEDE: "Aoede",     // Young expressive female (Mary, Sue, Michiko, Yui, Mana)
  KORE: "Kore",       // Clear mature female / staff (Host mother, Sora, Waitress, Landlady)
  LEDA: "Leda",       // Elderly female (Old woman)
  PUCK: "Puck",       // Crisp young male student (Takeshi, Ken, John, Tanaka)
  CHARON: "Charon",   // Calm, resonant foreign student (Robert)
  FENRIR: "Fenrir",   // Authoritative / older male (Prof. Yamashita, Father, Manager, Police, Doctor)
};

export function getVoiceForSpeaker(speaker: string, speakerJa: string): string {
  const norm = speaker.toLowerCase().trim();
  const normJa = speakerJa.toLowerCase().trim();

  // 1. Robert gets distinct calm tone
  if (norm.includes("robert") || normJa.includes("ロバート")) {
    return GEMINI_VOICES.CHARON;
  }

  // 2. Elderly female
  if (norm.includes("old woman") || normJa.includes("おばあさん")) {
    return GEMINI_VOICES.LEDA;
  }

  // 3. Female characters
  if (
    norm.includes("mary") ||
    norm.includes("sue") ||
    norm.includes("michiko") ||
    norm.includes("yui") ||
    norm.includes("mana") ||
    normJa.includes("メアリー") ||
    normJa.includes("スー") ||
    normJa.includes("みちこ") ||
    normJa.includes("ゆい") ||
    normJa.includes("マナ")
  ) {
    return GEMINI_VOICES.AOEDE;
  }

  if (
    norm.includes("mother") ||
    norm.includes("sora") ||
    norm.includes("waitress") ||
    norm.includes("landlady") ||
    norm.includes("woman") ||
    normJa.includes("母") ||
    normJa.includes("ソラ") ||
    normJa.includes("大家") ||
    normJa.includes("女性")
  ) {
    return GEMINI_VOICES.KORE;
  }

  // 4. Older / Professional / Authority male
  if (
    norm.includes("prof") ||
    norm.includes("yamashita") ||
    norm.includes("father") ||
    norm.includes("vendor") ||
    norm.includes("attendant") ||
    norm.includes("desk") ||
    norm.includes("doctor") ||
    norm.includes("manager") ||
    norm.includes("agent") ||
    norm.includes("assistant") ||
    norm.includes("old man") ||
    norm.includes("police") ||
    normJa.includes("先生") ||
    normJa.includes("父") ||
    normJa.includes("店員") ||
    normJa.includes("店の人") ||
    normJa.includes("医者") ||
    normJa.includes("駅員") ||
    normJa.includes("部長") ||
    normJa.includes("警察") ||
    normJa.includes("おじいさん")
  ) {
    return GEMINI_VOICES.FENRIR;
  }

  // 5. Young male student (Takeshi, Ken, John, Tanaka, etc.)
  return GEMINI_VOICES.PUCK;
}

export function cleanSpokenText(raw: string): string {
  return raw
    .replace(/[「」『』]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MODELS = ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"];
let keyIndex = 0;
let modelIndex = 0;

async function synthesizeGeminiAudio(
  text: string,
  voice: string,
  outOpusPath: string
): Promise<number> {
  const cleaned = cleanSpokenText(text);

  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });

  // Handle empty or pure punctuation / speechless line (e.g. Takeshi's "……。")
  if (!cleaned || cleaned.replace(/[…・。、\s]/g, "").length === 0) {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-f", "lavfi",
        "-i", "anullsrc=r=24000:cl=mono",
        "-t", "0.5",
        "-c:a", "libopus",
        "-b:a", "32k",
        "-vbr", "on",
        outOpusPath,
      ],
      { stdio: "ignore" }
    );
    return fs.statSync(outOpusPath).size;
  }

  const maxRounds = 20;
  let lastError: Error | null = null;

  for (let round = 0; round < maxRounds; round++) {
    let anyBucketAvailable = false;

    // Try rotating across key & model pairs
    for (let k = 0; k < geminiApiKeys.length; k++) {
      for (let m = 0; m < MODELS.length; m++) {
        const key = geminiApiKeys[(keyIndex + k) % geminiApiKeys.length];
        const model = MODELS[(modelIndex + m) % MODELS.length];

        try {
          const body = {
            contents: [{ parts: [{ text: cleaned }] }],
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
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );

          const data = await res.json();
          if (data.error) {
            const msg = data.error.message || "Unknown error";
            if (msg.includes("Quota exceeded") || data.error.code === 429) {
              // Rate limited on this key+model bucket, try next bucket
              continue;
            }
            throw new Error(msg);
          }

          anyBucketAvailable = true;

          const part = data.candidates?.[0]?.content?.parts?.[0];
          if (!part?.inlineData?.data) {
            throw new Error(`No audio data from Gemini model ${model}`);
          }

          const audioBuf = Buffer.from(part.inlineData.data, "base64");
          const mime = part.inlineData.mimeType || "";
          const tmpFile = `${outOpusPath}.tmp.${mime.includes("wav") ? "wav" : "pcm"}`;
          fs.writeFileSync(tmpFile, audioBuf);

          try {
            if (mime.includes("wav")) {
              execFileSync(
                "ffmpeg",
                [
                  "-y",
                  "-loglevel", "error",
                  "-i", tmpFile,
                  "-ac", "1",
                  "-ar", "24000",
                  "-c:a", "libopus",
                  "-b:a", "32k",
                  "-vbr", "on",
                  outOpusPath,
                ],
                { stdio: "ignore" }
              );
            } else {
              execFileSync(
                "ffmpeg",
                [
                  "-y",
                  "-loglevel", "error",
                  "-f", "s16le",
                  "-ar", "24000",
                  "-ac", "1",
                  "-i", tmpFile,
                  "-c:a", "libopus",
                  "-b:a", "32k",
                  "-vbr", "on",
                  outOpusPath,
                ],
                { stdio: "ignore" }
              );
            }
          } finally {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
          }

          if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
            throw new Error(`Failed to generate valid opus: ${outOpusPath}`);
          }

          // Advance indices for round-robin load distribution
          keyIndex = (keyIndex + k + 1) % geminiApiKeys.length;
          modelIndex = (modelIndex + m + 1) % MODELS.length;
          return fs.statSync(outOpusPath).size;
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    if (!anyBucketAvailable) {
      process.stdout.write(`\n[Gemini 429 RPM Limit] All 12 key/model buckets rate-limited. Waiting 10s for reset (${round + 1}/${maxRounds})...\n`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  throw lastError || new Error("Failed to synthesize after multiple key/model rotations with backoff");
}

interface DialogueTask {
  taskKey: string;
  bookId: string;
  lessonNumber: number;
  sceneId: string;
  lineIndex: number;
  speaker: string;
  speakerJa: string;
  ja: string;
  en: string;
  outRelPath: string;
  outAbsPath: string;
}

const PROGRESS_FILE = path.join(process.cwd(), "node_modules/.cache/gemini-dialogues-progress.json");

function loadProgress(): Set<string> {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      return new Set(data);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

function saveProgress(completedKeys: Set<string>) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedKeys), null, 2), "utf-8");
}

async function main() {
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
  ];

  const tasks: DialogueTask[] = [];
  const bookDataMap = new Map<string, any>();

  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    bookDataMap.set(b.id, data);

    for (const lesson of data.lessons) {
      if (!lesson.dialogues) continue;
      for (const d of lesson.dialogues) {
        const sceneNum = (d.sceneNumber || "i").toLowerCase();
        for (let idx = 0; idx < d.lines.length; idx++) {
          const line = d.lines[idx];
          const outRelPath = `/audio/books/dialogues/${b.id}/l${lesson.lessonNumber}-scene-${sceneNum}-${idx}.opus`;
          const outAbsPath = path.join(process.cwd(), "public", outRelPath.slice(1));
          const taskKey = `${b.id}:${lesson.lessonNumber}:${d.id}:${idx}`;

          tasks.push({
            taskKey,
            bookId: b.id,
            lessonNumber: lesson.lessonNumber,
            sceneId: d.id,
            lineIndex: idx,
            speaker: line.speaker || "",
            speakerJa: line.speakerJa || "",
            ja: line.ja,
            en: line.en || "",
            outRelPath,
            outAbsPath,
          });
        }
      }
    }
  }

  const completedKeys = loadProgress();

  console.log("======================================================");
  console.log(" Google Gemini TTS — Textbook Dialogue Synthesizer");
  console.log(` Total dialogue lines: ${tasks.length}`);
  console.log(` Already completed:    ${completedKeys.size}`);
  console.log("======================================================\n");

  let totalBytes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (completedKeys.has(task.taskKey) && fs.existsSync(task.outAbsPath) && fs.statSync(task.outAbsPath).size > 100) {
      totalBytes += fs.statSync(task.outAbsPath).size;
      process.stdout.write(
        `[${i + 1}/${tasks.length}] (cached) ${task.bookId} L${task.lessonNumber} ${task.speaker}: "${task.ja.slice(0, 18)}..."\n`
      );
      continue;
    }

    const voice = getVoiceForSpeaker(task.speaker, task.speakerJa);

    process.stdout.write(
      `[${i + 1}/${tasks.length}] ${task.bookId} L${task.lessonNumber} ${task.speaker} (${voice}): "${task.ja.slice(0, 22)}..."`
    );

    const size = await synthesizeGeminiAudio(task.ja, voice, task.outAbsPath);
    totalBytes += size;
    completedKeys.add(task.taskKey);
    saveProgress(completedKeys);

    process.stdout.write(` -> ${(size / 1024).toFixed(1)} KB\n`);

    // 500ms pause
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n------------------------------------------------------");
  console.log("Dialogue Synthesis complete!");
  console.log(`  Lines generated: ${tasks.length}`);
  console.log(`  Total size:      ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log("------------------------------------------------------\n");

  // 1. Update book JSON files with audioSrc and hasAudio
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    const data = bookDataMap.get(b.id);
    if (!data) continue;

    for (const lesson of data.lessons) {
      if (!lesson.dialogues) continue;
      for (const d of lesson.dialogues) {
        const sceneNum = (d.sceneNumber || "i").toLowerCase();
        for (let idx = 0; idx < d.lines.length; idx++) {
          const line = d.lines[idx];
          line.audioSrc = `/audio/books/dialogues/${b.id}/l${lesson.lessonNumber}-scene-${sceneNum}-${idx}.opus`;
          line.hasAudio = true;
        }
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Updated ${b.file} with Gemini dialogue audioSrc.`);
  }

  // 2. Generate updated src/data/book-dialogues-audio.generated.ts
  const dialogueMap: Record<string, string> = {};
  for (const task of tasks) {
    dialogueMap[task.outRelPath] = task.outRelPath;
    const sceneNum = task.sceneId.replace(/^l\d+-scene-/, "");
    const idKey = `l${task.lessonNumber}-scene-${sceneNum}-${task.lineIndex}`;
    dialogueMap[idKey] = task.outRelPath;

    const cleaned = cleanSpokenText(task.ja);
    if (cleaned && !dialogueMap[cleaned]) {
      dialogueMap[cleaned] = task.outRelPath;
    }
  }

  const manifestPath = path.join(
    process.cwd(),
    "src/data/book-dialogues-audio.generated.ts"
  );
  const manifestContent = `// AUTO-GENERATED BY scripts/build-books-dialogue-gemini-audio.ts — DO NOT EDIT MANUALLY

export const STATIC_BOOK_DIALOGUE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    dialogueMap,
    null,
    2
  )};
`;

  fs.writeFileSync(manifestPath, manifestContent, "utf-8");
  console.log(
    `Generated manifest: src/data/book-dialogues-audio.generated.ts (${Object.keys(dialogueMap).length} entries)`
  );
}

main().catch((err) => {
  console.error("Gemini dialogue synthesis failed:", err);
  process.exit(1);
});
