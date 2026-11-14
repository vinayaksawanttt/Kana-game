import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { FARMER_NODES } from "../src/data/dialogue/scenarios/farmer-morning-market";

const VOICEVOX_HOST = "http://127.0.0.1:50021";
const SPEAKER_ID = 42; // Chibi Shikijii (ちび式じい)

const SFX_PROMPTS: Record<string, { phrase: string; speedScale: number; pitchScale: number }> = {
  neutral: { phrase: "おう、おはようさん！", speedScale: 1.05, pitchScale: 0.0 },
  happy: { phrase: "わっはっは、そいつは嬉しいねぇ！", speedScale: 1.1, pitchScale: 0.05 },
  proud: { phrase: "自慢の採れたてだよ！どうだい！", speedScale: 1.05, pitchScale: 0.02 },
  surprised: { phrase: "おやまあ！気が早いねぇ！", speedScale: 1.15, pitchScale: 0.05 },
  disappointed: { phrase: "やれやれ…困ったもんだねえ…", speedScale: 0.9, pitchScale: -0.05 },
  goodbye: { phrase: "まいどあり！気をつけてな！", speedScale: 1.1, pitchScale: 0.05 },
  backstare: { phrase: "ふん！もう行ってくれ！", speedScale: 1.05, pitchScale: -0.05 },
};

async function generateSpeech(
  text: string,
  outputPathMp3: string,
  options?: { speedScale?: number; pitchScale?: number }
): Promise<number> {
  const queryRes = await fetch(
    `${VOICEVOX_HOST}/audio_query?speaker=${SPEAKER_ID}&text=${encodeURIComponent(text)}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`Audio query failed: ${queryRes.status} ${await queryRes.text()}`);
  }
  const queryJson = (await queryRes.json()) as Record<string, any>;

  if (options?.speedScale) queryJson.speedScale = options.speedScale;
  if (options?.pitchScale) queryJson.pitchScale = options.pitchScale;

  const synthRes = await fetch(`${VOICEVOX_HOST}/synthesis?speaker=${SPEAKER_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queryJson),
  });
  if (!synthRes.ok) {
    throw new Error(`Synthesis failed: ${synthRes.status} ${await synthRes.text()}`);
  }

  const wavBuffer = Buffer.from(await synthRes.arrayBuffer());

  fs.mkdirSync(path.dirname(outputPathMp3), { recursive: true });

  const tempWav = outputPathMp3.replace(/\.mp3$/, ".temp.wav");
  fs.writeFileSync(tempWav, wavBuffer);

  try {
    execFileSync("ffmpeg", [
      "-y",
      "-i",
      tempWav,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "64k",
      "-ac",
      "1",
      outputPathMp3,
    ]);
  } finally {
    if (fs.existsSync(tempWav)) {
      fs.unlinkSync(tempWav);
    }
  }

  const stat = fs.statSync(outputPathMp3);
  return stat.size;
}

async function main() {
  console.log(`Connecting to VOICEVOX at ${VOICEVOX_HOST} (Speaker ${SPEAKER_ID})...\n`);

  const dialogueOutDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "farmer-morning-market",
    "dialogue"
  );
  const sfxOutDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "farmer-morning-market",
    "sfx"
  );
  const srcDialogueDir = path.join(
    process.cwd(),
    "src",
    "data",
    "dialogue",
    "assets",
    "farmer-morning-market",
    "dialogue"
  );
  const srcSfxDir = path.join(
    process.cwd(),
    "src",
    "data",
    "dialogue",
    "assets",
    "farmer-morning-market",
    "sfx"
  );

  fs.mkdirSync(dialogueOutDir, { recursive: true });
  fs.mkdirSync(sfxOutDir, { recursive: true });
  fs.mkdirSync(srcDialogueDir, { recursive: true });
  fs.mkdirSync(srcSfxDir, { recursive: true });

  console.log("=== Generating Yamada-san Spoken Dialogue Nodes ===");
  for (const [nodeId, node] of Object.entries(FARMER_NODES)) {
    if (node.npcTextJa.startsWith("（")) {
      console.log(`  -> [SKIP] ${nodeId} (narration only)`);
      continue;
    }

    const cleanText = node.npcTextJa
      .replace(/（[^）]*）/g, "")
      .replace(/\([^)]*\)/g, "")
      .trim();

    const outFile = path.join(dialogueOutDir, `${nodeId}.mp3`);
    process.stdout.write(`  -> [${nodeId}.mp3] "${cleanText.slice(0, 30)}..." `);

    const bytes = await generateSpeech(cleanText, outFile, { speedScale: 1.05 });
    // Mirror to src
    fs.copyFileSync(outFile, path.join(srcDialogueDir, `${nodeId}.mp3`));
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\n=== Generating Yamada-san Emotional SFX ===");
  for (const [key, sfx] of Object.entries(SFX_PROMPTS)) {
    const outFile = path.join(sfxOutDir, `yamada-${key}.mp3`);
    process.stdout.write(`  -> [yamada-${key}.mp3] (${key}) "${sfx.phrase}" `);

    const bytes = await generateSpeech(sfx.phrase, outFile, {
      speedScale: sfx.speedScale,
      pitchScale: sfx.pitchScale,
    });
    fs.copyFileSync(outFile, path.join(srcSfxDir, `yamada-${key}.mp3`));
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\nAll dialogue and SFX generated successfully for farmer-morning-market!");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
