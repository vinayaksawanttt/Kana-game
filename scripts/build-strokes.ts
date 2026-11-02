import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface KanjiStrokeData {
  kanji: string;
  paths: string[];
  markers: { x: number; y: number }[];
}

interface KanjiRecord {
  c: string;
  jlpt: number;
}

const KANJIVG_ZIP_URL =
  "https://github.com/KanjiVG/kanjivg/releases/download/r20260714/kanjivg-20260714-main.zip";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

function toKanjiVgFilename(kanji: string): string {
  const codePoint = kanji.codePointAt(0);
  if (!codePoint) {
    throw new Error(`Invalid kanji character: "${kanji}"`);
  }
  return `${codePoint.toString(16).toLowerCase().padStart(5, "0")}.svg`;
}

function parseStartPointFromPath(d: string): { x: number; y: number } {
  const match = d.match(/[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  if (!match) {
    return { x: 54.5, y: 54.5 };
  }
  return {
    x: Math.round( Number.parseFloat(match[1]) * 100) / 100,
    y: Math.round(Number.parseFloat(match[2]) * 100) / 100,
  };
}

export function parseKanjiVgSvg(kanji: string, svgContent: string): KanjiStrokeData {
  const paths: string[] = [];
  const pathRegex = /<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/g;
  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = pathRegex.exec(svgContent)) !== null) {
    paths.push(pathMatch[1]);
  }

  const rawMarkers = new Map<number, { x: number; y: number }>();
  const textRegex =
    /<text\b[^>]*\btransform="matrix\([^)]*?\s+([-\d.]+)\s+([-\d.]+)\)"[^>]*>\s*(\d+)\s*<\/text>/g;
  let textMatch: RegExpExecArray | null;
  while ((textMatch = textRegex.exec(svgContent)) !== null) {
    const x = Math.round(Number.parseFloat(textMatch[1]) * 100) / 100;
    const y = Math.round(Number.parseFloat(textMatch[2]) * 100) / 100;
    const index = Number.parseInt(textMatch[3], 10);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(index)) {
      rawMarkers.set(index, { x, y });
    }
  }

  const markers = paths.map((d, idx) => {
    const marker = rawMarkers.get(idx + 1);
    return marker ?? parseStartPointFromPath(d);
  });

  return {
    kanji,
    paths,
    markers,
  };
}

async function ensureKanjiVgExtracted(cacheDir: string): Promise<string> {
  const extractedKanjiDir = resolve(cacheDir, "extracted/kanji");
  if (existsSync(extractedKanjiDir)) {
    return extractedKanjiDir;
  }

  await mkdir(cacheDir, { recursive: true });
  const zipPath = resolve(cacheDir, "kanjivg-20260714-main.zip");

  if (!existsSync(zipPath)) {
    console.log(`Downloading KanjiVG release from ${KANJIVG_ZIP_URL}...`);
    const response = await fetch(KANJIVG_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Failed to download KanjiVG archive: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(zipPath, buffer);
  }

  const extractRoot = resolve(cacheDir, "extracted");
  await mkdir(extractRoot, { recursive: true });
  console.log("Extracting KanjiVG SVG files...");
  execFileSync("unzip", ["-q", "-o", zipPath, "-d", extractRoot]);

  return extractedKanjiDir;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const kanjiDir = resolve(root, "public/data/v1/kanji");
  const strokesDir = resolve(root, "public/data/v1/strokes");
  const cacheDir = resolve(root, "node_modules/.cache/kanjivg");

  await mkdir(strokesDir, { recursive: true });

  let extractedKanjiDir: string;
  try {
    extractedKanjiDir = await ensureKanjiVgExtracted(cacheDir);
  } catch (error) {
    const allStrokeChunksExist = LEVELS.every((level) =>
      existsSync(resolve(strokesDir, `${level}.json`))
    );
    if (allStrokeChunksExist) {
      console.warn(
        "Could not fetch KanjiVG archive, using existing pre-built stroke files in public/data/v1/strokes/."
      );
      return;
    }
    throw error;
  }

  let totalProcessed = 0;
  let totalMissing = 0;

  for (const level of LEVELS) {
    const levelKanjiPath = resolve(kanjiDir, `${level}.json`);
    const records = JSON.parse(await readFile(levelKanjiPath, "utf8")) as KanjiRecord[];
    const strokeRecords: KanjiStrokeData[] = [];

    for (const record of records) {
      const svgFilename = toKanjiVgFilename(record.c);
      const svgPath = resolve(extractedKanjiDir, svgFilename);

      if (!existsSync(svgPath)) {
        totalMissing += 1;
        continue;
      }

      const svgContent = await readFile(svgPath, "utf8");
      const strokeData = parseKanjiVgSvg(record.c, svgContent);
      if (strokeData.paths.length > 0) {
        strokeRecords.push(strokeData);
        totalProcessed += 1;
      }
    }

    const outPath = resolve(strokesDir, `${level}.json`);
    await writeFile(outPath, `${JSON.stringify(strokeRecords)}\n`, "utf8");
    console.log(`Wrote ${strokeRecords.length} kanji stroke records to public/data/v1/strokes/${level}.json`);
  }

  console.log(
    `Stroke build complete: ${totalProcessed} kanji processed (${totalMissing} missing from KanjiVG).`
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

