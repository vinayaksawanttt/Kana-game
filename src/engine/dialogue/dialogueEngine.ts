import {
  ScenarioMeta,
  DialogueNode,
  DialogueChoice,
  DialogueSession,
  DialogueTurnHistory,
} from "@/data/dialogue/types";

export function createDialogueSession(
  scenario: ScenarioMeta,
  sessionId: string = `dialogue-${Date.now()}`
): DialogueSession {
  return {
    sessionId,
    scenario,
    currentNodeId: scenario.initialNodeId,
    turns: [],
    totalScore: 0,
    atmosphereMeter: 65, // Starts at a comfortable neutral-friendly baseline
    isFinished: false,
    startedAt: Date.now(),
  };
}

export function executeDialogueTurn(
  session: DialogueSession,
  nodes: Record<string, DialogueNode>,
  chosenChoice: DialogueChoice
): DialogueSession {
  if (session.isFinished) return session;

  const currentNode = nodes[session.currentNodeId];
  if (!currentNode) return session;

  // Calculate new atmosphere impact
  let atmosphereDelta = 0;
  if (chosenChoice.tier === "respectful") {
    atmosphereDelta = 15;
  } else if (chosenChoice.tier === "polite") {
    atmosphereDelta = 10;
  } else if (chosenChoice.tier === "casual") {
    atmosphereDelta = -5;
  } else if (chosenChoice.tier === "awkward") {
    atmosphereDelta = -10;
  } else if (chosenChoice.tier === "rude") {
    atmosphereDelta = -40;
  }

  const nextAtmosphere = Math.max(0, Math.min(100, session.atmosphereMeter + atmosphereDelta));
  const nextNode = nodes[chosenChoice.nextNodeId];

  const turnRecord: DialogueTurnHistory = {
    nodeId: currentNode.id,
    chosenOptionId: chosenChoice.id,
    chosenTextJa: chosenChoice.textJa,
    chosenTextEn: chosenChoice.textEn,
    tier: chosenChoice.tier,
    pointsEarned: chosenChoice.points,
    npcReplyJa: nextNode ? nextNode.npcTextJa : "",
    npcReplyEn: nextNode ? nextNode.npcTextEn : "",
    feedbackEn: chosenChoice.feedbackEn,
  };

  const isEnding = nextNode?.isEnding || !nextNode || nextNode.choices.length === 0;

  return {
    ...session,
    currentNodeId: chosenChoice.nextNodeId,
    turns: [...session.turns, turnRecord],
    totalScore: session.totalScore + chosenChoice.points,
    atmosphereMeter: nextAtmosphere,
    isFinished: Boolean(isEnding),
    finalEndingType: nextNode?.endingType ?? (isEnding ? "success" : undefined),
    endedAt: isEnding ? Date.now() : undefined,
  };
}
