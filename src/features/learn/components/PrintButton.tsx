"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="learn-no-print inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-bold text-[var(--ink)] transition hover:border-[var(--sakura)]"
    >
      Print / Save PDF
    </button>
  );
}
