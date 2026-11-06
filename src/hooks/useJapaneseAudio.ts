"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  resolveKanaAudio,
  toKanaAudioKey,
  resolveKanjiReadingAudio,
  normalizeKanjiReading,
  resolveVocabAudio,
  resolveSentenceAudio,
} from "@/engine/audio";

const STORAGE_KEY = "kana-autoplay-audio";
const SPEED_KEY = "kana-playback-speed";

interface AudioState {
  isPlaying: boolean;
  activeKey: string | null;
  activeChar?: string | null;
  autoPlayEnabled: boolean;
  playbackSpeed: number;
}

let state: AudioState = {
  isPlaying: false,
  activeKey: null,
  activeChar: null,
  autoPlayEnabled: true,
  playbackSpeed: 1,
};

// Initialize autoPlayEnabled and playbackSpeed from localStorage if in browser
if (typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      state.autoPlayEnabled = saved === "true";
    }
    const savedSpeed = window.localStorage.getItem(SPEED_KEY);
    if (savedSpeed !== null) {
      const parsed = parseFloat(savedSpeed);
      if (parsed === 1 || parsed === 1.5 || parsed === 2) {
        state.playbackSpeed = parsed;
      }
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
    activeChar: null,
    autoPlayEnabled: true,
    playbackSpeed: 1,
  };
}

let globalAudio: HTMLAudioElement | null = null;
let sequenceAbortController: { aborted: boolean } | null = null;
let currentAudioResolver: (() => void) | null = null;

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

  if (currentAudioResolver) {
    const resolve = currentAudioResolver;
    currentAudioResolver = null;
    resolve();
  }

  updateState({ isPlaying: false, activeKey: null, activeChar: null });
}

function fallbackToSpeechAsync(
  ttsText: string,
  slug: string,
  baseRate: number = 0.92,
  activeChar?: string
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      updateState({ isPlaying: false, activeKey: null, activeChar: null });
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = "ja-JP";
      utterance.rate = baseRate * state.playbackSpeed;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onend = () => {
        updateState({ isPlaying: false, activeKey: null, activeChar: null });
        resolve();
      };

      utterance.onerror = () => {
        updateState({ isPlaying: false, activeKey: null, activeChar: null });
        resolve();
      };

      updateState({ isPlaying: true, activeKey: slug, activeChar: activeChar ?? null });
      window.speechSynthesis.speak(utterance);
    } catch {
      updateState({ isPlaying: false, activeKey: null, activeChar: null });
      resolve();
    }
  });
}

function playAudioItemAsync(
  src: string,
  ttsText: string,
  slug: string,
  activeChar?: string
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (!globalAudio) {
      try {
        globalAudio = new Audio();
      } catch {
        fallbackToSpeechAsync(ttsText, slug, 0.92, activeChar).then(resolve);
        return;
      }
    }

    const audio = globalAudio;
    audio.src = src;

    try {
      audio.playbackRate = state.playbackSpeed;
      audio.defaultPlaybackRate = state.playbackSpeed;
    } catch {
      // Ignore
    }

    let hasEndedOrErrored = false;

    const finish = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      currentAudioResolver = null;
      audio.onended = null;
      audio.onerror = null;
      updateState({ isPlaying: false, activeKey: null, activeChar: null });
      resolve();
    };

    currentAudioResolver = finish;
    audio.onended = finish;

    audio.onerror = () => {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      currentAudioResolver = null;
      fallbackToSpeechAsync(ttsText, slug, 0.92, activeChar).then(finish);
    };

    updateState({ isPlaying: true, activeKey: slug, activeChar: activeChar ?? null });

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (hasEndedOrErrored) return;
          hasEndedOrErrored = true;
          currentAudioResolver = null;
          fallbackToSpeechAsync(ttsText, slug, 0.92, activeChar).then(finish);
        });
      }
    } catch {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      currentAudioResolver = null;
      fallbackToSpeechAsync(ttsText, slug, 0.92, activeChar).then(finish);
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

    void playAudioItemAsync(payload.src, payload.ttsText, payload.slug, char);
  }, []);

  const playReading = useCallback((rawReading: string) => {
    if (typeof window === "undefined" || !rawReading) return;

    stopCurrentPlayback();

    const payload = resolveKanjiReadingAudio(rawReading);
    void playAudioItemAsync(payload.src, payload.ttsText, payload.slug, rawReading);
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

  const playKanaSequence = useCallback(
    async (items: Array<{ char: string; romaji?: string }>) => {
      if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) {
        return;
      }

      stopCurrentPlayback();

      const controller = { aborted: false };
      sequenceAbortController = controller;

      for (let i = 0; i < items.length; i++) {
        if (controller.aborted) break;
        const item = items[i];
        if (!item?.char) continue;

        const payload = resolveKanaAudio({
          char: item.char,
          romaji: item.romaji ? [item.romaji] : undefined,
        });
        await playAudioItemAsync(payload.src, payload.ttsText, payload.slug);

        if (controller.aborted) break;

        if (i < items.length - 1) {
          await new Promise((r) => setTimeout(r, 320));
        }
      }

      if (sequenceAbortController === controller) {
        sequenceAbortController = null;
      }
    },
    []
  );

  const setPlaybackSpeed = useCallback((speed: number) => {
    updateState({ playbackSpeed: speed });
    if (globalAudio) {
      try {
        globalAudio.playbackRate = speed;
        globalAudio.defaultPlaybackRate = speed;
      } catch {
        // Ignore
      }
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(SPEED_KEY, String(speed));
      } catch {
        // Ignore
      }
    }
  }, []);

  const playKanaAsync = useCallback(async (char: string, primaryRomaji?: string) => {
    if (typeof window === "undefined" || !char) return;

    stopCurrentPlayback();

    const payload = resolveKanaAudio({
      char,
      romaji: primaryRomaji ? [primaryRomaji] : undefined,
    });

    await playAudioItemAsync(payload.src, payload.ttsText, payload.slug, char);
  }, []);

  const playVocab = useCallback(
    (item: { word: string; reading?: string; kana?: string }) => {
      if (typeof window === "undefined" || !item) return;

      stopCurrentPlayback();

      const payload = resolveVocabAudio(item);
      void playAudioItemAsync(payload.src, payload.ttsText, payload.key);
    },
    []
  );

  const playSentence = useCallback((sentenceJa: string, id?: string) => {
    if (typeof window === "undefined" || !sentenceJa) return;

    stopCurrentPlayback();

    const payload = resolveSentenceAudio(sentenceJa, id);
    void fallbackToSpeechAsync(payload.ttsText, payload.key, payload.rate);
  }, []);

  useEffect(() => {
    return () => {
      // Component unmount does not disrupt audio singleton
    };
  }, []);

  return {
    isPlaying: current.isPlaying,
    activeKey: current.activeKey,
    activeChar: current.activeChar ?? null,
    autoPlayEnabled: current.autoPlayEnabled,
    playbackSpeed: current.playbackSpeed,
    setPlaybackSpeed,
    setAutoPlayEnabled,
    playKana,
    playKanaAsync,
    playKanaSequence,
    playReading,
    playReadingSequence,
    playVocab,
    playSentence,
    stopAudio,
    toKanaAudioKey,
    normalizeKanjiReading,
    resolveKanjiReadingAudio,
    resolveVocabAudio,
    resolveSentenceAudio,
  };
}
