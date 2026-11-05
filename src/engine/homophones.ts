import homophonesData from "../../public/data/v1/kanji/homophones.json";

export interface HomophoneMember {
  kanji: string;
  word: string;
  reading: string;
  nuance: string;
  example: string;
}

export interface HomophoneGroup {
  id: string;
  reading: string;
  title: string;
  members: HomophoneMember[];
}

interface HomophonesPayload {
  version: string;
  totalGroups: number;
  groups: HomophoneGroup[];
  byKanji: Record<string, HomophoneGroup>;
}

const data = homophonesData as unknown as HomophonesPayload;

/**
 * Returns the homophone nuance group for a given kanji character, or undefined if none exists.
 */
export function getHomophoneGroupForKanji(kanji: string): HomophoneGroup | undefined {
  if (!kanji || kanji.length === 0) return undefined;
  return data.byKanji[kanji];
}

/**
 * Returns all registered homophone nuance groups.
 */
export function getAllHomophoneGroups(): HomophoneGroup[] {
  return data.groups;
}

