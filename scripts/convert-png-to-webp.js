const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function getAllPngFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      await getAllPngFiles(filePath, fileList);
    } else if (file.endsWith(".png")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function convertAll() {
  const targetDir = path.resolve(__dirname, "../public/assets/dialogue-quest");
  console.log("Scanning for PNGs in:", targetDir);
  const pngFiles = await getAllPngFiles(targetDir);
  console.log(`Found ${pngFiles.length} PNG files.`);

  for (const pngPath of pngFiles) {
    const webpPath = pngPath.replace(/\.png$/, ".webp");
    console.log(`Converting: ${path.relative(targetDir, pngPath)} -> ${path.basename(webpPath)}`);
    
    await sharp(pngPath)
      .webp({ quality: 88, effort: 6 })
      .toFile(webpPath);
      
    fs.unlinkSync(pngPath);
  }

  // Handle aliases and complete coverage
  const aliases = [
    // Job Interview: interview-room-door
    {
      src: path.join(targetDir, "job-interview-pr/backgrounds/corp-waiting-lounge.webp"),
      dest: path.join(targetDir, "job-interview-pr/backgrounds/interview-room-door.webp"),
    },
    // Ward Office: koga/neutral
    {
      src: path.join(targetDir, "ward-office-tax/characters/koga/thinking.webp"),
      dest: path.join(targetDir, "ward-office-tax/characters/koga/neutral.webp"),
    },
    // First Date: daikanyama-station-exit
    {
      src: path.join(targetDir, "first-date-sakura/backgrounds/daikanyama-station.webp"),
      dest: path.join(targetDir, "first-date-sakura/backgrounds/daikanyama-station-exit.webp"),
    },
    // First Date: misaki/embarrassed (standardized spelling)
    {
      src: path.join(targetDir, "first-date-sakura/characters/misaki/embarrased.webp"),
      dest: path.join(targetDir, "first-date-sakura/characters/misaki/embarrassed.webp"),
    },
    // First Date: misaki/neutral
    {
      src: path.join(targetDir, "first-date-sakura/characters/misaki/happy.webp"),
      dest: path.join(targetDir, "first-date-sakura/characters/misaki/neutral.webp"),
    },
    // First Date: misaki/confused
    {
      src: path.join(targetDir, "first-date-sakura/characters/misaki/troubled.webp"),
      dest: path.join(targetDir, "first-date-sakura/characters/misaki/confused.webp"),
    },
  ];

  for (const { src, dest } of aliases) {
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`Created alias: ${path.relative(targetDir, dest)} from ${path.basename(src)}`);
    }
  }

  console.log("All conversions and alias setups completed!");
}

convertAll().catch(err => {
  console.error("Conversion failed:", err);
  process.exit(1);
});
