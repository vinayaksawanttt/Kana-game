import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { FIRST_DATE_SAKURA_NODES } from "../src/data/dialogue/scenarios/first-date-sakura";
import { CLIENT_APOLOGY_NODES } from "../src/data/dialogue/scenarios/client-apology-delay";
import { INSTANT_REPLY_ITEMS } from "../src/data/jlpt/instantReplyData";
import { STAR_SCRAMBLE_ITEMS } from "../src/data/jlpt/starScrambleData";
import { SYNONYM_MATCH_ITEMS } from "../src/data/jlpt/synonymMatchData";
import { PHONETIC_TRAP_ITEMS } from "../src/data/jlpt/phoneticTrapData";

const VOICEVOX_URL = process.env.VOICEVOX_URL || "http://127.0.0.1:50021";

// VOICEVOX speaker IDs
const VV = {
  MISAKI: 14, // 冥鳴ひまり (ノーマル)
  MASTER: 13, // 青山龍星 (ノーマル)
  MC: 12, // 白上虎太郎 (ふつう)
  SAITO: 11, // 玄野武宏 (ノーマル)
  JLPT_FEMALE: 8, // 春日部つむぎ (ノーマル)
  JLPT_MALE: 11, // 玄野武宏 (ノーマル)
};

function cleanSpokenText(raw: string): string {
  return raw
    .replace(/\[([^\|\]]+)\|[^\]]+\]/g, "$1")
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, "$1")
    .replace(/[［\[][^\]］]*[］\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesizeVoicevoxOpus(
  text: string,
  speakerId: number,
  outOpusPath: string,
  speedScale = 1.0
): Promise<number> {
  const cleaned = cleanSpokenText(text);
  if (!cleaned) throw new Error(`Empty text for ${outOpusPath}`);

  fs.mkdirSync(path.dirname(outOpusPath), { recursive: true });
  const tmpWav = `${outOpusPath}.tmp.wav`;

  try {
    const queryUrl = `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(cleaned)}&speaker=${speakerId}`;
    const qRes = await fetch(queryUrl, { method: "POST" });
    if (!qRes.ok) {
      throw new Error(`audio_query failed (${qRes.status}): ${await qRes.text()}`);
    }
    const queryJson = (await qRes.json()) as Record<string, unknown>;
    queryJson.speedScale = speedScale;

    const synthUrl = `${VOICEVOX_URL}/synthesis?speaker=${speakerId}`;
    const sRes = await fetch(synthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryJson),
    });
    if (!sRes.ok) {
      throw new Error(`synthesis failed (${sRes.status}): ${await sRes.text()}`);
    }

    const wavBuf = Buffer.from(await sRes.arrayBuffer());
    fs.writeFileSync(tmpWav, wavBuf);

    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        tmpWav,
        "-ac",
        "1",
        "-ar",
        "24000",
        "-c:a",
        "libopus",
        "-b:a",
        "32k",
        "-vbr",
        "on",
        outOpusPath,
      ],
      { stdio: "ignore" }
    );
  } finally {
    if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
  }

  if (!fs.existsSync(outOpusPath) || fs.statSync(outOpusPath).size < 100) {
    throw new Error(`Failed to create opus output: ${outOpusPath}`);
  }
  return fs.statSync(outOpusPath).size;
}

