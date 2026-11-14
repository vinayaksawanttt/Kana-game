import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { FIRST_DATE_SAKURA_NODES } from "../src/data/dialogue/scenarios/first-date-sakura";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();

interface ProsodyConfig {
  speakerId: number;
  pitchScale: number;
  intonationScale: number;
  speedScale: number;
  volumeScale?: number;
}

function getCharacterProsody(
  characterKey?: string,
  expression?: string,
  defaultSpeakerId?: number
): ProsodyConfig {
  const normChar = (characterKey || "misaki").toLowerCase();
  const normExpr = (expression || "happy").toLowerCase();

  if (normChar === "master") {
    // Kominka Cafe Master (Chibishiki Jii: 42 Normal)
    switch (normExpr) {
      case "thinking":
        return { speakerId: 42, pitchScale: -0.02, intonationScale: 1.08, speedScale: 0.9 };
      case "happy":
        return { speakerId: 42, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.94 };
      default:
        return { speakerId: 42, pitchScale: -0.01, intonationScale: 1.1, speedScale: 0.92 };
    }
  }

  // Misaki (WhiteCUL: 23 Normal, 24 Happy/Fun, 25 Sad/Troubled)
  switch (normExpr) {
    case "happy":
      return { speakerId: 24, pitchScale: 0.01, intonationScale: 1.24, speedScale: 0.98 };
    case "proud":
      return { speakerId: 24, pitchScale: 0.02, intonationScale: 1.26, speedScale: 0.97 };
    case "relieved":
      return { speakerId: 23, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.96 };
    case "embarrassed":
      return { speakerId: 23, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.95 };
    case "thinking":
      return { speakerId: 23, pitchScale: 0.0, intonationScale: 1.12, speedScale: 0.94 };
    case "confused":
      return { speakerId: 23, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 };
    case "worried":
      return { speakerId: 25, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.94 };
    case "troubled":
      return { speakerId: 25, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.93 };
    case "disappointed":
      return { speakerId: 25, pitchScale: -0.02, intonationScale: 1.05, speedScale: 0.91 };
    default:
      return { speakerId: defaultSpeakerId || 23, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.96 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  // MC (Kurono Takehiro: 11 Normal, 39 Upbeat/Warm-Casual, 40 Blunt/Rude, 41 Sad/Awkward)
  switch (tier) {
    case "respectful":
      return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.16, speedScale: 0.96 };
    case "polite":
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 39, pitchScale: 0.01, intonationScale: 1.24, speedScale: 1.0 };
    case "rude":
      return { speakerId: 40, pitchScale: -0.01, intonationScale: 1.28, speedScale: 1.03 };
    case "awkward":
      return { speakerId: 41, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.95 };
    default:
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.97 };
  }
}

function cleanSpokenText(raw: string): string {
  return raw
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
}

