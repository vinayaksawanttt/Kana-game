"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  resolveKanaAudio,
  toKanaAudioKey,
  resolveKanjiReadingAudio,
  normalizeKanjiReading,
} from "@/engine/audio";

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
let sequenceAbortController: { aborted: boolean } | null = null;

function stopCurrentPlayback() {
  if (typeof window === "undefined") return;

  if (sequenceAbortController) {
    sequenceAbortController.aborted = true;
    sequenceAbortController = null;
  }

  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio.onended = null;
      globalAudio.onerror = null;
    } catch {
      // Ignore
    }
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

function fallbackToSpeechAsync(ttsText: string, slug: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      updateState({ isPlaying: false, activeKey: null });
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = "ja-JP";
      utterance.rate = 0.92;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onend = () => {
        updateState({ isPlaying: false, activeKey: null });
        resolve();
      };

      utterance.onerror = () => {
        updateState({ isPlaying: false, activeKey: null });
        resolve();
      };

      updateState({ isPlaying: true, activeKey: slug });
      window.speechSynthesis.speak(utterance);
    } catch {
      updateState({ isPlaying: false, activeKey: null });
      resolve();
    }
  });
}

function playAudioItemAsync(src: string, ttsText: string, slug: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (!globalAudio) {
      try {
        globalAudio = new Audio();
      } catch {
        fallbackToSpeechAsync(ttsText, slug).then(resolve);
        return;
      }
    }

    const audio = globalAudio;
    audio.src = src;

    let hasEndedOrErrored = false;

    const finish = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      audio.onended = null;
      audio.onerror = null;
      updateState({ isPlaying: false, activeKey: null });
      resolve();
    };

    audio.onended = finish;

    audio.onerror = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      fallbackToSpeechAsync(ttsText, slug).then(finish);
    };

    updateState({ isPlaying: true, activeKey: slug });

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (hasEndedOrErrored) return;
          hasEndedOrErrored = true;
          fallbackToSpeechAsync(ttsText, slug).then(finish);
        });
      }
    } catch {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      fallbackToSpeechAsync(ttsText, slug).then(finish);
    }
  });
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
    if (typeof window === "undefined" || !char) return;

    stopCurrentPlayback();

    const payload = resolveKanaAudio({
      char,
      romaji: primaryRomaji ? [primaryRomaji] : undefined,
    });

    void playAudioItemAsync(payload.src, payload.ttsText, payload.slug);
  }, []);

  const playReading = useCallback((rawReading: string) => {
    if (typeof window === "undefined" || !rawReading) return;

    stopCurrentPlayback();

    const payload = resolveKanjiReadingAudio(rawReading);
    void playAudioItemAsync(payload.src, payload.ttsText, payload.slug);
  }, []);

  const playReadingSequence = useCallback(async (readings: string[]) => {
    if (typeof window === "undefined" || !Array.isArray(readings) || readings.length === 0) {
      return;
    }

    stopCurrentPlayback();

    const controller = { aborted: false };
    sequenceAbortController = controller;

    for (let i = 0; i < readings.length; i++) {
      if (controller.aborted) break;
      const raw = readings[i];
      if (!raw) continue;

      const payload = resolveKanjiReadingAudio(raw);
      await playAudioItemAsync(payload.src, payload.ttsText, payload.slug);

      if (controller.aborted) break;

      if (i < readings.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    if (sequenceAbortController === controller) {
      sequenceAbortController = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Component unmount does not disrupt audio singleton
    };
  }, []);

  return {
    isPlaying: current.isPlaying,
    activeKey: current.activeKey,
    autoPlayEnabled: current.autoPlayEnabled,
    setAutoPlayEnabled,
    playKana,
    playReading,
    playReadingSequence,
    stopAudio,
    toKanaAudioKey,
    normalizeKanjiReading,
    resolveKanjiReadingAudio,
  };
}
