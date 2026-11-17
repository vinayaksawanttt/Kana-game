/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { cn } from "./ui/tokens";
import {
  getCharacterAvatar,
  type CharacterAvatar as CharacterAvatarData,
} from "@/features/books/engine/characterAvatars";

export interface CharacterAvatarProps {
  /** English speaker name (e.g. "Mary", "Takeshi", "Host father") */
  speaker?: string | null;
  /** Japanese speaker name (e.g. "メアリー", "たけし", "お父さん") */
  speakerJa: string;
  /** Whether this character is actively speaking audio right now */
  isSpeaking?: boolean;
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Optional container class name */
  className?: string;
  /** Custom accessible tooltip title */
  title?: string;
  /** Fallback theme configuration for unknown characters or load failures */
  fallbackTheme?: {
    gradient?: string;
    initial?: string;
  };
}

const SIZE_CLASSES = {
  xs: "size-5 text-[9px] rounded-md",
  sm: "size-8 text-xs rounded-xl",
  md: "size-11 text-base rounded-2xl",
  lg: "size-16 text-xl rounded-2xl",
  xl: "size-20 text-2xl rounded-3xl",
};

export function CharacterAvatar({
  speaker,
  speakerJa,
  isSpeaking = false,
  size = "md",
  className,
  title,
  fallbackTheme,
}: CharacterAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const avatar: CharacterAvatarData | null = getCharacterAvatar(speaker, speakerJa);

  // Preload both expressions into memory so switching has zero flicker
  useEffect(() => {
    if (typeof window !== "undefined" && avatar) {
      const neutralImg = new Image();
      neutralImg.src = avatar.neutral;
      const talkingImg = new Image();
      talkingImg.src = avatar.talking;
    }
  }, [avatar]);

  const displayTitle =
    title ||
    `${speakerJa}${speaker ? ` (${speaker})` : ""}${
      avatar ? ` - ${avatar.name}` : ""
    }${isSpeaking ? " (Speaking)" : ""}`;

  const cleanInitial =
    fallbackTheme?.initial ||
    speakerJa
      .trim()
      .replace(/^[木村|田中|山下|鈴木|佐藤]/, "")
      .charAt(0) ||
    speakerJa.trim().charAt(0) ||
    "?";

  // Fallback state if avatar is not in registry or image file failed to load
  if (!avatar || hasImageError) {
    return (
      <div
        className={cn(
          "grid place-items-center font-japanese font-black shadow-xs transition-transform select-none shrink-0",
          SIZE_CLASSES[size],
          fallbackTheme?.gradient || "from-sky-500 to-blue-600 text-white bg-gradient-to-br",
          isSpeaking && "scale-105 ring-2 ring-[var(--tb-primary)]",
          className
        )}
        title={displayTitle}
        role="img"
        aria-label={displayTitle}
      >
        {cleanInitial}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden shrink-0 border transition-all duration-200 select-none",
        "bg-gradient-to-b from-sky-50/40 to-slate-100/80 dark:from-slate-900/60 dark:to-slate-800/80",
        SIZE_CLASSES[size],
        isSpeaking
          ? "border-[var(--tb-primary)] ring-2 ring-[var(--tb-primary)] shadow-md scale-105"
          : "border-[var(--tb-border)] shadow-2xs hover:border-[var(--tb-primary)]/40",
        className
      )}
      title={displayTitle}
      role="img"
      aria-label={displayTitle}
      data-character-id={avatar.id}
      data-speaking={isSpeaking ? "true" : "false"}
    >
      {/* Neutral Expression */}
      <img
        src={avatar.neutral}
        alt={`${avatar.name} (neutral)`}
        onError={() => setHasImageError(true)}
        className={cn(
          "absolute inset-0 size-full object-cover object-top transition-opacity duration-200 ease-in-out pointer-events-none",
          isSpeaking ? "opacity-0" : "opacity-100"
        )}
        loading="eager"
        decoding="async"
      />

      {/* Talking Expression */}
      <img
        src={avatar.talking}
        alt={`${avatar.name} (talking)`}
        onError={() => setHasImageError(true)}
        className={cn(
          "absolute inset-0 size-full object-cover object-top transition-opacity duration-200 ease-in-out pointer-events-none",
          isSpeaking ? "opacity-100" : "opacity-0"
        )}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
