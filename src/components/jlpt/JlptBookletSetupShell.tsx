"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";

export interface JlptBookletSetupShellProps {
  /** Outer GameLayout app bar label (e.g. "PHONETIC TRAP SNIPER · 問題 1・2") */
  label?: string;
  /** Kanji glyph displayed in app bar badge */
  glyph?: string;
  /** Link for GameLayout home navigation (defaults to "/games/jlpt") */
  homeHref?: string;
  /** Whether to wrap in GameLayout; default true. Set false if caller manages outer layout. */
  includeLayout?: boolean;

  /** Top official tag badge text (e.g. "第1部：文字・語彙 · Mondai 1・2") */
  sectionTag?: string;
  /** Primary title of the game / section (Japanese or bilingual) */
  sectionTitle: ReactNode;
  /** Subtitle or English romanized name */
  sectionSubtitle?: ReactNode;
  /** Optional Mondai badge pill (e.g. "問題 1・2", "Mondai 5", etc.) */
  mondaiBadge?: string;

  /** Controlled JLPT level options supported by this game (e.g. ["N5", "N4", "N3", "N2", "N1"] or ["N4", "N3", "N2", "N1"]) */
  supportedLevels: readonly string[];
  /** Currently selected level value */
  selectedLevel: string;
  /** Level selection change handler */
  onLevelChange: (level: string) => void;
  /** Label preceding the stamp buttons */
  levelStampLabel?: string;

  /** Examinee registration number override (defaults to `EX-${selectedLevel.toUpperCase()}-0042`) */
  examineeNumber?: string;
  /** Target level display label (e.g. "JLPT N5 Focused") */
  targetLevelLabel?: string;
  /** Active pool item/blank/question count */
  activeQuestionCount?: number;
  /** Suffix for activeQuestionCount (defaults to "items in active pool") */
  activeQuestionCountLabel?: string;
  /** Hanko stamp badge text (defaults to "合格圏") */
  hankoText?: string;

  /** Official exam instructions content */
  instructions: ReactNode;
  /** Instructions box header label */
  instructionTitle?: string;

  /** Children configuration area (submodes, session length, study toggles, start button) */
  children: ReactNode;

  /** Optional container style overrides */
  className?: string;
  paperClassName?: string;
}

