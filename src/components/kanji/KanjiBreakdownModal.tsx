"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Brush, X } from "lucide-react";
import type { KanjiRecord } from "@/data/kanji";
import { getKanjiComposites, type KanjiCompositeItem } from "@/data/kanjiVocab";
import { getRadicalsForKanji, type RadicalRecord } from "@/data/radicals";

export interface KanjiBreakdownModalProps {
  kanji: KanjiRecord | null;
  onClose: () => void;
}

export function KanjiBreakdownModal({ kanji, onClose }: KanjiBreakdownModalProps) {
  const [showExtended, setShowExtended] = useState(false);
  const [loadedExtra, setLoadedExtra] = useState<{
    kanji: string;
    composites: KanjiCompositeItem[];
    radicals: RadicalRecord[];
  } | null>(null);

  useEffect(() => {
    if (!kanji) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [kanji, onClose]);

  useEffect(() => {
    if (!kanji || !showExtended) return;
    if (loadedExtra?.kanji === kanji.c) return;

    let cancelled = false;
    void Promise.all([
      getKanjiComposites(kanji.c, kanji.jlpt),
      getRadicalsForKanji(kanji.c),
    ])
      .then(([composites, radicals]) => {
        if (!cancelled && typeof window !== "undefined") {
          setLoadedExtra({
            kanji: kanji.c,
            composites: composites.slice(0, 4),
            radicals,
          });
        }
      })
      .catch(() => {
        if (!cancelled && typeof window !== "undefined") {
          setLoadedExtra({
            kanji: kanji.c,
            composites: [],
            radicals: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kanji, loadedExtra?.kanji, showExtended]);

  if (!kanji) return null;

  const playgroundHref = `/games/kanji/playground/${encodeURIComponent(kanji.c)}`;
  const extraForCurrent = loadedExtra?.kanji === kanji.c ? loadedExtra : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kanji-breakdown-title"
    >
      <button
        type="button"
        aria-label="Close kanji breakdown modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="grid size-24 shrink-0 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--bg)] shadow-inner">
              <span
                id="kanji-breakdown-title"
                lang="ja"
                className="font-kanji text-6xl leading-none text-[var(--ink)]"
              >
                {kanji.c}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                  JLPT N{kanji.jlpt}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                  Grade {kanji.grade}
                </span>
              </div>
              <h2 className="mt-2.5 text-xl font-bold leading-snug text-[var(--ink)]">
                {kanji.meanings.join(", ")}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Readings */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
            <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              On&apos;yomi (音読み)
            </span>
            <p lang="ja" className="font-japanese mt-1.5 text-base font-semibold text-[var(--ink)]">
              {kanji.on.length > 0 ? kanji.on.join(" · ") : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
            <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              Kun&apos;yomi (訓読み)
            </span>
            <p lang="ja" className="font-japanese mt-1.5 text-base font-semibold text-[var(--ink)]">
              {kanji.kun.length > 0 ? kanji.kun.join(" · ") : "—"}
            </p>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Strokes
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--ink)] tabular-nums">
              {kanji.strokes}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Grade
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--ink)] tabular-nums">
              {kanji.grade}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              JLPT
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--primary-fg)]">
              N{kanji.jlpt}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
              Frequency
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--ink)] tabular-nums">
              {kanji.freq ? `#${kanji.freq}` : "—"}
            </p>
          </div>
        </div>

        {/* Optional inline Full Details expansion */}
        {showExtended && (
          <div className="mt-4 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5 text-xs">
            <div>
              <span className="font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                Constituent Radicals
              </span>
              {extraForCurrent?.radicals.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {extraForCurrent.radicals.map((rad) => (
                    <span
                      key={rad.character}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 font-medium text-[var(--ink)]"
                    >
                      <span lang="ja" className="font-japanese text-sm font-bold text-[var(--primary-fg)]">
                        {rad.character}
                      </span>
                      <span className="text-[var(--muted)]">{rad.meaning}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[var(--muted)]">Loading radicals...</p>
              )}
            </div>

            {extraForCurrent && extraForCurrent.composites.length > 0 && (
              <div className="border-t border-[var(--line)] pt-2.5">
                <span className="font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Composite Words
                </span>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  {extraForCurrent.composites.map((comp) => (
                    <div
                      key={`${comp.word}-${comp.reading}`}
                      className="flex items-baseline justify-between gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5"
                    >
                      <div>
                        <span lang="ja" className="font-japanese font-bold text-[var(--ink)]">
                          {comp.word}
                        </span>{" "}
                        <span lang="ja" className="font-japanese text-[11px] text-[var(--muted)]">
                          ({comp.reading})
                        </span>
                      </div>
                      <span className="truncate text-[11px] text-[var(--muted)]">
                        {comp.meaning}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={playgroundHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
          >
            <Brush className="size-4" />
            <span>Practice Drawing</span>
          </Link>

          {showExtended ? (
            <Link
              href={`${playgroundHref}?view=details`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
            >
              <BookOpen className="size-4" />
              <span>Open in Playground</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowExtended(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
            >
              <BookOpen className="size-4" />
              <span>Full Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

