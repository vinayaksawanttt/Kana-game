"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Download, RotateCcw, Upload, Volume2, VolumeX } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { grammarGuideHref } from "@/data/grammar";
import {
  exportBackup,
  getAllSrsItems,
  getDueCards,
  importBackup,
  Rating,
  recordReview,
} from "@/lib/srs/service";
import type { SrsItem, SrsItemType } from "@/lib/srs/db";
import { AudioButton } from "@/components/ui/AudioButton";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

const filterTabs: Array<{ key: "all" | SrsItemType; label: string }> = [
  { key: "all", label: "All due" },
  { key: "kana", label: "Kana" },
  { key: "kanji", label: "Kanji" },
  { key: "vocab", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
];

export default function ReviewHubPage() {
  const [dueItems, setDueItems] = useState<SrsItem[]>([]);
  const [totalStored, setTotalStored] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<"all" | SrsItemType>("all");
  const [mode, setMode] = useState<"dashboard" | "review" | "complete">("dashboard");
  const [direction, setDirection] = useState<"recognition" | "recall">("recognition");
  const [queue, setQueue] = useState<SrsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    playKana,
    playReading,
    playVocab,
    playSentence,
    autoPlayEnabled,
    setAutoPlayEnabled,
  } = useJapaneseAudio();

  useEffect(() => {
    const item = queue[currentIndex];
    if (!revealed || !autoPlayEnabled || !item || mode !== "review") return;
    if (item.type === "kana") {
      playKana(item.prompt, item.reading || item.answer);
    } else if (item.type === "kanji") {
      playReading(item.reading || item.prompt);
    } else if (item.type === "vocab") {
      playVocab({ word: item.prompt, reading: item.reading });
    } else if (item.type === "grammar") {
      playSentence(item.prompt);
    }
  }, [
    revealed,
    autoPlayEnabled,
    queue,
    currentIndex,
    mode,
    playKana,
    playReading,
    playVocab,
    playSentence,
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nihongo-review-direction");
      if (saved === "recognition" || saved === "recall") {
        setDirection(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  function handleDirectionChange(newDirection: "recognition" | "recall") {
    setDirection(newDirection);
    try {
      localStorage.setItem("nihongo-review-direction", newDirection);
    } catch {
      // Ignore localStorage errors
    }
  }

  const refreshQueue = useCallback(async () => {
    try {
      const [due, all] = await Promise.all([getDueCards(), getAllSrsItems()]);
      setDueItems(due);
      setTotalStored(all.length);
    } catch (error) {
      console.error("Could not load SRS items.", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.storage?.persist) {
        void navigator.storage.persist();
      }
    } catch {
      // Ignore storage persistence errors in unsupported environments
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshQueue();
  }, [refreshQueue]);

  const kanaDue = dueItems.filter((item) => item.type === "kana");
  const kanjiDue = dueItems.filter((item) => item.type === "kanji");
  const vocabDue = dueItems.filter((item) => item.type === "vocab");
  const grammarDue = dueItems.filter((item) => item.type === "grammar");

  const filteredDue =
    selectedFilter === "all"
      ? dueItems
      : dueItems.filter((item) => item.type === selectedFilter);

  function startReview() {
    if (filteredDue.length === 0) return;
    setQueue([...filteredDue]);
    setCurrentIndex(0);
    setRevealed(false);
    setReviewedCount(0);
    setToast(null);
    setMode("review");
  }

  const handleGrade = useCallback(
    async (rating: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy) => {
      const current = queue[currentIndex];
      if (!current) return;
      await recordReview(current.id, rating);
      setReviewedCount((count) => count + 1);

      if (currentIndex + 1 >= queue.length) {
        await refreshQueue();
        setMode("complete");
      } else {
        setRevealed(false);
        setCurrentIndex((index) => index + 1);
      }
    },
    [currentIndex, queue, refreshQueue]
  );

  useEffect(() => {
    if (mode !== "review") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed) {
        if (event.key === "1") {
          event.preventDefault();
          void handleGrade(Rating.Again);
        } else if (event.key === "2") {
          event.preventDefault();
          void handleGrade(Rating.Hard);
        } else if (event.key === "3") {
          event.preventDefault();
          void handleGrade(Rating.Good);
        } else if (event.key === "4") {
          event.preventDefault();
          void handleGrade(Rating.Easy);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleGrade, mode, revealed]);

  async function handleExportBackup() {
    try {
      const json = await exportBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nihongo-master-backup-${dateStr}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setToast({
        type: "success",
        message: `Exported backup (${totalStored} cards).`,
      });
    } catch (error) {
      console.error("Failed to export SRS backup.", error);
      setToast({
        type: "error",
        message: "Could not export backup. Please try again.",
      });
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const { count } = await importBackup(text);
      await refreshQueue();
      setToast({
        type: "success",
        message: `Imported ${count} review ${count === 1 ? "card" : "cards"} successfully.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not import backup file.";
      setToast({ type: "error", message });
    }
  }

  const currentItem = queue[currentIndex];
  const isCharacterCard =
    currentItem?.type === "kana" || currentItem?.type === "kanji";
  const grammarRefHref =
    currentItem?.type === "grammar" && currentItem.id.startsWith("grammar:")
      ? grammarGuideHref(currentItem.id.slice("grammar:".length))
      : null;

  return (
    <GameLayout label="FSRS REVIEW" glyph="復">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-6 sm:px-8">
        {mode === "dashboard" && (
          <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Spaced Repetition · Local-First
                  </p>
                  <h1 className="text-2xl font-bold sm:text-3xl">FSRS Review Hub</h1>
                </div>
                <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                  {totalStored} total cards tracked
                </span>
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Review Mode:
                  </span>
                  <div
                    className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5"
                    role="group"
                    aria-label="Select review direction"
                  >
                    <button
                      type="button"
                      aria-pressed={direction === "recognition"}
                      onClick={() => handleDirectionChange("recognition")}
                      className={`min-h-9 rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                        direction === "recognition"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Recognition (JA → EN)
                    </button>
                    <button
                      type="button"
                      aria-pressed={direction === "recall"}
                      onClick={() => handleDirectionChange("recall")}
                      className={`min-h-9 rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                        direction === "recall"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Recall (EN → JA)
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {direction === "recognition"
                    ? "Prompt with Japanese · Recall English meaning"
                    : "Prompt with English nuance · Recall Japanese word"}
                </p>
              </div>

              <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter due cards by category">
                {filterTabs.map((tab) => {
                  const active = selectedFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedFilter(tab.key)}
                      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Kana
                    </span>
                    <span className="font-japanese text-lg text-[var(--primary-fg)]">あ</span>
                  </div>
                  <p className="mt-2 font-japanese text-3xl font-bold" data-testid="due-kana-count">
                    {loading ? "…" : kanaDue.length}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">due today</p>
                </div>

                <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Kanji
                    </span>
                    <span className="font-japanese text-lg text-[var(--primary-fg)]">漢</span>
                  </div>
                  <p className="mt-2 font-japanese text-3xl font-bold" data-testid="due-kanji-count">
                    {loading ? "…" : kanjiDue.length}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">due today</p>
                </div>

                <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Vocabulary
                    </span>
                    <span className="font-japanese text-lg text-[var(--primary-fg)]">語</span>
                  </div>
                  <p className="mt-2 font-japanese text-3xl font-bold" data-testid="due-vocab-count">
                    {loading ? "…" : vocabDue.length}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">due today</p>
                </div>

                <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Grammar
                    </span>
                    <span className="font-japanese text-lg text-[var(--primary-fg)]">文</span>
                  </div>
                  <p className="mt-2 font-japanese text-3xl font-bold" data-testid="due-grammar-count">
                    {loading ? "…" : grammarDue.length}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">due today</p>
                </div>
              </div>

              <div className="mt-7 border-t border-[var(--line)] pt-6">
                <h2 className="text-sm font-bold">Backup &amp; Restore Progress</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Reviews are stored locally in your browser with IndexedDB. Export a JSON snapshot anytime to back up or transfer your schedule.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="secondary-button flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition-colors hover:border-[var(--primary)]"
                  >
                    <Download size={16} /> Export Backup
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="secondary-button flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition-colors hover:border-[var(--primary)]"
                  >
                    <Upload size={16} /> Import Backup
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    aria-label="Import backup JSON file"
                    onChange={handleImportFile}
                    className="sr-only"
                  />
                </div>
                {toast && (
                  <p
                    role={toast.type === "error" ? "alert" : "status"}
                    className={`mt-3 text-sm font-semibold ${
                      toast.type === "error" ? "text-[var(--wrong)]" : "text-[var(--correct)]"
                    }`}
                  >
                    {toast.message}
                  </p>
                )}
              </div>
            </div>

            <aside className="rounded-lg border border-[var(--primary-hover)] bg-[var(--primary)] p-6 text-white sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                Due for review
              </p>
              <div className="my-5 flex items-end justify-between border-b border-white/30 pb-5">
                <span className="font-japanese text-5xl leading-none" data-testid="due-total-count">
                  {loading ? "…" : filteredDue.length}
                </span>
                <span className="pb-1 text-sm text-white/80">cards ready</span>
              </div>
              <p className="mb-5 text-sm text-white/85">
                Complete practice sessions in Kana, Kanji, Vocabulary, or Grammar to automatically populate your review deck.
              </p>
              <button
                type="button"
                disabled={loading || filteredDue.length === 0}
                onClick={startReview}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--surface)] text-sm font-bold text-[var(--primary)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              >
                Start Review <ArrowRight size={17} />
              </button>
            </aside>
          </div>
        )}

        {mode === "review" && currentItem && (
          <div className="flex w-full max-w-4xl flex-col items-center">
            <div className="mb-6 grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span>
                      Card {currentIndex + 1} / {queue.length}
                    </span>
                    <span className="rounded-full bg-[var(--sakura-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                      {direction === "recognition" ? "Recognition (JA → EN)" : "Recall (EN → JA)"}
                    </span>
                  </div>
                  <span className="text-[var(--muted)]">{reviewedCount} reviewed</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                    style={{ width: `${((currentIndex + (revealed ? 1 : 0)) / queue.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                  aria-pressed={autoPlayEnabled}
                  aria-label={autoPlayEnabled ? "Disable auto-play on reveal" : "Enable auto-play on reveal"}
                  title={autoPlayEnabled ? "Auto-play audio on reveal (Enabled)" : "Auto-play audio on reveal (Disabled)"}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-xs font-bold transition-colors cursor-pointer select-none ${
                    autoPlayEnabled
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)] dark:text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                  }`}
                >
                  {autoPlayEnabled ? (
                    <>
                      <Volume2 className="size-4 shrink-0 text-[var(--primary)] dark:text-[var(--primary-fg)]" aria-hidden="true" />
                      <span>Auto-play on</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="size-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                      <span>Auto-play off</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void refreshQueue();
                    setMode("dashboard");
                  }}
                  className="secondary-button min-h-11 rounded-md border px-4 py-2 text-sm font-bold"
                >
                  End review
                </button>
              </div>
            </div>

            {isCharacterCard ? (
              /* Character Card Layout (Kana & Kanji only) */
              <div
                className="grid w-full items-center gap-8 lg:grid-cols-2"
                data-testid="review-character-card-layout"
              >
                <div className="flex flex-col items-center">
                  <div className="kana-card-shell" key={currentItem.id}>
                    <div className="kana-card-stack" aria-hidden="true">
                      {[0, 1]
                        .slice(0, Math.min(2, Math.max(queue.length - currentIndex - 1, 0)))
                        .map((layer) => (
                          <div key={layer} className="paper-layer" />
                        ))}
                    </div>
                    <div className="kana-card">
                      <div className="absolute left-0 right-0 top-[10%] z-[1] flex justify-center gap-2 px-4">
                        <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold uppercase">
                          {currentItem.type}
                        </span>
                        {currentItem.level && (
                          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold">
                            {currentItem.level}
                          </span>
                        )}
                      </div>
                      <span
                        className={`break-words px-4 text-center ${
                          direction === "recall"
                            ? "text-2xl sm:text-3xl font-bold font-sans text-[var(--ink)]"
                            : "kana-card-glyph break-keep"
                        }`}
                      >
                        {direction === "recall"
                          ? (currentItem.reversePrompt || currentItem.answer)
                          : currentItem.prompt}
                      </span>
                      {direction === "recognition" && (
                        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5">
                          <AudioButton
                            mode={currentItem.type === "kana" ? "kana" : "reading"}
                            text={currentItem.prompt}
                            reading={currentItem.reading}
                            size="sm"
                            label={`Listen to ${currentItem.prompt}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
                  {!revealed ? (
                    <div className="flex flex-col items-center text-center">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {direction === "recall" ? `Recall Japanese ${currentItem.type}` : "Recall the answer"}
                      </p>
                      <p className="mb-6 text-sm text-[var(--muted)]">
                        {direction === "recall"
                          ? "Think of the Japanese character and reading, then flip the card to grade your recall."
                          : "Think of the reading and meaning, then flip the card to grade your recall."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setRevealed(true)}
                        className="primary-button flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-bold"
                      >
                        Show Answer
                      </button>
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        Press Space or Enter to reveal
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {direction === "recall" ? "Japanese Character" : "Answer"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-3xl font-bold font-japanese text-[var(--ink)]">
                          {direction === "recall" ? currentItem.prompt : currentItem.answer}
                        </p>
                        <AudioButton
                          mode={currentItem.type === "kana" ? "kana" : "reading"}
                          text={currentItem.prompt}
                          reading={currentItem.reading}
                          size="sm"
                          label={`Listen to ${currentItem.prompt}`}
                        />
                      </div>
                      {currentItem.reading && (
                        <p className="mt-1 font-japanese text-base text-[var(--muted)]">
                          {direction === "recall" ? "Reading: " : ""}{currentItem.reading}
                        </p>
                      )}
                      {direction === "recall" && (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Meaning: {currentItem.answer}
                        </p>
                      )}
                      {currentItem.reversePrompt && currentItem.reversePrompt !== currentItem.answer && (
                        <p className="mt-1 text-xs text-[var(--muted)] font-medium">
                          Nuance: <span className="text-[var(--ink)] font-normal">{currentItem.reversePrompt}</span>
                        </p>
                      )}

                      <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Grade your recall
                      </p>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => void handleGrade(Rating.Again)}
                          className="min-h-12 rounded-md border border-[var(--wrong)] bg-[var(--wrong)]/10 px-3 py-2 text-sm font-bold text-[var(--wrong)] transition-colors hover:bg-[var(--wrong)] hover:text-white"
                        >
                          Again
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleGrade(Rating.Hard)}
                          className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)]"
                        >
                          Hard
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleGrade(Rating.Good)}
                          className="min-h-12 rounded-md border border-[var(--correct)] bg-[var(--correct)]/15 px-3 py-2 text-sm font-bold text-[var(--correct)] transition-colors hover:bg-[var(--correct)] hover:text-white"
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleGrade(Rating.Easy)}
                          className="primary-button min-h-12 rounded-md px-3 py-2 text-sm font-bold"
                        >
                          Easy
                        </button>
                      </div>
                      <p className="mt-3 text-center text-xs text-[var(--muted)]">
                        Keys 1 (Again) · 2 (Hard) · 3 (Good) · 4 (Easy)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Wide Study Deck Layout (Vocabulary & Grammar) */
              <div
                key={currentItem.id}
                data-testid="review-wide-study-layout"
                className="w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8"
              >
                {/* Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold uppercase text-white">
                      {currentItem.type === "vocab" ? "Vocabulary" : "Grammar Pattern"}
                    </span>
                    {currentItem.level && (
                      <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        {currentItem.level}
                      </span>
                    )}
                    <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary-fg)]">
                      {direction === "recall" ? "Recall · EN → JA" : "Recognition · JA → EN"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    {currentItem.type === "vocab"
                      ? (direction === "recall" ? "English to Japanese Recall" : "Word & Meaning Recall")
                      : (direction === "recall" ? "Concept to Pattern Recall" : "Grammar Rule Recall")}
                  </span>
                </div>

                {/* Expandable Prompt Box */}
                <div className="my-6 rounded-xl border border-[var(--line)] bg-[var(--bg)]/65 px-5 py-8 text-center sm:px-8 sm:py-10">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {direction === "recall"
                      ? (currentItem.type === "vocab" ? "English Meaning / Prompt" : "Target Concept")
                      : (currentItem.type === "vocab" ? "Japanese Vocabulary" : "Target Grammar")}
                  </p>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p
                      lang={direction === "recall" ? "en" : "ja"}
                      className={`mx-auto max-w-2xl break-words font-bold leading-snug text-[var(--ink)] ${
                        direction === "recall" ? "font-sans" : "font-japanese"
                      } ${
                        (direction === "recall"
                          ? (currentItem.reversePrompt || currentItem.answer)
                          : currentItem.prompt
                        ).length > 25
                          ? "text-xl sm:text-2xl"
                          : (direction === "recall"
                              ? (currentItem.reversePrompt || currentItem.answer)
                              : currentItem.prompt
                            ).length > 14
                            ? "text-2xl sm:text-3xl"
                            : "text-3xl sm:text-4xl"
                      }`}
                    >
                      {direction === "recall"
                        ? (currentItem.reversePrompt || currentItem.answer)
                        : currentItem.prompt}
                    </p>
                    {direction === "recognition" && (
                      <AudioButton
                        mode={currentItem.type === "vocab" ? "vocab" : "sentence"}
                        text={currentItem.prompt}
                        reading={currentItem.reading}
                        size="sm"
                        label={`Listen to ${currentItem.prompt}`}
                      />
                    )}
                  </div>
                  {direction !== "recall" && revealed && currentItem.reading && (
                    <p
                      lang="ja"
                      className="font-japanese mt-3 text-base font-medium text-[var(--primary-fg)] sm:text-lg"
                    >
                      {currentItem.reading}
                    </p>
                  )}
                </div>

                {/* Action / Answer Reveal Section */}
                {!revealed ? (
                  <div className="flex flex-col items-center text-center">
                    <p className="mb-4 text-sm text-[var(--muted)]">
                      {direction === "recall"
                        ? (currentItem.type === "vocab"
                            ? "Recall the Japanese word and reading for this English meaning, then reveal the answer."
                            : "Recall the Japanese grammar pattern for this concept, then reveal the answer.")
                        : (currentItem.type === "vocab"
                            ? "Recall the reading and English meaning of this word, then reveal the answer."
                            : "Recall the meaning and usage of this grammar pattern, then reveal the answer.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="primary-button flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-md text-sm font-bold"
                    >
                      Show Answer
                    </button>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      Press Space or Enter to reveal
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-[var(--line)] pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                          {direction === "recall"
                            ? (currentItem.type === "vocab" ? "Japanese Word & Reading" : "Japanese Pattern")
                            : (currentItem.type === "vocab" ? "Meaning" : "Explanation")}
                        </p>
                        {direction === "recall" ? (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <p lang="ja" className="font-japanese text-3xl font-bold text-[var(--ink)]">
                                {currentItem.prompt}
                              </p>
                              <AudioButton
                                mode={currentItem.type === "vocab" ? "vocab" : "sentence"}
                                text={currentItem.prompt}
                                reading={currentItem.reading}
                                size="sm"
                                label={`Listen to ${currentItem.prompt}`}
                              />
                            </div>
                            {currentItem.reading && (
                              <p lang="ja" className="font-japanese text-base font-medium text-[var(--primary-fg)]">
                                {currentItem.reading}
                              </p>
                            )}
                            <p className="text-sm text-[var(--muted)]">
                              Meaning: <span className="text-[var(--ink)] font-medium">{currentItem.answer}</span>
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-xl font-bold leading-relaxed text-[var(--ink)] sm:text-2xl">
                                {currentItem.answer}
                              </p>
                              <AudioButton
                                mode={currentItem.type === "vocab" ? "vocab" : "sentence"}
                                text={currentItem.prompt}
                                reading={currentItem.reading}
                                size="sm"
                                label={`Listen to ${currentItem.prompt}`}
                              />
                            </div>
                            {currentItem.reversePrompt && currentItem.reversePrompt !== currentItem.answer && (
                              <p className="mt-1 text-xs text-[var(--muted)] font-medium">
                                Disambiguation: <span className="text-[var(--ink)] font-normal">{currentItem.reversePrompt}</span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {grammarRefHref && (
                        <Link
                          href={grammarRefHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--sakura-light)] px-3.5 py-1.5 text-xs font-bold text-[var(--primary-fg)] transition hover:bg-[var(--primary)] hover:text-white"
                        >
                          <BookOpen className="size-3.5" />
                          <span>Open Grammar Guide</span>
                        </Link>
                      )}
                    </div>

                    <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                      Grade your recall
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => void handleGrade(Rating.Again)}
                        className="min-h-12 rounded-md border border-[var(--wrong)] bg-[var(--wrong)]/10 px-3 py-2 text-sm font-bold text-[var(--wrong)] transition-colors hover:bg-[var(--wrong)] hover:text-white"
                      >
                        Again
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGrade(Rating.Hard)}
                        className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)]"
                      >
                        Hard
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGrade(Rating.Good)}
                        className="min-h-12 rounded-md border border-[var(--correct)] bg-[var(--correct)]/15 px-3 py-2 text-sm font-bold text-[var(--correct)] transition-colors hover:bg-[var(--correct)] hover:text-white"
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGrade(Rating.Easy)}
                        className="primary-button min-h-12 rounded-md px-3 py-2 text-sm font-bold"
                      >
                        Easy
                      </button>
                    </div>
                    <p className="mt-3 text-center text-xs text-[var(--muted)]">
                      Keys 1 (Again) · 2 (Hard) · 3 (Good) · 4 (Easy)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "complete" && (
          <div className="mx-auto w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[0_18px_50px_rgba(188,0,45,0.055)]">
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[var(--correct)]/15 text-[var(--correct)]">
              <CheckCircle2 size={28} />
            </span>
            <h1 className="text-2xl font-bold">Review session complete</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              You graded <strong>{reviewedCount}</strong> {reviewedCount === 1 ? "card" : "cards"}. Next intervals have been scheduled by FSRS.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setMode("dashboard")}
                className="primary-button flex min-h-11 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold"
              >
                <RotateCcw size={16} /> Back to Review Hub
              </button>
              <Link
                href="/"
                className="secondary-button flex min-h-11 items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-bold"
              >
                All Games
              </Link>
            </div>
          </div>
        )}
      </section>
    </GameLayout>
  );
}
