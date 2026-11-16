import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { cleanSentenceForAudio } from "../src/engine/audio";

const VOICEVOX_BASE_URL = (
  process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021"
).trim();

// Speaker 2: Shikishima Kuriyo (Articulate, natural standard Japanese)
// Speaker 14: Meimei Himari (Calm female standard Japanese)
const DEFAULT_SPEAKER_ID = Number(process.env.VOICEVOX_SPEAKER_ID || "2");

function cleanSpokenText(raw: string): string {
  return cleanSentenceForAudio(raw)
    .replace(/[「」『』]/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toSafeSlug(raw: string): string {
  return raw
    .replace(/[\/\\:*?"<>|]/g, "_")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/[~〜]/g, "")
    .replace(/\s+/g, "_")
    .trim()
    .slice(0, 40);
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
    `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(
      cleaned
    )}&speaker=${speakerId}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(
      `VOICEVOX query error ${queryRes.status}: ${await queryRes.text()}`
    );
  }
  const queryJson = await queryRes.json();

  // Instructional speed scale: 0.95
  queryJson.speedScale = 0.95;

  // 2. Synthesis
  const synthRes = await fetch(
    `${VOICEVOX_BASE_URL}/synthesis?speaker=${speakerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryJson),
    }
  );
  if (!synthRes.ok) {
    throw new Error(
      `VOICEVOX synthesis error ${synthRes.status}: ${await synthRes.text()}`
    );
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
        "-loglevel",
        "error",
        "-i",
        tmpWav,
        "-ac",
        "1",
        "-ar",
        "24000",
        "-c:a",
        "libopus",
        "-b:a",
        "32k",
        "-vbr",
        "on",
        outOpusPath,
      ],
      { stdio: "ignore" }
    );
  } finally {
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
    throw new Error(`Failed to create opus output: ${outOpusPath}`);
  }

  return fs.statSync(outOpusPath).size;
}

interface ItemTask {
  type: "grammar" | "practice";
  bookId: string;
  lessonNumber: number;
  id: string;
  ja: string;
  outRelPath: string;
  outAbsPath: string;
  existingSrc?: string;
}

