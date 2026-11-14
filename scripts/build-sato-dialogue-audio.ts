import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { DIRECTIONS_NODES } from "../src/data/dialogue/scenarios/directions-mcdonalds";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();
const SATO_SPEAKER_ID = 14; // Meimei Himari

function cleanTextForVoicevox(rawJa: string): string {
  // Remove stage directions in Japanese parentheses e.g. （早足で立ち去ってしまった）
  let cleaned = rawJa.replace(/（[^）]*）/g, "").trim();
  // Normalize foreign words for smooth Japanese VOICEVOX pronunciation
  cleaned = cleaned
    .replace(/TSUTAYA/g, "ツタヤ")
    .replace(/A little\.\.\./gi, "ア リトル…");
  return cleaned;
}

function getProsodyForExpression(expression?: string) {
  switch (expression) {
    case "happy":
      return { pitchScale: 0.03, intonationScale: 1.25, speedScale: 1.0 };
    case "surprised":
      return { pitchScale: 0.04, intonationScale: 1.35, speedScale: 1.05 };
    case "confused":
      return { pitchScale: 0.02, intonationScale: 1.25, speedScale: 0.94 };
    case "thinking":
      return { pitchScale: -0.01, intonationScale: 1.05, speedScale: 0.92 };
    case "pointing":
      return { pitchScale: 0.02, intonationScale: 1.2, speedScale: 1.0 };
    case "embarrased":
    case "embarrassed":
      return { pitchScale: 0.01, intonationScale: 1.15, speedScale: 0.95 };
    case "sad":
      return { pitchScale: -0.03, intonationScale: 0.85, speedScale: 0.88 };
    case "backstare":
      return { pitchScale: -0.02, intonationScale: 1.3, speedScale: 1.05 };
    case "goodbye":
      return { pitchScale: 0.03, intonationScale: 1.2, speedScale: 1.0 };
    default:
      return { pitchScale: 0.0, intonationScale: 1.1, speedScale: 0.96 };
  }
}

async function synthesizeLine(text: string, expression: string | undefined, outMp3Path: string): Promise<number> {
  const queryRes = await fetch(
    `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${SATO_SPEAKER_ID}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query error ${queryRes.status}: ${await queryRes.text()}`);
  }
  const audioQuery = await queryRes.json();

  const prosody = getProsodyForExpression(expression);
  audioQuery.pitchScale = prosody.pitchScale;
  audioQuery.intonationScale = prosody.intonationScale;
  audioQuery.speedScale = prosody.speedScale;
  audioQuery.volumeScale = 1.0;

  const synthRes = await fetch(
    `${VOICEVOX_BASE_URL}/synthesis?speaker=${SATO_SPEAKER_ID}`,
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
    execFileSync("ffmpeg", [
      "-y",
      "-i", tmpWav,
      "-ac", "1",
      "-ar", "24000",
      "-b:a", "64k",
      outMp3Path,
    ], { stdio: "ignore" });
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
  const version = (await ping.text()).trim();
  console.log(`Connected to VOICEVOX ${version} (Speaker ${SATO_SPEAKER_ID} - Meimei Himari)\n`);

  const publicDir = path.join(process.cwd(), "public", "assets", "dialogue-quest", "directions-mcdonalds", "dialogue");
  const srcDir = path.join(process.cwd(), "src", "data", "dialogue", "assets", "directions-mcdonalds", "dialogue");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });

  const nodes = Object.values(DIRECTIONS_NODES);
  let generatedCount = 0;

  for (const node of nodes) {
    const cleanText = cleanTextForVoicevox(node.npcTextJa);
    if (!cleanText) {
      console.log(`  -> [SKIP] ${node.id} (narration only)`);
      continue;
    }

    const pubFile = path.join(publicDir, `${node.id}.mp3`);
    const srcFile = path.join(srcDir, `${node.id}.mp3`);

    process.stdout.write(`  -> [${node.id}.mp3] (${node.expression || "neutral"}) "${cleanText}"... `);
    const bytes = await synthesizeLine(cleanText, node.expression, pubFile);
    fs.copyFileSync(pubFile, srcFile);
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
    generatedCount++;
  }

  console.log(`\nGenerated ${generatedCount} dialogue audio files for Sato-san!`);
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
