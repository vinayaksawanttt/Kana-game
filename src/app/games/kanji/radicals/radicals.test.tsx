import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RadicalPracticePage from "./page";

describe("RadicalPracticePage", () => {
  it("filters JLPT kanji by radical and opens an inspector with examples", async () => {
    render(<RadicalPracticePage />);

    await screen.findByRole("region", { name: "Radical chart" });
    const radical = await screen.findByRole("button", { name: /一, one,/ });
    fireEvent.click(radical);

    const kanjiRegion = screen.getByRole("region", { name: "Kanji matching selected radical" });
    const kanjiTile = await within(kanjiRegion).findByRole("button", {
      name: "一, N5, one",
    });
    fireEvent.click(kanjiTile);

    expect(await screen.findByRole("complementary", { name: "Kanji inspector" })).toBeTruthy();
    const showStrokeButton = screen.getByRole("button", { name: /Show stroke order/i });
    expect(showStrokeButton).toBeTruthy();
    fireEvent.click(showStrokeButton);
    expect(await screen.findByRole("img", { name: /Stroke order diagram for 一/i })).toBeTruthy();
    expect(screen.getByText("Meanings")).toBeTruthy();
    expect(screen.getByText("On readings")).toBeTruthy();
    expect(screen.getByText("Kun readings")).toBeTruthy();
    expect(screen.getByText("Example sentences")).toBeTruthy();
    expect(screen.getByRole("button", { name: /add to fsrs/i })).toBeTruthy();
  }, 15_000);
});
