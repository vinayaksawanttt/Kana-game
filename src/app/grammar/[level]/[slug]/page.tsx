"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  ListTree,
  Sparkles,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  grammarLevels,
  isGrammarLevel,
  type GrammarCatalogEntry,
  type GrammarExample,
  type GrammarPoint,
} from "@/data/grammar";
import { getGrammarCatalogByLevel, getGrammarDoc } from "@/lib/content/grammar";
import { addGrammarToSrs, getAllSrsItems } from "@/lib/srs/service";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";

const UNIT_SIZE = 12;
const INDEX_STATE_KEY = "grammar-index-state";
const BOOKMARK_STORAGE_KEY = "grammar-bookmarked-ids";
const MASTERED_STORAGE_KEY = "grammar-mastered-ids";

function deriveGrammarTags(point: GrammarPoint): string[] {
  const tags: string[] = [];
  const combined = `${point.formation.join(" ")} ${point.meaning}`.toLowerCase();

  if (/\bverb\b/.test(combined) || /dictionary form|te-form|ta-form|nai-form|masu/.test(combined)) {
    tags.push("Verb Pattern");
  }
  if (/\bnoun\b/.test(combined)) {
    tags.push("Noun Pattern");
  }
  if (/\badjective\b|i-adj|na-adj/.test(combined)) {
    tags.push("Adjective");
  }
  if (/contrast|however|but|although/.test(combined)) {
    tags.push("Contrast");
  } else if (/conjunction|statement a/.test(combined)) {
    tags.push("Conjunction");
  }
  if (/superlative|most|best|least/.test(combined)) {
    tags.push("Comparison");
  }
  if (tags.length === 0) {
    tags.push("Grammar Expression");
  }
  return tags.slice(0, 3);
}

function detectFormationKind(rule: string, index: number): string {
  const lower = rule.toLowerCase();
  if (/\bverb\b/.test(lower)) return "Verb";
  if (/\bi-adj|\bna-adj|\badjective\b/.test(lower)) return "Adjective";
  if (/\bnoun\b/.test(lower)) return "Noun";
  if (/statement|clause|sentence/.test(lower)) return "Clause";
  return `Rule ${index + 1}`;
}

function extractPatternTokens(pattern: string): string[] {
  const cleaned = pattern
    .replace(/[〜～~（）()A-Za-z0-9.,!?、。「」\s]+/g, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\s+/)
    .filter((tok) => tok.length >= 2 || /[\u3040-\u30ff\u4e00-\u9faf]/.test(tok))
    .sort((a, b) => b.length - a.length);
}

function renderHighlightedJapanese(example: GrammarExample, pattern: string) {
  const text = example.ja || example.jp || "";
  if (!text) return null;

  const candidates: string[] = [];
  if (example.cloze?.answer) {
    candidates.push(example.cloze.answer);
  }
  candidates.push(...extractPatternTokens(pattern));

  const target = candidates.find((cand) => cand && text.includes(cand));
  if (!target) {
    return text;
  }

  const idx = text.indexOf(target);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + target.length);
  const after = text.slice(idx + target.length);

  return (
    <>
      {before}
      <mark className="rounded bg-[var(--sakura-light)] px-1 py-0.5 font-extrabold text-[var(--primary)]">
        {match}
      </mark>
      {after}
    </>
  );
}

export default function GrammarDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Loading Grammar Guide..." size="md" />
        </main>
      }
    >
      <GrammarDetailContent />
    </Suspense>
  );
}

