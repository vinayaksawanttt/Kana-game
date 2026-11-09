"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  WORD_USAGE_ITEMS,
  createWordUsageSession,
  formatJlptLevel,
  type JlptNumericLevel,
} from "@/engine/jlptWordUsage";
import { getWordUsageCountsByLevel, type WordUsageLevel } from "@/data/jlpt/wordUsageData";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

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

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([4, 3, 2, 1]);
    } else {
      const num = parseInt(lvlStr.replace("N", ""), 10);
      if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
        setSelectedLevels([num as JlptNumericLevel]);
      }
    }
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

  const headerSelectedLevel =
    selectedLevels.length === LEVEL_OPTIONS.length
      ? "ALL"
      : `N${selectedLevels[0] ?? 4}`;

  return (
    <JlptBookletSetupShell
      label="WORD USAGE JUDGE · 語彙・用法"
      glyph="用"
      sectionTag="第1部：文字・語彙 · 問題 5 (語彙・用法)"
      mondaiBadge="語彙・用法 (Mondai 5)"
      sectionTitle={
        <span>
          Word Usage Judge{" "}
          <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
            (語彙・用法)
          </span>
        </span>
      }
      sectionSubtitle="提示された言葉が最も自然かつ正確に使われている文を選び抜く用法判断演習"
      supportedLevels={["N4", "N3", "N2", "N1"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="items in active pool"
      instructions={
        <p className="font-japanese text-xs sm:text-sm">
          ＿＿のことばの使い方として最もよいものを、1・2・3・4から一つえらんでください。
        </p>
      }
    >
      <div className="space-y-6">
        {/* Exam Pattern Preview Box */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              例題 · 出題パターン (Official Exam Question Pattern)
            </span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              Mondai 5: 用法判断
            </span>
          </div>

          <div className="mt-4 rounded-sm border border-[var(--ink)]/15 bg-[var(--bg)]/60 p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-japanese text-2xl font-black text-[var(--ink)]">
                予防
              </span>
              <span className="font-japanese text-xs text-[var(--muted)]">
                (よぼう · prevention)
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs font-japanese">
              <div className="rounded-sm border border-[var(--correct)] bg-[var(--correct)]/10 p-2 text-[var(--ink)]">
                <span className="font-bold text-[var(--correct)]">1. ✓ </span>
                インフルエンザの感染を<strong className="text-[var(--primary-fg)]">予防</strong>するために、外出後は手洗いとうがいを徹底しています。
              </div>
              <div className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">2. </span>
                今年の夏休みは<strong className="line-through">予防</strong>を立てて旅行する予定です。(×計画)
              </div>
              <div className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">3. </span>
                会議で自分の<strong className="line-through">予防</strong>をはっきりと述べました。(×意見)
              </div>
              <div className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-2 text-[var(--muted)]">
                <span className="font-bold">4. </span>
                雨で荷物が濡れないよう傘で<strong className="line-through">予防</strong>しました。(×防いだ)
              </div>
            </div>
          </div>
        </div>

        {/* Exam Question Box 1: JLPT Level Selection */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第1問 · 判定対象レベル (1. Select JLPT Levels (N4–N1))
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Choose one or more tiers ({availablePoolCount} items available in selected pool).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLevels([4, 3, 2, 1])}
              className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
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
                  aria-pressed={isSelected}
                  onClick={() => toggleLevel(level)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-4 transition-all duration-150 ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
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
                        : "border border-[var(--ink)]/30"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 2: Session Length */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第2問 · 出題数設定 (2. Session Length)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Target number of Mondai 5 items per practice drill.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {SESSION_SIZES.map((optSize) => {
              const isSelected = size === optSize;
              return (
                <button
                  key={optSize}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSize(optSize)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 transition-all ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-mono text-xl font-black">{optSize}</span>
                  <span className="text-xs font-semibold text-[var(--muted)]">Questions</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 3: Practice Mode */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第3問 · 演習モード指定 (3. Practice Mode)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Choose between authentic Japanese-only exam simulation and English-assisted study.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={studyMode === "exam-authentic"}
              onClick={() => setStudyMode("exam-authentic")}
              className={`flex items-start gap-3 rounded-sm border-2 p-4 text-left transition-all ${
                studyMode === "exam-authentic"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <div className="mt-0.5 rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-2">
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
              aria-pressed={studyMode === "study"}
              onClick={() => setStudyMode("study")}
              className={`flex items-start gap-3 rounded-sm border-2 p-4 text-left transition-all ${
                studyMode === "study"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <div className="mt-0.5 rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-2">
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

        {/* Japan Red Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="text-xs text-[var(--muted)]">
            Selected:{" "}
            <span className="font-bold text-[var(--ink)]">
              {selectedLevels.map((l) => `N${l}`).join(", ")}
            </span>{" "}
            · {size} items · {studyMode === "exam-authentic" ? "Exam Authentic" : "Study Mode"}
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={availablePoolCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-45 cursor-pointer"
          >
            <span>演習をはじめる / Start Drill →</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function WordUsageSetupPage() {
  return (
    <Suspense fallback={null}>
      <WordUsageSetupContent />
    </Suspense>
  );
}
