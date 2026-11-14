"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, FastForward } from "lucide-react";

interface VnDialogueBoxProps {
  speakerNameJa: string;
  speakerNameEn: string;
  speakerRoleEn?: string;
  textJa: string;
  readingHiragana: string;
  textEn: string;
  isSpeaking: boolean;
  showFurigana: boolean;
  showEnglish: boolean;
  onReplayAudio: () => void;
  onToggleFurigana: () => void;
  onToggleEnglish: () => void;
}

export const VnDialogueBox: React.FC<VnDialogueBoxProps> = ({
  speakerNameJa,
  speakerNameEn,
  textJa,
  readingHiragana,
  textEn,
  isSpeaking,
  showFurigana,
  showEnglish,
  onReplayAudio,
}) => {
  const isNarration = textJa.startsWith("（") && textJa.endsWith("）");

  // Typewriter effect state
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset and restart typewriter on new textJa
  useEffect(() => {
    // If narration, reveal instantly
    if (isNarration) {
      setDisplayedLength(textJa.length);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    let current = 0;
    const speedMs = 38; // Classic comfortable VN typewriter speed

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      current += 1;
      setDisplayedLength(current);
      if (current >= textJa.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTyping(false);
      }
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [textJa, isNarration]);

  // Click-to-skip typewriter instantly
  const handleSkipTypewriter = () => {
    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedLength(textJa.length);
      setIsTyping(false);
    }
  };

  const visibleJaText = textJa.slice(0, displayedLength);

  return (
    <div
      onClick={handleSkipTypewriter}
      className="relative w-full max-w-4xl mx-auto cursor-pointer"
      title={isTyping ? "Click anywhere to finish revealing dialogue" : undefined}
    >
      {/* Floating Nameplate Banner */}
      {!isNarration && (
        <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 rounded-t-lg rounded-br-lg border border-[var(--sakura)]/80 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover,#b3002d)] px-3 py-1 shadow-[0_3px_12px_rgba(188,0,45,0.35)] select-none">
          <span className="font-japanese text-xs font-extrabold tracking-wide text-white drop-shadow-xs">
            {speakerNameJa}
          </span>
          <span className="text-[10px] font-medium text-white/80">· {speakerNameEn}</span>
        </div>
      )}

      {/* Main Frosted Glass Dialogue Window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/80 p-3.5 pt-4.5 sm:p-4.5 sm:pt-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:border-white/30">
        {/* Decorative sakura accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent opacity-80" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {/* Japanese Dialogue Line with Typewriter Reveal */}
            <p
              lang="ja"
              className={`font-japanese text-sm sm:text-base md:text-lg font-bold leading-relaxed text-white drop-shadow-sm ${
                isNarration ? "italic text-white/80 text-xs sm:text-sm" : ""
              }`}
            >
              <span>{visibleJaText}</span>
              {/* Typewriter Blinking Cursor */}
              {isTyping && (
                <span className="inline-block w-1.5 h-4 ml-1 translate-y-0.5 bg-[var(--sakura)] animate-pulse rounded-full" />
              )}
            </p>

            {/* Optional Hiragana Reading Subtitle (fades in once revealed) */}
            {showFurigana && readingHiragana && readingHiragana !== textJa && !isTyping && (
              <p
                lang="ja"
                className="font-japanese text-[11px] sm:text-xs text-[var(--sakura-light)]/90 leading-tight drop-shadow-xs animate-in fade-in duration-200"
              >
                {readingHiragana}
              </p>
            )}

            {/* English Translation (fades in once revealed) */}
            {showEnglish && textEn && !isTyping && (
              <p className="text-[11px] sm:text-xs leading-normal text-slate-300/85 animate-in fade-in duration-200">
                {textEn}
              </p>
            )}
          </div>

          {/* Action Buttons: Fast Forward / Replay Audio */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isTyping && (
              <button
                type="button"
                onClick={handleSkipTypewriter}
                className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                title="Skip typewriter animation"
                aria-label="Skip typewriter animation"
              >
                <FastForward className="size-4" />
              </button>
            )}

            {!isNarration && (
              <button
                type="button"
                onClick={onReplayAudio}
                className={`group flex size-9 sm:size-10 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isSpeaking
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(244,114,182,0.6)]"
                    : "border-white/15 bg-white/10 text-white/80 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white"
                }`}
                title="Replay dialogue audio"
                aria-label="Replay audio"
              >
                <Volume2
                  className={`size-4 transition-transform group-hover:scale-110 ${
                    isSpeaking ? "animate-pulse" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
