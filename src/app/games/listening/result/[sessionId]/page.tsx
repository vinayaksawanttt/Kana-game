"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Clock, Ear, RotateCcw, Settings2, Volume2, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { getGameResult, saveGameSession } from "@/lib/game-core/storage";
import { kanaCharacters, type KanaGroup } from "@/data/kana";
import { loadListeningPool } from "@/data/listening";
import {
  createListeningSession,
  type ListeningQuestion,
  type ListeningResultSummary,
  type ListeningSettings,
} from "@/engine/listening";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

type FilterTab = "all" | "incorrect" | "skipped" | "correct";

const KANA_GROUP_LABELS: Record<KanaGroup, string> = {
  basic: "Basic",
  dakuten: "Dakuten",
  yoon: "Yōon",
  extended: "Extended",
};

const KANA_GROUP_BY_ID = new Map<string, KanaGroup>(
  kanaCharacters.map((c) => [c.id, c.group])
);

function CircularAccuracy({ accuracy }: { accuracy: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;
  const strokeColor =
    accuracy >= 80 ? "var(--correct)" : accuracy >= 60 ? "var(--primary)" : "var(--wrong)";

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
        <span className="text-2xl font-black text-[var(--ink)] tabular-nums">{accuracy}%</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Accuracy
        </span>
      </div>
    </div>
  );
}

export default function ListeningResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Compiling Listening Report..." size="md" />
        </main>
      }
    >
      <ListeningResultContent />
    </Suspense>
  );
}

function ListeningResultContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<ListeningResultSummary | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [starting, setStarting] = useState(false);

  const { playKana, playVocab, playSentence } = useJapaneseAudio();

  useEffect(() => {
    if (result) return;
    const stored = getGameResult<ListeningResultSummary>("listening", sessionId);
    if (!stored) {
      router.replace("/games/listening");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(stored);
    playGameSfx("victory-fanfare");
  }, [sessionId, result, router]);

  const missedQuestions = useMemo(
    () =>
      result
        ? result.questions.filter((q) => q.status === "wrong" || q.status === "skipped")
        : [],
    [result]
  );

  const filteredQuestions = useMemo(() => {
    if (!result) return [];
    if (filter === "incorrect") {
      return result.questions.filter((q) => q.status === "wrong");
    }
    if (filter === "skipped") {
      return result.questions.filter((q) => q.status === "skipped");
    }
    if (filter === "correct") {
      return result.questions.filter((q) => q.status === "correct");
    }
    return result.questions;
  }, [result, filter]);

  const firstListenStats = useMemo(() => {
    if (!result || result.total === 0) return { count: 0, rate: 0 };
    const count = result.questions.filter(
      (q) => q.status === "correct" && (q.replaysUsed || 0) === 0
    ).length;
    return {
      count,
      rate: Math.round((count / result.total) * 100),
    };
  }, [result]);

  const categoryInsights = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { key: string; label: string; total: number; correct: number }>();

    for (const q of result.questions) {
      let key = "general";
      let label = "General";

      if (result.settings.subMode === "kana") {
        const group = KANA_GROUP_BY_ID.get(q.id);
        if (group) {
          key = group;
          label = `${KANA_GROUP_LABELS[group]} Kana`;
        } else {
          key = "kana";
          label = "Kana";
        }
      } else if (q.jlpt) {
        key = `N${q.jlpt}`;
        label = `JLPT N${q.jlpt}`;
      }

      const existing = map.get(key) ?? { key, label, total: 0, correct: 0 };
      existing.total += 1;
      if (q.status === "correct") existing.correct += 1;
      map.set(key, existing);
    }

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      accuracy: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
    }));
  }, [result]);

  function playRowAudio(q: ListeningQuestion) {
    const { audioPayload } = q;
    if (audioPayload.type === "kana") {
      playKana(audioPayload.charOrWord, audioPayload.reading);
    } else if (audioPayload.type === "vocab") {
      playVocab({ word: audioPayload.charOrWord, reading: audioPayload.reading });
    } else {
      playSentence(audioPayload.sentenceJa || audioPayload.charOrWord, q.id, {
        audioSrc: audioPayload.audioSrc,
        reading: audioPayload.reading,
      });
    }
  }

  async function startNewSession(customSettings: ListeningSettings) {
    if (starting) return;
    setStarting(true);
    try {
      const pool = await loadListeningPool(customSettings);
      const nextSession = createListeningSession(pool, customSettings);
      saveGameSession("listening", nextSession.sessionId, nextSession);
      setStarting(false);
      router.push(`/games/listening/play/${nextSession.sessionId}`);
    } catch (err) {
      console.error("Could not start new listening session:", err);
      setStarting(false);
    }
  }

  function handlePracticeMissed() {
    if (!result || missedQuestions.length === 0) return;
    const missedIds = missedQuestions.map((q) => q.id);
    void startNewSession({
      ...result.settings,
      questionIds: missedIds,
    });
  }

  function handlePlayAgain() {
    if (!result) return;
    const { questionIds: _ignored, ...cleanSettings } = result.settings;
    void _ignored;
    void startNewSession(cleanSettings);
  }

  if (!result) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Loading Results..." size="md" />
      </main>
    );
  }

  const totalSec = Math.max(1, Math.round(result.totalTimeMs / 1000));
  const correctPct = result.total > 0 ? (result.correct / result.total) * 100 : 0;
  const wrongPct = result.total > 0 ? (result.wrong / result.total) * 100 : 0;
  const skippedPct = result.total > 0 ? (result.skipped / result.total) * 100 : 0;

  const practiceButtonLabel =
    result.wrong > 0 && result.skipped > 0
      ? `Practice Incorrect & Skipped (${missedQuestions.length})`
      : result.wrong > 0
        ? `Practice Incorrect Items (${missedQuestions.length})`
        : `Practice Skipped Items (${missedQuestions.length})`;

  return (
    <GameLayout label="LISTENING" glyph="聴" homeHref="/games/listening">
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {/* Headline & Summary Card */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <CircularAccuracy accuracy={result.accuracy} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                  Listening Session Complete
                </p>
                <h1 className="mt-1 text-3xl font-extrabold text-[var(--ink)] sm:text-4xl tabular-nums">
                  {result.correct} / {result.total}
                </h1>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  {result.settings.subMode === "kana"
                    ? "Kana Ear Training"
                    : result.settings.subMode === "vocabulary"
                      ? "Vocabulary Listening"
                      : "Sentence Comprehension"}{" "}
                  •{" "}
                  {result.endedEarly ? "Ended early" : "Completed"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--correct)]/30 bg-[var(--correct)]/10 px-3.5 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Correct
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--correct)] tabular-nums">
                  Passed: {result.correct}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--wrong)]/30 bg-[var(--wrong)]/10 px-3.5 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Incorrect
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--wrong)] tabular-nums">
                  Missed: {result.wrong}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/70 px-3.5 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Skipped
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--muted)] tabular-nums">
                  Skipped: {result.skipped}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 px-3.5 py-2.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <Ear size={11} aria-hidden="true" /> First Listen
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--ink)] tabular-nums">
                  {firstListenStats.count} ({firstListenStats.rate}%)
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 px-3.5 py-2.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <Clock size={11} aria-hidden="true" /> Time
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--ink)] tabular-nums">
                  Time: {totalSec}s
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 px-3.5 py-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Replays
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-[var(--ink)] tabular-nums">
                  Avg Replays: {result.averageReplays}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Performance Breakdown Bar */}
          <div className="mt-6">
            <div
              role="img"
              aria-label={`Breakdown: ${result.correct} correct, ${result.wrong} incorrect, ${result.skipped} skipped`}
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]"
            >
              {correctPct > 0 && (
                <div
                  className="h-full bg-[var(--correct)] transition-all duration-500"
                  style={{ width: `${correctPct}%` }}
                />
              )}
              {wrongPct > 0 && (
                <div
                  className="h-full bg-[var(--wrong)] transition-all duration-500"
                  style={{ width: `${wrongPct}%` }}
                />
              )}
              {skippedPct > 0 && (
                <div
                  className="h-full bg-[var(--muted)]/40 transition-all duration-500"
                  style={{ width: `${skippedPct}%` }}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--correct)]" /> Correct ({Math.round(correctPct)}%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--wrong)]" /> Incorrect ({Math.round(wrongPct)}%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--muted)]/50" /> Skipped ({Math.round(skippedPct)}%)
              </span>
            </div>
          </div>

          {/* Category-wise Performance Insights */}
          {categoryInsights.length > 0 && (
            <div className="mt-5 border-t border-[var(--line)]/60 pt-4">
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Category Breakdown
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {categoryInsights.map((cat) => (
                  <div
                    key={cat.key}
                    className="rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 p-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[var(--ink)]">{cat.label}</span>
                      <span className="text-[var(--muted)] tabular-nums">
                        {cat.correct}/{cat.total} ({cat.accuracy}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${cat.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)]/60 pt-5">
            {missedQuestions.length > 0 && (
              <button
                type="button"
                disabled={starting}
                onClick={handlePracticeMissed}
                aria-label={`Practice Missed Items: ${practiceButtonLabel}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>{practiceButtonLabel}</span>
              </button>
            )}

            <button
              type="button"
              disabled={starting}
              onClick={handlePlayAgain}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--sakura-light)]/50 px-5 text-sm font-extrabold text-[var(--primary)] transition-colors hover:bg-[var(--sakura-light)] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Play Again</span>
            </button>

            <Link
              href="/games/listening"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)]"
            >
              <Settings2 size={16} />
              <span>Change Settings</span>
            </Link>
          </div>
        </div>

        {/* Interactive Audio Review Table */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[var(--ink)]">Audio Review</h2>
              <p className="text-xs text-[var(--muted)]">
                Replay any item and compare your answer with the transcript.
              </p>
            </div>
            <div className="inline-flex flex-wrap rounded-full bg-[var(--sakura-light)] p-1">
              {(
                [
                  ["all", `All (${result.total})`],
                  ["incorrect", `Incorrect (${result.wrong})`],
                  ["skipped", `Skipped (${result.skipped})`],
                  ["correct", `Correct (${result.correct})`],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={filter === tab}
                  onClick={() => setFilter(tab)}
                  className={`min-h-9 rounded-full px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                    filter === tab
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-3 pr-3">Listen</th>
                  <th className="px-3 py-3">Japanese</th>
                  <th className="px-3 py-3">Reading</th>
                  <th className="px-3 py-3">Meaning</th>
                  <th className="px-3 py-3">Your Answer</th>
                  <th className="py-3 pl-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/60">
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-xs font-semibold text-[var(--muted)]"
                    >
                      No questions match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q) => (
                    <tr key={q.id} className="transition-colors hover:bg-[var(--sakura-light)]/20">
                      <td className="py-3.5 pr-3 align-middle">
                        <button
                          type="button"
                          aria-label={`Pronounce ${q.hiddenPromptJa}`}
                          onClick={() => playRowAudio(q)}
                          className="grid size-9 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white cursor-pointer"
                        >
                          <Volume2 size={16} />
                        </button>
                      </td>
                      <td className="px-3 py-3.5 align-middle">
                        <span className="font-japanese text-base font-bold text-[var(--ink)]">
                          {q.hiddenPromptJa}
                        </span>
                        {q.jlpt && (
                          <span className="ml-2 inline-block rounded-full border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                            N{q.jlpt}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3.5 align-middle font-japanese text-sm text-[var(--muted)]">
                        {q.hiddenReading || "—"}
                      </td>
                      <td className="px-3 py-3.5 align-middle font-semibold text-[var(--ink)]">
                        {q.correctMeaning}
                      </td>
                      <td className="px-3 py-3.5 align-middle text-xs">
                        {q.status === "skipped" ? (
                          <span className="italic text-[var(--muted)]">Skipped</span>
                        ) : (
                          <span
                            className={`font-semibold ${
                              q.status === "wrong"
                                ? "text-[var(--wrong)]"
                                : "text-[var(--ink)]"
                            }`}
                          >
                            {q.userAnswer || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {q.replaysUsed > 0 && (
                            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] tabular-nums">
                              {q.replaysUsed}x
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              q.status === "correct"
                                ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                                : q.status === "wrong"
                                  ? "bg-[var(--wrong)]/15 text-[var(--wrong)]"
                                  : "bg-[var(--line)] text-[var(--muted)]"
                            }`}
                          >
                            {q.status === "correct" && (
                              <Check size={12} strokeWidth={3} aria-hidden="true" />
                            )}
                            {q.status === "wrong" && (
                              <X size={12} strokeWidth={3} aria-hidden="true" />
                            )}
                            <span>
                              {q.status === "correct"
                                ? "Correct"
                                : q.status === "wrong"
                                  ? "Incorrect"
                                  : "Skipped"}
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
