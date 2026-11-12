"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  RotateCcw,
  Settings2,
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
  PHONETIC_TRAP_ITEMS,
  createPhoneticTrapSession,
  summarizePhoneticTrapSession,
  type PhoneticTrapResultSummary,
  type PhoneticTrapSession,
} from "@/engine/jlptPhoneticTraps";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addVocabularyToSrs } from "@/lib/srs/service";

type FilterTab = "all" | "missed" | "correct";

function loadSummary(sessionId: string): PhoneticTrapResultSummary | null {
  const existing = getGameResult<PhoneticTrapResultSummary>("jlpt-traps", sessionId);
  if (existing && Array.isArray(existing.questions)) {
    return existing;
  }
  const session = getGameSession<PhoneticTrapSession>("jlpt-traps", sessionId);
  if (session && Array.isArray(session.questions)) {
    const built = summarizePhoneticTrapSession(session);
    saveGameResult("jlpt-traps", built);
    return built;
  }
  return null;
}

export default function PhoneticTrapResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { playVocab, playSentence } = useJapaneseAudio();

  const summary = useMemo(() => loadSummary(sessionId), [sessionId]);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (summary) {
      playGameSfx("victory-fanfare");
    }
  }, [summary]);

  function handlePlayAgain() {
    const baseSettings = summary?.settings ?? {
      subMode: "reading" as const,
      levels: ["N5" as const],
      size: 10 as const,
      showEnglishHint: true,
    };
    const nextSession = createPhoneticTrapSession(PHONETIC_TRAP_ITEMS, {
      subMode: baseSettings.subMode,
      levels: baseSettings.levels,
      size: baseSettings.size,
      showEnglishHint: baseSettings.showEnglishHint,
    });
    saveGameSession("jlpt-traps", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/phonetic-traps/play/${nextSession.sessionId}`);
  }

  function handlePracticeMissed() {
    if (!summary || summary.missedItemIds.length === 0) return;
    const nextSession = createPhoneticTrapSession(PHONETIC_TRAP_ITEMS, {
      subMode: summary.settings.subMode,
      levels: summary.settings.levels,
      size: summary.settings.size,
      showEnglishHint: summary.settings.showEnglishHint,
      questionIds: summary.missedItemIds,
    });
    saveGameSession("jlpt-traps", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/phonetic-traps/play/${nextSession.sessionId}`);
  }

  async function handleSaveWord(item: {
    word: string;
    reading: string;
    meanings: string[];
    level: string;
  }) {
    if (savedWords[item.word]) return;
    await addVocabularyToSrs({
      word: item.word,
      reading: item.reading,
      meaning: item.meanings.join(", "),
      level: item.level,
    });
    setSavedWords((prev) => ({ ...prev, [item.word]: true }));
  }

  if (!summary) {
    return (
      <GameLayout
        label="PHONETIC TRAP SNIPER"
        glyph="読"
        homeHref="/games/jlpt/phonetic-traps"
      >
        <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
          <h1 className="text-2xl font-bold">Session result not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start a new Phonetic Trap Sniper drill to view your trap diagnostic report.
          </p>
          <Link
            href="/games/jlpt/phonetic-traps"
            className="mt-6 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white"
          >
            New Trap Sniper Drill
          </Link>
        </section>
      </GameLayout>
    );
  }

  const answerMap = new Map(summary.answers.map((a) => [a.questionId, a]));
  const missedCount = summary.missedItemIds.length;
  const totalSeconds = Math.max(1, Math.round(summary.totalTimeMs / 1000));

  const filteredQuestions = summary.questions.filter((q) => {
    const ans = answerMap.get(q.id);
    if (filterTab === "correct") return ans?.status === "correct";
    if (filterTab === "missed") return !ans || ans.status !== "correct";
    return true;
  });

  const vulnerabilityItems = [
    {
      label: "Long-Vowel Traps (長音)",
      count: summary.vulnerabilityCounts["Long Vowel Trap"] ?? 0,
    },
    {
      label: "Dakuten & Counter Traps (連濁・助数詞)",
      count:
        (summary.vulnerabilityCounts["Dakuten / Rendaku Trap"] ?? 0) +
        (summary.vulnerabilityCounts["Counter Rendaku Trap"] ?? 0),
    },
    {
      label: "Small っ / Yōon Traps (促音・拗音)",
      count:
        (summary.vulnerabilityCounts["Small っ / Yōon Trap"] ?? 0) +
        (summary.vulnerabilityCounts["Nasal ん / Mora Trap"] ?? 0),
    },
    {
      label: "Look-Alike & Katakana (類似字・外来語)",
      count:
        (summary.vulnerabilityCounts["Look-Alike Kanji Trap"] ?? 0) +
        (summary.vulnerabilityCounts["Katakana Loanword Trap"] ?? 0),
    },
  ];

  return (
    <GameLayout
      label="PHONETIC TRAP RESULTS"
      glyph="読"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-14 pt-6 sm:px-8">
        {/* Top Score & Trap Vulnerability Summary Card */}
        <div className="grid gap-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                JLPT Vocabulary Mondai 1 &amp; 2 · Trap Diagnostic
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                Levels: {summary.settings.levels.join(", ")} · {totalSeconds}s total
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <h1 className="text-3xl font-black sm:text-4xl">
                {summary.correctCount} / {summary.total}{" "}
                <span className="text-2xl text-[var(--primary-fg)]">
                  ({summary.accuracyPercent}%)
                </span>
              </h1>
              <span className="text-xs font-bold text-[var(--muted)]">
                Avg {(summary.averageTimeMs / 1000).toFixed(1)}s / question
              </span>
            </div>

            {/* Trap Vulnerability Summary Grid */}
            <div className="mt-5">
              <h2 className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
                Trap Vulnerability Summary
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {vulnerabilityItems.map((v) => (
                  <div
                    key={v.label}
                    className={`rounded-2xl border p-3.5 ${
                      v.count > 0
                        ? "border-rose-500/40 bg-rose-500/10"
                        : "border-[var(--line)] bg-[var(--bg)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--muted)]">
                      {v.label}
                    </div>
                    <div
                      className={`mt-1 text-lg font-extrabold ${
                        v.count > 0 ? "text-rose-500" : "text-[var(--correct)]"
                      }`}
                    >
                      {v.count} missed
                    </div>
                  </div>
                ))}
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
                  <span>Practice Missed Words ({missedCount})</span>
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
                href="/games/jlpt/phonetic-traps"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-5 py-2.5 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
              >
                <Settings2 size={15} />
                <span>Change Settings</span>
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <JlptPaperIllustration className="h-52 w-40 shrink-0" />
          </div>
        </div>

        {/* Question Review Table */}
        <section aria-labelledby="review-table-heading" className="mt-9">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="review-table-heading"
              className="text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              Question Review Table ({filteredQuestions.length})
            </h2>

            {/* Filter Tabs: All · Missed / Skipped · Correct */}
            <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
              {(
                [
                  { id: "all", label: `All (${summary.total})` },
                  { id: "missed", label: `Missed / Skipped (${missedCount})` },
                  { id: "correct", label: `Correct (${summary.correctCount})` },
                ] as const
              ).map((tab) => {
                const active = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                      active
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--primary-fg)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg)]/60 text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-4 py-3">Audio</th>
                  <th className="px-4 py-3">Word &amp; Sentence</th>
                  <th className="px-4 py-3">Correct Answer</th>
                  <th className="px-4 py-3">Your Answer &amp; Trap Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredQuestions.map((q) => {
                  const ans = answerMap.get(q.id);
                  const isCorrect = ans?.status === "correct";
                  const isWordSaved = Boolean(savedWords[q.word]);

                  return (
                    <tr key={q.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              void playVocab({ word: q.word, reading: q.reading })
                            }
                            aria-label={`Play word audio for ${q.word}`}
                            className="inline-flex items-center gap-1 rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]"
                          >
                            <Volume2 size={13} />
                            <span>Word</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void playSentence(q.sentenceJa)}
                            aria-label={`Play sentence audio for ${q.word}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)]"
                          >
                            <Volume2 size={13} />
                            <span>Sent.</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-japanese text-base font-bold">
                            {q.word}
                          </span>
                          <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                            ({q.reading})
                          </span>
                          <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                            {q.level} · {q.mode === "reading" ? "問題1" : "問題2"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--muted)]">
                          {q.meanings.join(", ")}
                        </div>
                        <div className="mt-1.5 font-japanese text-xs font-semibold">
                          {q.sentenceJa}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-japanese text-base font-bold text-[var(--correct)]">
                        {q.correctText}
                      </td>

                      <td className="px-4 py-4">
                        <div
                          className={`font-japanese text-base font-bold ${
                            isCorrect ? "text-[var(--correct)]" : "text-rose-500"
                          }`}
                        >
                          {ans?.chosenText ?? "— (Skipped)"}
                        </div>
                        {!isCorrect && ans?.trapExplanation && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs text-rose-500">
                            <AlertTriangle size={12} />
                            <span>{ans.trapExplanation}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isCorrect
                                ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                                : "bg-rose-500/15 text-rose-500"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <XCircle size={13} />
                            )}
                            <span>
                              {isCorrect
                                ? "Correct"
                                : ans?.status === "skipped"
                                  ? "Skipped"
                                  : "Missed"}
                            </span>
                          </span>

                          <button
                            type="button"
                            disabled={isWordSaved}
                            onClick={() =>
                              void handleSaveWord({
                                word: q.word,
                                reading: q.reading,
                                meanings: q.meanings,
                                level: q.level,
                              })
                            }
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                              isWordSaved
                                ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                                : "border-[var(--line)] bg-[var(--bg)] text-[var(--primary-fg)] hover:border-[var(--sakura)]"
                            }`}
                          >
                            {isWordSaved ? <Check size={11} /> : <BookmarkPlus size={11} />}
                            <span>{isWordSaved ? "Saved" : "+ FSRS"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </GameLayout>
  );
}
