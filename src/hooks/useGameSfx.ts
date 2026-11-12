"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  isSfxEnabled,
  playGameSfx,
  setSfxEnabled,
  subscribeSfx,
  type GameSfxName,
} from "@/lib/game-core/sfx";

function getServerSnapshot(): boolean {
  return true;
}

export function useGameSfx() {
  const sfxEnabled = useSyncExternalStore(
    subscribeSfx,
    isSfxEnabled,
    getServerSnapshot
  );

  const toggleSfx = useCallback(() => {
    setSfxEnabled(!isSfxEnabled());
  }, []);

  const playSfx = useCallback(
    (name: GameSfxName, options?: { volume?: number }) => {
      playGameSfx(name, options);
    },
    []
  );

  const playCorrect = useCallback(() => playGameSfx("correct-chime"), []);
  const playIncorrect = useCallback(() => playGameSfx("incorrect-chime"), []);
  const playCardFlip = useCallback(() => playGameSfx("card-flip"), []);
  const playVictory = useCallback(() => playGameSfx("victory-fanfare"), []);
  const playGong = useCallback(() => playGameSfx("temple-bell-gong"), []);

  return {
    sfxEnabled,
    setSfxEnabled,
    toggleSfx,
    playSfx,
    playCorrect,
    playIncorrect,
    playCardFlip,
    playVictory,
    playGong,
  };
}
