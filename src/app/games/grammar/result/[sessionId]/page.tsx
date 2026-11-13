"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, BookOpen, Check, Clock, RotateCcw, Sparkles, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { formatTime } from "@/lib/game-core/time";
import { getGameResult, saveGameSession } from "@/lib/game-core/storage";
import {
  createGrammarSession,
  type GrammarQuestionResult,
  type GrammarQuestionStatus,
  type GrammarSessionResult,
} from "@/engine/grammarSession";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";

type Filter = "All" | "Wrong" | "Unanswered" | "Correct";

function CircularAccuracy({ percentage }: { percentage: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const strokeColor =
    percentage >= 80 ? "var(--correct)" : percentage >= 60 ? "var(--primary)" : "var(--wrong)";

  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg className="size-full -rotate-90 transform" viewBox="0 0 96 96" aria-hidden="true">
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-[var(--line)]"
          strokeWidth="7"
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={strokeColor}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-[var(--ink)] tabular-nums">{percentage}%</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Score
        </span>
      </div>
    </div>
  );
}

export default function GrammarResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Calculating Performance..." size="md" />
        </main>
      }
    >
      <GrammarResultContent />
    </Suspense>
  );
}

function GrammarResultContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<GrammarSessionResult | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = getGameResult<GrammarSessionResult>("grammar", sessionId);
    if (!saved || saved.sessionId !== sessionId) {
      router.replace("/games/grammar");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(saved);
    playGameSfx("victory-fanfare");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!result) return null;
    const correct = result.questions.filter((q) => q.status === "correct").length;
    const wrong = result.questions.filter((q) => q.status === "wrong").length;
    const unanswered = result.questions.filter((q) => q.status === "unanswered").length;
    const total = result.questions.length;
    const answered = correct + wrong;
    const elapsed = result.endedAt - result.startedAt;
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    const answeredAccuracy = answered ? Math.round((correct / answered) * 100) : 0;
    return {
      correct,
      wrong,
      unanswered,
      answered,
      total,
      elapsed,
      percentage,
      answeredAccuracy,
    };
  }, [result]);

  const weakPatterns = useMemo(() => {
    if (!result) return [];
    const grouped = new Map<
      string,
      {
        grammarId: string;
        grammarSlug: string;
        grammarPattern: string;
        grammarTitle: string;
        shortExplanation: string;
        level: GrammarQuestionResult["level"];
        wrongCount: number;
        unansweredCount: number;
      }
    >();
    for (const q of result.questions) {
      if (q.status === "correct") continue;
      const existing = grouped.get(q.grammarId);
      if (existing) {
        if (q.status === "wrong") existing.wrongCount += 1;
        else existing.unansweredCount += 1;
      } else {
        grouped.set(q.grammarId, {
          grammarId: q.grammarId,
          grammarSlug: q.grammarSlug,
          grammarPattern: q.grammarPattern,
          grammarTitle: q.grammarTitle,
          shortExplanation: q.shortExplanation,
          level: q.level,
          wrongCount: q.status === "wrong" ? 1 : 0,
          unansweredCount: q.status === "unanswered" ? 1 : 0,
        });
      }
    }
    return [...grouped.values()];
  }, [result]);

  if (!result || !stats) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Calculating Performance..." size="md" />
      </main>
    );
  }

  const filterTabs: Filter[] =
    stats.unanswered > 0 ? ["All", "Wrong", "Unanswered", "Correct"] : ["All", "Wrong", "Correct"];
  const filtered = result.questions.filter(
    (q) => filter === "All" || q.status.toLowerCase() === filter.toLowerCase()
  );
  const missedGrammarIds = [
    ...new Set(result.questions.filter((q) => q.status !== "correct").map((q) => q.grammarId)),
  ];

  async function startPractice(missedOnly: boolean) {
    if (!result || working) return;
    setWorking(true);
    setError("");
    try {
      const nextSession = await createGrammarSession({
        levels: result.settings.levels,
        size: result.settings.size,
        clozeRatio: result.settings.clozeRatio,
        ...(missedOnly ? { grammarIds: missedGrammarIds } : {}),
      });
      saveGameSession("grammar", nextSession.sessionId, nextSession);
      router.push(`/games/grammar/play/${nextSession.sessionId}`);
    } catch (startError) {
      console.error("Could not start grammar session.", startError);
      setError("A new session could not be started.");
      setWorking(false);
    }
  }

  const correctPct = stats.total ? (stats.correct / stats.total) * 100 : 0;
  const wrongPct = stats.total ? (stats.wrong / stats.total) * 100 : 0;
  const unansweredPct = stats.total ? (stats.unanswered / stats.total) * 100 : 0;

  return (
    <GameLayout label="GRAMMAR" glyph="文">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 sm:px-8">
        <div className="space-y-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          {/* Top Overview */}
          <div className="flex flex-col justify-between gap-6 border-b border-[var(--line)] pb-6 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-5">
              <CircularAccuracy percentage={stats.percentage} />
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {result.endedEarly ? "Session ended early" : "Session complete"}
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">Grammar practice results</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <span>Levels: {result.settings.levels.join(", ")}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} aria-hidden="true" /> {formatTime(stats.elapsed)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Overall
                </span>
                <span className="text-lg font-black text-[var(--ink)] tabular-nums">
                  {stats.correct} / {stats.total}
                </span>
                <span className="block text-[11px] text-[var(--muted)]">
                  {stats.percentage}% completion
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Answered Accuracy
                </span>
                <span className="text-lg font-black text-[var(--primary)] tabular-nums">
                  {stats.answeredAccuracy}%
                </span>
                <span className="block text-[11px] text-[var(--muted)]">
                  {stats.correct} of {stats.answered} answered
                </span>
              </div>
              <div className="rounded-xl border border-[var(--correct)]/30 bg-[var(--correct)]/8 px-3.5 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--correct)]">
                  Correct
                </span>
                <span className="text-lg font-black text-[var(--ink)] tabular-nums">
                  {stats.correct}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--wrong)]/30 bg-[var(--wrong)]/8 px-3.5 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--wrong)]">
                  Incorrect
                </span>
                <span className="text-lg font-black text-[var(--ink)] tabular-nums">
                  {stats.wrong}
                </span>
                {stats.unanswered > 0 && (
                  <span className="block text-[11px] font-semibold text-[var(--muted)]">
                    Unanswered: {stats.unanswered}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Horizontal Breakdown Bar */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--muted)]">
              <span>Response Breakdown</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--correct)]" /> Correct: {stats.correct}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[var(--wrong)]" /> Wrong: {stats.wrong}
                </span>
                {stats.unanswered > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--muted)]" /> Unanswered:{" "}
                    {stats.unanswered}
                  </span>
                )}
              </div>
            </div>
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]"
              role="img"
              aria-label={`Correct ${stats.correct}, Wrong ${stats.wrong}, Unanswered ${stats.unanswered}`}
            >
              {correctPct > 0 && (
                <div className="bg-[var(--correct)]" style={{ width: `${correctPct}%` }} />
              )}
              {wrongPct > 0 && (
                <div className="bg-[var(--wrong)]" style={{ width: `${wrongPct}%` }} />
              )}
              {unansweredPct > 0 && (
                <div className="bg-[var(--muted)]/45" style={{ width: `${unansweredPct}%` }} />
              )}
            </div>
          </div>

          {/* Weak Grammar Patterns Section */}
          {weakPatterns.length > 0 ? (
            <div className="rounded-xl border border-[var(--sakura)] bg-[var(--sakura-light)]/35 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <AlertTriangle className="size-4 text-[var(--primary)]" aria-hidden="true" />
                  Weak Grammar Patterns ({weakPatterns.length})
                </h2>
                <span className="text-xs text-[var(--muted)]">
                  Revisit guides for missed or skipped rules
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {weakPatterns.map((item) => (
                  <div
                    key={item.grammarId}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.level}
                        </span>
                        <Link
                          href={`/grammar/${item.level}/${item.grammarSlug}`}
                          className="font-japanese text-base font-bold text-[var(--primary)] hover:underline"
                        >
                          {item.grammarPattern}
                        </Link>
                        {item.wrongCount > 0 && (
                          <span className="rounded-full bg-[var(--wrong)]/12 px-2 py-0.5 text-[10px] font-bold text-[var(--wrong)]">
                            {item.wrongCount} missed
                          </span>
                        )}
                        {item.unansweredCount > 0 && (
                          <span className="rounded-full bg-[var(--paper-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                            {item.unansweredCount} unanswered
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--muted)]">
                        {item.shortExplanation || item.grammarTitle}
                      </p>
                    </div>
                    <Link
                      href={`/grammar/${item.level}/${item.grammarSlug}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--paper-tint)] px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                    >
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      Review Lesson
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--correct)]/35 bg-[var(--correct)]/8 px-4 py-3 text-sm font-semibold text-[var(--ink)]">
              <Sparkles className="size-4 shrink-0 text-[var(--correct)]" aria-hidden="true" />
              <span>Clean sweep! Every grammar pattern in this session was answered correctly.</span>
            </div>
          )}

          {/* Filter Tabs & Detailed Question Breakdown */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
              {filterTabs.map((tab) => {
                const count =
                  tab === "All"
                    ? stats.total
                    : tab === "Wrong"
                      ? stats.wrong
                      : tab === "Unanswered"
                        ? stats.unanswered
                        : stats.correct;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    aria-pressed={filter === tab}
                    className={`rounded-md px-3 py-2 text-sm font-bold ${
                      filter === tab ? "bg-[var(--primary)] text-white" : "secondary-button border"
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[var(--paper-tint)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="p-3">Pattern</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Sentence</th>
                    <th className="p-3">Your Answer vs. Correct</th>
                    <th className="p-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="border-t border-[var(--line)] align-top">
                      <td className="p-3">
                        <Link
                          href={`/grammar/${q.level}/${q.grammarSlug}`}
                          className="font-japanese font-bold text-[var(--primary)] hover:underline"
                        >
                          {q.grammarPattern}
                        </Link>
                        <span className="ml-2 rounded bg-[var(--paper-tint)] px-1.5 py-0.5 text-[11px] font-bold">
                          {q.level}
                        </span>
                      </td>
                      <td className="p-3 text-xs uppercase text-[var(--muted)]">{q.type}</td>
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p lang="ja" className="font-japanese font-semibold text-[var(--ink)]">
                              {q.sentenceJp}
                            </p>
                            <p className="text-xs text-[var(--muted)]">{q.en}</p>
                          </div>
                          <AudioButton
                            text={q.sentenceJp}
                            mode="sentence"
                            size="sm"
                            label={`Listen to ${q.grammarPattern} example`}
                          />
                        </div>
                      </td>
                      <td className="p-3 font-japanese text-xs">
                        {q.status === "correct" ? (
                          <span className="font-semibold text-[var(--correct)]">
                            {q.chosenAnswer || q.correctAnswer}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <p>
                              <span className="font-sans text-[10px] font-bold uppercase text-[var(--wrong)]">
                                Yours:{" "}
                              </span>
                              <span className="text-[var(--ink)]">{q.chosenAnswer ?? "—"}</span>
                            </p>
                            <p>
                              <span className="font-sans text-[10px] font-bold uppercase text-[var(--correct)]">
                                Correct:{" "}
                              </span>
                              <span className="font-semibold text-[var(--ink)]">
                                {q.correctAnswer}
                              </span>
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-[var(--wrong)]">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!missedGrammarIds.length || working}
              onClick={() => void startPractice(true)}
              className="secondary-button flex h-12 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={17} />
              Practice missed grammar ({missedGrammarIds.length})
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => void startPractice(false)}
              className="primary-button flex h-12 flex-1 items-center justify-center gap-2 rounded-md text-sm font-bold"
            >
              Play again <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/games/grammar")}
              className="secondary-button h-12 flex-1 rounded-md border text-sm font-bold"
            >
              Change settings
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}

function StatusBadge({ status }: { status: GrammarQuestionStatus }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[var(--correct)]">
        <Check size={15} /> Correct
      </span>
    );
  }
  if (status === "wrong") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[var(--wrong)]">
        <X size={15} /> Wrong
      </span>
    );
  }
  return <span className="font-bold text-[var(--muted)]">— Unanswered</span>;
}
