"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Undo2 } from "lucide-react";
import type { KanjiStrokeData } from "@/data/strokes";
import type { Point2D, StrokePracticeMode } from "@/engine/strokePractice";
import { useStrokePractice } from "@/hooks/useStrokePractice";
import { StrokePlayer } from "@/components/kanji/StrokePlayer";

export interface StrokePracticeCanvasProps {
  kanji: string;
  level?: number | null;
  strokeData: KanjiStrokeData | null;
}

const CANVAS_SIZE = 327; // 3x KanjiVG 109x109 viewBox
const SCALE = CANVAS_SIZE / 109;

const MODES: { id: StrokePracticeMode; label: string; hint: string }[] = [
  { id: "trace", label: "Trace", hint: "Full stroke guides" },
  { id: "recall", label: "Recall", hint: "Starting dots only" },
  { id: "free", label: "Free", hint: "Blank calligraphy canvas" },
];

export function StrokePracticeCanvas({
  kanji,
  level = null,
  strokeData,
}: StrokePracticeCanvasProps) {
  const paths = strokeData?.paths ?? [];
  const markers = strokeData?.markers ?? [];

  const {
    mode,
    currentStrokeIndex,
    completedStrokes,
    activePoints,
    isComplete,
    lastResult,
    feedback,
    setMode,
    beginStroke,
    extendStroke,
    endStroke,
    undo,
    reset,
  } = useStrokePractice({ paths });

  const [showAnimatedDemo, setShowAnimatedDemo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Reset practice session when kanji changes
  useEffect(() => {
    reset();
  }, [kanji, reset]);

  const renderCanvas = useCallback(
    (completed: Point2D[][], active: Point2D[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvas.getContext("2d");
      } catch {
        ctx = null;
      }
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const drawPolyline = (pts: Point2D[], strokeStyle: string, lineWidth: number) => {
        if (pts.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(pts[0].x * SCALE, pts[0].y * SCALE);
        for (let i = 1; i < pts.length; i += 1) {
          ctx.lineTo(pts[i].x * SCALE, pts[i].y * SCALE);
        }
        ctx.stroke();
      };

      // Draw completed user strokes in freehand mode (in trace/recall mode, completed strokes snap cleanly to SVG paths)
      if (mode === "free") {
        for (const stroke of completed) {
          drawPolyline(stroke, "#d0104c", 10);
        }
      }

      // Draw active pointer stroke in progress
      if (active.length > 0) {
        drawPolyline(active, "#d0104c", 10.5);
      }
    },
    [mode]
  );

  useEffect(() => {
    if (typeof requestAnimationFrame === "function") {
      if (rafIdRef.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        renderCanvas(completedStrokes, activePoints);
      });
    } else {
      renderCanvas(completedStrokes, activePoints);
    }

    return () => {
      if (rafIdRef.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [activePoints, completedStrokes, renderCanvas]);

  const toKanjiVgPoint = (event: PointerEvent<HTMLCanvasElement>): Point2D => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : CANVAS_SIZE;
    const height = rect.height > 0 ? rect.height : CANVAS_SIZE;
    return {
      x: Math.max(0, Math.min(109, ((event.clientX - rect.left) / width) * 109)),
      y: Math.max(0, Math.min(109, ((event.clientY - rect.top) / height) * 109)),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    beginStroke(toKanjiVgPoint(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.buttons === 0 && event.pressure === 0) return;
    extendStroke(toKanjiVgPoint(event));
  };

  const handlePointerUp = () => {
    endStroke();
  };

  return (
    <section
      aria-label="Stroke Practice Workspace"
      className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[var(--primary-fg)] uppercase">
            Interactive Tracing Engine
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-[var(--ink)]">
            Stroke Order Practice
          </h2>
        </div>

        {/* Mode Selector: Trace / Recall / Free */}
        <div
          role="group"
          aria-label="Stroke practice mode"
          className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1 shadow-xs"
        >
          {MODES.map((m) => {
            const active = mode === m.id && !showAnimatedDemo;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setShowAnimatedDemo(false);
                  setMode(m.id);
                }}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-transparent text-[var(--ink)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {showAnimatedDemo ? (
        <div className="mt-5">
          <StrokePlayer
            kanji={kanji}
            level={level}
            strokeData={strokeData}
            onClose={() => setShowAnimatedDemo(false)}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center">
          {/* Layered SVG Guide + HTML5 Pointer Canvas */}
          <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-[var(--bg)] shadow-inner select-none">
            <svg
              viewBox="0 0 109 109"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {/* 4-Quadrant Dashed Guide Grid */}
              <g
                stroke="var(--line)"
                className="stroke-[var(--line)]"
                strokeWidth="0.8"
                strokeDasharray="3.5 3.5"
              >
                <line x1="54.5" y1="0" x2="54.5" y2="109" />
                <line x1="0" y1="54.5" x2="109" y2="54.5" />
              </g>

              {/* Background Guide Paths (Shown in Trace Mode) */}
              {mode === "trace" && (
                <g
                  fill="none"
                  stroke="var(--line)"
                  className="stroke-[var(--line)]"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {paths.map((d, idx) => (
                    <path
                      key={`trace-guide-${idx}`}
                      d={d}
                      stroke={idx === currentStrokeIndex ? "var(--sakura)" : "var(--line)"}
                      strokeWidth={idx === currentStrokeIndex ? "4.6" : "3.8"}
                    />
                  ))}
                </g>
              )}

              {/* Already Completed Strokes in Trace & Recall Modes */}
              {mode !== "free" && (
                <g
                  fill="none"
                  stroke="var(--ink)"
                  className="stroke-[var(--ink)]"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {paths.slice(0, currentStrokeIndex).map((d, idx) => (
                    <path
                      key={`done-stroke-${idx}`}
                      d={d}
                      data-testid={`completed-stroke-${idx}`}
                    />
                  ))}
                </g>
              )}

              {/* Starting Dots / Markers in Trace & Recall Modes */}
              {mode !== "free" &&
                markers.map((marker, idx) => {
                  const isCurrent = idx === currentStrokeIndex;
                  const isFuture = idx > currentStrokeIndex;
                  if (mode === "trace" && !isCurrent) return null;
                  if (mode === "recall" && !isCurrent && !isFuture) return null;

                  return (
                    <g
                      key={`practice-dot-${idx}`}
                      transform={`translate(${marker.x}, ${marker.y})`}
                      data-testid={`practice-marker-${idx}`}
                    >
                      <circle
                        cx="0"
                        cy="-2"
                        r={isCurrent ? "5.2" : "3.4"}
                        fill={isCurrent ? "var(--primary)" : "var(--sakura)"}
                        stroke="var(--surface)"
                        strokeWidth="0.9"
                      />
                      <text
                        x="0"
                        y="-1.8"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={isCurrent ? "5.5" : "4"}
                        fontWeight="700"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  );
                })}
            </svg>

            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              aria-label={`Drawing canvas for ${kanji}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative z-10 h-full w-full touch-none cursor-crosshair"
            />
          </div>

          {/* Status & Controls Panel */}
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                  Progress
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--ink)] tabular-nums">
                  {mode === "free"
                    ? `${completedStrokes.length} drawn`
                    : `${Math.min(currentStrokeIndex, paths.length)} / ${paths.length} strokes`}
                </span>
              </div>

              <p
                role="status"
                className={`mt-2.5 text-sm font-semibold ${
                  isComplete
                    ? "text-[var(--correct)]"
                    : lastResult === "retry"
                      ? "text-[var(--wrong)]"
                      : "text-[var(--ink)]"
                }`}
              >
                {feedback}
              </p>

              <p className="mt-1.5 text-xs text-[var(--muted)]">
                {mode === "trace" &&
                  "Draw along the highlighted stroke starting from the numbered red circle."}
                {mode === "recall" &&
                  "Guides are hidden — use the numbered start dots to write each stroke from memory."}
                {mode === "free" &&
                  "Blank canvas — practice writing the full character at your own pace."}
              </p>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAnimatedDemo(true)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)]"
              >
                <Play className="size-3.5" />
                <span>Play / Pause Demo</span>
              </button>

              <button
                type="button"
                onClick={undo}
                disabled={completedStrokes.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 className="size-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

