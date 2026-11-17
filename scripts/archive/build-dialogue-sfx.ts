import * as fs from "node:fs";
import * as path from "node:path";

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

interface DialogueSfxDef {
  key: string;
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
  description: string;
}

const SATO_SFX_LIST: DialogueSfxDef[] = [
  {
    key: "sato-neutral",
    prompt: "Anime girl polite greeting hai attention sound effect",
    durationSeconds: 1.0,
    promptInfluence: 0.5,
    description: "Neutral polite approach bark",
  },
  {
    key: "sato-happy",
    prompt: "Cute anime girl giggling cheerful laughter sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Happy cheerful agreement & gratitude",
  },
  {
    key: "sato-pointing",
    prompt: "Anime game discovery idea sparkle chime sound effect",
    durationSeconds: 1.0,
    promptInfluence: 0.5,
    description: "Pointing out directions / landmark discovery",
  },
  {
    key: "sato-thinking",
    prompt: "Anime girl thinking pondering murmur hmm sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Thinking / calculating walking time",
  },
  {
    key: "sato-surprised",
    prompt: "Anime girl surprised reaction gasp eh sound effect",
    durationSeconds: 1.0,
    promptInfluence: 0.5,
    description: "Surprised reaction to informal approach",
  },
  {
    key: "sato-confused",
    prompt: "Anime girl confused question head tilt sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Confused head tilt when learner mixes up words",
  },
  {
    key: "sato-embarrased",
    prompt: "Anime girl embarrassed flustered nervous giggle sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Embarrassed / flustered reaction",
  },
  {
    key: "sato-sad",
    prompt: "Anime girl disappointed sad sigh sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Disappointed sigh at awkward departure",
  },
  {
    key: "sato-goodbye",
    prompt: "Cute anime girl cheerful waving goodbye sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Cheerful goodbye wave",
  },
  {
    key: "sato-backstare",
    prompt: "Anime girl offended annoyed hmph gasp sound effect",
    durationSeconds: 1.0,
    promptInfluence: 0.5,
    description: "Offended hmph / cold backstare at rude learner",
  },
  {
    key: "shibuya-crossing-chime",
    prompt: "Japanese pedestrian scramble crossing melodic bird chirp chime sound effect",
    durationSeconds: 1.5,
    promptInfluence: 0.5,
    description: "Shibuya scramble crossing pedestrian chime melody",
  },
  {
    key: "atmosphere-bonus",
    prompt: "Anime game sparkling reward success chime sound effect",
    durationSeconds: 1.2,
    promptInfluence: 0.5,
    description: "Social atmosphere boost chime",
  },
];

async function generateSoundEffect(
  sfx: DialogueSfxDef,
  apiKey: string
): Promise<Buffer> {
  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: sfx.prompt,
      duration_seconds: sfx.durationSeconds,
      prompt_influence: sfx.promptInfluence,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error("Received empty buffer from ElevenLabs sound-generation");
  }
  return buffer;
}

async function main() {
  const apiKey = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not found in .env.local");
  }

  const publicSfxDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "directions-mcdonalds",
    "sfx"
  );
  const srcSfxDir = path.join(
    process.cwd(),
    "src",
    "data",
    "dialogue",
    "assets",
    "directions-mcdonalds",
    "sfx"
  );

  fs.mkdirSync(publicSfxDir, { recursive: true });
  fs.mkdirSync(srcSfxDir, { recursive: true });

  console.log(`Generating ${SATO_SFX_LIST.length} Sato-san anime expressive SFX using ElevenLabs API...`);

  for (const sfx of SATO_SFX_LIST) {
    const pubFile = path.join(publicSfxDir, `${sfx.key}.mp3`);
    const srcFile = path.join(srcSfxDir, `${sfx.key}.mp3`);

    // Check if already exists to save quota if rerun
    if (fs.existsSync(pubFile) && fs.statSync(pubFile).size > 1000) {
      console.log(`  -> [CACHE HIT] ${sfx.key}.mp3 (${sfx.description})`);
      if (!fs.existsSync(srcFile)) {
        fs.copyFileSync(pubFile, srcFile);
      }
      continue;
    }

    process.stdout.write(`  -> Generating [${sfx.key}.mp3] "${sfx.prompt}"... `);
    try {
      const buffer = await generateSoundEffect(sfx, apiKey);
      fs.writeFileSync(pubFile, buffer);
      fs.writeFileSync(srcFile, buffer);
      console.log(`OK (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      console.log(`FAILED: ${err?.message || err}`);
    }
  }

  console.log("\nAll Sato-san anime expressive sounds generated successfully!");
}

main().catch((err) => {
  console.error("SFX generation script error:", err);
  process.exit(1);
});
