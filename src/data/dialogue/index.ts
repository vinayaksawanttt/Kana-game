import { ScenarioMeta, DialogueNode } from "./types";
import { DIRECTIONS_SCENARIO_META, DIRECTIONS_NODES } from "./scenarios/directions-mcdonalds";
import { KOBAN_SCENARIO_META, KOBAN_NODES } from "./scenarios/koban-lost-wallet";
import { TEACHER_SCENARIO_META, TEACHER_NODES } from "./scenarios/teacher-extension";
import { LANDLORD_SCENARIO_META, LANDLORD_NODES } from "./scenarios/landlord-ac-repair";
import { EMPLOYER_SCENARIO_META, EMPLOYER_NODES } from "./scenarios/employer-shift-request";
import { FARMER_SCENARIO_META, FARMER_NODES } from "./scenarios/farmer-morning-market";

export * from "./types";

export const DIALOGUE_SCENARIOS: ScenarioMeta[] = [
  DIRECTIONS_SCENARIO_META,
  FARMER_SCENARIO_META,
  KOBAN_SCENARIO_META,
  TEACHER_SCENARIO_META,
  LANDLORD_SCENARIO_META,
  EMPLOYER_SCENARIO_META,
];

export const SCENARIO_NODES_MAP: Record<string, Record<string, DialogueNode>> = {
  [DIRECTIONS_SCENARIO_META.id]: DIRECTIONS_NODES,
  [FARMER_SCENARIO_META.id]: FARMER_NODES,
  [KOBAN_SCENARIO_META.id]: KOBAN_NODES,
  [TEACHER_SCENARIO_META.id]: TEACHER_NODES,
  [LANDLORD_SCENARIO_META.id]: LANDLORD_NODES,
  [EMPLOYER_SCENARIO_META.id]: EMPLOYER_NODES,
};

export function getScenarioById(id: string): ScenarioMeta | undefined {
  return DIALOGUE_SCENARIOS.find((s) => s.id === id);
}

export function getScenarioNodes(scenarioId: string): Record<string, DialogueNode> | undefined {
  return SCENARIO_NODES_MAP[scenarioId];
}
