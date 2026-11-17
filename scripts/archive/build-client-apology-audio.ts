import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { CLIENT_APOLOGY_NODES } from "../../src/data/dialogue/scenarios/client-apology-delay";

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
  const normChar = (characterKey || "hasegawa").toLowerCase();
  const normExpr = (expression || "neutral").toLowerCase();

  if (normChar === "yoshimura") {
    // Receptionist Yoshimura (Shikoku Metan: 2 Normal)
    if (normExpr === "troubled") {
      return { speakerId: 2, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 };
    }
    return { speakerId: 2, pitchScale: 0.02, intonationScale: 1.2, speedScale: 1.0 };
  }

  if (normChar === "saito") {
    // Lead Saito (Shirakami Kotaro: 12 Normal)
    switch (normExpr) {
      case "worried":
        return { speakerId: 12, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 };
      case "stern":
        return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.2, speedScale: 0.97 };
      case "thinking":
        return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 };
      case "troubled":
        return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.2, speedScale: 0.94 };
      case "relieved":
        return { speakerId: 12, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.98 };
      default:
        return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    }
  }

  // Manager Hasegawa (Kenzaki Mesuo: 21 Normal)
  switch (normExpr) {
    case "stern":
      return { speakerId: 21, pitchScale: -0.02, intonationScale: 1.25, speedScale: 0.94 };
    case "annoyed":
      return { speakerId: 21, pitchScale: -0.03, intonationScale: 1.3, speedScale: 0.95 };
    case "scolding":
      return { speakerId: 21, pitchScale: -0.01, intonationScale: 1.4, speedScale: 0.98 };
    case "proud":
      return { speakerId: 21, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 };
    case "disappointed":
      return { speakerId: 21, pitchScale: -0.04, intonationScale: 1.05, speedScale: 0.92 };
    default:
      return { speakerId: defaultSpeakerId || 21, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.96 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  // Kurono Takehiro (11 Normal, 39 Upbeat, 40 Blunt/Rude, 41 Sadness/Troubled)
  switch (tier) {
    case "respectful":
      return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.96 };
    case "polite":
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 39, pitchScale: 0.01, intonationScale: 1.25, speedScale: 1.02 };
    case "rude":
      return { speakerId: 40, pitchScale: -0.01, intonationScale: 1.28, speedScale: 1.04 };
    case "awkward":
      return { speakerId: 41, pitchScale: 0.0, intonationScale: 1.2, speedScale: 0.96 };
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
  // Manager Hasegawa (Speaker 21)
  {
    filename: "hasegawa-neutral.opus",
    text: "どうぞ。",
    prosody: { speakerId: 21, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.96 },
  },
  {
    filename: "hasegawa-stern.opus",
    text: "ふむ…甘いな。",
    prosody: { speakerId: 21, pitchScale: -0.02, intonationScale: 1.25, speedScale: 0.94 },
  },
  {
    filename: "hasegawa-annoyed.opus",
    text: "チッ…話にならん。",
    prosody: { speakerId: 21, pitchScale: -0.03, intonationScale: 1.3, speedScale: 0.95 },
  },
  {
    filename: "hasegawa-scolding.opus",
    text: "何を言っているんだ！",
    prosody: { speakerId: 21, pitchScale: -0.01, intonationScale: 1.4, speedScale: 0.98 },
  },
  {
    filename: "hasegawa-proud.opus",
    text: "よかろう、期待しているぞ。",
    prosody: { speakerId: 21, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 },
  },
  {
    filename: "hasegawa-disappointed.opus",
    text: "……残念だよ。",
    prosody: { speakerId: 21, pitchScale: -0.04, intonationScale: 1.05, speedScale: 0.92 },
  },

  // Project Lead Saito (Speaker 12)
  {
    filename: "saito-neutral.opus",
    text: "お疲れ様です。",
    prosody: { speakerId: 12, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 },
  },
  {
    filename: "saito-worried.opus",
    text: "うーん…困りましたね…",
    prosody: { speakerId: 12, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 },
  },
  {
    filename: "saito-stern.opus",
    text: "ちょっと待ってください。",
    prosody: { speakerId: 12, pitchScale: -0.01, intonationScale: 1.2, speedScale: 0.97 },
  },
  {
    filename: "saito-thinking.opus",
    text: "なるほど…どうしたものか…",
    prosody: { speakerId: 12, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 },
  },
  {
    filename: "saito-troubled.opus",
    text: "はぁ…厳しいですね…",
    prosody: { speakerId: 12, pitchScale: -0.01, intonationScale: 1.2, speedScale: 0.94 },
  },
  {
    filename: "saito-relieved.opus",
    text: "ふぅ…助かりました。",
    prosody: { speakerId: 12, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.98 },
  },

  // Receptionist Yoshimura (Speaker 2)
  {
    filename: "yoshimura-neutral.opus",
    text: "いらっしゃいませ。",
    prosody: { speakerId: 2, pitchScale: 0.02, intonationScale: 1.2, speedScale: 1.0 },
  },
  {
    filename: "yoshimura-troubled.opus",
    text: "あの…お客様…",
    prosody: { speakerId: 2, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 },
  },

  // Expression-direct fallback keys
  {
    filename: "neutral.opus",
    text: "いらっしゃいませ。",
    prosody: { speakerId: 2, pitchScale: 0.02, intonationScale: 1.2, speedScale: 1.0 },
  },
  {
    filename: "stern.opus",
    text: "ふむ…甘いな。",
    prosody: { speakerId: 21, pitchScale: -0.02, intonationScale: 1.25, speedScale: 0.94 },
  },
  {
    filename: "annoyed.opus",
    text: "チッ…話にならん。",
    prosody: { speakerId: 21, pitchScale: -0.03, intonationScale: 1.3, speedScale: 0.95 },
  },
  {
    filename: "scolding.opus",
    text: "何を言っているんだ！",
    prosody: { speakerId: 21, pitchScale: -0.01, intonationScale: 1.4, speedScale: 0.98 },
  },
  {
    filename: "proud.opus",
    text: "よかろう、期待しているぞ。",
    prosody: { speakerId: 21, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 },
  },
  {
    filename: "disappointed.opus",
    text: "……残念だよ。",
    prosody: { speakerId: 21, pitchScale: -0.04, intonationScale: 1.05, speedScale: 0.92 },
  },
  {
    filename: "worried.opus",
    text: "うーん…困りましたね…",
    prosody: { speakerId: 12, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.96 },
  },
  {
    filename: "thinking.opus",
    text: "なるほど…どうしたものか…",
    prosody: { speakerId: 12, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.95 },
  },
  {
    filename: "troubled.opus",
    text: "はぁ…厳しいですね…",
    prosody: { speakerId: 12, pitchScale: -0.01, intonationScale: 1.2, speedScale: 0.94 },
  },
  {
    filename: "relieved.opus",
    text: "ふぅ…助かりました。",
    prosody: { speakerId: 12, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.98 },
  },
];

