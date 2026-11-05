import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import KanjiReadingPill from "./KanjiReadingPill";

describe("KanjiReadingPill component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with accessible label and formatted okurigana", () => {
    render(<KanjiReadingPill reading="たか.い" type="kun" />);
    const button = screen.getByRole("button", { name: /Listen to Kun'yomi reading たか\.い/i });
    expect(button).toBeDefined();
    expect(button.textContent).toContain("たか");
    expect(button.textContent).toContain(".い");
  });

  it("prevents default on mouseDown to protect input focus", () => {
    render(<KanjiReadingPill reading="コウ" type="on" />);
    const button = screen.getByRole("button", { name: /Listen to On'yomi reading コウ/i });

    const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault");

    button.dispatchEvent(mouseDownEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("stops event propagation on click so parent cards do not trigger selection", () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <KanjiReadingPill reading="みぎ" type="kun" />
      </div>
    );

    const button = screen.getByRole("button", { name: /Listen to Kun'yomi reading みぎ/i });
    fireEvent.click(button);

    expect(parentClick).not.toHaveBeenCalled();
  });
});

