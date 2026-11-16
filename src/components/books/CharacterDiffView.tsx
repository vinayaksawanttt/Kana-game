"use client";

import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { getCharacterDiff } from "@/lib/books/characterDiff";
import { AudioButton } from "@/components/ui/AudioButton";

interface CharacterDiffViewProps {
  userInput: string;
  expectedAnswer: string;
  showAudio?: boolean;
  className?: string;
}

export function CharacterDiffView({
  userInput,
  expectedAnswer,
  showAudio = true,
  className = "",
}: CharacterDiffViewProps) {
  const { closestAnswer, diff } = useMemo(
    () => getCharacterDiff(userInput, expectedAnswer),
    [userInput, expectedAnswer]
  );

  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3 animate-in fade-in duration-200 ${className}`}
      data-testid="character-diff-view"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
          <AlertCircle size={14} />
          <span>Needs Correction — Character Comparison</span>
        </div>
        {showAudio && (
          <AudioButton
            text={closestAnswer}
            mode="sentence"
            size="sm"
            label="Listen to expected answer"
          />
        )}
      </div>

      {/* Side-by-side or stacked diff view */}
      <div className="space-y-2 text-xs sm:text-sm font-japanese">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Your Input:
          </span>
          <div className="flex-1 font-medium text-[var(--ink)] break-all">
            {diff.userParts.map((part, idx) =>
              part.type === "wrong" ? (
                <span
                  key={idx}
                  className="mx-0.5 rounded border border-rose-500/40 bg-rose-500/20 px-1 py-0.5 font-bold text-rose-600 line-through dark:text-rose-400"
                >
                  {part.text}
                </span>
              ) : (
                <span key={idx}>{part.text}</span>
              )
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Expected:
          </span>
          <div className="flex-1 font-semibold text-[var(--ink)] break-all">
            {diff.expectedParts.map((part, idx) =>
              part.type === "missing" ? (
                <span
                  key={idx}
                  className="mx-0.5 rounded border border-emerald-500/40 bg-emerald-500/20 px-1 py-0.5 font-bold text-emerald-700 underline decoration-emerald-500/50 dark:text-emerald-300"
                >
                  {part.text}
                </span>
              ) : (
                <span key={idx}>{part.text}</span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Summary chips highlighting specific missed particles/conjugations */}
      {diff.missedSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Mistakes:
          </span>
          {diff.missedSummary.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--surface)] border border-[var(--line)] px-2 py-0.5 font-japanese text-[var(--ink)] shadow-2xs"
            >
              {item.user ? (
                <span className="text-rose-600 line-through dark:text-rose-400">
                  {item.user}
                </span>
              ) : null}
              {item.user && item.expected ? <span>→</span> : null}
              {item.expected ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.expected}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
