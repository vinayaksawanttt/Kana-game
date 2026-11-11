"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lock,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getGameSession,
  saveGameResult,
  saveGameSession,
} from "@/lib/game-core/storage";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { AudioDialogueSequence } from "@/components/jlpt/AudioDialogueSequence";
import {
  createListeningSceneSession,
  listeningSceneReducer,
  summarizeListeningSceneSession,
  type ListeningSceneSession,
} from "@/engine/jlptListeningScene";
import { ALL_LISTENING_SCENES } from "@/data/jlpt/listeningScenesData";

function loadInitialSession(sessionId: string): ListeningSceneSession {
  const existing = getGameSession<ListeningSceneSession>("jlpt-scene", sessionId);
  if (existing && Array.isArray(existing.scenes) && existing.scenes.length > 0) {
    return existing;
  }
  const fallback = createListeningSceneSession(
    ALL_LISTENING_SCENES,
    {
      levels: ["N5"],
      sceneCount: 3,
      mode: "exam",
    },
    Math.random
  );
  fallback.sessionId = sessionId;
  saveGameSession("jlpt-scene", sessionId, fallback);
  return fallback;
}

export default function ListeningScenesPlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { playSentence, stopAudio } = useJapaneseAudio();

  const [session, dispatch] = useReducer(
    listeningSceneReducer,
    sessionId,
    loadInitialSession
  );

  const [bonusOpenForScene, setBonusOpenForScene] = useState<string | null>(null);
  const questionStartRef = useRef<number>(0);
  const isQuittingRef = useRef(false);

  const isSessionActive = session.status === "playing";
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    stopAudio();
    sessionStorage.removeItem(`jlpt-scene-session:${session.sessionId}`);
    router.replace("/games/jlpt/listening-scenes");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  const currentScene = session.scenes[session.currentSceneIndex];
  const showBonus = currentScene ? bonusOpenForScene === currentScene.id : false;

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [session.currentSceneIndex]);

  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-scene", session.sessionId, session);
    if (session.status === "finished") {
      const summary = summarizeListeningSceneSession(session);
      saveGameResult("jlpt-scene", summary);
      router.replace(`/games/jlpt/listening-scenes/result/${session.sessionId}`);
    }
  }, [router, session]);

  const primaryQuestion =
    currentScene?.questions.find((q) => q.isPrimaryMondai) ??
    currentScene?.questions[0];

  const bonusQuestions =
    currentScene?.questions.filter((q) => !q.isPrimaryMondai) ?? [];

  const isAnsweringOrAnswered =
    session.phase === "answering" || session.phase === "answered";
  const isPrimaryAnswered = session.phase === "answered";
  const isLocked = !isAnsweringOrAnswered;

  const handleSelectPrimaryOption = useCallback(
    (optionIndex: 0 | 1 | 2 | 3) => {
      if (session.phase !== "answering") return;
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const elapsed = Math.max(100, Date.now() - questionStartRef.current);
      dispatch({ type: "ANSWER_PRIMARY", optionIndex, timeMs: elapsed });
    },
    [session.phase]
  );

  const handleSelectBonusOption = useCallback(
    (questionId: string, optionIndex: 0 | 1 | 2 | 3) => {
      if (session.phase === "intro" || session.phase === "audio-playing") return;
      const elapsed = Math.max(100, Date.now() - questionStartRef.current);
      dispatch({ type: "ANSWER_BONUS", questionId, optionIndex, timeMs: elapsed });
    },
    [session.phase]
  );

  const handleNextScene = useCallback(() => {
    if (session.phase !== "answered") return;
    stopAudio();
    dispatch({ type: "NEXT_SCENE", forIndex: session.currentSceneIndex });
  }, [session.currentSceneIndex, session.phase, stopAudio]);

  // Session completed card
  if (session.status === "finished" || !currentScene) {
    const summary = summarizeListeningSceneSession(session);
    return (
      <GameLayout
        label="AUDIO LISTENING SCENE · もんだい 1・2"
        glyph="聴"
        homeHref="/games/jlpt/listening-scenes"
      >
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-8 shadow-md">
            <span className="grid size-14 mx-auto place-items-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </span>
            <h1 className="mt-4 font-japanese text-xl font-bold text-[var(--ink)]">
              聴解 演習完了！ · Listening Drill Completed
            </h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              All task-based listening scenes have been completed.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-[var(--ink)]/10 py-5">
              <div className="rounded border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-3">
                <span className="block text-[11px] font-bold text-[var(--muted)]">
                  Primary Mondai Score
                </span>
                <span className="font-mono text-2xl font-black text-[var(--primary-fg)]">
                  {summary.primaryScore} / {summary.totalScenes}
                </span>
                <span className="block text-[10px] text-[var(--muted)]">
                  ({summary.primaryAccuracy}% Accuracy)
                </span>
              </div>
              <div className="rounded border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-3">
                <span className="block text-[11px] font-bold text-[var(--muted)]">
                  Bonus Questions
                </span>
                <span className="font-mono text-2xl font-black text-[var(--ink)]">
                  {summary.bonusScore} / {summary.bonusTotal}
                </span>
                <span className="block text-[10px] text-[var(--muted)]">
                  ({summary.bonusAccuracy}% Accuracy)
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/games/jlpt/listening-scenes"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                <span>問題一覧へもどる · Setup Another Drill</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  const rightSlot = (
    <div className="flex items-center gap-2 font-mono text-xs font-bold">
      <span className="rounded bg-[var(--primary)] px-2 py-0.5 text-white shadow-2xs">
        N{currentScene.jlpt}
      </span>
      <span className="rounded border border-[var(--ink)]/15 bg-[var(--surface)] px-2 py-0.5 text-[var(--ink)]">
        {session.currentSceneIndex + 1} / {session.scenes.length}
      </span>
      <span className="hidden sm:inline-block rounded border border-[var(--ink)]/15 bg-[var(--surface)] px-2 py-0.5 text-[var(--muted)]">
        Score: {session.score}
      </span>
    </div>
  );

  return (
    <GameLayout
      label="AUDIO LISTENING SCENE · もんだい 1・2"
      glyph="聴"
      homeHref="/games/jlpt/listening-scenes"
      onNavigateHome={requestQuit}
      rightSlot={rightSlot}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Authentic Japanese Examination Sheet Wrapper */}
        <div className="rounded-sm border border-[var(--ink)]/25 bg-[var(--surface)] p-5 sm:p-7 shadow-md">
          {/* Top Exam Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--ink)] px-2 py-0.5 font-japanese text-[11px] font-black text-[var(--surface)]">
                問題 1
              </span>
              <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                課題理解 · Real-World Task Listening
              </span>
            </div>
            <span className="font-japanese text-[11px] text-[var(--muted)]">
              {currentScene.titleJa} ({currentScene.titleEn})
            </span>
          </div>

          {/* Official Instructions */}
          <div className="rounded border border-[var(--ink)]/10 bg-[var(--bg)]/40 p-3 font-japanese text-xs leading-relaxed text-[var(--ink)]">
            <p className="font-bold">
              はじめに質問を聞いてください。それから話を聞いて、問題用紙の1から4の中からいちばんいいものを一つ選んでください。
            </p>
          </div>

          {/* Audio Dialogue Sequence Player */}
          <div className="mt-4">
            <AudioDialogueSequence
              dialogueLines={currentScene.audioSequence}
              sceneId={currentScene.id}
              phase={session.phase}
              mode={session.settings.mode ?? "exam"}
              onStartAudio={() => dispatch({ type: "START_AUDIO" })}
              onAudioEnded={() => dispatch({ type: "AUDIO_ENDED" })}
              autoPlay={true}
            />
          </div>

          {/* Visual Scene Illustration */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--primary-fg)]">
                【 イラスト / 書類 · Scene Visual Cue 】
              </span>
              <span className="text-[11px] text-[var(--muted)]">
                Options 1–4 are shown in the illustration
              </span>
            </div>

            <div
              data-testid="scene-image-container"
              className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-sm border border-[var(--ink)]/20 bg-white shadow-xs"
            >
              <img
                src={currentScene.recommendedAssetPath}
                alt={currentScene.titleJa}
                className="w-full h-auto object-contain block select-none"
              />

              {/* Accessible markers for screen readers */}
              <div className="sr-only">
                {currentScene.visualObjects.map((obj) => (
                  <span
                    key={obj.id}
                    data-testid={`scene-target-badge-${obj.optionNumber}`}
                  >
                    {obj.optionNumber}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Mondai 1 Question & Options */}
          {primaryQuestion && (
            <div className="mt-8 space-y-4 border-t border-[var(--ink)]/15 pt-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
                    設問 1 · Primary Task
                  </span>
                  <span className="font-japanese text-sm font-bold text-[var(--ink)]">
                    質問：{primaryQuestion.questionJa}
                  </span>
                </div>
                <div className="pl-1 text-xs text-[var(--muted)]">
                  {primaryQuestion.questionReading} · {primaryQuestion.questionEn}
                </div>
              </div>

              {/* Lock Warning when audio has not yet ended */}
              {isLocked && (
                <div
                  data-testid="audio-lock-notice"
                  className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200"
                >
                  <Lock size={14} className="shrink-0" />
                  <span>
                    🔒 音声再生中 — 音声が終わると選択肢が解答可能になります · Options unlock after audio stream completes
                  </span>
                </div>
              )}

              {/* 4 MCQ Answer Option Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {primaryQuestion.options.map((opt, idx) => {
                  const optIdx = idx as 0 | 1 | 2 | 3;
                  const isCorrect = primaryQuestion.correctIndex === optIdx;
                  const isChosen =
                    session.currentPrimaryAnswer?.chosenIndex === optIdx;

                  let btnStyle =
                    "border-[var(--ink)]/20 bg-[var(--bg)]/40 hover:border-[var(--primary)] hover:bg-[var(--surface)] text-[var(--ink)]";

                  if (isLocked) {
                    btnStyle =
                      "border-[var(--ink)]/15 bg-[var(--bg)]/20 text-[var(--muted)] cursor-not-allowed opacity-60";
                  } else if (isPrimaryAnswered) {
                    if (isCorrect) {
                      btnStyle =
                        "border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500";
                    } else if (isChosen && !isCorrect) {
                      btnStyle =
                        "border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500";
                    } else {
                      btnStyle = "border-[var(--ink)]/10 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isLocked || isPrimaryAnswered}
                      onClick={() => handleSelectPrimaryOption(optIdx)}
                      data-testid={`primary-option-${idx + 1}`}
                      className={`flex items-center justify-between rounded-sm border p-3.5 text-left text-xs transition ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-6 place-items-center rounded-full border border-current font-mono text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-japanese font-bold text-sm">
                            {opt.labelJa}
                          </div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {opt.reading} · {opt.labelEn}
                          </div>
                        </div>
                      </div>

                      {isPrimaryAnswered && isCorrect && (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      )}
                      {isPrimaryAnswered && isChosen && !isCorrect && (
                        <XCircle size={18} className="text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Elimination Explanation */}
              {isPrimaryAnswered && (
                <div className="space-y-4 pt-2">
                  <div
                    className={`rounded-sm border p-3 text-xs font-bold ${
                      session.currentPrimaryAnswer?.isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {session.currentPrimaryAnswer?.isCorrect
                      ? "正解！ Correct! (+1 point awarded)"
                      : `不正解 Incorrect · 正解は「${
                          primaryQuestion.options[primaryQuestion.correctIndex].labelJa
                        }」です。`}
                  </div>

                  <div className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-4 shadow-2xs">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--primary-fg)]">
                      <HelpCircle size={15} />
                      <span>【 選択肢の消去ロジック · Elimination Logic &amp; Explanation 】</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--ink)]/90">
                      {primaryQuestion.eliminationExplanationEn}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Dialogue Transcript (Revealed after answering) */}
          {isPrimaryAnswered && (
            <div className="mt-8 border-t border-[var(--ink)]/15 pt-5">
              <div className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[var(--ink)]/10 pb-2.5">
                  <div className="flex items-center gap-2 font-japanese text-xs font-bold text-[var(--ink)]">
                    <Volume2 size={16} className="text-[var(--primary-fg)]" />
                    <span>会話スクリプト · Full Spoken Dialogue Transcript</span>
                  </div>
                  <span className="text-[11px] text-[var(--muted)]">
                    {currentScene.audioSequence.length} turns
                  </span>
                </div>

                <div className="mt-3 space-y-3 font-japanese text-xs leading-relaxed">
                  {currentScene.audioSequence.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded border border-[var(--ink)]/10 bg-[var(--bg)]/30 p-2.5"
                    >
                      <span className="shrink-0 rounded bg-[var(--ink)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--ink)]">
                        {line.speakerLabelJa} ({line.speakerLabelEn})
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <p className="font-semibold text-[var(--ink)]">{line.textJa}</p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {line.readingHiragana}
                        </p>
                        <p className="text-[11px] italic text-[var(--muted)]">
                          {line.textEn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          playSentence(line.textJa, undefined, {
                            reading: line.readingHiragana,
                          })
                        }
                        className="shrink-0 rounded p-1 text-[var(--muted)] hover:bg-[var(--ink)]/10 hover:text-[var(--primary-fg)] transition"
                        aria-label={`Play dialogue line ${idx + 1}`}
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Bonus Questions Toggle */}
          {bonusQuestions.length > 0 && (
            <div className="mt-6 border-t border-[var(--ink)]/15 pt-5">
              <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--primary-fg)]" />
                    <span className="font-mono text-xs font-bold text-[var(--primary-fg)]">
                      ボーナス設問 · Scene Comprehension ({bonusQuestions.length} Questions)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBonusOpenForScene((prev) =>
                        prev === currentScene?.id ? null : currentScene?.id ?? null
                      )
                    }
                    data-testid="toggle-bonus-btn"
                    className="rounded border border-[var(--ink)]/20 px-3 py-1 text-xs font-bold text-[var(--ink)] hover:bg-[var(--ink)]/5 transition"
                  >
                    {showBonus ? "Hide Bonus Questions ▲" : "Show Bonus Questions ▼"}
                  </button>
                </div>

                {showBonus && (
                  <div className="mt-4 space-y-6 border-t border-[var(--ink)]/10 pt-4">
                    {bonusQuestions.map((bq, bIdx) => {
                      const userBonusAns = session.currentBonusAnswers[bq.id];
                      const isAnsweredBonus = userBonusAns !== undefined;

                      return (
                        <div key={bq.id} className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="rounded bg-[var(--sakura-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary-fg)]">
                              Q{bIdx + 2}
                            </span>
                            <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                              {bq.questionJa}
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">
                              ({bq.questionEn})
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {bq.options.map((opt, optIdx) => {
                              const bOptionIndex = optIdx as 0 | 1 | 2 | 3;
                              const isCorrect = bq.correctIndex === optIdx;
                              const isChosen = userBonusAns?.chosenIndex === optIdx;

                              let optClass =
                                "border-[var(--ink)]/20 bg-[var(--bg)]/40 hover:border-[var(--primary)]";
                              if (isAnsweredBonus) {
                                if (isCorrect) {
                                  optClass =
                                    "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 font-bold";
                                } else if (isChosen && !isCorrect) {
                                  optClass =
                                    "border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100";
                                } else {
                                  optClass = "border-[var(--ink)]/10 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={isLocked || isAnsweredBonus}
                                  onClick={() =>
                                    handleSelectBonusOption(bq.id, bOptionIndex)
                                  }
                                  data-testid={`bonus-${bq.id}-option-${optIdx + 1}`}
                                  className={`flex items-center justify-between rounded-sm border p-2.5 text-left text-xs transition ${optClass}`}
                                >
                                  <span>
                                    <strong className="mr-1.5">{optIdx + 1}.</strong>{" "}
                                    {opt.labelJa} ({opt.labelEn})
                                  </span>
                                  {isAnsweredBonus && isCorrect && (
                                    <CheckCircle2
                                      size={14}
                                      className="text-emerald-600 shrink-0"
                                    />
                                  )}
                                  {isAnsweredBonus && isChosen && !isCorrect && (
                                    <XCircle
                                      size={14}
                                      className="text-rose-600 shrink-0"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnsweredBonus && bq.eliminationExplanationEn && (
                            <p className="text-[11px] text-[var(--muted)] italic">
                              💡 {bq.eliminationExplanationEn}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="mt-8 flex items-center justify-between border-t-2 border-[var(--ink)]/20 pt-5">
            <span className="font-mono text-xs text-[var(--muted)]">
              Scene {session.currentSceneIndex + 1} of {session.scenes.length}
            </span>

            {isPrimaryAnswered && (
              <button
                type="button"
                onClick={handleNextScene}
                data-testid="next-scene-btn"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                <span>
                  {session.currentSceneIndex < session.scenes.length - 1
                    ? "次の問題へ · Next Scene →"
                    : "演習完了 · Finish Drill →"}
                </span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <QuitSessionDialog
        open={quitDialogOpen}
        onCancel={cancelQuit}
        onConfirm={quitSession}
      />
    </GameLayout>
  );
}
