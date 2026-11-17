"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  Languages,
  CheckCircle2,
  Mic,
  BookOpen,
  Headphones,
  Users,
  ArrowDownCircle,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { type BookDialogueScene, type BookLesson, type BookVocabItem } from "@/data/books";
import { type DictionaryDataMaps } from "@/data/dictionary";
import { type DialogueLearningMode } from "@/features/books/engine/progress";
import { LevelBadge } from "./ui/Elements";
import { AudioButton } from "@/components/ui/AudioButton";
import { StoryReaderLine } from "@/features/books/components/StoryReaderLine";
import { CharacterAvatar } from "@/features/books/components/CharacterAvatar";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { resolveSentenceAudio } from "@/engine/audio";
import { playGameSfx } from "@/lib/game-core/sfx";
import { cn } from "./ui/tokens";

export function getSpeakerTheme(speakerJa: string) {
  const s = speakerJa.trim();
  const initial =
    s.replace(/^[木村|田中|山下|鈴木|佐藤]/, "").charAt(0) || s.charAt(0);

  if (s.includes("たけし") || s.includes("Takeshi")) {
    return {
      gradient: "from-sky-500 to-blue-600 text-white",
      tag: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
      bubbleBorder: "border-sky-500/30",
      bubbleBg: "bg-sky-50/30 dark:bg-sky-950/20",
      initial,
    };
  }
  if (s.includes("メアリー") || s.includes("Mary")) {
    return {
      gradient: "from-rose-500 to-pink-600 text-white",
      tag: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
      bubbleBorder: "border-rose-500/30",
      bubbleBg: "bg-rose-50/30 dark:bg-rose-950/20",
      initial,
    };
  }
  if (s.includes("先生") || s.includes("山下")) {
    return {
      gradient: "from-emerald-500 to-teal-700 text-white",
      tag: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
      bubbleBorder: "border-emerald-500/30",
      bubbleBg: "bg-emerald-50/30 dark:bg-emerald-950/20",
      initial,
    };
  }
  if (s.includes("店") || s.includes("ウェイター") || s.includes("員")) {
    return {
      gradient: "from-amber-500 to-orange-600 text-white",
      tag: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
      bubbleBorder: "border-amber-500/30",
      bubbleBg: "bg-amber-50/30 dark:bg-amber-950/20",
      initial,
    };
  }
  if (s.includes("ロバート") || s.includes("Robert")) {
    return {
      gradient: "from-cyan-500 to-blue-600 text-white",
      tag: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
      bubbleBorder: "border-cyan-500/30",
      bubbleBg: "bg-cyan-50/30 dark:bg-cyan-950/20",
      initial,
    };
  }
  if (s.includes("スー") || s.includes("Sue") || s.includes("ソラ")) {
    return {
      gradient: "from-violet-500 to-purple-600 text-white",
      tag: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
      bubbleBorder: "border-violet-500/30",
      bubbleBg: "bg-violet-50/30 dark:bg-violet-950/20",
      initial,
    };
  }

  const hash = s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbacks = [
    {
      gradient: "from-indigo-500 to-blue-600 text-white",
      tag: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
      bubbleBorder: "border-indigo-500/30",
      bubbleBg: "bg-indigo-50/30 dark:bg-indigo-950/20",
      initial,
    },
    {
      gradient: "from-teal-500 to-emerald-600 text-white",
      tag: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
      bubbleBorder: "border-teal-500/30",
      bubbleBg: "bg-teal-50/30 dark:bg-teal-950/20",
      initial,
    },
    {
      gradient: "from-fuchsia-500 to-pink-600 text-white",
      tag: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25",
      bubbleBorder: "border-fuchsia-500/30",
      bubbleBg: "bg-fuchsia-50/30 dark:bg-fuchsia-950/20",
      initial,
    },
    {
      gradient: "from-amber-500 to-yellow-600 text-white",
      tag: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
      bubbleBorder: "border-amber-500/30",
      bubbleBg: "bg-amber-50/30 dark:bg-amber-950/20",
      initial,
    },
  ];
  return fallbacks[hash % fallbacks.length];
}

