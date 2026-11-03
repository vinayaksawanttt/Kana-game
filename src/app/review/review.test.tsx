import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createEmptyCard } from "ts-fsrs";
import { srsDb } from "@/lib/srs/db";
import { importCards } from "@/lib/srs/service";
import ReviewHubPage from "./page";

describe("FSRS Review Hub (/review)", () => {
  beforeEach(async () => {
    cleanup();
    await srsDb.items.clear();
  });

  it("loads due counts from Dexie and uses the character card UI for kanji and kana", async () => {
    const past = new Date(Date.now() - 60_000);
    await importCards([
      {
        id: "kanji:4F53",
        type: "kanji",
        level: "N4",
        prompt: "体",
        answer: "body, substance",
        reading: "タイ · からだ",
        card: createEmptyCard(past),
      },
    ]);

    const user = userEvent.setup();
    render(<ReviewHubPage />);

    await waitFor(() => {
      expect(screen.getByTestId("due-total-count").textContent).toBe("1");
    });
    expect(screen.getByTestId("due-kanji-count").textContent).toBe("1");

    const startBtn = screen.getByRole("button", { name: /start review/i });
    await user.click(startBtn);

    expect(await screen.findByTestId("review-character-card-layout")).toBeTruthy();
    expect(await screen.findByText("体")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /show answer/i }));

    expect(await screen.findByText("body, substance")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Good" }));

    expect(await screen.findByRole("heading", { name: /review session complete/i })).toBeTruthy();

    const updated = await srsDb.items.get("kanji:4F53");
    expect(updated?.card.reps).toBe(1);
    expect(new Date(updated!.card.due).getTime()).toBeGreaterThan(Date.now());
  });

  it("uses the wide study deck layout for vocabulary and grammar items so long text never overflows", async () => {
    const earlier = new Date(Date.now() - 120_000);
    const later = new Date(Date.now() - 60_000);
    await importCards([
      {
        id: "vocab:懐かしい",
        type: "vocab",
        level: "N2",
        prompt: "懐かしい",
        answer: "dear, desired, missed, nostalgic",
        reading: "なつかしい",
        card: createEmptyCard(earlier),
      },
      {
        id: "grammar:N5/keredomo",
        type: "grammar",
        level: "N5",
        prompt: "A。けれども〜B。",
        answer: "but; however; although",
        reading: "keredomo",
        card: createEmptyCard(later),
      },
    ]);

    const user = userEvent.setup();
    render(<ReviewHubPage />);

    await waitFor(() => {
      expect(screen.getByTestId("due-total-count").textContent).toBe("2");
    });
    expect(screen.getByTestId("due-vocab-count").textContent).toBe("1");
    expect(screen.getByTestId("due-grammar-count").textContent).toBe("1");

    await user.click(screen.getByRole("button", { name: /start review/i }));

    // First item (Vocabulary) renders in wide study layout, NOT the narrow character card
    expect(await screen.findByTestId("review-wide-study-layout")).toBeTruthy();
    expect(screen.queryByTestId("review-character-card-layout")).toBeNull();
    expect(screen.getByText("懐かしい")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /show answer/i }));
    expect(await screen.findByText("dear, desired, missed, nostalgic")).toBeTruthy();
    expect(screen.getByText("なつかしい")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Good" }));

    // Second item (Grammar) also renders in wide study layout with a link to the grammar guide
    expect(await screen.findByTestId("review-wide-study-layout")).toBeTruthy();
    expect(await screen.findByText("A。けれども〜B。")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /show answer/i }));
    expect(await screen.findByText("but; however; although")).toBeTruthy();
    expect(screen.getByRole("link", { name: /open grammar guide/i }).getAttribute("href")).toBe(
      "/grammar/N5/keredomo"
    );
  });
});
