"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
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
  WORD_USAGE_ITEMS,
  createWordUsageSession,
  summarizeWordUsageSession,
  type WordUsageResultSummary,
  type WordUsageSession,
} from "@/engine/jlptWordUsage";
import { AudioButton } from "@/components/ui/AudioButton";

type ReviewFilter = "all" | "missed" | "correct";

function formatDuration(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function loadResultSummary(sessionId: string): WordUsageResultSummary | null {
  const savedResult = getGameResult<WordUsageResultSummary>("jlpt-usage", sessionId);
  if (savedResult) return savedResult;

  const session = getGameSession<WordUsageSession>("jlpt-usage", sessionId);
  if (session) {
    const computed = summarizeWordUsageSession(session);
    saveGameResult("jlpt-usage", computed);
    return computed;
  }
  return null;
}

export default function WordUsageResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [result] = useState<WordUsageResultSummary | null>(() =>
    loadResultSummary(sessionId),
  );
  const [filter, setFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    if (result) {
      playGameSfx("victory-fanfare");
    }
  }, [result]);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    if (filter === "missed") {
      return result.rows.filter((r) => r.answer.status !== "correct");
    }
    if (filter === "correct") {
      return result.rows.filter((r) => r.answer.status === "correct");
    }
    return result.rows;
  }, [filter, result]);

  function handlePracticeMissed() {
    if (!result || result.missedIds.length === 0) return;
    const nextSession = createWordUsageSession(WORD_USAGE_ITEMS, {
      ...result.settings,
      questionIds: result.missedIds,
      size: result.missedIds.length,
    });
    saveGameSession("jlpt-usage", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/word-usage/play/${nextSession.sessionId}`);
  }

  function handlePlayAgain() {
    const settings = result?.settings ?? {
      levels: [4],
      size: 10,
      showEnglishTranslations: false,
    };
    const nextSession = createWordUsageSession(WORD_USAGE_ITEMS, {
      ...settings,
      questionIds: undefined,
    });
    saveGameSession("jlpt-usage", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/word-usage/play/${nextSession.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="WORD USAGE JUDGE · RESULTS"
        glyph="用"
        homeHref="/games/jlpt"
      >
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">Session Result Not Found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This Word Usage drill session could not be found in local storage.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/games/jlpt/word-usage"
              className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white"
            >
              Start New Word Usage Drill
            </Link>
            <Link
              href="/games/jlpt"
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-2.5 text-sm font-bold"
            >
              Back to JLPT Arena
            </Link>
          </div>
        </section>
      </GameLayout>
    );
  }

  const isPassing = result.accuracy >= 70;

  return (
    <GameLayout
      label="WORD USAGE JUDGE · RESULTS"
      glyph="用"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
        {/* Headline & Summary Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                JLPT Mondai 5 · 語彙・用法
              </span>
              <h1 className="mt-2.5 text-2xl font-bold sm:text-3xl">
                Word Usage Results
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Completed on {new Date(result.completedAt).toLocaleDateString()} · {formatDuration(result.totalTimeMs)} total time
              </p>
            </div>

            {/* Hanko-Style Result Stamp */}
            <div
              className={`rounded-2xl border-2 px-5 py-3 text-center shadow-xs ${
                isPassing
                  ? "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--correct)]"
                  : "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
              }`}
            >
              <div className="font-japanese text-xs font-extrabold">
                {isPassing ? "合格圏内" : "要復習"}
              </div>
              <div className="font-mono text-3xl font-black">
                {result.accuracy}%
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Score
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-[var(--primary-fg)]">
                {result.score} / {result.total}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Correct
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-[var(--correct)]">
                {result.correctCount}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Mistakes
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-[var(--destructive)]">
                {result.wrongCount}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Skipped
              </div>
              <div className="mt-1 font-mono text-2xl font-black text-[var(--muted)]">
                {result.skippedCount}
              </div>
            </div>
          </div>

          {/* By-Level Performance Breakdown */}
          {result.byLevel.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Performance by JLPT Level
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {result.byLevel.map((lvl) => (
                  <div
                    key={lvl.jlpt}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"
                  >
                    <div>
                      <span className="font-japanese font-black text-sm text-[var(--ink)]">
                        {lvl.levelLabel}
                      </span>
                      <div className="text-[11px] text-[var(--muted)]">
                        {lvl.correct} / {lvl.total} correct
                      </div>
                    </div>
                    <span
                      className={`font-mono text-sm font-black ${
                        lvl.accuracy >= 70
                          ? "text-[var(--correct)]"
                          : "text-[var(--primary-fg)]"
                      }`}
                    >
                      {lvl.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {result.missedIds.length > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissed}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Practice Missed Word Usage ({result.missedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePlayAgain}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-xs font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Play Again</span>
            </button>

            <Link
              href="/games/jlpt"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to JLPT Hub</span>
            </Link>
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Detailed Question Review</h2>
              <p className="text-xs text-[var(--muted)]">
                Examine correct collocations and explanations for incorrect options.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  filter === "all"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                All ({result.total})
              </button>
              <button
                type="button"
                onClick={() => setFilter("missed")}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  filter === "missed"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Missed ({result.wrongCount + result.skippedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("correct")}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  filter === "correct"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                Correct ({result.correctCount})
              </button>
            </div>
          </div>

          {/* Rows List */}
          <div className="mt-4 space-y-4">
            {filteredRows.map((row, idx) => {
              const { question, answer } = row;
              const isCorrect = answer.status === "correct";
              const isSkipped = answer.status === "skipped";

              return (
                <div
                  key={question.id || idx}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)]/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 font-japanese text-xs font-black text-[var(--primary-fg)]">
                        {question.levelLabel}
                      </span>
                      <span className="font-japanese text-lg font-black text-[var(--ink)]">
                        {question.word}
                      </span>
                      <span className="font-japanese text-xs text-[var(--muted)]">
                        ({question.reading})
                      </span>
                      <AudioButton text={question.word} size="sm" />
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--correct)]">
                          <CheckCircle2 size={16} />
                          Correct
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
                          Skipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--destructive)]">
                          <XCircle size={16} />
                          Incorrect
                        </span>
                      )}
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {Math.round((answer.timeMs || 0) / 100) / 10}s
                      </span>
                    </div>
                  </div>

                  {/* Options with Explanations */}
                  <div className="mt-3 space-y-2">
                    {question.options.map((opt, optIdx) => {
                      const isOptionCorrect = opt.isCorrect;
                      const wasChosen = answer.chosenOptionIndex === optIdx;

                      let optBg = "bg-[var(--bg)]/40 border-[var(--line)]/50";
                      if (isOptionCorrect) {
                        optBg = "bg-[var(--correct)]/10 border-[var(--correct)]/40";
                      } else if (wasChosen && !isOptionCorrect) {
                        optBg = "bg-[var(--destructive)]/10 border-[var(--destructive)]/40";
                      }

                      return (
                        <div
                          key={opt.id || optIdx}
                          className={`rounded-xl border p-3 text-xs leading-relaxed ${optBg}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-mono font-bold text-[var(--muted)]">
                              {optIdx + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="font-japanese text-sm font-semibold text-[var(--ink)]">
                                {opt.sentenceJa}
                              </p>
                              {opt.sentenceEn && (
                                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                                  {opt.sentenceEn}
                                </p>
                              )}
                              <p className="mt-1 font-sans text-[11px] text-[var(--muted)]">
                                <span className="font-bold">
                                  {isOptionCorrect ? "✓ 解説: " : "× 不自然: "}
                                </span>
                                {opt.explanation}
                              </p>
                            </div>

                            {isOptionCorrect && (
                              <span className="shrink-0 rounded-full bg-[var(--correct)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--correct)]">
                                Correct Usage
                              </span>
                            )}
                            {wasChosen && !isOptionCorrect && (
                              <span className="shrink-0 rounded-full bg-[var(--destructive)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--destructive)]">
                                Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
