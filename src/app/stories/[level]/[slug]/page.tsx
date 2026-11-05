"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlignJustify,
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  Clock,
  Columns3,
  HelpCircle,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  COMPLETED_STORIES_STORAGE_KEY,
  estimateReadingTimeMinutes,
  getCompletedStoryIds,
  getStoryBySlug,
  lookupWordMetadata,
  type StorySentence,
  type StoryToken,
} from "@/data/stories";
import { StoryCover } from "@/components/story-cover";
import { addVocabularyToSrs } from "@/lib/srs/service";

export default function StoryReadingRoomPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
          Loading story...
        </main>
      }
    >
      <StoryReadingRoomContent />
    </Suspense>
  );
}

interface SelectedTokenInfo {
  surface: string;
  baseForm: string;
  reading: string;
  meaning: string;
  level?: string;
}

function isPunctuationOnly(surface: string): boolean {
  return /^[\s、。！？「」『』（）・…―,."'!?\-:;]+$/.test(surface);
}

function StoryReadingRoomContent() {
  const params = useParams<{ level: string; slug: string }>();
  const levelParam = params?.level ?? "N5";
  const slugParam = params?.slug ?? "";

  const story = useMemo(
    () => getStoryBySlug(levelParam, slugParam),
    [levelParam, slugParam]
  );

  const [writingMode, setWritingMode] = useState<"horizontal" | "vertical">("horizontal");
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ isPaused, setIsPaused] = useState(false);

  const [selectedToken, setSelectedToken] = useState<SelectedTokenInfo | null>(null);
  const [activeSentence, setActiveSentence] = useState<StorySentence | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingSrs, setSavingSrs] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!story) return;
    const completed = getCompletedStoryIds();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCompleted(completed.has(story.id) || completed.has(story.slug));
  }, [story]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!story) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--ink)]">
        <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--card-shadow)]">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--primary)] uppercase">
            Story Not Found
          </p>
          <h1 className="mt-2 text-2xl font-semibold">We could not find that story</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The requested reading passage ({levelParam}/{slugParam}) does not exist.
          </p>
          <Link
            href="/stories"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-ink)]"
          >
            <ArrowLeft className="size-4" />
            Back to Stories
          </Link>
        </div>
      </main>
    );
  }

  const readMinutes = estimateReadingTimeMinutes(story);
  const totalQuizQuestions = story.quiz.length;
  const answeredQuizCount = Object.keys(quizAnswers).length;
  const correctQuizCount = story.quiz.reduce((acc, q, idx) => {
    return acc + (quizAnswers[idx] === q.answerIndex ? 1 : 0);
  }, 0);

  function handleSelectToken(token: StoryToken) {
    const surface = token.surface.trim();
    if (!surface || isPunctuationOnly(surface)) return;

    const fallback = lookupWordMetadata(surface);
    const reading = token.reading ?? fallback?.reading ?? surface;
    const meaning =
      token.meaning ??
      fallback?.meaning ??
      "Japanese particle or grammatical expression in context.";
    const baseForm = token.baseForm ?? fallback?.baseForm ?? surface;
    const level = token.level ?? fallback?.level ?? story?.level;

    setSelectedToken({
      surface,
      baseForm,
      reading,
      meaning,
      level,
    });
  }

  async function handleAddToFrs() {
    if (!selectedToken || savingSrs) return;
    setSavingSrs(true);
    try {
      const targetWord = selectedToken.baseForm || selectedToken.surface;
      await addVocabularyToSrs({
        word: targetWord,
        reading: selectedToken.reading,
        meaning: selectedToken.meaning,
        level: selectedToken.level ?? story?.level,
      });
      setSavedWords((prev) => {
        const next = new Set(prev);
        next.add(targetWord);
        next.add(selectedToken.surface);
        return next;
      });
    } finally {
      setSavingSrs(false);
    }
  }

  function handleToggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    if (isSpeaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      synth.resume();
      setIsPaused(false);
      return;
    }

    synth.cancel();
    const fullText = [
      story?.title ?? "",
      ...(story?.paragraphs.map((p) => p.ja) ?? []),
    ].join("。");

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.92;

    const voices = synth.getVoices?.() ?? [];
    const jaVoice = voices.find((v) => v.lang?.toLowerCase().startsWith("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  }

  function handleStopSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }

  function handleAnswerQuiz(questionIndex: number, optionIndex: number) {
    if (quizAnswers[questionIndex] !== undefined) return;
    const next = { ...quizAnswers, [questionIndex]: optionIndex };
    setQuizAnswers(next);

    if (story && Object.keys(next).length === story.quiz.length) {
      try {
        const completed = getCompletedStoryIds();
        completed.add(story.id);
        completed.add(story.slug);
        window.localStorage.setItem(
          COMPLETED_STORIES_STORAGE_KEY,
          JSON.stringify([...completed])
        );
        setIsCompleted(true);
      } catch {
        // Ignore storage write errors
      }
    }
  }

  function handleResetQuiz() {
    setQuizAnswers({});
  }

  const isSelectedTokenSaved =
    selectedToken !== null &&
    (savedWords.has(selectedToken.baseForm) || savedWords.has(selectedToken.surface));

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/stories"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <ArrowLeft className="size-3.5" />
              Back to Stories
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[11px] font-bold text-white">
                  {story.level}
                </span>
                <span
                  lang="ja"
                  className="font-japanese text-sm font-semibold text-[var(--ink)]"
                >
                  {story.title}
                </span>
                <span className="text-xs text-[var(--muted)]">· {story.titleEn}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Web Speech Audio Sync */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-label={isSpeaking && !isPaused ? "Pause audio" : "Listen to story"}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
                isSpeaking
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              {isSpeaking && !isPaused ? (
                <>
                  <Pause className="size-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Volume2 className="size-3.5 text-[var(--primary)]" />
                  <span>{isPaused ? "Resume" : "Listen"}</span>
                </>
              )}
            </button>
            {isSpeaking && (
              <button
                type="button"
                onClick={handleStopSpeech}
                className="inline-flex h-10 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Stop
              </button>
            )}

            {/* Furigana toggle */}
            <button
              type="button"
              aria-pressed={showFurigana}
              onClick={() => setShowFurigana((v) => !v)}
              className={`inline-flex h-10 items-center rounded-full border px-3.5 text-xs font-semibold transition ${
                showFurigana
                  ? "border-[var(--primary)]/50 bg-[var(--paper-tint)] text-[var(--primary)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              Furigana {showFurigana ? "On" : "Off"}
            </button>

            {/* Reading Mode Toggle (Horizontal vs. Vertical) */}
            <button
              type="button"
              aria-label="Toggle reading direction"
              aria-pressed={writingMode === "vertical"}
              onClick={() =>
                setWritingMode((mode) => (mode === "horizontal" ? "vertical" : "horizontal"))
              }
              className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
                writingMode === "vertical"
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              {writingMode === "vertical" ? (
                <>
                  <Columns3 className="size-3.5" />
                  <span>Vertical (縦書き)</span>
                </>
              ) : (
                <>
                  <AlignJustify className="size-3.5" />
                  <span>Horizontal (横書き)</span>
                </>
              )}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        {/* Story Title Banner */}
        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:flex-row md:items-center md:p-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-bold text-white">
                  {story.level}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-0.5 text-xs font-semibold text-[var(--muted)]">
                  {story.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Clock className="size-3.5" />
                  {readMinutes} min read
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/35 bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
                    <CheckCircle2 className="size-3.5" />
                    Completed
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowEnglish((v) => !v)}
                  className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-1 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--primary)]"
                >
                  {showEnglish ? "Hide English" : "Show English"}
                </button>
              </div>
            </div>

            <h1
              lang="ja"
              className="font-japanese mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl"
            >
              {story.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">{story.titleRomaji}</p>
            <p className="mt-1 text-base font-medium text-[var(--ink)]">{story.titleEn}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Tip: Tap any word in the passage to inspect its reading, definition, and save it to your{" "}
              <Link href="/review" className="font-semibold text-[var(--primary)] underline">
                FSRS Review Hub
              </Link>
              .
            </p>
          </div>

          <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] md:h-44 md:w-64">
            <StoryCover
              key={story.slug}
              src={story.coverImage}
              placeholder={story.coverPlaceholder}
              alt={`${story.title} illustration`}
              imageClassName="object-contain p-3"
              loading="eager"
            />
          </div>
        </section>

        {/* Reading Room Paper Sheet & Tap-to-SRS Inspector */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <article
            aria-label="Story text"
            style={{
              writingMode: writingMode === "vertical" ? "vertical-rl" : "horizontal-tb",
            }}
            className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-10 ${
              writingMode === "vertical"
                ? "max-h-[72dvh] w-full overflow-x-auto leading-[2.4]"
                : "space-y-7 leading-[2.25]"
            }`}
          >
            {story.paragraphs.map((paragraph, pIdx) => {
              const tokens = paragraph.tokens ?? [{ surface: paragraph.ja }];
              return (
                <div
                  key={pIdx}
                  className={
                    writingMode === "vertical"
                      ? "ml-8 border-l border-[var(--line)]/60 pl-6 first:ml-0"
                      : "border-b border-[var(--line)]/60 pb-6 last:border-b-0 last:pb-0"
                  }
                >
                  <p
                    lang="ja"
                    className="font-japanese text-xl tracking-wide text-[var(--ink)] select-text md:text-2xl"
                  >
                    {tokens.map((token, tIdx) => {
                      const clickable = !isPunctuationOnly(token.surface);
                      const isSelected = selectedToken?.surface === token.surface;
                      const content =
                        showFurigana && token.reading ? (
                          <ruby className="ruby-token">
                            {token.surface}
                            <rt className="text-[0.55em] font-normal tracking-normal text-[var(--muted)]">
                              {token.reading}
                            </rt>
                          </ruby>
                        ) : (
                          token.surface
                        );

                      if (!clickable) {
                        return <span key={tIdx}>{content}</span>;
                      }

                      return (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={() => handleSelectToken(token)}
                          className={`inline rounded px-0.5 text-left font-inherit transition ${
                            isSelected
                              ? "bg-[var(--primary)]/20 text-[var(--primary)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
                              : "hover:bg-[var(--paper-tint)] hover:text-[var(--primary)]"
                          }`}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </p>

                  {showEnglish && writingMode === "horizontal" && (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {paragraph.en}
                    </p>
                  )}

                  {/* Granular Clause/Sentence Breakdown Pills */}
                  {paragraph.sentences && paragraph.sentences.length > 0 && writingMode === "horizontal" && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--line)]/40">
                      <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase mr-1">
                        Sentences:
                      </span>
                      {paragraph.sentences.map((sent, sIdx) => {
                        const isSentActive = activeSentence?.ja === sent.ja;
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              setActiveSentence(isSentActive ? null : sent);
                            }}
                            className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                              isSentActive
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
                            }`}
                          >
                            <span className="font-japanese font-semibold text-[11px]">文 {sIdx + 1}</span>
                            <span className="max-w-[160px] truncate text-[11px] opacity-90 sm:max-w-[240px]">
                              {sent.naturalEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Sentence Breakdown Panel */}
                  {activeSentence &&
                    paragraph.sentences?.some((s) => s.ja === activeSentence.ja) &&
                    writingMode === "horizontal" && (
                      <div className="mt-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--paper-tint)]/80 p-3.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p lang="ja" className="font-japanese text-sm font-semibold text-[var(--ink)]">
                            {activeSentence.ja}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveSentence(null)}
                            className="rounded-full p-0.5 text-[var(--muted)] hover:text-[var(--ink)]"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <div className="mt-2.5 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-[var(--primary)] uppercase">
                              Natural Translation
                            </span>
                            <p className="mt-0.5 text-xs text-[var(--ink)]">{activeSentence.naturalEn}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
                              Literal Structure
                            </span>
                            <p className="mt-0.5 text-[11px] font-mono text-[var(--muted)] leading-relaxed">
                              {activeSentence.literalEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </article>

          {/* Vocabulary Inspector / Tap-to-SRS Sidebar / Sheet */}
          <aside
            aria-label="Vocabulary Inspector"
            className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] lg:sticky lg:top-24 lg:h-fit"
          >
            {selectedToken ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                      Vocabulary Inspector
                    </span>
                    <div className="mt-2 flex items-baseline gap-2.5">
                      <h2
                        lang="ja"
                        className="font-japanese text-3xl font-bold text-[var(--ink)]"
                      >
                        {selectedToken.surface}
                      </h2>
                      {selectedToken.level && (
                        <span className="rounded-full bg-[var(--paper-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary)]">
                          {selectedToken.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close inspector"
                    onClick={() => setSelectedToken(null)}
                    className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--paper-tint)] hover:text-[var(--ink)]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase">Reading</p>
                    <p lang="ja" className="font-japanese mt-0.5 text-lg font-medium text-[var(--ink)]">
                      {selectedToken.reading}
                    </p>
                  </div>

                  {selectedToken.baseForm && selectedToken.baseForm !== selectedToken.surface && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)] uppercase">
                        Dictionary Form
                      </p>
                      <p lang="ja" className="font-japanese mt-0.5 text-base text-[var(--ink)]">
                        {selectedToken.baseForm}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase">
                      Definition
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--ink)]">
                      {selectedToken.meaning}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled={savingSrs || isSelectedTokenSaved}
                    onClick={() => void handleAddToFrs()}
                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold transition ${
                      isSelectedTokenSaved
                        ? "border border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--success)]"
                        : "bg-[var(--primary)] text-[var(--primary-ink)] hover:opacity-95"
                    }`}
                  >
                    {isSelectedTokenSaved ? (
                      <>
                        <BookmarkCheck className="size-4" />
                        <span>Added to FSRS Review</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="size-4" />
                        <span>{savingSrs ? "Saving..." : "Add to FSRS Review"}</span>
                      </>
                    )}
                  </button>
                  {isSelectedTokenSaved && (
                    <p className="mt-2 text-center text-xs text-[var(--muted)]">
                      Ready to practice in{" "}
                      <Link href="/review" className="font-semibold text-[var(--primary)] underline">
                        /review
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            ) : activeSentence ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                      Sentence Breakdown
                    </span>
                    <p lang="ja" className="font-japanese mt-2 text-xl font-bold text-[var(--ink)] leading-snug">
                      {activeSentence.ja}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close sentence breakdown"
                    onClick={() => setActiveSentence(null)}
                    className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--paper-tint)] hover:text-[var(--ink)]"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase">Natural English</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
                      {activeSentence.naturalEn}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase">Literal Breakdown</p>
                    <p className="mt-1 text-xs font-mono leading-relaxed text-[var(--muted)]">
                      {activeSentence.literalEn}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                  Tap-to-SRS Lookup
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                  Click any word in the story
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  Inspect readings and English meanings, and add unfamiliar words directly to your
                  FSRS spaced-repetition deck with one tap.
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* Comprehension Micro-Quiz */}
        {story.quiz.length > 0 && (
          <section
            id="story-quiz"
            aria-label="Comprehension Check"
            className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
                  <BookOpen className="size-3.5" /> Comprehension Check · 理解度チェック
                </span>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
                  Story Quiz ({answeredQuizCount}/{totalQuizQuestions})
                </h2>
              </div>

              {answeredQuizCount > 0 && (
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-4 py-1.5 text-xs font-bold text-[var(--ink)] shadow-xs">
                    Score: {correctQuizCount} / {totalQuizQuestions}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted)] shadow-xs transition hover:border-[var(--primary)] hover:text-[var(--ink)]"
                  >
                    <RotateCcw className="size-3.5" />
                    Retry Quiz
                  </button>
                </div>
              )}
            </div>

            {/* Visual Quiz Progress Bar */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--sakura)] to-[var(--primary)] transition-all duration-500 ease-out"
                style={{
                  width: `${(answeredQuizCount / totalQuizQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Quiz Completion & Review Callout */}
            {answeredQuizCount === totalQuizQuestions && (
              <div
                className={`mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 transition-all sm:flex-row sm:items-center ${
                  correctQuizCount === totalQuizQuestions
                    ? "border-[var(--correct)]/40 bg-[var(--success-soft)] text-[var(--ink)] shadow-xs"
                    : "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)] shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                      correctQuizCount === totalQuizQuestions
                        ? "bg-[var(--correct)] text-white"
                        : "bg-[var(--primary)] text-white"
                    }`}
                  >
                    {correctQuizCount === totalQuizQuestions ? (
                      <Trophy className="size-6" />
                    ) : (
                      <Sparkles className="size-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--ink)]">
                      {correctQuizCount === totalQuizQuestions
                        ? "🎉 完璧！ Perfect Comprehension!"
                        : `Quiz Completed · ${correctQuizCount} of ${totalQuizQuestions} Correct`}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                      {correctQuizCount === totalQuizQuestions
                        ? "You answered all story questions correctly. The story has been marked completed in your library!"
                        : "Review the evidence citations below to solidify your understanding of tricky sentences, or try again to test your recall."}
                    </p>
                  </div>
                </div>

                {correctQuizCount < totalQuizQuestions && (
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
                  >
                    <RotateCcw className="size-3.5" />
                    Try Again
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 space-y-6">
              {story.quiz.map((q, qIdx) => {
                const chosenIndex = quizAnswers[qIdx];
                const isAnswered = chosenIndex !== undefined;
                const isCorrectAnswer = isAnswered && chosenIndex === q.answerIndex;

                return (
                  <div
                    key={qIdx}
                    className={`rounded-2xl border p-5 transition-all md:p-6 ${
                      isAnswered
                        ? isCorrectAnswer
                          ? "border-[var(--correct)]/35 bg-[var(--surface)] shadow-xs"
                          : "border-[var(--wrong)]/35 bg-[var(--surface)] shadow-xs"
                        : "border-[var(--line)] bg-[var(--paper-tint)]/40 hover:border-[var(--sakura)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--sakura-light)] text-xs font-bold text-[var(--primary)]">
                          Q{qIdx + 1}
                        </span>
                        <div>
                          <p
                            lang="ja"
                            className="font-japanese text-base font-bold text-[var(--ink)] sm:text-lg"
                          >
                            {q.question}
                          </p>
                          {q.questionEn && (
                            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed font-sans">
                              {q.questionEn}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAnswered && (
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isCorrectAnswer
                              ? "bg-[var(--success-soft)] text-[var(--correct)]"
                              : "bg-[var(--wrong-soft)] text-[var(--wrong)]"
                          }`}
                        >
                          {isCorrectAnswer ? (
                            <>
                              <CheckCircle2 className="size-3.5" /> Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3.5" /> Review
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {q.options.map((option, oIdx) => {
                        const isSelected = chosenIndex === oIdx;
                        const isCorrect = q.answerIndex === oIdx;
                        const letter = ["A", "B", "C", "D"][oIdx] ?? `${oIdx + 1}`;

                        let cardStyle =
                          "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/20 active:scale-[0.99] cursor-pointer shadow-xs";
                        let badgeStyle =
                          "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--muted)]";

                        if (isAnswered) {
                          if (isCorrect) {
                            cardStyle =
                              "border-[var(--correct)] bg-[var(--success-soft)] text-[var(--ink)] font-semibold shadow-xs ring-1 ring-[var(--correct)]/40 cursor-default";
                            badgeStyle = "bg-[var(--correct)] text-white border-transparent";
                          } else if (isSelected) {
                            cardStyle =
                              "border-[var(--wrong)] bg-[var(--wrong-soft)] text-[var(--ink)] shadow-xs ring-1 ring-[var(--wrong)]/40 cursor-default";
                            badgeStyle = "bg-[var(--wrong)] text-white border-transparent";
                          } else {
                            cardStyle =
                              "border-[var(--line)]/60 bg-[var(--surface)]/60 text-[var(--muted)] opacity-60 cursor-default";
                            badgeStyle =
                              "border-[var(--line)]/40 bg-[var(--paper-tint)]/50 text-[var(--muted)]/60";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            aria-label={option}
                            disabled={isAnswered}
                            onClick={() => handleAnswerQuiz(qIdx, oIdx)}
                            className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all sm:p-4 ${cardStyle}`}
                          >
                            <div className="flex min-w-0 items-center gap-3 pr-2">
                              <span
                                className={`flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${badgeStyle}`}
                              >
                                {letter}
                              </span>
                              <div className="min-w-0">
                                <span
                                  lang="ja"
                                  className="block font-japanese text-sm font-semibold leading-snug sm:text-base"
                                >
                                  {option}
                                </span>
                                {q.optionsEn?.[oIdx] && (
                                  <span className="block truncate text-xs font-normal text-[var(--muted)]">
                                    {q.optionsEn[oIdx]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="ml-2 shrink-0">
                              {isAnswered ? (
                                isCorrect ? (
                                  <CheckCircle2 className="size-5 text-[var(--correct)]" />
                                ) : isSelected ? (
                                  <XCircle className="size-5 text-[var(--wrong)]" />
                                ) : null
                              ) : (
                                <span className="flex size-4 rounded-full border border-[var(--line)] transition-colors group-hover:border-[var(--primary)]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && q.explanation && (
                      <div
                        className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed transition-all ${
                          isCorrectAnswer
                            ? "border-[var(--correct)]/35 bg-[var(--success-soft)]"
                            : "border-[var(--wrong)]/35 bg-[var(--wrong-soft)]"
                        }`}
                      >
                        <div className="mb-1.5 flex items-center gap-1.5">
                          {isCorrectAnswer ? (
                            <>
                              <Sparkles className="size-3.5 text-[var(--correct)] shrink-0" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--correct)]">
                                ✓ Evidence from Story · 正解の根拠
                              </span>
                            </>
                          ) : (
                            <>
                              <HelpCircle className="size-3.5 text-[var(--wrong)] shrink-0" />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--wrong)]">
                                ✗ Answer Explanation · 解説と文脈
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-sans text-xs text-[var(--ink)] leading-relaxed sm:text-sm">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
