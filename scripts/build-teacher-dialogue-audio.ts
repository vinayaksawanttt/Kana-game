import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { TEACHER_NODES } from "../src/data/dialogue/scenarios/teacher-extension";

const VOICEVOX_HOST = "http://127.0.0.1:50021";

// SFX Expressive barks for Takahashi-sensei (Mochiko-san)
const TEACHER_SFX_LIST = [
  { key: "neutral", speaker: 20, phrase: "はい、どうぞ！", speedScale: 1.05, pitchScale: 0.0 },
  { key: "worried", speaker: 20, phrase: "あら、大丈夫ですか？", speedScale: 1.0, pitchScale: 0.02 },
  { key: "happy", speaker: 79, phrase: "ふふっ、よく頑張りましたね！", speedScale: 1.1, pitchScale: 0.03 },
  { key: "thinking", speaker: 80, phrase: "うーん、そうですねぇ…", speedScale: 1.0, pitchScale: -0.02 },
  { key: "scolding", speaker: 78, phrase: "これこれ！落ち着きなさい！", speedScale: 1.1, pitchScale: 0.05 },
  { key: "goodbye", speaker: 20, phrase: "はい、お大事にね！", speedScale: 1.05, pitchScale: 0.02 },
];

async function generateSpeech(
  speakerId: number,
  text: string,
  outputPathMp3: string,
  options?: { speedScale?: number; pitchScale?: number }
): Promise<number> {
  const queryRes = await fetch(
    `${VOICEVOX_HOST}/audio_query?speaker=${speakerId}&text=${encodeURIComponent(text)}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`Audio query failed: ${queryRes.status} ${await queryRes.text()}`);
  }
  const queryJson = (await queryRes.json()) as Record<string, any>;

  if (options?.speedScale) queryJson.speedScale = options.speedScale;
  if (options?.pitchScale) queryJson.pitchScale = options.pitchScale;

  const synthRes = await fetch(`${VOICEVOX_HOST}/synthesis?speaker=${speakerId}`, {
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
  console.log(`Connecting to VOICEVOX at ${VOICEVOX_HOST} for Takahashi-sensei (Mochiko-san)...\n`);

  const dialogueOutDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "teacher-extension",
    "dialogue"
  );
  const sfxOutDir = path.join(
    process.cwd(),
    "public",
    "assets",
    "dialogue-quest",
    "teacher-extension",
    "sfx"
  );

  fs.mkdirSync(dialogueOutDir, { recursive: true });
  fs.mkdirSync(sfxOutDir, { recursive: true });

  console.log("=== Generating Takahashi-sensei Spoken Dialogue Audio ===");
  for (const [nodeId, node] of Object.entries(TEACHER_NODES)) {
    if (node.npcTextJa.startsWith("（") && node.npcTextJa.endsWith("）")) {
      console.log(`  -> [SKIP] ${nodeId} (narration only)`);
      continue;
    }

    const cleanText = node.npcTextJa
      .replace(/（[^）]*）/g, "")
      .replace(/\([^)]*\)/g, "")
      .trim();

    if (!cleanText) {
      console.log(`  -> [SKIP] ${nodeId} (empty after removing narration)`);
      continue;
    }

    const outFile = path.join(dialogueOutDir, `${nodeId}.mp3`);
    process.stdout.write(`  -> [${nodeId}.mp3] (Speaker ${node.speakerVoiceId}) "${cleanText.slice(0, 30)}..." `);

    const bytes = await generateSpeech(node.speakerVoiceId, cleanText, outFile, { speedScale: 1.05 });
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\n=== Generating Takahashi-sensei Emotional SFX ===");
  for (const sfx of TEACHER_SFX_LIST) {
    const outFile = path.join(sfxOutDir, `takahashi-${sfx.key}.mp3`);
    process.stdout.write(`  -> [takahashi-${sfx.key}.mp3] (${sfx.key}) "${sfx.phrase}" `);

    const bytes = await generateSpeech(sfx.speaker, sfx.phrase, outFile, {
      speedScale: sfx.speedScale,
      pitchScale: sfx.pitchScale,
    });
    console.log(`OK (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log("\nAll dialogue and SFX generated successfully for teacher-extension!");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
