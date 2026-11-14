"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const normExpr = expression.toLowerCase();
  const spriteUrl = getScenarioCharacterSpriteUrl(scenarioId, normExpr);

  // Detect negative / startled expressions that trigger emotional effects
  const isShakeEmotion = useMemo(() => {
    return (
      normExpr.includes("annoy") ||
      normExpr.includes("confuse") ||
      normExpr.includes("disappoint") ||
      normExpr.includes("backstare") ||
      normExpr.includes("embarras") ||
      normExpr.includes("sad") ||
      normExpr.includes("scold") ||
      normExpr.includes("stern") ||
      normExpr.includes("troubl")
    );
  }, [normExpr]);

  const emoteIcon = useMemo(() => {
    if (normExpr.includes("confuse")) return "❓";
    if (normExpr.includes("embarras") || normExpr.includes("disappoint") || normExpr.includes("sad") || normExpr.includes("worr") || normExpr.includes("troubl")) return "💧";
    if (normExpr.includes("annoy") || normExpr.includes("backstare") || normExpr.includes("scold") || normExpr.includes("stern")) return "💢";
    if (normExpr.includes("surpris")) return "❗";
    if (normExpr.includes("happy") || normExpr.includes("proud") || normExpr.includes("reliev") || normExpr.includes("reliv")) return "✨";
    return null;
  }, [normExpr]);

  return (
    <div className="pointer-events-none relative flex h-full w-full items-end justify-center select-none overflow-visible">
      {spriteUrl ? (
        <div className="relative flex h-[86%] sm:h-[92%] w-auto items-end justify-center">
          {/* Subtle speaker aura when speaking */}
          {isSpeaking && (
            <div className="absolute inset-x-8 bottom-12 top-10 -z-10 animate-pulse rounded-full bg-[var(--primary)]/20 blur-2xl" />
          )}

          {/* Sprite Cross-Fade with Screen Shake on negative emotions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${characterName}-${normExpr}-${spriteUrl}`}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={
                isShakeEmotion
                  ? {
                      opacity: 1,
                      scale: 1,
                      x: [0, -7, 6, -5, 4, -2, 0],
                      transition: {
                        opacity: { duration: 0.25, ease: "easeOut" },
                        scale: { duration: 0.25, ease: "easeOut" },
                        x: { duration: 0.42, ease: "easeInOut", delay: 0.05 },
                      },
                    }
                  : {
                      opacity: 1,
                      scale: 1,
                      x: 0,
                      transition: { duration: 0.28, ease: "easeOut" },
                    }
              }
              exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.2, ease: "easeIn" } }}
              className="relative aspect-[2/3] h-full w-auto flex items-end justify-center"
            >
              {/* Anime Emote Pop anchored to upper-right beside the character's head (never covering the face) */}
              <AnimatePresence>
                {emoteIcon && (
                  <motion.div
                    key={`emote-${normExpr}`}
                    initial={{ opacity: 0, scale: 0.3, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 4 }}
                    transition={{ type: "spring", stiffness: 450, damping: 18 }}
                    className="absolute top-[3%] left-[63%] z-30 flex size-10 sm:size-12 items-center justify-center rounded-2xl border border-white/25 bg-slate-950/80 text-xl sm:text-2xl shadow-[0_8px_25px_rgba(0,0,0,0.65)] backdrop-blur-md"
                  >
                    <span className="drop-shadow-md select-none">{emoteIcon}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spriteUrl}
                alt={`${characterName} - ${expression}`}
                className="h-full w-full object-contain drop-shadow-[0_16px_35px_rgba(0,0,0,0.7)]"
                style={{
                  filter: isSpeaking
                    ? "drop-shadow(0 0 16px rgba(244,114,182,0.35)) drop-shadow(0 16px 30px rgba(0,0,0,0.7))"
                    : undefined,
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Stylized Avatar Silhouette Fallback for scenarios before sprites are supplied */
        <motion.div
          key={characterName}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-28 flex flex-col items-center"
        >
          <div
            className={`relative flex size-32 items-center justify-center rounded-3xl border-2 border-[var(--sakura)]/70 bg-[var(--surface)]/90 text-6xl shadow-2xl backdrop-blur-md transition-all ${
              isSpeaking ? "scale-105 border-[var(--primary)] ring-4 ring-[var(--primary)]/30" : ""
            }`}
          >
            {emoteIcon && (
              <span className="absolute -top-3 -right-3 z-30 flex size-10 items-center justify-center rounded-xl border border-white/25 bg-slate-950/85 text-xl shadow-lg">
                {emoteIcon}
              </span>
            )}
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
        </motion.div>
      )}
    </div>
  );
};
