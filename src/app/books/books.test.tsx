import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BooksShelfPage from "./page";
import BookLessonPage from "./[bookId]/[lesson]/page";

let mockParams: { bookId: string; lesson: string } = { bookId: "genki-1", lesson: "3" };
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe("Textbooks UI Routes (/books & /books/[bookId]/[lesson])", () => {
  beforeEach(() => {
    mockParams = { bookId: "genki-1", lesson: "3" };
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Books Shelf Page (/books)", () => {
    it("renders the textbook library, book switcher tabs, and lesson cards", async () => {
      render(<BooksShelfPage />);

      // Verify Hero Title
      expect(await screen.findByText("Japanese Textbook Library")).toBeTruthy();

      // Verify Book Switcher buttons
      expect(await screen.findByRole("button", { name: "Genki I" })).toBeTruthy();
      expect(await screen.findByRole("button", { name: "Genki II" })).toBeTruthy();

      // Verify Lessons rendered for Genki I (Lessons 1 to 12)
      expect(await screen.findByText("Greetings & Introductions")).toBeTruthy();
      expect(await screen.findByText("Daily Life & Making a Date")).toBeTruthy();

      // Check stats summary
      expect(screen.getByText(/12 Lessons/i)).toBeTruthy();
    });

    it("switches to Genki II when tab is clicked", async () => {
      render(<BooksShelfPage />);

      const genki2Btn = await screen.findByRole("button", { name: "Genki II" });
      fireEvent.click(genki2Btn);

      // Verify Genki II lessons are displayed
      expect(await screen.findByText(/Looking for a Part-time Job/i)).toBeTruthy();
      expect(screen.getByText(/11 Lessons/i)).toBeTruthy();
    });

    it("filters lessons based on search input", async () => {
      render(<BooksShelfPage />);

      const searchInput = (await screen.findByPlaceholderText(
        /filter by lesson title/i
      )) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: "Okinawa" } });

      // Should show Lesson 5 (A Trip to Okinawa)
      expect(await screen.findByText(/A Trip to Okinawa/i)).toBeTruthy();

      // Lesson 1 should be filtered out
      expect(screen.queryByText("Greetings & Introductions")).toBeNull();
    });

    it("renders resume card when user previously visited a lesson and allows dismissal", async () => {
      window.localStorage.setItem(
        "kanagame_last_studied_book",
        JSON.stringify({
          bookId: "genki-1",
          lessonNumber: 3,
          bookTitle: "Genki I",
          lessonTitle: "Daily Life & Making a Date",
          japaneseTitle: "第3課 デートの約束",
          updatedAt: Date.now(),
        })
      );

      render(<BooksShelfPage />);

      expect(await screen.findByText(/Continue Studying/i)).toBeTruthy();
      expect(screen.getAllByText("Daily Life & Making a Date").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("link", { name: /Resume Lesson/i })).toBeTruthy();

      // Dismiss button
      const dismissBtn = screen.getByRole("button", { name: /Dismiss resume card/i });
      fireEvent.click(dismissBtn);

      expect(screen.queryByText(/Continue Studying/i)).toBeNull();
      window.localStorage.clear();
    });

    it("performs global search across all textbooks when query is typed", async () => {
      render(<BooksShelfPage />);

      const searchInput = (await screen.findByPlaceholderText(
        /filter by lesson title/i
      )) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: "part-time job" } });

      // Should find matching lesson across books (Genki II Lesson 13)
      expect(await screen.findByText(/Found \d+ matching lesson/i)).toBeTruthy();
      expect(screen.getByText(/Looking for a Part-time Job/i)).toBeTruthy();
    });
  });

  describe("Lesson Detail Page (/books/[bookId]/[lesson])", () => {
    it("renders lesson overview and switches between Vocab, Grammar, and Kanji tabs", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      // Verify Lesson Header
      expect(await screen.findByText("Daily Life & Making a Date")).toBeTruthy();
      expect(screen.getByText("第3課 デートの約束")).toBeTruthy();

      // 1. Vocabulary Tab (Active by default)
      expect(await screen.findByText("飲む")).toBeTruthy();
      expect(screen.getByText(/to drink/i)).toBeTruthy();

      // 2. Switch to Grammar Tab
      const grammarTab = screen.getByRole("button", { name: /文法 Grammar/i });
      fireEvent.click(grammarTab);

      // Verify grammar points displayed
      const grammarElements = await screen.findAllByText(/〜ませんか/i);
      expect(grammarElements.length).toBeGreaterThan(0);

      // 3. Switch to Kanji Tab
      const kanjiTab = screen.getByRole("button", { name: /漢字 Kanji/i });
      fireEvent.click(kanjiTab);

      // Verify kanji rendered (e.g. 一, 1 画)
      expect(await screen.findByText("一")).toBeTruthy();
      expect(screen.getByText("1 画")).toBeTruthy();
      expect(screen.getAllByText(/Stroke Order/i).length).toBeGreaterThan(0);
    });

    it("displays Hiragana & Katakana message on Lessons 1 and 2 kanji tab", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      expect(await screen.findByText("Greetings & Introductions")).toBeTruthy();

      // Click Kanji tab
      const kanjiTab = screen.getByRole("button", { name: /漢字 Kanji/i });
      fireEvent.click(kanjiTab);

      // Verify kana foundation notice
      expect(await screen.findByText(/Hiragana & Katakana Foundation/i)).toBeTruthy();
      expect(screen.getByText(/Practice Kana Drills/i)).toBeTruthy();
    });

    it("filters vocabulary by parts of speech and search query", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("飲む")).toBeTruthy();

      // Filter by Verbs
      const verbsFilterBtn = screen.getByRole("button", { name: "Verbs" });
      fireEvent.click(verbsFilterBtn);

      // Should show verbs like 飲む
      expect(screen.getByText("飲む")).toBeTruthy();

      // Search inside vocabulary
      const vocabInput = screen.getByPlaceholderText(/Search word or meaning/i);
      fireEvent.change(vocabInput, { target: { value: "drink" } });

      expect(screen.getByText(/to drink/i)).toBeTruthy();
    });

    it("switches tabs using keyboard shortcuts (1–5)", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("飲む")).toBeTruthy();

      // Press '2' -> Grammar tab
      fireEvent.keyDown(window, { key: "2" });
      const grammarElements = await screen.findAllByText(/〜ませんか/i);
      expect(grammarElements.length).toBeGreaterThan(0);

      // Press '3' -> Kanji tab
      fireEvent.keyDown(window, { key: "3" });
      expect(await screen.findByText("一")).toBeTruthy();

      // Press '1' -> Vocab tab
      fireEvent.keyDown(window, { key: "1" });
      expect(await screen.findByText("飲む")).toBeTruthy();
    });

    it("supports Vocabulary Study Mode (Hide English / Hide Kana) and Flip-Card view", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("飲む")).toBeTruthy();
      expect(screen.getByText(/to drink/i)).toBeTruthy();

      // 1. Toggle "Hide English"
      const hideEnglishBtn = screen.getByRole("button", { name: /Hide English/i });
      fireEvent.click(hideEnglishBtn);

      // Search specifically for "飲む"
      const vocabInput = screen.getByPlaceholderText(/Search word or meaning/i);
      fireEvent.change(vocabInput, { target: { value: "飲む" } });

      // English meaning should be concealed behind a reveal trigger
      const revealBtn = await screen.findByRole("button", { name: /Tap to reveal meaning/i });
      fireEvent.click(revealBtn);
      expect(screen.getByText(/to drink/i)).toBeTruthy();

      // Clear search
      fireEvent.change(vocabInput, { target: { value: "" } });

      // 2. Toggle "Hide Kana"
      const hideKanaBtn = screen.getByRole("button", { name: /Hide Kana/i });
      fireEvent.click(hideKanaBtn);
      expect(screen.getAllByRole("button", { name: /reveal kana/i }).length).toBeGreaterThan(0);

      // 3. Switch to Flip-Card view
      const flipCardViewBtn = screen.getByRole("button", { name: /Flip-Cards/i });
      fireEvent.click(flipCardViewBtn);

      expect(await screen.findByText(/Showing \d+ Flashcards/i)).toBeTruthy();
      expect(screen.getAllByText(/Tap to see English/i).length).toBeGreaterThan(0);

      // Click card to flip
      const flipCard = screen.getAllByText(/Tap to see English/i)[0];
      fireEvent.click(flipCard);

      expect(await screen.findByText(/Tap to flip back/i)).toBeTruthy();
    });

    it("opens inline StrokePlayer modal when clicking Stroke Order on a Kanji card", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      // Switch to Kanji tab
      const kanjiTab = await screen.findByRole("button", { name: /漢字 Kanji/i });
      fireEvent.click(kanjiTab);

      expect(await screen.findByText("一")).toBeTruthy();

      // Click Stroke Order button for "一"
      const strokeOrderBtn = screen.getByRole("button", { name: /Stroke Order for 一/i });
      fireEvent.click(strokeOrderBtn);

      // Verify inline modal opens with StrokePlayer
      expect(await screen.findByRole("dialog", { name: /Stroke order animation for 一/i })).toBeTruthy();
      expect(screen.getByText(/Lesson 3 Kanji/i)).toBeTruthy();

      // Close modal
      const closeBtn = screen.getByRole("button", { name: /Close stroke player/i });
      fireEvent.click(closeBtn);

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renders color-coded pattern chips and expandable Quick Self-Check in Grammar tab", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      // Switch to Grammar tab
      const grammarTab = await screen.findByRole("button", { name: /文法 Grammar/i });
      fireEvent.click(grammarTab);

      // Verify pattern chips are rendered
      expect(await screen.findAllByText(/Pattern Anatomy:/i)).toBeTruthy();

      // Open Quick Self-Check on first example
      const selfCheckButtons = screen.getAllByRole("button", { name: /Quick Self-Check/i });
      fireEvent.click(selfCheckButtons[0]);

      expect(await screen.findByText(/Quick Self-Check Recall Drill/i)).toBeTruthy();
      expect(screen.getByText(/Translate to Japanese:/i)).toBeTruthy();

      // Reveal answer
      const revealBtn = screen.getByRole("button", { name: /Reveal Japanese Answer/i });
      fireEvent.click(revealBtn);

      expect(await screen.findByText(/Model Answer:/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Got It! ✓/i })).toBeTruthy();
    });

    it("renders chat-bubble dialogues with speaker avatars and supports Play Full Scene continuous audio", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Dialogues tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Verify chat bubbles and speaker avatars rendered
      expect(await screen.findByText(/^Dialogue I$/i)).toBeTruthy();
      expect(screen.getAllByText("メアリー").length).toBeGreaterThan(0);

      // Play Full Scene button on first scene
      const playSceneBtn = screen.getAllByRole("button", { name: /Play full scene audio/i })[0];
      fireEvent.click(playSceneBtn);

      // Button toggles to Stop Scene
      expect(await screen.findByRole("button", { name: /Stop full scene audio/i })).toBeTruthy();

      // Stop scene
      const stopSceneBtn = screen.getByRole("button", { name: /Stop full scene audio/i });
      fireEvent.click(stopSceneBtn);

      expect((await screen.findAllByRole("button", { name: /Play full scene audio/i })).length).toBeGreaterThan(0);
    });

    it("launches targeted vocabulary practice session when practice button is clicked", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("飲む")).toBeTruthy();

      const practiceVocabBtn = screen.getByRole("button", {
        name: /Practice Lesson Vocabulary/i,
      });
      fireEvent.click(practiceVocabBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/games/vocabulary/play/")
        );
      });
    });

    it("launches targeted kanji meaning drill session when practice button is clicked", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      // Switch to Kanji Tab
      const kanjiTab = await screen.findByRole("button", { name: /漢字 Kanji/i });
      fireEvent.click(kanjiTab);

      expect(await screen.findByText("一")).toBeTruthy();

      const practiceKanjiBtn = screen.getByRole("button", {
        name: /Practice Lesson Kanji Drill/i,
      });
      fireEvent.click(practiceKanjiBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining("/games/kanji/meaning/play/")
        );
      });
    });

    it("enqueues all lesson items into FSRS spaced repetition and shows success toast", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("Daily Life & Making a Date")).toBeTruthy();

      const enqueueBtn = screen.getByRole("button", {
        name: /Enqueue Lesson in FSRS/i,
      });
      fireEvent.click(enqueueBtn);

      expect(
        await screen.findByText(/Enqueued All \d+ lesson items into FSRS reviews!/i)
      ).toBeTruthy();

      // Verify link to review hub is displayed in the toast
      expect(screen.getByRole("link", { name: /Open Review Hub/i })).toBeTruthy();
    });

    it("renders dialogues tab and toggles English translations", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Dialogues Tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Verify Dialogue lines and scene headers
      expect(await screen.findByText(/^Dialogue I$/i)).toBeTruthy();
      expect(screen.getByLabelText(/木村たけしです/i)).toBeTruthy();
      expect(screen.getByText(/Hello. I am Takeshi Kimura./i)).toBeTruthy();

      // Toggle English translations off
      const hideBtn = screen.getByRole("button", { name: /Hide English/i });
      fireEvent.click(hideBtn);

      expect(screen.queryByText(/Hello. I am Takeshi Kimura./i)).toBeNull();

      // Toggle back on
      const showBtn = screen.getByRole("button", { name: /Show English/i });
      fireEvent.click(showBtn);

      expect(screen.getByText(/Hello. I am Takeshi Kimura./i)).toBeTruthy();
    });

    it("renders practice tab, allows typing and checking answers, and reveals model answers", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Practice Tab
      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      // Verify practice header and sections
      expect(await screen.findByText(/練習 Practice Drills/i)).toBeTruthy();
      expect(screen.getAllByText(/Part I/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/たけしさん/i).length).toBeGreaterThan(0);

      // Reveal model answers
      const showAnswersBtn = screen.getByRole("button", { name: /Reveal All Model Answers/i });
      fireEvent.click(showAnswersBtn);

      expect(screen.getAllByText(/たけしさんは にほんじんです。/i).length).toBeGreaterThan(0);

      // Type an answer and check
      const input = screen.getAllByPlaceholderText(/Type Japanese response to check/i)[0];
      fireEvent.change(input, { target: { value: "たけしさんは にほんじんです。" } });

      const checkButtons = screen.getAllByRole("button", { name: /^Check$/i });
      fireEvent.click(checkButtons[0]);

      // Expect input to show correct border/style
      expect(input.className).toContain("border-emerald-500");
    });

    it("opens Interactive Dialogue Roleplay & Shadowing Mode and supports role switching and stepping", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Dialogues Tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Launch Roleplay & Shadow studio on first scene
      const roleplayBtns = await screen.findAllByRole("button", { name: /Roleplay & Shadow/i });
      fireEvent.click(roleplayBtns[0]);

      // Verify Studio header and mode controls
      expect(await screen.findByText(/Interactive Roleplay & Shadowing/i)).toBeTruthy();
      expect(screen.getByText(/Play as:/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Shadow All/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Record Voice/i })).toBeTruthy();
      expect(screen.getByText(/Line 1 of/i)).toBeTruthy();

      // Advance to next line
      const nextBtn = screen.getByRole("button", { name: /Next Line/i });
      fireEvent.click(nextBtn);
      expect(screen.getByText(/Line 2 of/i)).toBeTruthy();

      // Exit Studio
      const exitBtn = screen.getByRole("button", { name: /Exit Studio/i });
      fireEvent.click(exitBtn);
      expect(screen.queryByText(/Interactive Roleplay & Shadowing/i)).toBeNull();
    });

    it("opens Contextual Grammar Cloze Test on Lesson 13 and grades selected option", async () => {
      mockParams = { bookId: "genki-2", lesson: "13" };
      render(<BookLessonPage />);

      // Switch to Dialogues Tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Open Grammar Cloze Test
      const clozeBtn = await screen.findByRole("button", { name: /Grammar Cloze Test/i });
      fireEvent.click(clozeBtn);

      expect(await screen.findByText(/Contextual Grammar Cloze Test/i)).toBeTruthy();

      // Click the correct option "行ける"
      const ikeruBtn = await screen.findByRole("button", { name: /^行ける$/ });
      fireEvent.click(ikeruBtn);

      // Expect score feedback
      expect(await screen.findByText(/1 \/ 1 Correct/i)).toBeTruthy();
    });

    it("queues missed practice items into FSRS and supports Workbook Drill Mode", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      // Submit an incorrect answer on first item
      const input = (await screen.findAllByPlaceholderText(/Type Japanese response to check/i))[0];
      fireEvent.change(input, { target: { value: "まちがえた" } });

      const checkButtons = screen.getAllByRole("button", { name: /^Check$/i });
      fireEvent.click(checkButtons[0]);

      // Should auto-enqueue into FSRS
      expect(await screen.findByText(/Queued in FSRS/i)).toBeTruthy();

      // Switch to Workbook Drill Mode
      const drillBtn = screen.getByRole("button", { name: /Workbook Drill Mode/i });
      fireEvent.click(drillBtn);

      expect(await screen.findByText(/Interactive Workbook Drill Engine/i)).toBeTruthy();
    });

    it("opens Story Reader Instant Gloss Card when tapping a dialogue word", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Tap a tokenized word in Dialogue I ("木村")
      const wordBtn = await screen.findByRole("button", { name: "木村" });
      fireEvent.click(wordBtn);

      // Expect Instant Gloss Card with JLPT badge, Pitch Accent, and Add to SRS
      expect(await screen.findByText(/JLPT N5/i)).toBeTruthy();
      expect(screen.getByText(/Pitch:/i)).toBeTruthy();
      const addSrsBtn = screen.getByRole("button", { name: /Add to SRS/i });
      fireEvent.click(addSrsBtn);

      expect(await screen.findByText(/Added to SRS/i)).toBeTruthy();
    });

    it("supports Romaji -> Hiragana IME mode and toggling in Practice tab", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      // Verify Romaji IME toggle is active by default
      const imeBtn = await screen.findByRole("button", { name: /Romaji IME: ON/i });
      expect(imeBtn).toBeTruthy();

      const inputs = screen.getAllByPlaceholderText(/Type Japanese response to check/i);
      const firstInput = inputs[0] as HTMLInputElement;

      // Typing romaji "takeshi" converts live to "たけし"
      fireEvent.change(firstInput, { target: { value: "takeshi" } });
      expect(firstInput.value).toBe("たけし");

      // Toggle IME off
      fireEvent.click(imeBtn);
      expect(screen.getByRole("button", { name: /Romaji IME: OFF/i })).toBeTruthy();

      // Typing romaji remains raw
      fireEvent.change(firstInput, { target: { value: "nihonjin" } });
      expect(firstInput.value).toBe("nihonjin");
    });

    it("displays CharacterDiffView breakdown when an answer is marked incorrect in Practice tab", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      const inputs = screen.getAllByPlaceholderText(/Type Japanese response to check/i);
      const firstInput = inputs[0] as HTMLInputElement;

      // Submit an answer with wrong ending ("でした" instead of "です")
      fireEvent.change(firstInput, { target: { value: "たけしさんは にほんじんでした。" } });
      const checkBtn = screen.getAllByRole("button", { name: /^Check$/i })[0];
      fireEvent.click(checkBtn);

      // CharacterDiffView should render with diff breakdown
      expect(await screen.findByTestId("character-diff-view")).toBeTruthy();
      expect(screen.getByText(/Needs Correction — Character Comparison/i)).toBeTruthy();
      expect(screen.getByText(/Your Input:/i)).toBeTruthy();
      expect(screen.getByText(/Expected:/i)).toBeTruthy();
    });

    it("filters practice items with 'Missed Only' and supports 'Retry Missed Items Only' in Workbook Drill Mode", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      // Make mistake on first item
      const input = screen.getAllByPlaceholderText(/Type Japanese response to check/i)[0];
      fireEvent.change(input, { target: { value: "ちがう" } });
      const checkBtn = screen.getAllByRole("button", { name: /^Check$/i })[0];
      fireEvent.click(checkBtn);

      // Missed Only button should appear
      const missedOnlyBtn = await screen.findByRole("button", { name: /Missed Only \(1\)/i });
      expect(missedOnlyBtn).toBeTruthy();

      // Filter by Missed Only
      fireEvent.click(missedOnlyBtn);
      expect(await screen.findByText(/Targeted review: Showing 1 missed exercise/i)).toBeTruthy();

      // Launch Workbook Drill Mode
      const drillModeBtn = screen.getByRole("button", { name: /Workbook Drill Mode/i });
      fireEvent.click(drillModeBtn);

      // In Workbook Drill Mode, make mistake
      const drillInput = await screen.findByPlaceholderText(/Type Japanese response & press Enter/i);
      fireEvent.change(drillInput, { target: { value: "wrong" } });
      const drillCheckBtn = screen.getByRole("button", { name: /^Check$/i });
      fireEvent.click(drillCheckBtn);

      // Character Diff appears inside Workbook Drill Mode
      expect(await screen.findByTestId("character-diff-view")).toBeTruthy();

      // Retry Missed filter appears in header
      const retryMissedBtn = await screen.findByRole("button", { name: /Retry Missed \(1\)/i });
      fireEvent.click(retryMissedBtn);

      // Shows active Missed Drill pill
      expect(await screen.findByText(/Missed Drill \(1\)/i)).toBeTruthy();
    });
  });
});
