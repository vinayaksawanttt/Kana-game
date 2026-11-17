"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  Pencil,
  PlusCircle,
  RotateCw,
  Sparkles,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import {
  type BookGrammarItem,
  type BookKanjiItem,
  type BookLesson,
  type BookPracticeItem,
  type BookPracticeSection,
  type BookVocabItem,
} from "@/data/books";
import { type GrammarPoint } from "@/data/grammar";
import { AudioButton } from "@/components/ui/AudioButton";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { CharacterDiffView } from "@/features/books/components/CharacterDiffView";
import { romajiToHiragana } from "@/features/shiritori/engine/shiritori";
import {
  formatPartOfSpeech,
  formatPracticeTypeLabel,
  getContextualGrammarDetails,
  type GrammarSrsInfo,
  type GrammarStudyStatus,
  type VocabSrsState,
} from "@/features/books/engine/progress";
import { LevelBadge, StatusBadge } from "./Elements";
import {
  cn,
  getPatternChipClass,
  parseGrammarPattern,
  type StatusVariant,
} from "./tokens";

/* -------------------------------------------------------------------------- */
/* ContentCard (Base Card Primitive)                                          */
/* -------------------------------------------------------------------------- */

export interface ContentCardProps {
  id?: string;
  children: ReactNode;
  interactive?: boolean;
  selected?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "lg" | "xl";
  as?: "div" | "article" | "section";
  className?: string;
}

