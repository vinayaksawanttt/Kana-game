import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { VisualNovelStage } from "../VisualNovelStage";
import { VnScenarioReview } from "../VnScenarioReview";
import { DIRECTIONS_SCENARIO_META, DIRECTIONS_NODES } from "@/data/dialogue/scenarios/directions-mcdonalds";
import { DialogueSession } from "@/data/dialogue/types";

// Mock audio hook
vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentence: vi.fn(),
    isPlaying: false,
    activeKey: null,
  }),
}));

// Mock SRS service
vi.mock("@/lib/srs/service", () => ({
  addVocabularyToSrs: vi.fn().mockResolvedValue("vocab:test"),
}));

describe("Visual Novel Architecture & Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders background, character sprite, dialogue box, and response choices for directions-mcdonalds", () => {
    const node = DIRECTIONS_NODES["node-1-initiation"]!;
    const onSelectChoice = vi.fn();
    const onRestart = vi.fn();

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={1}
        totalScore={0}
        atmosphereValue={65}
        onSelectChoice={onSelectChoice}
        onRestart={onRestart}
      />
    );

    // Verify background image rendered
    const bgImg = screen.getByAltText("Visual novel scene background");
    expect(bgImg).toBeTruthy();
    expect(bgImg.getAttribute("src")).toContain("shibuya-square.webp");

    // Verify character sprite rendered
    const spriteImg = screen.getByAltText(/佐藤さん - neutral/i);
    expect(spriteImg).toBeTruthy();
    expect(spriteImg.getAttribute("src")).toContain("neutral.webp");

    // Verify dialogue text rendered
    expect(
      screen.getByText("（歩きながらスマートフォンを見ています。声をかけられそうです。）")
    ).toBeTruthy();

    // Verify response choices (4 options)
    expect(screen.getByText("すみません、ちょっといいですか？")).toBeTruthy();
    expect(screen.getByText("あのー、マックはどこ？")).toBeTruthy();

    // Click on choice
    fireEvent.click(screen.getByText("すみません、ちょっといいですか？"));
    expect(onSelectChoice).toHaveBeenCalledWith(node.choices[0]);
  });

  it("supports keyboard 1-4 selection in VnChoiceOverlay", () => {
    const node = DIRECTIONS_NODES["node-1-initiation"]!;
    const onSelectChoice = vi.fn();

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={1}
        totalScore={0}
        atmosphereValue={65}
        onSelectChoice={onSelectChoice}
        onRestart={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: "2" });
    expect(onSelectChoice).toHaveBeenCalledWith(node.choices[1]);
  });

  it("updates character sprite to pointing when directions are given", () => {
    const node = DIRECTIONS_NODES["node-3-npc-directions"]!;

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={3}
        totalScore={100}
        atmosphereValue={75}
        onSelectChoice={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    const spriteImg = screen.getByAltText(/佐藤さん - pointing/i);
    expect(spriteImg).toBeTruthy();
    expect(spriteImg.getAttribute("src")).toContain("pointing.webp");
  });

  it("renders in-scene assessment directly inside the visual novel stage when finished", () => {
    const node = DIRECTIONS_NODES["node-end-perfect"]!;
    const session: DialogueSession = {
      sessionId: "test-session",
      scenario: DIRECTIONS_SCENARIO_META,
      currentNodeId: "node-end-perfect",
      turns: [
        {
          nodeId: "node-1-initiation",
          chosenOptionId: "c1-polite",
          chosenTextJa: "すみません、ちょっといいですか？",
          chosenTextEn: "Excuse me, do you have a moment?",
          tier: "polite",
          pointsEarned: 100,
          npcReplyJa: "はい、何でしょうか？",
          npcReplyEn: "Yes, how can I help you?",
          feedbackEn: "Perfect polite approach.",
        },
      ],
      totalScore: 100,
      atmosphereMeter: 80,
      isFinished: true,
      finalEndingType: "perfect",
      startedAt: Date.now() - 5000,
      endedAt: Date.now(),
    };

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={2}
        totalScore={100}
        atmosphereValue={80}
        isFinished={true}
        session={session}
        onSelectChoice={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    // Background still visible behind assessment
    const bgImg = screen.getByAltText("Visual novel scene background");
    expect(bgImg).toBeTruthy();

    // In-scene assessment overlay elements
    expect(screen.getByText("大成功！完璧なコミュニケーション")).toBeTruthy();
    expect(screen.getByText("Replay Scene")).toBeTruthy();
  });

  it("toggles fullscreen mode from HUD", () => {
    const node = DIRECTIONS_NODES["node-1-initiation"]!;

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={1}
        totalScore={0}
        atmosphereValue={65}
        onSelectChoice={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    const fsBtn = screen.getByLabelText("Fullscreen View");
    expect(fsBtn).toBeTruthy();
    fireEvent.click(fsBtn);
    expect(screen.getByLabelText("Exit Fullscreen")).toBeTruthy();
  });

  it("resolves Sato-san anime expressive SFX paths from the asset registry", async () => {
    const { getScenarioSfxUrl } = await import("@/data/dialogue/assets");
    expect(getScenarioSfxUrl("directions-mcdonalds", "happy")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-happy.mp3"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "confused")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-confused.mp3"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "surprised")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-surprised.mp3"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "atmosphere-bonus")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/atmosphere-bonus.mp3"
    );
  });

  it("resolves Sato-san pre-generated dialogue audio paths from the asset registry", async () => {
    const { getScenarioDialogueAudioUrl } = await import("@/data/dialogue/assets");
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-2-npc-reply-polite")
    ).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-polite.mp3"
    );
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-end-perfect")
    ).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-perfect.mp3"
    );
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-1-initiation")
    ).toBeUndefined();
  });

  it("opens and closes the dialogue backlog drawer from the HUD button", () => {
    const node = DIRECTIONS_NODES["node-1-initiation"]!;

    render(
      <VisualNovelStage
        scenario={DIRECTIONS_SCENARIO_META}
        currentNode={node}
        turnNumber={1}
        totalScore={0}
        atmosphereValue={65}
        onSelectChoice={vi.fn()}
        onRestart={vi.fn()}
      />
    );

    const backlogBtn = screen.getByLabelText("Backlog History");
    expect(backlogBtn).toBeTruthy();

    fireEvent.click(backlogBtn);
    expect(screen.getByText(/Dialogue Backlog/i)).toBeTruthy();

    const closeBtn = screen.getByLabelText("Close backlog");
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Dialogue Backlog/i)).toBeNull();
  });
});
