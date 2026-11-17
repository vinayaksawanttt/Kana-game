"use client";

import React, { type ReactNode } from "react";
import { GameLayout } from "@/lib/game-core/layout";
import { cn } from "./tokens";

export interface TextbookPageContainerProps {
  label?: string;
  glyph?: string;
  homeHref?: string;
  rightSlot?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Standardized page shell for all Textbook Companion routes.
 * Applies the warm Sakura background surface and responsive container width.
 */
export function TextbookPageContainer({
  label = "TEXTBOOK COMPANION",
  glyph = "本",
  homeHref = "/",
  rightSlot,
  className,
  children,
}: TextbookPageContainerProps) {
  return (
    <GameLayout
      label={label}
      glyph={glyph}
      homeHref={homeHref}
      rightSlot={rightSlot}
      className={cn("bg-[var(--tb-bg)] text-[var(--tb-text-primary)]", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
        {children}
      </div>
    </GameLayout>
  );
}

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  badge?: ReactNode;
  title: string;
  japaneseTitle?: string;
  description?: string;
  rightSlot?: ReactNode;
  footerSlot?: ReactNode;
  className?: string;
}

/**
 * Editorial, restrained header card for textbook shelf and lesson overview banners.
 */
export function PageHeader({
  eyebrow,
  badge,
  title,
  japaneseTitle,
  description,
  rightSlot,
  footerSlot,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-5 sm:p-8 shadow-xs",
        className
      )}
    >
      {/* Subtle top sakura accent hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tb-accent)]/60 via-[var(--tb-primary)]/70 to-[var(--tb-accent)]/60"
      />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-2xl space-y-2.5">
          {(eyebrow || badge || japaneseTitle) && (
            <div className="flex flex-wrap items-center gap-2">
              {badge}
              {eyebrow && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tb-text-secondary)]">
                  {eyebrow}
                </div>
              )}
              {japaneseTitle && (
                <span className="font-japanese text-xs sm:text-sm font-bold text-[var(--tb-text-secondary)]">
                  {japaneseTitle}
                </span>
              )}
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight text-[var(--tb-text-primary)] sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="text-sm text-[var(--tb-text-secondary)] sm:text-base leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {rightSlot && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {rightSlot}
          </div>
        )}
      </div>

      {footerSlot && (
        <div className="mt-5 pt-4 border-t border-[var(--tb-border)]">
          {footerSlot}
        </div>
      )}
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  count?: number | string;
  badge?: ReactNode;
  actions?: ReactNode;
  as?: "h2" | "h3" | "h4";
  className?: string;
}

/**
 * Consistent section title bar with icon, optional count badge, and right-aligned controls.
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
  count,
  badge,
  actions,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {icon && <span className="shrink-0 text-[var(--primary-fg)]">{icon}</span>}
          <Heading className="text-base sm:text-lg font-black tracking-tight text-[var(--tb-text-primary)]">
            {title}
          </Heading>
          {count !== undefined && (
            <span className="rounded-full border border-[var(--tb-border)] bg-[var(--tb-accent-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary-fg)]">
              {count}
            </span>
          )}
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--tb-text-secondary)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export interface ContentContainerProps {
  children: ReactNode;
  variant?: "default" | "subtle" | "dashed" | "flush";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  as?: "div" | "section" | "article";
  "aria-label"?: string;
}

const CONTAINER_VARIANTS = {
  default: "rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] shadow-2xs",
  subtle: "rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface-subtle)]/70",
  dashed: "rounded-3xl border border-dashed border-[var(--tb-border-strong)] bg-[var(--tb-surface)]",
  flush: "overflow-hidden rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-surface)] shadow-2xs",
};

const CONTAINER_PADDINGS = {
  none: "",
  sm: "p-3.5 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

/**
 * Standardized surface wrapper for toolbars, panels, and grouped content blocks.
 */
export function ContentContainer({
  children,
  variant = "default",
  padding = "md",
  className,
  as: Component = "div",
  "aria-label": ariaLabel,
}: ContentContainerProps) {
  return (
    <Component
      aria-label={ariaLabel}
      className={cn(
        CONTAINER_VARIANTS[variant],
        CONTAINER_PADDINGS[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}

export interface ResponsiveGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const GRID_COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

const GRID_GAPS = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5 sm:gap-6",
};

/**
 * Overflow-safe responsive grid covering mobile (320-767px), tablet (768-1023px), and desktop (1024px+).
 */
export function ResponsiveGrid({
  children,
  columns = 3,
  gap = "md",
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0",
        GRID_COLUMNS[columns],
        GRID_GAPS[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
