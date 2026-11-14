import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { DIALOGUE_SCENARIOS, getScenarioNodes } from "../src/data/dialogue";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();

// Young adult protagonist voice (Kurono Takehiro: 11 Normal, 39 Upbeat, 40 Blunt/Rude)
function getPlayerVoiceConfig(tier: string) {
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

function cleanChoiceTextForVoicevox(rawJa: string): string {
  return rawJa
    .replace(/（[^）]*）/g, "")
    .replace(/Where is McDonald's\?/gi, "ウェアー イズ マクドナルド？")
    .replace(/McDonald's\?/gi, "マクドナルド？")
    .trim();
}

async function synthesizeChoice(
  textJa: string,
  tier: string,
  outMp3Path: string
): Promise<number> {
  const cfg = getPlayerVoiceConfig(tier);
  const cleaned = cleanChoiceTextForVoicevox(textJa);

  const queryRes = await fetch(
    `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(cleaned)}&speaker=${cfg.speakerId}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query error ${queryRes.status}: ${await queryRes.text()}`);
  }
  const audioQuery = await queryRes.json();
  audioQuery.pitchScale = cfg.pitchScale;
  audioQuery.intonationScale = cfg.intonationScale;
  audioQuery.speedScale = cfg.speedScale;
  audioQuery.volumeScale = 1.0;

  const synthRes = await fetch(
    `${VOICEVOX_BASE_URL}/synthesis?speaker=${cfg.speakerId}`,
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
  console.log(`Connected to VOICEVOX ${(await ping.text()).trim()}`);

  let generatedCount = 0;

  for (const scenario of DIALOGUE_SCENARIOS) {
    const nodes = getScenarioNodes(scenario.id) || {};
    const outDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "dialogue-quest",
      scenario.id,
      "choices"
    );
    fs.mkdirSync(outDir, { recursive: true });

    console.log(`\n=== Synthesizing choices for ${scenario.id} ===`);
    for (const node of Object.values(nodes)) {
      for (const choice of node.choices || []) {
        const outMp3 = path.join(outDir, `${choice.id}.mp3`);
        const bytes = await synthesizeChoice(choice.textJa, choice.tier, outMp3);
        generatedCount++;
        console.log(`  [OK] ${choice.id}.mp3 (${(bytes / 1024).toFixed(1)} KB) — ${choice.textJa}`);
      }
    }
  }

  console.log(`\nSuccessfully synthesized ${generatedCount} VOICEVOX option audio files!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
