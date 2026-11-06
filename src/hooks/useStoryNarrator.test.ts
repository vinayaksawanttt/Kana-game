import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStoryNarrator } from "./useStoryNarrator";
import type { StoryAudioSegment } from "@/engine/audio";

const mockQueue: StoryAudioSegment[] = [
  {
    index: 0,
    paragraphIndex: 0,
    sentenceIndex: 0,
    id: "story:0:0",
    rawJa: "今日は天気がいいです。",
    ttsText: "今日は天気がいいです。",
    src: "/audio/stories/story/0.mp3",
  },
  {
    index: 1,
    paragraphIndex: 0,
    sentenceIndex: 1,
    id: "story:0:1",
    rawJa: "公園へ散歩に行きましょう。",
    ttsText: "公園へ散歩に行きましょう。",
    src: "/audio/stories/story/1.mp3",
  },
  {
    index: 2,
    paragraphIndex: 1,
    sentenceIndex: 0,
    id: "story:1:0",
    rawJa: "桜の花が咲いています。",
    ttsText: "桜の花が咲いています。",
    src: "/audio/stories/story/2.mp3",
  },
];

class MockAudio {
  src: string;
  playbackRate = 1;
  preload = "auto";
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static instances: MockAudio[] = [];

  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }

  play = vi.fn().mockImplementation(() => Promise.resolve());
  pause = vi.fn();
}

class MockSpeechSynthesisUtterance {
  text: string;
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static instances: MockSpeechSynthesisUtterance[] = [];

  constructor(text: string) {
    this.text = text;
    MockSpeechSynthesisUtterance.instances.push(this);
  }
}

