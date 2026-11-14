"use client";

import React, { useEffect, useRef } from "react";
import { X, History, Volume2, User, Bot } from "lucide-react";

export interface DialogueLogEntry {
  id: string;
  speaker: "npc" | "player";
  speakerName: string;
  textJa: string;
  readingHiragana?: string;
  textEn?: string;
  tier?: string;
  points?: number;
}

interface VnBacklogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DialogueLogEntry[];
  onPlayAudio?: (textJa: string, id: string, reading?: string) => void;
}

export const VnBacklogDrawer: React.FC<VnBacklogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onPlayAudio,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when opened
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, logs]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[85%] w-full flex-col rounded-t-3xl border-t border-white/20 bg-slate-950/95 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <History className="size-4 text-[var(--sakura)]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Dialogue Backlog <span className="text-xs text-white/50">({logs.length} entries)</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            aria-label="Close backlog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm custom-scrollbar"
        >
          {logs.length === 0 ? (
            <div className="py-12 text-center text-white/50">No previous dialogue yet.</div>
          ) : (
            logs.map((entry, idx) => {
              const isNpc = entry.speaker === "npc";

              return (
                <div
                  key={`${entry.id}-${idx}`}
                  className={`flex flex-col gap-1 rounded-2xl border p-3.5 transition-colors ${
                    isNpc
                      ? "border-white/15 bg-slate-900/70 mr-4 sm:mr-10"
                      : "border-[var(--sakura)]/30 bg-[var(--sakura)]/10 ml-4 sm:ml-10"
                  }`}
                >
                  {/* Speaker Label & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {isNpc ? (
                        <Bot className="size-3.5 text-[var(--sakura)]" />
                      ) : (
                        <User className="size-3.5 text-blue-400" />
                      )}
                      <span className="font-bold text-white/90">{entry.speakerName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.tier && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/75 uppercase">
                          {entry.tier} {entry.points !== undefined && `(+${entry.points})`}
                        </span>
                      )}
                      {onPlayAudio && (
                        <button
                          type="button"
                          onClick={() => onPlayAudio(entry.textJa, entry.id, entry.readingHiragana)}
                          className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/15 cursor-pointer"
                          title="Replay audio"
                        >
                          <Volume2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Japanese Line */}
                  <p lang="ja" className="font-japanese font-bold text-white text-sm sm:text-base leading-relaxed">
                    {entry.textJa}
                  </p>

                  {/* Reading Hiragana */}
                  {entry.readingHiragana && entry.readingHiragana !== entry.textJa && (
                    <p lang="ja" className="font-japanese text-[11px] text-[var(--sakura-light)]/85">
                      {entry.readingHiragana}
                    </p>
                  )}

                  {/* English Translation */}
                  {entry.textEn && (
                    <p className="text-[11px] sm:text-xs text-slate-300/80 leading-normal mt-0.5">
                      {entry.textEn}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info / Click to close */}
        <div className="border-t border-white/10 px-4 py-2.5 text-center text-[11px] text-white/40">
          Scroll to view full session transcript · Click anywhere outside to close
        </div>
      </div>
    </div>
  );
};
