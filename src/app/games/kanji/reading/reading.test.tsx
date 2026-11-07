import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { clearKanjiVocabCache, getKanjiComposites } from "@/data/kanjiVocab";
import { getStrokeGeometry, validateDrawnStroke } from "@/engine/strokePractice";
import KanjiReadingHubPage from "./page";

describe("Kanji Reading Hub, Composite Data & Stroke Practice Engine", () => {
  afterEach(() => {
    cleanup();
  });
  it("loads composite vocabulary words for a kanji from static kanji-vocab chunks", async () => {
    clearKanjiVocabCache();
    const composites = await getKanjiComposites("学", "N5");
    expect(composites.length).toBeGreaterThan(0);
    expect(composites.some((c) => c.word.includes("学"))).toBe(true);
    for (const item of composites) {
      expect(typeof item.word).toBe("string");
      expect(typeof item.reading).toBe("string");
      expect(typeof item.meaning).toBe("string");
      expect(typeof item.jlpt).toBe("number");
    }
  });

  it("validates user drawn strokes against KanjiVG SVG path geometry", () => {
    const samplePath = "M15.25,54.5c25,0,50,0,78.5,0"; // Horizontal stroke across center
    const geometry = getStrokeGeometry(samplePath);
    expect(geometry.start.x).toBeCloseTo(15.25, 1);
    expect(geometry.end.x).toBeCloseTo(93.75, 1);

    // Valid gesture tracing roughly along the horizontal line
    const goodResult = validateDrawnStroke(
      [
        { x: 16, y: 53 },
        { x: 45, y: 55 },
        { x: 75, y: 54 },
        { x: 92, y: 55 },
      ],
      samplePath
    );
    expect(goodResult.valid).toBe(true);

    // Invalid gesture far away in top-right corner
    const farResult = validateDrawnStroke(
      [
        { x: 95, y: 5 },
        { x: 102, y: 8 },
      ],
      samplePath,
      15
    );
    expect(farResult.valid).toBe(false);
  });

  it("renders Kanji Reading Hub grouped by Grade and opens the KanjiBreakdownModal on tile click", async () => {
    render(<KanjiReadingHubPage />);

    // Wait for Grade 1 section in N5
    const grade1Section = await screen.findByRole("region", { name: "Grade 1" });
    expect(grade1Section).toBeTruthy();

    // Click on kanji tile 一
    const ichiTile = await screen.findByRole("button", { name: /^一,/ });
    fireEvent.click(ichiTile);

    // Modal should appear with readings, metadata, and Practice Drawing / Full Details actions
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("link", { name: /Practice Drawing/i }).getAttribute("href")).toBe(
      `/games/kanji/playground/${encodeURIComponent("一")}`
    );
    expect(screen.getByRole("button", { name: /Full Details/i })).toBeTruthy();
  });

  it("toggles between Kanji Sheet and Radical Builder modes with multi-radical combination", async () => {
    render(<KanjiReadingHubPage />);

    // Toggle from Kanji Sheet to Radical Builder
    const radicalTab = screen.getByRole("tab", { name: /radical builder/i });
    expect(radicalTab).toBeTruthy();
    fireEvent.click(radicalTab);

    // Verify Radical Builder view rendered
    expect(await screen.findByRole("heading", { name: /radical combination formula/i })).toBeTruthy();
    expect(await screen.findByRole("region", { name: /radical components chart/i })).toBeTruthy();

    // Verify picturistic names are present in radical buttons
    const mouthRadical = await screen.findByRole("button", { name: /mouth, opening/i });
    expect(mouthRadical).toBeTruthy();

    // Click radical 口 to add to combination
    fireEvent.click(mouthRadical);

    // Verify matching kanji section displays results
    const matchingSection = await screen.findByRole("region", { name: /matching kanji compounds/i });
    expect(matchingSection).toBeTruthy();
  });
});