const FIRST_DATE_SFX: Array<{ filename: string; text: string; speaker: number }> = [
  { filename: "misaki-happy.opus", text: "わあ、嬉しい！", speaker: VV.MISAKI },
  { filename: "misaki-thinking.opus", text: "そうですね…どうでしょう。", speaker: VV.MISAKI },
  { filename: "misaki-embarrassed.opus", text: "あ…いえ、そんなことないですよ…！", speaker: VV.MISAKI },
  { filename: "misaki-confused.opus", text: "えっ…？どういう意味ですか？", speaker: VV.MISAKI },
  { filename: "misaki-worried.opus", text: "あの…大丈夫でしょうか…", speaker: VV.MISAKI },
  { filename: "misaki-proud.opus", text: "ふふっ、また来週も会えますね。", speaker: VV.MISAKI },
  { filename: "misaki-relieved.opus", text: "よかった…ほっとしました。", speaker: VV.MISAKI },
  { filename: "misaki-troubled.opus", text: "うーん…少し気まずいですね…", speaker: VV.MISAKI },
  { filename: "misaki-disappointed.opus", text: "……そろそろ、お時間ですね。", speaker: VV.MISAKI },
  { filename: "master-neutral.opus", text: "いらっしゃい。", speaker: VV.MASTER },
  { filename: "master-thinking.opus", text: "ほう…豆の好みが分かるのかね。", speaker: VV.MASTER },
  { filename: "master-happy.opus", text: "ふむ、良いお連れさんだな。", speaker: VV.MASTER },
  { filename: "happy.opus", text: "わあ、嬉しい！", speaker: VV.MISAKI },
  { filename: "thinking.opus", text: "そうですね…", speaker: VV.MISAKI },
  { filename: "embarrassed.opus", text: "あ…えっと…！", speaker: VV.MISAKI },
  { filename: "confused.opus", text: "えっ…？", speaker: VV.MISAKI },
  { filename: "worried.opus", text: "あの…大丈夫でしょうか…", speaker: VV.MISAKI },
  { filename: "proud.opus", text: "ふふっ、嬉しいです。", speaker: VV.MISAKI },
  { filename: "relieved.opus", text: "ほっとしました。", speaker: VV.MISAKI },
  { filename: "troubled.opus", text: "うーん…", speaker: VV.MISAKI },
  { filename: "disappointed.opus", text: "……お時間ですね。", speaker: VV.MISAKI },
  { filename: "neutral.opus", text: "いらっしゃい。", speaker: VV.MASTER },
];

const SAITO_SFX: Array<{ filename: string; text: string }> = [
  { filename: "saito-neutral.opus", text: "お疲れ様です。" },
  { filename: "saito-worried.opus", text: "うーん…困りましたね…" },
  { filename: "saito-stern.opus", text: "ちょっと待ってください。" },
  { filename: "saito-thinking.opus", text: "なるほど…どうしたものか…" },
  { filename: "saito-troubled.opus", text: "はぁ…厳しいですね…" },
  { filename: "saito-relieved.opus", text: "ふぅ…助かりました。" },
];

async function runDialogueQuest() {
  console.log("=== Replacing Dialogue Quest (first-date-sakura + Saito) with VOICEVOX ===");
  const fdBase = path.join(process.cwd(), "public/assets/dialogue-quest/first-date-sakura");
  const saitoBase = path.join(process.cwd(), "public/assets/dialogue-quest/client-apology-delay");
  const tasks: Array<{ label: string; text: string; speaker: number; outPath: string }> = [];

  for (const [nodeId, node] of Object.entries(FIRST_DATE_SAKURA_NODES)) {
    const speaker = node.characterKey === "master" ? VV.MASTER : VV.MISAKI;
    tasks.push({
      label: `first-date-sakura/dialogue/${nodeId}.opus`,
      text: node.npcTextJa,
      speaker,
      outPath: path.join(fdBase, "dialogue", `${nodeId}.opus`),
    });
    for (const choice of node.choices ?? []) {
      tasks.push({
        label: `first-date-sakura/choices/${choice.id}.opus`,
        text: choice.textJa,
        speaker: VV.MC,
        outPath: path.join(fdBase, "choices", `${choice.id}.opus`),
      });
    }
  }
  for (const sfx of FIRST_DATE_SFX) {
    tasks.push({
      label: `first-date-sakura/sfx/${sfx.filename}`,
      text: sfx.text,
      speaker: sfx.speaker,
      outPath: path.join(fdBase, "sfx", sfx.filename),
    });
  }
  for (const [nodeId, node] of Object.entries(CLIENT_APOLOGY_NODES)) {
    if (node.characterKey !== "saito") continue;
    tasks.push({
      label: `client-apology-delay/dialogue/${nodeId}.opus`,
      text: node.npcTextJa,
      speaker: VV.SAITO,
      outPath: path.join(saitoBase, "dialogue", `${nodeId}.opus`),
    });
  }
  for (const sfx of SAITO_SFX) {
    tasks.push({
      label: `client-apology-delay/sfx/${sfx.filename}`,
      text: sfx.text,
      speaker: VV.SAITO,
      outPath: path.join(saitoBase, "sfx", sfx.filename),
    });
  }

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const pct = Math.round(((i + 1) / tasks.length) * 100);
    process.stdout.write(`[${i + 1}/${tasks.length} ${pct}%] ${t.label}... `);
    const bytes = await synthesizeVoicevoxOpus(t.text, t.speaker, t.outPath);
    console.log(`ok (${(bytes / 1024).toFixed(1)} KB)`);
  }

  console.log(`✓ Replaced ${tasks.length} Dialogue Quest .opus files with VOICEVOX.`);
}

