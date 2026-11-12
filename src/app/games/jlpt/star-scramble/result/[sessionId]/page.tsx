"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  CheckCircle2,
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
  STAR_SCRAMBLE_ITEMS,
  createStarScrambleSession,
  summarizeStarScrambleSession,
  type StarScrambleResultSummary,
  type StarScrambleSession,
} from "@/engine/jlptStarScramble";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addGrammarToSrs } from "@/lib/srs/service";
import { grammarGuideHref } from "@/data/grammar";

function loadSummary(sessionId: string): StarScrambleResultSummary | null {
  const existing = getGameResult<StarScrambleResultSummary>("jlpt-star", sessionId);
  if (existing && Array.isArray(existing.questions)) {
    return existing;
  }
  const session = getGameSession<StarScrambleSession>("jlpt-star", sessionId);
  if (session && Array.isArray(session.questions)) {
    const built = summarizeStarScrambleSession(session);
    saveGameResult("jlpt-star", built);
    return built;
  }
  return null;
}

export default function StarScrambleResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { playSentence } = useJapaneseAudio();

  const summary = useMemo(() => loadSummary(sessionId), [sessionId]);
  const [savedGrammarIds, setSavedGrammarIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (summary) {
      playGameSfx("victory-fanfare");
    }
  }, [summary]);

  function handlePlayAgain() {
    const baseSettings = summary?.settings ?? {
      levels: ["N5"],
      size: 10,
      showEnglishHint: true,
    };
    const nextSession = createStarScrambleSession(STAR_SCRAMBLE_ITEMS, {
      levels: baseSettings.levels,
      size: baseSettings.size,
      showEnglishHint: baseSettings.showEnglishHint,
    });
    saveGameSession("jlpt-star", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/star-scramble/play/${nextSession.sessionId}`);
  }

  function handlePracticeMissed() {
    if (!summary || summary.missedItemIds.length === 0) return;
    const nextSession = createStarScrambleSession(STAR_SCRAMBLE_ITEMS, {
      levels: summary.settings.levels,
      size: summary.settings.size,
      showEnglishHint: summary.settings.showEnglishHint,
      onlyItemIds: summary.missedItemIds,
    });
    saveGameSession("jlpt-star", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/star-scramble/play/${nextSession.sessionId}`);
  }

  async function handleSaveGrammar(item: {
    grammarId: string;
    grammarPoint: string;
    explanation: string;
    level: string;
  }) {
    if (savedGrammarIds[item.grammarId]) return;
    await addGrammarToSrs({
      id: item.grammarId,
      pattern: item.grammarPoint,
      meaning: item.explanation,
      level: item.level,
    });
    setSavedGrammarIds((prev) => ({ ...prev, [item.grammarId]: true }));
  }

  if (!summary) {
    return (
      <GameLayout
        label="★ STAR SENTENCE SCRAMBLE"
        glyph="★"
        homeHref="/games/jlpt"
      >
        <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">Session result not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start a new ★ Star Sentence Scramble drill to see your JLPT score breakdown.
          </p>
          <Link
            href="/games/jlpt/star-scramble"
            className="mt-6 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white"
          >
            New ★ Star Scramble Drill
          </Link>
        </section>
      </GameLayout>
    );
  }

  const answerMap = new Map(summary.answers.map((a) => [a.questionId, a]));
  const missedCount = summary.missedItemIds.length;

  return (
    <GameLayout
      label="★ STAR SCRAMBLE RESULTS"
      glyph="★"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-14 pt-6 sm:px-8">
        {/* Dual JLPT Score Header */}
        <div className="grid gap-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                JLPT Bunpō Mondai 2 · Graded Report
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                Levels: {summary.settings.levels.join(", ")}
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              ★ Star Sentence Scramble Results
            </h1>

            {/* Dual Score Cards */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-[var(--primary)] bg-[var(--sakura-light)]/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                    Official ★ Star Score
                  </span>
                  <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-extrabold text-white">
                    {summary.starAccuracyPercent}%
                  </span>
                </div>
                <div className="mt-2 text-3xl font-black text-[var(--primary-fg)]">
                  {summary.starCorrectCount} / {summary.total}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  What you would score on the actual JLPT exam.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                    Perfect Word-Order Score
                  </span>
                  <span className="rounded-full bg-[var(--correct)]/15 px-2.5 py-0.5 text-xs font-extrabold text-[var(--correct)]">
                    {summary.fullOrderAccuracyPercent}%
                  </span>
                </div>
                <div className="mt-2 text-3xl font-black">
                  {summary.fullOrderCorrectCount} / {summary.total}
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Questions where all 4 tiles were in 100% exact syntactic order.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {missedCount > 0 && (
                <button
                  type="button"
                  onClick={handlePracticeMissed}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:opacity-95"
                >
                  <Sparkles size={15} />
                  <span>Practice Missed Puzzles ({missedCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePlayAgain}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-5 py-2.5 text-xs font-bold text-[var(--primary-fg)] transition hover:opacity-90"
              >
                <RotateCcw size={15} />
                <span>Play Again</span>
              </button>

              <Link
                href="/games/jlpt"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-5 py-2.5 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
              >
                <ArrowLeft size={15} />
                <span>Back to JLPT Arena</span>
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <JlptPaperIllustration className="h-52 w-40 shrink-0" />
          </div>
        </div>

        {/* Detailed Question Breakdown Table */}
        <section aria-labelledby="breakdown-heading" className="mt-9">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="breakdown-heading"
              className="text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              Detailed Question Breakdown ({summary.questions.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {summary.questions.map((q, index) => {
              const ans = answerMap.get(q.id);
              const tileMap = new Map(q.options.map((t) => [t.id, t]));
              const chosenStarTile = ans?.starTileId
                ? tileMap.get(ans.starTileId)
                : undefined;
              const correctStarText = q.segments[q.starSlotIndex];
              const isGrammarSaved = Boolean(savedGrammarIds[q.grammarId]);

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-xs font-extrabold text-[var(--muted)]">
                        #{index + 1} · {q.level}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ans?.starCorrect
                            ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                            : "bg-rose-500/15 text-rose-500"
                        }`}
                      >
                        {ans?.starCorrect ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <XCircle size={13} />
                        )}
                        <span>
                          {ans?.starCorrect ? "★ Star Correct" : "★ Star Missed"}
                        </span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ans?.fullOrderCorrect
                            ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                            : "bg-[var(--bg)] text-[var(--muted)]"
                        }`}
                      >
                        {ans?.fullOrderCorrect
                          ? "4/4 Perfect Order"
                          : ans?.skipped
                            ? "Skipped"
                            : "Partial Order"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void playSentence(q.fullSentence)}
                        aria-label={`Play audio for question ${index + 1}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)] transition hover:opacity-90"
                      >
                        <Volume2 size={13} />
                        <span>Audio</span>
                      </button>

                      <button
                        type="button"
                        disabled={isGrammarSaved}
                        onClick={() =>
                          void handleSaveGrammar({
                            grammarId: q.grammarId,
                            grammarPoint: q.grammarPoint,
                            explanation: q.explanation,
                            level: q.level,
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition ${
                          isGrammarSaved
                            ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                            : "border-[var(--line)] bg-[var(--bg)] text-[var(--primary-fg)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        {isGrammarSaved ? <Check size={12} /> : <BookmarkPlus size={12} />}
                        <span>{isGrammarSaved ? "Saved" : "+ FSRS"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Full Sentence with ★ Segment Highlighted in Japan Red */}
                  <p className="mt-3 font-japanese text-lg font-bold leading-relaxed sm:text-xl">
                    {q.prefix && <span>{q.prefix}</span>}
                    {q.segments.map((seg, segIdx) => (
                      <span
                        key={segIdx}
                        className={
                          segIdx === q.starSlotIndex
                            ? "mx-1 rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[var(--primary-fg)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
                            : "mx-0.5"
                        }
                      >
                        {segIdx === q.starSlotIndex ? `★${seg}` : seg}
                      </span>
                    ))}
                    {q.suffix && <span>{q.suffix}</span>}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">{q.english}</p>

                  {/* Learner ★ Choice vs Correct ★ Tile & Grammar Link */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>
                        <strong className="text-[var(--muted)]">Your ★ Tile:</strong>{" "}
                        <span
                          className={`font-japanese font-bold ${
                            ans?.starCorrect ? "text-[var(--correct)]" : "text-rose-500"
                          }`}
                        >
                          {chosenStarTile ? chosenStarTile.text : "— (Skipped)"}
                        </span>
                      </span>
                      <span>
                        <strong className="text-[var(--muted)]">Correct ★ Tile:</strong>{" "}
                        <span className="font-japanese font-bold text-[var(--primary-fg)]">
                          {correctStarText}
                        </span>
                      </span>
                    </div>

                    <Link
                      href={grammarGuideHref(q.grammarId)}
                      className="font-japanese font-bold text-[var(--primary-fg)] hover:underline"
                    >
                      Grammar: {q.grammarPoint} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </GameLayout>
  );
}
