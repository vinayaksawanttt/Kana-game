"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Book,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  GraduationCap,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  type BookCatalogEntry,
  type BookDetail,
  type BookLesson,
  getBookById,
  getBooksCatalog,
} from "@/data/books";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { srsDb, type SrsItem } from "@/lib/srs/db";

interface LastStudiedLesson {
  bookId: string;
  lessonNumber: number;
  bookTitle: string;
  lessonTitle: string;
  japaneseTitle?: string;
  coverImage?: string;
  updatedAt: number;
}

interface GlobalSearchMatch {
  bookId: string;
  bookTitle: string;
  bookSeries: string;
  bookLevel: string;
  lesson: BookLesson;
  matchSnippet?: string;
}

export default function BooksShelfPage() {
  const [catalog, setCatalog] = useState<BookCatalogEntry[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>("genki-1");
  const [bookDetail, setBookDetail] = useState<BookDetail | null>(null);
  const [allBooksMap, setAllBooksMap] = useState<Record<string, BookDetail>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBookFilter, setSearchBookFilter] = useState<string>("all");
  const [lastStudied, setLastStudied] = useState<LastStudiedLesson | null>(null);
  const [srsItems, setSrsItems] = useState<SrsItem[]>([]);

  // 1. Load Catalog & Prefetch all books for global search on mount
  useEffect(() => {
    let mounted = true;
    getBooksCatalog()
      .then(async (data) => {
        if (!mounted) return;
        setCatalog(data);
        if (data.length > 0 && !data.some((b) => b.id === activeBookId)) {
          setActiveBookId(data[0].id);
        }

        // Prefetch details for all books in catalog to power instant global search
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

  // 2. Load Book Detail when activeBookId changes
  useEffect(() => {
    let mounted = true;
    // Check if already in memory
    if (allBooksMap[activeBookId]) {
      setBookDetail(allBooksMap[activeBookId]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getBookById(activeBookId)
      .then((data) => {
        if (!mounted) return;
        setBookDetail(data);
        if (data) {
          setAllBooksMap((prev) => ({ ...prev, [data.id]: data }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed loading book ${activeBookId}:`, err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeBookId, allBooksMap]);

  // 3. Load Resume State from LocalStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("kanagame_last_studied_book");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.bookId && parsed?.lessonNumber) {
            setLastStudied(parsed);
          }
        }
      }
    } catch {
      // LocalStorage access errors ignored gracefully
    }
  }, []);

  // 4. Load FSRS Spaced Repetition items for Live Mastery Progress calculation
  useEffect(() => {
    let mounted = true;
    async function loadSrs() {
      try {
        if (typeof window !== "undefined" && srsDb?.items) {
          const items = await srsDb.items.toArray();
          if (mounted) setSrsItems(items);
        }
      } catch {
        // Dexie or IndexedDB uninitialized in SSR / mock environments
      }
    }
    loadSrs();
    return () => {
      mounted = false;
    };
  }, []);

  // Create fast indexed lookup for FSRS items
  const srsLookup = useMemo(() => {
    const map = new Map<string, SrsItem>();
    for (const item of srsItems) {
      map.set(item.id, item);
      if (item.prompt) {
        map.set(`${item.type}:${item.prompt.trim()}`, item);
      }
    }
    return map;
  }, [srsItems]);

  // Compute lesson FSRS mastery progress
  const getLessonSrsProgress = useMemo(() => {
    return (lesson: BookLesson) => {
      const totalCount =
        (lesson.stats?.vocabularyCount ?? lesson.vocabulary.length) +
        (lesson.stats?.kanjiCount ?? lesson.kanji.length) +
        (lesson.stats?.grammarCount ?? lesson.grammar.length);

      if (totalCount === 0 || srsItems.length === 0) {
        return { inSrs: 0, mastered: 0, total: totalCount, percent: 0 };
      }

      let inSrs = 0;
      let mastered = 0;

      for (const v of lesson.vocabulary) {
        const item = srsLookup.get(`vocab:${v.word.trim()}`);
        if (item) {
          inSrs++;
          if (
            item.card &&
            (item.card.state === 2 ||
              (item.card.reps && item.card.reps >= 2) ||
              (item.card.stability && item.card.stability >= 1))
          ) {
            mastered++;
          }
        }
      }

      for (const k of lesson.kanji) {
        const codePoint = k.kanji.codePointAt(0)?.toString(16).toUpperCase() ?? k.kanji;
        const item =
          srsLookup.get(`kanji:${codePoint}`) || srsLookup.get(`kanji:${k.kanji.trim()}`);
        if (item) {
          inSrs++;
          if (
            item.card &&
            (item.card.state === 2 ||
              (item.card.reps && item.card.reps >= 2) ||
              (item.card.stability && item.card.stability >= 1))
          ) {
            mastered++;
          }
        }
      }

      for (const g of lesson.grammar) {
        const item =
          srsLookup.get(`grammar:${g.linkedGrammarId || g.id}`) ||
          srsLookup.get(`grammar:${g.id}`) ||
          srsLookup.get(`grammar:${g.pattern.trim()}`);
        if (item) {
          inSrs++;
          if (
            item.card &&
            (item.card.state === 2 ||
              (item.card.reps && item.card.reps >= 2) ||
              (item.card.stability && item.card.stability >= 1))
          ) {
            mastered++;
          }
        }
      }

      const percent = Math.min(100, Math.round((inSrs / totalCount) * 100));
      return { inSrs, mastered, total: totalCount, percent };
    };
  }, [srsItems, srsLookup]);

  // 5. Global Search across all textbooks or single book filter
  const isGlobalSearchActive = searchQuery.trim().length > 0;

  const globalSearchResults = useMemo<GlobalSearchMatch[]>(() => {
    if (!isGlobalSearchActive) return [];
    const q = searchQuery.trim().toLowerCase();
    const results: GlobalSearchMatch[] = [];

    // Search across all books in map
    const booksToSearch =
      searchBookFilter === "all"
        ? Object.values(allBooksMap)
        : [allBooksMap[searchBookFilter]].filter(Boolean);

    for (const book of booksToSearch) {
      for (const lesson of book.lessons) {
        const matchNum =
          `lesson ${lesson.lessonNumber}`.includes(q) ||
          `l${lesson.lessonNumber}` === q ||
          `${lesson.lessonNumber}` === q;
        const matchTitle = lesson.title.toLowerCase().includes(q);
        const matchJa = (lesson.japaneseTitle || "").toLowerCase().includes(q);
        const matchSubtitle = (lesson.subtitle || "").toLowerCase().includes(q);

        let matchSnippet: string | undefined;

        // Check vocabulary
        const matchedVocab = lesson.vocabulary.find(
          (v) =>
            v.word.toLowerCase().includes(q) ||
            v.meaning.toLowerCase().includes(q) ||
            v.reading.toLowerCase().includes(q)
        );
        if (matchedVocab) {
          matchSnippet = `Vocab: ${matchedVocab.word} (${matchedVocab.reading}) — ${matchedVocab.meaning}`;
        }

        // Check grammar
        if (!matchSnippet) {
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

        // Check kanji
        if (!matchSnippet) {
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

        if (matchNum || matchTitle || matchJa || matchSubtitle || matchSnippet) {
          results.push({
            bookId: book.id,
            bookTitle: book.title.split(":")[0],
            bookSeries: book.series,
            bookLevel: book.level,
            lesson,
            matchSnippet,
          });
        }
      }
    }

    return results;
  }, [allBooksMap, isGlobalSearchActive, searchQuery, searchBookFilter]);

  const activeCatalogEntry = catalog.find((b) => b.id === activeBookId);

  const clearLastStudied = () => {
    try {
      window.localStorage.removeItem("kanagame_last_studied_book");
    } catch {
      // ignore
    }
    setLastStudied(null);
  };

  return (
    <GameLayout
      label="TEXTBOOK COMPANION"
      glyph="本"
      className="bg-[var(--bg)]"
      homeHref="/"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8 space-y-8">
        {/* Hero Section */}
        <header className="relative overflow-hidden rounded-3xl border border-[var(--sakura)]/50 bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--sakura-light)]/40 p-6 shadow-sm sm:p-10">
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                <Sparkles className="size-3.5" />
                <span>Textbook Structured Curriculum</span>
                <span className="opacity-60">· 教科書マスター</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-[var(--ink)]">
                Japanese Textbook Library
              </h1>
              <p className="text-sm text-[var(--muted)] sm:text-base leading-relaxed">
                Master Japanese lesson-by-lesson through the world-standard Genki and Minna no
                Nihongo curriculums. Featuring authentic dialogues, stroke-order kanji,
                contextual grammar cloze tests, interactive workbook drills, and live FSRS spaced
                repetition tracking.
              </p>
            </div>

            {/* Quick Stats Pill */}
            {activeCatalogEntry && (
              <div className="flex shrink-0 flex-row gap-3 sm:flex-col sm:items-end">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center shadow-xs sm:min-w-[180px]">
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    {activeCatalogEntry.level} Core
                  </div>
                  <div className="text-2xl font-black text-[var(--primary-fg)] mt-0.5">
                    {activeCatalogEntry.totalLessons} Lessons
                  </div>
                  <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
                    <span>{activeCatalogEntry.stats.vocabularyCount} Vocab</span>
                    <span>·</span>
                    <span>{activeCatalogEntry.stats.grammarCount} Grammar</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Continue Where You Left Off Card */}
        {lastStudied && (
          <section
            aria-label="Continue where you left off"
            className="relative overflow-hidden rounded-2xl border-2 border-[var(--primary)]/30 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--sakura-light)]/60 p-4 sm:p-5 shadow-xs transition-all hover:border-[var(--primary)]/60"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Book Thumbnail or Icon */}
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xs">
                  {lastStudied.coverImage ? (
                    <img
                      src={lastStudied.coverImage}
                      alt={lastStudied.bookTitle}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-[var(--sakura-light)] text-[var(--primary)]">
                      <BookOpen className="size-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      <Play className="size-2.5 fill-current" />
                      Continue Studying
                    </span>
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {lastStudied.bookTitle} · Lesson {lastStudied.lessonNumber}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--ink)]">
                    {lastStudied.lessonTitle}
                  </h3>
                  {lastStudied.japaneseTitle && (
                    <p className="font-japanese text-xs font-semibold text-[var(--muted)]">
                      {lastStudied.japaneseTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <Link
                  href={`/books/${lastStudied.bookId}/${lastStudied.lessonNumber}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-[var(--primary-hover)] hover:scale-102"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <button
                  onClick={clearLastStudied}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40 transition-colors cursor-pointer"
                  title="Dismiss resume card"
                  aria-label="Dismiss resume card"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Visual Textbook Bookshelf Cards */}
        <section aria-label="Book selection" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <Layers className="size-4 text-[var(--primary)]" />
              <span>Select Textbook Curriculum</span>
            </h2>
            <span className="text-xs font-semibold text-[var(--muted)]">
              {catalog.length} textbooks available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catalog.map((book) => {
              const isActive = book.id === activeBookId;
              const shortName = book.title.split(":")[0];
              const coverSrc = book.coverImage || `/images/books/${book.id}.webp`;

              return (
                <button
                  key={book.id}
                  onClick={() => {
                    setActiveBookId(book.id);
                    if (isGlobalSearchActive) {
                      setSearchBookFilter(book.id);
                    }
                  }}
                  role="button"
                  aria-label={shortName}
                  aria-pressed={isActive}
                  className={`group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-[var(--primary)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--sakura-light)]/40 shadow-md ring-2 ring-[var(--primary)]/40"
                      : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)] hover:shadow-xs hover:bg-[var(--paper-tint)]"
                  }`}
                >
                  {/* Book Spine / Cover Preview */}
                  <div className="relative w-20 shrink-0 aspect-[3/4] overflow-hidden rounded-xl border border-[var(--line)] shadow-sm bg-[var(--bg)] transition-transform duration-200 group-hover:scale-102">
                    <img
                      src={coverSrc}
                      alt={book.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/10 pointer-events-none" />
                    {/* Spine highlight line */}
                    <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none" />
                  </div>

                  {/* Book Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block font-mono text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                        {book.series}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                          book.level === "N5"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {book.level}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[var(--ink)] leading-snug truncate group-hover:text-[var(--primary-fg)] transition-colors">
                      {shortName}
                    </h3>

                    <p className="font-japanese text-xs font-semibold text-[var(--muted)] truncate">
                      {book.japaneseTitle}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[var(--muted)]">
                      <span className="font-bold text-[var(--ink)]">{book.totalLessons} Units</span>
                      <span>·</span>
                      <span>{book.stats.vocabularyCount} Vocab</span>
                      <span>·</span>
                      <span>{book.stats.grammarCount} Grammar</span>
                    </div>

                    {/* Active Indicator Status */}
                    <div className="pt-2">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--primary-fg)]">
                          <CheckCircle2 className="size-3.5 fill-[var(--primary)] text-white" />
                          <span>Currently Selected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors">
                          <span>View lessons</span>
                          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Global Search Bar & Filters */}
        <section aria-label="Textbook curriculum search" className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all textbooks or filter by lesson title, topic, vocab, or grammar..."
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-3 pl-10 pr-10 text-sm text-[var(--ink)] placeholder-[var(--muted)] shadow-xs transition-colors focus:border-[var(--primary)] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* In Global Search Mode: Filter by Textbook Pill */}
            {isGlobalSearchActive && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSearchBookFilter("all")}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all cursor-pointer ${
                    searchBookFilter === "all"
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  All Books ({globalSearchResults.length})
                </button>
                {catalog.map((b) => {
                  const matchCount = globalSearchResults.filter((r) => r.bookId === b.id).length;
                  const isFiltered = searchBookFilter === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSearchBookFilter(b.id)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isFiltered
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {b.title.split(":")[0]} ({matchCount})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Global Search Results Mode */}
        {isGlobalSearchActive ? (
          <section aria-label="Search results" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                <Search className="size-4 text-[var(--primary)]" />
                <span>
                  Found {globalSearchResults.length} matching {globalSearchResults.length === 1 ? "lesson" : "lessons"} across textbooks
                </span>
              </h2>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-[var(--primary-fg)] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line)] p-8 text-center bg-[var(--surface)]">
                <Filter className="size-8 text-[var(--muted)] opacity-50 mb-2" />
                <h3 className="text-base font-bold text-[var(--ink)]">
                  No lessons match &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Try searching for a vocabulary term, kanji character, grammar structure, or topic.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 rounded-xl border border-[var(--sakura)] bg-[var(--sakura-light)] px-4 py-2 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--sakura)]/30 transition-colors cursor-pointer"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {globalSearchResults.map(({ bookId, bookTitle, bookLevel, lesson, matchSnippet }) => {
                  const srsProgress = getLessonSrsProgress(lesson);
                  const href = `/books/${bookId}/${lesson.lessonNumber}`;

                  return (
                    <Link
                      key={`${bookId}-${lesson.lessonNumber}`}
                      href={href}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/60 hover:shadow-md"
                    >
                      <div className="space-y-2.5">
                        {/* Book Badge & Lesson Tag */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-black text-[var(--primary-fg)]">
                            <span>{bookTitle}</span>
                            <span className="opacity-50">·</span>
                            <span>L{lesson.lessonNumber}</span>
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                              bookLevel === "N5"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                            }`}
                          >
                            {bookLevel}
                          </span>
                        </div>

                        {/* Title & Japanese */}
                        <div>
                          <h3 className="text-base font-extrabold text-[var(--ink)] group-hover:text-[var(--primary-fg)] transition-colors line-clamp-1">
                            {lesson.title}
                          </h3>
                          {lesson.japaneseTitle && (
                            <p className="font-japanese text-xs font-semibold text-[var(--muted)] truncate mt-0.5">
                              {lesson.japaneseTitle}
                            </p>
                          )}
                        </div>

                        {/* Match Snippet Highlight */}
                        {matchSnippet ? (
                          <div className="rounded-xl bg-[var(--sakura-light)]/50 border border-[var(--sakura)]/40 p-2 text-xs font-semibold text-[var(--primary-fg)] line-clamp-2">
                            {matchSnippet}
                          </div>
                        ) : lesson.subtitle ? (
                          <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                            {lesson.subtitle}
                          </p>
                        ) : null}
                      </div>

                      {/* Footer SRS Progress & Arrow */}
                      <div className="mt-4 pt-3.5 border-t border-[var(--line)] space-y-2">
                        {/* FSRS Mastery Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="size-3 text-[var(--primary)]" />
                              <span>FSRS Mastery</span>
                            </span>
                            <span>
                              {srsProgress.inSrs} / {srsProgress.total} in SRS ({srsProgress.percent}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[var(--line)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--sakura)] to-[var(--primary)] transition-all duration-300"
                              style={{ width: `${srsProgress.percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)] pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--ink)]">
                              {lesson.stats?.vocabularyCount ?? lesson.vocabulary.length}
                            </span>
                            <span>vocab</span>
                            <span>·</span>
                            <span className="font-bold text-[var(--ink)]">
                              {lesson.stats?.grammarCount ?? lesson.grammar.length}
                            </span>
                            <span>grammar</span>
                          </div>
                          <span className="grid size-7 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--primary-fg)] transition-all group-hover:translate-x-0.5 group-hover:bg-[var(--primary)] group-hover:text-white">
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* Normal Book Lessons Shelf Grid */
          <section aria-label="Book curriculum lessons" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
                  <BookOpen className="size-5 text-[var(--primary)]" />
                  <span>{bookDetail?.title.split(":")[0] || "Lessons"} Curriculum</span>
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {bookDetail?.description}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center py-16">
                <SakuraLoader label="Loading textbook curriculum..." />
              </div>
            ) : !bookDetail || bookDetail.lessons.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line)] p-8 text-center bg-[var(--surface)]">
                <Book className="size-8 text-[var(--muted)] opacity-50 mb-2" />
                <h3 className="text-base font-bold text-[var(--ink)]">No lessons available</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Please select another textbook curriculum above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookDetail.lessons.map((lesson) => {
                  const srsProgress = getLessonSrsProgress(lesson);
                  const href = `/books/${activeBookId}/${lesson.lessonNumber}`;

                  return (
                    <Link
                      key={lesson.lessonNumber}
                      href={href}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/60 hover:shadow-md"
                    >
                      <div>
                        {/* Top row: Lesson badge & Japanese title */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="flex items-center justify-center rounded-lg bg-[var(--primary)] px-2.5 py-1 text-xs font-black text-white">
                            L{lesson.lessonNumber}
                          </span>
                          {lesson.japaneseTitle && (
                            <span className="font-japanese text-xs font-bold text-[var(--muted)] group-hover:text-[var(--primary-fg)] transition-colors truncate">
                              {lesson.japaneseTitle}
                            </span>
                          )}
                        </div>

                        {/* Lesson Title */}
                        <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--primary-fg)] transition-colors line-clamp-1">
                          {lesson.title}
                        </h3>

                        {/* Subtitle / Topic details */}
                        {lesson.subtitle && (
                          <p className="mt-1.5 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                            {lesson.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Bottom Section: FSRS Progress & Item Stats */}
                      <div className="mt-5 pt-3.5 border-t border-[var(--line)] space-y-2.5">
                        {/* Per-Lesson FSRS Mastery Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="size-3 text-[var(--primary)]" />
                              <span>FSRS Spaced Repetition</span>
                            </span>
                            <span>
                              {srsProgress.inSrs > 0 ? (
                                <>
                                  <strong className="text-[var(--ink)]">{srsProgress.inSrs}</strong> / {srsProgress.total} in SRS ({srsProgress.percent}%)
                                </>
                              ) : (
                                "Not started"
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[var(--line)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--sakura)] to-[var(--primary)] transition-all duration-300"
                              style={{ width: `${srsProgress.percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Counts & Action arrow */}
                        <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--ink)]">
                              {lesson.stats.vocabularyCount}
                            </span>
                            <span>vocab</span>
                            <span>·</span>
                            <span className="font-semibold text-[var(--ink)]">
                              {lesson.stats.kanjiCount}
                            </span>
                            <span>kanji</span>
                            <span>·</span>
                            <span className="font-semibold text-[var(--ink)]">
                              {lesson.stats.grammarCount}
                            </span>
                            <span>grammar</span>
                          </div>

                          <span className="grid size-7 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--primary-fg)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-[var(--primary)] group-hover:text-white">
                            <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </GameLayout>
  );
}
