"use client";

import { Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { loadKanjiData, type KanjiRecord } from "@/data/kanji";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import {
  buildKanjiMeaningResult,
  createKanjiMeaningState,
  kanjiMeaningReducer,
  type KanjiMeaningState,
  type StoredKanjiMeaningSession,
} from "@/lib/game/kanji-meaning";
import { getGameResult, getGameSession, saveGameResult } from "@/lib/game-core/storage";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";
import { ingestKanjiMeaningSession } from "@/lib/srs/service";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { buildKanjiReadAllQueue } from "@/engine/audio";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";

export default function KanjiMeaningPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Preparing Kanji Session..." size="md" />
        </main>
      }
    >
      <KanjiMeaningPlayContent />
    </Suspense>
  );
}

function KanjiMeaningPlayContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [game, setGame] = useState<{
    session: StoredKanjiMeaningSession;
    records: KanjiRecord[];
    initial: KanjiMeaningState;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(async () => {
        const savedResult = getGameResult("kanji", sessionId);
        if (savedResult) {
          router.replace(`/games/kanji/meaning/result/${sessionId}`);
          return;
        }
        const session = getGameSession<StoredKanjiMeaningSession>("kanji", sessionId);
        if (
          !session ||
          session.sessionId !== sessionId ||
          !Array.isArray(session.questions) ||
          !session.questions.length
        ) {
          router.replace("/games/kanji/meaning");
          return;
        }
        const records = await loadKanjiData(session.settings.levels);
        if (active) setGame({ session, records, initial: createKanjiMeaningState(session, records) });
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load kanji meaning session data.", error);
        setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [router, sessionId]);

  if (loadError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] px-5 text-center text-[var(--muted)]">
        This session could not be loaded. Return to{" "}
        <a className="ml-1 underline" href="/games/kanji/meaning">
          setup
        </a>
        .
      </main>
    );
  }
  if (!game) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Kanji Session..." size="md" />
      </main>
    );
  }
  return (
    <KanjiMeaningGame
      key={sessionId}
      session={game.session}
      records={game.records}
      initial={game.initial}
    />
  );
}

