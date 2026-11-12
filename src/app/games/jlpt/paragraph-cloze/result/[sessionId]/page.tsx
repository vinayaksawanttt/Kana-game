"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import {
  getGameResult,
  getGameSession,
  saveGameResult,
  saveGameSession,
} from "@/lib/game-core/storage";
import {
  PARAGRAPH_CLOZE_PASSAGES,
  calculateParagraphClozeResult,
  createParagraphClozeSession,
  formatJlptLevel,
  type ParagraphClozeResultSummary,
  type ParagraphClozeSession,
} from "@/engine/jlptParagraphCloze";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { AudioButton } from "@/components/ui/AudioButton";

function formatDuration(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function loadResultSummary(sessionId: string): ParagraphClozeResultSummary | null {
  const saved = getGameResult<ParagraphClozeResultSummary>("jlpt-cloze", sessionId);
  if (saved) return saved;

  const session = getGameSession<ParagraphClozeSession>("jlpt-cloze", sessionId);
  if (session) {
    const computed = calculateParagraphClozeResult(session);
    saveGameResult("jlpt-cloze", computed);
    return computed;
  }
  return null;
}

export default function ParagraphClozeResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [result] = useState<ParagraphClozeResultSummary | null>(() =>
    loadResultSummary(sessionId)
  );
  const { playSentence } = useJapaneseAudio();

  useEffect(() => {
    if (result) {
      playGameSfx("victory-fanfare");
    }
  }, [result]);

  const [activeTab, setActiveTab] = useState<"review" | "categories">("review");

  function handlePlayAgain() {
    if (!result) return;
    const newSession = createParagraphClozeSession(
      PARAGRAPH_CLOZE_PASSAGES,
      result.settings
    );
    saveGameSession("jlpt-cloze", newSession.sessionId, newSession);
    router.push(`/games/jlpt/paragraph-cloze/play/${newSession.sessionId}`);
  }

  function handlePracticeMissed() {
    if (!result || result.missedPassageIds.length === 0) return;
    const newSession = createParagraphClozeSession(
      PARAGRAPH_CLOZE_PASSAGES,
      {
        ...result.settings,
        passageIds: result.missedPassageIds,
        passageCount: Math.min(
          result.missedPassageIds.length,
          result.settings.passageCount
        ) as 2 | 3 | 5,
      }
    );
    saveGameSession("jlpt-cloze", newSession.sessionId, newSession);
    router.push(`/games/jlpt/paragraph-cloze/play/${newSession.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="PARAGRAPH FLOW CLOZE · 文章の文法"
        glyph="文"
        homeHref="/games/jlpt"
      >
        <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
          <p className="text-base font-semibold text-[var(--muted)]">
            No session results found for this drill.
          </p>
          <Link
            href="/games/jlpt/paragraph-cloze"
            className="mt-4 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            Start New Cloze Session
          </Link>
        </div>
      </GameLayout>
    );
  }

  const isGreatScore = result.accuracy >= 80;

  return (
    <GameLayout
      label="PARAGRAPH FLOW CLOZE · 成績表"
      glyph="文"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 sm:px-8">
        {/* Score Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                Official Mondai 3 · Cloze Performance
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {isGreatScore ? "素晴しい！ Outstanding Flow!" : "Drill Complete · 練習完了"}
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                Paragraph Flow Cloze (文章の文法 パッセージ穴埋め)
              </p>
            </div>

            {/* Overall Accuracy Radial / Badge */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] px-6 py-4">
              <span className="text-4xl font-black text-[var(--primary-fg)] sm:text-5xl">
                {result.accuracy}%
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Overall Accuracy
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                Blanks Correct
              </span>
              <p className="mt-0.5 text-lg font-bold text-[var(--success)]">
                {result.score} / {result.totalBlanks}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                Perfect Passages
              </span>
              <p className="mt-0.5 text-lg font-bold text-[var(--ink)]">
                {result.perfectPassagesCount} / {result.totalPassages}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                Total Time
              </span>
              <p className="mt-0.5 text-lg font-bold text-[var(--ink)]">
                {formatDuration(result.totalTimeMs)}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                Missed Passages
              </span>
              <p className="mt-0.5 text-lg font-bold text-[var(--primary-fg)]">
                {result.missedPassageIds.length}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
            {result.missedPassageIds.length > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissed}
                className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
              >
                <RotateCcw className="size-4" />
                <span>Practice Missed Passages ({result.missedPassageIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePlayAgain}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--primary)]"
            >
              <RotateCcw className="size-4" />
              <span>Play Again (Same Settings)</span>
            </button>

            <Link
              href="/games/jlpt"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to JLPT Exam Arena</span>
            </Link>
          </div>
        </div>

        {/* Tab Controls: Review vs Category Breakdown */}
        <div className="mt-8 flex gap-2 border-b border-[var(--line)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "review"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Passage-by-Passage Review ({result.passageResults.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "categories"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Discourse Category Breakdown ({result.categoryBreakdown.length})
          </button>
        </div>

        {/* TAB 1: PASSAGE REVIEW ACCORDION */}
        {activeTab === "review" && (
          <div className="mt-6 flex flex-col gap-6">
            {result.passageResults.map((pr, prIdx) => {
              const allCorrect = pr.answers.every((a) => a.isCorrect);

              return (
                <div
                  key={pr.passage.id}
                  className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm"
                >
                  {/* Passage Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary-fg)]">
                          {formatJlptLevel(pr.passage.jlpt)}
                        </span>
                        <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                          {pr.passage.sourceType === "story-scene"
                            ? "Story Scene"
                            : "Exam Speech"}
                        </span>
                        {allCorrect ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--success)]">
                            <CheckCircle2 className="size-4" /> Perfect
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--danger)]">
                            <XCircle className="size-4" /> Review Required
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2 font-japanese text-lg font-bold text-[var(--ink)] sm:text-xl">
                        {pr.passage.titleJa}
                      </h2>
                      <p className="text-xs text-[var(--muted)]">
                        {pr.passage.titleEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {pr.passage.linkedStory && (
                        <Link
                          href={`/stories/${pr.passage.linkedStory.level.toLowerCase()}/${pr.passage.linkedStory.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                        >
                          <span>Open Full Story</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Blanks Breakdown Table */}
                  <div className="mt-4 flex flex-col gap-3">
                    {pr.answers.map((ans) => {
                      return (
                        <div
                          key={ans.blankIndex}
                          className={`rounded-2xl border p-4 text-xs ${
                            ans.isCorrect
                              ? "border-[var(--success)]/40 bg-[var(--success-soft)]/40"
                              : "border-[var(--danger)]/30 bg-[var(--danger)]/5"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex size-6 items-center justify-center rounded-full font-bold text-white ${
                                  ans.isCorrect
                                    ? "bg-[var(--success)]"
                                    : "bg-[var(--danger)]"
                                }`}
                              >
                                {ans.displayNumber}
                              </span>
                              <span className="font-semibold text-[var(--muted)]">
                                Blank [ {ans.displayNumber} ] ·{" "}
                                {ans.category}
                              </span>
                            </div>

                            <span
                              className={`font-bold ${
                                ans.isCorrect
                                  ? "text-[var(--success)]"
                                  : "text-[var(--danger)]"
                              }`}
                            >
                              {ans.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>

                          {/* Choices Comparison */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-3 font-japanese text-sm">
                            <div>
                              <span className="text-[11px] font-normal text-[var(--muted)] block">
                                Correct Answer:
                              </span>
                              <span className="font-bold text-[var(--success)]">
                                {ans.correctTextJa}
                              </span>
                            </div>

                            {!ans.isCorrect && (
                              <div className="border-l border-[var(--line)] pl-3">
                                <span className="text-[11px] font-normal text-[var(--muted)] block">
                                  Your Choice:
                                </span>
                                <span className="font-bold text-[var(--danger)] line-through">
                                  {ans.chosenTextJa ?? "未回答 (Skipped)"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Clue Quote & Explanation */}
                          <div className="mt-3 border-t border-[var(--line)] pt-2.5 text-xs text-[var(--ink)]">
                            <span className="font-semibold text-[var(--primary)] font-japanese">
                              Clue: 「{ans.contextClueQuoteJa}」
                            </span>
                            <p className="mt-1 leading-relaxed text-[var(--muted)]">
                              {ans.discourseRuleEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: DISCOURSE CATEGORY BREAKDOWN */}
        {activeTab === "categories" && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[var(--ink)]">
                Discourse Grammar Mastery by Category
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Evaluates how well you understand cross-sentence flow, perspective, and discourse connectors.
              </p>

              <div className="mt-6 flex flex-col gap-5">
                {result.categoryBreakdown.map((cat) => {
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--ink)]">
                          {cat.labelJa} · {cat.labelEn}
                        </span>
                        <span className="font-bold text-[var(--primary-fg)]">
                          {cat.correct} / {cat.total} ({cat.accuracy}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.accuracy >= 80
                              ? "bg-[var(--success)]"
                              : cat.accuracy >= 50
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--danger)]"
                          }`}
                          style={{ width: `${cat.accuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Level Accuracy Breakdown */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[var(--ink)]">
                Performance by JLPT Level
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {result.byLevel.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4 text-center"
                  >
                    <span className="text-base font-extrabold text-[var(--primary-fg)]">
                      {lvl.levelLabel}
                    </span>
                    <span className="text-xs font-bold text-[var(--ink)]">
                      {lvl.correctBlanks} / {lvl.totalBlanks}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      {lvl.accuracy}% Accuracy
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </GameLayout>
  );
}
