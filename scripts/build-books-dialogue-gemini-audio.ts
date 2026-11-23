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
  AOEDE: "Aoede",               // Young expressive female (Mary, Sue, Michiko, Yui, Mana)
  ACHERNAR: "Achernar",         // Soft, bright young female staff (Vendor, Store attendant, Hotel desk, Information agent)
  SULAFAT: "Sulafat",           // Warm, clear young female (Sora, Restaurant attendant / Waitress)
  KORE: "Kore",                 // Mature female (Host mother, Landlady)
  VINDEMIATRIX: "Vindemiatrix", // Gentle elderly female base (Old woman / おばあさん)
  LEDA: "Leda",                 // Fallback female
  PUCK: "Puck",                 // Crisp young male student (Takeshi, Ken, John, Tanaka)
  CHARON: "Charon",             // Calm, resonant foreign student (Robert)
  FENRIR: "Fenrir",             // Authoritative / older male (Prof. Yamashita, Father, Manager, Police, Doctor, Station attendant)
};

export function getVoiceForSpeaker(speaker: string, speakerJa: string): string {
  const norm = speaker.toLowerCase().trim();
  const normJa = speakerJa.toLowerCase().trim();

  // 1. Robert gets distinct calm resonant tone
  if (norm.includes("robert") || normJa.includes("ロバート")) {
    return GEMINI_VOICES.CHARON;
  }

  // 2. Elderly female (Old woman / おばあさん)
  if (norm.includes("old woman") || normJa.includes("おばあさん")) {
    return GEMINI_VOICES.VINDEMIATRIX;
  }

  // 3. Sora & Restaurant Attendant / Waitress (young female maid/waitress avatar)
  if (
    norm.includes("sora") ||
    normJa.includes("ソラ") ||
    norm.includes("waitress") ||
    (norm.includes("restaurant") && norm.includes("attendant"))
  ) {
    return GEMINI_VOICES.SULAFAT;
  }

  // 4. Young female service staff (Vendor, Store attendant, Shop assistant, Hotel front desk, Information agent)
  if (
    norm.includes("vendor") ||
    norm.includes("store attendant") ||
    norm.includes("shop assistant") ||
    norm.includes("hotel") ||
    norm.includes("desk") ||
    norm.includes("information agent") ||
    norm.includes("agent") ||
    norm.includes("assistant") ||
    normJa.includes("みせのひと") ||
    normJa.includes("店の人") ||
    normJa.includes("店員") ||
    normJa.includes("ホテルの人") ||
    normJa.includes("案内所の人")
  ) {
    return GEMINI_VOICES.ACHERNAR;
  }

  // 5. Older / Professional / Authority male (Prof. Yamashita, Father, Manager, Doctor, Station attendant, Police, Old man)
  if (
    norm.includes("prof") ||
    norm.includes("yamashita") ||
    norm.includes("father") ||
    norm.includes("station attendant") ||
    norm.includes("attendant") ||
    norm.includes("doctor") ||
    norm.includes("manager") ||
    norm.includes("old man") ||
    norm.includes("police") ||
    normJa.includes("先生") ||
    normJa.includes("父") ||
    normJa.includes("店長") ||
    normJa.includes("医者") ||
    normJa.includes("駅員") ||
    normJa.includes("部長") ||
    normJa.includes("警察") ||
    normJa.includes("おじいさん")
  ) {
    return GEMINI_VOICES.FENRIR;
  }

  // 6. Young female students / friends
  if (
    norm.includes("mary") ||
    norm.includes("sue") ||
    norm.includes("michiko") ||
    norm.includes("yui") ||
    /\bmana\b/.test(norm) ||
    normJa.includes("メアリー") ||
    normJa.includes("スー") ||
    normJa.includes("みちこ") ||
    normJa.includes("ゆい") ||
    normJa.includes("マナ") ||
    normJa.includes("まな")
  ) {
    return GEMINI_VOICES.AOEDE;
  }

  // 7. Mature female (Host mother, Landlady)
  if (
    norm.includes("mother") ||
    norm.includes("landlady") ||
    norm.includes("woman") ||
    normJa.includes("母") ||
    normJa.includes("大家") ||
    normJa.includes("女性")
  ) {
    return GEMINI_VOICES.KORE;
  }

  // 8. Young male student (Takeshi, Ken, John, Tanaka, etc.)
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
          if (data.error || !res.ok) {
            const msg = data?.error?.message || `HTTP error ${res.status}`;
            if (
              res.status === 429 ||
              res.status >= 500 ||
              data?.error?.code === 429 ||
              data?.error?.status === "RESOURCE_EXHAUSTED" ||
              msg.includes("Quota exceeded") ||
              msg.includes("Resource has been exhausted")
            ) {
              // Rate limited on this key+model bucket or transient server error, try next bucket
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
            const isElderlyVoice = voice === GEMINI_VOICES.VINDEMIATRIX;
            const filterArgs = isElderlyVoice
              ? ["-af", "asetrate=24000*0.86,aresample=24000,atempo=0.98,vibrato=f=5.5:d=0.06"]
              : [];

            if (mime.includes("wav")) {
              execFileSync(
                "ffmpeg",
                [
                  "-y",
                  "-loglevel", "error",
                  "-i", tmpFile,
                  ...filterArgs,
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
                  ...filterArgs,
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
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
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
const DOCS_PROGRESS_FILE = path.join(process.cwd(), "docs/gemini-dialogues-progress.json");

// Keys targeted for Gemini TTS re-synthesis (female service staff, elderly woman, and Sora lines)
const FORCE_GEMINI_REGEN_KEYS = new Set([
  // Genki 1 L2 D1: Vendor (みせのひと) -> young female
  "genki-1:2:l2-scene-i:1",
  "genki-1:2:l2-scene-i:3",
  "genki-1:2:l2-scene-i:5",
  // Genki 1 L2 D2: Restaurant attendant (みせのひと) -> young female maid
  "genki-1:2:l2-scene-ii:0",
  "genki-1:2:l2-scene-ii:2",
  "genki-1:2:l2-scene-ii:4",
  "genki-1:2:l2-scene-ii:7",
  // Genki 1 L5 D2: Store attendant (店の人) -> young female
  "genki-1:5:l5-scene-ii:1",
  "genki-1:5:l5-scene-ii:3",
  // Genki 1 L6 D3: Old woman (おばあさん) -> elderly grandmother voice
  "genki-1:6:l6-scene-iii:0",
  "genki-1:6:l6-scene-iii:2",
  "genki-1:6:l6-scene-iii:4",
  // Genki 1 L7 D1 (and L6 D2): Sora (ソラ) lines that had low/male register
  "genki-1:6:l6-scene-ii:4",
  "genki-1:6:l6-scene-ii:6",
  "genki-1:7:l7-scene-i:1",
  "genki-1:7:l7-scene-i:9",
  // Genki 1 L9 D3: Vendor (店の人) -> young female
  "genki-1:9:l9-scene-iii:1",
  "genki-1:9:l9-scene-iii:3",
  // Genki 1 L10 D2: Hotel front desk (ホテルの人) -> young female
  "genki-1:10:l10-scene-ii:1",
  "genki-1:10:l10-scene-ii:3",
  "genki-1:10:l10-scene-ii:5",
  // Genki 2 L15 D3: Information agent (案内所の人) -> young female
  "genki-2:15:l15-scene-iii:1",
  "genki-2:15:l15-scene-iii:3",
  "genki-2:15:l15-scene-iii:5",
  // Genki 2 L19 D2 & L20 D1: Waitress & Shop assistant (店員) -> young female
  "genki-2:19:l19-scene-ii:0",
  "genki-2:19:l19-scene-ii:2",
  "genki-2:19:l19-scene-ii:3",
  "genki-2:20:l20-scene-i:1",
]);

function loadProgress(): Set<string> {
  const forceAll = process.argv.includes("--all");
  if (forceAll) return new Set();

  let keys = new Set<string>();
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      keys = new Set(Array.isArray(data) ? data : data.completedKeys || []);
    } catch {
      // Fall through to docs progress file
    }
  }
  if (keys.size === 0 && fs.existsSync(DOCS_PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DOCS_PROGRESS_FILE, "utf-8"));
      keys = new Set(Array.isArray(data) ? data : data.completedKeys || []);
    } catch {
      keys = new Set();
    }
  }

  // Filter out any keys targeted for regeneration
  const filtered = new Set<string>();
  for (const k of keys) {
    if (!FORCE_GEMINI_REGEN_KEYS.has(k)) {
      filtered.add(k);
    }
  }
  return filtered;
}

function saveProgress(completedKeys: Set<string>, totalTasks = 374) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  const arr = Array.from(completedKeys);
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(arr, null, 2), "utf-8");
  try {
    fs.mkdirSync(path.dirname(DOCS_PROGRESS_FILE), { recursive: true });
    fs.writeFileSync(DOCS_PROGRESS_FILE, JSON.stringify({
      totalLines: totalTasks,
      completedCount: completedKeys.size,
      remainingCount: Math.max(0, totalTasks - completedKeys.size),
      completedKeys: arr,
    }, null, 2), "utf-8");
  } catch {
    // Non-fatal if docs write fails
  }
}

async function main() {
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
  ];

  const tasks: DialogueTask[] = [];
  const bookDataMap = new Map<string, { lessons: Array<{ lessonNumber: number; dialogues?: Array<{ id: string; sceneNumber?: string; lines: Array<{ speaker?: string; speakerJa?: string; ja: string; en?: string; audioSrc?: string; hasAudio?: boolean }> }> }> }>();

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
  console.log(` Total dialogue lines:        ${tasks.length}`);
  console.log(` Already Gemini-synthesized:   ${completedKeys.size}`);
  console.log(` Remaining to synthesize:     ${tasks.length - completedKeys.size}`);
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
    saveProgress(completedKeys, tasks.length);

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
