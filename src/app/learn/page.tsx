import type { Metadata } from "next";
import { LearnHeader } from "@/components/learn/LearnHeader";
import { LearnHubClient } from "@/components/learn/LearnHubClient";
import { getAllLearnDocs } from "@/lib/content/learn";

export const metadata: Metadata = {
  title: "Learning Hub | Japanese Practice",
  description: "Browse Japanese study guides, JLPT reference sheets, and personal review cards.",
};

export default function LearnPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--ink)]">
      <LearnHeader />
      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-6 sm:px-8 sm:pt-8">
        <header className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary-fg)]">
            Learn at your own pace
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Learning Hub</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Clear Japanese reference guides, grouped by topic and JLPT level. Find a quick answer,
            then turn it into practice.
          </p>
        </header>
        <LearnHubClient docs={getAllLearnDocs()} />
      </div>
    </main>
  );
}
