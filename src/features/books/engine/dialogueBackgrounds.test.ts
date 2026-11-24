import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";
import {
  ALL_DIALOGUE_BACKGROUNDS,
  GENKI_DIALOGUE_BACKGROUND_IDS,
  MNN_DIALOGUE_BACKGROUND_IDS,
  getDialogueBackground,
} from "./dialogueBackgrounds";

describe("dialogueBackgrounds registry", () => {
  it("maps all 60 Genki I & II dialogue scenes to existing WebP files", () => {
    const entries = Object.entries(GENKI_DIALOGUE_BACKGROUND_IDS);
    expect(entries.length).toBe(60);

    for (const [sceneId, bgId] of entries) {
      const resolved = getDialogueBackground(sceneId);
      expect(resolved).toBe(`/images/books/backgrounds/${bgId}.webp`);

      const diskPath = path.join(
        process.cwd(),
        "public",
        "images",
        "books",
        "backgrounds",
        `${bgId}.webp`
      );
      expect(fs.existsSync(diskPath)).toBe(true);
    }
  });

  it("maps all MNN 1 dialogue scenes to existing WebP files", () => {
    const entries = Object.entries(MNN_DIALOGUE_BACKGROUND_IDS);
    expect(entries.length).toBeGreaterThan(0);

    for (const [sceneId, bgId] of entries) {
      const resolved = getDialogueBackground(sceneId, "mnn-1");
      expect(resolved).toBe(`/images/books/backgrounds/${bgId}.webp`);

      const diskPath = path.join(
        process.cwd(),
        "public",
        "images",
        "books",
        "backgrounds",
        `${bgId}.webp`
      );
      expect(fs.existsSync(diskPath), `Missing background file for ${bgId}`).toBe(true);
    }
  });

  it("verifies all unique background assets in ALL_DIALOGUE_BACKGROUNDS exist on disk", () => {
    expect(ALL_DIALOGUE_BACKGROUNDS.length).toBe(60); // 40 Genki + 20 MNN

    for (const bgId of ALL_DIALOGUE_BACKGROUNDS) {
      const diskPath = path.join(
        process.cwd(),
        "public",
        "images",
        "books",
        "backgrounds",
        `${bgId}.webp`
      );
      expect(fs.existsSync(diskPath), `Missing background: ${diskPath}`).toBe(true);
    }
  });

  it("handles case-insensitive and whitespace-padded scene IDs", () => {
    expect(getDialogueBackground("  L1-SCENE-I  ")).toBe(
      "/images/books/backgrounds/01-university-orientation.webp"
    );
  });

  it("returns null for unknown or empty scene IDs", () => {
    expect(getDialogueBackground("")).toBeNull();
    expect(getDialogueBackground("unknown-scene")).toBeNull();
  });
});
