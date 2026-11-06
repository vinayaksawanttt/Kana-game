import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AudioButton from "./AudioButton";

describe("AudioButton component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with correct accessibility label", () => {
    render(<AudioButton text="あ" romaji="a" />);
    const button = screen.getByRole("button", { name: /Listen to pronunciation of あ/i });
    expect(button).toBeDefined();
  });

  it("prevents default on mouseDown to protect input focus", () => {
    render(<AudioButton text="か" romaji="ka" />);
    const button = screen.getByRole("button", { name: /Listen to pronunciation of か/i });

    const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault");

    button.dispatchEvent(mouseDownEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("stops event propagation on click so parent row selections are not toggled", () => {
    const parentClickHandler = vi.fn();
    render(
      <div onClick={parentClickHandler}>
        <AudioButton text="さ" romaji="sa" />
      </div>
    );

    const button = screen.getByRole("button", { name: /Listen to pronunciation of さ/i });
    fireEvent.click(button);

    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it("renders with custom label if provided", () => {
    render(<AudioButton text="しゃ" romaji="sha" label="Replay sha" />);
    const button = screen.getByRole("button", { name: /Replay sha/i });
    expect(button).toBeDefined();
  });

  it("respects disabled prop", () => {
    render(<AudioButton text="ん" romaji="n" disabled />);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("supports vocab mode and custom onPlay handler", () => {
    const customPlay = vi.fn();
    render(<AudioButton text="大勢" reading="おおぜい" mode="vocab" onPlay={customPlay} />);
    const button = screen.getByRole("button", { name: /Listen to pronunciation of 大勢/i });
    fireEvent.click(button);
    expect(customPlay).toHaveBeenCalledTimes(1);
  });

  it("supports grammar mode and custom onPlay handler", () => {
    const customPlay = vi.fn();
    render(<AudioButton text="A がいちばん～" mode="grammar" size="sm" onPlay={customPlay} />);
    const button = screen.getByRole("button", { name: /Listen to pronunciation of A がいちばん～/i });
    fireEvent.click(button);
    expect(customPlay).toHaveBeenCalledTimes(1);
  });

  it("supports sentence mode and custom onPlay handler", () => {
    const customPlay = vi.fn();
    render(<AudioButton text="学校へ行く。" mode="sentence" size="sm" onPlay={customPlay} />);
    const button = screen.getByRole("button", { name: /Listen to pronunciation of 学校へ行く。/i });
    fireEvent.click(button);
    expect(customPlay).toHaveBeenCalledTimes(1);
  });
});

