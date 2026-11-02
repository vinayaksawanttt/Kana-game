"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlaybackSpeed = 1 | 2;

export interface StrokeTiming {
  index: number;
  length: number;
  durationMs: number;
  delayMs: number;
  transitionDuration: string;
  transitionDelay: string;
}

export interface UseStrokeAnimationResult {
  isPlaying: boolean;
  isComplete: boolean;
  playbackSpeed: PlaybackSpeed;
  currentStrokeIndex: number;
  strokeTimings: StrokeTiming[];
  totalDurationMs: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (multiplier: PlaybackSpeed) => void;
}

const DEFAULT_PATH_LENGTH = 120;

export function readSvgPathLength(pathEl: SVGPathElement | null | undefined): number {
  if (!pathEl || typeof pathEl.getTotalLength !== "function") {
    return DEFAULT_PATH_LENGTH;
  }
  try {
    const length = pathEl.getTotalLength();
    return Number.isFinite(length) && length > 0
      ? Math.ceil(length * 100) / 100
      : DEFAULT_PATH_LENGTH;
  } catch {
    return DEFAULT_PATH_LENGTH;
  }
}

export function calculateStrokeTimings(
  pathLengths: number[],
  playbackSpeed: PlaybackSpeed = 1,
  startFromIndex = 0
): StrokeTiming[] {
  const safeSpeed = playbackSpeed > 0 ? playbackSpeed : 1;
  let cumulativeDelayMs = 0;

  return pathLengths.map((rawLength, index) => {
    const length =
      Number.isFinite(rawLength) && rawLength > 0
        ? Math.ceil(rawLength * 100) / 100
        : DEFAULT_PATH_LENGTH;

    if (index < startFromIndex) {
      return {
        index,
        length,
        durationMs: 0,
        delayMs: 0,
        transitionDuration: "0ms",
        transitionDelay: "0ms",
      };
    }

    // Scale duration by stroke length (clamped between 380ms and 850ms at 1x)
    const baseDurationMs = Math.max(380, Math.min(850, Math.round(length * 7)));
    const durationMs = Math.max(150, Math.round(baseDurationMs / safeSpeed));
    const delayMs = cumulativeDelayMs;

    cumulativeDelayMs += durationMs;

    return {
      index,
      length,
      durationMs,
      delayMs,
      transitionDuration: `${durationMs}ms`,
      transitionDelay: `${delayMs}ms`,
    };
  });
}

export function useStrokeAnimation(
  pathLengths: number[],
  pathRefs?: RefObject<(SVGPathElement | null)[]>
): UseStrokeAnimationResult {
  const strokeCount = pathLengths.length;
  const [domLengths, setDomLengths] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [resumeBaseIndex, setResumeBaseIndex] = useState(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
    if (rafRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Measure path.getTotalLength() after the SVG mounts so dasharray & dashoffset match real path lengths before Play is pressed
  useEffect(() => {
    if (!pathRefs || strokeCount === 0) return;

    const measure = () => {
      const elements = pathRefs.current ?? [];
      if (elements.length === 0) return;
      const measured = Array.from({ length: strokeCount }, (_, idx) =>
        readSvgPathLength(elements[idx])
      );
      setDomLengths((prev) => {
        if (
          prev.length === measured.length &&
          prev.every((val, idx) => val === measured[idx])
        ) {
          return prev;
        }
        return measured;
      });
    };

    const rafId =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(measure)
        : null;
    const timerId = setTimeout(measure, 0);

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(timerId);
    };
  }, [pathRefs, strokeCount, pathLengths]);

  const effectiveLengths = useMemo(() => {
    if (domLengths.length === strokeCount && strokeCount > 0) {
      return domLengths;
    }
    return pathLengths;
  }, [domLengths, pathLengths, strokeCount]);

  const strokeTimings = useMemo(
    () => calculateStrokeTimings(effectiveLengths, playbackSpeed, resumeBaseIndex),
    [effectiveLengths, playbackSpeed, resumeBaseIndex]
  );

  const totalDurationMs = useMemo(() => {
    if (strokeTimings.length === 0) return 0;
    const last = strokeTimings[strokeTimings.length - 1];
    return last.delayMs + last.durationMs;
  }, [strokeTimings]);

  useEffect(() => {
    clearTimers();
    if (!isPlaying || strokeCount === 0) {
      return;
    }

    for (let i = resumeBaseIndex; i < strokeTimings.length; i += 1) {
      const timing = strokeTimings[i];
      const startTimer = setTimeout(() => {
        setCurrentStrokeIndex(i);
      }, timing.delayMs);
      timersRef.current.push(startTimer);
    }

    const doneTimer = setTimeout(() => {
      setCurrentStrokeIndex(Math.max(0, strokeCount - 1));
      setIsPlaying(false);
      setIsComplete(true);
      setResumeBaseIndex(0);
    }, totalDurationMs);
    timersRef.current.push(doneTimer);

    return () => {
      clearTimers();
    };
  }, [clearTimers, isPlaying, resumeBaseIndex, strokeCount, strokeTimings, totalDurationMs]);

  const reset = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    setIsComplete(false);
    setCurrentStrokeIndex(0);
    setResumeBaseIndex(0);
  }, [clearTimers]);

  const play = useCallback(() => {
    if (strokeCount === 0) return;
    clearTimers();

    // Force a synchronous layout read on the SVG paths so the browser registers the starting dashoffset state
    if (pathRefs?.current) {
      for (const el of pathRefs.current) {
        if (el && typeof el.getBoundingClientRect === "function") {
          void el.getBoundingClientRect();
        }
      }
    }

    if (isComplete) {
      setIsComplete(false);
      setIsPlaying(false);
      setCurrentStrokeIndex(0);
      setResumeBaseIndex(0);

      const startNextFrame = () => {
        if (pathRefs?.current) {
          for (const el of pathRefs.current) {
            if (el && typeof el.getBoundingClientRect === "function") {
              void el.getBoundingClientRect();
            }
          }
        }
        setIsPlaying(true);
      };

      if (typeof requestAnimationFrame === "function") {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = requestAnimationFrame(startNextFrame);
        });
      } else {
        const restartTimer = setTimeout(startNextFrame, 25);
        timersRef.current.push(restartTimer);
      }
      return;
    }

    setResumeBaseIndex(currentStrokeIndex);
    setIsPlaying(true);
  }, [clearTimers, currentStrokeIndex, isComplete, pathRefs, strokeCount]);

  const pause = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    setResumeBaseIndex(currentStrokeIndex);
  }, [clearTimers, currentStrokeIndex]);

  const setSpeed = useCallback(
    (multiplier: PlaybackSpeed) => {
      setPlaybackSpeed(multiplier);
      if (isPlaying) {
        setResumeBaseIndex(currentStrokeIndex);
      }
    },
    [currentStrokeIndex, isPlaying]
  );

  return {
    isPlaying,
    isComplete,
    playbackSpeed,
    currentStrokeIndex,
    strokeTimings,
    totalDurationMs,
    play,
    pause,
    reset,
    setSpeed,
  };
}
