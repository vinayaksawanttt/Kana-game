import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LearnHubClient } from "./LearnHubClient";
import type { LearnFrontmatter } from "@/lib/content/learn-schema";

const guides: LearnFrontmatter[] = [
  {
    title: "Verb forms reference",
    slug: "verb-forms-reference",
    category: "Verbs",
    jlpt: "N5–N3",
    levels: ["N5", "N4", "N3"],
    summary: "Conjugate everyday verbs.",
    keywords: ["conjugation"],
  },
  {
    title: "N2 Kanji review",
    slug: "n2-kanji-review",
    category: "Kanji",
    jlpt: "N2",
    levels: ["N2"],
  },
];

afterEach(() => cleanup());

describe("LearnHubClient", () => {
  it("filters guides by each JLPT level represented in a range", () => {
    render(<LearnHubClient docs={guides} />);
    const levelFilter = (level: string) =>
      screen.getByRole("button", { name: new RegExp(`^${level}$`) });

    fireEvent.click(levelFilter("N5"));
    expect(screen.getByText("Verb forms reference")).toBeTruthy();
    expect(screen.queryByText("N2 Kanji review")).toBeNull();

    fireEvent.click(levelFilter("N3"));
    expect(screen.getByText("Verb forms reference")).toBeTruthy();

    fireEvent.click(levelFilter("N2"));
    expect(screen.queryByText("Verb forms reference")).toBeNull();
    expect(screen.getByText("N2 Kanji review")).toBeTruthy();
  });

  it("searches titles, summaries, and keywords immediately", () => {
    render(<LearnHubClient docs={guides} />);
    fireEvent.change(screen.getByLabelText("Search guides, topics, or keywords"), {
      target: { value: "conjugation" },
    });

    expect(screen.getByText("Verb forms reference")).toBeTruthy();
    expect(screen.queryByText("N2 Kanji review")).toBeNull();
  });
});