describe("useStoryNarrator Hook", () => {
  const originalAudio = globalThis.Audio;
  const originalSpeechSynthesis = globalThis.speechSynthesis;
  const originalSpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;

  const mockSpeechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    MockAudio.instances = [];
    MockSpeechSynthesisUtterance.instances = [];
    window.localStorage.clear();

    // @ts-expect-error Mocking Audio for testing
    globalThis.Audio = MockAudio;
    // @ts-expect-error Mocking SpeechSynthesisUtterance for testing
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    Object.defineProperty(window, "speechSynthesis", {
      value: mockSpeechSynthesis,
      configurable: true,
      writable: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.Audio = originalAudio;
    globalThis.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    Object.defineProperty(window, "speechSynthesis", {
      value: originalSpeechSynthesis,
      configurable: true,
      writable: true,
    });
  });

  it("initializes with stopped state, default 1x speed, and no active segment", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeSegmentIndex).toBeNull();
    expect(result.current.speed).toBe(1);
    expect(result.current.loopCurrentSentence).toBe(false);
  });

  it("reads persisted speed from localStorage on mount", () => {
    window.localStorage.setItem("nihongo-audio-speed", "1.25");
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    expect(result.current.speed).toBe(1.25);
  });

  it("plays passage starting from segment 0 on togglePlayPause", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeSegmentIndex).toBe(0);
    expect(MockAudio.instances.length).toBe(1);
    expect(MockAudio.instances[0]!.src).toBe("/audio/stories/story/0.mp3");
    expect(MockAudio.instances[0]!.play).toHaveBeenCalled();
  });

  it("advances automatically to the next sentence when audio finishes (passage sequencing)", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });

    expect(result.current.activeSegmentIndex).toBe(0);

    // Audio finishes playing segment 0
    act(() => {
      MockAudio.instances[0]!.onended?.();
    });

    // Before pause timer finishes
    expect(result.current.activeSegmentIndex).toBe(0);

    // 350ms passage transition delay
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.activeSegmentIndex).toBe(1);
    expect(MockAudio.instances.length).toBe(2);
    expect(MockAudio.instances[1]!.src).toBe("/audio/stories/story/1.mp3");
  });

  it("stops playback when the last sentence in the passage finishes", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    // Start directly at the last segment (index 2)
    act(() => {
      result.current.playSegment(2);
    });

    expect(result.current.activeSegmentIndex).toBe(2);

    act(() => {
      MockAudio.instances[0]!.onended?.();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeSegmentIndex).toBeNull();
  });

  it("falls back to Web Speech API when static MP3 fails to load or play", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });

    expect(MockAudio.instances.length).toBe(1);

    // Trigger audio error (e.g. 404 missing static MP3)
    act(() => {
      MockAudio.instances[0]!.onerror?.();
    });

    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(MockSpeechSynthesisUtterance.instances.length).toBe(1);
    const utterance = MockSpeechSynthesisUtterance.instances[0]!;
    expect(utterance.text).toBe("今日は天気がいいです。");
    expect(utterance.lang).toBe("ja-JP");

    // Utterance finishes speaking -> advances to next sentence
    act(() => {
      utterance.onend?.();
      vi.advanceTimersByTime(350);
    });

    expect(result.current.activeSegmentIndex).toBe(1);
  });

  it("plays a single sentence and does not auto-advance in single mode", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.playSegment(1);
    });

    expect(result.current.activeSegmentIndex).toBe(1);
    expect(MockAudio.instances[0]!.src).toBe("/audio/stories/story/1.mp3");

    act(() => {
      MockAudio.instances[0]!.onended?.();
      vi.advanceTimersByTime(500);
    });

    // Should not advance to index 2
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeSegmentIndex).toBeNull();
  });

  it("replays the same sentence after 1500ms delay when shadow loop is enabled", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.toggleLoop();
    });

    expect(result.current.loopCurrentSentence).toBe(true);

    act(() => {
      result.current.playSegment(0);
    });

    act(() => {
      MockAudio.instances[0]!.onended?.();
    });

    // After 350ms, it should not have advanced to 1
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(MockAudio.instances.length).toBe(1);

    // After full 1500ms shadow loop delay, sentence 0 replays
    act(() => {
      vi.advanceTimersByTime(1150);
    });

    expect(MockAudio.instances.length).toBe(2);
    expect(MockAudio.instances[1]!.src).toBe("/audio/stories/story/0.mp3");
    expect(result.current.activeSegmentIndex).toBe(0);
  });

  it("updates playback speed, persists to localStorage, and updates audio rate", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });

    act(() => {
      result.current.setSpeed(1.25);
    });

    expect(result.current.speed).toBe(1.25);
    expect(window.localStorage.getItem("nihongo-audio-speed")).toBe("1.25");
    expect(MockAudio.instances[0]!.playbackRate).toBe(1.25);
  });

  it("pauses and resumes playback correctly with togglePlayPause", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });
    expect(result.current.isPlaying).toBe(true);

    // Pause
    act(() => {
      result.current.togglePlayPause();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(MockAudio.instances[0]!.pause).toHaveBeenCalled();

    // Resume
    act(() => {
      result.current.togglePlayPause();
    });
    expect(result.current.isPlaying).toBe(true);
    expect(MockAudio.instances[0]!.play).toHaveBeenCalled();
  });

  it("steps forward and backward with nextSegment and prevSegment", () => {
    const { result } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.nextSegment();
    });
    expect(result.current.activeSegmentIndex).toBe(0);

    act(() => {
      result.current.nextSegment();
    });
    expect(result.current.activeSegmentIndex).toBe(1);

    act(() => {
      result.current.prevSegment();
    });
    expect(result.current.activeSegmentIndex).toBe(0);
  });

  it("cleans up timers, pauses audio, and cancels speech synthesis on stop and unmount", () => {
    const { result, unmount } = renderHook(() => useStoryNarrator(mockQueue));

    act(() => {
      result.current.togglePlayPause();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeSegmentIndex).toBeNull();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(MockAudio.instances[0]!.pause).toHaveBeenCalled();

    // Unmount safely
    unmount();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
});

