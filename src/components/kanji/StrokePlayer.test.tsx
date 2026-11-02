import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StrokePlayer } from "@/components/kanji/StrokePlayer";
import { clearStrokesCache, getKanjiStrokeData } from "@/data/strokes";
import { calculateStrokeTimings } from "@/hooks/useStrokeAnimation";

describe("Kanji Stroke Order Pipeline & Player", () => {
  it("loads extracted KanjiVG stroke paths and numbered markers from static chunks", async () => {
    clearStrokesCache();
    const nichi = await getKanjiStrokeData("日", "N5");
    expect(nichi).not.toBeNull();
    expect(nichi?.kanji).toBe("日");
    expect(nichi?.paths.length).toBe(4);
    expect(nichi?.markers.length).toBe(4);
    for (const marker of nichi?.markers ?? []) {
      expect(typeof marker.x).toBe("number");
      expect(typeof marker.y).toBe("number");
    }
  });

  it("calculates sequential stroke timings where stroke N+1 starts right as stroke N completes", () => {
    const timings1x = calculateStrokeTimings([80, 120, 60], 1);
    expect(timings1x).toHaveLength(3);
    expect(timings1x[0].delayMs).toBe(0);
    expect(timings1x[1].delayMs).toBe(timings1x[0].delayMs + timings1x[0].durationMs);
    expect(timings1x[2].delayMs).toBe(timings1x[1].delayMs + timings1x[1].durationMs);

    const timings2x = calculateStrokeTimings([80, 120, 60], 2);
    expect(timings2x[0].durationMs).toBe(Math.round(timings1x[0].durationMs / 2));
    expect(timings2x[1].delayMs).toBe(timings2x[0].durationMs);
  });

  it("renders KanjiVG 109x109 quadrant grid, paths, numbered markers, and playback controls", async () => {
    const sampleStrokeData = await getKanjiStrokeData("日", 5);
    render(<StrokePlayer kanji="日" strokeData={sampleStrokeData} />);

    const svg = screen.getByRole("img", {
      name: /Stroke order diagram for 日 \(4 strokes\)/i,
    });
    expect(svg.getAttribute("viewBox")).toBe("0 0 109 109");

    // 4 background guide paths + 4 animated foreground paths + 4 numbered markers
    expect(screen.getByTestId("stroke-guide-path-0")).toBeTruthy();
    expect(screen.getByTestId("stroke-guide-path-3")).toBeTruthy();
    const firstFgPath = screen.getByTestId("stroke-fg-path-0");
    const secondFgPath = screen.getByTestId("stroke-fg-path-1");
    expect(firstFgPath).toBeTruthy();
    expect(secondFgPath).toBeTruthy();

    expect(screen.getByTestId("stroke-marker-0").textContent).toBe("1");
    expect(screen.getByTestId("stroke-marker-3").textContent).toBe("4");

    // Initially undrawn (dashOffset equals path length)
    expect(firstFgPath.style.strokeDashoffset).not.toBe("0");

    // Click Play
    const playButton = screen.getByRole("button", { name: /Play stroke animation/i });
    fireEvent.click(playButton);

    // Foreground paths transition to dashoffset 0 sequentially
    expect(firstFgPath.style.strokeDashoffset).toBe("0");
    expect(firstFgPath.style.transitionDelay).toBe("0ms");
    expect(secondFgPath.style.transitionDelay).not.toBe("0ms");

    // Toggle speed to 2x
    const speed2xButton = screen.getByRole("button", { name: "2x" });
    fireEvent.click(speed2xButton);
    expect(speed2xButton.getAttribute("aria-pressed")).toBe("true");

    // Click Reset
    const resetButton = screen.getByRole("button", { name: /Reset stroke animation/i });
    fireEvent.click(resetButton);
    expect(firstFgPath.style.strokeDashoffset).not.toBe("0");
  });
});