async function synthesizeToOpus(
  text: string,
  prosody: ProsodyConfig,
  outOpusPath: string
): Promise<number> {
  if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).size > 500) {
    return fs.statSync(outOpusPath).size;
  }

  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    throw new Error(`Cannot synthesize empty text from: "${text}"`);
  }

  let wavBuffer: Buffer | null = null;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const queryRes = await fetch(
        `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(cleaned)}&speaker=${prosody.speakerId}`,
        { method: "POST" }
      );
      if (!queryRes.ok) {
        throw new Error(`VOICEVOX audio_query error ${queryRes.status}: ${await queryRes.text()}`);
      }
      const audioQuery = await queryRes.json();
      audioQuery.pitchScale = prosody.pitchScale;
      audioQuery.intonationScale = prosody.intonationScale;
      audioQuery.speedScale = prosody.speedScale;
      audioQuery.volumeScale = prosody.volumeScale ?? 1.0;

      const synthRes = await fetch(
        `${VOICEVOX_BASE_URL}/synthesis?speaker=${prosody.speakerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(audioQuery),
        }
      );
      if (!synthRes.ok) {
        throw new Error(`VOICEVOX synthesis error ${synthRes.status}: ${await synthRes.text()}`);
      }

      wavBuffer = Buffer.from(await synthRes.arrayBuffer());
      break;
    } catch (err) {
      lastErr = err;
      console.warn(
        `  [retry ${attempt}/3] VOICEVOX error for speaker=${prosody.speakerId}:`,
        err instanceof Error ? err.message : err
      );
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  if (!wavBuffer) {
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  const tmpWav = `${outOpusPath}.tmp.wav`;
  fs.writeFileSync(tmpWav, wavBuffer);

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel", "error",
        "-i", tmpWav,
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
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
    throw new Error(`Failed or suspiciously tiny output file: ${outOpusPath}`);
  }

  return fs.statSync(outOpusPath).size;
}

const CHARACTER_EXPRESSIVE_SFX: Array<{
  filename: string;
  text: string;
  prosody: ProsodyConfig;
}> = [
  // Misaki (WhiteCUL)
  {
    filename: "misaki-happy.opus",
    text: "わあ、嬉しい！",
    prosody: { speakerId: 24, pitchScale: 0.01, intonationScale: 1.24, speedScale: 0.98 },
  },
  {
    filename: "misaki-thinking.opus",
    text: "そうですね…どうでしょう。",
    prosody: { speakerId: 23, pitchScale: 0.0, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "misaki-embarrassed.opus",
    text: "あ…いえ、そんなことないですよ…！",
    prosody: { speakerId: 23, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "misaki-confused.opus",
    text: "えっ…？どういう意味ですか？",
    prosody: { speakerId: 23, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 },
  },
  {
    filename: "misaki-worried.opus",
    text: "あの…大丈夫でしょうか…",
    prosody: { speakerId: 25, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.94 },
  },
  {
    filename: "misaki-proud.opus",
    text: "ふふっ、また来週も会えますね。",
    prosody: { speakerId: 24, pitchScale: 0.02, intonationScale: 1.26, speedScale: 0.97 },
  },
  {
    filename: "misaki-relieved.opus",
    text: "よかった…ほっとしました。",
    prosody: { speakerId: 23, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.96 },
  },
  {
    filename: "misaki-troubled.opus",
    text: "うーん…少し気まずいですね…",
    prosody: { speakerId: 25, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.93 },
  },
  {
    filename: "misaki-disappointed.opus",
    text: "……そろそろ、お時間ですね。",
    prosody: { speakerId: 25, pitchScale: -0.02, intonationScale: 1.05, speedScale: 0.91 },
  },

  // Kominka Cafe Master (Chibishiki Jii)
  {
    filename: "master-neutral.opus",
    text: "いらっしゃい。",
    prosody: { speakerId: 42, pitchScale: -0.01, intonationScale: 1.1, speedScale: 0.92 },
  },
  {
    filename: "master-thinking.opus",
    text: "ほう…豆の好みが分かるのかね。",
    prosody: { speakerId: 42, pitchScale: -0.02, intonationScale: 1.08, speedScale: 0.9 },
  },
  {
    filename: "master-happy.opus",
    text: "ふむ、良いお連れさんだな。",
    prosody: { speakerId: 42, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.94 },
  },

  // Direct expression fallbacks
  {
    filename: "happy.opus",
    text: "わあ、嬉しい！",
    prosody: { speakerId: 24, pitchScale: 0.01, intonationScale: 1.24, speedScale: 0.98 },
  },
  {
    filename: "thinking.opus",
    text: "そうですね…",
    prosody: { speakerId: 23, pitchScale: 0.0, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "embarrassed.opus",
    text: "あ…えっと…！",
    prosody: { speakerId: 23, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "confused.opus",
    text: "えっ…？",
    prosody: { speakerId: 23, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 },
  },
  {
    filename: "worried.opus",
    text: "あの…大丈夫でしょうか…",
    prosody: { speakerId: 25, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.94 },
  },
  {
    filename: "proud.opus",
    text: "ふふっ、嬉しいです。",
    prosody: { speakerId: 24, pitchScale: 0.02, intonationScale: 1.26, speedScale: 0.97 },
  },
  {
    filename: "relieved.opus",
    text: "ほっとしました。",
    prosody: { speakerId: 23, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.96 },
  },
  {
    filename: "troubled.opus",
    text: "うーん…",
    prosody: { speakerId: 25, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.93 },
  },
  {
    filename: "disappointed.opus",
    text: "……お時間ですね。",
    prosody: { speakerId: 25, pitchScale: -0.02, intonationScale: 1.05, speedScale: 0.91 },
  },
  {
    filename: "neutral.opus",
    text: "いらっしゃい。",
    prosody: { speakerId: 42, pitchScale: -0.01, intonationScale: 1.1, speedScale: 0.92 },
  },
];

async function main() {
  try {
    const verRes = await fetch(`${VOICEVOX_BASE_URL}/version`);
    if (!verRes.ok) throw new Error(`HTTP ${verRes.status}`);
    console.log(`VOICEVOX connected (version: ${await verRes.text()})`);
  } catch (err) {
    console.error(`Cannot connect to VOICEVOX at ${VOICEVOX_BASE_URL}. Is VOICEVOX running?`, err);
    process.exit(1);
  }

  const baseDir = path.join(process.cwd(), "public/assets/dialogue-quest/first-date-sakura");
  const dialogueDir = path.join(baseDir, "dialogue");
  const choicesDir = path.join(baseDir, "choices");
  const sfxDir = path.join(baseDir, "sfx");

  for (const dir of [dialogueDir, choicesDir, sfxDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let dialogueCount = 0;
  let choiceCount = 0;
  let sfxCount = 0;

  console.log("\n=== 1. Generating NPC Dialogue Audio ===");
  for (const [nodeId, node] of Object.entries(FIRST_DATE_SAKURA_NODES)) {
    const outPath = path.join(dialogueDir, `${nodeId}.opus`);
    const prosody = getCharacterProsody(node.characterKey, node.expression, node.speakerVoiceId);
    const bytes = await synthesizeToOpus(node.npcTextJa, prosody, outPath);
    console.log(
      `  [dialogue] ${nodeId}.opus (${node.characterKey || "misaki"}:${node.expression}, speaker=${prosody.speakerId}, ${bytes}B)`
    );
    dialogueCount++;
  }

  console.log("\n=== 2. Generating MC Player Choice Audio ===");
  for (const node of Object.values(FIRST_DATE_SAKURA_NODES)) {
    if (!node.choices) continue;
    for (const choice of node.choices) {
      const outPath = path.join(choicesDir, `${choice.id}.opus`);
      const prosody = getPlayerProsody(choice.tier);
      const bytes = await synthesizeToOpus(choice.textJa, prosody, outPath);
      console.log(
        `  [choice]   ${choice.id}.opus (tier=${choice.tier}, speaker=${prosody.speakerId}, ${bytes}B)`
      );
      choiceCount++;
    }
  }

  console.log("\n=== 3. Generating Character Expressive SFX ===");
  for (const sfx of CHARACTER_EXPRESSIVE_SFX) {
    const outPath = path.join(sfxDir, sfx.filename);
    const bytes = await synthesizeToOpus(sfx.text, sfx.prosody, outPath);
    console.log(`  [sfx]      ${sfx.filename} (speaker=${sfx.prosody.speakerId}, ${bytes}B)`);
    sfxCount++;
  }

  console.log(
    `\nAll done! Generated ${dialogueCount} dialogue lines, ${choiceCount} player choice lines, and ${sfxCount} character expressive SFX.`
  );
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
