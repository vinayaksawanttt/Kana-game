"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Filter, Layers } from "lucide-react";

export interface ModuleCardConfig {
  title: string;
  subtitleJa: string;
  description: string;
  badge: string;
  href: string;
  soon?: boolean;
  statusLabel?: string;
  tags?: string[];
}

export interface HubSectionConfig {
  id: string;
  filterLabel: string;
  title: string;
  titleJa: string;
  description: string;
  cards: ModuleCardConfig[];
}

function ModuleCard({
  title,
  subtitleJa,
  description,
  badge,
  href,
  soon,
  statusLabel,
  tags = [],
}: ModuleCardConfig) {
  const contents = (
    <>
      {/* Subtle decorative corner watermark glyph */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-4 select-none font-japanese text-8xl font-bold text-[var(--primary-fg)] opacity-[0.045] transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.09]"
      >
        {badge}
      </span>

      <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)] font-japanese text-2xl font-bold text-[var(--primary-fg)] shadow-xs transition-transform duration-200 group-hover:scale-105">
            {badge}
          </span>
          <span className="font-japanese text-xs font-bold tracking-wider text-[var(--muted)]">
            {subtitleJa}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
            soon
              ? "bg-[var(--sakura-light)] text-[var(--muted)]"
              : "bg-[var(--correct)]/15 text-[var(--correct)]"
          }`}
        >
          {soon ? "Coming soon" : statusLabel ?? "Ready"}
        </span>
      </div>

      <h3 className="relative z-10 text-lg font-bold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--primary-fg)]">
        {title}
      </h3>
      <p className="relative z-10 mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>

      {tags.length > 0 && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[var(--line)] bg-[var(--paper-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <span className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--line)]/70 pt-3.5 text-xs font-bold text-[var(--primary-fg)]">
        <span>{soon ? "In development" : "Explore Module"}</span>
        {!soon && (
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}
      </span>
    </>
  );

  const className =
    "group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_34px_rgba(188,0,45,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_20px_40px_rgba(208,16,76,0.12)] sm:p-6";

  return soon ? (
    <div aria-disabled="true" className={`${className} opacity-75`}>
      {contents}
    </div>
  ) : (
    <Link href={href} className={className}>
      {contents}
    </Link>
  );
}

interface GamesHubCatalogProps {
  sections: HubSectionConfig[];
}

export function GamesHubCatalog({ sections }: GamesHubCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const totalModules = sections.reduce((sum, section) => sum + section.cards.length, 0);
  const visibleSections =
    activeCategory === "all"
      ? sections
      : sections.filter((section) => section.id === activeCategory);

  return (
    <div id="category-catalog">
      {/* Interactive Category Filter Pill Bar */}
      <div
        role="region"
        aria-label="Category filter"
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-[0_10px_28px_rgba(188,0,45,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5"
      >
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
          <Filter className="size-3.5 text-[var(--primary-fg)]" aria-hidden="true" />
          <span>Filter by Goal</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Module categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeCategory === "all"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "border border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)] hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
            }`}
          >
            <span>All</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {totalModules}
            </span>
          </button>

          {sections.map((section) => {
            const isSelected = activeCategory === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(section.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "border border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)] hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
                }`}
              >
                <span>{section.filterLabel}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  {section.cards.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Sections */}
      {visibleSections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="mb-12"
        >
          <div className="mb-5 flex flex-col justify-between gap-1 border-b border-[var(--line)] pb-3 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id={`${section.id}-heading`}
                  className="text-base font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]"
                >
                  {section.title}
                </h2>
                <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                  · {section.titleJa}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card) => (
              <ModuleCard key={card.title} {...card} />
            ))}

            {/* Reference & Tools Companion Panel: Interactive Morphological Breakdown Preview */}
            {section.id === "reference-tools" && (
              <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-5 sm:col-span-2 sm:p-6 lg:col-span-3">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                        <Layers className="size-3.5" />
                        Live Morphological Engine Preview
                      </span>
                      <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                        · 形態素解析・Kuromoji
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                      Paste any Japanese sentence into the analyzer to inspect parts of speech, dictionary base forms, readings, and constituent kanji cards:
                    </p>
                  </div>

                  <Link
                    href="/dictionary"
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-[var(--sakura)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--primary-fg)] transition-colors hover:border-[var(--primary)] lg:self-center"
                  >
                    <span>Open Sentence Analyzer</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                  {[
                    { surface: "彼", reading: "かれ", pos: "Noun" },
                    { surface: "は", reading: "わ", pos: "Particle" },
                    { surface: "疲れて", reading: "つかれて", pos: "Verb (連用)" },
                    { surface: "いた", reading: "いた", pos: "Aux Verb" },
                    { surface: "。しかし、", reading: "しかし", pos: "Conjunction" },
                    { surface: "宿題", reading: "しゅくだい", pos: "Noun" },
                    { surface: "を", reading: "お", pos: "Particle" },
                    { surface: "終わらせた", reading: "おわらせた", pos: "Verb (Causative)" },
                  ].map((token, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center rounded-lg border border-[var(--sakura)]/50 bg-[var(--sakura-light)]/50 px-2.5 py-1.5 text-center"
                    >
                      <span className="text-[10px] font-semibold text-[var(--muted)]">
                        {token.reading}
                      </span>
                      <span className="font-japanese text-sm font-bold text-[var(--ink)]">
                        {token.surface}
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase text-[var(--primary-fg)]">
                        {token.pos}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
