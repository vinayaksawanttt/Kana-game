import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ListeningSetupPage from "./page";
import ListeningPlayPage from "./play/[sessionId]/page";
import ListeningResultPage from "./result/[sessionId]/page";
import { createListeningSession, summarizeListeningSession } from "@/engine/listening";
import { saveGameResult, saveGameSession } from "@/lib/game-core/storage";

let mockParams: Record<string, string> = { sessionId: "listening-test-session" };
const mockPush = vi.fn();
const mockReplace = vi.fn();
const routerMock = { push: mockPush, replace: mockReplace };
const mockPlayKana = vi.fn();
const mockPlayVocab = vi.fn();
const mockPlaySentence = vi.fn();

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playKana: mockPlayKana,
    playVocab: mockPlayVocab,
    playSentence: mockPlaySentence,
    stopAudio: vi.fn(),
    isPlaying: false,
    activeKey: null,
    playbackSpeed: 1,
    setPlaybackSpeed: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => routerMock,
}));

describe("Listening Quiz UI (Setup, Play & Result)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    mockParams = { sessionId: "listening-test-session" };
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

    // Switch to Sentence Comprehension -> shows English vs Japanese option language toggle
    fireEvent.click(screen.getByRole("button", { name: /sentence comprehension/i }));
    const enOptBtn = screen.getByRole("button", { name: /english options/i });
    const jaOptBtn = screen.getByRole("button", { name: /japanese options/i });
    expect(enOptBtn).toBeTruthy();
    expect(jaOptBtn).toBeTruthy();
    expect(enOptBtn.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(jaOptBtn);
    expect(jaOptBtn.getAttribute("aria-pressed")).toBe("true");
    expect(enOptBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("hides Japanese text until answered on Play screen and reveals transcript after answering", async () => {
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

    // Wait for the session to mount into view
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /replay audio/i })).toBeTruthy();
    });

    // Before answering: hiddenPromptJa is NOT visible, Replay & 0.75x Slow buttons ARE visible
    expect(screen.queryByText(currentQ.hiddenPromptJa)).toBeNull();
    expect(screen.getByRole("button", { name: /0.75x slow/i })).toBeTruthy();

    // Select the correct option
    fireEvent.click(screen.getByRole("button", { name: new RegExp(currentQ.correctMeaning, "i") }));

    // After answering: Japanese transcript & reading are revealed!
    await waitFor(() => {
      expect(screen.getByText(currentQ.hiddenPromptJa)).toBeTruthy();
      expect(screen.getByText("Correct!")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /\+ FSRS/i })).toBeTruthy();
  });

  it("renders Result screen with interactive audio review table and Practice Missed Items button", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Passed: 1/i)).toBeTruthy();
    });

    expect(screen.getByText(/Missed: 1/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /practice missed items/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /play again/i })).toBeTruthy();
  });

  it("does not skip question when Enter is pressed while focused on Skip button or pending, and advances cleanly when answered", async () => {
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
      "skip-test-session"
    );

    mockParams = { sessionId: "skip-test-session" };
    saveGameSession("listening", "skip-test-session", session);
    render(<ListeningPlayPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skip/i })).toBeTruthy();
    });

    const skipBtn = screen.getByRole("button", { name: /skip/i });
    skipBtn.focus();

    // Pressing Enter while tabbed/focused on Skip button must NOT trigger skip!
    fireEvent.keyDown(skipBtn, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Enter" });

    // Status should still be pending and Japanese prompt remains hidden
    expect(screen.queryByText("Skipped")).toBeNull();
    expect(screen.queryByText(session.questions[0].hiddenPromptJa)).toBeNull();

    // Now answer correctly
    const correctBtn = screen.getByRole("button", {
      name: new RegExp(session.questions[0].correctMeaning, "i"),
    });
    fireEvent.click(correctBtn);

    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeTruthy();
    });

    // Press Enter to advance to Next question
    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      // Advanced to Question 2 (index 1), prompt is hidden for question 2
      expect(screen.getByText("2 / 4")).toBeTruthy();
    });
  });

  it("dynamically updates session summary and estimated duration across modes on Setup screen", () => {
    render(<ListeningSetupPage />);

    // Default Kana mode shows Script, Character sets, and Est. duration
    expect(screen.getByText("Script")).toBeTruthy();
    expect(screen.getAllByText("Character sets").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Est\. duration/i)).toBeTruthy();
    expect(screen.getByText(/~\d+ min/i)).toBeTruthy();

    // Switch to Vocabulary Listening -> shows JLPT levels in summary
    fireEvent.click(screen.getByRole("button", { name: /vocabulary listening/i }));
    expect(screen.getByText("JLPT levels")).toBeTruthy();
    expect(screen.queryByText("Character sets")).toBeNull();

    // Select N4 in addition to N5 and choose 30 questions
    fireEvent.click(screen.getByRole("button", { name: /N4/i }));
    fireEvent.click(screen.getByRole("button", { name: /30 questions/i }));
    expect(screen.getByText("N5, N4")).toBeTruthy();
    expect(screen.getAllByText("30 questions").length).toBeGreaterThanOrEqual(2);
  });

  it("displays separate User Answer and Correct Answer on incorrect submission and supports keyboard replay/choice", async () => {
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
      "listening-feedback-session"
    );

    mockParams = { sessionId: "listening-feedback-session" };
    saveGameSession("listening", "listening-feedback-session", session);
    render(<ListeningPlayPage />);

    const currentQ = session.questions[0];
    const wrongOpt = currentQ.options.find((o) => o.id !== currentQ.id)!;
    const wrongIdx = currentQ.options.findIndex((o) => o.id === wrongOpt.id);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /replay audio/i })).toBeTruthy();
    });

    // Space replays audio via keyboard shortcut
    mockPlayVocab.mockClear();
    fireEvent.keyDown(window, { code: "Space", key: " " });
    expect(mockPlayVocab).toHaveBeenCalledTimes(1);

    // Choose wrong option using numeric key (1-4)
    fireEvent.keyDown(window, { key: String(wrongIdx + 1) });

    await waitFor(() => {
      expect(screen.getByText("Incorrect")).toBeTruthy();
      expect(screen.getByText("Your Answer")).toBeTruthy();
      expect(screen.getByText("Correct Answer")).toBeTruthy();
    });

    expect(screen.getAllByText(wrongOpt.label).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(currentQ.correctMeaning).length).toBeGreaterThanOrEqual(1);
  });

  it("filters Audio Review by All, Incorrect, Skipped, and Correct and supports category breakdown and audio replay", async () => {
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
      "listening-filter-session"
    );

    session.questions[0].status = "correct";
    session.questions[1].status = "wrong";
    session.questions[1].userAnswer = "wrong-choice";
    for (let i = 2; i < session.questions.length; i++) {
      session.questions[i].status = "skipped";
    }

    mockParams = { sessionId: "listening-filter-session" };
    const summary = summarizeListeningSession(session);
    saveGameResult("listening", summary);

    render(<ListeningResultPage />);

    await waitFor(() => {
      expect(screen.getByText("Category Breakdown")).toBeTruthy();
    });

    expect(screen.getByText("Basic Kana")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /practice missed items: practice incorrect & skipped/i })
    ).toBeTruthy();

    // Filter to Incorrect (1)
    fireEvent.click(screen.getByRole("button", { name: /Incorrect \(1\)/i }));
    expect(screen.getByText("wrong-choice")).toBeTruthy();
    expect(screen.queryByText(session.questions[0].hiddenPromptJa)).toBeNull();

    // Replay audio from filtered row
    mockPlayKana.mockClear();
    fireEvent.click(
      screen.getByRole("button", { name: `Pronounce ${session.questions[1].hiddenPromptJa}` })
    );
    expect(mockPlayKana).toHaveBeenCalledTimes(1);

    // Filter to Skipped (8)
    fireEvent.click(screen.getByRole("button", { name: /Skipped \(8\)/i }));
    expect(screen.queryByText("wrong-choice")).toBeNull();

    // Filter to Correct (1)
    fireEvent.click(screen.getByRole("button", { name: /^Correct \(1\)$/i }));
    expect(screen.getByText(session.questions[0].hiddenPromptJa)).toBeTruthy();
  });
});
