"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
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
  DISCOURSE_CATEGORY_META,
  PARAGRAPH_CLOZE_PASSAGES,
  calculateParagraphClozeResult,
  createParagraphClozeSession,
  formatJlptLevel,
  paragraphClozeReducer,
  type ClozeBlankItem,
  type ParagraphClozeResultSummary,
  type ParagraphClozeSession,
} from "@/engine/jlptParagraphCloze";
import { buildStoryAudioQueue, type PlaybackSpeed } from "@/engine/audio";
import { useStoryNarrator } from "@/hooks/useStoryNarrator";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import {
  QuitSessionDialog,
  useQuitSessionGuard,
} from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): ParagraphClozeSession {
  const existing = getGameSession<ParagraphClozeSession>("jlpt-cloze", sessionId);
  if (existing && Array.isArray(existing.passages) && existing.passages.length > 0) {
    return existing;
  }

  // Fallback: create fresh default session
  const fallback = createParagraphClozeSession(PARAGRAPH_CLOZE_PASSAGES, {
    levels: [5],
    sourceFilter: "all",
    passageCount: 2,
    showEnglishSentenceHints: false,
  });
  fallback.sessionId = sessionId;
  saveGameSession("jlpt-cloze", sessionId, fallback);
  return fallback;
}

export default function ParagraphClozePlayPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId ?? "default";
  const router = useRouter();

  const [session, dispatch] = useReducer(
    paragraphClozeReducer,
    sessionId,
    loadInitialSession
  );

  const { playSentence, stopAudio } = useJapaneseAudio();
  const passageStartRef = useRef<number>(Date.now());
  const isQuittingRef = useRef(false);

  const isSessionActive = session.status === "playing";
  const currentPassage = session.passages[session.currentPassageIndex];

  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    stopAudio();
    sessionStorage.removeItem(`jlpt-cloze-session:${session.sessionId}`);
    router.replace("/games/jlpt/paragraph-cloze");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  useEffect(() => {
    passageStartRef.current = Date.now();
  }, [session.currentPassageIndex]);

  // Save session state to sessionStorage
  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-cloze", session.sessionId, session);

    if (session.status === "finished") {
      const existingResult = getGameResult<ParagraphClozeResultSummary>(
        "jlpt-cloze",
        session.sessionId
      );
      if (!existingResult) {
        const computed = calculateParagraphClozeResult(session);
        saveGameResult("jlpt-cloze", computed);
      }
      router.replace(`/games/jlpt/paragraph-cloze/result/${session.sessionId}`);
    }
  }, [session, router]);

  // Story Narrator setup for the completed passage
  const storyAudioQueue = useMemo(() => {
    if (!currentPassage) return [];
    return buildStoryAudioQueue({
      slug: currentPassage.linkedStory?.slug ?? currentPassage.id,
      paragraphs: currentPassage.paragraphs.map((p) => ({
        sentences: p.sentences.map((s) => ({ ja: s.rawCompletedJa })),
      })),
    });
  }, [currentPassage]);

  const narrator = useStoryNarrator(storyAudioQueue);
  const narratorRef = useRef(narrator);
  useEffect(() => {
    narratorRef.current = narrator;
  }, [narrator]);

  // Stop audio on unmount only
  useEffect(() => {
    return () => {
      narratorRef.current.stop();
      stopAudio();
    };
  }, [stopAudio]);

  const activeBlank: ClozeBlankItem | undefined =
    currentPassage?.blanks[session.activeBlankIndex];

  const allBlanksFilled = useMemo(() => {
    if (!currentPassage) return false;
    return (
      session.selectedOptionByBlank.length === currentPassage.blanks.length &&
      session.selectedOptionByBlank.every((idx) => idx !== null)
    );
  }, [currentPassage, session.selectedOptionByBlank]);

  const currentPassageResult = useMemo(() => {
    return session.passageResults.find(
      (pr) => pr.passageId === currentPassage?.id
    );
  }, [session.passageResults, currentPassage?.id]);

  // Keyboard navigation & option selection
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!currentPassage) return;

      if (e.key === "Tab" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = (session.activeBlankIndex + 1) % currentPassage.blanks.length;
        dispatch({ type: "FOCUS_BLANK", blankIndex: next });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev =
          (session.activeBlankIndex - 1 + currentPassage.blanks.length) %
          currentPassage.blanks.length;
        dispatch({ type: "FOCUS_BLANK", blankIndex: prev });
      } else if (["1", "2", "3", "4"].includes(e.key) && session.passageStatus === "filling") {
        const optionIndex = (parseInt(e.key, 10) - 1) as 0 | 1 | 2 | 3;
        dispatch({
          type: "SELECT_OPTION",
          blankIndex: session.activeBlankIndex,
          optionIndex,
        });
      } else if (e.key === "Enter" && e.ctrlKey && session.passageStatus === "filling") {
        handleSubmitPassage();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session.activeBlankIndex, session.passageStatus, currentPassage]);

  function handleSelectOption(optionIndex: 0 | 1 | 2 | 3) {
    if (session.passageStatus !== "filling") return;
    dispatch({
      type: "SELECT_OPTION",
      blankIndex: session.activeBlankIndex,
      optionIndex,
    });
  }

  function handleSubmitPassage() {
    narrator.stop();
    if (currentPassage) {
      const allCorrect = currentPassage.blanks.every(
        (b, idx) => session.selectedOptionByBlank[idx] === b.correctIndex
      );
      playGameSfx(allCorrect ? "correct-chime" : "incorrect-chime");
    }
    const elapsed = Date.now() - passageStartRef.current;
    dispatch({ type: "SUBMIT_PASSAGE", timeMs: elapsed });
  }

  function handleSkipPassage() {
    narrator.stop();
    const elapsed = Date.now() - passageStartRef.current;
    dispatch({ type: "SKIP_PASSAGE", timeMs: elapsed });
  }

  function handleNextPassage() {
    narrator.stop();
    playGameSfx("card-flip");
    dispatch({
      type: "NEXT_PASSAGE",
      forPassageIndex: session.currentPassageIndex,
    });
  }

  if (!currentPassage) {
    return (
      <GameLayout
        label="PARAGRAPH FLOW CLOZE · 文章の文法"
        glyph="文"
        homeHref="/games/jlpt"
      >
        <div className="flex flex-1 items-center justify-center p-12">
          <span className="text-sm font-semibold text-[var(--muted)]">
            Loading passage...
          </span>
        </div>
      </GameLayout>
    );
  }

  // Count overall progress
  const passageProgressText = `${session.currentPassageIndex + 1} / ${session.passages.length}`;

  // Flat sentence count index for narrator karaoke highlighting
  let globalSentenceCounter = 0;

  return (
    <GameLayout
      label="PARAGRAPH FLOW CLOZE · 文章の文法"
      glyph="文"
      homeHref="/games/jlpt"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-bold text-[var(--primary-fg)]">
            Passage {passageProgressText}
          </span>
          <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 font-extrabold text-white">
            {formatJlptLevel(currentPassage.jlpt)}
          </span>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* LEFT COLUMN: The Exam Question Booklet Page */}
          <section
            aria-label="Passage Paper"
            className="flex flex-col rounded-3xl border border-[var(--ink)]/20 bg-[var(--surface)] p-6 shadow-sm sm:p-8"
          >
            {/* Passage Header Bar */}
            <div className="border-b border-[var(--line)] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--sakura-light)] px-3 py-0.5 text-xs font-bold text-[var(--primary-fg)]">
                    {formatJlptLevel(currentPassage.jlpt)}
                  </span>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                    {currentPassage.sourceType === "story-scene"
                      ? "📖 Graded Story Scene"
                      : "📝 Official Exam Speech"}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {currentPassage.blanks.length} Blanks to Solve
                  </span>
                </div>

                {currentPassage.linkedStory && (
                  <Link
                    href={`/stories/${currentPassage.linkedStory.level.toLowerCase()}/${currentPassage.linkedStory.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <span>View in /stories</span>
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>

              <h1 className="mt-3 font-japanese text-xl font-bold text-[var(--ink)] sm:text-2xl">
                {currentPassage.titleJa}
              </h1>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {currentPassage.titleEn}
              </p>

              {/* Optional Exam Framing Context Box */}
              {currentPassage.introContextJa && (
                <div className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-tint)]/60 p-3 text-xs leading-relaxed text-[var(--ink)]">
                  <p className="font-japanese font-semibold">
                    {currentPassage.introContextJa}
                  </p>
                  {session.settings.showEnglishSentenceHints &&
                    currentPassage.introContextEn && (
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {currentPassage.introContextEn}
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* Passage Body: Typography with Inline Snap-In Blank Pills */}
            <div className="mt-6 flex flex-col gap-6">
              {currentPassage.paragraphs.map((paragraph, pIdx) => (
                <div key={pIdx} className="space-y-3">
                  {paragraph.subheadingJa && (
                    <h2 className="font-japanese text-sm font-bold text-[var(--primary-fg)]">
                      {paragraph.subheadingJa}
                    </h2>
                  )}

                  <div className="space-y-3 font-japanese text-lg font-normal leading-loose tracking-wide text-[var(--ink)] sm:text-xl">
                    {paragraph.sentences.map((sentence) => {
                      const sentenceGlobalIdx = globalSentenceCounter++;
                      const isNarratingThisSentence =
                        narrator.isPlaying &&
                        narrator.activeSegmentIndex === sentenceGlobalIdx;

                      return (
                        <div
                          key={sentence.sentenceIndex}
                          className={`rounded-lg p-1.5 transition-colors ${
                            isNarratingThisSentence
                              ? "bg-[var(--sakura-light)]/80 ring-1 ring-[var(--primary)]"
                              : ""
                          }`}
                        >
                          <p>
                            {sentence.segments.map((seg, sIdx) => {
                              if (seg.type === "text") {
                                return (
                                  <span key={sIdx}>{seg.textJa ?? ""}</span>
                                );
                              }

                              const blankIdx = seg.blankIndex ?? 0;
                              const blankItem = currentPassage.blanks[blankIdx];
                              const isFocused =
                                session.activeBlankIndex === blankIdx;
                              const chosenOptIdx =
                                session.selectedOptionByBlank[blankIdx];
                              const chosenOpt =
                                chosenOptIdx !== null && chosenOptIdx !== undefined
                                  ? blankItem?.options[chosenOptIdx]
                                  : null;

                              const isRevealed =
                                session.passageStatus !== "filling";
                              const answerRecord =
                                currentPassageResult?.answers[blankIdx];
                              const isCorrect =
                                answerRecord?.isCorrect ?? false;

                              // Blank Pill Styling
                              let pillStyle =
                                "inline-flex items-center justify-center font-japanese text-base font-bold transition-all px-2.5 py-0.5 mx-1 rounded-md cursor-pointer align-baseline select-none ";

                              if (!isRevealed) {
                                if (chosenOpt) {
                                  // Filled (drafting)
                                  pillStyle += isFocused
                                    ? "bg-[var(--primary)] text-white shadow-sm ring-2 ring-[var(--primary)] scale-105"
                                    : "bg-[var(--paper-tint)] text-[var(--ink)] border border-[var(--ink)]/40 hover:border-[var(--primary)]";
                                } else {
                                  // Unfilled
                                  pillStyle += isFocused
                                    ? "border-2 border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] scale-105"
                                    : "border-2 border-dashed border-[var(--ink)]/40 text-[var(--muted)] hover:border-[var(--ink)]";
                                }
                              } else {
                                // Revealed
                                if (isCorrect) {
                                  pillStyle += isFocused
                                    ? "bg-[var(--success)] text-white ring-2 ring-[var(--success)] scale-105"
                                    : "border border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]";
                                } else {
                                  pillStyle += isFocused
                                    ? "bg-[var(--danger)] text-white ring-2 ring-[var(--danger)] scale-105"
                                    : "border border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
                                }
                              }

                              return (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() =>
                                    dispatch({
                                      type: "FOCUS_BLANK",
                                      blankIndex: blankIdx,
                                    })
                                  }
                                  className={pillStyle}
                                  title={`Blank [ ${blankItem?.displayNumber ?? blankIdx + 1} ]`}
                                >
                                  {!isRevealed ? (
                                    chosenOpt ? (
                                      <span>
                                        [{blankItem?.displayNumber}:{" "}
                                        {chosenOpt.ja}]
                                      </span>
                                    ) : (
                                      <span>[ {blankItem?.displayNumber} ]</span>
                                    )
                                  ) : isCorrect ? (
                                    <span>
                                      ✓ {blankItem?.displayNumber}:{" "}
                                      {blankItem?.options[blankItem.correctIndex].ja}
                                    </span>
                                  ) : (
                                    <span>
                                      ✕ {blankItem?.displayNumber}:{" "}
                                      {chosenOpt ? chosenOpt.ja : "未答"} →{" "}
                                      {blankItem?.options[blankItem.correctIndex].ja}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </p>

                          {/* English translation hint */}
                          {session.settings.showEnglishSentenceHints && (
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {sentence.en}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Post-Submit Passage Narrator Bar */}
            {session.passageStatus !== "filling" && (
              <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)]/80 p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={narrator.togglePlayPause}
                      className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                    >
                      {narrator.isPlaying ? (
                        <>
                          <Pause className="size-4" />
                          <span>Pause Passage</span>
                        </>
                      ) : (
                        <>
                          <Play className="size-4" />
                          <span>▶ Read Completed Passage Aloud</span>
                        </>
                      )}
                    </button>

                    {narrator.isPlaying && (
                      <button
                        type="button"
                        onClick={narrator.stop}
                        className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] hover:text-[var(--ink)]"
                        title="Stop narration"
                      >
                        <Square className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Playback speed controls */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-[var(--muted)]">Speed:</span>
                    {([0.75, 1, 1.25] as PlaybackSpeed[]).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => narrator.setSpeed(spd)}
                        className={`rounded-md px-2 py-1 transition ${
                          narrator.speed === spd
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  Listen to the completed passage read with natural sentence cadence and interactive karaoke tracking.
                </p>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Blank Inspector & 4 Choices */}
          <aside
            aria-label="Blank Inspector"
            className="flex flex-col gap-6 sticky top-6"
          >
            {/* Blank Navigation Strip */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Passage Blanks
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {
                    session.selectedOptionByBlank.filter((o) => o !== null)
                      .length
                  }{" "}
                  / {currentPassage.blanks.length} Answered
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {currentPassage.blanks.map((b, idx) => {
                  const isFocused = session.activeBlankIndex === idx;
                  const isFilled =
                    session.selectedOptionByBlank[idx] !== null;
                  const isRevealed = session.passageStatus !== "filling";
                  const ans = currentPassageResult?.answers[idx];

                  let navBtnClass =
                    "flex flex-1 min-w-[50px] flex-col items-center justify-center rounded-xl border py-2.5 transition text-xs font-bold ";

                  if (!isRevealed) {
                    if (isFocused) {
                      navBtnClass +=
                        "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] ring-2 ring-[var(--primary)]";
                    } else if (isFilled) {
                      navBtnClass +=
                        "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)]";
                    } else {
                      navBtnClass +=
                        "border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]";
                    }
                  } else {
                    if (ans?.isCorrect) {
                      navBtnClass += isFocused
                        ? "bg-[var(--success)] text-white ring-2 ring-[var(--success)]"
                        : "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]";
                    } else {
                      navBtnClass += isFocused
                        ? "bg-[var(--danger)] text-white ring-2 ring-[var(--danger)]"
                        : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "FOCUS_BLANK", blankIndex: idx })
                      }
                      className={navBtnClass}
                    >
                      <span>[ {b.displayNumber} ]</span>
                      <span className="text-[10px] font-normal">
                        {isFilled ? "● Filled" : "○ Empty"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Blank Card */}
            {activeBlank && (
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-fg)]">
                      Blank [ {activeBlank.displayNumber} ]
                    </span>
                    <span className="ml-2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                      {DISCOURSE_CATEGORY_META[activeBlank.category]?.labelJa} ·{" "}
                      {DISCOURSE_CATEGORY_META[activeBlank.category]?.labelEn}
                    </span>
                  </div>

                  <span className="text-xs text-[var(--muted)]">
                    Use Keys 1–4
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                  Choose the best expression to fit the flow of the passage:
                </p>

                {/* 4 Options Grid */}
                <div className="mt-4 flex flex-col gap-2.5">
                  {activeBlank.options.map((option, optIdx) => {
                    const isSelected =
                      session.selectedOptionByBlank[session.activeBlankIndex] ===
                      optIdx;
                    const isRevealed = session.passageStatus !== "filling";
                    const isCorrect = optIdx === activeBlank.correctIndex;

                    let optBtnClass =
                      "group flex items-center justify-between rounded-2xl border p-3.5 text-left transition ";

                    if (!isRevealed) {
                      if (isSelected) {
                        optBtnClass +=
                          "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs";
                      } else {
                        optBtnClass +=
                          "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60";
                      }
                    } else {
                      if (isCorrect) {
                        optBtnClass +=
                          "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] font-bold";
                      } else if (isSelected && !isCorrect) {
                        optBtnClass +=
                          "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)] line-through";
                      } else {
                        optBtnClass +=
                          "border-[var(--line)] bg-[var(--surface)] opacity-60 text-[var(--muted)]";
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isRevealed}
                        onClick={() =>
                          handleSelectOption(optIdx as 0 | 1 | 2 | 3)
                        }
                        className={optBtnClass}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected
                                ? "bg-[var(--primary)] text-white"
                                : "border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                            }`}
                          >
                            {optIdx + 1}
                          </span>
                          <span className="font-japanese text-base font-bold">
                            {option.ja}
                          </span>
                        </div>

                        {isRevealed && isCorrect && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--success)]">
                            <CheckCircle2 className="size-4" />
                            Correct
                          </span>
                        )}
                        {isRevealed && isSelected && !isCorrect && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[var(--danger)]">
                            <XCircle className="size-4" />
                            Your Choice
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Post-Submit Clue Quote & Discourse Explanation */}
                {session.passageStatus !== "filling" && (
                  <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)]/60 p-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--primary-fg)]">
                      <Lightbulb className="size-4" />
                      <span>Discourse Logic &amp; Clue</span>
                    </div>

                    <div className="mt-2 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-2.5 font-japanese text-xs text-[var(--ink)]">
                      <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                        Context Clue Quote in Passage:
                      </span>
                      <span className="font-semibold text-[var(--primary)]">
                        「{activeBlank.contextClueQuoteJa}」
                      </span>
                    </div>

                    <p className="mt-2.5 leading-relaxed text-[var(--ink)]">
                      {activeBlank.discourseRuleEn}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Card */}
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
              {session.passageStatus === "filling" ? (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmitPassage}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    <span>
                      Submit Passage (
                      {
                        session.selectedOptionByBlank.filter(
                          (o) => o !== null
                        ).length
                      }{" "}
                      / {currentPassage.blanks.length} Filled)
                    </span>
                    <ArrowRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipPassage}
                    className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:underline py-1"
                  >
                    Skip this passage and view answers
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleNextPassage}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    <span>
                      {session.currentPassageIndex + 1 <
                      session.passages.length
                        ? "Next Passage →"
                        : "View Final Results →"}
                    </span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <QuitSessionDialog
        open={quitDialogOpen}
        onCancel={cancelQuit}
        onConfirm={quitSession}
      />
    </GameLayout>
  );
}
