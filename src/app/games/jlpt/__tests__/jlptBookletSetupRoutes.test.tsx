import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PhoneticTrapSetupPage from "../phonetic-traps/page";
import StarScrambleSetupPage from "../star-scramble/page";
import SynonymMatchSetupPage from "../synonym-match/page";
import InstantReplySetupPage from "../instant-reply/page";
import InfoScannerSetupPage from "../info-scanner/page";
import ParagraphClozeSetupPage from "../paragraph-cloze/page";
import WordUsageSetupPage from "../word-usage/page";
import ListeningScenesSetupPage from "../listening-scenes/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("level=N5");

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe("Migrated JLPT Booklet Setup Routes (Phases 2 & 3)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams("level=N5");
  });

  afterEach(() => {
    cleanup();
  });

  describe("Phonetic Trap Sniper Setup Page", () => {
    it("renders in JlptBookletSetupShell with booklet paper, return link, numbered boxes, and action bar", () => {
      render(<PhoneticTrapSetupPage />);

      // Return link
      const returnLink = screen.getByRole("link", {
        name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
      });
      expect(returnLink).toBeTruthy();
      expect(returnLink.getAttribute("href")).toBe("/games/jlpt");

      // Shell Header
      expect(screen.getByText("第1部：文字・語彙 · 問題 1・2")).toBeTruthy();
      expect(screen.getAllByText(/Phonetic Trap Sniper/i).length).toBeGreaterThan(0);

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 出題形式の指定/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 解答補助・ヒント条件/i)).toBeTruthy();
      expect(screen.getByText(/第4問 · 出題数設定/i)).toBeTruthy();

      // Starts with N5 count displayed
      expect(screen.getAllByText(/words in active pool/i).length).toBeGreaterThan(0);

      // Click "All N5–N1"
      const allLevelsButton = screen.getByRole("button", { name: "All N5–N1" });
      fireEvent.click(allLevelsButton);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Examination Drill →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/phonetic-traps\/play\/jlpt-traps-/)
      );
    });

    it("updates active question pool count on level change and retains supported modes and levels", () => {
      render(<PhoneticTrapSetupPage />);

      // Starts with N5 pool count
      const initialPoolText = screen.getAllByText(/\d+ words in active pool/)[0].textContent;
      expect(initialPoolText).toBeTruthy();

      // Click "All N5–N1" button
      const allLevelsBtn = screen.getByRole("button", { name: "All N5–N1" });
      fireEvent.click(allLevelsBtn);

      const allPoolText = screen.getAllByText(/\d+ words in active pool/)[0].textContent;
      expect(allPoolText).not.toBe(initialPoolText);

      // Reset to N5
      const resetBtn = screen.getByRole("button", { name: "Reset N5" });
      fireEvent.click(resetBtn);
      expect(screen.getAllByText(/\d+ words in active pool/)[0].textContent).toBe(initialPoolText);

      // Verify all supported levels are present
      ["N5", "N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${lvl}`, "i") })).toBeTruthy();
      });

      // Verify supported exam sub-modes
      expect(screen.getByText(/問題 1 · Kanji Reading \(漢字読み\)/i)).toBeTruthy();
      expect(screen.getByText(/問題 2 · Orthography Flip \(表記\)/i)).toBeTruthy();
      expect(screen.getByText(/問題 1\+2 · Mixed Exam Drill/i)).toBeTruthy();

      // Verify session length options (10, 20, 30)
      [10, 20, 30].forEach((count) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${count}`, "i") })).toBeTruthy();
      });
    });
  });

  describe("Star Sentence Scramble Setup Page", () => {
    it("renders in JlptBookletSetupShell with star exam pattern, numbered boxes, and starts session", () => {
      render(<StarScrambleSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第2部：文法 · 問題 2 (星問題)")).toBeTruthy();
      expect(screen.getAllByText(/Star Sentence Scramble/i).length).toBeGreaterThan(0);

      // Example pattern preview
      expect(screen.getByText(/例題 · 出題パターン/i)).toBeTruthy();

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 解答補助・ヒント条件/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 出題数設定/i)).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/puzzles in active pool/i).length).toBeGreaterThan(0);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Examination Drill →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/star-scramble\/play\/jlpt-star-/)
      );
    });

    it("updates active question pool count on level change and retains supported modes and levels", () => {
      render(<StarScrambleSetupPage />);

      const initialPoolText = screen.getAllByText(/\d+ puzzles in active pool/)[0].textContent;
      expect(initialPoolText).toBeTruthy();

      // Click "All N5–N1" button
      const allLevelsBtn = screen.getByRole("button", { name: "All N5–N1" });
      fireEvent.click(allLevelsBtn);

      const allPoolText = screen.getAllByText(/\d+ puzzles in active pool/)[0].textContent;
      expect(allPoolText).not.toBe(initialPoolText);

      // Reset to N5
      const resetBtn = screen.getByRole("button", { name: "Reset N5" });
      fireEvent.click(resetBtn);
      expect(screen.getAllByText(/\d+ puzzles in active pool/)[0].textContent).toBe(initialPoolText);

      // Verify all supported levels are present
      ["N5", "N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${lvl}`, "i") })).toBeTruthy();
      });

      // Verify supported modes and options
      expect(screen.getByText(/Show English translation while solving/i)).toBeTruthy();
      expect(screen.getByText(/OFF — Real Exam Mode/i)).toBeTruthy();
      expect(screen.getByText(/あ Furigana ON/i)).toBeTruthy();
      expect(screen.getByText(/漢 Furigana OFF \(Exam\)/i)).toBeTruthy();

      // Verify session length options (10, 15, 20)
      [10, 15, 20].forEach((count) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${count}`, "i") })).toBeTruthy();
      });
    });
  });

  describe("Synonym Paraphrase Match Setup Page", () => {
    it("renders in JlptBookletSetupShell with paraphrase pattern, numbered boxes, and starts session", () => {
      render(<SynonymMatchSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第1部：文字・語彙 · 問題 4 (言い換え類義)")).toBeTruthy();
      expect(screen.getByText(/Synonym Paraphrase Match/i)).toBeTruthy();

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 表記・読み補助形式/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 英語翻訳ヒント条件/i)).toBeTruthy();
      expect(screen.getByText(/第4問 · 出題数設定/i)).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/paraphrase pairs in active pool/i).length).toBeGreaterThan(0);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Examination Drill →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/synonym-match\/play\/synonym-/)
      );
    });

    it("updates active question pool count on level change and retains supported modes and levels", () => {
      render(<SynonymMatchSetupPage />);

      const initialPoolText = screen.getAllByText(/\d+ paraphrase pairs in active pool/)[0].textContent;
      expect(initialPoolText).toBeTruthy();

      // Click "Select All N5–N1" button
      const allLevelsBtn = screen.getByRole("button", { name: "Select All N5–N1" });
      fireEvent.click(allLevelsBtn);

      const allPoolText = screen.getAllByText(/\d+ paraphrase pairs in active pool/)[0].textContent;
      expect(allPoolText).not.toBe(initialPoolText);

      // Verify all supported levels are present
      ["N5", "N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${lvl}`, "i") })).toBeTruthy();
      });

      // Verify supported script display modes
      expect(screen.getByText(/Exam Authentic \(Kanji \/ Kana as tested\)/i)).toBeTruthy();
      expect(screen.getByText(/Reading Aid \(Show Hiragana readings on options\)/i)).toBeTruthy();

      // Verify translation hints and session lengths
      expect(screen.getByText(/Reveal English translation on answer only/i)).toBeTruthy();
      [10, 15, 20].forEach((count) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${count}`, "i") })).toBeTruthy();
      });
    });
  });

  describe("Instant Reply Blitz Setup Page (Phase 3)", () => {
    it("renders in JlptBookletSetupShell with audio reflex boxes and starts session", () => {
      render(<InstantReplySetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第3部：聴解 · 問題 3・4 (即時応答)")).toBeTruthy();
      expect(screen.getAllByText(/Instant Reply Blitz/i).length).toBeGreaterThan(0);

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 聴解出題形式/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 反射タイマー設定/i)).toBeTruthy();
      expect(screen.getByText(/第4問 · 音声再生モード/i)).toBeTruthy();
      expect(screen.getByText(/第6問 · 出題数設定/i)).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/spoken triads in active pool/i).length).toBeGreaterThan(0);

      // Toggle archetype to quick-response
      const quickButton = screen.getByRole("button", {
        name: /Mondai 4\/5: ⚡ Quick Response/i,
      });
      fireEvent.click(quickButton);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Instant Reply Blitz →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/instant-reply\/play\/reply-/)
      );
    });

    it("updates active question pool count on level and archetype change and retains supported modes", () => {
      render(<InstantReplySetupPage />);

      const initialCountText = screen.getAllByText(/\d+ spoken triads in active pool/)[0].textContent;
      expect(initialCountText).toBeTruthy();

      // Click Mondai 4/5 Quick Response button -> updates pool count
      const quickBtn = screen.getByRole("button", {
        name: /Mondai 4\/5: ⚡ Quick Response/i,
      });
      fireEvent.click(quickBtn);

      const quickCountText = screen.getAllByText(/\d+ spoken triads in active pool/)[0].textContent;
      // Quick response is a subset
      expect(quickCountText).not.toBe(initialCountText);

      // Select All N5–N1 levels
      const allLevelsBtn = screen.getByRole("button", { name: "Select All N5–N1" });
      fireEvent.click(allLevelsBtn);

      const allLevelQuickCount = screen.getAllByText(/\d+ spoken triads in active pool/)[0].textContent;
      expect(allLevelQuickCount).not.toBe(quickCountText);

      // Verify timer modes retained: 8s Exam Blitz, 12s Standard, Untimed
      expect(screen.getByText(/8s Exam Blitz \(Official\)/i)).toBeTruthy();
      expect(screen.getByText(/12s Standard/i)).toBeTruthy();
      expect(screen.getByText(/Untimed Practice/i)).toBeTruthy();

      // Verify session length choices (10, 15, 20)
      [10, 15, 20].forEach((count) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${count}`, "i") })).toBeTruthy();
      });
    });
  });

  describe("Real-World Info Scanner Setup Page (Phase 3)", () => {
    it("renders in JlptBookletSetupShell with document category boxes and starts session", () => {
      render(<InfoScannerSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header & instruction
      expect(screen.getAllByText(/Real-World Info Scanner/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/右のページのお知らせを見て、下の質問に答えてください。/i)
      ).toBeTruthy();

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 文書カテゴリ絞り込み/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 出題文書数設定/i)).toBeTruthy();
      expect(screen.getByText(/第4問 · シナリオ英語ガイダンス/i)).toBeTruthy();

      // Toggle category to memo-notice
      const memoFilterButton = screen.getByRole("button", {
        name: /伝言メモ・社内連絡/i,
      });
      fireEvent.click(memoFilterButton);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習を開始する \/ Start Scanning Drill/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/info-scanner\/play\/scanner-/)
      );
    });

    it("updates active pool count when category and level change, retaining supported levels and options", () => {
      render(<InfoScannerSetupPage />);

      // Verify N5..N1 are supported
      ["N5", "N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("radio", { name: lvl })).toBeTruthy();
      });

      const initialCountText = screen.getAllByText(/\d+ documents \(\d+ questions\) in active pool/)[0].textContent;
      expect(initialCountText).toBeTruthy();

      // Change category filter to Memo & Office Note
      const memoBtn = screen.getByRole("button", { name: /伝言メモ・社内連絡/i });
      fireEvent.click(memoBtn);

      const memoCountText = screen.getAllByText(/\d+ documents \(\d+ questions\) in active pool/)[0].textContent;
      expect(memoCountText).not.toBe(initialCountText);

      // Click "All N5–N1" level button to expand active pool
      const allLevelsBtn = screen.getByRole("button", { name: "All N5–N1" });
      fireEvent.click(allLevelsBtn);

      const allLevelsMemoCount = screen.getAllByText(/\d+ documents \(\d+ questions\) in active pool/)[0].textContent;
      expect(allLevelsMemoCount).not.toBe(memoCountText);

      // Verify document count options (3, 5, 10)
      [3, 5, 10].forEach((cnt) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${cnt}`, "i") })).toBeTruthy();
      });
    });
  });

  describe("Paragraph Flow Cloze Setup Page (Phase 3)", () => {
    it("renders in JlptBookletSetupShell with passage source options and starts session", () => {
      render(<ParagraphClozeSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第2部：文法 · 問題 3 (文章の文法)")).toBeTruthy();
      expect(screen.getAllByText(/Paragraph Flow Cloze/i).length).toBeGreaterThan(0);

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 出題パッセージの出典/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 出題パッセージ数/i)).toBeTruthy();
      expect(screen.getByText(/第4問 · 翻訳ガイダンス補助/i)).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/passages .* in active pool/i).length).toBeGreaterThan(0);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Paragraph Flow Cloze →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/paragraph-cloze\/play\/cloze-/)
      );
    });

    it("updates active pool count when passage source filter and levels change, retaining options", () => {
      render(<ParagraphClozeSetupPage />);

      const initialCountText = screen.getAllByText(/\d+ passages \(\d+ blanks\) in active pool/)[0].textContent;
      expect(initialCountText).toBeTruthy();

      // Click "Official Exam Archetypes Only" source filter
      const examPatternBtn = screen.getByRole("button", {
        name: /Official Exam Archetypes Only/i,
      });
      fireEvent.click(examPatternBtn);

      const examCountText = screen.getAllByText(/\d+ passages \(\d+ blanks\) in active pool/)[0].textContent;
      expect(examCountText).toBeTruthy();

      // Click "Graded Story Scenes" source filter
      const storyBtn = screen.getByRole("button", {
        name: /Graded Story Scenes/i,
      });
      fireEvent.click(storyBtn);

      const storyCountText = screen.getAllByText(/\d+ passages \(\d+ blanks\) in active pool/)[0].textContent;
      expect(storyCountText).toBeTruthy();

      // Select All Levels
      const allLevelsBtn = screen.getByRole("button", { name: "Select All Levels" });
      fireEvent.click(allLevelsBtn);

      const allLevelStoryCount = screen.getAllByText(/\d+ passages \(\d+ blanks\) in active pool/)[0].textContent;
      expect(allLevelStoryCount).toBeTruthy();

      // Verify passage count options (2, 3, 5)
      expect(screen.getByRole("button", { name: /2 Passages/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /3 Passages/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /5 Passages/i })).toBeTruthy();

      // Verify translation guidance options
      expect(screen.getByText(/Japanese text only/i)).toBeTruthy();
      expect(screen.getByText(/Hints Enabled/i)).toBeTruthy();
    });
  });

  describe("Word Usage Judge Setup Page (Phase 4)", () => {
    it("renders in JlptBookletSetupShell with N4–N1 levels, preview pattern, and starts session", () => {
      render(<WordUsageSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第1部：文字・語彙 · 問題 5 (語彙・用法)")).toBeTruthy();
      expect(screen.getAllByText(/Word Usage Judge/i).length).toBeGreaterThan(0);

      // Example pattern preview
      expect(screen.getByText(/例題 · 出題パターン/i)).toBeTruthy();

      // Numbered Question Boxes
      expect(screen.getByText(/第1問 · 判定対象レベル/i)).toBeTruthy();
      expect(screen.getByText(/第2問 · 出題数設定/i)).toBeTruthy();
      expect(screen.getByText(/第3問 · 演習モード指定/i)).toBeTruthy();

      // N5 must not be supported in Word Usage
      expect(screen.queryByRole("radio", { name: "N5" })).toBeNull();
      expect(screen.getByRole("radio", { name: "N4" })).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/items in active pool/i).length).toBeGreaterThan(0);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Drill →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/word-usage\/play\/usage-/)
      );
    });

    it("updates active pool count when level changes and strictly retains N4-N1 levels and modes", () => {
      render(<WordUsageSetupPage />);

      // N5 must NEVER be present anywhere in Word Usage
      expect(screen.queryByRole("radio", { name: "N5" })).toBeNull();
      expect(screen.queryByRole("button", { name: /^N5/i })).toBeNull();

      // N4 through N1 must be present
      ["N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("radio", { name: lvl })).toBeTruthy();
      });

      const initialCountText = screen.getAllByText(/\d+ items in active pool/)[0].textContent;
      expect(initialCountText).toBeTruthy();

      // Click "Select All N4–N1" button
      const allLevelsBtn = screen.getByRole("button", { name: "Select All N4–N1" });
      fireEvent.click(allLevelsBtn);

      const allCountText = screen.getAllByText(/\d+ items in active pool/)[0].textContent;
      expect(allCountText).not.toBe(initialCountText);

      // Verify question size choices (10, 15, 20)
      [10, 15, 20].forEach((count) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${count}`, "i") })).toBeTruthy();
      });

      // Verify modes: Authentic Exam vs Study Mode
      expect(screen.getByText(/Exam Authentic \(本番モード\)/i)).toBeTruthy();
      expect(screen.getByText(/Study Mode \(学習モード\)/i)).toBeTruthy();
    });
  });

  describe("Listening Scene Setup Page (Phase 3)", () => {
    it("renders in JlptBookletSetupShell with listening scene boxes and starts session", () => {
      render(<ListeningScenesSetupPage />);

      // Return link
      expect(
        screen.getByRole("link", {
          name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
        })
      ).toBeTruthy();

      // Shell Header
      expect(screen.getByText("第3部：聴解 · Mondai 1・2")).toBeTruthy();
      expect(screen.getAllByText(/AUDIO LISTENING SCENE · 問題 1・2/i).length).toBeGreaterThan(0);

      // Numbered Question Boxes
      expect(screen.getByText(/問 1 · Target Level Selection/i)).toBeTruthy();
      expect(screen.getByText(/問 2 · Drill Length/i)).toBeTruthy();
      expect(screen.getByText(/問 3 · Examination Mode/i)).toBeTruthy();

      // Pool counter
      expect(screen.getAllByText(/scenes in active pool/i).length).toBeGreaterThan(0);

      // Start Drill Button
      const startButton = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Listening Scene Drill →/i,
      });
      expect(startButton).toBeTruthy();
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/games\/jlpt\/listening-scenes\/play\/scene-session-/)
      );

      // Verify session stored in sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter((k) =>
        k.startsWith("jlpt-scene-session:")
      );
      expect(sessionKeys.length).toBe(1);
      const stored = JSON.parse(sessionStorage.getItem(sessionKeys[0])!);
      expect(stored.scenes.length).toBe(3);
      expect(stored.phase).toBe("intro");
    });

    it("updates active question pool count on level toggle and retains supported modes and lengths", () => {
      render(<ListeningScenesSetupPage />);

      const initialCountText = screen.getAllByText(/\d+ scenes in active pool/)[0].textContent;
      expect(initialCountText).toBeTruthy();

      // All 5 levels should be present
      ["N5", "N4", "N3", "N2", "N1"].forEach((lvl) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${lvl}`, "i") })).toBeTruthy();
      });

      // Toggle N4 level on (so N5 + N4 are selected)
      const n4Btn = screen.getByRole("button", { name: /^N4/i });
      fireEvent.click(n4Btn);

      const multiCountText = screen.getAllByText(/\d+ scenes in active pool/)[0].textContent;
      expect(multiCountText).not.toBe(initialCountText);

      // Verify drill length buttons (3, 5, 10)
      [3, 5, 10].forEach((cnt) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${cnt}`, "i") })).toBeTruthy();
      });

      // Verify modes: Official JLPT Exam Mode & Guided Study Mode
      expect(screen.getByText(/Official JLPT Exam Mode/i)).toBeTruthy();
      expect(screen.getByText(/Guided Study Mode/i)).toBeTruthy();
    });
  });
});
