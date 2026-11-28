import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createEmptyCard } from "ts-fsrs";
import { srsDb } from "@/lib/srs/db";
import * as srsService from "@/lib/srs/service";
import BooksShelfPage from "./page";
import BookLessonPage from "./[bookId]/[lesson]/page";

let mockParams: { bookId: string; lesson: string } = { bookId: "genki-1", lesson: "3" };
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  usePathname: () => `/books/${mockParams.bookId}/${mockParams.lesson}`,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe("Textbooks UI Routes (/books & /books/[bookId]/[lesson])", () => {
  beforeEach(() => {
    mockParams = { bookId: "genki-1", lesson: "3" };
    mockPush.mockClear();
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
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

    it("renders learning overview, due review panel, and last visited section / recently studied history", async () => {
      window.localStorage.setItem(
        "kanagame_last_studied_book",
        JSON.stringify({
          bookId: "genki-1",
          lessonNumber: 5,
          bookTitle: "Genki I",
          lessonTitle: "A Trip to Okinawa",
          japaneseTitle: "第5課 沖縄旅行",
          lastTab: "grammar",
          updatedAt: Date.now(),
        })
      );
      window.localStorage.setItem(
        "kanagame_recent_book_history",
        JSON.stringify([
          {
            bookId: "genki-1",
            lessonNumber: 5,
            bookTitle: "Genki I",
            lessonTitle: "A Trip to Okinawa",
            lastTab: "grammar",
            updatedAt: Date.now(),
          },
          {
            bookId: "genki-1",
            lessonNumber: 2,
            bookTitle: "Genki I",
            lessonTitle: "Shopping",
            lastTab: "dialogues",
            updatedAt: Date.now() - 3600000,
          },
        ])
      );

      render(<BooksShelfPage />);

      // Overview & Due Review panels
      expect(await screen.findByText(/Today's Learning Overview/i)).toBeTruthy();
      expect(screen.getByText(/Lessons Completed/i)).toBeTruthy();
      expect(screen.getByText(/Vocabulary Mastered/i)).toBeTruthy();
      expect(screen.getByText(/Due for Review/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: /Start Review/i }).getAttribute("href")).toBe("/review");

      // Last visited section in Continue Studying card
      expect(await screen.findByText(/Section: Grammar/i)).toBeTruthy();

      // Recently Studied section
      expect(await screen.findByText(/Recently Studied/i)).toBeTruthy();
      expect(screen.getByText("Shopping")).toBeTruthy();

      window.localStorage.clear();
    });

    it("filters curriculum across JLPT level and content type facets", async () => {
      render(<BooksShelfPage />);

      expect(await screen.findByText("Greetings & Introductions")).toBeTruthy();

      // Filter by JLPT N4 -> shows Genki II lessons
      const levelSelect = screen.getByLabelText("Filter by JLPT level") as HTMLSelectElement;
      fireEvent.change(levelSelect, { target: { value: "N4" } });

      expect(await screen.findByText(/Found \d+ matching lesson/i)).toBeTruthy();
      expect(screen.getByText(/Looking for a Part-time Job/i)).toBeTruthy();
      expect(screen.queryByText("Greetings & Introductions")).toBeNull();

      // Clear filters and filter by In Progress status pill (0 items -> empty state)
      fireEvent.click(screen.getByRole("button", { name: /Clear Search/i }));
      const inProgressPill = await screen.findByRole("button", { name: /In Progress \(0\)/i });
      fireEvent.click(inProgressPill);
      expect(await screen.findByText(/No lessons match this status filter/i)).toBeTruthy();
    });

    it("renders Unified Review Dashboard with category review queues and direct launcher links", async () => {
      const now = Date.now();
      const pastDue = new Date(now - 3600_000);
      const toArraySpy = vi.spyOn(srsDb.items, "toArray").mockResolvedValue([
        {
          id: "vocab:飲む",
          type: "vocab",
          prompt: "飲む",
          answer: "to drink",
          card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
        },
        {
          id: "kanji:4E00",
          type: "kanji",
          prompt: "一",
          answer: "one",
          card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
        },
        {
          id: "grammar:g-1-1",
          type: "grammar",
          prompt: "X は Y です",
          answer: "Copula",
          card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
        },
      ]);

      try {
        render(<BooksShelfPage />);

        expect(await screen.findByText(/Due for Review/i)).toBeTruthy();

        // 3 category review queues
        expect(screen.getByText("Vocab Due")).toBeTruthy();
        expect(screen.getByText("Kanji Due")).toBeTruthy();
        expect(screen.getByText("Grammar Due")).toBeTruthy();

        // Direct links into category queues
        const vocabLink = screen.getByRole("link", { name: /Review Vocab/i });
        expect(vocabLink.getAttribute("href")).toBe("/review?type=vocab");

        const kanjiLink = screen.getByRole("link", { name: /Review Kanji/i });
        expect(kanjiLink.getAttribute("href")).toBe("/review?type=kanji");

        const grammarLink = screen.getByRole("link", { name: /Review Grammar/i });
        expect(grammarLink.getAttribute("href")).toBe("/review?type=grammar");

        // Primary mixed review link
        const startReviewLink = screen.getByRole("link", { name: /Start Review/i });
        expect(startReviewLink.getAttribute("href")).toBe("/review");
      } finally {
        toArraySpy.mockRestore();
      }
    });

    it("toggles 3-Dimension Progress Deep-Dive with content completion, knowledge mastery, and review status", async () => {
      render(<BooksShelfPage />);

      expect(await screen.findByText(/Today's Learning Overview/i)).toBeTruthy();

      const deepDiveBtn = screen.getByRole("button", { name: /3-Dimension Progress Deep-Dive/i });
      fireEvent.click(deepDiveBtn);

      // Verify the 3 dimensions are displayed
      expect(await screen.findByText(/1\. Content Completion/i)).toBeTruthy();
      expect(screen.getByText(/2\. Knowledge Mastery/i)).toBeTruthy();
      expect(screen.getByText(/3\. Review Schedule/i)).toBeTruthy();
      expect(screen.getByText(/Curriculum material accessed and completed/i)).toBeTruthy();
      expect(screen.getByText(/Confirmed recall stability and practice accuracy/i)).toBeTruthy();

      // Toggle back to hide
      const hideBtn = screen.getByRole("button", { name: /Hide Dimension Breakdown/i });
      fireEvent.click(hideBtn);
      expect(screen.queryByText(/1\. Content Completion/i)).toBeNull();
    });

    it("identifies weak areas based on repeated mistakes and review lapses (>= 2) with direct lesson practice navigation", async () => {
      const now = Date.now();
      const futureDue = new Date(now + 100000);
      const toArraySpy = vi.spyOn(srsDb.items, "toArray").mockResolvedValue([
        {
          id: "vocab:飲む",
          type: "vocab",
          prompt: "飲む",
          answer: "to drink",
          card: { ...createEmptyCard(futureDue), due: futureDue, lapses: 3, reps: 4 },
        },
      ]);

      window.localStorage.setItem(
        "kanagame_lesson_workspace:genki-1:3",
        JSON.stringify({
          selfCheckFeedback: { "g-3-1": "review" },
          practiceFeedback: { "p-3-1": "incorrect", "p-3-2": "incorrect" },
        })
      );

      try {
        render(<BooksShelfPage />);

        expect(await screen.findByText(/Areas Needing Attention/i)).toBeTruthy();
        expect(screen.getByText(/Identified from repeated mistakes and review lapses/i)).toBeTruthy();

        // Mistake badge and direct practice button
        const weakBadges = await screen.findAllByText(/mistakes/i);
        expect(weakBadges.length).toBeGreaterThan(0);

        const practiceLinks = screen.getAllByRole("link", { name: /Practice/i });
        expect(practiceLinks.some((l) => l.getAttribute("href")?.includes("/books/genki-1/3"))).toBe(true);
      } finally {
        toArraySpy.mockRestore();
        window.localStorage.clear();
      }
    });

    it("supports global search category tabs across vocabulary, grammar, kanji, dialogues, and practice drills", async () => {
      render(<BooksShelfPage />);

      const searchInput = (await screen.findByPlaceholderText(
        /filter by lesson title/i
      )) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: "coffee" } });

      // Check category match buttons appear
      const vocabTabBtn = await screen.findByRole("button", { name: /Vocabulary/i });
      expect(vocabTabBtn).toBeTruthy();

      // Click Vocabulary category tab
      fireEvent.click(vocabTabBtn);

      // Verify content match card rendered with title, snippet, and Open in Lesson link
      expect((await screen.findAllByText("コーヒー")).length).toBeGreaterThan(0);
      const openLinks = screen.getAllByRole("link", { name: /Open in Lesson/i });
      expect(openLinks.length).toBeGreaterThan(0);
      expect(openLinks[0].getAttribute("href")).toContain("?tab=vocab");
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

    it("displays Hiragana revision sheet on Lesson 1 and Katakana revision sheet on Lesson 2 kanji tab", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      const { unmount } = render(<BookLessonPage />);

      expect(await screen.findByText("Greetings & Introductions")).toBeTruthy();

      // Click Kanji/Kana tab on Lesson 1 -> Hiragana Revision Sheet
      const kanjiTab = screen.getByRole("button", { name: /平仮名 Hiragana/i });
      fireEvent.click(kanjiTab);

      expect(await screen.findByText(/Hiragana & Katakana Foundation/i)).toBeTruthy();
      expect(screen.getByText(/Hiragana Revision Sheet/i)).toBeTruthy();
      expect(screen.getByText(/Practice Kana Drills/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Play pronunciation for あ" })).toBeTruthy();
      unmount();

      // Lesson 2 -> Katakana Revision Sheet
      mockParams = { bookId: "genki-1", lesson: "2" };
      render(<BookLessonPage />);
      expect(await screen.findByText("Things, Places & Shopping")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /片仮名 Katakana/i }));

      expect(await screen.findByText(/Katakana Revision Sheet/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Play pronunciation for ア" })).toBeTruthy();
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

    it("stops dialogue audio immediately when switching section tab or changing route", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      const { unmount } = render(<BookLessonPage />);

      // Switch to Dialogues tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      expect(await screen.findByText(/^Dialogue I$/i)).toBeTruthy();

      // Start Play Full Scene
      const playSceneBtn = screen.getAllByRole("button", { name: /Play full scene audio/i })[0];
      fireEvent.click(playSceneBtn);

      // Verify playing state
      expect(await screen.findByRole("button", { name: /Stop full scene audio/i })).toBeTruthy();

      // Switch tab to Vocabulary
      const vocabTab = screen.getByRole("button", { name: /単語 Vocabulary/i });
      fireEvent.click(vocabTab);

      // Switch back to Dialogues tab
      fireEvent.click(dialoguesTab);

      // Verify audio has stopped and button returned to Play Full Scene
      expect(screen.queryByRole("button", { name: /Stop full scene audio/i })).toBeNull();
      expect((await screen.findAllByRole("button", { name: /Play full scene audio/i })).length).toBeGreaterThan(0);

      // Unmount cleanly
      unmount();
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

    it("renders compact Lesson Overview, enforces textbook boundary navigation, and supports ?tab= deep links & workspace state persistence", async () => {
      // Deep link straight to Grammar tab on Genki II Lesson 13 (boundary start of Genki II)
      window.history.replaceState({}, "", "/books/genki-2/13?tab=grammar");
      mockParams = { bookId: "genki-2", lesson: "13" };

      const { unmount } = render(<BookLessonPage />);

      // Verify compact Lesson Overview bar with all 5 learning areas
      const overviewBar = await screen.findByLabelText("Lesson overview");
      expect(overviewBar).toBeTruthy();
      expect(overviewBar.textContent).toContain("Vocabulary");
      expect(overviewBar.textContent).toContain("Grammar");
      expect(overviewBar.textContent).toContain("Kanji");
      expect(overviewBar.textContent).toContain("Dialogues");
      expect(overviewBar.textContent).toContain("Practice");

      // Boundary check: Genki II L13 must NOT link back to L12, only forward to L14
      expect(screen.queryByRole("link", { name: /Lesson 12/i })).toBeNull();
      expect(screen.getByRole("link", { name: /Lesson 14/i })).toBeTruthy();

      // Deep link opened Grammar tab directly
      const grammarTab = screen.getByRole("button", { name: /文法 Grammar/i });
      expect(grammarTab.getAttribute("aria-pressed")).toBe("true");

      // Switch to Vocab tab and select Verbs filter (persisted in workspace state)
      fireEvent.click(screen.getByRole("button", { name: /単語 Vocabulary/i }));
      const verbsBtn = await screen.findByRole("button", { name: "Verbs" });
      fireEvent.click(verbsBtn);
      expect(verbsBtn.getAttribute("aria-pressed")).toBe("true");

      // Unmount and remount without query string -> workspace filter state persists
      window.history.replaceState({}, "", "/books/genki-2/13");
      unmount();
      render(<BookLessonPage />);
      const restoredVerbsBtn = await screen.findByRole("button", { name: "Verbs" });
      expect(restoredVerbsBtn.getAttribute("aria-pressed")).toBe("true");

      window.history.replaceState({}, "", "/");
      window.localStorage.clear();
    });

    it("renders FSRS vocabulary status breakdown, filters by SRS status, and supports List & Focused Deck views", async () => {
      const now = Date.now();
      const futureDue = new Date(now + 86_400_000);
      const pastDue = new Date(now - 60_000);

      const toArraySpy = vi.spyOn(srsDb.items, "toArray").mockResolvedValue([
        {
          id: "vocab:飲む",
          type: "vocab",
          prompt: "飲む",
          answer: "to drink",
          card: { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 },
        },
        {
          id: "vocab:行く",
          type: "vocab",
          prompt: "行く",
          answer: "to go",
          card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
        },
      ]);
      const addSpy = vi.spyOn(srsService, "addVocabularyToSrs").mockResolvedValue("vocab:飲む");
      const reviewSpy = vi.spyOn(srsService, "recordReview").mockResolvedValue(undefined);

      try {
        mockParams = { bookId: "genki-1", lesson: "3" };
        render(<BookLessonPage />);

        expect(await screen.findByText("飲む")).toBeTruthy();
        expect(screen.getByText(/Studied 2/i)).toBeTruthy();
        expect(screen.getByText(/Mastered 1/i)).toBeTruthy();
        expect(screen.getByText(/Due 1/i)).toBeTruthy();

        // Filter by FSRS Mastered status
        fireEvent.click(screen.getByRole("button", { name: "Mastered" }));
        expect(screen.getByText("飲む")).toBeTruthy();
        expect(screen.queryByText("行く")).toBeNull();

        // Reset to All Status and switch to compact List table mode
        fireEvent.click(screen.getByRole("button", { name: "All Status" }));
        fireEvent.click(screen.getByRole("button", { name: /^List$/i }));
        const table = await screen.findByRole("table", { name: "Vocabulary list" });
        expect(within(table).getByText("飲む")).toBeTruthy();
        expect(within(table).getByText("行く")).toBeTruthy();

        // Switch to Flip-Cards Focused Deck and grade a card via FSRS
        fireEvent.click(screen.getByRole("button", { name: /Flip-Cards/i }));
        const deck = await screen.findByLabelText("Focused flashcard deck");
        fireEvent.click(within(deck).getByRole("button", { name: /Reveal Answer/i }));
        const goodBtn = within(deck).getByRole("button", { name: /Good/i });
        fireEvent.click(goodBtn);

        await waitFor(() => {
          expect(reviewSpy).toHaveBeenCalled();
        });
        expect(addSpy).toBeDefined();
      } finally {
        toArraySpy.mockRestore();
        addSpy.mockRestore();
        reviewSpy.mockRestore();
      }
    });

    it("supports EN -> JA recall and Typing Practice learning modes in Vocabulary workspace", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      expect(await screen.findByText("飲む")).toBeTruthy();

      const vocabInput = screen.getByPlaceholderText(/Search word or meaning/i);
      fireEvent.change(vocabInput, { target: { value: "飲む" } });

      // 1. Switch to EN -> JA recall mode
      fireEvent.click(screen.getByRole("button", { name: "EN → JA" }));
      expect(screen.queryByRole("button", { name: "Inspect 飲む" })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Reveal Japanese/i }));
      expect(await screen.findByRole("button", { name: "Inspect 飲む" })).toBeTruthy();

      // 2. Switch to Typing Practice mode and submit romaji answer
      fireEvent.click(screen.getByRole("button", { name: "Typing" }));
      const typingInput = await screen.findByPlaceholderText(/Type kana or romaji/i);
      fireEvent.change(typingInput, { target: { value: "nomu" } });
      fireEvent.click(screen.getByRole("button", { name: /^Check$/i }));
      expect(await screen.findByText(/Correct — 飲む/i)).toBeTruthy();
    });

    it("opens VocabularyDetailDrawer with contextual examples, kanji breakdown, keyboard nav, and FSRS controls", async () => {
      const addSpy = vi.spyOn(srsService, "addVocabularyToSrs").mockResolvedValue("vocab:飲む");
      const reviewSpy = vi.spyOn(srsService, "recordReview").mockResolvedValue(undefined);

      try {
        mockParams = { bookId: "genki-1", lesson: "3" };
        render(<BookLessonPage />);

        const inspectBtn = await screen.findByRole("button", { name: "Inspect 飲む" });
        fireEvent.click(inspectBtn);

        const dialog = await screen.findByRole("dialog", { name: "Vocabulary details: 飲む" });
        expect(within(dialog).getByText(/to drink/i)).toBeTruthy();
        expect(within(dialog).getByText("U-Verb")).toBeTruthy();
        expect(within(dialog).getByText("Example Sentences")).toBeTruthy();
        expect(within(dialog).getByText("Kanji Breakdown")).toBeTruthy();

        // Direct cross-section jump to containing grammar point is available
        expect(within(dialog).getByRole("button", { name: /Open in Grammar/i })).toBeTruthy();

        // Grade directly inside drawer
        fireEvent.click(within(dialog).getByRole("button", { name: /Good/i }));
        await waitFor(() => {
          expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({ word: "飲む", reading: "のむ" })
          );
          expect(reviewSpy).toHaveBeenCalledWith("vocab:飲む", 3);
        });

        // Keyboard navigation between words and Escape to close
        fireEvent.keyDown(window, { key: "ArrowRight" });
        await waitFor(() => {
          const updatedDialog = screen.getByRole("dialog");
          expect(updatedDialog.getAttribute("aria-label")).not.toBe("Vocabulary details: 飲む");
        });

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        expect(await screen.findByRole("dialog", { name: "Vocabulary details: 飲む" })).toBeTruthy();

        fireEvent.keyDown(window, { key: "Escape" });
        await waitFor(() => {
          expect(screen.queryByRole("dialog")).toBeNull();
        });
      } finally {
        addSpy.mockRestore();
        reviewSpy.mockRestore();
      }
    });

    it("renders Grammar overview, sticky Table of Contents, and focused Previous/Next grammar point navigation", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      const grammarTab = await screen.findByRole("button", { name: /文法 Grammar/i });
      fireEvent.click(grammarTab);

      expect(await screen.findByText("Lesson Grammar Reference")).toBeTruthy();
      expect(screen.getByText("8 Grammar Points")).toBeTruthy();

      const toc = screen.getByRole("complementary", { name: "Grammar table of contents" });
      expect(within(toc).getByText("Grammar Contents")).toBeTruthy();

      // Focus Grammar Point #5 (〜ませんか) via Table of Contents
      const point5TocBtn = within(toc).getByRole("button", { name: /#5/i });
      fireEvent.click(point5TocBtn);

      expect(await screen.findByText(/Focused on Point #5 of 8/i)).toBeTruthy();

      // Step to Previous (#4) and back to Next (#5)
      fireEvent.click(screen.getByRole("button", { name: /^Previous$/i }));
      expect(await screen.findByText(/Focused on Point #4 of 8/i)).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
      expect(await screen.findByText(/Focused on Point #5 of 8/i)).toBeTruthy();

      // Restore all grammar points
      fireEvent.click(screen.getByRole("button", { name: /Show All Grammar Points/i }));
      expect(screen.queryByText(/Focused on Point #/i)).toBeNull();
    });

    it("tracks Grammar learning status separately, filters by status, runs Grammar Check, and links to Practice Workbook", async () => {
      mockParams = { bookId: "genki-1", lesson: "3" };
      render(<BookLessonPage />);

      const grammarTab = await screen.findByRole("button", { name: /文法 Grammar/i });
      fireEvent.click(grammarTab);

      expect(await screen.findByText("Lesson Grammar Reference")).toBeTruthy();

      // Mark Point #1 as Understood
      const statusGroup = screen.getByRole("group", {
        name: /Learning status for Verb Conjugation/i,
      });
      fireEvent.click(within(statusGroup).getByRole("button", { name: "Understood" }));
      expect(await screen.findByText("Understood 1")).toBeTruthy();

      // Filter by Understood status
      const filterGroup = screen.getByRole("group", {
        name: "Filter grammar by learning status",
      });
      fireEvent.click(within(filterGroup).getByRole("button", { name: "Understood" }));
      expect(screen.getAllByText(/Verb Conjugation \(Present Tense/i).length).toBeGreaterThan(0);
      const filteredToc = screen.getByRole("complementary", { name: "Grammar table of contents" });
      expect(within(filteredToc).queryByText(/Extending Invitations/i)).toBeNull();
      expect(screen.queryByRole("heading", { name: /^〜ませんか$/i })).toBeNull();

      // Answer interactive Grammar Check inside Point #1
      const grammarCheckBox = screen.getByLabelText(/Interactive practice for Verb Conjugation/i);
      const optionBtns = within(grammarCheckBox)
        .getAllByRole("button")
        .filter(
          (btn) =>
            ![
              "Fill in the Blank",
              "Correct Sentence",
              "Sentence Completion",
              "Multiple Choice",
              "Practice in Workbook",
            ].includes(btn.textContent?.trim() || "")
        );
      expect(optionBtns.length).toBeGreaterThan(0);
      fireEvent.click(optionBtns[0]);
      expect(await within(grammarCheckBox).findByText(/Try Again/i)).toBeTruthy();

      // Jump directly to linked Practice Workbook section
      const workbookButtons = within(grammarCheckBox).getAllByRole("button", {
        name: /Practice in Workbook/i,
      });
      fireEvent.click(workbookButtons[0]);
      await waitFor(() => {
        const practiceTabBtn = screen.getByRole("button", { name: /練習 Practice/i });
        expect(practiceTabBtn.getAttribute("aria-pressed")).toBe("true");
      });
    });

    it("renders Kanji overview metrics, stroke-count & FSRS status filters, and Grid/List views", async () => {
      const now = Date.now();
      const futureDue = new Date(now + 86_400_000);
      const pastDue = new Date(now - 60_000);
      const codeOne = "一".codePointAt(0)!.toString(16).toUpperCase();
      const codeTime = "時".codePointAt(0)!.toString(16).toUpperCase();

      const toArraySpy = vi.spyOn(srsDb.items, "toArray").mockResolvedValue([
        {
          id: `kanji:${codeOne}`,
          type: "kanji",
          prompt: "一",
          answer: "one",
          card: { ...createEmptyCard(futureDue), due: futureDue, state: 2, reps: 3 },
        },
        {
          id: `kanji:${codeTime}`,
          type: "kanji",
          prompt: "時",
          answer: "time",
          card: { ...createEmptyCard(pastDue), due: pastDue, state: 2, reps: 2 },
        },
      ]);

      try {
        mockParams = { bookId: "genki-1", lesson: "3" };
        render(<BookLessonPage />);

        const kanjiTab = await screen.findByRole("button", { name: /漢字 Kanji/i });
        fireEvent.click(kanjiTab);

        expect(await screen.findByText(/Lesson Kanji & Stroke Studio/i)).toBeTruthy();
        expect(screen.getByText("15 Kanji")).toBeTruthy();
        expect(screen.getByText("Studied 2")).toBeTruthy();
        expect(screen.getByText("Mastered 1")).toBeTruthy();
        expect(screen.getByText("Due 1")).toBeTruthy();

        // Filter by stroke count (9+ 画 -> 時 only)
        const strokeGroup = screen.getByRole("group", { name: "Filter kanji by stroke count" });
        fireEvent.click(within(strokeGroup).getByRole("button", { name: "9+ 画" }));
        expect(screen.getByRole("button", { name: "Inspect kanji 時" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Inspect kanji 一" })).toBeNull();

        // Reset stroke filter, then filter by FSRS Mastered status (-> 一 only)
        fireEvent.click(within(strokeGroup).getByRole("button", { name: "All Strokes" }));
        const statusGroup = screen.getByRole("group", { name: "Filter kanji by FSRS status" });
        fireEvent.click(within(statusGroup).getByRole("button", { name: "Mastered" }));
        expect(screen.getByRole("button", { name: "Inspect kanji 一" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Inspect kanji 時" })).toBeNull();

        // Reset status filter and switch to List view
        fireEvent.click(within(statusGroup).getByRole("button", { name: "All Status" }));
        const displayGroup = screen.getByRole("group", { name: "Kanji display mode" });
        fireEvent.click(within(displayGroup).getByRole("button", { name: /^List$/i }));

        const kanjiTable = await screen.findByRole("table", { name: "Kanji list" });
        expect(within(kanjiTable).getByText("一")).toBeTruthy();
        expect(within(kanjiTable).getByText("時")).toBeTruthy();
      } finally {
        toArraySpy.mockRestore();
      }
    });

    it("opens KanjiDetailModal with Writing Practice mode, FSRS grading, and direct Vocabulary detail navigation", async () => {
      const addKanjiSpy = vi.spyOn(srsService, "addKanjiToSrs").mockResolvedValue("kanji:65E5");
      const reviewSpy = vi.spyOn(srsService, "recordReview").mockResolvedValue(undefined);

      try {
        mockParams = { bookId: "genki-1", lesson: "4" };
        render(<BookLessonPage />);

        const kanjiTab = await screen.findByRole("button", { name: /漢字 Kanji/i });
        fireEvent.click(kanjiTab);

        const inspectDayBtn = await screen.findByRole("button", { name: "Inspect kanji 日" });
        fireEvent.click(inspectDayBtn);

        const kanjiDialog = await screen.findByRole("dialog", {
          name: /Stroke order animation for 日/i,
        });
        expect(within(kanjiDialog).getByText(/Lesson 4 Kanji/i)).toBeTruthy();

        // Switch to Writing Practice tab
        const writingTab = within(kanjiDialog).getByRole("tab", { name: /Writing Practice/i });
        fireEvent.click(writingTab);
        expect(
          await within(kanjiDialog).findByRole("region", { name: "Stroke Practice Workspace" })
        ).toBeTruthy();
        expect(within(kanjiDialog).getByRole("button", { name: "Trace" })).toBeTruthy();
        expect(within(kanjiDialog).getByRole("button", { name: "Recall" })).toBeTruthy();

        // Grade kanji via FSRS inside modal
        fireEvent.click(within(kanjiDialog).getByRole("button", { name: /Good/i }));
        await waitFor(() => {
          expect(addKanjiSpy).toHaveBeenCalledWith(expect.objectContaining({ kanji: "日" }));
          expect(reviewSpy).toHaveBeenCalledWith("kanji:65E5", 3);
        });

        // Navigate from connected Lesson Vocabulary into VocabularyDetailDrawer
        const inspectWordBtn = await within(kanjiDialog).findByRole("button", {
          name: "Inspect vocabulary 昨日",
        });
        fireEvent.click(inspectWordBtn);

        const vocabDialog = await screen.findByRole("dialog", {
          name: "Vocabulary details: 昨日",
        });
        expect(vocabDialog).toBeTruthy();
      } finally {
        addKanjiSpy.mockRestore();
        reviewSpy.mockRestore();
      }
    });

    it("renders Dialogue Workspace with 5 learning modes, pace controls, per-line reveal in Listening mode, and scene filtering", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Dialogues tab
      const dialoguesTab = await screen.findByRole("button", { name: /会話 Dialogues/i });
      fireEvent.click(dialoguesTab);

      // Verify Dialogue Workspace header overview & stats
      expect(await screen.findByText("会話 Dialogue Workspace")).toBeTruthy();
      expect(screen.getByText(/\d+ \/ \d+ Mastered/i)).toBeTruthy();
      expect(screen.getByText(/\d+ lines · \d+ speakers/i)).toBeTruthy();

      // Verify all 5 Learning Mode buttons exist
      expect(screen.getByRole("button", { name: /^Reading$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^Listening$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^Shadowing$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^Role-play$/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /^Vocabulary$/i })).toBeTruthy();

      // Switch to Listening Mode
      fireEvent.click(screen.getByRole("button", { name: /^Listening$/i }));
      expect((await screen.findAllByText(/Listening Mode:/i)).length).toBeGreaterThan(0);

      // In Listening Mode without global showEnglish, English lines are concealed
      const hideEnglishBtn = screen.queryByRole("button", { name: /Hide English/i });
      if (hideEnglishBtn) {
        fireEvent.click(hideEnglishBtn);
      }

      // Check for Reveal English button on dialogue line
      const revealButtons = await screen.findAllByRole("button", { name: /Reveal English/i });
      expect(revealButtons.length).toBeGreaterThan(0);
      fireEvent.click(revealButtons[0]);

      // Now revealed line translation appears
      expect(screen.getByText(/Hello. I am Takeshi Kimura./i)).toBeTruthy();

      // Switch to Role-play Mode
      fireEvent.click(screen.getByRole("button", { name: /^Role-play$/i }));
      expect((await screen.findAllByText("Practice Role:")).length).toBeGreaterThan(0);

      // Switch to Shadowing Mode
      fireEvent.click(screen.getByRole("button", { name: /^Shadowing$/i }));
      expect((await screen.findAllByText(/Shadowing Mode:/i)).length).toBeGreaterThan(0);

      // Verify Pace Buttons
      const pace075Btn = screen.getByRole("button", { name: "0.75x" });
      const pace125Btn = screen.getByRole("button", { name: "1.25x" });
      fireEvent.click(pace075Btn);
      expect(pace075Btn.className).toContain("bg-[var(--tb-primary)]");
      fireEvent.click(pace125Btn);
      expect(pace125Btn.className).toContain("bg-[var(--tb-primary)]");

      // Verify Scene Filter Pills (All Scenes, Scene I, Scene II, etc.)
      const scene2Pill = screen.queryByRole("button", { name: /Scene II/i });
      if (scene2Pill) {
        fireEvent.click(scene2Pill);
        expect(screen.queryByText(/^Dialogue I$/i)).toBeNull();
        expect(screen.getByText(/^Dialogue II$/i)).toBeTruthy();

        // Restore All Scenes
        const allScenesBtn = screen.getByRole("button", { name: /All Scenes/i });
        fireEvent.click(allScenesBtn);
        expect(screen.getByText(/^Dialogue I$/i)).toBeTruthy();
      }

      // Verify Mark Done / Completed toggle
      const markDoneBtns = screen.getAllByRole("button", { name: /Mark scene as completed/i });
      expect(markDoneBtns.length).toBeGreaterThan(0);
      fireEvent.click(markDoneBtns[0]);
      expect(await screen.findByRole("button", { name: /Mark scene as incomplete/i })).toBeTruthy();
    });

    it("renders Practice Workspace with category filters, dashboard metrics, batch checking, and dual-mode drill engine", async () => {
      mockParams = { bookId: "genki-1", lesson: "1" };
      render(<BookLessonPage />);

      // Switch to Practice tab
      const practiceTab = await screen.findByRole("button", { name: /練習 Practice/i });
      fireEvent.click(practiceTab);

      // Verify Practice Dashboard header & metrics
      expect(await screen.findByText(/練習 Practice Drills/i)).toBeTruthy();
      expect(screen.getByText(/\d+ Exercises/i)).toBeTruthy();

      // Verify Category filter pills exist
      const allCategoriesPill = screen.getByRole("button", { name: /All Categories/i });
      expect(allCategoriesPill).toBeTruthy();

      const categoryPills = screen.getAllByRole("button", {
        name: /(Conjugation & Forms|Chart & Information|Conversational Pair Work|Question & Answer)/i,
      });
      expect(categoryPills.length).toBeGreaterThan(0);

      // Verify Part filter dropdown
      expect(screen.getByLabelText("Filter practice sections by part")).toBeTruthy();

      // Enter input in the first exercise
      const inputs = screen.getAllByPlaceholderText(/Type Japanese response to check/i);
      expect(inputs.length).toBeGreaterThan(0);
      fireEvent.change(inputs[0], { target: { value: "たけしさん" } });

      // Verify Check All Answered button is now active and clickable
      const checkAllBtn = screen.getByRole("button", { name: /Check All Answered/i });
      expect(checkAllBtn).toBeTruthy();
      fireEvent.click(checkAllBtn);

      // Verify feedback was registered and accuracy / attempted stats update
      await waitFor(() => {
        expect(screen.getByText(/\d+ \/ \d+ Attempted/i)).toBeTruthy();
      });

      // Verify collapsible reference chart toggle if present
      const chartToggles = screen.queryAllByRole("button", { name: /Reference Chart/i });
      if (chartToggles.length > 0) {
        fireEvent.click(chartToggles[0]);
      }

      // Switch between Worksheet View and Workbook Drill Mode
      const drillModeBtn = screen.getByRole("button", { name: /Workbook Drill Mode/i });
      fireEvent.click(drillModeBtn);

      // In Workbook Drill Mode
      expect(await screen.findByText(/Interactive Workbook Drill Engine/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Exit Drill/i })).toBeTruthy();

      // Exit Drill Mode back to Worksheet
      fireEvent.click(screen.getByRole("button", { name: /Exit Drill/i }));
      expect(await screen.findByText(/Worksheet View/i)).toBeTruthy();
    });

    it("renders MNN III Reading tab (読む・書く) with word bank cloze, English toggle, and comprehension check", async () => {
      mockParams = { bookId: "mnn-3", lesson: "1" };
      render(<BookLessonPage />);

      // Verify MNN III Lesson 1 has the Reading tab
      const readingTab = await screen.findByRole("button", { name: /読解 Reading/i });
      expect(readingTab).toBeTruthy();
      fireEvent.click(readingTab);

      // Verify Reading Workspace renders Lesson 1 title & Warmup
      expect(await screen.findByText(/読むときのポイント/i)).toBeTruthy();
      expect(screen.getByText(/1\. 考えてみましょう/i)).toBeTruthy();

      // Click word bank chip for first blank (重ねて) and check answers
      const kasaneChip = screen.getByRole("button", { name: /オ\.\s*重ねて/i });
      fireEvent.click(kasaneChip);
      fireEvent.click(screen.getByRole("button", { name: /Check Answers/i }));
      expect(await screen.findByText(/1 \/ 8 Correct/i)).toBeTruthy();

      // Toggle English translations off and back on
      fireEvent.click(screen.getByRole("button", { name: /Hide English/i }));
      expect(screen.queryByText(/what foreign travelers/i)).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Show English/i }));
      expect(screen.getByText(/what foreign travelers/i)).toBeTruthy();

      // Test Comprehension ○/× and Model Answer reveal
      const circleButtons = screen.getAllByRole("button", { name: "○" });
      expect(circleButtons.length).toBeGreaterThan(0);
      fireEvent.click(circleButtons[0]);
      expect(await screen.findByText(/Correct \(○\)/i)).toBeTruthy();

      const modelAnswerBtns = screen.getAllByRole("button", { name: /Model Answer/i });
      fireEvent.click(modelAnswerBtns[0]);
      expect(await screen.findByText(/解答例:/i)).toBeTruthy();
    });
  });
});
