"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  PenTool,
  PlusCircle,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import type { BookLesson, BookVocabItem } from "@/data/books";
import type { DictionaryDataMaps } from "@/data/dictionary";
import { AudioButton } from "@/components/ui/AudioButton";
import { StrokePlayer } from "@/features/kanji/components/StrokePlayer";
import {
  LevelBadge,
  TextbookButton,
  VocabStatusBadge,
} from "@/features/books/components/ui";
import {
  formatSectionLabel,
  getContextualVocabDetails,
  getVocabSrsInfo,
  type SrsLookup,
} from "@/features/books/engine/progress";
import {
  addVocabularyToSrs,
  Rating,
  recordReview,
} from "@/lib/srs/service";

const SRS_RATING_OPTIONS: ReadonlyArray<{
  rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;
  label: string;
  hint: string;
  toneClass: string;
}> = [
  {
    rating: Rating.Again,
    label: "Again",
    hint: "Forgot",
    toneClass:
      "border-[var(--tb-error-border)] bg-[var(--tb-error-bg)] text-[var(--tb-error)] hover:opacity-90",
  },
  {
    rating: Rating.Hard,
    label: "Hard",
    hint: "Effort",
    toneClass:
      "border-[var(--tb-warning-border)] bg-[var(--tb-warning-bg)] text-[var(--tb-warning)] hover:opacity-90",
  },
  {
    rating: Rating.Good,
    label: "Good",
    hint: "Recalled",
    toneClass:
      "border-[var(--tb-info-border)] bg-[var(--tb-info-bg)] text-[var(--tb-info)] hover:opacity-90",
  },
  {
    rating: Rating.Easy,
    label: "Easy",
    hint: "Instant",
    toneClass:
      "border-[var(--tb-success-border)] bg-[var(--tb-success-bg)] text-[var(--tb-success)] hover:opacity-90",
  },
];

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

async function applyVocabFsrsRating(
  item: BookVocabItem,
  rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy,
  level: string,
  hasExistingSrsItem: boolean
): Promise<void> {
  let srsId = `vocab:${item.word.trim()}`;
  if (!hasExistingSrsItem) {
    srsId = await addVocabularyToSrs({
      word: item.word,
      reading: item.readingKana,
      meaning: item.meaning,
      level,
    });
  }
  await recordReview(srsId, rating);
}

/* -------------------------------------------------------------------------- */
/* VocabularyDetailDrawer                                                     */
/* -------------------------------------------------------------------------- */

export interface VocabularyDetailDrawerProps {
  vocabItem: BookVocabItem | null;
  items: BookVocabItem[];
  bookTitle: string;
  lesson: BookLesson;
  level: string;
  srsLookup: SrsLookup;
  dictMaps: DictionaryDataMaps | null;
  onClose: () => void;
  onSelectVocab: (item: BookVocabItem) => void;
  onSrsUpdated: () => void | Promise<void>;
}

