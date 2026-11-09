"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  WORD_USAGE_ITEMS,
  createWordUsageSession,
  formatJlptLevel,
  type JlptNumericLevel,
} from "@/engine/jlptWordUsage";
import { getWordUsageCountsByLevel, type WordUsageLevel } from "@/data/jlpt/wordUsageData";

const LEVEL_OPTIONS: readonly JlptNumericLevel[] = [4, 3, 2, 1];
const SESSION_SIZES = [10, 15, 20] as const;
type WordUsageSessionSize = (typeof SESSION_SIZES)[number];

function WordUsageSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();

  const initialLevels = useMemo<JlptNumericLevel[]>(() => {
    if (!levelParam) return [4];
    if (levelParam === "ALL") return [4, 3, 2, 1];
    const num = parseInt(levelParam.replace("N", ""), 10);
    if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
      return [num as JlptNumericLevel];
    }
    return [4];
  }, [levelParam]);

  const [selectedLevels, setSelectedLevels] = useState<JlptNumericLevel[]>(initialLevels);
  const [studyMode, setStudyMode] = useState<"exam-authentic" | "study">("exam-authentic");
  const [size, setSize] = useState<WordUsageSessionSize>(10);

  const countsByLevel = useMemo(() => getWordUsageCountsByLevel(WORD_USAGE_ITEMS), []);

  const availablePoolCount = useMemo(() => {
    const levelSet = new Set(selectedLevels);
    return WORD_USAGE_ITEMS.filter((item) => levelSet.has(item.jlpt as JlptNumericLevel)).length;
  }, [selectedLevels]);

  function toggleLevel(level: JlptNumericLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort((a, b) => b - a);
    });
  }

  function handleStartSession() {
    const session = createWordUsageSession(WORD_USAGE_ITEMS, {
      levels: selectedLevels,
      size,
      showEnglishTranslations: studyMode === "study",
    });
    saveGameSession("jlpt-usage", session.sessionId, session);
    router.push(`/games/jlpt/word-usage/play/${session.sessionId}`);
  }

  return (
    <GameLayout
      label="WORD USAGE JUDGE · 語彙・用法"
      glyph="用"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        {/* Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT Vocabulary · Mondai 5
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              語彙・用法 (Mondai 5)
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Word Usage Judge{" "}
            <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
              (語彙・用法)
            </span>
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            In Official JLPT Vocabulary <em>Mondai 5</em>, you are presented with a single target word and four complete Japanese sentences. Your task is to identify the <strong>exact one sentence that uses the word naturally and correctly</strong>, spotting semantic mismatches and grammatical false collocations.
          </p>

          {/* Example Preview Banner */}
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              Official Exam Question Pattern (例題)
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-japanese text-2xl font-black text-[var(--ink)]">
                予防
              </span>
              <span className="font-japanese text-xs text-[var(--muted)]">
                (よぼう · prevention)
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs font-japanese">
              <div className="rounded-lg border border-[var(--correct)] bg-[var(--correct)]/10 p-2 text-[var(--ink)]">
                <span className="font-bold text-[var(--correct)]">1. ✓ </span>
                インフルエンザの感染を<strong className="text-[var(--primary-fg)]">予防</strong>するために、外出後は手洗いとうがいを徹底しています。
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">2. </span>
                今年の夏休みは<strong className="line-through">予防</strong>を立てて旅行する予定です。(×計画)
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">3. </span>
                会議で自分の<strong className="line-through">予防</strong>をはっきりと述べました。(×意見)
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">4. </span>
                雨で荷物が濡れないよう傘で<strong className="line-through">予防</strong>しました。(×防いだ)
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="mt-6 space-y-6">
          {/* 1. JLPT Level Selection */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">1. Select JLPT Levels (N4–N1)</h2>
                <p className="text-xs text-[var(--muted)]">
                  Choose one or more tiers ({availablePoolCount} items available in selected pool).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLevels([4, 3, 2, 1])}
                className="text-xs font-bold text-[var(--primary-fg)] hover:underline"
              >
                Select All N4–N1
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LEVEL_OPTIONS.map((level) => {
                const label = formatJlptLevel(level);
                const isSelected = selectedLevels.includes(level);
                const count = countsByLevel[label as WordUsageLevel] ?? 0;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-150 ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="font-japanese text-xl font-black">{label}</span>
                    <span className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                      {count} items
                    </span>
                    <span
                      className={`mt-2 flex size-5 items-center justify-center rounded-full text-xs ${
                        isSelected
                          ? "bg-[var(--primary)] text-white"
                          : "border border-[var(--line)]"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Session Length */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <h2 className="text-base font-bold">2. Session Length</h2>
            <p className="text-xs text-[var(--muted)]">
              Target number of Mondai 5 items per practice drill.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {SESSION_SIZES.map((optSize) => {
                const isSelected = size === optSize;
                return (
                  <button
                    key={optSize}
                    type="button"
                    onClick={() => setSize(optSize)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-3.5 transition-all ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="font-mono text-lg font-black">{optSize}</span>
                    <span className="text-xs font-semibold text-[var(--muted)]">Questions</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Study Mode Selection */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <h2 className="text-base font-bold">3. Practice Mode</h2>
            <p className="text-xs text-[var(--muted)]">
              Choose between authentic Japanese-only exam simulation and English-assisted study.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStudyMode("exam-authentic")}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  studyMode === "exam-authentic"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--muted)]"
                }`}
              >
                <div className="mt-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2">
                  <EyeOff size={18} className="text-[var(--primary-fg)]" />
                </div>
                <div>
                  <div className="font-bold text-sm">Exam Authentic (本番モード)</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Pure Japanese sentences without English hints. Exactly matches official test conditions.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStudyMode("study")}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  studyMode === "study"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--muted)]"
                }`}
              >
                <div className="mt-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2">
                  <Eye size={18} className="text-[var(--primary-fg)]" />
                </div>
                <div>
                  <div className="font-bold text-sm">Study Mode (学習モード)</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Reveals English sentence translations and nuance guidance during drill practice.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Start Drill Action */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:flex-row">
            <div>
              <div className="text-sm font-bold">Ready to Begin?</div>
              <div className="text-xs text-[var(--muted)]">
                Selected {selectedLevels.map((l) => `N${l}`).join(", ")} · {size} items · {studyMode === "exam-authentic" ? "Exam Authentic" : "Study Mode"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartSession}
              disabled={availablePoolCount === 0}
              className="inline-flex items-center gap-2.5 rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>演習をはじめる / Start Drill</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}

export default function WordUsageSetupPage() {
  return (
    <Suspense
      fallback={
        <GameLayout label="WORD USAGE JUDGE" glyph="用" homeHref="/games/jlpt">
          <div className="mx-auto max-w-4xl p-10 text-center text-sm text-[var(--muted)]">
            Loading Word Usage setup...
          </div>
        </GameLayout>
      }
    >
      <WordUsageSetupContent />
    </Suspense>
  );
}
