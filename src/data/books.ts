export type BookId = "genki-1" | "genki-2" | "mnn-1" | "mnn-2";

export interface BookCatalogEntry {
  id: BookId;
  title: string;
  japaneseTitle: string;
  level: "N5" | "N4";
  series: string;
  description: string;
  coverImage?: string;
  totalLessons: number;
  lessonRange: [number, number];
  stats: {
    vocabularyCount: number;
    kanjiCount: number;
    grammarCount: number;
    practiceCount?: number;
  };
}

export interface BookVocabItem {
  id: string;
  word: string;
  reading: string;
  readingKana: string;
  meaning: string;
  type: string;
  linkedVocabId?: string;
  hasAudio: boolean;
  audioKey?: string;
}

export interface BookKanjiItem {
  id: string;
  number: number;
  kanji: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  strokes?: number;
  jlpt?: number;
  label?: string;
  linkedKanjiId?: string;
}

export interface BookGrammarExample {
  ja: string;
  en?: string;
  audioKey?: string;
  audioSrc?: string;
  promptEn?: string;
}

export interface BookGrammarItem {
  id: string;
  lessonNumber: number;
  index: number;
  title: string;
  pattern: string;
  explanation: string;
  bulletPoints: string[];
  examples: BookGrammarExample[];
  linkedGrammarId?: string;
  linkedGrammarTitle?: string;
}

export interface BookDialogueLine {
  speaker: string;
  speakerJa: string;
  ja: string;
  en: string;
  audioSrc?: string;
}

export interface BookDialogueScene {
  id: string;
  sceneNumber: string;
  setting?: string;
  lines: BookDialogueLine[];
}

export interface BookPracticeItem {
  id: string;
  prompt: string;
  cue?: string;
  answer: string;
  options?: string[];
  hint?: string;
  audioTrack?: string;
  audioSrc?: string;
}

export interface BookPracticeSection {
  id: string;
  part: string;
  section?: string;
  title: string;
  subTitle?: string;
  grammarIndex?: number;
  grammarTitle?: string;
  type: "transformation" | "cloze" | "qa" | "chart" | "pair_work" | "reading";
  instructions?: string;
  referenceTable?: {
    headers: string[];
    rows: string[][];
  };
  audioTrack?: string;
  items: BookPracticeItem[];
}

export interface BookLesson {
  lessonNumber: number;
  title: string;
  japaneseTitle?: string;
  subtitle?: string;
  vocabulary: BookVocabItem[];
  kanji: BookKanjiItem[];
  grammar: BookGrammarItem[];
  dialogues?: BookDialogueScene[];
  practice?: BookPracticeSection[];
  stats: {
    vocabularyCount: number;
    kanjiCount: number;
    grammarCount: number;
    dialogueCount?: number;
    practiceCount?: number;
  };
}

export interface BookDetail extends BookCatalogEntry {
  lessons: BookLesson[];
}

function canUseBrowserFetch(): boolean {
  if (typeof globalThis.fetch === "function" && ("mock" in globalThis.fetch || "_isMockFunction" in globalThis.fetch)) {
    return true;
  }
  if (typeof process !== "undefined" && process.env?.VITEST) return false;
  return typeof window !== "undefined" && typeof globalThis.fetch === "function";
}

async function fetchOrReadJson(relativeUrl: string, relativePath: string): Promise<unknown> {
  if (canUseBrowserFetch()) {
    const res = await globalThis.fetch(relativeUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${relativeUrl} (${res.status})`);
    return await res.json();
  }
  // Server-side / test environment fallback without bundling JSON into client JS
  const fs = eval("require")("node:fs");
  const path = eval("require")("node:path");
  const fullPath = path.resolve(process.cwd(), relativePath);
  const content = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(content);
}

// Memory caches
let cachedCatalog: BookCatalogEntry[] | null = null;
const cachedBooks = new Map<string, BookDetail>();

/**
 * Loads the books catalog overview (Genki I, Genki II, etc.)
 */
export async function getBooksCatalog(): Promise<BookCatalogEntry[]> {
  if (cachedCatalog) return cachedCatalog;
  try {
    const data = await fetchOrReadJson("/data/v1/books/index.json", "public/data/v1/books/index.json") as BookCatalogEntry[];
    cachedCatalog = data;
    return data;
  } catch (err) {
    console.error("Failed to load books catalog:", err);
    return [];
  }
}

/**
 * Loads the full detail for a given textbook (including all lessons, vocab, kanji, grammar)
 */
export async function getBookById(id: string): Promise<BookDetail | null> {
  if (cachedBooks.has(id)) return cachedBooks.get(id)!;
  try {
    const data = await fetchOrReadJson(`/data/v1/books/${id}.json`, `public/data/v1/books/${id}.json`) as BookDetail;
    if (data && data.id) {
      cachedBooks.set(id, data);
      return data;
    }
    return null;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code !== "ENOENT") {
      console.error(`Failed to load textbook ${id}:`, err);
    }
    return null;
  }
}

/**
 * Retrieves a single lesson from a textbook by book ID and lesson number
 */
export async function getBookLesson(bookId: string, lessonNumber: number): Promise<BookLesson | null> {
  const book = await getBookById(bookId);
  if (!book) return null;
  return book.lessons.find((l) => l.lessonNumber === lessonNumber) || null;
}

/**
 * Enqueues an entire textbook lesson (or selected aspects) into the FSRS active spaced repetition database.
 */
export async function enqueueLessonInSrs(
  lesson: BookLesson,
  level: string = "N5",
  options?: { vocab?: boolean; kanji?: boolean; grammar?: boolean }
) {
  const { enqueueLessonToSrs } = await import("@/lib/srs/service");
  return enqueueLessonToSrs({
    vocab:
      options?.vocab !== false
        ? lesson.vocabulary.map((v) => ({
            word: v.word,
            reading: v.readingKana,
            meaning: v.meaning,
          }))
        : [],
    kanji:
      options?.kanji !== false
        ? lesson.kanji.map((k) => ({
            kanji: k.kanji,
            meaning: k.meaning,
            reading: k.onyomi[0] || k.kunyomi[0],
          }))
        : [],
    grammar:
      options?.grammar !== false
        ? lesson.grammar.map((g) => ({
            id: g.linkedGrammarId || g.id,
            pattern: g.pattern,
            meaning: g.title,
          }))
        : [],
    level,
  });
}
