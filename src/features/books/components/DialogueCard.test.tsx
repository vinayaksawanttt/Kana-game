import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DialogueCard } from "./DialogueCard";
import { type BookDialogueScene, type BookLesson } from "@/data/books";

// Mock audio hook
const mockPlaySentenceAsync = vi.fn().mockResolvedValue(undefined);
const mockStopAudio = vi.fn();
let mockIsPlaying = false;
let mockActiveKey: string | null = null;

vi.mock("@/hooks/useJapaneseAudio", () => ({
  useJapaneseAudio: () => ({
    playSentenceAsync: mockPlaySentenceAsync,
    stopAudio: mockStopAudio,
    isPlaying: mockIsPlaying,
    activeKey: mockActiveKey,
  }),
}));

const mockScene: BookDialogueScene = {
  id: "scene-1",
  sceneNumber: "1",
  setting: "At the university campus",
  lines: [
    {
      speaker: "Mary",
      speakerJa: "メアリー",
      ja: "おはようございます。",
      en: "Good morning.",
      audioSrc: "/audio/l1_d1_1.opus",
    },
    {
      speaker: "Takeshi",
      speakerJa: "たけし",
      ja: "おはよう、メアリーさん。",
      en: "Good morning, Mary.",
      audioSrc: "/audio/l1_d1_2.opus",
    },
    {
      speaker: "Mary",
      speakerJa: "メアリー",
      ja: "きょうはいい天気ですね。",
      en: "The weather is nice today, isn't it?",
      audioSrc: "/audio/l1_d1_3.opus",
    },
  ],
};

const mockLesson: BookLesson = {
  lessonNumber: 1,
  title: "New Friends",
  japaneseTitle: "あたらしいともだち",
  grammar: [],
  vocabulary: [],
  kanji: [],
  practice: [],
  dialogues: [mockScene],
  stats: {
    vocabularyCount: 0,
    kanjiCount: 0,
    grammarCount: 0,
    dialogueCount: 1,
    practiceCount: 0,
  },
};

describe("DialogueCard component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlaySentenceAsync.mockImplementation(() => new Promise(() => {}));
    mockIsPlaying = false;
    mockActiveKey = null;
  });

  afterEach(cleanup);

  it("renders dialogue card with all lines visible by default in stable container", () => {
    render(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        dictMaps={null}
        kuromojiLineMap={{}}
        onStartRoleplay={vi.fn()}
      />
    );

    // Header elements
    expect(screen.getByText(/Dialogue 1/i)).not.toBeNull();
    expect(screen.getByText(/3 lines/i)).not.toBeNull();
    expect(screen.getByText(/At the university campus/i)).not.toBeNull();

    // All 3 sentences should be visible in default view
    expect(screen.getByText("おはようございます。")).not.toBeNull();
    expect(screen.getByText("おはよう、メアリーさん。")).not.toBeNull();
    expect(screen.getByText("きょうはいい天気ですね。")).not.toBeNull();

    // English translations visible
    expect(screen.getByText("Good morning.")).not.toBeNull();
    expect(screen.getByText("Good morning, Mary.")).not.toBeNull();
    expect(screen.getByText("The weather is nice today, isn't it?")).not.toBeNull();

    // Play Full Scene button is ready
    expect(screen.getByRole("button", { name: /Play full scene audio/i })).not.toBeNull();
  });

  it("delegates playback to onTogglePlayScene when Play Full Scene is clicked without starting conflicting local audio", async () => {
    const onTogglePlayScene = vi.fn();
    render(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        isPlayingScene={false}
        playingLineIndex={-1}
        dictMaps={null}
        kuromojiLineMap={{}}
        onTogglePlayScene={onTogglePlayScene}
        onStartRoleplay={vi.fn()}
      />
    );

    const playBtn = screen.getByRole("button", { name: /Play full scene audio/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Parent toggle was called
    expect(onTogglePlayScene).toHaveBeenCalledTimes(1);
    // Local loop did NOT start concurrently
    expect(mockPlaySentenceAsync).not.toHaveBeenCalled();
  });

  it("reveals messages progressively one by one as playingLineIndex advances from parent", () => {
    const { rerender } = render(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        isPlayingScene={true}
        playingLineIndex={0}
        dictMaps={null}
        kuromojiLineMap={{}}
        onStartRoleplay={vi.fn()}
      />
    );

    // Line 0 is visible
    expect(screen.getByText("おはようございます。")).not.toBeNull();
    // Subsequent lines not revealed yet
    expect(screen.queryByText("おはよう、メアリーさん。")).toBeNull();
    expect(screen.queryByText("きょうはいい天気ですね。")).toBeNull();

    // Advance to line 1
    rerender(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        isPlayingScene={true}
        playingLineIndex={1}
        dictMaps={null}
        kuromojiLineMap={{}}
        onStartRoleplay={vi.fn()}
      />
    );

    // Both line 0 and line 1 are now revealed
    expect(screen.getByText("おはようございます。")).not.toBeNull();
    expect(screen.getByText("おはよう、メアリーさん。")).not.toBeNull();
    expect(screen.queryByText("きょうはいい天気ですね。")).toBeNull();

    // Advance to line 2 (last line of scene)
    rerender(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        isPlayingScene={true}
        playingLineIndex={2}
        dictMaps={null}
        kuromojiLineMap={{}}
        onStartRoleplay={vi.fn()}
      />
    );

    // All lines now visible
    expect(screen.getByText("おはようございます。")).not.toBeNull();
    expect(screen.getByText("おはよう、メアリーさん。")).not.toBeNull();
    expect(screen.getByText("きょうはいい天気ですね。")).not.toBeNull();
  });

  it("animates active speaker avatar with talking state during playback", () => {
    render(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={true}
        tapLookupEnabled={false}
        isPlayingScene={true}
        playingLineIndex={0}
        dictMaps={null}
        kuromojiLineMap={{}}
        onStartRoleplay={vi.fn()}
      />
    );

    // Mary is the speaker of line 0
    const maryAvatars = screen.getAllByRole("img", { name: /Mary Hart/i });
    expect(maryAvatars.length).toBeGreaterThan(0);
    // Line avatar should show speaking state
    const lineAvatar = maryAvatars.find((el) => el.getAttribute("data-speaking") === "true");
    expect(lineAvatar).not.toBeUndefined();
  });

  it("supports revealing English translations line by line in Listening Mode", () => {
    render(
      <DialogueCard
        scene={mockScene}
        lesson={mockLesson}
        level="N5"
        showEnglish={false}
        tapLookupEnabled={false}
        dictMaps={null}
        kuromojiLineMap={{}}
        learningMode="listening"
        onStartRoleplay={vi.fn()}
      />
    );

    // In listening mode without showEnglish, translations are concealed
    expect(screen.queryByText("Good morning.")).toBeNull();

    // Reveal English button is present
    const revealBtns = screen.getAllByRole("button", { name: /Reveal English/i });
    expect(revealBtns.length).toBe(3);

    // Click reveal on first line
    fireEvent.click(revealBtns[0]);
    expect(screen.getByText("Good morning.")).not.toBeNull();
  });
});
