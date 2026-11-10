import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ListeningScenesSetupPage from "./page";
import ListeningScenesPlayPage from "./play/[sessionId]/page";
import {
  createListeningSceneSession,
  type ListeningSceneSession,
} from "@/engine/jlptListeningScene";
import { ALL_LISTENING_SCENES } from "@/data/jlpt/listeningScenesData";
import { saveGameSession } from "@/lib/game-core/storage";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("level=N5");

vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "scene-flow-test-session" }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentence: vi.fn(),
    stopAudio: vi.fn(),
    isPlaying: false,
    activeKey: null,
  }),
}));

describe("JLPT Game 10: Listening Scenes Flow & Play Route (Phase 4)", () => {
  const sessionId = "scene-flow-test-session";

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams("level=N5");
  });

  afterEach(() => {
    cleanup();
  });

  it("handles missing session gracefully by falling back to a valid default session", () => {
    // Note: sessionStorage is empty
    render(<ListeningScenesPlayPage />);

    // Should render without throwing and show booklet header
    expect(screen.getByText("AUDIO LISTENING SCENE · もんだい 1・2")).toBeTruthy();
    expect(screen.getByTestId("scene-image-container")).toBeTruthy();
    expect(screen.getByTestId("audio-dialogue-sequence")).toBeTruthy();
  });

  it("renders scene image with 4 coordinate badges and locks answer options during audio sequence", () => {
    const bagScene = ALL_LISTENING_SCENES.find((s) => s.id === "n5-scene-bag-shelf")!;
    const session: ListeningSceneSession = {
      ...createListeningSceneSession([bagScene], { levels: ["N5"], sceneCount: 1, mode: "exam" }, () => 0.5),
      sessionId,
      phase: "audio-playing",
    };
    saveGameSession("jlpt-scene", sessionId, session);

    render(<ListeningScenesPlayPage />);

    // Check scene image container and 4 numbered badges
    const imageContainer = screen.getByTestId("scene-image-container");
    expect(imageContainer).toBeTruthy();
    [1, 2, 3, 4].forEach((num) => {
      const badge = screen.getByTestId(`scene-target-badge-${num}`);
      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe(String(num));
    });

    // Lock notice should be visible
    expect(screen.getByTestId("audio-lock-notice")).toBeTruthy();
    expect(
      screen.getByText(/音声再生中 — 音声が終わると選択肢が解答可能になります/i)
    ).toBeTruthy();

    // All 4 primary options must be disabled
    [1, 2, 3, 4].forEach((num) => {
      const optBtn = screen.getByTestId(`primary-option-${num}`) as HTMLButtonElement;
      expect(optBtn.disabled).toBe(true);
    });

    // Clicking an option while locked should do nothing
    const opt3 = screen.getByTestId("primary-option-3");
    fireEvent.click(opt3);
    // Notice must still be present and phase not answered
    expect(screen.getByTestId("audio-lock-notice")).toBeTruthy();
    expect(screen.queryByText(/【 選択肢の消去ロジック/i)).toBeNull();
  });

  it("advances through audio sequence with fake timers, unlocks options, and allows answering", async () => {
    vi.useFakeTimers();

    const bagScene = ALL_LISTENING_SCENES.find((s) => s.id === "n5-scene-bag-shelf")!;
    const session: ListeningSceneSession = {
      ...createListeningSceneSession([bagScene], { levels: ["N5"], sceneCount: 1, mode: "exam" }, () => 0.5),
      sessionId,
      phase: "intro",
    };
    saveGameSession("jlpt-scene", sessionId, session);

    render(<ListeningScenesPlayPage />);

    // Initial state: audio dialogue sequence is mounted
    expect(screen.getByTestId("audio-dialogue-sequence")).toBeTruthy();

    // Advance timers so all audio sequence turns and pauses complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // After audio sequence finishes, lock notice should be gone and options enabled
    expect(screen.queryByTestId("audio-lock-notice")).toBeNull();
    const opt1 = screen.getByTestId("primary-option-1") as HTMLButtonElement;
    expect(opt1.disabled).toBe(false);

    vi.useRealTimers();
  });

  it("submits correct answer, displays positive feedback, elimination logic, transcript, and bonus questions", () => {
    const bagScene = ALL_LISTENING_SCENES.find((s) => s.id === "n5-scene-bag-shelf")!;
    // Seed with phase = answering (audio finished)
    const session: ListeningSceneSession = {
      ...createListeningSceneSession([bagScene], { levels: ["N5"], sceneCount: 1, mode: "exam" }, () => 0.5),
      sessionId,
      phase: "answering",
    };
    saveGameSession("jlpt-scene", sessionId, session);

    render(<ListeningScenesPlayPage />);

    // Primary question text
    expect(screen.getByText(/店の人は、どのかばんを取りますか。/i)).toBeTruthy();

    // Answer with Option 3 (correct answer for n5-scene-bag-shelf: large black bag)
    const opt3 = screen.getByTestId("primary-option-3");
    fireEvent.click(opt3);

    // Feedback banner
    expect(screen.getByText(/正解！ Correct!/i)).toBeTruthy();

    // English elimination explanation revealed
    expect(screen.getByText(/【 選択肢の消去ロジック · Elimination Logic & Explanation 】/i)).toBeTruthy();
    expect(
      screen.getByText(/The top-shelf request narrows the choices to the four numbered bags/i)
    ).toBeTruthy();

    // Full Dialogue transcript revealed
    expect(screen.getByText(/会話スクリプト · Full Spoken Dialogue Transcript/i)).toBeTruthy();
    expect(
      screen.getByText(/すみません、その上の黒いかばんを取ってください。/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Excuse me, please get that black bag on the top shelf./i)
    ).toBeTruthy();

    // Toggle bonus questions
    const toggleBonusBtn = screen.getByTestId("toggle-bonus-btn");
    expect(toggleBonusBtn).toBeTruthy();
    fireEvent.click(toggleBonusBtn);

    // Bonus question 1 appears
    expect(screen.getByText(/女の人がほしいかばんは、どこにありますか。/i)).toBeTruthy();

    // Answer bonus question 1 (option 1: 上の段 is correct)
    const bonusOpt1 = screen.getByTestId("bonus-bag-location-option-1");
    fireEvent.click(bonusOpt1);

    // Next Scene / Finish Drill button appears
    const finishBtn = screen.getByTestId("next-scene-btn");
    expect(finishBtn).toBeTruthy();
    expect(finishBtn.textContent).toContain("演習完了 · Finish Drill →");

    // Click finish -> transitions session to finished and renders completion card
    fireEvent.click(finishBtn);
    expect(screen.getByText(/聴解 演習完了！ · Listening Drill Completed/i)).toBeTruthy();
  });
});
