"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import type { InstantReplyQuestion } from "@/engine/jlptInstantReply";

export type InstantReplyAudioStage =
  | "idle"
  | "prompt"
  | "opt-0"
  | "opt-1"
  | "opt-2"
  | "timer-running";

function estimateSpeechDurationMs(text: string, rate = 1.0): number {
  const charCount = Math.max(4, [...(text || "")].length);
  const rawMs = (charCount * 145) / Math.max(0.5, rate);
  return Math.max(850, Math.min(4200, Math.round(rawMs)));
}

export function useInstantReplyAudio() {
  const { playSentence, stopAudio } = useJapaneseAudio();
  const [activeStage, setActiveStage] = useState<InstantReplyAudioStage>("idle");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const runIdRef = useRef<number>(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }, []);

  const cancelSequence = useCallback(
    (nextStage: InstantReplyAudioStage = "idle") => {
      runIdRef.current += 1;
      clearTimers();
      stopAudio();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
      setIsPlaying(false);
      setActiveStage(nextStage);
    },
    [clearTimers, stopAudio],
  );

  const waitMs = useCallback((ms: number, expectedRunId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(runIdRef.current === expectedRunId);
      }, ms);
      timersRef.current.push(timer);
    });
  }, []);

  const speakSegmentAsync = useCallback(
    (
      text: string,
      reading: string,
      rate: number,
      expectedRunId: number,
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        if (runIdRef.current !== expectedRunId) {
          resolve(false);
          return;
        }

        // Trigger the core offline-first Japanese audio hook (handles static clips, mora stitching, or TTS)
        playSentence(text, undefined, { reading, rate });

        const duration = estimateSpeechDurationMs(reading || text, rate);
        const timer = setTimeout(() => {
          resolve(runIdRef.current === expectedRunId);
        }, duration);
        timersRef.current.push(timer);
      });
    },
    [playSentence],
  );

  const playFullRound = useCallback(
    async (question: InstantReplyQuestion, onSequenceComplete?: () => void) => {
      cancelSequence("prompt");
      const currentRunId = runIdRef.current;
      setIsPlaying(true);
      setActiveStage("prompt");

      // 1. Speak Speaker A's prompt
      const okPrompt = await speakSegmentAsync(
        question.promptJa,
        question.promptReading,
        0.96,
        currentRunId,
      );
      if (!okPrompt || runIdRef.current !== currentRunId) return;

      // Pause 550ms before Option 1
      const okPause0 = await waitMs(550, currentRunId);
      if (!okPause0 || runIdRef.current !== currentRunId) return;

      // 2. Speak Option 1
      const opt0 = question.options[0];
      setActiveStage("opt-0");
      const okOpt0 = await speakSegmentAsync(
        opt0.ja,
        opt0.reading,
        1.0,
        currentRunId,
      );
      if (!okOpt0 || runIdRef.current !== currentRunId) return;

      // Pause 450ms before Option 2
      const okPause1 = await waitMs(450, currentRunId);
      if (!okPause1 || runIdRef.current !== currentRunId) return;

      // 3. Speak Option 2
      const opt1 = question.options[1];
      setActiveStage("opt-1");
      const okOpt1 = await speakSegmentAsync(
        opt1.ja,
        opt1.reading,
        1.0,
        currentRunId,
      );
      if (!okOpt1 || runIdRef.current !== currentRunId) return;

      // Pause 450ms before Option 3
      const okPause2 = await waitMs(450, currentRunId);
      if (!okPause2 || runIdRef.current !== currentRunId) return;

      // 4. Speak Option 3
      const opt2 = question.options[2];
      setActiveStage("opt-2");
      const okOpt2 = await speakSegmentAsync(
        opt2.ja,
        opt2.reading,
        1.0,
        currentRunId,
      );
      if (!okOpt2 || runIdRef.current !== currentRunId) return;

      // Sequence complete -> start reflex timer
      setIsPlaying(false);
      setActiveStage("timer-running");
      onSequenceComplete?.();
    },
    [cancelSequence, speakSegmentAsync, waitMs],
  );

  const playSingleLine = useCallback(
    async (
      text: string,
      reading: string,
      stage: InstantReplyAudioStage,
      rate = 0.96,
      restoreStage: InstantReplyAudioStage = "timer-running",
    ) => {
      cancelSequence(stage);
      const currentRunId = runIdRef.current;
      setIsPlaying(true);
      setActiveStage(stage);

      const ok = await speakSegmentAsync(text, reading, rate, currentRunId);
      if (!ok || runIdRef.current !== currentRunId) return;

      setIsPlaying(false);
      setActiveStage(restoreStage);
    },
    [cancelSequence, speakSegmentAsync],
  );

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clearTimers();
      stopAudio();
    };
  }, [clearTimers, stopAudio]);

  return {
    activeStage,
    isPlaying,
    setActiveStage,
    playFullRound,
    playSingleLine,
    cancelSequence,
  };
}
