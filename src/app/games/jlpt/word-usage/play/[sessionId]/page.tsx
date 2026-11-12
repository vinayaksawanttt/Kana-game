"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
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
  WORD_USAGE_ITEMS,
  createWordUsageSession,
  summarizeWordUsageSession,
  wordUsageReducer,
  type WordUsageResultSummary,
  type WordUsageSession,
} from "@/engine/jlptWordUsage";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { AudioButton } from "@/components/ui/AudioButton";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): WordUsageSession {
  const existing = getGameSession<WordUsageSession>("jlpt-usage", sessionId);
  if (existing && Array.isArray(existing.questions) && existing.questions.length > 0) {
    return existing;
  }
  const fallback = createWordUsageSession(
    WORD_USAGE_ITEMS,
    {
      levels: [4],
      size: 10,
      showEnglishTranslations: false,
    },
    Math.random,
    sessionId,
  );
  saveGameSession("jlpt-usage", sessionId, fallback);
  return fallback;
}

export default function WordUsagePlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { stopAudio } = useJapaneseAudio();

  const [session, dispatch] = useReducer(
    wordUsageReducer,
    sessionId,
    loadInitialSession,
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
    sessionStorage.removeItem(`jlpt-usage-session:${session.sessionId}`);
    router.replace("/games/jlpt/word-usage");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [session.currentIndex]);

  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-usage", session.sessionId, session);
    if (session.status === "finished") {
      const existingResult = getGameResult<WordUsageResultSummary>(
        "jlpt-usage",
        session.sessionId,
      );
      if (!existingResult) {
        const summary = summarizeWordUsageSession(session);
        saveGameResult("jlpt-usage", summary);
      }
      router.replace(`/games/jlpt/word-usage/result/${session.sessionId}`);
    }
  }, [router, session]);

  const handleSelectOption = useCallback(
    (optionIndex: 0 | 1 | 2 | 3) => {
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
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    dispatch({ type: "SKIP", timeMs: elapsed });
  }, [session.revealed]);

  const handleNext = useCallback(() => {
    if (!session.revealed) return;
    stopAudio();
    playGameSfx("card-flip");
    dispatch({ type: "NEXT", forIndex: session.currentIndex });
  }, [session.currentIndex, session.revealed, stopAudio]);

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
        } else if (e.key === "4") {
          e.preventDefault();
          handleSelectOption(3);
        } else if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          handleSkip();
        }
      } else {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSelectOption, handleSkip, session.revealed]);

  if (!currentQuestion) {
    return (
      <GameLayout label="WORD USAGE JUDGE" glyph="用" homeHref="/games/jlpt">
        <section className="mx-auto max-w-xl p-8 text-center text-sm text-[var(--muted)]">
          Finishing drill session...
        </section>
      </GameLayout>
    );
  }

  const currentAnswer = session.answers.find((a) => a.questionId === currentQuestion.id);
  const total = session.questions.length;
  const progressPercent = Math.round(((session.currentIndex + 1) / total) * 100);

  return (
    <GameLayout
      label="WORD USAGE JUDGE · 語彙・用法"
      glyph="用"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Top Progress & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-japanese text-xs font-black text-[var(--primary-fg)]">
              {currentQuestion.levelLabel}
            </span>
            <span className="text-xs font-bold text-[var(--muted)]">
              Mondai 5 · 語彙・用法
            </span>
            <span className="font-mono text-xs font-semibold text-[var(--muted)]">
              ({session.currentIndex + 1} / {total})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-[var(--muted)]">Score:</span>
              <span className="font-mono text-sm font-black text-[var(--primary-fg)]">
                {session.score}
              </span>
            </div>

            <button
              type="button"
              onClick={requestQuit}
              className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-bold text-[var(--muted)] hover:border-[var(--destructive)] hover:text-[var(--destructive)]"
            >
              Quit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]/40">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Target Word Display Card */}
        <div className="mt-6 rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_16px_40px_rgba(35,26,28,0.06)] sm:p-8">
          <p className="font-japanese text-xs font-bold text-[var(--muted)]">
            ＿＿のことばの使い方として最もよいものを、1・2・3・4から一つえらんでください。
          </p>

          <div className="mt-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3">
              <span className="font-japanese text-4xl font-black tracking-wider text-[var(--ink)] sm:text-5xl">
                {currentQuestion.word}
              </span>
              <AudioButton
                text={currentQuestion.word}
                size="md"
                aria-label={`Listen to pronunciation of ${currentQuestion.word}`}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="font-japanese text-sm font-semibold text-[var(--muted)] sm:text-base">
                【 {currentQuestion.reading} 】
              </span>
              {currentQuestion.pos && currentQuestion.pos.length > 0 && (
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {currentQuestion.pos.join(" · ")}
                </span>
              )}
            </div>

            {session.settings.showEnglishTranslations && currentQuestion.meanings.length > 0 && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Meaning: {currentQuestion.meanings.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Sentence Option Choices */}
        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isChosen = currentAnswer?.chosenOptionIndex === idx;
            const isCorrect = option.isCorrect;

            let cardStyles = "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/20";
            let numberBadgeStyles = "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]";

            if (session.revealed) {
              if (isCorrect) {
                cardStyles = "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--ink)] ring-2 ring-[var(--correct)]/30";
                numberBadgeStyles = "border-[var(--correct)] bg-[var(--correct)] text-white";
              } else if (isChosen && !isCorrect) {
                cardStyles = "border-[var(--destructive)] bg-[var(--destructive)]/10 text-[var(--ink)] ring-2 ring-[var(--destructive)]/30";
                numberBadgeStyles = "border-[var(--destructive)] bg-[var(--destructive)] text-white";
              } else {
                cardStyles = "border-[var(--line)]/50 bg-[var(--surface)]/50 opacity-60";
              }
            }

            return (
              <button
                key={option.id || idx}
                type="button"
                disabled={session.revealed}
                onClick={() => handleSelectOption(idx as 0 | 1 | 2 | 3)}
                className={`group flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-150 sm:p-5 ${cardStyles}`}
              >
                {/* Number Badge */}
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-colors ${numberBadgeStyles}`}
                >
                  {option.optionNumber}
                </span>

                <div className="flex-1">
                  <p className="font-japanese text-base font-semibold leading-relaxed sm:text-lg">
                    {option.sentenceJa}
                  </p>

                  {session.settings.showEnglishTranslations && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {option.sentenceEn}
                    </p>
                  )}

                  {/* Revealed Explanation Banner under each option */}
                  {session.revealed && (
                    <div
                      className={`mt-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                        isCorrect
                          ? "border-[var(--correct)]/30 bg-[var(--correct)]/10 text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                      }`}
                    >
                      <span className="font-bold">
                        {isCorrect ? "✓ 正しい用法: " : "× 不自然な用法: "}
                      </span>
                      {option.explanation}
                    </div>
                  )}
                </div>

                {/* State Icons */}
                {session.revealed && (
                  <div className="shrink-0 self-center">
                    {isCorrect ? (
                      <CheckCircle2 size={24} className="text-[var(--correct)]" />
                    ) : isChosen ? (
                      <XCircle size={24} className="text-[var(--destructive)]" />
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Revealed Bottom Feedback & Navigation Bar */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[var(--muted)]">
            {!session.revealed ? (
              <span>Keyboard: Press <kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 font-mono">1</kbd>–<kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 font-mono">4</kbd> to select, <kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 font-mono">Shift+Enter</kbd> to skip</span>
            ) : (
              <span>Press <kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 font-mono">Enter</kbd> or <kbd className="rounded border bg-[var(--surface)] px-1.5 py-0.5 font-mono">Space</kbd> for next question</span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {!session.revealed ? (
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-xs font-bold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
              >
                <SkipForward size={14} aria-hidden="true" />
                <span>スキップ / Skip</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
              >
                <span>次の問題へ / Next Question</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      <QuitSessionDialog
        open={quitDialogOpen}
        onCancel={cancelQuit}
        onConfirm={quitSession}
      />
    </GameLayout>
  );
}