function GrammarDetailContent() {
  const router = useRouter();
  const params = useParams<{ level: string; slug: string }>();
  const levelParam = params?.level ?? "N5";
  const slugParam = params?.slug ?? "";
  const [point, setPoint] = useState<GrammarPoint | null>(null);
  const [navigationPoints, setNavigationPoints] = useState<GrammarCatalogEntry[]>([]);
  const [srsGrammarIds, setSrsGrammarIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savedToSrs, setSavedToSrs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [manualLearned, setManualLearned] = useState(false);

  // Progressive Example Display Controls
  const [showFurigana, setShowFurigana] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set());

  // Mobile Collapsible Sidebar
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSavedToSrs(false);
    setExpandedExamples(new Set());
    const level = isGrammarLevel(levelParam.toUpperCase())
      ? (levelParam.toUpperCase() as (typeof grammarLevels)[number])
      : undefined;

    Promise.all([
      getGrammarDoc(slugParam, level),
      getGrammarCatalogByLevel("All").catch((error: unknown) => {
        console.error("Could not load grammar navigation.", error);
        return [];
      }),
    ])
      .then(([doc, catalog]) => {
        if (active) {
          setPoint(doc?.point ?? null);
          setNavigationPoints(catalog);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load grammar guide.", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [levelParam, slugParam]);

  // Sync SRS review status, bookmarks, and manual learned markers
  useEffect(() => {
    if (!point) return;
    let active = true;

    try {
      const rawBookmarks = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (rawBookmarks) {
        const parsed = JSON.parse(rawBookmarks) as unknown;
        if (Array.isArray(parsed)) {
          /* eslint-disable react-hooks/set-state-in-effect */
          setBookmarked(parsed.includes(point.id));
        }
      }
      const rawMastered = localStorage.getItem(MASTERED_STORAGE_KEY);
      if (rawMastered) {
        const parsed = JSON.parse(rawMastered) as unknown;
        if (Array.isArray(parsed)) {
          setManualLearned(parsed.includes(point.id));
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {
      // Ignore storage errors
    }

    getAllSrsItems()
      .then((items) => {
        if (!active) return;
        const ids = new Set(
          items
            .filter((item) => item.type === "grammar" && item.id.startsWith("grammar:"))
            .map((item) => item.id.slice("grammar:".length))
        );
        setSrsGrammarIds(ids);
        setSavedToSrs(ids.has(point.id));
      })
      .catch((error: unknown) => console.error("Could not load grammar review status.", error));
    return () => {
      active = false;
    };
  }, [point]);

  const currentIndex = useMemo(
    () => (point ? navigationPoints.findIndex((entry) => entry.id === point.id) : -1),
    [navigationPoints, point]
  );
  const previous = currentIndex > 0 ? navigationPoints[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? navigationPoints[currentIndex + 1] : undefined;

  // Group current level patterns into Units for sidebar navigation
  const levelNav = useMemo(() => {
    if (!point) return { units: [], currentUnitIndex: 0, levelTotal: 0, levelReviewed: 0 };
    const levelEntries = navigationPoints.filter((entry) => entry.level === point.level);
    const units: Array<{ unitIndex: number; entries: GrammarCatalogEntry[] }> = [];
    let currentUnitIndex = 0;

    for (let i = 0; i < levelEntries.length; i += UNIT_SIZE) {
      const unitIndex = Math.floor(i / UNIT_SIZE);
      const entries = levelEntries.slice(i, i + UNIT_SIZE);
      if (entries.some((e) => e.id === point.id)) {
        currentUnitIndex = unitIndex;
      }
      units.push({ unitIndex, entries });
    }

    const levelReviewed = levelEntries.filter((e) => srsGrammarIds.has(e.id)).length;
    return { units, currentUnitIndex, levelTotal: levelEntries.length, levelReviewed };
  }, [navigationPoints, point, srsGrammarIds]);

  // Preserve user's position (level and expanded unit) for returning to /grammar
  useEffect(() => {
    if (!point) return;
    try {
      const raw = sessionStorage.getItem(INDEX_STATE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { openUnits?: string[]; [k: string]: unknown }) : {};
      const existingUnits = Array.isArray(parsed.openUnits) ? parsed.openUnits : [];
      const currentUnitKey = `${point.level}-${levelNav.currentUnitIndex}`;
      const nextUnits = existingUnits.includes(currentUnitKey)
        ? existingUnits
        : [...existingUnits, currentUnitKey];

      sessionStorage.setItem(
        INDEX_STATE_KEY,
        JSON.stringify({
          ...parsed,
          selectedLevel: point.level,
          openUnits: nextUnits,
        })
      );
    } catch {
      // Ignore storage error
    }
  }, [point, levelNav.currentUnitIndex]);

  // Keyboard navigation (ArrowLeft / ArrowRight) between lessons
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && previous) {
        e.preventDefault();
        router.push(`/grammar/${previous.level}/${previous.slug}`);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(`/grammar/${next.level}/${next.slug}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previous, next, router]);

  function toggleBookmark() {
    if (!point) return;
    const nextValue = !bookmarked;
    setBookmarked(nextValue);
    try {
      const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
      const set = new Set(Array.isArray(existing) ? existing.filter((x): x is string => typeof x === "string") : []);
      if (nextValue) set.add(point.id);
      else set.delete(point.id);
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // Ignore storage errors
    }
  }

  function toggleManualLearned() {
    if (!point) return;
    const nextValue = !manualLearned;
    setManualLearned(nextValue);
    try {
      const raw = localStorage.getItem(MASTERED_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
      const set = new Set(Array.isArray(existing) ? existing.filter((x): x is string => typeof x === "string") : []);
      if (nextValue) set.add(point.id);
      else set.delete(point.id);
      localStorage.setItem(MASTERED_STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch {
      // Ignore storage errors
    }
  }

  function toggleExampleBreakdown(idx: number) {
    setExpandedExamples((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(idx)) nextSet.delete(idx);
      else nextSet.add(idx);
      return nextSet;
    });
  }

  async function handleAddToFSRS() {
    if (!point || saving || savedToSrs) return;
    setSaving(true);
    try {
      await addGrammarToSrs({
        id: point.id,
        pattern: point.pattern,
        romaji: point.romaji,
        meaning: point.meaning,
        level: point.level,
      });
      setSavedToSrs(true);
      setSrsGrammarIds((prev) => new Set(prev).add(point.id));
    } catch (error) {
      console.error("Could not save grammar point to review.", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Loading Grammar Guide..." size="md" />
      </main>
    );
  }

  if (!point) {
    return (
      <GameLayout glyph="典" label="GRAMMAR">
        <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
            Not Found
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--ink)]">Grammar Guide Not Found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We could not find the grammar reference for {levelParam}/{slugParam}.
          </p>
          <Link
            href="/grammar"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-5 text-xs font-bold text-white"
          >
            <ArrowLeft className="size-4" /> Back to Grammar Library
          </Link>
        </main>
      </GameLayout>
    );
  }

  const tags = deriveGrammarTags(point);
  const hasAnyFurigana = point.examples.some((ex) => Boolean(ex.furigana));
  const sidebarUnitsToShow =
    levelNav.units.length > 0
      ? levelNav.units
      : [
          {
            unitIndex: 0,
            entries: navigationPoints.slice(Math.max(0, currentIndex - 2), currentIndex + 3),
          },
        ];

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl flex-1 grid-cols-1 items-start gap-8 px-5 pb-28 pt-5 sm:px-8 lg:grid-cols-[265px_minmax(0,1fr)] lg:gap-10 lg:pb-12">
        <article className="min-w-0 lg:col-start-2">
          {/* Top Breadcrumb Bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/grammar"
              className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--primary)]"
            >
              <ArrowLeft className="size-3.5" /> Grammar Learning Path
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] lg:hidden cursor-pointer"
              >
                <ListTree className="size-3.5 text-[var(--primary)]" />
                <span>{point.level} Units</span>
              </button>
              <Link
                href="/games/grammar"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 text-xs font-semibold text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/50"
              >
                Practice Grammar <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Mobile Collapsible Navigation Drawer */}
          {mobileNavOpen && (
            <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 lg:hidden">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {point.level} Path • Unit {String(levelNav.currentUnitIndex + 1).padStart(2, "0")}
                </p>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {levelNav.levelReviewed} / {levelNav.levelTotal} in review
                </span>
              </div>
              <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                {(sidebarUnitsToShow[levelNav.currentUnitIndex]?.entries ?? []).map((entry) => {
                  const isCurrent = entry.id === point.id;
                  return (
                    <Link
                      key={entry.id}
                      href={`/grammar/${entry.level}/${entry.slug}`}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
                        isCurrent
                          ? "bg-[var(--sakura-light)] font-bold text-[var(--primary)]"
                          : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <span lang="ja" className="font-japanese truncate">
                        {entry.pattern}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grammar Lesson Header Card */}
          <header className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_40px_rgba(188,0,45,0.04)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  JLPT {point.level}
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]"
                  >
                    {tag}
                  </span>
                ))}
                {manualLearned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--correct)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--correct)]">
                    <Check className="size-3" /> Learned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-pressed={bookmarked}
                  onClick={toggleBookmark}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition cursor-pointer ${
                    bookmarked
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Bookmark className="size-3.5" fill={bookmarked ? "currentColor" : "none"} />
                  <span>{bookmarked ? "Bookmarked" : "Bookmark"}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={manualLearned}
                  onClick={toggleManualLearned}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition cursor-pointer ${
                    manualLearned
                      ? "border-[var(--correct)]/40 bg-[var(--correct)]/15 text-[var(--correct)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--correct)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Check className="size-3.5" />
                  <span>{manualLearned ? "Learned" : "Mark Learned"}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1
                lang="ja"
                className="font-japanese break-words text-3xl font-extrabold leading-tight text-[var(--ink)] sm:text-4xl"
              >
                {point.pattern}
              </h1>
              <AudioButton
                text={point.pattern}
                id={point.id}
                reading={point.romaji}
                mode="grammar"
                size="sm"
                label={`Listen to ${point.pattern}`}
              />
            </div>

            <p className="mt-2 text-sm font-medium text-[var(--primary)]">
              {point.romaji ? `${point.romaji} · ` : ""}
              <span className="text-[var(--muted)]">{point.title}</span>
            </p>
            <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-[var(--ink)]">
              {point.meaning}
            </p>
          </header>

          {/* Meaning & Structured Formation */}
          <div className="mt-6 grid gap-5">
            <section
              aria-labelledby="meaning-heading"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <h2
                id="meaning-heading"
                className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]"
              >
                MEANING
              </h2>
              <p className="pt-3 text-sm leading-relaxed text-[var(--ink)] sm:text-[15px]">
                {point.meaning}
              </p>
            </section>

            <section
              aria-labelledby="formation-heading"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <h2
                id="formation-heading"
                className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]"
              >
                FORMATION
              </h2>
              {point.formation.length ? (
                <ul className="space-y-3 pt-4">
                  {point.formation.map((rule, index) => {
                    const segments = rule
                      .split(/\s*\+\s*/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const kindLabel = detectFormationKind(rule, index);

                    return (
                      <li
                        key={`${rule}-${index}`}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)]/70 p-3.5"
                      >
                        <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                          {kindLabel}
                        </span>
                        {segments.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {segments.map((seg, segIdx) => (
                              <Fragment key={`${seg}-${segIdx}`}>
                                <span className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-japanese text-sm font-semibold text-[var(--ink)]">
                                  {seg}
                                </span>
                                {segIdx < segments.length - 1 && (
                                  <span className="text-xs font-bold text-[var(--primary)]">+</span>
                                )}
                              </Fragment>
                            ))}
                          </div>
                        ) : (
                          <span className="font-japanese text-sm font-semibold leading-relaxed text-[var(--ink)]">
                            {rule}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="pt-3 text-sm text-[var(--muted)]">No formation note available.</p>
              )}
            </section>

            {/* Explanation + Progressive Usage Notes */}
            <section
              aria-labelledby="explanation-heading"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <h2
                id="explanation-heading"
                className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]"
              >
                EXPLANATION
              </h2>
              <p className="pt-3 text-sm leading-7 text-[var(--ink)] sm:text-[15px]">
                {point.explanation || point.long || point.meaning}
              </p>

              {point.notes && (
                <div className="mt-5 space-y-2.5 border-t border-[var(--line)]/60 pt-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <Sparkles className="size-3.5 text-[var(--primary)]" /> Deeper Usage & Nuances
                  </p>

                  {point.notes.nuance && (
                    <details className="group rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-4 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--ink)] marker:hidden [&::-webkit-details-marker]:hidden">
                        <span>Grammatical Nuance & Formality</span>
                        <ChevronDown className="size-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-2.5 border-t border-[var(--line)]/50 pt-2.5 text-sm leading-relaxed text-[var(--muted)]">
                        {point.notes.nuance}
                      </p>
                    </details>
                  )}

                  {point.notes.contrast && (
                    <details className="group rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-4 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--ink)] marker:hidden [&::-webkit-details-marker]:hidden">
                        <span>Usage Notes & Contrast</span>
                        <ChevronDown className="size-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-2.5 border-t border-[var(--line)]/50 pt-2.5 text-sm leading-relaxed text-[var(--muted)]">
                        {point.notes.contrast}
                      </p>
                    </details>
                  )}

                  {point.notes.pitfalls && (
                    <details className="group rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 px-4 py-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--ink)] marker:hidden [&::-webkit-details-marker]:hidden">
                        <span>Common Mistakes & Pitfalls</span>
                        <ChevronDown className="size-4 text-[var(--muted)] transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-2.5 border-t border-[var(--line)]/50 pt-2.5 text-sm leading-relaxed text-[var(--muted)]">
                        {point.notes.pitfalls}
                      </p>
                    </details>
                  )}
                </div>
              )}

              {Array.isArray(point.relatedPatterns) && point.relatedPatterns.length > 0 && (
                <div className="mt-4 border-t border-[var(--line)]/60 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Related patterns:
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {point.relatedPatterns.map((rel) => (
                      <span
                        key={rel}
                        className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 font-japanese text-xs font-semibold text-[var(--ink)]"
                      >
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Interactive Example Sentences */}
            <section
              aria-labelledby="examples-heading"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div className="flex items-baseline gap-2">
                  <h2
                    id="examples-heading"
                    className="text-xs font-bold tracking-[0.12em] text-[var(--primary)]"
                  >
                    EXAMPLE SENTENCES
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    ({point.examples.length})
                  </span>
                </div>

                {/* Display Toggles for Furigana / Romaji / Translation */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {hasAnyFurigana && (
                    <button
                      type="button"
                      aria-pressed={showFurigana}
                      onClick={() => setShowFurigana((v) => !v)}
                      className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold transition cursor-pointer ${
                        showFurigana
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                          : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                      }`}
                    >
                      {showFurigana ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      <span>Furigana</span>
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={showRomaji}
                    onClick={() => setShowRomaji((v) => !v)}
                    className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold transition cursor-pointer ${
                      showRomaji
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                    }`}
                  >
                    {showRomaji ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    <span>Romaji</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={showTranslation}
                    onClick={() => setShowTranslation((v) => !v)}
                    className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold transition cursor-pointer ${
                      showTranslation
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary)]"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]"
                    }`}
                  >
                    {showTranslation ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    <span>Translation</span>
                  </button>
                </div>
              </div>

              <ol className="divide-y divide-[var(--line)]">
                {point.examples.map((example, index) => {
                  const isExpanded = expandedExamples.has(index);
                  const hasBreakdown =
                    (Array.isArray(example.chunks) && example.chunks.length > 0) ||
                    Boolean(example.literalEn) ||
                    Boolean(example.romaji);

                  return (
                    <li key={`${example.jp}-${index}`} className="py-5 first:pt-4 last:pb-1">
                      <div className="flex items-start gap-3">
                        <span className="mt-1.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] text-[11px] font-bold text-[var(--primary)] tabular-nums">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            lang="ja"
                            className="font-japanese text-xl leading-relaxed text-[var(--ink)]"
                          >
                            {showFurigana && example.furigana ? (
                              <ruby>
                                {renderHighlightedJapanese(example, point.pattern)}
                                <rt className="text-xs text-[var(--muted)]">{example.furigana}</rt>
                              </ruby>
                            ) : (
                              renderHighlightedJapanese(example, point.pattern)
                            )}
                          </p>

                          {showRomaji && example.romaji && (
                            <p className="mt-1.5 text-xs font-medium text-[var(--primary)]/85">
                              {example.romaji}
                            </p>
                          )}

                          {showTranslation && (
                            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                              {example.en}
                            </p>
                          )}

                          {hasBreakdown && (
                            <div className="mt-2.5">
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                onClick={() => toggleExampleBreakdown(index)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                              >
                                <ChevronDown
                                  className={`size-3.5 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                                <span>{isExpanded ? "Hide breakdown" : "Breakdown"}</span>
                              </button>

                              {isExpanded && (
                                <div className="mt-2 rounded-xl border border-[var(--line)] bg-[var(--bg)]/60 p-3 text-xs">
                                  {Array.isArray(example.chunks) && example.chunks.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {example.chunks.map((chunk, chunkIdx) => (
                                        <span
                                          key={`${chunk}-${chunkIdx}`}
                                          className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 font-japanese font-semibold text-[var(--ink)]"
                                        >
                                          {chunk}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {example.romaji && !showRomaji && (
                                    <p className="mt-2 text-[var(--muted)]">
                                      <strong className="text-[var(--ink)]">Romaji:</strong>{" "}
                                      {example.romaji}
                                    </p>
                                  )}
                                  {example.literalEn && example.literalEn !== example.en && (
                                    <p className="mt-1 text-[var(--muted)]">
                                      <strong className="text-[var(--ink)]">Literal:</strong>{" "}
                                      {example.literalEn}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <AudioButton
                          text={example.ja || example.jp}
                          mode="sentence"
                          reading={example.furigana}
                          romaji={example.romaji}
                          size="sm"
                          label={`Listen to example ${index + 1}`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          {/* Previous / Next Lesson Pagination */}
          <nav
            aria-label="Grammar lesson pagination"
            className="mt-6 grid gap-3 sm:grid-cols-2"
          >
            {previous ? (
              <Link
                href={`/grammar/${previous.level}/${previous.slug}`}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[var(--muted)]">
                    Previous ({previous.level})
                  </span>
                  <span lang="ja" className="font-japanese block truncate font-bold">
                    {previous.pattern}
                  </span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/grammar/${next.level}/${next.slug}`}
                className="flex min-h-16 items-center justify-end gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-right text-sm text-[var(--ink)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-[var(--muted)]">
                    Next ({next.level})
                  </span>
                  <span lang="ja" className="font-japanese block truncate font-bold">
                    {next.pattern}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>

        {/* Left Sticky Sidebar Navigation */}
        <aside className="order-2 min-w-0 border-t border-[var(--line)] pt-5 lg:order-1 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-6 lg:border-t-0 lg:pt-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)]/60 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Lesson navigation
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-[var(--ink)]">{point.level} Path</h2>
              </div>
              <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-1 text-xs font-bold text-[var(--primary)] tabular-nums">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${navigationPoints.length}` : point.level}
              </span>
            </div>

            {levelNav.levelTotal > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
                  <span>{point.level} Review Progress</span>
                  <span className="tabular-nums">
                    {levelNav.levelReviewed} / {levelNav.levelTotal}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                  <div
                    className="h-full rounded-full bg-[var(--correct)] transition-all duration-300"
                    style={{
                      width: `${Math.round((levelNav.levelReviewed / levelNav.levelTotal) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <nav
              aria-label="Nearby grammar patterns"
              className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1"
            >
              {sidebarUnitsToShow.map((unit) => {
                const isActiveUnit = unit.unitIndex === levelNav.currentUnitIndex;
                return (
                  <details
                    key={unit.unitIndex}
                    open={isActiveUnit}
                    className="group rounded-xl border border-[var(--line)]/60 bg-[var(--bg)]/40 px-2.5 py-1.5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] marker:hidden [&::-webkit-details-marker]:hidden">
                      <span className={isActiveUnit ? "text-[var(--primary)]" : ""}>
                        Unit {String(unit.unitIndex + 1).padStart(2, "0")}
                      </span>
                      <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-1 space-y-0.5 pb-1">
                      {unit.entries.map((entry) => {
                        const isCurrent = entry.id === point.id;
                        const reviewed = srsGrammarIds.has(entry.id);
                        return (
                          <Link
                            key={entry.id}
                            href={`/grammar/${entry.level}/${entry.slug}`}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`flex min-h-9 items-center justify-between gap-2 rounded-lg border-l-2 px-2.5 py-1.5 text-xs transition ${
                              isCurrent
                                ? "border-[var(--primary)] bg-[var(--sakura-light)]/60 font-bold text-[var(--primary)]"
                                : "border-transparent text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                            }`}
                          >
                            <span lang="ja" className="font-japanese min-w-0 truncate">
                              {entry.pattern}
                            </span>
                            {reviewed && (
                              <Check
                                className="size-3 shrink-0 text-[var(--correct)]"
                                aria-hidden="true"
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </nav>

            <p className="mt-3 hidden text-[10px] font-medium text-[var(--muted)] lg:block">
              Tip: Press <kbd className="rounded border border-[var(--line)] px-1 font-mono">←</kbd> /{" "}
              <kbd className="rounded border border-[var(--line)] px-1 font-mono">→</kbd> to switch lessons
            </p>
          </div>

          <button
            type="button"
            disabled={saving || savedToSrs}
            aria-pressed={savedToSrs}
            onClick={() => void handleAddToFSRS()}
            className={`fixed inset-x-3 bottom-3 z-30 mx-auto flex min-h-12 w-auto max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-lg transition lg:static lg:mt-4 lg:min-h-12 lg:w-full lg:max-w-none lg:shadow-none cursor-pointer ${
              savedToSrs
                ? "border border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            }`}
          >
            {savedToSrs ? (
              <BookmarkCheck className="size-4" />
            ) : (
              <BookmarkPlus className="size-4" />
            )}
            {savedToSrs ? "Added to FSRS Review" : saving ? "Saving..." : "Add to FSRS Review"}
          </button>
        </aside>
      </div>
    </GameLayout>
  );
}
