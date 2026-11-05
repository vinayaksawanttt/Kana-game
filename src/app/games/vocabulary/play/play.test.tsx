import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VocabularyPlayPage from "./[sessionId]/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "play-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

describe("vocabulary question interaction", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("vocabulary-session:play-session", JSON.stringify({
      sessionId: "play-session",
      settings: { levels: ["N5"], grades: [], size: "all" },
      questionIds: ["ada066edfd", "ebec658463", "2dacb910b2"],
    }));
  });

  it("checks with Enter, advances after correct, and skips after a mistake on the next Enter", async () => {
    const user = userEvent.setup();
    render(<VocabularyPlayPage />);
    const input = await screen.findByRole("textbox", { name: "English meaning" });

    expect(screen.getByLabelText("Japanese word 会う")).toBeTruthy();
    await user.type(input, "TO MEET!");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Correct! Meanings: to meet")).toBeTruthy();
    expect(screen.getByText("Awarded: 100")).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(await screen.findByLabelText("Japanese word 青")).toBeTruthy();

    await user.clear(input);
    await user.type(input, "unrelated");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Not quite — try another meaning, use a hint above, or press Skip.")).toBeTruthy();
    expect(screen.queryByText(/blue/)).toBeNull();
    await user.keyboard("{Enter}");
    expect(await screen.findByLabelText("Japanese word 赤")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "English meaning" }) as HTMLInputElement).value).toBe("");
  });

  it("allows explicit retries and saves correct-after-retry points when Enter advances", async () => {
    const user = userEvent.setup();
    render(<VocabularyPlayPage />);
    const input = await screen.findByRole("textbox", { name: "English meaning" });
    await user.type(input, "wrong");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Not quite — try another meaning, use a hint above, or press Skip.")).toBeTruthy();
    expect(screen.queryByText(/to meet/)).toBeNull();
    await user.clear(input);
    await user.type(input, "another wrong answer");
    await user.click(screen.getByRole("button", { name: "Check again" }));
    expect(await screen.findByText('Still not quite (Mistakes: 2). Hint: starts with "t..." (2 words) — or press Skip to reveal.')).toBeTruthy();
    expect(screen.queryByText(/to meet/)).toBeNull();
    expect((input as HTMLInputElement).selectionStart).toBe(0);
    expect((input as HTMLInputElement).selectionEnd).toBe("another wrong answer".length);

    await user.clear(input);
    await user.type(input, "to meet");
    await user.click(screen.getByRole("button", { name: "Check again" }));
    expect(await screen.findByText("Correct! Meanings: to meet")).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(await screen.findByLabelText("Japanese word 青")).toBeTruthy();
    expect(screen.getByText("Score 100 pts")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "End session" }));
    const saved = JSON.parse(localStorage.getItem("vocabulary-result:play-session")!);
    expect(saved.questions[0]).toMatchObject({
      id: "ada066edfd",
      status: "correct",
      attempts: ["wrong", "another wrong answer", "to meet"],
      pointsEarned: 100,
    });
  });

  it("reveals skipped meanings only after locking the resolved card", async () => {
    const user = userEvent.setup();
    render(<VocabularyPlayPage />);
    const input = await screen.findByRole("textbox", { name: "English meaning" });

    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Answer: to meet")).toBeTruthy();
    expect((input as HTMLInputElement).readOnly).toBe(true);
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Check Meaning" })).toBeNull();
  });

  it("shows a quit dialog on browser back and discards the session when confirmed", async () => {
    render(<VocabularyPlayPage />);
    await screen.findByLabelText("Japanese word 会う");

    await waitFor(() => {
      act(() => window.dispatchEvent(new PopStateEvent("popstate")));
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await waitFor(() => {
      act(() => window.dispatchEvent(new PopStateEvent("popstate")));
      expect(screen.getByRole("dialog", { name: /quit this game/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Quit game" }));
    expect(sessionStorage.getItem("vocabulary-session:play-session")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/games/vocabulary");
  });

  it("ends the session early and records unanswered questions separately from skipped ones", async () => {
    const user = userEvent.setup();
    render(<VocabularyPlayPage />);
    await screen.findByLabelText("Japanese word 会う");

    await user.click(screen.getByRole("button", { name: "Skip" }));
    await user.click(screen.getByRole("button", { name: "End session" }));
    expect(mockPush).toHaveBeenCalledWith("/games/vocabulary/result/play-session");
    const saved = JSON.parse(localStorage.getItem("vocabulary-result:play-session")!);
    expect(saved).toMatchObject({ endedEarly: true });
    expect(saved.questions.map((question: { status: string }) => question.status))
      .toEqual(["skipped", "unanswered", "unanswered"]);
  });

  it("uses side-by-side card and answer regions at desktop breakpoints", async () => {
    render(<VocabularyPlayPage />);
    await screen.findByLabelText("Japanese word 会う");
    const card = screen.getByRole("region", { name: "Vocabulary flashcard" });
    const controls = screen.getByRole("region", { name: "Answer and hints" });
    const columns = card.parentElement;
    expect(columns?.className).toContain("lg:grid-cols-2");
    expect(columns?.children[0]).toBe(card);
    expect(columns?.children[1]).toBe(controls);
  });
});
