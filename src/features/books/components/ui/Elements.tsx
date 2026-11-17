"use client";

import React, { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, MoreVertical, Search, X } from "lucide-react";
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  cn,
  getLevelBadgeStyle,
  STATUS_BADGE_STYLES,
  type ButtonSize,
  type ButtonVariant,
  type JlptLevel,
  type StatusVariant,
} from "./tokens";

/* -------------------------------------------------------------------------- */
/* TextbookButton                                                             */
/* -------------------------------------------------------------------------- */

export interface TextbookButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function TextbookButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  className,
  type = "button",
  ...props
}: TextbookButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "tb-focus-ring inline-flex items-center justify-center font-bold transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && (
        <span className="shrink-0 inline-flex">{rightIcon}</span>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* StatusBadge & LevelBadge                                                   */
/* -------------------------------------------------------------------------- */

export interface StatusBadgeProps {
  variant?: StatusVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({
  variant = "neutral",
  icon,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold leading-tight",
        STATUS_BADGE_STYLES[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export interface LevelBadgeProps {
  level: JlptLevel;
  prefix?: string;
  className?: string;
}

export function LevelBadge({ level, prefix, className }: LevelBadgeProps) {
  const label = prefix ? `${prefix}${level}` : String(level).toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
        getLevelBadgeStyle(level),
        className
      )}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ProgressBar & CircularProgress                                             */
/* -------------------------------------------------------------------------- */

export interface ProgressBarProps {
  value: number; // 0-100 completion/enrolled percentage
  masteryValue?: number; // Optional secondary 0-100 mastered percentage overlay
  label?: ReactNode;
  statusText?: ReactNode;
  showPercentage?: boolean;
  height?: "sm" | "md";
  className?: string;
}

/**
 * Dual-layer progress bar capable of distinguishing SRS enrollment/completion
 * from deeper mastery status.
 */
export function ProgressBar({
  value,
  masteryValue,
  label,
  statusText,
  showPercentage = false,
  height = "sm",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const clampedMastery =
    masteryValue !== undefined
      ? Math.max(0, Math.min(clamped, Math.round(masteryValue)))
      : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || statusText || showPercentage) && (
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--tb-text-secondary)]">
          {label && <span className="flex items-center gap-1 min-w-0 truncate">{label}</span>}
          <span className="shrink-0">
            {statusText}
            {showPercentage && (statusText ? ` (${clamped}%)` : `${clamped}%`)}
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-[var(--tb-border)]",
          height === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        {/* Enrolled / Completion layer */}
        <div
          className="h-full rounded-full bg-[var(--tb-accent)] transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
        {/* Mastered layer */}
        {clampedMastery !== undefined && clampedMastery > 0 && (
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full bg-[var(--tb-primary)] transition-all duration-300"
            style={{ width: `${clampedMastery}%` }}
          />
        )}
        {clampedMastery === undefined && clamped > 0 && (
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-[var(--tb-accent)] to-[var(--tb-primary)] transition-all duration-300"
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function CircularProgress({
  value,
  size = 52,
  strokeWidth = 5,
  label,
  sublabel,
  className,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("inline-flex items-center gap-2.5", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress ${clamped}%`}
    >
      <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--tb-border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--tb-primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className="absolute text-[11px] font-black text-[var(--tb-text-primary)]">
          {clamped}%
        </span>
      </div>
      {(label || sublabel) && (
        <div className="min-w-0 leading-tight">
          {label && <div className="text-xs font-bold text-[var(--tb-text-primary)] truncate">{label}</div>}
          {sublabel && <div className="text-[11px] text-[var(--tb-text-secondary)] truncate">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SearchInput                                                                */
/* -------------------------------------------------------------------------- */

export interface SearchInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  clearLabel?: string;
  rightAdornment?: ReactNode;
  size?: "sm" | "md";
  id?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  label,
  helperText,
  errorText,
  clearLabel = "Clear search",
  rightAdornment,
  size = "md",
  id,
  className,
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[var(--tb-text-primary)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Search
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--tb-text-secondary)]",
            size === "sm" ? "size-3.5" : "size-4"
          )}
        />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(errorText) || undefined}
          className={cn(
            "tb-focus-ring w-full rounded-2xl border bg-[var(--tb-surface)] text-[var(--tb-text-primary)] placeholder-[var(--tb-text-secondary)] shadow-2xs transition-colors focus:border-[var(--tb-primary)] focus:outline-hidden",
            errorText ? "border-[var(--tb-error)]" : "border-[var(--tb-border)]",
            size === "sm"
              ? "py-2 pl-9 pr-9 text-xs"
              : "py-2.5 sm:py-3 pl-10 pr-10 text-xs sm:text-sm"
          )}
        />
        {rightAdornment && !value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightAdornment}</div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={clearLabel}
            className="tb-focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {errorText ? (
        <p role="alert" className="text-[11px] font-semibold text-[var(--tb-error)]">
          {errorText}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--tb-text-secondary)]">{helperText}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FilterDropdown                                                             */
/* -------------------------------------------------------------------------- */

export interface FilterOption<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

export interface FilterDropdownProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  mode?: "pills" | "select";
  className?: string;
}

/**
 * Versatile filter selector supporting horizontal pill buttons or compact native dropdown.
 */
export function FilterDropdown<T extends string = string>({
  options,
  value,
  onChange,
  label = "Filter",
  mode = "pills",
  className,
}: FilterDropdownProps<T>) {
  const selectId = useId();

  if (mode === "select") {
    return (
      <div className={cn("relative inline-flex items-center", className)}>
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label}
          className="tb-focus-ring appearance-none rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] py-2 pl-3 pr-8 text-xs font-bold text-[var(--tb-text-primary)] shadow-2xs transition-colors hover:border-[var(--tb-primary)] focus:border-[var(--tb-primary)] focus:outline-hidden cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 size-3.5 text-[var(--tb-text-secondary)]"
        />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {options.map((opt) => {
        const isActive = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={isActive}
            className={cn(
              "tb-focus-ring rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-border-strong)]"
            )}
          >
            {opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EmptyState & LoadingSkeleton                                               */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon?: ReactNode;
  glyph?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  glyph,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--tb-border-strong)] bg-[var(--tb-surface)] p-8 text-center",
        className
      )}
    >
      {glyph ? (
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--tb-accent-soft)] font-japanese text-xl font-black text-[var(--primary-fg)]">
          {glyph}
        </div>
      ) : icon ? (
        <div className="mb-3 text-[var(--tb-text-secondary)] opacity-70">{icon}</div>
      ) : null}

      <h3 className="text-base font-bold text-[var(--tb-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[var(--tb-text-secondary)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2.5">{action}</div>}
    </div>
  );
}

export interface LoadingSkeletonProps {
  variant?: "card" | "list" | "header";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "card",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === "header") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading header"
        className={cn(
          "rounded-3xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-6 sm:p-8 space-y-3 animate-pulse",
          className
        )}
      >
        <div className="h-4 w-32 rounded-full bg-[var(--tb-surface-subtle)]" />
        <div className="h-8 w-64 max-w-full rounded-xl bg-[var(--tb-surface-subtle)]" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-[var(--tb-surface-subtle)]" />
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-label="Loading content"
      className={cn(
        variant === "card"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "space-y-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-20 rounded-md bg-[var(--tb-surface-subtle)]" />
            <div className="h-5 w-10 rounded-md bg-[var(--tb-surface-subtle)]" />
          </div>
          <div className="h-5 w-3/4 rounded-lg bg-[var(--tb-surface-subtle)]" />
          <div className="h-3.5 w-1/2 rounded-lg bg-[var(--tb-surface-subtle)]" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tooltip & ContextMenu                                                      */
/* -------------------------------------------------------------------------- */

export interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? tipId : undefined}
    >
      {children}
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-text-primary)] shadow-sm",
            position === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerLabel?: string;
  align?: "left" | "right";
  className?: string;
}

export function ContextMenu({
  items,
  triggerLabel = "More actions",
  align = "right",
  className,
}: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        className="tb-focus-ring inline-flex size-8 items-center justify-center rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors cursor-pointer"
      >
        <MoreVertical className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-1.5 min-w-[180px] rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface-elevated)] p-1.5 shadow-md",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "tb-focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                item.destructive
                  ? "text-[var(--tb-error)] hover:bg-[var(--tb-error-bg)]"
                  : "text-[var(--tb-text-primary)] hover:bg-[var(--tb-accent-soft)]/50"
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
