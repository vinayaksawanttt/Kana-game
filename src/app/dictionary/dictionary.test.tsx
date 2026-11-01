import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DictionaryAnalyzerPage from "./page";
import { srsDb } from "@/lib/srs/db";

describe("DictionaryAnalyzerPage (/dictionary)", () => {
  beforeEach(async () => {
    await srsDb.items.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("analyzes a Japanese sentence, renders <ruby> furigana and kanji cards, and saves a token to FSRS", async () => {
    render(<DictionaryAnalyzerPage />);

    // Wait for Kuromoji to finish loading if needed
    await waitFor(() => {
      expect(screen.queryByText(/Loading Kuromoji dictionary/i)).toBeNull();
    }, { timeout: 10000 });

    const input = screen.getByPlaceholderText(
      /Paste a Japanese sentence, kanji, or English keyword/i
    );
    fireEvent.change(input, { target: { value: "この川は浅いです" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /Sentence Breakdown/i })).toBeTruthy();
    }, { timeout: 10000 });

    // Check that Kanji Used section shows 川 and 浅
    expect(screen.getByRole("region", { name: /Kanji Used/i })).toBeTruthy();
    expect(screen.getAllByText("川").length).toBeGreaterThan(0);
    expect(screen.getAllByText("浅").length).toBeGreaterThan(0);

    // Click the token button for 浅い to open the bottom sheet inspector
    const tokenButtons = screen.getAllByRole("button");
    const asaiButton = tokenButtons.find((btn) => btn.textContent?.includes("浅い"));
    expect(asaiButton).toBeTruthy();
    fireEvent.click(asaiButton!);

    const dialog = await screen.findByRole("dialog", {
      name: /Token dictionary inspector/i,
    });
    expect(dialog).toBeTruthy();

    const addToFsrsBtn = screen.getByRole("button", { name: /^Add to FSRS$/i });
    fireEvent.click(addToFsrsBtn);

    await waitFor(async () => {
      const saved = await srsDb.items.get("vocab:浅い");
      expect(saved).toBeDefined();
      expect(saved?.prompt).toBe("浅い");
    });
  });

  it("searches an English keyword and renders vocabulary matches and demo sentences", async () => {
    render(<DictionaryAnalyzerPage />);

    const input = screen.getByPlaceholderText(
      /Paste a Japanese sentence, kanji, or English keyword/i
    );
    fireEvent.change(input, { target: { value: "shallow" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: /English Keyword Matches/i })).toBeTruthy();
    });

    expect(screen.getAllByText("浅い").length).toBeGreaterThan(0);
    const levelTags = screen.getAllByText(/^N[1-5]$/);
    expect(levelTags.length).toBeGreaterThan(0);
    expect(levelTags.every((tag) => tag.className.includes("text-white"))).toBe(true);
    expect(screen.getByRole("region", { name: /Context Sentences/i })).toBeTruthy();
    expect(screen.getByText(/This river is very shallow/i)).toBeTruthy();
  });
});
