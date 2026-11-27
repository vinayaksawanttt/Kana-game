import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import type { BookDetail } from "../src/data/books";

const VOICE = "ja-JP-NanamiNeural";
const SPEECH_RATE = "-5%";
const CONCURRENCY = 8;

type VocabWithAudio = BookDetail["lessons"][number]["vocabulary"][number] & {
  audioSrc?: string;
};

function cleanSpokenVocab(raw: string): string {
  const cleaned = raw
    .replace(/\[([^\|\]]+)\|[^\]]+\]/g, "$1")
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$1")
    .replace(/[［\[][^\]］]*[］\]]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/[／/]/g, "、")
    .replace(/～|〜/g, "")
    .replace(/^[\s。、…・\-－.]+|[\s。、…・\-－.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/[\u3040-\u30ff\u4e00-\u9fafA-Za-z0-9]/.test(cleaned)) return "";
  return cleaned;
}

function toSafeFilename(text: string): string {
  const hash = crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
  return `v-${hash}`;
}

async function synthesizeEdgeOpus(text: string, outOpusPath: string, voice = VOICE): Promise<number> {
  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });
  const tmpMp3 = `${outOpusPath}.tmp.mp3`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: SPEECH_RATE });
        const ws = fs.createWriteStream(tmpMp3);
        audioStream.pipe(ws);
        ws.on("finish", () => resolve());
        ws.on("error", reject);
        audioStream.on("error", reject);
      });

      if (!fs.existsSync(tmpMp3) || fs.statSync(tmpMp3).size < 100) {
        throw new Error(`Empty Edge TTS mp3 stream for "${text}"`);
      }

      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel",
          "error",
          "-i",
          tmpMp3,
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

      if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
      if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).size >= 100) {
        return fs.statSync(outOpusPath).size;
      }
      throw new Error(`Invalid output ${outOpusPath}`);
    } catch (err) {
      if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  throw new Error(`Failed to synthesize ${text}`);
}

interface VocabTask {
  spokenText: string;
  outRelPath: string;
  outAbsPath: string;
}

async function main() {
  const force = process.argv.includes("--force");
  const books = [
    { file: "genki-1.json", id: "genki-1" },
    { file: "genki-2.json", id: "genki-2" },
    { file: "mnn-1.json", id: "mnn-1" },
  ];

  const globalVocabDir = path.join(process.cwd(), "public/audio/vocab");
  const existingGlobalVocab = new Set<string>();
  if (fs.existsSync(globalVocabDir)) {
    for (const f of fs.readdirSync(globalVocabDir)) {
      if (f.endsWith(".opus")) {
        existingGlobalVocab.add(f.replace(/\.opus$/, ""));
      }
    }
  }

  const outDir = path.join(process.cwd(), "public/audio/books/vocab");
  fs.mkdirSync(outDir, { recursive: true });

  const uniqueVocabMap = new Map<string, VocabTask>();
  const bookDataMap = new Map<string, BookDetail>();

  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as BookDetail;
    bookDataMap.set(b.id, data);

    for (const lesson of data.lessons || []) {
      for (const rawV of lesson.vocabulary || []) {
        const v = rawV as VocabWithAudio;
        const spoken = cleanSpokenVocab(v.readingKana || v.word || "");
        if (!spoken) continue;

        const safeName = toSafeFilename(spoken);
        let outRelPath = `/audio/books/vocab/${safeName}.opus`;
        let outAbsPath = path.join(outDir, `${safeName}.opus`);

        if (existingGlobalVocab.has(spoken) || existingGlobalVocab.has(safeName)) {
          outRelPath = `/audio/vocab/${existingGlobalVocab.has(spoken) ? spoken : safeName}.opus`;
          outAbsPath = path.join(globalVocabDir, path.basename(outRelPath));
        }

        if (!uniqueVocabMap.has(spoken)) {
          uniqueVocabMap.set(spoken, { spokenText: spoken, outRelPath, outAbsPath });
        }

        v.hasAudio = true;
        v.audioSrc = outRelPath;
      }
    }
  }

  const tasks = Array.from(uniqueVocabMap.values()).filter((t) => {
    if (t.outRelPath.startsWith("/audio/vocab/")) return false;
    if (force) return true;
    return !fs.existsSync(t.outAbsPath) || fs.statSync(t.outAbsPath).size < 100;
  });

  console.log(`Edge TTS Textbook Vocab Synthesizer: ${tasks.length} clips to synthesize (${uniqueVocabMap.size} unique words total)`);

  let nextIdx = 0;
  let completed = 0;
  async function worker() {
    while (nextIdx < tasks.length) {
      const t = tasks[nextIdx++];
      await synthesizeEdgeOpus(t.spokenText, t.outAbsPath);
      completed++;
      const pct = Math.round((completed / tasks.length) * 100);
      process.stdout.write(`\r[Books Vocab] ${completed}/${tasks.length} (${pct}%) - ${t.spokenText}   `);
      if (completed === tasks.length) process.stdout.write("\n");
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const mapEntries: Record<string, string> = {};
  for (const b of books) {
    const filePath = path.join(process.cwd(), "public/data/v1/books", b.file);
    const data = bookDataMap.get(b.id);
    if (!data) continue;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    for (const lesson of data.lessons || []) {
      for (const rawV of lesson.vocabulary || []) {
        const v = rawV as VocabWithAudio;
        if (!v.audioSrc) continue;
        mapEntries[v.id] = v.audioSrc;
        if (v.word && !mapEntries[v.word]) mapEntries[v.word] = v.audioSrc;
        const cleanW = cleanSpokenVocab(v.word || "");
        if (cleanW && !mapEntries[cleanW]) mapEntries[cleanW] = v.audioSrc;
        const cleanR = cleanSpokenVocab(v.readingKana || v.reading || "");
        if (cleanR && !mapEntries[cleanR]) mapEntries[cleanR] = v.audioSrc;
      }
    }
  }

  const manifestPath = path.join(process.cwd(), "src/data/book-vocab-audio.generated.ts");
  const manifestContent = `// AUTO-GENERATED BY scripts/build-books-vocab-audio.ts — DO NOT EDIT MANUALLY

export const STATIC_BOOK_VOCAB_AUDIO_MAP: Record<string, string> = ${JSON.stringify(mapEntries, null, 2)};
`;
  fs.writeFileSync(manifestPath, manifestContent, "utf8");
  console.log(`✓ Generated src/data/book-vocab-audio.generated.ts (${Object.keys(mapEntries).length} entries)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
