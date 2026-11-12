"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  Check,
  CheckCircle2,
  SkipForward,
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
  phoneticTrapReducer,
  summarizePhoneticTrapSession,
  type PhoneticTrapResultSummary,
  type PhoneticTrapSession,
} from "@/engine/jlptPhoneticTraps";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addVocabularyToSrs } from "@/lib/srs/service";
import { FuriganaText } from "@/components/ui/FuriganaText";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): PhoneticTrapSession {
  const existing = getGameSession<PhoneticTrapSession>("jlpt-traps", sessionId);
  if (existing && Array.isArray(existing.questions) && existing.questions.length > 0) {
    return existing;
  }
  const fallback = createPhoneticTrapSession(
    PHONETIC_TRAP_ITEMS,
    {
      subMode: "reading",
      levels: ["N5"],
      size: 10,
      showEnglishHint: true,
    },
    Math.random,
    sessionId,
  );
  saveGameSession("jlpt-traps", sessionId, fallback);
  return fallback;
}

export default function PhoneticTrapPlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { playVocab, playSentence, stopAudio } = useJapaneseAudio();

  const [session, dispatch] = useReducer(
    phoneticTrapReducer,
    sessionId,
    loadInitialSession,
  );

  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const [showFurigana, setShowFurigana] = useState<boolean>(
    Boolean(session.settings.showFurigana),
  );
  const questionStartRef = useRef<number>(Date.now());

  const currentQuestion = session.questions[session.currentIndex];

  const isSessionActive = session.status === "playing";
  const isQuittingRef = useRef(false);
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    stopAudio();
    sessionStorage.removeItem(`jlpt-traps-session:${session.sessionId}`);
    router.replace("/games/jlpt/phonetic-traps");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [session.currentIndex]);

  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-traps", session.sessionId, session);
    if (session.status === "finished") {
      const existingResult = getGameResult<PhoneticTrapResultSummary>(
        "jlpt-traps",
        session.sessionId,
      );
      if (!existingResult) {
        const summary = summarizePhoneticTrapSession(session);
        saveGameResult("jlpt-traps", summary);
      }
      router.replace(`/games/jlpt/phonetic-traps/result/${session.sessionId}`);
    }
  }, [router, session]);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (session.revealed) return;
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (currentQuestion) {
        playGameSfx(
          optionIndex === currentQuestion.correctOptionIndex
            ? "correct-chime"
            : "incorrect-chime"
        );
      }
      const elapsed = Math.max(100, Date.now() - questionStartRef.current);
      dispatch({ type: "ANSWER", optionIndex, timeMs: elapsed });
    },
    [currentQuestion, session.revealed],
  );

  const handleSkip = useCallback(() => {
    if (session.revealed) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    dispatch({ type: "SKIP", timeMs: elapsed });
  }, [session.revealed]);

  const handleNext = useCallback(() => {
    if (!session.revealed) return;
    playGameSfx("card-flip");
    dispatch({ type: "NEXT", forIndex: session.currentIndex });
  }, [session.currentIndex, session.revealed]);

  const handleEndSession = useCallback(() => {
    const endedState = phoneticTrapReducer(session, { type: "END" });
    const summary = summarizePhoneticTrapSession(endedState);
    saveGameResult("jlpt-traps", summary);
    router.push(`/games/jlpt/phonetic-traps/result/${session.sessionId}`);
  }, [router, session]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (quitDialogOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!currentQuestion) return;

      if (!session.revealed) {
        if (e.key >= "1" && e.key <= "4") {
          e.preventDefault();
          handleSelectOption(Number(e.key) - 1);
          return;
        }
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          handleSkip();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentQuestion, handleNext, handleSelectOption, handleSkip, quitDialogOpen, session.revealed]);

  async function handleSaveToSrs() {
    if (!currentQuestion) return;
    const key = currentQuestion.word;
    if (savedWords[key]) return;
    await addVocabularyToSrs({
      word: currentQuestion.word,
      reading: currentQuestion.reading,
      meaning: currentQuestion.meanings.join(", "),
      level: currentQuestion.level,
    });
    setSavedWords((prev) => ({ ...prev, [key]: true }));
  }

  if (!currentQuestion) {
    return null;
  }

  const correctSoFar = session.answers.filter((a) => a.status === "correct").length;
  const progressPercent = Math.round(
    ((session.currentIndex + (session.revealed ? 1 : 0)) / session.questions.length) * 100,
  );
  const isWordSaved = Boolean(savedWords[currentQuestion.word]);
  const activeModeLabel =
    currentQuestion.mode === "reading" ? "問題1 漢字読み" : "問題2 表記";

  return (
    <GameLayout
      label="PHONETIC TRAP SNIPER"
      glyph="読"
      homeHref="/games/jlpt/phonetic-traps"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-japanese text-xs font-bold text-[var(--primary-fg)]">
            {activeModeLabel}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold">
            {session.currentIndex + 1} / {session.questions.length}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--correct)]">
            Score: {correctSoFar}
          </span>
          <button
            type="button"
            aria-pressed={showFurigana}
            onClick={() => setShowFurigana((prev) => !prev)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              showFurigana
                ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
            }`}
          >
            あ Furigana: {showFurigana ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={handleEndSession}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
          >
            End session
          </button>
        </div>
      }
    >
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-14 pt-4 sm:px-8">
        {/* Progress Bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Center Sentence Stage Card */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                JLPT {currentQuestion.level} · {activeModeLabel}
              </span>
              <span className="text-xs font-semibold text-[var(--muted)]">
                {currentQuestion.mode === "reading"
                  ? "Choose the exact Hiragana reading for 【...】"
                  : "Choose the exact Kanji orthography for 【...】"}
              </span>
            </div>

            {!session.revealed && (
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]">
                Audio locked until answer submitted
              </span>
            )}
          </div>

          {/* Highlighted Context Sentence Stage */}
          <div
            aria-label="Context sentence prompt"
            className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-6 text-center font-japanese text-2xl leading-relaxed sm:p-8 sm:text-3xl"
          >
            <FuriganaText
              text={currentQuestion.prefix}
              furiganaText={currentQuestion.prefixFurigana}
              showFurigana={showFurigana}
            />
            <span className="mx-1 inline-block rounded-lg border-2 border-[var(--primary)] bg-[var(--sakura-light)] px-2.5 py-0.5 font-bold text-[var(--primary-fg)]">
              【
              <FuriganaText
                text={currentQuestion.promptTarget}
                furiganaText={currentQuestion.promptTargetFurigana}
                showFurigana={showFurigana}
              />
              】
            </span>
            <FuriganaText
              text={currentQuestion.suffix}
              furiganaText={currentQuestion.suffixFurigana}
              showFurigana={showFurigana}
            />
          </div>

          {/* Optional English Context Hint before answering */}
          {session.settings.showEnglishHint && !session.revealed && (
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              “{currentQuestion.sentenceEn}”
            </p>
          )}

          {/* 4 Option Buttons (2x2 Grid) */}
          <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
            {currentQuestion.options.map((opt) => {
              const isChosen =
                session.revealed && session.lastAnswer?.chosenOptionIndex === opt.index;
              const isCorrectOption = session.revealed && opt.isCorrect;
              const isWrongChoice = isChosen && !opt.isCorrect;

              return (
                <button
                  key={opt.index}
                  type="button"
                  disabled={session.revealed}
                  onClick={() => handleSelectOption(opt.index)}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                    isCorrectOption
                      ? "border-2 border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--correct)]"
                      : isWrongChoice
                        ? "border-2 border-rose-500 bg-rose-500/10 text-rose-500"
                        : session.revealed
                          ? "border-[var(--line)] bg-[var(--bg)]/50 opacity-75"
                          : "border-[var(--line)] bg-[var(--bg)] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-sm"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                          isCorrectOption
                            ? "bg-[var(--correct)] text-white"
                            : isWrongChoice
                              ? "bg-rose-500 text-white"
                              : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                        }`}
                      >
                        {opt.optionNumber}
                      </span>
                      <span className="font-japanese text-xl font-bold sm:text-2xl">
                        <FuriganaText
                          text={opt.text}
                          furiganaText={opt.furiganaText}
                          showFurigana={showFurigana}
                        />
                      </span>
                    </div>

                    {isCorrectOption && <CheckCircle2 size={20} className="shrink-0" />}
                    {isWrongChoice && <XCircle size={20} className="shrink-0" />}
                  </div>

                  {/* Post-Answer Trap Diagnostic Badge on Distractors */}
                  {session.revealed && !opt.isCorrect && opt.trapExplanation && (
                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--line)]/60 pt-2 text-[11px] font-semibold text-[var(--muted)]">
                      <AlertTriangle
                        size={12}
                        className={
                          isWrongChoice ? "text-rose-500" : "text-[var(--primary-fg)]"
                        }
                      />
                      <span>{opt.trapExplanation}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Skip Button before answering */}
          {!session.revealed && (
            <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
              <span className="text-xs text-[var(--muted)]">
                Press keys <strong>1–4</strong> to answer · <strong>Shift+Enter</strong> to skip
              </span>

              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
              >
                <SkipForward size={14} />
                <span>Skip</span>
              </button>
            </div>
          )}
        </div>

        {/* Post-Answer "Trap Diagnostic" Learn Panel */}
        {session.revealed && session.lastAnswer && (
          <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {session.lastAnswer.status === "correct" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--correct)]/15 px-3.5 py-1 text-xs font-extrabold text-[var(--correct)]">
                    <CheckCircle2 size={15} />
                    <span> Trap Dodged! Correct Answer</span>
                  </span>
                ) : session.lastAnswer.status === "wrong" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3.5 py-1 text-xs font-extrabold text-rose-500">
                    <AlertTriangle size={15} />
                    <span>
                      Caught by {session.lastAnswer.trapRuleTriggered ?? "Trap"} (
                      {session.lastAnswer.chosenText})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg)] px-3.5 py-1 text-xs font-extrabold text-[var(--muted)]">
                    Skipped — Correct: {currentQuestion.correctText}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void playVocab({
                      word: currentQuestion.word,
                      reading: currentQuestion.reading,
                    })
                  }
                  aria-label="Play vocabulary audio"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sakura-light)] px-3.5 py-1.5 text-xs font-bold text-[var(--primary-fg)] transition hover:opacity-90"
                >
                  <Volume2 size={14} />
                  <span>Word Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => void playSentence(currentQuestion.sentenceJa)}
                  aria-label="Play full sentence audio"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--fg)] transition hover:border-[var(--sakura)]"
                >
                  <Volume2 size={14} />
                  <span>Sentence Audio</span>
                </button>

                <button
                  type="button"
                  disabled={isWordSaved}
                  onClick={() => void handleSaveToSrs()}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    isWordSaved
                      ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--primary-fg)] hover:border-[var(--sakura)]"
                  }`}
                >
                  {isWordSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                  <span>{isWordSaved ? "Saved to FSRS" : "+ FSRS"}</span>
                </button>
              </div>
            </div>

            {/* Vocabulary & Sentence Reveal Details */}
            <div className="mt-4 grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 sm:grid-cols-2">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  Target Vocabulary ({currentQuestion.level})
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-japanese text-2xl font-bold">
                    {currentQuestion.word}
                  </span>
                  <span className="font-japanese text-base font-bold text-[var(--primary-fg)]">
                    【{currentQuestion.reading}】
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--fg)]">
                  {currentQuestion.meanings.join(", ")}
                </p>
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  Full Context Sentence
                </div>
                <p className="mt-1 font-japanese text-base font-bold">
                  {currentQuestion.sentenceJa}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {currentQuestion.sentenceEn}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:opacity-95"
              >
                <span>
                  {session.currentIndex + 1 >= session.questions.length
                    ? "View Trap Vulnerability Report"
                    : "Next Question"}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
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
