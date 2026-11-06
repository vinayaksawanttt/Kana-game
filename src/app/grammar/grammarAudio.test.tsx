import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import GrammarLibraryPage from "./page";
import { GrammarGuideView } from "@/components/grammar-guide-view";
import { serialize } from "next-mdx-remote/serialize";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/grammar",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock audio hook
const mockPlayGrammarTitle = vi.fn();
const mockPlaySentence = vi.fn();
vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    isPlaying: false,
    activeKey: null,
    playKana: vi.fn(),
    playVocab: vi.fn(),
    playReading: vi.fn(),
    playGrammarTitle: mockPlayGrammarTitle,
    playSentence: mockPlaySentence,
    stopAudio: vi.fn(),
  }),
}));

// Mock content/grammar catalog
vi.mock("@/lib/content/grammar", () => ({
  getGrammarCatalogByLevel: vi.fn().mockResolvedValue([
    {
      id: "N5/a-ga-ichiban",
      slug: "a-ga-ichiban",
      level: "N5",
      title: "A が いちばん～ (A ga ichiban～)",
      pattern: "A が いちばん～",
      romaji: "A ga ichiban～",
      meaning: "The most; the best",
    },
  ]),
}));

// Mock srs service
vi.mock("@/lib/srs/service", () => ({
  getAllSrsItems: vi.fn().mockResolvedValue([]),
  addGrammarToSrs: vi.fn().mockResolvedValue(undefined),
}));

describe("Grammar Audio Integration", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an AudioButton size sm next to each grammar pattern row in /grammar", async () => {
    render(<GrammarLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText("A が いちばん～")).toBeDefined();
    });

    const audioBtn = screen.getByRole("button", { name: /Listen to A が いちばん～/i });
    expect(audioBtn).toBeDefined();
    expect(audioBtn.className).toContain("h-7 w-7"); // sm size
  });

  it("renders AudioButton for patterns and example sentences in GrammarGuideView", async () => {
    const rawMdx = `
## Pattern
**〜てください**

## Example Sentences
1. **ここに名前を書いてください。**
   - *Koko ni namae o kaite kudasai.*
   - Please write your name here.
    `;

    const mdxSource = await serialize(rawMdx);
    render(<GrammarGuideView mdxSource={mdxSource} />);

    const patternBtn = screen.getByRole("button", { name: /Listen to 〜てください/i });
    expect(patternBtn).toBeDefined();

    const sentenceBtn = screen.getByRole("button", { name: /Listen to ここに名前を書いてください。/i });
    expect(sentenceBtn).toBeDefined();
  });
});
