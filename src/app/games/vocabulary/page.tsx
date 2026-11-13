"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, RotateCcw, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  availableVocabularyGrades,
  filterVocabulary,
  loadVocabularyData,
  type VocabularyData,
  type VocabularyLevel,
  vocabularyLevels,
} from "@/data/vocabulary";
import { createVocabularySession, type VocabularySessionSize } from "@/lib/game/vocabulary";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

const gradeNames: Record<number, string> = {
  8: "Secondary (8)",
  9: "Names (9)",
};

interface SavedSetup {
  levels: VocabularyLevel[];
  grades: number[];
  size: VocabularySessionSize;
}

function isVocabularyLevel(value: unknown): value is VocabularyLevel {
  return vocabularyLevels.includes(value as VocabularyLevel);
}

function isSessionSize(value: unknown): value is VocabularySessionSize {
  return value === "all" || value === 10 || value === 20 || value === 30;
}

export default function VocabularySetupPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<VocabularyLevel[]>(["N5"]);
  const [grades, setGrades] = useState<number[]>([]);
  const [size, setSize] = useState<VocabularySessionSize>(10);
  const [data, setData] = useState<VocabularyData | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("vocabulary-last-setup") || "null"
      ) as Partial<SavedSetup> | null;
      if (saved) {
        if (Array.isArray(saved.levels) && saved.levels.every(isVocabularyLevel)) {
          setLevels(saved.levels);
        }
        if (
          Array.isArray(saved.grades) &&
          saved.grades.every((grade) => typeof grade === "number")
        ) {
          setGrades(saved.grades);
        }
        if (isSessionSize(saved.size)) setSize(saved.size);
      }
    } catch (loadError) {
      console.error("Could not read the saved vocabulary setup.", loadError);
      setError("Saved settings could not be loaded. Choose settings and continue.");
    }
    setReady(true);
    function onPageShow() {
      setStarting(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    let active = true;
    if (!levels.length) {
      setData(null);
      setLoading(false);
      setError("");
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setData(null);
    setError("");
    loadVocabularyData(levels)
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Could not load OpenJLPT vocabulary data.", loadError);
        setError("Vocabulary data could not be loaded. Check your connection and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [levels, reloadKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const eligible = useMemo(
    () => (data ? filterVocabulary(data.records, { levels, grades }, data.kanjiByCharacter) : []),
    [data, grades, levels]
  );
  const gradeOptions = useMemo(
    () => (data ? availableVocabularyGrades(data.kanjiByCharacter) : []),
    [data]
  );
  const gradeCounts = useMemo(() => {
    if (!data) return new Map<number, number>();
    return new Map(
      gradeOptions.map((grade) => [
        grade,
        filterVocabulary(data.records, { levels, grades: [grade] }, data.kanjiByCharacter).length,
      ])
    );
  }, [data, gradeOptions, levels]);

  const questionCount = size === "all" ? eligible.length : size;
  const canStart = Boolean(
    ready &&
      !loading &&
      levels.length &&
      eligible.length >= questionCount &&
      questionCount > 0 &&
      !starting
  );

  function toggleLevel(level: VocabularyLevel) {
    setLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : vocabularyLevels.filter((item) => current.includes(item) || item === level)
    );
  }

  function toggleGrade(grade: number) {
    setGrades((current) =>
      current.includes(grade)
        ? current.filter((item) => item !== grade)
        : [...current, grade].sort((a, b) => a - b)
    );
  }

  async function start() {
    if (!canStart || !data) return;
    setStarting(true);
    setError("");
    try {
      const session = createVocabularySession({ levels, grades, size }, data);
      saveGameSession("vocabulary", session.sessionId, session);
      localStorage.setItem("vocabulary-last-setup", JSON.stringify({ levels, grades, size }));
      setStarting(false);
      playGameSfx("temple-bell-gong");
      router.push(`/games/vocabulary/play/${session.sessionId}`);
    } catch (startError) {
      console.error("Could not start vocabulary practice.", startError);
      setError("A session could not be started with these settings.");
      setStarting(false);
    }
  }

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Setup..." size="md" />
      </main>
    );
  }

  const estimatedMinutes = Math.max(1, Math.round((questionCount * 12) / 60));

  return (
    <GameLayout label="VOCABULARY" glyph="語">
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                  Meaning mode
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl text-[var(--ink)]">Vocabulary Setup</h1>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Configure your target JLPT levels, kanji school grades, and practice session length.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLevels(["N5"]);
                  setGrades([]);
                  setSize(10);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            <div className="space-y-6">
              {/* 1. JLPT Level Selector */}
              <fieldset>
                <div className="mb-2.5 flex items-center justify-between">
                  <legend className="text-sm font-bold text-[var(--ink)]">JLPT Levels</legend>
                  <span className="text-xs text-[var(--muted)]">Select one or more</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vocabularyLevels.map((level) => {
                    const selected = levels.includes(level);
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleLevel(level)}
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/50"
                        }`}
                      >
                        {selected && <Check size={14} strokeWidth={3} className="shrink-0" />}
                        <span>{level}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* 2. Kanji School Grades Filter */}
              {gradeOptions.length > 0 && (
                <fieldset className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/40 p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div>
                      <legend className="text-sm font-bold text-[var(--ink)]">Kanji School Grades</legend>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        Optional filter — matches words containing kanji from these grades.
                      </p>
                    </div>
                    <div className="flex gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setGrades(gradeOptions)}
                        className="rounded-lg px-2.5 py-1 text-[var(--primary-fg)] hover:bg-[var(--sakura-light)] transition-colors cursor-pointer"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setGrades([])}
                        className="rounded-lg px-2.5 py-1 text-[var(--muted)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gradeOptions.map((grade) => {
                      const count = gradeCounts.get(grade) ?? 0;
                      const selected = grades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          disabled={!count}
                          aria-pressed={selected}
                          onClick={() => toggleGrade(grade)}
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                              : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/50"
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} className="shrink-0" />}
                          <span>{gradeNames[grade] ?? `Grade ${grade}`}</span>
                          <span className={`text-[11px] ${selected ? "text-white/80" : "text-[var(--muted)]"}`}>
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* 3. Session Length Selector */}
              <fieldset>
                <div className="mb-2.5 flex items-center justify-between">
                  <legend className="text-sm font-bold text-[var(--ink)]">Session Length</legend>
                  <span className="text-xs text-[var(--muted)]">Number of target questions</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {([10, 20, 30, "all"] as const).map((option) => {
                    const disabled =
                      option === "all" ? eligible.length === 0 : eligible.length < option;
                    const selected = size === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => setSize(option)}
                        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/50"
                        }`}
                      >
                        {selected && <Check size={14} strokeWidth={3} className="shrink-0" />}
                        <span>{option === "all" ? "All available" : `${option} Words`}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Right Sidebar: Selection Summary Card */}
          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                Selection Summary
              </p>
              <Sparkles size={16} className="text-[var(--primary)]" />
            </div>

            {/* Big Eligible Pool Stat */}
            <div className="my-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center">
              <span className="font-japanese block text-5xl font-bold leading-tight text-[var(--ink)]">
                {loading ? "…" : eligible.length}
              </span>
              <span className="mt-1 block text-xs font-semibold text-[var(--muted)]">
                eligible words
              </span>
            </div>

            {/* Stat Rows */}
            <div className="space-y-2.5 border-b border-[var(--line)] pb-4 text-xs">
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Target questions</span>
                <strong className="text-sm font-bold text-[var(--ink)]">
                  {loading ? "…" : questionCount}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Estimated duration</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink)]">
                  <Clock size={12} className="text-[var(--muted)]" /> ~{estimatedMinutes} min
                </span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Target levels</span>
                <div className="flex flex-wrap justify-end gap-1">
                  {levels.length > 0 ? (
                    levels.map((lvl) => (
                      <span key={lvl} className="rounded bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                        {lvl}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--wrong)]">None</span>
                  )}
                </div>
              </div>
              {grades.length > 0 && (
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>Target grades</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {grades.length} {grades.length === 1 ? "grade" : "grades"}
                  </span>
                </div>
              )}
            </div>

            {/* Error & Warning Messages */}
            <div className="my-3 min-h-[24px]">
              {!levels.length && (
                <p className="text-xs font-semibold text-[var(--wrong)]">
                  Select at least one JLPT level.
                </p>
              )}
              {levels.length > 0 && !loading && eligible.length < questionCount && (
                <p className="text-xs font-semibold text-[var(--wrong)]">
                  Choose a smaller session length or widen your selection.
                </p>
              )}
              {loading && (
                <p role="status" className="text-xs font-semibold text-[var(--muted)]">
                  Loading vocabulary…
                </p>
              )}
              {error && (
                <p role="alert" className="text-xs font-semibold text-[var(--wrong)]">
                  {error}
                </p>
              )}
              {error.includes("Vocabulary data could not be loaded") && (
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="mt-1 text-xs font-bold text-[var(--primary)] underline cursor-pointer"
                >
                  Retry loading
                </button>
              )}
            </div>

            {/* Start Button */}
            <button
              type="button"
              disabled={!canStart}
              onClick={start}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              <span>{starting ? "Starting…" : "Start Practice"}</span>
              <ArrowRight size={18} />
            </button>
          </aside>
        </div>
      </section>
    </GameLayout>
  );
}
