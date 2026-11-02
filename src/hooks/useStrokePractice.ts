"use client";

import { useCallback, useRef, useState } from "react";
import {
  type Point2D,
  type StrokePracticeMode,
  validateDrawnStroke,
} from "@/engine/strokePractice";

export interface UseStrokePracticeOptions {
  paths: string[];
  initialMode?: StrokePracticeMode;
  toleranceRadius?: number;
}

export interface UseStrokePracticeResult {
  mode: StrokePracticeMode;
  currentStrokeIndex: number;
  completedStrokes: Point2D[][];
  activePoints: Point2D[];
  isComplete: boolean;
  lastResult: "idle" | "correct" | "retry";
  feedback: string;
  setMode: (mode: StrokePracticeMode) => void;
  beginStroke: (point: Point2D) => void;
  extendStroke: (point: Point2D) => void;
  endStroke: () => boolean;
  undo: () => void;
  reset: () => void;
}

export function useStrokePractice({
  paths,
  initialMode = "trace",
  toleranceRadius = 28,
}: UseStrokePracticeOptions): UseStrokePracticeResult {
  const [mode, setModeState] = useState<StrokePracticeMode>(initialMode);
  const [completedStrokes, setCompletedStrokes] = useState<Point2D[][]>([]);
  const [activePoints, setActivePoints] = useState<Point2D[]>([]);
  const [lastResult, setLastResult] = useState<"idle" | "correct" | "retry">("idle");
  const [feedback, setFeedback] = useState<string>(
    "Trace stroke 1 starting from the highlighted marker."
  );

  const activePointsRef = useRef<Point2D[]>([]);
  const isDrawingRef = useRef(false);

  const strokeCount = paths.length;
  const currentStrokeIndex = completedStrokes.length;
  const isComplete = strokeCount > 0 && currentStrokeIndex >= strokeCount && mode !== "free";

  const reset = useCallback(() => {
    isDrawingRef.current = false;
    activePointsRef.current = [];
    setCompletedStrokes([]);
    setActivePoints([]);
    setLastResult("idle");
    setFeedback(
      strokeCount > 0
        ? "Trace stroke 1 starting from the highlighted marker."
        : "Select a kanji to begin practicing."
    );
  }, [strokeCount]);

  const setMode = useCallback((nextMode: StrokePracticeMode) => {
    setModeState(nextMode);
    isDrawingRef.current = false;
    activePointsRef.current = [];
    setCompletedStrokes([]);
    setActivePoints([]);
    setLastResult("idle");
    setFeedback(
      nextMode === "free"
        ? "Freehand mode — draw freely on the calligraphy canvas."
        : nextMode === "recall"
          ? "Recall mode — use the starting dot to draw stroke 1 from memory."
          : "Trace stroke 1 starting from the highlighted marker."
    );
  }, []);

  const beginStroke = useCallback(
    (point: Point2D) => {
      if (mode !== "free" && strokeCount > 0 && completedStrokes.length >= strokeCount) {
        return;
      }
      isDrawingRef.current = true;
      const initial = [point];
      activePointsRef.current = initial;
      setActivePoints(initial);
    },
    [completedStrokes.length, mode, strokeCount]
  );

  const extendStroke = useCallback((point: Point2D) => {
    if (!isDrawingRef.current) return;
    const next = [...activePointsRef.current, point];
    activePointsRef.current = next;
    setActivePoints(next);
  }, []);

  const endStroke = useCallback((): boolean => {
    if (!isDrawingRef.current) return false;
    isDrawingRef.current = false;

    const drawn = activePointsRef.current;
    activePointsRef.current = [];
    setActivePoints([]);

    if (drawn.length < 2) {
      return false;
    }

    if (mode === "free" || strokeCount === 0) {
      setCompletedStrokes((prev) => [...prev, drawn]);
      setLastResult("correct");
      setFeedback("Stroke recorded on freehand canvas.");
      return true;
    }

    const targetIndex = completedStrokes.length;
    const expectedPathD = paths[targetIndex];
    if (!expectedPathD) return false;

    const validation = validateDrawnStroke(drawn, expectedPathD, toleranceRadius);
    if (validation.valid) {
      const nextIndex = targetIndex + 1;
      setCompletedStrokes((prev) => [...prev, drawn]);
      setLastResult("correct");
      if (nextIndex >= strokeCount) {
        setFeedback(`Complete! All ${strokeCount} strokes drawn.`);
      } else {
        setFeedback(`Nice! Now draw stroke ${nextIndex + 1} of ${strokeCount}.`);
      }
      return true;
    }

    setLastResult("retry");
    setFeedback(validation.feedback);
    return false;
  }, [completedStrokes.length, mode, paths, strokeCount, toleranceRadius]);

  const undo = useCallback(() => {
    isDrawingRef.current = false;
    activePointsRef.current = [];
    setActivePoints([]);
    setCompletedStrokes((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      setLastResult("idle");
      setFeedback(
        mode === "free"
          ? "Removed last stroke."
          : `Undid stroke ${prev.length}. Draw stroke ${next.length + 1} of ${strokeCount}.`
      );
      return next;
    });
  }, [mode, strokeCount]);

  return {
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
  };
}

