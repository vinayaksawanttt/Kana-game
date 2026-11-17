"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Zap,
} from "lucide-react";
import type { BookTabKey, DetailedLessonOverview } from "@/features/books/engine/progress";
import { LevelBadge, StatusBadge, TextbookButton } from "./Elements";
import { cn } from "./tokens";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function Breadcrumbs({
  items,
  backHref,
  backLabel = "All Books",
  className,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-semibold text-[var(--tb-text-secondary)]",
        className
      )}
    >
      {backHref && (
        <>
          <Link
            href={backHref}
            className="tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[var(--tb-text-secondary)] hover:bg-[var(--tb-accent-soft)]/50 hover:text-[var(--primary-fg)] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </Link>
          {items.length > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
        </>
      )}

      {items.map((item, idx) => (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && <span aria-hidden="true" className="opacity-50">/</span>}
          {item.href && !item.isCurrent ? (
            <Link
              href={item.href}
              className="tb-focus-ring rounded px-1.5 py-0.5 hover:text-[var(--primary-fg)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              aria-current={item.isCurrent ? "page" : undefined}
              className={cn(
                "px-1 py-0.5 font-bold",
                item.isCurrent ? "text-[var(--primary-fg)]" : "text-[var(--tb-text-primary)]"
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export interface PreviousNextLessonNavigationProps {
  bookId: string;
  prevLessonNumber: number | null;
  nextLessonNumber: number | null;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function PreviousNextLessonNavigation({
  bookId,
  prevLessonNumber,
  nextLessonNumber,
  prevLabel,
  nextLabel,
  className,
}: PreviousNextLessonNavigationProps) {
  if (!prevLessonNumber && !nextLessonNumber) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {prevLessonNumber !== null && (
        <Link
          href={`/books/${bookId}/${prevLessonNumber}`}
          className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] shadow-2xs transition-colors"
        >
          <ChevronLeft size={14} />
          <span>{prevLabel ?? `Lesson ${prevLessonNumber}`}</span>
        </Link>
      )}
      {nextLessonNumber !== null && (
        <Link
          href={`/books/${bookId}/${nextLessonNumber}`}
          className="tb-focus-ring inline-flex items-center gap-1 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] shadow-2xs transition-colors"
        >
          <span>{nextLabel ?? `Lesson ${nextLessonNumber}`}</span>
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

export interface LessonNavigationProps {
  bookId: string;
  bookTitle: string;
  lessonNumber: number;
  prevLessonNumber: number | null;
  nextLessonNumber: number | null;
  className?: string;
}

/**
 * Combined top bar for a Textbook Lesson combining breadcrumbs and prev/next lesson switching.
 */
export function LessonNavigation({
  bookId,
  bookTitle,
  lessonNumber,
  prevLessonNumber,
  nextLessonNumber,
  className,
}: LessonNavigationProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <Breadcrumbs
        backHref="/books"
        backLabel="All Books"
        items={[
          { label: bookTitle },
          { label: `Lesson ${lessonNumber}`, isCurrent: true },
        ]}
      />
      <PreviousNextLessonNavigation
        bookId={bookId}
        prevLessonNumber={prevLessonNumber}
        nextLessonNumber={nextLessonNumber}
      />
    </div>
  );
}

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
  shortcut?: string;
  title?: string;
}

export interface TabNavigationProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onSelect: (id: T) => void;
  sticky?: boolean;
  className?: string;
  rightSlot?: ReactNode;
}

/**
 * Sticky horizontal tab switcher with count pills and keyboard shortcut hints.
 */
export function TabNavigation<T extends string = string>({
  tabs,
  activeTab,
  onSelect,
  sticky = true,
  className,
  rightSlot,
}: TabNavigationProps<T>) {
  return (
    <div
      className={cn(
        sticky &&
          "sticky top-0 z-30 -mx-4 px-4 sm:-mx-8 sm:px-8 py-2.5 bg-[var(--tb-bg)]/95 backdrop-blur-md border-b border-[var(--tb-border)] shadow-xs",
        !sticky && "py-1",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="button"
                onClick={() => onSelect(tab.id)}
                aria-label={tab.label}
                aria-pressed={isActive}
                title={tab.title ?? (tab.shortcut ? `Press ${tab.shortcut} to switch to ${tab.label}` : tab.label)}
                className={cn(
                  "tb-focus-ring relative shrink-0 flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-[var(--tb-primary)] text-white shadow-xs"
                    : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:bg-[var(--tb-accent-soft)]/50"
                )}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)]"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {rightSlot && <div className="hidden lg:flex shrink-0 items-center">{rightSlot}</div>}
      </div>
    </div>
  );
}

export interface LessonWorkspaceHeaderProps {
  bookId: string;
  bookTitle: string;
  level?: string;
  lessonNumber: number;
  lessonTitle: string;
  japaneseTitle?: string;
  subtitle?: string;
  prevLessonNumber: number | null;
  nextLessonNumber: number | null;
  overview: DetailedLessonOverview;
  activeTab: BookTabKey;
  enqueuingSrs?: boolean;
  onEnqueueAll: () => void;
  onSelectTab: (tab: BookTabKey) => void;
}

function renderWorkspaceStatusBadge(overview: DetailedLessonOverview) {
  switch (overview.overall.state) {
    case "review-needed":
      return (
        <StatusBadge variant="due" icon={<AlertCircle className="size-3" />}>
          Review Needed ({overview.overall.dueCount} due)
        </StatusBadge>
      );
    case "completed":
      return (
        <StatusBadge variant="mastered" icon={<CheckCircle2 className="size-3" />}>
          Completed
        </StatusBadge>
      );
    case "in-progress":
      return (
        <StatusBadge variant="in-progress" icon={<Clock className="size-3" />}>
          In Progress
        </StatusBadge>
      );
    default:
      return <StatusBadge variant="new">Not Started</StatusBadge>;
  }
}

/**
 * Compact, persistent lesson workspace header with breadcrumbs, prev/next lesson switch,
 * completion badge, primary FSRS action, and 5-area Lesson Overview progress strip.
 */
export function LessonWorkspaceHeader({
  bookId,
  bookTitle,
  level,
  lessonNumber,
  lessonTitle,
  japaneseTitle,
  subtitle,
  prevLessonNumber,
  nextLessonNumber,
  overview,
  activeTab,
  enqueuingSrs = false,
  onEnqueueAll,
  onSelectTab,
}: LessonWorkspaceHeaderProps) {
  const [showOverviewDetails, setShowOverviewDetails] = useState(true);

  const overviewItems: Array<{
    tab: BookTabKey;
    label: string;
    primaryText: string;
    secondaryText: string;
    percent: number;
  }> = [
    {
      tab: "vocab",
      label: "Vocabulary",
      primaryText: `${overview.vocab.studied}/${overview.vocab.total} studied`,
      secondaryText: `${overview.vocab.mastered} mastered`,
      percent:
        overview.vocab.total > 0
          ? Math.round((overview.vocab.studied / overview.vocab.total) * 100)
          : 0,
    },
    {
      tab: "grammar",
      label: "Grammar",
      primaryText: `${overview.grammar.studied}/${overview.grammar.total} studied`,
      secondaryText: `${overview.grammar.mastered} mastered`,
      percent:
        overview.grammar.total > 0
          ? Math.round((overview.grammar.studied / overview.grammar.total) * 100)
          : 0,
    },
    {
      tab: "kanji",
      label: "Kanji",
      primaryText: `${overview.kanji.studied}/${overview.kanji.total} studied`,
      secondaryText: `${overview.kanji.mastered} mastered`,
      percent:
        overview.kanji.total > 0
          ? Math.round((overview.kanji.studied / overview.kanji.total) * 100)
          : 0,
    },
    {
      tab: "dialogues",
      label: "Dialogues",
      primaryText: `${overview.dialogues.completed}/${overview.dialogues.total} scenes`,
      secondaryText:
        overview.dialogues.total === 0 ? "None in lesson" : "Completed",
      percent:
        overview.dialogues.total > 0
          ? Math.round((overview.dialogues.completed / overview.dialogues.total) * 100)
          : 0,
    },
    {
      tab: "practice",
      label: "Practice",
      primaryText: `${overview.practice.attempted}/${overview.practice.total} done`,
      secondaryText: `${overview.practice.mastered} correct`,
      percent:
        overview.practice.total > 0
          ? Math.round((overview.practice.attempted / overview.practice.total) * 100)
          : 0,
    },
  ];

  return (
    <header className="space-y-3">
      {/* Breadcrumbs + Prev/Next Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          backHref="/books"
          backLabel="All Textbooks"
          items={[
            { label: bookTitle },
            { label: `Lesson ${lessonNumber}`, isCurrent: true },
          ]}
        />
        <PreviousNextLessonNavigation
          bookId={bookId}
          prevLessonNumber={prevLessonNumber}
          nextLessonNumber={nextLessonNumber}
        />
      </div>

      {/* Compact Identity & Overview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 sm:p-6 shadow-xs">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tb-accent)]/60 via-[var(--tb-primary)]/70 to-[var(--tb-accent)]/60"
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--tb-primary)] px-2.5 py-0.5 text-[11px] font-black text-white">
                LESSON {lessonNumber}
              </span>
              {level && <LevelBadge level={level} />}
              {renderWorkspaceStatusBadge(overview)}
              {japaneseTitle && (
                <span className="font-japanese text-xs sm:text-sm font-bold text-[var(--tb-text-secondary)]">
                  {japaneseTitle}
                </span>
              )}
            </div>

            <h1 className="text-xl font-black tracking-tight text-[var(--tb-text-primary)] sm:text-2xl lg:text-3xl">
              {lessonTitle}
            </h1>

            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--tb-text-secondary)] max-w-2xl line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TextbookButton
              variant="secondary"
              size="sm"
              onClick={() => setShowOverviewDetails((prev) => !prev)}
              rightIcon={
                showOverviewDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />
              }
              aria-expanded={showOverviewDetails}
            >
              Lesson Overview
            </TextbookButton>

            <TextbookButton
              variant="primary"
              size="md"
              onClick={onEnqueueAll}
              loading={enqueuingSrs}
              leftIcon={<Zap size={15} />}
            >
              Enqueue Lesson in FSRS
            </TextbookButton>
          </div>
        </div>

        {/* 5-Area Compact Lesson Overview Strip */}
        {showOverviewDetails && (
          <div
            aria-label="Lesson overview"
            className="mt-4 pt-3.5 border-t border-[var(--tb-border)] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          >
            {overviewItems.map((item) => {
              const isSelected = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onSelectTab(item.tab)}
                  className={cn(
                    "tb-focus-ring rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-[var(--tb-primary)]/50 bg-[var(--tb-accent-soft)]/35"
                      : "border-[var(--tb-border)] bg-[var(--tb-bg)]/50 hover:border-[var(--tb-border-strong)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-[var(--tb-text-primary)]">
                    <span>{item.label}</span>
                    <span className="text-[10px] font-bold text-[var(--primary-fg)]">
                      {item.percent}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[var(--tb-text-primary)]">
                    {item.primaryText}
                  </div>
                  <div className="text-[10px] text-[var(--tb-text-secondary)]">
                    {item.secondaryText}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
