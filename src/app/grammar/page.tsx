"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookmarkPlus, BookOpen, Check, Search } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { grammarLevels, type GrammarCatalogEntry, type GrammarLevel } from "@/data/grammar";
import { getGrammarCatalogByLevel } from "@/lib/content/grammar";
import { addGrammarToSrs, getAllSrsItems } from "@/lib/srs/service";
import { AudioButton } from "@/components/ui/AudioButton";

const levelTabs: Array<{ key: "All" | GrammarLevel; label: string }> = [
  { key: "All", label: "All levels" },
  ...grammarLevels.map((level) => ({ key: level, label: level })),
];
const UNIT_SIZE = 12;

export default function GrammarLibraryPage() {
  const [selectedLevel, setSelectedLevel] = useState<"All" | GrammarLevel>("N5");
  const [searchQuery, setSearchQuery] = useState("");
  const [points, setPoints] = useState<GrammarCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [srsLoaded, setSrsLoaded] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getGrammarCatalogByLevel(selectedLevel)
      .then((loaded) => {
        if (active) {
          setPoints(loaded);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load grammar catalog.", error);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedLevel]);

  useEffect(() => {
    let active = true;
    getAllSrsItems()
      .then((items) => {
        if (!active) return;
        const ids = items
          .filter((item) => item.type === "grammar" && item.id.startsWith("grammar:"))
          .map((item) => item.id.slice("grammar:".length));
        setLearnedIds((current) => new Set([...current, ...ids]));
      })
      .catch((error: unknown) => console.error("Could not load grammar review progress.", error))
      .finally(() => {
        if (active) setSrsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const filteredPoints = query
    ? points.filter((point) =>
        [point.title, point.pattern, point.romaji, point.meaning].some((value) =>
          value.toLowerCase().includes(query)
        )
      )
    : points;
  const learnedCount = points.filter((point) => learnedIds.has(point.id)).length;
  const progress = points.length ? (learnedCount / points.length) * 100 : 0;
  const levelsToShow = grammarLevels.filter(
    (level) => selectedLevel === "All" || selectedLevel === level
  );

  async function handleSaveToSrs(point: GrammarCatalogEntry) {
    if (learnedIds.has(point.id) || savingIds.has(point.id)) return;
    setSavingIds((current) => new Set(current).add(point.id));
    try {
      await addGrammarToSrs({
        id: point.id,
        pattern: point.pattern,
        romaji: point.romaji,
        meaning: point.meaning,
        level: point.level,
      });
      setLearnedIds((current) => new Set(current).add(point.id));
    } catch (error) {
      console.error("Could not save grammar point to review.", error);
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(point.id);
        return next;
      });
    }
  }

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8">
        <header className="border-b border-[var(--line)] pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                JLPT N5-N1 Learning Path
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--ink)] sm:text-3xl">
                Grammar Reference
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                Move through grammar one unit at a time, and keep your saved patterns close.
              </p>
            </div>
            <Link
              href="/games/grammar"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--primary)] px-4 text-xs font-bold text-white transition hover:opacity-95"
            >
              Practice <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-end">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                  <BookOpen className="size-4 text-[var(--primary)]" />
                  Learning progress
                </span>
                <span className="min-w-28 text-right text-xs tabular-nums text-[var(--muted)]">
                  {srsLoaded ? `${learnedCount} / ${points.length} added` : "Checking review deck"}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-[var(--line)]"
                role="progressbar"
                aria-label="Grammar patterns added to review"
                aria-valuemin={0}
                aria-valuemax={points.length}
                aria-valuenow={learnedCount}
              >
                <div
                  className="h-full rounded-full bg-[var(--correct)] transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pattern or meaning"
                aria-label="Search grammar points"
                className="h-10 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] pr-4 pl-10 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="JLPT level">
            {levelTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                aria-pressed={selectedLevel === tab.key}
                onClick={() => setSelectedLevel(tab.key)}
                className={`min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition ${
                  selectedLevel === tab.key
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 pt-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Loading grammar path...</p>
          ) : filteredPoints.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">
              No grammar points match that search.
            </p>
          ) : (
            <div className="space-y-8">
              {levelsToShow.map((level) => {
                const levelPoints = filteredPoints.filter((point) => point.level === level);
                if (!levelPoints.length) return null;
                const levelLearned = levelPoints.filter((point) => learnedIds.has(point.id)).length;

                return (
                  <section key={level} aria-labelledby={`level-${level}`}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                          JLPT Level
                        </p>
                        <h2 id={`level-${level}`} className="mt-0.5 text-xl font-bold text-[var(--ink)]">
                          {level}
                        </h2>
                      </div>
                      <span className="text-xs tabular-nums text-[var(--muted)]">
                        {levelLearned} / {levelPoints.length} in review
                      </span>
                    </div>

                    <div className="ml-2 border-l-2 border-[var(--line)] pl-5 sm:ml-3 sm:pl-7">
                      {Array.from(
                        { length: Math.ceil(levelPoints.length / UNIT_SIZE) },
                        (_, unitIndex) => {
                          const start = unitIndex * UNIT_SIZE;
                          const unitPoints = levelPoints.slice(start, start + UNIT_SIZE);
                          const unitLearned = unitPoints.filter((point) => learnedIds.has(point.id)).length;
                          const isComplete = unitLearned === unitPoints.length;

                          return (
                            <details
                              key={`${level}-${unitIndex}`}
                              open={unitIndex === 0}
                              className="group relative pb-4 last:pb-0"
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute top-2 -left-[31px] grid size-6 place-items-center rounded-full border-2 bg-[var(--bg)] sm:-left-[39px] ${
                                  isComplete
                                    ? "border-[var(--correct)] text-[var(--correct)]"
                                    : "border-[var(--line)] text-[var(--muted)]"
                                }`}
                              >
                                {isComplete ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
                              </span>
                              <summary className="flex min-h-10 cursor-pointer list-none flex-wrap items-center justify-between gap-2 py-1 marker:hidden [&::-webkit-details-marker]:hidden">
                                <span className="font-semibold text-[var(--ink)]">
                                  Unit {String(unitIndex + 1).padStart(2, "0")}
                                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                                    Patterns {start + 1}-{start + unitPoints.length}
                                  </span>
                                </span>
                                <span className="text-xs tabular-nums text-[var(--muted)]">
                                  {unitLearned} / {unitPoints.length} learned
                                </span>
                              </summary>

                              <ol className="mt-2 divide-y divide-[var(--line)] border-t border-[var(--line)]">
                                {unitPoints.map((point) => {
                                  const learned = learnedIds.has(point.id);
                                  const saving = savingIds.has(point.id);
                                  return (
                                    <li
                                      key={point.id}
                                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
                                    >
                                      <Link
                                        href={`/grammar/${point.level}/${point.slug}`}
                                        className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                                      >
                                        <span lang="ja" className="font-japanese block truncate text-base font-semibold text-[var(--ink)] hover:text-[var(--primary)]">
                                          {point.pattern}
                                        </span>
                                        {point.romaji && (
                                          <span className="block truncate text-[11px] text-[var(--muted)]">
                                            {point.romaji}
                                          </span>
                                        )}
                                        <span className="mt-1 block text-sm leading-snug text-[var(--muted)] md:hidden">
                                          {point.meaning}
                                        </span>
                                      </Link>
                                      <p className="hidden min-w-0 text-sm leading-snug text-[var(--muted)] md:block">
                                        {point.meaning}
                                      </p>
                                      <div className="flex shrink-0 items-center gap-1 md:col-start-3">
                                        <AudioButton
                                          text={point.pattern}
                                          id={point.id}
                                          reading={point.romaji}
                                          mode="grammar"
                                          size="sm"
                                          label={`Listen to ${point.pattern}`}
                                        />
                                        <button
                                          type="button"
                                          disabled={learned || saving}
                                          onClick={() => void handleSaveToSrs(point)}
                                          aria-label={learned ? "Added to review" : "Add to review"}
                                          title={learned ? "Added to review" : "Add to review"}
                                          className={`grid size-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                                            learned
                                              ? "border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                                              : "border-[var(--line)] text-[var(--primary)] hover:bg-[var(--paper-tint)]"
                                          }`}
                                        >
                                          {learned ? <Check className="size-4" /> : <BookmarkPlus className="size-4" />}
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ol>
                            </details>
                          );
                        }
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
