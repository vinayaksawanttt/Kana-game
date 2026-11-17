"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Book,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Flame,
  GraduationCap,
  History,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  type BookCatalogEntry,
  type BookDetail,
  type BookLesson,
  getBookById,
  getBooksCatalog,
} from "@/data/books";
import { srsDb, type SrsItem } from "@/lib/srs/db";
import {
  buildSrsLookup,
  clearLastStudiedLesson,
  computeBookProgress,
  computeDashboardOverview,
  computeLessonProgress,
  computeProgressThreeDimensions,
  computeWeakAreas,
  formatSectionLabel,
  loadAllLessonWorkspaceStates,
  loadLastStudiedLesson,
  loadRecentStudiedLessons,
  searchAllTextbookContent,
  type LastStudiedLesson,
  type LessonProgressMetrics,
  type LessonState,
  type LessonWorkspacePersistedState,
  type TextbookContentType,
  type WeakAreaItem,
} from "@/lib/books/progress";
import {
  CircularProgress,
  ContentCard,
  ContentContainer,
  EmptyState,
  FilterDropdown,
  LevelBadge,
  LoadingSkeleton,
  ProgressBar,
  ResponsiveGrid,
  SearchInput,
  SectionHeader,
  StatusBadge,
  TextbookPageContainer,
  cn,
} from "@/components/books/ui";

type ContentTypeFilter = "all" | "vocab" | "grammar" | "kanji" | "dialogues" | "practice";
type StateFilter = "all" | LessonState;

interface FilteredLessonMatch {
  bookId: string;
  bookTitle: string;
  bookLevel: string;
  lesson: BookLesson;
  progress: LessonProgressMetrics;
  matchSnippet?: string;
}

function getLessonCardChrome(state: LessonState): string {
  switch (state) {
    case "review-needed":
      return "border-amber-500/55 bg-gradient-to-br from-[var(--tb-surface)] to-amber-500/[0.05] hover:border-amber-500";
    case "completed":
      return "border-emerald-500/45 bg-gradient-to-br from-[var(--tb-surface)] to-emerald-500/[0.04] hover:border-emerald-500";
    case "in-progress":
      return "border-[var(--tb-accent)]/75 bg-gradient-to-br from-[var(--tb-surface)] to-[var(--tb-accent-soft)]/30 hover:border-[var(--tb-primary)]";
    default:
      return "border-[var(--tb-border)] bg-[var(--tb-surface)] hover:border-[var(--tb-primary)]/50";
  }
}

function renderLessonStateBadge(progress: LessonProgressMetrics) {
  switch (progress.state) {
    case "review-needed":
      return (
        <StatusBadge variant="due" icon={<AlertCircle className="size-3" />}>
          Review Needed ({progress.dueCount} due)
        </StatusBadge>
      );
    case "completed":
      return (
        <StatusBadge variant="mastered" icon={<CheckCircle2 className="size-3" />}>
          Completed
        </StatusBadge>
      );
    case "in-progress":
      return (
        <StatusBadge variant="in-progress" icon={<Clock className="size-3" />}>
          In Progress
        </StatusBadge>
      );
    default:
      return <StatusBadge variant="new">Not Started</StatusBadge>;
  }
}

