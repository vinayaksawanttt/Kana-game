import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { CharacterAvatar } from "./CharacterAvatar";

describe("CharacterAvatar component", () => {
  afterEach(cleanup);

  it("renders portrait avatar for a mapped Genki character", () => {
    const { container } = render(<CharacterAvatar speaker="Mary" speakerJa="メアリー" />);

    const avatarBox = container.querySelector("[data-character-id='mary-hart']");
    expect(avatarBox).not.toBeNull();
    expect(avatarBox?.getAttribute("data-speaking")).toBe("false");

    const images = avatarBox?.querySelectorAll("img");
    expect(images?.length).toBe(2);
    expect(images?.[0].getAttribute("src")).toBe("/images/characters/mary-hart/neutral.webp");
    expect(images?.[1].getAttribute("src")).toBe("/images/characters/mary-hart/talking.webp");
  });

  it("updates speaking state and classes when isSpeaking is true", () => {
    const { container, rerender } = render(
      <CharacterAvatar speaker="Takeshi" speakerJa="たけし" isSpeaking={false} />
    );

    let avatarBox = container.querySelector("[data-character-id='takeshi-kimura']");
    expect(avatarBox?.getAttribute("data-speaking")).toBe("false");

    rerender(<CharacterAvatar speaker="Takeshi" speakerJa="たけし" isSpeaking={true} />);
    avatarBox = container.querySelector("[data-character-id='takeshi-kimura']");
    expect(avatarBox?.getAttribute("data-speaking")).toBe("true");
  });

  it("gracefully falls back to initials badge for unknown characters", () => {
    const { container } = render(<CharacterAvatar speaker="Doctor" speakerJa="医者" />);

    const fallback = screen.getByRole("img", { name: /医者 \(Doctor\)/i });
    expect(fallback).not.toBeNull();
    expect(fallback.textContent?.trim()).toBe("医");
    expect(container.querySelectorAll("img").length).toBe(0);
  });

  it("falls back to initials badge if image encounters an error", () => {
    const { container } = render(<CharacterAvatar speaker="Mary" speakerJa="メアリー" />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();

    // Trigger image loading error
    fireEvent.error(img!);

    // Should now display fallback initial badge without img tags
    expect(container.querySelectorAll("img").length).toBe(0);
    const fallback = container.querySelector("[role='img']");
    expect(fallback?.textContent?.trim()).toBe("メ");
  });
});
