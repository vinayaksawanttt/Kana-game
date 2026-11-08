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
import { GameLayout } from "@/lib/game-core/layout";
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

  return (
    <GameLayout
      label="REAL-WORLD INFO SCANNER · 情報検索"
      glyph="探"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        {/* Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT &amp; NAT Reading · Mondai 4–6
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              読解・情報検索
            </span>
            <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)] border border-[var(--line)]">
              36 Authentic Real-World Documents
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Real-World Info Scanner{" "}
            <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
              (情報検索 スピード検索)
            </span>
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            In the official JLPT Reading section, the final <strong>情報検索 (Information Retrieval)</strong> problem tests your ability to quickly scan authentic visual documents (supermarket flyers, office memos, public facility guides, transport timetables, business emails, and application terms) for specific condition criteria without reading every single word.
          </p>

          {/* Official instruction banner */}
          <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-tint)]/60 p-3.5 text-xs text-[var(--ink)]">
            <span className="font-japanese font-bold text-[var(--primary)]">
              【問題用紙の指示】
            </span>{" "}
            右のページのお知らせを見て、下の質問に答えてください。答えは、1・2・3・4からいちばんいいものを一つえらんでください。
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* 1. JLPT Level Filter Chips */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1.5">
                <Layers className="size-4" />
                Target JLPT Level
              </span>
              <span className="text-xs text-[var(--muted)]">Multi-select enabled</span>
            </div>
            <p className="mb-4 text-xs text-[var(--muted)]">
              Select one or more levels to include in your practice pool.
            </p>

            <div className="grid grid-cols-5 gap-2">
              {INFO_SCANNER_LEVELS.map((lvl) => {
                const isSelected = selectedLevels.includes(lvl);
                const count = countsByLevel[lvl]?.documents ?? 0;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleLevel(lvl)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs font-bold"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className="text-sm font-black">{lvl}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? "text-white/80" : "text-[var(--muted)]"
                      }`}
                    >
                      {count} docs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Session Length */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1.5">
                <Clock className="size-4" />
                Session Length
              </span>
              <span className="text-xs text-[var(--muted)]">Exam pacing</span>
            </div>
            <p className="mb-4 text-xs text-[var(--muted)]">
              How many documents to solve in this scanning drill:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {DOCUMENT_COUNTS.map((cnt) => {
                const isSelected = documentCount === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setDocumentCount(cnt)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 transition cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className="text-base font-black">{cnt}</span>
                    <span className="text-[11px] text-[var(--muted)] mt-0.5">Documents</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Document Category Filter Chips */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-fg)] flex items-center gap-1.5">
              <Search className="size-4" />
              Document Category Filter
            </span>
            <span className="text-xs text-[var(--muted)]">Focus areas</span>
          </div>
          <p className="mb-4 text-xs text-[var(--muted)]">
            Choose whether to scan across all real-world media or isolate a specific document type:
          </p>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {/* All Categories Chip */}
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                categoryFilter === "all"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                  : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
              }`}
            >
              <Layers className="size-4 mt-0.5 shrink-0 text-[var(--primary)]" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--ink)]">すべての文書 (All Categories)</div>
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
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)]/60 hover:text-[var(--ink)]"
                  }`}
                >
                  <CategoryFilterIcon cat={cat} className="size-4 mt-0.5 shrink-0 text-[var(--primary)]" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--ink)] font-japanese">
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

        {/* 4. Reading Assistance Option */}
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-japanese text-xs font-bold text-[var(--ink)]">
                シナリオ英語ガイダンス (Scenario English Hints)
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                Beginner Friendly
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
              When enabled, English summaries of the persona&apos;s goal (e.g. &quot;Lee wants to buy 3 apples before noon&quot;) are displayed next to the Japanese prompt. The document itself remains 100% Japanese.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowScenarioEnglish((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              showScenarioEnglish
                ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold shadow-xs"
                : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
            }`}
          >
            {showScenarioEnglish ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            <span>{showScenarioEnglish ? "English Hints: ON" : "Exam Mode: OFF"}</span>
          </button>
        </div>

        {/* Start Button & Live Pool Indicator */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
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
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 disabled:opacity-45 cursor-pointer"
          >
            <span>演習を開始する / Start Scanning Drill</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </GameLayout>
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
    <Suspense
      fallback={
        <GameLayout
          label="REAL-WORLD INFO SCANNER · 情報検索"
          glyph="探"
          homeHref="/games/jlpt"
        >
          <div className="grid min-h-[60vh] place-items-center">
            <span className="text-sm text-[var(--muted)]">Loading setup...</span>
          </div>
        </GameLayout>
      }
    >
      <InfoScannerSetupContent />
    </Suspense>
  );
}
