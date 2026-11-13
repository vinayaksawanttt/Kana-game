"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, Clock, Layers, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { createGrammarSession } from "@/engine/grammarSession";
import { grammarLevels, loadGrammarData, type GrammarLevel } from "@/data/grammar";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

const mixOptions: Array<{ value: number; label: string; sub: string }> = [
  { value: 0.5, label: "50 / 50 Mix", sub: "Balanced particle fill-in & word order" },
  { value: 1, label: "Cloze Only", sub: "100% particle & conjugation blanks" },
  { value: 0, label: "Scramble Only", sub: "100% sentence word-order assembly" },
  { value: 0.7, label: "70% Cloze / 30% Scramble", sub: "Focus on blanks with light ordering" },
  { value: 0.3, label: "30% Cloze / 70% Scramble", sub: "Focus on syntax assembly with blanks" },
];

const levelDescriptions: Record<GrammarLevel, string> = {
  N5: "Beginner",
  N4: "Elementary",
  N3: "Intermediate",
  N2: "Upper-Int",
  N1: "Advanced",
};

type SavedGrammarSetup = {
  levels: GrammarLevel[];
  size: 10 | 20 | 30;
  clozeRatio: number;
};

export default function GrammarSetupPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<GrammarLevel[]>(["N5"]);
  const [size, setSize] = useState<10 | 20 | 30>(10);
  const [clozeRatio, setClozeRatio] = useState<number>(0.5);
  const [countsByLevel, setCountsByLevel] = useState<Record<GrammarLevel, number>>({
    N5: 136,
    N4: 124,
    N3: 132,
    N2: 191,
    N1: 245,
  });
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("grammar-last-setup");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedGrammarSetup>;
        if (
          Array.isArray(parsed.levels) &&
          parsed.levels.length > 0 &&
          parsed.levels.every((lvl): lvl is GrammarLevel =>
            (grammarLevels as readonly string[]).includes(lvl)
          )
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLevels(parsed.levels);
        }
        if (parsed.size === 10 || parsed.size === 20 || parsed.size === 30) {
          setSize(parsed.size);
        }
        if (typeof parsed.clozeRatio === "number" && parsed.clozeRatio >= 0 && parsed.clozeRatio <= 1) {
          setClozeRatio(parsed.clozeRatio);
        }
      }
    } catch {
      // Ignore storage read errors
    }
    setReady(true);

    let active = true;
    loadGrammarData(grammarLevels)
      .then((all) => {
        if (!active) return;
        const tally: Record<GrammarLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
        for (const p of all) {
          tally[p.level] += 1;
        }
        setCountsByLevel(tally);
      })
      .catch(() => {
        // Keep default counts
      });

    function onPageShow() {
      setStarting(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const poolSize = useMemo(
    () => levels.reduce((sum, lvl) => sum + (countsByLevel[lvl] ?? 0), 0),
    [countsByLevel, levels]
  );

  const effectiveQuestions = Math.min(size, poolSize);
  const clozeCount = Math.round(effectiveQuestions * clozeRatio);
  const scrambleCount = Math.max(0, effectiveQuestions - clozeCount);
  const estimatedMinutes =
    effectiveQuestions > 0 ? Math.max(1, Math.round((clozeCount * 15 + scrambleCount * 25) / 60)) : 0;

  function estimateMinutesForSize(targetSize: number) {
    const count = Math.min(targetSize, poolSize);
    if (count === 0) return 0;
    const cCount = Math.round(count * clozeRatio);
    const sCount = Math.max(0, count - cCount);
    return Math.max(1, Math.round((cCount * 15 + sCount * 25) / 60));
  }

  function toggleLevel(level: GrammarLevel) {
    setLevels((prev) => {
      if (prev.includes(level)) {
        return prev.length > 1 ? prev.filter((item) => item !== level) : prev;
      }
      const next = [...prev, level];
      return grammarLevels.filter((lvl) => next.includes(lvl));
    });
  }

  function selectAllLevels() {
    setLevels([...grammarLevels]);
  }

  function resetDefaults() {
    setLevels(["N5"]);
    setSize(10);
    setClozeRatio(0.5);
    setError("");
  }

  async function start() {
    if (!poolSize || starting) return;
    setStarting(true);
    setError("");
    try {
      const session = await createGrammarSession({ levels, size, clozeRatio });
      saveGameSession("grammar", session.sessionId, session);
      localStorage.setItem("grammar-last-setup", JSON.stringify({ levels, size, clozeRatio }));
      setStarting(false);
      playGameSfx("temple-bell-gong");
      router.push(`/games/grammar/play/${session.sessionId}`);
    } catch (startError) {
      console.error("Could not start grammar session.", startError);
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
    <GameLayout
      label="GRAMMAR"
      glyph="文"
      rightSlot={
        <Link
          href="/grammar"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] hover:border-[var(--primary)]"
        >
          <BookOpen className="size-3.5 text-[var(--primary)]" />
          <span>Reference Hub</span>
        </Link>
      }
    >
      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="my-auto grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Cloze & Syntax Scramble
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">Grammar practice setup</h1>
              </div>
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)]"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-6">
              {/* JLPT Level Multi-Select */}
              <fieldset>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-sm font-bold">
                    JLPT Level (multi-select)
                    <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                      {levels.length} of {grammarLevels.length} selected
                    </span>
                  </legend>
                  <button
                    type="button"
                    onClick={selectAllLevels}
                    disabled={levels.length === grammarLevels.length}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline disabled:cursor-default disabled:opacity-45"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {grammarLevels.map((lvl) => {
                    const selected = levels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleLevel(lvl)}
                        className={`flex min-h-14 flex-col items-start justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                            : "border-[var(--line)] bg-[var(--sakura-light)]/70 text-[var(--ink)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        <span className="flex w-full items-center justify-between text-sm font-bold">
                          <span>
                            {lvl}{" "}
                            <span className={`text-xs font-semibold ${selected ? "text-white/85" : "text-[var(--muted)]"}`}>
                              ({countsByLevel[lvl] ?? 0})
                            </span>
                          </span>
                          {selected && <Check size={14} aria-hidden="true" className="shrink-0" />}
                        </span>
                        <span
                          className={`mt-0.5 text-[11px] font-medium ${
                            selected ? "text-white/80" : "text-[var(--muted)]"
                          }`}
                        >
                          {levelDescriptions[lvl]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Mix Ratio */}
              <fieldset>
                <legend className="mb-2.5 text-sm font-bold">Question Mix (Cloze vs. Scramble)</legend>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {mixOptions.map((opt) => {
                    const selected = Math.abs(clozeRatio - opt.value) < 0.01;
                    const clozePct = Math.round(opt.value * 100);
                    const scramblePct = 100 - clozePct;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setClozeRatio(opt.value)}
                        className={`flex flex-col justify-between rounded-xl border px-3.5 py-3 text-left transition-all ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                            : "border-[var(--line)] bg-[var(--sakura-light)]/60 text-[var(--ink)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 text-sm font-bold">
                            <span>{opt.label}</span>
                            {selected && <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0" />}
                          </div>
                          <span
                            className={`mt-1 block text-xs leading-snug font-normal ${
                              selected ? "text-white/85" : "text-[var(--muted)]"
                            }`}
                          >
                            {opt.sub}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div
                            className={`flex justify-between text-[10px] font-semibold uppercase tracking-wide ${
                              selected ? "text-white/80" : "text-[var(--muted)]"
                            }`}
                          >
                            <span>Cloze {clozePct}%</span>
                            <span>Scramble {scramblePct}%</span>
                          </div>
                          <div
                            className={`mt-1 flex h-1.5 overflow-hidden rounded-full ${
                              selected ? "bg-white/25" : "bg-[var(--line)]"
                            }`}
                          >
                            <div
                              className={selected ? "bg-white" : "bg-[var(--primary)]"}
                              style={{ width: `${clozePct}%` }}
                            />
                            <div
                              className={selected ? "bg-white/45" : "bg-[var(--sakura)]"}
                              style={{ width: `${scramblePct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Set Size */}
              <fieldset>
                <legend className="mb-2.5 text-sm font-bold">Set size</legend>
                <div className="grid grid-cols-3 gap-2.5">
                  {([10, 20, 30] as const).map((option) => {
                    const estMins = estimateMinutesForSize(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={poolSize === 0}
                        aria-pressed={size === option}
                        onClick={() => setSize(option)}
                        className={`flex min-h-13 flex-col items-center justify-center rounded-xl border px-4 py-2 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                          size === option
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                            : "border-[var(--line)] bg-[var(--sakura-light)]/60 text-[var(--ink)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        <span className="text-base">{option} </span>
                        <span
                          className={`text-[11px] font-medium ${
                            size === option ? "text-white/80" : "text-[var(--muted)]"
                          }`}
                        >
                          ~{estMins} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Your selection
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                <Clock size={12} aria-hidden="true" /> ~{estimatedMinutes} min
              </span>
            </div>
            <div className="my-4 flex items-end justify-between border-b border-[var(--line)] pb-4">
              <span className="font-japanese text-5xl leading-none text-[var(--primary-fg)]">{poolSize}</span>
              <span className="pb-1 text-sm text-[var(--muted)]">grammar points</span>
            </div>

            <dl className="mb-5 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Layers size={14} aria-hidden="true" /> Levels
                </dt>
                <dd className="font-bold text-[var(--ink)]">{levels.join(", ")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Sparkles size={14} aria-hidden="true" /> Questions
                </dt>
                <dd className="font-bold text-[var(--ink)]">{effectiveQuestions}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Shuffle size={14} aria-hidden="true" /> Cloze / Scramble
                </dt>
                <dd className="text-right font-bold text-[var(--ink)]">
                  <span>
                    {Math.round(clozeRatio * 100)}% / {Math.round((1 - clozeRatio) * 100)}%
                  </span>
                  <span className="block text-[11px] font-medium text-[var(--muted)]">
                    {clozeCount} Cloze · {scrambleCount} Scramble
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-2.5">
                <dt className="flex items-center gap-1.5 text-[var(--muted)]">
                  <Clock size={14} aria-hidden="true" /> Est. time
                </dt>
                <dd className="font-bold text-[var(--ink)]">~{estimatedMinutes} min</dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mb-3 text-sm font-semibold text-[var(--wrong)]">
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={!poolSize || starting}
              onClick={() => void start()}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-base font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45 sm:h-14 sm:text-lg"
            >
              {starting ? "Starting…" : "Start Practice"} <ArrowRight size={19} />
            </button>
          </aside>
        </div>
      </section>
    </GameLayout>
  );
}
