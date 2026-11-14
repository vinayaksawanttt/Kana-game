import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

interface AmbientDefinition {
  scenarioId: string;
  prompt: string;
  durationSeconds: number;
}

const AMBIENT_SCENES: AmbientDefinition[] = [
  {
    scenarioId: "directions-mcdonalds",
    prompt:
      "Very soft lofi muffled distant Tokyo Shibuya station square city ambience, gentle distant pedestrian footsteps and soft muted city hum, warm low-pass filtered cozy urban background atmosphere, no loud voices, no harsh traffic, very quiet and soothing",
    durationSeconds: 12,
  },
  {
    scenarioId: "farmer-morning-market",
    prompt:
      "Very soft lofi peaceful Japanese countryside morning market by a gentle river, soft distant flowing stream water, gentle morning breeze through trees and distant soft morning birds, warm muffled cozy acoustic atmosphere, very quiet",
    durationSeconds: 12,
  },
  {
    scenarioId: "koban-lost-wallet",
    prompt:
      "Very soft lofi quiet neighborhood police box interior ambience, faint muffled distant Tokyo street hum outside window, soft quiet room tone with gentle wall clock tick and distant breeze, calm reassuring atmosphere, very quiet",
    durationSeconds: 12,
  },
  {
    scenarioId: "teacher-extension",
    prompt:
      "Very soft lofi quiet Japanese school faculty office afternoon ambience, gentle distant muffled school courtyard breeze through window, soft quiet paper rustle and warm room tone, peaceful academic atmosphere, very quiet",
    durationSeconds: 12,
  },
  {
    scenarioId: "landlord-ac-repair",
    prompt:
      "Very soft lofi Japanese summer residential apartment courtyard ambience, gentle distant muffled summer cicadas and soft glass wind chime furin in a warm breeze, cozy nostalgic summer afternoon room tone, very quiet and soothing",
    durationSeconds: 12,
  },
  {
    scenarioId: "employer-shift-request",
    prompt:
      "Very soft lofi cozy Tokyo specialty coffee shop after-hours ambience, gentle distant muffled espresso steamer warmth, soft quiet ceramic cup clink and warm wooden cafe room tone, relaxing understated atmosphere, very quiet",
    durationSeconds: 12,
  },
];

async function generateAndMasterAmbient(
  item: AmbientDefinition,
  outMp3Path: string,
  apiKey: string
): Promise<number> {
  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: item.prompt,
      duration_seconds: item.durationSeconds,
      prompt_influence: 0.5,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  if (rawBuffer.length === 0) {
    throw new Error("Received empty buffer from ElevenLabs sound-generation");
  }

  fs.mkdirSync(path.dirname(outMp3Path), { recursive: true });
  const tmpRaw = `${outMp3Path}.raw.mp3`;
  fs.writeFileSync(tmpRaw, rawBuffer);

  // Apply warm lofi low-pass filter (2800Hz), gentle high-pass (90Hz), soft gain (0.38), and smooth loop fade-in/out
  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        tmpRaw,
        "-af",
        "highpass=f=90,lowpass=f=2800,volume=0.38,afade=t=in:st=0:d=1.2,afade=t=out:st=10.8:d=1.2",
        "-ac",
        "1",
        "-ar",
        "24000",
        "-b:a",
        "64k",
        outMp3Path,
      ],
      { stdio: "ignore" }
    );
  } finally {
    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
  }

  return fs.statSync(outMp3Path).size;
}

async function main() {
  const apiKey = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not found in .env.local");
  }

  console.log(`Generating ${AMBIENT_SCENES.length} lofi ambient scene soundscapes via ElevenLabs API...\n`);

  for (const item of AMBIENT_SCENES) {
    const outPath = path.join(
      process.cwd(),
      "public",
      "assets",
      "dialogue-quest",
      item.scenarioId,
      "sfx",
      "ambient-loop.mp3"
    );
    process.stdout.write(`  -> [${item.scenarioId}] Generating lofi ambient loop (${item.durationSeconds}s)... `);
    const bytes = await generateAndMasterAmbient(item, outPath, apiKey);
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\nAll 6 lofi background ambient SFX generated and mastered!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
