import { kanaCharacters } from "@/data/kana";
import { loadVocabularyData, type VocabularyLevel } from "@/data/vocabulary";
import {
  extractListeningSentences,
  levelNumberToString,
  type JlptLevel,
  type ListeningPoolData,
  type ListeningSentenceItem,
  type ListeningSettings,
} from "@/features/listening/engine/listening";

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

  const { getAllStories } = await import("@/data/stories");
  const stories = getAllStories();

  // Load authentic textbook dialogue lines for requested levels
  const textbookLines: ListeningSentenceItem[] = [];
  try {
    const { getBookById } = await import("@/data/books");
    const bookTargets: Array<{ id: "genki-1" | "genki-2" | "mnn-1"; jlpt: JlptLevel }> = [];
    if (fetchLevels.includes("N5")) {
      bookTargets.push({ id: "genki-1", jlpt: 5 }, { id: "mnn-1", jlpt: 5 });
    }
    if (fetchLevels.includes("N4")) {
      bookTargets.push({ id: "genki-2", jlpt: 4 });
    }

    const books = await Promise.all(bookTargets.map((b) => getBookById(b.id)));
    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      const jlpt = bookTargets[i].jlpt;
      if (!book) continue;
      for (const lesson of book.lessons || []) {
        for (const scene of lesson.dialogues || []) {
          for (let lIdx = 0; lIdx < scene.lines.length; lIdx++) {
            const line = scene.lines[lIdx];
            if (line.ja && line.en && line.audioSrc) {
              textbookLines.push({
                id: `tb:${book.id}:L${lesson.lessonNumber}:${scene.id || scene.sceneNumber || "0"}:${lIdx}`,
                ja: line.ja,
                reading: line.ja,
                en: line.en,
                jlpt,
                audioSrc: line.audioSrc,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    // If book loading encounters an issue in edge/test environments, proceed with story & vocab pool
    console.warn("Could not load textbook dialogue sentences:", err);
  }

  const sentences = extractListeningSentences(vocabData.records, stories, textbookLines);
  return {
    vocabulary: vocabData.records,
    stories,
    sentences,
  };
}
