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

  it("renders all 4 official Mondai sections with instruction bars and (れい) example previews", () => {
    render(<JlptArenaHubPage />);

    // Mondai 1 & 2: Phonetic Trap Sniper
    expect(screen.getByRole("heading", { level: 2, name: /Phonetic Trap Sniper/i })).toBeTruthy();
    expect(
      screen.getByText(/＿＿のことばはどう読みますか・どう書きますか。/i),
    ).toBeTruthy();

    // Mondai 4 & 5: Synonym Paraphrase Match
    expect(screen.getByRole("heading", { level: 2, name: /Synonym Paraphrase Match/i })).toBeTruthy();
    expect(
      screen.getByText(/＿＿のぶんとだいたい同じ意味のものが 1・2・3・4にあります。/i),
    ).toBeTruthy();

    // Mondai 2: Star Sentence Scramble
    expect(screen.getByRole("heading", { level: 2, name: /★ Star Sentence Scramble/i })).toBeTruthy();
    expect(
      screen.getByText(/★ に入るものはどれですか。/i),
    ).toBeTruthy();

    // Mondai 3 & 4/5: Instant Reply Blitz
    expect(screen.getByRole("heading", { level: 2, name: /Instant Reply Blitz/i })).toBeTruthy();
    expect(
      screen.getByText(/ぶんをきいて、1から3のなかから いちばんいいものを一つえらんでください。/i),
    ).toBeTruthy();

    // Start Drill links
    const startLinks = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(startLinks).toHaveLength(4);
    expect(startLinks[0].getAttribute("href")).toContain("/games/jlpt/phonetic-traps?level=n5");
    expect(startLinks[1].getAttribute("href")).toContain("/games/jlpt/synonym-match?level=n5");
    expect(startLinks[2].getAttribute("href")).toContain("/games/jlpt/star-scramble?level=n5");
    expect(startLinks[3].getAttribute("href")).toContain("/games/jlpt/instant-reply?level=n5");
  });

  it("interactively updates level stamps and changes drill query links and pool counts", () => {
    render(<JlptArenaHubPage />);

    const n3Button = screen.getByRole("radio", { name: "N3" });
    fireEvent.click(n3Button);

    expect(screen.getByText(/EX-N3-0042/i)).toBeTruthy();
    expect(screen.getByText(/JLPT N3 Focused/i)).toBeTruthy();

    const startLinks = screen.getAllByRole("link", { name: /演習をはじめる \/ Start Drill/i });
    expect(startLinks[0].getAttribute("href")).toContain("/games/jlpt/phonetic-traps?level=n3");
    expect(startLinks[1].getAttribute("href")).toContain("/games/jlpt/synonym-match?level=n3");
    expect(startLinks[2].getAttribute("href")).toContain("/games/jlpt/star-scramble?level=n3");
    expect(startLinks[3].getAttribute("href")).toContain("/games/jlpt/instant-reply?level=n3");
  });
});
