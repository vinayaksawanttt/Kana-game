"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { createKanjiMeaningSession } from "@/lib/game/kanji-meaning";
import { saveGameSession } from "@/lib/game-core/storage";
import { countsByLevel, countsByLevelGrade } from "@/data/kanji";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

const levelOptions = [
  { value: 5, label: "N5" },
  { value: 4, label: "N4" },
  { value: 3, label: "N3" },
  { value: 2, label: "N2" },
  { value: 1, label: "N1" },
];
const gradeOptions = [
  { value: 1, label: "Grade 1" },
  { value: 2, label: "Grade 2" },
  { value: 3, label: "Grade 3" },
  { value: 4, label: "Grade 4" },
  { value: 5, label: "Grade 5" },
  { value: 6, label: "Grade 6" },
  { value: 8, label: "Secondary (8)" },
  { value: 9, label: "Names (9)" },
];
type SavedSetup = { levels: number[]; grades: number[]; size: 10 | 20 | 30 };

export default function KanjiMeaningSetupPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<number[]>([5]);
  const [grades, setGrades] = useState<number[]>([]);
  const [size, setSize] = useState<10 | 20 | 30>(10);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({});
  const [hasSavedSetup, setHasSavedSetup] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const initializedGrades = useRef(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let restoredGrades = false;
    try {
      const saved = localStorage.getItem("kanji-meaning-last-setup");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedSetup>;
        if (
          Array.isArray(parsed.levels) &&
          parsed.levels.every((value) => levelOptions.some((item) => item.value === value))
        ) {
          setLevels(parsed.levels);
        }
        if (
          Array.isArray(parsed.grades) &&
          parsed.grades.every((value) => gradeOptions.some((item) => item.value === value))
        ) {
          setGrades(parsed.grades);
          setHasSavedSetup(true);
          initializedGrades.current = true;
          restoredGrades = true;
        }
        if (parsed.size === 10 || parsed.size === 20 || parsed.size === 30) setSize(parsed.size);
      }
      if (!restoredGrades) setHasSavedSetup(false);
    } catch (loadError) {
      console.error("Could not read the saved kanji setup.", loadError);
      setError("Saved setup could not be loaded. You can still choose settings and start.");
      setHasSavedSetup(false);
    }
    setReady(true);
    function onPageShow() {
      setStarting(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    let active = true;
    countsByLevelGrade(levels)
      .then((value) => {
        if (!active) return;
        setCounts(value);
        if (hasSavedSetup === false && !initializedGrades.current) {
          setGrades(gradeOptions.map((item) => item.value).filter((grade) => value[grade] > 0));
          initializedGrades.current = true;
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Could not load kanji counts.", loadError);
        setError("Kanji data could not be loaded. Please refresh and try again.");
      });
    return () => {
      active = false;
    };
  }, [levels, hasSavedSetup]);

  useEffect(() => {
    let active = true;
    countsByLevel(grades)
      .then((value) => {
        if (active) setLevelCounts(value);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Could not load kanji level counts.", loadError);
        setError("Kanji data could not be loaded. Please refresh and try again.");
      });
    return () => {
      active = false;
    };
  }, [grades]);

  const poolSize = useMemo(
    () =>
      gradeOptions.reduce(
        (sum, grade) => sum + (grades.includes(grade.value) ? counts[grade.value] ?? 0 : 0),
        0
      ),
    [counts, grades]
  );

  function toggleValue(value: number, selected: number[], setSelected: (next: number[]) => void) {
    setSelected(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
    );
  }

  async function start() {
    if (!poolSize || starting) return;
    setStarting(true);
    setError("");
    try {
      const session = await createKanjiMeaningSession({ levels, grades, size });
      saveGameSession("kanji", session.sessionId, session);
      localStorage.setItem("kanji-meaning-last-setup", JSON.stringify({ levels, grades, size }));
      setStarting(false);
      playGameSfx("temple-bell-gong");
      router.push(`/games/kanji/meaning/play/${session.sessionId}`);
    } catch (startError) {
      console.error("Could not start kanji meaning practice.", startError);
      setError("The session could not be started. Please try again.");
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

  return (
    <GameLayout label="KANJI" glyph="漢">
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--line)]/70 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                  <span>漢字の意味練習</span>
                  <span>·</span>
                  <span>Meaning Mode</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                  Practice setup
                </h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLevels([5]);
                  setGrades(gradeOptions.map((item) => item.value).filter((grade) => (counts[grade] ?? 0) > 0));
                  setSize(10);
                }}
                className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition-all hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)] shadow-2xs"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-8">
              {/* 1. JLPT Level Selection */}
              <fieldset>
                <div className="mb-3 flex items-center justify-between">
                  <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                    1. JLPT Level · 難易度
                  </legend>
                  <span className="text-[11px] text-[var(--muted)]">
                    {levels.length} level{levels.length === 1 ? "" : "s"} selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {levelOptions.map((level) => {
                    const selected = levels.includes(level.value);
                    const count = levelCounts[level.value] ?? 0;
                    return (
                      <button
                        key={level.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleValue(level.value, levels, setLevels)}
                        className={`relative flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-all duration-150 select-none ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40 hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-black tracking-wide">{level.label}</span>
                          <span className={`text-[10px] font-semibold ${selected ? "text-white/80" : "text-[var(--muted)]"}`}>
                            {count} kanji
                          </span>
                        </div>
                        {selected && (
                          <span className="grid size-5 place-items-center rounded-full bg-white/20 text-white">
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Counts update dynamically with your chosen school grades.
                </p>
              </fieldset>

              {/* 2. School Grade Selection */}
              <fieldset>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                      2. School Grade · 配当漢字
                    </legend>
                    <span className="text-[11px] text-[var(--muted)]">
                      Japanese elementary (1–6) & secondary joyo kanji
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setGrades(
                          gradeOptions
                            .filter((item) => (counts[item.value] ?? 0) > 0)
                            .map((item) => item.value)
                        )
                      }
                      className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-[var(--primary-fg)] transition-colors hover:bg-[var(--sakura-light)]"
                    >
                      Select all
                    </button>
                    <span className="text-[var(--line)]">·</span>
                    <button
                      type="button"
                      onClick={() => setGrades([])}
                      className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--ink)]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {gradeOptions.map((grade) => {
                    const count = counts[grade.value] ?? 0;
                    const selected = grades.includes(grade.value);
                    const disabled = !count;
                    return (
                      <button
                        key={grade.value}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => toggleValue(grade.value, grades, setGrades)}
                        className={`relative flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-all duration-150 select-none ${
                          disabled
                            ? "cursor-not-allowed border-dashed border-[var(--line)] bg-[var(--bg)]/50 text-[var(--muted)] opacity-40"
                            : selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40 hover:shadow-2xs"
                        }`}
                      >
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-extrabold tracking-wide truncate">{grade.label}</span>
                          <span className={`text-[10px] font-semibold ${selected ? "text-white/80" : "text-[var(--muted)]"}`}>
                            {disabled ? "0 kanji" : `${count} kanji`}
                          </span>
                        </div>
                        {selected && !disabled && (
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/20 text-white">
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* 3. Question Count / Set Size */}
              <fieldset>
                <div className="mb-3 flex items-center justify-between">
                  <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                    3. Set size · 出題数
                  </legend>
                  <span className="text-[11px] text-[var(--muted)]">
                    {poolSize < 10 ? `All ${poolSize} available` : `${size} questions`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(poolSize < 10 ? ([10] as const) : ([10, 20, 30] as const)).map((option) => {
                    const active = size === option;
                    const disabled = poolSize === 0 || (poolSize >= 10 && option > poolSize);
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        aria-pressed={active}
                        onClick={() => setSize(option)}
                        className={`flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-150 select-none ${
                          disabled
                            ? "cursor-not-allowed border-dashed border-[var(--line)] bg-[var(--bg)]/50 text-[var(--muted)] opacity-40"
                            : active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40 hover:shadow-2xs"
                        }`}
                      >
                        {poolSize < 10 ? `All ${poolSize}` : option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Right Sticky Sidebar */}
          <aside className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.06)] lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between border-b border-[var(--line)]/70 pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Your selection
              </p>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                Meaning
              </span>
            </div>

            <div className="my-5 flex items-baseline justify-between border-b border-[var(--line)]/70 pb-5">
              <div>
                <span className="font-japanese text-5xl font-black leading-none text-[var(--primary-fg)]">
                  {poolSize}
                </span>
                <span className="ml-2 text-sm font-bold text-[var(--muted)]">kanji available</span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-[var(--muted)]">Estimated time</span>
                <span className="text-sm font-bold text-[var(--ink)]">
                  ~{Math.max(1, Math.round(Math.min(size, poolSize) * 8 / 60))} min
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--muted)] pb-5 border-b border-[var(--line)]/70">
              <div className="flex items-center justify-between">
                <span>Questions in session:</span>
                <strong className="text-[var(--ink)] tabular-nums text-sm">
                  {Math.min(size, poolSize)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Active levels:</span>
                <span className="font-bold text-[var(--ink)]">
                  {levels.length ? levels.map((l) => `N${l}`).join(", ") : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active grades:</span>
                <span className="font-bold text-[var(--ink)] tabular-nums">
                  {grades.length} selected
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-3 text-xs font-semibold text-[var(--wrong)]">
                {error}
              </p>
            )}

            <div className="mt-5">
              <button
                type="button"
                disabled={!poolSize || starting}
                onClick={start}
                className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-base font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{starting ? "Starting…" : "Start Practice"}</span>
                <ArrowRight size={18} />
              </button>
              {!poolSize && (
                <p className="mt-2 text-center text-xs text-[var(--wrong)]">
                  Please select at least one grade with available kanji.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </GameLayout>
  );
}
