import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { FIRST_DATE_SAKURA_NODES } from "../../src/data/dialogue/scenarios/first-date-sakura";

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

// Kenpath Labs Japanese Voice IDs
const VOICES = {
  MISAKI: "sv_qy4oztyr", // Aoi (Calm female voice with Tokyo accent)
  MASTER: "sv_71lsoipx", // Kenta (Warm male voice with Tokyo accent)
  MC: "sv_6q72qb26",     // Ren (Calm male voice with Tokyo accent)
};

const KENPATH_RUN_START_MS = 1794691800000;

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
  if (fs.existsSync(outOpusPath) && fs.statSync(outOpusPath).mtimeMs >= KENPATH_RUN_START_MS) {
    return fs.statSync(outOpusPath).size;
  }

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
        // Standardize container to 24kHz mono Opus with volume leveling
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

const CHARACTER_EXPRESSIVE_SFX: Array<{
  filename: string;
  text: string;
  voiceId: string;
}> = [
  // Misaki (Aoi)
  { filename: "misaki-happy.opus", text: "わあ、嬉しい！", voiceId: VOICES.MISAKI },
  { filename: "misaki-thinking.opus", text: "そうですね…どうでしょう。", voiceId: VOICES.MISAKI },
  { filename: "misaki-embarrassed.opus", text: "あ…いえ、そんなことないですよ…！", voiceId: VOICES.MISAKI },
  { filename: "misaki-confused.opus", text: "えっ…？どういう意味ですか？", voiceId: VOICES.MISAKI },
  { filename: "misaki-worried.opus", text: "あの…大丈夫でしょうか…", voiceId: VOICES.MISAKI },
  { filename: "misaki-proud.opus", text: "ふふっ、また来週も会えますね。", voiceId: VOICES.MISAKI },
  { filename: "misaki-relieved.opus", text: "よかった…ほっとしました。", voiceId: VOICES.MISAKI },
  { filename: "misaki-troubled.opus", text: "うーん…少し気まずいですね…", voiceId: VOICES.MISAKI },
  { filename: "misaki-disappointed.opus", text: "……そろそろ、お時間ですね。", voiceId: VOICES.MISAKI },

  // Kominka Cafe Master (Kenta)
  { filename: "master-neutral.opus", text: "いらっしゃい。", voiceId: VOICES.MASTER },
  { filename: "master-thinking.opus", text: "ほう…豆の好みが分かるのかね。", voiceId: VOICES.MASTER },
  { filename: "master-happy.opus", text: "ふむ、良いお連れさんだな。", voiceId: VOICES.MASTER },

  // Direct expression fallbacks
  { filename: "happy.opus", text: "わあ、嬉しい！", voiceId: VOICES.MISAKI },
  { filename: "thinking.opus", text: "そうですね…", voiceId: VOICES.MISAKI },
  { filename: "embarrassed.opus", text: "あ…えっと…！", voiceId: VOICES.MISAKI },
  { filename: "confused.opus", text: "えっ…？", voiceId: VOICES.MISAKI },
  { filename: "worried.opus", text: "あの…大丈夫でしょうか…", voiceId: VOICES.MISAKI },
  { filename: "proud.opus", text: "ふふっ、嬉しいです。", voiceId: VOICES.MISAKI },
  { filename: "relieved.opus", text: "ほっとしました。", voiceId: VOICES.MISAKI },
  { filename: "troubled.opus", text: "うーん…", voiceId: VOICES.MISAKI },
  { filename: "disappointed.opus", text: "……お時間ですね。", voiceId: VOICES.MISAKI },
  { filename: "neutral.opus", text: "いらっしゃい。", voiceId: VOICES.MASTER },
];

async function main() {
  console.log("==================================================");
  console.log("  Kenpath Labs Speech Synthesis for Story 10");
  console.log("  Misaki: Aoi | Master: Kenta | MC: Ren");
  console.log("==================================================");

  const baseDir = path.join(process.cwd(), "public/assets/dialogue-quest/first-date-sakura");
  const dialogueDir = path.join(baseDir, "dialogue");
  const choicesDir = path.join(baseDir, "choices");
  const sfxDir = path.join(baseDir, "sfx");

  for (const dir of [dialogueDir, choicesDir, sfxDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let dialogueCount = 0;
  let choiceCount = 0;
  let sfxCount = 0;

  console.log("\n=== 1. Generating NPC Dialogue Audio with Kenpath Labs ===");
  for (const [nodeId, node] of Object.entries(FIRST_DATE_SAKURA_NODES)) {
    const isMaster = node.characterKey === "master";
    const voiceId = isMaster ? VOICES.MASTER : VOICES.MISAKI;
    const speakerLabel = isMaster ? "Kenta (Master)" : "Aoi (Misaki)";
    const outPath = path.join(dialogueDir, `${nodeId}.opus`);

    const bytes = await synthesizeKenpathOpus(node.npcTextJa, voiceId, outPath, KENPATH_API_KEY);
    console.log(`  [dialogue] ${nodeId}.opus (${speakerLabel}, ${(bytes / 1024).toFixed(1)} KB)`);
    dialogueCount++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\n=== 2. Generating MC Player Choice Audio with Kenpath Labs (Ren) ===");
  for (const node of Object.values(FIRST_DATE_SAKURA_NODES)) {
    if (!node.choices) continue;
    for (const choice of node.choices) {
      const outPath = path.join(choicesDir, `${choice.id}.opus`);
      const bytes = await synthesizeKenpathOpus(choice.textJa, VOICES.MC, outPath, KENPATH_API_KEY);
      console.log(`  [choice]   ${choice.id}.opus (Ren, tier=${choice.tier}, ${(bytes / 1024).toFixed(1)} KB)`);
      choiceCount++;
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log("\n=== 3. Generating Character Expressive SFX with Kenpath Labs ===");
  for (const sfx of CHARACTER_EXPRESSIVE_SFX) {
    const outPath = path.join(sfxDir, sfx.filename);
    const speakerName = sfx.voiceId === VOICES.MISAKI ? "Aoi" : "Kenta";
    const bytes = await synthesizeKenpathOpus(sfx.text, sfx.voiceId, outPath, KENPATH_API_KEY);
    console.log(`  [sfx]      ${sfx.filename} (${speakerName}, ${(bytes / 1024).toFixed(1)} KB)`);
    sfxCount++;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(
    `\nSuccess! Completed Story 10 Kenpath Labs generation: ${dialogueCount} dialogues, ${choiceCount} choices, and ${sfxCount} expressive SFX.`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
