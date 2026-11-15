"use client";

import React, { useEffect } from "react";
import { DialogueChoice } from "@/data/dialogue/types";
import { Volume2, ArrowRight } from "lucide-react";

interface VnChoiceOverlayProps {
  choices: DialogueChoice[];
  selectedChoiceId?: string | null;
  onSelectChoice: (choice: DialogueChoice) => void;
  onPreviewAudio: (textJa: string, id: string, reading?: string, romaji?: string) => void;
  showEnglish: boolean;
  disabled?: boolean;
  isFullscreen?: boolean;
}

export const VnChoiceOverlay: React.FC<VnChoiceOverlayProps> = ({
  choices,
  selectedChoiceId,
  onSelectChoice,
  onPreviewAudio,
  showEnglish,
  disabled = false,
  isFullscreen = false,
}) => {
  // Support keyboard selection (1 - 4)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= choices.length) {
        e.preventDefault();
        onSelectChoice(choices[num - 1]!);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, disabled, onSelectChoice]);

  return (
    <div
      className={`relative z-30 w-full mx-auto transition-all duration-300 ${
        isFullscreen
          ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl space-y-2 sm:space-y-2.5"
          : "max-w-2xl space-y-1"
      }`}
    >
      <div
        className={`flex items-center justify-between px-1 font-bold uppercase tracking-wider text-white/70 ${
          isFullscreen ? "text-xs sm:text-sm xl:text-base mb-1" : "text-[10px]"
        }`}
      >
        <span className="flex items-center gap-1.5 drop-shadow-xs">
          <span>Choose Response</span>
          <span className="font-normal text-white/50">(Keys: 1–{choices.length})</span>
        </span>
      </div>

      <div
        className={`grid grid-cols-2 ${
          isFullscreen ? "gap-2.5 sm:gap-3.5 xl:gap-4" : "gap-1.5 sm:gap-2"
        }`}
      >
        {choices.map((choice, index) => {
          const isSelected = selectedChoiceId === choice.id;
          return (
            <div
              key={choice.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onSelectChoice(choice);
              }}
              className={`group relative flex items-center justify-between border text-left shadow-md backdrop-blur-md transition-all cursor-pointer ${
                isFullscreen
                  ? "gap-3 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3.5 xl:px-6 xl:py-4"
                  : "gap-2 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2"
              } ${
                isSelected
                  ? "border-[var(--sakura)] bg-gradient-to-r from-[var(--primary)]/35 to-slate-900/90 shadow-[0_0_24px_rgba(244,114,182,0.45)] ring-2 ring-[var(--sakura)]/80 scale-[1.01]"
                  : disabled
                  ? "border-white/10 bg-slate-950/60 opacity-40 pointer-events-none scale-[0.99]"
                  : "border-white/20 bg-slate-950/80 hover:border-[var(--sakura)] hover:bg-slate-900/95 hover:scale-[1.01] hover:shadow-[0_4px_16px_rgba(244,114,182,0.2)]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`flex shrink-0 items-center justify-center font-extrabold text-white transition-colors ${
                    isFullscreen
                      ? "size-6 sm:size-7 xl:size-8 rounded-lg sm:rounded-xl text-xs sm:text-sm xl:text-base"
                      : "size-4 sm:size-5 rounded-md text-[10px]"
                  } ${
                    isSelected
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-white/15 group-hover:bg-[var(--primary)] group-hover:text-white"
                  }`}
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    lang="ja"
                    className={`font-japanese font-bold text-white leading-tight drop-shadow-xs transition-colors truncate ${
                      isFullscreen
                        ? "text-sm sm:text-base md:text-lg xl:text-xl"
                        : "text-xs sm:text-[13px]"
                    } ${
                      isSelected ? "text-pink-100" : "group-hover:text-pink-200"
                    }`}
                  >
                    {choice.textJa}
                  </p>

                  {showEnglish && choice.textEn && (
                    <p
                      className={`text-slate-300/80 leading-tight truncate ${
                        isFullscreen
                          ? "text-xs sm:text-sm xl:text-base mt-1"
                          : "text-[10px] mt-0.5"
                      }`}
                    >
                      {choice.textEn}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewAudio(choice.textJa, choice.id, choice.readingHiragana, choice.romaji);
                    }}
                    className={`flex items-center justify-center border border-white/10 bg-white/10 text-white/70 transition-colors hover:border-[var(--sakura)] hover:bg-white/25 hover:text-white cursor-pointer ${
                      isFullscreen
                        ? "size-7 sm:size-8 xl:size-9 rounded-lg sm:rounded-xl"
                        : "size-5 sm:size-6 rounded-md"
                    }`}
                    title="Pronounce response"
                    aria-label={`Pronounce option ${index + 1}`}
                  >
                    <Volume2
                      className={
                        isFullscreen
                          ? "size-3.5 sm:size-4 xl:size-4.5"
                          : "size-2.5 sm:size-3"
                      }
                    />
                  </button>
                )}

                {isSelected ? (
                  <Volume2
                    className={`${
                      isFullscreen ? "size-4 sm:size-5" : "size-3.5"
                    } text-pink-300 animate-pulse shrink-0`}
                  />
                ) : (
                  <ArrowRight
                    className={`${
                      isFullscreen ? "size-4 sm:size-5" : "size-3"
                    } text-white/40 group-hover:text-pink-200 group-hover:translate-x-0.5 transition-all`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
