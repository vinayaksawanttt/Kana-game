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

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env.local");
  process.exit(1);
}

interface SfxItem {
  filename: string;
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
  isLoop?: boolean;
}

const ITEMS_TO_GENERATE: SfxItem[] = [
  // 1. Scene Ambience Loop (matches getScenarioAmbientAudioUrl)
  {
    filename: "ambience.opus",
    prompt:
      "Very soft lofi Tokyo corporate office tower on a rainy afternoon, muffled gentle rain against large glass windows, quiet low-pass filtered carpeted lobby room tone, subtle distant elevator chime hum, serene tense professional atmosphere, no loud voices, no sirens, steady seamless loop",
    durationSeconds: 12.0,
    promptInfluence: 0.5,
    isLoop: true,
  },
  // 2. Scene SFX
  {
    filename: "elevator-chime.opus",
    prompt:
      "Gentle modern Japanese corporate elevator arrival chime ding sound effect, clean high-tech office lobby tone",
    durationSeconds: 3.0,
    promptInfluence: 0.5,
  },
  {
    filename: "door-knock.opus",
    prompt:
      "Polite firm three knuckles knocking on a solid wooden office meeting room door",
    durationSeconds: 2.5,
    promptInfluence: 0.5,
  },
  {
    filename: "rain-on-window.opus",
    prompt:
      "Soft gentle raindrops pattering against a large corporate glass window on a rainy Tokyo afternoon, crisp realistic room tone",
    durationSeconds: 6.0,
    promptInfluence: 0.5,
  },
  {
    filename: "briefcase-latch.opus",
    prompt:
      "Soft metallic click of a luxury leather business briefcase latch opening and documents rustle on conference table",
    durationSeconds: 2.5,
    promptInfluence: 0.5,
  },
];

async function generateSoundEffect(
  item: SfxItem,
  outOpusPath: string,
  apiKey: string
): Promise<number> {
  console.log(`Generating ElevenLabs SFX: ${item.filename} ("${item.prompt.slice(0, 48)}...")...`);

  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: item.prompt,
      duration_seconds: item.durationSeconds,
      prompt_influence: item.promptInfluence,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  if (rawBuffer.length === 0) {
    throw new Error("Received empty buffer from ElevenLabs sound-generation");
  }

  const tmpRaw = `${outOpusPath}.raw.mp3`;
  fs.writeFileSync(tmpRaw, rawBuffer);

  try {
    if (item.isLoop) {
      // Create crossfaded seamless loop with soft lowpass filtering and volume leveling
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel", "error",
          "-i", tmpRaw,
          "-filter_complex",
          "[0:a]aloop=loop=-1:size=240000,afade=t=in:ss=0:d=0.8,afade=t=out:st=11.2:d=0.8,lowpass=f=4500,volume=0.32[outa]",
          "-map", "[outa]",
          "-t", "12.0",
          "-c:a", "libopus",
          "-b:a", "32k",
          "-vbr", "on",
          outOpusPath,
        ],
        { stdio: "ignore" }
      );
    } else {
      // Normal SFX mastering
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel", "error",
          "-i", tmpRaw,
          "-af", "afade=t=in:ss=0:d=0.05,afade=t=out:st=2.2:d=0.3,volume=0.85",
          "-c:a", "libopus",
          "-b:a", "32k",
          "-vbr", "on",
          outOpusPath,
        ],
        { stdio: "ignore" }
      );
    }
  } finally {
    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
  }

  if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
    throw new Error(`Failed to generate or corrupted opus file: ${outOpusPath}`);
  }

  return fs.statSync(outOpusPath).size;
}

async function main() {
  const sfxDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "client-apology-delay",
    "sfx"
  );
  fs.mkdirSync(sfxDir, { recursive: true });

  console.log("==================================================");
  console.log("  ElevenLabs Ambience & Scene SFX for Story 7");
  console.log("==================================================");

  for (const item of ITEMS_TO_GENERATE) {
    const outOpus = path.join(sfxDir, item.filename);
    const bytes = await generateSoundEffect(item, outOpus, ELEVENLABS_API_KEY!);
    console.log(`  [OK] ${item.filename} (${(bytes / 1024).toFixed(1)} KB)`);
    // Mild delay between ElevenLabs calls to avoid rate limits
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\nDone generating all ElevenLabs ambience and scene SFX for Story 7!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
