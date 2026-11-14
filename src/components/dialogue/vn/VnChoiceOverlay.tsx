"use client";

import React, { useEffect } from "react";
import { DialogueChoice } from "@/data/dialogue/types";
import { Volume2, ArrowRight } from "lucide-react";

interface VnChoiceOverlayProps {
  choices: DialogueChoice[];
  onSelectChoice: (choice: DialogueChoice) => void;
  onPreviewAudio: (textJa: string, id: string, reading?: string, romaji?: string) => void;
  showEnglish: boolean;
  disabled?: boolean;
}

export const VnChoiceOverlay: React.FC<VnChoiceOverlayProps> = ({
  choices,
  onSelectChoice,
  onPreviewAudio,
  showEnglish,
  disabled = false,
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
    <div className="relative z-30 w-full max-w-2xl mx-auto space-y-1">
      <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
        <span className="flex items-center gap-1.5 drop-shadow-xs">
          <span>Choose Response</span>
          <span className="font-normal text-white/50">(Keys: 1–{choices.length})</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {choices.map((choice, index) => {
          return (
            <div
              key={choice.id}
              onClick={() => !disabled && onSelectChoice(choice)}
              className={`group relative flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-slate-950/80 px-2.5 py-1.5 sm:px-3 sm:py-2 text-left shadow-md backdrop-blur-md transition-all hover:border-[var(--sakura)] hover:bg-slate-900/95 hover:scale-[1.01] hover:shadow-[0_4px_16px_rgba(244,114,182,0.2)] cursor-pointer ${
                disabled ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="flex size-4 sm:size-5 shrink-0 items-center justify-center rounded-md bg-white/15 text-[10px] font-extrabold text-white group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    lang="ja"
                    className="font-japanese text-xs sm:text-[13px] font-bold text-white leading-tight drop-shadow-xs group-hover:text-[var(--sakura-light)] transition-colors truncate"
                  >
                    {choice.textJa}
                  </p>

                  {showEnglish && choice.textEn && (
                    <p className="text-[10px] text-slate-300/80 leading-tight truncate mt-0.5">
                      {choice.textEn}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewAudio(choice.textJa, choice.id, choice.readingHiragana, choice.romaji);
                  }}
                  className="flex size-5 sm:size-6 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white/70 transition-colors hover:border-[var(--sakura)] hover:bg-white/25 hover:text-white cursor-pointer"
                  title="Pronounce response"
                  aria-label={`Pronounce option ${index + 1}`}
                >
                  <Volume2 className="size-2.5 sm:size-3" />
                </button>

                <ArrowRight className="size-3 text-white/40 group-hover:text-[var(--sakura-light)] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
