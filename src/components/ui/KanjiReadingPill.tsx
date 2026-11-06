"use client";

import React from "react";
import { Volume2 } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { resolveKanjiReadingAudio } from "@/engine/audio";

export interface KanjiReadingPillProps {
  /** Raw KANJIDIC reading string (e.g., "コウ", "たか.い", "-はじ.める") */
  reading: string;
  /** Type of reading: "on" (On'yomi) or "kun" (Kun'yomi) */
  type: "on" | "kun";
  /** Size variant */
  size?: "sm" | "md";
  /** Optional extra Tailwind CSS classes */
  className?: string;
  /** Whether to show the volume icon (default true) */
  showSpeakerIcon?: boolean;
}

export const KanjiReadingPill: React.FC<KanjiReadingPillProps> = ({
  reading,
  type,
  size = "md",
  className = "",
  showSpeakerIcon = true,
}) => {
  const { playReading, isPlaying, activeKey } = useJapaneseAudio();
  const payload = resolveKanjiReadingAudio(reading);
  const isThisActive = isPlaying && activeKey === payload.slug;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playReading(reading);
  };

  // Format reading text: if okurigana dot exists (e.g., "たか.い"), format the okurigana subtly
  const dotIndex = reading.indexOf(".");
  const stem = dotIndex !== -1 ? reading.slice(0, dotIndex) : reading;
  const okurigana = dotIndex !== -1 ? reading.slice(dotIndex + 1) : null;

  const isSm = size === "sm";

  return (
    <button
      type="button"
      // Crucial: prevent focus stealing from search or game inputs
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      aria-label={`Listen to ${type === "on" ? "On'yomi" : "Kun'yomi"} reading ${reading}`}
      title={`Listen to ${reading}`}
      className={`group inline-flex items-center gap-1.5 rounded-lg border transition-all duration-200 cursor-pointer select-none
        ${isSm ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"}
        ${
          isThisActive
            ? "border-[var(--primary)] text-[var(--primary)] dark:text-[var(--primary-fg)] bg-[var(--sakura-light)] font-bold shadow-sm scale-105 animate-pulse"
            : "border-[var(--line,#e2e8f0)] dark:border-neutral-800 bg-[var(--surface,#ffffff)] text-[var(--ink,#1e293b)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover,#f8fafc)]"
        }
        active:scale-95
        ${className}
      `}
    >
      <span className="font-japanese font-medium leading-none">
        <span>{stem}</span>
        {okurigana && (
          <span className="opacity-60 text-[0.88em]">.{okurigana}</span>
        )}
      </span>
      {showSpeakerIcon && (
        <Volume2
          className={`shrink-0 transition-opacity ${
            isSm ? "size-3" : "size-3.5"
          } ${
            isThisActive
              ? "text-[var(--primary)] opacity-100 animate-bounce"
              : "opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)]"
          }`}
        />
      )}
    </button>
  );
};

export default KanjiReadingPill;

