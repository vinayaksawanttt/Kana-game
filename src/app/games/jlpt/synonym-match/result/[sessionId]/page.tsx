"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getGameResult,
  getGameSession,
  saveGameResult,
  saveGameSession,
} from "@/lib/game-core/storage";
import {
  SYNONYM_MATCH_ITEMS,
  createSynonymMatchSession,
  summarizeSynonymMatchSession,
  type SynonymMatchResultSummary,
  type SynonymMatchSession,
} from "@/engine/jlptSynonymMatch";
import { AudioButton } from "@/components/ui/AudioButton";

type ReviewFilter = "all" | "missed" | "correct";

function formatDuration(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function loadResultSummary(sessionId: string): SynonymMatchResultSummary | null {
  const savedResult = getGameResult<SynonymMatchResultSummary>("jlpt-synonym", sessionId);
  if (savedResult) return savedResult;

  const session = getGameSession<SynonymMatchSession>("jlpt-synonym", sessionId);
  if (session) {
    const computed = summarizeSynonymMatchSession(session);
    saveGameResult("jlpt-synonym", computed);
    return computed;
  }
  return null;
}

export default function SynonymMatchResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [result] = useState<SynonymMatchResultSummary | null>(() =>
    loadResultSummary(sessionId),
  );
  const [filter, setFilter] = useState<ReviewFilter>("all");

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
    const nextSession = createSynonymMatchSession(SYNONYM_MATCH_ITEMS, {
      ...result.settings,
      questionIds: result.missedIds,
      size: (result.missedIds.length <= 10
        ? 10
        : result.missedIds.length <= 15
          ? 15
          : 20) as 10 | 15 | 20,
    });
    saveGameSession("jlpt-synonym", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/synonym-match/play/${nextSession.sessionId}`);
  }

  function handlePlayAgain() {
    const settings = result?.settings ?? {
      levels: [5],
      size: 10,
      scriptMode: "exam-authentic",
      showSentenceTranslationHint: false,
    };
    const nextSession = createSynonymMatchSession(SYNONYM_MATCH_ITEMS, {
      ...settings,
      questionIds: undefined,
    });
    saveGameSession("jlpt-synonym", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/synonym-match/play/${nextSession.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="SYNONYM PARAPHRASE · RESULTS"
        glyph="類"
        homeHref="/games/jlpt"
      >
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">Session Result Not Found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This synonym drill session was not found in local storage.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/games/jlpt/synonym-match"
              className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white"
            >
              Start New Synonym Drill
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

  return (
    <GameLayout
      label="SYNONYM PARAPHRASE · RESULTS"
      glyph="類"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
        {/* Headline & Summary Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                JLPT Mondai 5 · 言い換え類義
              </span>
              <h1 className="mt-2.5 text-2xl font-bold sm:text-3xl">
                Synonym Paraphrase Results
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Reviewed {result.total} Japanese-to-Japanese paraphrase pairs across{" "}
                {result.byLevel.map((b) => b.levelLabel).join(", ")}.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-[var(--sakura)] bg-[var(--sakura-light)]/50 px-5 py-3.5 text-center">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                  Score
                </p>
                <p className="text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
                  {result.score} / {result.total}
                </p>
              </div>
              <div className="h-9 w-px bg-[var(--sakura)]" />
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                  Accuracy
                </p>
                <p className="text-2xl font-extrabold text-[var(--primary-fg)] sm:text-3xl">
                  {result.accuracy}%
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stat Chips */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Correct</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--correct)]">
                {result.correctCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Wrong</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--wrong)]">
                {result.wrongCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Skipped</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                {result.skippedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
                <Clock size={13} aria-hidden="true" />
                <span>Total Time</span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                {formatDuration(result.totalTimeMs)}
              </p>
            </div>
          </div>

          {/* Breakdown by JLPT Level */}
          {result.byLevel.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                By Level:
              </span>
              {result.byLevel.map((lvl) => (
                <span
                  key={lvl.jlpt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold"
                >
                  <span className="text-[var(--primary-fg)]">{lvl.levelLabel}</span>
                  <span>
                    {lvl.correct}/{lvl.total} ({lvl.accuracy}%)
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Synonym Pair Review Table */}
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Synonym Pair Review Table</h2>
              <p className="text-xs text-[var(--muted)]">
                Inspect every target vocabulary word, its closest synonym, and shared meaning.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">
              {(
                [
                  { id: "all", label: `All (${result.rows.length})` },
                  { id: "missed", label: `Missed / Skipped (${result.missedIds.length})` },
                  { id: "correct", label: `Correct (${result.correctCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === tab.id
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-3 pr-3">Audio</th>
                  <th className="py-3 px-3">Target Word</th>
                  <th className="py-3 px-3">≈ Closest Synonym</th>
                  <th className="py-3 px-3">Shared Meaning</th>
                  <th className="py-3 px-3">Your Choice</th>
                  <th className="py-3 pl-3 text-right">Result Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredRows.map(({ question, answer }) => {
                  const isCorrect = answer.status === "correct";
                  const isSkipped = answer.status === "skipped";
                  return (
                    <tr key={question.id} className="align-middle">
                      <td className="py-3.5 pr-3">
                        <AudioButton
                          text={question.sentenceJa}
                          mode="sentence"
                          size="sm"
                          label={`Listen to ${question.sentenceJa}`}
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--primary-fg)]">
                            {question.levelLabel}
                          </span>
                          <div>
                            <p className="font-japanese font-bold text-[var(--ink)]">
                              {question.targetWord}
                            </p>
                            <p className="font-japanese text-xs text-[var(--muted)]">
                              {question.targetReading}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-japanese font-bold text-[var(--correct)]">
                          ≈ {question.correctSynonym.word}
                        </p>
                        <p className="font-japanese text-xs text-[var(--muted)]">
                          {question.correctSynonym.reading}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          {question.targetMeaningEn}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)] line-clamp-2">
                          {question.sentenceJa}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 font-japanese">
                        {isSkipped ? (
                          <span className="text-xs italic text-[var(--muted)]">
                            Skipped
                          </span>
                        ) : (
                          <span
                            className={`font-bold ${
                              isCorrect ? "text-[var(--correct)]" : "text-[var(--wrong)]"
                            }`}
                          >
                            {answer.chosenWord}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--correct)]/15 px-2.5 py-1 text-xs font-bold text-[var(--correct)]">
                            <CheckCircle2 size={13} aria-hidden="true" />
                            Correct
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--wrong)]/15 px-2.5 py-1 text-xs font-bold text-[var(--wrong)]">
                            <XCircle size={13} aria-hidden="true" />
                            Wrong
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/games/jlpt"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--primary)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to JLPT Arena</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {result.missedIds.length > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissed}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--sakura-light)] px-6 py-3 text-sm font-bold text-[var(--primary-fg)] transition hover:opacity-90"
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>Practice Missed Pairs ({result.missedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePlayAgain}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
