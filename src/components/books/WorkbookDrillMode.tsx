"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Keyboard,
  RotateCcw,
  Table2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { type BookPracticeItem, type BookPracticeSection } from "@/data/books";
import { AudioButton } from "@/components/ui/AudioButton";
import { playGameSfx } from "@/lib/game-core/sfx";
import { romajiToHiragana } from "@/engine/shiritori";
import { CharacterDiffView } from "@/components/books/CharacterDiffView";

interface FlattenedWorkbookItem {
  item: BookPracticeItem;
  section: BookPracticeSection;
}

interface WorkbookDrillModeProps {
  sections: BookPracticeSection[];
  autoEnqueueMissed: boolean;
  onMissedItem: (item: BookPracticeItem, section: BookPracticeSection) => Promise<void>;
  onClose: () => void;
  initialRomajiIme?: boolean;
}

export function WorkbookDrillMode({
  sections,
  autoEnqueueMissed,
  onMissedItem,
  onClose,
  initialRomajiIme = true,
}: WorkbookDrillModeProps) {
  const flatItems: FlattenedWorkbookItem[] = useMemo(() => {
    const list: FlattenedWorkbookItem[] = [];
    for (const sec of sections) {
      for (const item of sec.items) {
        list.push({ item, section: sec });
      }
    }
    return list;
  }, [sections]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = useState<Record<string, "correct" | "incorrect">>({});
  const [queuedFSRS, setQueuedFSRS] = useState<Record<string, boolean>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRefTable, setShowRefTable] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Phase 4: Romaji IME & Retry Missed States
  const [romajiIme, setRomajiIme] = useState(initialRomajiIme);
  const [retryMissedOnly, setRetryMissedOnly] = useState(false);
  const [missedItemIds, setMissedItemIds] = useState<Set<string>>(new Set());

  const activeItems: FlattenedWorkbookItem[] = useMemo(() => {
    if (!retryMissedOnly) return flatItems;
    return flatItems.filter((fi) => missedItemIds.has(fi.item.id));
  }, [flatItems, retryMissedOnly, missedItemIds]);

  const current = activeItems[currentIdx];

  const handleInputChange = (raw: string) => {
    const val = romajiIme ? romajiToHiragana(raw) : raw;
    setInputVal(val);
  };

  const handleCheck = async () => {
    if (!current) return;
    const effectiveVal = romajiIme ? romajiToHiragana(inputVal, true) : inputVal;
    if (effectiveVal !== inputVal) {
      setInputVal(effectiveVal);
    }
    if (!effectiveVal.trim()) return;

    const normalize = (s: string) =>
      s
        .replace(/[。、\s\t\n・！？!?()（）~〜]/g, "")
        .toLowerCase()
        .trim();

    const isMatch =
      normalize(effectiveVal) === normalize(current.item.answer) ||
      current.item.answer
        .split(/[／/]/)
        .some((alt) => normalize(effectiveVal) === normalize(alt));

    setResults((prev) => ({
      ...prev,
      [current.item.id]: isMatch ? "correct" : "incorrect",
    }));

    if (isMatch) {
      playGameSfx("correct-chime");
    } else {
      playGameSfx("incorrect-chime");
      setShowAnswer(true);
      if (autoEnqueueMissed && !queuedFSRS[current.item.id]) {
        await onMissedItem(current.item, current.section);
        setQueuedFSRS((prev) => ({ ...prev, [current.item.id]: true }));
      }
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= activeItems.length) {
      setIsDone(true);
      playGameSfx("victory-fanfare");
      return;
    }
    setCurrentIdx((i) => i + 1);
    setInputVal("");
    setShowAnswer(false);
  };

  const handlePrev = () => {
    if (currentIdx <= 0) return;
    setCurrentIdx((i) => i - 1);
    setInputVal("");
    setShowAnswer(false);
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setInputVal("");
    setResults({});
    setShowAnswer(false);
    setIsDone(false);
    setRetryMissedOnly(false);
    setMissedItemIds(new Set());
  };

  const handleRetryMissedOnly = () => {
    const missedIds = new Set(
      Object.entries(results)
        .filter(([_, status]) => status === "incorrect")
        .map(([id]) => id)
    );
    if (missedIds.size === 0) return;
    setMissedItemIds(missedIds);
    setRetryMissedOnly(true);
    setCurrentIdx(0);
    setInputVal("");
    setShowAnswer(false);
    setIsDone(false);
    setResults((prev) => {
      const next = { ...prev };
      for (const id of missedIds) {
        delete next[id];
      }
      return next;
    });
  };

  const handleResetToAll = () => {
    setRetryMissedOnly(false);
    setMissedItemIds(new Set());
    setCurrentIdx(0);
    setInputVal("");
    setShowAnswer(false);
    setIsDone(false);
  };

  const correctCount = Object.values(results).filter((r) => r === "correct").length;
  const incorrectCount = Object.values(results).filter((r) => r === "incorrect").length;
  const queuedCount = Object.keys(queuedFSRS).length;

  if (activeItems.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center space-y-3">
        <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
        <h4 className="text-sm font-bold text-[var(--ink)]">No items to drill</h4>
        <button
          onClick={handleResetToAll}
          className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white"
        >
          View All Items
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-[var(--primary)]/30 bg-[var(--surface)] shadow-md overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-[var(--line)] bg-[var(--sakura-light)]/25 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-2xs">
            <Zap size={16} />
          </span>
          <div>
            <h4 className="text-sm font-black text-[var(--ink)]">
              Interactive Workbook Drill Engine
            </h4>
            <p className="text-[11px] text-[var(--muted)]">
              Auto-graded workbook prompts · Missed items automatically queue into FSRS spaced repetition.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Romaji IME Toggle */}
          <button
            onClick={() => setRomajiIme((p) => !p)}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors ${
              romajiIme
                ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
            title="Convert typed Romaji to Hiragana automatically"
          >
            <Keyboard size={13} />
            <span>{romajiIme ? "Romaji IME: ON" : "Romaji IME: OFF"}</span>
          </button>

          {/* Retry Missed filter in Header */}
          {!isDone && incorrectCount > 0 && !retryMissedOnly && (
            <button
              onClick={handleRetryMissedOnly}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
              title="Focus drill exclusively on missed items"
            >
              <Filter size={13} />
              <span>Retry Missed ({incorrectCount})</span>
            </button>
          )}

          {retryMissedOnly && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                Missed Drill ({activeItems.length})
              </span>
              <button
                onClick={handleResetToAll}
                className="text-[11px] font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
              >
                All Items
              </button>
            </div>
          )}

          <span className="text-xs font-bold text-[var(--muted)]">
            {currentIdx + 1} / {activeItems.length}
          </span>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <X size={14} />
            <span>Exit Drill</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[var(--line)]">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-300"
          style={{
            width: `${
              isDone ? 100 : ((currentIdx + 1) / Math.max(activeItems.length, 1)) * 100
            }%`,
          }}
        />
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {isDone ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
            <CheckCircle2 size={34} className="mx-auto text-emerald-600" />
            <h5 className="text-base font-black text-[var(--ink)]">
              Workbook Drill Complete!
            </h5>
            <p className="text-xs text-[var(--muted)]">
              Scored <strong>{correctCount}</strong> correct and{" "}
              <strong>{incorrectCount}</strong> missed
              {queuedCount > 0
                ? ` (${queuedCount} missed item${queuedCount > 1 ? "s" : ""} queued in FSRS for spaced review).`
                : "."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <RotateCcw size={14} />
                <span>Restart Full Drill</span>
              </button>
              {incorrectCount > 0 && (
                <button
                  onClick={handleRetryMissedOnly}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                >
                  <Filter size={14} />
                  <span>Retry Missed Items Only ({incorrectCount})</span>
                </button>
              )}
            </div>
          </div>
        ) : current ? (
          <div className="space-y-4">
            {/* Section Context & Reference Table Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[var(--primary)] px-2.5 py-0.5 text-xs font-black text-white">
                  Part {current.section.part}
                  {current.section.section ? ` · Sec ${current.section.section}` : ""}
                </span>
                <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                  {current.section.title}
                </span>
                {current.section.grammarIndex && (
                  <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    Grammar {current.section.grammarIndex}
                  </span>
                )}
              </div>

              {current.section.referenceTable && (
                <button
                  onClick={() => setShowRefTable((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-3 py-1 text-xs font-bold text-[var(--ink)]"
                >
                  <Table2 size={13} />
                  <span>{showRefTable ? "Hide Chart" : "View Reference Chart"}</span>
                </button>
              )}
            </div>

            {current.section.subTitle && (
              <p className="text-xs font-medium text-[var(--muted)]">
                {current.section.subTitle}
              </p>
            )}

            {showRefTable && current.section.referenceTable && (
              <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-overlay)] border-b border-[var(--line)]">
                    <tr>
                      {current.section.referenceTable.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 font-bold text-[var(--ink)] font-japanese">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {current.section.referenceTable.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 font-japanese text-[var(--ink)]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Prompt Card */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-overlay)]/30 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-japanese text-lg font-black text-[var(--ink)]">
                    {current.item.prompt}
                  </span>
                  {current.item.cue && (
                    <span className="rounded-lg bg-[var(--surface)] border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                      {current.item.cue}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowAnswer((p) => !p)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)] hover:underline"
                >
                  {showAnswer ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showAnswer ? "Hide Answer" : "Show Answer"}</span>
                </button>
              </div>

              {/* Input & Check */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="text"
                    placeholder={
                      romajiIme
                        ? "Type Japanese response & press Enter (or romaji)..."
                        : "Type Japanese response & press Enter..."
                    }
                    value={inputVal}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        void handleCheck();
                      }
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2 text-sm font-japanese text-[var(--ink)] focus:outline-hidden ${
                      results[current.item.id] === "correct"
                        ? "border-emerald-500 bg-emerald-500/5"
                        : results[current.item.id] === "incorrect"
                        ? "border-rose-500 bg-rose-500/5"
                        : "border-[var(--line)] bg-[var(--surface)] focus:border-[var(--primary)]"
                    }`}
                  />
                  {romajiIme && !results[current.item.id] && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-[var(--surface-overlay)] border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                      かな
                    </span>
                  )}
                  {results[current.item.id] && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {results[current.item.id] === "correct" ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-rose-500" />
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void handleCheck()}
                  disabled={!inputVal.trim()}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
                >
                  Check
                </button>
              </div>

              {/* FSRS Missed Notice */}
              {queuedFSRS[current.item.id] && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Zap size={13} />
                  <span>Missed item added to FSRS review schedule!</span>
                </div>
              )}

              {/* Character-Level Diff Breakdown on Missed Items */}
              {results[current.item.id] === "incorrect" && (
                <CharacterDiffView
                  userInput={inputVal}
                  expectedAnswer={current.item.answer}
                />
              )}

              {/* Revealed Model Answer */}
              {((showAnswer && results[current.item.id] !== "incorrect") ||
                results[current.item.id] === "correct") && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Model Answer
                    </span>
                    <p className="font-japanese text-sm font-bold text-[var(--ink)]">
                      {current.item.answer}
                    </p>
                  </div>
                  <AudioButton
                    text={current.item.answer}
                    mode="sentence"
                    size="sm"
                    label="Listen to model answer"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ink)] px-4 py-2 text-xs font-bold text-[var(--surface)]"
              >
                <span>{currentIdx + 1 >= activeItems.length ? "Finish Drill" : "Next Item"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
