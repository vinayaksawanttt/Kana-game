import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  SFX_PATHS,
  isSfxEnabled,
  playGameSfx,
  setSfxEnabled,
  subscribeSfx,
} from "./sfx";

describe("Game SFX Engine (sfx.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    setSfxEnabled(true);
    vi.restoreAllMocks();
  });

  it("maps all 5 custom ElevenLabs sound effects to /audio/sfx/*.opus", () => {
    expect(SFX_PATHS["temple-bell-gong"]).toBe("/audio/sfx/temple-bell-gong.opus");
    expect(SFX_PATHS["victory-fanfare"]).toBe("/audio/sfx/victory-fanfare.opus");
    expect(SFX_PATHS["correct-chime"]).toBe("/audio/sfx/correct-chime.opus");
    expect(SFX_PATHS["incorrect-chime"]).toBe("/audio/sfx/incorrect-chime.opus");
    expect(SFX_PATHS["card-flip"]).toBe("/audio/sfx/card-flip.opus");
  });

  it("persists SFX mute toggle to localStorage and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSfx(listener);

    expect(isSfxEnabled()).toBe(true);

    setSfxEnabled(false);
    expect(isSfxEnabled()).toBe(false);
    expect(localStorage.getItem("kana-sfx-enabled")).toBe("false");
    expect(listener).toHaveBeenCalledTimes(1);

    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
    expect(localStorage.getItem("kana-sfx-enabled")).toBe("true");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("plays audio when enabled and skips when muted", () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const createdSrcs: string[] = [];

    class MockAudio {
      src: string;
      volume = 1;
      constructor(src = "") {
        this.src = src;
        if (src) createdSrcs.push(src);
      }
      canPlayType(type: string) {
        return type.includes("audio/ogg") || type.includes("audio/mpeg") || type.includes("audio/webm") ? "probably" : "";
      }
      play() {
        return playMock();
      }
    }

    vi.stubGlobal("Audio", MockAudio);

    playGameSfx("correct-chime");
    expect(createdSrcs).toContain("/audio/sfx/correct-chime.opus");
    expect(playMock).toHaveBeenCalledTimes(1);

    // Mute SFX
    setSfxEnabled(false);
    playGameSfx("victory-fanfare");
    expect(playMock).toHaveBeenCalledTimes(1);
  });
});
