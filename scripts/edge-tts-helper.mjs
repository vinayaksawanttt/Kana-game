import fs from "node:fs";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const [, , text, voice, outMp3] = process.argv;
if (!text || !voice || !outMp3) {
  console.error("Usage: node scripts/edge-tts-helper.mjs <text> <voice> <outMp3>");
  process.exit(1);
}

async function main() {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      await new Promise((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: "-2%" });
        const out = fs.createWriteStream(outMp3);
        audioStream.pipe(out);
        out.on("finish", resolve);
        out.on("error", reject);
        audioStream.on("error", reject);
      });
      if (fs.existsSync(outMp3) && fs.statSync(outMp3).size > 200) {
        process.exit(0);
      }
    } catch (err) {
      if (attempt === 4) {
        console.error(err);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  process.exit(1);
}

main();
