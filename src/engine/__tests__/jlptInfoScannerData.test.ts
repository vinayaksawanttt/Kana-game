import { describe, expect, it } from "vitest";
import {
  INFO_SCANNER_DOCUMENTS,
  type InfoScannerCategory,
  type InfoScannerDocument,
} from "@/data/jlpt/infoScannerData";

describe("JLPT Game 5: Info Scanner Dataset Integrity (Phase 1)", () => {
  it("contains exactly 36 curated exam documents across all JLPT levels", () => {
    expect(INFO_SCANNER_DOCUMENTS).toHaveLength(36);
  });

  it("covers all 6 official document categories with 6 documents each", () => {
    const categories: InfoScannerCategory[] = [
      "flyer-store",
      "memo-notice",
      "public-guide",
      "schedule-transport",
      "business-email",
      "application-form",
    ];

    const categoryMap: Record<string, number> = {};
    for (const doc of INFO_SCANNER_DOCUMENTS) {
      categoryMap[doc.category] = (categoryMap[doc.category] ?? 0) + 1;
    }

    for (const cat of categories) {
      expect(categoryMap[cat]).toBe(6);
    }
  });

  it("covers all 5 JLPT levels from N5 to N1", () => {
    const levels = new Set(INFO_SCANNER_DOCUMENTS.map((d) => d.level));
    expect(levels.has("N5")).toBe(true);
    expect(levels.has("N4")).toBe(true);
    expect(levels.has("N3")).toBe(true);
    expect(levels.has("N2")).toBe(true);
    expect(levels.has("N1")).toBe(true);
  });

  it("includes the required authentic supermarket flyer and desk memo anchor cases", () => {
    const supermarket = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "flyer-n5-supermarket"
    );
    expect(supermarket).toBeDefined();
    expect(supermarket?.titleJa).toContain("サクラスーパー");
    expect(supermarket?.category).toBe("flyer-store");

    const deskMemo = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "memo-n5-desk-message"
    );
    expect(deskMemo).toBeDefined();
    expect(deskMemo?.titleJa).toContain("伝言メモ");
    expect(deskMemo?.category).toBe("memo-notice");
  });

  it("verifies every question has 4 options, valid correctIndex, and matching evidenceBlockIds", () => {
    for (const doc of INFO_SCANNER_DOCUMENTS) {
      const blockIds = new Set(doc.blocks.map((b) => b.id));

      expect(doc.blocks.length).toBeGreaterThan(0);
      expect(doc.questions.length).toBeGreaterThan(0);

      for (const q of doc.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThanOrEqual(3);
        expect(q.evidenceBlockIds.length).toBeGreaterThan(0);

        for (const eid of q.evidenceBlockIds) {
          expect(
            blockIds.has(eid),
            `Block ID "${eid}" referenced in question ${q.id} must exist in document ${doc.id}`
          ).toBe(true);
        }

        expect(q.clueQuoteJa.length).toBeGreaterThan(0);
      }
    }
  });
});
