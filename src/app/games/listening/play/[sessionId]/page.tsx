"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Check, Pause, RotateCcw, SkipForward, Volume2, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { getGameSession, saveGameResult, saveGameSession } from "@/lib/game-core/storage";
import {
  listeningReducer,
  summarizeListeningSession,
  type ListeningQuestion,
  type ListeningSession,
} from "@/engine/listening";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { addVocabularyToSrs } from "@/lib/srs/service";

function SoundWaveBars({ active }: { active: boolean }) {
  const bars = [
    { height: "h-2.5", activeHeight: "h-5", delay: "0ms" },
    { height: "h-3.5", activeHeight: "h-7", delay: "120ms" },
    { height: "h-2", activeHeight: "h-8", delay: "240ms" },
    { height: "h-4", activeHeight: "h-6", delay: "160ms" },
    { height: "h-2.5", activeHeight: "h-4", delay: "80ms" },
  ];

  return (
    <div
      role="status"
      aria-label={active ? "Audio playing" : "Audio idle"}
      className="flex h-8 items-center justify-center gap-1"
    >
      {bars.map((bar, idx) => (
        <span
          key={idx}
          style={active ? { animationDelay: bar.delay } : undefined}
          className={`w-1 rounded-full transition-all duration-300 ${
            active
              ? `${bar.activeHeight} bg-[var(--primary)] animate-pulse`
              : `${bar.height} bg-[var(--sakura)]/60`
          }`}
        />
      ))}
    </div>
  );
}

export default function ListeningPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Loading Audio Stage..." size="md" />
        </main>
      }
    >
      <ListeningPlayContent />
    </Suspense>
  );
}

function ListeningPlayContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<ListeningSession | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hasPaused, setHasPaused] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState("");
  const questionStartRef = useRef<number>(Date.now());
  const autoPlayedIndexRef = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    playKana,
    playVocab,
    playSentence,
    stopAudio,
  } = useJapaneseAudio();

  const currentQuestion: ListeningQuestion | undefined = session?.questions[session.index];
  const isAnswered = currentQuestion ? currentQuestion.status !== "pending" : false;
  const isSessionActive = Boolean(session && !session.completedAt);

  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  // Restore session from sessionStorage
  useEffect(() => {
    if (session) return;
    const stored = getGameSession<ListeningSession>("listening", sessionId);
    if (!stored || !Array.isArray(stored.questions) || stored.questions.length === 0) {
      router.replace("/games/listening");
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setSession(stored);
    questionStartRef.current = Date.now();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, sessionId, session]);

  const playQuestionAudio = useCallback(
    (question: ListeningQuestion, rateOverride?: number) => {
      const { audioPayload } = question;
      const effectiveRate = rateOverride ?? playbackSpeed;
      if (audioPayload.type === "kana") {
        playKana(audioPayload.charOrWord, audioPayload.reading, effectiveRate);
      } else if (audioPayload.type === "vocab") {
        playVocab(
          { word: audioPayload.charOrWord, reading: audioPayload.reading },
          effectiveRate
        );
      } else {
        playSentence(audioPayload.sentenceJa || audioPayload.charOrWord, question.id, {
          audioSrc: audioPayload.audioSrc,
          reading: audioPayload.reading,
          rate: effectiveRate,
        });
      }
    },
    [playKana, playVocab, playSentence, playbackSpeed]
  );

  // Auto-play audio when a new question card mounts
  useEffect(() => {
    if (!session || !currentQuestion) return;
    if (autoPlayedIndexRef.current !== session.index) {
      autoPlayedIndexRef.current = session.index;
      questionStartRef.current = Date.now();
      playQuestionAudio(currentQuestion);
    }
  }, [session, currentQuestion, playQuestionAudio]);

  // Manage focus between typing input and Next button
  useEffect(() => {
    if (!session || !currentQuestion) return;
    if (currentQuestion.status === "pending") {
      if (session.settings.answerFormat === "typing") {
        inputRef.current?.focus();
      } else {
        // Multiple choice: blur active element so Skip button is NOT tab-focused by default
        if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    } else {
      nextButtonRef.current?.focus();
    }
  }, [session?.index, currentQuestion?.status, session?.settings?.answerFormat]);

  const updateSession = useCallback(
    (updater: (prev: ListeningSession) => ListeningSession) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        saveGameSession("listening", next.sessionId, next);
        return next;
      });
    },
    []
  );

  const handleReplay = useCallback(
    (rateOverride?: number) => {
      if (!currentQuestion) return;
      setHasPaused(false);
      updateSession((prev) => listeningReducer(prev, { type: "INCREMENT_REPLAY" }));
      playQuestionAudio(currentQuestion, rateOverride);
    },
    [currentQuestion, playQuestionAudio, updateSession]
  );

  const handlePause = useCallback(() => {
    stopAudio();
    setHasPaused(true);
  }, [stopAudio]);

  const finalizeAndNavigate = useCallback(
    (targetSession: ListeningSession) => {
      stopAudio();
      const ended = listeningReducer(targetSession, { type: "END" });
      const summary = summarizeListeningSession(ended);
      saveGameResult("listening", summary);
      sessionStorage.removeItem(`listening-session:${ended.sessionId}`);
      router.push(`/games/listening/result/${ended.sessionId}`);
    },
    [router, stopAudio]
  );

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!session || !currentQuestion || currentQuestion.status !== "pending") return;
      const elapsed = Math.max(100, Date.now() - questionStartRef.current);
      // Explicitly blur any active element (e.g. Skip button) so focus immediately transitions to Next
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const nextSession = listeningReducer(session, {
        type: "SUBMIT_CHOICE",
        optionId,
        timeMs: elapsed,
      });
      const updatedQ = nextSession.questions[nextSession.index];
      playGameSfx(updatedQ?.status === "correct" ? "correct-chime" : "incorrect-chime");
      updateSession(() => nextSession);
    },
    [session, currentQuestion, updateSession]
  );

  const handleSubmitTyped = useCallback(() => {
    if (!session || !currentQuestion || currentQuestion.status !== "pending") return;
    if (!typedAnswer.trim()) return;
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    const nextSession = listeningReducer(session, {
      type: "SUBMIT_TYPED",
      input: typedAnswer,
      timeMs: elapsed,
    });
    const updatedQ = nextSession.questions[nextSession.index];
    playGameSfx(updatedQ?.status === "correct" ? "correct-chime" : "incorrect-chime");
    updateSession(() => nextSession);
  }, [session, currentQuestion, typedAnswer, updateSession]);

  const handleSkip = useCallback(() => {
    if (!session || !currentQuestion || currentQuestion.status !== "pending") return;
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    updateSession((prev) => listeningReducer(prev, { type: "SKIP", timeMs: elapsed }));
  }, [session, currentQuestion, updateSession]);

  const handleNext = useCallback(() => {
    if (!session || !currentQuestion || currentQuestion.status === "pending") return;
    if (session.index + 1 >= session.questions.length) {
      finalizeAndNavigate(session);
      return;
    }
    playGameSfx("card-flip");
    setTypedAnswer("");
    setHasPaused(false);
    const currentIdx = session.index;
    // Explicitly blur any currently focused element so the newly rendered Skip button doesn't inherit focus!
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    updateSession((prev) =>
      listeningReducer(prev, { type: "NEXT", forIndex: currentIdx })
    );
  }, [session, currentQuestion, finalizeAndNavigate, updateSession]);

  // Global keyboard shortcuts (1-4 for options, Space/Alt+S for replay, Enter for Next)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!session || !currentQuestion || quitDialogOpen) return;

      // Alt+S or Ctrl+Space always replays audio
      if ((e.altKey && e.key.toLowerCase() === "s") || (e.ctrlKey && e.code === "Space")) {
        e.preventDefault();
        handleReplay();
        return;
      }

      if (currentQuestion.status === "pending") {
        if (session.settings.answerFormat === "multiple-choice") {
          if (e.code === "Space") {
            e.preventDefault();
            handleReplay();
            return;
          }
          if (["1", "2", "3", "4"].includes(e.key)) {
            const idx = Number(e.key) - 1;
            const opt = currentQuestion.options[idx];
            if (opt) {
              e.preventDefault();
              handleSelectOption(opt.id);
            }
            return;
          }
          // Prevent accidental Enter from skipping pending questions
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) {
              handleSkip();
            }
            return;
          }
        } else {
          // Typing mode: Space on empty input replays audio; Shift+Enter skips
          if (e.code === "Space" && typedAnswer.length === 0) {
            e.preventDefault();
            handleReplay();
            return;
          }
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            handleSkip();
            return;
          }
        }
      } else {
        // Answered state: Enter advances to next question, Space replays audio
        if (e.key === "Enter") {
          e.preventDefault();
          handleNext();
        } else if (e.code === "Space" && document.activeElement !== nextButtonRef.current) {
          e.preventDefault();
          handleReplay();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    session,
    currentQuestion,
    quitDialogOpen,
    typedAnswer,
    handleReplay,
    handleSelectOption,
    handleSkip,
    handleNext,
  ]);

  async function saveToFsrs(question: ListeningQuestion) {
    if (savedIds.has(question.id) || savingId) return;
    setSavingId(question.id);
    try {
      await addVocabularyToSrs({
        word: question.hiddenPromptJa,
        reading: question.hiddenReading,
        meaning: question.correctMeaning,
        level: question.jlpt ? `N${question.jlpt}` : "N5",
      });
      setSavedIds((prev) => new Set(prev).add(question.id));
    } catch (err) {
      console.error("Failed to save item to FSRS:", err);
    } finally {
      setSavingId("");
    }
  }

  function handleQuitConfirm() {
    confirmQuit();
    stopAudio();
    if (session) {
      sessionStorage.removeItem(`listening-session:${session.sessionId}`);
    }
    router.replace("/games/listening");
  }

  if (!session || !currentQuestion) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Audio Prompt..." size="md" />
      </main>
    );
  }

  const totalQuestions = session.questions.length;
  const currentNumber = session.index + 1;
  const progressPct = Math.round((currentNumber / totalQuestions) * 100);
  const correctSoFar = session.questions.filter((q) => q.status === "correct").length;
  const expectedAnswerDisplay =
    currentQuestion.subMode === "sentences" && session.settings.sentenceLanguage === "ja"
      ? currentQuestion.hiddenPromptJa
      : currentQuestion.correctMeaning;

  return (
    <GameLayout
      label="LISTENING"
      glyph="聴"
      homeHref="/games/listening"
      onNavigateHome={requestQuit}
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary)] tabular-nums">
            {currentNumber} / {totalQuestions}
          </span>
          <span className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold sm:inline-flex tabular-nums">
            Score: {correctSoFar}
          </span>
          <button
            type="button"
            onClick={() => finalizeAndNavigate(session)}
            className="min-h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer"
          >
            End session
          </button>
        </div>
      }
    >
      {/* Top Progress Bar */}
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 sm:px-8">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-[var(--muted)]">
          <span>
            Question {currentNumber} of {totalQuestions}
          </span>
          <span className="tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-6 sm:px-8">
        {/* Center Audio Stage Card ("Blind Listening" Card) */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
              {currentQuestion.subMode === "kana"
                ? "Kana Ear Training"
                : currentQuestion.subMode === "vocabulary"
                  ? "Vocabulary Listening"
                  : "Sentence Comprehension"}
            </span>
            {currentQuestion.jlpt && (
              <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                N{currentQuestion.jlpt}
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isPlaying
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : hasPaused
                    ? "bg-[var(--line)] text-[var(--ink)]"
                    : "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]"
              }`}
            >
              {isPlaying
                ? "Playing"
                : hasPaused
                  ? "Paused"
                  : currentQuestion.replaysUsed > 0
                    ? `Replayed ${currentQuestion.replaysUsed}x`
                    : "Audio Ready"}
            </span>
          </div>

          {!isAnswered ? (
            /* Blind Audio Prompt View (Japanese text hidden!) */
            <div className="my-5 flex flex-col items-center">
              <button
                type="button"
                aria-label={isPlaying ? "Pause audio prompt" : "Play audio prompt"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (isPlaying ? handlePause() : handleReplay())}
                className={`group relative grid size-24 place-items-center rounded-full border-2 transition-all cursor-pointer ${
                  isPlaying
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_0_10px_rgba(188,0,45,0.14)] scale-105"
                    : "border-[var(--sakura)] bg-[var(--sakura-light)] text-[var(--primary)] hover:border-[var(--primary)] hover:scale-105"
                }`}
              >
                {isPlaying ? (
                  <Pause size={34} />
                ) : (
                  <Volume2 size={38} />
                )}
              </button>
              <div className="mt-3">
                <SoundWaveBars active={isPlaying} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                {isPlaying
                  ? "Playing audio prompt..."
                  : hasPaused
                    ? "Audio paused — press Replay Audio or Space to listen again"
                    : "Listen carefully — Japanese transcript reveals after answering"}
              </p>
            </div>
          ) : (
            /* Revealed Japanese Transcript View */
            <div className="my-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    currentQuestion.status === "correct"
                      ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                      : currentQuestion.status === "wrong"
                        ? "bg-[var(--wrong)]/15 text-[var(--wrong)]"
                        : "bg-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {currentQuestion.status === "correct" ? (
                    <>
                      <Check size={13} strokeWidth={3} aria-hidden="true" /> Correct!
                    </>
                  ) : currentQuestion.status === "wrong" ? (
                    <>
                      <X size={13} strokeWidth={3} aria-hidden="true" /> Incorrect
                    </>
                  ) : (
                    "Skipped"
                  )}
                </span>

                {currentQuestion.subMode !== "kana" && (
                  <button
                    type="button"
                    disabled={savedIds.has(currentQuestion.id) || savingId === currentQuestion.id}
                    onClick={() => saveToFsrs(currentQuestion)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] disabled:opacity-60 cursor-pointer"
                  >
                    {savedIds.has(currentQuestion.id) ? (
                      <>
                        <Check size={13} className="text-[var(--correct)]" /> Saved to FSRS
                      </>
                    ) : (
                      <>
                        <Bookmark size={13} className="text-[var(--primary)]" /> + FSRS
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="font-japanese text-3xl font-bold leading-snug text-[var(--ink)] sm:text-4xl">
                {currentQuestion.hiddenPromptJa}
              </p>
              {currentQuestion.hiddenReading &&
                currentQuestion.hiddenReading !== currentQuestion.hiddenPromptJa && (
                  <p className="mt-1.5 font-japanese text-base font-semibold text-[var(--primary)]">
                    {currentQuestion.hiddenReading}
                  </p>
                )}
              <p className="mt-2 text-base font-bold text-[var(--ink)]">
                {currentQuestion.correctMeaning}
              </p>

              {/* Separate User Answer vs Correct Answer Comparison */}
              <div className="mt-4 grid gap-2.5 text-left sm:grid-cols-2">
                <div
                  className={`rounded-xl border px-3.5 py-2.5 ${
                    currentQuestion.status === "correct"
                      ? "border-[var(--correct)]/40 bg-[var(--correct)]/10"
                      : currentQuestion.status === "wrong"
                        ? "border-[var(--wrong)]/40 bg-[var(--wrong)]/10"
                        : "border-[var(--line)] bg-[var(--surface)]"
                  }`}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Your Answer
                  </span>
                  <span
                    className={`mt-0.5 flex items-center gap-1.5 text-sm font-bold ${
                      currentQuestion.status === "correct"
                        ? "text-[var(--correct)]"
                        : currentQuestion.status === "wrong"
                          ? "text-[var(--wrong)]"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    {currentQuestion.status === "correct" && (
                      <Check size={14} strokeWidth={3} className="shrink-0" aria-hidden="true" />
                    )}
                    {currentQuestion.status === "wrong" && (
                      <X size={14} strokeWidth={3} className="shrink-0" aria-hidden="true" />
                    )}
                    <span className="break-words">
                      {currentQuestion.status === "skipped"
                        ? "Skipped (no answer)"
                        : currentQuestion.userAnswer || "—"}
                    </span>
                  </span>
                </div>

                <div className="rounded-xl border border-[var(--correct)]/40 bg-[var(--correct)]/10 px-3.5 py-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Correct Answer
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <Check
                      size={14}
                      strokeWidth={3}
                      className="shrink-0 text-[var(--correct)]"
                      aria-hidden="true"
                    />
                    <span
                      className={`break-words ${
                        currentQuestion.subMode === "sentences" &&
                        session.settings.sentenceLanguage === "ja"
                          ? "font-japanese"
                          : ""
                      }`}
                    >
                      {expectedAnswerDisplay}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Direct Playback Controls on Card */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleReplay()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-all hover:bg-[var(--primary-hover)] active:scale-95 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>
                Replay Audio
                {currentQuestion.replaysUsed > 0 ? ` (${currentQuestion.replaysUsed})` : ""}
              </span>
            </button>

            {isPlaying && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handlePause}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] cursor-pointer"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}

            {/* Playback Speed Segmented Toggle Group */}
            <div
              role="group"
              aria-label="Playback speed"
              className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 shadow-xs"
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setPlaybackSpeed(1);
                  handleReplay(1);
                }}
                aria-pressed={playbackSpeed === 1}
                className={`min-h-8 rounded-full px-3 text-xs font-bold transition-all cursor-pointer ${
                  playbackSpeed === 1
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                1.0x
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setPlaybackSpeed(0.75);
                  handleReplay(0.75);
                }}
                aria-pressed={playbackSpeed === 0.75}
                className={`min-h-8 rounded-full px-3 text-xs font-bold transition-all cursor-pointer ${
                  playbackSpeed === 0.75
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                0.75x Slow
              </button>
            </div>
          </div>
        </div>

        {/* Answer Area Below the Card */}
        <div className="mt-5">
          {session.settings.answerFormat === "multiple-choice" ? (
            <div>
              <div
                className={`grid gap-3 ${
                  currentQuestion.subMode === "sentences"
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrectOpt = opt.id === currentQuestion.id;
                  const isChosen =
                    isAnswered && currentQuestion.userAnswer === opt.label;
                  const isSkippedCorrect =
                    isAnswered && currentQuestion.status === "skipped" && isCorrectOpt;

                  let cardClass =
                    "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/25";
                  let badgeClass =
                    "bg-[var(--sakura-light)] text-[var(--primary)]";
                  if (isAnswered) {
                    if (isCorrectOpt) {
                      cardClass =
                        "border-[var(--correct)] bg-[var(--correct)]/12 text-[var(--ink)] ring-1 ring-[var(--correct)]/30";
                      badgeClass = "bg-[var(--correct)] text-white";
                    } else if (isChosen) {
                      cardClass =
                        "border-[var(--wrong)] bg-[var(--wrong)]/12 text-[var(--ink)] ring-1 ring-[var(--wrong)]/30";
                      badgeClass = "bg-[var(--wrong)] text-white";
                    } else {
                      cardClass = "border-[var(--line)] bg-[var(--surface)] opacity-55";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex min-h-14 items-center gap-3.5 rounded-xl border p-4 text-left transition-all cursor-pointer disabled:cursor-default ${cardClass}`}
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-md text-xs font-extrabold transition-colors ${badgeClass}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block font-bold leading-relaxed ${
                            currentQuestion.subMode === "kana" ||
                            (currentQuestion.subMode === "sentences" &&
                              session.settings.sentenceLanguage === "ja")
                              ? "font-japanese text-base sm:text-lg"
                              : currentQuestion.subMode === "sentences"
                                ? "text-sm sm:text-[15px]"
                                : "text-sm sm:text-base"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isAnswered && opt.subLabel && (
                          <span
                            className={`mt-1 block text-xs leading-relaxed ${
                              session.settings.sentenceLanguage === "ja"
                                ? "text-[var(--muted)]"
                                : "font-japanese text-[var(--muted)]"
                            }`}
                          >
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                      {isAnswered && (isCorrectOpt || isChosen) && (
                        <span
                          aria-hidden="true"
                          className={`grid size-6 shrink-0 place-items-center rounded-full ${
                            isCorrectOpt
                              ? "bg-[var(--correct)] text-white"
                              : "bg-[var(--wrong)] text-white"
                          }`}
                        >
                          {isCorrectOpt ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                        </span>
                      )}
                      {isSkippedCorrect && (
                        <span className="shrink-0 rounded-full bg-[var(--line)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                          Answer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {!isAnswered ? (
                  <>
                    <p className="text-xs text-[var(--muted)]">
                      Tip: Press{" "}
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                        1
                      </kbd>
                      –
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                        4
                      </kbd>{" "}
                      to choose •{" "}
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                        Space
                      </kbd>{" "}
                      to replay
                    </p>
                    <button
                      key="skip-btn"
                      type="button"
                      onKeyDown={(e) => {
                        // Prevent accidental plain Enter from triggering Skip when tabbed
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                        }
                      }}
                      onClick={handleSkip}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                    >
                      <SkipForward size={14} /> Skip (Shift+Enter)
                    </button>
                  </>
                ) : (
                  <div className="flex w-full items-center justify-between gap-3">
                    <p className="text-xs text-[var(--muted)]">
                      Press{" "}
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                        Enter
                      </kbd>{" "}
                      to continue •{" "}
                      <kbd className="rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                        Space
                      </kbd>{" "}
                      to replay
                    </p>
                    <button
                      key="next-btn"
                      ref={nextButtonRef}
                      type="button"
                      onClick={handleNext}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                    >
                      <span>
                        {currentNumber < totalQuestions ? "Next →" : "See Results →"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Typing / Dictation Mode */
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              {!isAnswered ? (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitTyped();
                    }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={
                        currentQuestion.subMode === "kana"
                          ? "Type the romaji sound (e.g. ka, shi)..."
                          : "Type the English meaning..."
                      }
                      aria-label={
                        currentQuestion.subMode === "kana"
                          ? "Type the romaji sound"
                          : "Type the English meaning"
                      }
                      className="h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 text-center text-base font-bold text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary)]"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                    <button
                      type="submit"
                      disabled={!typedAnswer.trim()}
                      className="h-12 rounded-xl bg-[var(--primary)] px-6 text-sm font-extrabold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 cursor-pointer"
                    >
                      Check
                    </button>
                    <button
                      type="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                        }
                      }}
                      onClick={handleSkip}
                      className="h-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      Skip (Shift+Enter)
                    </button>
                  </form>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Tip: Press{" "}
                    <kbd className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px]">
                      Space
                    </kbd>{" "}
                    (when empty) or{" "}
                    <kbd className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px]">
                      Alt+S
                    </kbd>{" "}
                    to replay •{" "}
                    <kbd className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px]">
                      Enter
                    </kbd>{" "}
                    to check
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[var(--muted)]">
                    Press{" "}
                    <kbd className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px]">
                      Enter
                    </kbd>{" "}
                    to continue
                  </p>
                  <button
                    ref={nextButtonRef}
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    <span>
                      {currentNumber < totalQuestions ? "Next →" : "See Results →"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <QuitSessionDialog
        open={quitDialogOpen}
        onCancel={cancelQuit}
        onConfirm={handleQuitConfirm}
      />
    </GameLayout>
  );
}
