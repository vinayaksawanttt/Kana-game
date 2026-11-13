import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";

async function convertFile(pngPath: string): Promise<{ origSize: number; newSize: number; webpPath: string }> {
  const origSize = fs.statSync(pngPath).size;
  const webpPath = pngPath.replace(/\.png$/i, ".webp");

  await sharp(pngPath)
    .webp({ quality: 82, effort: 6 })
    .toFile(webpPath);

  const newSize = fs.statSync(webpPath).size;
  if (newSize > 1000) {
    fs.unlinkSync(pngPath);
  }

  return { origSize, newSize, webpPath };
}

async function convertDirectory(dir: string): Promise<{ count: number; totalOrig: number; totalNew: number }> {
  if (!fs.existsSync(dir)) return { count: 0, totalOrig: 0, totalNew: 0 };
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let count = 0;
  let totalOrig = 0;
  let totalNew = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await convertDirectory(fullPath);
      count += sub.count;
      totalOrig += sub.totalOrig;
      totalNew += sub.totalNew;
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const { origSize, newSize } = await convertFile(fullPath);
      count++;
      totalOrig += origSize;
      totalNew += newSize;
      const savings = (((origSize - newSize) / origSize) * 100).toFixed(1);
      console.log(
        `  -> ${path.relative(process.cwd(), fullPath)}: ${(origSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${savings}% saved)`
      );
    }
  }

  return { count, totalOrig, totalNew };
}

async function updateJsonFiles() {
  const jsonFiles = [
    "public/data/v1/jlpt/listening-scenes-n1.json",
    "public/data/v1/jlpt/listening-scenes-n2.json",
    "public/data/v1/jlpt/listening-scenes-n3.json",
    "public/data/v1/jlpt/listening-scenes-n4.json",
    "public/data/v1/jlpt/listening-scenes-n5.json",
  ];

  for (const relPath of jsonFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const updated = content.replace(/\.png"/g, '.webp"');
      fs.writeFileSync(fullPath, updated, "utf-8");
      console.log(`Updated paths in ${relPath}`);
    }
  }
}

async function main() {
  console.log("=== Converting All Website PNG Assets to WebP ===\n");

  const targetDirs = [
    path.join(process.cwd(), "public", "images", "learn"),
    path.join(process.cwd(), "public", "images", "stories"),
    path.join(process.cwd(), "public", "images", "jlpt-scenes"),
  ];

  let grandTotalOrig = 0;
  let grandTotalNew = 0;
  let grandCount = 0;

  for (const dir of targetDirs) {
    console.log(`\nScanning folder: ${path.relative(process.cwd(), dir)}...`);
    const { count, totalOrig, totalNew } = await convertDirectory(dir);
    grandCount += count;
    grandTotalOrig += totalOrig;
    grandTotalNew += totalNew;
  }

  console.log("\nUpdating JLPT JSON metadata files...");
  await updateJsonFiles();

  const totalSavedMb = ((grandTotalOrig - grandTotalNew) / 1024 / 1024).toFixed(2);
  const percentSaved = (((grandTotalOrig - grandTotalNew) / grandTotalOrig) * 100).toFixed(1);

  console.log("\n=== Conversion Summary ===");
  console.log(`Converted: ${grandCount} images`);
  console.log(`Original: ${(grandTotalOrig / 1024 / 1024).toFixed(2)} MB`);
  console.log(`New WebP: ${(grandTotalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Space Saved: ${totalSavedMb} MB (${percentSaved}% reduction)`);
}

main().catch((err) => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