export function ContentCard({
  id,
  children,
  interactive = false,
  selected = false,
  padding = "md",
  radius = "lg",
  as: Component = "div",
  className,
}: ContentCardProps) {
  const padClass =
    padding === "none"
      ? ""
      : padding === "sm"
      ? "p-3.5 sm:p-4"
      : padding === "lg"
      ? "p-5 sm:p-6"
      : "p-4 sm:p-5";

  const radiusClass = radius === "xl" ? "rounded-3xl" : "rounded-2xl";

  return (
    <Component
      id={id}
      className={cn(
        "border bg-[var(--tb-surface)] shadow-2xs transition-all duration-200",
        radiusClass,
        padClass,
        selected
          ? "border-[var(--tb-primary)] ring-2 ring-[var(--tb-primary)]/30 shadow-md"
          : "border-[var(--tb-border)]",
        interactive &&
          !selected &&
          "hover:-translate-y-0.5 hover:border-[var(--tb-primary)]/50 hover:shadow-sm",
        className
      )}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/* VocabularyCard                                                             */
/* -------------------------------------------------------------------------- */

export type VocabLearningMode =
  | "ja-en"
  | "en-ja"
  | "reading"
  | "typing"
  | "listening";

export function VocabStatusBadge({
  state,
  className,
}: {
  state: VocabSrsState;
  className?: string;
}) {
  const config: Record<VocabSrsState, { variant: StatusVariant; label: string }> = {
    new: { variant: "new", label: "New" },
    learning: { variant: "in-progress", label: "Learning" },
    mastered: { variant: "mastered", label: "Mastered" },
    due: { variant: "due", label: "Due" },
  };
  const entry = config[state];
  return (
    <StatusBadge variant={entry.variant} className={className}>
      {entry.label}
    </StatusBadge>
  );
}

function matchesVocabAnswer(input: string, item: BookVocabItem): boolean {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return false;
  const cleanKana = item.readingKana.replace(/[〜～()（）\s]/g, "");
  const cleanWord = item.word.replace(/[〜～()（）\s]/g, "");
  const cleanRomaji = item.reading.replace(/[〜～()（）\s]/g, "").toLowerCase();
  const converted = romajiToHiragana(normalized, true).replace(/\s+/g, "");
  return (
    normalized === cleanWord.toLowerCase() ||
    normalized === cleanKana.toLowerCase() ||
    normalized === cleanRomaji ||
    (cleanKana.length > 0 && converted === cleanKana)
  );
}

export interface VocabularyCardProps {
  item: BookVocabItem;
  level?: string;
  srsState?: VocabSrsState;
  viewMode?: "grid" | "list" | "flip";
  studyMode?: "show-all" | "hide-en" | "hide-kana";
  learningMode?: VocabLearningMode;
  isFlipped?: boolean;
  isEnRevealed?: boolean;
  isKanaRevealed?: boolean;
  isJaRevealed?: boolean;
  isSelected?: boolean;
  onFlip?: () => void;
  onRevealEn?: () => void;
  onRevealKana?: () => void;
  onRevealJa?: () => void;
  onInspect?: () => void;
  className?: string;
}

export function VocabularyCard({
  item: v,
  level = "N5",
  srsState,
  viewMode = "grid",
  studyMode = "show-all",
  learningMode = "ja-en",
  isFlipped = false,
  isEnRevealed = false,
  isKanaRevealed = false,
  isJaRevealed = false,
  isSelected = false,
  onFlip,
  onRevealEn,
  onRevealKana,
  onRevealJa,
  onInspect,
  className,
}: VocabularyCardProps) {
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typingChecked, setTypingChecked] = useState<boolean | null>(null);
  const [localListeningRevealed, setLocalListeningRevealed] = useState(false);

  const showReadingKana =
    learningMode === "reading"
      ? Boolean(isKanaRevealed)
      : studyMode !== "hide-kana" || isKanaRevealed;
  const showEnglishMeaning = studyMode !== "hide-en" || isEnRevealed;
  const showJapaneseRecall = isJaRevealed || localListeningRevealed;
  const posLabel = formatPartOfSpeech(v.type);

  if (viewMode === "flip") {
    return (
      <div
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onFlip) {
            e.preventDefault();
            onFlip();
          }
        }}
        className={cn(
          "tb-focus-ring group relative min-h-[196px] rounded-3xl border p-5 shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between text-left",
          isFlipped
            ? "border-[var(--tb-primary)] bg-gradient-to-br from-[var(--tb-surface)] to-[var(--tb-accent-soft)]/55 shadow-md ring-2 ring-[var(--tb-primary)]/30"
            : "border-[var(--tb-border)] bg-[var(--tb-surface)] hover:border-[var(--tb-accent)] hover:shadow-sm",
          className
        )}
      >
        {!isFlipped ? (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--tb-text-secondary)]">
                    {posLabel}
                  </span>
                  {srsState && <VocabStatusBadge state={srsState} />}
                </div>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="sm"
                    label={`Listen to ${v.word}`}
                  />
                </div>
              </div>

              <div className="mt-3 text-center space-y-1">
                <h3 className="font-japanese text-3xl font-black text-[var(--tb-text-primary)] group-hover:text-[var(--primary-fg)] transition-colors">
                  {v.word}
                </h3>
                <div>
                  {studyMode === "hide-kana" && !isKanaRevealed && v.readingKana !== v.word ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealKana?.();
                      }}
                      className="inline-flex items-center gap-1 rounded bg-[var(--tb-border)]/50 px-2 py-0.5 text-xs font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>Reveal Kana</span>
                    </button>
                  ) : (
                    <p className="font-japanese text-sm font-semibold text-[var(--primary-fg)]">
                      {v.readingKana !== v.word ? v.readingKana : v.reading}
                    </p>
                  )}
                  <p className="font-mono text-xs text-[var(--tb-text-secondary)] opacity-75">
                    {v.reading}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--tb-border)] flex items-center justify-between text-[11px] font-bold text-[var(--tb-text-secondary)]">
              <span className="flex items-center gap-1 group-hover:text-[var(--primary-fg)] transition-colors">
                <RotateCw size={12} className="transition-transform group-hover:rotate-180 duration-300" />
                <span>Tap to see English</span>
              </span>
              <div className="flex items-center gap-2">
                {onInspect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect();
                    }}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)] cursor-pointer"
                  >
                    Details
                  </button>
                )}
                <span>Front</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md bg-[var(--tb-primary)] text-white px-2 py-0.5 text-[10px] font-bold">
                  {posLabel}
                </span>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="sm"
                    label={`Listen to ${v.word}`}
                  />
                </div>
              </div>

              <div className="mt-3 text-center space-y-1.5">
                <h3 className="text-xl font-black text-[var(--tb-text-primary)] leading-snug">
                  {v.meaning}
                </h3>
                <p className="font-japanese text-sm font-bold text-[var(--primary-fg)]">
                  {v.word} {v.readingKana !== v.word ? `(${v.readingKana})` : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--tb-border)] flex items-center justify-between text-[11px] font-bold text-[var(--primary-fg)]">
              <span className="flex items-center gap-1">
                <RotateCw size={12} />
                <span>Tap to flip back</span>
              </span>
              <div className="flex items-center gap-2">
                {onInspect && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspect();
                    }}
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-surface)] cursor-pointer"
                  >
                    Details
                  </button>
                )}
                <span className="text-[var(--tb-text-secondary)]">Back</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <ContentCard
      padding="sm"
      selected={isSelected}
      interactive={Boolean(onInspect)}
      className={cn(
        "flex flex-col justify-between transition-all",
        onInspect && "cursor-pointer",
        className
      )}
    >
      <div onClick={onInspect} className="flex-1 flex flex-col justify-between">
        <div>
          {learningMode === "en-ja" ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                    Recall Japanese
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-[var(--tb-text-primary)] leading-snug">
                    {v.meaning}
                  </h3>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="sm"
                    label={`Listen to ${v.word}`}
                  />
                </div>
              </div>

              <div className="mt-3">
                {!showJapaneseRecall ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevealJa?.();
                      setLocalListeningRevealed(true);
                    }}
                    className="tb-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--tb-accent)] bg-[var(--tb-accent-soft)]/50 px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)] transition-all cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Reveal Japanese</span>
                  </button>
                ) : (
                  <div className="space-y-0.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 px-3 py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspect?.();
                      }}
                      aria-label={`Inspect ${v.word}`}
                      className="tb-focus-ring text-left font-japanese text-lg font-bold text-[var(--primary-fg)] hover:underline cursor-pointer"
                    >
                      {v.word}
                    </button>
                    <p className="text-xs font-medium text-[var(--tb-text-secondary)]">
                      {v.readingKana !== v.word ? `${v.readingKana} · ` : ""}
                      <span className="font-mono">{v.reading}</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : learningMode === "typing" ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                    Type in Japanese
                  </span>
                  <h3 className="mt-0.5 text-base font-bold text-[var(--tb-text-primary)] leading-snug">
                    {v.meaning}
                  </h3>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="sm"
                    label={`Listen to ${v.word}`}
                  />
                </div>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-3 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => {
                      setTypedAnswer(e.target.value);
                      if (typingChecked !== null) setTypingChecked(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setTypingChecked(matchesVocabAnswer(typedAnswer, v));
                      }
                    }}
                    placeholder="Type kana or romaji..."
                    aria-label={`Type Japanese for ${v.meaning}`}
                    className="tb-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--tb-text-primary)] placeholder:text-[var(--tb-text-secondary)]/70"
                  />
                  <button
                    type="button"
                    onClick={() => setTypingChecked(matchesVocabAnswer(typedAnswer, v))}
                    className="tb-focus-ring shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--tb-primary)] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[var(--tb-primary-hover)] cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Check</span>
                  </button>
                </div>
                {typingChecked !== null && (
                  <p
                    className={cn(
                      "text-xs font-bold",
                      typingChecked
                        ? "text-[var(--tb-success)]"
                        : "text-[var(--tb-error)]"
                    )}
                  >
                    {typingChecked
                      ? `Correct — ${v.word}${v.readingKana !== v.word ? ` (${v.readingKana})` : ""}`
                      : `Expected: ${v.word}${v.readingKana !== v.word ? ` (${v.readingKana})` : ""}`}
                  </p>
                )}
              </div>
            </>
          ) : learningMode === "listening" ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="md"
                    label={`Listen to ${v.word}`}
                  />
                  <div>
                    <p className="text-xs font-bold text-[var(--tb-text-primary)] flex items-center gap-1">
                      <Volume2 size={12} className="text-[var(--primary-fg)]" />
                      <span>Listen &amp; Recall</span>
                    </p>
                    <p className="text-[11px] text-[var(--tb-text-secondary)]">
                      Hear audio before revealing
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                {!showJapaneseRecall ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevealJa?.();
                      onRevealEn?.();
                      setLocalListeningRevealed(true);
                    }}
                    className="tb-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--tb-accent)] bg-[var(--tb-accent-soft)]/50 px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)] transition-all cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Reveal word &amp; meaning</span>
                  </button>
                ) : (
                  <div className="space-y-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 px-3 py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspect?.();
                      }}
                      aria-label={`Inspect ${v.word}`}
                      className="tb-focus-ring text-left font-japanese text-lg font-bold text-[var(--tb-text-primary)] hover:text-[var(--primary-fg)] cursor-pointer"
                    >
                      {v.word}
                    </button>
                    <p className="text-xs font-medium text-[var(--tb-text-secondary)]">
                      {v.readingKana !== v.word ? `${v.readingKana} · ` : ""}
                      <span className="font-mono">{v.reading}</span>
                    </p>
                    <p className="text-sm font-semibold text-[var(--tb-text-primary)]">
                      {v.meaning}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  {onInspect ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspect();
                      }}
                      aria-label={`Inspect ${v.word}`}
                      className="tb-focus-ring text-left font-japanese text-lg font-bold text-[var(--tb-text-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                    >
                      {v.word}
                    </button>
                  ) : (
                    <span className="font-japanese text-lg font-bold text-[var(--tb-text-primary)]">
                      {v.word}
                    </span>
                  )}
                  <div className="text-xs font-medium text-[var(--tb-text-secondary)] flex items-center gap-1.5 flex-wrap">
                    {learningMode === "reading" ? (
                      !showReadingKana ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRevealKana?.();
                          }}
                          className="inline-flex items-center gap-1 rounded bg-[var(--tb-border)]/50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] cursor-pointer"
                          title="Click to reveal reading"
                        >
                          <Eye size={10} />
                          <span>Reveal reading</span>
                        </button>
                      ) : (
                        <>
                          {v.readingKana !== v.word && (
                            <span className="font-japanese font-semibold text-[var(--primary-fg)]">
                              {v.readingKana}
                            </span>
                          )}
                          <span className="font-mono text-[11px] opacity-75">
                            {v.reading}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        {v.readingKana !== v.word &&
                          (!showReadingKana ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRevealKana?.();
                              }}
                              className="inline-flex items-center gap-1 rounded bg-[var(--tb-border)]/50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] cursor-pointer"
                              title="Click to reveal kana reading"
                            >
                              <Eye size={10} />
                              <span>reveal kana</span>
                            </button>
                          ) : (
                            <span className="font-japanese font-semibold text-[var(--primary-fg)]">
                              {v.readingKana}
                            </span>
                          ))}
                        <span className="font-mono text-[11px] opacity-75">
                          {v.reading}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <AudioButton
                    text={v.word}
                    reading={v.readingKana}
                    mode="vocab"
                    size="sm"
                    label={`Listen to ${v.word}`}
                  />
                </div>
              </div>

              <div className="mt-2.5">
                {!showEnglishMeaning ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevealEn?.();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--tb-accent)] bg-[var(--tb-accent-soft)]/50 px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)] transition-all cursor-pointer"
                    title="Click to reveal English meaning"
                  >
                    <Eye size={12} />
                    <span>Tap to reveal meaning</span>
                  </button>
                ) : (
                  <p className="text-sm font-semibold text-[var(--tb-text-primary)] leading-snug">
                    {v.meaning}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--tb-border)]/70 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {srsState && <VocabStatusBadge state={srsState} />}
            <span className="text-[11px] font-semibold text-[var(--tb-text-secondary)]">
              {posLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {v.linkedVocabId && <LevelBadge level={level} />}
            {onInspect && (
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="text-[var(--tb-text-secondary)] opacity-60 group-hover:opacity-100"
              />
            )}
          </div>
        </div>
      </div>
    </ContentCard>
  );
}

