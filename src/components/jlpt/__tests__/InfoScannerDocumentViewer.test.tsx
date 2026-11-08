import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InfoScannerDocumentViewer } from "../InfoScannerDocumentViewer";
import { INFO_SCANNER_DOCUMENTS, prepareSessionDocument } from "@/engine/jlptInfoScanner";

const mockPlaySentence = vi.fn();

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentence: mockPlaySentence,
    isPlaying: false,
    activeKey: null,
  }),
}));

describe("JLPT Game 5: InfoScannerDocumentViewer (Phase 3)", () => {
  beforeEach(() => {
    cleanup();
    mockPlaySentence.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a supermarket flyer with table, footnotes, and stable block IDs", () => {
    const supermarketDoc = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "flyer-n5-supermarket"
    )!;
    const sessionDoc = prepareSessionDocument(supermarketDoc);

    const { container } = render(
      <InfoScannerDocumentViewer
        document={sessionDoc}
        highlightedBlockIds={["b-sup-morning", "b-sup-coupon"]}
        isRevealed={false}
      />
    );

    // Title and type
    expect(screen.getByText("サクラスーパー 週末特売チラシ")).toBeTruthy();
    expect(screen.getByText(/スーパーのチラシ/)).toBeTruthy();

    // Stable block IDs exist in DOM
    const morningBlock = container.querySelector("#b-sup-morning");
    expect(morningBlock).toBeTruthy();
    expect(morningBlock?.getAttribute("data-block-id")).toBe("b-sup-morning");

    const couponBlock = container.querySelector("#b-sup-coupon");
    expect(couponBlock).toBeTruthy();
    expect(couponBlock?.getAttribute("data-block-id")).toBe("b-sup-coupon");

    // Table rows rendered
    expect(screen.getAllByText("青森産 りんご").length).toBeGreaterThan(0);
    expect(screen.getByText("100円")).toBeTruthy();

    // Not revealed yet -> no evidence badge
    expect(screen.queryByText(/正解の根拠/)).toBeNull();
  });

  it("reveals and highlights exact evidence blocks with green glow and evidence badge", () => {
    const supermarketDoc = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "flyer-n5-supermarket"
    )!;
    const sessionDoc = prepareSessionDocument(supermarketDoc);

    const { container } = render(
      <InfoScannerDocumentViewer
        document={sessionDoc}
        highlightedBlockIds={["b-sup-morning", "b-sup-coupon"]}
        isRevealed={true}
      />
    );

    // Evidence badges appear on both highlighted blocks
    const evidenceBadges = screen.getAllByText(/正解の根拠 \(Evidence Clue\)/);
    expect(evidenceBadges).toHaveLength(2);

    // Check highlighted styling
    const morningBlock = container.querySelector("#b-sup-morning");
    expect(morningBlock?.className).toContain("ring-emerald-500");
  });

  it("triggers audio playback when clicking the audio button on a revealed block", () => {
    const deskMemoDoc = INFO_SCANNER_DOCUMENTS.find(
      (d) => d.id === "memo-n5-desk-message"
    )!;
    const sessionDoc = prepareSessionDocument(deskMemoDoc);

    render(
      <InfoScannerDocumentViewer
        document={sessionDoc}
        highlightedBlockIds={["b-memo-body"]}
        isRevealed={true}
      />
    );

    const audioButtons = screen.getAllByRole("button", { name: /Listen to/i });
    expect(audioButtons.length).toBeGreaterThan(0);

    fireEvent.click(audioButtons[0]);
    expect(mockPlaySentence).toHaveBeenCalledTimes(1);
  });

  it("renders distinct templates across all 6 categories", () => {
    const categories = [
      "flyer-store",
      "memo-notice",
      "public-guide",
      "schedule-transport",
      "business-email",
      "application-form",
    ] as const;

    for (const cat of categories) {
      const doc = INFO_SCANNER_DOCUMENTS.find((d) => d.category === cat)!;
      const sessionDoc = prepareSessionDocument(doc);
      const { unmount } = render(
        <InfoScannerDocumentViewer document={sessionDoc} />
      );
      expect(screen.getAllByText(doc.documentTypeJa).length).toBeGreaterThan(0);
      unmount();
    }
  });
});
