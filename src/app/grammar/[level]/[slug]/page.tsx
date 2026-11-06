"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { grammarLevels, isGrammarLevel, type GrammarCatalogEntry, type GrammarPoint } from "@/data/grammar";
import { getGrammarCatalogByLevel, getGrammarDoc } from "@/lib/content/grammar";
import { addGrammarToSrs, getAllSrsItems } from "@/lib/srs/service";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";

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
  const params = useParams<{ level: string; slug: string }>();
  const levelParam = params?.level ?? "N5";
  const slugParam = params?.slug ?? "";
  const [point, setPoint] = useState<GrammarPoint | null>(null);
  const [navigationPoints, setNavigationPoints] = useState<GrammarCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToSrs, setSavedToSrs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSavedToSrs(false);
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

  useEffect(() => {
    if (!point) return;
    let active = true;
    getAllSrsItems()
      .then((items) => {
        if (active) {
          setSavedToSrs(items.some((item) => item.type === "grammar" && item.id === `grammar:${point.id}`));
        }
      })
      .catch((error: unknown) => console.error("Could not load grammar review status.", error));
    return () => {
      active = false;
    };
  }, [point]);

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
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">Not Found</p>
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

  const currentIndex = navigationPoints.findIndex((entry) => entry.id === point.id);
  const previous = currentIndex > 0 ? navigationPoints[currentIndex - 1] : undefined;
  const next = navigationPoints[currentIndex + 1];
  const nearbyPoints = navigationPoints.slice(Math.max(0, currentIndex - 2), currentIndex + 3);

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl flex-1 grid-cols-1 items-start gap-8 px-5 pb-28 pt-5 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:pb-10">
        <article className="min-w-0 lg:col-start-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/grammar"
              className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <ArrowLeft className="size-3.5" /> Grammar Learning Path
            </Link>
            <Link
              href="/games/grammar"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--paper-tint)]"
            >
              Practice this grammar <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <header className="border-b border-[var(--line)] pb-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              JLPT {point.level} · Grammar Lesson
            </p>
            <h1 lang="ja" className="font-japanese mt-3 break-words text-3xl font-bold leading-tight text-[var(--ink)] sm:text-4xl">
              {point.pattern}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {point.romaji ? `${point.romaji} · ` : ""}{point.title}
            </p>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--ink)]">
              {point.meaning}
            </p>
          </header>

          <section aria-labelledby="meaning-heading" className="border-b border-[var(--line)] py-6">
            <h2 id="meaning-heading" className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]">
              MEANING
            </h2>
            <p className="pt-3 text-sm leading-relaxed text-[var(--ink)]">{point.meaning}</p>
          </section>

          <section aria-labelledby="formation-heading" className="border-b border-[var(--line)] py-6">
            <h2 id="formation-heading" className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]">
              FORMATION
            </h2>
            {point.formation.length ? (
              <ul className="space-y-2 pt-3">
                {point.formation.map((rule, index) => (
                  <li key={`${rule}-${index}`} className="font-japanese text-sm leading-relaxed text-[var(--ink)]">
                    {rule}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pt-3 text-sm text-[var(--muted)]">No formation note available.</p>
            )}
          </section>

          <section aria-labelledby="explanation-heading" className="border-b border-[var(--line)] py-6">
            <h2 id="explanation-heading" className="border-b border-[var(--line)] pb-2 text-xs font-bold tracking-[0.12em] text-[var(--primary)]">
              EXPLANATION
            </h2>
            <p className="pt-3 text-sm leading-7 text-[var(--ink)]">
              {point.explanation || point.long || point.meaning}
            </p>
          </section>

          <section aria-labelledby="examples-heading" className="py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
              <h2 id="examples-heading" className="text-xs font-bold tracking-[0.12em] text-[var(--primary)]">
                EXAMPLE SENTENCES
              </h2>
              <span className="text-xs text-[var(--muted)]">{point.examples.length} examples</span>
            </div>
            <ol className="divide-y divide-[var(--line)]">
              {point.examples.map((example, index) => (
                <li key={`${example.jp}-${index}`} className="py-5">
                  <div className="flex items-start gap-2">
                    <p lang="ja" className="font-japanese min-w-0 flex-1 text-xl leading-relaxed text-[var(--ink)]">
                      {example.furigana ? (
                        <ruby>{example.ja}<rt className="text-xs text-[var(--muted)]">{example.furigana}</rt></ruby>
                      ) : example.ja}
                    </p>
                    <AudioButton
                      text={example.ja}
                      size="md"
                      label={`Listen to example ${index + 1}`}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{example.en}</p>
                  {example.romaji && (
                    <p className="mt-1 text-xs text-[var(--muted)]/80">{example.romaji}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <nav aria-label="Grammar lesson pagination" className="grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-2">
            {previous ? (
              <Link
                href={`/grammar/${previous.level}/${previous.slug}`}
                className="flex min-h-16 items-center gap-3 border-b border-[var(--line)] py-3 text-sm text-[var(--ink)] hover:text-[var(--primary)] sm:border-b-0"
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-[var(--muted)]">Previous pattern</span>
                  <span lang="ja" className="font-japanese block truncate font-semibold">{previous.pattern}</span>
                </span>
              </Link>
            ) : <span />}
            {next ? (
              <Link
                href={`/grammar/${next.level}/${next.slug}`}
                className="flex min-h-16 items-center justify-end gap-3 border-b border-[var(--line)] py-3 text-right text-sm text-[var(--ink)] hover:text-[var(--primary)] sm:border-b-0"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] text-[var(--muted)]">Next pattern</span>
                  <span lang="ja" className="font-japanese block truncate font-semibold">{next.pattern}</span>
                </span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            ) : <span />}
          </nav>
        </article>

        <aside className="order-2 min-w-0 border-t border-[var(--line)] pt-5 lg:order-1 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-6 lg:border-t-0 lg:pt-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Lesson navigation</p>
              <h2 className="mt-1 text-lg font-bold text-[var(--ink)]">{point.level} Path</h2>
            </div>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${navigationPoints.length}` : point.level}
            </span>
          </div>

          <nav aria-label="Nearby grammar patterns" className="mt-4 space-y-1">
            {nearbyPoints.map((entry) => {
              const isCurrent = entry.id === point.id;
              return (
                <Link
                  key={entry.id}
                  href={`/grammar/${entry.level}/${entry.slug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 border-l-2 px-3 py-2 text-sm transition ${
                    isCurrent
                      ? "border-[var(--primary)] bg-[var(--paper-tint)] font-semibold text-[var(--primary)]"
                      : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span className="w-7 shrink-0 text-[10px] font-bold text-[var(--muted)]">{entry.level}</span>
                  <span lang="ja" className="font-japanese min-w-0 truncate">{entry.pattern}</span>
                </Link>
              );
            })}
          </nav>

          <Link href="/games/grammar" className="mt-4 inline-flex text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)]">
            Grammar practice <ArrowRight className="ml-1 size-3.5" />
          </Link>

          <button
            type="button"
            disabled={saving || savedToSrs}
            aria-pressed={savedToSrs}
            onClick={() => void handleAddToFSRS()}
            className={`fixed inset-x-3 bottom-3 z-30 mx-auto flex min-h-12 w-auto max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 rounded-md px-4 text-sm font-bold shadow-lg transition lg:static lg:mt-5 lg:min-h-12 lg:w-full lg:max-w-none lg:shadow-none ${
              savedToSrs
                ? "border border-[var(--correct)]/40 bg-[var(--correct)]/10 text-[var(--correct)]"
                : "bg-[var(--primary)] text-white hover:opacity-95"
            }`}
          >
            {savedToSrs ? <BookmarkCheck className="size-4" /> : <BookmarkPlus className="size-4" />}
            {savedToSrs ? "Added to FSRS Review" : saving ? "Saving..." : "Add to FSRS Review"}
          </button>
        </aside>
      </div>
    </GameLayout>
  );
}
