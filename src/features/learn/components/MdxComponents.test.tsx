import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { mdxComponents } from "./MdxComponents";

describe("MdxComponents Japanese Audio Heuristic", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not attach audio button to English explanatory paragraphs mentioning Japanese words in passing", () => {
    const P = mdxComponents.p;
    render(
      <P>
        In Japanese, daily greetings and set expressions—collectively called 挨拶 (aisatsu)—are
        far more than mere social niceties; they establish mutual trust and maintain harmony.
      </P>
    );

    // Should NOT have an audio button for isolated '挨拶' in an English explanation
    expect(screen.queryByRole("button", { name: /Listen to/i })).toBeNull();
  });

  it("attaches audio button to genuine Japanese example sentences", () => {
    const P = mdxComponents.p;
    render(<P>私は田中です。よろしくお願いします。</P>);

    expect(screen.getByRole("button", { name: /Listen to 私は田中です。よろしくお願いします。/i })).toBeTruthy();
  });

  it("attaches audio button to Japanese example list items with English translations", () => {
    const Li = mdxComponents.li;
    render(
      <Li>
        <strong>猫がいます。</strong> (*There is a cat.*)
      </Li>
    );

    expect(screen.getByRole("button", { name: /Listen to 猫がいます。/i })).toBeTruthy();
  });

  it("attaches audio button to Japanese table cells containing vocabulary or conjugations", () => {
    const Td = mdxComponents.td;
    render(<Td>書きます</Td>);

    expect(screen.getByRole("button", { name: /Listen to 書きます/i })).toBeTruthy();
  });

  it("does not attach audio button to English explanation table cells with minor Japanese mentions", () => {
    const Td = mdxComponents.td;
    render(
      <Td>
        Actions, events, and states of change; inflects across rows with the copula (だ/です).
      </Td>
    );

    expect(screen.queryByRole("button", { name: /Listen to/i })).toBeNull();
  });

  it("renders explicit JapaneseExample component with audio button", () => {
    const JapaneseExample = mdxComponents.JapaneseExample;
    render(
      <JapaneseExample
        ja="図書館で勉強します。"
        en="I study at the library."
        romaji="Toshokan de benkyō shimasu."
      />
    );

    expect(screen.getByText("図書館で勉強します。")).toBeTruthy();
    expect(screen.getByText("I study at the library.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Listen to 図書館で勉強します。/i })).toBeTruthy();
  });
});
