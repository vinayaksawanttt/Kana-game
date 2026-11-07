import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RadicalPracticePage from "./page";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

describe("RadicalPracticePage (/games/kanji/radicals)", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("seamlessly redirects user to the integrated Kanji Reading & Radical Builder Hub", () => {
    render(<RadicalPracticePage />);
    expect(screen.getAllByText(/redirecting to kanji & radical studio/i).length).toBeGreaterThan(0);
    expect(mockReplace).toHaveBeenCalledWith("/games/kanji/reading?view=radicals");
  });
});
