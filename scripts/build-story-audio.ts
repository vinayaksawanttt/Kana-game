import fs from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { buildStoryAudioQueue } from "../src/engine/audio";
import { getAllStories } from "../src/data/stories";

const DATA_DIR = path.resolve(process.cwd(), "public/data/v1/stories");
const OUTPUT_DIR = path.resolve(process.cwd(), "public/audio/stories");
const VOICE = "ja-JP-NanamiNeural";

interface BuiltStoryData {
  id: string;
  paragraphs: Array<{ ja?: string; sentences?: Array<{ ja: string }> }>;
}

interface AudioTask {
  slug: string;
  index: number;
  text: string;
  targetFile: string;
}

function parseLimit(args: string[]): number | undefined {
  const value = args.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
  if (value === undefined) return undefined;
  const limit = Number.parseInt(value, 10);
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("--limit must be a non-negative integer.");
  }
  return limit;
}

function buildTasks(args: string[]): AudioTask[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Story data directory not found: ${DATA_DIR}. Run the data build first.`);
  }

  const requestedSlug = args.find((arg) => arg.startsWith("--story="))?.split("=")[1];
  const limit = parseLimit(args);
  const storiesById = new Map(getAllStories().map((story) => [story.id, story]));
  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith(".json")).sort();
  const tasks: AudioTask[] = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as BuiltStoryData;
    const story = storiesById.get(data.id);
    if (!story) continue;
    if (requestedSlug && story.slug !== requestedSlug && story.id !== requestedSlug) continue;

    for (const segment of buildStoryAudioQueue({ slug: story.slug, paragraphs: data.paragraphs })) {
      const targetFile = path.join(OUTPUT_DIR, story.slug, `${segment.index}.mp3`);
      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).size === 0) {
        tasks.push({ slug: story.slug, index: segment.index, text: segment.ttsText, targetFile });
      }
    }
  }

  if (requestedSlug && !getAllStories().some((story) => story.slug === requestedSlug || story.id === requestedSlug)) {
    throw new Error(`Unknown story slug: ${requestedSlug}`);
  }

  return typeof limit === "number" ? tasks.slice(0, limit) : tasks;
}

async function synthesizeFile(
  tts: MsEdgeTTS,
  text: string,
  targetFile: string
): Promise<void> {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(text, { rate: "-5%" });
        const output = fs.createWriteStream(targetFile);
        audioStream.pipe(output);
        output.on("finish", resolve);
        output.on("error", reject);
        audioStream.on("error", reject);
      });

      if (fs.statSync(targetFile).size > 0) return;
      throw new Error(`Generated empty audio file: ${targetFile}`);
    } catch (error) {
      fs.rmSync(targetFile, { force: true });
      if (attempt === 3) throw error;
      console.warn(`Retrying ${text} (${attempt}/3).`);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

export async function buildStoryAudio(args = process.argv.slice(2)): Promise<void> {
  const tasks = buildTasks(args);
  const dryRun = args.includes("--dry-run");
  console.log(`[Story Audio] ${tasks.length} missing sentence clips${dryRun ? " (dry run)" : ""}.`);
  if (dryRun || tasks.length === 0) return;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]!;
    process.stdout.write(`[${index + 1}/${tasks.length}] ${task.slug} sentence ${task.index + 1}... `);
    await synthesizeFile(tts, task.text, task.targetFile);
    process.stdout.write(`Done (${fs.statSync(task.targetFile).size} bytes)\n`);
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildStoryAudio().catch((error: unknown) => {
    console.error("[Story Audio Pipeline Error]", error);
    process.exitCode = 1;
  });
}
