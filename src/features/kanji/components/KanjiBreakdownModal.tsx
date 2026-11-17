"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Brush, Volume2, X } from "lucide-react";
import type { KanjiRecord } from "@/data/kanji";
import { getKanjiComposites, type KanjiCompositeItem } from "@/data/kanjiVocab";
import { getRadicalsForKanji, type RadicalRecord } from "@/data/radicals";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { AudioButton } from "@/components/ui/AudioButton";

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

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="relative grid size-26 shrink-0 place-items-center rounded-2xl border-2 border-[var(--sakura)]/60 bg-[var(--bg)] shadow-inner select-none overflow-hidden">
              {/* Subtle 4-Quadrant Kanji Guide */}
              <svg
                viewBox="0 0 100 100"
                className="pointer-events-none absolute inset-0 h-full w-full stroke-[var(--line)] opacity-40"
                strokeDasharray="4 4"
                strokeWidth="1"
              >
                <line x1="50" y1="0" x2="50" y2="100" />
                <line x1="0" y1="50" x2="100" y2="50" />
              </svg>

              <span
                id="kanji-breakdown-title"
                lang="ja"
                className="font-kanji relative z-10 text-6xl leading-none text-[var(--ink)]"
              >
                {kanji.c}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                  JLPT N{kanji.jlpt}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                  Grade {kanji.grade}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary-fg)]">
                  {kanji.grade <= 6 ? "Jouyou" : "Jinmeiyō"}
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
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
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
            <p lang="ja" className="font-japanese mt-1 text-base font-semibold text-[var(--ink)]">
              {kanji.on.length > 0 ? kanji.on.join(" · ") : "—"}
            </p>
            {kanji.on.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kanji.on.map((r) => (
                  <KanjiReadingPill key={r} reading={r} type="on" size="sm" />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
            <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              Kun&apos;yomi (訓読み)
            </span>
            <p lang="ja" className="font-japanese mt-1 text-base font-semibold text-[var(--ink)]">
              {kanji.kun.length > 0 ? kanji.kun.join(" · ") : "—"}
            </p>
            {kanji.kun.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kanji.kun.map((r) => (
                  <KanjiReadingPill key={r} reading={r} type="kun" size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
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
          <div className="mt-4 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4 text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Constituent Radicals
                </span>
                <span className="text-[10px] text-[var(--muted)]">Click radical to explore</span>
              </div>
              {extraForCurrent?.radicals.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {extraForCurrent.radicals.map((rad) => (
                    <Link
                      key={rad.character}
                      href={`/games/kanji/reading?view=radicals`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-medium text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]"
                    >
                      <span lang="ja" className="font-japanese text-sm font-bold text-[var(--primary)]">
                        {rad.character}
                      </span>
                      <span className="text-[var(--muted)]">{rad.meaning}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[var(--muted)]">Loading radicals...</p>
              )}
            </div>

            {extraForCurrent && extraForCurrent.composites.length > 0 && (
              <div className="border-t border-[var(--line)] pt-3">
                <span className="font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                  Composite Words
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {extraForCurrent.composites.map((comp) => (
                    <div
                      key={`${comp.word}-${comp.reading}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span lang="ja" className="font-japanese text-sm font-bold text-[var(--ink)]">
                            {comp.word}
                          </span>
                          <span lang="ja" className="font-japanese text-xs text-[var(--primary-fg)]">
                            {comp.reading}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[var(--muted)]">
                          {comp.meaning}
                        </p>
                      </div>
                      <AudioButton
                        text={comp.word}
                        reading={comp.reading}
                        mode="vocab"
                        size="sm"
                        label={`Listen to ${comp.word}`}
                      />
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
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] cursor-pointer"
          >
            <Brush className="size-4" />
            <span>Practice Drawing</span>
          </Link>

          {showExtended ? (
            <Link
              href={`${playgroundHref}?view=details`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
            >
              <BookOpen className="size-4" />
              <span>Open in Playground</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowExtended(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] cursor-pointer"
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

