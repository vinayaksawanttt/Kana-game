"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  resolveKanaAudio,
  toKanaAudioKey,
  resolveKanjiReadingAudio,
  normalizeKanjiReading,
  resolveVocabAudio,
  resolveSentenceAudio,
  resolveGrammarTitleAudio,
  cleanGrammarTitleForAudio,
  decomposeKanaToMoraSteps,
  type MoraAudioStep,
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

interface TrimmedKanaBuffer {
  buffer: AudioBuffer;
  startSec: number;
  durationSec: number;
}

let sharedAudioCtx: AudioContext | null = null;
const kanaBufferCache = new Map<string, TrimmedKanaBuffer>();
let activeStitchNodes: AudioBufferSourceNode[] = [];
let activeStitchTimer: ReturnType<typeof setTimeout> | null = null;

function stopCurrentPlayback() {
  if (typeof window === "undefined") return;

  if (sequenceAbortController) {
    sequenceAbortController.aborted = true;
    sequenceAbortController = null;
  }

  if (activeStitchTimer) {
    clearTimeout(activeStitchTimer);
    activeStitchTimer = null;
  }

  if (activeStitchNodes.length > 0) {
    for (const node of activeStitchNodes) {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Ignore already stopped nodes
      }
    }
    activeStitchNodes = [];
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

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioCtx) return sharedAudioCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedAudioCtx = new Ctor();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function analyzeKanaBuffer(buffer: AudioBuffer): TrimmedKanaBuffer {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const threshold = 0.014;

  let firstSample = 0;
  while (firstSample < data.length && Math.abs(data[firstSample]) < threshold) {
    firstSample++;
  }

  let lastSample = data.length - 1;
  while (lastSample > firstSample && Math.abs(data[lastSample]) < threshold) {
    lastSample--;
  }

  if (firstSample >= lastSample) {
    return {
      buffer,
      startSec: 0,
      durationSec: Math.min(0.24, buffer.duration),
    };
  }

  const startSec = Math.max(0, firstSample / sampleRate - 0.008);
  const endSec = Math.min(buffer.duration, lastSample / sampleRate + 0.018);
  const rawDuration = endSec - startSec;
  const durationSec = Math.max(0.12, Math.min(0.32, rawDuration));

  return {
    buffer,
    startSec,
    durationSec,
  };
}

