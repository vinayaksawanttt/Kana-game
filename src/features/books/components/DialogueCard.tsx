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
  Square,
  Volume2,
  CheckCircle2,
  Mic,
  BookOpen,
  Headphones,
  Users,
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

  // Standalone playback fallback state (used only when onTogglePlayScene is omitted)
  const [localPlayingIndex, setLocalPlayingIndex] = useState<number>(-1);
  const [localIsPlaying, setLocalIsPlaying] = useState<boolean>(false);

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

  const playbackRunIdRef = useRef<number>(0);
  const playLineStepRef = useRef<(index: number, currentRunId: number) => Promise<void>>(async () => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Unified playback state
  const isPlaying = Boolean(isPlayingScene) || localIsPlaying;
  const activeSentenceIndex =
    isPlayingScene && playingLineIndex !== undefined && playingLineIndex >= 0
      ? playingLineIndex
      : localPlayingIndex;

  // Standalone playback progression function (fallback when onTogglePlayScene is omitted)
  const playLineStep = useCallback(
    async (index: number, currentRunId: number) => {
      if (currentRunId !== playbackRunIdRef.current) return;
      if (index >= scene.lines.length) {
        setLocalIsPlaying(false);
        setLocalPlayingIndex(-1);
        if (!isCompleted && onToggleComplete) {
          onToggleComplete();
        }
        return;
      }

      setLocalPlayingIndex(index);
      setLocalIsPlaying(true);

      const line = scene.lines[index];
      try {
        await playSentenceAsync(line.ja, {
          audioSrc: line.audioSrc,
          rate: 1.0,
        });
      } catch {
        if (currentRunId !== playbackRunIdRef.current) return;
        const textDuration = Math.max(1600, line.ja.length * 120);
        await new Promise((r) => setTimeout(r, textDuration));
      }

      if (currentRunId !== playbackRunIdRef.current) return;

      // Natural pause between dialogue turns
      await new Promise((r) => setTimeout(r, 450));

      if (currentRunId !== playbackRunIdRef.current) return;

      void playLineStepRef.current(index + 1, currentRunId);
    },
    [isCompleted, onToggleComplete, playSentenceAsync, scene.lines]
  );

  useEffect(() => {
    playLineStepRef.current = playLineStep;
  }, [playLineStep]);

  // Play / Stop Full Scene Action
  const handlePlayToggle = useCallback(() => {
    if (onTogglePlayScene) {
      // Parent manages sequential playback through togglePlayFullScene
      onTogglePlayScene();
      return;
    }

    // Local standalone playback
    if (localIsPlaying) {
      playbackRunIdRef.current += 1;
      stopAudio();
      setLocalIsPlaying(false);
      setLocalPlayingIndex(-1);
    } else {
      playbackRunIdRef.current += 1;
      const currentRun = playbackRunIdRef.current;
      stopAudio();
      setLocalPlayingIndex(0);
      setLocalIsPlaying(true);
      void playLineStep(0, currentRun);
    }
  }, [localIsPlaying, onTogglePlayScene, playLineStep, stopAudio]);

  // Displayed lines:
  // When dialogue is spoken/playing, one after one dialogue is added into the dialogue screen until the last dialogue.
  // When not playing, all dialogues are displayed within the dialogue box.
  const displayedLines = useMemo(() => {
    if (isPlaying) {
      const count = Math.max(1, activeSentenceIndex + 1);
      return scene.lines.slice(0, count);
    }
    return scene.lines;
  }, [isPlaying, activeSentenceIndex, scene.lines]);

  // Auto-scroll chat box smoothly down as new lines are added during playback
  useEffect(() => {
    if (isPlaying && containerRef.current) {
      if (typeof containerRef.current.scrollTo === "function") {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [isPlaying, displayedLines.length, activeSentenceIndex]);

  // Cleanup on unmount or scene change
  useEffect(() => {
    return () => {
      playbackRunIdRef.current += 1;
      stopAudio();
    };
  }, [scene.id, stopAudio]);

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

  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--tb-border)] rounded-3xl bg-[var(--tb-surface)] shadow-xs transition-all",
        isPlaying && "ring-1 ring-[var(--tb-primary)]/30",
        className
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Dialogue Header                                                    */}
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

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
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
              onClick={handlePlayToggle}
              className={cn(
                "tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs",
                isPlaying
                  ? "bg-rose-500 text-white shadow-rose-500/25 animate-pulse"
                  : "border border-[var(--tb-primary)]/40 bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] hover:bg-[var(--tb-primary)] hover:text-white"
              )}
              aria-label={
                isPlaying
                  ? "Stop full scene audio"
                  : "Play full scene audio"
              }
            >
              {isPlaying ? (
                <>
                  <Square size={13} fill="currentColor" />
                  <span>
                    Stop ({activeSentenceIndex >= 0 ? activeSentenceIndex + 1 : 1}/{scene.lines.length})
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
              <span>Roleplay & Shadow</span>
            </button>
          </div>
        </div>

        {/* Setting */}
        {scene.setting && (
          <p className="mt-2 text-xs italic text-[var(--tb-text-secondary)] flex items-center gap-1.5">
            <span className="font-semibold not-italic text-[var(--tb-text-primary)]">
              Setting:
            </span>
            <span>{scene.setting}</span>
          </p>
        )}
      </div>

      {/* Mode Special Banners */}
      {learningMode === "listening" && (
        <div className="flex items-center gap-2 border-b border-[var(--tb-border)] bg-amber-500/10 px-5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-200">
          <Headphones size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Listening Mode:</strong> English translations are hidden by default to test ear comprehension. Tap <em>Reveal English</em> on any sentence to verify your understanding.
          </span>
        </div>
      )}

      {learningMode === "shadowing" && (
        <div className="flex items-center gap-2 border-b border-[var(--tb-border)] bg-indigo-500/10 px-5 py-2.5 text-xs font-medium text-indigo-800 dark:text-indigo-200">
          <Volume2 size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>
            <strong>Shadowing Mode:</strong> Listen to the native rhythm and shadow each sentence. Use <em>Roleplay & Shadow</em> to practice recording your own lines.
          </span>
        </div>
      )}

      {learningMode === "roleplay" && (
        <div className="border-b border-[var(--tb-border)] bg-emerald-500/10 px-5 py-2.5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
            <Users size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>Roleplay Practice:</strong> Choose a character role below. Your lines will be highlighted with special borders.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
              Practice Role:
            </span>
            {uniqueSpeakers.map((spk) => (
              <button
                key={spk}
                type="button"
                onClick={() => setSelectedRole(spk)}
                className={cn(
                  "tb-focus-ring rounded-lg border px-2.5 py-1 text-xs font-bold font-japanese transition-all cursor-pointer",
                  selectedRole === spk
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-2xs"
                    : "border-emerald-500/30 bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-emerald-500/60"
                )}
              >
                {spk}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary Mentions in this Dialogue */}
      {matchingVocabItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--tb-border)] bg-[var(--surface-overlay)]/30 px-5 py-2 text-xs">
          <span className="flex items-center gap-1 font-bold text-[var(--tb-text-secondary)]">
            <BookOpen size={13} />
            <span>Lesson Words in Scene:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {matchingVocabItems.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVocab && onSelectVocab(v)}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-md border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2 py-0.5 text-xs font-japanese font-medium text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
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
      {/* Dialogue Conversation Area: Maintains stable height                */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className="relative h-[460px] sm:h-[520px] overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-7 bg-[var(--tb-bg)]/40 scroll-smooth"
      >
        {displayedLines.map((line, idx) => {
          const speakerIndex = uniqueSpeakers.indexOf(line.speakerJa);
          const isRightAligned = speakerIndex % 2 === 1;
          const theme = getSpeakerTheme(line.speakerJa);
          const isUserRole =
            learningMode === "roleplay" && selectedRole === line.speakerJa;

          // Character speaks when audio is actively playing for this line
          const isLineActiveSpeaking =
            (isPlaying && activeSentenceIndex === idx) ||
            (isAudioPlaying &&
              activeKey === resolveSentenceAudio(line.ja, line.audioSrc).key);

          const isLineEnglishVisible =
            learningMode === "listening"
              ? showEnglish || !!revealedEnglishLines[idx]
              : showEnglish;

          return (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-3 sm:gap-4 transition-all duration-300",
                isRightAligned ? "flex-row-reverse" : "flex-row",
                isPlaying && "animate-in fade-in slide-in-from-bottom-2 duration-300"
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
                  className={cn(
                    "ring-offset-2 ring-offset-[var(--tb-bg)] transition-transform duration-200",
                    isLineActiveSpeaking && "scale-105"
                  )}
                />
                <span className="text-[11px] font-bold text-[var(--tb-text-secondary)] max-w-[70px] truncate text-center font-japanese">
                  {line.speakerJa}
                </span>
              </div>

              {/* Chat Message Bubble */}
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
      </div>
    </div>
  );
}
