"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Eye, EyeOff, Languages, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
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

  return (
    <GameLayout
      label="SYNONYM PARAPHRASE · 言い換え類義"
      glyph="類"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        {/* Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT &amp; NAT Vocabulary · Mondai 5
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              言い換え類義・問題5
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Synonym Paraphrase Match{" "}
            <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
              (言い換え類義)
            </span>
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            In Official JLPT Vocabulary <em>Mondai 5</em>, you read a Japanese sentence with a highlighted target word and choose which of <strong>4 Japanese vocabulary options</strong> can replace it without changing the sentence&apos;s core meaning.
          </p>

          {/* Example Preview Banner */}
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              Exam Question Pattern
            </p>
            <p className="mt-1.5 font-japanese text-lg font-medium text-[var(--ink)] sm:text-xl">
              きのうはとても
              <span className="mx-1 rounded-lg border-b-2 border-[var(--primary)] bg-[var(--sakura-light)] px-2 py-0.5 font-bold text-[var(--primary-fg)]">
                【くたびれた】
              </span>
              ので、早く寝ました。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg border border-[var(--correct)] bg-[var(--correct)]/10 px-2.5 py-1 font-japanese font-bold text-[var(--correct)]">
                1. つかれた ✓
              </span>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                2. おどろいた
              </span>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                3. こまった
              </span>
              <span className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-japanese text-[var(--muted)]">
                4. よろこんだ
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Cards */}
        <div className="mt-6 space-y-6">
          {/* 1. JLPT Level Multi-Select */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">1. Select JLPT Levels (Multi-Select)</h2>
                <p className="text-xs text-[var(--muted)]">
                  Choose one or more proficiency tiers ({availablePoolCount} paraphrase pairs in selected pool).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
                className="text-xs font-bold text-[var(--primary-fg)] hover:underline"
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
                    className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <span className="text-lg font-extrabold">{label}</span>
                    <span className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                      {count} pairs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Reading Support Mode */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-2">
              <Languages size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <h2 className="text-base font-bold">2. Reading Support Mode (Furigana)</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Practice with raw exam typography or display Hiragana readings above kanji in sentences and options.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={scriptMode === "exam-authentic"}
                onClick={() => setScriptMode("exam-authentic")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  scriptMode === "exam-authentic"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                }`}
              >
                <span className="text-sm font-bold">
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
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  scriptMode === "with-furigana"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                }`}
              >
                <span className="text-sm font-bold">
                  Reading Aid (Show Hiragana readings on options)
                </span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  Displays furigana ruby readings on sentence kanji and candidate options while solving.
                </span>
              </button>
            </div>
          </div>

          {/* 3. English Context Hint & Session Length */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* English Context Hint */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-2">
                {showSentenceTranslationHint ? (
                  <Eye size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                ) : (
                  <EyeOff size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                )}
                <h2 className="text-base font-bold">3. English Context Hint</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Control when the English sentence translation is shown.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  aria-pressed={!showSentenceTranslationHint}
                  onClick={() => setShowSentenceTranslationHint(false)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    !showSentenceTranslationHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <p className="text-xs font-bold">
                    Reveal English sentence translation on answer only (Official Exam)
                  </p>
                </button>

                <button
                  type="button"
                  aria-pressed={showSentenceTranslationHint}
                  onClick={() => setShowSentenceTranslationHint(true)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    showSentenceTranslationHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <p className="text-xs font-bold">Show English hint while solving</p>
                </button>
              </div>
            </div>

            {/* Session Length */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                <h2 className="text-base font-bold">4. Session Length</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
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
                      className={`flex flex-col items-center justify-center rounded-xl border py-4 text-center transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                      }`}
                    >
                      <span className="text-xl font-extrabold">{s}</span>
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        questions
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
            <Sparkles size={16} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span>
              Ready with <strong>{Math.min(size, availablePoolCount)}</strong> questions from{" "}
              <strong>{selectedLevels.map(formatJlptLevel).join(", ")}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <span>Start Synonym Paraphrase Drill</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </GameLayout>
  );
}

export default function SynonymMatchSetupPage() {
  return (
    <Suspense fallback={null}>
      <SynonymMatchSetupContent />
    </Suspense>
  );
}
