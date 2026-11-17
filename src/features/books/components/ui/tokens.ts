export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const TEXTBOOK_TOKENS = {
  colors: {
    bg: "var(--tb-bg, #F9F3EF)",
    surface: "var(--tb-surface, #FFFAF7)",
    surfaceElevated: "var(--tb-surface-elevated, #FFFFFF)",
    surfaceSubtle: "var(--tb-surface-subtle, #F4EAE4)",
    surfaceOverlay: "var(--surface-overlay, rgba(245, 150, 170, 0.08))",
    primary: "var(--tb-primary, #D0104C)",
    primaryHover: "var(--tb-primary-hover, #B10D40)",
    primaryFg: "var(--primary-fg, #D0104C)",
    accent: "var(--tb-accent, #F596AA)",
    accentSoft: "var(--tb-accent-soft, #FDEBF0)",
    textPrimary: "var(--tb-text-primary, #30272A)",
    textSecondary: "var(--tb-text-secondary, #887B7D)",
    border: "var(--tb-border, #EBDCE0)",
    borderStrong: "var(--tb-border-strong, #DFB8C3)",
    success: "var(--tb-success, #2E8B57)",
    warning: "var(--tb-warning, #D97706)",
    error: "var(--tb-error, #DC2626)",
    info: "var(--tb-info, #2563EB)",
  },
  spacing: {
    pageX: "px-4 sm:px-8",
    pageY: "py-6 sm:py-8",
    sectionGap: "space-y-6",
    cardPadding: "p-4 sm:p-5",
    cardPaddingLg: "p-5 sm:p-6",
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  },
} as const;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--tb-primary)] text-white border border-transparent shadow-xs hover:bg-[var(--tb-primary-hover)] active:scale-[0.98]",
  secondary:
    "bg-[var(--tb-surface)] text-[var(--tb-text-primary)] border border-[var(--tb-border)] shadow-2xs hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] hover:bg-[var(--tb-accent-soft)]/35 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--tb-text-secondary)] border border-transparent hover:text-[var(--tb-text-primary)] hover:bg-[var(--tb-accent-soft)]/40",
  destructive:
    "bg-[var(--tb-error)] text-white border border-transparent shadow-xs hover:opacity-90 active:scale-[0.98]",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-xl",
  md: "h-9 px-4 text-xs sm:text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-2xl",
};

export type StatusVariant =
  | "mastered"
  | "in-progress"
  | "due"
  | "new"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export const STATUS_BADGE_STYLES: Record<StatusVariant, string> = {
  mastered:
    "bg-[var(--tb-success-bg)] text-[var(--tb-success)] border-[var(--tb-success-border)]",
  success:
    "bg-[var(--tb-success-bg)] text-[var(--tb-success)] border-[var(--tb-success-border)]",
  "in-progress":
    "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] border-[var(--tb-border-strong)]",
  due:
    "bg-[var(--tb-warning-bg)] text-[var(--tb-warning)] border-[var(--tb-warning-border)]",
  warning:
    "bg-[var(--tb-warning-bg)] text-[var(--tb-warning)] border-[var(--tb-warning-border)]",
  error:
    "bg-[var(--tb-error-bg)] text-[var(--tb-error)] border-[var(--tb-error-border)]",
  info:
    "bg-[var(--tb-info-bg)] text-[var(--tb-info)] border-[var(--tb-info-border)]",
  new:
    "bg-[var(--tb-surface-subtle)] text-[var(--tb-text-secondary)] border-[var(--tb-border)]",
  neutral:
    "bg-[var(--tb-bg)] text-[var(--tb-text-secondary)] border-[var(--tb-border)]",
};

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1" | string;

export function getLevelBadgeStyle(level: JlptLevel): string {
  const normalized = String(level).toUpperCase().replace(/^JLPT\s*/i, "");
  switch (normalized) {
    case "N5":
    case "5":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "N4":
    case "4":
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
    case "N3":
    case "3":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "N2":
    case "2":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30";
    default:
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }
}

export interface PatternChip {
  text: string;
  category: "topic" | "particle" | "verb" | "adj" | "conjugation" | "auxiliary" | "general";
  label?: string;
}

/**
 * Parses a grammar pattern string into color-coded anatomical chips.
 */
export function parseGrammarPattern(pattern: string): PatternChip[] {
  const rawParts = pattern
    .split(/(\s*\+\s*|\s*・\s*|\s+)/)
    .filter((p) => p.trim().length > 0 && p.trim() !== "+");

  return rawParts.map((raw): PatternChip => {
    const text = raw.trim();
    const clean = text.replace(/^[〜~]/, "");

    if (/^(は|が|を|に|で|へ|と|も|から|まで|より|の|か|ね|よ)$/.test(clean)) {
      return { text, category: "particle", label: "Particle" };
    }

    if (/^(X|Y|A|B|Noun|Topic|Subject|Person|Place|Time|Thing)/i.test(clean)) {
      return { text, category: "topic", label: "Topic / Noun" };
    }

    if (
      /verb|て形|て-form|た形|た-form|ない形|ない-form|辞書形|stem|plain|ます|ません|ました|てから|ている|てください|てはいけません|てもいい|たい/i.test(
        clean
      )
    ) {
      return { text, category: "conjugation", label: "Conjugation" };
    }

    if (/adj|形容詞|い-adj|な-adj/i.test(clean)) {
      return { text, category: "adj", label: "Adjective" };
    }

    if (/^(です|でした|じゃありません|でしょう|〜か|〜ね|〜よ|と思います|と言いました)/.test(clean)) {
      return { text, category: "auxiliary", label: "Ending" };
    }

    return { text, category: "general" };
  });
}

export function getPatternChipClass(category: PatternChip["category"]): string {
  switch (category) {
    case "particle":
      return "border-amber-400/50 bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "topic":
      return "border-blue-400/50 bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "conjugation":
      return "border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "adj":
      return "border-purple-400/50 bg-purple-500/15 text-purple-700 dark:text-purple-300";
    case "auxiliary":
      return "border-rose-400/50 bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)]";
  }
}
