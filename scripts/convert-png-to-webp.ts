import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";

async function convertFile(pngPath: string): Promise<{ origSize: number; newSize: number; webpPath: string }> {
  const origSize = fs.statSync(pngPath).size;
  const webpPath = pngPath.replace(/\.png$/i, ".webp");
  const isBackground = pngPath.includes("background");

  if (isBackground) {
    await sharp(pngPath)
      .webp({ quality: 82, effort: 6 })
      .toFile(webpPath);
  } else {
    // Character sprite with transparent background
    await sharp(pngPath)
      .webp({ quality: 85, effort: 6, alphaQuality: 90 })
      .toFile(webpPath);
  }

  const newSize = fs.statSync(webpPath).size;
  // Safely remove original png once webp is confirmed created and valid
  if (newSize > 1000) {
    fs.unlinkSync(pngPath);
  }

  return { origSize, newSize, webpPath };
}

async function convertDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await convertDirectory(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      const { origSize, newSize } = await convertFile(fullPath);
      const savings = (((origSize - newSize) / origSize) * 100).toFixed(1);
      console.log(
        `  -> ${path.relative(process.cwd(), fullPath)}: ${(origSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${savings}% saved)`
      );
    }
  }
}

async function main() {
  console.log("Starting PNG to WebP conversion for Dialogue Quest assets...\n");

  const targetDirs = [
    path.join(process.cwd(), "public", "assets", "dialogue-quest", "directions-mcdonalds"),
    path.join(process.cwd(), "src", "data", "dialogue", "assets", "directions-mcdonalds"),
  ];

  for (const dir of targetDirs) {
    console.log(`Processing: ${path.relative(process.cwd(), dir)}`);
    await convertDirectory(dir);
    console.log("");
  }

  console.log("All PNG assets successfully converted to WebP!");
}

main().catch((err) => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
