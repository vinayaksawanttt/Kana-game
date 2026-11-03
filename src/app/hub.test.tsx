import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GamesHub from "./page";

describe("GamesHub (/)", () => {
  it("organizes practice, reference, and tools with a featured review hub", () => {
    render(<GamesHub />);
    const linkFor = (href: string) =>
      screen.getAllByRole("link").find((link) => link.getAttribute("href") === href);

    expect(screen.getByRole("heading", { name: /choose your game/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Core Practice" })).toBeTruthy();
    expect(linkFor("/games/kana")).toBeTruthy();
    expect(linkFor("/games/kanji/meaning")).toBeTruthy();
    expect(linkFor("/games/kanji/radicals")).toBeTruthy();
    expect(screen.getByText(/radical builder/i)).toBeTruthy();
    expect(screen.getByText(/kanji reading/i)).toBeTruthy();
    expect(linkFor("/games/vocabulary")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Learn & Reference" })).toBeTruthy();
    expect(linkFor("/grammar")).toBeTruthy();
    expect(linkFor("/learn")).toBeTruthy();
    expect(screen.getByText(/cheat sheets & study guides/i)).toBeTruthy();
    expect(linkFor("/learn")?.textContent).toMatch(/\d+/);
    expect(screen.getByRole("heading", { name: "Tools" })).toBeTruthy();
    expect(linkFor("/dictionary")).toBeTruthy();
    expect(screen.getByText(/FSRS Review Hub/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /github repository/i }).getAttribute("href")).toBe(
      "https://github.com/VinayakSawant859/Kana-game"
    );
    expect(screen.getByText(/KANJIDIC2/i)).toBeTruthy();
    expect(screen.getByText(/EDRDG/i)).toBeTruthy();
  });
});
