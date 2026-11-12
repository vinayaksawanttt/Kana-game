"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  CheckCircle2,
  SkipForward,
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
  SYNONYM_MATCH_ITEMS,
  createSynonymMatchSession,
  summarizeSynonymMatchSession,
  synonymMatchReducer,
  type SynonymMatchResultSummary,
  type SynonymMatchSession,
} from "@/engine/jlptSynonymMatch";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addVocabularyToSrs } from "@/lib/srs/service";
import { AudioButton } from "@/components/ui/AudioButton";
import { FuriganaText } from "@/components/ui/FuriganaText";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): SynonymMatchSession {
  const existing = getGameSession<SynonymMatchSession>("jlpt-synonym", sessionId);
  if (existing && Array.isArray(existing.questions) && existing.questions.length > 0) {
    return existing;
  }
  const fallback = createSynonymMatchSession(
    SYNONYM_MATCH_ITEMS,
    {
      levels: [5],
      size: 10,
      scriptMode: "exam-authentic",
      showSentenceTranslationHint: false,
    },
    Math.random,
    sessionId,
  );
  saveGameSession("jlpt-synonym", sessionId, fallback);
  return fallback;
}

export default function SynonymMatchPlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { stopAudio } = useJapaneseAudio();

  const [session, dispatch] = useReducer(
    synonymMatchReducer,
    sessionId,
    loadInitialSession,
  );

  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const [showFurigana, setShowFurigana] = useState<boolean>(
    session.settings.scriptMode === "with-furigana",
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
    sessionStorage.removeItem(`jlpt-synonym-session:${session.sessionId}`);
    router.replace("/games/jlpt/synonym-match");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [session.currentIndex]);

  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-synonym", session.sessionId, session);
    if (session.status === "finished") {
      const existingResult = getGameResult<SynonymMatchResultSummary>(
        "jlpt-synonym",
        session.sessionId,
      );
      if (!existingResult) {
        const summary = summarizeSynonymMatchSession(session);
        saveGameResult("jlpt-synonym", summary);
      }
      router.replace(`/games/jlpt/synonym-match/result/${session.sessionId}`);
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
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSelectOption, handleSkip, session.revealed]);

  async function handleSaveToFSRS(
    key: string,
    word: string,
    reading: string,
    meaningEn: string,
    jlptLevel: string,
  ) {
    if (savedWords[key]) return;
    await addVocabularyToSrs({
      word,
      reading,
      meaning: meaningEn,
      level: jlptLevel,
    });
    setSavedWords((prev) => ({ ...prev, [key]: true }));
  }

  if (!currentQuestion) {
    return null;
  }

  const latestAnswer = session.revealed
    ? session.answers[session.answers.length - 1]
    : null;
  const progressPercent = Math.round(
    ((session.currentIndex + (session.revealed ? 1 : 0)) / session.questions.length) * 100,
  );

  const targetSrsKey = `${currentQuestion.id}:target`;
  const synonymSrsKey = `${currentQuestion.id}:synonym`;

  return (
    <GameLayout
      label="SYNONYM PARAPHRASE · 言い換え類義"
      glyph="類"
      homeHref="/games/jlpt"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-bold text-[var(--primary-fg)]">
            {session.currentIndex + 1} / {session.questions.length}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-bold">
            Score: {session.score}
          </span>
          <button
            type="button"
            aria-pressed={showFurigana}
            onClick={() => setShowFurigana((prev) => !prev)}
            className={`rounded-full border px-3 py-1 font-semibold transition ${
              showFurigana
                ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
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
      {/* Top Progress Bar */}
      <div className="mx-auto w-full max-w-4xl px-5 pt-3 sm:px-8">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 pt-6 sm:px-8">
        {/* Center Sentence Stage Card */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--primary-fg)]">
              JLPT {currentQuestion.levelLabel} · 言い換え類義 問題5
            </span>
            <span className="font-japanese text-xs text-[var(--muted)]">
              つぎの文の【 】のことばと、だいたい同じ意味のことばを選んでください。
            </span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Choose the word closest in meaning to the highlighted word:
          </p>

          {/* Highlighted Context Sentence */}
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 sm:p-6">
            <p
              lang="ja"
              className="font-japanese text-2xl leading-relaxed text-[var(--ink)] sm:text-3xl"
            >
              <FuriganaText
                text={currentQuestion.prefixFurigana || currentQuestion.prefix}
                showFurigana={showFurigana}
              />
              <span className="mx-1 inline-block rounded-xl border-b-2 border-[var(--primary)] bg-[var(--sakura-light)] px-2.5 py-0.5 font-bold text-[var(--primary-fg)]">
                【
                <FuriganaText
                  text={currentQuestion.targetFurigana || currentQuestion.targetSurface}
                  showFurigana={showFurigana}
                />
                】
              </span>
              <FuriganaText
                text={currentQuestion.suffixFurigana || currentQuestion.suffix}
                showFurigana={showFurigana}
              />
            </p>

            {(session.settings.showSentenceTranslationHint || session.revealed) && (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {currentQuestion.sentenceEn}
              </p>
            )}
          </div>
        </div>

        {/* 4 Japanese Vocabulary Option Buttons (2x2 Grid) */}
        <div
          role="group"
          aria-label="Japanese synonym choices"
          className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2"
        >
          {currentQuestion.options.map((opt) => {
            const isChosen = latestAnswer?.chosenOptionIndex === opt.index;
            const isCorrectOption = opt.isCorrect;

            let cardClasses =
              "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)]";
            let badgeClasses = "bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]";

            if (session.revealed) {
              if (isCorrectOption) {
                cardClasses =
                  "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--ink)]";
                badgeClasses = "bg-[var(--correct)] text-white";
              } else if (isChosen && !isCorrectOption) {
                cardClasses =
                  "border-[var(--wrong)] bg-[var(--wrong)]/10 text-[var(--ink)]";
                badgeClasses = "bg-[var(--wrong)] text-white";
              } else {
                cardClasses = "border-[var(--line)] bg-[var(--surface)] opacity-75";
              }
            }

            return (
              <div
                key={opt.index}
                onClick={() => {
                  if (!session.revealed) handleSelectOption(opt.index);
                }}
                role="button"
                tabIndex={session.revealed ? -1 : 0}
                aria-disabled={session.revealed}
                onKeyDown={(e) => {
                  if (!session.revealed && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSelectOption(opt.index);
                  }
                }}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  session.revealed ? "cursor-default" : "cursor-pointer"
                } ${cardClasses}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${badgeClasses}`}
                    >
                      {opt.optionNumber}
                    </span>
                    <div>
                      <span
                        lang="ja"
                        className="font-japanese text-xl font-bold text-[var(--ink)]"
                      >
                        <FuriganaText text={opt.furigana} showFurigana={showFurigana} />
                      </span>
                      {(showFurigana || session.revealed) && opt.reading !== opt.word && (
                        <span className="ml-2 font-japanese text-xs text-[var(--muted)]">
                          ({opt.reading})
                        </span>
                      )}
                    </div>
                  </div>

                  {session.revealed && (
                    <div className="flex items-center gap-2">
                      <AudioButton
                        text={opt.word}
                        reading={opt.reading}
                        mode="vocab"
                        size="sm"
                        label={`Listen to ${opt.word}`}
                      />
                      {isCorrectOption && (
                        <CheckCircle2
                          size={18}
                          className="text-[var(--correct)]"
                          aria-label="Correct synonym"
                        />
                      )}
                      {isChosen && !isCorrectOption && (
                        <XCircle
                          size={18}
                          className="text-[var(--wrong)]"
                          aria-label="Incorrect choice"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Reveal English meaning inside all 4 option cards after answering */}
                {session.revealed && (
                  <p className="mt-2 border-t border-[var(--line)]/60 pt-2 text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--ink)]">Meaning:</span>{" "}
                    {opt.meaningEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Row before reveal */}
        {!session.revealed && (
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-[var(--muted)]">
              Press <kbd className="rounded border px-1.5 py-0.5 font-mono">1</kbd>–
              <kbd className="rounded border px-1.5 py-0.5 font-mono">4</kbd> to answer ·{" "}
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
        )}

        {/* Post-Answer "Synonym Equivalence" Learn Panel */}
        {session.revealed && (
          <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {latestAnswer?.status === "correct" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--correct)]/15 px-3 py-1 text-xs font-extrabold text-[var(--correct)]">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Correct Paraphrase!
                  </span>
                ) : latestAnswer?.status === "wrong" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--wrong)]/15 px-3 py-1 text-xs font-extrabold text-[var(--wrong)]">
                    <XCircle size={14} aria-hidden="true" />
                    Incorrect — Review Synonym Equivalence
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-extrabold text-[var(--muted)]">
                    Skipped — Review Synonym Equivalence
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <AudioButton
                  text={currentQuestion.sentenceJa}
                  mode="sentence"
                  size="sm"
                  label="Listen to full sentence"
                />
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Sentence Audio
                </span>
              </div>
            </div>

            {/* Equivalence Banner */}
            <div className="mt-4 rounded-2xl border border-[var(--sakura)] bg-[var(--sakura-light)]/50 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                Synonym Equivalence (言い換え類義)
              </p>
              <p className="mt-1.5 font-japanese text-lg font-bold text-[var(--ink)] sm:text-xl">
                【{currentQuestion.targetWord} ({currentQuestion.targetReading})】 ≈ 【
                {currentQuestion.correctSynonym.word} (
                {currentQuestion.correctSynonym.reading})】
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
                {currentQuestion.sharedNuanceNote}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                <strong>Full Sentence:</strong> {currentQuestion.sentenceEn}
              </p>
            </div>

            {/* + FSRS Bookmark Buttons & Next Question */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(savedWords[targetSrsKey])}
                  onClick={() =>
                    void handleSaveToFSRS(
                      targetSrsKey,
                      currentQuestion.targetWord,
                      currentQuestion.targetReading,
                      currentQuestion.targetMeaningEn,
                      currentQuestion.levelLabel,
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    savedWords[targetSrsKey]
                      ? "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--correct)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  {savedWords[targetSrsKey] ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <BookmarkPlus size={14} aria-hidden="true" />
                  )}
                  <span>
                    + FSRS: {currentQuestion.targetWord}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(savedWords[synonymSrsKey])}
                  onClick={() =>
                    void handleSaveToFSRS(
                      synonymSrsKey,
                      currentQuestion.correctSynonym.word,
                      currentQuestion.correctSynonym.reading,
                      currentQuestion.correctSynonym.meaningEn,
                      currentQuestion.levelLabel,
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    savedWords[synonymSrsKey]
                      ? "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--correct)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  {savedWords[synonymSrsKey] ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <BookmarkPlus size={14} aria-hidden="true" />
                  )}
                  <span>
                    + FSRS: {currentQuestion.correctSynonym.word}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
              >
                <span>
                  {session.currentIndex + 1 >= session.questions.length
                    ? "See Results"
                    : "Next →"}
                </span>
                <ArrowRight size={15} aria-hidden="true" />
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