/* -------------------------------------------------------------------------- */
/* VocabularyListTable (Compact Scannable List Mode)                          */
/* -------------------------------------------------------------------------- */

export interface VocabularyListTableProps {
  items: BookVocabItem[];
  level?: string;
  srsStateById: Map<string, VocabSrsState>;
  studyMode?: "show-all" | "hide-en" | "hide-kana";
  learningMode?: VocabLearningMode;
  revealedEn?: Record<string, boolean>;
  revealedKana?: Record<string, boolean>;
  revealedJa?: Record<string, boolean>;
  selectedId?: string | null;
  onRevealEn?: (id: string) => void;
  onRevealKana?: (id: string) => void;
  onRevealJa?: (id: string) => void;
  onInspect: (item: BookVocabItem) => void;
}

export function VocabularyListTable({
  items,
  level = "N5",
  srsStateById,
  studyMode = "show-all",
  learningMode = "ja-en",
  revealedEn = {},
  revealedKana = {},
  revealedJa = {},
  selectedId,
  onRevealEn,
  onRevealKana,
  onRevealJa,
  onInspect,
}: VocabularyListTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] shadow-2xs">
      <table className="w-full text-left border-collapse" aria-label="Vocabulary list">
        <thead>
          <tr className="border-b border-[var(--tb-border)] bg-[var(--tb-bg)]/70 text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
            <th className="py-2.5 px-3.5">Word</th>
            <th className="py-2.5 px-3">Reading</th>
            <th className="py-2.5 px-3">Meaning</th>
            <th className="py-2.5 px-3 hidden sm:table-cell">Type</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3 text-right">Audio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tb-border)]/70 text-sm">
          {items.map((v) => {
            const srsState = srsStateById.get(v.id) ?? "new";
            const hideWordForRecall =
              (learningMode === "en-ja" || learningMode === "listening") &&
              !revealedJa[v.id];
            const hideReading =
              learningMode === "reading"
                ? !revealedKana[v.id]
                : (studyMode === "hide-kana" && !revealedKana[v.id] && v.readingKana !== v.word) ||
                  hideWordForRecall;
            const hideMeaning =
              (studyMode === "hide-en" && !revealedEn[v.id]) ||
              (learningMode === "listening" && !revealedJa[v.id]);

            return (
              <tr
                key={v.id}
                onClick={() => onInspect(v)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-[var(--tb-accent-soft)]/30",
                  selectedId === v.id && "bg-[var(--tb-accent-soft)]/45"
                )}
              >
                <td className="py-2.5 px-3.5 font-japanese font-bold text-[var(--tb-text-primary)] whitespace-nowrap">
                  {hideWordForRecall ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealJa?.(v.id);
                      }}
                      className="rounded border border-dashed border-[var(--tb-accent)] bg-[var(--tb-accent-soft)]/40 px-2 py-0.5 text-xs font-bold text-[var(--primary-fg)] cursor-pointer"
                    >
                      Reveal Japanese
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspect(v);
                      }}
                      className="tb-focus-ring text-left font-japanese text-base font-bold text-[var(--tb-text-primary)] hover:text-[var(--primary-fg)] cursor-pointer"
                    >
                      {v.word}
                    </button>
                  )}
                </td>
                <td className="py-2.5 px-3 text-xs text-[var(--tb-text-secondary)]">
                  {hideReading ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealKana?.(v.id);
                      }}
                      className="rounded bg-[var(--tb-border)]/50 px-1.5 py-0.5 text-[10px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] cursor-pointer"
                    >
                      reveal kana
                    </button>
                  ) : (
                    <div className="flex flex-col">
                      {v.readingKana !== v.word && (
                        <span className="font-japanese font-semibold text-[var(--primary-fg)]">
                          {v.readingKana}
                        </span>
                      )}
                      <span className="font-mono text-[11px] opacity-80">{v.reading}</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[var(--tb-text-primary)] font-medium">
                  {hideMeaning ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevealEn?.(v.id);
                        onRevealJa?.(v.id);
                      }}
                      className="rounded border border-dashed border-[var(--tb-accent)] bg-[var(--tb-accent-soft)]/40 px-2 py-0.5 text-xs font-bold text-[var(--primary-fg)] cursor-pointer"
                    >
                      Tap to reveal meaning
                    </button>
                  ) : (
                    v.meaning
                  )}
                </td>
                <td className="py-2.5 px-3 hidden sm:table-cell text-xs text-[var(--tb-text-secondary)] whitespace-nowrap">
                  {formatPartOfSpeech(v.type)}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <VocabStatusBadge state={srsState} />
                    {v.linkedVocabId && <LevelBadge level={level} />}
                  </div>
                </td>
                <td
                  className="py-2.5 px-3 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <AudioButton
                      text={v.word}
                      reading={v.readingKana}
                      mode="vocab"
                      size="sm"
                      label={`Listen to ${v.word}`}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* GrammarCard                                                                */
/* -------------------------------------------------------------------------- */

export function GrammarStatusBadge({
  status,
  className,
}: {
  status: GrammarStudyStatus;
  className?: string;
}) {
  const config: Record<GrammarStudyStatus, { variant: StatusVariant; label: string }> = {
    "not-studied": { variant: "new", label: "Not studied" },
    studying: { variant: "in-progress", label: "Studying" },
    understood: { variant: "mastered", label: "Understood" },
  };
  const entry = config[status];
  return (
    <StatusBadge variant={entry.variant} className={className}>
      {entry.label}
    </StatusBadge>
  );
}

