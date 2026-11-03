"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
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

function LevelBadge({ doc }: { doc: LearnFrontmatter }) {
  const singleLevel = doc.levels.length === 1;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
        singleLevel
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
      }`}
    >
      {doc.jlpt}
    </span>
  );
}

export function LearnHubClient({ docs }: { docs: LearnFrontmatter[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
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
              className="group flex min-h-28 items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--sakura)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-lg font-bold text-[var(--primary-fg)]">
                {sheet.glyph}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  Personal · live
                </span>
                <span className="mt-1 block text-sm font-bold leading-snug">{sheet.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                  {sheet.description}
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

        <nav
          aria-label="Jump to a guide category"
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {learnCategories.map((category) => (
            <a
              key={category}
              href={`#${categoryId(category)}`}
              className="min-h-10 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
            >
              {category}
            </a>
          ))}
        </nav>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.14em]">Study Guides</h2>
        <span className="text-xs font-semibold text-[var(--muted)]">
          {filteredDocs.length} {filteredDocs.length === 1 ? "guide" : "guides"}
        </span>
      </div>

      <div className="space-y-9">
        {learnCategories.map((category) => {
          const categoryDocs = docsByCategory.get(category) ?? [];
          if (!categoryDocs.length) return null;
          return (
            <section
              key={category}
              id={categoryId(category)}
              aria-labelledby={`${categoryId(category)}-heading`}
              className="scroll-mt-6"
            >
              <div className="mb-4 flex items-center gap-3 border-b border-[var(--line)] pb-2">
                <BookOpen size={17} className="text-[var(--primary-fg)]" aria-hidden="true" />
                <h2
                  id={`${categoryId(category)}-heading`}
                  className="text-sm font-extrabold uppercase tracking-[0.12em]"
                >
                  {category}
                </h2>
                <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted)]">
                  {categoryDocs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
