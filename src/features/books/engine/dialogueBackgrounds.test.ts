import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect } from "vitest";
import {
  GENKI_DIALOGUE_BACKGROUND_IDS,
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
