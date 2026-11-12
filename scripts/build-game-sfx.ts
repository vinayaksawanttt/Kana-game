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

interface SfxDefinition {
  slug: string;
  prompt: string;
  durationSeconds: number;
  promptInfluence: number;
}

const SFX_LIST: SfxDefinition[] = [
  {
    slug: "temple-bell-gong",
    prompt: "Traditional Japanese temple bell gong (Hyōshigi / Kane)",
    durationSeconds: 2.5,
    promptInfluence: 0.4,
  },
  {
    slug: "victory-fanfare",
    prompt: "Retro 8-bit game victory fanfare",
    durationSeconds: 3.0,
    promptInfluence: 0.4,
  },
  {
    slug: "correct-chime",
    prompt: "Satisfying correct answer chime",
    durationSeconds: 1.5,
    promptInfluence: 0.4,
  },
  {
    slug: "incorrect-chime",
    prompt: "incorrect answer chime",
    durationSeconds: 1.5,
    promptInfluence: 0.4,
  },
  {
    slug: "card-flip",
    prompt: "Card flip / paper sliding sound",
    durationSeconds: 1.0,
    promptInfluence: 0.4,
  },
];

async function generateSoundEffect(
  sfx: SfxDefinition,
  outputPath: string,
  apiKey: string
): Promise<number> {
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

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

async function main() {
  const apiKey = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not found in .env.local");
  }

  const outDir = path.join(process.cwd(), "public", "audio", "sfx");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Generating ${SFX_LIST.length} custom game SFX into ${outDir}...`);

  for (const sfx of SFX_LIST) {
    const filePath = path.join(outDir, `${sfx.slug}.mp3`);
    process.stdout.write(`  -> [${sfx.slug}.mp3] "${sfx.prompt}" (${sfx.durationSeconds}s)... `);
    const bytes = await generateSoundEffect(sfx, filePath, apiKey);
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\nAll custom game SFX generated successfully!");
}

main().catch((err) => {
  console.error("\nSFX generation failed:", err.message || err);
  process.exit(1);
});