function KanjiMeaningGame({
  session,
  records,
  initial,
}: {
  session: StoredKanjiMeaningSession;
  records: KanjiRecord[];
  initial: KanjiMeaningState;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(kanjiMeaningReducer, initial);
  const nextButton = useRef<HTMLButtonElement>(null);
  const questionStartedAt = useRef(0);
  const stateRef = useRef(state);
  const timerRef = useRef<{ id: number; index: number } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } = useQuitSessionGuard(true);
  const { playReadingSequence, autoPlayEnabled, setAutoPlayEnabled } = useJapaneseAudio();
  const recordByCharacter = new Map(records.map((record) => [record.c, record]));
  const question = state.questions[state.index];
  const result = state.results[state.index];
  const answered = result?.status !== "unanswered";
  const correctCount = state.results.filter((item) => item.status === "correct").length;
  const progress = ((state.index + (answered ? 1 : 0)) / state.questions.length) * 100;

  useEffect(() => {
    questionStartedAt.current = Date.now();
    if (answered) nextButton.current?.focus();
  }, [answered, state.index]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current.id);
    },
    []
  );

  const finish = useCallback(
    (finalState: KanjiMeaningState, endedEarly = false) => {
      if (timerRef.current) window.clearTimeout(timerRef.current.id);
      timerRef.current = null;
      setLeaving(false);
      const finishedState = endedEarly
        ? kanjiMeaningReducer(finalState, { type: "END" })
        : finalState;
      const builtResult = buildKanjiMeaningResult(finishedState);
      saveGameResult("kanji", builtResult, localStorage);
      void ingestKanjiMeaningSession(builtResult.questions);
      router.push(`/games/kanji/meaning/result/${session.sessionId}`);
    },
    [router, session.sessionId]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !question ||
        answered ||
        leaving ||
        !/^[1-4]$/.test(event.key) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      event.preventDefault();
      const optionIndex = Number(event.key) - 1;
      const isCorrect = question.optionKanji[optionIndex] === question.kanji;
      playGameSfx(isCorrect ? "correct-chime" : "incorrect-chime");
      dispatch({
        type: "ANSWER",
        optionIndex,
        index: state.index,
        timeMs: Date.now() - questionStartedAt.current,
      });
      const currentKanji = recordByCharacter.get(question.kanji);
      if (currentKanji && autoPlayEnabled) {
        const queue = buildKanjiReadAllQueue(currentKanji);
        void playReadingSequence(queue);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answered, autoPlayEnabled, leaving, playReadingSequence, question, recordByCharacter, state.index]);

  function quitSession() {
    confirmQuit();
    if (timerRef.current) window.clearTimeout(timerRef.current.id);
    timerRef.current = null;
    sessionStorage.removeItem(`kanji-session:${session.sessionId}`);
    router.replace("/games/kanji/meaning");
  }

  function answer(optionIndex: number) {
    if (answered || leaving || !question) return;
    const isCorrect = question.optionKanji[optionIndex] === question.kanji;
    playGameSfx(isCorrect ? "correct-chime" : "incorrect-chime");
    dispatch({
      type: "ANSWER",
      optionIndex,
      index: state.index,
      // eslint-disable-next-line react-hooks/purity
      timeMs: Date.now() - questionStartedAt.current,
    });
    const currentKanji = recordByCharacter.get(question.kanji);
    if (currentKanji && autoPlayEnabled) {
      const queue = buildKanjiReadAllQueue(currentKanji);
      void playReadingSequence(queue);
    }
  }

  function next() {
    if (!answered || leaving) return;
    const targetIndex = state.index;
    setLeaving(true);
    timerRef.current = {
      index: targetIndex,
      id: window.setTimeout(() => {
        const latest = stateRef.current;
        if (latest.index !== targetIndex || timerRef.current?.index !== targetIndex) {
          if (timerRef.current?.index === targetIndex) timerRef.current = null;
          return;
        }
        timerRef.current = null;
        const advanced = kanjiMeaningReducer(latest, { type: "NEXT", index: targetIndex });
        if (advanced.index >= advanced.questions.length) finish(advanced);
        else {
          playGameSfx("card-flip");
          setLeaving(false);
          dispatch({ type: "NEXT", index: targetIndex });
        }
      }, 360),
    };
  }

  if (!question || !result) return null;
  const kanji = recordByCharacter.get(question.kanji);
  if (!kanji) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
        Kanji data is missing from this session.
      </main>
    );
  }

  return (
    <>
      <GameLayout label="KANJI" glyph="漢" onNavigateHome={requestQuit}>
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-7 sm:px-8">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                aria-label={autoPlayEnabled ? "Disable auto-read readings on reveal" : "Enable auto-read readings on reveal"}
                title={autoPlayEnabled ? "Auto-read readings on reveal (Enabled)" : "Auto-read readings on reveal (Disabled)"}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none ${
                  autoPlayEnabled
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-subtle,#fff1f2)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)] bg-[var(--surface)]"
                }`}
              >
                <span>{autoPlayEnabled ? "🔊 Auto-read on" : "🔇 Auto-read off"}</span>
              </button>
              <button
                type="button"
                onClick={() => finish(state, true)}
                className="secondary-button min-h-11 rounded-md border px-4 py-2 text-sm font-bold"
              >
                End session
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
              <section
                aria-label="Kanji flashcard"
                className="flex flex-col items-center justify-center"
              >
                <div className="kana-card-shell kanji-card-shell w-[clamp(280px,28vw,420px)] aspect-[3/4] min-h-[clamp(360px,50dvh,520px)]">
                  <div className="kana-card-stack" aria-hidden="true">
                    {[0, 1, 2]
                      .slice(0, Math.min(3, state.questions.length - state.index - 1))
                      .map((layer) => (
                        <div key={layer} className="paper-layer" />
                      ))}
                  </div>
                  <div
                    key={question.id}
                    className={`kana-card kanji-card ${result.status === "correct" ? "kana-correct" : result.status === "wrong" ? "kana-wrong" : ""} ${leaving ? "kanji-leave" : ""}`}
                  >
                    <div className="absolute left-0 right-0 top-[11%] z-[1] flex justify-center gap-2">
                      <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold">
                        N{kanji.jlpt}
                      </span>
                      <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold">
                        {kanji.grade === 8
                          ? "Secondary (8)"
                          : kanji.grade === 9
                            ? "Names (9)"
                            : `Grade ${kanji.grade}`}
                      </span>
                    </div>
                    <span
                      className="kanji-card-glyph font-japanese text-[clamp(4.5rem,9vw,8rem)]"
                      aria-label={`Kanji ${kanji.c}`}
                    >
                      {kanji.c}
                    </span>
                  </div>
                </div>
              </section>

              <section aria-label="Meaning choices" className="mx-auto w-full max-w-2xl">
                <div className="mb-5 border-b border-[var(--line)] pb-4">
                  <p className="text-xs font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
                    Question {state.index + 1} of {state.questions.length}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
                    Choose the meaning
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Select the best English definition for this kanji.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  {question.optionKanji.map((option, index) => {
                    const optionIsCorrect = option === question.kanji;
                    const chosen = result.chosenKanji === option;
                    const statusClass = !answered
                      ? "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)]"
                      : optionIsCorrect
                        ? "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--ink)]"
                        : chosen
                          ? "border-[var(--wrong)] bg-[var(--wrong)]/15 text-[var(--ink)]"
                          : "border-[var(--line)] bg-[var(--surface)] opacity-65";
                    return (
                      <button
                        key={`${option}-${index}`}
                        type="button"
                        disabled={answered || leaving}
                        onClick={() => answer(index)}
                        className={`flex min-h-[68px] items-center gap-4 rounded-md border p-4 text-left text-sm font-bold transition-colors disabled:cursor-default ${statusClass}`}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-current text-xs">
                          {index + 1}
                        </span>
                        <span className="flex-1">{state.labelByKanji[option]}</span>
                        {answered && optionIsCorrect && (
                          <Check size={18} aria-label="Correct answer" className="text-[var(--correct)]" />
                        )}
                        {answered && chosen && !optionIsCorrect && (
                          <X
                            size={18}
                            aria-label="Your incorrect answer"
                            className="text-[var(--wrong)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 w-full">
                  <div className="flex min-h-[28px] items-center justify-center">
                    <p
                      className={`text-center text-sm font-bold ${
                        result.status === "correct"
                          ? "text-[var(--correct)]"
                          : result.status === "wrong"
                            ? "text-[var(--wrong)]"
                            : "text-[var(--muted)]"
                      }`}
                      aria-live="polite"
                    >
                      {result.status === "correct"
                        ? `✓ Correct — ${result.correctLabel}`
                        : result.status === "wrong"
                          ? `✕ Not quite. The meaning is ${result.correctLabel}.`
                          : ""}
                    </p>
                  </div>
                  {answered && (
                    <div className="mt-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                        <p className="text-sm font-bold">Learn this kanji</p>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const queue = buildKanjiReadAllQueue(kanji);
                            void playReadingSequence(queue);
                          }}
                          className="secondary-button inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer"
                          title="Play primary On'yomi and Kun'yomi readings sequentially"
                        >
                          <Volume2 size={13} className="text-[var(--primary)]" />
                          <span>Read readings</span>
                        </button>
                      </div>

                      {kanji.on.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">
                            On&apos;yomi (音読み)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {kanji.on.map((reading) => (
                              <KanjiReadingPill key={reading} reading={reading} type="on" size="sm" />
                            ))}
                          </div>
                        </div>
                      )}

                      {kanji.kun.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">
                            Kun&apos;yomi (訓読み)
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {kanji.kun.map((reading) => (
                              <KanjiReadingPill key={reading} reading={reading} type="kun" size="sm" />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                        <span>
                          <strong className="text-[var(--ink)]">Strokes:</strong> {kanji.strokes}
                        </span>
                        <span>
                          <strong className="text-[var(--ink)]">Meanings:</strong>{" "}
                          {kanji.meanings.join(", ")}
                        </span>
                      </div>
                    </div>
                  )}
                  {answered && (
                    <button
                      ref={nextButton}
                      type="button"
                      disabled={leaving}
                      onClick={next}
                      className="primary-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-bold disabled:opacity-70"
                    >
                      {state.index + 1 === state.questions.length ? "Finish" : "Next"}{" "}
                      <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </GameLayout>
      <QuitSessionDialog open={quitDialogOpen} onCancel={cancelQuit} onConfirm={quitSession} />
    </>
  );
}
