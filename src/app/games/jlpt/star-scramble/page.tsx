"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  STAR_SCRAMBLE_ITEMS,
  STAR_SCRAMBLE_LEVELS,
  createStarScrambleSession,
  getStarScrambleCountsByLevel,
  type StarScrambleLevel,
  type StarScrambleSessionSize,
} from "@/engine/jlptStarScramble";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

const SESSION_SIZES: readonly StarScrambleSessionSize[] = [10, 15, 20];

const LEVEL_DESCRIPTIONS: Record<StarScrambleLevel, string> = {
  N5: "Basic particles (は, が, を, に, で), copula, simple verb frames",
  N4: "Giving/receiving (てあげる/てくれる), conditionals (たら/ば), passives",
  N3: "Compound conjunctions (わけではない, ようにする, ことになっている)",
  N2: "Written discourse registers (〜にほかならない, 〜ざるを得ない, 〜つつある)",
  N1: "Advanced literary expressions (〜極まりない, 〜なくしては, 〜であれ)",
};

function StarScrambleSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();

  const initialLevels = useMemo<StarScrambleLevel[]>(() => {
    if (!levelParam) return ["N5"];
    if (levelParam === "ALL") return [...STAR_SCRAMBLE_LEVELS];
    if (STAR_SCRAMBLE_LEVELS.includes(levelParam as StarScrambleLevel)) {
      return [levelParam as StarScrambleLevel];
    }
    return ["N5"];
  }, [levelParam]);

  const [selectedLevels, setSelectedLevels] = useState<StarScrambleLevel[]>(initialLevels);
  const [size, setSize] = useState<StarScrambleSessionSize>(10);
  const [showEnglishHint, setShowEnglishHint] = useState<boolean>(true);
  const [showFurigana, setShowFurigana] = useState<boolean>(false);

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

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([...STAR_SCRAMBLE_LEVELS]);
    } else {
      setSelectedLevels([lvlStr.toUpperCase() as StarScrambleLevel]);
    }
  }

  function handleStartSession() {
    const session = createStarScrambleSession(STAR_SCRAMBLE_ITEMS, {
      levels: selectedLevels,
      size,
      showEnglishHint,
      showFurigana,
    });
    saveGameSession("jlpt-star", session.sessionId, session);
    router.push(`/games/jlpt/star-scramble/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === STAR_SCRAMBLE_LEVELS.length
      ? "ALL"
      : selectedLevels[0] ?? "N5";

  return (
    <JlptBookletSetupShell
      label="★ STAR SENTENCE SCRAMBLE · 星問題"
      glyph="★"
      sectionTag="第2部：文法 · 問題 2 (星問題)"
      mondaiBadge="問題 2 · ★"
      sectionTitle={
        <span>
          文の組み立て · 星問題 <span className="text-xl font-normal text-[var(--muted)] sm:text-2xl">(Star Sentence Scramble)</span>
        </span>
      }
      sectionSubtitle="正しい文を組み立てて★の枠に入る最もよい言葉を選ぶ文法構文パズル"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="puzzles in active pool"
      instructions={
        <div className="space-y-1 font-japanese text-xs sm:text-sm">
          <p>
            <strong>【問題2】</strong> ＿＿に入る最もよいものを、1・2・3・4から一つえらんでください。
          </p>
          <p className="text-[11px] text-[var(--muted)]">
            ※ 4つの選択肢を正しい順序に並べて文を完成させ、<strong className="text-[var(--primary-fg)]">★</strong>の場所に入る言葉の番号を解答します。
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Exam Pattern Preview Box */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              例題 · 出題パターン (Official JLPT ★ Exam Pattern)
            </span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              Dual Scoring: ★ Star Choice + Full Order
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-[var(--ink)]/15 bg-[var(--bg)]/60 px-4 py-3.5 font-japanese text-base sm:text-lg">
            <span>わたしは</span>
            <span className="rounded-sm border border-dashed border-[var(--ink)]/30 px-3 py-1 text-xs text-[var(--muted)]">
              1 (リンゴ)
            </span>
            <span className="rounded-sm border border-dashed border-[var(--ink)]/30 px-3 py-1 text-xs text-[var(--muted)]">
              2 (が)
            </span>
            <span className="inline-flex items-center gap-1 rounded-sm border-2 border-[var(--primary)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)] shadow-xs">
              ★ 3 (一番)
            </span>
            <span className="rounded-sm border border-dashed border-[var(--ink)]/30 px-3 py-1 text-xs text-[var(--muted)]">
              4 (より)
            </span>
            <span>好きです。</span>
          </div>
        </div>

        {/* Exam Question Box 1: JLPT Level Selection */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第1問 · 判定対象レベル (JLPT Levels Selection)
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Choose one or multiple JLPT tiers ({availablePoolCount} puzzles in active pool).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedLevels([...STAR_SCRAMBLE_LEVELS])}
                className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
              >
                All N5–N1
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevels(["N5"])}
                className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
              >
                Reset N5
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {STAR_SCRAMBLE_LEVELS.map((level) => {
              const active = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLevel(level)}
                  className={`flex flex-col items-start justify-between rounded-sm border-2 p-3.5 text-left transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 hover:border-[var(--primary)]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`font-japanese text-lg font-black ${
                        active ? "text-[var(--primary-fg)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {level}
                    </span>
                    <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
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

        {/* Exam Question Box 2 & 3: English Prompt Hint & Session Size */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exam Question Box 2: English Prompt Hint & Furigana */}
          <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第2問 · 解答補助・ヒント条件 (Hint &amp; Furigana)
            </span>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Choose whether to display English sentence translation before submitting.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                aria-pressed={showEnglishHint}
                onClick={() => setShowEnglishHint(true)}
                className={`flex w-full items-center justify-between rounded-sm border-2 px-4 py-3 text-left transition ${
                  showEnglishHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold sm:text-sm">
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
                className={`flex w-full items-center justify-between rounded-sm border-2 px-4 py-3 text-left transition ${
                  !showEnglishHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold sm:text-sm">OFF — Real Exam Mode</div>
                  <div className="text-[11px] opacity-80">
                    Hides English until you submit, matching the real JLPT
                  </div>
                </div>
                <EyeOff size={18} className="shrink-0" />
              </button>
            </div>

            <div className="mt-4 border-t border-[var(--ink)]/10 pt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Kanji Furigana (読み仮名)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={showFurigana}
                  onClick={() => setShowFurigana(true)}
                  className={`rounded-sm border-2 px-3.5 py-2.5 text-center text-xs font-bold transition ${
                    showFurigana
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                  }`}
                >
                  あ Furigana ON
                </button>
                <button
                  type="button"
                  aria-pressed={!showFurigana}
                  onClick={() => setShowFurigana(false)}
                  className={`rounded-sm border-2 px-3.5 py-2.5 text-center text-xs font-bold transition ${
                    !showFurigana
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                  }`}
                >
                  漢 Furigana OFF (Exam)
                </button>
              </div>
            </div>
          </div>

          {/* Exam Question Box 3: Session Size */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第3問 · 出題数設定 (Session Length)
              </span>
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
                      className={`rounded-sm border-2 py-3.5 text-center transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] font-black text-[var(--primary-fg)] shadow-xs"
                          : "border-[var(--ink)]/25 bg-[var(--bg)]/50 font-bold text-[var(--muted)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="font-mono text-xl">{count}</div>
                      <div className="text-[11px] opacity-80">puzzles</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-sm border border-dashed border-[var(--ink)]/20 bg-[var(--bg)]/60 p-3 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <Sparkles size={14} className="text-[var(--primary-fg)]" />
                <span>Active Configuration Summary</span>
              </div>
              <div className="mt-1 font-japanese">
                {selectedLevels.join(", ")} · {size}問 · {showEnglishHint ? "英語ヒントON" : "本番モード(英語OFF)"}
              </div>
            </div>
          </div>
        </div>

        {/* Japan Red Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="font-japanese font-bold text-[var(--ink)]">
              受験準備完了:
            </span>
            <span>
              <strong>{Math.min(size, availablePoolCount)}</strong> items selected from pool ({selectedLevels.join(", ")})
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
          >
            <span>演習をはじめる / Start Examination Drill →</span>
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function StarScrambleSetupPage() {
  return (
    <Suspense fallback={null}>
      <StarScrambleSetupContent />
    </Suspense>
  );
}
