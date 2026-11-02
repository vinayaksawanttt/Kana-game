"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { KanjiLevel } from "@/data/kanji";
import { getKanjiStrokeData, type KanjiStrokeData } from "@/data/strokes";
import { type PlaybackSpeed, useStrokeAnimation } from "@/hooks/useStrokeAnimation";

export interface StrokePlayerProps {
  kanji: string;
  level?: KanjiLevel | number | null;
  strokeData?: KanjiStrokeData | null;
  onClose?: () => void;
  className?: string;
}

const DEFAULT_STROKE_LENGTH = 120;
const EMPTY_PATHS: string[] = [];
const EMPTY_MARKERS: { x: number; y: number }[] = [];

export function StrokePlayer({
  kanji,
  level = null,
  strokeData: providedStrokeData,
  onClose,
  className = "",
}: StrokePlayerProps) {
  const [loadedEntry, setLoadedEntry] = useState<{
    kanji: string;
    data: KanjiStrokeData | null;
  } | null>(null);

  const foregroundPathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    if (providedStrokeData !== undefined) {
      return;
    }

    let cancelled = false;
    void getKanjiStrokeData(kanji, level)
      .then((data) => {
        if (!cancelled && typeof window !== "undefined") {
          setLoadedEntry({ kanji, data });
        }
      })
      .catch(() => {
        if (!cancelled && typeof window !== "undefined") {
          setLoadedEntry({ kanji, data: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kanji, level, providedStrokeData]);

  const activeData =
    providedStrokeData !== undefined
      ? providedStrokeData
      : loadedEntry?.kanji === kanji
        ? loadedEntry.data
        : null;

  const isLoading = providedStrokeData === undefined && loadedEntry?.kanji !== kanji;

  const paths = activeData?.paths ?? EMPTY_PATHS;
  const markers = activeData?.markers ?? EMPTY_MARKERS;

  const fallbackLengths = useMemo(
    () => paths.map(() => DEFAULT_STROKE_LENGTH),
    [paths]
  );

  const {
    isPlaying,
    isComplete,
    playbackSpeed,
    currentStrokeIndex,
    strokeTimings,
    play,
    pause,
    reset,
    setSpeed,
  } = useStrokeAnimation(fallbackLengths, foregroundPathRefs);

  useEffect(() => {
    foregroundPathRefs.current = foregroundPathRefs.current.slice(0, paths.length);
    reset();
  }, [kanji, paths.length, reset]);

  if (isLoading && !activeData) {
    return (
      <div
        className={`rounded-md border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-sm ${className}`}
        aria-label={`Loading stroke order for ${kanji}`}
      >
        <div className="aspect-square w-full max-w-[220px] mx-auto animate-pulse rounded-md border border-[var(--line)] bg-[var(--bg)]" />
      </div>
    );
  }

  if (!activeData || paths.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-md border border-[var(--line)] bg-[var(--surface)] p-3.5 text-[var(--ink)] shadow-sm ${className}`}
      data-testid="stroke-player"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
            Stroke Order
          </span>
          <span className="rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)] tabular-nums">
            {isPlaying
              ? `Stroke ${Math.min(currentStrokeIndex + 1, paths.length)} / ${paths.length}`
              : `${paths.length} ${paths.length === 1 ? "stroke" : "strokes"}`}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide stroke order"
            className="inline-flex h-7 items-center gap-1 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
          >
            <X className="size-3.5" />
            <span>Hide</span>
          </button>
        )}
      </div>

      {/* Washi 4-Quadrant Calligraphy Canvas */}
      <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] p-2 shadow-inner">
        <svg
          viewBox="0 0 109 109"
          className="h-full w-full select-none"
          role="img"
          aria-label={`Stroke order diagram for ${activeData.kanji} (${paths.length} strokes)`}
        >
          {/* 4-Quadrant Dashed Guide Lines */}
          <g
            aria-hidden="true"
            stroke="var(--line)"
            className="stroke-[var(--line)]"
            strokeWidth="0.9"
            strokeDasharray="3.5 3.5"
          >
            <line x1="54.5" y1="0" x2="54.5" y2="109" />
            <line x1="0" y1="54.5" x2="109" y2="54.5" />
          </g>

          {/* Faint Complete Kanji Guide Paths */}
          <g
            data-testid="stroke-guide-paths"
            fill="none"
            stroke="var(--line)"
            className="stroke-[var(--line)]"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {paths.map((d, index) => (
              <path
                key={`guide-${activeData.kanji}-${index}`}
                d={d}
                data-testid={`stroke-guide-path-${index}`}
              />
            ))}
          </g>

          {/* Animated Foreground Sumi Ink Paths */}
          <g
            data-testid="stroke-foreground-paths"
            fill="none"
            stroke="var(--ink)"
            className="stroke-[var(--ink)]"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {paths.map((d, index) => {
              const timing = strokeTimings[index] ?? {
                length: DEFAULT_STROKE_LENGTH,
                durationMs: 400,
                delayMs: 0,
                transitionDuration: "400ms",
                transitionDelay: "0ms",
              };

              const isAlreadyDrawnBeforePause = !isPlaying && index < currentStrokeIndex;
              const isDrawn = isComplete || isPlaying || isAlreadyDrawnBeforePause;
              const dashOffset = isDrawn ? 0 : timing.length;

              const transitionDuration = isPlaying ? timing.transitionDuration : "0ms";
              const transitionDelay = isPlaying ? timing.transitionDelay : "0ms";

              return (
                <path
                  key={`fg-${activeData.kanji}-${index}`}
                  ref={(el) => {
                    foregroundPathRefs.current[index] = el;
                  }}
                  d={d}
                  className="stroke-anim-path stroke-[var(--ink)]"
                  data-testid={`stroke-fg-path-${index}`}
                  style={{
                    strokeDasharray: `${timing.length}`,
                    strokeDashoffset: `${dashOffset}`,
                    transitionProperty: "stroke-dashoffset",
                    transitionDuration,
                    transitionDelay,
                    transitionTimingFunction: "ease-in-out",
                  }}
                />
              );
            })}
          </g>

          {/* Numbered Stroke Start Markers */}
          <g data-testid="stroke-markers">
            {markers.map((marker, index) => {
              const timing = strokeTimings[index] ?? {
                durationMs: 320,
                delayMs: 0,
                transitionDelay: "0ms",
              };

              const isVisible =
                isComplete ||
                isPlaying ||
                (!isPlaying && index < currentStrokeIndex);

              const markerDelay = isPlaying ? timing.transitionDelay : "0ms";
              const markerDuration = isPlaying ? "180ms" : "0ms";

              return (
                <g
                  key={`marker-${activeData.kanji}-${index}`}
                  className="stroke-anim-marker"
                  data-testid={`stroke-marker-${index}`}
                  transform={`translate(${marker.x}, ${marker.y})`}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transitionProperty: "opacity",
                    transitionDuration: markerDuration,
                    transitionDelay: markerDelay,
                  }}
                >
                  <circle
                    cx="0"
                    cy="-2.5"
                    r="4.5"
                    fill="var(--primary)"
                    stroke="var(--surface)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="-2.3"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="5"
                    fontWeight="700"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Controls Toolbar */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? "Pause stroke animation" : "Play stroke animation"}
          aria-pressed={isPlaying}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          type="button"
          onClick={reset}
          aria-label="Reset stroke animation"
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
        >
          ↺ Reset
        </button>

        <div
          className="inline-flex min-h-11 items-center gap-0.5 rounded-md border border-[var(--line)] bg-[var(--surface)] p-0.5 shadow-sm"
          role="group"
          aria-label="Playback speed"
        >
          {([1, 2] as const satisfies readonly PlaybackSpeed[]).map((speed) => {
            const active = playbackSpeed === speed;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => setSpeed(speed)}
                aria-pressed={active}
                className={`min-h-9 min-w-9 rounded px-2 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
                }`}
              >
                {speed}x
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