async function main() {
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
    { file: "mnn-1.json", id: "mnn-1" },
  ];

  const bookDataMap = new Map<string, any>();
  const tasks: ItemTask[] = [];

  // 1. Build lookup of all existing audio in the project to deduplicate
  const existingAudioMap = new Map<string, string>();

  // Check STATIC_LISTENING_SENTENCE_AUDIO_MAP from manifest
  const manifestPath = path.join(
    process.cwd(),
    "src/data/audio-manifest.generated.ts"
  );
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, "utf-8");
    const match = manifest.match(
      /export const STATIC_LISTENING_SENTENCE_AUDIO_MAP: Record<string, string> = {([\s\S]*?)};/
    );
    if (match) {
      for (const line of match[1].split("\n")) {
        const m = line.match(/"([^"]+)":\s*"([^"]+)"/);
        if (m) {
          const cleanKey = cleanSpokenText(m[1]);
          if (cleanKey && !existingAudioMap.has(cleanKey)) {
            existingAudioMap.set(cleanKey, m[2]);
          }
        }
      }
    }
  }

  // 2. Discover all Grammar Examples and Practice items across books
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    bookDataMap.set(b.id, data);

    for (const lesson of data.lessons) {
      // Grammar Examples
      if (lesson.grammar) {
        for (const g of lesson.grammar) {
          if (!g.examples) continue;
          for (let i = 0; i < g.examples.length; i++) {
            const eg = g.examples[i];
            const clean = cleanSpokenText(eg.ja);
            if (!clean) continue;

            const existingSrc = existingAudioMap.get(clean);
            const safeGId = toSafeSlug(g.id);
            const outRelPath = existingSrc
              ? existingSrc
              : `/audio/books/grammar/${b.id}/${safeGId}-${i}.opus`;
            const outAbsPath = path.join(
              process.cwd(),
              "public",
              outRelPath.replace(/^\//, "")
            );

            tasks.push({
              type: "grammar",
              bookId: b.id,
              lessonNumber: lesson.lessonNumber,
              id: `${g.id}:ex:${i}`,
              ja: eg.ja,
              outRelPath,
              outAbsPath,
              existingSrc,
            });

            eg.audioSrc = outRelPath;
          }
        }
      }

      // Practice Drill Items
      if (lesson.practice) {
        for (const p of lesson.practice) {
          if (!p.items) continue;
          for (let i = 0; i < p.items.length; i++) {
            const it = p.items[i];
            // Split multiple options if provided, synthesize primary answer
            const primaryAnswer = it.answer.split(/[／/]/)[0].trim();
            const clean = cleanSpokenText(primaryAnswer);
            if (!clean) continue;

            const existingSrc = existingAudioMap.get(clean);
            const safePId = toSafeSlug(p.id);
            const outRelPath = existingSrc
              ? existingSrc
              : `/audio/books/practice/${b.id}/${safePId}-${i}.opus`;
            const outAbsPath = path.join(
              process.cwd(),
              "public",
              outRelPath.replace(/^\//, "")
            );

            tasks.push({
              type: "practice",
              bookId: b.id,
              lessonNumber: lesson.lessonNumber,
              id: `${p.id}:item:${i}`,
              ja: primaryAnswer,
              outRelPath,
              outAbsPath,
              existingSrc,
            });

            it.audioSrc = outRelPath;
          }
        }
      }
    }
  }

  // Count cache vs new diff
  const itemsToSynthesize = tasks.filter((t) => {
    if (t.existingSrc) return false;
    return !fs.existsSync(t.outAbsPath) || fs.statSync(t.outAbsPath).size < 100;
  });

  console.log(`\n======================================================`);
  console.log(` VOICEVOX — Textbook Grammar & Practice Synthesizer`);
  console.log(` Speaker ID: ${DEFAULT_SPEAKER_ID} (Shikishima Kuriyo)`);
  console.log(` Engine URL: ${VOICEVOX_BASE_URL}`);
  console.log(` Total items: ${tasks.length}`);
  console.log(` Reused / Cached from existing audio: ${tasks.length - itemsToSynthesize.length}`);
  console.log(` Net new items to synthesize: ${itemsToSynthesize.length}`);
  console.log(`======================================================\n`);

  if (itemsToSynthesize.length > 0) {
    // 3. Test VOICEVOX connection before starting batch
    try {
      const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
      if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
      const ver = await ping.json().catch(() => "");
      console.log(`Connected to VOICEVOX engine v${ver} at ${VOICEVOX_BASE_URL}\n`);
    } catch {
      console.error(`\n❌ ERROR: Cannot reach VOICEVOX engine at ${VOICEVOX_BASE_URL}`);
      console.error(`Please ensure VOICEVOX is running on your machine:`);
      console.error(`  1. Start the VOICEVOX application or Docker container.`);
      console.error(`  2. Verify it is listening on port 50021.`);
      console.error(`  3. Run this script again: npm run build:books-grammar-audio\n`);
      process.exit(1);
    }
  }

  let generatedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const isExisting =
      task.existingSrc ||
      (fs.existsSync(task.outAbsPath) && fs.statSync(task.outAbsPath).size > 100);

    if (isExisting) {
      skippedCount++;
      if (fs.existsSync(task.outAbsPath)) {
        totalBytes += fs.statSync(task.outAbsPath).size;
      }
      process.stdout.write(
        `\r[${i + 1}/${tasks.length}] (cached) ${task.bookId} L${task.lessonNumber} [${task.type}]: "${task.ja.slice(0, 18)}..."`
      );
      continue;
    }

    process.stdout.write(
      `\n[${i + 1}/${tasks.length}] Synthesizing [${task.type}] "${task.ja.slice(0, 26)}..."`
    );

    const size = await synthesizeVoicevoxOpus(
      task.ja,
      DEFAULT_SPEAKER_ID,
      task.outAbsPath
    );

    generatedCount++;
    totalBytes += size;
  }

  console.log(`\n\n------------------------------------------------------`);
  console.log(`Synthesis complete!`);
  console.log(`  Newly generated via VOICEVOX: ${generatedCount}`);
  console.log(`  Reused from cache / existing:  ${skippedCount}`);
  console.log(`  Total size:                    ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`------------------------------------------------------\n`);

  // 4. Update book JSON files with audioSrc
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    const data = bookDataMap.get(b.id);
    if (data) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`Updated ${b.file} with grammar & practice audioSrc.`);
    }
  }

  // 5. Generate STATIC_BOOK_GRAMMAR_PRACTICE_AUDIO_MAP
  const outManifestPath = path.join(
    process.cwd(),
    "src/data/book-grammar-practice-audio.generated.ts"
  );
  const mapEntries: Record<string, string> = {};

  for (const task of tasks) {
    const cleanText = cleanSpokenText(task.ja);
    mapEntries[task.id] = task.outRelPath;
    if (cleanText) {
      mapEntries[cleanText] = task.outRelPath;
    }
  }

  const manifestContent = `// AUTO-GENERATED BY scripts/build-books-grammar-practice-voicevox.ts — DO NOT EDIT MANUALLY

export const STATIC_BOOK_GRAMMAR_PRACTICE_AUDIO_MAP: Record<string, string> = ${JSON.stringify(
    mapEntries,
    null,
    2
  )};
`;

  fs.writeFileSync(outManifestPath, manifestContent, "utf-8");
  console.log(
    `Generated manifest: src/data/book-grammar-practice-audio.generated.ts (${Object.keys(mapEntries).length} entries)`
  );
}

main().catch((err) => {
  console.error("Grammar/Practice synthesis failed:", err);
  process.exit(1);
});
