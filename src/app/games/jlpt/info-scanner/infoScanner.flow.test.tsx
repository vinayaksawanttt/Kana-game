import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import InfoScannerSetupPage from "./page";
import InfoScannerPlayPage from "./play/[sessionId]/page";
import InfoScannerResultPage from "./result/[sessionId]/page";
import {
  INFO_SCANNER_DOCUMENTS,
  calculateInfoScannerResult,
  createInfoScannerSession,
  prepareSessionDocument,
} from "@/engine/jlptInfoScanner";
import { saveGameResult, saveGameSession } from "@/lib/game-core/storage";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("level=N5");

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "scanner-test-session" }),
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

describe("JLPT Game 5: Real-World Info Scanner End-to-End Flow (Phase 4)", () => {
  const sessionId = "scanner-test-session";

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams("level=N5");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders setup page, updates category and level chips, and launches session", () => {
    render(<InfoScannerSetupPage />);

    // Header & instruction
    expect(screen.getByText("Real-World Info Scanner")).toBeTruthy();
    expect(
      screen.getByText(/右のページのお知らせを見て、下の質問に答えてください。/i)
    ).toBeTruthy();

    // Toggle category to memo-notice
    const memoFilterButton = screen.getByRole("button", {
      name: /伝言メモ・社内連絡/i,
    });
    fireEvent.click(memoFilterButton);

    // Click Start button
    const startButton = screen.getByRole("button", {
      name: /演習を開始する \/ Start Scanning Drill/i,
    });
    fireEvent.click(startButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/games\/jlpt\/info-scanner\/play\/scanner-/)
    );
  });

  it("plays through a document session, submits answer, inspects evidence, and navigates to results", async () => {
    // Seed session in storage
    const supermarketDoc = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "flyer-n5-supermarket"
    )!;
    const session = createInfoScannerSession(
      [supermarketDoc],
      {
        levels: ["N5"],
        categoryFilter: "flyer-store",
        documentCount: 1,
        showScenarioEnglish: true,
      },
      () => 0.5
    );
    session.sessionId = sessionId;
    saveGameSession("jlpt-scanner", sessionId, session);

    render(<InfoScannerPlayPage />);

    // Document and Scenario
    expect(screen.getByText("サクラスーパー 週末特売チラシ")).toBeTruthy();
    expect(screen.getAllByText("留学生のリーさん").length).toBeGreaterThan(0);

    // Select Option 1 (480円)
    const option1Button = screen.getByRole("button", { name: /480円/i });
    fireEvent.click(option1Button);

    // Submit answer
    const submitButton = screen.getByRole("button", {
      name: /解答を確定する \/ Submit/i,
    });
    fireEvent.click(submitButton);

    // Reveal appears: Green evidence badge and explanation
    expect(screen.getByText(/正解！ Excellent match!/i)).toBeTruthy();
    expect(screen.getByText(/正解の根拠文 \(Document Clue Quote\):/i)).toBeTruthy();

    // Click Next / View Results
    const nextButton = screen.getByRole("button", {
      name: /結果を見る \/ View Results/i,
    });
    fireEvent.click(nextButton);

    expect(mockReplace).toHaveBeenCalledWith(
      `/games/jlpt/info-scanner/result/${sessionId}`
    );
  });

  it("renders result page with category breakdown, review table, and retry action", async () => {
    const supermarketDoc = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "flyer-n5-supermarket"
    )!;
    const sessionDoc = prepareSessionDocument(supermarketDoc);

    const summary = calculateInfoScannerResult({
      sessionId,
      settings: {
        levels: ["N5"],
        categoryFilter: "flyer-store",
        documentCount: 1,
        showScenarioEnglish: true,
      },
      documents: [sessionDoc],
      currentDocumentIndex: 0,
      status: "finished",
      documentStatus: "answered",
      selectedOptionByQuestion: [sessionDoc.questions[0].correctIndex],
      documentResults: [
        {
          documentId: sessionDoc.id,
          status: "answered",
          timeMs: 5000,
          answers: [
            {
              questionId: sessionDoc.questions[0].id,
              questionNumber: 1,
              chosenOptionIndex: sessionDoc.questions[0].correctIndex,
              correctOptionIndex: sessionDoc.questions[0].correctIndex,
              isCorrect: true,
              chosenTextJa: "480円",
              correctTextJa: "480円",
              evidenceBlockIds: ["b-sup-morning"],
              explanationJa: "正解です",
              explanationEn: "Correct",
              clueQuoteJa: "青森産 りんご 1個 100円",
            },
          ],
        },
      ],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    saveGameResult("jlpt-scanner", summary);

    render(<InfoScannerResultPage />);

    // Score metrics
    await waitFor(() => {
      expect(screen.getByText("満点合格！ Perfect Information Scanning!")).toBeTruthy();
    });
    expect(screen.getByText("100%")).toBeTruthy();

    // Category breakdown
    expect(screen.getByText("Category Scanning Accuracy (文書カテゴリ別成果)")).toBeTruthy();
    expect(screen.getByText("チラシ・店舗広告")).toBeTruthy();

    // Review accordion
    const reviewToggle = screen.getByRole("button", { name: /詳細を見る/i });
    fireEvent.click(reviewToggle);
    expect(screen.getByText("あなたの解答 (Your Answer):")).toBeTruthy();

    // Retry action
    const retryButton = screen.getByRole("button", {
      name: /もう一度挑戦する \/ Retry Drill/i,
    });
    fireEvent.click(retryButton);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/games\/jlpt\/info-scanner\/play\/scanner-/)
    );
  });
});
