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

interface AmbienceDef {
  scenarioId: string;
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
}

const AMBIENCE_SCENES: AmbienceDef[] = [
  {
    scenarioId: "directions-mcdonalds",
    prompt:
      "Very soft lofi distant Tokyo Shibuya station square afternoon ambience, gentle muffled pedestrian footsteps, soft distant city breeze and subtle outdoor room tone, calm relaxing background atmosphere, no loud voices, no sirens, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
  {
    scenarioId: "farmer-morning-market",
    prompt:
      "Very soft lofi peaceful Japanese countryside morning market by a gentle flowing river, quiet distant morning birds chirping and soft breeze rustling leaves, calm relaxing outdoor atmosphere, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
  {
    scenarioId: "koban-lost-wallet",
    prompt:
      "Very soft lofi quiet Japanese neighborhood police box office interior room tone, faint muffled distant city street breeze outside window, calm reassuring indoor atmosphere, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
  {
    scenarioId: "teacher-extension",
    prompt:
      "Very soft lofi quiet Japanese school faculty office afternoon ambience, gentle distant hallway room tone, faint soft ticking wall clock and warm quiet indoor air, calm academic atmosphere, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
  {
    scenarioId: "landlord-ac-repair",
    prompt:
      "Very soft lofi Japanese midsummer residential apartment courtyard ambience, gentle distant summer cicadas and soft breeze with a faint glass wind chime furin, warm nostalgic summer atmosphere, not loud, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
  {
    scenarioId: "employer-shift-request",
    prompt:
      "Very soft lofi cozy Tokyo specialty coffee shop cafe after-hours ambience, gentle warm room tone, faint distant porcelain cup clink and soft air, relaxing quiet cafe atmosphere, steady seamless loop",
    durationSeconds: 8.0,
    promptInfluence: 0.5,
  },
];

async function generateAmbienceLoop(
  def: AmbienceDef,
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
      text: def.prompt,
      duration_seconds: def.durationSeconds,
      prompt_influence: def.promptInfluence,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  if (rawBuffer.length === 0) {
    throw new Error(`Empty buffer from ElevenLabs for ${def.scenarioId}`);
  }

  fs.mkdirSync(path.dirname(outMp3Path), { recursive: true });
  const tmpRaw = `${outMp3Path}.raw.mp3`;
  fs.writeFileSync(tmpRaw, rawBuffer);

  try {
    // Apply warm lo-fi filtering (bandpass 120Hz-3000Hz), gentle volume attenuation (0.28),
    // and smooth 0.8s fade-in/out edges for seamless non-distracting looping
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        tmpRaw,
        "-af",
        "highpass=f=120,lowpass=f=3000,volume=0.28,afade=t=in:st=0:d=0.8,afade=t=out:st=7.2:d=0.8",
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

  console.log(`Generating 6 lo-fi background ambience loops with ElevenLabs API...\n`);

  for (const scene of AMBIENCE_SCENES) {
    const outPath = path.join(
      process.cwd(),
      "public",
      "assets",
      "dialogue-quest",
      scene.scenarioId,
      "sfx",
      "ambience.mp3"
    );
    process.stdout.write(`  -> [${scene.scenarioId}/sfx/ambience.mp3] (${scene.durationSeconds}s)... `);
    const size = await generateAmbienceLoop(scene, outPath, apiKey);
    console.log(`OK (${(size / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nSuccessfully generated all 6 lo-fi scene ambience loops!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
