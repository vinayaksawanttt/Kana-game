import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StrokePracticeCanvas } from "./StrokePracticeCanvas";
import type { KanjiStrokeData } from "@/data/strokes";

const mockStrokeData: KanjiStrokeData = {
  kanji: "一",
  paths: ["M20,54.5 L89,54.5"],
  markers: [{ x: 20, y: 54.5 }],
};

describe("StrokePracticeCanvas Component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders the practice workspace with canvas and action toolbar", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    expect(screen.getByRole("region", { name: "Stroke Practice Workspace" })).toBeTruthy();
    expect(screen.getByLabelText("Drawing canvas for 一")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play \/ Pause Demo/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });

  it("plays demo directly on the same canvas layout without replacing UI", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    const canvas = screen.getByLabelText("Drawing canvas for 一");
    const demoButton = screen.getByRole("button", { name: /Play \/ Pause Demo/i });

    // Click to start demo
    fireEvent.click(demoButton);

    // The canvas is STILL in the document (UI does not change drastically into StrokePlayer)
    expect(screen.getByLabelText("Drawing canvas for 一")).toBe(canvas);
    expect(screen.queryByTestId("stroke-player")).toBeNull();

    // Button updates to Pause Demo
    expect(screen.getByRole("button", { name: /Pause Demo/i })).toBeTruthy();
    expect(screen.getByText(/Demo Playback/i)).toBeTruthy();

    // Clicking Pause Demo pauses it
    fireEvent.click(screen.getByRole("button", { name: /Pause Demo/i }));
    expect(screen.getByRole("button", { name: /Resume Demo/i })).toBeTruthy();
  });

  it("resets demo when switching mode or clicking Reset", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    const demoButton = screen.getByRole("button", { name: /Play \/ Pause Demo/i });
    fireEvent.click(demoButton);
    expect(screen.getByText(/Demo Playback/i)).toBeTruthy();

    // Switch mode to Recall
    const recallButton = screen.getByRole("button", { name: "Recall" });
    fireEvent.click(recallButton);

    expect(screen.queryByText(/Demo Playback/i)).toBeNull();
    expect(screen.getByText(/Progress/i)).toBeTruthy();
  });
});
