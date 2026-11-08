"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  PARAGRAPH_CLOZE_PASSAGES,
  createParagraphClozeSession,
  formatJlptLevel,
  getParagraphClozeCountsByLevel,
  type ClozeSourceFilter,
  type JlptNumericLevel,
} from "@/engine/jlptParagraphCloze";

const LEVEL_OPTIONS: readonly JlptNumericLevel[] = [5, 4, 3, 2, 1];
const PASSAGE_COUNTS: readonly (2 | 3 | 5)[] = [2, 3, 5];

function ParagraphClozeSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();
  const sourceParam = searchParams.get("source") as ClozeSourceFilter | null;

  const initialLevels = useMemo<JlptNumericLevel[]>(() => {
    if (!levelParam) return [5];
    if (levelParam === "ALL") return [5, 4, 3, 2, 1];
    const num = parseInt(levelParam.replace("N", ""), 10);
    if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
      return [num as JlptNumericLevel];
    }
    return [5];
  }, [levelParam]);

  const [selectedLevels, setSelectedLevels] = useState<JlptNumericLevel[]>(initialLevels);
  const [sourceFilter, setSourceFilter] = useState<ClozeSourceFilter>(
    sourceParam && ["all", "exam-only", "story-scenes"].includes(sourceParam)
      ? sourceParam
      : "all"
  );
  const [passageCount, setPassageCount] = useState<2 | 3 | 5>(2);
  const [showEnglishSentenceHints, setShowEnglishSentenceHints] = useState<boolean>(false);

  const countsByLevel = useMemo(
    () => getParagraphClozeCountsByLevel(PARAGRAPH_CLOZE_PASSAGES, sourceFilter),
    [sourceFilter]
  );

  const availablePassages = useMemo(() => {
    const levelSet = new Set(selectedLevels);
    return PARAGRAPH_CLOZE_PASSAGES.filter((item) => {
      if (!levelSet.has(item.jlpt)) return false;
      if (sourceFilter === "exam-only" && item.sourceType === "story-scene") return false;
      if (sourceFilter === "story-scenes" && item.sourceType !== "story-scene") return false;
      return true;
    });
  }, [selectedLevels, sourceFilter]);

  const totalAvailableBlanks = useMemo(
    () => availablePassages.reduce((sum, p) => sum + p.blanks.length, 0),
    [availablePassages]
  );

  function toggleLevel(level: JlptNumericLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort((a, b) => b - a);
    });
  }

  function handleStartSession() {
    const session = createParagraphClozeSession(PARAGRAPH_CLOZE_PASSAGES, {
      levels: selectedLevels,
      sourceFilter,
      passageCount,
      showEnglishSentenceHints,
    });
    saveGameSession("jlpt-cloze", session.sessionId, session);
    router.push(`/games/jlpt/paragraph-cloze/play/${session.sessionId}`);
  }

  return (
    <GameLayout
      label="PARAGRAPH FLOW CLOZE · 文章の文法"
      glyph="文"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        {/* Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT &amp; NAT Grammar · Mondai 3
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              文章の文法・問題3
            </span>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)] border border-[var(--line)]">
              /stories Scene Integrated
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Paragraph Flow Cloze{" "}
            <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
              (文章の文法 パッセージ穴埋め)
            </span>
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            In Official JLPT Grammar <em>Mondai 3</em>, you read cohesive 100–180 word passages (student speeches, letters, notices, and graded scenes from our stories library) with 4–5 inline blanks. Test cross-sentence discourse: <strong>conjunctions (`接続詞`)</strong>, <strong>viewpoint &amp; giving/receiving (`視点・授受`)</strong>, <strong>demonstratives (`こそあど`)</strong>, and <strong>sentence-final modality (`文末表現`)</strong>.
          </p>

          {/* Official instruction banner */}
          <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-tint)]/60 p-3.5 text-xs text-[var(--ink)]">
            <span className="font-japanese font-bold text-[var(--primary)]">
              【問題用紙の指示】
            </span>{" "}
            <span className="font-japanese">
              22から26に何を入れますか。ぶんしょうのいみをかんがえて、1・2・3・4からいちばんいいものを一つえらんでください。
            </span>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Step 1: Source Filter */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <FileText className="size-4 text-[var(--primary)]" />
              1. Passage Content Source
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Choose between authentic exam booklet essays or extracts from our graded stories.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {[
                {
                  id: "all",
                  label: "All Passages (Exam Speeches + Story Scenes)",
                  desc: "Complete balanced curriculum across all formats",
                },
                {
                  id: "exam-only",
                  label: "Official Exam Archetypes Only",
                  desc: "Ken & Minji's speeches, homestay letters, apartment rules",
                },
                {
                  id: "story-scenes",
                  label: "Graded Story Scenes (/stories Integration)",
                  desc: "Momotaro, Hospital, Attack on Titan, Convenience Store",
                },
              ].map((opt) => {
                const isSelected = sourceFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSourceFilter(opt.id as ClozeSourceFilter)}
                    className={`flex flex-col rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)]/40 shadow-xs"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--ink)]/30"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-[var(--primary-fg)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="mt-0.5 text-[11px] text-[var(--muted)]">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: JLPT Level Chips */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                <Layers className="size-4 text-[var(--primary)]" />
                2. Target JLPT Level(s)
              </h2>
              <span className="text-xs font-semibold text-[var(--primary-fg)]">
                {availablePassages.length} passages · {totalAvailableBlanks} blanks
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Multi-select one or more levels to curate your passage pool.
            </p>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {LEVEL_OPTIONS.map((level) => {
                const isSelected = selectedLevels.includes(level);
                const label = formatJlptLevel(level);
                const count = countsByLevel[label]?.passages ?? 0;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-3.5 transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60"
                    }`}
                  >
                    <span className="text-base font-extrabold">{label}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? "text-white/80" : "text-[var(--muted)]"
                      }`}
                    >
                      {count} texts
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Select All Levels
              </button>
            </div>
          </div>

          {/* Step 3: Session Length */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <BookOpen className="size-4 text-[var(--primary)]" />
              3. Session Length
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              How many full reading passages would you like to solve?
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {PASSAGE_COUNTS.map((cnt) => {
                const isSelected = passageCount === cnt;
                const estBlanks = cnt * 4.5;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPassageCount(cnt)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-3 transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]/30"
                    }`}
                  >
                    <span className="text-base font-bold">{cnt} Passages</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      ~{Math.round(estBlanks)} Blanks
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Reading Aid / English Hint */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Sparkles className="size-4 text-[var(--primary)]" />
              4. Translation Guidance Aid
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Toggle English sentence hints underneath Japanese passage sentences.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowEnglishSentenceHints(false)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  !showEnglishSentenceHints
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]/30"
                }`}
              >
                <EyeOff className="size-4 mb-1" />
                <span className="text-xs font-bold">Exam Authentic</span>
                <span className="text-[10px] text-[var(--muted)]">Japanese text only</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEnglishSentenceHints(true)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  showEnglishSentenceHints
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ink)]/30"
                }`}
              >
                <Eye className="size-4 mb-1" />
                <span className="text-xs font-bold">Hints Enabled</span>
                <span className="text-[10px] text-[var(--muted)]">Show English lines</span>
              </button>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <button
            type="button"
            disabled={availablePassages.length === 0}
            onClick={handleStartSession}
            className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <span>Start Paragraph Flow Cloze</span>
            <ArrowRight className="size-5" />
          </button>
          <span className="mt-2 text-xs text-[var(--muted)]">
            Offline ready · Instant answer checking &amp; post-submit passage narration
          </span>
        </div>
      </section>
    </GameLayout>
  );
}

export default function ParagraphClozeSetupPage() {
  return (
    <Suspense
      fallback={
        <GameLayout
          label="PARAGRAPH FLOW CLOZE · 文章の文法"
          glyph="文"
          homeHref="/games/jlpt"
        >
          <div className="flex flex-1 items-center justify-center p-12">
            <span className="text-sm font-semibold text-[var(--muted)]">
              Loading Paragraph Cloze setup...
            </span>
          </div>
        </GameLayout>
      }
    >
      <ParagraphClozeSetupContent />
    </Suspense>
  );
}
