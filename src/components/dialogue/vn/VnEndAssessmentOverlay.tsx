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
  isFullscreen?: boolean;
  onReplayFinalAudio?: () => void;
  onRestart: () => void;
}

export const VnEndAssessmentOverlay: React.FC<VnEndAssessmentOverlayProps> = ({
  session,
  scenario,
  finalNode,
  isFullscreen = false,
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
      <div
        className={`absolute z-40 ${
          isFullscreen ? "bottom-6 right-6 sm:bottom-8 sm:right-8" : "bottom-3 right-3"
        }`}
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className={`flex items-center font-bold text-white shadow-xl backdrop-blur-md hover:bg-slate-900 transition-all cursor-pointer border border-[var(--sakura)] bg-slate-950/90 ${
            isFullscreen
              ? "gap-2 rounded-2xl px-5 py-2.5 text-sm sm:text-base"
              : "gap-1.5 rounded-xl px-3 py-1.5 text-[11px]"
          }`}
        >
          <Eye
            className={
              isFullscreen
                ? "size-4 sm:size-5 text-[var(--primary)]"
                : "size-3.5 text-[var(--primary)]"
            }
          />
          <span>Show Assessment ({session.totalScore} pts)</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute z-40 flex flex-col items-center justify-end transition-all duration-300 ${
        isFullscreen
          ? "inset-x-4 sm:inset-x-8 xl:inset-x-12 bottom-6 sm:bottom-8 xl:bottom-10"
          : "inset-x-3 sm:inset-x-6 bottom-2"
      }`}
    >
      <div
        className={`pointer-events-auto relative flex w-full flex-col overflow-hidden border border-white/20 bg-slate-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all ${
          isFullscreen
            ? "max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[72%] sm:max-h-[75%] rounded-2xl sm:rounded-3xl"
            : "max-w-xl max-h-[50%] sm:max-h-[52%] rounded-2xl"
        }`}
      >
        {/* Decorative Top Accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent" />

        {/* Header Bar */}
        <div
          className={`flex items-center justify-between border-b border-white/10 ${
            isFullscreen
              ? "px-5 py-3 sm:px-7 sm:py-3.5"
              : "px-3.5 py-1.5 sm:px-4 sm:py-2"
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <span
              className={`shrink-0 ${
                isFullscreen ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
              }`}
            >
              {endingConfig.emblem}
            </span>
            <div className="min-w-0 flex-1">
              <h2
                className={`font-japanese font-extrabold text-white truncate ${
                  isFullscreen
                    ? "text-base sm:text-lg xl:text-xl"
                    : "text-xs sm:text-sm"
                }`}
              >
                {endingConfig.titleJa}
              </h2>
              <p
                className={`truncate ${
                  isFullscreen
                    ? "text-xs sm:text-sm xl:text-base text-pink-200 mt-0.5"
                    : "text-[10px] text-[var(--sakura-light)]"
                }`}
              >
                {endingConfig.titleEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMinimized(true)}
            className={`flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-white/15 bg-white/10 font-semibold text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer shrink-0 ml-2 ${
              isFullscreen
                ? "px-3.5 py-1.5 text-xs sm:text-sm"
                : "px-2 py-0.5 text-[10px]"
            }`}
            title="Minimize assessment to view scene"
          >
            <EyeOff className={isFullscreen ? "size-4" : "size-3"} />
            <span>View Scene</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div
          className={`flex border-b border-white/10 bg-white/5 font-bold ${
            isFullscreen ? "px-6 sm:px-8 text-sm sm:text-base" : "px-3 text-[11px]"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`border-b-2 transition-colors cursor-pointer ${
              isFullscreen ? "px-4 py-2.5 sm:px-5 sm:py-3" : "px-2.5 py-1.5"
            } ${
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
            className={`border-b-2 transition-colors cursor-pointer ${
              isFullscreen ? "px-4 py-2.5 sm:px-5 sm:py-3" : "px-2.5 py-1.5"
            } ${
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
              className={`border-b-2 transition-colors cursor-pointer ${
                isFullscreen ? "px-4 py-2.5 sm:px-5 sm:py-3" : "px-2.5 py-1.5"
              } ${
                activeTab === "vocab"
                  ? "border-[var(--primary)] text-white"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              Vocab ({scenario.vocabList.length})
            </button>
          )}
        </div>

        {/* Scrollable Tab Content */}
        <div
          className={`flex-1 overflow-y-auto space-y-2.5 sm:space-y-3.5 ${
            isFullscreen
              ? "p-4 sm:p-6 max-h-[380px] xl:max-h-[480px] 2xl:max-h-[540px]"
              : "p-2.5 sm:p-3 max-h-[190px]"
          }`}
        >
          {activeTab === "summary" && (
            <div className={`space-y-2.5 ${isFullscreen ? "space-y-3.5" : ""}`}>
              {/* Score Badges */}
              <div
                className={`grid grid-cols-3 text-center ${
                  isFullscreen ? "gap-3 sm:gap-4" : "gap-1.5"
                }`}
              >
                <div
                  className={`border border-white/15 bg-white/5 ${
                    isFullscreen
                      ? "rounded-2xl py-3 px-3 sm:py-4 sm:px-4"
                      : "rounded-xl py-1 px-1.5"
                  }`}
                >
                  <span
                    className={`block font-bold uppercase tracking-wider text-white/50 ${
                      isFullscreen ? "text-xs sm:text-sm mb-1" : "text-[9px]"
                    }`}
                  >
                    Total Score
                  </span>
                  <span
                    className={`font-japanese font-black text-[var(--sakura-light)] ${
                      isFullscreen
                        ? "text-2xl sm:text-3xl xl:text-4xl"
                        : "text-base sm:text-lg"
                    }`}
                  >
                    {session.totalScore}
                  </span>
                  <span
                    className={
                      isFullscreen
                        ? "text-xs sm:text-sm text-white/50"
                        : "text-[9px] text-white/50"
                    }
                  >
                    {" "}pts
                  </span>
                </div>

                <div
                  className={`border border-white/15 bg-white/5 ${
                    isFullscreen
                      ? "rounded-2xl py-3 px-3 sm:py-4 sm:px-4"
                      : "rounded-xl py-1 px-1.5"
                  }`}
                >
                  <span
                    className={`block font-bold uppercase tracking-wider text-white/50 ${
                      isFullscreen ? "text-xs sm:text-sm mb-1" : "text-[9px]"
                    }`}
                  >
                    Atmosphere
                  </span>
                  <span
                    className={`font-japanese font-black text-emerald-400 ${
                      isFullscreen
                        ? "text-2xl sm:text-3xl xl:text-4xl"
                        : "text-base sm:text-lg"
                    }`}
                  >
                    {session.atmosphereMeter}%
                  </span>
                </div>

                <div
                  className={`border border-white/15 bg-white/5 ${
                    isFullscreen
                      ? "rounded-2xl py-3 px-3 sm:py-4 sm:px-4"
                      : "rounded-xl py-1 px-1.5"
                  }`}
                >
                  <span
                    className={`block font-bold uppercase tracking-wider text-white/50 ${
                      isFullscreen ? "text-xs sm:text-sm mb-1" : "text-[9px]"
                    }`}
                  >
                    Turns Taken
                  </span>
                  <span
                    className={`font-japanese font-black text-white ${
                      isFullscreen
                        ? "text-2xl sm:text-3xl xl:text-4xl"
                        : "text-base sm:text-lg"
                    }`}
                  >
                    {session.turns.length}
                  </span>
                </div>
              </div>

              {/* Character's Final Farewell / Reaction Line */}
              {finalNode && finalNode.npcTextJa && (
                <div
                  className={`flex items-start justify-between border border-[var(--sakura)]/40 bg-white/5 leading-snug ${
                    isFullscreen
                      ? "gap-4 rounded-2xl p-4 sm:p-5"
                      : "gap-2 rounded-xl p-2 text-[11px]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-bold mb-1 ${
                        isFullscreen
                          ? "text-xs sm:text-sm text-pink-200"
                          : "text-[10px] text-[var(--sakura-light)] mb-0.5"
                      }`}
                    >
                      {finalNode.speakerNameJa} · {finalNode.speakerNameEn}
                    </p>
                    <p
                      className={`font-japanese font-bold text-white ${
                        isFullscreen
                          ? "text-base sm:text-lg xl:text-xl leading-relaxed"
                          : "text-xs sm:text-sm"
                      }`}
                    >
                      「{finalNode.npcTextJa}」
                    </p>
                    {finalNode.npcTextEn && (
                      <p
                        className={`text-slate-300 ${
                          isFullscreen
                            ? "text-xs sm:text-sm xl:text-base mt-1"
                            : "mt-0.5 text-[10px]"
                        }`}
                      >
                        {finalNode.npcTextEn}
                      </p>
                    )}
                  </div>
                  {onReplayFinalAudio && (
                    <button
                      type="button"
                      onClick={onReplayFinalAudio}
                      className={`flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/85 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white transition-colors cursor-pointer ${
                        isFullscreen
                          ? "size-10 sm:size-12 rounded-xl sm:rounded-2xl"
                          : "size-7 rounded-lg"
                      }`}
                      title="Replay character's final response"
                      aria-label="Replay character's final response"
                    >
                      <Volume2
                        className={isFullscreen ? "size-5 sm:size-6" : "size-3.5"}
                      />
                    </button>
                  )}
                </div>
              )}

              {/* Evaluation summary */}
              <div
                className={`border border-white/10 bg-white/5 leading-snug ${
                  isFullscreen
                    ? "rounded-2xl p-4 sm:p-5"
                    : "rounded-xl p-2 text-[11px]"
                }`}
              >
                <p
                  className={`font-bold text-pink-200 flex items-center gap-1.5 mb-1 ${
                    isFullscreen
                      ? "text-sm sm:text-base"
                      : "text-xs text-[var(--sakura-light)]"
                  }`}
                >
                  <Sparkles className={isFullscreen ? "size-4" : "size-3"} />
                  <span>Interaction Summary</span>
                </p>
                <p
                  className={`text-slate-300 leading-relaxed ${
                    isFullscreen
                      ? "text-xs sm:text-sm xl:text-base"
                      : "text-[10px] sm:text-[11px]"
                  }`}
                >
                  {endingConfig.sub}
                </p>
              </div>

              {/* Highlights from conversation */}
              <div
                className={`border border-white/10 bg-white/5 ${
                  isFullscreen ? "rounded-2xl p-4 sm:p-5" : "rounded-xl p-2 text-[10px]"
                }`}
              >
                <p
                  className={`font-bold uppercase tracking-wider text-white/50 mb-2 ${
                    isFullscreen ? "text-xs sm:text-sm" : "text-[10px] mb-1"
                  }`}
                >
                  Turns Overview
                </p>
                <div className={`space-y-1.5 ${isFullscreen ? "space-y-2.5" : ""}`}>
                  {session.turns.map((turn, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between border-b border-white/5 last:border-0 ${
                        isFullscreen ? "py-2 sm:py-2.5" : "py-0.5"
                      }`}
                    >
                      <span
                        className={`truncate max-w-[72%] font-japanese font-medium text-white ${
                          isFullscreen
                            ? "text-sm sm:text-base font-bold"
                            : "text-[11px]"
                        }`}
                      >
                        Turn {i + 1}: 「{turn.chosenTextJa}」
                      </span>
                      <span
                        className={`font-bold uppercase rounded-full ${
                          isFullscreen
                            ? "text-xs sm:text-sm px-3 py-1"
                            : "text-[9px] px-1.5 py-0.2"
                        } ${
                          turn.tier === "respectful" || turn.tier === "polite"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {turn.tier} (
                        {turn.pointsEarned >= 0
                          ? `+${turn.pointsEarned}`
                          : turn.pointsEarned}
                        )
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "transcript" && (
            <div className={`space-y-2.5 ${isFullscreen ? "space-y-3.5" : ""}`}>
              {session.turns.map((turn, idx) => {
                const isPolite =
                  turn.tier === "respectful" || turn.tier === "polite";
                return (
                  <div
                    key={idx}
                    className={`border border-white/15 bg-white/5 space-y-2 ${
                      isFullscreen
                        ? "rounded-2xl p-4 sm:p-5"
                        : "rounded-xl p-2 text-[11px] space-y-1"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded font-bold uppercase text-white bg-white/15 ${
                            isFullscreen
                              ? "px-2.5 py-1 text-xs sm:text-sm"
                              : "px-1.5 py-0.2 text-[9px]"
                          }`}
                        >
                          Turn {idx + 1}
                        </span>
                        <span
                          className={`rounded font-bold uppercase ${
                            isFullscreen
                              ? "px-2.5 py-1 text-xs sm:text-sm"
                              : "px-1.5 py-0.2 text-[9px]"
                          } ${
                            isPolite
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {turn.tier}
                        </span>
                      </div>
                      <span
                        className={`font-bold text-white ${
                          isFullscreen ? "text-xs sm:text-sm" : "text-[10px]"
                        }`}
                      >
                        {turn.pointsEarned >= 0
                          ? `+${turn.pointsEarned}`
                          : turn.pointsEarned}{" "}
                        pts
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-japanese font-bold text-white leading-relaxed ${
                            isFullscreen
                              ? "text-base sm:text-lg xl:text-xl"
                              : "text-xs sm:text-[13px]"
                          }`}
                        >
                          「{turn.chosenTextJa}」
                        </p>
                        <p
                          className={`text-slate-300/80 italic ${
                            isFullscreen
                              ? "text-xs sm:text-sm xl:text-base mt-1"
                              : "text-[10px] mt-0.5 truncate"
                          }`}
                        >
                          {turn.chosenTextEn}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          playSentence(turn.chosenTextJa, `review-${idx}`)
                        }
                        className={`flex shrink-0 items-center justify-center border border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer ${
                          isFullscreen
                            ? "size-9 sm:size-10 rounded-xl"
                            : "size-6 rounded"
                        }`}
                        title="Play audio"
                      >
                        <Volume2
                          className={
                            isFullscreen ? "size-4 sm:size-4.5" : "size-3"
                          }
                        />
                      </button>
                    </div>

                    <div
                      className={`border border-[var(--sakura)]/30 bg-[var(--primary)]/10 text-white/90 ${
                        isFullscreen
                          ? "rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
                          : "rounded-lg px-2 py-1 text-[10px]"
                      }`}
                    >
                      <span className="font-bold text-pink-200">
                        💡 Etiquette:{" "}
                      </span>
                      <span>{turn.feedbackEn}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "vocab" && scenario.vocabList && (
            <div
              className={`grid ${
                isFullscreen
                  ? "gap-3 sm:grid-cols-2"
                  : "gap-1.5 sm:grid-cols-2"
              }`}
            >
              {scenario.vocabList.map((vocab) => {
                const isSaved = savedVocab.has(vocab.ja);
                return (
                  <div
                    key={vocab.ja}
                    className={`flex items-center justify-between border border-white/15 bg-white/5 text-left ${
                      isFullscreen
                        ? "rounded-xl sm:rounded-2xl p-3 sm:p-4"
                        : "rounded-lg px-2 py-1.5"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p
                        className={`font-japanese font-bold text-white truncate ${
                          isFullscreen ? "text-base sm:text-lg" : "text-xs"
                        }`}
                      >
                        {vocab.ja}{" "}
                        <span
                          className={`font-normal text-white/60 font-sans ${
                            isFullscreen
                              ? "text-xs sm:text-sm ml-1"
                              : "text-[10px]"
                          }`}
                        >
                          ({vocab.kana})
                        </span>
                      </p>
                      <p
                        className={`text-slate-300 truncate ${
                          isFullscreen
                            ? "text-xs sm:text-sm xl:text-base mt-1"
                            : "text-[10px]"
                        }`}
                      >
                        {vocab.en}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveVocab(vocab)}
                      disabled={isSaved}
                      className={`flex shrink-0 items-center justify-center border transition-all cursor-pointer ${
                        isFullscreen
                          ? "size-9 sm:size-10 rounded-xl"
                          : "size-6 rounded"
                      } ${
                        isSaved
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border-white/20 bg-white/10 text-white/80 hover:border-[var(--sakura)] hover:bg-white/20 hover:text-white"
                      }`}
                      title={isSaved ? "Saved to FSRS" : "Save vocabulary to FSRS"}
                    >
                      {isSaved ? (
                        <Check
                          className={
                            isFullscreen ? "size-4.5 sm:size-5" : "size-3"
                          }
                        />
                      ) : (
                        <BookmarkPlus
                          className={
                            isFullscreen ? "size-4.5 sm:size-5" : "size-3"
                          }
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div
          className={`flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/95 ${
            isFullscreen
              ? "px-5 py-3 sm:px-8 sm:py-4"
              : "px-3 py-1.5 sm:px-4 sm:py-2"
          }`}
        >
          <button
            type="button"
            onClick={onRestart}
            className={`flex items-center gap-1.5 font-bold text-white hover:border-[var(--sakura)] hover:bg-white/20 transition-colors cursor-pointer border border-white/20 bg-white/10 ${
              isFullscreen
                ? "rounded-xl sm:rounded-2xl px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm xl:text-base"
                : "rounded-lg px-3 py-1 text-[11px]"
            }`}
          >
            <RotateCcw className={isFullscreen ? "size-4 sm:size-4.5" : "size-3"} />
            <span>Replay Scene</span>
          </button>

          <Link
            href="/games/dialogue"
            className={`flex items-center gap-1.5 font-bold text-white hover:bg-[var(--primary-hover,#b3002d)] transition-colors shadow-sm bg-[var(--primary)] ${
              isFullscreen
                ? "rounded-xl sm:rounded-2xl px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm xl:text-base"
                : "rounded-lg px-3 py-1 text-[11px]"
            }`}
          >
            <span>Choose Another Scenario</span>
            <ArrowRight className={isFullscreen ? "size-4 sm:size-4.5" : "size-3"} />
          </Link>
        </div>
      </div>
    </div>
  );
};
