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

  it("renders Transcript Mode (Mode A) by default with all lines visible", () => {
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

    // Mode Switcher
    expect(screen.getByRole("button", { name: /Switch to Transcript Mode/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Switch to Animated Playback Mode/i })).not.toBeNull();

    // All 3 sentences should be visible in Transcript Mode
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

  it("switches to Full Scene Playback Mode (Mode B) and reveals messages progressively", async () => {
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

    // Click Play Full Scene
    const playBtn = screen.getByRole("button", { name: /Play full scene audio/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Button should now allow stopping the scene
    expect(screen.getByRole("button", { name: /Stop full scene audio/i })).not.toBeNull();

    // Sticky playback control bar should be in the DOM
    expect(screen.getByLabelText(/Pause playback/i)).not.toBeNull();
    expect(screen.getByLabelText(/Previous sentence/i)).not.toBeNull();
    expect(screen.getByLabelText(/Next sentence/i)).not.toBeNull();
    expect(screen.getByLabelText(/Replay current sentence/i)).not.toBeNull();
    expect(screen.getByText(/Sentence 1 of 3/i)).not.toBeNull();

    // The first line should be playing
    expect(mockPlaySentenceAsync).toHaveBeenCalledWith(
      "おはようございます。",
      expect.objectContaining({ audioSrc: "/audio/l1_d1_1.opus" })
    );
  });

  it("supports pausing and resuming in Playback Mode", async () => {
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

    // Start playback
    const playBtn = screen.getByRole("button", { name: /Play full scene audio/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Pause playback
    const pauseBtn = screen.getByLabelText(/Pause playback/i);
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    expect(mockStopAudio).toHaveBeenCalled();
    // Resume button should now appear
    const resumeBtn = screen.getByLabelText(/Resume playback/i);
    expect(resumeBtn).not.toBeNull();

    // Resume playback
    await act(async () => {
      fireEvent.click(resumeBtn);
    });

    expect(screen.getByLabelText(/Pause playback/i)).not.toBeNull();
  });

  it("supports stepping to next and previous sentences in Playback Mode", async () => {
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

    // Switch to playback
    const playbackModeTab = screen.getByRole("button", { name: /Switch to Animated Playback Mode/i });
    await act(async () => {
      fireEvent.click(playbackModeTab);
    });

    // Step to Next sentence
    const nextBtn = screen.getByLabelText(/Next sentence/i);
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(mockPlaySentenceAsync).toHaveBeenCalledWith(
      "おはよう、メアリーさん。",
      expect.objectContaining({ audioSrc: "/audio/l1_d1_2.opus" })
    );
    expect(screen.getByText(/Sentence 2 of 3/i)).not.toBeNull();

    // Step back to Previous sentence
    const prevBtn = screen.getByLabelText(/Previous sentence/i);
    await act(async () => {
      fireEvent.click(prevBtn);
    });

    expect(mockPlaySentenceAsync).toHaveBeenCalledWith(
      "おはようございます。",
      expect.objectContaining({ audioSrc: "/audio/l1_d1_1.opus" })
    );
    expect(screen.getByText(/Sentence 1 of 3/i)).not.toBeNull();
  });

  it("returns cleanly to Transcript Mode when clicking the Transcript button", async () => {
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

    // Start playback
    const playBtn = screen.getByRole("button", { name: /Play full scene audio/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    expect(screen.getByText(/Sentence 1 of 3/i)).not.toBeNull();

    // Click Return to Transcript
    const transcriptBtn = screen.getByLabelText(/View full transcript/i);
    await act(async () => {
      fireEvent.click(transcriptBtn);
    });

    expect(mockStopAudio).toHaveBeenCalled();
    // Play Full Scene button is back
    expect(screen.getByRole("button", { name: /Play full scene audio/i })).not.toBeNull();
    // Sticky bar should be unmounted
    expect(screen.queryByLabelText(/Previous sentence/i)).toBeNull();
  });
});
