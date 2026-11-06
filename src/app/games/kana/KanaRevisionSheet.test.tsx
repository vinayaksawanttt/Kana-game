import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanaRevisionSheet } from "./KanaRevisionSheet";

const mockPlayKana = vi.fn();
const mockPlayKanaAsync = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10)));
const mockPlayKanaSequence = vi.fn();
const mockStopAudio = vi.fn();
const mockSetPlaybackSpeed = vi.fn();
let mockIsPlaying = false;
let mockActiveKey: string | null = null;
let mockPlaybackSpeed = 1;

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playKana: mockPlayKana,
    playKanaAsync: mockPlayKanaAsync,
    playKanaSequence: mockPlayKanaSequence,
    stopAudio: mockStopAudio,
    isPlaying: mockIsPlaying,
    activeKey: mockActiveKey,
    playbackSpeed: mockPlaybackSpeed,
    setPlaybackSpeed: mockSetPlaybackSpeed,
    toKanaAudioKey: (char: string, romaji?: string) => {
      if (char === "あ" || char === "ア") return "a";
      if (char === "か" || char === "カ") return "ka";
      return romaji || "a";
    },
  }),
}));

describe("KanaRevisionSheet Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPlaying = false;
    mockActiveKey = null;
    mockPlaybackSpeed = 1;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 5-column vowel headers (A, I, U, E, O) and 5 cards per row", () => {
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    // Check Vowel headers
    const vowelHeaderA = screen.getAllByText("A");
    expect(vowelHeaderA.length).toBeGreaterThanOrEqual(1);

    const vowelHeaderI = screen.getAllByText("I");
    expect(vowelHeaderI.length).toBeGreaterThanOrEqual(1);

    const vowelHeaderU = screen.getAllByText("U");
    expect(vowelHeaderU.length).toBeGreaterThanOrEqual(1);

    const vowelHeaderE = screen.getAllByText("E");
    expect(vowelHeaderE.length).toBeGreaterThanOrEqual(1);

    const vowelHeaderO = screen.getAllByText("O");
    expect(vowelHeaderO.length).toBeGreaterThanOrEqual(1);

    // Basic section contains Japanese vowel indicators
    expect(screen.getByRole("region", { name: "Basic" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Dakuten & Handakuten" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Yōon" })).toBeTruthy();
  });

  it("renders empty placeholders for missing Gojūon positions (Ya, Wa, N rows)", () => {
    const { container } = render(<KanaRevisionSheet onClose={vi.fn()} />);

    // Empty placeholder slots should have aria-hidden="true" and contain dashes
    const placeholders = container.querySelectorAll('[aria-hidden="true"]');
    const emptyDashes = Array.from(placeholders).filter((el) => el.textContent === "—");
    // ya (2 empty) + wa (3 empty) + n (4 empty) = 9 empty slots
    expect(emptyDashes.length).toBe(9);
  });

  it("plays pronunciation on individual tile tap", async () => {
    const user = userEvent.setup();
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    const aTile = screen.getByRole("button", { name: "Play pronunciation for あ" });
    await user.click(aTile);

    expect(mockPlayKana).toHaveBeenCalledWith("あ", "a");
  });

  it("toggles Romaji on and off seamlessly", async () => {
    const user = userEvent.setup();
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    expect(screen.queryByText("ka")).toBeNull();

    await user.click(screen.getByRole("switch", { name: "Romaji" }));
    expect(screen.getByText("ka")).toBeTruthy();

    await user.click(screen.getByRole("switch", { name: "Romaji" }));
    expect(screen.queryByText("ka")).toBeNull();
  });

  it("switches to Katakana and exposes Extended Katakana section", async () => {
    const user = userEvent.setup();
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    expect(screen.queryByRole("region", { name: "Extended Katakana" })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "katakana" }));
    expect(screen.getByRole("region", { name: "Extended Katakana" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play pronunciation for ア" })).toBeTruthy();
  });

  it("highlights the currently active playing tile", () => {
    mockIsPlaying = true;
    mockActiveKey = "a";

    render(<KanaRevisionSheet onClose={vi.fn()} />);

    const aTile = screen.getByRole("button", { name: "Play pronunciation for あ" });
    expect(aTile.className).toContain("ring-[var(--primary)]");
  });

  it("does not render duplicate Stop button in top header when audio plays", () => {
    mockIsPlaying = true;
    mockActiveKey = "a";

    render(<KanaRevisionSheet onClose={vi.fn()} />);

    // The top bar should NOT have a Stop button
    const stopButtons = screen.queryAllByRole("button", { name: /Stop/i });
    expect(stopButtons.length).toBe(0);
  });

  it("renders speed toggle buttons (1x, 1.5x, 2x) and updates playback speed", async () => {
    const user = userEvent.setup();
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    const speedGroup = screen.getByRole("group", { name: "Playback speed" });
    expect(speedGroup).toBeTruthy();

    const speed15Btn = screen.getByRole("button", { name: "1.5x" });
    await user.click(speed15Btn);
    expect(mockSetPlaybackSpeed).toHaveBeenCalledWith(1.5);

    const speed20Btn = screen.getByRole("button", { name: "2x" });
    await user.click(speed20Btn);
    expect(mockSetPlaybackSpeed).toHaveBeenCalledWith(2);
  });

  it("starts Listen All, presents rock-solid Pause and Stop buttons, and allows pausing/resuming", async () => {
    const user = userEvent.setup();
    render(<KanaRevisionSheet onClose={vi.fn()} />);

    const listenAllBtn = screen.getAllByRole("button", { name: /Listen All/i })[0];
    await user.click(listenAllBtn);

    // After clicking, Pause and Stop buttons appear and stay solid
    const pauseBtn = screen.getByRole("button", { name: "Pause playback" });
    const stopBtn = screen.getByRole("button", { name: "Stop playback" });
    expect(pauseBtn).toBeTruthy();
    expect(stopBtn).toBeTruthy();

    // Click Pause
    await user.click(pauseBtn);
    expect(mockStopAudio).toHaveBeenCalled();
    const resumeBtn = screen.getByRole("button", { name: "Resume playback" });
    expect(resumeBtn).toBeTruthy();

    // Click Resume
    await user.click(resumeBtn);
    expect(screen.getByRole("button", { name: "Pause playback" })).toBeTruthy();

    // Click Stop
    await user.click(screen.getByRole("button", { name: "Stop playback" }));
    expect(screen.queryByRole("button", { name: "Pause playback" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Listen All/i })[0]).toBeTruthy();
  });
});
