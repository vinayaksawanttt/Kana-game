"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { getGrammarDoc, type GrammarDoc } from "@/lib/content/grammar";
import { GrammarGuideView } from "@/components/grammar-guide-view";
import { addGrammarToSrs } from "@/lib/srs/service";

export default function GrammarDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
          Loading grammar guide...
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

  const [doc, setDoc] = useState<GrammarDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedToSrs, setSavedToSrs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getGrammarDoc(slugParam, levelParam)
      .then((loaded) => {
        if (active) {
          setDoc(loaded);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load grammar doc.", error);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [levelParam, slugParam]);

  async function handleAddToFSRS() {
    if (!doc || saving || savedToSrs) return;
    setSaving(true);
    try {
      await addGrammarToSrs({
        id: doc.point.id,
        pattern: doc.point.pattern,
        romaji: doc.point.romaji,
        meaning: doc.point.short || doc.point.long,
        level: doc.point.level,
      });
      setSavedToSrs(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
        Loading grammar guide...
      </main>
    );
  }

  if (!doc) {
    return (
      <GameLayout glyph="典" label="GRAMMAR">
        <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--primary)] uppercase">
            Not Found
          </p>
          <h1 className="mt-2 text-2xl font-bold">Grammar Guide Not Found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We could not find the grammar reference for {levelParam}/{slugParam}.
          </p>
          <Link
            href="/grammar"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-xs font-bold text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Grammar Library
          </Link>
        </div>
      </GameLayout>
    );
  }

  const { point, mdxSource } = doc;

  return (
    <GameLayout glyph="典" label="GRAMMAR">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-24 pt-4 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/grammar"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--primary)]"
          >
            <ArrowLeft className="size-3.5" />
            Back to Grammar Library
          </Link>

          <Link
            href="/games/grammar"
            className="inline-flex h-10 items-center rounded-full border border-[var(--primary)]/40 bg-[var(--paper-tint)] px-4 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
          >
            Practice in Cloze & Scramble
          </Link>
        </div>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-10">
          <div className="border-b border-[var(--line)] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-bold text-white">
                JLPT {point.level}
              </span>
              {point.romaji && (
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-0.5 text-xs font-medium text-[var(--muted)]">
                  {point.romaji}
                </span>
              )}
            </div>

            <h1
              lang="ja"
              className="font-japanese mt-4 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl"
            >
              {point.pattern}
            </h1>
            <p className="mt-2 text-base font-medium text-[var(--muted)]">{point.title}</p>
          </div>

          <div className="mt-6">
            <GrammarGuideView mdxSource={mdxSource} />
          </div>
        </article>
      </div>

      {/* Floating Add to FSRS Review button */}
      <div className="fixed right-6 bottom-6 z-30">
        <button
          type="button"
          disabled={saving || savedToSrs}
          onClick={() => void handleAddToFSRS()}
          className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold shadow-lg transition ${
            savedToSrs
              ? "border border-[var(--correct)] bg-[var(--surface)] text-[var(--correct)]"
              : "bg-[var(--primary)] text-white hover:opacity-95"
          }`}
        >
          {savedToSrs ? (
            <>
              <BookmarkCheck className="size-4" />
              <span>Added to FSRS Review</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="size-4" />
              <span>{saving ? "Saving..." : "Add to FSRS Review"}</span>
            </>
          )}
        </button>
      </div>
    </GameLayout>
  );
}

