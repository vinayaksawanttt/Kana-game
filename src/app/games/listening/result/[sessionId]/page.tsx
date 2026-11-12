"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RotateCcw, Settings2, Volume2 } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { getGameResult, saveGameSession } from "@/lib/game-core/storage";
import { loadListeningPool } from "@/data/listening";
import {
  createListeningSession,
  type ListeningQuestion,
  type ListeningResultSummary,
  type ListeningSettings,
} from "@/engine/listening";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

type FilterTab = "all" | "missed" | "correct";

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
    if (filter === "missed") {
      return result.questions.filter(
        (q) => q.status === "wrong" || q.status === "skipped"
      );
    }
    if (filter === "correct") {
      return result.questions.filter((q) => q.status === "correct");
    }
    return result.questions;
  }, [result, filter]);

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

  return (
    <GameLayout label="LISTENING" glyph="聴" homeHref="/games/listening">
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {/* Headline & Summary Card */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                Listening Session Complete
              </p>
              <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
                {result.correct} / {result.total}{" "}
                <span className="text-xl text-[var(--muted)]">({result.accuracy}%)</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--correct)]/15 px-3.5 py-1.5 text-xs font-bold text-[var(--correct)]">
                Passed: {result.correct}
              </span>
              <span className="rounded-full bg-[var(--wrong)]/15 px-3.5 py-1.5 text-xs font-bold text-[var(--wrong)]">
                Missed: {result.wrong}
              </span>
              <span className="rounded-full bg-[var(--line)] px-3.5 py-1.5 text-xs font-bold text-[var(--muted)]">
                Skipped: {result.skipped}
              </span>
              <span className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)]">
                Time: {totalSec}s
              </span>
              <span className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)]">
                Avg Replays: {result.averageReplays}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line)]/60 pt-5">
            {missedQuestions.length > 0 && (
              <button
                type="button"
                disabled={starting}
                onClick={handlePracticeMissed}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Practice Missed Items ({missedQuestions.length})</span>
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
            <h2 className="text-lg font-extrabold">Audio Review</h2>
            <div className="inline-flex rounded-full bg-[var(--sakura-light)] p-1">
              {(
                [
                  ["all", `All (${result.total})`],
                  ["missed", `Missed / Skipped (${missedQuestions.length})`],
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
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
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
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--sakura-light)]/20">
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        aria-label={`Pronounce ${q.hiddenPromptJa}`}
                        onClick={() => playRowAudio(q)}
                        className="grid size-9 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white cursor-pointer"
                      >
                        <Volume2 size={16} />
                      </button>
                    </td>
                    <td className="px-3 py-3 font-japanese text-base font-bold text-[var(--ink)]">
                      {q.hiddenPromptJa}
                    </td>
                    <td className="px-3 py-3 font-japanese text-sm text-[var(--muted)]">
                      {q.hiddenReading}
                    </td>
                    <td className="px-3 py-3 font-semibold text-[var(--ink)]">
                      {q.correctMeaning}
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--muted)]">
                      {q.userAnswer || "—"}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          q.status === "correct"
                            ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                            : q.status === "wrong"
                              ? "bg-[var(--wrong)]/15 text-[var(--wrong)]"
                              : "bg-[var(--line)] text-[var(--muted)]"
                        }`}
                      >
                        {q.status === "correct"
                          ? "Correct"
                          : q.status === "wrong"
                            ? "Missed"
                            : "Skipped"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
