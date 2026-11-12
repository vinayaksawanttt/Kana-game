"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  CheckCircle2,
  RotateCcw,
  SkipForward,
  Sparkles,
  Undo2,
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
  STAR_SCRAMBLE_ITEMS,
  createStarScrambleSession,
  starScrambleReducer,
  summarizeStarScrambleSession,
  type StarScrambleResultSummary,
  type StarScrambleSession,
} from "@/engine/jlptStarScramble";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addGrammarToSrs } from "@/lib/srs/service";
import { grammarGuideHref } from "@/data/grammar";
import { FuriganaText } from "@/components/ui/FuriganaText";
import { QuitSessionDialog, useQuitSessionGuard } from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): StarScrambleSession {
  const existing = getGameSession<StarScrambleSession>("jlpt-star", sessionId);
  if (existing && Array.isArray(existing.questions) && existing.questions.length > 0) {
    return existing;
  }
  const fallback = createStarScrambleSession(
    STAR_SCRAMBLE_ITEMS,
    { levels: ["N5"], size: 10, showEnglishHint: true },
    Math.random,
    sessionId,
  );
  saveGameSession("jlpt-star", sessionId, fallback);
  return fallback;
}

export default function StarScramblePlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();
  const { playSentence, stopAudio } = useJapaneseAudio();

  const [session, dispatch] = useReducer(
    starScrambleReducer,
    sessionId,
    loadInitialSession,
  );

  const [savedGrammarIds, setSavedGrammarIds] = useState<Record<string, boolean>>({});
  const [showFurigana, setShowFurigana] = useState<boolean>(
    Boolean(session.settings.showFurigana),
  );
  const questionStartRef = useRef<number>(Date.now());

  const currentQuestion = session.questions[session.currentIndex];
  const allSlotsFilled = session.placedTileIds.every((id) => id !== null);
  const anySlotFilled = session.placedTileIds.some((id) => id !== null);

  const isSessionActive = session.status === "playing";
  const isQuittingRef = useRef(false);
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    stopAudio();
    sessionStorage.removeItem(`jlpt-star-session:${session.sessionId}`);
    router.replace("/games/jlpt/star-scramble");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [session.currentIndex]);

  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-star", session.sessionId, session);
    if (session.status === "finished") {
      const existingResult = getGameResult<StarScrambleResultSummary>(
        "jlpt-star",
        session.sessionId,
      );
      if (!existingResult) {
        const summary = summarizeStarScrambleSession(session);
        saveGameResult("jlpt-star", summary);
      }
      router.replace(`/games/jlpt/star-scramble/result/${session.sessionId}`);
    }
  }, [router, session]);

  const handleSubmit = useCallback(() => {
    if (session.revealed || !allSlotsFilled) return;
    if (currentQuestion) {
      const starTileId = session.placedTileIds[currentQuestion.starSlotIndex];
      const isCorrect = starTileId === currentQuestion.correctStarTileId;
      playGameSfx(isCorrect ? "correct-chime" : "incorrect-chime");
    }
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    dispatch({ type: "SUBMIT", timeMs: elapsed });
  }, [allSlotsFilled, currentQuestion, session.placedTileIds, session.revealed]);

  const handleNext = useCallback(() => {
    if (!session.revealed) return;
    playGameSfx("card-flip");
    dispatch({ type: "NEXT", forIndex: session.currentIndex });
  }, [session.currentIndex, session.revealed]);

  const handleSkip = useCallback(() => {
    if (session.revealed) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const elapsed = Math.max(100, Date.now() - questionStartRef.current);
    dispatch({ type: "SKIP", timeMs: elapsed });
  }, [session.revealed]);

  const handleEndSession = useCallback(() => {
    const endedState = starScrambleReducer(session, { type: "END" });
    const summary = summarizeStarScrambleSession(endedState);
    saveGameResult("jlpt-star", summary);
    router.push(`/games/jlpt/star-scramble/result/${session.sessionId}`);
  }, [router, session]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (quitDialogOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!currentQuestion) return;

      if (!session.revealed) {
        if (e.key >= "1" && e.key <= "4") {
          e.preventDefault();
          const idx = Number(e.key) - 1;
          const tile = currentQuestion.options[idx];
          if (tile) {
            dispatch({ type: "PLACE_TILE", tileId: tile.id });
          }
          return;
        }
        if (e.key === "Backspace") {
          e.preventDefault();
          dispatch({ type: "UNDO_LAST" });
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          dispatch({ type: "CLEAR_SLOTS" });
          return;
        }
        if (e.key === "Enter" && allSlotsFilled) {
          e.preventDefault();
          handleSubmit();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allSlotsFilled, currentQuestion, handleNext, handleSubmit, quitDialogOpen, session.revealed]);

  async function handleSaveGrammarToSrs() {
    if (!currentQuestion) return;
    const gId = currentQuestion.grammarId;
    if (savedGrammarIds[gId]) return;
    await addGrammarToSrs({
      id: gId,
      pattern: currentQuestion.grammarPoint,
      meaning: currentQuestion.explanation,
      level: currentQuestion.level,
    });
    setSavedGrammarIds((prev) => ({ ...prev, [gId]: true }));
  }

  if (!currentQuestion) {
    return null;
  }

  const starCorrectCount = session.answers.filter((a) => a.starCorrect).length;
  const fullOrderCorrectCount = session.answers.filter((a) => a.fullOrderCorrect).length;
  const progressPercent = Math.round(
    ((session.currentIndex + (session.revealed ? 1 : 0)) / session.questions.length) * 100,
  );

  const tileById = new Map(currentQuestion.options.map((t) => [t.id, t]));
  const isGrammarSaved = Boolean(savedGrammarIds[currentQuestion.grammarId]);

  return (
    <GameLayout
      label="★ STAR SENTENCE SCRAMBLE"
      glyph="★"
      homeHref="/games/jlpt/star-scramble"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
            Q {session.currentIndex + 1} / {session.questions.length}
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold">
            ★ Score: {starCorrectCount}
          </span>
          <span className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--muted)] sm:inline-block">
            4/4 Order: {fullOrderCorrectCount}
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

        {/* Prompt Card */}
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8">
          {/* Card Header Badges */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                JLPT {currentQuestion.level} · 問題2 (星問題)
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                ★ Slot #{currentQuestion.starSlotIndex + 1}
              </span>
            </div>

            {session.settings.showEnglishHint ? (
              <span className="text-xs font-semibold text-[var(--muted)]">
                English Hint Active
              </span>
            ) : (
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]">
                Real Exam Mode (English hidden until submit)
              </span>
            )}
          </div>

          {/* Optional English Prompt Hint */}
          {(session.settings.showEnglishHint || session.revealed) && (
            <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm font-medium text-[var(--fg)]">
              <span className="mr-2 text-xs font-extrabold uppercase tracking-wider text-[var(--primary-fg)]">
                Meaning:
              </span>
              “{currentQuestion.english}”
            </div>
          )}

          {/* Sentence Line with Prefix + 4 Interactive Blank Slots + Suffix */}
          <div
            aria-label="Sentence assembly line"
            className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-5 font-japanese text-xl leading-relaxed sm:p-6 sm:text-2xl"
          >
            {currentQuestion.prefix && (
              <span className="py-1.5 font-bold">
                <FuriganaText
                  text={currentQuestion.prefix}
                  furiganaText={currentQuestion.prefixFurigana}
                  showFurigana={showFurigana}
                />
              </span>
            )}

            {([0, 1, 2, 3] as const).map((slotIdx) => {
              const isStarSlot = slotIdx === currentQuestion.starSlotIndex;
              const placedId = session.placedTileIds[slotIdx];
              const placedTile = placedId ? tileById.get(placedId) : undefined;
              const correctId = currentQuestion.correctOrderIds[slotIdx];
              const isSlotCorrectAfterReveal =
                session.revealed && placedId !== null && placedId === correctId;
              const isSlotWrongAfterReveal =
                session.revealed && placedId !== correctId;

              return (
                <div key={slotIdx} className="flex flex-col items-center">
                  {/* Top Marker Label (★ on starSlotIndex, slot number on others) */}
                  <span
                    className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[11px] font-extrabold ${
                      isStarSlot
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {isStarSlot ? "★ STAR" : `Slot ${slotIdx + 1}`}
                  </span>

                  <button
                    type="button"
                    disabled={session.revealed || !placedTile}
                    onClick={() =>
                      dispatch({ type: "SET_SLOT", slotIndex: slotIdx, tileId: null })
                    }
                    aria-label={
                      isStarSlot
                        ? `Star slot ${slotIdx + 1}: ${placedTile ? placedTile.text : "empty"}`
                        : `Slot ${slotIdx + 1}: ${placedTile ? placedTile.text : "empty"}`
                    }
                    className={`min-h-12 min-w-28 rounded-xl border-2 px-3.5 py-2 text-center font-japanese text-lg font-bold transition sm:min-w-32 sm:text-xl ${
                      isSlotCorrectAfterReveal
                        ? "border-[var(--correct)] bg-[var(--correct)]/15 text-[var(--correct)]"
                        : isSlotWrongAfterReveal
                          ? "border-rose-500 bg-rose-500/10 text-rose-500"
                          : isStarSlot
                            ? placedTile
                              ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm hover:opacity-90"
                              : "border-dashed border-[var(--primary)] bg-[var(--sakura-light)]/40 text-[var(--primary-fg)]"
                            : placedTile
                              ? "border-[var(--sakura)] bg-[var(--surface)] text-[var(--fg)] shadow-sm hover:border-[var(--primary)]"
                              : "border-dashed border-[var(--line)] bg-[var(--surface)]/50 text-[var(--muted)]"
                    }`}
                  >
                    {placedTile ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="rounded bg-black/10 px-1.5 py-0.5 font-sans text-xs font-extrabold dark:bg-white/10">
                          {placedTile.optionNumber}
                        </span>
                        <FuriganaText
                          text={placedTile.text}
                          furiganaText={placedTile.furiganaText}
                          showFurigana={showFurigana}
                        />
                      </span>
                    ) : isStarSlot ? (
                      <span className="text-base font-extrabold text-[var(--primary-fg)]">
                        ★ ＿＿
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--muted)]">＿＿</span>
                    )}
                  </button>
                </div>
              );
            })}

            {currentQuestion.suffix && (
              <span className="py-1.5 font-bold">
                <FuriganaText
                  text={currentQuestion.suffix}
                  furiganaText={currentQuestion.suffixFurigana}
                  showFurigana={showFurigana}
                />
              </span>
            )}
          </div>

          {/* Shuffled Phrase Tile Tray (1 · 2 · 3 · 4) */}
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                Phrase Tiles (Click or Press 1–4)
              </span>

              {!session.revealed && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!anySlotFilled}
                    onClick={() => dispatch({ type: "UNDO_LAST" })}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)] disabled:opacity-40"
                  >
                    <Undo2 size={13} />
                    <span>Undo</span>
                  </button>
                  <button
                    type="button"
                    disabled={!anySlotFilled}
                    onClick={() => dispatch({ type: "CLEAR_SLOTS" })}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)] disabled:opacity-40"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((tile) => {
                const placedSlotIdx = session.placedTileIds.indexOf(tile.id);
                const isPlaced = placedSlotIdx !== -1;
                const isPlacedOnStar = placedSlotIdx === currentQuestion.starSlotIndex;

                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={session.revealed}
                    onClick={() => dispatch({ type: "PLACE_TILE", tileId: tile.id })}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isPlaced
                        ? isPlacedOnStar
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] opacity-75"
                          : "border-[var(--sakura)] bg-[var(--bg)] text-[var(--muted)] opacity-65"
                        : "border-[var(--line)] bg-[var(--bg)] hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                          isPlacedOnStar
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                        }`}
                      >
                        {tile.optionNumber}
                      </span>
                      <span className="font-japanese text-lg font-bold sm:text-xl">
                        <FuriganaText
                          text={tile.text}
                          furiganaText={tile.furiganaText}
                          showFurigana={showFurigana}
                        />
                      </span>
                    </div>

                    {isPlaced && (
                      <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                        {isPlacedOnStar ? "★ Slot" : `Slot ${placedSlotIdx + 1}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit / Skip Controls */}
          {!session.revealed && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
              >
                <SkipForward size={14} />
                <span>Skip Question</span>
              </button>

              <button
                type="button"
                disabled={!allSlotsFilled}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={16} />
                <span>Submit ★ Answer</span>
              </button>
            </div>
          )}
        </div>

        {/* Answer Reveal & Explanation Drawer */}
        {session.revealed && session.lastAnswer && (
          <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-8">
            {/* Dual JLPT Score Feedback Badges */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  session.lastAnswer.starCorrect
                    ? "border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-500"
                }`}
              >
                {session.lastAnswer.starCorrect ? (
                  <CheckCircle2 size={22} className="shrink-0" />
                ) : (
                  <XCircle size={22} className="shrink-0" />
                )}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    Official JLPT ★ Star Slot
                  </div>
                  <div className="text-sm font-bold">
                    {session.lastAnswer.starCorrect
                      ? "★ Correct! (+1 JLPT Exam Point)"
                      : `★ Incorrect — Correct ★ tile: 「${currentQuestion.segments[currentQuestion.starSlotIndex]}」`}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  session.lastAnswer.fullOrderCorrect
                    ? "border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {session.lastAnswer.fullOrderCorrect ? (
                  <Sparkles size={22} className="shrink-0" />
                ) : (
                  <RotateCcw size={22} className="shrink-0" />
                )}
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    Full 4-Tile Sentence Order
                  </div>
                  <div className="text-sm font-bold">
                    {session.lastAnswer.fullOrderCorrect
                      ? "Perfect 4/4 Syntactic Order!"
                      : "See exact 4-tile sequence below"}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Reconstructed Sentence + Audio Button */}
            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                    Correct Sentence Order (★ highlighted in red)
                  </div>
                  <p className="mt-2 font-japanese text-xl font-bold leading-relaxed sm:text-2xl">
                    {currentQuestion.prefix && (
                      <FuriganaText
                        text={currentQuestion.prefix}
                        furiganaText={currentQuestion.prefixFurigana}
                        showFurigana={showFurigana}
                      />
                    )}
                    {currentQuestion.segments.map((seg, idx) => (
                      <span
                        key={idx}
                        className={
                          idx === currentQuestion.starSlotIndex
                            ? "mx-1 rounded-lg bg-[var(--sakura-light)] px-2 py-0.5 text-[var(--primary-fg)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
                            : "mx-0.5 underline decoration-[var(--line)] underline-offset-4"
                        }
                      >
                        {idx === currentQuestion.starSlotIndex && "★"}
                        <FuriganaText
                          text={seg}
                          furiganaText={currentQuestion.segmentsFurigana?.[idx]}
                          showFurigana={showFurigana}
                        />
                      </span>
                    ))}
                    {currentQuestion.suffix && (
                      <FuriganaText
                        text={currentQuestion.suffix}
                        furiganaText={currentQuestion.suffixFurigana}
                        showFurigana={showFurigana}
                      />
                    )}
                  </p>
                  {currentQuestion.romaji && (
                    <p className="mt-1.5 text-xs text-[var(--muted)]">
                      {currentQuestion.romaji}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-[var(--fg)]">
                    {currentQuestion.english}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void playSentence(currentQuestion.fullSentence)}
                  aria-label="Play full sentence audio"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--sakura-light)] px-4 py-2 text-xs font-bold text-[var(--primary-fg)] transition hover:opacity-90"
                >
                  <Volume2 size={15} />
                  <span>Play Sentence</span>
                </button>
              </div>
            </div>

            {/* Target Grammar Pattern Card + FSRS Bookmark */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    Target Grammar ({currentQuestion.level})
                  </span>
                  <Link
                    href={grammarGuideHref(currentQuestion.grammarId)}
                    className="font-japanese text-base font-bold text-[var(--primary-fg)] hover:underline"
                  >
                    {currentQuestion.grammarPoint}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {currentQuestion.explanation}
                </p>
              </div>

              <button
                type="button"
                disabled={isGrammarSaved}
                onClick={() => void handleSaveGrammarToSrs()}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  isGrammarSaved
                    ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--primary-fg)] hover:border-[var(--sakura)]"
                }`}
              >
                {isGrammarSaved ? <Check size={14} /> : <BookmarkPlus size={14} />}
                <span>{isGrammarSaved ? "Saved to FSRS" : "+ FSRS"}</span>
              </button>
            </div>

            {/* Next Question Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:opacity-95"
              >
                <span>
                  {session.currentIndex + 1 >= session.questions.length
                    ? "Finish & View JLPT Score"
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
