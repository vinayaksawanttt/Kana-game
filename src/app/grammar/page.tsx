"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, BookmarkPlus, BookOpen, Search } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { grammarLevels, type GrammarLevel, type GrammarPoint } from "@/data/grammar";
import { getGrammarListByLevel } from "@/lib/content/grammar";
import { addGrammarToSrs } from "@/lib/srs/service";

const levelTabs: Array<{ key: "All" | GrammarLevel; label: string }> = [
  { key: "All", label: "All" },
  ...grammarLevels.map((lvl) => ({ key: lvl, label: lvl })),
];

export default function GrammarLibraryPage() {
  const [selectedLevel, setSelectedLevel] = useState<"All" | GrammarLevel>("N5");
  const [searchQuery, setSearchQuery] = useState("");
  const [points, setPoints] = useState<GrammarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getGrammarListByLevel(selectedLevel)
      .then((loaded) => {
        if (active) {
          setPoints(loaded);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load grammar list.", error);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedLevel]);

  const filteredPoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return points;
    return points.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.pattern.toLowerCase().includes(query) ||
        p.romaji.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query)
    );
  }, [points, searchQuery]);

  async function handleSaveToSrs(point: GrammarPoint) {
    await addGrammarToSrs({
      id: point.id,
      pattern: point.pattern,
      romaji: point.romaji,
      meaning: point.short || point.long,
      level: point.level,
    });
    setSavedIds((prev) => new Set(prev).add(point.id));
  }

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-6 px-5 sm:px-8">
        <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--primary)] uppercase">
                JLPT N5–N1 Reference Hub
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-3xl">
                Grammar Reference Library
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
                Explore {points.length || "800+"} Japanese grammar patterns with formations, example
                sentences, interactive games, and 1-tap FSRS review saving.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)]">
                <BookOpen className="size-3.5 text-[var(--primary)]" />
                {filteredPoints.length} {filteredPoints.length === 1 ? "pattern" : "patterns"}
              </span>
              <Link
                href="/games/grammar"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--primary)] px-5 text-xs font-bold text-white transition hover:opacity-95"
              >
                <span>Practice Grammar Games</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="JLPT Level Filter">
              {levelTabs.map((tab) => {
                const active = selectedLevel === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedLevel(tab.key)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                        : "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pattern, romaji, meaning..."
                aria-label="Search grammar points"
                className="h-10 w-full rounded-full border border-[var(--line)] bg-[var(--paper-tint)] pr-4 pl-10 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid flex-1 place-items-center py-16 text-sm text-[var(--muted)]">
            Loading grammar patterns...
          </div>
        ) : (
          <section
            aria-label="Grammar points list"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredPoints.map((point) => {
              const isSaved = savedIds.has(point.id);
              return (
                <article
                  key={point.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] transition hover:border-[var(--primary)]/60"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                        {point.level}
                      </span>
                      <button
                        type="button"
                        disabled={isSaved}
                        onClick={() => void handleSaveToSrs(point)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                          isSaved
                            ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                            : "border-[var(--line)] bg-[var(--paper-tint)] text-[var(--ink)] hover:border-[var(--primary)]"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="size-3" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="size-3 text-[var(--primary)]" />
                            <span>Add to FSRS</span>
                          </>
                        )}
                      </button>
                    </div>

                    <Link href={`/grammar/${point.level}/${point.slug}`} className="group block mt-3">
                      <h2
                        lang="ja"
                        className="font-japanese text-xl font-bold text-[var(--ink)] transition group-hover:text-[var(--primary)]"
                      >
                        {point.pattern}
                      </h2>
                      {point.romaji && (
                        <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                          {point.romaji}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ink)]">
                        {point.short}
                      </p>
                    </Link>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs font-semibold text-[var(--primary)]">
                    <Link
                      href={`/grammar/${point.level}/${point.slug}`}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                    <span className="text-[11px] font-normal text-[var(--muted)]">
                      {point.examples.length} examples
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </GameLayout>
  );
}

