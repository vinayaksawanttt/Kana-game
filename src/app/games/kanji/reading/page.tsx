"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getKanjiByLevel,
  type KanjiLevel,
  kanjiLevels,
  type KanjiRecord,
} from "@/data/kanji";
import { KanjiBreakdownModal } from "@/components/kanji/KanjiBreakdownModal";

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
  const [selectedLevel, setSelectedLevel] = useState<KanjiLevel>("N5");
  const [recordsByLevel, setRecordsByLevel] = useState<
    Partial<Record<KanjiLevel, KanjiRecord[]>>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKanji, setActiveKanji] = useState<KanjiRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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
  }, [recordsByLevel, selectedLevel]);

  const currentRecords = useMemo(
    () => recordsByLevel[selectedLevel] ?? [],
    [recordsByLevel, selectedLevel]
  );

  const isLoading = !recordsByLevel[selectedLevel] && !errorMessage;

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

  return (
    <GameLayout label="KANJI READING HUB" glyph="読">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
        <header className="py-6 sm:py-8">
          <p className="text-xs font-bold tracking-[0.18em] text-[var(--primary-fg)] uppercase">
            Readings · Strokes · Playground
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Kanji Reading Hub</h1>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                Browse JLPT kanji grouped by school grade. Select any character to inspect its
                readings or practice writing in the interactive playground.
              </p>
            </div>
          </div>

          {/* Top Navigation: JLPT Tabs + Search */}
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
                    className={`min-h-10 min-w-14 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
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
                placeholder={`Filter ${selectedLevel} kanji, reading, meaning...`}
                aria-label="Filter kanji"
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-[var(--wrong)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--wrong)]">
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
                aria-label={formatGradeTitle(grade)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h2 className="text-sm font-extrabold tracking-[0.12em] text-[var(--ink)] uppercase">
                    {formatGradeTitle(grade)}
                  </h2>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)] tabular-nums">
                    {items.length} {items.length === 1 ? "kanji" : "kanji"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {items.map((kanji) => (
                    <button
                      key={kanji.c}
                      type="button"
                      onClick={() => setActiveKanji(kanji)}
                      aria-label={`${kanji.c}, ${getPrimaryReading(kanji)}, ${kanji.label}`}
                      className="group flex aspect-square flex-col items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-center transition duration-150 hover:-translate-y-0.5 hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/50 hover:shadow-md"
                    >
                      <span
                        lang="ja"
                        className="font-japanese w-full truncate text-[11px] font-bold text-[var(--primary-fg)]"
                      >
                        {getPrimaryReading(kanji)}
                      </span>

                      <span
                        lang="ja"
                        className="font-kanji text-4xl leading-none text-[var(--ink)] transition-transform group-hover:scale-105"
                      >
                        {kanji.c}
                      </span>

                      <span className="w-full truncate text-[11px] font-medium text-[var(--muted)]">
                        {kanji.meanings[0] ?? kanji.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <KanjiBreakdownModal
          kanji={activeKanji}
          onClose={() => setActiveKanji(null)}
        />
      </main>
    </GameLayout>
  );
}

