import { describe, it, expect } from "vitest";
import {
  DIRECTIONS_SCENARIO_META,
  DIRECTIONS_NODES,
} from "@/data/dialogue/scenarios/directions-mcdonalds";
import { DIALOGUE_SCENARIOS, getScenarioNodes } from "@/data/dialogue";
import { createDialogueSession, executeDialogueTurn } from "../dialogueEngine";

describe("Dialogue Engine", () => {
  it("initializes a dialogue session with default atmosphere meter", () => {
    const session = createDialogueSession(DIRECTIONS_SCENARIO_META);
    expect(session.currentNodeId).toBe("node-1-initiation");
    expect(session.atmosphereMeter).toBe(65);
    expect(session.isFinished).toBe(false);
    expect(session.turns).toHaveLength(0);
  });

  it("advances correctly along polite conversation path to perfect ending", () => {
    let session = createDialogueSession(DIRECTIONS_SCENARIO_META);

    // Turn 1: Polite approach
    const choice1 = DIRECTIONS_NODES["node-1-initiation"].choices.find(
      (c: { id: string }) => c.id === "c1-polite"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, choice1);

    expect(session.currentNodeId).toBe("node-2-npc-reply-polite");
    expect(session.atmosphereMeter).toBe(75);
    expect(session.turns).toHaveLength(1);

    // Turn 2: Ask for McDonald's
    const choice2 = DIRECTIONS_NODES["node-2-npc-reply-polite"].choices.find(
      (c: { id: string }) => c.id === "c2-landmark"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, choice2);

    expect(session.currentNodeId).toBe("node-3-npc-directions");
    expect(session.atmosphereMeter).toBe(85);

    // Turn 3: Confirm and thank respectfully
    const choice3 = DIRECTIONS_NODES["node-3-npc-directions"].choices.find(
      (c: { id: string }) => c.id === "c3-confirm-polite"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, choice3);

    expect(session.isFinished).toBe(true);
    expect(session.finalEndingType).toBe("perfect");
    expect(session.atmosphereMeter).toBe(100);
    expect(session.totalScore).toBe(300);
  });

  it("handles failure path when player is extremely rude", () => {
    let session = createDialogueSession(DIRECTIONS_SCENARIO_META);
    const rudeChoice = DIRECTIONS_NODES["node-1-initiation"].choices.find(
      (c: { id: string }) => c.id === "c1-rude"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, rudeChoice);

    expect(session.currentNodeId).toBe("node-fail-rude");
    expect(session.isFinished).toBe(true);
    expect(session.finalEndingType).toBe("failure");
    expect(session.atmosphereMeter).toBe(25); // 65 - 40
    expect(session.totalScore).toBe(-50);
  });

  it("handles confused branch with recovery leading back to directions", () => {
    let session = createDialogueSession(DIRECTIONS_SCENARIO_META);

    // Turn 1: Ask confusing question ("yellow M house")
    const confusedChoice = DIRECTIONS_NODES["node-1-initiation"].choices.find(
      (c: { id: string }) => c.id === "c1-confusing"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, confusedChoice);

    expect(session.currentNodeId).toBe("node-2-npc-reply-confused");
    expect(DIRECTIONS_NODES[session.currentNodeId].expression).toBe("confused");

    // Turn 2: Recover politely
    const recoverChoice = DIRECTIONS_NODES["node-2-npc-reply-confused"].choices.find(
      (c: { id: string }) => c.id === "c2-confused-recover"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, recoverChoice);

    expect(session.currentNodeId).toBe("node-3-npc-directions");
    expect(DIRECTIONS_NODES[session.currentNodeId].expression).toBe("pointing");
  });

  it("handles walking time inquiry branch with thinking expression", () => {
    let session = createDialogueSession(DIRECTIONS_SCENARIO_META);

    const c1 = DIRECTIONS_NODES["node-1-initiation"].choices.find((c) => c.id === "c1-polite")!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, c1);

    const c2 = DIRECTIONS_NODES["node-2-npc-reply-polite"].choices.find((c) => c.id === "c2-landmark")!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, c2);

    // Ask about walking time
    const c3Time = DIRECTIONS_NODES["node-3-npc-directions"].choices.find(
      (c) => c.id === "c3-ask-walking-time"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, c3Time);

    expect(session.currentNodeId).toBe("node-3-npc-walking-time");
    expect(DIRECTIONS_NODES[session.currentNodeId].expression).toBe("thinking");

    // Complete with landmark gratitude
    const c4 = DIRECTIONS_NODES["node-3-npc-walking-time"].choices.find(
      (c) => c.id === "c3-time-thank-respectful"
    )!;
    session = executeDialogueTurn(session, DIRECTIONS_NODES, c4);

    expect(session.isFinished).toBe(true);
    expect(session.finalEndingType).toBe("perfect");
  });

  it("validates all 6 roleplay scenarios have connected dialogue graphs", () => {
    expect(DIALOGUE_SCENARIOS).toHaveLength(6);
    for (const scenario of DIALOGUE_SCENARIOS) {
      const nodes = getScenarioNodes(scenario.id);
      expect(nodes).toBeDefined();
      expect(nodes![scenario.initialNodeId]).toBeDefined();
      for (const node of Object.values(nodes!)) {
        for (const choice of node.choices) {
          expect(nodes![choice.nextNodeId]).toBeDefined();
        }
      }
    }
  });
});
