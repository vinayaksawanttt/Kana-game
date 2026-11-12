"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
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
  INSTANT_REPLY_ITEMS,
  TRAP_CATEGORY_LABELS,
  createInstantReplySession,
  summarizeInstantReplySession,
  type InstantReplySession,
  type InstantReplySessionResult,
} from "@/engine/jlptInstantReply";
import { AudioButton } from "@/components/ui/AudioButton";

type ReviewFilter = "all" | "missed" | "correct";

function loadResultSummary(sessionId: string): InstantReplySessionResult | null {
  const savedResult = getGameResult<InstantReplySessionResult>("jlpt-reply", sessionId);
  if (savedResult) return savedResult;

  const session = getGameSession<InstantReplySession>("jlpt-reply", sessionId);
  if (session) {
    const computed = summarizeInstantReplySession(session);
    saveGameResult("jlpt-reply", computed);
    return computed;
  }
  return null;
}

export default function InstantReplyResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [result] = useState<InstantReplySessionResult | null>(() =>
    loadResultSummary(sessionId),
  );
  const [filter, setFilter] = useState<ReviewFilter>("all");

  useEffect(() => {
    if (result) {
      playGameSfx("victory-fanfare");
    }
  }, [result]);

  const filteredQuestions = useMemo(() => {
    if (!result) return [];
    if (filter === "missed") {
      return result.questions.filter((q) => q.status !== "correct");
    }
    if (filter === "correct") {
      return result.questions.filter((q) => q.status === "correct");
    }
    return result.questions;
  }, [filter, result]);

  function handlePracticeMissed() {
    if (!result || result.missedIds.length === 0) return;
    const nextSession = createInstantReplySession(INSTANT_REPLY_ITEMS, {
      ...result.settings,
      questionIds: result.missedIds,
      size: (result.missedIds.length <= 10
        ? 10
        : result.missedIds.length <= 15
          ? 15
          : 20) as 10 | 15 | 20,
    });
    saveGameSession("jlpt-reply", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/instant-reply/play/${nextSession.sessionId}`);
  }

  function handlePlayAgain() {
    const settings = result?.settings ?? {
      levels: [5],
      size: 10,
      timerSeconds: 8,
      autoSequenceAudio: true,
      showSituationHint: true,
    };
    const nextSession = createInstantReplySession(INSTANT_REPLY_ITEMS, {
      ...settings,
      questionIds: undefined,
    });
    saveGameSession("jlpt-reply", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/instant-reply/play/${nextSession.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="INSTANT REPLY BLITZ · RESULTS"
        glyph="応"
        homeHref="/games/jlpt"
      >
        <section className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">Session Result Not Found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This Instant Reply Blitz session was not found in local storage.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/games/jlpt/instant-reply"
              className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white"
            >
              Start New Blitz
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

  const avgSec =
    result.avgResponseTimeMs > 0
      ? `${(result.avgResponseTimeMs / 1000).toFixed(1)}s avg`
      : "—";

  return (
    <GameLayout
      label="INSTANT REPLY BLITZ · RESULTS"
      glyph="応"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
        {/* Headline & Reflex Metrics Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                JLPT Listening Mondai 4/5 · 即時応答
              </span>
              <h1 className="mt-2.5 text-2xl font-bold sm:text-3xl">
                Instant Reply Blitz Results
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Completed {result.total} spoken conversational triads · Reflex Speed:{" "}
                <strong>{avgSec}</strong>
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

          {/* 5 Metric Chips */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Passed</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--correct)]">
                {result.passedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Wrong</p>
              <p className="mt-1 text-xl font-extrabold text-[var(--wrong)]">
                {result.wrongCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-semibold text-[var(--muted)]">Timed Out</p>
              <p className="mt-1 text-xl font-extrabold text-amber-600">
                {result.timeoutCount}
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
                <span>Avg Reflex</span>
              </div>
              <p className="mt-1 text-xl font-extrabold text-[var(--ink)]">
                {avgSec}
              </p>
            </div>
          </div>

          {/* Trap Breakdown Summary */}
          {result.trapBreakdown.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--primary-fg)]">
                Trap Breakdown Summary (引っかけ傾向)
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {result.trapBreakdown.map((t) => (
                  <span
                    key={t.trapType}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--wrong)]/40 bg-[var(--wrong)]/10 px-3 py-1 text-xs font-bold text-[var(--wrong)]"
                  >
                    <AlertTriangle size={12} aria-hidden="true" />
                    <span>
                      {t.label}: {t.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Dialogue Review Table */}
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Interactive Dialogue Review Table</h2>
              <p className="text-xs text-[var(--muted)]">
                Replay Speaker A&apos;s prompt, the natural reply, and inspect any traps triggered.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">
              {(
                [
                  { id: "all", label: `All (${result.questions.length})` },
                  {
                    id: "missed",
                    label: `Missed / Timed Out (${result.missedIds.length})`,
                  },
                  { id: "correct", label: `Correct (${result.passedCount})` },
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
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-3 pr-3">Speaker A Prompt</th>
                  <th className="py-3 px-3">Correct Reply</th>
                  <th className="py-3 px-3">Your Choice &amp; Trap</th>
                  <th className="py-3 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredQuestions.map((q) => {
                  const correctOpt = q.options[q.correctOptionIndex];
                  const chosenOpt =
                    q.chosenIndex !== null ? q.options[q.chosenIndex] : null;
                  const isCorrect = q.status === "correct";

                  return (
                    <tr key={q.id} className="align-top">
                      <td className="py-4 pr-3 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <AudioButton
                            text={q.promptJa}
                            reading={q.promptReading}
                            mode="sentence"
                            size="sm"
                            label={`Listen to ${q.promptJa}`}
                          />
                          <div>
                            <span className="rounded bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--primary-fg)]">
                              {q.levelLabel} · {q.situationContext}
                            </span>
                            <p className="mt-1 font-japanese font-bold text-[var(--ink)]">
                              {q.promptJa}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {q.promptEn}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          <AudioButton
                            text={correctOpt.ja}
                            reading={correctOpt.reading}
                            mode="sentence"
                            size="sm"
                            label={`Listen to ${correctOpt.ja}`}
                          />
                          <div>
                            <p className="font-japanese font-bold text-[var(--correct)]">
                              {correctOpt.ja}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {correctOpt.en}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 max-w-xs">
                        {chosenOpt ? (
                          <div>
                            <p
                              className={`font-japanese font-bold ${
                                isCorrect ? "text-[var(--correct)]" : "text-[var(--wrong)]"
                              }`}
                            >
                              {chosenOpt.ja}
                            </p>
                            {q.trapTriggered && (
                              <span className="mt-1 inline-block rounded bg-[var(--wrong)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--wrong)]">
                                {TRAP_CATEGORY_LABELS[q.trapTriggered]}
                              </span>
                            )}
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {chosenOpt.explanation}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs italic text-[var(--muted)]">
                              {q.status === "timeout" ? "Timed out (no reply)" : "Skipped"}
                            </span>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {correctOpt.explanation}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-4 pl-3 text-right">
                        {q.status === "correct" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--correct)]/15 px-2.5 py-1 text-xs font-bold text-[var(--correct)]">
                            <CheckCircle2 size={13} aria-hidden="true" />
                            Passed
                          </span>
                        ) : q.status === "timeout" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">
                            <Clock size={13} aria-hidden="true" />
                            Timeout
                          </span>
                        ) : q.status === "wrong" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--wrong)]/15 px-2.5 py-1 text-xs font-bold text-[var(--wrong)]">
                            <XCircle size={13} aria-hidden="true" />
                            Wrong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
                            Skipped
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

        {/* Footer Actions */}
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
                <span>Practice Missed Dialogues ({result.missedIds.length})</span>
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
