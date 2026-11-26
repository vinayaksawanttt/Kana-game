"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  User,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { type BookDialogueScene } from "@/data/books";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { playGameSfx } from "@/lib/game-core/sfx";
import { CharacterAvatar } from "./CharacterAvatar";

interface DialogueRoleplayPlayerProps {
  scene: BookDialogueScene;
  showEnglish: boolean;
  onClose: () => void;
}

type PracticeMode = "roleplay" | "shadowing";

export function DialogueRoleplayPlayer({
  scene,
  showEnglish,
  onClose,
}: DialogueRoleplayPlayerProps) {
  const { playSentenceAsync, preloadSentenceAudio, stopAudio, isPlaying } = useJapaneseAudio();

  // Preload opening lines of the scene on mount for instant playback
  useEffect(() => {
    if (typeof preloadSentenceAudio !== "function") return;
    for (const line of scene.lines.slice(0, 3)) {
      preloadSentenceAudio(line.ja, line.audioSrc);
    }
  }, [preloadSentenceAudio, scene.id, scene.lines]);

  // Extract unique speakers from the scene
  const speakers = useMemo(() => {
    const map = new Map<string, { speakerJa: string; speaker: string }>();
    for (const line of scene.lines) {
      if (!map.has(line.speakerJa)) {
        map.set(line.speakerJa, {
          speakerJa: line.speakerJa,
          speaker: line.speaker,
        });
      }
    }
    return Array.from(map.values());
  }, [scene.lines]);

  // Mode & Settings
  const [mode, setMode] = useState<PracticeMode>("roleplay");
  const [selectedRole, setSelectedRole] = useState<string>(
    () => speakers[0]?.speakerJa || ""
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [hideMyScript, setHideMyScript] = useState<boolean>(false);
  const [revealedLines, setRevealedLines] = useState<Record<number, boolean>>({});

  // Playback Progression
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isWaitingForUser, setIsWaitingForUser] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Voice Recording State (per line index)
  const [recordings, setRecordings] = useState<Record<number, string>>({});
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [playingUserAudioIdx, setPlayingUserAudioIdx] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const runIdRef = useRef<number>(0);

  const currentLine = scene.lines[currentIndex];
  const isUserTurnLine = useCallback(
    (idx: number) => {
      const line = scene.lines[idx];
      if (!line) return false;
      if (mode === "shadowing") return true;
      return line.speakerJa === selectedRole;
    },
    [mode, scene.lines, selectedRole]
  );

  // Cleanup audio & recordings on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runIdRef.current++;
      stopAudio();
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (userAudioRef.current) {
        userAudioRef.current.pause();
        userAudioRef.current.currentTime = 0;
        userAudioRef.current = null;
      }
      setPlayingUserAudioIdx(null);
    };
  }, [stopAudio]);

  // Revoke object URLs when recordings are cleared or unmounted
  const recordingsRef = useRef(recordings);
  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);
  useEffect(() => {
    return () => {
      Object.values(recordingsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const processStepRef = useRef<(index: number, currentRunId: number) => Promise<void>>(() => Promise.resolve());

  // Core step runner
  const processStep = useCallback(
    async (index: number, currentRunId: number) => {
      if (currentRunId !== runIdRef.current) return;
      if (index >= scene.lines.length) {
        setIsRunning(false);
        setIsWaitingForUser(false);
        setIsCompleted(true);
        playGameSfx("victory-fanfare");
        return;
      }

      setCurrentIndex(index);
      setIsCompleted(false);
      const line = scene.lines[index];
      const nextLine = scene.lines[index + 1];
      if (nextLine && typeof preloadSentenceAudio === "function") {
        preloadSentenceAudio(nextLine.ja, nextLine.audioSrc);
      }
      const userTurn =
        mode === "shadowing" || line.speakerJa === selectedRole;

      if (mode === "roleplay" && !userTurn) {
        // Partner's line: speak automatically, then advance
        setIsWaitingForUser(false);
        await playSentenceAsync(line.ja, { audioSrc: line.audioSrc, rate: playbackRate });
        if (currentRunId !== runIdRef.current) return;
        await new Promise((r) => setTimeout(r, 550));
        if (currentRunId !== runIdRef.current) return;
        void processStepRef.current(index + 1, currentRunId);
      } else if (mode === "shadowing") {
        // Shadowing: speak native line, then pause for user to shadow/record
        setIsWaitingForUser(false);
        await playSentenceAsync(line.ja, { audioSrc: line.audioSrc, rate: playbackRate });
        if (currentRunId !== runIdRef.current) return;
        setIsWaitingForUser(true);
      } else {
        // Roleplay & User's turn: pause and prompt user to speak
        setIsWaitingForUser(true);
      }
    },
    [mode, playbackRate, playSentenceAsync, preloadSentenceAudio, scene.lines, selectedRole]
  );

  useEffect(() => {
    processStepRef.current = processStep;
  }, [processStep]);

  const handleStartOrResume = () => {
    runIdRef.current++;
    const myRunId = runIdRef.current;
    setIsRunning(true);
    setIsCompleted(false);
    const startIdx = isCompleted ? 0 : currentIndex;
    void processStep(startIdx, myRunId);
  };

  const handlePause = useCallback(() => {
    runIdRef.current++;
    stopAudio();
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
      userAudioRef.current = null;
    }
    setPlayingUserAudioIdx(null);
    setIsRunning(false);
  }, [stopAudio]);

  const handleRestart = () => {
    runIdRef.current++;
    stopAudio();
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
      userAudioRef.current = null;
    }
    setPlayingUserAudioIdx(null);
    setIsRunning(false);
    setIsWaitingForUser(false);
    setIsCompleted(false);
    setCurrentIndex(0);
    setRevealedLines({});
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handlePause();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePause, onClose]);

  const handleNextLine = () => {
    if (isRecording) {
      stopRecording();
    }
    const nextIdx = currentIndex + 1;
    if (isRunning) {
      runIdRef.current++;
      const myRunId = runIdRef.current;
      void processStep(nextIdx, myRunId);
    } else {
      if (nextIdx >= scene.lines.length) {
        setIsCompleted(true);
        setIsWaitingForUser(false);
        playGameSfx("victory-fanfare");
      } else {
        setCurrentIndex(nextIdx);
        setIsWaitingForUser(isUserTurnLine(nextIdx));
      }
    }
  };

  const handleJumpToLine = (idx: number) => {
    runIdRef.current++;
    stopAudio();
    setIsCompleted(false);
    setCurrentIndex(idx);
    if (isRunning) {
      const myRunId = runIdRef.current;
      void processStep(idx, myRunId);
    } else {
      setIsWaitingForUser(isUserTurnLine(idx));
    }
  };

  // Voice Recording handlers
  const startRecording = async () => {
    setMicError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setMicError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      const targetIndex = currentIndex;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => {
          if (prev[targetIndex]) {
            try {
              URL.revokeObjectURL(prev[targetIndex]);
            } catch {
              // ignore
            }
          }
          return { ...prev, [targetIndex]: url };
        });
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setMicError("Microphone access was denied. Please allow mic permissions to record.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const playUserRecording = (idx: number) => {
    const url = recordings[idx];
    if (!url) return;
    stopAudio();
    if (userAudioRef.current) {
      userAudioRef.current.pause();
    }
    const audio = new Audio(url);
    userAudioRef.current = audio;
    setPlayingUserAudioIdx(idx);
    audio.onended = () => setPlayingUserAudioIdx(null);
    audio.onerror = () => setPlayingUserAudioIdx(null);
    void audio.play().catch(() => setPlayingUserAudioIdx(null));
  };

  const userTurnActive = currentLine ? isUserTurnLine(currentIndex) : false;
  const currentRecordingUrl = recordings[currentIndex];
  const recordedCount = Object.keys(recordings).length;

  return (
    <div
      role="region"
      aria-label="Interactive Dialogue Roleplay and Shadowing Studio"
      className="rounded-3xl border-2 border-[var(--primary)]/30 bg-[var(--surface)] shadow-md overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Studio Header */}
      <div className="border-b border-[var(--line)] bg-[var(--sakura-light)]/25 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-2xs">
            <Mic size={16} />
          </span>
          <div>
            <h4 className="text-sm font-black text-[var(--ink)]">
              Dialogue {scene.sceneNumber} · Interactive Roleplay & Shadowing
            </h4>
            {scene.setting && (
              <p className="text-[11px] text-[var(--muted)]">{scene.setting}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            handlePause();
            onClose();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          <X size={14} />
          <span>Exit Studio</span>
        </button>
      </div>

      {/* Controls Bar: Mode, Role, Speed, Blind Toggle */}
      <div className="border-b border-[var(--line)] bg-[var(--surface-overlay)]/30 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-0.5">
            <button
              onClick={() => {
                handleRestart();
                setMode("roleplay");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                mode === "roleplay"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <User size={12} />
              <span>Roleplay</span>
            </button>
            <button
              onClick={() => {
                handleRestart();
                setMode("shadowing");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                mode === "shadowing"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Users size={12} />
              <span>Shadow All</span>
            </button>
          </div>

          {/* Character Selector (in Roleplay mode) */}
          {mode === "roleplay" && speakers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Play as:</span>
              {speakers.map((sp) => (
                <button
                  key={sp.speakerJa}
                  onClick={() => {
                    handleRestart();
                    setSelectedRole(sp.speakerJa);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors font-japanese ${
                    selectedRole === sp.speakerJa
                      ? "bg-[var(--sakura-light)] text-[var(--primary-fg)] ring-1 ring-[var(--primary)]/40"
                      : "bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  <CharacterAvatar
                    speaker={sp.speaker}
                    speakerJa={sp.speakerJa}
                    size="xs"
                    className="rounded-full size-4 text-[8px]"
                  />
                  <span>{sp.speakerJa}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed Selector */}
          <div className="inline-flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] p-0.5 text-[11px] font-bold">
            {[0.75, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`rounded-lg px-2 py-1 transition-colors ${
                  playbackRate === rate
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Blind Practice Toggle */}
          <button
            onClick={() => setHideMyScript((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
              hideMyScript
                ? "border-[var(--primary)] bg-[var(--sakura-light)]/40 text-[var(--primary-fg)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            title="Hide Japanese script on your turn to practice from memory"
          >
            {hideMyScript ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{hideMyScript ? "Script Hidden" : "Hide My Lines"}</span>
          </button>
        </div>
      </div>

      {/* Main Active Stage */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Progress & Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={handleStartOrResume}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-90 active:scale-95 transition-all"
              >
                <Play size={14} />
                <span>{isCompleted ? "Replay Scene" : currentIndex > 0 ? "Resume Auto-Play" : "Start Roleplay"}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-4 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              title="Reset to line 1"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs font-bold text-[var(--muted)]">
            Line {Math.min(currentIndex + 1, scene.lines.length)} of {scene.lines.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{
              width: `${
                isCompleted
                  ? 100
                  : ((currentIndex + 1) / Math.max(scene.lines.length, 1)) * 100
              }%`,
            }}
          />
        </div>

        {/* Completion Banner */}
        {isCompleted ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h5 className="text-base font-black text-[var(--ink)]">
              Dialogue Complete! お疲れ様でした！
            </h5>
            <p className="text-xs text-[var(--muted)]">
              You completed all {scene.lines.length} lines
              {recordedCount > 0 ? ` and recorded ${recordedCount} voice take${recordedCount > 1 ? "s" : ""}` : ""}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white"
              >
                <RotateCcw size={14} />
                <span>Practice Again</span>
              </button>
            </div>
          </div>
        ) : currentLine ? (
          /* Active Line Prompt Card */
          <div
            className={`rounded-2xl border p-5 space-y-4 transition-all ${
              userTurnActive
                ? "border-[var(--primary)]/50 bg-[var(--sakura-light)]/15"
                : "border-[var(--line)] bg-[var(--surface-overlay)]/30"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CharacterAvatar
                  speaker={currentLine.speaker}
                  speakerJa={currentLine.speakerJa}
                  isSpeaking={isPlaying}
                  size="md"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-black font-japanese ${
                        userTurnActive
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[var(--line)] text-[var(--ink)]"
                      }`}
                    >
                      {currentLine.speakerJa} ({currentLine.speaker})
                    </span>
                    {userTurnActive ? (
                      <span className="rounded-full bg-[var(--primary)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                        {mode === "shadowing" ? "Shadow Along" : "Your Turn to Speak"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[var(--muted)]">
                        {isPlaying ? "Speaking partner line..." : "Partner line"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  void playSentenceAsync(currentLine.ja, {
                    audioSrc: currentLine.audioSrc,
                    rate: playbackRate,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors"
              >
                <Volume2 size={14} />
                <span>Play Native</span>
              </button>
            </div>

            {/* Line Script Display */}
            <div className="space-y-1.5">
              {userTurnActive && hideMyScript && !revealedLines[currentIndex] ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70 p-3.5">
                  <span className="text-xs italic text-[var(--muted)]">
                    Speak your line from memory...
                  </span>
                  <button
                    onClick={() =>
                      setRevealedLines((prev) => ({ ...prev, [currentIndex]: true }))
                    }
                    className="text-xs font-bold text-[var(--primary-fg)] hover:underline"
                  >
                    Reveal Japanese
                  </button>
                </div>
              ) : (
                <p className="font-japanese text-lg font-bold text-[var(--ink)] leading-relaxed">
                  {currentLine.ja}
                </p>
              )}

              {showEnglish && (
                <p className="text-xs font-medium text-[var(--muted)]">
                  {currentLine.en}
                </p>
              )}
            </div>

            {/* Voice Recording & Side-by-Side Comparison */}
            <div className="border-t border-[var(--line)]/60 pt-4 space-y-3">
              {micError && (
                <p className="text-xs font-medium text-rose-500">{micError}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      <Mic size={14} />
                      <span>{currentRecordingUrl ? "Re-record" : "Record Voice"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white animate-pulse"
                    >
                      <Square size={12} />
                      <span>Stop ({recordingSeconds}s)</span>
                    </button>
                  )}

                  {/* Side-by-side comparison buttons once recorded */}
                  {currentRecordingUrl && !isRecording && (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5">
                      <span className="text-[11px] font-bold text-[var(--muted)]">
                        Compare:
                      </span>
                      <button
                        onClick={() =>
                          void playSentenceAsync(currentLine.ja, {
                            audioSrc: currentLine.audioSrc,
                            rate: playbackRate,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--sakura-light)]/60 px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:opacity-80"
                      >
                        <Volume2 size={12} />
                        <span>Native</span>
                      </button>
                      <button
                        onClick={() => playUserRecording(currentIndex)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:opacity-80"
                      >
                        <Play size={12} />
                        <span>
                          {playingUserAudioIdx === currentIndex ? "Playing..." : "Your Voice"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Advance button */}
                {(isWaitingForUser || !isRunning) && (
                  <button
                    onClick={handleNextLine}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-bold text-[var(--surface)] hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span>
                      {currentIndex + 1 >= scene.lines.length ? "Finish Scene" : "Next Line"}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Script Timeline Overview */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Scene Script (Click any line to jump)
          </span>
          <div className="divide-y divide-[var(--line)]/50 rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            {scene.lines.map((line, idx) => {
              const isCurrent = idx === currentIndex && !isCompleted;
              const isDone = isCompleted || idx < currentIndex;
              const isUser = isUserTurnLine(idx);
              const hasRec = Boolean(recordings[idx]);

              return (
                <button
                  key={idx}
                  onClick={() => handleJumpToLine(idx)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? "bg-[var(--sakura-light)]/30"
                      : "hover:bg-[var(--surface-overlay)]/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CharacterAvatar
                      speaker={line.speaker}
                      speakerJa={line.speakerJa}
                      size="xs"
                      isSpeaking={isCurrent && isPlaying}
                      className="rounded-md size-5 text-[9px]"
                    />
                    <span
                      className={`shrink-0 w-16 truncate rounded-md px-1.5 py-0.5 text-[11px] font-bold font-japanese text-center ${
                        isUser
                          ? "bg-[var(--primary)]/15 text-[var(--primary-fg)]"
                          : "bg-[var(--surface-overlay)] text-[var(--muted)]"
                      }`}
                    >
                      {line.speakerJa}
                    </span>
                    <span
                      className={`truncate font-japanese text-xs ${
                        isCurrent
                          ? "font-bold text-[var(--ink)]"
                          : isDone
                          ? "text-[var(--muted)]"
                          : "text-[var(--ink)]/80"
                      }`}
                    >
                      {isUser && hideMyScript && !revealedLines[idx]
                        ? "•••••• (Your turn)"
                        : line.ja}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasRec && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        Recorded
                      </span>
                    )}
                    {isDone && !isCurrent && (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
