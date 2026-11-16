"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { type BookLesson } from "@/data/books";
import { generateDialogueClozeQuestions } from "@/lib/books/dialogueCloze";
import { AudioButton } from "@/components/ui/AudioButton";
import { playGameSfx } from "@/lib/game-core/sfx";

interface DialogueClozeTestProps {
  lesson: BookLesson;
  showEnglish: boolean;
  onClose: () => void;
}

export function DialogueClozeTest({
  lesson,
  showEnglish,
  onClose,
}: DialogueClozeTestProps) {
  const questions = useMemo(
    () => generateDialogueClozeQuestions(lesson, 10),
    [lesson]
  );

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctAnswer
  ).length;

  const handleSelectOption = (questionId: string, option: string, correctAnswer: string) => {
    if (selectedAnswers[questionId]) return; // Already answered
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
    if (option === correctAnswer) {
      playGameSfx("correct-chime");
    } else {
      playGameSfx("incorrect-chime");
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
  };

  return (
    <div className="rounded-3xl border-2 border-[var(--primary)]/30 bg-[var(--surface)] shadow-md overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-[var(--line)] bg-[var(--sakura-light)]/25 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-2xs">
            <HelpCircle size={16} />
          </span>
          <div>
            <h4 className="text-sm font-black text-[var(--ink)]">
              Contextual Grammar Cloze Test · Lesson {lesson.lessonNumber}
            </h4>
            <p className="text-[11px] text-[var(--muted)]">
              Choose the grammatically accurate form within the dialogue&apos;s conversational context.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {answeredCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {correctCount} / {answeredCount} Correct
              </span>
              <button
                onClick={handleReset}
                title="Reset quiz"
                className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={14} />
            <span>Close Cloze</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-overlay)]/30 p-8 text-center">
            <p className="text-sm font-bold text-[var(--ink)]">
              No cloze items generated for this lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, idx) => {
              const chosen = selectedAnswers[q.id];
              const isAnswered = Boolean(chosen);
              const isCorrect = chosen === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-overlay)]/20 p-4 sm:p-5 space-y-3.5"
                >
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-white">
                        {idx + 1}
                      </span>
                      <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                        Dialogue {q.sceneNumber}
                      </span>
                      <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                        {q.grammarTag}
                      </span>
                    </div>

                    {isAnswered && (
                      <AudioButton
                        text={q.originalJa}
                        mode="sentence"
                        size="sm"
                        label="Listen to complete dialogue line"
                      />
                    )}
                  </div>

                  {/* Preceding Conversational Context */}
                  {q.contextPrevLine && (
                    <div className="rounded-xl border border-[var(--line)]/70 bg-[var(--surface)]/70 px-3.5 py-2 text-xs">
                      <span className="font-bold font-japanese text-[var(--muted)] mr-2">
                        {q.contextPrevLine.speakerJa}:
                      </span>
                      <span className="font-japanese text-[var(--ink)]/80">
                        {q.contextPrevLine.ja}
                      </span>
                    </div>
                  )}

                  {/* Target Cloze Line */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 rounded-lg bg-[var(--sakura-light)]/70 px-2 py-0.5 text-xs font-bold text-[var(--ink)] font-japanese">
                        {q.speakerJa}
                      </span>
                      <p className="font-japanese text-sm sm:text-base font-bold text-[var(--ink)] leading-relaxed">
                        {isAnswered
                          ? q.maskedJa.split("_______").map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <span
                                    className={`mx-1 inline-block rounded-md px-2 py-0.5 ${
                                      isCorrect
                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                        : "bg-amber-500/20 text-amber-800 dark:text-amber-300 underline decoration-2"
                                    }`}
                                  >
                                    {q.correctAnswer}
                                  </span>
                                )}
                              </React.Fragment>
                            ))
                          : q.maskedJa}
                      </p>
                    </div>
                    {showEnglish && (
                      <p className="pl-1 text-xs font-medium text-[var(--muted)]">
                        {q.en}
                      </p>
                    )}
                  </div>

                  {/* Choice Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isThisChosen = chosen === opt;
                      const isThisCorrect = opt === q.correctAnswer;

                      let btnStyle =
                        "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/20";

                      if (isAnswered) {
                        if (isThisCorrect) {
                          btnStyle =
                            "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black";
                        } else if (isThisChosen) {
                          btnStyle =
                            "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 line-through";
                        } else {
                          btnStyle =
                            "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] opacity-50";
                        }
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() =>
                            handleSelectOption(q.id, opt, q.correctAnswer)
                          }
                          disabled={isAnswered}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold font-japanese transition-all ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isThisCorrect && (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          )}
                          {isAnswered && isThisChosen && !isThisCorrect && (
                            <XCircle size={14} className="text-rose-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Feedback */}
                  {isAnswered && q.grammarExplanation && (
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--muted)] flex items-start gap-2">
                      <Sparkles
                        size={14}
                        className="shrink-0 mt-0.5 text-[var(--primary-fg)]"
                      />
                      <span>{q.grammarExplanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
