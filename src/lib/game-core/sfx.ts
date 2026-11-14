"use client";

export type GameSfxName =
  | "temple-bell-gong"
  | "victory-fanfare"
  | "correct-chime"
  | "incorrect-chime"
  | "card-flip";

const SFX_STORAGE_KEY = "kana-sfx-enabled";

export const SFX_PATHS: Record<GameSfxName, string> = {
  "temple-bell-gong": "/audio/sfx/temple-bell-gong.opus",
  "victory-fanfare": "/audio/sfx/victory-fanfare.opus",
  "correct-chime": "/audio/sfx/correct-chime.opus",
  "incorrect-chime": "/audio/sfx/incorrect-chime.opus",
  "card-flip": "/audio/sfx/card-flip.opus",
};

const SFX_VOLUMES: Record<GameSfxName, number> = {
  "temple-bell-gong": 0.55,
  "victory-fanfare": 0.6,
  "correct-chime": 0.65,
  "incorrect-chime": 0.6,
  "card-flip": 0.5,
};

let sfxEnabledState = true;

if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(SFX_STORAGE_KEY);
    if (saved !== null) {
      sfxEnabledState = saved === "true";
    }
  } catch {
    // Ignore storage read errors
  }
}

const sfxListeners = new Set<() => void>();

function emitSfxChange() {
  for (const listener of sfxListeners) {
    listener();
  }
}

export function isSfxEnabled(): boolean {
  return sfxEnabledState;
}

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabledState = enabled;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SFX_STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage write errors
    }
  }
  emitSfxChange();
}

export function subscribeSfx(callback: () => void): () => void {
  sfxListeners.add(callback);
  return () => {
    sfxListeners.delete(callback);
  };
}

/**
 * Plays a non-blocking game UI sound effect if SFX are enabled.
 * Safe in SSR and test environments (jsdom).
 */
export function playGameSfx(
  name: GameSfxName,
  options?: { volume?: number }
): void {
  if (!sfxEnabledState) return;
  if (typeof window === "undefined" || typeof Audio === "undefined") return;

  try {
    const probe = new Audio();
    if (
      !probe.canPlayType ||
      (!probe.canPlayType('audio/ogg; codecs="opus"') &&
        !probe.canPlayType("audio/ogg") &&
        !probe.canPlayType("audio/webm") &&
        !probe.canPlayType("audio/mpeg"))
    ) {
      return;
    }

    const src = SFX_PATHS[name];
    const audio = new Audio(src);
    audio.volume = Math.max(
      0,
      Math.min(1, options?.volume ?? SFX_VOLUMES[name] ?? 0.6)
    );
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore browser autoplay policy or load errors silently
      });
    }
  } catch {
    // Ignore audio construction errors in restricted/headless environments
  }
}
