import type { Metadata } from "next";
import { Sparkles, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { LearnHeader } from "@/components/learn/LearnHeader";
import { LearnHubClient } from "@/components/learn/LearnHubClient";
import { getAllLearnDocs } from "@/lib/content/learn";

export const metadata: Metadata = {
  title: "Learning Hub | Japanese Practice",
  description: "Browse Japanese study guides, JLPT reference sheets, and personal review cards.",
};

export default function LearnPage() {
  const docs = getAllLearnDocs();

  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">
      <LearnHeader />
      <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
              <Sparkles className="size-3" aria-hidden="true" />
              Japanese Study Library · 学習ハブ
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              Learning Hub
            </h1>
            <span className="font-japanese text-lg font-medium text-[var(--muted)]">
              リファレンス &amp; チートシート
            </span>
          </div>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            High-yield Japanese reference sheets, topic breakdowns, and personalized mistake reviews. Look up structures instantly, then jump straight into practice.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1">
              <BookOpen className="size-3.5 text-[var(--primary)]" aria-hidden="true" />
              <strong>{docs.length}</strong> Study Guides
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1">
              <Layers className="size-3.5 text-[var(--primary)]" aria-hidden="true" />
              <strong>11</strong> Categories
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              JLPT N5–N1 Covered
            </span>
          </div>
        </header>
        <LearnHubClient docs={docs} />
      </div>
    </main>
  );
}