export default function BooksShelfPage() {
  const [catalog, setCatalog] = useState<BookCatalogEntry[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>("genki-1");
  const [allBooksMap, setAllBooksMap] = useState<Record<string, BookDetail>>({});
  const [failedBookIds, setFailedBookIds] = useState<Record<string, boolean>>({});

  // Dashboard filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBookFilter, setSearchBookFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>("all");
  const [lessonFilter, setLessonFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  // User persistence & FSRS state
  const [lastStudied, setLastStudied] = useState<LastStudiedLesson | null>(null);
  const [recentHistory, setRecentHistory] = useState<LastStudiedLesson[]>([]);
  const [srsItems, setSrsItems] = useState<SrsItem[]>([]);
  const [allWorkspaceStates, setAllWorkspaceStates] = useState<Record<string, LessonWorkspacePersistedState>>({});
  const [activeWeakAreaFilter, setActiveWeakAreaFilter] = useState<"all" | "vocab" | "kanji" | "grammar" | "practice">("all");
  const [showDetailedThreeDimensions, setShowDetailedThreeDimensions] = useState(false);
  const [searchContentTab, setSearchContentTab] = useState<"lessons" | TextbookContentType>("lessons");

  const bookDetail = allBooksMap[activeBookId] ?? null;
  const loading = !bookDetail && !failedBookIds[activeBookId];

  // 1. Load Catalog & Prefetch all books
  useEffect(() => {
    let mounted = true;
    getBooksCatalog()
      .then(async (data) => {
        if (!mounted) return;
        setCatalog(data);
        setActiveBookId((prev) =>
          data.length > 0 && !data.some((b) => b.id === prev) ? data[0].id : prev
        );

        try {
          const details = await Promise.all(data.map((b) => getBookById(b.id)));
          if (!mounted) return;
          const map: Record<string, BookDetail> = {};
          details.forEach((b) => {
            if (b) map[b.id] = b;
          });
          setAllBooksMap(map);
        } catch (err) {
          console.error("Failed prefetching books detail:", err);
        }
      })
      .catch((err) => {
        console.error("Failed loading books catalog:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load selected book if not cached yet
  useEffect(() => {
    let mounted = true;
    if (allBooksMap[activeBookId] || failedBookIds[activeBookId]) {
      return;
    }

    getBookById(activeBookId)
      .then((data) => {
        if (!mounted) return;
        if (data) {
          setAllBooksMap((prev) => ({ ...prev, [data.id]: data }));
        } else {
          setFailedBookIds((prev) => ({ ...prev, [activeBookId]: true }));
        }
      })
      .catch((err) => {
        console.error(`Failed loading book ${activeBookId}:`, err);
        if (mounted) {
          setFailedBookIds((prev) => ({ ...prev, [activeBookId]: true }));
        }
      });

    return () => {
      mounted = false;
    };
  }, [activeBookId, allBooksMap, failedBookIds]);

  // 3. Load Resume & Recently Studied history asynchronously
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      setLastStudied(loadLastStudiedLesson());
      setRecentHistory(loadRecentStudiedLessons());
      setAllWorkspaceStates(loadAllLessonWorkspaceStates());
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 4. Load FSRS Spaced Repetition items
  useEffect(() => {
    let mounted = true;
    async function loadSrs() {
      try {
        if (typeof window !== "undefined" && srsDb?.items) {
          const items = await srsDb.items.toArray();
          if (mounted) setSrsItems(items);
        }
      } catch {
        // Dexie/IndexedDB unavailable in mock environments
      }
    }
    loadSrs();
    return () => {
      mounted = false;
    };
  }, []);

  // Derived FSRS lookup & analytics
  const srsLookup = useMemo(() => buildSrsLookup(srsItems), [srsItems]);

  const visitedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (lastStudied) keys.add(`${lastStudied.bookId}:${lastStudied.lessonNumber}`);
    for (const entry of recentHistory) {
      keys.add(`${entry.bookId}:${entry.lessonNumber}`);
    }
    return keys;
  }, [lastStudied, recentHistory]);

  const overview = useMemo(
    () =>
      computeDashboardOverview(
        allBooksMap,
        srsItems,
        srsLookup,
        visitedKeys,
        recentHistory
      ),
    [allBooksMap, srsItems, srsLookup, visitedKeys, recentHistory]
  );

  // Resume card real lesson progress
  const resumeLessonProgress = useMemo(() => {
    if (!lastStudied) return null;
    const book = allBooksMap[lastStudied.bookId];
    const lesson = book?.lessons.find((l) => l.lessonNumber === lastStudied.lessonNumber);
    if (!lesson) return null;
    return computeLessonProgress(lesson, srsLookup, true);
  }, [lastStudied, allBooksMap, srsLookup]);

  // Phase 9: Three Dimensions of Learning Progress
  const threeDimensions = useMemo(
    () => computeProgressThreeDimensions(overview, srsItems, allWorkspaceStates),
    [overview, srsItems, allWorkspaceStates]
  );

  // Phase 9: Pedagogical Weak-Area Identification (threshold >= 2 attempts)
  const weakAreas = useMemo(
    () => computeWeakAreas(srsItems, allBooksMap, allWorkspaceStates),
    [srsItems, allBooksMap, allWorkspaceStates]
  );

  const filteredWeakAreaItems = useMemo<WeakAreaItem[]>(() => {
    if (activeWeakAreaFilter === "all") {
      return [
        ...weakAreas.vocab,
        ...weakAreas.kanji,
        ...weakAreas.grammar,
        ...weakAreas.practice,
      ];
    }
    return weakAreas[activeWeakAreaFilter] || [];
  }, [weakAreas, activeWeakAreaFilter]);

  // Phase 9: Full Cross-Textbook Global Search
  const globalSearchSummary = useMemo(
    () =>
      searchAllTextbookContent(
        allBooksMap,
        searchQuery,
        searchBookFilter,
        contentTypeFilter === "dialogues" ? "dialogue" : contentTypeFilter
      ),
    [allBooksMap, searchQuery, searchBookFilter, contentTypeFilter]
  );

  const activeCatalogEntry = catalog.find((b) => b.id === activeBookId);

  // Determine whether cross-book Search / Faceted Discovery mode is active
  const hasActiveSearchOrFacet =
    searchQuery.trim().length > 0 ||
    searchBookFilter !== "all" ||
    levelFilter !== "all" ||
    contentTypeFilter !== "all" ||
    lessonFilter !== "all";

  // Global & Faceted Search Results
  const searchResults = useMemo<FilteredLessonMatch[]>(() => {
    if (!hasActiveSearchOrFacet) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: FilteredLessonMatch[] = [];

    const booksToSearch =
      searchBookFilter === "all"
        ? Object.values(allBooksMap)
        : [allBooksMap[searchBookFilter]].filter(Boolean);

    for (const book of booksToSearch) {
      if (levelFilter !== "all" && book.level !== levelFilter) {
        continue;
      }

      for (const lesson of book.lessons) {
        if (lessonFilter !== "all" && String(lesson.lessonNumber) !== lessonFilter) {
          continue;
        }

        // Content type availability filter
        if (contentTypeFilter === "vocab" && lesson.vocabulary.length === 0) continue;
        if (contentTypeFilter === "grammar" && lesson.grammar.length === 0) continue;
        if (contentTypeFilter === "kanji" && lesson.kanji.length === 0) continue;
        if (
          contentTypeFilter === "dialogues" &&
          (!lesson.dialogues || lesson.dialogues.length === 0)
        ) {
          continue;
        }
        if (
          contentTypeFilter === "practice" &&
          (!lesson.practice || lesson.practice.length === 0)
        ) {
          continue;
        }

        let matchSnippet: string | undefined;
        let queryMatches = q.length === 0;

        if (q.length > 0) {
          const matchNum =
            `lesson ${lesson.lessonNumber}`.includes(q) ||
            `l${lesson.lessonNumber}` === q ||
            `${lesson.lessonNumber}` === q;
          const matchTitle = lesson.title.toLowerCase().includes(q);
          const matchJa = (lesson.japaneseTitle || "").toLowerCase().includes(q);
          const matchSubtitle = (lesson.subtitle || "").toLowerCase().includes(q);

          if (contentTypeFilter === "all" || contentTypeFilter === "vocab") {
            const matchedVocab = lesson.vocabulary.find(
              (v) =>
                v.word.toLowerCase().includes(q) ||
                v.meaning.toLowerCase().includes(q) ||
                v.reading.toLowerCase().includes(q)
            );
            if (matchedVocab) {
              matchSnippet = `Vocab: ${matchedVocab.word} (${matchedVocab.reading}) — ${matchedVocab.meaning}`;
            }
          }

          if (!matchSnippet && (contentTypeFilter === "all" || contentTypeFilter === "grammar")) {
            const matchedGrammar = lesson.grammar.find(
              (g) =>
                g.title.toLowerCase().includes(q) ||
                g.pattern.toLowerCase().includes(q) ||
                g.explanation.toLowerCase().includes(q)
            );
            if (matchedGrammar) {
              matchSnippet = `Grammar: ${matchedGrammar.pattern} — ${matchedGrammar.title}`;
            }
          }

          if (!matchSnippet && (contentTypeFilter === "all" || contentTypeFilter === "kanji")) {
            const matchedKanji = lesson.kanji.find(
              (k) =>
                k.kanji.includes(q) ||
                k.meaning.toLowerCase().includes(q) ||
                k.onyomi.some((o) => o.toLowerCase().includes(q)) ||
                k.kunyomi.some((ku) => ku.toLowerCase().includes(q))
            );
            if (matchedKanji) {
              matchSnippet = `Kanji: ${matchedKanji.kanji} — ${matchedKanji.meaning}`;
            }
          }

          if (!matchSnippet && contentTypeFilter === "dialogues" && lesson.dialogues) {
            const matchedLine = lesson.dialogues
              .flatMap((d) => d.lines)
              .find(
                (l) => l.ja.toLowerCase().includes(q) || l.en.toLowerCase().includes(q)
              );
            if (matchedLine) {
              matchSnippet = `Dialogue: ${matchedLine.ja}`;
            }
          }

          queryMatches = Boolean(matchNum || matchTitle || matchJa || matchSubtitle || matchSnippet);
        }

        if (queryMatches) {
          const progress = computeLessonProgress(
            lesson,
            srsLookup,
            visitedKeys.has(`${book.id}:${lesson.lessonNumber}`)
          );
          if (stateFilter === "all" || progress.state === stateFilter) {
            results.push({
              bookId: book.id,
              bookTitle: book.title.split(":")[0],
              bookLevel: book.level,
              lesson,
              progress,
              matchSnippet,
            });
          }
        }
      }
    }

    return results;
  }, [
    allBooksMap,
    contentTypeFilter,
    hasActiveSearchOrFacet,
    lessonFilter,
    levelFilter,
    searchBookFilter,
    searchQuery,
    srsLookup,
    stateFilter,
    visitedKeys,
  ]);

  // Selected Book Lessons with computed states
  const activeBookLessonsWithState = useMemo(() => {
    if (!bookDetail) return [];
    return bookDetail.lessons.map((lesson) => ({
      lesson,
      progress: computeLessonProgress(
        lesson,
        srsLookup,
        visitedKeys.has(`${bookDetail.id}:${lesson.lessonNumber}`)
      ),
    }));
  }, [bookDetail, srsLookup, visitedKeys]);

  const filteredActiveLessons = useMemo(() => {
    if (stateFilter === "all") return activeBookLessonsWithState;
    return activeBookLessonsWithState.filter((item) => item.progress.state === stateFilter);
  }, [activeBookLessonsWithState, stateFilter]);

  const lessonDropdownOptions = useMemo(() => {
    const base = [{ key: "all", label: "All Lessons" }];
    const sourceBook =
      searchBookFilter !== "all" ? allBooksMap[searchBookFilter] : bookDetail;
    const nums = new Set<number>();
    if (sourceBook) {
      sourceBook.lessons.forEach((l) => nums.add(l.lessonNumber));
    } else {
      Object.values(allBooksMap).forEach((b) =>
        b.lessons.forEach((l) => nums.add(l.lessonNumber))
      );
    }
    Array.from(nums)
      .sort((a, b) => a - b)
      .forEach((n) => base.push({ key: String(n), label: `Lesson ${n}` }));
    return base;
  }, [allBooksMap, bookDetail, searchBookFilter]);

  const resetAllFilters = () => {
    setSearchQuery("");
    setSearchBookFilter("all");
    setLevelFilter("all");
    setContentTypeFilter("all");
    setLessonFilter("all");
    setStateFilter("all");
    setSearchContentTab("lessons");
  };

  const handleDismissResume = () => {
    clearLastStudiedLesson();
    setLastStudied(null);
  };

  return (
    <TextbookPageContainer label="TEXTBOOK COMPANION" glyph="本" homeHref="/">
      {/* A. COMPACT WELCOME SECTION */}
      <ContentContainer
        as="section"
        aria-label="Dashboard welcome"
        padding="md"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl"
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="in-progress" icon={<Sparkles className="size-3" />}>
              Personal Learning Dashboard · 教科書ワークスペース
            </StatusBadge>
            {overview.streakDays > 0 && (
              <StatusBadge variant="warning" icon={<Flame className="size-3" />}>
                {overview.streakDays} day streak
              </StatusBadge>
            )}
          </div>
          <h1 className="text-xl font-black tracking-tight text-[var(--tb-text-primary)] sm:text-2xl">
            Japanese Textbook Library
          </h1>
          <p className="text-xs sm:text-sm text-[var(--tb-text-secondary)] max-w-2xl">
            Track real FSRS spaced repetition mastery across Genki I, Genki II, and Minna no Nihongo I,
            resume your current lesson, or clear due reviews.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {activeCatalogEntry && (
            <div className="rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/70 px-3.5 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                {activeCatalogEntry.level} Selected
              </div>
              <div className="text-sm font-black text-[var(--primary-fg)]">
                {activeCatalogEntry.totalLessons} Lessons
              </div>
            </div>
          )}
          <CircularProgress
            value={overview.overallPercent}
            size={54}
            strokeWidth={5}
            label="Curriculum"
            sublabel={`${overview.lessonsCompleted}/${overview.totalLessons || 0} done`}
          />
        </div>
      </ContentContainer>

      {/* B. CONTINUE STUDYING & D. DUE FOR REVIEW (PRIMARY ACTION ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {lastStudied && (
          <section
            aria-label="Continue where you left off"
            className="lg:col-span-7 flex"
          >
            <ContentCard
              selected
              padding="md"
              className="flex flex-1 flex-col justify-between bg-gradient-to-br from-[var(--tb-surface)] via-[var(--tb-surface)] to-[var(--tb-accent-soft)]/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative w-14 shrink-0 aspect-[3/4] overflow-hidden rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] shadow-xs">
                    {lastStudied.coverImage ? (
                      <img
                        src={lastStudied.coverImage}
                        alt={lastStudied.bookTitle}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-[var(--tb-accent-soft)] text-[var(--primary-fg)]">
                        <BookOpen className="size-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tb-primary)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                        <Play className="size-2.5 fill-current" />
                        Continue Studying
                      </span>
                      <span className="text-xs font-bold text-[var(--tb-text-secondary)]">
                        {lastStudied.bookTitle} · Lesson {lastStudied.lessonNumber}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[var(--tb-text-primary)] truncate">
                      {lastStudied.lessonTitle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--tb-text-secondary)]">
                      {lastStudied.japaneseTitle && (
                        <span className="font-japanese font-semibold truncate">
                          {lastStudied.japaneseTitle}
                        </span>
                      )}
                      <StatusBadge variant="neutral">
                        Section: {formatSectionLabel(lastStudied.lastTab)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismissResume}
                  className="tb-focus-ring shrink-0 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-1.5 text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:bg-[var(--tb-accent-soft)]/40 transition-colors cursor-pointer"
                  title="Dismiss resume card"
                  aria-label="Dismiss resume card"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[var(--tb-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-[160px]">
                  {resumeLessonProgress ? (
                    <ProgressBar
                      value={resumeLessonProgress.percent}
                      masteryValue={resumeLessonProgress.masteryPercent}
                      label="Lesson Progress"
                      statusText={`${resumeLessonProgress.inSrs}/${resumeLessonProgress.total} items in FSRS (${resumeLessonProgress.percent}%)`}
                    />
                  ) : (
                    <p className="text-xs font-medium text-[var(--tb-text-secondary)]">
                      Pick up right where you left off in Lesson {lastStudied.lessonNumber}.
                    </p>
                  )}
                </div>

                <Link
                  href={`/books/${lastStudied.bookId}/${lastStudied.lessonNumber}${
                    lastStudied.lastTab ? `?tab=${lastStudied.lastTab}` : ""
                  }`}
                  className="tb-focus-ring shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--tb-primary)] px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-[var(--tb-primary-hover)] transition-colors"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </ContentCard>
          </section>
        )}

        {/* D. DUE FOR REVIEW PANEL - Unified Review Center */}
        <section
          aria-label="Due for review"
          className={cn(
            "flex",
            lastStudied ? "lg:col-span-5" : "lg:col-span-12"
          )}
        >
          <ContentCard
            padding="md"
            className="flex flex-1 flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="size-4 text-[var(--primary-fg)]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-[var(--tb-text-primary)]">
                      Due for Review
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--tb-text-secondary)]">
                    Unified FSRS spaced repetition queue
                  </p>
                </div>

                <StatusBadge variant={overview.due.total > 0 ? "due" : "mastered"}>
                  {overview.due.total} {overview.due.total === 1 ? "card due" : "cards due"}
                </StatusBadge>
              </div>

              {/* 3 Dedicated Category Review Queues */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/70 p-2 sm:p-2.5 flex flex-col justify-between text-center space-y-2 min-w-0">
                  <div>
                    <div className="text-lg font-black text-[var(--tb-text-primary)]">
                      {overview.due.vocab}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--tb-text-secondary)] truncate">
                      Vocab Due
                    </div>
                  </div>
                  <Link
                    href="/review?type=vocab"
                    className="tb-focus-ring inline-flex items-center justify-center rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-1 sm:px-1.5 py-1 text-[10px] font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors truncate"
                  >
                    Review Vocab
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/70 p-2 sm:p-2.5 flex flex-col justify-between text-center space-y-2 min-w-0">
                  <div>
                    <div className="text-lg font-black text-[var(--tb-text-primary)]">
                      {overview.due.kanji}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--tb-text-secondary)] truncate">
                      Kanji Due
                    </div>
                  </div>
                  <Link
                    href="/review?type=kanji"
                    className="tb-focus-ring inline-flex items-center justify-center rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-1 sm:px-1.5 py-1 text-[10px] font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors truncate"
                  >
                    Review Kanji
                  </Link>
                </div>

                <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/70 p-2 sm:p-2.5 flex flex-col justify-between text-center space-y-2 min-w-0">
                  <div>
                    <div className="text-lg font-black text-[var(--tb-text-primary)]">
                      {overview.due.grammar}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--tb-text-secondary)] truncate">
                      Grammar Due
                    </div>
                  </div>
                  <Link
                    href="/review?type=grammar"
                    className="tb-focus-ring inline-flex items-center justify-center rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-1 sm:px-1.5 py-1 text-[10px] font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors truncate"
                  >
                    Review Grammar
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--tb-border)] flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[var(--tb-text-secondary)]">
                Total queue:{" "}
                <strong className="text-[var(--tb-text-primary)]">{overview.due.total}</strong> due
              </span>
              <Link
                href="/review"
                className={cn(
                  "tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all",
                  overview.due.total > 0
                    ? "bg-[var(--tb-primary)] text-white shadow-xs hover:bg-[var(--tb-primary-hover)]"
                    : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)]"
                )}
              >
                <span>Start Review</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </ContentCard>
        </section>
      </div>

      {/* C. TODAY'S LEARNING OVERVIEW & THREE-DIMENSION PROGRESS */}
      <section aria-label="Today's learning overview" className="space-y-3">
        <SectionHeader
          title="Today's Learning Overview"
          icon={<GraduationCap className="size-4" />}
          actions={
            <button
              type="button"
              onClick={() => setShowDetailedThreeDimensions((prev) => !prev)}
              className="tb-focus-ring inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)] hover:underline cursor-pointer"
            >
              <span>{showDetailedThreeDimensions ? "Hide Dimension Breakdown" : "3-Dimension Progress Deep-Dive"}</span>
              {showDetailedThreeDimensions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <ContentCard padding="sm" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              Lessons Completed
            </span>
            <div className="text-2xl font-black text-[var(--tb-text-primary)]">
              {overview.lessonsCompleted}
            </div>
            <p className="text-[11px] text-[var(--tb-text-secondary)]">
              {overview.lessonsInProgress} in progress · {overview.totalLessons} total
            </p>
          </ContentCard>

          <ContentCard padding="sm" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              Vocabulary Mastered
            </span>
            <div className="text-2xl font-black text-[var(--tb-text-primary)]">
              {overview.vocabMastered}
            </div>
            <p className="text-[11px] text-[var(--tb-text-secondary)]">
              {overview.vocabStudied} studied in FSRS
            </p>
          </ContentCard>

          <ContentCard padding="sm" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              Kanji Studied
            </span>
            <div className="text-2xl font-black text-[var(--tb-text-primary)]">
              {overview.kanjiStudied}
            </div>
            <p className="text-[11px] text-[var(--tb-text-secondary)]">
              {overview.kanjiMastered} mastered
            </p>
          </ContentCard>

          <ContentCard padding="sm" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              Grammar Studied
            </span>
            <div className="text-2xl font-black text-[var(--tb-text-primary)]">
              {overview.grammarStudied}
            </div>
            <p className="text-[11px] text-[var(--tb-text-secondary)]">
              {overview.grammarMastered} mastered
            </p>
          </ContentCard>

          <ContentCard padding="sm" className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--tb-text-secondary)]">
              FSRS Reviews Due
            </span>
            <div className="text-2xl font-black text-[var(--primary-fg)]">
              {overview.due.total}
            </div>
            <p className="text-[11px] text-[var(--tb-text-secondary)]">
              Across all active decks
            </p>
          </ContentCard>
        </div>

        {/* 3-Dimension Progress Deep-Dive (Content Completion, Knowledge Mastery, Review Status) */}
        {showDetailedThreeDimensions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Dimension 1: Content Completion */}
            <ContentCard padding="sm" className="space-y-2 border-indigo-500/30 bg-indigo-500/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  1. Content Completion
                </span>
                <span className="text-xs font-bold text-[var(--tb-text-primary)]">
                  {threeDimensions.completion.overallPercent}%
                </span>
              </div>
              <p className="text-xs text-[var(--tb-text-secondary)]">
                Curriculum material accessed and completed
              </p>
              <div className="space-y-1 text-xs pt-1 border-t border-[var(--tb-border)]">
                <div className="flex justify-between">
                  <span>Lessons Completed:</span>
                  <strong>{threeDimensions.completion.lessonsCompleted} / {threeDimensions.completion.totalLessons}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Lessons In Progress:</span>
                  <strong>{threeDimensions.completion.lessonsInProgress}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dialogues Completed:</span>
                  <strong>{threeDimensions.completion.dialoguesCompleted} scenes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Drills Attempted:</span>
                  <strong>{threeDimensions.completion.practiceAttemptedCount} items</strong>
                </div>
              </div>
            </ContentCard>

            {/* Dimension 2: Knowledge Mastery */}
            <ContentCard padding="sm" className="space-y-2 border-emerald-500/30 bg-emerald-500/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  2. Knowledge Mastery
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {threeDimensions.mastery.overallMasteryRate}% Mastery
                </span>
              </div>
              <p className="text-xs text-[var(--tb-text-secondary)]">
                Confirmed recall stability and practice accuracy
              </p>
              <div className="space-y-1 text-xs pt-1 border-t border-[var(--tb-border)]">
                <div className="flex justify-between">
                  <span>Practice Accuracy:</span>
                  <strong>{threeDimensions.mastery.practiceAccuracyPercent}% ({threeDimensions.mastery.practiceCorrectCount} correct)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Vocab Mastered:</span>
                  <strong>{threeDimensions.mastery.vocabMastered} / {threeDimensions.mastery.vocabStudied}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kanji Mastered:</span>
                  <strong>{threeDimensions.mastery.kanjiMastered} / {threeDimensions.mastery.kanjiStudied}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Grammar Mastered:</span>
                  <strong>{threeDimensions.mastery.grammarMastered} / {threeDimensions.mastery.grammarStudied}</strong>
                </div>
              </div>
            </ContentCard>

            {/* Dimension 3: Review Status */}
            <ContentCard padding="sm" className="space-y-2 border-amber-500/30 bg-amber-500/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  3. Review Schedule
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {threeDimensions.reviewStatus.dueToday} Due Today
                </span>
              </div>
              <p className="text-xs text-[var(--tb-text-secondary)]">
                FSRS spaced repetition schedule & workload
              </p>
              <div className="space-y-1 text-xs pt-1 border-t border-[var(--tb-border)]">
                <div className="flex justify-between">
                  <span>Due Today:</span>
                  <strong>{threeDimensions.reviewStatus.dueToday} cards</strong>
                </div>
                <div className="flex justify-between">
                  <span>Due Tomorrow:</span>
                  <strong>{threeDimensions.reviewStatus.dueTomorrow} cards</strong>
                </div>
                <div className="flex justify-between">
                  <span>Due This Week:</span>
                  <strong>{threeDimensions.reviewStatus.dueThisWeek} cards</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Reviews Logged:</span>
                  <strong>{threeDimensions.reviewStatus.totalReviewsCompleted} reps</strong>
                </div>
              </div>
            </ContentCard>
          </div>
        )}
      </section>

      {/* WEAK-AREA IDENTIFICATION */}
      {weakAreas.totalWeakItems > 0 && (
        <section aria-label="Weak-area identification" className="space-y-3">
          <SectionHeader
            title="Areas Needing Attention"
            subtitle="Identified from repeated mistakes and review lapses (threshold ≥ 2 attempts)"
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            actions={
              <div className="flex flex-wrap items-center gap-1">
                {(["all", "vocab", "kanji", "grammar", "practice"] as const).map((filterKey) => {
                  const count =
                    filterKey === "all"
                      ? weakAreas.totalWeakItems
                      : weakAreas[filterKey].length;
                  if (count === 0 && filterKey !== "all") return null;
                  const label =
                    filterKey === "all"
                      ? "All Weak Areas"
                      : filterKey === "vocab"
                      ? "Vocabulary"
                      : filterKey === "kanji"
                      ? "Kanji"
                      : filterKey === "grammar"
                      ? "Grammar"
                      : "Practice";
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setActiveWeakAreaFilter(filterKey)}
                      className={cn(
                        "tb-focus-ring rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                        activeWeakAreaFilter === filterKey
                          ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                          : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      )}
                    >
                      <span>{label}</span>
                      <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            }
          />

          <ResponsiveGrid columns={3} gap="sm">
            {filteredWeakAreaItems.map((item) => (
              <ContentCard key={item.id} padding="sm" className="flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                      {item.type} · {item.mistakeCount} mistakes
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--tb-text-secondary)]">
                      {item.bookTitle} · L{item.lessonNumber}
                    </span>
                  </div>
                  <h4 className="font-japanese text-base font-bold text-[var(--tb-text-primary)]">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs font-medium text-[var(--tb-text-secondary)]">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    {item.reason}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--tb-border)] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[var(--tb-text-secondary)] truncate">
                    {item.lessonTitle}
                  </span>
                  <Link
                    href={item.href}
                    className="tb-focus-ring inline-flex items-center gap-1 rounded-lg bg-[var(--tb-primary)] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[var(--tb-primary-hover)] transition-colors shrink-0"
                  >
                    <span>Practice</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </ContentCard>
            ))}
          </ResponsiveGrid>
        </section>
      )}

      {/* E. TEXTBOOK SELECTION */}
      <section aria-label="Book selection" className="space-y-4">
        <SectionHeader
          title="Select Textbook Curriculum"
          icon={<Layers className="size-4" />}
          actions={
            <span className="text-xs font-semibold text-[var(--tb-text-secondary)]">
              {catalog.length} textbooks available
            </span>
          }
        />

        <ResponsiveGrid columns={3} gap="md">
          {catalog.map((book) => {
            const isActive = book.id === activeBookId;
            const shortName = book.title.split(":")[0];
            const coverSrc = book.coverImage || `/images/books/${book.id}.webp`;
            const bookSummary = computeBookProgress(allBooksMap[book.id], srsLookup, visitedKeys);

            return (
              <button
                key={book.id}
                type="button"
                onClick={() => {
                  setActiveBookId(book.id);
                  setStateFilter("all");
                  if (hasActiveSearchOrFacet && searchBookFilter !== "all") {
                    setSearchBookFilter(book.id);
                  }
                }}
                role="button"
                aria-label={shortName}
                aria-pressed={isActive}
                className={cn(
                  "tb-focus-ring group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer",
                  isActive
                    ? "border-[var(--tb-primary)] bg-gradient-to-br from-[var(--tb-surface)] via-[var(--tb-surface)] to-[var(--tb-accent-soft)]/45 shadow-sm ring-2 ring-[var(--tb-primary)]/35"
                    : "border-[var(--tb-border)] bg-[var(--tb-surface)] hover:border-[var(--tb-accent)] hover:shadow-xs"
                )}
              >
                <div className="relative w-20 shrink-0 aspect-[3/4] overflow-hidden rounded-xl border border-[var(--tb-border)] shadow-xs bg-[var(--tb-bg)] transition-transform duration-200 group-hover:scale-102">
                  <img
                    src={coverSrc}
                    alt={book.title}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10 pointer-events-none" />
                  <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="inline-block font-mono text-[10px] font-black uppercase tracking-wider text-[var(--tb-text-secondary)] truncate">
                      {book.series}
                    </span>
                    <LevelBadge level={book.level} />
                  </div>

                  <h3 className="text-base font-extrabold text-[var(--tb-text-primary)] leading-snug truncate group-hover:text-[var(--primary-fg)] transition-colors">
                    {shortName}
                  </h3>

                  <p className="font-japanese text-xs font-semibold text-[var(--tb-text-secondary)] truncate">
                    {book.japaneseTitle}
                  </p>

                  <div className="pt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[var(--tb-text-secondary)]">
                    <span className="font-bold text-[var(--tb-text-primary)]">
                      {book.totalLessons} Units
                    </span>
                    <span>·</span>
                    <span>{book.stats.vocabularyCount} Vocab</span>
                    <span>·</span>
                    <span>{book.stats.kanjiCount} Kanji</span>
                    <span>·</span>
                    <span>{book.stats.grammarCount} Grammar</span>
                  </div>

                  <div className="pt-1">
                    <ProgressBar
                      value={bookSummary.overallPercent}
                      masteryValue={bookSummary.masteryPercent}
                      statusText={`${bookSummary.completedLessons}/${book.totalLessons} completed`}
                    />
                  </div>

                  <div className="pt-1">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--primary-fg)]">
                        <CheckCircle2 className="size-3.5 fill-[var(--tb-primary)] text-white" />
                        <span>Currently Selected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--tb-text-secondary)] group-hover:text-[var(--tb-text-primary)] transition-colors">
                        <span>View lessons</span>
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </ResponsiveGrid>
      </section>

      {/* SEARCH & MULTI-FACET FILTERING */}
      <section aria-label="Textbook curriculum search" className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search across all textbooks or filter by lesson title, topic, vocab, or grammar..."
            className="flex-1"
          />

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              mode="select"
              label="Filter by textbook"
              value={searchBookFilter}
              onChange={setSearchBookFilter}
              options={[
                { key: "all", label: "All Books" },
                ...catalog.map((b) => ({
                  key: b.id,
                  label: b.title.split(":")[0],
                })),
              ]}
            />
            <FilterDropdown
              mode="select"
              label="Filter by JLPT level"
              value={levelFilter}
              onChange={setLevelFilter}
              options={[
                { key: "all", label: "All Levels" },
                { key: "N5", label: "JLPT N5" },
                { key: "N4", label: "JLPT N4" },
              ]}
            />
            <FilterDropdown
              mode="select"
              label="Filter by content type"
              value={contentTypeFilter}
              onChange={(v) => setContentTypeFilter(v as ContentTypeFilter)}
              options={[
                { key: "all", label: "All Content" },
                { key: "vocab", label: "Vocabulary" },
                { key: "grammar", label: "Grammar" },
                { key: "kanji", label: "Kanji" },
                { key: "dialogues", label: "Dialogues" },
                { key: "practice", label: "Practice" },
              ]}
            />
            <FilterDropdown
              mode="select"
              label="Filter by lesson"
              value={lessonFilter}
              onChange={setLessonFilter}
              options={lessonDropdownOptions}
            />
          </div>
        </div>
      </section>

      {/* F. LESSON BROWSER OR GLOBAL SEARCH RESULTS */}
      {hasActiveSearchOrFacet ? (
        <section aria-label="Search results" className="space-y-4">
          <SectionHeader
            title={`Found ${searchResults.length} matching ${
              searchResults.length === 1 ? "lesson" : "lessons"
            } across textbooks`}
            icon={<Search className="size-4" />}
            actions={
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-bold text-[var(--primary-fg)] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            }
          />

          {/* Unified Content Category Tabs for Search */}
          {searchQuery.trim().length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-[var(--tb-text-secondary)] mr-1">
                Content Matches:
              </span>
              <button
                type="button"
                onClick={() => setSearchContentTab("lessons")}
                className={cn(
                  "tb-focus-ring rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                  searchContentTab === "lessons"
                    ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                    : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                )}
              >
                Lessons ({searchResults.length})
              </button>
              {(["vocab", "grammar", "kanji", "dialogue", "practice"] as const).map((cat) => {
                const count = globalSearchSummary.counts[cat];
                if (count === 0) return null;
                const label =
                  cat === "vocab"
                    ? "Vocabulary"
                    : cat === "grammar"
                    ? "Grammar"
                    : cat === "kanji"
                    ? "Kanji"
                    : cat === "dialogue"
                    ? "Dialogues"
                    : "Practice";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSearchContentTab(cat)}
                    className={cn(
                      "tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      searchContentTab === cat
                        ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                        : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                    )}
                  >
                    <span>{label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        searchContentTab === cat
                          ? "bg-white/20 text-white"
                          : "bg-[var(--tb-border)]/60 text-[var(--tb-text-secondary)]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {searchContentTab !== "lessons" && globalSearchSummary.byType[searchContentTab].length > 0 ? (
            <ResponsiveGrid columns={3} gap="md">
              {globalSearchSummary.byType[searchContentTab].map((item) => (
                <ContentCard key={item.id} padding="md" className="flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-[var(--tb-border)] bg-[var(--tb-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-fg)]">
                        {item.typeLabel}
                      </span>
                      <span className="text-xs font-semibold text-[var(--tb-text-secondary)]">
                        {item.bookTitle} · L{item.lessonNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-japanese text-lg font-bold text-[var(--tb-text-primary)]">
                        {item.title}
                      </h4>
                      {item.reading && (
                        <p className="font-japanese text-xs text-[var(--tb-text-secondary)]">
                          {item.reading}
                        </p>
                      )}
                      {item.meaning && (
                        <p className="text-sm font-medium text-[var(--tb-text-primary)] mt-1">
                          {item.meaning}
                        </p>
                      )}
                    </div>

                    {item.snippet && (
                      <div className="rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)]/60 p-2.5 text-xs text-[var(--tb-text-secondary)]">
                        {item.snippet}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--tb-border)] flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--tb-text-secondary)] truncate">
                      {item.lessonTitle}
                    </span>
                    <Link
                      href={item.href}
                      className="tb-focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--tb-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[var(--tb-primary-hover)] transition-colors shrink-0"
                    >
                      <span>Open in Lesson</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </ContentCard>
              ))}
            </ResponsiveGrid>
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={<Filter className="size-8" />}
              title={
                searchQuery
                  ? `No lessons match "${searchQuery}"`
                  : "No lessons match selected filters"
              }
              description="Try searching for a vocabulary term, kanji character, grammar structure, or resetting filters."
              action={
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)] px-4 py-2 text-xs font-bold text-[var(--primary-fg)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Reset Search
                </button>
              }
            />
          ) : (
            <ResponsiveGrid columns={3} gap="md">
              {searchResults.map(({ bookId, bookTitle, bookLevel, lesson, progress, matchSnippet }) => {
                const href = `/books/${bookId}/${lesson.lessonNumber}`;

                return (
                  <Link
                    key={`${bookId}-${lesson.lessonNumber}`}
                    href={href}
                    className={cn(
                      "tb-focus-ring group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      getLessonCardChrome(progress.state)
                    )}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--tb-accent-soft)] px-2.5 py-1 text-xs font-black text-[var(--primary-fg)]">
                          <span>{bookTitle}</span>
                          <span className="opacity-50">·</span>
                          <span>L{lesson.lessonNumber}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {renderLessonStateBadge(progress)}
                          <LevelBadge level={bookLevel} />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-[var(--tb-text-primary)] group-hover:text-[var(--primary-fg)] transition-colors line-clamp-1">
                          {lesson.title}
                        </h3>
                        {lesson.japaneseTitle && (
                          <p className="font-japanese text-xs font-semibold text-[var(--tb-text-secondary)] truncate mt-0.5">
                            {lesson.japaneseTitle}
                          </p>
                        )}
                      </div>

                      {matchSnippet ? (
                        <div className="rounded-xl bg-[var(--tb-accent-soft)]/50 border border-[var(--tb-border-strong)] p-2 text-xs font-semibold text-[var(--primary-fg)] line-clamp-2">
                          {matchSnippet}
                        </div>
                      ) : lesson.subtitle ? (
                        <p className="text-xs text-[var(--tb-text-secondary)] line-clamp-2 leading-relaxed">
                          {lesson.subtitle}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-[var(--tb-border)] space-y-2.5">
                      <ProgressBar
                        value={progress.percent}
                        masteryValue={progress.masteryPercent}
                        label={
                          <span className="flex items-center gap-1">
                            <TrendingUp className="size-3 text-[var(--primary-fg)]" />
                            <span>FSRS Mastery</span>
                          </span>
                        }
                        statusText={`${progress.inSrs} / ${progress.total} in SRS (${progress.percent}%)`}
                      />

                      <div className="flex items-center justify-between text-xs font-medium text-[var(--tb-text-secondary)] pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--tb-text-primary)]">
                            {lesson.stats?.vocabularyCount ?? lesson.vocabulary.length}
                          </span>
                          <span>vocab</span>
                          <span>·</span>
                          <span className="font-bold text-[var(--tb-text-primary)]">
                            {lesson.stats?.kanjiCount ?? lesson.kanji.length}
                          </span>
                          <span>kanji</span>
                          <span>·</span>
                          <span className="font-bold text-[var(--tb-text-primary)]">
                            {lesson.stats?.grammarCount ?? lesson.grammar.length}
                          </span>
                          <span>grammar</span>
                        </div>
                        <span className="grid size-7 place-items-center rounded-full bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] transition-all group-hover:translate-x-0.5 group-hover:bg-[var(--tb-primary)] group-hover:text-white">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ResponsiveGrid>
          )}
        </section>
      ) : (
        <section aria-label="Book curriculum lessons" className="space-y-4">
          <SectionHeader
            title={`${bookDetail?.title.split(":")[0] || "Lessons"} Curriculum`}
            subtitle={bookDetail?.description}
            icon={<BookOpen className="size-5" />}
            actions={
              <FilterDropdown
                label="Filter lessons by completion status"
                value={stateFilter}
                onChange={(v) => setStateFilter(v as StateFilter)}
                options={[
                  { key: "all", label: "All", count: activeBookLessonsWithState.length },
                  {
                    key: "in-progress",
                    label: "In Progress",
                    count: activeBookLessonsWithState.filter(
                      (l) => l.progress.state === "in-progress"
                    ).length,
                  },
                  {
                    key: "review-needed",
                    label: "Review Needed",
                    count: activeBookLessonsWithState.filter(
                      (l) => l.progress.state === "review-needed"
                    ).length,
                  },
                  {
                    key: "completed",
                    label: "Completed",
                    count: activeBookLessonsWithState.filter(
                      (l) => l.progress.state === "completed"
                    ).length,
                  },
                  {
                    key: "not-started",
                    label: "Not Started",
                    count: activeBookLessonsWithState.filter(
                      (l) => l.progress.state === "not-started"
                    ).length,
                  },
                ]}
              />
            }
          />

          {loading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : !bookDetail || activeBookLessonsWithState.length === 0 ? (
            <EmptyState
              icon={<Book className="size-8" />}
              title="No lessons available"
              description="Please select another textbook curriculum above."
            />
          ) : filteredActiveLessons.length === 0 ? (
            <EmptyState
              icon={<Filter className="size-8" />}
              title="No lessons match this status filter"
              description="Try switching back to All lessons."
              action={
                <button
                  type="button"
                  onClick={() => setStateFilter("all")}
                  className="rounded-xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)] px-4 py-2 text-xs font-bold text-[var(--primary-fg)] cursor-pointer"
                >
                  Show All Lessons
                </button>
              }
            />
          ) : (
            <ResponsiveGrid columns={3} gap="md">
              {filteredActiveLessons.map(({ lesson, progress }) => {
                const href = `/books/${activeBookId}/${lesson.lessonNumber}`;

                return (
                  <Link
                    key={lesson.lessonNumber}
                    href={href}
                    className={cn(
                      "tb-focus-ring group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      getLessonCardChrome(progress.state)
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center rounded-lg bg-[var(--tb-primary)] px-2.5 py-1 text-xs font-black text-white">
                            L{lesson.lessonNumber}
                          </span>
                          {renderLessonStateBadge(progress)}
                        </div>
                        {lesson.japaneseTitle && (
                          <span className="font-japanese text-xs font-bold text-[var(--tb-text-secondary)] group-hover:text-[var(--primary-fg)] transition-colors truncate">
                            {lesson.japaneseTitle}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[var(--tb-text-primary)] group-hover:text-[var(--primary-fg)] transition-colors line-clamp-1">
                        {lesson.title}
                      </h3>

                      {lesson.subtitle && (
                        <p className="mt-1.5 text-xs text-[var(--tb-text-secondary)] line-clamp-2 leading-relaxed">
                          {lesson.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[var(--tb-border)] space-y-2.5">
                      <ProgressBar
                        value={progress.percent}
                        masteryValue={progress.masteryPercent}
                        label={
                          <span className="flex items-center gap-1">
                            <TrendingUp className="size-3 text-[var(--primary-fg)]" />
                            <span>FSRS Spaced Repetition</span>
                          </span>
                        }
                        statusText={
                          progress.inSrs > 0 ? (
                            <>
                              <strong className="text-[var(--tb-text-primary)]">
                                {progress.inSrs}
                              </strong>{" "}
                              / {progress.total} in SRS ({progress.percent}%)
                            </>
                          ) : (
                            "Not started"
                          )
                        }
                      />

                      <div className="flex items-center justify-between text-xs font-medium text-[var(--tb-text-secondary)]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--tb-text-primary)]">
                            {lesson.stats.vocabularyCount}
                          </span>
                          <span>vocab</span>
                          <span>·</span>
                          <span className="font-semibold text-[var(--tb-text-primary)]">
                            {lesson.stats.kanjiCount}
                          </span>
                          <span>kanji</span>
                          <span>·</span>
                          <span className="font-semibold text-[var(--tb-text-primary)]">
                            {lesson.stats.grammarCount}
                          </span>
                          <span>grammar</span>
                        </div>

                        <span className="grid size-7 place-items-center rounded-full bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-[var(--tb-primary)] group-hover:text-white">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ResponsiveGrid>
          )}
        </section>
      )}

      {/* G. RECENTLY STUDIED */}
      {recentHistory.length > 0 && (
        <section aria-label="Recently studied lessons" className="space-y-3">
          <SectionHeader
            title="Recently Studied"
            subtitle="Jump back into lessons and sections you recently visited"
            icon={<History className="size-4" />}
          />

          <ResponsiveGrid columns={3} gap="sm">
            {recentHistory.slice(0, 3).map((entry) => (
              <Link
                key={`${entry.bookId}-${entry.lessonNumber}`}
                href={`/books/${entry.bookId}/${entry.lessonNumber}${
                  entry.lastTab ? `?tab=${entry.lastTab}` : ""
                }`}
                className="tb-focus-ring group flex items-center justify-between gap-3 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-4 py-3 shadow-2xs hover:border-[var(--tb-primary)]/50 transition-all"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--tb-text-secondary)]">
                    <span>{entry.bookTitle}</span>
                    <span>·</span>
                    <span>L{entry.lessonNumber}</span>
                    {entry.lastTab && (
                      <span className="rounded bg-[var(--tb-accent-soft)] px-1.5 py-0.2 text-[10px] font-bold text-[var(--primary-fg)]">
                        {formatSectionLabel(entry.lastTab)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--tb-text-primary)] truncate group-hover:text-[var(--primary-fg)]">
                    {entry.lessonTitle}
                  </div>
                </div>
                <ArrowRight className="size-4 shrink-0 text-[var(--tb-text-secondary)] group-hover:text-[var(--primary-fg)] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </ResponsiveGrid>
        </section>
      )}
    </TextbookPageContainer>
  );
}
