import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import GrammarDetailPage from "@/app/grammar/[level]/[slug]/page";
import GrammarPlayPage from "./play/[sessionId]/page";
import { createGrammarSession } from "@/engine/grammarSession";
import { createSeededRng } from "@/engine/random";
import { saveGameSession } from "@/lib/game-core/storage";
import { srsDb } from "@/lib/srs/db";
import { getAllSrsItems } from "@/lib/srs/service";

let mockParams: Record<string, string> = {
  level: "N5",
  slug: "a-ga-ichiban",
  sessionId: "grammar-play-1",
};
const pushMock = vi.fn();
const replaceMock = vi.fn();
const routerMock = {
  push: pushMock,
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => routerMock,
}));

describe("Grammar Reference Detail & Play UI", () => {
  beforeEach(async () => {
    await srsDb.items.clear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders MDX grammar reference and saves grammar rule via floating Add to FSRS Review button", async () => {
    mockParams = { level: "N5", slug: "a-ga-ichiban" };
    render(<GrammarDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /A が いちばん/i })).toBeTruthy();
    });

    const addBtn = screen.getByRole("button", { name: /Add to FSRS Review/i });
    fireEvent.click(addBtn);

    await waitFor(async () => {
      expect(screen.getByRole("button", { name: /Added to FSRS Review/i })).toBeTruthy();
      const allSrs = await getAllSrsItems();
      expect(allSrs.some((item) => item.type === "grammar" && item.id === "grammar:N5/a-ga-ichiban")).toBe(
        true
      );
    });
  });

  it("plays a Scramble question by moving chunks to dropzone and opens the MDX Read Guide drawer", async () => {
    const session = await createGrammarSession(
      {
        levels: ["N5"],
        size: 1,
        clozeRatio: 0,
        sessionId: "grammar-play-1",
      },
      createSeededRng("scramble-ui-test")
    );
    saveGameSession("grammar", session.sessionId, session);
    mockParams = { sessionId: "grammar-play-1" };

    render(<GrammarPlayPage />);

    await waitFor(() => {
      expect(screen.getByTestId("scramble-dropzone")).toBeTruthy();
    });

    const q = session.questions[0]!;
    expect(q.type).toBe("scramble");
    if (q.type !== "scramble") return;

    // Click each chunk in correct order from the pool
    const pool = screen.getByTestId("scramble-pool");
    const usedPoolButtons = new Set<HTMLButtonElement>();
    for (const targetChunk of q.correctChunks) {
      const buttons = Array.from(pool.querySelectorAll("button")) as HTMLButtonElement[];
      const match = buttons.find(
        (btn) => btn.textContent === targetChunk && !btn.disabled && !usedPoolButtons.has(btn)
      );
      expect(match).toBeDefined();
      usedPoolButtons.add(match!);
      fireEvent.click(match!);
    }

    fireEvent.click(screen.getByRole("button", { name: /Check Order/i }));

    await waitFor(() => {
      expect(screen.getByText(/✓ Correct!/i)).toBeTruthy();
    });

    // Open Read Guide drawer
    fireEvent.click(screen.getByRole("button", { name: /Read Guide/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Grammar Guide/i })).toBeTruthy();
    });
  });
});
