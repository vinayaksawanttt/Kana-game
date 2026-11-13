"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getKanjiByLevel,
  type KanjiLevel,
  kanjiLevels,
  type KanjiRecord,
} from "@/data/kanji";
import { KanjiBreakdownModal } from "@/components/kanji/KanjiBreakdownModal";
import { RadicalBuilderView } from "@/components/kanji/RadicalBuilderView";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

function getPrimaryReading(kanji: KanjiRecord): string {
  if (kanji.on.length > 0) return kanji.on[0];
  if (kanji.kun.length > 0) return kanji.kun[0];
  return "—";
}

function formatGradeTitle(grade: number): string {
  if (grade === 8) return "Secondary School (Grade 8)";
  if (grade === 9) return "Jinmeiyō / Extra (Grade 9)";
  return `Grade ${grade}`;
}

export default function KanjiReadingHubPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Loading Kanji & Radical Studio..." size="md" />
        </main>
      }
    >
      <KanjiReadingContent />
    </Suspense>
  );
}

function KanjiReadingContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams?.get("view") === "radicals" ? "radicals" : "sheet";
  const [viewMode, setViewMode] = useState<"sheet" | "radicals">(initialView);

  const [selectedLevel, setSelectedLevel] = useState<KanjiLevel>("N5");
  const [recordsByLevel, setRecordsByLevel] = useState<
    Partial<Record<KanjiLevel, KanjiRecord[]>>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKanji, setActiveKanji] = useState<KanjiRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (viewMode !== "sheet") return;
    if (recordsByLevel[selectedLevel]) return;

    let cancelled = false;
    void getKanjiByLevel(selectedLevel)
      .then((records) => {
        if (!cancelled && typeof window !== "undefined") {
          setRecordsByLevel((prev) => ({
            ...prev,
            [selectedLevel]: records,
          }));
        }
      })
      .catch(() => {
        if (!cancelled && typeof window !== "undefined") {
          setErrorMessage(`Failed to load ${selectedLevel} kanji dataset.`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recordsByLevel, selectedLevel, viewMode]);

  const currentRecords = useMemo(
    () => recordsByLevel[selectedLevel] ?? [],
    [recordsByLevel, selectedLevel]
  );

  const isLoading = viewMode === "sheet" && !recordsByLevel[selectedLevel] && !errorMessage;

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentRecords;
    return currentRecords.filter(
      (record) =>
        record.c.includes(q) ||
        record.meanings.some((m) => m.toLowerCase().includes(q)) ||
        record.on.some((r) => r.includes(q)) ||
        record.kun.some((r) => r.includes(q))
    );
  }, [currentRecords, searchQuery]);

  const groupedByGrade = useMemo(() => {
    const groups = new Map<number, KanjiRecord[]>();
    for (const record of filteredRecords) {
      const list = groups.get(record.grade);
      if (list) {
        list.push(record);
      } else {
        groups.set(record.grade, [record]);
      }
    }
    return [...groups.entries()].sort(([a], [b]) => a - b);
  }, [filteredRecords]);

  function handleSwitchView(mode: "sheet" | "radicals") {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (mode === "radicals") {
        url.searchParams.set("view", "radicals");
      } else {
        url.searchParams.delete("view");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }

  return (
    <GameLayout label="KANJI READING HUB" glyph={viewMode === "sheet" ? "読" : "部"}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
        <header className="py-6 sm:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[var(--primary-fg)] uppercase">
                {viewMode === "sheet"
                  ? "Readings · Strokes · Playground"
                  : "Radical Components · Combinations"}
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                {viewMode === "sheet" ? "Kanji Reading Hub" : "Kanji Radical Builder"}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
                {viewMode === "sheet"
                  ? "Browse JLPT kanji grouped by school grade. Select any character to inspect its readings or practice writing in the interactive playground."
                  : "Explore kanji through their constituent radicals. Combine 2 or more radicals to discover matching compounds (e.g. 囗 enclosure + 大 big = 因)."}
              </p>
            </div>

            {/* View Mode Segmented Switch */}
            <div
              role="tablist"
              aria-label="Kanji study view"
              className="inline-flex rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "sheet"}
                onClick={() => handleSwitchView("sheet")}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "sheet"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span lang="ja" className="font-japanese text-sm font-bold">漢</span>
                <span>Kanji Sheet</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "radicals"}
                onClick={() => handleSwitchView("radicals")}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "radicals"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <span lang="ja" className="font-japanese text-sm font-bold">部</span>
                <span>Radical Builder</span>
              </button>
            </div>
          </div>

          {/* Top Navigation for Kanji Sheet Mode: JLPT Tabs + Search */}
          {viewMode === "sheet" && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="tablist"
                aria-label="JLPT Level Filter"
                className="inline-flex flex-wrap gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-sm"
              >
                {kanjiLevels.map((level) => {
                  const active = selectedLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedLevel(level)}
                      className={`min-h-10 min-w-14 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${selectedLevel} kanji, reading, meaning...`}
                  aria-label="Filter kanji"
                  className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pr-9 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grade Quick Jump Bar in Sheet Mode */}
          {viewMode === "sheet" && groupedByGrade.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="shrink-0 font-bold uppercase tracking-wider text-[var(--muted)] text-[10px] mr-1">
                Jump to:
              </span>
              {groupedByGrade.map(([grade, items]) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`grade-section-${grade}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-semibold text-[var(--ink)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
                >
                  {formatGradeTitle(grade)} ({items.length})
                </button>
              ))}
            </div>
          )}
        </header>

        {viewMode === "sheet" ? (
          <>
            {errorMessage && (
              <p
                role="alert"
                className="rounded-xl border border-[var(--wrong)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--wrong)]"
              >
                {errorMessage}
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {Array.from({ length: 16 }, (_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square animate-pulse rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                  />
                ))}
              </div>
            ) : groupedByGrade.length === 0 ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center">
                <p className="text-sm font-semibold text-[var(--muted)]">
                  No kanji match &ldquo;{searchQuery}&rdquo; in {selectedLevel}.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedByGrade.map(([grade, items]) => (
                  <section
                    key={grade}
                    id={`grade-section-${grade}`}
                    aria-label={formatGradeTitle(grade)}
                    className="scroll-mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                      <div>
                        <h2 className="text-sm font-extrabold tracking-[0.12em] text-[var(--ink)] uppercase">
                          {formatGradeTitle(grade)}
                        </h2>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {grade <= 6 ? "Elementary Jouyou Kanji" : "Junior High & Secondary Kanji"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                          JLPT {selectedLevel}
                        </span>
                        <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)] tabular-nums">
                          {items.length} kanji
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                      {items.map((kanji) => (
                        <button
                          key={kanji.c}
                          type="button"
                          onClick={() => setActiveKanji(kanji)}
                          aria-label={`${kanji.c}, ${getPrimaryReading(kanji)}, ${kanji.label}`}
                          className="group relative flex aspect-square flex-col items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-center transition-all duration-150 hover:-translate-y-1 hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/40 hover:shadow-md cursor-pointer"
                        >
                          <span
                            lang="ja"
                            className="font-japanese w-full truncate text-[11px] font-bold text-[var(--primary-fg)]"
                          >
                            {getPrimaryReading(kanji)}
                          </span>

                          <span
                            lang="ja"
                            className="font-kanji text-4xl sm:text-5xl leading-none text-[var(--ink)] transition-transform group-hover:scale-105"
                          >
                            {kanji.c}
                          </span>

                          <span className="w-full truncate text-[11px] font-medium text-[var(--muted)] group-hover:text-[var(--ink)]">
                            {kanji.meanings[0] ?? kanji.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : (
          <RadicalBuilderView onSelectKanji={(kanji) => setActiveKanji(kanji)} />
        )}

        <KanjiBreakdownModal
          kanji={activeKanji}
          onClose={() => setActiveKanji(null)}
        />
      </main>
    </GameLayout>
  );
}
