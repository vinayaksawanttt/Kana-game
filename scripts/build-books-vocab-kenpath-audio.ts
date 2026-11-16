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

// Aoi (Tokyo Standard Female Voice — ideal for textbook vocab audio)
const VOCAB_VOICE_ID = "sv_qy4oztyr";

export function cleanSpokenVocab(raw: string): string {
  return raw
    .replace(/[「」『』]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSafeFilename(raw: string): string {
  return raw
    .replace(/[\/\\:*?"<>|]/g, "_")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

async function synthesizeKenpathOpus(
  text: string,
  voiceId: string,
  outOpusPath: string,
  apiKey: string
): Promise<number> {
  const cleaned = cleanSpokenVocab(text);
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

interface VocabTask {
  spokenText: string;
  displayWord: string;
  outRelPath: string;
  outAbsPath: string;
}

async function main() {
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
    { file: "mnn-1.json", id: "mnn-1" },
  ];

  const uniqueVocabMap = new Map<string, VocabTask>();
  const bookDataMap = new Map<string, any>();

  // Check existing files in public/audio/vocab/ to reuse
  const existingGlobalVocab = new Set<string>();
  const globalVocabDir = path.join(process.cwd(), "public/audio/vocab");
  if (fs.existsSync(globalVocabDir)) {
    for (const f of fs.readdirSync(globalVocabDir)) {
      if (f.endsWith(".opus")) {
        existingGlobalVocab.add(f.replace(/\.opus$/, ""));
      }
    }
  }

  const outDir = path.join(process.cwd(), "public/audio/books/vocab");
  fs.mkdirSync(outDir, { recursive: true });

  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    bookDataMap.set(b.id, data);

    for (const lesson of data.lessons) {
      if (!lesson.vocabulary) continue;
      for (const v of lesson.vocabulary) {
        const spoken = cleanSpokenVocab(v.readingKana || v.word || "");
        if (!spoken) continue;

        const safeName = toSafeFilename(spoken);
        let outRelPath = `/audio/books/vocab/${safeName}.opus`;
        let outAbsPath = path.join(outDir, `${safeName}.opus`);

        // If audio already exists in global public/audio/vocab/, reuse it!
        if (existingGlobalVocab.has(spoken) || existingGlobalVocab.has(safeName)) {
          outRelPath = `/audio/vocab/${existingGlobalVocab.has(spoken) ? spoken : safeName}.opus`;
          outAbsPath = path.join(globalVocabDir, path.basename(outRelPath));
        }

        if (!uniqueVocabMap.has(spoken)) {
          uniqueVocabMap.set(spoken, {
            spokenText: spoken,
            displayWord: v.word || spoken,
            outRelPath,
            outAbsPath,
          });
        }

        v.hasAudio = true;
        v.audioSrc = outRelPath;
      }
    }
  }

  const tasks = Array.from(uniqueVocabMap.values());

  console.log(`\n======================================================`);
  console.log(` Kenpath Labs — Textbook Vocabulary Audio Synthesizer`);
  console.log(` Total unique vocabulary words: ${tasks.length}`);
  console.log(`======================================================\n`);

  let generatedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const isExisting =
      fs.existsSync(task.outAbsPath) && fs.statSync(task.outAbsPath).size > 100;

    if (isExisting) {
      skippedCount++;
      totalBytes += fs.statSync(task.outAbsPath).size;
      process.stdout.write(
        `\r[${i + 1}/${tasks.length}] (cached) "${task.displayWord}" (${task.spokenText})`
      );
      continue;
    }

    process.stdout.write(
      `\n[${i + 1}/${tasks.length}] Synthesizing "${task.displayWord}" (${task.spokenText})...`
    );

    const size = await synthesizeKenpathOpus(
      task.spokenText,
      VOCAB_VOICE_ID,
      task.outAbsPath,
      KENPATH_API_KEY
    );

    generatedCount++;
    totalBytes += size;

    // Concurrency throttle
    await new Promise((r) => setTimeout(r, 180));
  }

  console.log(`\n\n------------------------------------------------------`);
  console.log(`Vocabulary Synthesis complete!`);
  console.log(`  Newly generated: ${generatedCount}`);
  console.log(`  Cached/Reused:   ${skippedCount}`);
  console.log(`  Total size:      ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`------------------------------------------------------\n`);

  // Update book JSON files
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    const data = bookDataMap.get(b.id);
    if (data) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`Updated ${b.file} with vocab audioSrc & hasAudio flags.`);
    }
  }

  // Generate STATIC_BOOK_VOCAB_AUDIO_MAP
  const manifestPath = path.join(
    process.cwd(),
    "src/data/book-vocab-audio.generated.ts"
  );
  const mapEntries: Record<string, string> = {};

  for (const task of tasks) {
    mapEntries[task.spokenText] = task.outRelPath;
    if (task.displayWord && task.displayWord !== task.spokenText) {
      mapEntries[task.displayWord] = task.outRelPath;
    }
  }

  const manifestContent = `// AUTO-GENERATED BY scripts/build-books-vocab-kenpath-audio.ts — DO NOT EDIT MANUALLY

export const STATIC_BOOK_VOCAB_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    mapEntries,
    null,
    2
  )};
`;

  fs.writeFileSync(manifestPath, manifestContent, "utf-8");
  console.log(
    `Generated manifest: src/data/book-vocab-audio.generated.ts (${Object.keys(mapEntries).length} entries)`
  );
}

main().catch((err) => {
  console.error("Vocab synthesis failed:", err);
  process.exit(1);
});
