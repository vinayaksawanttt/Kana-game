import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TARGET_DIR = path.resolve(process.cwd(), "public/assets/dialogue-quest");

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
  if (newSize < 100) {
    throw new Error(`Converted opus file is suspiciously small (${newSize} bytes): ${opusPath}`);
  }

  // Conversion verified: remove original mp3
  fs.unlinkSync(mp3Path);

  return { origSize, newSize, opusPath };
}

async function convertScenario(scenarioDir: string): Promise<{ count: number; totalOrig: number; totalNew: number }> {
  const scenarioName = path.basename(scenarioDir);
  console.log(`\n=== Processing scenario: ${scenarioName} ===`);

  const mp3Files: string[] = [];

  function findMp3s(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findMp3s(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp3")) {
        mp3Files.push(full);
      }
    }
  }

  findMp3s(scenarioDir);
  console.log(`Found ${mp3Files.length} MP3 files in ${scenarioName}`);

  let count = 0;
  let totalOrig = 0;
  let totalNew = 0;

  for (let i = 0; i < mp3Files.length; i++) {
    const file = mp3Files[i];
    const rel = path.relative(scenarioDir, file);
    try {
      const { origSize, newSize } = await convertFile(file);
      count++;
      totalOrig += origSize;
      totalNew += newSize;
      const savings = (((origSize - newSize) / origSize) * 100).toFixed(1);
      console.log(`  [${i + 1}/${mp3Files.length}] ${rel}: ${(origSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB (${savings}% saved)`);
    } catch (err) {
      console.error(`  ERROR converting ${rel}:`, err);
      throw err;
    }
  }

  const overallSavings = totalOrig > 0 ? (((totalOrig - totalNew) / totalOrig) * 100).toFixed(1) : "0";
  console.log(`Scenario ${scenarioName} done: ${count} files, ${(totalOrig / 1024).toFixed(1)}KB -> ${(totalNew / 1024).toFixed(1)}KB (${overallSavings}% saved)`);

  return { count, totalOrig, totalNew };
}

async function main() {
  console.log("Starting Dialogue Quest MP3 to Opus Conversion...");
  if (!fs.existsSync(TARGET_DIR)) {
    console.error("Directory not found:", TARGET_DIR);
    process.exit(1);
  }

  const entries = fs.readdirSync(TARGET_DIR, { withFileTypes: true });
  const scenarioDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(TARGET_DIR, e.name))
    .sort();

  let grandCount = 0;
  let grandOrig = 0;
  let grandNew = 0;

  for (const sDir of scenarioDirs) {
    const res = await convertScenario(sDir);
    grandCount += res.count;
    grandOrig += res.totalOrig;
    grandNew += res.totalNew;
  }

  const grandSavings = grandOrig > 0 ? (((grandOrig - grandNew) / grandOrig) * 100).toFixed(1) : "0";
  console.log("\n==========================================");
  console.log(`All Scenarios Complete!`);
  console.log(`Total Files Converted: ${grandCount}`);
  console.log(`Original Size: ${(grandOrig / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Opus Size:     ${(grandNew / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Space Saved:   ${grandSavings}%`);
  console.log("==========================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
