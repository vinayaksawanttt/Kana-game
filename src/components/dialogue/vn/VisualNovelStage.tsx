"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DialogueNode, ScenarioMeta, DialogueChoice, DialogueSession } from "@/data/dialogue/types";
import { VnBackground } from "./VnBackground";
import { VnCharacterSprite } from "./VnCharacterSprite";
import { VnDialogueBox } from "./VnDialogueBox";
import { VnChoiceOverlay } from "./VnChoiceOverlay";
import { VnHud } from "./VnHud";
import { VnEndAssessmentOverlay } from "./VnEndAssessmentOverlay";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { playScenarioSfx } from "@/data/dialogue/assets";
import { Smartphone, RotateCw } from "lucide-react";

interface VisualNovelStageProps {
  scenario: ScenarioMeta;
  currentNode: DialogueNode;
  turnNumber: number;
  totalScore: number;
  atmosphereValue: number;
  isFinished?: boolean;
  session?: DialogueSession;
  lastTurnFeedback?: { ja: string; en: string; tier: string } | null;
  onSelectChoice: (choice: DialogueChoice) => void;
  onRestart: () => void;
}

export const VisualNovelStage: React.FC<VisualNovelStageProps> = ({
  scenario,
  currentNode,
  turnNumber,
  totalScore,
  atmosphereValue,
  isFinished = false,
  session,
  lastTurnFeedback,
  onSelectChoice,
  onRestart,
}) => {
  const { playSentence, isPlaying, activeKey } = useJapaneseAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  // User reading & audio preferences
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [forceLandscape, setForceLandscape] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  const isCurrentSpeaking = isPlaying && activeKey === currentNode.id;

  // Detect mobile portrait orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isPortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Auto-play dialogue voice when entering new dialogue node
  useEffect(() => {
    if (
      !isFinished &&
      autoPlayAudio &&
      currentNode.npcTextJa &&
      !currentNode.npcTextJa.startsWith("（")
    ) {
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
    isFinished,
    playSentence,
  ]);

  // Play Sato-san anime expressive reaction sound on node/expression transition
  useEffect(() => {
    if (!isFinished && currentNode.expression) {
      playScenarioSfx(scenario.id, currentNode.expression, 0.4);
    }
  }, [currentNode.id, currentNode.expression, isFinished, scenario.id]);

  const handleSelectChoiceInternal = useCallback(
    (choice: DialogueChoice) => {
      if (choice.points >= 90) {
        playScenarioSfx(scenario.id, "atmosphere-bonus", 0.45);
      }
      onSelectChoice(choice);
    },
    [onSelectChoice, scenario.id]
  );

  const handleReplayDialogueAudio = useCallback(() => {
    playSentence(currentNode.npcTextJa, currentNode.id, {
      reading: currentNode.npcReadingHiragana,
      romaji: currentNode.npcRomaji,
      speaker: currentNode.speakerVoiceId,
    });
  }, [currentNode, playSentence]);

  const handlePreviewChoiceAudio = useCallback(
    (textJa: string, id: string, reading?: string, romaji?: string) => {
      playSentence(textJa, id, { reading, romaji });
    },
    [playSentence]
  );

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch {}
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  }, [isFullscreen]);

  // Listen to browser fullscreen exit events
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div className={`relative mx-auto flex w-full flex-col items-center select-none ${
      isFullscreen ? "fixed inset-0 z-50 bg-black p-0" : "max-w-6xl"
    }`}>
      {/* Mobile Portrait Orientation Prompt */}
      {isMobilePortrait && !forceLandscape && (
        <div className="mb-2 flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--sakura)]/60 bg-slate-950/90 px-3 py-1.5 text-xs text-white shadow-md backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Smartphone className="size-3.5 text-[var(--primary)]" />
            <span className="text-[11px] text-white/90">
              Rotate phone to horizontal for full view
            </span>
          </div>
          <button
            type="button"
            onClick={() => setForceLandscape(true)}
            className="flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white cursor-pointer"
          >
            <RotateCw className="size-3" />
            <span>Horizontal View</span>
          </button>
        </div>
      )}

      {/* Visual Novel Theater Canvas */}
      <div
        ref={containerRef}
        className={`relative flex w-full flex-col justify-between overflow-hidden bg-slate-950 transition-all duration-300 ${
          isFullscreen
            ? "h-full w-full rounded-none border-none shadow-none"
            : forceLandscape && isMobilePortrait
            ? "h-[92vw] w-[95vh] rotate-90 origin-top-left translate-x-[95vw] rounded-2xl border border-white/20 shadow-2xl"
            : "h-[74vh] min-h-[520px] max-h-[760px] rounded-3xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Layer 1: Background Plate */}
        <VnBackground
          scenarioId={scenario.id}
          backgroundKey={currentNode.backgroundKey || scenario.defaultBackgroundKey}
          theme={scenario.backgroundTheme}
          locationName={scenario.locationJa}
        />

        {/* Layer 2: Character Sprite Layer */}
        <div className="absolute inset-x-0 bottom-0 top-12 z-10">
          <VnCharacterSprite
            scenarioId={scenario.id}
            characterName={currentNode.speakerNameJa}
            expression={currentNode.expression || scenario.defaultExpression || "neutral"}
            isSpeaking={isCurrentSpeaking}
            fallbackAvatar={currentNode.speakerAvatar || scenario.characterAvatar}
          />
        </div>

        {/* Layer 3: HUD Overlay (Top) */}
        <VnHud
          scenario={scenario}
          turnNumber={turnNumber}
          totalScore={totalScore}
          atmosphereValue={atmosphereValue}
          showFurigana={showFurigana}
          showEnglish={showEnglish}
          autoPlayAudio={autoPlayAudio}
          isFullscreen={isFullscreen}
          onToggleFurigana={() => setShowFurigana(!showFurigana)}
          onToggleEnglish={() => setShowEnglish(!showEnglish)}
          onToggleAutoPlay={() => setAutoPlayAudio(!autoPlayAudio)}
          onToggleFullscreen={handleToggleFullscreen}
          onRestart={onRestart}
        />

        {/* Layer 4: Interactive Zone (Choices + Dialogue Box OR In-Scene End Assessment) */}
        {!isFinished ? (
          <div className="relative z-30 flex w-full flex-col justify-end p-3 sm:p-5 sm:pb-5">
            {/* Etiquette Feedback Toast from Previous Turn (Ultra-compact) */}
            {lastTurnFeedback && (
              <div className="mb-1.5 max-w-2xl mx-auto flex w-full items-center gap-2 rounded-lg border border-[var(--sakura)]/60 bg-slate-950/85 px-3 py-1 shadow-md backdrop-blur-md text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-xs shrink-0">💡</span>
                <div className="min-w-0 flex-1 flex items-baseline gap-2 truncate">
                  <span className="font-japanese font-bold text-[var(--sakura-light)] text-xs truncate shrink-0">
                    {lastTurnFeedback.ja}
                  </span>
                  <span className="text-[10px] text-white/70 truncate hidden sm:inline">
                    {lastTurnFeedback.en}
                  </span>
                </div>
              </div>
            )}

            {/* Response Choices Floating Overlay (Sleek, Unobtrusive) */}
            {currentNode.choices && currentNode.choices.length > 0 && (
              <VnChoiceOverlay
                choices={currentNode.choices}
                onSelectChoice={handleSelectChoiceInternal}
                onPreviewAudio={handlePreviewChoiceAudio}
                showEnglish={showEnglish}
              />
            )}

            {/* Bottom Dialogue Box */}
            <VnDialogueBox
              speakerNameJa={currentNode.speakerNameJa}
              speakerNameEn={currentNode.speakerNameEn}
              speakerRoleEn={scenario.characterRoleEn}
              textJa={currentNode.npcTextJa}
              readingHiragana={currentNode.npcReadingHiragana}
              textEn={currentNode.npcTextEn}
              isSpeaking={isCurrentSpeaking}
              showFurigana={showFurigana}
              showEnglish={showEnglish}
              onReplayAudio={handleReplayDialogueAudio}
              onToggleFurigana={() => setShowFurigana(!showFurigana)}
              onToggleEnglish={() => setShowEnglish(!showEnglish)}
            />
          </div>
        ) : (
          /* Layer 5: End Assessment Done directly INSIDE the Visual Novel Screen! */
          session && (
            <VnEndAssessmentOverlay
              session={session}
              scenario={scenario}
              onRestart={onRestart}
            />
          )
        )}
      </div>
    </div>
  );
};
