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
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  User,
  Volume2,
  XCircle,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getGameResult,
  getGameSession,
  saveGameResult,
  saveGameSession,
} from "@/lib/game-core/storage";
import {
  INFO_SCANNER_DOCUMENTS,
  calculateInfoScannerResult,
  createInfoScannerSession,
  infoScannerReducer,
  type InfoScannerAction,
  type InfoScannerResultSummary,
  type InfoScannerSession,
  type SessionDocumentItem,
} from "@/engine/jlptInfoScanner";
import { InfoScannerDocumentViewer } from "@/components/jlpt/InfoScannerDocumentViewer";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import {
  QuitSessionDialog,
  useQuitSessionGuard,
} from "@/lib/game-core/quit-session";

function loadInitialSession(sessionId: string): InfoScannerSession {
  const existing = getGameSession<InfoScannerSession>("jlpt-scanner", sessionId);
  if (existing && Array.isArray(existing.documents) && existing.documents.length > 0) {
    return existing;
  }

  // Fallback: create fresh 3-doc N5 session
  return createInfoScannerSession(INFO_SCANNER_DOCUMENTS, {
    levels: ["N5"],
    categoryFilter: "all",
    documentCount: 3,
    showScenarioEnglish: true,
  });
}

export default function InfoScannerPlayPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId ?? "default";

  const [session, dispatch] = useReducer(
    infoScannerReducer,
    sessionId,
    loadInitialSession
  );

  const { playSentence, stopAudio } = useJapaneseAudio();
  const startTimeRef = useRef<number>(Date.now());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const currentDoc: SessionDocumentItem | undefined =
    session.documents[session.currentDocumentIndex];
  const currentQ = currentDoc?.questions[0];

  const isSessionActive = session.status === "playing";
  const isQuittingRef = useRef(false);
  const { quitDialogOpen, requestQuit, cancelQuit, confirmQuit } =
    useQuitSessionGuard(isSessionActive);

  const quitSession = useCallback(() => {
    isQuittingRef.current = true;
    confirmQuit();
    stopAudio();
    sessionStorage.removeItem(`jlpt-scanner-session:${session.sessionId}`);
    router.replace("/games/jlpt/info-scanner");
  }, [confirmQuit, router, session.sessionId, stopAudio]);

  // Sync session state to storage
  useEffect(() => {
    if (isQuittingRef.current) return;
    saveGameSession("jlpt-scanner", session.sessionId, session);
  }, [session]);

  // Handle completion navigation
  useEffect(() => {
    if (session.status === "finished") {
      let summary = getGameResult<InfoScannerResultSummary>(
        "jlpt-scanner",
        session.sessionId
      );
      if (!summary) {
        summary = calculateInfoScannerResult(session);
        saveGameResult("jlpt-scanner", summary);
      }
      router.replace(`/games/jlpt/info-scanner/result/${session.sessionId}`);
    }
  }, [session, router]);

  // Reset timer on document advance
  useEffect(() => {
    startTimeRef.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBlockId(null);
  }, [session.currentDocumentIndex]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const currentDocResult = useMemo(() => {
    return session.documentResults.find(
      (dr) => dr.documentId === currentDoc?.id
    );
  }, [session.documentResults, currentDoc?.id]);

  const isRevealed = session.documentStatus !== "viewing";
  const evidenceBlockIds = currentQ?.evidenceBlockIds ?? [];

  const handleSelectOption = useCallback(
    (optionIndex: 0 | 1 | 2 | 3) => {
      if (!isRevealed) {
        dispatch({ type: "SELECT_OPTION", questionIndex: 0, optionIndex });
      }
    },
    [isRevealed]
  );

  const handleSubmit = useCallback(() => {
    if (session.selectedOptionByQuestion[0] === null || isRevealed) return;
    const elapsed = Date.now() - startTimeRef.current;
    dispatch({ type: "SUBMIT_ANSWER", timeMs: elapsed });
  }, [session.selectedOptionByQuestion, isRevealed]);

  const handleSkip = useCallback(() => {
    if (isRevealed) return;
    const elapsed = Date.now() - startTimeRef.current;
    dispatch({ type: "SKIP_DOCUMENT", timeMs: elapsed });
  }, [isRevealed]);

  const handleNext = useCallback(() => {
    if (!isRevealed) return;
    dispatch({
      type: "NEXT_DOCUMENT",
      forDocumentIndex: session.currentDocumentIndex,
    });
  }, [isRevealed, session.currentDocumentIndex]);

  // Keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!currentDoc || !currentQ) return;

      if (!isRevealed) {
        if (e.key === "1") handleSelectOption(0);
        else if (e.key === "2") handleSelectOption(1);
        else if (e.key === "3") handleSelectOption(2);
        else if (e.key === "4") handleSelectOption(3);
        else if (e.key === "Enter" && session.selectedOptionByQuestion[0] !== null) {
          e.preventDefault();
          handleSubmit();
        }
      } else {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    currentDoc,
    currentQ,
    isRevealed,
    session.selectedOptionByQuestion,
    handleSelectOption,
    handleSubmit,
    handleNext,
  ]);

  if (!currentDoc || !currentQ) {
    return (
      <GameLayout
        label="REAL-WORLD INFO SCANNER"
        glyph="探"
        homeHref="/games/jlpt"
        onNavigateHome={isSessionActive ? requestQuit : undefined}
      >
        <div className="grid min-h-[60vh] place-items-center">
          <p className="text-sm text-[var(--muted)]">Loading document session...</p>
        </div>
      </GameLayout>
    );
  }

  const selectedOptIdx = session.selectedOptionByQuestion[0];
  const isLastDocument =
    session.currentDocumentIndex === session.documents.length - 1;

  const currentAnswerRecord = currentDocResult?.answers[0];
  const isCorrect = currentAnswerRecord?.isCorrect ?? false;
  const isSkipped = currentDocResult?.status === "skipped";

  return (
    <GameLayout
      label="REAL-WORLD INFO SCANNER"
      glyph="探"
      homeHref="/games/jlpt"
      onNavigateHome={isSessionActive ? requestQuit : undefined}
    >
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {/* Progress & Header Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-black text-white">
              {currentDoc.level}
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-0.5 text-xs font-bold text-[var(--muted)] font-japanese">
              {currentDoc.documentTypeJa}
            </span>
            <span className="text-xs font-bold text-[var(--ink)]">
              Document {session.currentDocumentIndex + 1} / {session.documents.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-0.5 text-xs text-[var(--muted)]">
              <User className="size-3 text-[var(--primary)]" />
              <span className="font-japanese font-semibold text-[var(--ink)]">
                {currentDoc.targetPersonaJa}
              </span>
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Column (7 cols): Tactile Document Viewer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl shadow-sm">
              <InfoScannerDocumentViewer
                document={currentDoc}
                highlightedBlockIds={evidenceBlockIds}
                isRevealed={isRevealed}
                onBlockClick={(id) => setSelectedBlockId(id)}
              />
            </div>
          </div>

          {/* Right Column (5 cols): Persona Scenario, Question & Action Inspector */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            {/* Persona Scenario Card */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1">
                  <User className="size-3.5" />
                  シナリオ目標 · Learner Scenario
                </span>
                <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                  {currentDoc.targetPersonaJa}
                </span>
              </div>
              <p className="font-japanese text-xs sm:text-sm font-medium leading-relaxed text-[var(--ink)]">
                {currentDoc.scenarioContextJa}
              </p>
              {session.settings.showScenarioEnglish && (
                <p className="mt-1 text-xs text-[var(--muted)] italic">
                  {currentDoc.scenarioContextEn}
                </p>
              )}

              {/* Condition Criteria Tags */}
              {currentQ.conditionCriteriaJa && currentQ.conditionCriteriaJa.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-[var(--line)]/50">
                  {currentQ.conditionCriteriaJa.map((criterion, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--paper-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--ink)] border border-[var(--line)]"
                    >
                      <Sparkles className="size-2.5 text-[var(--primary)]" />
                      <span>{criterion}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-japanese text-xs font-extrabold text-[var(--primary)]">
                  【質問 · もんだい】
                </span>
                <span className="text-xs text-[var(--muted)]">
                  Keys 1–4 to pick option
                </span>
              </div>

              <h2 className="font-japanese text-sm sm:text-base font-bold leading-relaxed text-[var(--ink)]">
                {currentQ.promptJa}
              </h2>
              {session.settings.showScenarioEnglish && (
                <p className="mt-1 text-xs text-[var(--muted)] italic">
                  {currentQ.promptEn}
                </p>
              )}

              {/* 4 Options */}
              <div className="mt-4 space-y-2.5">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedOptIdx === oIdx;
                  const isOptionCorrect = oIdx === currentQ.correctIndex;

                  let optionStyle =
                    "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--primary)]/60";

                  if (isRevealed) {
                    if (isOptionCorrect) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/80";
                    } else if (isSelected && !isOptionCorrect) {
                      optionStyle =
                        "border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 line-through";
                    } else {
                      optionStyle = "border-[var(--line)]/40 opacity-50 bg-[var(--surface)]";
                    }
                  } else if (isSelected) {
                    optionStyle =
                      "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs";
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isRevealed}
                      onClick={() => handleSelectOption(oIdx as 0 | 1 | 2 | 3)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer disabled:cursor-default ${optionStyle}`}
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                          isRevealed && isOptionCorrect
                            ? "bg-emerald-600 text-white"
                            : isSelected
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                        }`}
                      >
                        {oIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-japanese text-xs sm:text-sm font-semibold">
                          {opt.ja}
                        </div>
                        {session.settings.showScenarioEnglish && (
                          <div className="text-[11px] text-[var(--muted)] mt-0.5">
                            {opt.en}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Submit / Skip (When viewing) */}
              {!isRevealed && (
                <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--line)]/60">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={selectedOptIdx === null}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-45 cursor-pointer"
                  >
                    <span>解答を確定する / Submit (Enter)</span>
                    <ArrowRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer"
                  >
                    <span>スキップ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Post-Reveal Answer Card */}
            {isRevealed && (
              <div
                className={`rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3 transition-all ${
                  isSkipped
                    ? "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30"
                    : isCorrect
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30"
                    : "border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30"
                }`}
              >
                {/* Status banner */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSkipped ? (
                      <>
                        <HelpCircle className="size-5 text-amber-600 dark:text-amber-400" />
                        <span className="font-japanese text-sm font-black text-amber-800 dark:text-amber-200">
                          ↷ スキップ (Skipped)
                        </span>
                      </>
                    ) : isCorrect ? (
                      <>
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-japanese text-sm font-black text-emerald-800 dark:text-emerald-200">
                          ✓ 正解！ Excellent match!
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-5 text-rose-600 dark:text-rose-400" />
                        <span className="font-japanese text-sm font-black text-rose-800 dark:text-rose-200">
                          ✕ 不正解 (Incorrect)
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-xs font-mono font-semibold text-[var(--muted)]">
                    {currentDocResult ? `${(currentDocResult.timeMs / 1000).toFixed(1)}s` : ""}
                  </span>
                </div>

                {/* Evidence Clue Quote Callout */}
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/60 p-3 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-japanese font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                      <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
                      正解の根拠文 (Document Clue Quote):
                    </span>
                    <button
                      type="button"
                      onClick={() => playSentence(currentQ.clueQuoteJa, currentQ.id)}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      <Volume2 className="size-3" />
                      <span>聞く</span>
                    </button>
                  </div>
                  <p className="font-japanese text-xs leading-relaxed text-[var(--ink)]">
                    {currentQ.clueQuoteJa}
                  </p>
                </div>

                {/* Detailed Explanation */}
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[var(--primary-fg)] font-japanese">
                    【解説 · Explanation】
                  </div>
                  <p className="font-japanese text-xs leading-relaxed text-[var(--ink)]">
                    {currentQ.explanationJa}
                  </p>
                  <p className="text-[11px] leading-relaxed text-[var(--muted)] italic">
                    {currentQ.explanationEn}
                  </p>
                </div>

                {/* Next Document Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-xs font-bold text-white shadow-md transition hover:bg-[var(--primary-hover)] cursor-pointer"
                >
                  <span>{isLastDocument ? "結果を見る / View Results" : "次の文書へ / Next Document (Enter)"}</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
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