export type DialoguePresentationMode = "transcript" | "playback";
export type PlaybackStatus = "idle" | "playing" | "paused" | "completed" | "error";

export interface DialogueCardProps {
  scene: BookDialogueScene;
  lesson: BookLesson;
  level: string;
  showEnglish: boolean;
  tapLookupEnabled: boolean;
  isPlayingScene?: boolean;
  playingLineIndex?: number;
  dictMaps: DictionaryDataMaps | null;
  kuromojiLineMap: Record<
    string,
    Array<{
      surface_form: string;
      basic_form?: string;
      reading?: string;
      pos?: string;
    }>
  >;
  learningMode?: DialogueLearningMode;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  onTogglePlayScene?: () => void;
  onStartRoleplay: () => void;
  onSelectVocab?: (vocabItem: BookVocabItem) => void;
  className?: string;
}

export function DialogueCard({
  scene,
  lesson,
  level,
  showEnglish,
  tapLookupEnabled,
  isPlayingScene = false,
  playingLineIndex = -1,
  dictMaps,
  kuromojiLineMap,
  learningMode = "reading",
  isCompleted = false,
  onToggleComplete,
  onTogglePlayScene,
  onStartRoleplay,
  onSelectVocab,
  className,
}: DialogueCardProps) {
  const uniqueSpeakers = useMemo(
    () => Array.from(new Set(scene.lines.map((l) => l.speakerJa))),
    [scene.lines]
  );

  // Presentation Mode: Transcript (Mode A) vs Full Scene Playback (Mode B)
  const [presentationMode, setPresentationMode] =
    useState<DialoguePresentationMode>("transcript");

  // Playback engine state
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("idle");
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);
  const [revealedCount, setRevealedCount] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showPlaybackTranslation, setShowPlaybackTranslation] =
    useState<boolean>(showEnglish);

  // Transcript state
  const [revealedEnglishLines, setRevealedEnglishLines] = useState<
    Record<number, boolean>
  >({});
  const [selectedRole, setSelectedRole] = useState<string>(
    uniqueSpeakers[0] || ""
  );

  // Audio system singleton
  const {
    playSentenceAsync,
    stopAudio,
    isPlaying: isAudioPlaying,
    activeKey,
  } = useJapaneseAudio();

  // Playback execution cancellation tokens
  const playbackRunIdRef = useRef<number>(0);
  const playLineStepRef = useRef<(index: number, speed: number, currentRunId: number) => Promise<void>>(async () => {});
  const lineElementRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Derived playback modes and indices (supports both internal and parent-controlled playback)
  const isPlaybackMode = presentationMode === "playback" || Boolean(isPlayingScene);
  const isActuallyPlaying =
    Boolean(isPlayingScene) || (presentationMode === "playback" && playbackStatus === "playing");
  const effectiveActiveSentenceIndex =
    isPlayingScene && playingLineIndex !== undefined && playingLineIndex >= 0
      ? playingLineIndex
      : activeSentenceIndex;
  const effectiveRevealedCount =
    isPlayingScene && playingLineIndex !== undefined && playingLineIndex >= 0
      ? Math.max(revealedCount, playingLineIndex + 1)
      : revealedCount;

  // Detect lesson vocabulary words that appear in this dialogue scene
  const matchingVocabItems = useMemo(() => {
    if (!lesson.vocabulary || lesson.vocabulary.length === 0) return [];
    const fullText = scene.lines.map((l) => l.ja).join(" ");
    return lesson.vocabulary.filter((v) => {
      const cleanWord = v.word.trim();
      return cleanWord.length > 0 && fullText.includes(cleanWord);
    });
  }, [lesson.vocabulary, scene.lines]);

  const toggleLineEnglish = (idx: number) => {
    setRevealedEnglishLines((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Scroll active sentence smoothly into view
  const scrollToLine = useCallback(
    (index: number) => {
      if (!autoScroll) return;
      const el = lineElementRefs.current[index];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
    [autoScroll]
  );

  // Core Playback Progression Function
  const playLineStep = useCallback(
    async (index: number, speed: number, currentRunId: number) => {
      if (currentRunId !== playbackRunIdRef.current) return;
      if (index >= scene.lines.length) {
        setPlaybackStatus("completed");
        setActiveSentenceIndex(-1);
        playGameSfx("victory-fanfare");
        if (!isCompleted && onToggleComplete) {
          onToggleComplete();
        }
        return;
      }

      setActiveSentenceIndex(index);
      setRevealedCount((prev) => Math.max(prev, index + 1));
      setPlaybackStatus("playing");
      scrollToLine(index);

      const line = scene.lines[index];
      try {
        await playSentenceAsync(line.ja, {
          audioSrc: line.audioSrc,
          rate: speed,
        });
      } catch {
        // Fallback to text reading pacing if audio asset fails or is missing
        if (currentRunId !== playbackRunIdRef.current) return;
        const textDuration = Math.max(1800, line.ja.length * 130);
        await new Promise((r) => setTimeout(r, textDuration));
      }

      if (currentRunId !== playbackRunIdRef.current) return;

      // Natural pause between turns
      const pauseDuration = speed < 1 ? 550 : 380;
      await new Promise((r) => setTimeout(r, pauseDuration));

      if (currentRunId !== playbackRunIdRef.current) return;

      // Auto-advance to next line
      void playLineStepRef.current(index + 1, speed, currentRunId);
    },
    [
      scene.lines,
      isCompleted,
      onToggleComplete,
      playSentenceAsync,
      scrollToLine,
    ]
  );

  useEffect(() => {
    playLineStepRef.current = playLineStep;
  }, [playLineStep]);

  // User Actions: Play / Start Full Scene
  const handleStartFullPlayback = useCallback(() => {
    stopAudio();
    playbackRunIdRef.current += 1;
    const currentRun = playbackRunIdRef.current;
    setPresentationMode("playback");
    setRevealedCount(1);
    setActiveSentenceIndex(0);
    setPlaybackStatus("playing");
    void playLineStep(0, playbackSpeed, currentRun);
  }, [playbackSpeed, playLineStep, stopAudio]);

  // Pause Playback
  const handlePause = useCallback(() => {
    playbackRunIdRef.current += 1;
    stopAudio();
    setPlaybackStatus("paused");
  }, [stopAudio]);

  // Resume Playback
  const handleResume = useCallback(() => {
    playbackRunIdRef.current += 1;
    const currentRun = playbackRunIdRef.current;
    const startIndex =
      activeSentenceIndex >= 0 && activeSentenceIndex < scene.lines.length
        ? activeSentenceIndex
        : 0;
    setPlaybackStatus("playing");
    void playLineStep(startIndex, playbackSpeed, currentRun);
  }, [activeSentenceIndex, playbackSpeed, playLineStep, scene.lines.length]);

  // Jump to specific line (Previous, Next, or Replay)
  const handleJumpToLine = useCallback(
    (index: number) => {
      if (index < 0 || index >= scene.lines.length) return;
      playbackRunIdRef.current += 1;
      const currentRun = playbackRunIdRef.current;
      stopAudio();
      setActiveSentenceIndex(index);
      setRevealedCount((prev) => Math.max(prev, index + 1));
      setPlaybackStatus("playing");
      void playLineStep(index, playbackSpeed, currentRun);
    },
    [playbackSpeed, playLineStep, scene.lines.length, stopAudio]
  );

  // Restart Scene
  const handleRestart = useCallback(() => {
    playbackRunIdRef.current += 1;
    const currentRun = playbackRunIdRef.current;
    stopAudio();
    setRevealedCount(1);
    setActiveSentenceIndex(0);
    setPlaybackStatus("playing");
    void playLineStep(0, playbackSpeed, currentRun);
  }, [playbackSpeed, playLineStep, stopAudio]);

  // Exit Full Playback -> Return to Transcript
  const handleExitPlayback = useCallback(() => {
    playbackRunIdRef.current += 1;
    stopAudio();
    setPlaybackStatus("idle");
    setActiveSentenceIndex(-1);
    setPresentationMode("transcript");
    if (isPlayingScene && onTogglePlayScene) {
      onTogglePlayScene();
    }
  }, [isPlayingScene, onTogglePlayScene, stopAudio]);

  // Header "Play Full Scene" button toggle
  const handleHeaderPlayToggle = useCallback(() => {
    if (isPlayingScene) {
      if (onTogglePlayScene) {
        onTogglePlayScene();
      }
      handlePause();
    } else if (presentationMode === "playback" && playbackStatus === "playing") {
      handlePause();
    } else if (presentationMode === "playback" && playbackStatus === "paused") {
      handleResume();
    } else {
      if (onTogglePlayScene && !isPlayingScene) {
        onTogglePlayScene();
      }
      handleStartFullPlayback();
    }
  }, [
    handlePause,
    handleResume,
    handleStartFullPlayback,
    isPlayingScene,
    onTogglePlayScene,
    playbackStatus,
    presentationMode,
  ]);

  // Cleanup on unmount or scene change
  useEffect(() => {
    return () => {
      playbackRunIdRef.current += 1;
      stopAudio();
    };
  }, [scene.id, stopAudio]);

  // Lines to display based on presentation mode
  const displayedLines = useMemo(() => {
    if (!isPlaybackMode) {
      return scene.lines;
    }
    return scene.lines.slice(0, effectiveRevealedCount);
  }, [isPlaybackMode, effectiveRevealedCount, scene.lines]);

  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--tb-border)] rounded-3xl bg-[var(--tb-surface)] shadow-xs transition-all",
        isPlaybackMode && "ring-1 ring-[var(--tb-primary)]/30",
        className
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Redesigned Dialogue Header                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="border-b border-[var(--tb-border)] bg-[var(--surface-overlay)]/70 px-5 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dialogue Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--tb-primary)] to-blue-600 px-3 py-1 text-xs font-black text-white shadow-2xs">
              <Sparkles size={12} />
              <span>Dialogue {scene.sceneNumber}</span>
            </span>

            {/* Total Lines & Level */}
            <span className="text-xs font-bold text-[var(--tb-text-secondary)]">
              {scene.lines.length} lines
            </span>
            {level && <LevelBadge level={level} />}

            {/* Participating Character Portraits Mini Strip */}
            <div className="hidden md:flex items-center gap-1.5 ml-2 border-l border-[var(--tb-border)] pl-3">
              {uniqueSpeakers.map((spk) => {
                const theme = getSpeakerTheme(spk);
                const matchingLine = scene.lines.find((l) => l.speakerJa === spk);
                return (
                  <span
                    key={spk}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold font-japanese shadow-2xs transition-all",
                      theme.tag
                    )}
                    title={`${spk}${matchingLine?.speaker ? ` (${matchingLine.speaker})` : ""}`}
                  >
                    <CharacterAvatar
                      speaker={matchingLine?.speaker}
                      speakerJa={spk}
                      size="xs"
                      shape="circle"
                      fallbackTheme={theme}
                      className="size-4.5 rounded-full"
                    />
                    <span className="truncate max-w-[70px]">{spk}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Action & Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher Pill */}
            <div className="inline-flex items-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-0.5 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (isPlaybackMode) {
                    handleExitPlayback();
                  }
                }}
                className={cn(
                  "tb-focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer",
                  !isPlaybackMode
                    ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                    : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                )}
                aria-label="Switch to Transcript Mode"
              >
                <FileText size={12} />
                <span>Transcript</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPlaybackMode) {
                    handleStartFullPlayback();
                  }
                }}
                className={cn(
                  "tb-focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer",
                  isPlaybackMode
                    ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                    : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                )}
                aria-label="Switch to Animated Playback Mode"
              >
                <Play size={12} fill="currentColor" />
                <span>Playback</span>
              </button>
            </div>

            {/* Mark Done Checkbox Button */}
            {onToggleComplete && (
              <button
                type="button"
                onClick={onToggleComplete}
                className={cn(
                  "tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 shadow-2xs"
                    : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:border-emerald-500/40 hover:text-emerald-600"
                )}
                aria-label={isCompleted ? "Mark scene as incomplete" : "Mark scene as completed"}
              >
                <CheckCircle2
                  size={14}
                  className={isCompleted ? "text-emerald-500" : "opacity-40"}
                />
                <span className="hidden sm:inline">
                  {isCompleted ? "Completed" : "Mark Done"}
                </span>
              </button>
            )}

            {/* Play / Stop Full Scene Action */}
            <button
              type="button"
              onClick={handleHeaderPlayToggle}
              className={cn(
                "tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                isActuallyPlaying
                  ? "bg-rose-500 text-white shadow-rose-500/25 animate-pulse"
                  : "border border-[var(--tb-primary)]/40 bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] hover:bg-[var(--tb-primary)] hover:text-white"
              )}
              aria-label={
                isActuallyPlaying
                  ? "Stop full scene audio"
                  : "Play full scene audio"
              }
            >
              {isActuallyPlaying ? (
                <>
                  <Square size={13} fill="currentColor" />
                  <span>
                    Stop ({effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex + 1 : 1}/{scene.lines.length})
                  </span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Play Full Scene</span>
                </>
              )}
            </button>

            {/* Roleplay Studio Trigger */}
            <button
              type="button"
              onClick={onStartRoleplay}
              className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--tb-primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[var(--tb-primary-hover)] active:scale-95 transition-all cursor-pointer"
            >
              <Mic size={13} />
              <span className="hidden sm:inline">Roleplay & Shadow</span>
            </button>
          </div>
        </div>

        {/* Setting Description */}
        {scene.setting && (
          <p className="mt-2.5 text-xs italic text-[var(--tb-text-secondary)] flex items-center gap-1.5">
            <span className="font-semibold not-italic text-[var(--tb-text-primary)]">Setting:</span>
            <span>{scene.setting}</span>
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Learning Mode Banners                                              */}
      {/* ------------------------------------------------------------------ */}
      {learningMode === "listening" && (
        <div className="flex items-center gap-2 border-b border-[var(--tb-border)] bg-amber-500/10 px-5 py-2 text-xs font-medium text-amber-800 dark:text-amber-200">
          <Headphones size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Listening Mode:</strong> English translations are hidden by default to test ear
            comprehension. Tap <em>Reveal translation</em> on any line to check your understanding.
          </span>
        </div>
      )}

      {learningMode === "shadowing" && (
        <div className="flex items-center gap-2 border-b border-[var(--tb-border)] bg-indigo-500/10 px-5 py-2 text-xs font-medium text-indigo-800 dark:text-indigo-200">
          <Volume2 size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>
            <strong>Shadowing Mode:</strong> Listen to the natural cadence and repeat each sentence
            immediately after the speaker. Use <em>Roleplay & Shadow</em> to record and compare.
          </span>
        </div>
      )}

      {learningMode === "roleplay" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tb-border)] bg-emerald-500/10 px-5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Users size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-emerald-800 dark:text-emerald-200">
              Practice Role:
            </span>
            <div className="flex items-center gap-1">
              {uniqueSpeakers.map((spk) => (
                <button
                  key={spk}
                  type="button"
                  onClick={() => setSelectedRole(spk)}
                  className={cn(
                    "tb-focus-ring rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer font-japanese",
                    (selectedRole || uniqueSpeakers[0]) === spk
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] border border-[var(--tb-border)] hover:border-emerald-500/50"
                  )}
                >
                  {spk}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onStartRoleplay}
            className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            <Mic size={13} />
            <span>Launch Recording Studio &rarr;</span>
          </button>
        </div>
      )}

      {learningMode === "vocab" && matchingVocabItems.length > 0 && (
        <div className="border-b border-[var(--tb-border)] bg-[var(--tb-accent-soft)]/30 px-5 py-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-[var(--primary-fg)] flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>{matchingVocabItems.length} Lesson Vocabulary Words in this Scene</span>
            </span>
            <span className="text-[11px] text-[var(--tb-text-secondary)]">
              Tap any word in the bubbles below for instant definitions & pitch accent
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matchingVocabItems.map((v) => (
              <button
                key={v.word}
                type="button"
                onClick={() => onSelectVocab?.(v)}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-md border border-[var(--tb-primary)]/25 bg-[var(--tb-surface)] px-2 py-0.5 font-japanese text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-all cursor-pointer"
                title={`${v.word} (${v.reading}) - ${v.meaning}`}
              >
                <span>{v.word}</span>
                <span className="text-[10px] font-normal text-[var(--tb-text-secondary)]">
                  {v.reading}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Dialogue Conversation Area (Transcript vs Progressive Playback)    */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className={cn(
          "relative p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-7 bg-[var(--tb-bg)]/40 min-h-[300px]",
          presentationMode === "playback" && "pb-32 sm:pb-36"
        )}
      >
        {displayedLines.map((line, idx) => {
          const speakerIndex = uniqueSpeakers.indexOf(line.speakerJa);
          const isRightAligned = speakerIndex % 2 === 1;
          const theme = getSpeakerTheme(line.speakerJa);
          const isUserRole =
            learningMode === "roleplay" && selectedRole === line.speakerJa;

          // Check if this line is actively speaking audio
          const isPlayingThisSentenceInPlayback =
            isPlaybackMode &&
            effectiveActiveSentenceIndex === idx &&
            playbackStatus === "playing";

          const isPlayingThisSentenceInAudioSingleton =
            isAudioPlaying &&
            activeKey === resolveSentenceAudio(line.ja, line.audioSrc).key;

          const isLineActiveSpeaking =
            isPlayingThisSentenceInPlayback ||
            isPlayingThisSentenceInAudioSingleton ||
            (isPlayingScene && playingLineIndex === idx);

          const isLineEnglishVisible =
            isPlaybackMode
              ? showPlaybackTranslation
              : learningMode === "listening"
              ? showEnglish || !!revealedEnglishLines[idx]
              : showEnglish;

          // Dim inactive messages slightly during progressive playback to emphasize current turn
          const isDimmedInPlayback =
            isPlaybackMode &&
            effectiveActiveSentenceIndex >= 0 &&
            effectiveActiveSentenceIndex !== idx;

          return (
            <div
              key={idx}
              ref={(el) => {
                lineElementRefs.current[idx] = el;
              }}
              className={cn(
                "flex items-start gap-3 sm:gap-4 transition-all duration-300",
                isRightAligned ? "flex-row-reverse" : "flex-row",
                isPlaybackMode &&
                  "animate-in fade-in slide-in-from-bottom-2 duration-300",
                isDimmedInPlayback && "opacity-75 hover:opacity-100"
              )}
            >
              {/* Circular Character Avatar (52-60px on desktop, ~44px mobile) */}
              <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
                <CharacterAvatar
                  speaker={line.speaker}
                  speakerJa={line.speakerJa}
                  isSpeaking={isLineActiveSpeaking}
                  size="lg"
                  shape="circle"
                  fallbackTheme={theme}
                  title={`${line.speakerJa} (${line.speaker})`}
                  className={cn(
                    "ring-offset-2 ring-offset-[var(--tb-bg)] transition-transform duration-200",
                    isLineActiveSpeaking && "scale-105"
                  )}
                />
                <span className="text-[11px] font-bold text-[var(--tb-text-secondary)] max-w-[70px] truncate text-center font-japanese">
                  {line.speakerJa}
                </span>
              </div>

              {/* Chat Message Bubble (Responsive 68-72% max-width on desktop) */}
              <div
                className={cn(
                  "relative max-w-[88%] sm:max-w-[75%] md:max-w-[70%] rounded-3xl p-4 sm:p-5 shadow-xs transition-all duration-300 text-left border",
                  isRightAligned
                    ? "rounded-tr-xs bg-[var(--tb-surface)]"
                    : "rounded-tl-xs bg-[var(--tb-surface)]",
                  theme.bubbleBorder,
                  isUserRole &&
                    "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30",
                  isLineActiveSpeaking &&
                    "ring-2 ring-[var(--tb-primary)] shadow-md bg-[var(--tb-accent-soft)]/70 scale-[1.01]"
                )}
              >
                {/* Bubble Top Bar */}
                <div className="flex items-center justify-between gap-3 mb-2 border-b border-[var(--tb-border)]/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--tb-text-primary)] font-japanese">
                      {line.speakerJa}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--tb-text-secondary)] opacity-80">
                      ({line.speaker})
                    </span>

                    {isUserRole && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                        Your Turn
                      </span>
                    )}

                    {isLineActiveSpeaking && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary-fg)] animate-pulse">
                        <Volume2 size={12} />
                        <span>Speaking...</span>
                      </span>
                    )}
                  </div>

                  {/* Individual Audio Button */}
                  <AudioButton
                    text={line.ja}
                    mode="sentence"
                    size="sm"
                    id={line.audioSrc}
                    label={`Listen to ${line.speakerJa}`}
                  />
                </div>

                {/* Primary Japanese Sentence with StoryReader tap-to-lookup */}
                <div className="font-japanese text-base sm:text-lg leading-relaxed text-[var(--tb-text-primary)] font-medium tracking-wide">
                  <StoryReaderLine
                    ja={line.ja}
                    lessonVocab={lesson.vocabulary}
                    lessonKanji={lesson.kanji}
                    dictMaps={dictMaps}
                    kuromojiTokens={kuromojiLineMap[line.ja]}
                    level={level}
                    enabled={tapLookupEnabled}
                  />
                </div>

                {/* English Translation */}
                {isLineEnglishVisible ? (
                  <div className="mt-2.5 border-t border-[var(--tb-border)]/60 pt-2 flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm text-[var(--tb-text-secondary)] font-normal leading-snug">
                      {line.en}
                    </p>
                    {learningMode === "listening" && !showEnglish && (
                      <button
                        type="button"
                        onClick={() => toggleLineEnglish(idx)}
                        className="tb-focus-ring shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
                        title="Conceal translation"
                        aria-label="Conceal translation"
                      >
                        <EyeOff size={12} />
                        <span>Hide</span>
                      </button>
                    )}
                  </div>
                ) : (
                  learningMode === "listening" && (
                    <div className="mt-2 border-t border-[var(--tb-border)]/60 pt-1.5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleLineEnglish(idx)}
                        className="tb-focus-ring inline-flex items-center gap-1 text-[11px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                        aria-label="Reveal English"
                      >
                        <Eye size={12} />
                        <span>Reveal English</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}

        {/* ------------------------------------------------------------------ */}
        {/* Completion Card in Playback Mode                                    */}
        {/* ------------------------------------------------------------------ */}
        {isPlaybackMode &&
          playbackStatus === "completed" && (
            <div className="mt-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-sm">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/10">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                  Dialogue Complete!
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                  You listened to all {scene.lines.length} conversational sentences.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Replay Scene</span>
                </button>

                <button
                  type="button"
                  onClick={handleExitPlayback}
                  className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  <span>Return to Transcript</span>
                </button>

                <button
                  type="button"
                  onClick={onStartRoleplay}
                  className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--tb-primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[var(--tb-primary-hover)] transition-colors cursor-pointer"
                >
                  <Mic size={13} />
                  <span>Roleplay & Shadow</span>
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky Playback Control Bar (Full Scene Playback Mode Only)         */}
      {/* ------------------------------------------------------------------ */}
      {isPlaybackMode && (
        <div className="sticky bottom-3 z-30 mx-auto max-w-2xl px-3 sm:px-4">
          <div className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)]/95 backdrop-blur-md p-3 sm:p-3.5 shadow-xl space-y-2.5">
            {/* Progress Track & Sentence Counter */}
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-[var(--tb-text-secondary)]">
              <span
                data-testid="sentence-counter"
                aria-label={`Sentence ${effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex + 1 : 1} of ${scene.lines.length}`}
              >
                Sentence {effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex + 1 : 1} of {scene.lines.length}
              </span>
              <span>
                {Math.round(
                  (((effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex + 1 : 0)) /
                    scene.lines.length) *
                    100
                )}
                %
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-[var(--tb-border)]/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--tb-primary)] to-blue-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    (((effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex + 1 : 0)) /
                      scene.lines.length) *
                    100
                  }%`,
                }}
              />
            </div>

            {/* Playback Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              {/* Left Group: Nav & Audio Stepping */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Previous Sentence */}
                <button
                  type="button"
                  onClick={() => handleJumpToLine(effectiveActiveSentenceIndex - 1)}
                  disabled={effectiveActiveSentenceIndex <= 0}
                  className="tb-focus-ring grid size-8 place-items-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Previous sentence"
                  title="Previous sentence"
                >
                  <SkipBack size={15} />
                </button>

                {/* Primary Play / Pause */}
                {isActuallyPlaying ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="tb-focus-ring grid size-9 sm:size-10 place-items-center rounded-2xl bg-amber-500 text-white shadow-md hover:bg-amber-600 active:scale-95 transition-all cursor-pointer"
                    aria-label="Pause playback"
                    title="Pause playback"
                  >
                    <Pause size={18} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      playbackStatus === "completed"
                        ? handleRestart
                        : handleResume
                    }
                    className="tb-focus-ring grid size-9 sm:size-10 place-items-center rounded-2xl bg-[var(--tb-primary)] text-white shadow-md hover:bg-[var(--tb-primary-hover)] active:scale-95 transition-all cursor-pointer"
                    aria-label="Resume playback"
                    title="Resume playback"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                )}

                {/* Next Sentence */}
                <button
                  type="button"
                  onClick={() => handleJumpToLine(effectiveActiveSentenceIndex + 1)}
                  disabled={effectiveActiveSentenceIndex >= scene.lines.length - 1}
                  className="tb-focus-ring grid size-8 place-items-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Next sentence"
                  title="Next sentence"
                >
                  <SkipForward size={15} />
                </button>

                {/* Replay Active Sentence */}
                <button
                  type="button"
                  onClick={() =>
                    handleJumpToLine(
                      effectiveActiveSentenceIndex >= 0 ? effectiveActiveSentenceIndex : 0
                    )
                  }
                  className="tb-focus-ring grid size-8 place-items-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors cursor-pointer"
                  aria-label="Replay current sentence"
                  title="Replay current sentence"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Right Group: Settings & Options */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Speed Pills */}
                <div className="hidden xs:inline-flex items-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-0.5 text-[11px] font-bold">
                  {[0.75, 1.0, 1.25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackSpeed(rate)}
                      className={cn(
                        "rounded-lg px-2 py-0.5 transition-colors cursor-pointer",
                        playbackSpeed === rate
                          ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                          : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Translation Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPlaybackTranslation((prev) => !prev)}
                  className={cn(
                    "tb-focus-ring inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                    showPlaybackTranslation
                      ? "border-[var(--tb-primary)]/40 bg-[var(--tb-accent-soft)] text-[var(--primary-fg)]"
                      : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  )}
                  aria-label={
                    showPlaybackTranslation
                      ? "Hide English translations"
                      : "Show English translations"
                  }
                  title="Toggle translations"
                >
                  <Languages size={14} />
                  <span className="hidden sm:inline">English</span>
                </button>

                {/* Auto-scroll Toggle */}
                <button
                  type="button"
                  onClick={() => setAutoScroll((prev) => !prev)}
                  className={cn(
                    "tb-focus-ring grid size-8 place-items-center rounded-xl border transition-colors cursor-pointer",
                    autoScroll
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                      : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  )}
                  aria-label={
                    autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"
                  }
                  title={
                    autoScroll
                      ? "Auto-scroll: Enabled"
                      : "Auto-scroll: Disabled"
                  }
                >
                  <ArrowDownCircle size={15} />
                </button>

                {/* Return to Transcript Mode */}
                <button
                  type="button"
                  onClick={handleExitPlayback}
                  className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors cursor-pointer"
                  aria-label="View full transcript"
                  title="Return to Transcript"
                >
                  <FileText size={14} />
                  <span className="hidden sm:inline">Transcript</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