async function main() {
  const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
  if (!ping.ok) {
    throw new Error(`VOICEVOX engine not reachable at ${VOICEVOX_BASE_URL}`);
  }
  console.log(`Connected to VOICEVOX ${(await ping.text()).trim()}!`);

  const baseDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "client-apology-delay"
  );
  const dialogueDir = path.join(baseDir, "dialogue");
  const sfxDir = path.join(baseDir, "sfx");
  const choicesDir = path.join(baseDir, "choices");

  fs.mkdirSync(dialogueDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });
  fs.mkdirSync(choicesDir, { recursive: true });

  console.log("\n==================================================");
  console.log("  1. Synthesizing Story 7 NPC Dialogue Audio");
  console.log("==================================================");
  for (const node of Object.values(CLIENT_APOLOGY_NODES)) {
    const outOpus = path.join(dialogueDir, `${node.id}.opus`);
    const prosody = getCharacterProsody(
      node.characterKey,
      node.expression,
      node.speakerVoiceId
    );
    const spoken = cleanSpokenText(node.npcTextJa);
    const bytes = await synthesizeToOpus(spoken, prosody, outOpus);
    console.log(
      `  [NPC: ${node.speakerNameJa} / Spk:${prosody.speakerId}] ${node.id}.opus (${(bytes / 1024).toFixed(1)} KB) -> "${spoken.slice(0, 36)}..."`
    );
  }

  console.log("\n==================================================");
  console.log("  2. Synthesizing Character Expressive SFX");
  console.log("==================================================");
  for (const sfx of CHARACTER_EXPRESSIVE_SFX) {
    const outOpus = path.join(sfxDir, sfx.filename);
    const bytes = await synthesizeToOpus(sfx.text, sfx.prosody, outOpus);
    console.log(
      `  [SFX: ${sfx.filename} / Spk:${sfx.prosody.speakerId}] (${(bytes / 1024).toFixed(1)} KB) -> "${sfx.text}"`
    );
  }

  console.log("\n==================================================");
  console.log("  3. Synthesizing MC Sato Choice Audio");
  console.log("==================================================");
  for (const node of Object.values(CLIENT_APOLOGY_NODES)) {
    for (const choice of node.choices || []) {
      const outOpus = path.join(choicesDir, `${choice.id}.opus`);
      const prosody = getPlayerProsody(choice.tier);
      const spoken = cleanSpokenText(choice.textJa);
      const bytes = await synthesizeToOpus(spoken, prosody, outOpus);
      console.log(
        `  [MC Choice: ${choice.tier}] ${choice.id}.opus (${(bytes / 1024).toFixed(1)} KB) -> "${spoken.slice(0, 36)}..."`
      );
    }
  }

  console.log("\nSuccessfully generated all Story 7 VOICEVOX dialogue, SFX, and choice audio files!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
