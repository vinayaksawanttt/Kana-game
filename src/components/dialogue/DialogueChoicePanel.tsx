"use client";

import React, { useState } from "react";
import { DialogueChoice } from "@/data/dialogue/types";
import { Volume2, Check, ArrowRight } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

interface DialogueChoicePanelProps {
  choices: DialogueChoice[];
  onSelectChoice: (choice: DialogueChoice) => void;
  disabled?: boolean;
}

export const DialogueChoicePanel: React.FC<DialogueChoicePanelProps> = ({
  choices,
  onSelectChoice,
  disabled = false,
}) => {
  const { playSentence } = useJapaneseAudio();
  const [showEnglish, setShowEnglish] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-[var(--muted)]">
          Choose how you want to respond ({choices.length} options):
        </span>
        <button
          type="button"
          onClick={() => setShowEnglish(!showEnglish)}
          className="text-xs text-[var(--muted)] hover:text-[var(--primary)] underline transition-colors"
        >
          {showEnglish ? "Hide English hints" : "Show English hints"}
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {choices.map((choice, index) => {
          return (
            <div
              key={choice.id}
              onClick={() => !disabled && onSelectChoice(choice)}
              className={`group relative flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] p-4 text-left transition-all hover:border-[var(--primary)] hover:shadow-md cursor-pointer ${
                disabled ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-[var(--line)] text-xs font-bold text-[var(--ink)]">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSentence(choice.textJa, choice.id, {
                        reading: choice.readingHiragana,
                        romaji: choice.romaji,
                      });
                    }}
                    className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--line)] transition-colors"
                    title="Pronounce choice"
                  >
                    <Volume2 className="size-4" />
                  </button>
                </div>

                <p lang="ja" className="font-japanese mt-2 text-base font-semibold text-[var(--ink)] leading-snug">
                  {choice.textJa}
                </p>

                {choice.readingHiragana !== choice.textJa && (
                  <p className="mt-1 text-xs text-[var(--muted)] font-japanese">
                    {choice.readingHiragana}
                  </p>
                )}

                {showEnglish && (
                  <p className="mt-1.5 text-xs text-[var(--muted)]/90 leading-relaxed">
                    {choice.textEn}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end text-xs font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Select this response</span>
                <ArrowRight className="size-3.5 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
