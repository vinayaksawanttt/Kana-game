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
  getScenarioAmbientAudioSources,
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

  // Choice transition & MC voice states
  const [transitioningChoice, setTransitioningChoice] = useState<DialogueChoice | null>(null);
  const [showChoiceTransitionFeedback, setShowChoiceTransitionFeedback] = useState(false);
  const choiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout[]>([]);

  const clearTransitionTimers = useCallback(() => {
    transitionTimerRef.current.forEach(clearTimeout);
    transitionTimerRef.current = [];
    if (choiceAudioRef.current) {
      choiceAudioRef.current.pause();
      choiceAudioRef.current.onended = null;
      choiceAudioRef.current.onerror = null;
      choiceAudioRef.current.src = "";
      choiceAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
    };
  }, [clearTransitionTimers]);

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

    const sources = getScenarioAmbientAudioSources(scenario.id);
    const canPlayOpus = Boolean(
      probe.canPlayType &&
      (probe.canPlayType('audio/ogg; codecs="opus"') ||
        probe.canPlayType("audio/ogg") ||
        probe.canPlayType("audio/webm"))
    );
    const primarySrc = canPlayOpus ? sources.opus : sources.mp3;
    const fallbackSrc = sources.mp3;

    const audio = new Audio(primarySrc);
    audio.loop = true;
    audio.volume = isPlaying ? 0.18 : 0.35;
    ambientAudioRef.current = audio;

    // Safari / WebKit codec fallback on error: automatically switch to MP3
    const handleAudioError = () => {
      if (audio.src && !audio.src.endsWith(".mp3")) {
        audio.src = fallbackSrc;
        audio.load();
        audio.play().catch(() => {});
      }
    };
    audio.addEventListener("error", handleAudioError);

    let interactionListenersAttached = false;
    const removeInteractionListeners = () => {
      if (!interactionListenersAttached) return;
      interactionListenersAttached = false;
      window.removeEventListener("pointerdown", tryStartAmbient);
      window.removeEventListener("touchstart", tryStartAmbient);
      window.removeEventListener("click", tryStartAmbient);
      window.removeEventListener("keydown", tryStartAmbient);
    };

    const attachInteractionListeners = () => {
      if (interactionListenersAttached) return;
      interactionListenersAttached = true;
      window.addEventListener("pointerdown", tryStartAmbient, { passive: true });
      window.addEventListener("touchstart", tryStartAmbient, { passive: true });
      window.addEventListener("click", tryStartAmbient, { passive: true });
      window.addEventListener("keydown", tryStartAmbient, { passive: true });
    };

    const tryStartAmbient = () => {
      if (ambientAudioRef.current && ambientAudioRef.current.paused && sfxEnabled && !isFinished) {
        const p = ambientAudioRef.current.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            removeInteractionListeners();
          }).catch(() => {
            attachInteractionListeners();
          });
        }
      }
    };

    audio.addEventListener("playing", removeInteractionListeners);
    tryStartAmbient();
    attachInteractionListeners();

    return () => {
      removeInteractionListeners();
      audio.removeEventListener("playing", removeInteractionListeners);
      audio.removeEventListener("error", handleAudioError);
      audio.pause();
      audio.src = "";
      if (ambientAudioRef.current === audio) {
        ambientAudioRef.current = null;
      }
    };
  }, [scenario.id, sfxEnabled, isFinished]);

  // Stop dialogue/SFX audio immediately when leaving the scene
  useEffect(() => {
    return () => {
      stopAudio?.();
      stopScenarioSfx();
    };
  }, [stopAudio]);

  // Duck background ambient volume while dialogue or player choice voice is speaking so voice is never overpowered
  useEffect(() => {
    if (!ambientAudioRef.current) return;
    const isVoiceSpeaking = isPlaying || Boolean(transitioningChoice);
    ambientAudioRef.current.volume = isVoiceSpeaking ? 0.18 : 0.35;
  }, [isPlaying, transitioningChoice]);

  // Auto-play dialogue voice when entering new dialogue node (including final farewell / awkward / failure nodes!)
  useEffect(() => {
    if (autoPlayAudio && currentNode.npcTextJa) {
      const dialogueAudioUrl = getScenarioDialogueAudioUrl(scenario.id, currentNode.id);
      const isPureNarration =
        currentNode.npcTextJa.startsWith("（") && currentNode.npcTextJa.endsWith("）");

      // Auto-play whenever registered voice audio exists or text contains spoken dialogue (even with leading stage directions)
      if (dialogueAudioUrl || !isPureNarration) {
        stopScenarioSfx();
        playSentence(currentNode.npcTextJa, currentNode.id, {
          audioSrc: dialogueAudioUrl,
          reading: currentNode.npcReadingHiragana,
          romaji: currentNode.npcRomaji,
          speaker: currentNode.speakerVoiceId,
        });
      }
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
      playScenarioSfx(scenario.id, currentNode.expression!, 0.75, currentNode.characterKey);
    }, 150);

    return () => clearTimeout(timer);
  }, [
    currentNode.id,
    currentNode.expression,
    currentNode.characterKey,
    autoPlayAudio,
    scenario.id,
    scenario.initialNodeId,
  ]);

  const handleSelectChoiceInternal = useCallback(
    (choice: DialogueChoice) => {
      stopAudio?.();
      stopScenarioSfx();
      clearTransitionTimers();

      if (ambientAudioRef.current?.paused && sfxEnabled && !isFinished) {
        ambientAudioRef.current.play().catch(() => {});
      }

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

      // In unit test environment, advance immediately to keep test suite fast and deterministic
      if (process.env.NODE_ENV === "test") {
        playScenarioSfx(scenario.id, "atmosphere-bonus", 0.35);
        onSelectChoice(choice);
        return;
      }

      const choiceAudioUrl = getScenarioChoiceAudioUrl(scenario.id, choice.id);

      // If autoplay is enabled, play MC audio and show midway transition
      if (autoPlayAudio && choiceAudioUrl) {
        setTransitioningChoice(choice);
        setShowChoiceTransitionFeedback(false);

        let hasFinished = false;
        let showedFeedback = false;

        const triggerMidwayFeedback = () => {
          if (showedFeedback || hasFinished) return;
          showedFeedback = true;
          setShowChoiceTransitionFeedback(true);
          playScenarioSfx(scenario.id, "atmosphere-bonus", 0.35);
        };

        const completeTransition = () => {
          if (hasFinished) return;
          hasFinished = true;
          clearTransitionTimers();
          setTransitioningChoice(null);
          setShowChoiceTransitionFeedback(false);
          onSelectChoice(choice);
        };

        try {
          const audio = new Audio(choiceAudioUrl);
          choiceAudioRef.current = audio;

          // When audio metadata is loaded or known, adjust midpoint timer and watchdog
          const setupTimersForDuration = (durationSec: number) => {
            if (!isFinite(durationSec) || durationSec <= 0) return;
            const midwayMs = Math.max(600, durationSec * 1000 * 0.45);
            const midwayTimer = setTimeout(triggerMidwayFeedback, midwayMs);
            transitionTimerRef.current.push(midwayTimer);

            // Watchdog timer: only triggers if audio has stalled or unexpectedly failed to emit 'ended'
            const watchdogTimer = setTimeout(() => {
              if (audio && !audio.paused && !audio.ended && audio.currentTime < durationSec - 0.2) {
                return;
              }
              completeTransition();
            }, durationSec * 1000 + 4000);
            transitionTimerRef.current.push(watchdogTimer);
          };

          audio.onloadedmetadata = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
              setupTimersForDuration(audio.duration);
            }
          };

          // Timeupdate: smoothly reveal midway feedback midway through actual speech
          audio.ontimeupdate = () => {
            if (!showedFeedback) {
              const dur = audio.duration;
              const target = isFinite(dur) && dur > 0 ? Math.max(0.6, dur * 0.45) : 1.2;
              if (audio.currentTime >= target) {
                triggerMidwayFeedback();
              }
            }
          };

          // CRITICAL: Play the full dialogue completely through to 'ended' before transitioning to NPC
          audio.onended = () => {
            triggerMidwayFeedback();
            // Pleasant 300ms natural breathing room after sentence before NPC responds
            const endTimer = setTimeout(completeTransition, 300);
            transitionTimerRef.current.push(endTimer);
          };

          audio.onerror = () => {
            triggerMidwayFeedback();
            const fallbackEnd = setTimeout(completeTransition, 1600);
            transitionTimerRef.current.push(fallbackEnd);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              if (hasFinished) return;
              if (audio && !audio.paused && !audio.ended) return;
              triggerMidwayFeedback();
              const fallbackEnd = setTimeout(completeTransition, 1600);
              transitionTimerRef.current.push(fallbackEnd);
            });
          }

          // Initial fallback watchdog (20 seconds), in case metadata or ended never fire
          const initialWatchdog = setTimeout(() => {
            if (audio && !audio.paused && !audio.ended) return;
            completeTransition();
          }, 20000);
          transitionTimerRef.current.push(initialWatchdog);
        } catch {
          playScenarioSfx(scenario.id, "atmosphere-bonus", 0.35);
          onSelectChoice(choice);
        }
      } else {
        // Autoplay off: play atmosphere sound and transition
        playScenarioSfx(scenario.id, "atmosphere-bonus", 0.35);
        onSelectChoice(choice);
      }
    },
    [
      onSelectChoice,
      scenario.id,
      sfxEnabled,
      isFinished,
      stopAudio,
      autoPlayAudio,
      clearTransitionTimers,
    ]
  );

  const handleSkipChoiceTransition = useCallback(() => {
    if (transitioningChoice) {
      clearTransitionTimers();
      const choice = transitioningChoice;
      setTransitioningChoice(null);
      setShowChoiceTransitionFeedback(false);
      onSelectChoice(choice);
    }
  }, [transitioningChoice, clearTransitionTimers, onSelectChoice]);

  const handleReplayDialogueAudio = useCallback(() => {
    if (ambientAudioRef.current?.paused && sfxEnabled && !isFinished) {
      ambientAudioRef.current.play().catch(() => {});
    }
    playSentence(currentNode.npcTextJa, currentNode.id, {
      audioSrc: getScenarioDialogueAudioUrl(scenario.id, currentNode.id),
      reading: currentNode.npcReadingHiragana,
      romaji: currentNode.npcRomaji,
      speaker: currentNode.speakerVoiceId,
    });
  }, [scenario.id, currentNode, sfxEnabled, isFinished, playSentence]);

  const handlePreviewChoiceAudio = useCallback(
    (textJa: string, id: string, reading?: string, romaji?: string) => {
      if (ambientAudioRef.current?.paused && sfxEnabled && !isFinished) {
        ambientAudioRef.current.play().catch(() => {});
      }
      playSentence(textJa, id, {
        audioSrc: getScenarioChoiceAudioUrl(scenario.id, id),
        reading,
        romaji,
        speaker: 11,
      });
    },
    [playSentence, scenario.id, sfxEnabled, isFinished]
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
            characterKey={currentNode.characterKey}
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
          <div
            onClick={handleSkipChoiceTransition}
            className={`relative z-30 flex w-full flex-col justify-end transition-all duration-300 ${
              isFullscreen
                ? "p-4 sm:p-8 xl:p-12 pb-6 sm:pb-8 xl:pb-10"
                : "p-3 sm:p-5 sm:pb-5"
            }`}
          >
            {/* Upper Stack: Response Options on top, Progress/Etiquette Feedback below them, with gap before Dialogue Box nameplate */}
            {((currentNode.choices && currentNode.choices.length > 0) ||
              lastTurnFeedback ||
              showChoiceTransitionFeedback) && (
              <div
                className={`flex w-full flex-col ${
                  isFullscreen ? "mb-6 sm:mb-8 gap-3" : "mb-5 gap-2"
                }`}
              >
                {currentNode.choices && currentNode.choices.length > 0 && (
                  <VnChoiceOverlay
                    choices={currentNode.choices}
                    selectedChoiceId={transitioningChoice?.id}
                    disabled={Boolean(transitioningChoice)}
                    onSelectChoice={handleSelectChoiceInternal}
                    onPreviewAudio={handlePreviewChoiceAudio}
                    showEnglish={showEnglish}
                    isFullscreen={isFullscreen}
                  />
                )}

                {/* Midway Choice Transition Feedback Banner */}
                {showChoiceTransitionFeedback && transitioningChoice && (
                  <div
                    className={`mx-auto flex w-full items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isFullscreen
                        ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl rounded-2xl sm:rounded-3xl border-2 border-[var(--sakura)]/80 bg-slate-950/95 px-5 py-3.5 sm:px-6 sm:py-4 gap-4"
                        : "max-w-2xl rounded-2xl border border-[var(--sakura)]/80 bg-slate-950/95 px-4 py-2.5 gap-3 text-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 ${
                          isFullscreen ? "text-xl sm:text-2xl" : "text-base"
                        }`}
                      >
                        💡
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`font-japanese font-bold text-pink-200 ${
                            isFullscreen
                              ? "text-sm sm:text-base xl:text-lg"
                              : "text-xs sm:text-sm"
                          }`}
                        >
                          {transitioningChoice.feedbackJa}
                        </p>
                        <p
                          className={`text-white/80 line-clamp-1 ${
                            isFullscreen
                              ? "text-xs sm:text-sm xl:text-base mt-0.5"
                              : "text-[11px]"
                          }`}
                        >
                          {transitioningChoice.feedbackEn}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-bold uppercase tracking-wider ${
                        isFullscreen
                          ? "rounded-xl px-3.5 py-1 text-xs sm:text-sm"
                          : "rounded-lg px-2.5 py-0.5 text-[10px]"
                      } ${
                        transitioningChoice.tier === "respectful"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : transitioningChoice.tier === "polite"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : transitioningChoice.tier === "casual"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {transitioningChoice.tier === "respectful"
                        ? "Respectful"
                        : transitioningChoice.tier === "polite"
                        ? "Polite"
                        : transitioningChoice.tier === "casual"
                        ? "Casual"
                        : "Awkward"}
                    </span>
                  </div>
                )}

                {!transitioningChoice && lastTurnFeedback && (
                  <div
                    className={`mx-auto flex w-full items-center shadow-md backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      isFullscreen
                        ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl rounded-2xl border-2 border-[var(--sakura)]/60 bg-slate-950/90 px-4 py-2.5 sm:px-5 sm:py-3 gap-3"
                        : "max-w-2xl rounded-xl border border-[var(--sakura)]/60 bg-slate-950/90 px-3 py-1.5 gap-2 text-xs"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${
                        isFullscreen ? "text-base sm:text-lg" : "text-xs"
                      }`}
                    >
                      💡
                    </span>
                    <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span
                        className={`font-japanese font-bold text-pink-200 ${
                          isFullscreen
                            ? "text-sm sm:text-base xl:text-lg"
                            : "text-xs"
                        }`}
                      >
                        {lastTurnFeedback.ja}
                      </span>
                      <span
                        className={`text-white/75 ${
                          isFullscreen
                            ? "text-xs sm:text-sm xl:text-base"
                            : "text-[10px]"
                        }`}
                      >
                        {lastTurnFeedback.en}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Dialogue Box */}
            <VnDialogueBox
              speakerNameJa={transitioningChoice ? "あなた" : currentNode.speakerNameJa}
              speakerNameEn={transitioningChoice ? "You" : currentNode.speakerNameEn}
              speakerRoleEn={transitioningChoice ? "Player" : (currentNode.speakerRoleEn || scenario.characterRoleEn)}
              textJa={transitioningChoice ? transitioningChoice.textJa : currentNode.npcTextJa}
              readingHiragana={transitioningChoice ? (transitioningChoice.readingHiragana || "") : currentNode.npcReadingHiragana}
              textEn={transitioningChoice ? transitioningChoice.textEn : currentNode.npcTextEn}
              isSpeaking={Boolean(transitioningChoice) || isCurrentSpeaking}
              showFurigana={showFurigana}
              showEnglish={showEnglish}
              autoPlayAudio={autoPlayAudio}
              isFullscreen={isFullscreen}
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
              isFullscreen={isFullscreen}
              onReplayFinalAudio={handleReplayDialogueAudio}
              onRestart={onRestart}
            />
          )
        )}
      </div>
    </div>
  );
};
