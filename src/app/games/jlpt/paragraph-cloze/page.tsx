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
import { saveGameSession } from "@/lib/game-core/storage";
import {
  PARAGRAPH_CLOZE_PASSAGES,
  createParagraphClozeSession,
  formatJlptLevel,
  getParagraphClozeCountsByLevel,
  type ClozeSourceFilter,
  type JlptNumericLevel,
} from "@/engine/jlptParagraphCloze";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

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

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([5, 4, 3, 2, 1]);
    } else {
      const num = parseInt(lvlStr.replace("N", ""), 10);
      if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
        setSelectedLevels([num as JlptNumericLevel]);
      }
    }
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

  const headerSelectedLevel =
    selectedLevels.length === LEVEL_OPTIONS.length
      ? "ALL"
      : formatJlptLevel(selectedLevels[0] ?? 5);

  return (
    <JlptBookletSetupShell
      label="PARAGRAPH FLOW CLOZE · 文章の文法"
      glyph="文"
      sectionTag="第2部：文法 · 問題 3 (文章の文法)"
      mondaiBadge="文章の文法・問題3"
      sectionTitle={
        <span>
          文章の文法 <span className="text-xl font-normal text-[var(--muted)] sm:text-2xl">(Paragraph Flow Cloze)</span>
        </span>
      }
      sectionSubtitle="まとまりのある文章の流れを読み解き、接続詞・指示語・文末表現の空欄を埋める長文文法演習"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePassages.length}
      activeQuestionCountLabel={`passages (${totalAvailableBlanks} blanks) in active pool`}
      instructions={
        <p className="font-japanese text-xs sm:text-sm">
          次の文章を読んで、文章全体の意味を考えて、空欄に入る最もよいものを、1・2・3・4から一つえらんでください。
        </p>
      }
    >
      <div className="space-y-6">
        {/* Exam Question Box 1: Passage Content Source */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <FileText className="size-4 text-[var(--primary)]" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第1問 · 出題パッセージの出典 (Passage Content Source)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Choose between authentic exam booklet essays or extracts from our graded stories.
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
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
                  aria-pressed={isSelected}
                  onClick={() => setSourceFilter(opt.id as ClozeSourceFilter)}
                  className={`flex flex-col rounded-sm border-2 p-3.5 text-left transition ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 hover:border-[var(--primary)]"
                  }`}
                >
                  <span
                    className={`font-japanese text-xs font-bold sm:text-sm ${
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

        {/* Exam Question Box 2: Target JLPT Level(s) */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1.5">
                <Layers className="size-4" />
                第2問 · 判定対象レベル (Target JLPT Levels)
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Multi-select one or more levels to curate your passage pool.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
              className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
            >
              Select All Levels
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {LEVEL_OPTIONS.map((level) => {
              const isSelected = selectedLevels.includes(level);
              const label = formatJlptLevel(level);
              const count = countsByLevel[label]?.passages ?? 0;

              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleLevel(level)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 transition ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-japanese text-lg font-black">{label}</span>
                  <span
                    className={`text-[11px] font-semibold mt-0.5 ${
                      isSelected ? "text-[var(--primary-fg)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {count} texts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 3 & 4: Session Length & Translation Guidance */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exam Question Box 3: Session Length */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
                <BookOpen className="size-4 text-[var(--primary-fg)]" />
                <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                  第3問 · 出題パッセージ数 (Session Length)
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                How many full reading passages would you like to solve?
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {PASSAGE_COUNTS.map((cnt) => {
                  const isSelected = passageCount === cnt;
                  const estBlanks = cnt * 4.5;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setPassageCount(cnt)}
                      className={`flex flex-col items-center justify-center rounded-sm border-2 py-3.5 transition ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-black shadow-xs"
                          : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="font-mono text-base font-bold">{cnt} Passages</span>
                      <span className="text-[11px] text-[var(--muted)] mt-0.5">
                        ~{Math.round(estBlanks)} Blanks
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-sm border border-dashed border-[var(--ink)]/20 bg-[var(--bg)]/60 p-3 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <Sparkles size={14} className="text-[var(--primary-fg)]" />
                <span>Active Target</span>
              </div>
              <div className="mt-1 font-japanese">
                {passageCount}パッセージ · {availablePassages.length}篇 ({totalAvailableBlanks}空欄)
              </div>
            </div>
          </div>

          {/* Exam Question Box 4: Translation Guidance Aid */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
                <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                  第4問 · 翻訳ガイダンス補助 (Guidance Aid)
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Toggle English sentence hints underneath Japanese passage sentences.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={!showEnglishSentenceHints}
                  onClick={() => setShowEnglishSentenceHints(false)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3 text-center transition ${
                    !showEnglishSentenceHints
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <EyeOff className="size-4 mb-1" />
                  <span className="text-xs font-bold">Exam Authentic</span>
                  <span className="text-[10px] text-[var(--muted)]">Japanese text only</span>
                </button>

                <button
                  type="button"
                  aria-pressed={showEnglishSentenceHints}
                  onClick={() => setShowEnglishSentenceHints(true)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3 text-center transition ${
                    showEnglishSentenceHints
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <Eye className="size-4 mb-1" />
                  <span className="text-xs font-bold">Hints Enabled</span>
                  <span className="text-[10px] text-[var(--muted)]">Show English lines</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Japan Red Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="text-xs text-[var(--muted)]">
            Active pool:{" "}
            <span className="font-bold text-[var(--ink)]">
              {availablePassages.length} passages ({totalAvailableBlanks} blanks)
            </span>{" "}
            matching current filters.
          </div>

          <button
            type="button"
            disabled={availablePassages.length === 0}
            onClick={handleStartSession}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-45 cursor-pointer"
          >
            <span>演習をはじめる / Start Paragraph Flow Cloze →</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function ParagraphClozeSetupPage() {
  return (
    <Suspense fallback={null}>
      <ParagraphClozeSetupContent />
    </Suspense>
  );
}
