import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ListeningSetupPage from "./page";
import ListeningPlayPage from "./play/[sessionId]/page";
import ListeningResultPage from "./result/[sessionId]/page";
import { createListeningSession, summarizeListeningSession } from "@/engine/listening";
import { saveGameResult, saveGameSession } from "@/lib/game-core/storage";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "listening-test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe("Listening Quiz UI (Setup, Play & Result)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders setup page with 3 listening modes, answer style selector, and session length options", () => {
    render(<ListeningSetupPage />);

    expect(screen.getByRole("heading", { name: /listening quiz setup/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /kana ear training/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /vocabulary listening/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sentence comprehension/i })).toBeTruthy();

    // Switch to Vocabulary Listening -> shows JLPT level chips
    fireEvent.click(screen.getByRole("button", { name: /vocabulary listening/i }));
    expect(screen.getByRole("button", { name: /N5/i })).toBeTruthy();

    // Answer style toggle
    const typingBtn = screen.getByRole("button", { name: /type answer/i });
    fireEvent.click(typingBtn);
    expect(typingBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("hides Japanese text until answered on Play screen and reveals transcript after answering", () => {
    const session = createListeningSession(
      {
        vocabulary: [
          {
            id: "v-1",
            word: "学校",
            reading: "がっこう",
            romaji: "gakkou",
            meanings: ["school"],
            modernMeaning: "school",
            level: "N5",
            pos: ["noun"],
            examples: [],
          },
          {
            id: "v-2",
            word: "先生",
            reading: "せんせい",
            romaji: "sensei",
            meanings: ["teacher"],
            modernMeaning: "teacher",
            level: "N5",
            pos: ["noun"],
            examples: [],
          },
          {
            id: "v-3",
            word: "水",
            reading: "みず",
            romaji: "mizu",
            meanings: ["water"],
            modernMeaning: "water",
            level: "N5",
            pos: ["noun"],
            examples: [],
          },
          {
            id: "v-4",
            word: "電車",
            reading: "でんしゃ",
            romaji: "densha",
            meanings: ["train"],
            modernMeaning: "train",
            level: "N5",
            pos: ["noun"],
            examples: [],
          },
        ],
      },
      {
        subMode: "vocabulary",
        answerFormat: "multiple-choice",
        levels: [5],
        size: 10,
      },
      () => 0.1,
      "listening-test-session"
    );

    saveGameSession("listening", "listening-test-session", session);
    render(<ListeningPlayPage />);

    const currentQ = session.questions[0];

    // Before answering: hiddenPromptJa is NOT visible, Replay & 0.75x Slow buttons ARE visible
    expect(screen.queryByText(currentQ.hiddenPromptJa)).toBeNull();
    expect(screen.getByRole("button", { name: /replay audio/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /0.75x slow/i })).toBeTruthy();

    // Select the correct option
    fireEvent.click(screen.getByRole("button", { name: new RegExp(currentQ.correctMeaning, "i") }));

    // After answering: Japanese transcript & reading are revealed!
    expect(screen.getByText(currentQ.hiddenPromptJa)).toBeTruthy();
    expect(screen.getByText("Correct!")).toBeTruthy();
    expect(screen.getByRole("button", { name: /\+ FSRS/i })).toBeTruthy();
  });

  it("renders Result screen with interactive audio review table and Practice Missed Items button", () => {
    const session = createListeningSession(
      {},
      {
        subMode: "kana",
        answerFormat: "multiple-choice",
        levels: [5],
        kanaScript: "hiragana",
        kanaGroups: ["basic"],
        size: 10,
      },
      () => 0.2,
      "listening-test-session"
    );

    session.questions[0].status = "correct";
    session.questions[1].status = "wrong";
    session.questions[1].userAnswer = "ka";
    for (let i = 2; i < session.questions.length; i++) {
      session.questions[i].status = "skipped";
    }

    const summary = summarizeListeningSession(session);
    saveGameResult("listening", summary);

    render(<ListeningResultPage />);

    expect(screen.getByText(/Passed: 1/i)).toBeTruthy();
    expect(screen.getByText(/Missed: 1/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /practice missed items/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /play again/i })).toBeTruthy();
  });
});