export function JlptBookletSetupShell({
  label = "JLPT & NAT EXAM ARENA · 問題用紙",
  glyph = "試",
  homeHref = "/games/jlpt",
  includeLayout = true,
  sectionTag = "日本語能力試験 · JLPT / NAT-TEST",
  sectionTitle,
  sectionSubtitle,
  mondaiBadge,
  supportedLevels,
  selectedLevel,
  onLevelChange,
  levelStampLabel = "Level Stamp:",
  examineeNumber,
  targetLevelLabel,
  activeQuestionCount,
  activeQuestionCountLabel = "items in active pool",
  hankoText = "合格圏",
  instructions,
  instructionTitle = "【 注意 · ちゅうい · Official Instructions 】",
  children,
  className = "",
  paperClassName = "",
}: JlptBookletSetupShellProps) {
  const displayExamineeNo =
    examineeNumber ?? `EX-${selectedLevel.toUpperCase()}-0042`;

  const displayTargetLevel =
    targetLevelLabel ??
    (selectedLevel.toLowerCase() === "all"
      ? "All JLPT Tiers"
      : `JLPT ${selectedLevel.toUpperCase()} Focused`);

  const paperContent = (
    <section className={`mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10 ${className}`}>
      {/* =========================================================================
          TACTILE OFFICIAL EXAM PAPER SHEET CONTAINER (問題用紙)
          ========================================================================= */}
      <div
        className={`relative mx-auto rounded-sm border-2 border-[var(--ink)]/30 bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(35,26,28,0.12)] sm:p-10 ${paperClassName}`}
      >
        {/* Subtle Corner Registration Marks (+) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
        >
          +
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
        >
          +
        </span>

        {/* Inner Double-Frame Border Line */}
        <div className="relative rounded-[2px] border border-[var(--ink)]/15 p-4 sm:p-8">
          {/* Top Return Navigation Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)]/15 pb-4">
            <Link
              href="/games/jlpt"
              className="group inline-flex items-center gap-1.5 font-japanese text-xs font-bold text-[var(--muted)] transition-colors hover:text-[var(--primary-fg)]"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span>問題用紙一覧へもどる (Return to Booklet Hub)</span>
            </Link>

            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Official Examination Booklet · 問題用紙
            </span>
          </div>

          {/* =======================================================================
              BOOKLET COVER HEADER (問題用紙 表紙ヘッダー)
              ======================================================================= */}
          <header className="border-b-2 border-[var(--ink)]/30 pb-7">
            {/* Top Row: Official Tag + Level Stamp Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-black tracking-widest text-[var(--ink)] shadow-sm">
                  {sectionTag}
                </span>
                {mondaiBadge && (
                  <span className="rounded-sm border border-[var(--line)] bg-[var(--sakura-light)] px-2.5 py-1 font-japanese text-xs font-bold text-[var(--primary-fg)]">
                    {mondaiBadge}
                  </span>
                )}
                <div className="hidden sm:block">
                  <JlptPaperIllustration className="h-8 w-6" />
                </div>
              </div>

              {/* Interactive Level Stamp Selector */}
              {supportedLevels.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  role="radiogroup"
                  aria-label="JLPT Level Stamps"
                >
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    {levelStampLabel}
                  </span>
                  {supportedLevels.map((lvl) => {
                    const isSelected = selectedLevel.toUpperCase() === lvl.toUpperCase();
                    const displayLabel = lvl.toLowerCase() === "all" ? "All" : lvl.toUpperCase();

                    return (
                      <button
                        key={lvl}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onLevelChange(lvl)}
                        className={`relative rounded-sm border-2 px-3 py-1 font-japanese font-black text-sm uppercase transition-all duration-150 sm:text-base ${
                          isSelected
                            ? "scale-105 border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-[0_3px_10px_rgba(208,16,76,0.22)] ring-1 ring-[var(--primary)]"
                            : "border-[var(--ink)]/35 bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center Title Block */}
            <div className="mt-8 text-center">
              <h1 className="font-japanese text-3xl font-extrabold tracking-[0.2em] text-[var(--ink)] sm:text-5xl">
                {sectionTitle}
              </h1>
              {sectionSubtitle && (
                <p className="mt-2.5 font-japanese text-sm font-semibold tracking-wide text-[var(--primary-fg)] sm:text-base">
                  {sectionSubtitle}
                </p>
              )}
            </div>

            {/* Examinee Registration Box (受験番号・なまえ 表) */}
            <div className="mt-7 overflow-hidden rounded-sm border-2 border-[var(--ink)]/40 bg-[var(--bg)]/60 text-left">
              <div className="grid divide-y-2 divide-[var(--ink)]/20 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0">
                {/* Cell 1: Examinee Number */}
                <div className="p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    受験番号 · Examinee No.
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-base font-black tracking-wider text-[var(--ink)] sm:text-lg">
                      {displayExamineeNo}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--muted)]">
                      (Active Session)
                    </span>
                  </div>
                </div>

                {/* Cell 2: Target Level & Hanko Stamp Badge */}
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      判定対象 · Target Level
                    </div>
                    <div className="mt-1 font-japanese text-sm font-extrabold text-[var(--ink)] sm:text-base">
                      {displayTargetLevel}
                    </div>
                    {typeof activeQuestionCount === "number" && (
                      <div className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                        {activeQuestionCount} {activeQuestionCountLabel}
                      </div>
                    )}
                  </div>

                  {/* Official Hanko Stamp Badge */}
                  <div className="inline-flex rotate-[-6deg] items-center rounded-sm border-2 border-[var(--primary)] bg-[var(--surface)] px-2.5 py-1 text-center shadow-sm">
                    <span className="font-japanese text-xs font-black tracking-widest text-[var(--primary-fg)]">
                      {hankoText}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Booklet Instructions Box (ちゅうい · Notes) */}
            <div className="mt-6 rounded-sm border border-dashed border-[var(--ink)]/30 bg-[var(--bg)]/40 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                  {instructionTitle}
                </span>
              </div>
              <div className="text-xs leading-relaxed text-[var(--muted)]">
                {instructions}
              </div>
            </div>
          </header>

          {/* =======================================================================
              CHILDREN CONFIGURATION AREA (ゲーム設定・モード選択・演習開始ボタン)
              ======================================================================= */}
          <div className="mt-8 space-y-6">{children}</div>
        </div>
      </div>
    </section>
  );

  if (includeLayout) {
    return (
      <GameLayout label={label} glyph={glyph} homeHref={homeHref}>
        {paperContent}
      </GameLayout>
    );
  }

  return paperContent;
}
