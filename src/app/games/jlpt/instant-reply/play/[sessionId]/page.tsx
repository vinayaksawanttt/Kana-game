"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Headphones,
  MapPin,
  RotateCcw,
  SkipForward,
  Volume2,
  XCircle,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getGameResult,
  getGameSession,
  saveGameResult,
  saveGameSession,
} from "@/lib/game-core/storage";
import {
  INSTANT_REPLY_ITEMS,
  TRAP_CATEGORY_LABELS,
  createInstantReplySession,
  instantReplyReducer,
  summarizeInstantReplySession,
  type InstantReplySession,
  type InstantReplySessionResult,
} from "@/engine/jlptInstantReply";
import {
  useInstantReplyAudio,
  type InstantReplyAudioStage,
} from "@/hooks/useInstantReplyAudio";
import { AudioButton } from "@/components/ui/AudioButton";
import { FuriganaText } from "@/components/ui/FuriganaText";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): InstantReplySession {
  const existing = getGameSession<InstantReplySession>("jlpt-reply", sessionId);
  if (existing && Array.isArray(existing.questions) && existing.questions.length > 0) {
    return existing;
  }
  const fallback = createInstantReplySession(
    INSTANT_REPLY_ITEMS,
    {
      levels: [5],
      size: 10,
      timerSeconds: 8,
      autoSequenceAudio: true,
      showSituationHint: true,
    },
    Math.random,
    sessionId,
  );
  saveGameSession("jlpt-reply", sessionId, fallback);
  return fallback;
}

