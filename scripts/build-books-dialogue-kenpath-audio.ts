import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const KENPATH_API_KEY = (process.env.KENPATH_LABS_API_KEY || "").trim();
if (!KENPATH_API_KEY) {
  console.error("Missing KENPATH_LABS_API_KEY in .env.local");
  process.exit(1);
}

// Voice Rosters
export const VOICES = {
  AOI: "sv_qy4oztyr",   // Female (Natural Tokyo accent)
  REN: "sv_6q72qb26",   // Male (Calm Tokyo accent)
  KENTA: "sv_71lsoipx", // Older / Professional / Authority Male
};

export function getVoiceForSpeaker(speaker: string, speakerJa: string): string {
  const norm = speaker.toLowerCase().trim();
  const normJa = speakerJa.toLowerCase().trim();

  // 1. Older / Authority / Professional / Staff speakers -> Kenta
  if (
    norm.includes("prof") ||
    norm.includes("yamashita") ||
    norm.includes("vendor") ||
    norm.includes("attendant") ||
    norm.includes("father") ||
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
    normJa.includes("医者") ||
    normJa.includes("駅員") ||
    normJa.includes("部長") ||
    normJa.includes("警察") ||
    normJa.includes("おじいさん")
  ) {
    return VOICES.KENTA;
  }

  // 2. Female characters -> Aoi
  if (
    norm.includes("mary") ||
    norm.includes("sue") ||
    norm.includes("michiko") ||
    norm.includes("mother") ||
    norm.includes("sora") ||
    norm.includes("yui") ||
    norm.includes("mana") ||
    norm.includes("waitress") ||
    norm.includes("landlady") ||
    norm.includes("old woman") ||
    norm.includes("woman") ||
    normJa.includes("メアリー") ||
    normJa.includes("スー") ||
    normJa.includes("みちこ") ||
    normJa.includes("母") ||
    normJa.includes("ソラ") ||
    normJa.includes("ゆい") ||
    normJa.includes("マナ") ||
    normJa.includes("おばあさん") ||
    normJa.includes("女性")
  ) {
    return VOICES.AOI;
  }

  // 3. Male characters -> Ren (default)
  return VOICES.REN;
}

export function cleanSpokenText(raw: string): string {
  return raw
    .replace(/[「」『』]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesizeKenpathOpus(
  text: string,
  voiceId: string,
  outOpusPath: string,
  apiKey: string
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

  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.kenpathlabs.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: cleaned,
          voice: voiceId,
          response_format: "opus",
        }),
      });

      if (res.status === 429) {
        const retrySec =
          Number.parseInt(res.headers.get("retry-after") || "10", 10) || 10;
        console.warn(
          `\n[Kenpath 429 Rate Limit] Waiting ${retrySec}s for window reset (attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, retrySec * 1000));
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Kenpath error ${res.status}: ${errorText}`);
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      if (rawBuffer.length === 0) {
        throw new Error(`Kenpath returned empty audio for "${cleaned}"`);
      }

      const tmpRaw = `${outOpusPath}.raw.opus`;
      fs.writeFileSync(tmpRaw, rawBuffer);

      try {
        // Standardize container to 24kHz mono Opus with volume leveling
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-loglevel", "error",
            "-i", tmpRaw,
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
        if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
      }

      if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
        throw new Error(`Failed to create opus output: ${outOpusPath}`);
      }

      return fs.statSync(outOpusPath).size;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(
        `[Retry ${attempt}/${maxRetries}] for "${cleaned.slice(0, 30)}...": ${
          err instanceof Error ? err.message : err
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${text}`);
}

interface DialogueTask {
  bookId: string;
  lessonNumber: number;
  sceneId: string;
  lineIndex: number;
  speaker: string;
  speakerJa: string;
  ja: string;
  voiceId: string;
  outRelPath: string;
  outAbsPath: string;
}

