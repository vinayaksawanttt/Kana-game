"use client";

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Check, Flag, Layers, PenLine, RotateCcw, Sparkles, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { getGameResult, getGameSession, saveGameResult } from "@/lib/game-core/storage";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";
import {
  buildGrammarResult,
  createGrammarState,
  grammarReducer,
  type GrammarSessionState,
  type StoredGrammarSession,
} from "@/engine/grammarSession";
import { getGrammarDoc, type GrammarDoc } from "@/lib/content/grammar";
import { GrammarGuideView } from "@/components/grammar-guide-view";
import { ingestGrammarSession } from "@/lib/srs/service";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

const BOOKMARK_STORAGE_KEY = "grammar-bookmarked-ids";

function readBookmarkedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.filter((item): item is string => typeof item === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function renderHighlightedSentence(sentence: string, target: string) {
  const cleaned = target.replace(/[～〜~\s]/g, "").trim();
  if (!cleaned) return sentence;
  const idx = sentence.indexOf(cleaned);
  if (idx === -1) return sentence;
  return (
    <>
      <span>{sentence.slice(0, idx)}</span>
      <mark className="rounded bg-[var(--sakura-light)] px-1 py-0.5 font-bold text-[var(--primary)]">
        {sentence.slice(idx, idx + cleaned.length)}
      </mark>
      <span>{sentence.slice(idx + cleaned.length)}</span>
    </>
  );
}

export default function GrammarPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Preparing Grammar Drill..." size="md" />
        </main>
      }
    >
      <GrammarPlayContent />
    </Suspense>
  );
}

function GrammarPlayContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const { sessionId } = useParams<{ sessionId: string }>();
  const [game, setGame] = useState<{
    session: StoredGrammarSession;
    initial: GrammarSessionState;
  } | null>(null);

  useEffect(() => {
    const savedResult = getGameResult("grammar", sessionId);
    if (savedResult) {
      routerRef.current.replace(`/games/grammar/result/${sessionId}`);
      return;
    }

    const session = getGameSession<StoredGrammarSession>("grammar", sessionId);
    if (
      !session ||
      session.sessionId !== sessionId ||
      !Array.isArray(session.questions) ||
      session.questions.length === 0
    ) {
      routerRef.current.replace("/games/grammar");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame({ session, initial: createGrammarState(session) });
  }, [sessionId]);

  if (!game) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Grammar Drill..." size="md" />
      </main>
    );
  }

  return <GrammarGame key={sessionId} session={game.session} initial={game.initial} />;
}

