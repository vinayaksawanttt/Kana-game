"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Settings, Maximize2, Minimize2, History } from "lucide-react";
import { ScenarioMeta } from "@/data/dialogue/types";

interface VnHudProps {
  scenario: ScenarioMeta;
  turnNumber: number;
  totalScore: number;
  atmosphereValue: number;
  showFurigana: boolean;
  showEnglish: boolean;
  autoPlayAudio: boolean;
  isFullscreen: boolean;
  onToggleFurigana: () => void;
  onToggleEnglish: () => void;
  onToggleAutoPlay: () => void;
  onToggleFullscreen: () => void;
  onOpenBacklog?: () => void;
  onRestart: () => void;
}

export const VnHud: React.FC<VnHudProps> = ({
  scenario,
  turnNumber,
  totalScore,
  atmosphereValue,
  showFurigana,
  showEnglish,
  autoPlayAudio,
  isFullscreen,
  onToggleFurigana,
  onToggleEnglish,
  onToggleAutoPlay,
  onToggleFullscreen,
  onOpenBacklog,
  onRestart,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Atmosphere color & status label
  const getAtmosphereConfig = (val: number) => {
    if (val >= 80) return { label: "和やか (Harmonious)", color: "from-emerald-500 to-teal-400", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    if (val >= 50) return { label: "普通 (Standard)", color: "from-amber-400 to-yellow-300", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    return { label: "険悪 (Strained)", color: "from-rose-500 to-red-600", bg: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  };

  const atmConfig = getAtmosphereConfig(atmosphereValue);

  return (
    <div className="relative z-40 flex w-full flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4">
      {/* Left: Back & Location */}
      <div className="flex items-center gap-2">
        <Link
          href="/games/dialogue"
          className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/70 text-white/80 shadow-md backdrop-blur-md transition-all hover:border-[var(--sakura)] hover:bg-slate-900/90 hover:text-white"
          title="Back to all scenarios"
        >
          <ArrowLeft className="size-3.5 sm:size-4" />
        </Link>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="rounded-full border border-[var(--sakura)]/60 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-[var(--primary)] shadow-xs">
            JLPT {scenario.level}
          </span>
          <span className="hidden md:inline-block rounded-full border border-white/15 bg-slate-950/70 px-3 py-0.5 text-xs font-semibold text-white/90 backdrop-blur-md">
            {scenario.locationJa}
          </span>
        </div>
      </div>

      {/* Center/Right: Atmosphere Meter, Turn, Fullscreen, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-white/15 bg-slate-950/75 px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-md backdrop-blur-md">
          <span className="font-japanese text-[11px] sm:text-xs font-bold text-white/80">空気</span>
          <div className="relative h-1.5 sm:h-2 w-14 sm:w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${atmConfig.color} transition-all duration-500`}
              style={{ width: `${atmosphereValue}%` }}
            />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold text-white">{atmosphereValue}%</span>
        </div>

        {/* Turn & Score Pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white/90 shadow-md backdrop-blur-md">
          <span>Turn {turnNumber}</span>
          <span className="text-white/40">·</span>
          <span className="text-[var(--sakura-light)]">{totalScore} pts</span>
        </div>

        {/* Fullscreen / Theater Toggle Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/70 text-white/80 shadow-md backdrop-blur-md transition-all hover:border-[var(--sakura)] hover:bg-slate-900/90 hover:text-white cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 className="size-3.5 sm:size-4" /> : <Maximize2 className="size-3.5 sm:size-4" />}
        </button>

        {/* Backlog / Dialogue History Button */}
        {onOpenBacklog && (
          <button
            type="button"
            onClick={onOpenBacklog}
            className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/70 text-white/80 shadow-md backdrop-blur-md transition-all hover:border-[var(--sakura)] hover:bg-slate-900/90 hover:text-white cursor-pointer"
            title="Open Dialogue History (Backlog)"
            aria-label="Backlog History"
          >
            <History className="size-3.5 sm:size-4" />
          </button>
        )}

        {/* Settings Toggle Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/20 bg-slate-950/70 text-white/80 shadow-md backdrop-blur-md transition-all hover:border-[var(--sakura)] hover:bg-slate-900/90 hover:text-white cursor-pointer"
            title="Dialogue settings"
            aria-label="Settings"
          >
            <Settings className="size-3.5 sm:size-4" />
          </button>

          {/* Settings Dropdown Popover */}
          {settingsOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 space-y-2 rounded-2xl border border-white/20 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs">
              <p className="border-b border-white/10 pb-2 font-bold uppercase tracking-wider text-white/60">
                Scene Controls
              </p>

              <button
                type="button"
                onClick={onToggleFurigana}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Furigana Readings</span>
                <span className={`font-bold ${showFurigana ? "text-emerald-400" : "text-white/40"}`}>
                  {showFurigana ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleEnglish}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>English Subtitles</span>
                <span className={`font-bold ${showEnglish ? "text-emerald-400" : "text-white/40"}`}>
                  {showEnglish ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleAutoPlay}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Auto-play Voice</span>
                <span className={`font-bold ${autoPlayAudio ? "text-emerald-400" : "text-white/40"}`}>
                  {autoPlayAudio ? "ON" : "OFF"}
                </span>
              </button>

              <div className="border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    onRestart();
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Restart Scene</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