async function runJlptGames() {
  console.log("=== Replacing JLPT Games (instant-reply, star-scramble, synonyms, phonetic-traps) with VOICEVOX ===");
  const tasks: Array<{ text: string; speaker: number; outPath: string }> = [];
  const outBase = path.join(process.cwd(), "public/audio");

  for (const item of INSTANT_REPLY_ITEMS) {
    const lvl = `n${item.jlpt}`;
    const promptSpeaker = item.jlpt % 2 === 0 ? VV.JLPT_MALE : VV.JLPT_FEMALE;
    if (cleanSpokenText(item.promptJa)) {
      tasks.push({
        text: item.promptJa,
        speaker: promptSpeaker,
        outPath: path.join(outBase, "listening/instant-reply", lvl, `${item.id}_prompt.opus`),
      });
    }
    item.options.forEach((opt, idx) => {
      if (cleanSpokenText(opt.ja)) {
        tasks.push({
          text: opt.ja,
          speaker: VV.MC,
          outPath: path.join(outBase, "listening/instant-reply", lvl, `${item.id}_opt${idx + 1}.opus`),
        });
      }
    });
  }

  for (const item of STAR_SCRAMBLE_ITEMS) {
    if (cleanSpokenText(item.fullSentence)) {
      tasks.push({
        text: item.fullSentence,
        speaker: item.jlpt % 2 === 1 ? VV.JLPT_FEMALE : VV.JLPT_MALE,
        outPath: path.join(outBase, "jlpt/star-scramble", item.level.toLowerCase(), `${item.id}.opus`),
      });
    }
  }

  for (const item of SYNONYM_MATCH_ITEMS) {
    if (cleanSpokenText(item.sentenceJa)) {
      tasks.push({
        text: item.sentenceJa,
        speaker: item.jlpt % 2 === 1 ? VV.JLPT_FEMALE : VV.JLPT_MALE,
        outPath: path.join(outBase, "jlpt/synonyms", `n${item.jlpt}`, `${item.id}.opus`),
      });
    }
  }

  for (const item of PHONETIC_TRAP_ITEMS) {
    if (cleanSpokenText(item.sentenceJa)) {
      tasks.push({
        text: item.sentenceJa,
        speaker: item.jlpt % 2 === 1 ? VV.JLPT_FEMALE : VV.JLPT_MALE,
        outPath: path.join(outBase, "jlpt/phonetic-traps", item.level.toLowerCase(), `${item.id}.opus`),
      });
    }
  }

  console.log(`Total JLPT clips to synthesize: ${tasks.length}`);
  const CONCURRENCY = 4;
  let completed = 0;
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      const t = tasks[idx];
      await synthesizeVoicevoxOpus(t.text, t.speaker, t.outPath, 0.98);
      completed++;
      if (completed % 100 === 0 || completed === tasks.length) {
        console.log(`  [JLPT] ${completed}/${tasks.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`✓ Replaced ${completed} JLPT .opus files with VOICEVOX.`);
}

async function main() {
  const target = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1] || "all";
  if (target === "dialogue-quest" || target === "all") {
    await runDialogueQuest();
  }
  if (target === "jlpt" || target === "all") {
    await runJlptGames();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
