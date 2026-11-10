import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import JlptArenaHubPage from "./page";

describe("JLPT Question Booklet Hub (/games/jlpt)", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders authentic Japanese Question Booklet (問題用紙) cover with Examinee registration and notes", () => {
    render(<JlptArenaHubPage />);

    // Title & subtitle
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("問題用紙");
    expect(screen.getByText(/言語知識（文字・語彙・文法）・読解・聴解 演習/i)).toBeTruthy();

    // Examinee registration box
    expect(screen.getByText(/受験番号 · Examinee No\./i)).toBeTruthy();
    expect(screen.getByText(/EX-N5-0042/i)).toBeTruthy();
    expect(screen.getByText("合格圏")).toBeTruthy();

    // 3 Official Exam Pillar notes
    expect(screen.getByText(/第1部：文字・語彙 \(25分\)/i)).toBeTruthy();
    expect(screen.getByText(/第2部：文法・読解 \(50分\)/i)).toBeTruthy();
    expect(screen.getByText(/第3部：聴解 \(30分\)/i)).toBeTruthy();
  });

  it("renders three official exam sections with authentic pagination and Word Usage Judge entry", () => {
    render(<JlptArenaHubPage />);

    // Page 1 indicator
    expect(screen.getByText(/- 1 \/ 3 -/)).toBeTruthy();

    // -------------------------------------------------------------
    // Page 1: 第1部：文字・語彙 (4 games)
    // -------------------------------------------------------------
    // Mondai 1 & 2: Phonetic Trap Sniper
    expect(screen.getByRole("heading", { level: 2, name: /Phonetic Trap Sniper/i })).toBeTruthy();
    expect(
      screen.getByText(/＿＿のことばはどう読みますか・どう書きますか。/i),
    ).toBeTruthy();

    // Mondai 3: Collocation & Spatial Counter Snap
    expect(
      screen.getByRole("heading", { level: 2, name: /Collocation & Spatial Counter Snap/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/に入れるのに最もよいものを、1・2・3・4から一つえらんでください。/i),
    ).toBeTruthy();

    // Mondai 4: Synonym Paraphrase Match
    expect(screen.getByRole("heading", { level: 2, name: /Synonym Paraphrase Match/i })).toBeTruthy();
    expect(
      screen.getByText(/＿＿のぶんとだいたい同じ意味のものが 1・2・3・4にあります。/i),
    ).toBeTruthy();

    // Mondai 5: Word Usage Judge (NEW)
    expect(screen.getByRole("heading", { level: 2, name: /Word Usage Judge/i })).toBeTruthy();
    expect(
      screen.getByText(/＿＿のことばの使い方として最もよいものを、1・2・3・4から一つえらんでください。/i),
    ).toBeTruthy();

    // Page 1 live drill links: Phonetic Traps, Synonym Match, Word Usage
    const p1Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p1Links).toHaveLength(3);
    expect(p1Links[0].getAttribute("href")).toContain("/games/jlpt/phonetic-traps?level=n5");
    expect(p1Links[1].getAttribute("href")).toContain("/games/jlpt/synonym-match?level=n5");
    expect(p1Links[2].getAttribute("href")).toContain("/games/jlpt/word-usage?level=n5");

    // Click "次ページにつづく · Turn to Page 2" button
    const turnToP2Btn = screen.getByRole("button", { name: /次ページにつづく · Turn to Page 2/i });
    fireEvent.click(turnToP2Btn);

    // -------------------------------------------------------------
    // Page 2: 第2部：文法・読解 (4 games)
    // -------------------------------------------------------------
    expect(screen.getByText(/- 2 \/ 3 -/)).toBeTruthy();

    // Mondai 1: Sentence Grammar Cloze
    expect(
      screen.getByRole("heading", { level: 2, name: /Sentence Grammar Cloze/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/次の文の.*に入れるのに最もよいものを、1・2・3・4から一つえらんでください。/i),
    ).toBeTruthy();

    // Mondai 2: Star Sentence Scramble
    expect(screen.getByRole("heading", { level: 2, name: /★ Star Sentence Scramble/i })).toBeTruthy();
    expect(screen.getByText(/★ に入るものはどれですか。/i)).toBeTruthy();

    // Mondai 3: Paragraph Flow Cloze
    expect(screen.getByRole("heading", { level: 2, name: /Paragraph Flow Cloze/i })).toBeTruthy();
    expect(screen.getByText(/22から26に何を入れますか。/i)).toBeTruthy();

    // Mondai 4–6: Real-World Info Scanner
    expect(screen.getByRole("heading", { level: 2, name: /Real-World Info Scanner/i })).toBeTruthy();
    expect(
      screen.getByText(/右のページのお知らせを見て、下の質問に答えてください。/i),
    ).toBeTruthy();

    // Page 2 live drill links: Star Scramble, Paragraph Cloze, Info Scanner
    const p2Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p2Links).toHaveLength(3);
    expect(p2Links[0].getAttribute("href")).toContain("/games/jlpt/star-scramble?level=n5");
    expect(p2Links[1].getAttribute("href")).toContain("/games/jlpt/paragraph-cloze?level=n5");
    expect(p2Links[2].getAttribute("href")).toContain("/games/jlpt/info-scanner?level=n5");

    // Click "次ページにつづく · Turn to Page 3" button
    const turnToP3Btn = screen.getByRole("button", { name: /次ページにつづく · Turn to Page 3/i });
    fireEvent.click(turnToP3Btn);

    // -------------------------------------------------------------
    // Page 3: 第3部：聴解 (2 games)
    // -------------------------------------------------------------
    expect(screen.getByText(/- 3 \/ 3 -/)).toBeTruthy();

    // Mondai 1 & 2: Audio Detail / Preview Sniper
    expect(
      screen.getByRole("heading", { level: 2, name: /Audio Detail \/ Preview Sniper/i }),
    ).toBeTruthy();
    expect(
      screen.getByText(/はじめに質問を聞いてください。それから話を聞いて、/i),
    ).toBeTruthy();

    // Mondai 3 & 4: Instant Reply Blitz
    expect(screen.getByRole("heading", { level: 2, name: /Instant Reply Blitz/i })).toBeTruthy();
    expect(
      screen.getByText(/ぶんをきいて、1から3のなかから いちばんいいものを一つえらんでください。/i),
    ).toBeTruthy();

    // Page 3 live drill links: Listening Scenes & Instant Reply
    const p3Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p3Links).toHaveLength(2);
    expect(p3Links[0].getAttribute("href")).toContain("/games/jlpt/listening-scenes?level=n5");
    expect(p3Links[1].getAttribute("href")).toContain("/games/jlpt/instant-reply?level=n5");

    // Turn back to Page 2 using "前のページへ戻る" button
    const turnToP2BackBtn = screen.getByRole("button", { name: /前のページへ戻る · Return to Page 2/i });
    fireEvent.click(turnToP2BackBtn);
    expect(screen.getByText(/- 2 \/ 3 -/)).toBeTruthy();

    // Turn back to Page 1 using "前のページへ戻る" button
    const turnToP1BackBtn = screen.getByRole("button", { name: /前のページへ戻る · Return to Page 1/i });
    fireEvent.click(turnToP1BackBtn);
    expect(screen.getByText(/- 1 \/ 3 -/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: /Word Usage Judge/i })).toBeTruthy();

    // Turn to Page 3 using top tab
    const tab3 = screen.getByRole("tab", { name: /第 3 ページ：第3部 聴解/i });
    fireEvent.click(tab3);
    expect(screen.getByRole("heading", { level: 2, name: /Instant Reply Blitz/i })).toBeTruthy();
  });

  it("interactively updates level stamps and propagates to drill query links across all 3 pages", () => {
    render(<JlptArenaHubPage />);

    const n3Button = screen.getByRole("radio", { name: "N3" });
    fireEvent.click(n3Button);

    expect(screen.getByText(/EX-N3-0042/i)).toBeTruthy();
    expect(screen.getByText(/JLPT N3 Focused/i)).toBeTruthy();

    // Page 1 drill links reflect n3 (including word-usage)
    const p1Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p1Links).toHaveLength(3);
    expect(p1Links[0].getAttribute("href")).toContain("/games/jlpt/phonetic-traps?level=n3");
    expect(p1Links[1].getAttribute("href")).toContain("/games/jlpt/synonym-match?level=n3");
    expect(p1Links[2].getAttribute("href")).toContain("/games/jlpt/word-usage?level=n3");

    // Navigate to Page 2 via tab
    const tab2 = screen.getByRole("tab", { name: /第 2 ページ：第2部 文法・読解/i });
    fireEvent.click(tab2);

    // Page 2 drill links reflect n3
    const p2Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p2Links).toHaveLength(3);
    expect(p2Links[0].getAttribute("href")).toContain("/games/jlpt/star-scramble?level=n3");
    expect(p2Links[1].getAttribute("href")).toContain("/games/jlpt/paragraph-cloze?level=n3");
    expect(p2Links[2].getAttribute("href")).toContain("/games/jlpt/info-scanner?level=n3");

    // Navigate to Page 3 via tab
    const tab3 = screen.getByRole("tab", { name: /第 3 ページ：第3部 聴解/i });
    fireEvent.click(tab3);

    // Page 3 drill links reflect n3
    const p3Links = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(p3Links).toHaveLength(2);
    expect(p3Links[0].getAttribute("href")).toContain("/games/jlpt/listening-scenes?level=n3");
    expect(p3Links[1].getAttribute("href")).toContain("/games/jlpt/instant-reply?level=n3");
  });
});