async function main() {
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
    { file: "mnn-1.json", id: "mnn-1" },
  ];

  const tasks: DialogueTask[] = [];
  const bookDataMap = new Map<string, any>();

  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Book file not found: ${filePath}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    bookDataMap.set(b.id, data);

    for (const lesson of data.lessons) {
      if (!lesson.dialogues) continue;
      for (const scene of lesson.dialogues) {
        for (let i = 0; i < scene.lines.length; i++) {
          const line = scene.lines[i];
          const voiceId = getVoiceForSpeaker(line.speaker, line.speakerJa);
          const safeSceneId = scene.id.replace(/[^a-zA-Z0-9_-]/g, "-");
          const filename = `${safeSceneId}-${i}.opus`;
          const outRelPath = `/audio/books/dialogues/${b.id}/${filename}`;
          const outAbsPath = path.join(process.cwd(), "public", outRelPath.replace(/^\//, ""));

          tasks.push({
            bookId: b.id,
            lessonNumber: lesson.lessonNumber,
            sceneId: scene.id,
            lineIndex: i,
            speaker: line.speaker,
            speakerJa: line.speakerJa,
            ja: line.ja,
            voiceId,
            outRelPath,
            outAbsPath,
          });

          // Assign audioSrc on line in JSON
          line.audioSrc = outRelPath;
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(` Kenpath Labs — Textbook Dialogue Audio Synthesizer`);
  console.log(` Total dialogue lines to process: ${tasks.length}`);
  console.log(`======================================================\n`);

  let generatedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const voiceName =
      task.voiceId === VOICES.AOI
        ? "Aoi (Female)"
        : task.voiceId === VOICES.KENTA
        ? "Kenta (Older/Staff)"
        : "Ren (Male)";

    const isExisting =
      fs.existsSync(task.outAbsPath) && fs.statSync(task.outAbsPath).size > 100;

    if (isExisting) {
      skippedCount++;
      totalBytes += fs.statSync(task.outAbsPath).size;
      process.stdout.write(
        `\r[${i + 1}/${tasks.length}] (cached) ${task.bookId} L${task.lessonNumber} [${task.speakerJa} -> ${voiceName}]`
      );
      continue;
    }

    process.stdout.write(
      `\n[${i + 1}/${tasks.length}] Synthesizing ${task.bookId} L${task.lessonNumber} [${task.speakerJa} -> ${voiceName}]: "${task.ja.slice(0, 24)}..."`
    );

    const size = await synthesizeKenpathOpus(
      task.ja,
      task.voiceId,
      task.outAbsPath,
      KENPATH_API_KEY
    );

    generatedCount++;
    totalBytes += size;

    // Small delay to prevent API burst rate limiting
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n\n------------------------------------------------------`);
  console.log(`Synthesis complete!`);
  console.log(`  Newly generated: ${generatedCount}`);
  console.log(`  Cached/Skipped:  ${skippedCount}`);
  console.log(`  Total size:      ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`------------------------------------------------------\n`);

  // Save updated JSON books with audioSrc
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    const data = bookDataMap.get(b.id);
    if (data) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`Updated ${b.file} with audioSrc references.`);
    }
  }

  // Generate STATIC_BOOK_DIALOGUE_AUDIO_MAP
  const manifestPath = path.join(
    process.cwd(),
    "src/data/book-dialogues-audio.generated.ts"
  );
  const mapEntries: Record<string, string> = {};

  for (const task of tasks) {
    const keyById = `${task.bookId}:${task.sceneId}:${task.lineIndex}`;
    const cleanText = cleanSpokenText(task.ja);

    mapEntries[keyById] = task.outRelPath;
    if (cleanText) {
      mapEntries[cleanText] = task.outRelPath;
    }
  }

  const manifestContent = `// AUTO-GENERATED BY scripts/build-books-dialogue-kenpath-audio.ts — DO NOT EDIT MANUALLY

export const STATIC_BOOK_DIALOGUE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    mapEntries,
    null,
    2
  )};
`;

  fs.writeFileSync(manifestPath, manifestContent, "utf-8");
  console.log(`Generated manifest: src/data/book-dialogues-audio.generated.ts (${Object.keys(mapEntries).length} entries)`);
}

main().catch((err) => {
  console.error("Synthesis failed:", err);
  process.exit(1);
});
