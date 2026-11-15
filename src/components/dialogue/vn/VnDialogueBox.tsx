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
  autoPlayAudio?: boolean;
  isFullscreen?: boolean;
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
  autoPlayAudio = false,
  isFullscreen = false,
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
      className={`relative w-full mx-auto cursor-pointer transition-all duration-300 ${
        isFullscreen ? "max-w-5xl xl:max-w-6xl 2xl:max-w-7xl" : "max-w-4xl"
      }`}
      title={isTyping ? "Click anywhere to finish revealing dialogue" : undefined}
    >
      {/* Floating Nameplate Banner */}
      {!isNarration && (
        <div
          className={`absolute z-20 flex items-center border border-[var(--sakura)]/80 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover,#b3002d)] shadow-[0_3px_12px_rgba(188,0,45,0.35)] select-none ${
            isFullscreen
              ? "-top-4.5 sm:-top-5 left-6 sm:left-8 gap-2 rounded-t-xl rounded-br-xl px-4 py-1.5 sm:px-5 sm:py-2"
              : "-top-3.5 left-4 gap-1.5 rounded-t-lg rounded-br-lg px-3 py-1"
          }`}
        >
          <span
            className={`font-japanese font-extrabold tracking-wide text-white drop-shadow-xs ${
              isFullscreen ? "text-sm sm:text-base xl:text-lg" : "text-xs"
            }`}
          >
            {speakerNameJa}
          </span>
          <span
            className={`font-medium text-white/80 ${
              isFullscreen ? "text-xs sm:text-sm xl:text-base" : "text-[10px]"
            }`}
          >
            · {speakerNameEn}
          </span>
        </div>
      )}

      {/* Main Frosted Glass Dialogue Window */}
      <div
        className={`relative overflow-hidden border border-white/20 bg-slate-950/80 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:border-white/30 ${
          isFullscreen
            ? "rounded-2xl sm:rounded-3xl p-5 pt-6 sm:p-7 sm:pt-8 xl:p-9 xl:pt-10"
            : "rounded-2xl p-3.5 pt-4.5 sm:p-4.5 sm:pt-5"
        }`}
      >
        {/* Decorative sakura accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent opacity-80" />

        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
            {/* Japanese Dialogue Line with Typewriter Reveal */}
            <p
              lang="ja"
              className={`font-japanese font-bold leading-relaxed text-white drop-shadow-sm ${
                isFullscreen
                  ? isNarration
                    ? "italic text-white/80 text-sm sm:text-base xl:text-lg"
                    : "text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl"
                  : isNarration
                  ? "italic text-white/80 text-xs sm:text-sm"
                  : "text-sm sm:text-base md:text-lg"
              }`}
            >
              <span>{visibleJaText}</span>
              {/* Typewriter Blinking Cursor */}
              {isTyping && (
                <span
                  className={`inline-block ml-1 translate-y-0.5 bg-[var(--sakura)] animate-pulse rounded-full ${
                    isFullscreen ? "w-2 h-5 sm:w-2.5 sm:h-6" : "w-1.5 h-4"
                  }`}
                />
              )}
            </p>

            {/* Optional Hiragana Reading Subtitle (fades in once revealed) */}
            {showFurigana && readingHiragana && readingHiragana !== textJa && !isTyping && (
              <p
                lang="ja"
                className={`font-japanese text-pink-200/90 leading-tight drop-shadow-xs animate-in fade-in duration-200 ${
                  isFullscreen
                    ? "text-xs sm:text-sm md:text-base xl:text-lg"
                    : "text-[11px] sm:text-xs"
                }`}
              >
                {readingHiragana}
              </p>
            )}

            {/* English Translation (fades in once revealed) */}
            {showEnglish && textEn && !isTyping && (
              <p
                className={`leading-normal text-slate-300/85 animate-in fade-in duration-200 ${
                  isFullscreen
                    ? "text-xs sm:text-sm md:text-base xl:text-lg mt-1"
                    : "text-[11px] sm:text-xs"
                }`}
              >
                {textEn}
              </p>
            )}
          </div>

          {/* Action Buttons: Fast Forward / Replay Audio (hidden when autoplay voice is ON) */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isTyping && (
              <button
                type="button"
                onClick={handleSkipTypewriter}
                className={`flex items-center justify-center border border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:bg-white/20 hover:text-white transition-all cursor-pointer ${
                  isFullscreen
                    ? "size-11 sm:size-12 xl:size-14 rounded-xl sm:rounded-2xl"
                    : "size-9 sm:size-10 rounded-xl"
                }`}
                title="Skip typewriter animation"
                aria-label="Skip typewriter animation"
              >
                <FastForward className={isFullscreen ? "size-5 sm:size-6" : "size-4"} />
              </button>
            )}

            {!autoPlayAudio && !isNarration && (
              <button
                type="button"
                onClick={onReplayAudio}
                className={`group flex items-center justify-center border transition-all cursor-pointer ${
                  isFullscreen
                    ? "size-11 sm:size-12 xl:size-14 rounded-xl sm:rounded-2xl"
                    : "size-9 sm:size-10 rounded-xl"
                } ${
                  isSpeaking
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_12px_rgba(244,114,182,0.6)]"
                    : "border-white/15 bg-white/10 text-white/80 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white"
                }`}
                title="Replay dialogue audio"
                aria-label="Replay audio"
              >
                <Volume2
                  className={`${
                    isFullscreen ? "size-5 sm:size-6" : "size-4"
                  } transition-transform group-hover:scale-110 ${
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
