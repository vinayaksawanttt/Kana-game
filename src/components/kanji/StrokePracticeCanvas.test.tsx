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

  it("renders the practice workspace with canvas and action toolbar including Undo", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    expect(screen.getByRole("region", { name: "Stroke Practice Workspace" })).toBeTruthy();
    expect(screen.getByLabelText("Drawing canvas for 一")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play \/ Pause Demo/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });

  it("starts demo on the first click and removes the Undo button while demo is active", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    const canvas = screen.getByLabelText("Drawing canvas for 一");
    const demoButton = screen.getByRole("button", { name: /Play \/ Pause Demo/i });

    // Initial practice state: Undo is present
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();

    // First click to start demo
    fireEvent.click(demoButton);

    // Canvas stays in place (same UI)
    expect(screen.getByLabelText("Drawing canvas for 一")).toBe(canvas);
    expect(screen.queryByTestId("stroke-player")).toBeNull();

    // Starts active demo state on first click — does NOT jump to completed
    expect(screen.getByText(/Demo Playback/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Pause Demo/i })).toBeTruthy();
    expect(screen.queryByText("Complete")).toBeNull();

    // Undo button is removed during demo playback
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();

    // Clicking Pause Demo pauses it
    fireEvent.click(screen.getByRole("button", { name: /Pause Demo/i }));
    expect(screen.getByRole("button", { name: /Resume Demo/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("resets demo and restores Undo button when switching mode or clicking Reset", () => {
    render(<StrokePracticeCanvas kanji="一" strokeData={mockStrokeData} />);

    const demoButton = screen.getByRole("button", { name: /Play \/ Pause Demo/i });
    fireEvent.click(demoButton);
    expect(screen.getByText(/Demo Playback/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();

    // Switch mode to Recall
    const recallButton = screen.getByRole("button", { name: "Recall" });
    fireEvent.click(recallButton);

    expect(screen.queryByText(/Demo Playback/i)).toBeNull();
    expect(screen.getByText(/Progress/i)).toBeTruthy();

    // Undo button is restored in Recall mode
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();

    // Start demo again and test Reset
    fireEvent.click(screen.getByRole("button", { name: /Play \/ Pause Demo/i }));
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText(/Demo Playback/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
  });
});
