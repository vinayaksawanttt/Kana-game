"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
  Zap,
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
  INFO_SCANNER_DOCUMENTS,
  calculateInfoScannerResult,
  createInfoScannerSession,
  type InfoScannerResultSummary,
  type InfoScannerSession,
} from "@/engine/jlptInfoScanner";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

export default function InfoScannerResultPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId ?? "";

  const [result, setResult] = useState<InfoScannerResultSummary | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const { playSentence } = useJapaneseAudio();

  useEffect(() => {
    let summary = getGameResult<InfoScannerResultSummary>(
      "jlpt-scanner",
      sessionId
    );

    if (!summary) {
      const session = getGameSession<InfoScannerSession>("jlpt-scanner", sessionId);
      if (session) {
        summary = calculateInfoScannerResult(session);
        saveGameResult("jlpt-scanner", summary);
      }
    }

    if (summary) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(summary);
      playGameSfx("victory-fanfare");
    }
  }, [sessionId]);

  const docsMap = useMemo(() => {
    return new Map(INFO_SCANNER_DOCUMENTS.map((d) => [d.id, d]));
  }, []);

  function handleRetry() {
    if (!result) return;
    const session = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, result.settings);
    saveGameSession("jlpt-scanner", session.sessionId, session);
    router.push(`/games/jlpt/info-scanner/play/${session.sessionId}`);
  }

  function handlePracticeMissed() {
    if (!result || result.missedDocumentIds.length === 0) return;
    const session = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, {
      ...result.settings,
      documentCount: result.missedDocumentIds.length,
      documentIds: result.missedDocumentIds,
    });
    saveGameSession("jlpt-scanner", session.sessionId, session);
    router.push(`/games/jlpt/info-scanner/play/${session.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="REAL-WORLD INFO SCANNER"
        glyph="探"
        homeHref="/games/jlpt"
      >
        <div className="grid min-h-[60vh] place-items-center">
          <p className="text-sm text-[var(--muted)]">Loading results summary...</p>
        </div>
      </GameLayout>
    );
  }

  const isPerfect = result.score === result.totalQuestions && result.totalQuestions > 0;
  const avgTimePerDoc =
    result.totalDocuments > 0
      ? (result.totalTimeMs / result.totalDocuments / 1000).toFixed(1)
      : "0.0";

  return (
    <GameLayout
      label="REAL-WORLD INFO SCANNER · RESULT"
      glyph="探"
      homeHref="/games/jlpt"
    >
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero Score Card */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-md sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--sakura-light)] text-[var(--primary)] shadow-xs">
              {isPerfect ? (
                <Trophy className="size-8 animate-bounce text-amber-500" />
              ) : (
                <Award className="size-8" />
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-black text-white">
                Mondai 4–6 Complete
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 font-japanese text-xs font-bold text-[var(--muted)]">
                情報検索・演習結果
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
              {isPerfect
                ? "満点合格！ Perfect Information Scanning!"
                : result.accuracy >= 70
                ? "合格圏内！ Well Done!"
                : "演習完了 · Keep Practicing!"}
            </h1>

            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[var(--muted)]">
              Real-world document retrieval speed and condition matching drill summary.
            </p>

            {/* Metrics Matrix */}
            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  正解スコア
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-[var(--ink)] sm:text-3xl">
                    {result.score}
                  </span>
                  <span className="text-xs text-[var(--muted)]">/ {result.totalQuestions}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  正答率
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--primary)] sm:text-3xl">
                  {result.accuracy}%
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  総所要時間
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--ink)] sm:text-3xl font-mono">
                  {(result.totalTimeMs / 1000).toFixed(0)}s
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  平均速度 / 文書
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl font-mono">
                  {avgTimePerDoc}s
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Performance Breakdown */}
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Zap className="size-4 text-[var(--primary)]" />
              <span>Category Scanning Accuracy (文書カテゴリ別成果)</span>
            </h2>
            <span className="text-xs text-[var(--muted)]">6 Real-World Domains</span>
          </div>

          <div className="space-y-4">
            {result.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-japanese font-bold text-[var(--ink)]">
                      {cat.labelJa}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] hidden sm:inline">
                      ({cat.labelEn})
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--ink)]">
                    {cat.correct} / {cat.total} ({cat.accuracy}%)
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-500 rounded-full"
                    style={{ width: `${cat.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Document-by-Document Review Accordion */}
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--primary)]" />
              <span>Question Review &amp; Evidence Clues (解答と根拠文の復習)</span>
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {result.documentResults.length} Document items
            </span>
          </div>

          <div className="space-y-3">
            {result.documentResults.map((dr, idx) => {
              const doc = docsMap.get(dr.documentId);
              if (!doc) return null;

              const ans = dr.answers[0];
              const isAnsCorrect = ans?.isCorrect ?? false;
              const isDocSkipped = dr.status === "skipped";
              const isExpanded = expandedDocId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDocId(isExpanded ? null : doc.id)
                    }
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-[var(--surface)] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--surface)] border border-[var(--line)] text-xs font-bold">
                        {idx + 1}
                      </span>

                      {isDocSkipped ? (
                        <HelpCircle className="size-5 shrink-0 text-amber-500" />
                      ) : isAnsCorrect ? (
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="size-5 shrink-0 text-rose-500" />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-extrabold text-white">
                            {doc.level}
                          </span>
                          <span className="font-japanese font-bold text-xs sm:text-sm text-[var(--ink)] truncate">
                            {doc.titleJa}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5 font-japanese truncate">
                          {doc.documentTypeJa} · {doc.targetPersonaJa}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-[var(--muted)]">
                        {(dr.timeMs / 1000).toFixed(1)}s
                      </span>
                      <span className="text-xs text-[var(--primary)] font-bold">
                        {isExpanded ? "閉じる" : "詳細を見る"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && ans && (
                    <div className="border-t border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 space-y-3.5 text-xs">
                      {/* Prompt */}
                      <div>
                        <div className="font-japanese font-bold text-[var(--primary-fg)] mb-1">
                          【質問】
                        </div>
                        <p className="font-japanese text-xs sm:text-sm text-[var(--ink)]">
                          {ans.questionNumber}. {doc.questions[0].promptJa}
                        </p>
                      </div>

                      {/* Answers Comparison */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div
                          className={`rounded-xl border p-3 ${
                            isDocSkipped
                              ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                              : isAnsCorrect
                              ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
                              : "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
                          }`}
                        >
                          <span className="font-bold block mb-0.5">あなたの解答 (Your Answer):</span>
                          <span className="font-japanese">
                            {isDocSkipped ? "（スキップ）" : ans.chosenTextJa ?? "未選択"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-emerald-950 dark:text-emerald-100">
                          <span className="font-bold block mb-0.5">正解 (Correct Answer):</span>
                          <span className="font-japanese font-semibold">
                            {ans.correctTextJa}
                          </span>
                        </div>
                      </div>

                      {/* Clue Quote */}
                      <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-japanese font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                            <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                            正解の根拠文 (Clue Quote):
                          </span>
                          <button
                            type="button"
                            onClick={() => playSentence(ans.clueQuoteJa, ans.questionId)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer"
                          >
                            <Volume2 className="size-3" />
                            <span>音声を聞く</span>
                          </button>
                        </div>
                        <p className="font-japanese text-xs leading-relaxed text-[var(--ink)]">
                          {ans.clueQuoteJa}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-1">
                        <div className="font-japanese font-bold text-[var(--muted)]">
                          【解説】
                        </div>
                        <p className="font-japanese leading-relaxed text-[var(--ink)]">
                          {ans.explanationJa}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] italic">
                          {ans.explanationEn}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Action Bottom Row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/games/jlpt"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>試験会場トップへ / Exam Arena</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {result.missedDocumentIds.length > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissed}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/50 px-5 py-3 text-xs font-bold text-rose-700 dark:text-rose-200 transition hover:bg-rose-100 cursor-pointer shadow-xs"
              >
                <span>間違えた問題のみ復習 ({result.missedDocumentIds.length}問)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              <RotateCcw className="size-4" />
              <span>もう一度挑戦する / Retry Drill</span>
            </button>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
