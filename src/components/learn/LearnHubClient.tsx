"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
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
  const [sortBy, setSortBy] = useState<"default" | "title" | "jlpt">("default");
  const [expandedCategories, setExpandedCategories] = useState<Set<LearnCategory>>(() => new Set());
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const countByLevel = useMemo(() => {
    const map: Record<string, number> = { All: docs.length };
    for (const lvl of jlptLevels) {
      map[lvl] = docs.filter((d) => d.levels.includes(lvl)).length;
    }
    return map;
  }, [docs]);

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

  const sortedDocs = useMemo(() => {
    if (sortBy === "title") {
      return [...filteredDocs].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "jlpt") {
      const levelOrder: Record<string, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
      return [...filteredDocs].sort((a, b) => {
        const aMin = Math.min(...a.levels.map((l) => levelOrder[l] ?? 99));
        const bMin = Math.min(...b.levels.map((l) => levelOrder[l] ?? 99));
        return aMin - bMin || a.title.localeCompare(b.title);
      });
    }
    return filteredDocs;
  }, [filteredDocs, sortBy]);

  const docsByCategory = useMemo(
    () =>
      new Map<LearnCategory, LearnFrontmatter[]>(
        learnCategories.map((category) => [
          category,
          sortedDocs.filter((doc) => doc.category === category),
        ])
      ),
    [sortedDocs]
  );

  const guideBySlug = useMemo(() => new Map(docs.map((doc) => [doc.slug, doc])), [docs]);
  const isFiltered = Boolean(query || level !== "All" || sortBy !== "default");

  return (
    <div>
      <section
        aria-label="Pinned reference and personal cards"
        className="mb-9 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3.5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
              Core Reference Cheatsheets
            </p>
            <h2 className="mt-0.5 text-lg font-extrabold text-[var(--ink)]">
              Reference &amp; Personal Cards
            </h2>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">
            {docs.length} total guides
          </span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {pinnedGuides.map((guide) => {
            const doc = guideBySlug.get(guide.slug);
            if (!doc) return null;
            return (
              <Link
                key={guide.slug}
                href={`/learn/${doc.slug}`}
                className="group flex min-h-32 flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--sakura-light)] font-japanese text-lg font-bold text-[var(--primary)]">
                    {guide.glyph}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      One-Page Cheatsheet
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors">
                      {guide.label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2.5 text-xs font-bold text-[var(--primary)]">
                  <span className="text-[11px] font-semibold text-[var(--muted)]">{doc.jlpt}</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open sheet <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
          {personalSheets.map((sheet) => (
            <Link
              key={sheet.href}
              href={sheet.href}
              className="group relative flex min-h-32 flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 font-japanese text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {sheet.glyph}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Personal Study
                      </span>
                      <span className="mt-1 block text-sm font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors">
                        {sheet.title}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Live
                  </span>
                </div>
                <span className="mt-2 block text-xs leading-relaxed text-[var(--muted)] line-clamp-2">
                  {sheet.description}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-end border-t border-[var(--line)] pt-2.5 text-xs font-bold text-[var(--primary)]">
                <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {sheet.href.endsWith("mistake-bank") ? "Open bank" : "View kanji"} <ArrowRight size={13} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Filter and Search Section */}
      <section aria-label="Filter study guides" className="mb-6 space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="relative">
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
              className="h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-11 pr-10 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] transition hover:bg-[var(--line)]/50 hover:text-[var(--ink)]"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[var(--muted)] shrink-0 hidden sm:block" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "default" | "title" | "jlpt")}
              aria-label="Sort guides"
              className="h-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-semibold text-[var(--ink)] outline-none transition hover:border-[var(--primary)]/60 focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="default">Sort: Topic Category</option>
              <option value="title">Sort: Title (A–Z)</option>
              <option value="jlpt">Sort: JLPT Level (N5 → N1)</option>
            </select>
          </div>
        </div>

        {/* JLPT Level Multi-Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Filter by JLPT level">
          {["All", ...jlptLevels].map((item) => (
            <button
              key={item}
              type="button"
              aria-label={item}
              aria-pressed={level === item}
              onClick={() => setLevel(item)}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                level === item
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60"
              }`}
            >
              <span>{item}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  level === item ? "bg-white/25 text-white" : "bg-[var(--paper-tint)] text-[var(--muted)]"
                }`}
              >
                {countByLevel[item] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Active Filter Bar */}
        {isFiltered && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--sakura-light)]/50 px-3.5 py-2 text-xs font-semibold">
            <div className="flex flex-wrap items-center gap-2 text-[var(--ink)]">
              <span>
                Showing <strong>{filteredDocs.length}</strong> of {docs.length} guides
              </span>
              {level !== "All" && (
                <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                  Level: {level}
                </span>
              )}
              {query && (
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink)]">
                  &ldquo;{query}&rdquo;
                </span>
              )}
              {sortBy !== "default" && (
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                  Sorted: {sortBy === "title" ? "A–Z" : "JLPT"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLevel("All");
                setSortBy("default");
              }}
              className="inline-flex cursor-pointer items-center gap-1 font-bold text-[var(--primary)] hover:underline"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset filters
            </button>
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-2.5">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
          Study Guides by Topic
        </h2>
        <span className="text-xs font-semibold text-[var(--muted)]">
          {filteredDocs.length} {filteredDocs.length === 1 ? "guide" : "guides"} available
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {learnCategories.map((category) => {
          const categoryDocs = docsByCategory.get(category) ?? [];
          if (!categoryDocs.length) return null;
          const details = categoryDetails[category];
          const isExpanded = expandedCategories.has(category) || Boolean(normalizedQuery);
          const categoryLevels = jlptLevels.filter((item) =>
            categoryDocs.some((doc) => doc.levels.includes(item))
          );
          return (
            <section
              key={category}
              id={categoryId(category)}
              aria-labelledby={`${categoryId(category)}-heading`}
              className={`scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xs transition-colors ${
                isExpanded ? "md:col-span-2 border-[var(--primary)]/40 shadow-sm" : ""
              }`}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`${categoryId(category)}-guides`}
                onClick={() =>
                  setExpandedCategories((current) => {
                    const next = new Set(current);
                    if (next.has(category)) next.delete(category);
                    else next.add(category);
                    return next;
                  })
                }
                className="group flex w-full flex-col text-left cursor-pointer"
              >
                <span className="relative flex h-28 w-full items-center justify-center overflow-hidden border-b border-[var(--line)] bg-gradient-to-b from-[var(--sakura-light)]/40 via-[var(--paper-tint)]/60 to-[var(--surface)] sm:h-32">
                  <LearnGuideCover
                    src={categoryDocs[0]!.imageUrl}
                    fallback={categoryDocs[0]!.fallbackSvgUrl}
                    alt={`${category} study guide illustration`}
                    className="p-2 sm:p-2.5 drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--surface)] to-transparent" />
                </span>
                <span className="flex w-full items-center gap-3.5 p-4 sm:p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--bg)] shadow-xs">
                    <span className="relative grid size-9 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-lg font-bold text-[var(--primary-fg)]">
                      {details.glyph}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        id={`${categoryId(category)}-heading`}
                        className="text-base font-extrabold text-[var(--ink)]"
                      >
                        {category}
                      </span>
                      <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary-fg)]">
                        {categoryDocs.length} {categoryDocs.length === 1 ? "guide" : "guides"}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                      {details.description}
                    </span>
                    <span className="mt-2.5 flex flex-wrap gap-1.5">
                      {categoryLevels.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-tint)] text-[var(--muted)] transition-colors group-hover:border-[var(--primary)] group-hover:text-[var(--primary)]">
                    <ArrowDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </button>
              <div
                id={`${categoryId(category)}-guides`}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-[var(--line)] bg-[var(--paper-tint)]/30 p-4 sm:p-5">
                    <div className="mb-3.5 flex items-center justify-between text-xs font-bold text-[var(--muted)]">
                      <span className="uppercase tracking-wider">Guides in this category</span>
                      <span>
                        {categoryDocs.length} {categoryDocs.length === 1 ? "guide" : "guides"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryDocs.map((doc) => (
                        <Link
                          key={doc.slug}
                          href={`/learn/${doc.slug}`}
                          className="group flex min-h-36 flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md cursor-pointer"
                        >
                          <span className="flex items-start justify-between gap-2.5">
                            <span className="font-bold text-sm leading-snug text-[var(--ink)] group-hover:text-[var(--primary)] transition-colors">
                              {doc.title}
                            </span>
                            <LevelBadge doc={doc} />
                          </span>
                          {doc.summary && (
                            <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                              {doc.summary}
                            </span>
                          )}
                          <span className="mt-auto flex items-center justify-end pt-3 text-xs font-bold text-[var(--primary)]">
                            <span>Read guide</span>
                            <ArrowRight
                              size={13}
                              className="ml-1 transition-transform group-hover:translate-x-1"
                              aria-hidden="true"
                            />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
        {filteredDocs.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
            <p className="font-bold text-base text-[var(--ink)]">No guides match those filters</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Try searching a different term or reset your JLPT level filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLevel("All");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function categoryId(category: string): string {
  return `learn-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`;
}
