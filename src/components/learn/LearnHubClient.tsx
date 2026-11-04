"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Search } from "lucide-react";
import { LearnGuideCover } from "@/components/learn/LearnGuideCover";
import {
  learnCategories,
  jlptLevels,
  type LearnCategory,
  type LearnFrontmatter,
} from "@/lib/content/learn-schema";

const pinnedGuides = [
  {
    slug: "jlpt-n5-survival-one-page-reference-sheet",
    label: "N5 one-page survival sheet",
    glyph: "五",
  },
  {
    slug: "jlpt-n4-upgrade-one-page-reference-sheet",
    label: "N4 one-page upgrade sheet",
    glyph: "四",
  },
];

const personalSheets = [
  {
    href: "/learn/mistake-bank",
    title: "Mistake Bank",
    description: "Collect recurring quiz errors and items that keep slipping.",
    glyph: "弱",
  },
  {
    href: "/learn/missed-kanji",
    title: "Kanji You Keep Missing",
    description: "A live sheet of kanji with lapses or high FSRS difficulty.",
    glyph: "漢",
  },
];

const categoryDetails: Record<LearnCategory, { glyph: string; description: string }> = {
  "Writing and sounds": { glyph: "音", description: "Kana, pronunciation, and the sounds that shape Japanese." },
  Kanji: { glyph: "漢", description: "Build recognition, readings, and confident kanji recall." },
  "Numbers, time and counting": { glyph: "数", description: "Read numbers, dates, clocks, and common counters." },
  Verbs: { glyph: "動", description: "Understand verb groups, forms, and everyday actions." },
  "Adjectives and adverbs": { glyph: "形", description: "Describe people, things, and how actions happen." },
  "Particles and grammar": { glyph: "文", description: "Connect ideas with particles and practical sentence patterns." },
  Vocabulary: { glyph: "語", description: "Grow useful words across topics and JLPT levels." },
  "Politeness and communication": { glyph: "礼", description: "Choose natural expressions for real conversations." },
  "Reading and exam skills": { glyph: "試", description: "Read efficiently and prepare for JLPT question types." },
  "Japan basics": { glyph: "日", description: "Get oriented with daily life, culture, and Japan essentials." },
  "Reference cards": { glyph: "典", description: "Compact all-level references for quick lookups." },
};

function LevelBadge({ doc }: { doc: LearnFrontmatter }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-xs whitespace-nowrap">
      {doc.jlpt}
    </span>
  );
}