async function loadTrimmedKanaBuffer(
  ctx: AudioContext,
  src: string
): Promise<TrimmedKanaBuffer | null> {
  const cached = kanaBufferCache.get(src);
  if (cached) return cached;

  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const trimmed = analyzeKanaBuffer(audioBuffer);
    kanaBufferCache.set(src, trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Stitches a word's morae clearly using the Web Audio API (AudioContext)
 * from existing /audio/kana/*.mp3 files.
 * Guarantees every character in the word is distinctly audible and pronounced in full.
 */
async function playMoraStepsAsync(
  moraSteps: MoraAudioStep[],
  slug: string,
  ttsText: string,
  rateOverride?: number
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!moraSteps || moraSteps.length === 0) {
    await fallbackToSpeechAsync(ttsText, slug, rateOverride ?? 0.92);
    return;
  }

  const ctx = getSharedAudioContext();
  if (!ctx || typeof window.fetch !== "function") {
    const firstMora = moraSteps.find((s) => s.type === "mora" && s.src);
    if (firstMora) {
      await playAudioItemAsync(firstMora.src, ttsText, slug, undefined, rateOverride);
    } else {
      await fallbackToSpeechAsync(ttsText, slug, rateOverride ?? 0.92);
    }
    return;
  }

  const controller = { aborted: false };
  sequenceAbortController = controller;
  updateState({ isPlaying: true, activeKey: slug, activeChar: null });

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const uniqueSrcs = Array.from(
      new Set(moraSteps.filter((s) => s.type === "mora" && s.src).map((s) => s.src))
    );
    const loadedEntries = await Promise.all(
      uniqueSrcs.map(async (src) => [src, await loadTrimmedKanaBuffer(ctx, src)] as const)
    );

    if (controller.aborted) return;

    const bufferMap = new Map<string, TrimmedKanaBuffer>();
    for (const [src, entry] of loadedEntries) {
      if (entry) bufferMap.set(src, entry);
    }

    if (bufferMap.size === 0) {
      const firstMora = moraSteps.find((s) => s.type === "mora" && s.src);
      if (firstMora) {
        await playAudioItemAsync(firstMora.src, ttsText, slug, undefined, rateOverride);
      } else {
        await fallbackToSpeechAsync(ttsText, slug, rateOverride ?? 0.92);
      }
      return;
    }

    const rate = rateOverride ?? (state.playbackSpeed || 1);
    const gapSec = 0.015 / rate; // Gentle 15ms breathing pause between syllables so every sound is crisp
    let cursorTime = ctx.currentTime + 0.02;
    let lastMoraEntry: TrimmedKanaBuffer | null = null;
    const nodes: AudioBufferSourceNode[] = [];

    for (let i = 0; i < moraSteps.length; i++) {
      const step = moraSteps[i];
      if (step.type === "sokuon") {
        // Geminate consonant pause (っ)
        cursorTime += 0.11 / rate;
        continue;
      }

      if (step.type === "choonpu") {
        // Long vowel continuation (ー): replay vowel tail of previous mora cleanly
        if (lastMoraEntry) {
          const tailOffset = lastMoraEntry.startSec + lastMoraEntry.durationSec * 0.45;
          const tailDuration = lastMoraEntry.durationSec * 0.5;
          const effectiveDur = tailDuration / rate;

          const source = ctx.createBufferSource();
          const gain = ctx.createGain();
          source.buffer = lastMoraEntry.buffer;
          source.playbackRate.value = rate;

          gain.gain.setValueAtTime(0.01, cursorTime);
          gain.gain.linearRampToValueAtTime(0.85, cursorTime + Math.min(0.02, effectiveDur * 0.3));
          gain.gain.setValueAtTime(0.85, Math.max(cursorTime, cursorTime + effectiveDur - 0.025));
          gain.gain.linearRampToValueAtTime(0.001, cursorTime + effectiveDur);

          source.connect(gain);
          gain.connect(ctx.destination);
          source.start(cursorTime, tailOffset, tailDuration);
          nodes.push(source);

          cursorTime += effectiveDur + gapSec;
        }
        continue;
      }

      const entry = bufferMap.get(step.src);
      if (!entry) continue;

      const effectiveDur = entry.durationSec / rate;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = entry.buffer;
      source.playbackRate.value = rate;

      const fadeIn = Math.min(0.008, effectiveDur * 0.1);
      const fadeOut = Math.min(0.018, effectiveDur * 0.18);

      gain.gain.setValueAtTime(0.01, cursorTime);
      gain.gain.linearRampToValueAtTime(1.0, cursorTime + fadeIn);
      gain.gain.setValueAtTime(1.0, Math.max(cursorTime + fadeIn, cursorTime + effectiveDur - fadeOut));
      gain.gain.linearRampToValueAtTime(0.001, cursorTime + effectiveDur);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(cursorTime, entry.startSec, entry.durationSec);
      nodes.push(source);

      lastMoraEntry = entry;
      cursorTime += effectiveDur + gapSec;
    }

    activeStitchNodes = nodes;
    const totalWaitMs = Math.max(50, Math.ceil((cursorTime - ctx.currentTime) * 1000) + 30);

    await new Promise<void>((resolve) => {
      currentAudioResolver = resolve;
      activeStitchTimer = setTimeout(() => {
        activeStitchTimer = null;
        activeStitchNodes = [];
        if (currentAudioResolver === resolve) {
          currentAudioResolver = null;
        }
        updateState({ isPlaying: false, activeKey: null, activeChar: null });
        resolve();
      }, totalWaitMs);
    });
  } catch {
    updateState({ isPlaying: false, activeKey: null, activeChar: null });
  } finally {
    if (sequenceAbortController === controller) {
      sequenceAbortController = null;
    }
  }
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
  activeChar?: string,
  rateOverride?: number
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const effectiveRate = rateOverride ?? state.playbackSpeed;

    if (!globalAudio) {
      try {
        globalAudio = new Audio();
      } catch {
        fallbackToSpeechAsync(ttsText, slug, 0.92 * effectiveRate, activeChar).then(resolve);
        return;
      }
    }

    const audio = globalAudio;
    audio.src = src;

    try {
      audio.playbackRate = effectiveRate;
      audio.defaultPlaybackRate = effectiveRate;
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
      fallbackToSpeechAsync(ttsText, slug, 0.92 * effectiveRate, activeChar).then(finish);
    };

    updateState({ isPlaying: true, activeKey: slug, activeChar: activeChar ?? null });

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (hasEndedOrErrored) return;
          hasEndedOrErrored = true;
          currentAudioResolver = null;
          fallbackToSpeechAsync(ttsText, slug, 0.92 * effectiveRate, activeChar).then(finish);
        });
      }
    } catch {
      if (hasEndedOrErrored) return;
      hasEndedOrErrored = true;
      currentAudioResolver = null;
      fallbackToSpeechAsync(ttsText, slug, 0.92 * effectiveRate, activeChar).then(finish);
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

  const playKana = useCallback((char: string, primaryRomaji?: string, rateOverride?: number) => {
    if (typeof window === "undefined" || !char) return;

    stopCurrentPlayback();

    const payload = resolveKanaAudio({
      char,
      romaji: primaryRomaji ? [primaryRomaji] : undefined,
    });

    void playAudioItemAsync(payload.src, payload.ttsText, payload.slug, char, rateOverride);
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
    (item: { word: string; reading?: string; kana?: string }, rateOverride?: number) => {
      if (typeof window === "undefined" || !item) return;

      stopCurrentPlayback();

      const payload = resolveVocabAudio(item);
      if (payload.hasStaticClip && payload.staticSrc) {
        void playAudioItemAsync(payload.staticSrc, payload.ttsText, payload.key, undefined, rateOverride);
      } else {
        void playMoraStepsAsync(payload.moraSteps, payload.key, payload.ttsText, rateOverride);
      }
    },
    []
  );

  const playSentence = useCallback(
    (
      sentenceJa: string,
      id?: string,
      options?: { audioSrc?: string; reading?: string; rate?: number }
    ) => {
      if (typeof window === "undefined" || !sentenceJa) return;

      stopCurrentPlayback();

      const payload = resolveSentenceAudio(sentenceJa, id);
      if (options?.audioSrc) {
        void playAudioItemAsync(
          options.audioSrc,
          payload.ttsText,
          payload.key,
          undefined,
          options.rate
        );
        return;
      }

      // If speechSynthesis has no Japanese voices (e.g. Brave on Linux) and reading/kana exists, stitch morae
      const hasJaVoice =
        typeof window.speechSynthesis !== "undefined" &&
        typeof window.speechSynthesis.getVoices === "function" &&
        window.speechSynthesis
          .getVoices()
          .some((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));

      const steps = decomposeKanaToMoraSteps(options?.reading || sentenceJa);
      if (!hasJaVoice && steps.length > 0 && typeof window.AudioContext !== "undefined") {
        void playMoraStepsAsync(steps, payload.key, payload.ttsText, options?.rate);
        return;
      }

      const effectiveRate = options?.rate ? payload.rate * options.rate : payload.rate;
      void fallbackToSpeechAsync(payload.ttsText, payload.key, effectiveRate);
    },
    []
  );

  const playGrammarTitle = useCallback(
    (pattern: string, readingOrRate?: string | number, rateOverride?: number) => {
      if (typeof window === "undefined" || !pattern) return;

      stopCurrentPlayback();

      const reading = typeof readingOrRate === "string" ? readingOrRate : undefined;
      const rate = typeof readingOrRate === "number" ? readingOrRate : rateOverride;

      const payload = resolveGrammarTitleAudio(pattern);
      if (!payload.ttsText) return;

      // 1. Check if a high-fidelity static audio clip exists
      const vocabPayload = resolveVocabAudio({ word: payload.ttsText });
      if (vocabPayload.hasStaticClip && vocabPayload.staticSrc) {
        void playAudioItemAsync(
          vocabPayload.staticSrc,
          payload.ttsText,
          payload.key,
          undefined,
          rate ?? payload.rate
        );
        return;
      }

      // 2. Check if Web Speech API has Japanese voice available
      const hasJaVoice =
        typeof window.speechSynthesis !== "undefined" &&
        typeof window.speechSynthesis.getVoices === "function" &&
        window.speechSynthesis
          .getVoices()
          .some((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));

      // 3. Fallback to kana-mora stitching if offline or no ja voice
      const kanaCandidate = reading ? cleanGrammarTitleForAudio(reading) : payload.ttsText;
      const steps = decomposeKanaToMoraSteps(kanaCandidate);
      if (!hasJaVoice && steps.length > 0 && typeof window.AudioContext !== "undefined") {
        void playMoraStepsAsync(steps, payload.key, payload.ttsText, rate ?? payload.rate);
        return;
      }

      // 4. Fallback to speech synthesis
      const effectiveRate = rate ?? payload.rate;
      void fallbackToSpeechAsync(payload.ttsText, payload.key, effectiveRate);
    },
    []
  );

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
    playGrammarTitle,
    stopAudio,
    toKanaAudioKey,
    normalizeKanjiReading,
    resolveKanjiReadingAudio,
    resolveVocabAudio,
    resolveSentenceAudio,
    resolveGrammarTitleAudio,
  };
}
