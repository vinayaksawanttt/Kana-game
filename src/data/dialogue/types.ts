/**
 * Type definitions for Dialogue Quest (会話ロールプレイング)
 */

export type DialoguePolitenessTier = "casual" | "polite" | "respectful" | "rude" | "awkward";

export interface DialogueChoice {
  id: string;
  textJa: string;
  readingHiragana: string;
  romaji: string;
  textEn: string;
  tier: DialoguePolitenessTier;
  points: number; // e.g. 100 for natural, 60 for awkward, 10 for casual, -50 for rude
  feedbackJa: string;
  feedbackEn: string;
  nextNodeId: string;
}

export interface DialogueNode {
  id: string;
  speakerNameJa: string;
  speakerNameEn: string;
  speakerAvatar: string;
  npcTextJa: string;
  npcReadingHiragana: string;
  npcRomaji: string;
  npcTextEn: string;
  speakerVoiceId: number; // VOICEVOX Speaker ID (e.g. 14 for Himari, 13 for Ryusei, 20 for Mochiko)
  choices: DialogueChoice[];
  isEnding?: boolean;
  endingType?: "perfect" | "success" | "awkward" | "failure";
  expression?: string; // e.g. "neutral", "pointing", "happy", "thinking", "surprised", "confused", "embarrased", "sad", "goodbye", "backstare"
  backgroundKey?: string; // e.g. "shibuya-square", "station-entrance", "mcdonalds-store"
}

export interface ScenarioVocabItem {
  ja: string;
  kana: string;
  romaji: string;
  en: string;
  partOfSpeech?: string;
}

export interface ScenarioMeta {
  id: string;
  titleJa: string;
  titleEn: string;
  level: "N5" | "N4" | "N3";
  category: "directions" | "koban" | "konbini" | "school" | "landlord" | "employer" | "market";
  locationJa: string;
  locationEn: string;
  characterNameJa: string;
  characterNameEn: string;
  characterRoleEn: string;
  characterAvatar: string;
  voiceSpeakerId: number;
  initialNodeId: string;
  descriptionJa: string;
  descriptionEn: string;
  backgroundTheme: "street" | "station" | "office" | "store" | "apartment" | "countryside";
  defaultBackgroundKey?: string;
  defaultExpression?: string;
  vocabList?: ScenarioVocabItem[];
}

export interface DialogueTurnHistory {
  nodeId: string;
  chosenOptionId: string;
  chosenTextJa: string;
  chosenTextEn: string;
  tier: DialoguePolitenessTier;
  pointsEarned: number;
  npcReplyJa: string;
  npcReplyEn: string;
  feedbackEn: string;
}

export interface DialogueSession {
  sessionId: string;
  scenario: ScenarioMeta;
  currentNodeId: string;
  turns: DialogueTurnHistory[];
  totalScore: number;
  atmosphereMeter: number; // 0 to 100, starts at 60
  isFinished: boolean;
  finalEndingType?: "perfect" | "success" | "awkward" | "failure";
  startedAt: number;
  endedAt?: number;
}