export function LearnHubClient({ docs }: { docs: LearnFrontmatter[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [expandedCategories, setExpandedCategories] = useState<Set<LearnCategory>>(() => new Set());
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) => {
        const matchesLevel = level === "All" || doc.levels.includes(level as (typeof jlptLevels)[number]);
        const searchText = [
          doc.title,
          doc.category,
          doc.summary ?? "",
          ...(doc.keywords ?? []),
        ]
          .join(" ")
          .toLocaleLowerCase();
        return matchesLevel && (!normalizedQuery || searchText.includes(normalizedQuery));
      }),
    [docs, level, normalizedQuery]
  );
  const docsByCategory = useMemo(
    () =>
      new Map<LearnCategory, LearnFrontmatter[]>(
        learnCategories.map((category) => [
          category,
          filteredDocs.filter((doc) => doc.category === category),
        ])
      ),
    [filteredDocs]
  );
  const guideBySlug = useMemo(() => new Map(docs.map((doc) => [doc.slug, doc])), [docs]);

  return (
    <div>
      <section
        aria-label="Pinned reference and personal cards"
        className="mb-9 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-6"
      >
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
              Keep close
            </p>
            <h2 className="mt-1 text-lg font-extrabold">Reference &amp; Personal Cards</h2>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">{docs.length} guides</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pinnedGuides.map((guide) => {
            const doc = guideBySlug.get(guide.slug);
            if (!doc) return null;
            return (
              <Link
                key={guide.slug}
                href={`/learn/${doc.slug}`}
                className="group flex min-h-28 items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--sakura)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-lg font-bold text-[var(--primary-fg)]">
                  {guide.glyph}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    One-page reference
                  </span>
                  <span className="mt-1 block text-sm font-bold leading-snug">{guide.label}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)]">
                    Open sheet <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
          {personalSheets.map((sheet) => (
            <Link
              key={sheet.href}
              href={sheet.href}
              className="group relative flex min-h-36 items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 pr-16 transition hover:-translate-y-0.5 hover:border-[var(--sakura)]"
            >
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />Live
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-lg font-bold text-[var(--primary-fg)]">
                {sheet.glyph}
              </span>
              <span className="flex min-w-0 flex-1 flex-col self-stretch">
                <span className="block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Personal</span>
                <span className="mt-1 block text-sm font-bold leading-snug">{sheet.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                  {sheet.description}
                </span>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-[var(--primary-fg)]">
                  {sheet.href.endsWith("mistake-bank") ? "Open bank" : "View kanji"} <ArrowRight size={13} aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Filter study guides" className="mb-8 space-y-4">
        <label className="relative block">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides, topics, or keywords..."
            aria-label="Search guides, topics, or keywords"
            className="h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-11 pr-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]"
          />
        </label>

        <div className="flex flex-wrap gap-2" aria-label="Filter by JLPT level">
          {["All", ...jlptLevels].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={level === item}
              onClick={() => setLevel(item)}
              className={`min-h-10 rounded-full border px-4 text-xs font-bold transition ${
                level === item
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--sakura)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.14em]">Study Guides</h2>
        <span className="text-xs font-semibold text-[var(--muted)]">
          {filteredDocs.length} {filteredDocs.length === 1 ? "guide" : "guides"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {learnCategories.map((category) => {
          const categoryDocs = docsByCategory.get(category) ?? [];
          if (!categoryDocs.length) return null;
          const details = categoryDetails[category];
          const isExpanded = expandedCategories.has(category) || Boolean(normalizedQuery);
          const categoryLevels = jlptLevels.filter((item) => categoryDocs.some((doc) => doc.levels.includes(item)));
          return (
            <section
              key={category}
              id={categoryId(category)}
              aria-labelledby={`${categoryId(category)}-heading`}
              className={`scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm transition-colors ${isExpanded ? "md:col-span-2" : ""}`}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`${categoryId(category)}-guides`}
                onClick={() => setExpandedCategories((current) => {
                  const next = new Set(current);
                  if (next.has(category)) next.delete(category);
                  else next.add(category);
                  return next;
                })}
                className="group flex w-full flex-col text-left"
              >
                <span className="relative flex h-40 w-full items-center justify-center overflow-hidden border-b border-[var(--line)] bg-[var(--bg)]/50 sm:h-44">
                  <LearnGuideCover
                    src={categoryDocs[0]!.imageUrl}
                    fallback={categoryDocs[0]!.fallbackSvgUrl}
                    alt={`${category} study guide illustration`}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="flex w-full items-center gap-4 p-4 sm:p-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--bg)]">
                    <span className="relative grid size-11 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-xl font-bold text-[var(--primary-fg)]">
                      {details.glyph}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span id={`${categoryId(category)}-heading`} className="text-sm font-extrabold">{category}</span>
                      <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted)]">
                        {categoryDocs.length} {categoryDocs.length === 1 ? "guide" : "guides"}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">{details.description}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {categoryLevels.map((item) => <span key={item} className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">{item}</span>)}
                    </span>
                  </span>
                  <ArrowDown size={17} className={`shrink-0 text-[var(--muted)] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                </span>
              </button>
              <div
                id={`${categoryId(category)}-guides`}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
              >
              <div className="min-h-0 overflow-hidden">
              <div className="mx-4 mb-4 mt-0 grid grid-cols-1 gap-3.5 border-t border-[var(--line)] pt-4 sm:mx-5 sm:mb-5 md:grid-cols-2 lg:grid-cols-3">
                {categoryDocs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/learn/${doc.slug}`}
                    className="group flex min-h-36 flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--sakura)] hover:shadow-[0_14px_30px_rgba(208,16,76,0.08)]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-bold leading-snug">{doc.title}</span>
                      <LevelBadge doc={doc} />
                    </span>
                    {doc.summary && (
                      <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                        {doc.summary}
                      </span>
                    )}
                    <span className="mt-auto flex items-center justify-end pt-3 text-xs font-bold text-[var(--primary-fg)]">
                      Read guide <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                      </span>
                  </Link>
                ))}
              </div>
              </div>
              </div>
            </section>
          );
        })}
        {filteredDocs.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No guides match those filters. Try another level or search term.
          </p>
        )}
      </div>
    </div>
  );
}

function categoryId(category: string): string {
  return `learn-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`;
}
