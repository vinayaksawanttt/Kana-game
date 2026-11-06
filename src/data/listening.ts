import { kanaCharacters } from "@/data/kana";
import { loadVocabularyData, type VocabularyLevel } from "@/data/vocabulary";
import { getAllStories } from "@/data/stories";
import {
  extractListeningSentences,
  levelNumberToString,
  type JlptLevel,
  type ListeningPoolData,
  type ListeningSettings,
} from "@/engine/listening";

export async function loadListeningPool(
  settings: Pick<ListeningSettings, "subMode" | "levels">
): Promise<ListeningPoolData> {
  if (settings.subMode === "kana") {
    return { kana: kanaCharacters };
  }

  const requestedLevels: VocabularyLevel[] = (
    settings.levels?.length ? settings.levels : ([5] as JlptLevel[])
  ).map(levelNumberToString);

  // Ensure N5 is loaded alongside requested levels if needed for distractors
  const fetchLevels = Array.from(new Set<VocabularyLevel>([...requestedLevels, "N5"]));
  const vocabData = await loadVocabularyData(fetchLevels);

  if (settings.subMode === "vocabulary") {
    return {
      vocabulary: vocabData.records,
    };
  }

  const stories = getAllStories();
  const sentences = extractListeningSentences(vocabData.records, stories);
  return {
    vocabulary: vocabData.records,
    stories,
    sentences,
  };
}
