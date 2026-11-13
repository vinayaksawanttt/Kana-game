"use client";

import { useMemo, useState } from "react";
import { Check, Info, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { kanjiLevels, type KanjiLevel, type KanjiRecord } from "@/data/kanji";
import { useRadicalExplorer } from "@/hooks/useRadicalExplorer";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

export interface RadicalBuilderViewProps {
  onSelectKanji: (kanji: KanjiRecord) => void;
}

function getPrimaryReading(kanji: KanjiRecord): string {
  if (kanji.on.length > 0) return kanji.on[0];
  if (kanji.kun.length > 0) return kanji.kun[0];
  return "—";
}

function capitalizeWords(text: string): string {
  if (!text) return "";
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(", ");
}

export function RadicalBuilderView({ onSelectKanji }: RadicalBuilderViewProps) {
  const {
    radicals,
    selectedRadicals,
    selectedRadicalRecords,
    kanjiForRadical,
    activeJlptFilters,
    toggleJlptFilter,
    toggleRadical,
    clearSelectedRadicals,
    loading,
    error,
  } = useRadicalExplorer();

  const [radicalSearch, setRadicalSearch] = useState("");
  const [kanjiSearch, setKanjiSearch] = useState("");

  // Filter radical list by character, meaning, or reading
  const filteredRadicals = useMemo(() => {
    const q = radicalSearch.trim().toLowerCase();
    if (!q) return radicals;
    return radicals.filter(
      (r) =>
        r.character.includes(q) ||
        r.meaning.toLowerCase().includes(q) ||
        r.reading.includes(q)
    );
  }, [radicals, radicalSearch]);

  // Filter matching kanji by search query (character or meaning)
  const filteredKanji = useMemo(() => {
    const q = kanjiSearch.trim().toLowerCase();
    if (!q) return kanjiForRadical;
    return kanjiForRadical.filter(
      (k) =>
        k.c.includes(q) ||
        k.meanings.some((m) => m.toLowerCase().includes(q)) ||
        k.on.some((r) => r.includes(q)) ||
        k.kun.some((r) => r.includes(q))
    );
  }, [kanjiForRadical, kanjiSearch]);

  // Check if any matching kanji is a direct compound match for the selected radicals
  const directCompound = useMemo(() => {
    if (selectedRadicals.length < 2) return null;
    // Look for a kanji with fewest strokes among the intersection, or matching one of the combinations
    return (
      filteredKanji.find((k) =>
        k.meanings.length > 0 && selectedRadicals.includes(k.c)
      ) ||
      filteredKanji[0] ||
      null
    );
  }, [filteredKanji, selectedRadicals]);

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12">
        <SakuraLoader label="Loading Radical Components..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--wrong)]/30 bg-[var(--surface)] p-6 text-center text-sm font-semibold text-[var(--wrong)]">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. JLPT Level Filter Bar */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Matching Kanji Filter
            </span>
            <h2 className="text-sm font-bold text-[var(--ink)]">Filter by JLPT Level</h2>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter kanji by JLPT level"
          >
            {kanjiLevels.map((level) => {
              const active = activeJlptFilters.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleJlptFilter(level)}
                  className={`min-h-9 rounded-full border px-3.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                      : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Radical Combination Formula Bar ("The Chemistry Tray") */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)]/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary)]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
              Radical Combination Formula
            </h2>
          </div>

          {selectedRadicals.length > 0 && (
            <button
              type="button"
              onClick={clearSelectedRadicals}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset formula</span>
            </button>
          )}
        </div>

        {selectedRadicalRecords.length === 0 ? (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-xs font-medium text-[var(--muted)]">
            <Info size={16} className="shrink-0 text-[var(--primary)]" />
            <span>
              Click 1 or more radicals from the chart below to combine them and reveal matching kanji
              compounds (e.g. <strong>囗</strong> enclosure + <strong>大</strong> big ={" "}
              <strong className="text-[var(--primary)]">因</strong>).
            </span>
          </div>
        ) : (
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            {selectedRadicalRecords.map((rad, idx) => (
              <div key={rad.character} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-lg font-black text-[var(--muted)] select-none">+</span>
                )}
                <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--primary)]/50 bg-[var(--sakura-light)]/80 py-1.5 pr-2.5 pl-3 shadow-xs">
                  <span lang="ja" className="font-japanese text-xl font-bold text-[var(--primary)]">
                    {rad.character}
                  </span>
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {capitalizeWords(rad.meaning)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove radical ${rad.character}`}
                    onClick={() => toggleRadical(rad.character)}
                    className="grid size-5 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              </div>
            ))}

            <span className="text-lg font-black text-[var(--muted)] select-none">=</span>

            <span className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--ink)] shadow-2xs">
              {filteredKanji.length} matching kanji
            </span>
          </div>
        )}

        {/* Direct Compound Highlight Banner */}
        {directCompound && selectedRadicals.length >= 2 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[var(--primary)]/40 bg-[var(--sakura-light)]/40 p-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <span
                lang="ja"
                className="font-kanji grid size-14 place-items-center rounded-xl border-2 border-[var(--primary)]/40 bg-[var(--surface)] text-3xl font-bold text-[var(--ink)] shadow-xs"
              >
                {directCompound.c}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Direct Compound Match
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                    JLPT N{directCompound.jlpt}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-[var(--ink)]">
                  {directCompound.meanings.join(", ")}
                </p>
                <p lang="ja" className="font-japanese text-xs text-[var(--muted)]">
                  Reading: <span className="font-bold text-[var(--primary-fg)]">{getPrimaryReading(directCompound)}</span>
                  <span className="ml-2 text-[10px] text-[var(--muted)]">
                    (Formed by combining {selectedRadicals.join(" + ")})
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectKanji(directCompound)}
              className="min-h-10 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              Inspect Details
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,1.15fr)_minmax(300px,1fr)] lg:items-start">
        {/* Left Column: Radical Components Chart */}
        <section
          aria-label="Radical components chart"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
        >
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)]/60 pb-3">
            <div>
              <h3 className="font-extrabold text-[var(--ink)]">Radical Components</h3>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {filteredRadicals.length} {filteredRadicals.length === 1 ? "radical" : "radicals"} available
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[var(--muted)]">
              Click to combine
            </span>
          </div>

          {/* Search bar inside radicals */}
          <div className="relative mb-3.5">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              value={radicalSearch}
              onChange={(e) => setRadicalSearch(e.target.value)}
              placeholder="Search radical by name or glyph (mouth, 口, tree, 木)..."
              aria-label="Search radicals"
              className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] pr-3 pl-9 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          {/* Scrollable Radicals Grid */}
          <div className="grid max-h-[62dvh] grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2 overflow-y-auto pr-1">
            {filteredRadicals.map((radical) => {
              const isSelected = selectedRadicals.includes(radical.character);
              const formattedName = capitalizeWords(radical.meaning);

              return (
                <button
                  key={radical.character}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleRadical(radical.character)}
                  title={`${radical.character}: ${formattedName} · ${radical.kanjiCount} kanji`}
                  className={`group relative flex min-h-[78px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs scale-98"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/40 hover:-translate-y-0.5"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-white text-[var(--primary)]">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                  <span lang="ja" className="font-japanese text-2xl font-bold leading-none">
                    {radical.character}
                  </span>
                  <span
                    className={`mt-1 line-clamp-2 max-w-full text-[10px] font-medium leading-tight ${
                      isSelected ? "text-white/90" : "text-[var(--muted)] group-hover:text-[var(--ink)]"
                    }`}
                  >
                    {formattedName}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Column: Matching Kanji Compounds */}
        <section
          aria-label="Matching kanji compounds"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
        >
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)]/60 pb-3">
            <div>
              <h3 className="font-extrabold text-[var(--ink)]">Matching Kanji Compounds</h3>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {filteredKanji.length} kanji found in selected JLPT levels
              </p>
            </div>
            <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
              {filteredKanji.length}
            </span>
          </div>

          {/* Search bar inside matching kanji */}
          {kanjiForRadical.length > 8 && (
            <div className="relative mb-3.5">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="search"
                value={kanjiSearch}
                onChange={(e) => setKanjiSearch(e.target.value)}
                placeholder="Filter matching kanji..."
                aria-label="Filter matching kanji"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] pr-3 pl-9 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          )}

          {/* Kanji Cards Grid */}
          {filteredKanji.length > 0 ? (
            <div className="grid max-h-[62dvh] grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2.5 overflow-y-auto pr-1">
              {filteredKanji.map((kanji) => (
                <button
                  key={kanji.c}
                  type="button"
                  onClick={() => onSelectKanji(kanji)}
                  aria-label={`${kanji.c}, ${getPrimaryReading(kanji)}, ${kanji.label}`}
                  title={`${kanji.c} (${getPrimaryReading(kanji)}) — ${kanji.label}${
                    selectedRadicals.length > 0 ? ` · Contains: ${selectedRadicals.join(" + ")}` : ""
                  }. Click to inspect stroke order & radicals.`}
                  className="group relative flex aspect-square flex-col items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-2 text-center transition-all duration-150 hover:-translate-y-1 hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/40 hover:shadow-sm cursor-pointer"
                >
                  <span
                    lang="ja"
                    className="font-japanese w-full truncate text-[10px] font-bold text-[var(--primary-fg)]"
                  >
                    {getPrimaryReading(kanji)}
                  </span>

                  <span
                    lang="ja"
                    className="font-kanji text-3xl leading-none text-[var(--ink)] transition-transform group-hover:scale-105"
                  >
                    {kanji.c}
                  </span>

                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="truncate text-[9px] font-medium text-[var(--muted)] group-hover:text-[var(--ink)]">
                      {kanji.meanings[0] ?? kanji.label}
                    </span>
                    <span className="shrink-0 rounded bg-[var(--line)]/60 px-1 text-[8px] font-extrabold text-[var(--muted)]">
                      N{kanji.jlpt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-[var(--muted)]">
                {selectedRadicals.length === 0
                  ? "Select one or more radicals from the chart to view matching kanji."
                  : activeJlptFilters.length === 0
                    ? "Select at least one JLPT level to see matching kanji."
                    : "No kanji match this combination in the selected JLPT levels."}
              </p>
              {selectedRadicals.length > 0 && activeJlptFilters.length < kanjiLevels.length && (
                <button
                  type="button"
                  onClick={() => {
                    for (const lvl of kanjiLevels) {
                      if (!activeJlptFilters.includes(lvl)) toggleJlptFilter(lvl);
                    }
                  }}
                  className="mt-3 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Enable all JLPT levels
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
