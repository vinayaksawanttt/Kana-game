"use client";

import React, { useEffect } from "react";
import { DialogueNode, ScenarioMeta } from "@/data/dialogue/types";
import { Volume2, MapPin } from "lucide-react";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

interface DialogueStageProps {
  scenario: ScenarioMeta;
  currentNode: DialogueNode;
  autoPlayAudio?: boolean;
}

export const DialogueStage: React.FC<DialogueStageProps> = ({
  scenario,
  currentNode,
  autoPlayAudio = true,
}) => {
  const { playSentence, isPlaying, activeKey } = useJapaneseAudio();

  const isCurrentSpeaking = isPlaying && activeKey === currentNode.id;

  useEffect(() => {
    if (autoPlayAudio && currentNode.npcTextJa && !currentNode.npcTextJa.startsWith("（")) {
      playSentence(currentNode.npcTextJa, currentNode.id, {
        reading: currentNode.npcReadingHiragana,
        romaji: currentNode.npcRomaji,
        speaker: currentNode.speakerVoiceId,
      });
    }
  }, [
    currentNode.id,
    currentNode.npcTextJa,
    currentNode.npcReadingHiragana,
    currentNode.npcRomaji,
    currentNode.speakerVoiceId,
    autoPlayAudio,
    playSentence,
  ]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-6">
      {/* Location & Role Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <MapPin className="size-3.5 text-[var(--primary-fg)]" />
          <span className="font-japanese font-bold text-[var(--ink)]">{scenario.locationJa}</span>
          <span>· {scenario.locationEn}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--sakura)]/60 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
            JLPT {scenario.level}
          </span>
          <span className="rounded-full bg-[var(--paper-tint)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
            {scenario.characterRoleEn}
          </span>
        </div>
      </div>

      {/* Main Dialogue Interactive Area */}
      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
        {/* Character Avatar */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1.5">
          <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--sakura)]/60 bg-[var(--sakura-light)] text-3xl shadow-sm">
            {currentNode.speakerAvatar}
            {isCurrentSpeaking && (
              <span className="absolute -right-1 -top-1 flex size-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
                <span className="relative inline-flex size-3.5 rounded-full bg-[var(--primary)]" />
              </span>
            )}
          </div>
          <div className="sm:text-center">
            <span className="block font-japanese text-xs font-bold text-[var(--ink)]">
              {currentNode.speakerNameJa}
            </span>
            <span className="block text-[10px] text-[var(--muted)]">
              {currentNode.speakerNameEn}
            </span>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="relative w-full flex-1 rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p
                lang="ja"
                className="font-japanese text-lg font-bold leading-relaxed text-[var(--ink)] sm:text-xl"
              >
                {currentNode.npcTextJa}
              </p>
              {currentNode.npcReadingHiragana !== currentNode.npcTextJa && (
                <p className="font-japanese text-xs leading-relaxed text-[var(--muted)]">
                  {currentNode.npcReadingHiragana}
                </p>
              )}
              <p className="pt-1 text-sm leading-relaxed text-[var(--muted)]">
                {currentNode.npcTextEn}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSentence(currentNode.npcTextJa, currentNode.id, {
                  reading: currentNode.npcReadingHiragana,
                  romaji: currentNode.npcRomaji,
                  speaker: currentNode.speakerVoiceId,
                });
              }}
              aria-label="Replay character line"
              className={`shrink-0 rounded-xl border p-2.5 transition-all ${
                isCurrentSpeaking
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
              }`}
              title="Replay NPC Voice"
            >
              <Volume2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
