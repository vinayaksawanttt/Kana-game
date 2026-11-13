"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DialogueSession, ScenarioMeta } from "@/data/dialogue/types";
import { RotateCcw, ArrowRight, BookmarkPlus, Check, Volume2, Sparkles, MessageCircle } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { addVocabularyToSrs } from "@/lib/srs/service";

interface VnScenarioReviewProps {
  session: DialogueSession;
  scenario: ScenarioMeta;
  onRestart: () => void;
}

export const VnScenarioReview: React.FC<VnScenarioReviewProps> = ({
  session,
  scenario,
  onRestart,
}) => {
  const { playSentence } = useJapaneseAudio();
  const [savedVocab, setSavedVocab] = useState<Set<string>>(new Set());

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
      // Fallback
      setSavedVocab((prev) => new Set(prev).add(item.ja));
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_20px_50px_rgba(188,0,45,0.06)] sm:p-8">
      {/* 1. Ending Banner */}
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border-2 border-[var(--sakura)] bg-gradient-to-br from-[var(--sakura-light)] to-[var(--paper-tint)] text-4xl shadow-md">
          {endingConfig.emblem}
        </div>

        <h2 className="mt-3 font-japanese text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
          {endingConfig.titleJa}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[var(--primary)]">
          {endingConfig.titleEn}
        </p>
        <p className="mx-auto mt-1 max-w-lg text-xs text-[var(--muted)]">
          {endingConfig.sub}
        </p>

        {/* Score & Atmosphere Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-4 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Score
            </span>
            <span className="font-japanese text-xl font-extrabold text-[var(--primary)]">
              {session.totalScore} pts
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-4 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Final Atmosphere (空気)
            </span>
            <span className="font-japanese text-xl font-extrabold text-[var(--ink)]">
              {session.atmosphereMeter}%
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-4 py-2 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Turns Completed
            </span>
            <span className="font-japanese text-xl font-extrabold text-[var(--ink)]">
              {session.turns.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Full Conversation Transcript & Politeness Breakdown */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
          <MessageCircle className="size-4 text-[var(--primary)]" />
          <span>Conversation Transcript &amp; Etiquette Feedback</span>
        </h3>

        <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)]">
          {session.turns.map((turn, idx) => {
            const isPolite = turn.tier === "respectful" || turn.tier === "polite";
            return (
              <div key={idx} className="p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[var(--line)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--ink)]">
                      Turn {idx + 1}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        isPolite
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border border-rose-500/30 bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {turn.tier}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[var(--ink)]">
                    {turn.pointsEarned >= 0 ? `+${turn.pointsEarned}` : turn.pointsEarned} pts
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-japanese text-base font-bold text-[var(--ink)] leading-snug">
                      「{turn.chosenTextJa}」
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)] italic">{turn.chosenTextEn}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => playSentence(turn.chosenTextJa, `review-${idx}`)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                    title="Play response audio"
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                </div>

                {/* Cultural Etiquette Explanation */}
                <div className="rounded-xl border border-[var(--sakura)]/30 bg-[var(--sakura-light)]/40 p-3 text-xs text-[var(--ink)]">
                  <span className="font-bold text-[var(--primary)]">💡 Etiquette Note: </span>
                  <span>{turn.feedbackEn}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Essential Scenario Vocabulary Bank (Save to FSRS) */}
      {scenario.vocabList && scenario.vocabList.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
            <Sparkles className="size-4 text-[var(--primary)]" />
            <span>Essential Scenario Vocabulary</span>
          </h3>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {scenario.vocabList.map((vocab) => {
              const isSaved = savedVocab.has(vocab.ja);
              return (
                <div
                  key={vocab.ja}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] p-3 text-left shadow-2xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-japanese text-sm font-bold text-[var(--ink)] truncate">
                      {vocab.ja}{" "}
                      <span className="text-xs font-normal text-[var(--muted)] font-sans">
                        ({vocab.kana})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)] truncate">{vocab.en}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveVocab(vocab)}
                    disabled={isSaved}
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                      isSaved
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                    title={isSaved ? "Saved to FSRS" : "Save vocabulary to FSRS"}
                  >
                    {isSaved ? <Check className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Navigation Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[var(--line)]">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-5 py-3 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer"
        >
          <RotateCcw className="size-4" />
          <span>Try Different Branches</span>
        </button>

        <Link
          href="/games/dialogue"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-95"
        >
          <span>Choose Another Scenario</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
};
