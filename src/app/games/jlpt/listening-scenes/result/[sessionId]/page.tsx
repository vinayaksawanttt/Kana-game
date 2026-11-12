"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
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
  createListeningSceneSession,
  summarizeListeningSceneSession,
  type ListeningSceneSession,
  type ListeningSceneSessionResult,
} from "@/engine/jlptListeningScene";
import { ALL_LISTENING_SCENES } from "@/data/jlpt/listeningScenesData";

type SceneFilter = "all" | "missed" | "correct";

function loadResultSummary(sessionId: string): ListeningSceneSessionResult | null {
  const savedResult = getGameResult<ListeningSceneSessionResult>(
    "jlpt-scene",
    sessionId
  );
  if (savedResult && savedResult.totalScenes > 0) {
    return savedResult;
  }

  const session = getGameSession<ListeningSceneSession>("jlpt-scene", sessionId);
  if (session && Array.isArray(session.results) && session.results.length > 0) {
    const computed = summarizeListeningSceneSession(session);
    saveGameResult("jlpt-scene", computed);
    return computed;
  }

  return null;
}

export default function ListeningScenesResultPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [result] = useState<ListeningSceneSessionResult | null>(() =>
    loadResultSummary(sessionId)
  );
  const [filter, setFilter] = useState<SceneFilter>("all");

  useEffect(() => {
    if (result) {
      playGameSfx("victory-fanfare");
    }
  }, [result]);

  const sceneMap = useMemo(() => {
    const map = new Map<string, (typeof ALL_LISTENING_SCENES)[number]>();
    for (const sc of ALL_LISTENING_SCENES) {
      map.set(sc.id, sc);
    }
    return map;
  }, []);

  const avgResponseTimeMs = useMemo(() => {
    if (!result) return null;
    const times = result.results
      .map((r) => r.primaryAnswer?.timeMs)
      .filter((t): t is number => typeof t === "number" && t > 0);
    if (times.length === 0) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [result]);

  const filteredResults = useMemo(() => {
    if (!result) return [];
    if (filter === "missed") {
      return result.results.filter((r) => !r.primaryAnswer?.isCorrect);
    }
    if (filter === "correct") {
      return result.results.filter((r) => Boolean(r.primaryAnswer?.isCorrect));
    }
    return result.results;
  }, [filter, result]);

  function handlePlayAgain() {
    if (!result) return;
    const nextSession = createListeningSceneSession(
      ALL_LISTENING_SCENES,
      result.settings
    );
    saveGameSession("jlpt-scene", nextSession.sessionId, nextSession);
    router.push(`/games/jlpt/listening-scenes/play/${nextSession.sessionId}`);
  }

  if (!result) {
    return (
      <GameLayout
        label="AUDIO LISTENING SCENE · RESULTS"
        glyph="聴"
        homeHref="/games/jlpt/listening-scenes"
      >
        <section className="mx-auto max-w-2xl px-5 py-16 text-center">
          <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-8 shadow-md">
            <h1 className="font-japanese text-xl font-bold text-[var(--ink)]">
              演習結果が見つかりません · Session Result Not Found
            </h1>
            <p className="mt-2 text-xs text-[var(--muted)]">
              This Listening Scene session was not found in storage or was terminated before recording any answers.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/games/jlpt/listening-scenes"
                className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                Start New Drill
              </Link>
              <Link
                href="/games/jlpt"
                className="rounded-full border border-[var(--ink)]/20 bg-[var(--surface)] px-6 py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--ink)]/5 transition"
              >
                Back to JLPT Arena
              </Link>
            </div>
          </div>
        </section>
      </GameLayout>
    );
  }

  return (
    <GameLayout
      label="AUDIO LISTENING SCENE · RESULTS"
      glyph="聴"
      homeHref="/games/jlpt/listening-scenes"
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Authentic Examination Result Header Sheet */}
        <div className="rounded-sm border border-[var(--ink)]/25 bg-[var(--surface)] p-6 sm:p-8 shadow-md">
          {/* Header Title */}
          <div className="border-b border-[var(--ink)]/15 pb-4 text-center">
            <span className="inline-block rounded-full bg-[var(--sakura-light)] px-3 py-1 font-mono text-xs font-bold text-[var(--primary-fg)] border border-[var(--primary)]/30">
              第3部 聴解 · 問題 1 課題理解 判定書
            </span>
            <h1 className="mt-2 font-japanese text-xl sm:text-2xl font-black text-[var(--ink)]">
              Listening Scene Drill Results
            </h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Completed {result.completedScenes} of {result.totalScenes} scenes
            </p>
          </div>

          {/* Primary Metrics Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[var(--ink)]/15 pb-6">
            {/* Primary Question Accuracy */}
            <div className="rounded-sm border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-4 text-center">
              <span className="block text-xs font-bold text-[var(--muted)]">
                Primary Accuracy (Mondai 1)
              </span>
              <span
                data-testid="primary-accuracy"
                className="mt-1 block font-mono text-3xl font-black text-[var(--primary-fg)]"
              >
                {result.primaryScore} / {result.completedScenes}
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)]">
                {result.primaryAccuracy}% Correct
              </span>
            </div>

            {/* Average Response Time */}
            <div className="rounded-sm border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-4 text-center">
              <span className="block text-xs font-bold text-[var(--muted)]">
                Avg Response Time
              </span>
              <span
                data-testid="avg-response-time"
                className="mt-1 block font-mono text-3xl font-black text-[var(--ink)]"
              >
                {avgResponseTimeMs !== null
                  ? `${(avgResponseTimeMs / 1000).toFixed(1)}s`
                  : "—"}
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                {avgResponseTimeMs !== null ? "After audio ended" : "No times recorded"}
              </span>
            </div>

            {/* Bonus Questions Accuracy */}
            <div className="rounded-sm border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-4 text-center">
              <span className="block text-xs font-bold text-[var(--muted)]">
                Bonus Scene Comprehension
              </span>
              <span
                data-testid="bonus-score"
                className="mt-1 block font-mono text-3xl font-black text-[var(--ink)]"
              >
                {result.bonusScore} / {result.bonusTotal}
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                {result.bonusTotal > 0
                  ? `${result.bonusAccuracy}% Accuracy`
                  : "None attempted"}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)]/15 pb-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePlayAgain}
                data-testid="play-again-btn"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                <RotateCcw size={14} />
                <span>Play Again (Same Settings)</span>
              </button>

              <Link
                href="/games/jlpt/listening-scenes"
                data-testid="change-settings-btn"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/20 bg-[var(--surface)] px-5 py-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--ink)]/5 transition"
              >
                <span>Change Settings</span>
              </Link>
            </div>

            <Link
              href="/games/jlpt"
              className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary-fg)] transition"
            >
              ← Back to JLPT Exam Arena
            </Link>
          </div>

          {/* Per-Scene Review Section */}
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-japanese text-sm font-bold text-[var(--ink)]">
                問題別 詳細解答 · Per-Scene Breakdown &amp; Analysis
              </h2>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 rounded border border-[var(--ink)]/15 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded px-2.5 py-1 font-bold transition ${
                    filter === "all"
                      ? "bg-[var(--primary)] text-white shadow-2xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  All ({result.results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("correct")}
                  className={`rounded px-2.5 py-1 font-bold transition ${
                    filter === "correct"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  Correct ({result.primaryScore})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("missed")}
                  className={`rounded px-2.5 py-1 font-bold transition ${
                    filter === "missed"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  Missed ({result.results.length - result.primaryScore})
                </button>
              </div>
            </div>

            {/* List of Breakdown Cards */}
            <div className="space-y-4">
              {filteredResults.map((record, idx) => {
                const scene = sceneMap.get(record.sceneId);
                const primaryQ = scene?.questions.find((q) => q.isPrimaryMondai) ?? scene?.questions[0];
                const isCorrect = Boolean(record.primaryAnswer?.isCorrect);
                const chosenIdx = record.primaryAnswer?.chosenIndex;
                const correctIdx = primaryQ?.correctIndex ?? 0;

                const chosenOption = chosenIdx !== undefined && primaryQ ? primaryQ.options[chosenIdx] : null;
                const correctOption = primaryQ ? primaryQ.options[correctIdx] : null;

                return (
                  <div
                    key={record.sceneId}
                    data-testid={`breakdown-scene-${record.sceneId}`}
                    className={`rounded-sm border p-4 shadow-2xs transition ${
                      isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                    }`}
                  >
                    {/* Scene Item Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--ink)] px-2 py-0.5 font-mono text-[11px] font-black text-white">
                          Scene {idx + 1}
                        </span>
                        <span className="rounded bg-[var(--primary)] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                          {record.level}
                        </span>
                        <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                          {scene?.titleJa ?? record.sceneId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        {record.primaryAnswer?.timeMs && (
                          <span className="inline-flex items-center gap-1 text-[var(--muted)]">
                            <Clock size={12} />
                            {(record.primaryAnswer.timeMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                            isCorrect
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                              : "bg-rose-500/15 text-rose-800 dark:text-rose-300"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 size={13} /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> Missed
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Question text */}
                    {primaryQ && (
                      <div className="mt-3 text-xs leading-relaxed">
                        <p className="font-japanese font-bold text-[var(--ink)]">
                          質問：{primaryQ.questionJa}
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {primaryQ.questionReading} · {primaryQ.questionEn}
                        </p>
                      </div>
                    )}

                    {/* Answers Comparison */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Learner's Choice */}
                      <div className="rounded border border-[var(--ink)]/10 bg-[var(--surface)] p-2.5">
                        <span className="block text-[10px] font-bold text-[var(--muted)]">
                          Your Answer:
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 font-semibold">
                          {isCorrect ? (
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle size={15} className="text-rose-600 shrink-0" />
                          )}
                          <span>
                            {chosenOption
                              ? `${(chosenIdx ?? 0) + 1}. ${chosenOption.labelJa} (${chosenOption.labelEn})`
                              : "No Answer"}
                          </span>
                        </div>
                      </div>

                      {/* Official Correct Answer */}
                      <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                        <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          Official Correct Option:
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>
                            {correctOption
                              ? `${correctIdx + 1}. ${correctOption.labelJa} (${correctOption.labelEn})`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {primaryQ?.eliminationExplanationEn && (
                      <div className="mt-3 rounded border border-[var(--ink)]/10 bg-[var(--bg)]/30 p-2.5 text-xs text-[var(--ink)]/90 leading-relaxed">
                        <span className="font-bold text-[var(--primary-fg)] mr-1">
                          【解説】
                        </span>
                        {primaryQ.eliminationExplanationEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
