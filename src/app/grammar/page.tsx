"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkPlus,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
  X,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { grammarLevels, isGrammarLevel, type GrammarCatalogEntry, type GrammarLevel } from "@/data/grammar";
import { getGrammarCatalogByLevel } from "@/lib/content/grammar";
import { addGrammarToSrs, getAllSrsItems } from "@/lib/srs/service";
import { AudioButton } from "@/components/ui/AudioButton";
import { romajiToHiragana } from "@/engine/shiritori";

const levelTabs: Array<{ key: "All" | GrammarLevel; label: string }> = [
  { key: "All", label: "All levels" },
  ...grammarLevels.map((level) => ({ key: level, label: level })),
];

type StatusFilter = "all" | "learned" | "unlearned" | "bookmarked";

const UNIT_SIZE = 12;
const INDEX_STATE_KEY = "grammar-index-state";
const BOOKMARK_STORAGE_KEY = "grammar-bookmarked-ids";
const MASTERED_STORAGE_KEY = "grammar-mastered-ids";

interface PersistedIndexState {
  selectedLevel?: "All" | GrammarLevel;
  statusFilter?: StatusFilter;
  searchQuery?: string;
  openUnits?: string[];
}

export default function GrammarLibraryPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<"All" | GrammarLevel>("N5");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [points, setPoints] = useState<GrammarCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inReviewIds, setInReviewIds] = useState<Set<string>>(new Set());
  const [srsMasteredIds, setSrsMasteredIds] = useState<Set<string>>(new Set());
  const [manualMasteredIds, setManualMasteredIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [openUnits, setOpenUnits] = useState<Set<string>>(() => new Set(["N5-0", "N4-0", "N3-0", "N2-0", "N1-0"]));
  const [srsLoaded, setSrsLoaded] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [hydratedState, setHydratedState] = useState(false);

  // Restore persisted UI state (level, filter, search, expanded units) and bookmarks
  useEffect(() => {
    try {
      const rawState = sessionStorage.getItem(INDEX_STATE_KEY);
      if (rawState) {
        const parsed = JSON.parse(rawState) as PersistedIndexState;
        /* eslint-disable react-hooks/set-state-in-effect */
        if (parsed.selectedLevel === "All" || (parsed.selectedLevel && isGrammarLevel(parsed.selectedLevel))) {
          setSelectedLevel(parsed.selectedLevel);
        }
        if (
          parsed.statusFilter === "all" ||
          parsed.statusFilter === "learned" ||
          parsed.statusFilter === "unlearned" ||
          parsed.statusFilter === "bookmarked"
        ) {
          setStatusFilter(parsed.statusFilter);
        }
        if (typeof parsed.searchQuery === "string") {
          setSearchQuery(parsed.searchQuery);
        }
        if (Array.isArray(parsed.openUnits) && parsed.openUnits.length > 0) {
          setOpenUnits(new Set(parsed.openUnits));
        }
      }

      const rawBookmarks = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (rawBookmarks) {
        const parsedBookmarks = JSON.parse(rawBookmarks) as unknown;
        if (Array.isArray(parsedBookmarks)) {
          setBookmarkedIds(new Set(parsedBookmarks.filter((x): x is string => typeof x === "string")));
        }
      }

      const rawMastered = localStorage.getItem(MASTERED_STORAGE_KEY);
      if (rawMastered) {
        const parsedMastered = JSON.parse(rawMastered) as unknown;
        if (Array.isArray(parsedMastered)) {
          setManualMasteredIds(new Set(parsedMastered.filter((x): x is string => typeof x === "string")));
        }
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // Ignore storage errors
    }
    setHydratedState(true);
  }, []);

  // Persist index navigation state whenever it changes
  useEffect(() => {
    if (!hydratedState) return;
    try {
      const stateToSave: PersistedIndexState = {
        selectedLevel,
        statusFilter,
        searchQuery,
        openUnits: Array.from(openUnits),
      };
      sessionStorage.setItem(INDEX_STATE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
  }, [hydratedState, selectedLevel, statusFilter, searchQuery, openUnits]);

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
        const grammarItems = items.filter(
          (item) => item.type === "grammar" && item.id.startsWith("grammar:")
        );
        const reviewSet = new Set<string>();
        const masteredSet = new Set<string>();

        for (const item of grammarItems) {
          const id = item.id.slice("grammar:".length);
          reviewSet.add(id);
          if ((item.card?.reps ?? 0) > 0 || (item.card?.state ?? 0) >= 2) {
            masteredSet.add(id);
          }
        }

        setInReviewIds((current) => new Set([...current, ...reviewSet]));
        setSrsMasteredIds((current) => new Set([...current, ...masteredSet]));
      })
      .catch((error: unknown) => console.error("Could not load grammar review progress.", error))
      .finally(() => {
        if (active) setSrsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Combined sets for Learned, In Review, and Active (Learned + In Review)
  const masteredIds = useMemo(
    () => new Set([...srsMasteredIds, ...manualMasteredIds]),
    [srsMasteredIds, manualMasteredIds]
  );

  const activeLearnedIds = useMemo(
    () => new Set([...inReviewIds, ...masteredIds]),
    [inReviewIds, masteredIds]
  );

  const progressStats = useMemo(() => {
    const total = points.length;
    let masteredCount = 0;
    let inReviewCount = 0;
    let activeCount = 0;

    for (const point of points) {
      const isMastered = masteredIds.has(point.id);
      const isInReview = inReviewIds.has(point.id);
      if (isMastered) {
        masteredCount += 1;
        activeCount += 1;
      } else if (isInReview) {
        inReviewCount += 1;
        activeCount += 1;
      }
    }

    const notStartedCount = Math.max(0, total - activeCount);
    const masteredPct = total > 0 ? (masteredCount / total) * 100 : 0;
    const inReviewPct = total > 0 ? (inReviewCount / total) * 100 : 0;
    const totalPct = total > 0 ? (activeCount / total) * 100 : 0;

    return {
      total,
      masteredCount,
      inReviewCount,
      activeCount,
      notStartedCount,
      masteredPct,
      inReviewPct,
      totalPct,
    };
  }, [points, masteredIds, inReviewIds]);

  const filteredPoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const kanaQuery = query && /^[a-z\s-]+$/i.test(query) ? romajiToHiragana(query) : "";

    return points.filter((point) => {
      const isLearnedOrReview = activeLearnedIds.has(point.id);
      const isBookmarked = bookmarkedIds.has(point.id);

      if (statusFilter === "learned" && !isLearnedOrReview) return false;
      if (statusFilter === "unlearned" && isLearnedOrReview) return false;
      if (statusFilter === "bookmarked" && !isBookmarked) return false;

      if (!query) return true;

      const fields = [point.title, point.pattern, point.romaji, point.meaning, point.slug];
      const directMatch = fields.some((value) => value && value.toLowerCase().includes(query));
      if (directMatch) return true;

      if (kanaQuery && kanaQuery !== query) {
        return [point.title, point.pattern].some((value) => value && value.includes(kanaQuery));
      }
      return false;
    });
  }, [points, searchQuery, statusFilter, activeLearnedIds, bookmarkedIds]);

  const levelsToShow = grammarLevels.filter(
    (level) => selectedLevel === "All" || selectedLevel === level
  );

  function toggleBookmark(pointId: string) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      try {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }

  function toggleUnit(unitKey: string, isOpen: boolean) {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      if (isOpen) {
        next.add(unitKey);
      } else {
        next.delete(unitKey);
      }
      return next;
    });
  }

  function toggleAllUnitsForLevel(level: GrammarLevel, unitCount: number, expand: boolean) {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < unitCount; i++) {
        const key = `${level}-${i}`;
        if (expand) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  async function handleSaveToSrs(point: GrammarCatalogEntry) {
    if (activeLearnedIds.has(point.id) || savingIds.has(point.id)) return;
    setSavingIds((current) => new Set(current).add(point.id));
    try {
      await addGrammarToSrs({
        id: point.id,
        pattern: point.pattern,
        romaji: point.romaji,
        meaning: point.meaning,
        level: point.level,
      });
      setInReviewIds((current) => new Set(current).add(point.id));
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

  const bookmarkedCountInScope = useMemo(
    () => points.filter((p) => bookmarkedIds.has(p.id)).length,
    [points, bookmarkedIds]
  );

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-5 py-6 sm:px-8">
        <header className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-4 sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                JLPT N5–N1 Learning Path
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--ink)] sm:text-3xl">
                Grammar Reference
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                Move through grammar one unit at a time, listen to natural examples, and keep your saved patterns close.
              </p>
            </div>
            <Link
              href="/games/grammar"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)]"
            >
              Practice Grammar <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Unified Toolbar & Progress Card */}
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-xs sm:p-5">
            {/* Section A: Compact Full-Width Progress Strip */}
            <div className="border-b border-[var(--line)] pb-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <BookOpen className="size-4 text-[var(--primary)]" />
                  Learning progress
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--correct)]" />
                    Learned:{" "}
                    <strong className="text-[var(--ink)] tabular-nums">
                      {progressStats.masteredCount}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--primary)]" />
                    In Review:{" "}
                    <strong className="text-[var(--ink)] tabular-nums">
                      {progressStats.inReviewCount}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--line)]" />
                    Not Started:{" "}
                    <strong className="text-[var(--ink)] tabular-nums">
                      {progressStats.notStartedCount}
                    </strong>
                  </span>
                  <span className="text-xs font-semibold text-[var(--muted)] tabular-nums">
                    {srsLoaded
                      ? `${progressStats.activeCount} / ${progressStats.total} started (${Math.round(progressStats.totalPct)}%)`
                      : "Checking review deck"}
                  </span>
                </div>
              </div>

              <div
                className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--line)]"
                role="progressbar"
                aria-label="Grammar patterns added to review"
                aria-valuemin={0}
                aria-valuemax={progressStats.total}
                aria-valuenow={progressStats.activeCount}
              >
                {progressStats.masteredPct > 0 && (
                  <div
                    className="h-full bg-[var(--correct)] transition-[width] duration-300"
                    style={{ width: `${progressStats.masteredPct}%` }}
                  />
                )}
                {progressStats.inReviewPct > 0 && (
                  <div
                    className="h-full bg-[var(--primary)] transition-[width] duration-300"
                    style={{ width: `${progressStats.inReviewPct}%` }}
                  />
                )}
              </div>
            </div>

            {/* Section B: Level Tabs + Search Input Row */}
            <div className="flex flex-col gap-3 pt-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div
                className="inline-flex items-center gap-1 overflow-x-auto rounded-xl bg-[var(--paper-tint)] p-1"
                role="group"
                aria-label="JLPT level"
              >
                {levelTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={selectedLevel === tab.key}
                    onClick={() => setSelectedLevel(tab.key)}
                    className={`min-h-8 shrink-0 rounded-lg px-3.5 text-xs font-bold transition cursor-pointer ${
                      selectedLevel === tab.key
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--ink)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-96">
                <label className="relative block">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search pattern, reading, romaji, or meaning..."
                    aria-label="Search grammar points"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-tint)]/60 pr-9 pl-9 text-xs font-medium text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:outline-none"
                  />
                </label>
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Section C: Status Filter Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)]/60 pt-3">
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filter by learning status"
              >
                {(
                  [
                    ["all", `All (${points.length})`],
                    ["learned", `Learned / Review (${progressStats.activeCount})`],
                    ["unlearned", `Unlearned (${progressStats.notStartedCount})`],
                    ["bookmarked", `Bookmarked (${bookmarkedCountInScope})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={statusFilter === key}
                    onClick={() => setStatusFilter(key)}
                    className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                      statusFilter === key
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "bg-[var(--paper-tint)]/70 text-[var(--muted)] hover:bg-[var(--paper-tint)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium text-[var(--muted)] tabular-nums">
                Showing <strong className="text-[var(--ink)]">{filteredPoints.length}</strong> of{" "}
                <strong className="text-[var(--ink)]">{points.length}</strong> patterns
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 pt-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Loading grammar path...</p>
          ) : filteredPoints.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-12 text-center">
              <p className="text-sm font-semibold text-[var(--ink)]">
                No grammar points match that search or filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-4 text-xs font-bold text-[var(--primary)] hover:border-[var(--primary)] cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {levelsToShow.map((level) => {
                const levelPoints = filteredPoints.filter((point) => point.level === level);
                if (!levelPoints.length) return null;
                const levelLearned = levelPoints.filter((point) =>
                  activeLearnedIds.has(point.id)
                ).length;
                const unitCount = Math.ceil(levelPoints.length / UNIT_SIZE);
                const allExpanded = Array.from({ length: unitCount }, (_, idx) =>
                  openUnits.has(`${level}-${idx}`)
                ).every(Boolean);

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
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                          {levelLearned} / {levelPoints.length} in review
                        </span>
                        {unitCount > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleAllUnitsForLevel(level, unitCount, !allExpanded)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            {allExpanded ? (
                              <>
                                <ChevronsDownUp className="size-3.5" /> Collapse units
                              </>
                            ) : (
                              <>
                                <ChevronsUpDown className="size-3.5" /> Expand units
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 border-l-2 border-[var(--line)] pl-5 sm:ml-3 sm:pl-7">
                      {Array.from({ length: unitCount }, (_, unitIndex) => {
                        const start = unitIndex * UNIT_SIZE;
                        const unitPoints = levelPoints.slice(start, start + UNIT_SIZE);
                        const unitLearned = unitPoints.filter((point) =>
                          activeLearnedIds.has(point.id)
                        ).length;
                        const unitPct =
                          unitPoints.length > 0
                            ? Math.round((unitLearned / unitPoints.length) * 100)
                            : 0;
                        const isComplete = unitLearned === unitPoints.length && unitPoints.length > 0;
                        const unitKey = `${level}-${unitIndex}`;
                        const isOpen = Boolean(searchQuery.trim()) || openUnits.has(unitKey);

                        return (
                          <details
                            key={unitKey}
                            open={isOpen}
                            onToggle={(event) =>
                              toggleUnit(unitKey, (event.currentTarget as HTMLDetailsElement).open)
                            }
                            className={`group relative mb-3 rounded-2xl border transition-all last:mb-0 ${
                              isOpen
                                ? "border-[var(--primary)]/30 bg-[var(--surface)] p-4 shadow-xs"
                                : "border-[var(--line)]/70 bg-[var(--surface)]/60 px-4 py-2.5 hover:border-[var(--sakura)]"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`absolute top-3.5 -left-[33px] grid size-6 place-items-center rounded-full border-2 bg-[var(--bg)] transition-colors sm:-left-[41px] ${
                                isComplete
                                  ? "border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--correct)]"
                                  : isOpen
                                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                                    : "border-[var(--line)] text-[var(--muted)]"
                              }`}
                            >
                              {isComplete ? (
                                <Check className="size-3.5" />
                              ) : (
                                <span className="size-2 rounded-full bg-current" />
                              )}
                            </span>

                            <summary className="flex min-h-10 cursor-pointer list-none flex-wrap items-center justify-between gap-3 py-1 marker:hidden [&::-webkit-details-marker]:hidden">
                              <div className="flex flex-wrap items-center gap-2">
                                <ChevronDown className="size-4 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180 group-open:text-[var(--primary)]" />
                                <span className="font-bold text-[var(--ink)]">
                                  Unit {String(unitIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="rounded-full bg-[var(--sakura-light)]/70 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                                  Patterns {start + 1}–{start + unitPoints.length}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[var(--line)] sm:block">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isComplete ? "bg-[var(--correct)]" : "bg-[var(--primary)]"
                                    }`}
                                    style={{ width: `${unitPct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                                  {unitLearned} / {unitPoints.length} learned
                                </span>
                              </div>
                            </summary>

                            <ol className="mt-3 divide-y divide-[var(--line)]/70 border-t border-[var(--line)] pt-1">
                              {unitPoints.map((point, idx) => {
                                const isMastered = masteredIds.has(point.id);
                                const isInReview = inReviewIds.has(point.id);
                                const learned = isMastered || isInReview;
                                const bookmarked = bookmarkedIds.has(point.id);
                                const saving = savingIds.has(point.id);
                                const detailHref = `/grammar/${point.level}/${point.slug}`;

                                return (
                                  <li
                                    key={point.id}
                                    onClick={() => router.push(detailHref)}
                                    className={`group/row -mx-2 grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-xl px-3 py-3.5 transition-colors hover:bg-[var(--sakura-light)]/30 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] ${
                                      isMastered
                                        ? "border-l-3 border-l-[var(--correct)]"
                                        : isInReview
                                          ? "border-l-3 border-l-[var(--primary)]"
                                          : ""
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] font-bold tabular-nums text-[var(--muted)]">
                                          {String(start + idx + 1).padStart(2, "0")}
                                        </span>
                                        <Link
                                          href={detailHref}
                                          onClick={(e) => e.stopPropagation()}
                                          className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                                        >
                                          <span
                                            lang="ja"
                                            className="font-japanese block text-base font-bold text-[var(--ink)] transition-colors group-hover/row:text-[var(--primary)] sm:text-lg"
                                          >
                                            {point.pattern}
                                          </span>
                                        </Link>
                                        {isMastered ? (
                                          <span className="rounded-full bg-[var(--correct)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--correct)]">
                                            Learned
                                          </span>
                                        ) : isInReview ? (
                                          <span className="rounded-full bg-[var(--sakura-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                                            In Review
                                          </span>
                                        ) : null}
                                      </div>

                                      {point.romaji && (
                                        <span className="mt-0.5 block truncate pl-6 text-xs font-medium text-[var(--primary)]/85">
                                          {point.romaji}
                                        </span>
                                      )}

                                      <span className="mt-1.5 block pl-6 text-sm leading-snug text-[var(--ink)]/90 md:hidden">
                                        {point.meaning}
                                      </span>
                                    </div>

                                    <p className="hidden min-w-0 text-sm font-medium leading-relaxed text-[var(--ink)]/90 md:block">
                                      {point.meaning}
                                    </p>

                                    <div
                                      className="flex shrink-0 items-center gap-1.5 md:col-start-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
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
                                        aria-pressed={bookmarked}
                                        onClick={() => toggleBookmark(point.id)}
                                        aria-label={
                                          bookmarked
                                            ? `Remove bookmark for ${point.pattern}`
                                            : `Bookmark ${point.pattern}`
                                        }
                                        title={bookmarked ? "Bookmarked" : "Bookmark pattern"}
                                        className={`grid size-8 shrink-0 place-items-center rounded-full border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                                          bookmarked
                                            ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                                            : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                        }`}
                                      >
                                        <Bookmark
                                          className="size-3.5"
                                          fill={bookmarked ? "currentColor" : "none"}
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={learned || saving}
                                        onClick={() => void handleSaveToSrs(point)}
                                        aria-label={learned ? "Added to review" : "Add to review"}
                                        title={learned ? "Added to review" : "Add to review"}
                                        className={`grid size-9 shrink-0 place-items-center rounded-full border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                                          learned
                                            ? "border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                                            : "border-[var(--line)] text-[var(--primary)] hover:bg-[var(--sakura-light)]"
                                        }`}
                                      >
                                        {learned ? (
                                          <Check className="size-4" />
                                        ) : (
                                          <BookmarkPlus className="size-4" />
                                        )}
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          </details>
                        );
                      })}
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
