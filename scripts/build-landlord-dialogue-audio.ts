import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { LANDLORD_NODES } from "../src/data/dialogue/scenarios/landlord-ac-repair";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();

interface ProsodyConfig {
  speakerId: number;
  pitchScale: number;
  intonationScale: number;
  speedScale: number;
}

function getSuzukiProsody(expression?: string, speakerVoiceId?: number): ProsodyConfig {
  switch (expression) {
    case "worried":
      return { speakerId: speakerVoiceId || 31, pitchScale: -0.01, intonationScale: 1.25, speedScale: 0.95 };
    case "thinking":
      return { speakerId: speakerVoiceId || 29, pitchScale: 0.0, intonationScale: 1.12, speedScale: 0.94 };
    case "happy":
      return { speakerId: speakerVoiceId || 29, pitchScale: 0.02, intonationScale: 1.28, speedScale: 0.98 };
    case "annoyed":
      return { speakerId: speakerVoiceId || 30, pitchScale: -0.03, intonationScale: 1.18, speedScale: 0.96 };
    case "goodbye":
      return { speakerId: speakerVoiceId || 31, pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.97 };
    default:
      return { speakerId: speakerVoiceId || 29, pitchScale: 0.01, intonationScale: 1.18, speedScale: 0.96 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  switch (tier) {
    case "respectful":
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.96 };
    case "polite":
      return { speakerId: 11, pitchScale: 0.01, intonationScale: 1.2, speedScale: 0.98 };
    case "casual":
      return { speakerId: 39, pitchScale: 0.01, intonationScale: 1.22, speedScale: 1.02 };
    case "rude":
      return { speakerId: 40, pitchScale: -0.01, intonationScale: 1.28, speedScale: 1.04 };
    default:
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.97 };
  }
}

const SUZUKI_SFX_REACTIONS: Array<{
  filename: string;
  text: string;
  prosody: ProsodyConfig;
}> = [
  {
    filename: "suzuki-neutral.mp3",
    text: "あら、こんにちは！",
    prosody: { speakerId: 29, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.98 },
  },
  {
    filename: "suzuki-worried.mp3",
    text: "まあ、大変ですね…",
    prosody: { speakerId: 31, pitchScale: -0.01, intonationScale: 1.28, speedScale: 0.94 },
  },
  {
    filename: "suzuki-thinking.mp3",
    text: "ええと、そうですね…",
    prosody: { speakerId: 29, pitchScale: 0.0, intonationScale: 1.12, speedScale: 0.92 },
  },
  {
    filename: "suzuki-happy.mp3",
    text: "すぐ手配しますね！",
    prosody: { speakerId: 29, pitchScale: 0.02, intonationScale: 1.3, speedScale: 1.0 },
  },
  {
    filename: "suzuki-annoyed.mp3",
    text: "ちょっと、困りますよ…",
    prosody: { speakerId: 30, pitchScale: -0.03, intonationScale: 1.2, speedScale: 0.95 },
  },
  {
    filename: "suzuki-goodbye.mp3",
    text: "気をつけてね！",
    prosody: { speakerId: 31, pitchScale: 0.02, intonationScale: 1.26, speedScale: 0.98 },
  },
];

async function synthesizeToMp3(
  text: string,
  prosody: ProsodyConfig,
  outMp3Path: string
): Promise<number> {
  const cleaned = text.replace(/（[^）]*）/g, "").trim();
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
  audioQuery.volumeScale = 1.0;

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
  const tmpWav = `${outMp3Path}.tmp.wav`;
  fs.writeFileSync(tmpWav, wavBuffer);

  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-i", tmpWav, "-ac", "1", "-ar", "24000", "-b:a", "64k", outMp3Path],
      { stdio: "ignore" }
    );
  } finally {
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  return fs.statSync(outMp3Path).size;
}

async function main() {
  const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
  if (!ping.ok) {
    throw new Error(`VOICEVOX engine not reachable at ${VOICEVOX_BASE_URL}`);
  }
  console.log(`Connected to VOICEVOX ${(await ping.text()).trim()} (Suzuki-san: Speaker 29/30/31 - No.7)`);

  const baseDir = path.join(process.cwd(), "public", "assets", "dialogue-quest", "landlord-ac-repair");
  const dialogueDir = path.join(baseDir, "dialogue");
  const sfxDir = path.join(baseDir, "sfx");
  const choicesDir = path.join(baseDir, "choices");

  fs.mkdirSync(dialogueDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });
  fs.mkdirSync(choicesDir, { recursive: true });

  console.log("\n--- 1. Synthesizing Suzuki-san NPC Dialogue Audio ---");
  for (const node of Object.values(LANDLORD_NODES)) {
    const outMp3 = path.join(dialogueDir, `${node.id}.mp3`);
    const prosody = getSuzukiProsody(node.expression, node.speakerVoiceId);
    const bytes = await synthesizeToMp3(node.npcTextJa, prosody, outMp3);
    console.log(`  [NPC] ${node.id}.mp3 (${(bytes / 1024).toFixed(1)} KB) — ${node.npcTextJa}`);
  }

  console.log("\n--- 2. Synthesizing Suzuki-san Expressive SFX ---");
  for (const sfx of SUZUKI_SFX_REACTIONS) {
    const outMp3 = path.join(sfxDir, sfx.filename);
    const bytes = await synthesizeToMp3(sfx.text, sfx.prosody, outMp3);
    console.log(`  [SFX] ${sfx.filename} (${(bytes / 1024).toFixed(1)} KB) — ${sfx.text}`);
  }

  console.log("\n--- 3. Synthesizing Player Choice Audio for landlord-ac-repair ---");
  for (const node of Object.values(LANDLORD_NODES)) {
    for (const choice of node.choices || []) {
      const outMp3 = path.join(choicesDir, `${choice.id}.mp3`);
      const prosody = getPlayerProsody(choice.tier);
      const bytes = await synthesizeToMp3(choice.textJa, prosody, outMp3);
      console.log(`  [CHOICE] ${choice.id}.mp3 (${(bytes / 1024).toFixed(1)} KB) — ${choice.textJa}`);
    }
  }

  console.log("\nDone generating all landlord-ac-repair VOICEVOX dialogue, SFX, and choice audio!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
