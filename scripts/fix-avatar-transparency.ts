import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";

interface FileTarget {
  id: string;
  type: "neutral" | "talking";
  mode: "black" | "checkerboard_or_white";
}

const TARGETS: FileTarget[] = [
  // Checkerboard & solid white
  { id: "everyone", type: "talking", mode: "checkerboard_or_white" },
  { id: "john-wang", type: "talking", mode: "checkerboard_or_white" },
  { id: "mary-hart", type: "talking", mode: "checkerboard_or_white" },
  { id: "prof-yamashita", type: "neutral", mode: "checkerboard_or_white" },
  { id: "prof-yamashita", type: "talking", mode: "checkerboard_or_white" },
  { id: "yui-yamakawa", type: "neutral", mode: "checkerboard_or_white" },
  { id: "yui-yamakawa", type: "talking", mode: "checkerboard_or_white" },

  // Solid black
  { id: "carlos", type: "talking", mode: "black" },
  { id: "department-manager", type: "talking", mode: "black" },
  { id: "host-father", type: "talking", mode: "black" },
  { id: "host-mother", type: "talking", mode: "black" },
  { id: "hotel-front-desk-clerk", type: "talking", mode: "black" },
  { id: "landlady", type: "talking", mode: "black" },
  { id: "mana", type: "neutral", mode: "black" },
  { id: "naomi", type: "talking", mode: "black" },
  { id: "old-man", type: "neutral", mode: "black" },
  { id: "old-man", type: "talking", mode: "black" },
  { id: "old-woman", type: "neutral", mode: "black" },
  { id: "old-woman", type: "talking", mode: "black" },
  { id: "passing-stranger", type: "talking", mode: "black" },
  { id: "restaurant-manager", type: "neutral", mode: "black" },
  { id: "restaurant-manager", type: "talking", mode: "black" },
  { id: "restaurant-waitress", type: "neutral", mode: "black" },
  { id: "restaurant-waitress", type: "talking", mode: "black" },
  { id: "store-attendant", type: "neutral", mode: "black" },
  { id: "store-attendant", type: "talking", mode: "black" },
  { id: "tanaka", type: "neutral", mode: "black" },
  { id: "tanaka", type: "talking", mode: "black" },
  { id: "tourist-information-agent", type: "neutral", mode: "black" },
  { id: "tourist-information-agent", type: "talking", mode: "black" },
  { id: "train-station-attendant", type: "talking", mode: "black" },
  { id: "wudi", type: "neutral", mode: "black" },
];

async function fixAvatar(target: FileTarget) {
  const filePath = path.join(process.cwd(), "public", "images", "characters", target.id, `${target.type}.webp`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;

  const out = Buffer.alloc(w * h * 4);
  const visited = new Uint8Array(w * h);

  const isBgPixel = (x: number, y: number): boolean => {
    const idx = (y * w + x) * ch;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = ch === 4 ? data[idx + 3] : 255;

    // Already transparent
    if (a < 128) return true;

    if (target.mode === "black") {
      return r < 32 && g < 32 && b < 32;
    } else {
      // Checkerboard (white & light grey) or pure white
      return (
        r > 210 &&
        g > 210 &&
        b > 210 &&
        Math.abs(r - g) < 12 &&
        Math.abs(g - b) < 12 &&
        Math.abs(r - b) < 12
      );
    }
  };

  // Seed boundary queue (top, bottom, left, right)
  const queueX: number[] = [];
  const queueY: number[] = [];

  for (let x = 0; x < w; x++) {
    if (isBgPixel(x, 0)) { visited[0 * w + x] = 1; queueX.push(x); queueY.push(0); }
    if (isBgPixel(x, h - 1)) { visited[(h - 1) * w + x] = 1; queueX.push(x); queueY.push(h - 1); }
  }
  for (let y = 0; y < h; y++) {
    if (!visited[y * w + 0] && isBgPixel(0, y)) { visited[y * w + 0] = 1; queueX.push(0); queueY.push(y); }
    if (!visited[y * w + (w - 1)] && isBgPixel(w - 1, y)) { visited[y * w + (w - 1)] = 1; queueX.push(w - 1); queueY.push(y); }
  }

  // BFS flood-fill
  let head = 0;
  while (head < queueX.length) {
    const cx = queueX[head];
    const cy = queueY[head];
    head++;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!visited[nidx] && isBgPixel(nx, ny)) {
          visited[nidx] = 1;
          queueX.push(nx);
          queueY.push(ny);
        }
      }
    }
  }

  // Transfer pixel data & assign alpha channel
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * ch;
      const dstIdx = (y * w + x) * 4;
      out[dstIdx] = data[srcIdx];
      out[dstIdx + 1] = data[srcIdx + 1];
      out[dstIdx + 2] = data[srcIdx + 2];

      if (visited[y * w + x] === 1) {
        out[dstIdx + 3] = 0; // Transparent background
      } else {
        out[dstIdx + 3] = 255;
      }
    }
  }

  // Boundary anti-aliasing feathering
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (visited[idx] === 0) {
        let bgCount = 0;
        if (visited[idx - 1]) bgCount++;
        if (visited[idx + 1]) bgCount++;
        if (visited[idx - w]) bgCount++;
        if (visited[idx + w]) bgCount++;
        if (bgCount > 0) {
          const dstIdx = idx * 4;
          out[dstIdx + 3] = bgCount >= 2 ? 180 : 225;
        }
      }
    }
  }

  const tmpOut = `${filePath}.tmp.webp`;
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 88, effort: 6, alphaQuality: 95 })
    .toFile(tmpOut);

  fs.renameSync(tmpOut, filePath);
  const newSize = fs.statSync(filePath).size;
  console.log(`[FIXED] ${target.id}/${target.type}.webp (${(newSize / 1024).toFixed(0)} KB) -> clean alpha transparency`);
}

async function main() {
  console.log(`Starting automated transparency fix for ${TARGETS.length} character avatar images...`);
  for (const target of TARGETS) {
    await fixAvatar(target);
  }
  console.log(`\nSuccessfully processed all ${TARGETS.length} avatars!`);
}

main().catch((err) => {
  console.error("Failed to fix avatars:", err);
  process.exit(1);
});
