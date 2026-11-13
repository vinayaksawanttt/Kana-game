"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw, Trophy, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { createKanjiMeaningSession, type KanjiMeaningResult, type KanjiMeaningStatus } from "@/lib/game/kanji-meaning";
import { formatTime } from "@/lib/game-core/time";
import { getGameResult, getGameSession, saveGameSession } from "@/lib/game-core/storage";
import type { StoredKanjiMeaningSession } from "@/lib/game/kanji-meaning";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";

type Filter = "All" | "Wrong" | "Correct";

export default function KanjiMeaningResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Calculating Performance..." size="md" />
        </main>
      }
    >
      <KanjiMeaningResultContent />
    </Suspense>
  );
}

function KanjiMeaningResultContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<KanjiMeaningResult | null>(null);
  const [session, setSession] = useState<StoredKanjiMeaningSession | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.resolve().then(() => {
      const saved = getGameResult<KanjiMeaningResult>("kanji", sessionId);
      if (!saved || saved.sessionId !== sessionId) {
        router.replace("/games/kanji/meaning");
        return;
      }
      setResult(saved);
      setSession(getGameSession<StoredKanjiMeaningSession>("kanji", sessionId));
      playGameSfx("victory-fanfare");
    }).catch((loadError: unknown) => {
      console.error("Could not read the kanji meaning result.", loadError);
      setError("This result could not be loaded.");
    });
  }, [router, sessionId]);

  const stats = useMemo(() => {
    if (!result) return null;
    const correct = result.questions.filter((question) => question.status === "correct").length;
    const wrong = result.questions.filter((question) => question.status === "wrong").length;
    const unanswered = result.questions.filter((question) => question.status === "unanswered").length;
    const total = result.questions.length;
    const elapsed = result.endedAt - result.startedAt;
    const average = total ? Math.round(result.questions.reduce((sum, question) => sum + question.timeMs, 0) / total) : 0;
    const grades = [...new Set(result.questions.map((question) => question.grade))].sort((a, b) => a - b);
    return { correct, wrong, unanswered, total, elapsed, average, grades, percentage: total ? Math.round(correct / total * 100) : 0 };
  }, [result]);

  if (error) return <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">{error}</main>;
  if (!result || !stats) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Calculating Performance..." size="md" />
      </main>
    );
  }
  const filtered = result.questions.filter((question) => filter === "All" || question.status.toLowerCase() === filter.toLowerCase());
  const missedIds = result.questions.filter((question) => question.status !== "correct").map((question) => question.kanji);

  async function startPractice(missedOnly: boolean) {
    if (!result || working) return;
    setWorking(true);
    setError("");
    try {
      const newSession = await createKanjiMeaningSession({
        levels: result.settings.levels,
        grades: result.settings.grades,
        size: result.settings.size,
        ...(missedOnly ? { kanjiIds: missedIds } : result.settings.kanjiIds ? { kanjiIds: result.settings.kanjiIds } : {}),
      });
      saveGameSession("kanji", newSession.sessionId, newSession);
      router.push(`/games/kanji/meaning/play/${newSession.sessionId}`);
    } catch (startError) {
      console.error("Could not start the next kanji meaning session.", startError);
      setError("A new session could not be started.");
      setWorking(false);
    }
  }

  const gradeStats = stats.grades.map((grade) => {
    const questions = result.questions.filter((question) => question.grade === grade);
    return { grade, correct: questions.filter((question) => question.status === "correct").length, total: questions.length };
  });

  return (
    <GameLayout label="KANJI" glyph="漢">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 sm:px-8 sm:py-8">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          {/* Header Deck with Circular Score Visualization */}
          <div className="flex flex-col justify-between gap-6 border-b border-[var(--line)]/70 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                <span>セッション完了</span>
                <span>·</span>
                <span>Session Complete</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                Meaning practice results
              </h1>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Total duration: {formatTime(stats.elapsed)}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <ScoreRing percentage={stats.percentage} />
              <div>
                <div className="text-3xl font-black text-[var(--ink)] leading-none tabular-nums">
                  {stats.correct} / {stats.total}
                </div>
                <div className="mt-1.5 text-xs font-semibold text-[var(--muted)]">
                  {stats.percentage}% correct
                </div>
              </div>
            </div>
          </div>

          {/* Upgraded Metric Stat Cards */}
          <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--correct)]/20 bg-[var(--correct)]/5 p-4 shadow-2xs">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--correct)]">
                Correct
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--correct)] tabular-nums">{stats.correct}</span>
                <span className="text-xs font-semibold text-[var(--muted)]">of {stats.total}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--wrong)]/20 bg-[var(--wrong)]/5 p-4 shadow-2xs">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--wrong)]">
                Wrong
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--wrong)] tabular-nums">{stats.wrong}</span>
                <span className="text-xs font-semibold text-[var(--muted)]">missed</span>
              </div>
            </div>
            {result.endedEarly && (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4 shadow-2xs">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Unanswered
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--muted)] tabular-nums">{stats.unanswered}</span>
                  <span className="text-xs font-semibold text-[var(--muted)]">skipped</span>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4 shadow-2xs">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Average Time
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--ink)] tabular-nums">
                  {(stats.average / 1000).toFixed(1)}s
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">per question</span>
              </div>
            </div>
          </div>

          {/* Compact Grade-wise Performance Visualization */}
          {gradeStats.length > 0 && (
            <section className="mb-6 rounded-2xl border border-[var(--line)]/70 bg-[var(--bg)]/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  Performance by grade · 配当別正答率
                </h2>
                <span className="text-[11px] font-semibold text-[var(--muted)]">
                  {gradeStats.length} grade{gradeStats.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                {gradeStats.map(({ grade, correct, total }) => {
                  const pct = total ? Math.round((correct / total) * 100) : 0;
                  const label = grade === 8 ? "Secondary (8)" : grade === 9 ? "Names (9)" : `Grade ${grade}`;
                  return (
                    <div
                      key={grade}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{label}</span>
                        <span className="text-[var(--primary-fg)] tabular-nums">{correct}/{total}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--line)]/60">
                        <div
                          className={`h-full rounded-full transition-all duration-400 ${
                            pct === 100 ? "bg-[var(--correct)]" : pct >= 50 ? "bg-[var(--sakura)]" : "bg-[var(--wrong)]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="mt-1 block text-right text-[10px] font-semibold text-[var(--muted)]">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Filter Tabs */}
          <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--line)]/70 pb-3">
            {(["All", "Wrong", "Correct"] as Filter[]).map((tab) => {
              const count = tab === "All" ? stats.total : tab === "Wrong" ? stats.wrong : stats.correct;
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  aria-pressed={active}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "secondary-button border hover:border-[var(--primary)]/50"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Refined Results Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--surface)] text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)] select-none">
                <tr>
                  <th className="p-3.5">Kanji</th>
                  <th className="p-3.5">Meaning</th>
                  <th className="p-3.5">You chose</th>
                  <th className="p-3.5">On / Kun</th>
                  <th className="p-3.5">Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((question) => {
                  const isWrong = question.status === "wrong";
                  const isCorrect = question.status === "correct";
                  return (
                    <tr
                      key={question.id}
                      className="border-t border-[var(--line)]/60 transition-colors hover:bg-[var(--sakura-light)]/20"
                    >
                      <td className="p-3.5 font-japanese text-2xl font-medium text-[var(--ink)]">
                        {question.kanji}
                      </td>
                      <td className="p-3.5 font-bold text-[var(--ink)]">
                        {question.correctLabel}
                      </td>
                      <td className="p-3.5">
                        {isWrong ? (
                          <span className="rounded-md border border-[var(--wrong)]/20 bg-[var(--wrong)]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[var(--wrong)]">
                            {question.chosenLabel}
                          </span>
                        ) : isCorrect ? (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">Unanswered</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1.5">
                          {question.on.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="w-7 text-[10px] font-black uppercase tracking-wider text-[var(--primary-fg)]">
                                On
                              </span>
                              {question.on.map((r) => (
                                <KanjiReadingPill key={r} reading={r} type="on" size="sm" />
                              ))}
                            </div>
                          )}
                          {question.kun.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="w-7 text-[10px] font-black uppercase tracking-wider text-[var(--ink)]">
                                Kun
                              </span>
                              {question.kun.map((r) => (
                                <KanjiReadingPill key={r} reading={r} type="kun" size="sm" />
                              ))}
                            </div>
                          )}
                          {question.on.length === 0 && question.kun.length === 0 && (
                            <span className="text-xs text-[var(--muted)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <ResultBadge status={question.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-xs font-semibold text-[var(--wrong)]">
              {error}
            </p>
          )}

          {/* Action Row with Clear Hierarchy: Play Again (primary), Practice Missed (secondary), Change Settings (tertiary) */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={working}
              onClick={() => startPractice(false)}
              className="primary-button flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-extrabold shadow-sm transition hover:bg-[var(--primary-hover)] hover:shadow-md"
            >
              <span>Play again</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              disabled={!missedIds.length || working}
              onClick={() => startPractice(true)}
              className="secondary-button flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-all hover:border-[var(--primary)] hover:text-[var(--primary-fg)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={16} />
              <span>Practice missed kanji ({missedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/games/kanji/meaning")}
              className="secondary-button flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl border text-sm font-bold transition hover:border-[var(--line)]"
            >
              Change settings
            </button>
          </div>

          {!session && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              The original session settings are unavailable; play again still uses the saved result settings.
            </p>
          )}
        </div>
      </section>
    </GameLayout>
  );
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 38;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex size-20 shrink-0 items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="var(--line)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={percentage >= 70 ? "var(--correct)" : "var(--primary)"}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-[var(--ink)] leading-none tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function ResultBadge({ status }: { status: KanjiMeaningStatus }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--correct)]/25 bg-[var(--correct)]/10 px-2.5 py-1 text-xs font-bold text-[var(--correct)]">
        <Check size={13} className="stroke-[3]" />
        <span>Correct</span>
      </span>
    );
  }
  if (status === "wrong") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--wrong)]/25 bg-[var(--wrong)]/10 px-2.5 py-1 text-xs font-bold text-[var(--wrong)]">
        <X size={13} className="stroke-[3]" />
        <span>Wrong</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-bold text-[var(--muted)]">
      — Unanswered
    </span>
  );
}
