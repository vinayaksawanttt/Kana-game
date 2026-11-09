import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JlptBookletSetupShell } from "../JlptBookletSetupShell";

describe("JlptBookletSetupShell Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders paper sheet, crop marks, inner border, and back link to /games/jlpt", () => {
    const onLevelChange = vi.fn();

    render(
      <JlptBookletSetupShell
        label="TEST ARENA"
        glyph="試"
        sectionTag="第1部：文字・語彙 · 問題 1・2"
        sectionTitle="漢字読み・表記"
        sectionSubtitle="Phonetic Trap Sniper"
        mondaiBadge="問題 1・2"
        supportedLevels={["N5", "N4", "N3", "N2", "N1"]}
        selectedLevel="N5"
        onLevelChange={onLevelChange}
        instructions="問題の文を読んで、正しい答えを1つ選んでください。"
      >
        <div data-testid="test-child-controls">Start Button & Options</div>
      </JlptBookletSetupShell>
    );

    // Return to Booklet Hub link
    const backLink = screen.getByRole("link", {
      name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
    });
    expect(backLink).toBeTruthy();
    expect(backLink.getAttribute("href")).toBe("/games/jlpt");

    // Header, titles, and badge
    expect(screen.getByText("第1部：文字・語彙 · 問題 1・2")).toBeTruthy();
    expect(screen.getByText("漢字読み・表記")).toBeTruthy();
    expect(screen.getByText("Phonetic Trap Sniper")).toBeTruthy();
    expect(screen.getByText("問題 1・2")).toBeTruthy();

    // Corner crop marks (+)
    const cropMarks = screen.getAllByText("+");
    expect(cropMarks.length).toBe(4);

    // Children area rendered
    expect(screen.getByTestId("test-child-controls")).toBeTruthy();
  });

  it("renders only supported levels and triggers controlled onLevelChange", () => {
    const onLevelChange = vi.fn();

    // Suppose this game only supports N4, N3, N2, N1 (no N5)
    render(
      <JlptBookletSetupShell
        sectionTitle="語彙・用法"
        supportedLevels={["N4", "N3", "N2", "N1"]}
        selectedLevel="N4"
        onLevelChange={onLevelChange}
        instructions="正しい用法を選んでください。"
      >
        <div>Content</div>
      </JlptBookletSetupShell>
    );

    // N5 should NOT be in the document
    expect(screen.queryByRole("radio", { name: "N5" })).toBeNull();

    // N4..N1 should be present
    expect(screen.getByRole("radio", { name: "N4" })).toBeTruthy();
    const n3Button = screen.getByRole("radio", { name: "N3" });
    expect(n3Button).toBeTruthy();

    // Click N3
    fireEvent.click(n3Button);
    expect(onLevelChange).toHaveBeenCalledWith("N3");
  });

  it("displays examinee number, active question count, and instructions correctly", () => {
    render(
      <JlptBookletSetupShell
        sectionTitle="情報検索"
        supportedLevels={["N5", "N4"]}
        selectedLevel="N5"
        onLevelChange={vi.fn()}
        examineeNumber="EX-N5-CUSTOM-99"
        targetLevelLabel="JLPT N5 Notice Scanning"
        activeQuestionCount={12}
        activeQuestionCountLabel="flyers & memos in pool"
        instructions={
          <p className="instruction-test">右のページのお知らせを見て、質問に答えてください。</p>
        }
      >
        <div>Scanner Options</div>
      </JlptBookletSetupShell>
    );

    // Examinee metadata
    expect(screen.getByText("EX-N5-CUSTOM-99")).toBeTruthy();
    expect(screen.getByText("JLPT N5 Notice Scanning")).toBeTruthy();
    expect(screen.getByText("12 flyers & memos in pool")).toBeTruthy();

    // Instructions
    expect(
      screen.getByText("右のページのお知らせを見て、質問に答えてください。")
    ).toBeTruthy();
  });

  it("supports includeLayout=false for custom outer layout wrapping", () => {
    render(
      <JlptBookletSetupShell
        includeLayout={false}
        sectionTitle="Custom Layout Test"
        supportedLevels={["N5"]}
        selectedLevel="N5"
        onLevelChange={vi.fn()}
        instructions="Instructions"
      >
        <div>Inner Child</div>
      </JlptBookletSetupShell>
    );

    expect(screen.getByText("Custom Layout Test")).toBeTruthy();
    expect(screen.getByText("Inner Child")).toBeTruthy();
    // In includeLayout=false, main navigation from GameLayout should not be present
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  describe("Theme Support: Washi Day & Yoru Night", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("data-theme");
    });

    it("renders shared shell in Washi Day (light) theme with back link and start action", () => {
      document.documentElement.setAttribute("data-theme", "light");
      const handleStart = vi.fn();

      render(
        <JlptBookletSetupShell
          label="WASHI DAY ARENA"
          glyph="和"
          sectionTag="第1部：文字・語彙 · 問題 1"
          sectionTitle="Washi Day Theme Inspection"
          sectionSubtitle="Tactile light exam paper layout"
          supportedLevels={["N5", "N4", "N3"]}
          selectedLevel="N5"
          onLevelChange={vi.fn()}
          examineeNumber="EX-N5-WASHI-01"
          activeQuestionCount={24}
          instructions="Washi Day instruction text"
        >
          <div data-testid="washi-action-container">
            <button
              type="button"
              onClick={handleStart}
              className="bg-[var(--primary)] text-white"
            >
              演習をはじめる / Start Examination Drill →
            </button>
          </div>
        </JlptBookletSetupShell>
      );

      // Verify theme attribute on root
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");

      // Back link to /games/jlpt
      const backLink = screen.getByRole("link", {
        name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
      });
      expect(backLink).toBeTruthy();
      expect(backLink.getAttribute("href")).toBe("/games/jlpt");

      // Corner crop marks (+)
      const cropMarks = screen.getAllByText("+");
      expect(cropMarks.length).toBe(4);

      // Examinee metadata and pool count
      expect(screen.getByText("EX-N5-WASHI-01")).toBeTruthy();
      expect(screen.getByText("24 items in active pool")).toBeTruthy();

      // Start action clickable
      const startBtn = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Examination Drill →/i,
      });
      expect(startBtn).toBeTruthy();
      fireEvent.click(startBtn);
      expect(handleStart).toHaveBeenCalledTimes(1);
    });

    it("renders shared shell in Yoru Night (dark) theme with back link and start action", () => {
      document.documentElement.setAttribute("data-theme", "dark");
      const handleStart = vi.fn();

      render(
        <JlptBookletSetupShell
          label="YORU NIGHT ARENA"
          glyph="夜"
          sectionTag="第2部：文法 · 問題 2"
          sectionTitle="Yoru Night Theme Inspection"
          sectionSubtitle="High-contrast dark ink exam layout"
          supportedLevels={["N5", "N4", "N3", "N2", "N1"]}
          selectedLevel="N3"
          onLevelChange={vi.fn()}
          examineeNumber="EX-N3-YORU-99"
          activeQuestionCount={36}
          instructions="Yoru Night instruction text"
        >
          <div data-testid="yoru-action-container">
            <button
              type="button"
              onClick={handleStart}
              className="bg-[var(--primary)] text-white"
            >
              演習をはじめる / Start Examination Drill →
            </button>
          </div>
        </JlptBookletSetupShell>
      );

      // Verify dark theme attribute on root
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

      // Back link to /games/jlpt
      const backLink = screen.getByRole("link", {
        name: /問題用紙一覧へもどる \(Return to Booklet Hub\)/i,
      });
      expect(backLink).toBeTruthy();
      expect(backLink.getAttribute("href")).toBe("/games/jlpt");

      // Corner crop marks (+)
      const cropMarks = screen.getAllByText("+");
      expect(cropMarks.length).toBe(4);

      // Examinee metadata and pool count
      expect(screen.getByText("EX-N3-YORU-99")).toBeTruthy();
      expect(screen.getByText("36 items in active pool")).toBeTruthy();

      // Start action clickable
      const startBtn = screen.getByRole("button", {
        name: /演習をはじめる \/ Start Examination Drill →/i,
      });
      expect(startBtn).toBeTruthy();
      fireEvent.click(startBtn);
      expect(handleStart).toHaveBeenCalledTimes(1);
    });
  });
});
