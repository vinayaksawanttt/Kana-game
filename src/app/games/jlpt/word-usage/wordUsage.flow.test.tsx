import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import WordUsageSetupPage from "./page";
import WordUsagePlayPage from "./play/[sessionId]/page";
import WordUsageResultPage from "./result/[sessionId]/page";
import {
  WORD_USAGE_ITEMS,
  createWordUsageSession,
  summarizeWordUsageSession,
} from "@/engine/jlptWordUsage";
import { saveGameResult, saveGameSession } from "@/lib/game-core/storage";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("level=N4");

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "word-usage-test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentence: vi.fn(),
    stopAudio: vi.fn(),
    isPlaying: false,
    activeKey: null,
  }),
}));

describe("JLPT Word Usage Flow (Phase 8)", () => {
  const sessionId = "word-usage-test-session";

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams("level=N4");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders setup page, toggles level chips, and launches session", () => {
    render(<WordUsageSetupPage />);

    // Header & instruction check
    expect(screen.getByText("Word Usage Judge")).toBeTruthy();
    expect(
      screen.getByText(/1\. Select JLPT Levels \(N4–N1\)/i)
    ).toBeTruthy();

    // Toggle N3 chip
    const n3Button = screen.getByRole("button", { name: /N3/i });
    fireEvent.click(n3Button);

    // Toggle study mode
    const studyModeButton = screen.getByRole("button", {
      name: /Study Mode/i,
    });
    fireEvent.click(studyModeButton);

    // Select size 15 questions
    const size15Button = screen.getByRole("button", {
      name: /15\s*Questions/i,
    });
    fireEvent.click(size15Button);

    // Click Start Drill
    const startButton = screen.getByRole("button", {
      name: /Start Drill/i,
    });
    fireEvent.click(startButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/games\/jlpt\/word-usage\/play\/usage-/)
    );
  });

  it("plays through a word usage question, selects option, reveals explanation, and advances", async () => {
    // Seed session in storage with 2 questions
    const session = createWordUsageSession(
      WORD_USAGE_ITEMS,
      {
        levels: [4],
        size: 2,
        showEnglishTranslations: true,
      },
      () => 0.5,
      sessionId
    );
    saveGameSession("jlpt-usage", sessionId, session);

    render(<WordUsagePlayPage />);

    const currentQ = session.questions[0];
    // Target word & reading rendered
    expect(screen.getByText(currentQ.word)).toBeTruthy();
    expect(screen.getByText(new RegExp(currentQ.reading))).toBeTruthy();

    // 4 option choices rendered (buttons starting with 1, 2, 3, 4)
    const optionButtons = screen.getAllByRole("button", { name: /^[1-4]\s/ });
    expect(optionButtons.length).toBe(4);

    // Click Option 1
    fireEvent.click(optionButtons[0]);

    // Reveal appears: Feedback explanation badge and next question button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /次の問題へ \/ Next Question/i })).toBeTruthy();
    });
    expect(screen.getAllByText(/正しい用法|不自然な用法/).length).toBeGreaterThan(0);

    // Advance to next question
    const nextButton = screen.getByRole("button", {
      name: /次の問題へ \/ Next Question/i,
    });
    fireEvent.click(nextButton);

    // Next question displayed
    const secondQ = session.questions[1];
    expect(screen.getByText(secondQ.word)).toBeTruthy();
  });

  it("renders result page with score, level breakdown, and practice missed items action", () => {
    const session = createWordUsageSession(
      WORD_USAGE_ITEMS,
      {
        levels: [4],
        size: 2,
        showEnglishTranslations: false,
      },
      () => 0.5,
      sessionId
    );

    // Simulate 1 correct, 1 wrong answer
    const q0 = session.questions[0];
    const q1 = session.questions[1];
    const wrongIdx = ((q1.correctOptionIndex + 1) % 4) as 0 | 1 | 2 | 3;

    session.answers = [
      {
        questionId: q0.id,
        itemId: q0.itemId,
        chosenOptionIndex: q0.correctOptionIndex,
        chosenSentenceJa: q0.options[q0.correctOptionIndex].sentenceJa,
        chosenSentenceEn: q0.options[q0.correctOptionIndex].sentenceEn,
        correctOptionIndex: q0.correctOptionIndex,
        correctSentenceJa: q0.options[q0.correctOptionIndex].sentenceJa,
        correctSentenceEn: q0.options[q0.correctOptionIndex].sentenceEn,
        status: "correct",
        timeMs: 2500,
      },
      {
        questionId: q1.id,
        itemId: q1.itemId,
        chosenOptionIndex: wrongIdx,
        chosenSentenceJa: q1.options[wrongIdx].sentenceJa,
        chosenSentenceEn: q1.options[wrongIdx].sentenceEn,
        correctOptionIndex: q1.correctOptionIndex,
        correctSentenceJa: q1.options[q1.correctOptionIndex].sentenceJa,
        correctSentenceEn: q1.options[q1.correctOptionIndex].sentenceEn,
        status: "wrong",
        timeMs: 3200,
      },
    ];
    session.status = "finished";

    const summary = summarizeWordUsageSession(session);
    saveGameResult("jlpt-usage", summary);
    saveGameSession("jlpt-usage", sessionId, session);

    render(<WordUsageResultPage />);

    // Score & stats
    expect(screen.getAllByText(/50%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Performance by JLPT Level/i)).toBeTruthy();

    // Practice Missed button should show count of 1
    const practiceMissedButton = screen.getByRole("button", {
      name: /Practice Missed Word Usage \(1\)/i,
    });
    expect(practiceMissedButton).toBeTruthy();
    fireEvent.click(practiceMissedButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/games\/jlpt\/word-usage\/play\/usage-/)
    );
  });
});
