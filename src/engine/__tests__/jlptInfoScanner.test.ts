import { describe, expect, it } from "vitest";
import {
  INFO_SCANNER_DOCUMENTS,
  calculateInfoScannerResult,
  createInfoScannerSession,
  getInfoScannerCountsByLevel,
  infoScannerReducer,
  prepareSessionDocument,
  type InfoScannerAction,
  type InfoScannerSession,
  type InfoScannerSettings,
} from "@/engine/jlptInfoScanner";

function createSeededRng(seed = 123456789): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

describe("JLPT Game 5: Info Scanner Pure Engine (Phase 2)", () => {
  it("determines level counts and question pool correctly", () => {
    const counts = getInfoScannerCountsByLevel(INFO_SCANNER_DOCUMENTS, "all");
    expect(counts.N5.documents).toBeGreaterThan(0);
    expect(counts.N4.documents).toBeGreaterThan(0);
    expect(counts.N3.documents).toBeGreaterThan(0);
    expect(counts.N2.documents).toBeGreaterThan(0);
    expect(counts.N1.documents).toBeGreaterThan(0);

    const flyerCounts = getInfoScannerCountsByLevel(INFO_SCANNER_DOCUMENTS, "flyer-store");
    expect(flyerCounts.N5.documents).toBeGreaterThan(0);
  });

  it("reshuffles option order and preserves the original correct option identity", () => {
    const doc = INFO_SCANNER_DOCUMENTS[0];
    const originalQ = doc.questions[0];
    const originalCorrectOption = originalQ.options[originalQ.correctIndex];

    const rng = createSeededRng(42);
    const prepared = prepareSessionDocument(doc, rng);

    expect(prepared.questions).toHaveLength(doc.questions.length);
    const preparedQ = prepared.questions[0];
    expect(preparedQ.options).toHaveLength(4);

    const newCorrectOption = preparedQ.options[preparedQ.correctIndex];
    expect(newCorrectOption.id).toBe(originalCorrectOption.id);
    expect(newCorrectOption.ja).toBe(originalCorrectOption.ja);
  });

  it("creates deterministic session with seeded RNG and respects count and level filtering", () => {
    const settings: InfoScannerSettings = {
      levels: ["N5"],
      categoryFilter: "all",
      documentCount: 3,
      showScenarioEnglish: true,
    };

    const sessionA = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, settings, createSeededRng(999));
    const sessionB = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, settings, createSeededRng(999));

    expect(sessionA.documents).toHaveLength(3);
    expect(sessionB.documents).toHaveLength(3);
    expect(sessionA.documents.map((d) => d.id)).toEqual(sessionB.documents.map((d) => d.id));
    expect(sessionA.documents.every((d) => d.level === "N5")).toBe(true);
  });

  it("filters correctly by specific category", () => {
    const settings: InfoScannerSettings = {
      levels: ["N5", "N4", "N3", "N2", "N1"],
      categoryFilter: "memo-notice",
      documentCount: 5,
      showScenarioEnglish: false,
    };

    const session = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, settings, createSeededRng(100));
    expect(session.documents.length).toBeGreaterThan(0);
    expect(session.documents.every((d) => d.category === "memo-notice")).toBe(true);
  });

  it("handles full reducer lifecycle: select, submit, next, and finish", () => {
    const settings: InfoScannerSettings = {
      levels: ["N5"],
      categoryFilter: "flyer-store",
      documentCount: 2,
      showScenarioEnglish: true,
    };

    let state = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, settings, createSeededRng(777));
    expect(state.status).toBe("playing");
    expect(state.documentStatus).toBe("viewing");
    expect(state.currentDocumentIndex).toBe(0);

    const doc0 = state.documents[0];
    const correctIdx0 = doc0.questions[0].correctIndex;

    // 1. Select option
    state = infoScannerReducer(state, {
      type: "SELECT_OPTION",
      questionIndex: 0,
      optionIndex: correctIdx0,
    });
    expect(state.selectedOptionByQuestion[0]).toBe(correctIdx0);

    // 2. Submit answer
    state = infoScannerReducer(state, {
      type: "SUBMIT_ANSWER",
      timeMs: 4500,
    });
    expect(state.documentStatus).toBe("answered");
    expect(state.documentResults).toHaveLength(1);
    expect(state.documentResults[0].answers[0].isCorrect).toBe(true);

    // 3. Repeat answer attempt is ignored after submission
    state = infoScannerReducer(state, {
      type: "SELECT_OPTION",
      questionIndex: 0,
      optionIndex: ((correctIdx0 + 1) % 4) as 0 | 1 | 2 | 3,
    });
    expect(state.selectedOptionByQuestion[0]).toBe(correctIdx0);

    // 4. Stale NEXT_DOCUMENT is guarded
    const staleState = infoScannerReducer(state, {
      type: "NEXT_DOCUMENT",
      forDocumentIndex: 99,
    });
    expect(staleState.currentDocumentIndex).toBe(0);

    // 5. Valid NEXT_DOCUMENT advances to doc 1
    state = infoScannerReducer(state, {
      type: "NEXT_DOCUMENT",
      forDocumentIndex: 0,
    });
    expect(state.currentDocumentIndex).toBe(1);
    expect(state.documentStatus).toBe("viewing");

    // 6. Skip document 1
    state = infoScannerReducer(state, {
      type: "SKIP_DOCUMENT",
      timeMs: 1200,
    });
    expect(state.documentStatus).toBe("skipped");
    expect(state.documentResults).toHaveLength(2);
    expect(state.documentResults[1].status).toBe("skipped");

    // 7. Advance past last document -> transitions to finished
    state = infoScannerReducer(state, {
      type: "NEXT_DOCUMENT",
      forDocumentIndex: 1,
    });
    expect(state.status).toBe("finished");
    expect(state.completedAt).toBeDefined();
  });

  it("calculates accurate category breakdown and summary stats", () => {
    const settings: InfoScannerSettings = {
      levels: ["N5", "N4"],
      categoryFilter: "all",
      documentCount: 2,
      showScenarioEnglish: true,
    };

    let state = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, settings, createSeededRng(123));
    const doc0 = state.documents[0];
    const correctIdx = doc0.questions[0].correctIndex;

    // Answer doc 0 correctly
    state = infoScannerReducer(state, {
      type: "SELECT_OPTION",
      questionIndex: 0,
      optionIndex: correctIdx,
    });
    state = infoScannerReducer(state, { type: "SUBMIT_ANSWER", timeMs: 3000 });

    // Advance
    state = infoScannerReducer(state, { type: "NEXT_DOCUMENT", forDocumentIndex: 0 });

    // Answer doc 1 incorrectly
    const doc1 = state.documents[1];
    const wrongIdx = ((doc1.questions[0].correctIndex + 1) % 4) as 0 | 1 | 2 | 3;
    state = infoScannerReducer(state, {
      type: "SELECT_OPTION",
      questionIndex: 0,
      optionIndex: wrongIdx,
    });
    state = infoScannerReducer(state, { type: "SUBMIT_ANSWER", timeMs: 4000 });
    state = infoScannerReducer(state, { type: "NEXT_DOCUMENT", forDocumentIndex: 1 });

    const summary = calculateInfoScannerResult(state);
    expect(summary.totalDocuments).toBe(2);
    expect(summary.score).toBe(1);
    expect(summary.wrongQuestionsCount).toBe(1);
    expect(summary.accuracy).toBe(50);
    expect(summary.totalTimeMs).toBe(7000);
    expect(summary.categoryBreakdown).toHaveLength(6);
    expect(summary.byLevel).toHaveLength(5);
  });
});
