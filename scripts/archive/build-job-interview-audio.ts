import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { JOB_INTERVIEW_NODES } from "../../src/data/dialogue/scenarios/job-interview-pr";

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
  const normChar = (characterKey || "matsumoto").toLowerCase();
  const normExpr = (expression || "neutral").toLowerCase();

  if (normChar === "sato") {
    // HR Rep Sato (Meimei Himari: 14 Normal)
    switch (normExpr) {
      case "troubled":
        return { speakerId: 14, pitchScale: -0.01, intonationScale: 1.1, speedScale: 0.94 };
      case "happy":
        return { speakerId: 14, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.99 };
      default:
        return { speakerId: 14, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 };
    }
  }

  if (normChar === "kawaguchi") {
    // Engineering Manager Kawaguchi (Kurono Takehiro: 11 Normal, 41 Sad/Troubled)
    switch (normExpr) {
      case "confused":
        return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 };
      case "thinking":
        return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.93 };
      case "troubled":
        return { speakerId: 41, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.94 };
      default:
        return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.97 };
    }
  }

  // Managing Director Matsumoto (Aoyama Ryusei: 13 Normal, 82 Unhappy/Stern, 83 Happy, 85 Sad/Disappointed)
  switch (normExpr) {
    case "thinking":
      return { speakerId: 13, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.93 };
    case "stern":
      return { speakerId: 82, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 };
    case "happy":
      return { speakerId: 83, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.97 };
    case "proud":
      return { speakerId: 83, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 };
    case "disappointed":
      return { speakerId: 85, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 };
    default:
      return { speakerId: defaultSpeakerId || 13, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  // MC Candidate (Shirakami Kotaro: 12 Normal, 32 Upbeat/Casual, 33 Nervous/Awkward, 34 Blunt/Rude)
  switch (tier) {
    case "respectful":
      return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.96 };
    case "polite":
      return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 32, pitchScale: 0.02, intonationScale: 1.26, speedScale: 1.02 };
    case "rude":
      return { speakerId: 34, pitchScale: -0.01, intonationScale: 1.28, speedScale: 1.03 };
    case "awkward":
      return { speakerId: 33, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.96 };
    default:
      return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.97 };
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
  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    throw new Error(`Cannot synthesize empty text from: "${text}"`);
  }

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

  const wavBuffer = Buffer.from(await synthRes.arrayBuffer());
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
  // Director Matsumoto (Aoyama Ryusei)
  {
    filename: "matsumoto-neutral.opus",
    text: "それでは、始めましょう。",
    prosody: { speakerId: 13, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 },
  },
  {
    filename: "matsumoto-thinking.opus",
    text: "ふむ……なるほど。",
    prosody: { speakerId: 13, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.93 },
  },
  {
    filename: "matsumoto-stern.opus",
    text: "ほう…それで終わりですか。",
    prosody: { speakerId: 82, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 },
  },
  {
    filename: "matsumoto-happy.opus",
    text: "なるほど、よく分かりました。",
    prosody: { speakerId: 83, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.97 },
  },
  {
    filename: "matsumoto-proud.opus",
    text: "頼もしいですね。ぜひ一緒に働きましょう。",
    prosody: { speakerId: 83, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "matsumoto-disappointed.opus",
    text: "……今回はご縁がなかったようですね。",
    prosody: { speakerId: 85, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 },
  },

  // Engineering Manager Kawaguchi (Kurono Takehiro)
  {
    filename: "kawaguchi-neutral.opus",
    text: "よろしくお願いします。",
    prosody: { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.97 },
  },
  {
    filename: "kawaguchi-confused.opus",
    text: "えっ…どういう意味ですか？",
    prosody: { speakerId: 11, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "kawaguchi-thinking.opus",
    text: "うーん…技術的にはどうでしょう。",
    prosody: { speakerId: 11, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.93 },
  },
  {
    filename: "kawaguchi-troubled.opus",
    text: "ちょっと…そこは厳しいですね。",
    prosody: { speakerId: 41, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.94 },
  },

  // HR Rep Sato (Meimei Himari)
  {
    filename: "sato-neutral.opus",
    text: "こちらへどうぞ。",
    prosody: { speakerId: 14, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 },
  },
  {
    filename: "sato-troubled.opus",
    text: "あの…もう少し落ち着いた方が…",
    prosody: { speakerId: 14, pitchScale: -0.01, intonationScale: 1.1, speedScale: 0.94 },
  },
  {
    filename: "sato-happy.opus",
    text: "お疲れ様でした！お見送りいたします。",
    prosody: { speakerId: 14, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.99 },
  },

  // Direct expression fallbacks
  {
    filename: "neutral.opus",
    text: "こちらへどうぞ。",
    prosody: { speakerId: 14, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 },
  },
  {
    filename: "thinking.opus",
    text: "ふむ……なるほど。",
    prosody: { speakerId: 13, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.93 },
  },
  {
    filename: "stern.opus",
    text: "ほう…それで終わりですか。",
    prosody: { speakerId: 82, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 },
  },
  {
    filename: "happy.opus",
    text: "なるほど、よく分かりました。",
    prosody: { speakerId: 83, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.97 },
  },
  {
    filename: "proud.opus",
    text: "頼もしいですね。",
    prosody: { speakerId: 83, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "disappointed.opus",
    text: "……残念ですね。",
    prosody: { speakerId: 85, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 },
  },
  {
    filename: "confused.opus",
    text: "えっ…どういう意味ですか？",
    prosody: { speakerId: 11, pitchScale: 0.0, intonationScale: 1.25, speedScale: 0.95 },
  },
  {
    filename: "troubled.opus",
    text: "ちょっと…厳しいですね。",
    prosody: { speakerId: 41, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.94 },
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

  const baseDir = path.join(process.cwd(), "public/assets/dialogue-quest/job-interview-pr");
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
  for (const [nodeId, node] of Object.entries(JOB_INTERVIEW_NODES)) {
    const outPath = path.join(dialogueDir, `${nodeId}.opus`);
    const prosody = getCharacterProsody(node.characterKey, node.expression, node.speakerVoiceId);
    const bytes = await synthesizeToOpus(node.npcTextJa, prosody, outPath);
    console.log(
      `  [dialogue] ${nodeId}.opus (${node.characterKey || "matsumoto"}:${node.expression}, speaker=${prosody.speakerId}, ${bytes}B)`
    );
    dialogueCount++;
  }

  console.log("\n=== 2. Generating MC Player Choice Audio ===");
  for (const node of Object.values(JOB_INTERVIEW_NODES)) {
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
