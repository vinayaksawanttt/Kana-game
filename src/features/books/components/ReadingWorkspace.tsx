"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { BookReadingSection } from "@/data/books";
import { AudioButton } from "@/components/ui/AudioButton";
import { ContentContainer, StatusBadge, TextbookButton } from "./ui";

export interface ReadingWorkspaceProps {
  lessonNumber: number;
  reading: BookReadingSection;
}

export function ReadingWorkspace({ lessonNumber, reading }: ReadingWorkspaceProps) {
  const [showTranslations, setShowTranslations] = useState(true);
  const [vocabAnswers, setVocabAnswers] = useState<Record<string, string>>({});
  const [activeVocabId, setActiveVocabId] = useState<string | null>(
    reading.vocabChecks[0]?.id ?? null
  );
  const [vocabChecked, setVocabChecked] = useState(false);

  const [tfSelections, setTfSelections] = useState<Record<string, string>>({});
  const [revealedOpenIds, setRevealedOpenIds] = useState<Record<string, boolean>>({});

  const normalizedBank = reading.vocabWordBank.map((entry) => {
    const cleaned = entry.replace(/^[ア-ンA-Z]\s*[.．、]\s*/, "").trim();
    return { raw: entry, value: cleaned };
  });

  const handleAssignVocabWord = (word: string) => {
    const targetId =
      activeVocabId ??
      reading.vocabChecks.find((c) => !vocabAnswers[c.id])?.id ??
      reading.vocabChecks[0]?.id;
    if (!targetId) return;
    setVocabAnswers((prev) => ({ ...prev, [targetId]: word }));
    setVocabChecked(false);

    // Advance focus to next unanswered item
    const nextUnanswered = reading.vocabChecks.find(
      (c) => c.id !== targetId && !vocabAnswers[c.id]
    );
    if (nextUnanswered) setActiveVocabId(nextUnanswered.id);
  };

  const correctVocabCount = reading.vocabChecks.filter(
    (c) => vocabAnswers[c.id]?.trim() === c.answer.trim()
  ).length;

  return (
    <div className="space-y-6" aria-label="Reading and writing section">
      {/* 1. Header & Reading Strategy */}
      <ContentContainer padding="md" className="rounded-3xl border border-[var(--tb-border)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tb-accent-soft)] px-3 py-1 text-xs font-extrabold text-[var(--primary-fg)]">
                <BookOpen size={13} />
                <span>読む・書く</span>
              </span>
              <h3 className="font-japanese text-xl font-black text-[var(--tb-text-primary)]">
                {reading.title}
                {reading.titleReading && (
                  <span className="ml-2 text-xs font-semibold text-[var(--tb-text-secondary)]">
                    （{reading.titleReading}）
                  </span>
                )}
              </h3>
              <StatusBadge variant="neutral">
                Lesson {lessonNumber} Reading
              </StatusBadge>
            </div>
          </div>

          <TextbookButton
            variant="secondary"
            size="sm"
            onClick={() => setShowTranslations((prev) => !prev)}
          >
            {showTranslations ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showTranslations ? "Hide English" : "Show English"}</span>
          </TextbookButton>
        </div>

        {reading.readingPoints.length > 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--tb-border-strong)] bg-[var(--tb-bg)]/60 p-4 space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
              <Lightbulb size={13} />
              <span>読むときのポイント (Reading Focus)</span>
            </p>
            <ul className="space-y-1 text-sm text-[var(--tb-text-primary)] font-japanese">
              {reading.readingPoints.map((pt, i) => (
                <li key={i} className="leading-relaxed">
                  ・{pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reading.warmupQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              1. 考えてみましょう (Pre-Reading Discussion)
            </p>
            <ol className="space-y-1.5 text-sm text-[var(--tb-text-primary)] font-japanese pl-4 list-decimal">
              {reading.warmupQuestions.map((q, i) => (
                <li key={i} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}
      </ContentContainer>

      {/* 2. Vocabulary Check (ことばをチェックしましょう) */}
      {reading.vocabChecks.length > 0 && (
        <ContentContainer padding="md" className="rounded-3xl border border-[var(--tb-border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-black text-[var(--tb-text-primary)]">
                2. ことばをチェックしましょう (Vocabulary in Context)
              </h4>
              <p className="text-xs text-[var(--tb-text-secondary)]">
                Select a blank below, then pick the matching word from the bank.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {vocabChecked && (
                <StatusBadge
                  variant={correctVocabCount === reading.vocabChecks.length ? "mastered" : "in-progress"}
                >
                  {correctVocabCount} / {reading.vocabChecks.length} Correct
                </StatusBadge>
              )}
              <TextbookButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setVocabAnswers({});
                  setVocabChecked(false);
                  setActiveVocabId(reading.vocabChecks[0]?.id ?? null);
                }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </TextbookButton>
              <TextbookButton
                variant="primary"
                size="sm"
                onClick={() => setVocabChecked(true)}
              >
                <Check size={13} />
                <span>Check Answers</span>
              </TextbookButton>
            </div>
          </div>

          {normalizedBank.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-3">
              {normalizedBank.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAssignVocabWord(chip.value)}
                  className="tb-focus-ring rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-surface)] px-3 py-1.5 font-japanese text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:bg-[var(--tb-accent-soft)] transition-colors cursor-pointer"
                >
                  {chip.raw}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {reading.vocabChecks.map((item, idx) => {
              const userAns = vocabAnswers[item.id] ?? "";
              const isCorrect = vocabChecked && userAns.trim() === item.answer.trim();
              const isWrong = vocabChecked && Boolean(userAns) && !isCorrect;
              const isSelected = activeVocabId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveVocabId(item.id)}
                  className={`rounded-2xl border p-3 transition-colors cursor-pointer ${
                    isCorrect
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : isWrong
                      ? "border-rose-500/50 bg-rose-500/5"
                      : isSelected
                      ? "border-[var(--tb-primary)] bg-[var(--tb-accent-soft)]/25"
                      : "border-[var(--tb-border)] bg-[var(--tb-bg)]/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-japanese text-sm leading-relaxed text-[var(--tb-text-primary)]">
                      <span className="font-bold text-[var(--tb-text-secondary)] mr-2">
                        {idx + 1})
                      </span>
                      {item.prompt.split(/[（(][\s　]*[）)]/).map((part, pIdx, arr) => (
                        <span key={pIdx}>
                          {part}
                          {pIdx < arr.length - 1 && (
                            <span className="inline-block min-w-[4.5rem] mx-1 px-2 py-0.5 rounded-lg border border-dashed border-[var(--tb-border-strong)] bg-[var(--tb-surface)] text-center font-bold text-[var(--primary-fg)]">
                              {userAns || "　　"}
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                    {vocabChecked && !isCorrect && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-japanese">
                        Ans: {item.answer}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ContentContainer>
      )}

      {/* 3. Main Reading Passage (読みましょう) */}
      <ContentContainer padding="md" className="rounded-3xl border border-[var(--tb-border)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tb-border)] pb-3">
          <h4 className="text-base font-black text-[var(--tb-text-primary)]">
            3. 読みましょう — <span className="font-japanese">{reading.title}</span>
          </h4>
          {reading.sourceCredit && (
            <span className="text-[11px] text-[var(--tb-text-secondary)] font-japanese">
              {reading.sourceCredit}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {reading.paragraphs.map((para, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--tb-border)]/80 bg-[var(--tb-bg)]/40 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  lang="ja"
                  className="font-japanese text-[15px] sm:text-base leading-[1.9] text-[var(--tb-text-primary)]"
                >
                  {para.ja}
                </p>
                <AudioButton
                  text={para.ja}
                  mode="sentence"
                  size="sm"
                  label={`Listen to paragraph ${idx + 1}`}
                />
              </div>
              {showTranslations && para.en && (
                <p className="text-xs sm:text-sm text-[var(--tb-text-secondary)] leading-relaxed border-t border-[var(--tb-border)]/60 pt-2">
                  {para.en}
                </p>
              )}
            </div>
          ))}
        </div>
      </ContentContainer>

      {/* 4. Comprehension & Challenge (答えましょう / チャレンジしましょう) */}
      {(reading.comprehensionQuestions.length > 0 || (reading.challengePrompts?.length ?? 0) > 0) && (
        <ContentContainer padding="md" className="rounded-3xl border border-[var(--tb-border)] space-y-5">
          {reading.comprehensionQuestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-black text-[var(--tb-text-primary)]">
                4. 答えましょう (Reading Comprehension)
              </h4>

              <div className="space-y-3">
                {reading.comprehensionQuestions.map((q, idx) => {
                  const chosen = tfSelections[q.id];
                  const isTf = q.type === "true-false";
                  const isMcq = q.type === "mcq" && (q.options?.length ?? 0) > 0;
                  const revealed = Boolean(revealedOpenIds[q.id]);

                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/35 p-3.5 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-japanese text-sm font-medium text-[var(--tb-text-primary)] leading-relaxed flex-1">
                          <span className="font-bold text-[var(--tb-text-secondary)] mr-2">
                            {idx + 1})
                          </span>
                          {q.prompt}
                        </p>

                        {isTf && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {["○", "×"].map((symbol) => {
                              const picked = chosen === symbol;
                              const correct = q.answer.trim() === symbol;
                              return (
                                <button
                                  key={symbol}
                                  type="button"
                                  onClick={() =>
                                    setTfSelections((prev) => ({ ...prev, [q.id]: symbol }))
                                  }
                                  className={`tb-focus-ring size-9 rounded-xl border text-sm font-black transition-all cursor-pointer ${
                                    picked
                                      ? correct
                                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                        : "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                      : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)]"
                                  }`}
                                >
                                  {symbol}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {!isTf && !isMcq && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedOpenIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                            }
                            className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)] cursor-pointer shrink-0"
                          >
                            <HelpCircle size={12} />
                            <span>{revealed ? "Hide Model Answer" : "Model Answer"}</span>
                          </button>
                        )}
                      </div>

                      {isTf && chosen && (
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          {chosen === q.answer.trim() ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 size={13} /> Correct ({q.answer})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300">
                              <XCircle size={13} /> Answer: {q.answer}
                            </span>
                          )}
                        </div>
                      )}

                      {isMcq && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const picked = chosen === opt;
                            const isAns = opt.trim() === q.answer.trim();
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setTfSelections((prev) => ({ ...prev, [q.id]: opt }))
                                }
                                className={`tb-focus-ring text-left rounded-xl border px-3 py-2 font-japanese text-xs transition-all cursor-pointer ${
                                  picked
                                    ? isAns
                                      ? "border-emerald-500 bg-emerald-500/15 font-bold"
                                      : "border-rose-500 bg-rose-500/15"
                                    : "border-[var(--tb-border)] bg-[var(--tb-surface)] hover:border-[var(--tb-primary)]"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {!isTf && !isMcq && revealed && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs sm:text-sm font-japanese text-[var(--tb-text-primary)]">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 mr-1.5">
                            解答例:
                          </span>
                          {q.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(reading.challengePrompts?.length ?? 0) > 0 && (
            <div className="border-t border-[var(--tb-border)] pt-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                <Sparkles size={13} />
                <span>5. チャレンジしましょう (Output Prompt)</span>
              </p>
              <ol className="space-y-1 text-sm font-japanese text-[var(--tb-text-primary)] pl-4 list-decimal">
                {reading.challengePrompts?.map((c, i) => (
                  <li key={i} className="leading-relaxed">
                    {c}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </ContentContainer>
      )}
    </div>
  );
}
