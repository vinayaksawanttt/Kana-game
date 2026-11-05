"use client";

import React from "react";
import { Volume2 } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { toKanaAudioKey } from "@/engine/audio";

export interface AudioButtonProps {
  /** The kana or Japanese character/mora to pronounce */
  text: string;
  /** Optional canonical romaji hint if character is non-standard */
  romaji?: string;
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
  romaji,
  size = "md",
  label,
  className = "",
  showText = false,
  disabled = false,
}) => {
  const { playKana, isPlaying, activeKey } = useJapaneseAudio();
  const slug = toKanaAudioKey(text, romaji);
  const isThisPlaying = isPlaying && activeKey === slug;
  const currentSize = SIZE_STYLES[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
    playKana(text, romaji);
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
            ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-subtle,#fff1f2)] shadow-sm scale-105 animate-pulse"
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

