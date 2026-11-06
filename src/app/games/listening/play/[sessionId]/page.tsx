"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Check, SkipForward, Volume2 } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
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
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState("");
  const questionStartRef = useRef<number>(Date.now());
  const autoPlayedIndexRef = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const { isPlaying, playKana, playVocab, playSentence, stopAudio } = useJapaneseAudio();

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
      if (audioPayload.type === "kana") {
        playKana(audioPayload.charOrWord, audioPayload.reading, rateOverride);
      } else if (audioPayload.type === "vocab") {
        playVocab(
          { word: audioPayload.charOrWord, reading: audioPayload.reading },
          rateOverride
        );
      } else {
        playSentence(audioPayload.sentenceJa || audioPayload.charOrWord, question.id, {
          audioSrc: audioPayload.audioSrc,
          reading: audioPayload.reading,
          rate: rateOverride,
        });
      }
    },
    [playKana, playVocab, playSentence]
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
      }
    } else {
      nextButtonRef.current?.focus();
    }
  }, [session, currentQuestion]);

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
      updateSession((prev) => listeningReducer(prev, { type: "INCREMENT_REPLAY" }));
      playQuestionAudio(currentQuestion, rateOverride);
    },
    [currentQuestion, playQuestionAudio, updateSession]
  );

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
      updateSession((prev) =>
        listeningReducer(prev, { type: "SUBMIT_CHOICE", optionId, timeMs: elapsed })
      );
    },
    [session, currentQuestion, updateSession]
  );

  const handleSubmitTyped = useCallback(() => {
    if (!session || !currentQuestion || currentQuestion.status !== "pending") return;
    if (!typedAnswer.trim()) return;
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    updateSession((prev) =>
      listeningReducer(prev, {
        type: "SUBMIT_TYPED",
        input: typedAnswer,
        timeMs: elapsed,
      })
    );
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
    setTypedAnswer("");
    const currentIdx = session.index;
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

  return (
    <GameLayout
      label="LISTENING"
      glyph="聴"
      homeHref="/games/listening"
      onNavigateHome={requestQuit}
      rightSlot={
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
            {currentNumber} / {totalQuestions}
          </span>
          <span className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold sm:inline-flex">
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
      <div className="mx-auto w-full max-w-3xl px-5">
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
          <div className="mb-3 flex items-center justify-center gap-2">
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
          </div>

          {!isAnswered ? (
            /* Blind Audio Prompt View (Japanese text hidden!) */
            <div className="my-5 flex flex-col items-center">
              <button
                type="button"
                aria-label="Play audio prompt"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleReplay()}
                className={`group relative grid size-24 place-items-center rounded-full border-2 transition-all cursor-pointer ${
                  isPlaying
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_0_0_10px_rgba(188,0,45,0.14)] scale-105"
                    : "border-[var(--sakura)] bg-[var(--sakura-light)] text-[var(--primary)] hover:border-[var(--primary)] hover:scale-105"
                }`}
              >
                <Volume2 size={38} className={isPlaying ? "animate-pulse" : ""} />
              </button>
              <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                Listen carefully — Japanese transcript reveals after answering
              </p>
            </div>
          ) : (
            /* Revealed Japanese Transcript View */
            <div className="my-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-5">
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

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    currentQuestion.status === "correct"
                      ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                      : currentQuestion.status === "wrong"
                        ? "bg-[var(--wrong)]/15 text-[var(--wrong)]"
                        : "bg-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {currentQuestion.status === "correct"
                    ? "Correct!"
                    : currentQuestion.status === "wrong"
                      ? `Missed (You answered: ${currentQuestion.userAnswer})`
                      : "Skipped"}
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
            </div>
          )}

          {/* Direct Playback Controls on Card */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleReplay()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              🔊 Replay Audio
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleReplay(0.75)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] cursor-pointer"
            >
              🐢 0.75x Slow
            </button>
          </div>
        </div>

        {/* Answer Area Below the Card */}
        <div className="mt-5">
          {session.settings.answerFormat === "multiple-choice" ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrectOpt = opt.id === currentQuestion.id;
                  const isChosen =
                    isAnswered && currentQuestion.userAnswer === opt.label;

                  let cardClass =
                    "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)]";
                  if (isAnswered) {
                    if (isCorrectOpt) {
                      cardClass =
                        "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--ink)]";
                    } else if (isChosen) {
                      cardClass =
                        "border-[var(--wrong)] bg-[var(--wrong)]/15 text-[var(--ink)]";
                    } else {
                      cardClass = "border-[var(--line)] bg-[var(--surface)] opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex min-h-14 items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer disabled:cursor-default ${cardClass}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--sakura-light)] text-xs font-extrabold text-[var(--primary)]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block font-bold ${
                            currentQuestion.subMode === "kana"
                              ? "font-japanese text-xl"
                              : "text-sm sm:text-base"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isAnswered && opt.subLabel && (
                          <span className="mt-0.5 block text-xs text-[var(--muted)]">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-end">
                {!isAnswered ? (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <SkipForward size={14} /> Skip
                  </button>
                ) : (
                  <button
                    ref={nextButtonRef}
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    <span>
                      {currentNumber < totalQuestions ? "Next →" : "See Results →"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Typing / Dictation Mode */
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              {!isAnswered ? (
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
                    className="h-12 flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 text-center text-base font-bold text-[var(--ink)] outline-none focus:border-[var(--primary)]"
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
                    onClick={handleSkip}
                    className="h-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    Skip (Shift+Enter)
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[var(--muted)]">
                    Press <kbd className="rounded border px-1.5 py-0.5 font-mono">Enter</kbd> to
                    continue
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
