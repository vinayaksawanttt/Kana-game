import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearnHeader } from "./LearnHeader";

describe("LearnHeader", () => {
  it("renders LEARNING HUB branding as a link directly to '/' and has no separate Home link", () => {
    render(<LearnHeader />);

    const brandLink = screen.getByRole("link", { name: /learning hub/i });
    expect(brandLink.getAttribute("href")).toBe("/");
    expect(screen.queryByText(/← Home/i)).toBeNull();
  });
});

