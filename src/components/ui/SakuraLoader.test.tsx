import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SakuraLoader } from "./SakuraLoader";

describe("SakuraLoader component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with default label and accessibility attributes", () => {
    render(<SakuraLoader />);
    const status = screen.getByRole("status");
    expect(status).toBeTruthy();
    expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
    expect(screen.getByText("待")).toBeTruthy();
  });

  it("renders with custom label and size variant", () => {
    render(<SakuraLoader label="Preparing Session..." size="lg" className="my-custom-loader" />);
    expect(screen.getAllByText("Preparing Session...").length).toBeGreaterThan(0);
    const status = screen.getByRole("status");
    expect(status.classList.contains("my-custom-loader")).toBe(true);
  });
});