export function VocabularyDetailDrawer({
  vocabItem,
  items,
  bookTitle,
  lesson,
  level,
  srsLookup,
  dictMaps,
  onClose,
  onSelectVocab,
  onSrsUpdated,
}: VocabularyDetailDrawerProps) {
  const [expandedKanjiState, setExpandedKanjiState] = useState<{
    vocabId: string;
    char: string;
  } | null>(null);
  const [srsBusy, setSrsBusy] = useState(false);
  const [srsFeedback, setSrsFeedback] = useState<{
    vocabId: string;
    message: string;
  } | null>(null);

  const currentIndex = useMemo(() => {
    if (!vocabItem) return -1;
    return items.findIndex((entry) => entry.id === vocabItem.id);
  }, [items, vocabItem]);

  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < items.length - 1
      ? items[currentIndex + 1]
      : null;

  useEffect(() => {
    if (!vocabItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && prevItem) {
        e.preventDefault();
        onSelectVocab(prevItem);
      } else if (e.key === "ArrowRight" && nextItem) {
        e.preventDefault();
        onSelectVocab(nextItem);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vocabItem, prevItem, nextItem, onClose, onSelectVocab]);

  const details = useMemo(() => {
    if (!vocabItem) return null;
    return getContextualVocabDetails(vocabItem, lesson, dictMaps);
  }, [vocabItem, lesson, dictMaps]);

  const srsInfo = useMemo(() => {
    if (!vocabItem) return null;
    return getVocabSrsInfo(vocabItem.word, srsLookup);
  }, [vocabItem, srsLookup]);

  if (!vocabItem || !details || !srsInfo) return null;

  const activeExpandedKanji =
    expandedKanjiState?.vocabId === vocabItem.id
      ? expandedKanjiState.char
      : null;
  const activeFeedback =
    srsFeedback?.vocabId === vocabItem.id ? srsFeedback.message : null;
  const effectiveLevel = details.dictionaryRecord?.level || level;
  const displayRomaji = details.dictionaryRecord?.romaji || vocabItem.reading;

  const handleAddToSrs = async () => {
    setSrsBusy(true);
    try {
      await addVocabularyToSrs({
        word: vocabItem.word,
        reading: vocabItem.readingKana,
        meaning: vocabItem.meaning,
        level: effectiveLevel,
      });
      await onSrsUpdated();
      setSrsFeedback({ vocabId: vocabItem.id, message: "Added to FSRS review queue" });
    } finally {
      setSrsBusy(false);
    }
  };

  const handleRate = async (
    rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy,
    label: string
  ) => {
    setSrsBusy(true);
    try {
      await applyVocabFsrsRating(
        vocabItem,
        rating,
        effectiveLevel,
        Boolean(srsInfo.item)
      );
      await onSrsUpdated();
      setSrsFeedback({ vocabId: vocabItem.id, message: `Recorded FSRS rating: ${label}` });
    } finally {
      setSrsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Vocabulary details: ${vocabItem.word}`}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-[var(--tb-bg)] border-l border-[var(--tb-border)] shadow-2xl">
        {/* Sticky Drawer Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--tb-border)] bg-[var(--tb-surface)] px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-0.5">
              <button
                type="button"
                onClick={() => prevItem && onSelectVocab(prevItem)}
                disabled={!prevItem}
                aria-label="Previous word"
                className="tb-focus-ring rounded-lg p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:bg-[var(--tb-surface)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="px-1.5 text-xs font-bold text-[var(--tb-text-secondary)] tabular-nums">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${items.length}` : ""}
              </span>
              <button
                type="button"
                onClick={() => nextItem && onSelectVocab(nextItem)}
                disabled={!nextItem}
                aria-label="Next word"
                className="tb-focus-ring rounded-lg p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:bg-[var(--tb-surface)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            <span className="truncate text-xs font-semibold text-[var(--tb-text-secondary)]">
              {bookTitle} · Lesson {lesson.lessonNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close vocabulary details"
            className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          {/* Primary Lexical Header */}
          <section className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-5 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <VocabStatusBadge state={srsInfo.state} />
                  <span className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--tb-text-secondary)]">
                    {details.partOfSpeechLabel}
                  </span>
                  <LevelBadge level={effectiveLevel} />
                </div>

                <h2 className="pt-1 font-japanese text-3xl sm:text-4xl font-black text-[var(--tb-text-primary)] tracking-tight">
                  {vocabItem.word}
                </h2>

                <div className="flex items-center gap-2.5 flex-wrap text-sm">
                  {vocabItem.readingKana !== vocabItem.word && (
                    <span className="font-japanese font-bold text-[var(--primary-fg)]">
                      {vocabItem.readingKana}
                    </span>
                  )}
                  {displayRomaji && (
                    <span className="font-mono text-xs text-[var(--tb-text-secondary)]">
                      {displayRomaji}
                    </span>
                  )}
                </div>
              </div>

              <AudioButton
                text={vocabItem.word}
                reading={vocabItem.readingKana}
                mode="vocab"
                size="md"
                label={`Listen to ${vocabItem.word}`}
              />
            </div>

            <div className="pt-3 border-t border-[var(--tb-border)]/70">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                Meaning
              </p>
              <p className="mt-0.5 text-lg font-bold text-[var(--tb-text-primary)] leading-snug">
                {vocabItem.meaning}
              </p>
            </div>
          </section>

          {/* FSRS Spaced Repetition Status & Actions */}
          <section
            aria-label="FSRS review status"
            className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--primary-fg)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  FSRS Study Progress
                </h3>
              </div>

              {srsInfo.state === "new" && (
                <TextbookButton
                  variant="secondary"
                  size="sm"
                  loading={srsBusy}
                  onClick={handleAddToSrs}
                  leftIcon={<PlusCircle size={13} />}
                >
                  Add to FSRS
                </TextbookButton>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 p-2">
                <p className="text-[10px] font-bold uppercase text-[var(--tb-text-secondary)]">
                  Status
                </p>
                <div className="mt-1 flex justify-center">
                  <VocabStatusBadge state={srsInfo.state} />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 p-2">
                <p className="text-[10px] font-bold uppercase text-[var(--tb-text-secondary)]">
                  Reviews
                </p>
                <p className="mt-1 text-sm font-black text-[var(--tb-text-primary)] tabular-nums">
                  {srsInfo.reps}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 p-2">
                <p className="text-[10px] font-bold uppercase text-[var(--tb-text-secondary)]">
                  Next Due
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--tb-text-primary)]">
                  {srsInfo.state === "new"
                    ? "Not queued"
                    : srsInfo.state === "due"
                    ? "Due now"
                    : srsInfo.dueDate
                    ? srsInfo.dueDate.toLocaleDateString()
                    : "Scheduled"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold text-[var(--tb-text-secondary)]">
                Rate recall to schedule your next FSRS review:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {SRS_RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.rating}
                    type="button"
                    disabled={srsBusy}
                    onClick={() => handleRate(opt.rating, opt.label)}
                    className={`tb-focus-ring rounded-xl border px-2 py-2 text-center transition-all cursor-pointer disabled:opacity-50 ${opt.toneClass}`}
                  >
                    <span className="block text-xs font-black">{opt.label}</span>
                    <span className="block text-[10px] opacity-80">{opt.hint}</span>
                  </button>
                ))}
              </div>
              {activeFeedback && (
                <p className="mt-2 text-xs font-bold text-[var(--tb-success)]">
                  {activeFeedback}
                </p>
              )}
            </div>
          </section>

          {/* Example Sentences */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-[var(--primary-fg)]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                Example Sentences
              </h3>
            </div>

            {details.examples.length > 0 ? (
              <div className="space-y-2.5">
                {details.examples.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-japanese text-base font-bold text-[var(--tb-text-primary)] leading-relaxed">
                        {ex.ja}
                      </p>
                      <AudioButton
                        text={ex.ja}
                        id={ex.audioSrc}
                        mode="sentence"
                        size="sm"
                        label={`Listen to example sentence ${ex.ja}`}
                      />
                    </div>
                    {ex.en && (
                      <p className="text-sm font-medium text-[var(--tb-text-secondary)] leading-snug">
                        {ex.en}
                      </p>
                    )}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--tb-text-secondary)]">
                        {ex.sourceLabel}
                      </span>
                      {ex.targetTab && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            try {
                              const url = new URL(window.location.href);
                              url.searchParams.set("tab", ex.targetTab!);
                              window.history.pushState({ tab: ex.targetTab }, "", url.toString());
                              window.dispatchEvent(new PopStateEvent("popstate"));
                            } catch {
                              // ignore
                            }
                          }}
                          className="tb-focus-ring inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary-fg)] hover:underline cursor-pointer"
                        >
                          <span>Open in {formatSectionLabel(ex.targetTab)}</span>
                          <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--tb-border)] bg-[var(--tb-surface)]/70 p-4 text-xs font-medium text-[var(--tb-text-secondary)]">
                No matching example sentences found in Lesson {lesson.lessonNumber} or the local sentence bank for this item.
              </div>
            )}
          </section>

          {/* Kanji Breakdown */}
          {details.kanjiBreakdown.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <PenTool size={15} className="text-[var(--primary-fg)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  Kanji Breakdown
                </h3>
              </div>

              <div className="space-y-2.5">
                {details.kanjiBreakdown.map((k) => {
                  const isOpen = activeExpandedKanji === k.char;
                  return (
                    <div
                      key={k.char}
                      className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] font-japanese text-2xl font-black text-[var(--tb-text-primary)]">
                            {k.char}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--tb-text-primary)]">
                              {k.meaning}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[var(--tb-text-secondary)]">
                              {k.onyomi.length > 0 && (
                                <span className="rounded bg-[var(--tb-bg)] px-1.5 py-0.5 font-japanese">
                                  音: {k.onyomi.slice(0, 3).join(", ")}
                                </span>
                              )}
                              {k.kunyomi.length > 0 && (
                                <span className="rounded bg-[var(--tb-bg)] px-1.5 py-0.5 font-japanese">
                                  訓: {k.kunyomi.slice(0, 3).join(", ")}
                                </span>
                              )}
                              {k.strokes && (
                                <span>{k.strokes} strokes</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <TextbookButton
                          variant={isOpen ? "primary" : "secondary"}
                          size="sm"
                          onClick={() =>
                            setExpandedKanjiState(
                              isOpen
                                ? null
                                : { vocabId: vocabItem.id, char: k.char }
                            )
                          }
                        >
                          {isOpen ? "Hide Strokes" : "Stroke Order"}
                        </TextbookButton>
                      </div>

                      {isOpen && (
                        <div className="pt-2 border-t border-[var(--tb-border)]">
                          <StrokePlayer
                            kanji={k.char}
                            level={k.jlpt}
                            onClose={() => setExpandedKanjiState(null)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related Lesson Vocabulary */}
          {details.relatedVocab.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[var(--primary-fg)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  Related Lesson Words
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {details.relatedVocab.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectVocab(rel)}
                    className="tb-focus-ring flex items-center justify-between gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-3 py-2 text-left hover:border-[var(--tb-primary)]/50 hover:bg-[var(--tb-accent-soft)]/30 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="block font-japanese text-sm font-bold text-[var(--tb-text-primary)] truncate">
                        {rel.word}
                      </span>
                      <span className="block text-xs text-[var(--tb-text-secondary)] truncate">
                        {rel.meaning}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-[var(--tb-text-secondary)]"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* VocabularyFlashcardDeck (Focused FSRS Flip-Card Study Mode)                */
/* -------------------------------------------------------------------------- */

export interface VocabularyFlashcardDeckProps {
  items: BookVocabItem[];
  level: string;
  srsLookup: SrsLookup;
  studyMode?: "show-all" | "hide-en" | "hide-kana";
  keyboardEnabled?: boolean;
  onInspectVocab?: (item: BookVocabItem) => void;
  onSrsUpdated: () => void | Promise<void>;
}

export function VocabularyFlashcardDeck({
  items,
  level,
  srsLookup,
  studyMode = "show-all",
  keyboardEnabled = true,
  onInspectVocab,
  onSrsUpdated,
}: VocabularyFlashcardDeckProps) {
  const [rawIndex, setRawIndex] = useState(0);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [deckBusy, setDeckBusy] = useState(false);

  const safeIndex = items.length > 0 ? Math.min(rawIndex, items.length - 1) : 0;
  const current = items[safeIndex] ?? null;
  const isRevealed = Boolean(current && revealedId === current.id);

  useEffect(() => {
    if (!keyboardEnabled || !current) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setRawIndex((prev) => Math.max(0, Math.min(prev, items.length - 1) - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setRawIndex((prev) => Math.min(items.length - 1, prev + 1));
      } else if (e.key === " " || e.key === "Enter") {
        if (
          e.target instanceof HTMLElement &&
          ["BUTTON", "A"].includes(e.target.tagName)
        ) {
          return;
        }
        e.preventDefault();
        setRevealedId((prev) => (prev === current.id ? null : current.id));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardEnabled, current, items.length]);

  if (!current) return null;

  const srsInfo = getVocabSrsInfo(current.word, srsLookup);

  const handleRateCard = async (
    rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy
  ) => {
    setDeckBusy(true);
    try {
      await applyVocabFsrsRating(
        current,
        rating,
        level,
        Boolean(srsInfo.item)
      );
      await onSrsUpdated();
      setRevealedId(null);
      if (safeIndex < items.length - 1) {
        setRawIndex(safeIndex + 1);
      }
    } finally {
      setDeckBusy(false);
    }
  };

  return (
    <div
      aria-label="Focused flashcard deck"
      className="rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Deck Top Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[var(--tb-accent-soft)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--primary-fg)]">
            Focused Deck
          </span>
          <span className="text-xs font-bold text-[var(--tb-text-secondary)] tabular-nums">
            Card {safeIndex + 1} of {items.length}
          </span>
          <VocabStatusBadge state={srsInfo.state} />
        </div>

        <div className="flex items-center gap-1.5">
          {onInspectVocab && (
            <TextbookButton
              variant="ghost"
              size="sm"
              onClick={() => onInspectVocab(current)}
            >
              Details
            </TextbookButton>
          )}
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => {
              setRevealedId(null);
              setRawIndex((prev) => Math.max(0, prev - 1));
            }}
            aria-label="Previous flashcard"
            className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={safeIndex >= items.length - 1}
            onClick={() => {
              setRevealedId(null);
              setRawIndex((prev) => Math.min(items.length - 1, prev + 1));
            }}
            aria-label="Next flashcard"
            className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Prompt Surface */}
      <div className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <h3 className="font-japanese text-3xl sm:text-4xl font-black text-[var(--tb-text-primary)]">
            {current.word}
          </h3>
          <AudioButton
            text={current.word}
            reading={current.readingKana}
            mode="vocab"
            size="md"
            label={`Listen to ${current.word}`}
          />
        </div>

        {(studyMode !== "hide-kana" || isRevealed) && (
          <div className="space-y-0.5">
            {current.readingKana !== current.word && (
              <p className="font-japanese text-base font-bold text-[var(--primary-fg)]">
                {current.readingKana}
              </p>
            )}
            <p className="font-mono text-xs text-[var(--tb-text-secondary)]">
              {current.reading}
            </p>
          </div>
        )}

        {!isRevealed ? (
          <div className="pt-2">
            <TextbookButton
              variant="primary"
              size="md"
              onClick={() => setRevealedId(current.id)}
              leftIcon={<Eye size={14} />}
            >
              Reveal Answer
            </TextbookButton>
            <p className="mt-2 text-[11px] text-[var(--tb-text-secondary)]">
              Shortcuts: Space / Enter to reveal · Left / Right arrows to navigate
            </p>
          </div>
        ) : (
          <div className="pt-3 border-t border-[var(--tb-border)] space-y-4">
            <div className="space-y-1">
              <p className="text-xl font-black text-[var(--tb-text-primary)]">
                {current.meaning}
              </p>
              <button
                type="button"
                onClick={() => setRevealedId(null)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--tb-text-secondary)] hover:text-[var(--primary-fg)] cursor-pointer"
              >
                <RotateCw size={12} />
                <span>Hide Answer</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto">
              {SRS_RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.rating}
                  type="button"
                  disabled={deckBusy}
                  onClick={() => handleRateCard(opt.rating)}
                  className={`tb-focus-ring rounded-xl border px-3 py-2 text-center transition-all cursor-pointer disabled:opacity-50 ${opt.toneClass}`}
                >
                  <span className="block text-xs font-black">{opt.label}</span>
                  <span className="block text-[10px] opacity-80">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
