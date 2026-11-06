import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    const brandLink = await screen.findByRole("link", { name: /shiritori home/i });
    expect(brandLink.getAttribute("href")).toBe("/games/shiritori");
    await screen.findByRole("heading", { name: "しりとり" });
  });

  it("shows quit confirmation dialog on browser back and navigates to /games/shiritori on confirm", async () => {
    render(<ShiritoriPlayPage />);
    await screen.findByRole("heading", { name: "しりとり" });

    // Trigger browser back
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    const dialog = await screen.findByRole("dialog", { name: /quit this game/i });
    expect(dialog).toBeTruthy();

    // Clicking "Stay" closes dialog
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    // Trigger browser back again and confirm
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

    expect(sessionStorage.getItem(`shiritori-session:${sessionId}`)).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/games/shiritori");
  });

  it("clicking the navbar Shiritori tag during an active game prompts quit dialog", async () => {
    render(<ShiritoriPlayPage />);
    await screen.findByRole("heading", { name: "しりとり" });

    const brandLink = screen.getByRole("link", { name: /shiritori home/i });
    fireEvent.click(brandLink);

    expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Quit game" }));

    expect(mockReplace).toHaveBeenCalledWith("/games/shiritori");
  });

  it("setup page navbar link also points to /games/shiritori", () => {
    render(<ShiritoriSetupPage />);
    const brandLink = screen.getByRole("link", { name: /shiritori home/i });
    expect(brandLink.getAttribute("href")).toBe("/games/shiritori");
  });
});

