"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Layers,
  Mail,
  Search,
  ShoppingBag,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  INFO_SCANNER_CATEGORIES,
  INFO_SCANNER_DOCUMENTS,
  INFO_SCANNER_LEVELS,
  SCANNER_CATEGORY_META,
  createInfoScannerSession,
  getInfoScannerCountsByLevel,
  type InfoScannerCategory,
  type InfoScannerCategoryFilter,
  type InfoScannerLevel,
} from "@/engine/jlptInfoScanner";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

const DOCUMENT_COUNTS = [3, 5, 10] as const;

function InfoScannerSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();
  const categoryParam = searchParams.get("category") as InfoScannerCategory | null;

  const initialLevels = useMemo<InfoScannerLevel[]>(() => {
    if (!levelParam) return ["N5"];
    if (levelParam === "ALL") return ["N5", "N4", "N3", "N2", "N1"];
    if (INFO_SCANNER_LEVELS.includes(levelParam as InfoScannerLevel)) {
      return [levelParam as InfoScannerLevel];
    }
    return ["N5"];
  }, [levelParam]);

  const [selectedLevels, setSelectedLevels] = useState<InfoScannerLevel[]>(initialLevels);
  const [categoryFilter, setCategoryFilter] = useState<InfoScannerCategoryFilter>(
    categoryParam && INFO_SCANNER_CATEGORIES.includes(categoryParam)
      ? categoryParam
      : "all"
  );
  const [documentCount, setDocumentCount] = useState<number>(3);
  const [showScenarioEnglish, setShowScenarioEnglish] = useState<boolean>(true);

  const countsByLevel = useMemo(
    () => getInfoScannerCountsByLevel(INFO_SCANNER_DOCUMENTS, categoryFilter),
    [categoryFilter]
  );

  const availableDocs = useMemo(() => {
    const levelSet = new Set(selectedLevels);
    return INFO_SCANNER_DOCUMENTS.filter((item) => {
      if (!levelSet.has(item.level)) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [selectedLevels, categoryFilter]);

  const totalQuestions = useMemo(
    () => availableDocs.reduce((sum, d) => sum + d.questions.length, 0),
    [availableDocs]
  );

  function toggleLevel(level: InfoScannerLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort(
        (a, b) => INFO_SCANNER_LEVELS.indexOf(a) - INFO_SCANNER_LEVELS.indexOf(b)
      );
    });
  }

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([...INFO_SCANNER_LEVELS]);
    } else {
      if (INFO_SCANNER_LEVELS.includes(lvlStr.toUpperCase() as InfoScannerLevel)) {
        setSelectedLevels([lvlStr.toUpperCase() as InfoScannerLevel]);
      }
    }
  }

  function handleStartSession() {
    const session = createInfoScannerSession(INFO_SCANNER_DOCUMENTS, {
      levels: selectedLevels,
      categoryFilter,
      documentCount,
      showScenarioEnglish,
    });
    saveGameSession("jlpt-scanner", session.sessionId, session);
    router.push(`/games/jlpt/info-scanner/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === INFO_SCANNER_LEVELS.length
      ? "ALL"
      : selectedLevels[0] ?? "N5";

  return (
    <JlptBookletSetupShell
      label="REAL-WORLD INFO SCANNER · 情報検索"
      glyph="探"
      sectionTag="第2部：読解 · 問題 4–6 (情報検索)"
      mondaiBadge="読解・情報検索"
      sectionTitle={
        <span>
          Real-World Info Scanner{" "}
          <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
            (情報検索)
          </span>
        </span>
      }
      sectionSubtitle="チラシ・社内メモ・案内文・時刻表から条件に合う情報を素早く検索・照合する読解演習"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availableDocs.length}
      activeQuestionCountLabel={`documents (${totalQuestions} questions) in active pool`}
      instructions={
        <p className="font-japanese text-xs sm:text-sm">
          右のページのお知らせを見て、下の質問に答えてください。答えは、1・2・3・4からいちばんいいものを一つえらんでください。
        </p>
      }
    >
      <div className="space-y-6">
        {/* Exam Question Box 1: JLPT Level Selection */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1.5">
                <Layers className="size-4" />
                第1問 · 判定対象レベル (Target JLPT Level)
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Select one or more levels to include in your practice pool.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLevels([...INFO_SCANNER_LEVELS])}
              className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
            >
              All N5–N1
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {INFO_SCANNER_LEVELS.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl);
              const count = countsByLevel[lvl]?.documents ?? 0;
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleLevel(lvl)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 transition cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-japanese text-lg font-black">{lvl}</span>
                  <span
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? "text-[var(--primary-fg)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {count} docs
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 2: Document Category Filter */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <Search className="size-4 text-[var(--primary-fg)]" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第2問 · 文書カテゴリ絞り込み (Document Category Filter)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Choose whether to scan across all real-world media or isolate a specific document type:
          </p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {/* All Categories Chip */}
            <button
              type="button"
              aria-pressed={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
              className={`flex items-start gap-3 rounded-sm border-2 p-3 text-left transition cursor-pointer ${
                categoryFilter === "all"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <Layers className="size-4 mt-0.5 shrink-0 text-[var(--primary)]" />
              <div className="min-w-0">
                <div className="text-xs font-bold font-japanese">すべての文書 (All Categories)</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  Mixed flyers, memos, timetables &amp; emails
                </div>
              </div>
            </button>

            {/* 6 Category Chips */}
            {INFO_SCANNER_CATEGORIES.map((cat) => {
              const meta = SCANNER_CATEGORY_META[cat];
              const isSelected = categoryFilter === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-start gap-3 rounded-sm border-2 p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <CategoryFilterIcon cat={cat} className="size-4 mt-0.5 shrink-0 text-[var(--primary)]" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-japanese">
                      {meta.labelJa}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                      {meta.labelEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 3 & 4: Session Length & Scenario Hints */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exam Question Box 3: Session Length */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
                <Clock className="size-4 text-[var(--primary-fg)]" />
                <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                  第3問 · 出題文書数設定 (Session Length)
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                How many documents to solve in this scanning drill:
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {DOCUMENT_COUNTS.map((cnt) => {
                  const isSelected = documentCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDocumentCount(cnt)}
                      className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 transition cursor-pointer ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-black shadow-xs"
                          : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="font-mono text-xl">{cnt}</span>
                      <span className="text-[11px] text-[var(--muted)] mt-0.5">Documents</span>
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
                {documentCount}文書 · {availableDocs.length}件の利用可能文書プール
              </div>
            </div>
          </div>

          {/* Exam Question Box 4: Scenario English Hints */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
                <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                  第4問 · シナリオ英語ガイダンス (Hints)
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                When enabled, English summaries of the examinee goal (e.g. &ldquo;Lee wants to buy 3 apples before noon&rdquo;) are displayed. The document itself remains 100% Japanese.
              </p>

              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  aria-pressed={showScenarioEnglish}
                  onClick={() => setShowScenarioEnglish(true)}
                  className={`flex w-full items-center justify-between rounded-sm border-2 p-3.5 text-left transition ${
                    showScenarioEnglish
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold sm:text-sm">English Hints: ON</div>
                    <div className="text-[11px] opacity-80">Scenario goal displayed in English</div>
                  </div>
                  <Eye className="size-4 shrink-0" />
                </button>

                <button
                  type="button"
                  aria-pressed={!showScenarioEnglish}
                  onClick={() => setShowScenarioEnglish(false)}
                  className={`flex w-full items-center justify-between rounded-sm border-2 p-3.5 text-left transition ${
                    !showScenarioEnglish
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold sm:text-sm">Exam Mode: OFF</div>
                    <div className="text-[11px] opacity-80">Pure Japanese scenario prompt</div>
                  </div>
                  <EyeOff className="size-4 shrink-0" />
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
              {availableDocs.length} documents ({totalQuestions} questions)
            </span>{" "}
            matching current filters.
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={availableDocs.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-45 cursor-pointer"
          >
            <span>演習を開始する / Start Scanning Drill</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

function CategoryFilterIcon({
  cat,
  className,
}: {
  cat: InfoScannerCategory;
  className?: string;
}) {
  switch (cat) {
    case "flyer-store":
      return <ShoppingBag className={className} />;
    case "memo-notice":
      return <StickyNote className={className} />;
    case "schedule-transport":
      return <Clock className={className} />;
    case "public-guide":
      return <Building2 className={className} />;
    case "business-email":
      return <Mail className={className} />;
    case "application-form":
      return <FileText className={className} />;
  }
}

export default function InfoScannerSetupPage() {
  return (
    <Suspense fallback={null}>
      <InfoScannerSetupContent />
    </Suspense>
  );
}
