import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { INSTANT_REPLY_ITEMS } from "../src/data/jlpt/instantReplyData";
import { STAR_SCRAMBLE_ITEMS } from "../src/data/jlpt/starScrambleData";
import { SYNONYM_MATCH_ITEMS } from "../src/data/jlpt/synonymMatchData";
import { PHONETIC_TRAP_ITEMS } from "../src/data/jlpt/phoneticTrapData";

const VOICE_FEMALE = "ja-JP-NanamiNeural";
const VOICE_MALE = "ja-JP-KeitaNeural";
const SPEECH_RATE = "-5%";
const CONCURRENCY = 6;

function cleanSpokenText(raw: string): string {
  return raw
    .replace(/\[([^\|\]]+)\|[^\]]+\]/g, "$1")
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$1")
    .replace(/[［\[][^\]］]*[］\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesizeEdgeOpus(text: string, voice: string, outOpusPath: string): Promise<void> {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) return;
  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });
  const tmpMp3 = `${outOpusPath}.tmp.mp3`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(cleaned, { rate: SPEECH_RATE });
        const ws = fs.createWriteStream(tmpMp3);
        audioStream.pipe(ws);
        ws.on("finish", () => resolve());
        ws.on("error", reject);
        audioStream.on("error", reject);
      });

      execFileSync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-i", tmpMp3, "-ac", "1", "-ar", "24000", "-c:a", "libopus", "-b:a", "32k", "-vbr", "on", outOpusPath],
        { stdio: "ignore" }
      );
      if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
      if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).size >= 100) return;
      throw new Error(`Invalid output: ${outOpusPath}`);
    } catch (err) {
      if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

async function main() {
  const outBase = path.join(process.cwd(), "public/audio");
  const tasks: Array<{ text: string; voice: string; outPath: string }> = [];

  for (const item of INSTANT_REPLY_ITEMS) {
    const lvl = `n${item.jlpt}`;
    tasks.push({
      text: item.promptJa,
      voice: item.jlpt % 2 === 0 ? VOICE_MALE : VOICE_FEMALE,
      outPath: path.join(outBase, "listening/instant-reply", lvl, `${item.id}_prompt.opus`),
    });
    item.options.forEach((opt, idx) => {
      tasks.push({
        text: opt.ja,
        voice: VOICE_MALE,
        outPath: path.join(outBase, "listening/instant-reply", lvl, `${item.id}_opt${idx + 1}.opus`),
      });
    });
  }

  for (const item of STAR_SCRAMBLE_ITEMS) {
    tasks.push({
      text: item.fullSentence,
      voice: item.jlpt % 2 === 1 ? VOICE_FEMALE : VOICE_MALE,
      outPath: path.join(outBase, "jlpt/star-scramble", item.level.toLowerCase(), `${item.id}.opus`),
    });
  }

  for (const item of SYNONYM_MATCH_ITEMS) {
    tasks.push({
      text: item.sentenceJa,
      voice: item.jlpt % 2 === 1 ? VOICE_FEMALE : VOICE_MALE,
      outPath: path.join(outBase, "jlpt/synonyms", `n${item.jlpt}`, `${item.id}.opus`),
    });
  }

  for (const item of PHONETIC_TRAP_ITEMS) {
    tasks.push({
      text: item.sentenceJa,
      voice: item.jlpt % 2 === 1 ? VOICE_FEMALE : VOICE_MALE,
      outPath: path.join(outBase, "jlpt/phonetic-traps", item.level.toLowerCase(), `${item.id}.opus`),
    });
  }

  console.log(`Edge TTS JLPT Synthesizer: ${tasks.length} clips total`);
  let nextIdx = 0;
  let completed = 0;

  async function worker() {
    while (nextIdx < tasks.length) {
      const t = tasks[nextIdx++];
      await synthesizeEdgeOpus(t.text, t.voice, t.outPath);
      completed++;
      const pct = Math.round((completed / tasks.length) * 100);
      process.stdout.write(`\r[JLPT Edge] ${completed}/${tasks.length} (${pct}%) - ${path.basename(t.outPath)}   `);
      if (completed === tasks.length) process.stdout.write("\n");
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`✓ Replaced ${completed} JLPT .opus files with Edge TTS.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