function GrammarGame({
  session,
  initial,
}: {
  session: StoredGrammarSession;
  initial: GrammarSessionState;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(grammarReducer, initial);
  const questionStartedAt = useRef(0);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Scramble state: array of pool indices currently placed in the dropzone
  const [selectedPoolIndices, setSelectedPoolIndices] = useState<number[]>([]);
  const [showLiteralHint, setShowLiteralHint] = useState(false);
  const [autoPlayExamples, setAutoPlayExamples] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set());
  const { playSentence } = useJapaneseAudio();

  // Guide drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guideDoc, setGuideDoc] = useState<GrammarDoc | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);

  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } = useQuitSessionGuard(true);

  const question = state.questions[state.index];
  const result = state.results[state.index];
  const answered = result?.status !== "unanswered";
  const correctCount = state.results.filter((r) => r.status === "correct").length;
  const progress = ((state.index + (answered ? 1 : 0)) / state.questions.length) * 100;
  const isFlagged = question ? flaggedIds.has(question.grammarId) : false;

  useEffect(() => {
    questionStartedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPoolIndices([]);
    setShowLiteralHint(false);
    setDrawerOpen(false);
    setGuideDoc(null);
  }, [state.index]);

  useEffect(() => {
    if (answered) {
      nextButtonRef.current?.focus();
    }
  }, [answered]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoPlayExamples(localStorage.getItem("grammar-autoplay-examples") === "true");
      setFlaggedIds(readBookmarkedIds());
    } catch {
      // Keep defaults when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (answered && autoPlayExamples) playSentence(question.sentenceJp);
  }, [answered, autoPlayExamples, playSentence, question.sentenceJp]);

  const finish = useCallback(
    (finalState: GrammarSessionState, endedEarly = false) => {
      const finishedState = endedEarly
        ? grammarReducer(finalState, { type: "END" })
        : finalState;
      const builtResult = buildGrammarResult(finishedState);
      saveGameResult("grammar", builtResult, localStorage);
      void ingestGrammarSession(builtResult.questions);
      router.push(`/games/grammar/result/${session.sessionId}`);
    },
    [router, session.sessionId]
  );

  const answerCloze = useCallback(
    (optionIndex: number) => {
      if (!question || question.type !== "cloze" || answered) return;
      const isCorrect = question.options[optionIndex] === question.correctAnswer;
      playGameSfx(isCorrect ? "correct-chime" : "incorrect-chime");
      dispatch({
        type: "ANSWER_CLOZE",
        optionIndex,
        index: state.index,
        timeMs: Date.now() - questionStartedAt.current,
      });
    },
    [answered, question, state.index]
  );

  const submitScramble = useCallback(() => {
    if (!question || question.type !== "scramble" || answered) return;
    const chosenChunks = selectedPoolIndices.map((poolIdx) => question.scrambledChunks[poolIdx]!);
    const isCorrect = chosenChunks.join("") === question.correctChunks.join("");
    playGameSfx(isCorrect ? "correct-chime" : "incorrect-chime");
    dispatch({
      type: "ANSWER_SCRAMBLE",
      chunks: chosenChunks,
      index: state.index,
      timeMs: Date.now() - questionStartedAt.current,
    });
  }, [answered, question, selectedPoolIndices, state.index]);

  const nextQuestion = useCallback(() => {
    if (!answered) return;
    const advanced = grammarReducer(state, { type: "NEXT", index: state.index });
    if (advanced.index >= advanced.questions.length) {
      finish(advanced);
    } else {
      playGameSfx("card-flip");
      dispatch({ type: "NEXT", index: state.index });
    }
  }, [answered, finish, state]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (drawerOpen || quitDialogOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (!answered && question) {
        if (question.type === "cloze" && ["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          answerCloze(Number(e.key) - 1);
          return;
        }
        if (question.type === "scramble") {
          if (e.key === "Backspace" && selectedPoolIndices.length > 0) {
            e.preventDefault();
            setSelectedPoolIndices((prev) => prev.slice(0, -1));
            return;
          }
          if (e.key === "Enter" && selectedPoolIndices.length > 0) {
            e.preventDefault();
            submitScramble();
          }
        }
      } else if (answered && e.key === "Enter") {
        // Avoid double-triggering if the Next button itself already has focus
        if (document.activeElement === nextButtonRef.current) return;
        e.preventDefault();
        nextQuestion();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    answerCloze,
    answered,
    drawerOpen,
    nextQuestion,
    question,
    quitDialogOpen,
    selectedPoolIndices.length,
    submitScramble,
  ]);

  function toggleFlag(grammarId: string) {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(grammarId)) next.delete(grammarId);
      else next.add(grammarId);
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }

  function quitSession() {
    confirmQuit();
    sessionStorage.removeItem(`grammar-session:${session.sessionId}`);
    router.replace("/games/grammar");
  }

  async function openGuideDrawer() {
    if (!question) return;
    setDrawerOpen(true);
    if (guideDoc?.point.id === question.grammarId) return;
    setLoadingGuide(true);
    try {
      const doc = await getGrammarDoc(question.grammarSlug, question.level);
      setGuideDoc(doc);
    } finally {
      setLoadingGuide(false);
    }
  }

  if (!question || !result) return null;

  const expectedAnswer =
    question.type === "cloze" ? question.correctAnswer : question.correctChunks.join("");
  const highlightTarget =
    question.type === "cloze" ? question.correctAnswer : question.grammarPattern;

  return (
    <>
      <GameLayout label="GRAMMAR" glyph="文" onNavigateHome={requestQuit}>
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-7 sm:px-8">
          {/* Top Progress Bar */}
          <div className="grid grid-cols-1 items-center gap-3 border-b border-[var(--line)] pb-4 sm:grid-cols-[1fr_auto] sm:gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span className="text-[var(--ink)]">
                  Question {state.index + 1} of {state.questions.length}{" "}
                  <span className="ml-1.5 font-normal text-[var(--muted)]">
                    ({Math.round(progress)}%)
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="hidden rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)] sm:inline-flex">
                    {question.type === "cloze" ? "Keys: 1–4 · Enter" : "Keys: Backspace · Enter"}
                  </span>
                  <span className="text-[var(--primary)]">Score {correctCount}</span>
                </div>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-[var(--line)]"
                role="progressbar"
                aria-label="Question progress"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                aria-pressed={autoPlayExamples}
                onClick={() => {
                  const next = !autoPlayExamples;
                  setAutoPlayExamples(next);
                  try {
                    localStorage.setItem("grammar-autoplay-examples", String(next));
                  } catch {
                    // Keep the setting for this session only.
                  }
                }}
                className={`min-h-10 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                  autoPlayExamples
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                Auto-play examples {autoPlayExamples ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => finish(state, true)}
                className="secondary-button min-h-10 rounded-md border px-4 py-2 text-xs font-bold sm:min-h-11 sm:text-sm"
              >
                End session
              </button>
            </div>
          </div>

          {/* Centered Gameplay Area */}
          <div className="flex flex-1 flex-col items-center justify-center py-5 sm:py-6">
            {/* Prompt Card */}
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] transition-all duration-200 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-bold text-white">
                    {question.level}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${
                      question.type === "cloze"
                        ? "border-[var(--primary)]/30 bg-[var(--sakura-light)]/70 text-[var(--primary)]"
                        : "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)]"
                    }`}
                  >
                    {question.type === "cloze" ? (
                      <PenLine className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Layers className="size-3.5" aria-hidden="true" />
                    )}
                    {question.type === "cloze" ? "Sentence Cloze" : "Syntax Scramble"}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-0.5 text-xs font-semibold text-[var(--ink)]">
                    Pattern: <strong className="font-japanese text-[var(--primary)]">{question.grammarPattern}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={isFlagged}
                  aria-label={isFlagged ? "Flagged for review" : "Flag for review"}
                  onClick={() => toggleFlag(question.grammarId)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isFlagged
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
                  }`}
                >
                  <Flag className="size-3.5" aria-hidden="true" />
                  <span>{isFlagged ? "Flagged" : "Flag"}</span>
                </button>
              </div>

              {question.type === "cloze" ? (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Complete the Japanese sentence:
                  </p>
                  <p
                    lang="ja"
                    className="font-japanese text-2xl leading-relaxed font-semibold text-[var(--ink)] sm:text-3xl"
                  >
                    <span>{question.before}</span>
                    <span
                      className={`mx-1.5 inline-block rounded-md border-2 px-3 py-0.5 transition-colors ${
                        !answered
                          ? "border-dashed border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                          : result.status === "correct"
                            ? "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--correct)]"
                            : "border-[var(--wrong)] bg-[var(--wrong)]/15 text-[var(--primary)]"
                      }`}
                    >
                      {answered ? question.correctAnswer : "[ ___ ]"}
                    </span>
                    <span>{question.after}</span>
                  </p>
                  <p className="mt-3 text-sm text-[var(--muted)]">{question.en}</p>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
                    Build the Japanese sentence for:
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-[var(--ink)] sm:text-xl">
                    {question.naturalEn || question.en}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Hint: Uses <strong>{question.grammarPattern}</strong> ({question.shortExplanation})
                    </span>
                    {question.literalEn && question.literalEn !== (question.naturalEn || question.en) && (
                      <button
                        type="button"
                        onClick={() => setShowLiteralHint((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)] transition-colors hover:border-[var(--primary)]"
                      >
                        {showLiteralHint ? "Hide structural hint" : "💡 Structural hint"}
                      </button>
                    )}
                  </div>
                  {showLiteralHint && question.literalEn && (
                    <p className="mt-2 rounded-lg border border-[var(--sakura)] bg-[var(--sakura-light)]/40 p-2.5 text-xs text-[var(--ink)]">
                      <strong className="text-[var(--primary)]">Structural breakdown:</strong> {question.literalEn}
                    </p>
                  )}

                  {/* Dropzone Line */}
                  <div
                    data-testid="scramble-dropzone"
                    aria-label="Sentence dropzone"
                    className="mt-5 flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--paper-tint)] p-3.5"
                  >
                    {selectedPoolIndices.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">
                        Click the word chunks below in the correct order...
                      </span>
                    ) : (
                      selectedPoolIndices.map((poolIdx, orderIdx) => {
                        const chunkText = question.scrambledChunks[poolIdx]!;
                        return (
                          <button
                            key={`drop-${poolIdx}-${orderIdx}`}
                            type="button"
                            disabled={answered}
                            onClick={() =>
                              setSelectedPoolIndices((prev) =>
                                prev.filter((_, idx) => idx !== orderIdx)
                              )
                            }
                            className="font-japanese rounded-full border border-[var(--primary)] bg-[var(--primary)] px-3.5 py-1.5 text-base font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-default"
                          >
                            {chunkText}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Scrambled Chunks Pool */}
                  <div
                    data-testid="scramble-pool"
                    aria-label="Scrambled chunks"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {question.scrambledChunks.map((chunk, poolIdx) => {
                      const used = selectedPoolIndices.includes(poolIdx);
                      return (
                        <button
                          key={`pool-${poolIdx}-${chunk}`}
                          type="button"
                          disabled={used || answered}
                          onClick={() =>
                            setSelectedPoolIndices((prev) => [...prev, poolIdx])
                          }
                          className={`font-japanese rounded-full border px-4 py-2 text-base font-semibold transition ${
                            used
                              ? "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--muted)] opacity-35"
                              : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]"
                          }`}
                        >
                          {chunk}
                        </button>
                      );
                    })}
                  </div>

                  {!answered && (
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={selectedPoolIndices.length === 0}
                        onClick={submitScramble}
                        className="primary-button h-11 flex-1 rounded-md px-5 text-sm font-bold disabled:opacity-45"
                      >
                        Check Order
                      </button>
                      <button
                        type="button"
                        disabled={selectedPoolIndices.length === 0}
                        onClick={() => setSelectedPoolIndices([])}
                        className="secondary-button inline-flex h-11 items-center gap-1.5 rounded-md border px-4 text-xs font-bold disabled:opacity-40"
                      >
                        <RotateCcw className="size-3.5" />
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cloze 2x2 Option Grid */}
            {question.type === "cloze" && (
              <div className="mx-auto mt-4 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {question.options.map((option, idx) => {
                  const isCorrect = option === question.correctAnswer;
                  const isChosen = result.chosenAnswer === option;
                  const statusClass = !answered
                    ? "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] focus-visible:border-[var(--primary)]"
                    : isCorrect
                      ? "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--ink)]"
                      : isChosen
                        ? "border-[var(--wrong)] bg-[var(--wrong)]/15 text-[var(--ink)]"
                        : "border-[var(--line)] bg-[var(--surface)] opacity-60";

                  return (
                    <button
                      key={`${option}-${idx}`}
                      type="button"
                      disabled={answered}
                      onClick={() => answerCloze(idx)}
                      className={`flex min-h-[64px] items-center gap-4 rounded-xl border p-4 text-left text-sm font-bold transition-all disabled:cursor-default ${statusClass}`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs ${
                          answered && isCorrect
                            ? "border-[var(--correct)] bg-[var(--correct)] text-white"
                            : answered && isChosen && !isCorrect
                              ? "border-[var(--wrong)] bg-[var(--wrong)] text-white"
                              : "border-current"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span lang="ja" className="font-japanese flex-1 text-lg">
                        {option}
                      </span>
                      {answered && isCorrect && (
                        <Check size={18} aria-label="Correct answer" className="text-[var(--correct)]" />
                      )}
                      {answered && isChosen && !isCorrect && (
                        <X size={18} aria-label="Your incorrect answer" className="text-[var(--wrong)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Post-Submission Feedback + Read Guide Link */}
            {answered && (
              <div
                className={`mx-auto mt-4 w-full max-w-3xl rounded-2xl border p-5 transition-all duration-200 ${
                  result.status === "correct"
                    ? "border-[var(--correct)]/40 bg-[var(--surface)]"
                    : "border-[var(--wrong)]/40 bg-[var(--surface)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                      result.status === "correct" ? "text-[var(--correct)]" : "text-[var(--wrong)]"
                    }`}
                  >
                    {result.status === "correct" ? "✓ Correct!" : "✕ Not quite"}
                  </p>

                  <button
                    type="button"
                    onClick={() => void openGuideDrawer()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--paper-tint)] px-3.5 py-1 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
                  >
                    <BookOpen className="size-3.5" />
                    <span>Read Guide</span>
                  </button>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)]/60 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p lang="ja" className="font-japanese text-lg font-semibold text-[var(--ink)]">
                      {renderHighlightedSentence(question.sentenceJp, highlightTarget)}
                    </p>
                    {question.romaji && (
                      <p className="mt-1 text-xs text-[var(--muted)]">{question.romaji}</p>
                    )}
                    <p className="mt-1 text-sm text-[var(--ink)]">{question.en}</p>
                  </div>
                  <AudioButton
                    text={question.sentenceJp}
                    mode="sentence"
                    size="md"
                    label="Listen to completed sentence"
                  />
                </div>

                {result.status === "wrong" ? (
                  <div className="mt-3 space-y-2.5 rounded-xl border border-[var(--wrong)]/25 bg-[var(--wrong)]/5 p-3.5 text-xs">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-[var(--wrong)]/30 bg-[var(--surface)] px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--wrong)]">
                          Your Answer
                        </span>
                        <span lang="ja" className="font-japanese mt-0.5 block text-sm font-bold text-[var(--ink)]">
                          {result.chosenAnswer || "—"}
                        </span>
                      </div>
                      <div className="rounded-lg border border-[var(--correct)]/35 bg-[var(--surface)] px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--correct)]">
                          Correct Answer
                        </span>
                        <span lang="ja" className="font-japanese mt-0.5 block text-sm font-bold text-[var(--ink)]">
                          {expectedAnswer}
                        </span>
                      </div>
                    </div>
                    <p className="leading-relaxed text-[var(--ink)]">
                      <strong className="text-[var(--primary)]">Why this is the answer:</strong>{" "}
                      {question.type === "cloze"
                        ? `"${result.chosenAnswer || "—"}" does not satisfy the target pattern ${question.grammarPattern}. `
                        : `The phrase order does not follow Japanese syntax for ${question.grammarPattern}. `}
                      <span className="font-semibold">{question.grammarPattern}</span> ({question.grammarTitle}) means{" "}
                      <em>{question.shortExplanation}</em>, so{" "}
                      <span lang="ja" className="font-japanese font-bold">
                        {expectedAnswer}
                      </span>{" "}
                      completes the sentence naturally.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--correct)]/25 bg-[var(--correct)]/5 px-3.5 py-2.5 text-xs text-[var(--ink)]">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[var(--correct)]" aria-hidden="true" />
                    <p>
                      <strong className="font-japanese">{question.grammarPattern}</strong>:{" "}
                      {question.shortExplanation}
                    </p>
                  </div>
                )}

                <button
                  ref={nextButtonRef}
                  type="button"
                  onClick={nextQuestion}
                  className="primary-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
                >
                  {state.index + 1 === state.questions.length ? "Finish" : "Next"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </GameLayout>

      {/* MDX Grammar Guide Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Grammar Guide"
        >
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div>
                <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                  {question.level}
                </span>
                <h2 lang="ja" className="font-japanese mt-2 text-2xl font-bold text-[var(--ink)]">
                  {question.grammarPattern}
                </h2>
                <p className="text-xs text-[var(--muted)]">{question.grammarTitle}</p>
              </div>
              <button
                type="button"
                aria-label="Close guide drawer"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--paper-tint)] hover:text-[var(--ink)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex-1">
              {loadingGuide ? (
                <p className="py-8 text-sm text-[var(--muted)]">Loading grammar explanation...</p>
              ) : guideDoc ? (
                <GrammarGuideView mdxSource={guideDoc.mdxSource} />
              ) : (
                <p className="py-4 text-sm text-[var(--ink)]">{question.shortExplanation}</p>
              )}
            </div>

            <div className="mt-6 border-t border-[var(--line)] pt-4">
              <Link
                href={`/grammar/${question.level}/${question.grammarSlug}`}
                className="inline-flex text-xs font-bold text-[var(--primary)] underline"
              >
                Open full reference page →
              </Link>
            </div>
          </div>
        </div>
      )}

      <QuitSessionDialog open={quitDialogOpen} onCancel={cancelQuit} onConfirm={quitSession} />
    </>
  );
}