function renderFormattedGrammarText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-[var(--tb-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-1.5 py-0.5 font-japanese text-[0.9em] font-semibold text-[var(--primary-fg)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderHighlightedSentence(sentence: string, token?: string): ReactNode {
  if (!token || !sentence.includes(token)) return sentence;
  const segments = sentence.split(token);
  return segments.map((seg, idx) => (
    <React.Fragment key={idx}>
      {seg}
      {idx < segments.length - 1 && (
        <mark className="rounded bg-[var(--tb-accent-soft)] px-1 py-0.2 font-extrabold text-[var(--primary-fg)]">
          {token}
        </mark>
      )}
    </React.Fragment>
  ));
}

export interface GrammarCardProps {
  point: BookGrammarItem;
  lesson?: BookLesson;
  level?: string;
  linkedPoint?: GrammarPoint | null;
  srsInfo?: GrammarSrsInfo;
  studyStatus?: GrammarStudyStatus;
  onChangeStudyStatus?: (status: GrammarStudyStatus) => void;
  onAddToSrs?: () => void;
  onOpenPracticeSection?: (section: BookPracticeSection) => void;
  prevPoint?: BookGrammarItem | null;
  nextPoint?: BookGrammarItem | null;
  onSelectGrammarPoint?: (id: string | null) => void;
  selfCheckOpen: Record<string, boolean>;
  selfCheckRevealed: Record<string, boolean>;
  selfCheckFeedback: Record<string, "got-it" | "review">;
  onToggleSelfCheck: (key: string, nextOpen: boolean) => void;
  onRevealSelfCheck: (key: string) => void;
  onRateSelfCheck: (key: string, rating: "got-it" | "review") => void;
  className?: string;
}

export function GrammarCard({
  point: pt,
  lesson,
  level = "N5",
  linkedPoint,
  srsInfo,
  studyStatus = "not-studied",
  onChangeStudyStatus,
  onAddToSrs,
  onOpenPracticeSection,
  prevPoint,
  nextPoint,
  onSelectGrammarPoint,
  selfCheckOpen,
  selfCheckRevealed,
  selfCheckFeedback,
  onToggleSelfCheck,
  onRevealSelfCheck,
  onRateSelfCheck,
  className,
}: GrammarCardProps) {
  const [highlightPattern, setHighlightPattern] = useState(true);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const details = useMemo(() => {
    const fallbackLesson: BookLesson = lesson ?? {
      lessonNumber: pt.lessonNumber,
      title: pt.title,
      vocabulary: [],
      kanji: [],
      grammar: [pt],
      stats: { vocabularyCount: 0, kanjiCount: 0, grammarCount: 1 },
    };
    return getContextualGrammarDetails(pt, fallbackLesson, linkedPoint, level);
  }, [lesson, level, linkedPoint, pt]);

  const linkedExampleByJa = useMemo(() => {
    const map = new Map<string, { romaji?: string; furigana?: string }>();
    if (!linkedPoint) return map;
    for (const ex of linkedPoint.examples) {
      map.set(ex.ja, { romaji: ex.romaji, furigana: ex.furigana });
      if (ex.jp && ex.jp !== ex.ja) {
        map.set(ex.jp, { romaji: ex.romaji, furigana: ex.furigana });
      }
    }
    return map;
  }, [linkedPoint]);

  const activeQuestion =
    details.practiceQuestions[
      Math.min(activeQuestionIdx, Math.max(0, details.practiceQuestions.length - 1))
    ] ?? null;
  const activeSelection = activeQuestion ? selectedAnswers[activeQuestion.id] : undefined;

  return (
    <ContentCard
      id={`grammar-point-${pt.id}`}
      as="article"
      radius="xl"
      padding="lg"
      className={cn("overflow-hidden hover:border-[var(--tb-primary)]/35", className)}
    >
      {/* A. Grammar Heading */}
      <header className="space-y-3 border-b border-[var(--tb-border)] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--tb-primary)] text-xs font-black text-white shadow-2xs">
              #{pt.index}
            </span>
            <span className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--tb-text-secondary)]">
              Lesson {pt.lessonNumber}.{pt.index}
            </span>
            <LevelBadge level={details.jlptLevel} />
            <GrammarStatusBadge status={studyStatus} />
            {srsInfo?.inSrs && (
              <StatusBadge
                variant={srsInfo.due ? "due" : srsInfo.mastered ? "mastered" : "info"}
              >
                {srsInfo.due
                  ? "FSRS Due"
                  : srsInfo.mastered
                    ? "FSRS Mastered"
                    : "In FSRS"}
              </StatusBadge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onAddToSrs && !srsInfo?.inSrs && (
              <button
                type="button"
                onClick={onAddToSrs}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2.5 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
              >
                <PlusCircle size={13} />
                <span>Add to FSRS</span>
              </button>
            )}
            {pt.linkedGrammarId && (
              <Link
                href={`/grammar/${pt.linkedGrammarId.split("/")[0]}/${pt.linkedGrammarId.split("/")[1]}`}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:opacity-90 transition-opacity"
              >
                <BookOpen size={13} />
                <span>View in Grammar Library</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-japanese text-xl sm:text-2xl font-black text-[var(--tb-text-primary)] tracking-tight">
                {pt.pattern}
              </h2>
              <AudioButton
                text={pt.pattern}
                id={pt.linkedGrammarId}
                mode="grammar"
                size="sm"
                label={`Pronounce grammar pattern ${pt.pattern}`}
              />
            </div>
            {details.readingRomaji && (
              <p className="font-mono text-xs text-[var(--tb-text-secondary)]">
                {details.readingRomaji}
              </p>
            )}
            <p className="text-sm sm:text-base font-bold text-[var(--primary-fg)]">
              {pt.title}
            </p>
            {details.shortMeaning && details.shortMeaning !== pt.title && (
              <p className="text-xs sm:text-sm font-medium text-[var(--tb-text-secondary)]">
                {details.shortMeaning}
              </p>
            )}
          </div>

          {onChangeStudyStatus && (
            <div
              role="group"
              aria-label={`Learning status for ${pt.title}`}
              className="flex items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1 shrink-0"
            >
              {(
                [
                  { key: "not-studied", label: "Not studied" },
                  { key: "studying", label: "Studying" },
                  { key: "understood", label: "Understood" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={studyStatus === option.key}
                  onClick={() => onChangeStudyStatus(option.key)}
                  className={cn(
                    "tb-focus-ring rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                    studyStatus === option.key
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* B. Explanation (Readable Textbook Article Layout) */}
      {pt.explanation && (
        <section className="mt-5 space-y-1.5">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
            Explanation
          </h3>
          <div className="max-w-3xl text-sm sm:text-[15px] leading-7 text-[var(--tb-text-primary)] whitespace-pre-line">
            {renderFormattedGrammarText(pt.explanation)}
          </div>
        </section>
      )}

      {/* C. Formation & Structure */}
      {(details.formationRules.length > 0 || pt.pattern) && (
        <section className="mt-5 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/55 p-4 space-y-3">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
            Formation &amp; Structure
          </h3>

          {details.formationRules.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {details.formationRules.map((rule, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-surface)] px-3 py-1.5 font-japanese text-xs sm:text-sm font-bold text-[var(--tb-text-primary)] shadow-2xs"
                >
                  {rule}
                </span>
              ))}
            </div>
          )}

          {pt.pattern && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--tb-text-secondary)] mr-1">
                Pattern Anatomy:
              </span>
              {parseGrammarPattern(pt.pattern).map((chip, chipIdx, arr) => (
                <div key={chipIdx} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs shadow-2xs",
                      getPatternChipClass(chip.category)
                    )}
                  >
                    <span className="font-japanese font-bold">{chip.text}</span>
                    {chip.label && (
                      <span className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.2 text-[9px] font-black uppercase tracking-wider opacity-80">
                        {chip.label}
                      </span>
                    )}
                  </span>
                  {chipIdx < arr.length - 1 && (
                    <span className="text-[var(--tb-text-secondary)] text-xs font-black opacity-50">
                      +
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* D. Usage and Notes */}
      {(details.usageNotes.length > 0 || details.structuredNotes) && (
        <section className="mt-5 space-y-2.5">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
            Usage &amp; Notes
          </h3>

          {details.usageNotes.length > 0 && (
            <div className="space-y-2">
              {details.usageNotes.map((note, i) =>
                note.isWarning ? (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-[var(--tb-warning-border)] bg-[var(--tb-warning-bg)] p-3 text-xs sm:text-sm text-[var(--tb-text-primary)] leading-relaxed"
                  >
                    <AlertTriangle
                      size={15}
                      className="shrink-0 mt-0.5 text-[var(--tb-warning)]"
                    />
                    <div>{renderFormattedGrammarText(note.text)}</div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="border-l-2 border-[var(--tb-accent)] pl-3.5 text-xs sm:text-sm text-[var(--tb-text-secondary)] leading-relaxed"
                  >
                    {renderFormattedGrammarText(note.text)}
                  </div>
                )
              )}
            </div>
          )}

          {details.structuredNotes && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {details.structuredNotes.contrast && (
                <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-3 text-xs text-[var(--tb-text-secondary)] leading-relaxed">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--tb-text-primary)] mb-1">
                    Contrast
                  </span>
                  {details.structuredNotes.contrast}
                </div>
              )}
              {details.structuredNotes.pitfalls && (
                <div className="flex items-start gap-2 rounded-xl border border-[var(--tb-warning-border)] bg-[var(--tb-warning-bg)] p-3 text-xs text-[var(--tb-text-primary)] leading-relaxed">
                  <AlertTriangle
                    size={14}
                    className="shrink-0 mt-0.5 text-[var(--tb-warning)]"
                  />
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--tb-warning)] mb-0.5">
                      Common Pitfall
                    </span>
                    {details.structuredNotes.pitfalls}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* E. Example Sentences & Quick Self-Check */}
      {pt.examples.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--tb-text-secondary)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--primary-fg)]" />
              <span>Example Sentences &amp; Active Recall</span>
            </h3>
            <div className="flex items-center gap-2">
              {details.highlightToken && details.highlightToken !== pt.pattern && (
                <button
                  type="button"
                  aria-pressed={highlightPattern}
                  onClick={() => setHighlightPattern((prev) => !prev)}
                  className={cn(
                    "tb-focus-ring rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer",
                    highlightPattern
                      ? "border-[var(--tb-primary)]/40 bg-[var(--tb-accent-soft)] text-[var(--primary-fg)]"
                      : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)]"
                  )}
                >
                  Highlight Pattern
                </button>
              )}
              <span className="text-[11px] font-semibold text-[var(--tb-text-secondary)]">
                {pt.examples.length} examples
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {pt.examples.map((eg, idx) => {
              const checkKey = `${pt.id}-${idx}`;
              const isOpen = Boolean(selfCheckOpen[checkKey]);
              const isRevealed = Boolean(selfCheckRevealed[checkKey]);
              const feedback = selfCheckFeedback[checkKey];
              const extraEx = linkedExampleByJa.get(eg.ja);
              const activeToken =
                highlightPattern &&
                details.highlightToken &&
                details.highlightToken !== pt.pattern
                  ? details.highlightToken
                  : undefined;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-2.5 transition-all"
                >
                  {!isOpen ? (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          {extraEx?.furigana && (
                            <p className="font-japanese text-xs text-[var(--primary-fg)] font-semibold">
                              {extraEx.furigana}
                            </p>
                          )}
                          <p className="font-japanese text-base sm:text-lg font-bold text-[var(--tb-text-primary)] leading-relaxed">
                            {renderHighlightedSentence(eg.ja, activeToken)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <AudioButton
                            text={eg.ja}
                            mode="sentence"
                            size="sm"
                            id={eg.audioSrc}
                            label={`Pronounce: ${eg.ja}`}
                          />
                          <button
                            type="button"
                            onClick={() => onToggleSelfCheck(checkKey, true)}
                            className="tb-focus-ring inline-flex items-center gap-1 rounded-lg border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-1 text-[11px] font-bold text-[var(--tb-text-secondary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                            title="Test active recall of this sentence"
                          >
                            <HelpCircle size={12} />
                            <span>Quick Self-Check</span>
                          </button>
                        </div>
                      </div>

                      {extraEx?.romaji && (
                        <p className="mt-0.5 font-mono text-[11px] text-[var(--tb-text-secondary)] opacity-80">
                          {extraEx.romaji}
                        </p>
                      )}

                      {eg.en && (
                        <p className="mt-1 text-xs sm:text-sm text-[var(--tb-text-secondary)] font-medium leading-relaxed">
                          {eg.en}
                        </p>
                      )}

                      {eg.promptEn && (
                        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-[var(--tb-accent)]/60 bg-[var(--tb-accent-soft)]/50 p-2 text-xs font-semibold text-[var(--primary-fg)]">
                          <Sparkles size={13} className="shrink-0 mt-0.5" />
                          <span>{eg.promptEn}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--tb-primary)]/30 bg-[var(--tb-accent-soft)]/25 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--primary-fg)]">
                          <HelpCircle size={13} />
                          <span>Quick Self-Check Recall Drill</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleSelfCheck(checkKey, false)}
                          className="text-[11px] font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] cursor-pointer"
                        >
                          Close Self-Check ✕
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-[var(--tb-text-secondary)] tracking-wider">
                          Translate to Japanese:
                        </span>
                        <p className="text-sm font-bold text-[var(--tb-text-primary)]">
                          {eg.promptEn || eg.en}
                        </p>
                      </div>

                      {!isRevealed ? (
                        <button
                          type="button"
                          onClick={() => onRevealSelfCheck(checkKey)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--tb-primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--tb-primary-hover)] transition-all cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Reveal Japanese Answer</span>
                        </button>
                      ) : (
                        <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-3 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                                Model Answer:
                              </span>
                              <p className="font-japanese text-base font-bold text-[var(--tb-text-primary)] mt-0.5">
                                {eg.ja}
                              </p>
                              {eg.en && (
                                <p className="text-xs text-[var(--tb-text-secondary)] mt-0.5">
                                  {eg.en}
                                </p>
                              )}
                            </div>
                            <AudioButton
                              text={eg.ja}
                              mode="sentence"
                              size="sm"
                              id={eg.audioSrc}
                              label={`Listen to ${eg.ja}`}
                            />
                          </div>

                          <div className="pt-2 border-t border-[var(--tb-border)]/60 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[var(--tb-text-secondary)]">
                              How did you do?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onRateSelfCheck(checkKey, "review")}
                                className={cn(
                                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                                  feedback === "review"
                                    ? "bg-amber-500 text-white shadow-2xs"
                                    : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                                )}
                              >
                                Need Review
                              </button>
                              <button
                                type="button"
                                onClick={() => onRateSelfCheck(checkKey, "got-it")}
                                className={cn(
                                  "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                                  feedback === "got-it"
                                    ? "bg-emerald-600 text-white shadow-2xs"
                                    : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                                )}
                              >
                                Got It! ✓
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* F. Interactive Grammar Practice & Linked Workbook Exercises */}
      {(activeQuestion || details.linkedPracticeSections.length > 0) && (
        <section
          aria-label={`Interactive practice for ${pt.title}`}
          className="mt-6 space-y-4"
        >
          {activeQuestion && (
            <div className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--primary-fg)]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                    Grammar Check
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {details.practiceQuestions.map((q, qIdx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionIdx(qIdx)}
                      className={cn(
                        "tb-focus-ring rounded-lg px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer",
                        activeQuestion.id === q.id
                          ? "bg-[var(--tb-primary)] text-white"
                          : "border border-[var(--tb-border)] bg-[var(--tb-bg)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      )}
                    >
                      {q.formatLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-bold text-[var(--tb-text-primary)]">
                  {activeQuestion.promptEn}
                </p>
                {activeQuestion.promptJa && (
                  <p className="font-japanese text-base font-bold text-[var(--primary-fg)]">
                    {activeQuestion.promptJa}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeQuestion.options.map((opt) => {
                  const isChosen = activeSelection === opt;
                  const isCorrectOpt = opt === activeQuestion.correctAnswer;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [activeQuestion.id]: opt,
                        }))
                      }
                      className={cn(
                        "tb-focus-ring rounded-xl border px-3 py-2 text-left font-japanese text-xs sm:text-sm font-bold transition-all cursor-pointer",
                        !activeSelection
                          ? "border-[var(--tb-border)] bg-[var(--tb-bg)]/60 text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)]"
                          : isCorrectOpt
                            ? "border-[var(--tb-success-border)] bg-[var(--tb-success-bg)] text-[var(--tb-success)]"
                            : isChosen
                              ? "border-[var(--tb-error-border)] bg-[var(--tb-error-bg)] text-[var(--tb-error)]"
                              : "border-[var(--tb-border)] bg-[var(--tb-bg)]/40 text-[var(--tb-text-secondary)] opacity-70"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {activeSelection && (
                <div
                  className={cn(
                    "rounded-xl border p-3 text-xs leading-relaxed space-y-1.5",
                    activeSelection === activeQuestion.correctAnswer
                      ? "border-[var(--tb-success-border)] bg-[var(--tb-success-bg)] text-[var(--tb-text-primary)]"
                      : "border-[var(--tb-warning-border)] bg-[var(--tb-warning-bg)] text-[var(--tb-text-primary)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">
                      {activeSelection === activeQuestion.correctAnswer
                        ? "Correct!"
                        : `Correct answer: ${activeQuestion.correctAnswer}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => {
                          const next = { ...prev };
                          delete next[activeQuestion.id];
                          return next;
                        })
                      }
                      className="text-[11px] font-bold underline cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                  <p>{activeQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}

          {details.linkedPracticeSections.length > 0 && (
            <div className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-4 space-y-2.5">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                Linked Lesson Workbook Exercises
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {details.linkedPracticeSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--tb-text-primary)] truncate">
                        Part {sec.part}: {sec.title}
                      </p>
                      <p className="text-[11px] text-[var(--tb-text-secondary)]">
                        {sec.items.length} items · {sec.type}
                      </p>
                    </div>
                    {onOpenPracticeSection && (
                      <button
                        type="button"
                        onClick={() => onOpenPracticeSection(sec)}
                        className="tb-focus-ring shrink-0 rounded-lg border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--primary-fg)] hover:opacity-90 cursor-pointer"
                      >
                        Practice in Workbook
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Related Grammar Points */}
      {details.relatedLessonGrammar.length > 0 && (
        <section className="mt-5 pt-4 border-t border-[var(--tb-border)]/70 space-y-2">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-[var(--primary-fg)]" />
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              Related Lesson Grammar
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {details.relatedLessonGrammar.map((rel) => (
              <button
                key={rel.id}
                type="button"
                onClick={() => onSelectGrammarPoint?.(rel.id)}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
              >
                <span className="font-bold text-[var(--primary-fg)]">#{rel.index}</span>
                <span className="font-japanese font-bold">{rel.pattern}</span>
                <span className="text-[var(--tb-text-secondary)] truncate max-w-[160px]">
                  {rel.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Article Previous / Next Footer Navigation */}
      {(prevPoint || nextPoint) && (
        <footer className="mt-5 pt-4 border-t border-[var(--tb-border)] flex flex-wrap items-center justify-between gap-2">
          <div>
            {prevPoint && onSelectGrammarPoint && (
              <button
                type="button"
                onClick={() => onSelectGrammarPoint(prevPoint.id)}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>
                  #{prevPoint.index} {prevPoint.pattern}
                </span>
              </button>
            )}
          </div>

          {onSelectGrammarPoint && (
            <button
              type="button"
              onClick={() => onSelectGrammarPoint(null)}
              className="tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold text-[var(--tb-text-secondary)] hover:text-[var(--primary-fg)] cursor-pointer"
            >
              All Grammar Points
            </button>
          )}

          <div>
            {nextPoint && onSelectGrammarPoint && (
              <button
                type="button"
                onClick={() => onSelectGrammarPoint(nextPoint.id)}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] cursor-pointer"
              >
                <span>
                  #{nextPoint.index} {nextPoint.pattern}
                </span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </footer>
      )}
    </ContentCard>
  );
}

/* -------------------------------------------------------------------------- */
/* KanjiCard                                                                  */
/* -------------------------------------------------------------------------- */

export interface KanjiCardProps {
  kanji: BookKanjiItem;
  defaultJlpt?: number;
  srsState?: VocabSrsState;
  exampleVocabCount?: number;
  onOpenStrokeOrder: (kanji: BookKanjiItem) => void;
  onInspect?: (kanji: BookKanjiItem) => void;
  className?: string;
}

export function KanjiCard({
  kanji: k,
  defaultJlpt = 5,
  srsState,
  exampleVocabCount = 0,
  onOpenStrokeOrder,
  onInspect,
  className,
}: KanjiCardProps) {
  const handleInspect = () => (onInspect ?? onOpenStrokeOrder)(k);
  const jlptLabel = `N${k.jlpt || defaultJlpt}`;

  return (
    <ContentCard
      radius="xl"
      padding="md"
      interactive
      className={cn(
        "flex flex-col justify-between cursor-pointer hover:border-[var(--tb-primary)]/40",
        className
      )}
    >
      <div onClick={handleInspect} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleInspect();
              }}
              aria-label={`Inspect kanji ${k.kanji}`}
              className="tb-focus-ring relative grid size-16 shrink-0 place-items-center rounded-2xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)]/70 shadow-2xs overflow-hidden cursor-pointer hover:border-[var(--tb-primary)] transition-colors"
            >
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full stroke-[var(--tb-border-strong)] opacity-60"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              >
                <line x1="50" y1="0" x2="50" y2="100" />
                <line x1="0" y1="50" x2="100" y2="50" />
              </svg>
              <span
                lang="ja"
                className="relative z-10 font-kanji text-3xl sm:text-4xl font-extrabold text-[var(--primary-fg)] leading-none"
              >
                {k.kanji}
              </span>
            </button>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-[var(--tb-text-secondary)] tabular-nums">
                  #{String(k.number).padStart(3, "0")}
                </span>
                <LevelBadge level={jlptLabel} />
                {srsState && <VocabStatusBadge state={srsState} />}
              </div>
              <h3 className="text-base font-bold text-[var(--tb-text-primary)] capitalize truncate">
                {k.meaning}
              </h3>
            </div>
          </div>

          {k.strokes !== undefined && (
            <span className="shrink-0 rounded-lg bg-[var(--tb-bg)] border border-[var(--tb-border)] px-2 py-1 text-[11px] font-bold text-[var(--tb-text-secondary)] tabular-nums">
              {k.strokes} 画
            </span>
          )}
        </div>

        <div className="space-y-2 border-t border-[var(--tb-border)] pt-3">
          <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
            <span className="text-[10px] font-black uppercase text-[var(--tb-text-secondary)] min-w-[26px]">
              音
            </span>
            {k.onyomi.length > 0 ? (
              k.onyomi.slice(0, 4).map((on, i) => (
                <KanjiReadingPill key={i} reading={on} type="on" size="sm" />
              ))
            ) : (
              <span className="text-xs text-[var(--tb-text-secondary)]/60">—</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
            <span className="text-[10px] font-black uppercase text-[var(--tb-text-secondary)] min-w-[26px]">
              訓
            </span>
            {k.kunyomi.length > 0 ? (
              k.kunyomi.slice(0, 4).map((kun, i) => (
                <KanjiReadingPill key={i} reading={kun} type="kun" size="sm" />
              ))
            ) : (
              <span className="text-xs text-[var(--tb-text-secondary)]/60">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--tb-border)] flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[var(--tb-text-secondary)]">
          {exampleVocabCount > 0
            ? `${exampleVocabCount} lesson ${exampleVocabCount === 1 ? "word" : "words"}`
            : `JLPT ${jlptLabel}`}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenStrokeOrder(k);
          }}
          className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--tb-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-primary)] hover:text-white transition-colors cursor-pointer"
          aria-label={`Stroke Order for ${k.kanji}`}
        >
          <Pencil size={12} />
          <span>Stroke Order</span>
        </button>
      </div>
    </ContentCard>
  );
}

/* -------------------------------------------------------------------------- */
/* KanjiListTable                                                             */
/* -------------------------------------------------------------------------- */

export interface KanjiListTableProps {
  items: BookKanjiItem[];
  defaultJlpt?: number;
  srsStateById: Map<string, VocabSrsState>;
  vocabCountById?: Map<string, number>;
  selectedId?: string | null;
  onOpenStrokeOrder: (kanji: BookKanjiItem) => void;
}

export function KanjiListTable({
  items,
  defaultJlpt = 5,
  srsStateById,
  vocabCountById,
  selectedId,
  onOpenStrokeOrder,
}: KanjiListTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] shadow-2xs">
      <table className="w-full text-left border-collapse" aria-label="Kanji list">
        <thead>
          <tr className="border-b border-[var(--tb-border)] bg-[var(--tb-bg)]/70 text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
            <th className="py-2.5 px-3.5">Kanji</th>
            <th className="py-2.5 px-3">Meaning</th>
            <th className="py-2.5 px-3">On&apos;yomi</th>
            <th className="py-2.5 px-3">Kun&apos;yomi</th>
            <th className="py-2.5 px-3 hidden sm:table-cell">Strokes</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3 text-right">Practice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tb-border)]/70 text-sm">
          {items.map((k) => {
            const srsState = srsStateById.get(k.id) ?? "new";
            const jlptLabel = `N${k.jlpt || defaultJlpt}`;
            const vocabCount = vocabCountById?.get(k.id) ?? 0;

            return (
              <tr
                key={k.id}
                onClick={() => onOpenStrokeOrder(k)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-[var(--tb-accent-soft)]/30",
                  selectedId === k.id && "bg-[var(--tb-accent-soft)]/45"
                )}
              >
                <td className="py-2.5 px-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span
                      lang="ja"
                      className="grid size-10 place-items-center rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)]/60 font-kanji text-xl font-black text-[var(--primary-fg)]"
                    >
                      {k.kanji}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--tb-text-secondary)] tabular-nums">
                      #{String(k.number).padStart(3, "0")}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="block font-bold text-[var(--tb-text-primary)] capitalize">
                    {k.meaning}
                  </span>
                  {vocabCount > 0 && (
                    <span className="text-[11px] text-[var(--tb-text-secondary)]">
                      {vocabCount} lesson {vocabCount === 1 ? "word" : "words"}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {k.onyomi.length > 0 ? (
                      k.onyomi.slice(0, 3).map((on, i) => (
                        <KanjiReadingPill key={i} reading={on} type="on" size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-[var(--tb-text-secondary)]/60">—</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {k.kunyomi.length > 0 ? (
                      k.kunyomi.slice(0, 3).map((kun, i) => (
                        <KanjiReadingPill key={i} reading={kun} type="kun" size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-[var(--tb-text-secondary)]/60">—</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 hidden sm:table-cell text-xs font-bold text-[var(--tb-text-secondary)] tabular-nums whitespace-nowrap">
                  {k.strokes !== undefined ? `${k.strokes} 画` : "—"}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <VocabStatusBadge state={srsState} />
                    <LevelBadge level={jlptLabel} />
                  </div>
                </td>
                <td
                  className="py-2.5 px-3 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onOpenStrokeOrder(k)}
                    aria-label={`Stroke Order for ${k.kanji}`}
                    className="tb-focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--tb-accent-soft)] px-2.5 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-primary)] hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil size={12} />
                    <span>Stroke Order</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DialogueCard                                                               */
/* -------------------------------------------------------------------------- */

export {
  DialogueCard,
  getSpeakerTheme,
  type DialogueCardProps,
  type DialoguePresentationMode,
  type PlaybackStatus,
} from "../DialogueCard";

/* -------------------------------------------------------------------------- */
/* ExerciseCard                                                               */
/* -------------------------------------------------------------------------- */

export interface ExerciseCardProps {
  section: BookPracticeSection;
  userInputs: Record<string, string>;
  feedbackMap: Record<string, "correct" | "incorrect">;
  revealedAnswers: Record<string, boolean>;
  showAllAnswers: boolean;
  missedEnqueuedIds: Record<string, boolean>;
  romajiImeEnabled: boolean;
  onInputChange: (itemId: string, nextValue: string) => void;
  onCheckAnswer: (item: BookPracticeItem, section: BookPracticeSection) => void;
  onToggleAnswer: (itemId: string) => void;
  onEnqueueMissed: (item: BookPracticeItem, section: BookPracticeSection) => void;
  onCheckSectionAnswers?: (section: BookPracticeSection) => void;
  className?: string;
}

export function ExerciseCard({
  section,
  userInputs,
  feedbackMap,
  revealedAnswers,
  showAllAnswers,
  missedEnqueuedIds,
  romajiImeEnabled,
  onInputChange,
  onCheckAnswer,
  onToggleAnswer,
  onEnqueueMissed,
  onCheckSectionAnswers,
  className,
}: ExerciseCardProps) {
  const [showTable, setShowTable] = useState(true);

  const sectionCorrectCount = useMemo(() => {
    return section.items.filter((item) => feedbackMap[item.id] === "correct").length;
  }, [section.items, feedbackMap]);

  const sectionAttemptedCount = useMemo(() => {
    return section.items.filter((item) => !!feedbackMap[item.id]).length;
  }, [section.items, feedbackMap]);

  return (
    <ContentCard
      radius="xl"
      padding="none"
      className={cn("overflow-hidden border border-[var(--tb-border)] shadow-xs", className)}
    >
      {/* Section Header */}
      <div className="border-b border-[var(--tb-border)] bg-[var(--surface-overlay)]/50 px-5 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-xl bg-[var(--tb-primary)] px-3 py-1 text-xs font-black text-white shadow-2xs">
              Part {section.part}
              {section.section ? ` · Sec ${section.section}` : ""}
            </span>
            <h4 className="font-japanese text-sm font-bold text-[var(--tb-text-primary)] sm:text-base">
              {section.title}
            </h4>
            {section.grammarIndex && (
              <span className="rounded-lg bg-[var(--tb-accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)] border border-[var(--tb-primary)]/20">
                Grammar {section.grammarIndex}
              </span>
            )}
            <span className="rounded-lg bg-[var(--tb-surface)] border border-[var(--tb-border)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              {formatPracticeTypeLabel(section.type)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {section.audioTrack && (
              <span className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--tb-text-secondary)]">
                Track: {section.audioTrack}
              </span>
            )}

            {sectionAttemptedCount > 0 && (
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {sectionCorrectCount} / {section.items.length} Correct
              </span>
            )}

            {section.referenceTable && (
              <button
                type="button"
                onClick={() => setShowTable((prev) => !prev)}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 text-xs font-bold text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
              >
                <span>{showTable ? "Hide Chart" : "View Reference Chart"}</span>
              </button>
            )}

            {onCheckSectionAnswers && (
              <button
                type="button"
                onClick={() => onCheckSectionAnswers(section)}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-primary)]/30 bg-[var(--tb-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--tb-primary)] hover:text-white transition-all cursor-pointer"
              >
                <span>Check Section</span>
              </button>
            )}
          </div>
        </div>

        {section.subTitle && (
          <p className="mt-2 text-xs font-medium text-[var(--tb-text-secondary)]">
            {section.subTitle}
          </p>
        )}
      </div>

      {/* Reference Table */}
      {section.referenceTable && showTable && (
        <div className="overflow-x-auto border-b border-[var(--tb-border)] bg-[var(--surface-overlay)]/25 p-4 sm:p-5">
          <div className="rounded-2xl border border-[var(--tb-border)] overflow-hidden bg-[var(--tb-surface)] shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-overlay)]/60 border-b border-[var(--tb-border)]">
                <tr>
                  {section.referenceTable.headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-2.5 font-bold text-[var(--tb-text-primary)] font-japanese text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tb-border)]/60">
                {section.referenceTable.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-[var(--surface-overlay)]/30 transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-2 font-japanese text-[var(--tb-text-primary)] leading-relaxed"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="divide-y divide-[var(--tb-border)]/60 p-4 sm:p-6 space-y-4">
        {section.items.map((item, idx) => {
          const isRevealed = showAllAnswers || Boolean(revealedAnswers[item.id]);
          const feedback = feedbackMap[item.id];
          const currentInput = userInputs[item.id] || "";
          const isMissedQueued = Boolean(missedEnqueuedIds[item.id]);

          return (
            <div key={item.id} className="pt-4 first:pt-0 space-y-2.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--tb-border)]/70 text-[10px] font-bold text-[var(--tb-text-secondary)]">
                      {idx + 1}
                    </span>
                    <span className="font-japanese text-sm font-bold text-[var(--tb-text-primary)] sm:text-base">
                      {item.prompt}
                    </span>
                    {item.cue && (
                      <span className="rounded-md bg-[var(--surface-overlay)] px-2 py-0.5 text-xs text-[var(--tb-text-secondary)] font-medium">
                        {item.cue}
                      </span>
                    )}
                    {item.hint && (
                      <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Hint: {item.hint}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleAnswer(item.id)}
                  className="shrink-0 text-xs font-semibold text-[var(--primary-fg)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{isRevealed ? "Hide Answer" : "Show Answer"}</span>
                </button>
              </div>

              {/* Multiple Choice Options if provided */}
              {item.options && item.options.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.options.map((opt) => {
                    const isSelected = currentInput === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          onInputChange(item.id, opt);
                          onCheckAnswer({ ...item, answer: item.answer }, section);
                        }}
                        className={cn(
                          "tb-focus-ring rounded-xl border px-3 py-1.5 text-xs font-japanese font-bold transition-all cursor-pointer",
                          isSelected
                            ? feedback === "correct"
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                              : feedback === "incorrect"
                              ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-2xs"
                              : "border-[var(--tb-primary)] bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] shadow-2xs"
                            : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)]"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Input Row */}
              {(!item.options || item.options.length === 0) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder={
                        romajiImeEnabled
                          ? "Type Japanese response to check (or romaji)..."
                          : "Type Japanese response to check..."
                      }
                      value={currentInput}
                      onChange={(e) => {
                        const val = romajiImeEnabled
                          ? romajiToHiragana(e.target.value)
                          : e.target.value;
                        onInputChange(item.id, val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onCheckAnswer(item, section);
                        }
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-1.5 text-xs font-japanese text-[var(--tb-text-primary)] placeholder-[var(--tb-text-secondary)]/60 focus:outline-hidden transition-colors",
                        feedback === "correct"
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                          : feedback === "incorrect"
                          ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                          : "border-[var(--tb-border)] bg-[var(--surface-overlay)]/30 focus:border-[var(--tb-primary)]"
                      )}
                    />
                    {romajiImeEnabled && !feedback && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[var(--tb-surface)] border border-[var(--tb-border)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--tb-text-secondary)]">
                        かな
                      </span>
                    )}
                    {feedback && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {feedback === "correct" ? (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        ) : (
                          <XCircle size={15} className="text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onCheckAnswer(item, section)}
                    disabled={!currentInput.trim()}
                    className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:bg-[var(--tb-border)]/40 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Check
                  </button>

                  {!isMissedQueued ? (
                    <button
                      type="button"
                      onClick={() => onEnqueueMissed(item, section)}
                      className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--tb-text-secondary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                      title="Add this exercise to FSRS spaced repetition"
                    >
                      + FSRS
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <Zap size={11} />
                      <span>Queued in FSRS</span>
                    </span>
                  )}
                </div>
              )}

              {feedback === "incorrect" && (
                <CharacterDiffView
                  userInput={currentInput}
                  expectedAnswer={item.answer}
                  className="mt-2"
                />
              )}

              {isRevealed && feedback !== "incorrect" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-2.5 mt-2 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Model Answer
                    </span>
                    <p className="font-japanese text-sm font-semibold text-[var(--tb-text-primary)]">
                      {item.answer}
                    </p>
                  </div>
                  <AudioButton
                    text={item.answer}
                    mode="sentence"
                    size="sm"
                    label="Listen to model answer"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ContentCard>
  );
}
