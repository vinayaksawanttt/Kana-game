import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShiritoriPlayPage from "./play/[sessionId]/page";
import ShiritoriSetupPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "shiritori-test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe("Shiritori Session Navigation & Quit Guard", () => {
  const sessionId = "shiritori-test-session";

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem(
      `shiritori-session:${sessionId}`,
      JSON.stringify({
        sessionId,
        settings: {
          mode: "survival",
          difficulty: "yasashii",
          turnSeconds: 0,
          allowUnverified: false,
        },
      })
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("navbar Shiritori brand link targets /games/shiritori", async () => {
    render(<ShiritoriPlayPage />);
    const brandLink = await screen.findByRole("link", { name: /shiritori home/i }, { timeout: 8000 });
    expect(brandLink.getAttribute("href")).toBe("/games/shiritori");
    await screen.findByRole("heading", { name: "しりとり" }, { timeout: 8000 });
  });

  it("shows quit confirmation dialog on browser back and navigates to /games/shiritori on confirm", async () => {
    render(<ShiritoriPlayPage />);
    await screen.findByRole("heading", { name: "しりとり" }, { timeout: 8000 });

    // Trigger browser back
    await waitFor(() => {
      act(() => window.dispatchEvent(new PopStateEvent("popstate")));
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    });

    // Clicking "Stay" closes dialog
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    // Trigger browser back again and confirm
    await waitFor(() => {
      act(() => window.dispatchEvent(new PopStateEvent("popstate")));
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

    expect(sessionStorage.getItem(`shiritori-session:${sessionId}`)).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/games/shiritori");
  });

  it("clicking the navbar Shiritori tag during an active game prompts quit dialog", async () => {
    render(<ShiritoriPlayPage />);
    await screen.findByRole("heading", { name: "しりとり" }, { timeout: 8000 });

    const brandLink = screen.getByRole("link", { name: /shiritori home/i });
    fireEvent.click(brandLink);

    expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

    expect(mockReplace).toHaveBeenCalledWith("/games/shiritori");
  });

  it("setup page navbar link points to root page /", () => {
    render(<ShiritoriSetupPage />);
    const brandLink = screen.getByRole("link", { name: /shiritori home/i });
    expect(brandLink.getAttribute("href")).toBe("/");
  });

  it("setup page has pronunciation sound toggle pill group", () => {
    render(<ShiritoriSetupPage />);
    const soundOnBtn = screen.getByRole("button", { name: /sound on/i });
    const soundOffBtn = screen.getByRole("button", { name: /sound off/i });

    expect(soundOnBtn.getAttribute("aria-pressed")).toBe("true");
    expect(soundOffBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(soundOffBtn);
    expect(soundOnBtn.getAttribute("aria-pressed")).toBe("false");
    expect(soundOffBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("play page renders mute/unmute audio toggle button and audio buttons for words", async () => {
    render(<ShiritoriPlayPage />);
    await screen.findByRole("heading", { name: "しりとり" }, { timeout: 8000 });

    // Top bar speaker toggle
    const muteToggle = screen.getByRole("button", { name: /mute pronunciation/i });
    expect(muteToggle).toBeTruthy();
    expect(muteToggle.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(muteToggle);
    expect(screen.getByRole("button", { name: /enable pronunciation/i })).toBeTruthy();

    // Spotlight and chain audio buttons
    const audioButtons = screen.getAllByRole("button", { name: /pronounce しりとり/i });
    expect(audioButtons.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Shiritori Recent Words Memory Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("maintains recent bot words and ring buffer cap", async () => {
    const { addRecentBotWord, getRecentBotWords, clearRecentShiritoriMemory, MAX_RECENT_BOT_WORDS } = await import(
      "@/data/shiritori"
    );

    clearRecentShiritoriMemory();
    expect(getRecentBotWords()).toEqual([]);

    addRecentBotWord("word-1");
    addRecentBotWord("word-2");
    addRecentBotWord("word-1"); // Re-adding moves to end / dedupes
    expect(getRecentBotWords()).toEqual(["word-2", "word-1"]);

    // Ring buffer overflow test
    for (let i = 0; i < MAX_RECENT_BOT_WORDS + 20; i++) {
      addRecentBotWord(`overflow-${i}`);
    }
    const recent = getRecentBotWords();
    expect(recent.length).toBe(MAX_RECENT_BOT_WORDS);
    expect(recent.includes("overflow-0")).toBe(false);
    expect(recent.includes(`overflow-${MAX_RECENT_BOT_WORDS + 19}`)).toBe(true);
  });

  it("maintains recent hints and ring buffer cap", async () => {
    const { addRecentHint, getRecentHints, clearRecentShiritoriMemory, MAX_RECENT_HINTS } = await import(
      "@/data/shiritori"
    );

    clearRecentShiritoriMemory();
    expect(getRecentHints()).toEqual([]);

    addRecentHint("hint-a");
    addRecentHint("hint-b");
    expect(getRecentHints()).toEqual(["hint-a", "hint-b"]);

    for (let i = 0; i < MAX_RECENT_HINTS + 10; i++) {
      addRecentHint(`hint-${i}`);
    }
    const recent = getRecentHints();
    expect(recent.length).toBe(MAX_RECENT_HINTS);
    expect(recent.includes("hint-a")).toBe(false);
    expect(recent.includes(`hint-${MAX_RECENT_HINTS + 9}`)).toBe(true);
  });
});

