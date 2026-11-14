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
import { VisualNovelStage } from "@/components/dialogue/vn/VisualNovelStage";
import { GameLayout } from "@/lib/game-core/layout";
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
    const nextSession = executeDialogueTurn(session, nodes, choice);
    setSession(nextSession);
    setLastTurnFeedback({
      ja: choice.feedbackJa,
      en: choice.feedbackEn,
      tier: choice.tier,
    });

    if (nextSession.isFinished) {
      if (nextSession.finalEndingType === "perfect" || nextSession.finalEndingType === "success") {
        setTimeout(() => playSfx("victory-fanfare"), 1000);
      }
    }
  };

  const handleRestart = () => {
    setSession(createDialogueSession(scenario));
    setLastTurnFeedback(null);
  };

  return (
    <GameLayout label="DIALOGUE QUEST" glyph="話" homeHref="/games/dialogue">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-2 py-2 sm:px-6 sm:py-4">
        <VisualNovelStage
          scenario={scenario}
          currentNode={currentNode}
          turnNumber={session.turns.length + 1}
          totalScore={session.totalScore}
          atmosphereValue={session.atmosphereMeter}
          isFinished={session.isFinished}
          session={session}
          lastTurnFeedback={lastTurnFeedback}
          onSelectChoice={handleSelectChoice}
          onRestart={handleRestart}
        />
      </section>
    </GameLayout>
  );
}
