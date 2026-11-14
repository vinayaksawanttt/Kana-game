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
  // 1. Scene Ambience Loop (normalized to EBU R128 -21 LUFS, outputs both .opus and .mp3)
  {
    filename: "ambience.opus",
    prompt:
      "Soft lofi modern Tokyo tech office tower interior in Shinagawa, quiet carpeted executive waiting lounge room tone, gentle subtle ventilation hum, very faint distant city traffic behind glass windows, calm focused professional interview atmosphere, no voices, no music melody, steady seamless loop",
    durationSeconds: 12.0,
    promptInfluence: 0.5,
    isLoop: true,
  },
  // 2. Scene SFX
  {
    filename: "door-knock.opus",
    prompt:
      "Polite firm three knuckles knocking on a sleek modern corporate wooden interview room door",
    durationSeconds: 2.5,
    promptInfluence: 0.5,
  },
  {
    filename: "chair-sit.opus",
    prompt:
      "Soft subtle sound of pulling out and sitting in a modern ergonomic leather office chair in a quiet meeting room",
    durationSeconds: 2.5,
    promptInfluence: 0.5,
  },
  {
    filename: "notepad-pen.opus",
    prompt:
      "Crisp click of a retractable ballpoint pen and soft pen writing notes on paper notepad on a wooden conference table",
    durationSeconds: 3.0,
    promptInfluence: 0.5,
  },
  {
    filename: "terrace-breeze.opus",
    prompt:
      "Gentle refreshing high-rise Tokyo outdoor office terrace breeze with soft distant city skyline air ambience, serene hopeful afternoon mood",
    durationSeconds: 5.0,
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
      // Seamless loop + EBU R128 loudnorm (-21 LUFS) so ambience is clearly audible with soft ducking
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel", "error",
          "-i", tmpRaw,
          "-filter_complex",
          "[0:a]aloop=loop=-1:size=240000,atrim=0:12.0,afade=t=in:ss=0:d=0.6,afade=t=out:st=11.4:d=0.6,lowpass=f=6000,loudnorm=I=-21:TP=-2:LRA=7[outa]",
          "-map", "[outa]",
          "-c:a", "libopus",
          "-b:a", "32k",
          "-vbr", "on",
          outOpusPath,
        ],
        { stdio: "ignore" }
      );

      // Also generate Safari/WebKit MP3 fallback
      const outMp3Path = outOpusPath.replace(/\.opus$/, ".mp3");
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel", "error",
          "-i", outOpusPath,
          "-ac", "1",
          "-ar", "24000",
          "-c:a", "libmp3lame",
          "-b:a", "64k",
          outMp3Path,
        ],
        { stdio: "ignore" }
      );
    } else {
      // Normal SFX mastering
      const fadeOutStart = Math.max(0.5, item.durationSeconds - 0.3);
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-loglevel", "error",
          "-i", tmpRaw,
          "-af", `afade=t=in:ss=0:d=0.05,afade=t=out:st=${fadeOutStart}:d=0.3,loudnorm=I=-18:TP=-2:LRA=7`,
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
    throw new Error(`Failed or corrupted opus file: ${outOpusPath}`);
  }

  return fs.statSync(outOpusPath).size;
}

async function main() {
  const sfxDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "job-interview-pr",
    "sfx"
  );
  fs.mkdirSync(sfxDir, { recursive: true });

  console.log("==================================================");
  console.log("  ElevenLabs Ambience & Scene SFX for Story 8");
  console.log("==================================================");

  for (const item of ITEMS_TO_GENERATE) {
    const outOpus = path.join(sfxDir, item.filename);
    const bytes = await generateSoundEffect(item, outOpus, ELEVENLABS_API_KEY!);
    console.log(`  [OK] ${item.filename} (${(bytes / 1024).toFixed(1)} KB)`);
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\nDone generating all ElevenLabs ambience and scene SFX for Story 8!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
