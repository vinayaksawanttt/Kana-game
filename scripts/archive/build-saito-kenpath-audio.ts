import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { CLIENT_APOLOGY_NODES } from "../../src/data/dialogue/scenarios/client-apology-delay";

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

const KENPATH_API_KEY = (process.env.KENPATH_LABS_API_KEY || "").trim();
if (!KENPATH_API_KEY) {
  console.error("Missing KENPATH_LABS_API_KEY in .env.local");
  process.exit(1);
}

const REN_VOICE_ID = "sv_6q72qb26"; // Ren (Kenpath Labs Tokyo male voice)

function cleanSpokenText(raw: string): string {
  return raw
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
}

async function synthesizeKenpathOpus(
  text: string,
  voiceId: string,
  outOpusPath: string,
  apiKey: string
): Promise<number> {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    throw new Error(`Cannot synthesize empty text from: "${text}"`);
  }

  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });

  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.kenpathlabs.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: cleaned,
          voice: voiceId,
          response_format: "opus",
        }),
      });

      if (res.status === 429) {
        const retrySec = Number.parseInt(res.headers.get("retry-after") || "10", 10) || 10;
        console.warn(`\n[Kenpath 429 Rate Limit] Waiting ${retrySec}s for window reset (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, retrySec * 1000));
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Kenpath error ${res.status}: ${errorText}`);
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      if (rawBuffer.length === 0) {
        throw new Error(`Kenpath returned empty audio for "${cleaned}"`);
      }

      const tmpRaw = `${outOpusPath}.raw.opus`;
      fs.writeFileSync(tmpRaw, rawBuffer);

      try {
        // Standardize container to 24kHz mono Opus
        execFileSync(
          "ffmpeg",
          [
            "-y",
            "-loglevel", "error",
            "-i", tmpRaw,
            "-ac", "1",
            "-ar", "24000",
            "-c:a", "libopus",
            "-b:a", "32k",
            "-vbr", "on",
            outOpusPath,
          ],
          { stdio: "ignore" }
        );
      } finally {
        if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
      }

      if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
        throw new Error(`Failed to create opus output: ${outOpusPath}`);
      }

      return fs.statSync(outOpusPath).size;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[Retry ${attempt}/${maxRetries}] for "${cleaned.slice(0, 30)}...": ${err instanceof Error ? err.message : err}`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${text}`);
}

const SAITO_EXPRESSIVE_SFX: Array<{ filename: string; text: string }> = [
  { filename: "saito-neutral.opus", text: "お疲れ様です。" },
  { filename: "saito-worried.opus", text: "うーん…困りましたね…" },
  { filename: "saito-stern.opus", text: "ちょっと待ってください。" },
  { filename: "saito-thinking.opus", text: "なるほど…どうしたものか…" },
  { filename: "saito-troubled.opus", text: "はぁ…厳しいですね…" },
  { filename: "saito-relieved.opus", text: "ふぅ…助かりました。" },
];

async function main() {
  console.log("==================================================");
  console.log("  Kenpath Labs Speech Synthesis for Saito (Scene 7)");
  console.log("  Speaker: Ren (sv_6q72qb26)");
  console.log("==================================================");

  const baseDir = path.join(process.cwd(), "public/assets/dialogue-quest/client-apology-delay");
  const dialogueDir = path.join(baseDir, "dialogue");
  const sfxDir = path.join(baseDir, "sfx");

  let dialogueCount = 0;
  let sfxCount = 0;

  console.log("\n=== 1. Generating Saito Dialogue Audio ===");
  for (const [nodeId, node] of Object.entries(CLIENT_APOLOGY_NODES)) {
    if (node.characterKey !== "saito") continue;

    const outPath = path.join(dialogueDir, `${nodeId}.opus`);
    const bytes = await synthesizeKenpathOpus(node.npcTextJa, REN_VOICE_ID, outPath, KENPATH_API_KEY);
    console.log(`  [dialogue] ${nodeId}.opus (${(bytes / 1024).toFixed(1)} KB)`);
    dialogueCount++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\n=== 2. Generating Saito Expressive SFX ===");
  for (const sfx of SAITO_EXPRESSIVE_SFX) {
    const outPath = path.join(sfxDir, sfx.filename);
    const bytes = await synthesizeKenpathOpus(sfx.text, REN_VOICE_ID, outPath, KENPATH_API_KEY);
    console.log(`  [sfx]      ${sfx.filename} (${(bytes / 1024).toFixed(1)} KB)`);
    sfxCount++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(
    `\nSuccess! Completed Saito audio generation using Kenpath Labs (Ren): ${dialogueCount} dialogue lines and ${sfxCount} expressive SFX.`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