export default function InstantReplyPlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [session, dispatch] = useReducer(
    instantReplyReducer,
    sessionId,
    loadInitialSession,
  );

  const {
    activeStage,
    setActiveStage,
    playFullRound,
    playSingleLine,
    cancelSequence,
  } = useInstantReplyAudio();

  const [showFurigana, setShowFurigana] = useState<boolean>(true);
  const [remainingMs, setRemainingMs] = useState<number>(
    session.settings.timerSeconds * 1000,
  );
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const roundStartRef = useRef<number>(Date.now());
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  const currentQuestion = session.questions[session.index];
  const isSessionActive = session.status === "playing";
  const isQuittingRef = useRef(false);

  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    cancelSequence("idle");
    sessionStorage.removeItem(`jlpt-reply-session:${session.sessionId}`);
    router.replace("/games/jlpt/instant-reply");
  }, [cancelSequence, confirmQuit, router, session.sessionId]);

  // Persist session & navigate on finish
  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-reply", session.sessionId, session);
    if (session.status === "finished") {
      const existingResult = getGameResult<InstantReplySessionResult>(
        "jlpt-reply",
        session.sessionId,
      );
      if (!existingResult) {
        const summary = summarizeInstantReplySession(session);
        saveGameResult("jlpt-reply", summary);
      }
      router.replace(`/games/jlpt/instant-reply/result/${session.sessionId}`);
    }
  }, [router, session]);

  // Start round audio sequence & reset timer when question index changes
  useEffect(() => {
    if (!currentQuestion || session.status !== "playing") return;
    if (session.revealed) return;

    roundStartRef.current = Date.now();
    const totalTimerMs = session.settings.timerSeconds * 1000;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingMs(totalTimerMs);

    if (session.settings.autoSequenceAudio) {
      setTimerActive(false);
      void playFullRound(currentQuestion, () => {
        roundStartRef.current = Date.now();
        if (session.settings.timerSeconds > 0) {
          setRemainingMs(session.settings.timerSeconds * 1000);
          setTimerActive(true);
        }
      });
    } else {
      setActiveStage("timer-running");
      if (session.settings.timerSeconds > 0) {
        setTimerActive(true);
      } else {
        setTimerActive(false);
      }
    }

    return () => {
      cancelSequence("idle");
    };
  }, [
    cancelSequence,
    currentQuestion,
    playFullRound,
    session.index,
    session.revealed,
    session.settings.autoSequenceAudio,
    session.settings.timerSeconds,
    session.status,
    setActiveStage,
  ]);

  // 100ms countdown tick when timerActive is true
  useEffect(() => {
    if (!timerActive || session.revealed || session.settings.timerSeconds === 0) {
      return;
    }

    const totalMs = session.settings.timerSeconds * 1000;
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, totalMs - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(interval);
        setTimerActive(false);
        cancelSequence("idle");
        dispatch({ type: "TIMEOUT", timeMs: totalMs });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [cancelSequence, session.revealed, session.settings.timerSeconds, timerActive]);

  // Auto-focus "Next Round ->" on reveal
  useEffect(() => {
    if (session.revealed) {
      nextBtnRef.current?.focus();
    }
  }, [session.revealed]);

  const handleSelectOption = useCallback(
    (optionIndex: 0 | 1 | 2) => {
      if (session.revealed) return;
      setTimerActive(false);
      cancelSequence("idle");
      const elapsed = Math.max(150, Date.now() - roundStartRef.current);
      dispatch({ type: "ANSWER", optionIndex, timeMs: elapsed });
    },
    [cancelSequence, session.revealed],
  );

  const handleSkip = useCallback(() => {
    if (session.revealed) return;
    setTimerActive(false);
    cancelSequence("idle");
    const elapsed = Math.max(100, Date.now() - roundStartRef.current);
    dispatch({ type: "SKIP", timeMs: elapsed });
  }, [cancelSequence, session.revealed]);

  const handleNext = useCallback(() => {
    if (!session.revealed) return;
    cancelSequence("idle");
    dispatch({ type: "NEXT", forIndex: session.index });
  }, [cancelSequence, session.index, session.revealed]);

  const handleReplayFullSequence = useCallback(() => {
    if (!currentQuestion) return;
    dispatch({ type: "INCREMENT_REPLAY" });
    setTimerActive(false);
    void playFullRound(currentQuestion, () => {
      if (!session.revealed && session.settings.timerSeconds > 0) {
        roundStartRef.current = Date.now();
        setRemainingMs(session.settings.timerSeconds * 1000);
        setTimerActive(true);
      }
    });
  }, [currentQuestion, playFullRound, session.revealed, session.settings.timerSeconds]);

  const handleSlowPrompt = useCallback(() => {
    if (!currentQuestion) return;
    dispatch({ type: "INCREMENT_REPLAY" });
    void playSingleLine(
      currentQuestion.promptJa,
      currentQuestion.promptReading,
      "prompt",
      0.75,
      timerActive ? "timer-running" : "idle",
    );
  }, [currentQuestion, playSingleLine, timerActive]);

  // Keyboard shortcuts: 1, 2, 3 to select; Shift+Enter to skip; Enter to advance
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!session.revealed) {
        if (e.key === "1") {
          e.preventDefault();
          handleSelectOption(0);
        } else if (e.key === "2") {
          e.preventDefault();
          handleSelectOption(1);
        } else if (e.key === "3") {
          e.preventDefault();
          handleSelectOption(2);
        } else if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          handleSkip();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSelectOption, handleSkip, session.revealed]);

  if (!currentQuestion) {
    return null;
  }

  const totalTimerMs = session.settings.timerSeconds * 1000;
  const timerRatio =
    totalTimerMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalTimerMs)) : 1;
  const timerColorClass =
    timerRatio > 0.5
      ? "bg-[var(--correct)]"
      : timerRatio > 0.25
        ? "bg-amber-500"
        : "bg-[var(--wrong)]";

  return (
    <GameLayout
      label="INSTANT REPLY BLITZ · 即時応答"
      glyph="応"
      homeHref="/games/jlpt"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-bold text-[var(--primary-fg)]">
            {session.index + 1} / {session.questions.length}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-bold">
            Score: {session.score}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 font-extrabold text-[var(--primary-fg)]">
            {currentQuestion.levelLabel}
          </span>
          <button
            type="button"
            aria-pressed={showFurigana}
            onClick={() => setShowFurigana((prev) => !prev)}
            className={`rounded-full border px-3 py-1 font-semibold transition ${
              showFurigana
                ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            {showFurigana ? "ふりがな ON" : "ふりがな OFF"}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "END" })}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-semibold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
          >
            End session
          </button>
        </div>
      }
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 pt-6 sm:px-8">
        {/* Main Stage Card with 8s Reflex Timer Bar */}
        <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_14px_38px_rgba(188,0,45,0.06)]">
          {/* Top Reflex Timer Bar */}
          {session.settings.timerSeconds > 0 && (
            <div className="h-2 w-full bg-[var(--line)]">
              <div
                className={`h-full transition-all duration-100 ${timerColorClass}`}
                style={{ width: `${Math.round(timerRatio * 100)}%` }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Top Status & Situation Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--primary-fg)]">
                  JLPT {currentQuestion.levelLabel} · {currentQuestion.category === "situational-utterance" ? "発話表現 (Mondai 3)" : "即時応答 (Mondai 4/5)"}
                </span>
                {(session.settings.showSituationHint || session.revealed) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    <MapPin size={12} className="text-[var(--primary-fg)]" aria-hidden="true" />
                    <span>
                      {currentQuestion.situationContext} · Speaker: {currentQuestion.speakerRole}
                    </span>
                  </span>
                )}
              </div>

              {/* Live Audio / Timer Status Indicator */}
              {!session.revealed && (
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {timerActive && session.settings.timerSeconds > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sakura-light)] px-3 py-1 text-[var(--primary-fg)]">
                      <Clock size={13} aria-hidden="true" />
                      <span>
                        Pick 1, 2, or 3! ({(remainingMs / 1000).toFixed(1)}s)
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-[var(--muted)]">
                      <Headphones size={13} className="text-[var(--primary-fg)]" aria-hidden="true" />
                      <span>Listening to dialogue...</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Situational Utterance Scene Card (Mondai 3) */}
            {currentQuestion.category === "situational-utterance" && (
              <div className="mt-4 rounded-2xl border-2 border-[var(--primary)] bg-[var(--sakura-light)]/40 p-4 text-left sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black text-white shadow-sm">
                    <span>⬇ You (あなた)</span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-fg)]">
                    もんだい 3 · 発話表現 (Situational Utterance)
                  </span>
                </div>
                <p className="mt-2.5 font-japanese text-base font-bold text-[var(--ink)] sm:text-lg">
                  {currentQuestion.situationContext}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Listen to the audio prompt and choose what the person indicated by the arrow (⬇ You) says!
                </p>
              </div>
            )}

            {/* Speaker A Audio Medallion OR Revealed Transcript */}
            {!session.revealed ? (
              <div className="mt-6 flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-6 text-center">
                <button
                  type="button"
                  onClick={() =>
                    void playSingleLine(
                      currentQuestion.promptJa,
                      currentQuestion.promptReading,
                      "prompt",
                      0.96,
                    )
                  }
                  aria-label="Play Speaker A prompt"
                  className={`grid size-20 place-items-center rounded-full border-2 transition ${
                    activeStage === "prompt"
                      ? "scale-105 border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_28px_rgba(208,16,76,0.4)] animate-pulse"
                      : "border-[var(--primary)]/50 bg-[var(--sakura-light)] text-[var(--primary-fg)] hover:scale-105"
                  }`}
                >
                  <Volume2 size={32} aria-hidden="true" />
                </button>

                <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                  Listen carefully — Japanese transcript &amp; 3 replies reveal after answering
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReplayFullSequence}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Replay Full Sequence</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSlowPrompt}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--primary)]"
                  >
                    <span>0.75x Slow Prompt</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Revealed Speaker A Prompt Transcript */
              <div className="mt-5 rounded-2xl border border-[var(--sakura)] bg-[var(--sakura-light)]/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                      Speaker A ({currentQuestion.speakerRole})
                    </span>
                    <p
                      lang="ja"
                      className="mt-1 font-japanese text-xl font-bold text-[var(--ink)] sm:text-2xl"
                    >
                      <FuriganaText
                        text={currentQuestion.promptFurigana || currentQuestion.promptJa}
                        showFurigana={showFurigana}
                      />
                    </p>
                    <p className="mt-1 font-japanese text-xs text-[var(--muted)]">
                      {currentQuestion.promptReading}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[var(--ink)]">
                      &ldquo;{currentQuestion.promptEn}&rdquo;
                    </p>
                  </div>

                  <AudioButton
                    text={currentQuestion.promptJa}
                    reading={currentQuestion.promptReading}
                    mode="sentence"
                    size="md"
                    label="Listen to Speaker A prompt"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Audio Option Cards (1, 2, 3) */}
        <div
          role="group"
          aria-label="Spoken reply options"
          className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3"
        >
          {currentQuestion.options.map((opt) => {
            const stageKey = `opt-${opt.index}` as InstantReplyAudioStage;
            const isSpeakingThis = activeStage === stageKey;
            const isChosen = currentQuestion.chosenIndex === opt.index;
            const isCorrect = opt.isCorrect;

            if (!session.revealed) {
              // BLIND AUDIO CARD: zero Japanese or English text shown before answering!
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectOption(opt.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectOption(opt.index);
                    }
                  }}
                  className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition cursor-pointer ${
                    isSpeakingThis
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-md ring-2 ring-[var(--primary)]/30"
                      : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`grid size-9 place-items-center rounded-xl text-sm font-extrabold ${
                        isSpeakingThis
                          ? "bg-[var(--primary)] text-white"
                          : "border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]"
                      }`}
                    >
                      {opt.optionNumber}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void playSingleLine(
                          opt.ja,
                          opt.reading,
                          stageKey,
                          1.0,
                          timerActive ? "timer-running" : "idle",
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                    >
                      <Volume2 size={12} aria-hidden="true" />
                      <span>Preview</span>
                    </button>
                  </div>

                  {/* Animated Audio Waveform Indicator */}
                  <div className="my-5 flex items-center justify-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={`w-1.5 rounded-full transition-all duration-200 ${
                          isSpeakingThis
                            ? "h-6 bg-[var(--primary)] animate-pulse"
                            : "h-2.5 bg-[var(--line)]"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-center text-xs font-bold text-[var(--ink)]">
                    Select Reply {opt.optionNumber}
                  </p>
                </div>
              );
            }

            // REVEALED OPTION CARD: full Japanese reply, reading, English gloss, audio, and trap diagnostic
            let borderClasses = "border-[var(--line)] bg-[var(--surface)]";
            if (isCorrect) {
              borderClasses = "border-[var(--correct)] bg-[var(--correct)]/10";
            } else if (isChosen && !isCorrect) {
              borderClasses = "border-[var(--wrong)] bg-[var(--wrong)]/10";
            }

            return (
              <div
                key={opt.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 ${borderClasses}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`grid size-8 place-items-center rounded-lg text-xs font-extrabold ${
                        isCorrect
                          ? "bg-[var(--correct)] text-white"
                          : isChosen
                            ? "bg-[var(--wrong)] text-white"
                            : "border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                      }`}
                    >
                      {opt.optionNumber}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <AudioButton
                        text={opt.ja}
                        reading={opt.reading}
                        mode="sentence"
                        size="sm"
                        label={`Listen to reply ${opt.optionNumber}`}
                      />
                      {isCorrect && (
                        <CheckCircle2
                          size={18}
                          className="text-[var(--correct)]"
                          aria-label="Correct reply"
                        />
                      )}
                      {isChosen && !isCorrect && (
                        <XCircle
                          size={18}
                          className="text-[var(--wrong)]"
                          aria-label="Wrong choice"
                        />
                      )}
                    </div>
                  </div>

                  <p
                    lang="ja"
                    className="mt-3 font-japanese text-lg font-bold leading-snug text-[var(--ink)]"
                  >
                    <FuriganaText
                      text={opt.furigana || opt.ja}
                      showFurigana={showFurigana}
                    />
                  </p>
                  <p className="mt-1 font-japanese text-xs text-[var(--muted)]">
                    {opt.reading}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-[var(--ink)]">
                    &ldquo;{opt.en}&rdquo;
                  </p>
                </div>

                {/* Diagnostic Badge & Trap Explanation */}
                <div className="mt-4 border-t border-[var(--line)]/60 pt-3">
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--correct)]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--correct)]">
                      ✓ Natural Response
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--wrong)]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--wrong)]">
                      <AlertTriangle size={11} aria-hidden="true" />
                      <span>
                        {opt.trapType
                          ? TRAP_CATEGORY_LABELS[opt.trapType]
                          : "Conversational Trap"}
                      </span>
                    </span>
                  )}
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {opt.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Controls */}
        {!session.revealed ? (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              Press <kbd className="rounded border px-1.5 py-0.5 font-mono">1</kbd>,{" "}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">2</kbd>, or{" "}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">3</kbd> to lock in reply ·{" "}
              <kbd className="rounded border px-1.5 py-0.5 font-mono">Shift+Enter</kbd> to skip
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--ink)]"
            >
              <SkipForward size={14} aria-hidden="true" />
              <span>Skip</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold">
              {currentQuestion.status === "correct" ? (
                <span className="text-[var(--correct)]">
                  ✓ Correct Reply ({(currentQuestion.timeMs / 1000).toFixed(1)}s)
                </span>
              ) : currentQuestion.status === "timeout" ? (
                <span className="text-[var(--wrong)]">
                  ⏰ Time Expired — Review the 3 spoken replies above
                </span>
              ) : currentQuestion.status === "wrong" ? (
                <span className="text-[var(--wrong)]">
                  ✗ Trap Triggered:{" "}
                  {currentQuestion.trapTriggered
                    ? TRAP_CATEGORY_LABELS[currentQuestion.trapTriggered]
                    : "Wrong Reply"}
                </span>
              ) : (
                <span className="text-[var(--muted)]">
                  Skipped — Review the 3 spoken replies above
                </span>
              )}
            </div>

            <button
              ref={nextBtnRef}
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
            >
              <span>
                {session.index + 1 >= session.questions.length
                  ? "See Blitz Results"
                  : "Next Round →"}
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      <QuitSessionDialog
        open={quitDialogOpen}
        onCancel={cancelQuit}
        onConfirm={quitSession}
      />
    </GameLayout>
  );
}
