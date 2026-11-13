"use client";

import React, { useState, useEffect } from "react";
import { getScenarioCharacterSpriteUrl } from "@/data/dialogue/assets";

interface VnCharacterSpriteProps {
  scenarioId: string;
  characterName: string;
  expression?: string;
  isSpeaking?: boolean;
  fallbackAvatar?: string;
}

export const VnCharacterSprite: React.FC<VnCharacterSpriteProps> = ({
  scenarioId,
  characterName,
  expression = "neutral",
  isSpeaking = false,
  fallbackAvatar = "👤",
}) => {
  const spriteUrl = getScenarioCharacterSpriteUrl(scenarioId, expression);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(spriteUrl);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let active = true;
    if (spriteUrl && spriteUrl !== currentUrl) {
      setSwitching(true);
      const timer = setTimeout(() => {
        if (active) {
          setCurrentUrl(spriteUrl);
          setSwitching(false);
        }
      }, 150);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else if (spriteUrl && !currentUrl) {
      setCurrentUrl(spriteUrl);
    }
  }, [spriteUrl, currentUrl]);

  return (
    <div className="pointer-events-none relative flex h-full w-full items-end justify-center select-none">
      {currentUrl ? (
        <div className="relative flex h-[86%] sm:h-[94%] w-auto items-end justify-center">
          {/* Subtle speaker aura when speaking */}
          {isSpeaking && (
            <div className="absolute inset-x-8 bottom-12 top-10 -z-10 animate-pulse rounded-full bg-[var(--primary)]/20 blur-2xl" />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={`${characterName} - ${expression}`}
            className={`h-full w-auto max-w-[90vw] sm:max-w-lg object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.7)] transition-opacity duration-300 ease-out ${
              switching ? "opacity-75" : "opacity-100"
            }`}
            style={{
              filter: isSpeaking
                ? "drop-shadow(0 0 16px rgba(244,114,182,0.35)) drop-shadow(0 16px 30px rgba(0,0,0,0.7))"
                : undefined,
            }}
          />
        </div>
      ) : (
        /* Stylized Avatar Silhouette Fallback for scenarios before sprites are supplied */
        <div className="mb-28 flex flex-col items-center">
          <div
            className={`relative flex size-32 items-center justify-center rounded-3xl border-2 border-[var(--sakura)]/70 bg-[var(--surface)]/90 text-6xl shadow-2xl backdrop-blur-md transition-all ${
              isSpeaking ? "scale-105 border-[var(--primary)] ring-4 ring-[var(--primary)]/30" : ""
            }`}
          >
            {fallbackAvatar}
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex size-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                <span className="relative inline-flex size-5 rounded-full bg-[var(--primary)] text-[10px] font-bold text-white items-center justify-center">
                  ♪
                </span>
              </span>
            )}
          </div>
          <div className="mt-2.5 rounded-full border border-white/10 bg-black/60 px-4 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
            {characterName}
          </div>
        </div>
      )}
    </div>
  );
};
