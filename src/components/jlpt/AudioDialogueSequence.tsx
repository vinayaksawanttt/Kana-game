"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Play, RotateCcw, VolumeX } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import type { DialogueLine, ListeningScenePhase } from "@/engine/jlptListeningScene";

export interface AudioDialogueSequenceProps {
  dialogueLines: readonly DialogueLine[];
  sceneId: string;
  phase: ListeningScenePhase;
  mode?: "exam" | "study";
  onStartAudio?: () => void;
  onAudioEnded: () => void;
  autoPlay?: boolean;
}

function estimateSpeechDurationMs(text: string, rate = 1.0): number {
  const charCount = Math.max(4, [...(text || "")].length);
  const rawMs = (charCount * 145) / Math.max(0.5, rate);
  return Math.max(850, Math.min(15000, Math.round(rawMs)));
}

export function AudioDialogueSequence({
  dialogueLines,
  sceneId,
  phase,
  mode = "exam",
  onStartAudio,
  onAudioEnded,
  autoPlay = true,
}: AudioDialogueSequenceProps) {
  const { playSentence, stopAudio } = useJapaneseAudio();
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);

  const runIdRef = useRef<number>(0);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const hasAutoStartedRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) {
      clearTimeout(t);
    }
    timersRef.current = [];
  }, []);

  const cancelSequence = useCallback(() => {
    runIdRef.current += 1;
    clearTimers();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore audio pause errors
      }
      audioRef.current = null;
    }
    stopAudio();
    setIsPlaying(false);
    setActiveLineIndex(-1);
  }, [clearTimers, stopAudio]);

  const waitMs = useCallback((ms: number, expectedRunId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve(runIdRef.current === expectedRunId);
      }, ms);
      timersRef.current.push(timer);
    });
  }, []);

  const playLineByLineFallback = useCallback(
    async (currentRunId: number) => {
      setActiveLineIndex(0);

      for (let i = 0; i < dialogueLines.length; i++) {
        if (runIdRef.current !== currentRunId) return;

        const line = dialogueLines[i];
        setActiveLineIndex(i);

        playSentence(line.textJa, `${sceneId}:dialogue-${i}`, {
          reading: line.readingHiragana,
        });

        const speechMs = estimateSpeechDurationMs(line.readingHiragana || line.textJa, 1.0);
        const okSpeech = await waitMs(speechMs, currentRunId);
        if (!okSpeech || runIdRef.current !== currentRunId) return;

        if (line.pauseAfterMs > 0) {
          const okPause = await waitMs(line.pauseAfterMs, currentRunId);
          if (!okPause || runIdRef.current !== currentRunId) return;
        }
      }

      if (runIdRef.current === currentRunId) {
        setIsPlaying(false);
        setActiveLineIndex(-1);
        setHasPlayed(true);
        onAudioEnded();
      }
    },
    [dialogueLines, onAudioEnded, playSentence, sceneId, waitMs]
  );

  const playFullSequence = useCallback(() => {
    if (isPlaying) return;
    if (phase === "answered" && mode === "exam") return;

    cancelSequence();
    const currentRunId = runIdRef.current;

    onStartAudio?.();
    setIsPlaying(true);
    setActiveLineIndex(-1);

    // Try playing the authentic pre-generated full scene Opus audio
    const audioUrl = `/audio/listening-scenes/${encodeURIComponent(sceneId)}.opus`;

    const canPlayAudio =
      typeof window !== "undefined" &&
      typeof Audio !== "undefined" &&
      Boolean(
        new Audio().canPlayType?.('audio/ogg; codecs="opus"') ||
        new Audio().canPlayType?.("audio/ogg") ||
        new Audio().canPlayType?.("audio/webm") ||
        new Audio().canPlayType?.("audio/mpeg")
      );

    if (canPlayAudio) {
      try {
        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        let fallbackTriggered = false;
        const triggerFallback = () => {
          if (fallbackTriggered || runIdRef.current !== currentRunId) return;
          fallbackTriggered = true;
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          void playLineByLineFallback(currentRunId);
        };

        audio.onended = () => {
          if (runIdRef.current !== currentRunId) return;
          setIsPlaying(false);
          setActiveLineIndex(-1);
          setHasPlayed(true);
          audioRef.current = null;
          onAudioEnded();
        };

        audio.onerror = () => {
          triggerFallback();
        };

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err: unknown) => {
            if (runIdRef.current !== currentRunId) return;
            // Browser autoplay restrictions require a user click/gesture
            if (err instanceof Error && err.name === "NotAllowedError") {
              setIsPlaying(false);
              audioRef.current = null;
              return;
            }
            triggerFallback();
          });
        }
        return;
      } catch {
        // Fall through to fallback
      }
    }

    void playLineByLineFallback(currentRunId);
  }, [
    cancelSequence,
    isPlaying,
    mode,
    onAudioEnded,
    onStartAudio,
    phase,
    playLineByLineFallback,
    sceneId,
  ]);

  // Autoplay trigger on scene load
  useEffect(() => {
    if (hasAutoStartedRef.current === sceneId) return;
    hasAutoStartedRef.current = sceneId;

    setHasPlayed(false);
    setActiveLineIndex(-1);

    if (autoPlay && phase === "intro") {
      const timer = setTimeout(() => {
        playFullSequence();
      }, 0);
      return () => {
        clearTimeout(timer);
        cancelSequence();
      };
    }

    return () => {
      cancelSequence();
    };
  }, [autoPlay, cancelSequence, phase, playFullSequence, sceneId]);

  const currentLine = activeLineIndex >= 0 ? dialogueLines[activeLineIndex] : null;

  return (
    <div
      data-testid="audio-dialogue-sequence"
      className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-4 shadow-xs transition"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)]/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid size-8 place-items-center rounded-full transition ${
              isPlaying
                ? "bg-[var(--primary)] text-white shadow-xs animate-pulse"
                : "bg-[var(--ink)]/10 text-[var(--ink)]"
            }`}
          >
            <Headphones size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="font-japanese text-xs font-bold text-[var(--ink)]">
              聴解音声 · Official Audio Stream (Mondai 1)
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {mode === "exam" ? "Single-pass official examination playback" : "Guided study mode"}
            </div>
          </div>
        </div>

        {/* Action Controls / Status */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <div
              data-testid="audio-playing-indicator"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--sakura-light)] px-3 py-1 font-mono text-xs font-bold text-[var(--primary-fg)] border border-[var(--primary)]/30 shadow-2xs"
            >
              <div className="flex items-center gap-0.5" aria-hidden="true">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
                <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--primary)] delay-100" />
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--primary)] delay-200" />
              </div>
              <span>再生中 · Audio Playing</span>
              {activeLineIndex >= 0 ? (
                <span className="opacity-75">
                  ({activeLineIndex + 1}/{dialogueLines.length})
                </span>
              ) : (
                <span className="opacity-75">(MP3 Stream)</span>
              )}
            </div>
          ) : hasPlayed || phase === "answering" || phase === "answered" ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ✓ 音声終了 · Audio Ended
              </span>
              {(mode === "study" || phase === "answered") && (
                <button
                  type="button"
                  onClick={playFullSequence}
                  data-testid="replay-audio-btn"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--ink)]/20 bg-[var(--bg)]/40 px-2.5 py-1 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>Replay</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={playFullSequence}
              data-testid="play-audio-btn"
              className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--primary)] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
            >
              <Play size={14} fill="currentColor" aria-hidden="true" />
              <span>音声を再生する · Start Audio</span>
            </button>
          )}

          {isPlaying && (
            <button
              type="button"
              onClick={cancelSequence}
              data-testid="stop-audio-btn"
              className="rounded-sm border border-[var(--ink)]/20 p-1.5 text-[var(--muted)] hover:text-rose-600 hover:border-rose-300 transition"
              title="Stop audio playback"
              aria-label="Stop audio"
            >
              <VolumeX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Live Playback Indicator Box */}
      <div className="mt-3 min-h-[52px] rounded border border-[var(--ink)]/10 bg-[var(--bg)]/30 p-3">
        {isPlaying && currentLine ? (
          <div className="flex items-start gap-3">
            <span className="shrink-0 rounded bg-[var(--primary)] px-2 py-0.5 font-japanese text-[11px] font-bold text-white shadow-2xs">
              {currentLine.speakerLabelJa}
            </span>
            <div className="flex-1 space-y-0.5">
              <p className="font-japanese text-sm font-semibold text-[var(--ink)] leading-snug">
                {currentLine.textJa}
              </p>
              <p className="font-japanese text-[11px] text-[var(--muted)]">
                {currentLine.readingHiragana}
              </p>
            </div>
          </div>
        ) : isPlaying ? (
          <div className="flex items-start gap-3">
            <span className="shrink-0 rounded bg-[var(--primary)] px-2 py-0.5 font-japanese text-[11px] font-bold text-white shadow-2xs">
              公式問題音声
            </span>
            <div className="flex-1 space-y-0.5">
              <p className="font-japanese text-sm font-semibold text-[var(--ink)] leading-snug">
                問題音声（チャイム・質問・会話）を再生中…
              </p>
              <p className="font-japanese text-[11px] text-[var(--muted)]">
                Authentic examination audio stream with chimes, narrator prompts, and dialogue
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-japanese">
              {phase === "intro"
                ? "はじめに質問を聞いてください。音声が終わると選択肢が解答可能になります。"
                : phase === "answering"
                ? "音声の再生が終了しました。問題用紙の1から4の中からいちばんいいものを一つ選んでください。"
                : "解答完了。下の解説および会話スクリプトを確認してください。"}
            </span>
            <span className="font-mono text-[11px] shrink-0 ml-2">
              Total {dialogueLines.length} turns
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
