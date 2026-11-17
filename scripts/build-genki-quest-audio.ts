import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { GENKI_LITTLE_ASIA_NODES } from "../src/data/dialogue/scenarios/genki-little-asia";
import { GENKI_DEPARTMENT_MANAGER_NODES } from "../src/data/dialogue/scenarios/genki-department-manager";
import type { DialogueNode } from "../src/data/dialogue/types";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();

interface ProsodyConfig {
  speakerId: number;
  pitchScale: number;
  intonationScale: number;
  speedScale: number;
}

function getLittleAsiaNpcProsody(expression?: string, speakerVoiceId?: number): ProsodyConfig {
  // Kurono Takehiro: 11 Normal, 39 Happy, 40 Stern, 41 Troubled
  switch (expression) {
    case "happy":
    case "proud":
    case "goodbye":
      return { speakerId: 39, pitchScale: 0.01, intonationScale: 1.24, speedScale: 1.0 };
    case "thinking":
      return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.12, speedScale: 0.95 };
    case "troubled":
    case "disappointed":
      return { speakerId: 41, pitchScale: -0.01, intonationScale: 1.18, speedScale: 0.94 };
    case "stern":
    case "annoyed":
    case "scolding":
      return { speakerId: 40, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.97 };
    default:
      return { speakerId: speakerVoiceId || 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
  }
}

function getLittleAsiaPlayerProsody(tier: string): ProsodyConfig {
  // Shirakami Kotarou: 12 Normal, 32 Upbeat, 34 Blunt
  switch (tier) {
    case "respectful":
      return { speakerId: 12, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.96 };
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

function getDeptManagerNpcProsody(expression?: string, speakerVoiceId?: number): ProsodyConfig {
  // Aoyama Ryusei: 13 Normal, 81 Passionate, 82 Grumpy/Stern, 83 Happy, 85 Sad/Disappointed
  switch (expression) {
    case "happy":
    case "proud":
    case "goodbye":
      return { speakerId: 83, pitchScale: 0.01, intonationScale: 1.22, speedScale: 0.98 };
    case "stern":
    case "annoyed":
    case "scolding":
      return { speakerId: 82, pitchScale: -0.02, intonationScale: 1.22, speedScale: 0.96 };
    case "troubled":
    case "disappointed":
      return { speakerId: 85, pitchScale: -0.01, intonationScale: 1.15, speedScale: 0.94 };
    default:
      return { speakerId: speakerVoiceId || 13, pitchScale: 0.0, intonationScale: 1.16, speedScale: 0.97 };
  }
}

function getDeptManagerPlayerProsody(tier: string): ProsodyConfig {
  // Kurono Takehiro (11 Normal, 39 Upbeat, 40 Blunt) contrasting with Aoyama Ryusei (13)
  switch (tier) {
    case "respectful":
      return { speakerId: 11, pitchScale: -0.01, intonationScale: 1.14, speedScale: 0.96 };
    case "polite":
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.18, speedScale: 0.98 };
    case "casual":
      return { speakerId: 39, pitchScale: 0.01, intonationScale: 1.22, speedScale: 1.02 };
    case "rude":
      return { speakerId: 40, pitchScale: -0.01, intonationScale: 1.25, speedScale: 1.03 };
    default:
      return { speakerId: 11, pitchScale: 0.0, intonationScale: 1.15, speedScale: 0.98 };
  }
}

function cleanTextForVoicevox(rawJa: string): string {
  return rawJa.replace(/（[^）]*）/g, "").trim();
}

async function synthesizeToOpus(
  text: string,
  prosody: ProsodyConfig,
  outOpusPath: string
): Promise<number> {
  const cleaned = cleanTextForVoicevox(text);
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
  const tmpWav = `${outOpusPath}.tmp.wav`;
  fs.writeFileSync(tmpWav, wavBuffer);

  try {
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
    throw new Error(`Failed or suspiciously tiny output file: ${outOpusPath}`);
  }

  return fs.statSync(outOpusPath).size;
}

async function generateScenario(
  scenarioId: string,
  nodes: Record<string, DialogueNode>,
  getNpcProsody: (expression?: string, speakerVoiceId?: number) => ProsodyConfig,
  getPlayerProsody: (tier: string) => ProsodyConfig
) {
  const baseDir = path.join(process.cwd(), "public", "assets", "dialogue-quest", scenarioId);
  const dialogueDir = path.join(baseDir, "dialogue");
  const choicesDir = path.join(baseDir, "choices");

  fs.mkdirSync(dialogueDir, { recursive: true });
  fs.mkdirSync(choicesDir, { recursive: true });

  let count = 0;
  console.log(`\n=== Generating audio for ${scenarioId} ===`);

  for (const node of Object.values(nodes)) {
    const npcProsody = getNpcProsody(node.expression, node.speakerVoiceId);
    const outDialogue = path.join(dialogueDir, `${node.id}.opus`);
    const bytes = await synthesizeToOpus(node.npcTextJa, npcProsody, outDialogue);
    count++;
    console.log(
      `  [dialogue] ${node.id}.opus (speaker=${npcProsody.speakerId}, ${(bytes / 1024).toFixed(1)} KB)`
    );

    for (const choice of node.choices || []) {
      const choiceProsody = getPlayerProsody(choice.tier);
      const outChoice = path.join(choicesDir, `${choice.id}.opus`);
      const cBytes = await synthesizeToOpus(choice.textJa, choiceProsody, outChoice);
      count++;
      console.log(
        `  [choice]   ${choice.id}.opus (tier=${choice.tier}, speaker=${choiceProsody.speakerId}, ${(cBytes / 1024).toFixed(1)} KB)`
      );
    }
  }

  console.log(`Completed ${scenarioId}: ${count} audio files.`);
}

async function main() {
  const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
  if (!ping.ok) {
    throw new Error(`VOICEVOX engine not reachable at ${VOICEVOX_BASE_URL}`);
  }
  console.log(`Connected to VOICEVOX ${(await ping.text()).trim()}`);

  await generateScenario(
    "genki-little-asia",
    GENKI_LITTLE_ASIA_NODES,
    getLittleAsiaNpcProsody,
    getLittleAsiaPlayerProsody
  );

  await generateScenario(
    "genki-department-manager",
    GENKI_DEPARTMENT_MANAGER_NODES,
    getDeptManagerNpcProsody,
    getDeptManagerPlayerProsody
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
