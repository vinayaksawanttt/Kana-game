import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { EMPLOYER_NODES } from "../src/data/dialogue/scenarios/employer-shift-request";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();

interface ProsodyConfig {
  speakerId: number;
  pitchScale: number;
  intonationScale: number;
  speedScale: number;
}

function getNakamuraProsody(expression?: string, speakerVoiceId?: number): ProsodyConfig {
  switch (expression) {
    case "happy":
      return { speakerId: speakerVoiceId || 39, pitchScale: 0.01, intonationScale: 1.25, speedScale: 1.0 };
    case "thinking":
      return { speakerId: speakerVoiceId || 11, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.95 };
    case "troubled":
      return { speakerId: speakerVoiceId || 41, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 };
    case "stern":
      return { speakerId: speakerVoiceId || 40, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.97 };
    case "goodbye":
      return { speakerId: speakerVoiceId || 39, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.98 };
    default:
      return { speakerId: speakerVoiceId || 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
  }
}

function getPlayerProsody(tier: string): ProsodyConfig {
  // Shirakami Kotarou (12 Normal, 32 Upbeat, 34 Blunt) so Player contrasts clearly with Manager Nakamura (11)
  switch (tier) {
    case "respectful":
      return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.97 };
    case "polite":
      return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 32, pitchScale: 0.0, intonationScale: 1.22, speedScale: 1.02 };
    case "rude":
      return { speakerId: 34, pitchScale: -0.01, intonationScale: 1.25, speedScale: 1.03 };
    default:
      return { speakerId: 12, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.98 };
  }
}

const NAKAMURA_SFX_REACTIONS: Array<{
  filename: string;
  text: string;
  prosody: ProsodyConfig;
}> = [
  {
    filename: "nakamura-neutral.mp3",
    text: "お疲れ様！",
    prosody: { speakerId: 11, pitchScale: 0.0, intonationScale: 1.2, speedScale: 0.98 },
  },
  {
    filename: "nakamura-happy.mp3",
    text: "おお、助かるよ！",
    prosody: { speakerId: 39, pitchScale: 0.01, intonationScale: 1.28, speedScale: 1.0 },
  },
  {
    filename: "nakamura-thinking.mp3",
    text: "うーん、ちょっと待ってね…",
    prosody: { speakerId: 11, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.94 },
  },
  {
    filename: "nakamura-troubled.mp3",
    text: "うーん、それは困ったなあ…",
    prosody: { speakerId: 41, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 },
  },
  {
    filename: "nakamura-stern.mp3",
    text: "ちょっと待って。",
    prosody: { speakerId: 40, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.96 },
  },
  {
    filename: "nakamura-goodbye.mp3",
    text: "試験、頑張ってね！",
    prosody: { speakerId: 39, pitchScale: 0.01, intonationScale: 1.25, speedScale: 0.98 },
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
  console.log(`Connected to VOICEVOX ${(await ping.text()).trim()} (Manager Nakamura: Speaker 11/39/40/41 - Kurono Takehiro)`);

  const baseDir = path.join(process.cwd(), "public", "assets", "dialogue-quest", "employer-shift-request");
  const dialogueDir = path.join(baseDir, "dialogue");
  const sfxDir = path.join(baseDir, "sfx");
  const choicesDir = path.join(baseDir, "choices");

  fs.mkdirSync(dialogueDir, { recursive: true });
  fs.mkdirSync(sfxDir, { recursive: true });
  fs.mkdirSync(choicesDir, { recursive: true });

  // Clean obsolete choice files
  for (const existing of fs.readdirSync(choicesDir)) {
    fs.unlinkSync(path.join(choicesDir, existing));
  }

  console.log("\n--- 1. Synthesizing Manager Nakamura NPC Dialogue Audio ---");
  for (const node of Object.values(EMPLOYER_NODES)) {
    const outMp3 = path.join(dialogueDir, `${node.id}.mp3`);
    const prosody = getNakamuraProsody(node.expression, node.speakerVoiceId);
    const bytes = await synthesizeToMp3(node.npcTextJa, prosody, outMp3);
    console.log(`  [NPC] ${node.id}.mp3 (${(bytes / 1024).toFixed(1)} KB) — ${node.npcTextJa}`);
  }

  console.log("\n--- 2. Synthesizing Manager Nakamura Expressive SFX ---");
  for (const sfx of NAKAMURA_SFX_REACTIONS) {
    const outMp3 = path.join(sfxDir, sfx.filename);
    const bytes = await synthesizeToMp3(sfx.text, sfx.prosody, outMp3);
    console.log(`  [SFX] ${sfx.filename} (${(bytes / 1024).toFixed(1)} KB) — ${sfx.text}`);
  }

  console.log("\n--- 3. Synthesizing Player Choice Audio for employer-shift-request ---");
  for (const node of Object.values(EMPLOYER_NODES)) {
    for (const choice of node.choices || []) {
      const outMp3 = path.join(choicesDir, `${choice.id}.mp3`);
      const prosody = getPlayerProsody(choice.tier);
      const bytes = await synthesizeToMp3(choice.textJa, prosody, outMp3);
      console.log(`  [CHOICE] ${choice.id}.mp3 (${(bytes / 1024).toFixed(1)} KB) — ${choice.textJa}`);
    }
  }

  console.log("\nDone generating all employer-shift-request VOICEVOX dialogue, SFX, and choice audio!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
