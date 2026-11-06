"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackSpeed, StoryAudioSegment } from "@/engine/audio";

const SPEED_STORAGE_KEY = "nihongo-audio-speed";

function readSavedSpeed(): PlaybackSpeed {
  if (typeof window === "undefined") return 1;
  try {
    const saved = Number(window.localStorage.getItem(SPEED_STORAGE_KEY));
    if (saved === 0.75 || saved === 1 || saved === 1.25) return saved;
  } catch {
    // Ignore storage errors.
  }
  return 1;
}

export function useStoryNarrator(queue: StoryAudioSegment[]) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(readSavedSpeed);
  const [loopCurrentSentence, setLoopCurrentSentence] = useState(false);

  const queueRef = useRef(queue);
  const speedRef = useRef(speed);
  const loopRef = useRef(loopCurrentSentence);
  const playingRef = useRef(false);
  const activeIndexRef = useRef<number | null>(null);
  const modeRef = useRef<"passage" | "single">("passage");
  const generationRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playAtRef = useRef<(index: number, generation: number) => void>(() => {});

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    loopRef.current = loopCurrentSentence;
  }, [loopCurrentSentence]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearMedia = useCallback(() => {
    clearTimer();
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    }

    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (utterance) {
      utterance.onend = null;
      utterance.onerror = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [clearTimer]);

  const playAt = useCallback((index: number, generation: number) => {
      if (generation !== generationRef.current) return;
      const segment = queueRef.current[index];
      if (!segment) {
        playingRef.current = false;
        setIsPlaying(false);
        activeIndexRef.current = null;
        setActiveSegmentIndex(null);
        return;
      }

      activeIndexRef.current = index;
      setActiveSegmentIndex(index);

      const onSegmentEnd = () => {
        if (generation !== generationRef.current) return;
        audioRef.current = null;
        utteranceRef.current = null;

        if (loopRef.current) {
          timerRef.current = window.setTimeout(() => playAtRef.current(index, generation), 1500);
          return;
        }

        const nextIndex = index + 1;
        if (modeRef.current === "passage" && nextIndex < queueRef.current.length) {
          timerRef.current = window.setTimeout(() => playAtRef.current(nextIndex, generation), 350);
          return;
        }

        playingRef.current = false;
        setIsPlaying(false);
        activeIndexRef.current = null;
        setActiveSegmentIndex(null);
      };

      const speakFallback = () => {
        if (generation !== generationRef.current || !playingRef.current) return;
        const audio = audioRef.current;
        if (audio) {
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
          audioRef.current = null;
        }

        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          onSegmentEnd();
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(segment.ttsText);
          utterance.lang = "ja-JP";
          utterance.rate = speedRef.current * 0.95;

          const voices = window.speechSynthesis.getVoices();
          const jaVoice = voices.find((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"));
          if (jaVoice) {
            utterance.voice = jaVoice;
          }

          utterance.onend = onSegmentEnd;
          utterance.onerror = () => {
            // Stop rapid flickering cascade if browser TTS has no voice or fails
            playingRef.current = false;
            setIsPlaying(false);
            activeIndexRef.current = null;
            setActiveSegmentIndex(null);
          };
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        } catch {
          playingRef.current = false;
          setIsPlaying(false);
          activeIndexRef.current = null;
          setActiveSegmentIndex(null);
        }
      };

      const audio = new Audio(segment.src);
      audio.preload = "auto";
      audio.playbackRate = speedRef.current;
      audioRef.current = audio;
      let fallbackStarted = false;
      const tryFallback = () => {
        if (fallbackStarted || generation !== generationRef.current) return;
        fallbackStarted = true;
        speakFallback();
      };
      audio.onended = onSegmentEnd;
      audio.onerror = tryFallback;

      try {
        void audio.play().catch(tryFallback);
      } catch {
        tryFallback();
      }
  }, []);

  useEffect(() => {
    playAtRef.current = playAt;
  }, [playAt]);

  const startAt = useCallback(
    (index: number, mode: "passage" | "single") => {
      if (index < 0 || index >= queueRef.current.length) return;
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      clearMedia();
      modeRef.current = mode;
      activeIndexRef.current = index;
      playingRef.current = true;
      setActiveSegmentIndex(index);
      setIsPlaying(true);
      playAt(index, generation);
    },
    [clearMedia, playAt]
  );

  const stop = useCallback(() => {
    generationRef.current += 1;
    clearMedia();
    playingRef.current = false;
    activeIndexRef.current = null;
    setIsPlaying(false);
    setActiveSegmentIndex(null);
  }, [clearMedia]);

  const togglePlayPause = useCallback(() => {
    if (playingRef.current) {
      modeRef.current = "passage";
      playingRef.current = false;
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      clearTimer();
      return;
    }

    const index = activeIndexRef.current ?? 0;
    const audio = audioRef.current;
    if (audio) {
      modeRef.current = "passage";
      playingRef.current = true;
      setIsPlaying(true);
      void audio.play().catch(() => {
        const currentIndex = activeIndexRef.current;
        if (currentIndex !== null) startAt(currentIndex, "passage");
      });
      return;
    }

    if (utteranceRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
      modeRef.current = "passage";
      playingRef.current = true;
      setIsPlaying(true);
      window.speechSynthesis.resume();
      return;
    }

    startAt(index, "passage");
  }, [clearTimer, startAt]);

  const playSegment = useCallback(
    (index: number) => startAt(index, "single"),
    [startAt]
  );

  const nextSegment = useCallback(() => {
    const current = activeIndexRef.current;
    const index = current === null ? 0 : current + 1;
    if (index < queueRef.current.length) startAt(index, "passage");
  }, [startAt]);

  const prevSegment = useCallback(() => {
    const current = activeIndexRef.current;
    startAt(current === null ? 0 : Math.max(0, current - 1), "passage");
  }, [startAt]);

  const setSpeed = useCallback(
    (nextSpeed: PlaybackSpeed) => {
      speedRef.current = nextSpeed;
      setSpeedState(nextSpeed);
      try {
        window.localStorage.setItem(SPEED_STORAGE_KEY, String(nextSpeed));
      } catch {
        // Ignore storage errors.
      }

      if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
      else if (utteranceRef.current && playingRef.current && activeIndexRef.current !== null) {
        startAt(activeIndexRef.current, modeRef.current);
      }
    },
    [startAt]
  );

  const toggleLoop = useCallback(() => {
    setLoopCurrentSentence((current) => !current);
  }, []);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      clearMedia();
    };
  }, [clearMedia, queue]);

  return {
    isPlaying,
    activeSegmentIndex,
    speed,
    loopCurrentSentence,
    togglePlayPause,
    playSegment,
    nextSegment,
    prevSegment,
    stop,
    setSpeed,
    toggleLoop,
  };
}
