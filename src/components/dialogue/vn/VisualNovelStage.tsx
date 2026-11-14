"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DialogueNode, ScenarioMeta, DialogueChoice, DialogueSession } from "@/data/dialogue/types";
import { VnBackground } from "./VnBackground";
import { VnCharacterSprite } from "./VnCharacterSprite";
import { VnDialogueBox } from "./VnDialogueBox";
import { VnChoiceOverlay } from "./VnChoiceOverlay";
import { VnHud } from "./VnHud";
import { VnEndAssessmentOverlay } from "./VnEndAssessmentOverlay";
import { VnBacklogDrawer, DialogueLogEntry } from "./VnBacklogDrawer";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { useGameSfx } from "@/hooks/useGameSfx";
import {
  getScenarioAmbientAudioUrl,
  getScenarioChoiceAudioUrl,
  getScenarioDialogueAudioUrl,
  playScenarioSfx,
  stopScenarioSfx,
} from "@/data/dialogue/assets";
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
  const {
    playSentence,
    stopAudio,
    isPlaying,
    activeKey,
    autoPlayEnabled,
    setAutoPlayEnabled,
  } = useJapaneseAudio();
  const { sfxEnabled } = useGameSfx();
  const containerRef = useRef<HTMLDivElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // User reading & audio preferences (Autoplay defaults to true and persists across scenes via useJapaneseAudio)
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [fallbackAutoPlay, setFallbackAutoPlay] = useState(true);
  const autoPlayAudio = autoPlayEnabled ?? fallbackAutoPlay;

  const handleToggleAutoPlay = useCallback(() => {
    const next = !autoPlayAudio;
    if (setAutoPlayEnabled) {
      setAutoPlayEnabled(next);
    } else {
      setFallbackAutoPlay(next);
    }
  }, [autoPlayAudio, setAutoPlayEnabled]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [forceLandscape, setForceLandscape] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const [backlogHistory, setBacklogHistory] = useState<DialogueLogEntry[]>([]);

  // Accumulate dialogue into backlog history
  useEffect(() => {
    if (!currentNode || !currentNode.npcTextJa) return;

    setBacklogHistory((prev) => {
      // Prevent duplicate consecutive entries
      const last = prev[prev.length - 1];
      if (last && last.id === currentNode.id && last.speaker === "npc") {
        return prev;
      }
      return [
        ...prev,
        {
          id: currentNode.id,
          speaker: "npc",
          speakerName: currentNode.speakerNameJa,
          textJa: currentNode.npcTextJa,
          readingHiragana: currentNode.npcReadingHiragana,
          textEn: currentNode.npcTextEn,
        },
      ];
    });
  }, [currentNode]);

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

  // Soft Lofi Background Ambient Loop (ElevenLabs soundscape playing until the scene ends, with automatic voice ducking)
  useEffect(() => {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;
    if (!sfxEnabled || isFinished) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      return;
    }

    const probe = new Audio();
    if (
      !probe.canPlayType ||
      (!probe.canPlayType('audio/ogg; codecs="opus"') &&
        !probe.canPlayType("audio/ogg") &&
        !probe.canPlayType("audio/webm") &&
        !probe.canPlayType("audio/mpeg"))
    ) {
      return;
    }

    const ambientUrl = getScenarioAmbientAudioUrl(scenario.id);
    const audio = new Audio(ambientUrl);
    audio.loop = true;
    audio.volume = 0.15;
    ambientAudioRef.current = audio;

    const tryStartAmbient = () => {
      if (ambientAudioRef.current && ambientAudioRef.current.paused && sfxEnabled && !isFinished) {
        const p = ambientAudioRef.current.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      }
    };

    tryStartAmbient();
    window.addEventListener("pointerdown", tryStartAmbient, { once: true });
    window.addEventListener("keydown", tryStartAmbient, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryStartAmbient);
      window.removeEventListener("keydown", tryStartAmbient);
      audio.pause();
      audio.src = "";
      if (ambientAudioRef.current === audio) {
        ambientAudioRef.current = null;
      }
    };
  }, [scenario.id, sfxEnabled, isFinished]);

  // Stop all dialogue/SFX/ambient audio immediately when leaving the scene
  useEffect(() => {
    return () => {
      stopAudio?.();
      stopScenarioSfx();
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current.src = "";
        ambientAudioRef.current = null;
      }
    };
  }, [stopAudio]);

  // Duck background ambient volume while dialogue voice is speaking so voice is never overpowered
  useEffect(() => {
    if (!ambientAudioRef.current) return;
    ambientAudioRef.current.volume = isPlaying ? 0.06 : 0.15;
  }, [isPlaying]);

  // Auto-play dialogue voice when entering new dialogue node (including final farewell / awkward / failure nodes!)
  useEffect(() => {
    if (
      autoPlayAudio &&
      currentNode.npcTextJa &&
      !currentNode.npcTextJa.startsWith("（")
    ) {
      stopScenarioSfx();
      playSentence(currentNode.npcTextJa, currentNode.id, {
        audioSrc: getScenarioDialogueAudioUrl(scenario.id, currentNode.id),
        reading: currentNode.npcReadingHiragana,
        romaji: currentNode.npcRomaji,
        speaker: currentNode.speakerVoiceId,
      });
    }
  }, [
    scenario.id,
    currentNode.id,
    currentNode.npcTextJa,
    currentNode.npcReadingHiragana,
    currentNode.npcRomaji,
    currentNode.speakerVoiceId,
    autoPlayAudio,
    playSentence,
  ]);

  // Play character expressive reaction sound on node/expression transition when full voice autoplay is off
  useEffect(() => {
    if (
      currentNode.id === scenario.initialNodeId ||
      autoPlayAudio ||
      !currentNode.expression
    ) {
      return;
    }

    const timer = setTimeout(() => {
      playScenarioSfx(scenario.id, currentNode.expression!, 0.75);
    }, 150);

    return () => clearTimeout(timer);
  }, [currentNode.id, currentNode.expression, autoPlayAudio, scenario.id, scenario.initialNodeId]);

  const handleSelectChoiceInternal = useCallback(
    (choice: DialogueChoice) => {
      stopAudio?.();
      stopScenarioSfx();

      // Record player choice in backlog
      setBacklogHistory((prev) => [
        ...prev,
        {
          id: choice.id,
          speaker: "player",
          speakerName: "あなた (Player)",
          textJa: choice.textJa,
          readingHiragana: choice.readingHiragana,
          textEn: choice.textEn,
          tier: choice.tier,
          points: choice.points,
        },
      ]);

      playScenarioSfx(scenario.id, "atmosphere-bonus", 0.35);
      onSelectChoice(choice);
    },
    [onSelectChoice, scenario.id, stopAudio]
  );

  const handleReplayDialogueAudio = useCallback(() => {
    playSentence(currentNode.npcTextJa, currentNode.id, {
      audioSrc: getScenarioDialogueAudioUrl(scenario.id, currentNode.id),
      reading: currentNode.npcReadingHiragana,
      romaji: currentNode.npcRomaji,
      speaker: currentNode.speakerVoiceId,
    });
  }, [scenario.id, currentNode, playSentence]);

  const handlePreviewChoiceAudio = useCallback(
    (textJa: string, id: string, reading?: string, romaji?: string) => {
      playSentence(textJa, id, {
        audioSrc: getScenarioChoiceAudioUrl(scenario.id, id),
        reading,
        romaji,
        speaker: 11,
      });
    },
    [playSentence, scenario.id]
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
    <div
      className={`relative mx-auto flex w-full flex-col items-center select-none ${
        isFullscreen ? "fixed inset-0 z-50 bg-black p-0" : "max-w-6xl"
      }`}
    >
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
          onToggleAutoPlay={handleToggleAutoPlay}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenBacklog={() => setIsBacklogOpen(true)}
          onRestart={onRestart}
        />

        {/* Backlog Drawer Overlay */}
        <VnBacklogDrawer
          isOpen={isBacklogOpen}
          onClose={() => setIsBacklogOpen(false)}
          logs={backlogHistory}
          onPlayAudio={(textJa, id, reading) => {
            const dialogueAudio = getScenarioDialogueAudioUrl(scenario.id, id);
            const choiceAudio = dialogueAudio ? undefined : getScenarioChoiceAudioUrl(scenario.id, id);
            playSentence(textJa, id, {
              audioSrc: dialogueAudio || choiceAudio,
              reading,
            });
          }}
        />

        {/* Layer 4: Interactive Zone (Choices + Feedback below Choices + Dialogue Box OR In-Scene End Assessment) */}
        {!isFinished ? (
          <div className="relative z-30 flex w-full flex-col justify-end p-3 sm:p-5 sm:pb-5">
            {/* Upper Stack: Response Options on top, Progress/Etiquette Feedback below them, with mb-5 gap before Dialogue Box nameplate */}
            {((currentNode.choices && currentNode.choices.length > 0) || lastTurnFeedback) && (
              <div className="mb-5 flex w-full flex-col gap-2">
                {currentNode.choices && currentNode.choices.length > 0 && (
                  <VnChoiceOverlay
                    choices={currentNode.choices}
                    onSelectChoice={handleSelectChoiceInternal}
                    onPreviewAudio={handlePreviewChoiceAudio}
                    showEnglish={showEnglish}
                  />
                )}

                {lastTurnFeedback && (
                  <div className="max-w-2xl mx-auto flex w-full items-center gap-2 rounded-xl border border-[var(--sakura)]/60 bg-slate-950/90 px-3 py-1.5 shadow-md backdrop-blur-md text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="text-xs shrink-0">💡</span>
                    <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-japanese font-bold text-[var(--sakura-light)] text-xs">
                        {lastTurnFeedback.ja}
                      </span>
                      <span className="text-[10px] text-white/75">
                        {lastTurnFeedback.en}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
              finalNode={currentNode}
              onReplayFinalAudio={handleReplayDialogueAudio}
              onRestart={onRestart}
            />
          )
        )}
      </div>
    </div>
  );
};
