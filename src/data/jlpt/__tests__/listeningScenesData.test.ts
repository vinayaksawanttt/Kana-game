import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  ALL_LISTENING_SCENES,
  LISTENING_SCENES_BY_LEVEL,
  loadListeningScenesForLevels,
  validateListeningSceneItem,
} from "@/data/jlpt/listeningScenesData";

describe("JLPT Listening Scenes Data Loader & Asset Integrity", () => {
  describe("Dataset Validation & Loader (Phase 2)", () => {
    it("exports static level maps and contains exactly 15 scenes (3 per level N5-N1)", () => {
      expect(LISTENING_SCENES_BY_LEVEL.N5).toHaveLength(3);
      expect(LISTENING_SCENES_BY_LEVEL.N4).toHaveLength(3);
      expect(LISTENING_SCENES_BY_LEVEL.N3).toHaveLength(3);
      expect(LISTENING_SCENES_BY_LEVEL.N2).toHaveLength(3);
      expect(LISTENING_SCENES_BY_LEVEL.N1).toHaveLength(3);
      expect(ALL_LISTENING_SCENES).toHaveLength(15);
    });

    it("loadListeningScenesForLevels loads only the selected JLPT levels", () => {
      // 1. Single level: N1
      const n1Only = loadListeningScenesForLevels(["N1"]);
      expect(n1Only).toHaveLength(3);
      expect(n1Only.every((s) => s.jlpt === 1)).toBe(true);

      // 2. Multiple levels: N4 and N5
      const n4n5 = loadListeningScenesForLevels(["N4", "N5"]);
      expect(n4n5).toHaveLength(6);
      expect(n4n5.every((s) => s.jlpt === 4 || s.jlpt === 5)).toBe(true);

      // 3. Lowercase input tolerance
      const lower = loadListeningScenesForLevels(["n2", "n3"]);
      expect(lower).toHaveLength(6);
      expect(lower.every((s) => s.jlpt === 2 || s.jlpt === 3)).toBe(true);

      // 4. Duplicate levels deduplicate
      const deduped = loadListeningScenesForLevels(["N1", "N1"]);
      expect(deduped).toHaveLength(3);

      // 5. Unknown level returns empty array
      const invalid = loadListeningScenesForLevels(["N99"]);
      expect(invalid).toHaveLength(0);
    });

    it("validateListeningSceneItem verifies valid items and rejects invalid shapes", () => {
      const sample = ALL_LISTENING_SCENES[0];
      expect(validateListeningSceneItem(sample)).toBe(true);

      // Missing ID
      expect(() =>
        validateListeningSceneItem({ ...sample, id: "" })
      ).toThrowError(/missing or empty 'id'/);

      // Invalid JLPT level
      expect(() =>
        validateListeningSceneItem({ ...sample, jlpt: 9 })
      ).toThrowError(/invalid jlpt level/);

      // Invalid asset path
      expect(() =>
        validateListeningSceneItem({
          ...sample,
          recommendedAssetPath: "/images/invalid.png",
        })
      ).toThrowError(/must start with '\/images\/jlpt-scenes\/'/);

      // Missing visual objects (not 4)
      expect(() =>
        validateListeningSceneItem({ ...sample, visualObjects: [] })
      ).toThrowError(/visualObjects must have length 4/);

      // Non-object input
      expect(validateListeningSceneItem(null)).toBe(false);
      expect(validateListeningSceneItem("string")).toBe(false);
    });
  });

  describe("Public Image Asset Pipeline", () => {
    it("ensures all 15 listening scenes have their recommendedAssetPath pointing to an existing file in public/images/jlpt-scenes/", () => {
      const publicDir = path.resolve(process.cwd(), "public");

      for (const scene of ALL_LISTENING_SCENES) {
        expect(scene.recommendedAssetPath).toMatch(
          /^\/images\/jlpt-scenes\/n[1-5]\/.+\.png$/
        );

        const relPath = scene.recommendedAssetPath.replace(/^\//, "");
        const fullPath = path.join(publicDir, relPath);

        expect(
          fs.existsSync(fullPath),
          `Missing image asset for scene ${scene.id} at ${fullPath}`
        ).toBe(true);

        const stat = fs.statSync(fullPath);
        expect(
          stat.size,
          `Image asset for ${scene.id} must be non-empty`
        ).toBeGreaterThan(100000); // Images are all ~2MB
      }
    });

    it("verifies public/images/jlpt-scenes/<level>/ structure exists for all levels", () => {
      const baseDir = path.resolve(process.cwd(), "public/images/jlpt-scenes");
      expect(fs.existsSync(baseDir)).toBe(true);

      for (const lvl of ["n1", "n2", "n3", "n4", "n5"]) {
        const lvlDir = path.join(baseDir, lvl);
        expect(fs.existsSync(lvlDir)).toBe(true);
        const files = fs.readdirSync(lvlDir);
        expect(files.length).toBe(3);
      }
    });
  });

  describe("N1 Specific Question & Elimination Content", () => {
    it("verifies N1 scene 1 (restaurant incident) answers and elimination logic", () => {
      const scene1 = LISTENING_SCENES_BY_LEVEL.N1.find(
        (s) => s.id === "n1-scene-restaurant-incident"
      )!;
      expect(scene1).toBeDefined();

      const primary = scene1.questions[0];
      expect(primary.correctIndex).toBe(2);
      expect(primary.options[2].labelJa).toBe("客の連絡先をたずねる");
      expect(primary.eliminationExplanationEn).toContain("wiped the coat");

      const bonus1 = scene1.questions[1];
      expect(bonus1.correctIndex).toBe(0);
      expect(bonus1.options[0].labelJa).toContain("寒い");

      const bonus2 = scene1.questions[2];
      expect(bonus2.correctIndex).toBe(0);
      expect(bonus2.options[0].labelJa).toBe("お店");
    });

    it("verifies N1 scene 2 (internship selection) answers and elimination logic", () => {
      const scene2 = LISTENING_SCENES_BY_LEVEL.N1.find(
        (s) => s.id === "n1-scene-internship-selection"
      )!;
      expect(scene2).toBeDefined();

      const primary = scene2.questions[0];
      expect(primary.correctIndex).toBe(1);
      expect(primary.options[1].labelJa).toBe("セミナータイプ");

      const bonus1 = scene2.questions[1];
      expect(bonus1.correctIndex).toBe(0);
      expect(bonus1.options[0].labelJa).toContain("やりたい仕事が決まっていない");

      const bonus2 = scene2.questions[2];
      expect(bonus2.correctIndex).toBe(0);
      expect(bonus2.options[0].labelJa).toContain("高度な専門スキル");
    });

    it("verifies N1 scene 3 (printer repair) answers and elimination logic", () => {
      const scene3 = LISTENING_SCENES_BY_LEVEL.N1.find(
        (s) => s.id === "n1-scene-printer-repair-documents"
      )!;
      expect(scene3).toBeDefined();

      const primary = scene3.questions[0];
      expect(primary.correctIndex).toBe(2);
      expect(primary.options[2].labelJa).toBe("保証書 と 修理依頼書");

      const bonus1 = scene3.questions[1];
      expect(bonus1.correctIndex).toBe(0);
      expect(bonus1.options[0].labelJa).toBe("1年ちょっと");

      const bonus2 = scene3.questions[2];
      expect(bonus2.correctIndex).toBe(0);
      expect(bonus2.options[0].labelJa).toContain("データベースに記録が残っている");
    });
  });
});
