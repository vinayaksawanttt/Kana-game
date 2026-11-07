"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  STAR_SCRAMBLE_ITEMS,
  STAR_SCRAMBLE_LEVELS,
  createStarScrambleSession,
  getStarScrambleCountsByLevel,
  type StarScrambleLevel,
  type StarScrambleSessionSize,
} from "@/engine/jlptStarScramble";

const SESSION_SIZES: readonly StarScrambleSessionSize[] = [10, 15, 20];

const LEVEL_DESCRIPTIONS: Record<StarScrambleLevel, string> = {
  N5: "Basic particles, word order & everyday polite clauses",
  N4: "Conditional clauses, giving/receiving & compound sentences",
  N3: "Intermediate connectors, formal expressions & relative clauses",
  N2: "Written registers, nuanced conjunctions & complex grammar",
  N1: "Classical/literary structures & high-level idiomatic inversion",
};

export default function StarScrambleSetupPage() {
  const router = useRouter();
  const [selectedLevels, setSelectedLevels] = useState<StarScrambleLevel[]>(["N5"]);
  const [size, setSize] = useState<StarScrambleSessionSize>(10);
  const [showEnglishHint, setShowEnglishHint] = useState<boolean>(true);

  const countsByLevel = useMemo(
    () => getStarScrambleCountsByLevel(STAR_SCRAMBLE_ITEMS),
    [],
  );

  const availablePoolCount = useMemo(
    () =>
      selectedLevels.reduce(
        (acc, level) => acc + (countsByLevel[level] ?? 0),
        0,
      ),
    [countsByLevel, selectedLevels],
  );

  function toggleLevel(level: StarScrambleLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== level);
      }
      return [...prev, level];
    });
  }

  function handleStartSession() {
    const session = createStarScrambleSession(STAR_SCRAMBLE_ITEMS, {
      levels: selectedLevels,
      size,
      showEnglishHint,
    });
    saveGameSession("jlpt-star", session.sessionId, session);
    router.push(`/games/jlpt/star-scramble/play/${session.sessionId}`);
  }

  return (
    <GameLayout
      label="★ STAR SENTENCE SCRAMBLE"
      glyph="★"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        <header className="py-7 sm:py-9">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT Bunpō Mondai 2 · 星問題
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              ＿＿ ＿＿ ★ ＿＿
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            ★ Star Sentence Scramble{" "}
            <span className="font-japanese text-2xl font-normal text-[var(--muted)]">
              (星問題パズル)
            </span>
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Snap 4 shuffled syntactic phrase tiles into the blank slots to reconstruct the Japanese sentence and identify which phrase lands specifically on the{" "}
            <strong className="text-[var(--primary-fg)]">★ Star slot</strong>.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Interactive Format Preview Banner */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                How Official JLPT ★ Questions Work
              </span>
              <span className="text-xs font-semibold text-[var(--muted)]">
                Dual Scoring: ★ Star Choice + Full 4/4 Order
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3.5 font-japanese text-base sm:text-lg">
              <span>この中で、</span>
              <span className="rounded-lg border border-dashed border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                1
              </span>
              <span className="rounded-lg border border-dashed border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                2
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[var(--primary)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                ★ 3
              </span>
              <span className="rounded-lg border border-dashed border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                4
              </span>
              <span>好きです。</span>
            </div>
          </div>

          {/* 1. JLPT Level Selection */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">1. Select JLPT Levels</h2>
                <p className="text-xs text-[var(--muted)]">
                  Choose one or multiple JLPT tiers ({availablePoolCount} puzzles in active pool).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLevels([...STAR_SCRAMBLE_LEVELS])}
                  className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
                >
                  All N5–N1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevels(["N5"])}
                  className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
                >
                  Reset N5
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              {STAR_SCRAMBLE_LEVELS.map((level) => {
                const active = selectedLevels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLevel(level)}
                    className={`flex flex-col items-start justify-between rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`text-lg font-extrabold ${
                          active ? "text-[var(--primary-fg)]" : ""
                        }`}
                      >
                        {level}
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                        {countsByLevel[level]}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
                      {LEVEL_DESCRIPTIONS[level]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. English Prompt Hint Mode & 3. Session Size */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* English Prompt Hint Toggle */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="text-base font-bold">2. English Prompt Hint</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Choose whether to display the English meaning before submitting.
              </p>

              <div className="mt-4 grid gap-2.5">
                <button
                  type="button"
                  aria-pressed={showEnglishHint}
                  onClick={() => setShowEnglishHint(true)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    showEnglishHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">
                      Show English translation while solving
                    </div>
                    <div className="text-[11px] opacity-80">
                      Recommended for learning grammar &amp; clause order
                    </div>
                  </div>
                  <Eye size={18} className="shrink-0" />
                </button>

                <button
                  type="button"
                  aria-pressed={!showEnglishHint}
                  onClick={() => setShowEnglishHint(false)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    !showEnglishHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">OFF — Real Exam Mode</div>
                    <div className="text-[11px] opacity-80">
                      Hides English until you submit, matching the real JLPT
                    </div>
                  </div>
                  <EyeOff size={18} className="shrink-0" />
                </button>
              </div>
            </div>

            {/* Session Size */}
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <div>
                <h2 className="text-base font-bold">3. Session Length</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Number of ★ Star Scramble questions in this drill.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {SESSION_SIZES.map((count) => {
                    const active = size === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSize(count)}
                        className={`rounded-xl border py-3.5 text-center transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--sakura-light)] font-extrabold text-[var(--primary-fg)]"
                            : "border-[var(--line)] bg-[var(--bg)] font-bold text-[var(--muted)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        <div className="text-lg">{count}</div>
                        <div className="text-[11px] opacity-80">puzzles</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <Sparkles size={14} className="text-[var(--primary-fg)]" />
                  <span>
                    {selectedLevels.join(", ")} · {size} Questions
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStartSession}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  <span>Start Exam Drill</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
