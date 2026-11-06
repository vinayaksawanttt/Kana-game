"use client";

import React from "react";
import { Volume2 } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import {
  toKanaAudioKey,
  resolveKanjiReadingAudio,
  resolveVocabAudio,
  resolveSentenceAudio,
  resolveGrammarTitleAudio,
} from "@/engine/audio";

export interface AudioButtonProps {
  /** The kana or Japanese character/mora/word/sentence/grammar to pronounce */
  text: string;
  /** Optional unique item identifier (e.g. "N5/a-ga-ichiban" for grammar or sentence id) */
  id?: string;
  /** Optional canonical romaji hint if character is non-standard */
  romaji?: string;
  /** Optional reading (for vocab) */
  reading?: string;
  /** Playback mode: "kana" (default) | "reading" | "vocab" | "sentence" | "grammar" */
  mode?: "kana" | "reading" | "vocab" | "sentence" | "grammar";
  /** Optional custom play handler override */
  onPlay?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional custom accessible label or tooltip */
  label?: string;
  /** Optional extra classes */
  className?: string;
  /** Whether to show a text label next to the speaker icon */
  showText?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const SIZE_STYLES = {
  sm: {
    btn: "h-7 w-7 min-w-[28px] rounded-md text-xs",
    icon: "h-3.5 w-3.5",
  },
  md: {
    btn: "h-9 w-9 min-w-[36px] rounded-lg text-sm",
    icon: "h-4 w-4",
  },
  lg: {
    btn: "h-11 w-11 min-w-[44px] rounded-xl text-base",
    icon: "h-5 w-5",
  },
};

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  id,
  romaji,
  reading,
  mode = "kana",
  onPlay,
  size = "md",
  label,
  className = "",
  showText = false,
  disabled = false,
}) => {
  const {
    playKana,
    playReading,
    playVocab,
    playSentence,
    playGrammarTitle,
    isPlaying,
    activeKey,
  } = useJapaneseAudio();

  const getActiveSlug = () => {
    if (mode === "vocab") {
      return resolveVocabAudio({ word: text, reading }).key;
    }
    if (mode === "sentence") {
      return resolveSentenceAudio(text, id).key;
    }
    if (mode === "grammar") {
      return resolveGrammarTitleAudio(text, id).key;
    }
    if (mode === "reading") {
      return resolveKanjiReadingAudio(reading || text).slug;
    }
    return toKanaAudioKey(text, romaji);
  };

  const isThisPlaying = isPlaying && activeKey === getActiveSlug();
  const currentSize = SIZE_STYLES[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
    if (onPlay) {
      onPlay();
      return;
    }
    if (mode === "vocab") {
      playVocab({ word: text, reading });
    } else if (mode === "sentence") {
      playSentence(text, id);
    } else if (mode === "grammar") {
      playGrammarTitle(text, id || reading);
    } else if (mode === "reading") {
      playReading(reading || text);
    } else {
      playKana(text, romaji);
    }
  };

  const accessibleLabel = label ?? `Listen to pronunciation of ${text}`;

  return (
    <button
      type="button"
      // Crucial: preventMouseDown prevents stealing keyboard focus from active input elements
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      disabled={disabled}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={`inline-flex items-center justify-center transition-all duration-200 border cursor-pointer select-none
        ${currentSize.btn}
        ${
          isThisPlaying
            ? "border-[var(--primary)] text-[var(--primary)] dark:text-[var(--primary-fg)] bg-[var(--sakura-light)] shadow-sm scale-105 animate-pulse"
            : "border-[var(--line,#e2e8f0)] dark:border-neutral-800 bg-[var(--surface,#ffffff)] text-[var(--muted,#64748b)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--surface-hover,#f8fafc)]"
        }
        ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "active:scale-95"}
        ${className}
      `}
    >
      <Volume2 className={`${currentSize.icon} shrink-0 ${isThisPlaying ? "animate-bounce" : ""}`} />
      {showText && <span className="ml-1.5 font-medium">{text}</span>}
    </button>
  );
};

export default AudioButton;

