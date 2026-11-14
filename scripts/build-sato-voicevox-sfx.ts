import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

const VOICEVOX_BASE_URL = (process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021").trim();
const SATO_SPEAKER_ID = 14; // Meimei Himari (matches Sato-san's dialogue voice)

interface VoicevoxSfxDef {
  key: string;
  text: string;
  pitchScale: number;
  intonationScale: number;
  speedScale: number;
  volumeScale: number;
  description: string;
}

const SATO_EXPRESSIVE_VOICES: VoicevoxSfxDef[] = [
  {
    key: "sato-neutral",
    text: "はい？",
    pitchScale: 0.02,
    intonationScale: 1.2,
    speedScale: 1.0,
    volumeScale: 0.9,
    description: "Polite attentive greeting",
  },
  {
    key: "sato-happy",
    text: "ふふっ、はい！",
    pitchScale: 0.04,
    intonationScale: 1.35,
    speedScale: 1.05,
    volumeScale: 0.95,
    description: "Cheerful happy laugh & reply",
  },
  {
    key: "sato-pointing",
    text: "あ、あそこです！",
    pitchScale: 0.03,
    intonationScale: 1.3,
    speedScale: 1.08,
    volumeScale: 0.95,
    description: "Upbeat pointing out directions",
  },
  {
    key: "sato-thinking",
    text: "うーん…",
    pitchScale: -0.02,
    intonationScale: 1.1,
    speedScale: 0.88,
    volumeScale: 0.9,
    description: "Contemplative thinking murmur",
  },
  {
    key: "sato-surprised",
    text: "えっ？！",
    pitchScale: 0.06,
    intonationScale: 1.55,
    speedScale: 1.15,
    volumeScale: 0.95,
    description: "Startled anime gasp",
  },
  {
    key: "sato-confused",
    text: "あれっ…？",
    pitchScale: 0.03,
    intonationScale: 1.4,
    speedScale: 0.95,
    volumeScale: 0.9,
    description: "Puzzled head-tilt reaction",
  },
  {
    key: "sato-embarrased",
    text: "え、ええと…",
    pitchScale: 0.02,
    intonationScale: 1.2,
    speedScale: 0.95,
    volumeScale: 0.85,
    description: "Flustered / shy hesitation",
  },
  {
    key: "sato-sad",
    text: "はぁ…",
    pitchScale: -0.04,
    intonationScale: 0.85,
    speedScale: 0.82,
    volumeScale: 0.85,
    description: "Disappointed sigh",
  },
  {
    key: "sato-goodbye",
    text: "じゃあね！",
    pitchScale: 0.04,
    intonationScale: 1.35,
    speedScale: 1.05,
    volumeScale: 0.95,
    description: "Warm friendly farewell",
  },
  {
    key: "sato-backstare",
    text: "ちょっと…！",
    pitchScale: -0.02,
    intonationScale: 1.35,
    speedScale: 1.1,
    volumeScale: 0.95,
    description: "Offended / sharp indignant reaction",
  },
];

async function synthesizeVoicevoxToMp3(def: VoicevoxSfxDef, outMp3Path: string): Promise<number> {
  const queryRes = await fetch(
    `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(def.text)}&speaker=${SATO_SPEAKER_ID}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query error ${queryRes.status}: ${await queryRes.text()}`);
  }
  const audioQuery = await queryRes.json();

  // Tune prosody for anime character expressiveness
  audioQuery.pitchScale = def.pitchScale;
  audioQuery.intonationScale = def.intonationScale;
  audioQuery.speedScale = def.speedScale;
  audioQuery.volumeScale = def.volumeScale;
  audioQuery.prePhonemeLength = 0.04;
  audioQuery.postPhonemeLength = 0.08;

  const synthRes = await fetch(
    `${VOICEVOX_BASE_URL}/synthesis?speaker=${SATO_SPEAKER_ID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
    }
  );
  if (!synthRes.ok) {
    throw new Error(`VOICEVOX synthesis error ${synthRes.status}: ${await synthRes.text()}`);
  }

  const wavBuffer = Buffer.from(await synthRes.arrayBuffer());
  const tmpWav = `${outMp3Path}.tmp.wav`;
  fs.writeFileSync(tmpWav, wavBuffer);

  try {
    // Convert WAV to crisp, lightweight mono MP3 (64kbps)
    execFileSync("ffmpeg", [
      "-y",
      "-i", tmpWav,
      "-ac", "1",
      "-ar", "24000",
      "-b:a", "64k",
      outMp3Path,
    ], { stdio: "ignore" });
  } finally {
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  return fs.statSync(outMp3Path).size;
}

function generateMinimalOptionClickMp3(outMp3Path: string): number {
  // Minimalistic, warm lo-fi Rhodes/kalimba-style soft tap (G4 + B4 muted, warm 1200Hz lowpass)
  execFileSync("ffmpeg", [
    "-y",
    "-f", "lavfi",
    "-i", "aevalsrc=(0.28*sin(2*PI*392*t)+0.16*sin(2*PI*493.88*t)+0.08*sin(2*PI*784*t))*exp(-26*t):d=0.14:s=44100",
    "-af", "lowpass=f=1200,afade=t=in:st=0:d=0.006,afade=t=out:st=0.06:d=0.08",
    "-ac", "1",
    "-b:a", "64k",
    outMp3Path,
  ], { stdio: "ignore" });

  return fs.statSync(outMp3Path).size;
}

async function main() {
  // Verify VOICEVOX engine is reachable
  const ping = await fetch(`${VOICEVOX_BASE_URL}/version`);
  if (!ping.ok) {
    throw new Error(`VOICEVOX engine not reachable at ${VOICEVOX_BASE_URL}`);
  }
  const version = await ping.text();
  console.log(`Connected to VOICEVOX Engine ${version.trim()} (Speaker ${SATO_SPEAKER_ID} - Meimei Himari)\n`);

  const publicSfxDir = path.join(process.cwd(), "public", "assets", "dialogue-quest", "directions-mcdonalds", "sfx");
  const srcSfxDir = path.join(process.cwd(), "src", "data", "dialogue", "assets", "directions-mcdonalds", "sfx");
  fs.mkdirSync(publicSfxDir, { recursive: true });
  fs.mkdirSync(srcSfxDir, { recursive: true });

  for (const def of SATO_EXPRESSIVE_VOICES) {
    const pubFile = path.join(publicSfxDir, `${def.key}.mp3`);
    const srcFile = path.join(srcSfxDir, `${def.key}.mp3`);

    process.stdout.write(`  -> Generating [${def.key}.mp3] "${def.text}" (${def.description})... `);
    const size = await synthesizeVoicevoxToMp3(def, pubFile);
    fs.copyFileSync(pubFile, srcFile);
    console.log(`OK (${(size / 1024).toFixed(1)} KB)`);
  }

  // Generate pleasant minimalistic VN option click sound
  const clickPub = path.join(publicSfxDir, "atmosphere-bonus.mp3");
  const clickSrc = path.join(srcSfxDir, "atmosphere-bonus.mp3");
  process.stdout.write(`  -> Generating [atmosphere-bonus.mp3] (Minimalistic VN option click)... `);
  const clickSize = generateMinimalOptionClickMp3(clickPub);
  fs.copyFileSync(clickPub, clickSrc);
  console.log(`OK (${(clickSize / 1024).toFixed(1)} KB)`);

  console.log("\nAll Sato-san VOICEVOX expressive SFX and minimal VN click generated successfully!");
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
