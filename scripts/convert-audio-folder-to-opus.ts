import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function convertFile(mp3Path: string): Promise<{ origSize: number; newSize: number; opusPath: string }> {
  const origSize = fs.statSync(mp3Path).size;
  const opusPath = mp3Path.replace(/\.mp3$/i, ".opus");

  // Run ffmpeg with libopus at 32k VBR
  await execFileAsync("ffmpeg", [
    "-y",
    "-loglevel", "error",
    "-i", mp3Path,
    "-c:a", "libopus",
    "-b:a", "32k",
    "-vbr", "on",
    opusPath,
  ]);

  if (!fs.existsSync(opusPath)) {
    throw new Error(`Failed to create opus file: ${opusPath}`);
  }

  const newSize = fs.statSync(opusPath).size;
  if (newSize < 50) {
    throw new Error(`Converted opus file is suspiciously small (${newSize} bytes): ${opusPath}`);
  }

  // Conversion verified: remove original mp3
  fs.unlinkSync(mp3Path);

  return { origSize, newSize, opusPath };
}

function findMp3Files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMp3Files(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp3")) {
      results.push(full);
    }
  }
  return results.sort();
}

async function runWorkerPool<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await task(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function convertDirectories(dirs: string[], concurrency = 4) {
  console.log(`Starting Opus conversion for directories: ${dirs.join(", ")} (Concurrency: ${concurrency})`);

  let grandCount = 0;
  let grandOrig = 0;
  let grandNew = 0;

  for (const targetDir of dirs) {
    const resolvedDir = path.resolve(process.cwd(), targetDir);
    const mp3Files = findMp3Files(resolvedDir);
    console.log(`\n=== Directory: ${targetDir} (${mp3Files.length} MP3 files) ===`);

    let dirCount = 0;
    let dirOrig = 0;
    let dirNew = 0;

    await runWorkerPool(mp3Files, concurrency, async (file, i) => {
      const rel = path.relative(process.cwd(), file);
      try {
        const { origSize, newSize } = await convertFile(file);
        dirCount++;
        dirOrig += origSize;
        dirNew += newSize;
        grandCount++;
        grandOrig += origSize;
        grandNew += newSize;
        const savings = origSize > 0 ? (((origSize - newSize) / origSize) * 100).toFixed(1) : "0";
        if (i % 25 === 0 || i === mp3Files.length - 1) {
          console.log(`  [${i + 1}/${mp3Files.length}] ${rel}: ${(origSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB (${savings}% saved)`);
        }
      } catch (err) {
        console.error(`  ERROR converting ${rel}:`, err);
        throw err;
      }
    });

    const dirSavings = dirOrig > 0 ? (((dirOrig - dirNew) / dirOrig) * 100).toFixed(1) : "0";
    console.log(`Finished ${targetDir}: ${dirCount} files, ${(dirOrig / (1024 * 1024)).toFixed(2)} MB -> ${(dirNew / (1024 * 1024)).toFixed(2)} MB (${dirSavings}% saved)`);
  }

  const grandSavings = grandOrig > 0 ? (((grandOrig - grandNew) / grandOrig) * 100).toFixed(1) : "0";
  console.log("\n==========================================");
  console.log(`Phase Complete!`);
  console.log(`Total Files Converted: ${grandCount}`);
  console.log(`Original Size: ${(grandOrig / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Opus Size:     ${(grandNew / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Space Saved:   ${grandSavings}%`);
  console.log("==========================================\n");
}

async function main() {
  const targetDirs = process.argv.slice(2);
  if (targetDirs.length === 0) {
    console.error("Please provide at least one directory path to convert, e.g. tsx scripts/convert-audio-folder-to-opus.ts public/audio/kana");
    process.exit(1);
  }
  await convertDirectories(targetDirs, 4);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
