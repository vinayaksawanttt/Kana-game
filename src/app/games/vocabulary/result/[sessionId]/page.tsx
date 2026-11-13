"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { loadVocabularyData, vocabularyLevels, type VocabularyLevel } from "@/data/vocabulary";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { formatTime } from "@/lib/game-core/time";
import { getGameResult, saveGameSession } from "@/lib/game-core/storage";
import {
  buildVocabularyReviewQuestions,
  calculateVocabularyReport,
  createVocabularySession,
  parseExampleFurigana,
  type VocabularyReviewQuestion,
  type VocabularyResult,
} from "@/lib/game/vocabulary";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";

export default function VocabularyResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Calculating Performance..." size="md" />
        </main>
      }
    >
      <VocabularyResultContent />
    </Suspense>
  );
}

function isVocabularyResult(value: unknown, sessionId: string): value is VocabularyResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<VocabularyResult>;
  return result.sessionId === sessionId &&
    Array.isArray(result.questions) &&
  result.questions.length > 0 &&
  new Set(result.questions.map((question) => question.id)).size === result.questions.length &&
  result.questions.every((question) =>
    typeof question.id === "string" &&
    Array.isArray(question.attempts) &&
    question.attempts.every((answer) => typeof answer === "string") &&
    Array.isArray(question.kanjiHints) &&
    question.kanjiHints.every((character) => typeof character === "string") &&
    typeof question.furiganaHintUsed === "boolean" &&
    ["correct", "skipped", "unanswered"].includes(question.status) &&
    Number.isFinite(question.pointsEarned) &&
    question.pointsEarned >= 0 &&
    question.pointsEarned <= 100 &&
    Number.isFinite(question.pointsDeducted) &&
    question.pointsDeducted >= 0 &&
    question.pointsDeducted <= 100
  ) &&
  typeof result.settings === "object" &&
  result.settings !== null &&
  Array.isArray(result.settings.levels) &&
  result.settings.levels.length > 0 &&
  result.settings.levels.every((level) => vocabularyLevels.includes(level as VocabularyLevel)) &&
  Array.isArray(result.settings.grades) &&
  result.settings.grades.every((grade) => Number.isInteger(grade) && grade > 0) &&
  (result.settings.size === "all" || [10, 20, 30].includes(result.settings.size)) &&
  Number.isFinite(result.startedAt) &&
  Number.isFinite(result.endedAt) &&
  typeof result.endedEarly === "boolean";
}

function CircularAccuracy({ accuracy }: { accuracy: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (accuracy / 100) * circumference;
  const strokeColor =
    accuracy >= 80 ? "var(--correct)" : accuracy >= 60 ? "var(--primary)" : "var(--wrong)";

  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg className="size-full -rotate-90 transform" viewBox="0 0 96 96">
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Accuracy</span>
      </div>
    </div>
  );
}

function VocabularyResultContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<VocabularyResult | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<VocabularyReviewQuestion[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  function toggleRow(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const saved = getGameResult<unknown>("vocabulary", sessionId);
      if (!saved || !isVocabularyResult(saved, sessionId)) {
        router.replace("/games/vocabulary");
        return;
      }
      const data = await loadVocabularyData(saved.settings.levels);
      const questions = buildVocabularyReviewQuestions(saved, data);
      if (active) {
        setResult(saved);
        setReviewQuestions(questions);
        playGameSfx("victory-fanfare");
      }
    }).catch((loadError: unknown) => {
      if (!active) return;
      console.error("Could not read the vocabulary result.", loadError);
      setError("This result could not be loaded.");
    });
    return () => { active = false; };
  }, [router, sessionId]);

  const report = useMemo(
    () => result ? calculateVocabularyReport(result) : null,
    [result]
  );

  async function startPractice(missedOnly: boolean) {
    if (!result || working) return;
    setWorking(true);
    setError("");
    try {
      const missedIds = result.questions
        .filter((question) => question.status !== "correct")
        .map((question) => question.id);
      const settings = missedOnly
        ? { ...result.settings, size: "all" as const }
        : result.settings;
      const data = await loadVocabularyData(settings.levels);
      const session = createVocabularySession(
        {
          levels: settings.levels,
          grades: settings.grades,
          size: settings.size,
          ...(missedOnly ? { ids: missedIds } : {}),
        },
        data
      );
      saveGameSession("vocabulary", session.sessionId, session);
      router.push(`/games/vocabulary/play/${session.sessionId}`);
    } catch (startError) {
      console.error("Could not start the next vocabulary session.", startError);
      setError("A new session could not be started.");
      setWorking(false);
    }
  }

  if (error && !result) {
    return <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">{error}</main>;
  }
  if (!result || !report) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Calculating Performance..." size="md" />
      </main>
    );
  }

  const missedCount = result.questions.filter((question) => question.status !== "correct").length;
  const maxGradeList = [...new Set(reviewQuestions.flatMap((question) =>
    question.kanji.map((kanji) => kanji.grade).filter((grade): grade is number => grade !== null)
  ))].sort((a, b) => a - b);

  const firstTryCount = report.firstTryCorrect;
  const retryCount = report.correctAfterRetries;
  const skippedCount = report.skipped;
  const unansweredCount = report.unanswered;
  const total = report.total;

  return (
    <GameLayout label="VOCABULARY" glyph="語">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-8">
          {/* Top Performance Dashboard Card */}
          <div className="flex flex-col items-center justify-between gap-6 border-b border-[var(--line)] pb-6 sm:flex-row">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <CircularAccuracy accuracy={report.accuracy} />
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                    Session {result.endedEarly ? "ended early" : "complete"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                    <Clock size={12} /> {formatTime(report.completionTime)}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl text-[var(--ink)]">
                  Vocabulary Results
                </h1>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {report.score} / {report.maximumScore} points earned across {report.total} words.
                </p>
              </div>
            </div>

            {/* Selected Levels & Grades Pill Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
              {result.settings.levels.map((level) => (
                <span key={level} className="rounded-xl border border-[var(--primary)]/40 bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {level}
                </span>
              ))}
              {maxGradeList.map((grade) => (
                <span key={grade} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                  {grade === 8 ? "Secondary (8)" : grade === 9 ? "Names (9)" : `Grade ${grade}`}
                </span>
              ))}
            </div>
          </div>

          {/* 4 Performance Metric Cards */}
          <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <span>Score</span>
                <Trophy size={14} className="text-[var(--primary)]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[var(--ink)] tabular-nums">
                {report.score} <span className="text-xs font-bold text-[var(--muted)]">/ {report.maximumScore}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {Math.round((report.score / Math.max(1, report.maximumScore)) * 100)}% of max potential
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <span>First-Try</span>
                <Target size={14} className="text-[var(--correct)]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[var(--correct)] tabular-nums">
                {firstTryCount} <span className="text-xs font-bold text-[var(--muted)]">/ {total}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {Math.round((firstTryCount / Math.max(1, total)) * 100)}% on first attempt
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <span>Attempted</span>
                <Sparkles size={14} className="text-[var(--primary)]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[var(--ink)] tabular-nums">
                {report.attempted} <span className="text-xs font-bold text-[var(--muted)]">/ {total}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {retryCount} correct after retries
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-center sm:text-left">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <span>Needs Review</span>
                <RotateCcw size={14} className="text-[var(--wrong)]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[var(--wrong)] tabular-nums">
                {missedCount}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                {skippedCount} skipped · {unansweredCount} unanswered
              </p>
            </div>
          </div>

          {/* Breakdown Multi-segment Progress Bar */}
          <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              <span>Performance Breakdown</span>
              <span className="text-[var(--ink)] tabular-nums">{total} questions</span>
            </div>
            <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]/50">
              {firstTryCount > 0 && (
                <div
                  style={{ width: `${(firstTryCount / total) * 100}%` }}
                  className="bg-[var(--correct)] transition-all"
                  title={`First try: ${firstTryCount}`}
                />
              )}
              {retryCount > 0 && (
                <div
                  style={{ width: `${(retryCount / total) * 100}%` }}
                  className="bg-amber-500 transition-all"
                  title={`Correct after retries: ${retryCount}`}
                />
              )}
              {skippedCount > 0 && (
                <div
                  style={{ width: `${(skippedCount / total) * 100}%` }}
                  className="bg-[var(--wrong)] transition-all"
                  title={`Skipped: ${skippedCount}`}
                />
              )}
              {unansweredCount > 0 && (
                <div
                  style={{ width: `${(unansweredCount / total) * 100}%` }}
                  className="bg-[var(--line)] transition-all"
                  title={`Unanswered: ${unansweredCount}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                <span className="size-2 rounded-full bg-[var(--correct)]" />
                <span>First Try ({firstTryCount})</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Retry Success ({retryCount})</span>
              </div>
              {skippedCount > 0 && (
                <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                  <span className="size-2 rounded-full bg-[var(--wrong)]" />
                  <span>Skipped ({skippedCount})</span>
                </div>
              )}
              {unansweredCount > 0 && (
                <div className="flex items-center gap-1.5 font-medium text-[var(--muted)]">
                  <span className="size-2 rounded-full bg-[var(--line)]" />
                  <span>Unanswered ({unansweredCount})</span>
                </div>
              )}
              {report.hintsUsed > 0 && (
                <div className="ml-auto text-[11px] text-[var(--muted)]">
                  Hints used: {report.hintsUsed} (−{report.pointsDeducted} pts)
                </div>
              )}
            </div>
          </div>

          {/* Interactive Results Table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-[var(--surface)] text-xs uppercase tracking-wide text-[var(--muted)] border-b border-[var(--line)]">
                <tr>
                  <th className="p-3.5 pl-4">Word</th>
                  <th className="p-3.5">Reading</th>
                  <th className="p-3.5">Expected Meaning</th>
                  <th className="p-3.5">Submitted Answer</th>
                  <th className="p-3.5">Hints</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5 text-right pr-4">Points</th>
                  <th className="p-3.5 w-10 text-center" aria-label="Expand row" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {reviewQuestions.map((question) => {
                  const hints = [
                    ...(question.furiganaHintUsed ? ["Furigana"] : []),
                    ...question.kanjiHints.map((character) => `Kanji ${character}`),
                  ];
                  const answer = question.attempts.at(-1);
                  const isExpanded = expandedIds.has(question.id);

                  return (
                    <tr
                      key={question.id}
                      onClick={() => toggleRow(question.id)}
                      className="group cursor-pointer transition-colors hover:bg-[var(--sakura-light)]/30"
                    >
                      <td className="p-3.5 pl-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-japanese text-xl font-bold text-[var(--ink)]">
                            {question.word}
                          </span>
                          <span className="rounded bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                            {question.level}
                          </span>
                          <div onClick={(e) => e.stopPropagation()}>
                            <AudioButton
                              mode="vocab"
                              text={question.word}
                              reading={question.reading}
                              size="sm"
                              label={`Listen to ${question.word}`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 align-top font-japanese text-sm text-[var(--primary-fg)] font-medium">
                        {question.reading}
                      </td>

                      <td className="p-3.5 align-top font-semibold text-[var(--ink)]">
                        {question.meanings.join("; ")}
                      </td>

                      <td className="p-3.5 align-top text-xs">
                        <span className={question.status === "correct" ? "text-[var(--ink)]" : "text-[var(--wrong)]"}>
                          {answer || "—"}
                        </span>
                        {(question.status === "correct" ? question.attempts.length - 1 : question.attempts.length) > 0 && (
                          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                            {question.status === "correct" ? question.attempts.length - 1 : question.attempts.length} incorrect {((question.status === "correct" ? question.attempts.length - 1 : question.attempts.length) === 1) ? "attempt" : "attempts"}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 align-top text-xs">
                        {hints.length ? hints.join(", ") : "—"}
                        {hints.length > 0 && (
                          <span className="mt-0.5 block text-[10px] text-[var(--muted)]">
                            −{question.pointsDeducted} pts
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 align-top">
                        <ResultBadge question={question} />
                      </td>

                      <td className="p-3.5 pr-4 align-top text-right font-bold tabular-nums text-[var(--ink)]">
                        {question.pointsEarned}
                      </td>

                      <td className="p-3.5 align-top text-center text-[var(--muted)]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded Drawer Details (if any rows expanded) */}
          {reviewQuestions.some((q) => expandedIds.has(q.id)) && (
            <div className="mt-4 space-y-3">
              {reviewQuestions
                .filter((q) => expandedIds.has(q.id))
                .map((question) => (
                  <div
                    key={`expanded-${question.id}`}
                    className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-japanese text-lg font-bold text-[var(--ink)]">
                          {question.word}
                        </span>
                        <span className="font-japanese text-sm text-[var(--primary-fg)]">
                          ({question.reading})
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          — {question.meanings.join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRow(question.id)}
                        className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* Example Sentence */}
                    {question.examples?.[0] && (
                      <div className="mt-3">
                        <span className="font-bold uppercase tracking-wider text-[var(--muted)] text-[10px]">
                          Example Sentence
                        </span>
                        <div className="mt-1 flex items-start justify-between gap-2 rounded-lg bg-[var(--surface)] p-2.5">
                          <div>
                            <p className="font-japanese text-base leading-relaxed text-[var(--ink)]">
                              {parseExampleFurigana(
                                question.examples[0].furigana ?? question.examples[0].ja
                              ).map((part, index) =>
                                part.reading ? (
                                  <ruby key={`${index}-${part.text}`}>
                                    {part.text}
                                    <rp>(</rp>
                                    <rt className="text-[10px] text-[var(--primary-fg)]">{part.reading}</rt>
                                    <rp>)</rp>
                                  </ruby>
                                ) : (
                                  <span key={`${index}-${part.text}`}>{part.text}</span>
                                )
                              )}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {question.examples[0].en}
                            </p>
                          </div>
                          <AudioButton
                            mode="sentence"
                            text={question.examples[0].ja}
                            size="sm"
                            label="Listen to example sentence"
                          />
                        </div>
                      </div>
                    )}

                    {/* Kanji Breakdown */}
                    {question.kanji?.length > 0 && (
                      <div className="mt-3">
                        <span className="font-bold uppercase tracking-wider text-[var(--muted)] text-[10px]">
                          Kanji Breakdown
                        </span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {question.kanji.map((k) => (
                            <span
                              key={k.character}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1"
                            >
                              <span className="font-japanese font-bold text-sm text-[var(--primary)]">
                                {k.character}
                              </span>
                              <span className="text-[var(--muted)]">
                                {k.meanings.join(", ")}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attempt History */}
                    {question.attempts?.length > 0 && (
                      <div className="mt-3">
                        <span className="font-bold uppercase tracking-wider text-[var(--muted)] text-[10px]">
                          Your Attempts ({question.attempts.length})
                        </span>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {question.attempts.map((att, i) => (
                            <span key={i} className="mr-2 inline-block rounded bg-[var(--surface)] px-1.5 py-0.5">
                              #{i + 1}: &ldquo;{att}&rdquo;
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm font-semibold text-[var(--wrong)]">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            {missedCount > 0 && (
              <button
                type="button"
                disabled={working}
                onClick={() => startPractice(true)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Retry missed words ({missedCount})</span>
              </button>
            )}

            <button
              type="button"
              disabled={working}
              onClick={() => startPractice(false)}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer ${
                missedCount === 0
                  ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]"
              }`}
            >
              <span>Play again</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/games/vocabulary")}
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
            >
              Change settings
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)] cursor-pointer"
            >
              Return to games
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold">{label}: {value}</span>;
}

function ResultBadge({ question }: { question: VocabularyReviewQuestion }) {
  if (question.status === "correct" && question.attempts.length === 1) {
    return <span className="inline-flex items-center gap-1 font-bold text-[var(--correct)]"><Check size={15} /> First try</span>;
  }
  if (question.status === "correct") {
    return <span className="inline-flex items-center gap-1 font-bold text-[var(--correct)]"><Check size={15} /> Correct after retry</span>;
  }
  if (question.status === "skipped") {
    return <span className="inline-flex items-center gap-1 font-bold text-[var(--muted)]"><X size={15} /> Skipped</span>;
  }
  return <span className="font-bold text-[var(--muted)]">Unanswered</span>;
}
