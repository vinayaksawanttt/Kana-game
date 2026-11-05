import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface DataManifestAsset {
  hash: string;
  bytes: number;
}

export interface DataManifest {
  schemaVersion: string;
  generatedAt: string;
  bundleHash: string;
  assets: Record<string, DataManifestAsset>;
}

export function buildDataManifest(baseDir: string = path.resolve(process.cwd(), "public/data/v1")): DataManifest {
  const assets: Record<string, DataManifestAsset> = {};

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        if (entry.name === "manifest.json") continue;
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        const buf = fs.readFileSync(fullPath);
        const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
        assets[relPath] = {
          hash,
          bytes: buf.byteLength,
        };
      }
    }
  }

  scanDir(baseDir);

  const sortedKeys = Object.keys(assets).sort();
  const sortedAssets: Record<string, DataManifestAsset> = {};
  for (const key of sortedKeys) {
    sortedAssets[key] = assets[key];
  }

  const combinedHashes = sortedKeys.map((k) => sortedAssets[k].hash).join("");
  const bundleHash = crypto.createHash("sha256").update(combinedHashes).digest("hex").slice(0, 12);

  const manifest: DataManifest = {
    schemaVersion: "1.2.0",
    generatedAt: new Date().toISOString(),
    bundleHash,
    assets: sortedAssets,
  };

  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const baseDir = path.resolve(process.cwd(), "public/data/v1");
  const manifest = buildDataManifest(baseDir);
  const outPath = path.join(baseDir, "manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Wrote data manifest with ${Object.keys(manifest.assets).length} assets (bundleHash: ${manifest.bundleHash}) -> ${outPath}`);
}

