"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getScenarioById, getScenarioNodes } from "@/data/dialogue";
import {
  createDialogueSession,
  executeDialogueTurn,
} from "@/engine/dialogue/dialogueEngine";
import { DialogueSession, DialogueChoice } from "@/data/dialogue/types";
import { AtmosphereMeter } from "@/components/dialogue/AtmosphereMeter";
import { DialogueStage } from "@/components/dialogue/DialogueStage";
import { DialogueChoicePanel } from "@/components/dialogue/DialogueChoicePanel";
import { GameLayout } from "@/lib/game-core/layout";
import { ArrowLeft, RotateCcw, MessageCircle } from "lucide-react";
import { useGameSfx } from "@/hooks/useGameSfx";

export default function DialoguePlayPage() {
  const params = useParams();
  const scenarioId = (params?.scenarioId as string) || "directions-mcdonalds";
  const { playSfx } = useGameSfx();

  const scenario = getScenarioById(scenarioId);
  const nodes = getScenarioNodes(scenarioId);

  const [session, setSession] = useState<DialogueSession | null>(null);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{
    ja: string;
    en: string;
    tier: string;
  } | null>(null);

  useEffect(() => {
    if (scenario) {
      setSession(createDialogueSession(scenario));
      setLastTurnFeedback(null);
    }
  }, [scenarioId, scenario]);

  if (!scenario || !nodes || !session) {
    return (
      <GameLayout label="DIALOGUE QUEST" glyph="話" homeHref="/games/dialogue">
        <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-base text-[var(--muted)]">Scenario not found.</p>
          <Link
            href="/games/dialogue"
            className="mt-4 inline-block rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white"
          >
            Back to Scenarios
          </Link>
        </div>
      </GameLayout>
    );
  }

  const currentNode = nodes[session.currentNodeId];

  const handleSelectChoice = (choice: DialogueChoice) => {
    if (choice.tier === "respectful" || choice.tier === "polite") {
      playSfx("correct-chime");
    } else if (choice.tier === "rude" || choice.tier === "awkward") {
      playSfx("incorrect-chime");
    } else {
      playSfx("card-flip");
    }

    const nextSession = executeDialogueTurn(session, nodes, choice);
    setSession(nextSession);
    setLastTurnFeedback({
      ja: choice.feedbackJa,
      en: choice.feedbackEn,
      tier: choice.tier,
    });

    if (nextSession.isFinished) {
      if (nextSession.finalEndingType === "perfect" || nextSession.finalEndingType === "success") {
        setTimeout(() => playSfx("victory-fanfare"), 650);
      }
    }
  };

  const handleRestart = () => {
    setSession(createDialogueSession(scenario));
    setLastTurnFeedback(null);
  };

  return (
    <GameLayout label="DIALOGUE QUEST" glyph="話" homeHref="/games/dialogue">
      <section className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-5 pb-12 pt-4 sm:px-8">
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/games/dialogue"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--primary-fg)]"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Scenarios</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
              Turn {session.turns.length + (session.isFinished ? 0 : 1)} · {session.totalScore} pts
            </span>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--sakura)] hover:text-[var(--ink)]"
            >
              <RotateCcw className="size-3.5" />
              <span>Restart Scene</span>
            </button>
          </div>
        </div>

        {/* Atmosphere Meter */}
        <AtmosphereMeter value={session.atmosphereMeter} />

        {/* Instant Etiquette Feedback Banner from Previous Turn */}
        {lastTurnFeedback && !session.isFinished && (
          <div className="flex items-start gap-3 rounded-xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)]/70 px-4 py-3 text-xs">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-[var(--primary-fg)]" />
            <div>
              <p className="font-japanese font-bold text-[var(--ink)]">{lastTurnFeedback.ja}</p>
              <p className="mt-0.5 text-[var(--muted)]">{lastTurnFeedback.en}</p>
            </div>
          </div>
        )}

        {/* Dialogue Stage / Current Speaker */}
        {currentNode && (
          <DialogueStage scenario={scenario} currentNode={currentNode} />
        )}

        {/* Interactive Choices or Ending Card */}
        {!session.isFinished && currentNode && currentNode.choices.length > 0 ? (
          <DialogueChoicePanel
            choices={currentNode.choices}
            onSelectChoice={handleSelectChoice}
          />
        ) : (
          /* Ending Summary Card */
          <div className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_14px_38px_rgba(188,0,45,0.06)] sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[var(--sakura)] bg-[var(--sakura-light)] text-3xl">
              {session.finalEndingType === "perfect"
                ? "🌟"
                : session.finalEndingType === "success"
                ? "🎉"
                : session.finalEndingType === "awkward"
                ? "😅"
                : "💀"}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--ink)]">
                {session.finalEndingType === "perfect"
                  ? "Perfect Cultural Interaction! (大成功)"
                  : session.finalEndingType === "success"
                  ? "Conversation Succeeded! (成功)"
                  : session.finalEndingType === "awkward"
                  ? "Slightly Awkward Ending (微妙)"
                  : "Conversation Derailment! (失敗)"}
              </h2>
              <p className="mt-1.5 text-sm font-semibold text-[var(--muted)]">
                Total Score: <span className="text-[var(--primary-fg)]">{session.totalScore} pts</span> · Final Atmosphere: <span className="text-[var(--ink)]">{session.atmosphereMeter}%</span>
              </p>
            </div>

            {/* Turn History Review */}
            <div className="mt-4 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] text-left">
              {session.turns.map((turn, idx) => (
                <div key={idx} className="p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[var(--primary-fg)]">
                      Turn {idx + 1} · {turn.tier.toUpperCase()}
                    </span>
                    <span className="font-bold text-[var(--ink)]">
                      {turn.pointsEarned >= 0 ? `+${turn.pointsEarned}` : turn.pointsEarned} pts
                    </span>
                  </div>
                  <p className="mt-1 font-japanese text-sm font-bold text-[var(--ink)]">
                    「{turn.chosenTextJa}」
                  </p>
                  <p className="mt-0.5 text-[var(--muted)] italic">{turn.chosenTextEn}</p>
                  <p className="mt-1.5 font-medium text-[var(--ink)]/90">💡 {turn.feedbackEn}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-5 py-2.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)]"
              >
                Try Different Branches
              </button>
              <Link
                href="/games/dialogue"
                className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                Choose Another Scenario →
              </Link>
            </div>
          </div>
        )}
      </section>
    </GameLayout>
  );
}
