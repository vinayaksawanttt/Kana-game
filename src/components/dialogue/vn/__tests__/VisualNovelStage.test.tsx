import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { VisualNovelStage } from "../VisualNovelStage";
import { VnScenarioReview } from "../VnScenarioReview";
import { DIRECTIONS_SCENARIO_META, DIRECTIONS_NODES } from "@/data/dialogue/scenarios/directions-mcdonalds";
import { FIRST_DATE_SAKURA_SCENARIO_META } from "@/data/dialogue/scenarios/first-date-sakura";
import { VnDialogueBox } from "../VnDialogueBox";
import { VnChoiceOverlay } from "../VnChoiceOverlay";
import { VnEndAssessmentOverlay } from "../VnEndAssessmentOverlay";
import { getScenarioCharacterSpriteUrl } from "@/data/dialogue/assets";
import { DialogueSession } from "@/data/dialogue/types";

// Mock audio hook
vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentence: vi.fn(),
    stopAudio: vi.fn(),
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
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-happy.opus"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "confused")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-confused.opus"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "surprised")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/sato-surprised.opus"
    );
    expect(getScenarioSfxUrl("directions-mcdonalds", "atmosphere-bonus")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/atmosphere-bonus.opus"
    );
  });

  it("resolves Sato-san pre-generated dialogue audio paths from the asset registry", async () => {
    const { getScenarioDialogueAudioUrl } = await import("@/data/dialogue/assets");
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-2-npc-reply-polite")
    ).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-2-npc-reply-polite.opus"
    );
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-end-perfect")
    ).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/dialogue/node-end-perfect.opus"
    );
    expect(
      getScenarioDialogueAudioUrl("directions-mcdonalds", "node-1-initiation")
    ).toBeUndefined();
  });

  it("resolves background ambient soundscape Opus and MP3 fallback sources", async () => {
    const { getScenarioAmbientAudioSources, getScenarioAmbientAudioUrl } = await import(
      "@/data/dialogue/assets"
    );
    expect(getScenarioAmbientAudioUrl("directions-mcdonalds")).toBe(
      "/assets/dialogue-quest/directions-mcdonalds/sfx/ambience.opus"
    );
    expect(getScenarioAmbientAudioSources("directions-mcdonalds")).toEqual({
      opus: "/assets/dialogue-quest/directions-mcdonalds/sfx/ambience.opus",
      mp3: "/assets/dialogue-quest/directions-mcdonalds/sfx/ambience.mp3",
    });
    expect(getScenarioAmbientAudioSources("client-apology-delay")).toEqual({
      opus: "/assets/dialogue-quest/client-apology-delay/sfx/ambience.opus",
      mp3: "/assets/dialogue-quest/client-apology-delay/sfx/ambience.mp3",
    });
  });

  it("resolves client-apology-delay multi-character sprites, backgrounds, SFX, and dialogue audio", async () => {
    const {
      getScenarioBackgroundUrl,
      getScenarioCharacterSpriteUrl,
      getScenarioSfxUrl,
      getScenarioDialogueAudioUrl,
      getScenarioChoiceAudioUrl,
    } = await import("@/data/dialogue/assets");

    expect(getScenarioBackgroundUrl("client-apology-delay", "client-lobby-rain")).toBe(
      "/assets/dialogue-quest/client-apology-delay/backgrounds/client-lobby-rain.webp"
    );
    expect(getScenarioBackgroundUrl("client-apology-delay", "executive-meeting-room")).toBe(
      "/assets/dialogue-quest/client-apology-delay/backgrounds/executive-meeting-room.webp"
    );
    expect(getScenarioCharacterSpriteUrl("client-apology-delay", "neutral", "yoshimura")).toBe(
      "/assets/dialogue-quest/client-apology-delay/characters/yoshimura/neutral.webp"
    );
    expect(getScenarioCharacterSpriteUrl("client-apology-delay", "worried", "saito")).toBe(
      "/assets/dialogue-quest/client-apology-delay/characters/saito/worried.webp"
    );
    expect(getScenarioCharacterSpriteUrl("client-apology-delay", "stern", "hasegawa")).toBe(
      "/assets/dialogue-quest/client-apology-delay/characters/hasegawa/stern.webp"
    );
    expect(getScenarioSfxUrl("client-apology-delay", "stern", "hasegawa")).toBe(
      "/assets/dialogue-quest/client-apology-delay/sfx/hasegawa-stern.opus"
    );
    expect(getScenarioDialogueAudioUrl("client-apology-delay", "client-node-1-lobby")).toBe(
      "/assets/dialogue-quest/client-apology-delay/dialogue/client-node-1-lobby.opus"
    );
    expect(getScenarioChoiceAudioUrl("client-apology-delay", "ca1-respectful-greeting")).toBe(
      "/assets/dialogue-quest/client-apology-delay/choices/ca1-respectful-greeting.opus"
    );
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

  it("hides dialogue replay speaker button when autoPlayAudio is on, and shows it when off", () => {
    // Case 1: autoPlayAudio = true -> speaker button removed
    const { unmount } = render(
      <VnDialogueBox
        speakerNameJa="佐藤さん"
        speakerNameEn="Sato-san"
        textJa="こんにちは"
        readingHiragana="こんにちは"
        textEn="Hello"
        isSpeaking={false}
        showFurigana={true}
        showEnglish={true}
        autoPlayAudio={true}
        onReplayAudio={vi.fn()}
        onToggleFurigana={vi.fn()}
        onToggleEnglish={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("Replay audio")).toBeNull();
    unmount();

    // Case 2: autoPlayAudio = false -> speaker button rendered
    render(
      <VnDialogueBox
        speakerNameJa="佐藤さん"
        speakerNameEn="Sato-san"
        textJa="こんにちは"
        readingHiragana="こんにちは"
        textEn="Hello"
        isSpeaking={false}
        showFurigana={true}
        showEnglish={true}
        autoPlayAudio={false}
        onReplayAudio={vi.fn()}
        onToggleFurigana={vi.fn()}
        onToggleEnglish={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Replay audio")).toBeTruthy();
  });

  it("verifies Episode 10 Misaki-san has hoverExpression set to embarrased", () => {
    expect(FIRST_DATE_SAKURA_SCENARIO_META.hoverExpression).toBe("embarrased");
    const hoverSprite = getScenarioCharacterSpriteUrl("first-date-sakura", FIRST_DATE_SAKURA_SCENARIO_META.hoverExpression);
    expect(hoverSprite).toContain("embarrassed.webp");
  });

  it("scales VnDialogueBox and VnChoiceOverlay appropriately when isFullscreen is true", () => {
    // VnDialogueBox in normal mode
    const { container: normalBox, unmount: unmountBox1 } = render(
      <VnDialogueBox
        speakerNameJa="佐藤さん"
        speakerNameEn="Sato-san"
        textJa="こんにちは"
        readingHiragana="こんにちは"
        textEn="Hello"
        isSpeaking={false}
        showFurigana={true}
        showEnglish={true}
        isFullscreen={false}
        onReplayAudio={vi.fn()}
        onToggleFurigana={vi.fn()}
        onToggleEnglish={vi.fn()}
      />
    );
    expect((normalBox.firstChild as HTMLElement).className).toContain("max-w-4xl");
    unmountBox1();

    // VnDialogueBox in fullscreen mode
    const { container: fullscreenBox, unmount: unmountBox2 } = render(
      <VnDialogueBox
        speakerNameJa="佐藤さん"
        speakerNameEn="Sato-san"
        textJa="こんにちは"
        readingHiragana="こんにちは"
        textEn="Hello"
        isSpeaking={false}
        showFurigana={true}
        showEnglish={true}
        isFullscreen={true}
        onReplayAudio={vi.fn()}
        onToggleFurigana={vi.fn()}
        onToggleEnglish={vi.fn()}
      />
    );
    expect((fullscreenBox.firstChild as HTMLElement).className).toContain("max-w-5xl");
    unmountBox2();

    // VnChoiceOverlay in normal mode vs fullscreen
    const mockChoices = DIRECTIONS_NODES["node-1-initiation"]!.choices;
    const { container: normalChoices, unmount: unmountChoices1 } = render(
      <VnChoiceOverlay
        choices={mockChoices}
        onSelectChoice={vi.fn()}
        onPreviewAudio={vi.fn()}
        showEnglish={true}
        isFullscreen={false}
      />
    );
    expect((normalChoices.firstChild as HTMLElement).className).toContain("max-w-2xl");
    unmountChoices1();

    const { container: fullscreenChoices, unmount: unmountChoices2 } = render(
      <VnChoiceOverlay
        choices={mockChoices}
        onSelectChoice={vi.fn()}
        onPreviewAudio={vi.fn()}
        showEnglish={true}
        isFullscreen={true}
      />
    );
    expect((fullscreenChoices.firstChild as HTMLElement).className).toContain("max-w-4xl");
    unmountChoices2();

    // VnEndAssessmentOverlay in normal mode vs fullscreen
    const mockSession: DialogueSession = {
      scenarioId: "directions-mcdonalds",
      currentNodeId: "node-end-directions-success",
      turns: [],
      atmosphereMeter: 80,
      totalScore: 120,
      isFinished: true,
      finalEndingType: "success",
    };

    const { container: normalAssessment, unmount: unmountAssessment1 } = render(
      <VnEndAssessmentOverlay
        session={mockSession}
        scenario={DIRECTIONS_SCENARIO_META}
        isFullscreen={false}
        onRestart={vi.fn()}
      />
    );
    // Modal card is the inner container inside pointer-events-none wrapper
    const normalModal = normalAssessment.querySelector(".pointer-events-auto");
    expect(normalModal?.className).toContain("max-w-xl");
    unmountAssessment1();

    const { container: fullscreenAssessment, unmount: unmountAssessment2 } = render(
      <VnEndAssessmentOverlay
        session={mockSession}
        scenario={DIRECTIONS_SCENARIO_META}
        isFullscreen={true}
        onRestart={vi.fn()}
      />
    );
    const fullscreenModal = fullscreenAssessment.querySelector(".pointer-events-auto");
    expect(fullscreenModal?.className).toContain("max-w-5xl");
    unmountAssessment2();
  });
});
