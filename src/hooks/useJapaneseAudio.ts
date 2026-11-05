"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { resolveKanaAudio, toKanaAudioKey } from "@/engine/audio";

const STORAGE_KEY = "kana-autoplay-audio";

interface AudioState {
  isPlaying: boolean;
  activeKey: string | null;
  autoPlayEnabled: boolean;
}

let state: AudioState = {
  isPlaying: false,
  activeKey: null,
  autoPlayEnabled: true,
};

// Initialize autoPlayEnabled from localStorage if in browser
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      state.autoPlayEnabled = saved === "true";
    }
  } catch {
    // Ignore storage errors (private browsing, etc.)
  }
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function updateState(partial: Partial<AudioState>) {
  state = { ...state, ...partial };
  emitChange();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): AudioState {
  return state;
}

function getServerSnapshot(): AudioState {
  return {
    isPlaying: false,
    activeKey: null,
    autoPlayEnabled: true,
  };
}

let globalAudio: HTMLAudioElement | null = null;

function stopCurrentPlayback() {
  if (typeof window === "undefined") return;

  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
    globalAudio.onended = null;
    globalAudio.onerror = null;
  }

  if (typeof window.speechSynthesis !== "undefined") {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }

  updateState({ isPlaying: false, activeKey: null });
}

function fallbackToSpeech(ttsText: string, slug: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    updateState({ isPlaying: false, activeKey: null });
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onend = () => {
      updateState({ isPlaying: false, activeKey: null });
    };

    utterance.onerror = () => {
      updateState({ isPlaying: false, activeKey: null });
    };

    updateState({ isPlaying: true, activeKey: slug });
    window.speechSynthesis.speak(utterance);
  } catch {
    updateState({ isPlaying: false, activeKey: null });
  }
}

export function useJapaneseAudio() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setAutoPlayEnabled = useCallback((enabled: boolean) => {
    updateState({ autoPlayEnabled: enabled });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(enabled));
      } catch {
        // Ignore
      }
    }
  }, []);

  const stopAudio = useCallback(() => {
    stopCurrentPlayback();
  }, []);

  const playKana = useCallback((char: string, primaryRomaji?: string) => {
    if (typeof window === "undefined") return;

    stopCurrentPlayback();

    const payload = resolveKanaAudio({
      char,
      romaji: primaryRomaji ? [primaryRomaji] : undefined,
    });

    const slug = payload.slug;

    if (!globalAudio) {
      try {
        globalAudio = new Audio();
      } catch {
        // Audio constructor might fail in unsupported environments
        fallbackToSpeech(payload.ttsText, slug);
        return;
      }
    }

    const audio = globalAudio;
    audio.src = payload.src;

    let hasEndedOrErrored = false;

    audio.onended = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      updateState({ isPlaying: false, activeKey: null });
    };

    audio.onerror = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      fallbackToSpeech(payload.ttsText, slug);
    };

    updateState({ isPlaying: true, activeKey: slug });

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (hasEndedOrErrored) return;
          hasEndedOrErrored = true;
          fallbackToSpeech(payload.ttsText, slug);
        });
      }
    } catch {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      fallbackToSpeech(payload.ttsText, slug);
    }
  }, []);

  // Cleanup on unmount if needed
  useEffect(() => {
    return () => {
      // Keep state intact; listeners unsubscribed automatically
    };
  }, []);

  return {
    isPlaying: current.isPlaying,
    activeKey: current.activeKey,
    autoPlayEnabled: current.autoPlayEnabled,
    setAutoPlayEnabled,
    playKana,
    stopAudio,
    toKanaAudioKey,
  };
}
