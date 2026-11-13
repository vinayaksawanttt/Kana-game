import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import GrammarLibraryPage from "@/app/grammar/page";
import GrammarDetailPage from "@/app/grammar/[level]/[slug]/page";
import GrammarSetupPage from "./page";
import GrammarPlayPage from "./play/[sessionId]/page";
import GrammarResultPage from "./result/[sessionId]/page";
import { createGrammarSession, type GrammarSessionResult } from "@/engine/grammarSession";
import { createSeededRng } from "@/engine/random";
import { saveGameResult, saveGameSession } from "@/lib/game-core/storage";
import { srsDb } from "@/lib/srs/db";
import { addGrammarToSrs, getAllSrsItems } from "@/lib/srs/service";

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

  it("renders the structured grammar lesson and saves grammar rule to FSRS", async () => {
    mockParams = { level: "N5", slug: "a-ga-ichiban" };
    render(<GrammarDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /A が いちばん/i })).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "FORMATION" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "EXAMPLE SENTENCES" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Nearby grammar patterns" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Listen to example 1" })).toBeTruthy();

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

  it("shows grammar units and marks existing FSRS entries as learned", async () => {
    await addGrammarToSrs({
      id: "N5/a-ga-ichiban",
      pattern: "A が いちばん～",
      meaning: "the most; the best",
      level: "N5",
    });

    render(<GrammarLibraryPage />);

    expect(await screen.findByText("Unit 01")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Added to review" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Listen to A が いちばん/ })).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
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
    expect(screen.getByRole("button", { name: "Listen to completed sentence" })).toBeTruthy();

    // Open Read Guide drawer
    fireEvent.click(screen.getByRole("button", { name: /Read Guide/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /Grammar Guide/i })).toBeTruthy();
    });
    expect((await screen.findAllByRole("button", { name: /Listen to/ })).length).toBeGreaterThan(0);
  });

  it("supports search, bookmarks, and status filtering on the Grammar Index", async () => {
    await addGrammarToSrs({
      id: "N5/a-ga-ichiban",
      pattern: "A が いちばん～",
      meaning: "the most; the best",
      level: "N5",
    });

    render(<GrammarLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("A が いちばん～")).toBeTruthy();
    });

    // Segmented progress legend shows In Review: 1
    expect(screen.getByText(/In Review:/i)).toBeTruthy();
    expect(screen.getByText(/Not Started:/i)).toBeTruthy();

    // Bookmark the pattern
    const bookmarkBtn = screen.getByRole("button", { name: /Bookmark A が いちばん～/i });
    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn.getAttribute("aria-pressed")).toBe("true");

    // Filter to Bookmarked -> still shows A が いちばん～
    fireEvent.click(screen.getByRole("button", { name: /Bookmarked \(1\)/i }));
    expect(screen.getByText("A が いちばん～")).toBeTruthy();

    // Filter to Unlearned -> hides A が いちばん～
    fireEvent.click(screen.getByRole("button", { name: /Unlearned/i }));
    expect(screen.queryByText("A が いちばん～")).toBeNull();

    // Reset back to All and search by romaji
    fireEvent.click(screen.getByRole("button", { name: /^All \(/i }));
    const searchInput = screen.getByRole("searchbox", { name: /Search grammar points/i });
    fireEvent.change(searchInput, { target: { value: "ichiban" } });
    expect(screen.getByText("A が いちばん～")).toBeTruthy();
  });

  it("toggles progressive example controls, breakdown chunks, and usage notes on Grammar Detail page", async () => {
    mockParams = { level: "N5", slug: "a-ga-ichiban" };
    render(<GrammarDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /A が いちばん/i })).toBeTruthy();
    });

    // Romaji is hidden by default until toggled on
    expect(screen.queryByText("Kono naka de, sushi ga ichiban suki desu.")).toBeNull();
    const romajiBtn = screen.getByRole("button", { name: /Romaji/i });
    fireEvent.click(romajiBtn);
    expect(screen.getByText("Kono naka de, sushi ga ichiban suki desu.")).toBeTruthy();

    // Toggle Translation off and back on
    const translationBtn = screen.getByRole("button", { name: /Translation/i });
    expect(screen.getByText("Of these, I like sushi the most.")).toBeTruthy();
    fireEvent.click(translationBtn);
    expect(screen.queryByText("Of these, I like sushi the most.")).toBeNull();
    fireEvent.click(translationBtn);
    expect(screen.getByText("Of these, I like sushi the most.")).toBeTruthy();

    // Expand Breakdown on first example
    const breakdownBtns = screen.getAllByRole("button", { name: /Breakdown/i });
    fireEvent.click(breakdownBtns[0]!);
    expect(screen.getByText("Literal:")).toBeTruthy();

    // Progressive Usage Notes headings are rendered
    expect(screen.getByText("Grammatical Nuance & Formality")).toBeTruthy();
    expect(screen.getByText("Common Mistakes & Pitfalls")).toBeTruthy();
  });

  it("supports multi-select JLPT levels, mix selection, and estimated duration on Grammar Setup", async () => {
    render(<GrammarSetupPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Grammar practice setup/i })).toBeTruthy();
    });

    // Multi-select N4 alongside default N5
    const n4Btn = screen.getByRole("button", { name: /N4/i });
    fireEvent.click(n4Btn);
    expect(n4Btn.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("2 of 5 selected")).toBeTruthy();
    expect(screen.getByText("N5, N4")).toBeTruthy();

    // Choose Cloze Only and Set Size 20
    const clozeOnlyBtn = screen.getByRole("button", { name: /Cloze Only/i });
    fireEvent.click(clozeOnlyBtn);
    expect(clozeOnlyBtn.getAttribute("aria-pressed")).toBe("true");

    const size20Btn = screen.getByRole("button", { name: /^20\s*~/ });
    fireEvent.click(size20Btn);
    expect(size20Btn.getAttribute("aria-pressed")).toBe("true");

    // Sticky summary displays breakdown & estimated time (~5 min for 20 cloze * 15s = 300s)
    expect(screen.getByText("20 Cloze · 0 Scramble")).toBeTruthy();
    expect(screen.getAllByText("~5 min").length).toBeGreaterThan(0);
  });

  it("supports Cloze keyboard selection, flag-for-review toggle, and wrong-answer explanation", async () => {
    const session = await createGrammarSession(
      {
        levels: ["N5"],
        size: 1,
        clozeRatio: 1,
        sessionId: "grammar-cloze-1",
      },
      createSeededRng("cloze-ui-test")
    );
    saveGameSession("grammar", session.sessionId, session);
    mockParams = { sessionId: "grammar-cloze-1" };

    render(<GrammarPlayPage />);

    await waitFor(() => {
      expect(screen.getByText("Sentence Cloze")).toBeTruthy();
    });

    const q = session.questions[0]!;
    expect(q.type).toBe("cloze");
    if (q.type !== "cloze") return;

    // Flag for review persists to localStorage
    const flagBtn = screen.getByRole("button", { name: "Flag for review" });
    fireEvent.click(flagBtn);
    expect(flagBtn.getAttribute("aria-pressed")).toBe("true");
    expect(window.localStorage.getItem("grammar-bookmarked-ids")).toContain(q.grammarId);

    // Press number key corresponding to a wrong option
    const wrongIdx = q.options.findIndex((opt) => opt !== q.correctAnswer);
    expect(wrongIdx).toBeGreaterThanOrEqual(0);
    fireEvent.keyDown(window, { key: String(wrongIdx + 1) });

    await waitFor(() => {
      expect(screen.getByText(/✕ Not quite/i)).toBeTruthy();
    });

    // Diagnostic wrong-answer comparison and explanation are visible
    expect(screen.getByText("Your Answer")).toBeTruthy();
    expect(screen.getByText("Correct Answer")).toBeTruthy();
    expect(screen.getByText(/Why this is the answer:/i)).toBeTruthy();
  });

  it("displays Answered Accuracy, Weak Grammar Patterns, and clickable links on Grammar Results", async () => {
    const mockResult: GrammarSessionResult = {
      sessionId: "grammar-result-1",
      settings: { levels: ["N5"], size: 10, clozeRatio: 0.5 },
      startedAt: 1_000,
      endedAt: 61_000,
      endedEarly: true,
      questions: [
        {
          id: "q1",
          type: "cloze",
          grammarId: "N5/a-ga-ichiban",
          grammarSlug: "a-ga-ichiban",
          grammarTitle: "A ga ichiban",
          grammarPattern: "A が いちばん～",
          shortExplanation: "the most; the best",
          level: "N5",
          sentenceJp: "すしがいちばんすきです。",
          romaji: "Sushi ga ichiban suki desu.",
          en: "I like sushi the most.",
          correctAnswer: "いちばん",
          status: "correct",
          chosenAnswer: "いちばん",
          timeMs: 3000,
        },
        {
          id: "q2",
          type: "cloze",
          grammarId: "N5/baai-wa",
          grammarSlug: "baai-wa",
          grammarTitle: "Baai wa",
          grammarPattern: "場合は",
          shortExplanation: "in the case of; when",
          level: "N5",
          sentenceJp: "あめのばあいはいきません。",
          romaji: "Ame no baai wa ikimasen.",
          en: "In case of rain, I won't go.",
          correctAnswer: "ばあいは",
          status: "wrong",
          chosenAnswer: "から",
          timeMs: 4000,
        },
        {
          id: "q3",
          type: "scramble",
          grammarId: "N5/bakari",
          grammarSlug: "bakari",
          grammarTitle: "Bakari",
          grammarPattern: "ばかり",
          shortExplanation: "only; nothing but",
          level: "N5",
          sentenceJp: "ゲームばかりしています。",
          romaji: "Geemu bakari shite imasu.",
          en: "I only play games.",
          correctAnswer: "ゲームばかりしています。",
          status: "unanswered",
          timeMs: 0,
        },
      ],
    };

    saveGameResult("grammar", mockResult, window.localStorage);
    mockParams = { sessionId: "grammar-result-1" };

    render(<GrammarResultPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Grammar practice results/i })).toBeTruthy();
    });

    // Overall completion = 1/3 (33%), Answered Accuracy = 1/2 (50%)
    expect(screen.getByText("33%")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByText("1 of 2 answered")).toBeTruthy();

    // Weak Grammar Patterns section & Review Lesson links
    expect(screen.getByRole("heading", { name: /Weak Grammar Patterns \(2\)/i })).toBeTruthy();
    const reviewLinks = screen.getAllByRole("link", { name: /Review Lesson/i });
    expect(reviewLinks[0]?.getAttribute("href")).toBe("/grammar/N5/baai-wa");

    // Clickable pattern link in results table
    const ichibanLink = screen.getByRole("link", { name: "A が いちばん～" });
    expect(ichibanLink.getAttribute("href")).toBe("/grammar/N5/a-ga-ichiban");
  });
});
