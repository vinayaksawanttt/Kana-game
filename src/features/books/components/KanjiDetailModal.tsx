"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Play,
  PlusCircle,
  Sparkles,
  X,
} from "lucide-react";
import type { BookKanjiItem, BookLesson, BookVocabItem } from "@/data/books";
import { getKanjiComposites, type KanjiCompositeItem } from "@/data/kanjiVocab";
import { getRadicalsForKanji, type RadicalRecord } from "@/data/radicals";
import { getKanjiStrokeData, type KanjiStrokeData } from "@/data/strokes";
import { StrokePlayer } from "@/features/kanji/components/StrokePlayer";
import { StrokePracticeCanvas } from "@/features/kanji/components/StrokePracticeCanvas";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { AudioButton } from "@/components/ui/AudioButton";
import {
  LevelBadge,
  TextbookButton,
  VocabStatusBadge,
} from "@/features/books/components/ui";
import {
  getContextualKanjiDetails,
  getKanjiSrsInfo,
  type SrsLookup,
} from "@/features/books/engine/progress";
import {
  addKanjiToSrs,
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

export interface KanjiDetailModalProps {
  kanjiItem: BookKanjiItem | null;
  items: BookKanjiItem[];
  lesson: BookLesson;
  defaultJlpt: number;
  srsLookup: SrsLookup;
  onClose: () => void;
  onSelectKanji: (item: BookKanjiItem) => void;
  onSelectVocab: (vocabItem: BookVocabItem) => void;
  onSrsUpdated: () => void | Promise<void>;
}

export function KanjiDetailModal({
  kanjiItem,
  items,
  lesson,
  defaultJlpt,
  srsLookup,
  onClose,
  onSelectKanji,
  onSelectVocab,
  onSrsUpdated,
}: KanjiDetailModalProps) {
  const [studioTab, setStudioTab] = useState<"animation" | "practice">("animation");
  const [loadedExtra, setLoadedExtra] = useState<{
    kanji: string;
    strokeData: KanjiStrokeData | null;
    radicals: RadicalRecord[];
    composites: KanjiCompositeItem[];
  } | null>(null);
  const [srsBusy, setSrsBusy] = useState(false);
  const [srsFeedback, setSrsFeedback] = useState<{
    kanji: string;
    message: string;
  } | null>(null);

  const currentIndex = useMemo(() => {
    if (!kanjiItem) return -1;
    return items.findIndex((entry) => entry.id === kanjiItem.id || entry.kanji === kanjiItem.kanji);
  }, [items, kanjiItem]);

  const prevKanji = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextKanji =
    currentIndex >= 0 && currentIndex < items.length - 1
      ? items[currentIndex + 1]
      : null;

  useEffect(() => {
    if (!kanjiItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && prevKanji) {
        e.preventDefault();
        onSelectKanji(prevKanji);
      } else if (e.key === "ArrowRight" && nextKanji) {
        e.preventDefault();
        onSelectKanji(nextKanji);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [kanjiItem, nextKanji, onClose, onSelectKanji, prevKanji]);

  useEffect(() => {
    if (!kanjiItem) return;
    let cancelled = false;
    const targetChar = kanjiItem.kanji;
    const targetLevel = kanjiItem.jlpt || defaultJlpt;

    Promise.all([
      getKanjiStrokeData(targetChar, targetLevel).catch(() => null),
      getRadicalsForKanji(targetChar).catch(() => []),
      getKanjiComposites(targetChar, targetLevel).catch(() => []),
    ]).then(([strokeData, radicals, composites]) => {
      if (cancelled) return;
      setLoadedExtra({
        kanji: targetChar,
        strokeData,
        radicals,
        composites: composites.slice(0, 6),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [defaultJlpt, kanjiItem]);

  const details = useMemo(() => {
    if (!kanjiItem) return null;
    return getContextualKanjiDetails(kanjiItem, lesson, defaultJlpt);
  }, [defaultJlpt, kanjiItem, lesson]);

  const srsInfo = useMemo(() => {
    if (!kanjiItem) return null;
    return getKanjiSrsInfo(kanjiItem, srsLookup);
  }, [kanjiItem, srsLookup]);

  if (!kanjiItem || !details || !srsInfo) return null;

  const extra = loadedExtra?.kanji === kanjiItem.kanji ? loadedExtra : null;
  const strokeData = extra?.strokeData ?? null;
  const radicals = extra?.radicals ?? [];
  const composites = extra?.composites ?? [];
  const jlptNum = kanjiItem.jlpt || defaultJlpt;
  const activeFeedback =
    srsFeedback?.kanji === kanjiItem.kanji ? srsFeedback.message : null;

  const readingSummary = [...kanjiItem.onyomi, ...kanjiItem.kunyomi]
    .filter(Boolean)
    .join(" · ");

  const handleAddToSrs = async () => {
    setSrsBusy(true);
    try {
      await addKanjiToSrs({
        kanji: kanjiItem.kanji,
        meaning: kanjiItem.meaning,
        reading: readingSummary,
        level: details.jlptLevel,
      });
      await onSrsUpdated();
      setSrsFeedback({ kanji: kanjiItem.kanji, message: "Added to FSRS review queue" });
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
      let srsId = srsInfo.srsId;
      if (!srsInfo.item) {
        srsId = await addKanjiToSrs({
          kanji: kanjiItem.kanji,
          meaning: kanjiItem.meaning,
          reading: readingSummary,
          level: details.jlptLevel,
        });
      }
      await recordReview(srsId, rating);
      await onSrsUpdated();
      setSrsFeedback({ kanji: kanjiItem.kanji, message: `Recorded FSRS rating: ${label}` });
    } finally {
      setSrsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Stroke order animation for ${kanjiItem.kanji}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-bg)] shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--tb-border)] bg-[var(--tb-surface)] px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-0.5">
              <button
                type="button"
                onClick={() => prevKanji && onSelectKanji(prevKanji)}
                disabled={!prevKanji}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--tb-text-primary)] disabled:opacity-35 hover:bg-[var(--tb-surface)] cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous kanji"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span className="px-1.5 text-xs font-bold text-[var(--tb-text-secondary)] tabular-nums">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${items.length}` : ""}
              </span>
              <button
                type="button"
                onClick={() => nextKanji && onSelectKanji(nextKanji)}
                disabled={!nextKanji}
                className="tb-focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--tb-text-primary)] disabled:opacity-35 hover:bg-[var(--tb-surface)] cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next kanji"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <span className="truncate text-xs font-semibold text-[var(--tb-text-secondary)]">
              Lesson {lesson.lessonNumber} Kanji · JLPT N{jlptNum}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tb-focus-ring rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-2 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors cursor-pointer"
            aria-label="Close stroke player"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          {/* Primary Kanji Character & Readings Summary */}
          <section className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative grid size-20 sm:size-24 shrink-0 place-items-center rounded-2xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)]/70 shadow-xs overflow-hidden">
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
                    className="relative z-10 font-kanji text-5xl sm:text-6xl font-black text-[var(--primary-fg)] leading-none"
                  >
                    {kanjiItem.kanji}
                  </span>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[var(--tb-text-secondary)] tabular-nums">
                      #{String(kanjiItem.number).padStart(3, "0")}
                    </span>
                    <LevelBadge level={`N${jlptNum}`} />
                    {kanjiItem.strokes !== undefined && (
                      <span className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--tb-text-secondary)] tabular-nums">
                        {kanjiItem.strokes} 画
                      </span>
                    )}
                    <VocabStatusBadge state={srsInfo.state} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--tb-text-primary)] capitalize leading-tight">
                    {kanjiItem.label || kanjiItem.meaning}
                  </h3>
                </div>
              </div>

              <Link
                href={`/games/kanji/playground/${encodeURIComponent(kanjiItem.kanji)}`}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:border-[var(--tb-primary)] transition-colors"
                target="_blank"
              >
                <span>Freehand Canvas</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {/* Readings & Radicals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--tb-border)]/70">
              <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-3 space-y-1.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  On&apos;yomi (音読み)
                </span>
                {details.hasOnyomi ? (
                  <div className="flex flex-wrap gap-1.5">
                    {kanjiItem.onyomi.map((on, i) => (
                      <KanjiReadingPill key={i} reading={on} type="on" size="sm" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--tb-text-secondary)] italic">None</p>
                )}
              </div>

              <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-3 space-y-1.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  Kun&apos;yomi (訓読み)
                </span>
                {details.hasKunyomi ? (
                  <div className="flex flex-wrap gap-1.5">
                    {kanjiItem.kunyomi.map((kun, i) => (
                      <KanjiReadingPill key={i} reading={kun} type="kun" size="sm" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--tb-text-secondary)] italic">None</p>
                )}
              </div>
            </div>

            {radicals.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  Radicals:
                </span>
                {radicals.map((rad) => (
                  <span
                    key={rad.character}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2.5 py-1 text-xs"
                  >
                    <span lang="ja" className="font-kanji font-black text-[var(--primary-fg)]">
                      {rad.character}
                    </span>
                    <span className="font-semibold text-[var(--tb-text-primary)]">
                      {rad.meaning}
                    </span>
                    {rad.reading && (
                      <span className="text-[var(--tb-text-secondary)]">
                        ({rad.reading})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Stroke Order Animation & Interactive Writing Practice Studio */}
          <section className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tb-border)]/70 pb-3">
              <div
                role="tablist"
                aria-label="Kanji practice mode"
                className="inline-flex rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={studioTab === "animation"}
                  onClick={() => setStudioTab("animation")}
                  className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    studioTab === "animation"
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  <Play size={12} fill="currentColor" />
                  <span>Stroke Order Animation</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={studioTab === "practice"}
                  onClick={() => setStudioTab("practice")}
                  className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    studioTab === "practice"
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  <Pencil size={12} />
                  <span>Writing Practice</span>
                </button>
              </div>
            </div>

            {studioTab === "animation" ? (
              extra && (!strokeData || strokeData.paths.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-5 text-center space-y-2">
                  <p className="text-xs font-semibold text-[var(--tb-text-secondary)]">
                    Stroke order vector data is unavailable for {kanjiItem.kanji}.
                  </p>
                  <Link
                    href={`/games/kanji/playground/${encodeURIComponent(kanjiItem.kanji)}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)] hover:underline"
                  >
                    <span>Open Freehand Canvas</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ) : (
                <StrokePlayer
                  kanji={kanjiItem.kanji}
                  level={jlptNum}
                  strokeData={extra ? strokeData : undefined}
                  className="w-full"
                />
              )
            ) : !extra ? (
              <div className="py-10 text-center text-xs font-semibold text-[var(--tb-text-secondary)]">
                Loading stroke validation paths...
              </div>
            ) : !strokeData || strokeData.paths.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--tb-border)] bg-[var(--tb-bg)]/50 p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-[var(--tb-text-secondary)]">
                  Stroke order validation data is unavailable for {kanjiItem.kanji}.
                </p>
                <Link
                  href={`/games/kanji/playground/${encodeURIComponent(kanjiItem.kanji)}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)] hover:underline"
                >
                  <span>Open Freehand Canvas</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            ) : (
              <StrokePracticeCanvas
                kanji={kanjiItem.kanji}
                level={jlptNum}
                strokeData={strokeData}
              />
            )}
          </section>

          {/* Vocabulary Connections */}
          {(details.lessonVocab.length > 0 || composites.length > 0) && (
            <section className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-[var(--primary-fg)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  Vocabulary Using {kanjiItem.kanji}
                </h3>
              </div>

              {details.lessonVocab.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[var(--tb-text-secondary)]">
                    From Lesson {lesson.lessonNumber} Vocabulary (Click to inspect word)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {details.lessonVocab.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/50 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectVocab(v)}
                          aria-label={`Inspect vocabulary ${v.word}`}
                          className="tb-focus-ring flex-1 text-left min-w-0 cursor-pointer group"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-japanese text-sm font-bold text-[var(--tb-text-primary)] group-hover:text-[var(--primary-fg)]">
                              {v.word}
                            </span>
                            {v.readingKana !== v.word && (
                              <span className="font-japanese text-xs text-[var(--primary-fg)]">
                                {v.readingKana}
                              </span>
                            )}
                          </div>
                          <span className="block text-xs text-[var(--tb-text-secondary)] truncate">
                            {v.meaning}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <AudioButton
                            text={v.word}
                            reading={v.readingKana}
                            mode="vocab"
                            size="sm"
                            label={`Listen to ${v.word}`}
                          />
                          <button
                            type="button"
                            onClick={() => onSelectVocab(v)}
                            className="tb-focus-ring rounded-lg p-1 text-[var(--tb-text-secondary)] hover:text-[var(--primary-fg)] cursor-pointer"
                            aria-hidden="true"
                            tabIndex={-1}
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {composites.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--tb-border)]/70">
                  <p className="text-[11px] font-bold text-[var(--tb-text-secondary)]">
                    Common Compound Words
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {composites.map((comp, idx) => (
                      <div
                        key={`${comp.word}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-japanese text-sm font-bold text-[var(--tb-text-primary)]">
                              {comp.word}
                            </span>
                            <span className="font-japanese text-xs text-[var(--primary-fg)]">
                              {comp.reading}
                            </span>
                          </div>
                          <span className="block text-xs text-[var(--tb-text-secondary)] truncate">
                            {comp.meaning}
                          </span>
                        </div>
                        <AudioButton
                          text={comp.word}
                          reading={comp.reading}
                          mode="vocab"
                          size="sm"
                          label={`Listen to ${comp.word}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* FSRS Study Status & Rating Controls */}
          <section
            aria-label="Kanji FSRS progress"
            className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--primary-fg)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                  FSRS Kanji Progress ({srsInfo.reps} reviews)
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
              <p className="text-xs font-bold text-[var(--tb-success)]">
                {activeFeedback}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
