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
    imageUrl: "/images/learn/verbs.png",
    fallbackSvgUrl: "/images/learn/fallbacks/verbs.svg",
    summary: "Conjugate everyday verbs.",
    keywords: ["conjugation"],
  },
  {
    title: "N2 Kanji review",
    slug: "n2-kanji-review",
    category: "Kanji",
    jlpt: "N2",
    levels: ["N2"],
    imageUrl: "/images/learn/kanji.png",
    fallbackSvgUrl: "/images/learn/fallbacks/kanji.svg",
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

  it("keeps category guides collapsed until opened and expands matching search results", () => {
    render(<LearnHubClient docs={guides} />);
    const verbs = screen.getByRole("button", { name: /Understand verb groups/ });
    expect(verbs.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("learn-verbs-guides")?.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(verbs);
    expect(verbs.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("learn-verbs-guides")?.getAttribute("aria-hidden")).toBe("false");
    expect(screen.getByText("Verb forms reference")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search guides, topics, or keywords"), {
      target: { value: "N2 Kanji" },
    });
    expect(screen.getByRole("button", { name: /Build recognition/ }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("N2 Kanji review")).toBeTruthy();
  });

  it("renders both single-level and range JLPT badges with unified Japan Red pill styling", () => {
    render(<LearnHubClient docs={guides} />);
    // Expand verbs and kanji categories
    fireEvent.click(screen.getByRole("button", { name: /Understand verb groups/ }));
    fireEvent.click(screen.getByRole("button", { name: /Build recognition/ }));

    const verbCard = screen.getByText("Verb forms reference").closest("a")!;
    const kanjiCard = screen.getByText("N2 Kanji review").closest("a")!;

    const rangeBadge = verbCard.querySelector("span.rounded-full.bg-\\[var\\(--primary\\)\\]")!;
    const singleBadge = kanjiCard.querySelector("span.rounded-full.bg-\\[var\\(--primary\\)\\]")!;

    expect(rangeBadge.textContent).toBe("N5–N3");
    expect(rangeBadge.className).toContain("text-white");
    expect(singleBadge.textContent).toBe("N2");
    expect(singleBadge.className).toContain("text-white");
  });

  it("renders the category illustration on its section card and keeps guide cards text-first", () => {
    render(<LearnHubClient docs={guides} />);
    fireEvent.click(screen.getByRole("button", { name: /Understand verb groups/ }));

    const categoryCard = document.getElementById("learn-verbs")!;
    const image = categoryCard.querySelector('[data-testid="learn-guide-image"]')!;
    const fallback = categoryCard.querySelector('[data-testid="learn-guide-fallback"]')!;
    const guideCard = screen.getByText("Verb forms reference").closest("a")!;

    expect(image.getAttribute("src")).toBe("/images/learn/verbs.png");
    expect(fallback.getAttribute("src")).toBe("/images/learn/fallbacks/verbs.svg");
    expect(guideCard.querySelector('[data-testid="learn-guide-image"]')).toBeNull();
    expect(guideCard.textContent).toContain("Read guide");
    const categoryGlyph = categoryCard.querySelector(".font-japanese")!;
    expect(categoryGlyph.textContent).toBe("動");
    expect(categoryGlyph.querySelector("svg")).toBeNull();

    fireEvent.error(image);
    expect(categoryCard.querySelector('[data-testid="learn-guide-image"]')).toBeNull();
    expect(categoryCard.querySelector('[data-testid="learn-guide-fallback"]')).toBeTruthy();
  });
});
