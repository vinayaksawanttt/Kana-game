"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DialogueNode, DialogueSession, ScenarioMeta } from "@/data/dialogue/types";
import { RotateCcw, ArrowRight, BookmarkPlus, Check, Volume2, Sparkles, MessageCircle, Eye, EyeOff } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addVocabularyToSrs } from "@/lib/srs/service";

interface VnEndAssessmentOverlayProps {
  session: DialogueSession;
  scenario: ScenarioMeta;
  finalNode?: DialogueNode;
  onReplayFinalAudio?: () => void;
  onRestart: () => void;
}

export const VnEndAssessmentOverlay: React.FC<VnEndAssessmentOverlayProps> = ({
  session,
  scenario,
  finalNode,
  onReplayFinalAudio,
  onRestart,
}) => {
  const { playSentence } = useJapaneseAudio();
  const [savedVocab, setSavedVocab] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "vocab">("summary");
  const [minimized, setMinimized] = useState(false);

  const endingConfig = {
    perfect: {
      emblem: "🌟",
      titleJa: "大成功！完璧なコミュニケーション",
      titleEn: "Perfect Cultural Interaction!",
      sub: "You showed great respect, natural phrasing, and high situational awareness.",
      color: "from-amber-400 to-amber-600 text-amber-500",
    },
    success: {
      emblem: "🎉",
      titleJa: "成功！会話が通じました",
      titleEn: "Conversation Succeeded!",
      sub: "You achieved your objective smoothly and politely.",
      color: "from-emerald-400 to-teal-600 text-emerald-500",
    },
    awkward: {
      emblem: "😅",
      titleJa: "微妙…少しぎこちない会話",
      titleEn: "Slightly Awkward Interaction",
      sub: "The message got across, but phrasing felt slightly stiff or overly blunt.",
      color: "from-yellow-400 to-amber-500 text-amber-500",
    },
    failure: {
      emblem: "💀",
      titleJa: "失敗！会話が中断してしまいました",
      titleEn: "Conversation Derailment!",
      sub: "The other person was offended or confused by improper etiquette.",
      color: "from-rose-500 to-red-600 text-rose-500",
    },
  }[session.finalEndingType || "success"];

  const handleSaveVocab = async (item: { ja: string; kana: string; en: string }) => {
    try {
      await addVocabularyToSrs({
        word: item.ja,
        reading: item.kana,
        meaning: item.en,
        level: scenario.level,
      });
      setSavedVocab((prev) => new Set(prev).add(item.ja));
    } catch {
      setSavedVocab((prev) => new Set(prev).add(item.ja));
    }
  };

  if (minimized) {
    return (
      <div className="absolute bottom-3 right-3 z-40">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--sakura)] bg-slate-950/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all cursor-pointer"
        >
          <Eye className="size-3.5 text-[var(--primary)]" />
          <span>Show Assessment ({session.totalScore} pts)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 sm:inset-x-6 bottom-2 z-40 flex flex-col items-center justify-end">
      <div className="pointer-events-auto relative flex w-full max-w-xl max-h-[50%] sm:max-h-[52%] flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
        {/* Decorative Top Accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent" />

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-1.5 sm:px-4 sm:py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-base sm:text-lg shrink-0">{endingConfig.emblem}</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-japanese text-xs sm:text-sm font-extrabold text-white truncate">
                {endingConfig.titleJa}
              </h2>
              <p className="text-[10px] text-[var(--sakura-light)] truncate">
                {endingConfig.titleEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            title="Minimize assessment to view scene"
          >
            <EyeOff className="size-3" />
            <span>View Scene</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 bg-white/5 px-3 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`border-b-2 px-2.5 py-1.5 transition-colors cursor-pointer ${
              activeTab === "summary"
                ? "border-[var(--primary)] text-white"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transcript")}
            className={`border-b-2 px-2.5 py-1.5 transition-colors cursor-pointer ${
              activeTab === "transcript"
                ? "border-[var(--primary)] text-white"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            Transcript ({session.turns.length})
          </button>
          {scenario.vocabList && scenario.vocabList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("vocab")}
              className={`border-b-2 px-2.5 py-1.5 transition-colors cursor-pointer ${
                activeTab === "vocab"
                  ? "border-[var(--primary)] text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              Vocab ({scenario.vocabList.length})
            </button>
          )}
        </div>

        {/* Scrollable Tab Content (Compact Height) */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 max-h-[190px]">
          {activeTab === "summary" && (
            <div className="space-y-2">
              {/* Score Badges */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl border border-white/15 bg-white/5 py-1 px-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">
                    Total Score
                  </span>
                  <span className="font-japanese text-base sm:text-lg font-black text-[var(--sakura-light)]">
                    {session.totalScore}
                  </span>
                  <span className="text-[9px] text-white/50"> pts</span>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/5 py-1 px-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">
                    Atmosphere
                  </span>
                  <span className="font-japanese text-base sm:text-lg font-black text-emerald-400">
                    {session.atmosphereMeter}%
                  </span>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/5 py-1 px-1.5">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-white/50">
                    Turns Taken
                  </span>
                  <span className="font-japanese text-base sm:text-lg font-black text-white">
                    {session.turns.length}
                  </span>
                </div>
              </div>

              {/* Character's Final Farewell / Reaction Line */}
              {finalNode && finalNode.npcTextJa && (
                <div className="flex items-start justify-between gap-2 rounded-xl border border-[var(--sakura)]/40 bg-white/5 p-2 text-[11px] text-white/95 leading-snug">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[var(--sakura-light)] mb-0.5">
                      {finalNode.speakerNameJa} · {finalNode.speakerNameEn}
                    </p>
                    <p className="font-japanese font-bold text-white">
                      「{finalNode.npcTextJa}」
                    </p>
                    {finalNode.npcTextEn && (
                      <p className="mt-0.5 text-[10px] text-slate-300">
                        {finalNode.npcTextEn}
                      </p>
                    )}
                  </div>
                  {onReplayFinalAudio && (
                    <button
                      type="button"
                      onClick={onReplayFinalAudio}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/85 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                      title="Replay character's final response"
                      aria-label="Replay character's final response"
                    >
                      <Volume2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Evaluation summary */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[11px] text-white/90 leading-snug">
                <p className="font-bold text-[var(--sakura-light)] flex items-center gap-1 mb-0.5">
                  <Sparkles className="size-3" />
                  <span>Interaction Summary</span>
                </p>
                <p className="text-slate-300 text-[10px] sm:text-[11px]">
                  {endingConfig.sub}
                </p>
              </div>

              {/* Highlights from conversation */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[10px]">
                <p className="font-bold uppercase tracking-wider text-white/50 mb-1">
                  Turns Overview
                </p>
                <div className="space-y-1">
                  {session.turns.map((turn, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 border-b border-white/5 last:border-0">
                      <span className="truncate max-w-[72%] font-japanese font-medium text-white">
                        Turn {i + 1}: 「{turn.chosenTextJa}」
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                        turn.tier === "respectful" || turn.tier === "polite"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}>
                        {turn.tier} ({turn.pointsEarned >= 0 ? `+${turn.pointsEarned}` : turn.pointsEarned})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-2">
              {session.turns.map((turn, idx) => {
                const isPolite = turn.tier === "respectful" || turn.tier === "polite";
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/15 bg-white/5 p-2 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-white/15 px-1.5 py-0.2 text-[9px] font-bold uppercase text-white">
                          Turn {idx + 1}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            isPolite
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {turn.tier}
                        </span>
                      </div>
                      <span className="font-bold text-white text-[10px]">
                        {turn.pointsEarned >= 0 ? `+${turn.pointsEarned}` : turn.pointsEarned} pts
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-japanese text-xs sm:text-[13px] font-bold text-white leading-snug">
                          「{turn.chosenTextJa}」
                        </p>
                        <p className="text-[10px] text-slate-300/80 italic mt-0.5 truncate">{turn.chosenTextEn}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => playSentence(turn.chosenTextJa, `review-${idx}`)}
                        className="flex size-6 shrink-0 items-center justify-center rounded border border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                        title="Play audio"
                      >
                        <Volume2 className="size-3" />
                      </button>
                    </div>

                    <div className="rounded-lg border border-[var(--sakura)]/30 bg-[var(--primary)]/10 px-2 py-1 text-[10px] text-white/90">
                      <span className="font-bold text-[var(--sakura-light)]">💡 Etiquette: </span>
                      <span>{turn.feedbackEn}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "vocab" && scenario.vocabList && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {scenario.vocabList.map((vocab) => {
                const isSaved = savedVocab.has(vocab.ja);
                return (
                  <div
                    key={vocab.ja}
                    className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-left"
                  >
                    <div className="min-w-0 flex-1 pr-1.5">
                      <p className="font-japanese text-xs font-bold text-white truncate">
                        {vocab.ja}{" "}
                        <span className="text-[10px] font-normal text-white/60 font-sans">
                          ({vocab.kana})
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-300 truncate">{vocab.en}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveVocab(vocab)}
                      disabled={isSaved}
                      className={`flex size-6 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${
                        isSaved
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border-white/20 bg-white/10 text-white/80 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white"
                      }`}
                      title={isSaved ? "Saved to FSRS" : "Save vocabulary to FSRS"}
                    >
                      {isSaved ? <Check className="size-3" /> : <BookmarkPlus className="size-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-1.5 sm:px-4 sm:py-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-white hover:border-[var(--sakura)] hover:bg-white/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Replay Scene</span>
          </button>

          <Link
            href="/games/dialogue"
            className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-white hover:bg-[var(--primary-hover,#b3002d)] transition-colors shadow-sm"
          >
            <span>Choose Another Scenario</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
