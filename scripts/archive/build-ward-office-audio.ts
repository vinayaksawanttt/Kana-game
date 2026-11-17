import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { WARD_OFFICE_TAX_NODES } from "../../src/data/dialogue/scenarios/ward-office-tax";

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
  const normChar = (characterKey || "obata").toLowerCase();
  const normExpr = (expression || "neutral").toLowerCase();

  if (normChar === "takahashi") {
    // Civic Lobby Guide Takahashi (Kasukabe Tsumugi: 8 Normal)
    switch (normExpr) {
      case "troubled":
        return { speakerId: 8, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 };
      case "happy":
        return { speakerId: 8, pitchScale: 0.02, intonationScale: 1.24, speedScale: 0.99 };
      case "relieved":
        return { speakerId: 8, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.97 };
      default:
        return { speakerId: 8, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 };
    }
  }

  if (normChar === "koga") {
    // Tax Officer Koga (Shirakami Kotaro: 12 Normal, 33 Worried/Nervous)
    switch (normExpr) {
      case "worried":
        return { speakerId: 33, pitchScale: 0.0, intonationScale: 1.22, speedScale: 0.95 };
      case "troubled":
        return { speakerId: 33, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 };
      case "thinking":
        return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.95 };
      default:
        return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.97 };
    }
  }

  // Section Chief Obata (No.7: 29 Normal, 30 Announce/Formal-Stern, 31 Calm/Reading)
  switch (normExpr) {
    case "thinking":
      return { speakerId: 31, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 };
    case "stern":
      return { speakerId: 30, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 };
    case "proud":
      return { speakerId: 29, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 };
    case "disappointed":
      return { speakerId: 31, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 };
    default:
      return { speakerId: defaultSpeakerId || 29, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  // MC Resident (Kurono Takehiro: 11 Normal, 39 Upbeat/Casual, 40 Blunt/Rude, 41 Sad/Awkward)
  switch (tier) {
    case "respectful":
      return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.96 };
    case "polite":
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 39, pitchScale: 0.02, intonationScale: 1.24, speedScale: 1.02 };
    case "rude":
      return { speakerId: 40, pitchScale: -0.01, intonationScale: 1.28, speedScale: 1.03 };
    case "awkward":
      return { speakerId: 41, pitchScale: 0.0, intonationScale: 1.2, speedScale: 0.95 };
    default:
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.97 };
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
      console.warn(`  [retry ${attempt}/3] VOICEVOX error for speaker=${prosody.speakerId}:`, err instanceof Error ? err.message : err);
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
  // Section Chief Obata (No.7)
  {
    filename: "obata-neutral.opus",
    text: "ご相談の内容を確認いたします。",
    prosody: { speakerId: 29, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 },
  },
  {
    filename: "obata-thinking.opus",
    text: "なるほど…制度上の要件を確認しましょう。",
    prosody: { speakerId: 31, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "obata-stern.opus",
    text: "特例には規定がございます。",
    prosody: { speakerId: 30, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 },
  },
  {
    filename: "obata-proud.opus",
    text: "丁寧なご準備、大変助かりました。",
    prosody: { speakerId: 29, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 },
  },
  {
    filename: "obata-disappointed.opus",
    text: "……本日の手続きはここまでといたします。",
    prosody: { speakerId: 31, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 },
  },

  // Tax Officer Koga (Shirakami Kotaro)
  {
    filename: "koga-neutral.opus",
    text: "お呼びした番号の方、どうぞ。",
    prosody: { speakerId: 12, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.97 },
  },
  {
    filename: "koga-thinking.opus",
    text: "えっと…書類を確認しますね。",
    prosody: { speakerId: 12, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.95 },
  },
  {
    filename: "koga-worried.opus",
    text: "うーん…このままですと厳しいですね…",
    prosody: { speakerId: 33, pitchScale: 0.0, intonationScale: 1.22, speedScale: 0.95 },
  },
  {
    filename: "koga-troubled.opus",
    text: "お気持ちは分かりますが…",
    prosody: { speakerId: 33, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 },
  },

  // Civic Lobby Guide Takahashi (Kasukabe Tsumugi)
  {
    filename: "takahashi-neutral.opus",
    text: "おはようございます。こちらへどうぞ。",
    prosody: { speakerId: 8, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 },
  },
  {
    filename: "takahashi-troubled.opus",
    text: "恐れ入りますが、お待ちの方がいらっしゃいますので…",
    prosody: { speakerId: 8, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "takahashi-happy.opus",
    text: "手続きが無事に済んでよかったです！",
    prosody: { speakerId: 8, pitchScale: 0.02, intonationScale: 1.24, speedScale: 0.99 },
  },
  {
    filename: "takahashi-relieved.opus",
    text: "ふぅ…お役に立てて安心いたしました。",
    prosody: { speakerId: 8, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.97 },
  },

  // Direct expression fallbacks
  {
    filename: "neutral.opus",
    text: "おはようございます。",
    prosody: { speakerId: 8, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.98 },
  },
  {
    filename: "thinking.opus",
    text: "なるほど…確認しましょう。",
    prosody: { speakerId: 31, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "stern.opus",
    text: "規定がございます。",
    prosody: { speakerId: 30, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.94 },
  },
  {
    filename: "proud.opus",
    text: "大変助かりました。",
    prosody: { speakerId: 29, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.96 },
  },
  {
    filename: "disappointed.opus",
    text: "……ここまでといたします。",
    prosody: { speakerId: 31, pitchScale: -0.03, intonationScale: 1.05, speedScale: 0.91 },
  },
  {
    filename: "worried.opus",
    text: "うーん…厳しいですね…",
    prosody: { speakerId: 33, pitchScale: 0.0, intonationScale: 1.22, speedScale: 0.95 },
  },
  {
    filename: "troubled.opus",
    text: "お気持ちは分かりますが…",
    prosody: { speakerId: 33, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 },
  },
  {
    filename: "happy.opus",
    text: "よかったです！",
    prosody: { speakerId: 8, pitchScale: 0.02, intonationScale: 1.24, speedScale: 0.99 },
  },
  {
    filename: "relieved.opus",
    text: "安心いたしました。",
    prosody: { speakerId: 8, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.97 },
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

  const baseDir = path.join(process.cwd(), "public/assets/dialogue-quest/ward-office-tax");
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
  for (const [nodeId, node] of Object.entries(WARD_OFFICE_TAX_NODES)) {
    const outPath = path.join(dialogueDir, `${nodeId}.opus`);
    const prosody = getCharacterProsody(node.characterKey, node.expression, node.speakerVoiceId);
    const bytes = await synthesizeToOpus(node.npcTextJa, prosody, outPath);
    console.log(
      `  [dialogue] ${nodeId}.opus (${node.characterKey || "obata"}:${node.expression}, speaker=${prosody.speakerId}, ${bytes}B)`
    );
    dialogueCount++;
  }

  console.log("\n=== 2. Generating MC Player Choice Audio ===");
  for (const node of Object.values(WARD_OFFICE_TAX_NODES)) {
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
