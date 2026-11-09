"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Eye, EyeOff, Languages, Sparkles } from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  SYNONYM_MATCH_ITEMS,
  createSynonymMatchSession,
  formatJlptLevel,
  getSynonymMatchCountsByLevel,
  type DisplayScriptMode,
  type JlptNumericLevel,
  type SynonymMatchSessionSize,
} from "@/engine/jlptSynonymMatch";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

const LEVEL_OPTIONS: readonly JlptNumericLevel[] = [5, 4, 3, 2, 1];
const SESSION_SIZES: readonly SynonymMatchSessionSize[] = [10, 15, 20];

function SynonymMatchSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();

  const initialLevels = useMemo<JlptNumericLevel[]>(() => {
    if (!levelParam) return [5];
    if (levelParam === "ALL") return [5, 4, 3, 2, 1];
    const num = parseInt(levelParam.replace("N", ""), 10);
    if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
      return [num as JlptNumericLevel];
    }
    return [5];
  }, [levelParam]);

  const [selectedLevels, setSelectedLevels] = useState<JlptNumericLevel[]>(initialLevels);
  const [scriptMode, setScriptMode] = useState<DisplayScriptMode>("exam-authentic");
  const [showSentenceTranslationHint, setShowSentenceTranslationHint] = useState<boolean>(false);
  const [size, setSize] = useState<SynonymMatchSessionSize>(10);

  const countsByLevel = useMemo(
    () => getSynonymMatchCountsByLevel(SYNONYM_MATCH_ITEMS),
    [],
  );

  const availablePoolCount = useMemo(() => {
    const levelSet = new Set(selectedLevels);
    return SYNONYM_MATCH_ITEMS.filter((item) => levelSet.has(item.jlpt)).length;
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
      setSelectedLevels([5, 4, 3, 2, 1]);
    } else {
      const num = parseInt(lvlStr.replace("N", ""), 10);
      if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
        setSelectedLevels([num as JlptNumericLevel]);
      }
    }
  }

  function handleStartSession() {
    const session = createSynonymMatchSession(SYNONYM_MATCH_ITEMS, {
      levels: selectedLevels,
      size,
      scriptMode,
      showSentenceTranslationHint,
    });
    saveGameSession("jlpt-synonym", session.sessionId, session);
    router.push(`/games/jlpt/synonym-match/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === LEVEL_OPTIONS.length
      ? "ALL"
      : formatJlptLevel(selectedLevels[0] ?? 5);

  return (
    <JlptBookletSetupShell
      label="SYNONYM PARAPHRASE · 言い換え類義"
      glyph="類"
      sectionTag="第1部：文字・語彙 · 問題 4 (言い換え類義)"
      mondaiBadge="問題 4"
      sectionTitle={
        <span>
          言い換え類義 <span className="text-xl font-normal text-[var(--muted)] sm:text-2xl">(Synonym Paraphrase Match)</span>
        </span>
      }
      sectionSubtitle="下線が引かれた言葉の意味とほぼ同じ意味を持つ文を選び出す語彙演習"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="paraphrase pairs in active pool"
      instructions={
        <p className="font-japanese text-xs sm:text-sm">
          <strong>【問題4】</strong> ＿＿のことばとだいたい同じいみの文として最もよいものを、1・2・3・4から一つえらんでください。
        </p>
      }
    >
      <div className="space-y-6">
        {/* Exam Pattern Preview Box */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              例題 · 出題パターン (Official JLPT Paraphrase Pattern)
            </span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              Mondai 4: 言い換え類義
            </span>
          </div>

          <div className="mt-4 rounded-sm border border-[var(--ink)]/15 bg-[var(--bg)]/60 p-4">
            <p className="font-japanese text-base font-medium text-[var(--ink)] sm:text-lg">
              きのうはとても
              <span className="mx-1 rounded-sm border-b-2 border-[var(--primary)] bg-[var(--sakura-light)] px-2 py-0.5 font-bold text-[var(--primary-fg)]">
                【くたびれた】
              </span>
              ので、早く寝ました。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-sm border border-[var(--correct)] bg-[var(--correct)]/10 px-2.5 py-1 font-japanese font-bold text-[var(--correct)]">
                1. つかれた ✓
              </span>
              <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                2. おどろいた
              </span>
              <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                3. こまった
              </span>
              <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                4. よろこんだ
              </span>
            </div>
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
                Choose one or more proficiency tiers ({availablePoolCount} paraphrase pairs in selected pool).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
              className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
            >
              Select All N5–N1
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {LEVEL_OPTIONS.map((lvl) => {
              const label = formatJlptLevel(lvl);
              const isSelected = selectedLevels.includes(lvl);
              const count = countsByLevel[label] ?? 0;
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleLevel(lvl)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 text-center transition ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-japanese text-lg font-black">{label}</span>
                  <span className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                    {count} pairs
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 2: Reading Support Mode (Furigana) */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <Languages size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第2問 · 表記・読み補助形式 (Reading Support Mode)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Practice with raw exam typography or display Hiragana readings above kanji in sentences and options.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={scriptMode === "exam-authentic"}
              onClick={() => setScriptMode("exam-authentic")}
              className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                scriptMode === "exam-authentic"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="text-xs font-bold sm:text-sm">
                Exam Authentic (Kanji / Kana as tested)
              </span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                No furigana shown before answering — replicates real JLPT test paper conditions.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={scriptMode === "with-furigana"}
              onClick={() => setScriptMode("with-furigana")}
              className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                scriptMode === "with-furigana"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="text-xs font-bold sm:text-sm">
                Reading Aid (Show Hiragana readings on options)
              </span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                Displays furigana ruby readings on sentence kanji and candidate options while solving.
              </span>
            </button>
          </div>
        </div>

        {/* Exam Question Box 3 & 4: English Hint & Session Length */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exam Question Box 3: English Context Hint */}
          <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
              {showSentenceTranslationHint ? (
                <Eye size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              ) : (
                <EyeOff size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              )}
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第3問 · 英語翻訳ヒント条件 (Context Hint)
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Control when the English sentence translation is shown.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                aria-pressed={!showSentenceTranslationHint}
                onClick={() => setShowSentenceTranslationHint(false)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  !showSentenceTranslationHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">
                  Reveal English translation on answer only (Official Exam)
                </p>
              </button>

              <button
                type="button"
                aria-pressed={showSentenceTranslationHint}
                onClick={() => setShowSentenceTranslationHint(true)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  showSentenceTranslationHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">Show English hint while solving</p>
              </button>
            </div>
          </div>

          {/* Exam Question Box 4: Session Length */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
                <BookOpen size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                  第4問 · 出題数設定 (Session Length)
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Number of synonym paraphrase questions in this drill.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {SESSION_SIZES.map((s) => {
                  const active = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSize(s)}
                      className={`flex flex-col items-center justify-center rounded-sm border-2 py-4 text-center transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                          : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="font-mono text-xl font-black">{s}</span>
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        questions
                      </span>
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
                {selectedLevels.map(formatJlptLevel).join(", ")} · {size}問 · {scriptMode === "exam-authentic" ? "本番表記" : "ふりがな補助"}
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
              <strong>{Math.min(size, availablePoolCount)}</strong> items selected from pool ({selectedLevels.map(formatJlptLevel).join(", ")})
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

export default function SynonymMatchSetupPage() {
  return (
    <Suspense fallback={null}>
      <SynonymMatchSetupContent />
    </Suspense>
  );
}
