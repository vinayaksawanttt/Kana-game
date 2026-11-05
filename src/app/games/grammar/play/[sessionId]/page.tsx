"use client";

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Check, RotateCcw, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
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

export default function GrammarPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
          Preparing session...
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
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
        Preparing session...
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

  function answerCloze(optionIndex: number) {
    if (!question || question.type !== "cloze" || answered) return;
    dispatch({
      type: "ANSWER_CLOZE",
      optionIndex,
      index: state.index,
      // eslint-disable-next-line react-hooks/purity
      timeMs: Date.now() - questionStartedAt.current,
    });
  }

  function submitScramble() {
    if (!question || question.type !== "scramble" || answered) return;
    const chosenChunks = selectedPoolIndices.map((poolIdx) => question.scrambledChunks[poolIdx]!);
    dispatch({
      type: "ANSWER_SCRAMBLE",
      chunks: chosenChunks,
      index: state.index,
      timeMs: Date.now() - questionStartedAt.current,
    });
  }

  function nextQuestion() {
    if (!answered) return;
    const advanced = grammarReducer(state, { type: "NEXT", index: state.index });
    if (advanced.index >= advanced.questions.length) {
      finish(advanced);
    } else {
      dispatch({ type: "NEXT", index: state.index });
    }
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

  return (
    <>
      <GameLayout label="GRAMMAR" glyph="文" onNavigateHome={requestQuit}>
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-7 sm:px-8">
          {/* Top Progress Bar */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold">
                <span>
                  {state.index + 1} / {state.questions.length}
                </span>
                <span className="text-[var(--muted)]">Score {correctCount}</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]"
                aria-label="Question progress"
              >
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => finish(state, true)}
              className="secondary-button min-h-11 rounded-md border px-4 py-2 text-sm font-bold"
            >
              End session
            </button>
          </div>

          {/* Centered Gameplay Area */}
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            {/* Prompt Card */}
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-bold text-white">
                    {question.level}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-0.5 text-xs font-semibold text-[var(--muted)]">
                    {question.type === "cloze" ? "Sentence Cloze" : "Syntax Scramble"}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Pattern: {question.grammarPattern}
                </span>
              </div>

              {question.type === "cloze" ? (
                <div className="mt-6">
                  <p
                    lang="ja"
                    className="font-japanese text-2xl leading-relaxed font-semibold text-[var(--ink)] sm:text-3xl"
                  >
                    <span>{question.before}</span>
                    <span className="mx-1.5 inline-block rounded-md border-2 border-dashed border-[var(--primary)] bg-[var(--sakura-light)] px-3 py-0.5 text-[var(--primary)]">
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
                  <p className="mt-1.5 text-lg font-semibold text-[var(--ink)]">
                    {question.naturalEn || question.en}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Hint: Uses <strong>{question.grammarPattern}</strong> ({question.shortExplanation})
                    </span>
                    {question.literalEn && question.literalEn !== (question.naturalEn || question.en) && (
                      <button
                        type="button"
                        onClick={() => setShowLiteralHint((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                      >
                        {showLiteralHint ? "Hide structural hint" : "💡 Structural hint"}
                      </button>
                    )}
                  </div>
                  {showLiteralHint && question.literalEn && (
                    <p className="mt-2 rounded-lg border border-[var(--sakura)] bg-[var(--sakura-light)]/40 p-2 text-xs text-[var(--ink)]">
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
                    ? "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)]"
                    : isCorrect
                      ? "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--ink)]"
                      : isChosen
                        ? "border-[var(--wrong)] bg-[var(--wrong)]/15 text-[var(--ink)]"
                        : "border-[var(--line)] bg-[var(--surface)] opacity-65";

                  return (
                    <button
                      key={`${option}-${idx}`}
                      type="button"
                      disabled={answered}
                      onClick={() => answerCloze(idx)}
                      className={`flex min-h-[64px] items-center gap-4 rounded-md border p-4 text-left text-sm font-bold transition-colors disabled:cursor-default ${statusClass}`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-current text-xs">
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
              <div className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`text-sm font-bold ${
                      result.status === "correct" ? "text-[var(--correct)]" : "text-[var(--wrong)]"
                    }`}
                  >
                    {result.status === "correct" ? "✓ Correct!" : "✕ Not quite"}
                  </p>

                  <button
                    type="button"
                    onClick={() => void openGuideDrawer()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/40 bg-[var(--paper-tint)] px-3.5 py-1 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                  >
                    <BookOpen className="size-3.5" />
                    <span>Read Guide</span>
                  </button>
                </div>

                <p lang="ja" className="font-japanese mt-2 text-lg font-semibold text-[var(--ink)]">
                  {question.sentenceJp}
                </p>
                {question.romaji && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{question.romaji}</p>
                )}
                <p className="mt-1 text-sm text-[var(--ink)]">{question.en}</p>

                <button
                  ref={nextButtonRef}
                  type="button"
                  onClick={nextQuestion}
                  className="primary-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-bold"
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
