import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanForOfflineViolations } from "../../../scripts/verify-offline";
import { buildDataManifest } from "../../../scripts/build-data-manifest";

describe("offline manifest and integrity tests", () => {
  const manifestPath = path.resolve(process.cwd(), "public/data/v1/manifest.json");
  const swPath = path.resolve(process.cwd(), "public/sw.js");

  it("verifies public/data/v1/manifest.json schema, bundleHash, and key assets", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(content);

    expect(manifest.schemaVersion).toBe("1.2.0");
    expect(manifest.bundleHash).toMatch(/^[0-9a-f]{12}$/);
    expect(Object.keys(manifest.assets).length).toBeGreaterThan(50);

    // Verify key heavy and critical assets
    const keyAssets = [
      "shiritori/words.json",
      "kanji/homophones.json",
      "vocabulary/N5.json",
      "dictionary-index.json",
      "grammar/N5.json",
    ];

    for (const assetKey of keyAssets) {
      expect(manifest.assets[assetKey]).toBeDefined();
      expect(manifest.assets[assetKey].hash).toMatch(/^[0-9a-f]{12}$/);
      expect(manifest.assets[assetKey].bytes).toBeGreaterThan(1000);
    }
  });

  it("buildDataManifest generates deterministic hashes and bundleHash", () => {
    const manifest1 = buildDataManifest();
    const manifest2 = buildDataManifest();
    expect(manifest1.bundleHash).toBe(manifest2.bundleHash);
    expect(manifest1.bundleHash).toMatch(/^[0-9a-f]{12}$/);
  });

  it("verifies service worker is generated and contains the active bundleHash", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf8");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    expect(swContent).toContain(`CACHE_NAME = "nihongo-v1-" + "${manifest.bundleHash}"`);
    expect(swContent).toContain("/data/v1/manifest.json");
    expect(swContent).toContain("/dict/");
    expect(swContent).toContain("/_next/static/");
  });

  it("passes architectural offline guardrail with zero external API calls in src/", () => {
    const targetDir = path.resolve(process.cwd(), "src");
    const { violations, filesScanned } = scanForOfflineViolations(targetDir);

    expect(violations).toEqual([]);
    expect(filesScanned).toBeGreaterThan(100);
  });
});

