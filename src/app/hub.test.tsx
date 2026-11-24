import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GamesHub from "./page";

describe("GamesHub (/)", () => {
  it("organizes practice, immersion, exam prep, and tools with a compact hero, featured bento row, and interactive category filter", () => {
    render(<GamesHub />);
    const linkFor = (href: string) =>
      screen.getAllByRole("link").find((link) => link.getAttribute("href") === href);

    expect(screen.getByRole("heading", { name: /choose your game/i })).toBeTruthy();

    // Featured Experiences row
    expect(screen.getByRole("heading", { name: "Featured Experiences" })).toBeTruthy();

    // 5 intent-based categories
    expect(screen.getByRole("heading", { name: "Daily Review & Weak Spots" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Script & Building Blocks" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Immersion & Real-World Play" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Grammar & JLPT Exam Prep" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Reference & Tools" })).toBeTruthy();

    // Daily Review & Weak Spots
    expect(linkFor("/review")).toBeTruthy();
    expect(linkFor("/learn/mistake-bank")).toBeTruthy();
    expect(linkFor("/learn/missed-kanji")).toBeTruthy();
    expect(screen.getAllByText(/FSRS Review Hub/i).length).toBeGreaterThan(0);

    // Script & Building Blocks
    expect(linkFor("/games/kana")).toBeTruthy();
    expect(linkFor("/games/kanji/meaning")).toBeTruthy();
    expect(linkFor("/games/kanji/reading")).toBeTruthy();
    expect(screen.getByText(/kanji reading & radicals/i)).toBeTruthy();
    expect(linkFor("/games/vocabulary")).toBeTruthy();

    // Immersion & Real-World Play
    expect(linkFor("/games/dialogue")).toBeTruthy();
    expect(screen.getAllByText(/Dialogue Quest: Real-World Japanese Roleplay/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12 Episodes/i).length).toBeGreaterThan(0);
    expect(linkFor("/stories")).toBeTruthy();
    expect(screen.getAllByText(/stories & graded reading/i).length).toBeGreaterThan(0);
    expect(linkFor("/games/listening")).toBeTruthy();
    expect(linkFor("/games/shiritori")).toBeTruthy();

    // Grammar & JLPT Exam Prep
    expect(linkFor("/games/jlpt")).toBeTruthy();
    expect(screen.getAllByText(/JLPT Exam Pattern Practice/i).length).toBeGreaterThan(0);
    expect(linkFor("/games/grammar")).toBeTruthy();

    // Reference & Tools
    expect(linkFor("/books")).toBeTruthy();
    expect(screen.getAllByText(/Textbook Companion/i).length).toBeGreaterThan(0);
    expect(linkFor("/grammar")).toBeTruthy();
    expect(linkFor("/learn")).toBeTruthy();
    expect(screen.getByText(/cheat sheets & study guides/i)).toBeTruthy();
    expect(linkFor("/learn")?.textContent).toMatch(/\d+/);
    expect(linkFor("/dictionary")).toBeTruthy();

    expect(screen.getByRole("link", { name: /github repository/i }).getAttribute("href")).toBe(
      "https://github.com/VinayakSawant859/Kana-game"
    );
    expect(screen.getByText(/KANJIDIC2/i)).toBeTruthy();
    expect(screen.getByText(/EDRDG/i)).toBeTruthy();

    // Interactive category filter tabs
    const buildingBlocksTab = screen.getByRole("tab", { name: /Building Blocks/i });
    fireEvent.click(buildingBlocksTab);

    expect(buildingBlocksTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: "Script & Building Blocks" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Daily Review & Weak Spots" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Reference & Tools" })).toBeNull();

    const allTab = screen.getByRole("tab", { name: /^All/i });
    fireEvent.click(allTab);

    expect(allTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: "Daily Review & Weak Spots" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Reference & Tools" })).toBeTruthy();
  });
});
