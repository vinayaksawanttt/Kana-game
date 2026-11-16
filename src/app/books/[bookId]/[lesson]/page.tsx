"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import {
  ArrowLeft,
  ArrowRight,
  Book,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  HelpCircle,
  Keyboard,
  Layers,
  MessageSquare,
  Mic,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Square,
  Volume2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  type BookDetail,
  type BookDialogueScene,
  type BookGrammarItem,
  type BookKanjiItem,
  type BookLesson,
  type BookPracticeItem,
  type BookPracticeSection,
  type BookVocabItem,
  enqueueLessonInSrs,
  getBookById,
  getBookLesson,
} from "@/data/books";
import { AudioButton } from "@/components/ui/AudioButton";
import { StrokePlayer } from "@/components/kanji/StrokePlayer";
import { DialogueRoleplayPlayer } from "@/components/books/DialogueRoleplayPlayer";
import { DialogueClozeTest } from "@/components/books/DialogueClozeTest";
import { StoryReaderLine } from "@/components/books/StoryReaderLine";
import { WorkbookDrillMode } from "@/components/books/WorkbookDrillMode";
import { CharacterDiffView } from "@/components/books/CharacterDiffView";
import { romajiToHiragana } from "@/engine/shiritori";
import { loadDictionaryDataMaps, type DictionaryDataMaps } from "@/data/dictionary";
import { upsertPracticeItems } from "@/lib/srs/service";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { loadVocabularyData, type VocabularyRecord } from "@/data/vocabulary";
import { createVocabularySession } from "@/lib/game/vocabulary";
import { createKanjiMeaningSession } from "@/engine/kanji-meaning";
import { createGrammarSession } from "@/engine/grammarSession";
import { loadGrammarData } from "@/data/grammar";

type ActiveTab = "vocab" | "grammar" | "kanji" | "dialogues" | "practice";

interface PatternChip {
  text: string;
  category: "topic" | "particle" | "verb" | "adj" | "conjugation" | "auxiliary" | "general";
  label?: string;
}

function parseGrammarPattern(pattern: string): PatternChip[] {
  const rawParts = pattern.split(/(\s*\+\s*|\s*・\s*|\s+)/).filter((p) => p.trim().length > 0 && p.trim() !== "+");

  return rawParts.map((raw): PatternChip => {
    const text = raw.trim();
    const clean = text.replace(/^[〜~]/, "");

    // Particle
    if (/^(は|が|を|に|で|へ|と|も|から|まで|より|の|か|ね|よ)$/.test(clean)) {
      return { text, category: "particle", label: "Particle" };
    }

    // Topic / Noun
    if (/^(X|Y|A|B|Noun|Topic|Subject|Person|Place|Time|Thing)/i.test(clean)) {
      return { text, category: "topic", label: "Topic / Noun" };
    }

    // Verb / Conjugation
    if (
      /verb|て形|て-form|た形|た-form|ない形|ない-form|辞書形|stem|plain|ます|ません|ました|てから|ている|てください|てはいけません|てもいい|たい/i.test(
        clean
      )
    ) {
      return { text, category: "conjugation", label: "Conjugation" };
    }

    // Adjective
    if (/adj|形容詞|い-adj|な-adj/i.test(clean)) {
      return { text, category: "adj", label: "Adjective" };
    }

    // Auxiliary / Copula / Ending
    if (/^(です|でした|じゃありません|でしょう|〜か|〜ね|〜よ|と思います|と言いました)/.test(clean)) {
      return { text, category: "auxiliary", label: "Ending" };
    }

    return { text, category: "general" };
  });
}

function getPatternChipClass(category: PatternChip["category"]): string {
  switch (category) {
    case "particle":
      return "border-amber-400/50 bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "topic":
      return "border-blue-400/50 bg-blue-500/15 text-blue-700 dark:text-blue-300";
    case "conjugation":
      return "border-emerald-400/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "adj":
      return "border-purple-400/50 bg-purple-500/15 text-purple-700 dark:text-purple-300";
    case "auxiliary":
      return "border-rose-400/50 bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]";
  }
}

export default function BookLessonPage() {
  const router = useRouter();
  const params = useParams<{ bookId: string; lesson: string }>();
  const bookId = params?.bookId || "genki-1";
  const lessonNumber = parseInt(params?.lesson || "1", 10);

  const [book, setBook] = useState<BookDetail | null>(null);
  const [lesson, setLesson] = useState<BookLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("vocab");
  const [showEnglishDialogues, setShowEnglishDialogues] = useState(true);
  const [activeRoleplaySceneId, setActiveRoleplaySceneId] = useState<string | null>(null);
  const [showDialogueCloze, setShowDialogueCloze] = useState(false);
  const [tapLookupEnabled, setTapLookupEnabled] = useState(true);
  const [dictMaps, setDictMaps] = useState<DictionaryDataMaps | null>(null);
  const [kuromojiLineMap, setKuromojiLineMap] = useState<
    Record<
      string,
      Array<{
        surface_form: string;
        basic_form?: string;
        reading?: string;
        pos?: string;
      }>
    >
  >({});

  // Filter & Search states
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabTypeFilter, setVocabTypeFilter] = useState<string>("all");
  const [grammarSearch, setGrammarSearch] = useState("");
  const [kanjiSearch, setKanjiSearch] = useState("");
  const [practiceSearch, setPracticeSearch] = useState("");
  const [selectedPracticePart, setSelectedPracticePart] = useState<string>("all");

  // Vocab Study Mode & Flip-Card states
  const [vocabStudyMode, setVocabStudyMode] = useState<"show-all" | "hide-en" | "hide-kana">("show-all");
  const [revealedVocabEn, setRevealedVocabEn] = useState<Record<string, boolean>>({});
  const [revealedVocabKana, setRevealedVocabKana] = useState<Record<string, boolean>>({});
  const [vocabViewMode, setVocabViewMode] = useState<"list" | "flip">("list");
  const [flippedVocabCards, setFlippedVocabCards] = useState<Record<string, boolean>>({});

  // Kanji Stroke Order Modal state
  const [selectedStrokeKanji, setSelectedStrokeKanji] = useState<BookKanjiItem | null>(null);

  // Audio hook for continuous dialogue playback
  const { playSentenceAsync, stopAudio } = useJapaneseAudio();

  // Grammar Self-Check states
  const [selfCheckOpen, setSelfCheckOpen] = useState<Record<string, boolean>>({});
  const [selfCheckRevealed, setSelfCheckRevealed] = useState<Record<string, boolean>>({});
  const [selfCheckFeedback, setSelfCheckFeedback] = useState<Record<string, "got-it" | "review">>({});

  // Continuous Dialogue Scene Audio states
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [playingLineIndex, setPlayingLineIndex] = useState<number>(-1);
  const scenePlaybackAbortRef = useRef<boolean>(false);

  // Stop continuous audio on unmount or tab switch
  useEffect(() => {
    return () => {
      scenePlaybackAbortRef.current = true;
      stopAudio();
    };
  }, [stopAudio]);

  const togglePlayFullScene = async (scene: BookDialogueScene) => {
    if (playingSceneId === scene.id) {
      scenePlaybackAbortRef.current = true;
      stopAudio();
      setPlayingSceneId(null);
      setPlayingLineIndex(-1);
      return;
    }

    scenePlaybackAbortRef.current = false;
    setPlayingSceneId(scene.id);

    for (let i = 0; i < scene.lines.length; i++) {
      if (scenePlaybackAbortRef.current) break;
      setPlayingLineIndex(i);
      try {
        await playSentenceAsync(scene.lines[i].ja, { audioSrc: scene.lines[i].audioSrc });
      } catch {
        // Continue to next line gracefully
      }
      if (scenePlaybackAbortRef.current) break;
      await new Promise((r) => setTimeout(r, 450));
    }

    setPlayingSceneId(null);
    setPlayingLineIndex(-1);
  };

  // Practice drill interaction states
  const [revealedPracticeAnswers, setRevealedPracticeAnswers] = useState<Record<string, boolean>>({});
  const [userPracticeInputs, setUserPracticeInputs] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, "correct" | "incorrect">>({});
  const [showAllPracticeAnswers, setShowAllPracticeAnswers] = useState(false);
  const [workbookDrillMode, setWorkbookDrillMode] = useState(false);
  const [autoEnqueueMissed, setAutoEnqueueMissed] = useState(true);
  const [missedEnqueuedIds, setMissedEnqueuedIds] = useState<Record<string, boolean>>({});
  const [practiceRomajiIme, setPracticeRomajiIme] = useState(true);
  const [practiceMissedOnly, setPracticeMissedOnly] = useState(false);

  // Practice & SRS interaction states
  const [launchingPractice, setLaunchingPractice] = useState<string | null>(null);
  const [enqueuingSrs, setEnqueuingSrs] = useState(false);
  const [srsSuccessMessage, setSrsSuccessMessage] = useState<string | null>(null);

  // Load Book and Lesson data
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([getBookById(bookId), getBookLesson(bookId, lessonNumber)])
      .then(([bookData, lessonData]) => {
        if (!mounted) return;
        setBook(bookData);
        setLesson(lessonData);
        setLoading(false);

        if (bookData && lessonData && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              "kanagame_last_studied_book",
              JSON.stringify({
                bookId,
                lessonNumber,
                bookTitle: bookData.title.split(":")[0].trim(),
                lessonTitle: lessonData.title,
                japaneseTitle: lessonData.japaneseTitle || "",
                coverImage: bookData.coverImage,
                updatedAt: Date.now(),
              })
            );
          } catch {
            // LocalStorage quota or access error handled gracefully
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load lesson:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [bookId, lessonNumber]);

  // Keyboard navigation shortcuts: 1-5 to switch tabs, Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape" && selectedStrokeKanji) {
        setSelectedStrokeKanji(null);
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        setActiveTab("vocab");
      } else if (e.key === "2") {
        e.preventDefault();
        setActiveTab("grammar");
      } else if (e.key === "3") {
        e.preventDefault();
        setActiveTab("kanji");
      } else if (e.key === "4" && lesson?.dialogues && lesson.dialogues.length > 0) {
        e.preventDefault();
        setActiveTab("dialogues");
      } else if (e.key === "5" && lesson?.practice && lesson.practice.length > 0) {
        e.preventDefault();
        setActiveTab("practice");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lesson, selectedStrokeKanji]);

  // Load Dictionary & Tokenize Dialogues for Tap-to-Lookup Story Reader
  useEffect(() => {
    if (activeTab !== "dialogues" || !lesson?.dialogues?.length) return;
    let mounted = true;

    loadDictionaryDataMaps()
      .then((maps) => {
        if (mounted) setDictMaps(maps);
      })
      .catch(() => {
        // Fallback to lesson vocab/kanji if dictionary fails to load
      });

    if (typeof window !== "undefined" && !process.env?.VITEST) {
      import("@/engine/analyzer")
        .then(({ KuromojiService }) => KuromojiService.getTokenizer())
        .then((tokenizer) => {
          if (!mounted || !lesson.dialogues) return;
          const nextMap: Record<
            string,
            Array<{
              surface_form: string;
              basic_form?: string;
              reading?: string;
              pos?: string;
            }>
          > = {};
          for (const scene of lesson.dialogues) {
            for (const line of scene.lines) {
              if (!nextMap[line.ja]) {
                nextMap[line.ja] = tokenizer.tokenize(line.ja);
              }
            }
          }
          setKuromojiLineMap(nextMap);
        })
        .catch(() => {
          // Fallback segmentation handles tokenization seamlessly
        });
    }

    return () => {
      mounted = false;
    };
  }, [activeTab, lesson]);

  // Vocabulary filtering
  const filteredVocab = useMemo(() => {
    if (!lesson) return [];
    return lesson.vocabulary.filter((v) => {
      // Type filter
      if (vocabTypeFilter !== "all") {
        if (vocabTypeFilter === "verb" && !v.type.includes("v")) return false;
        if (vocabTypeFilter === "noun" && v.type !== "n") return false;
        if (vocabTypeFilter === "adj" && !v.type.includes("adj")) return false;
        if (vocabTypeFilter === "expr" && v.type !== "expr" && v.type !== "adv") return false;
      }

      // Search query
      const q = vocabSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        v.word.toLowerCase().includes(q) ||
        v.reading.toLowerCase().includes(q) ||
        v.readingKana.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
      );
    });
  }, [lesson, vocabSearch, vocabTypeFilter]);

  // Grammar filtering
  const filteredGrammar = useMemo(() => {
    if (!lesson) return [];
    const q = grammarSearch.trim().toLowerCase();
    if (!q) return lesson.grammar;
    return lesson.grammar.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.pattern.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q) ||
        g.examples.some((eg) => eg.ja.toLowerCase().includes(q) || (eg.en || "").toLowerCase().includes(q))
    );
  }, [lesson, grammarSearch]);

  // Kanji filtering
  const filteredKanji = useMemo(() => {
    if (!lesson) return [];
    const q = kanjiSearch.trim().toLowerCase();
    if (!q) return lesson.kanji;
    return lesson.kanji.filter(
      (k) =>
        k.kanji.includes(q) ||
        k.meaning.toLowerCase().includes(q) ||
        k.onyomi.some((o) => o.includes(q)) ||
        k.kunyomi.some((ku) => ku.includes(q))
    );
  }, [lesson, kanjiSearch]);

  // Practice filtering
  const filteredPractice = useMemo(() => {
    if (!lesson?.practice) return [];
    return lesson.practice
      .map((sec) => {
        let items = sec.items;
        if (practiceMissedOnly) {
          items = items.filter((it) => practiceFeedback[it.id] === "incorrect");
        }
        if (practiceSearch.trim()) {
          const q = practiceSearch.toLowerCase();
          const matchesSecTitle =
            sec.title.toLowerCase().includes(q) ||
            (sec.subTitle && sec.subTitle.toLowerCase().includes(q));
          if (!matchesSecTitle) {
            items = items.filter(
              (it) =>
                it.prompt.toLowerCase().includes(q) ||
                it.answer.toLowerCase().includes(q)
            );
          }
        }
        return { ...sec, items };
      })
      .filter((sec) => {
        const matchesPart = selectedPracticePart === "all" || sec.part === selectedPracticePart;
        return matchesPart && sec.items.length > 0;
      });
  }, [lesson, selectedPracticePart, practiceSearch, practiceMissedOnly, practiceFeedback]);

  const practiceParts = useMemo(() => {
    if (!lesson?.practice) return [];
    const parts = new Set<string>();
    for (const sec of lesson.practice) {
      parts.add(sec.part);
    }
    return Array.from(parts);
  }, [lesson]);

  async function enqueueMissedPracticeItem(
    item: BookPracticeItem,
    section: BookPracticeSection
  ) {
    if (!book) return;
    try {
      await upsertPracticeItems([
        {
          id: `grammar:practice-${item.id}`,
          type: "grammar",
          level: book.level,
          prompt: item.cue ? `${item.prompt} (${item.cue})` : item.prompt,
          answer: item.answer,
          reading: section.title,
          missed: true,
        },
      ]);
      setMissedEnqueuedIds((prev) => ({ ...prev, [item.id]: true }));
    } catch (err) {
      console.error("Failed to enqueue missed practice item:", err);
    }
  }

  function checkPracticeAnswer(
    item: BookPracticeItem,
    section: BookPracticeSection
  ) {
    const rawInput = userPracticeInputs[item.id] || "";
    const input = practiceRomajiIme ? romajiToHiragana(rawInput, true) : rawInput;
    if (input !== rawInput) {
      setUserPracticeInputs((prev) => ({ ...prev, [item.id]: input }));
    }
    if (!input.trim()) return;

    const normalize = (s: string) =>
      s
        .replace(/[。、\s\t\n・！？!?()（）~〜]/g, "")
        .toLowerCase()
        .trim();

    const isMatch =
      normalize(input) === normalize(item.answer) ||
      item.answer.split(/[／/]/).some((alt) => normalize(input) === normalize(alt));

    setPracticeFeedback((prev) => ({
      ...prev,
      [item.id]: isMatch ? "correct" : "incorrect",
    }));

    if (isMatch) {
      playGameSfx("correct-chime");
    } else {
      playGameSfx("incorrect-chime");
      if (autoEnqueueMissed && !missedEnqueuedIds[item.id]) {
        void enqueueMissedPracticeItem(item, section);
      }
    }
  }

  function togglePracticeAnswer(itemId: string) {
    setRevealedPracticeAnswers((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  // Previous & Next Lesson navigation
  const prevLessonNumber = lessonNumber > 1 ? lessonNumber - 1 : null;
  const nextLessonNumber =
    book && lessonNumber < book.totalLessons + (book.lessonRange[0] - 1)
      ? lessonNumber + 1
      : null;

  // --- Practice Drill Handlers ---
  async function handlePracticeVocab() {
    if (!lesson || !book || lesson.vocabulary.length === 0) return;
    setLaunchingPractice("vocab");
    try {
      const data = await loadVocabularyData([book.level]);
      const lessonWords = new Set(lesson.vocabulary.map((v) => v.word.trim()));
      const matchingRecords = data.records.filter((r) => lessonWords.has(r.word.trim()));

      // Augment any lesson words not already present in the dictionary
      const recordIds = new Set(data.records.map((r) => r.id));
      for (const v of lesson.vocabulary) {
        if (!matchingRecords.some((r) => r.word === v.word)) {
          const customRecord: VocabularyRecord = {
            id: v.linkedVocabId || v.id,
            word: v.word,
            reading: v.readingKana,
            romaji: v.reading,
            meanings: [v.meaning],
            level: book.level,
            pos: [v.type],
            examples: [],
          };
          if (!recordIds.has(customRecord.id)) {
            data.records.push(customRecord);
            recordIds.add(customRecord.id);
          }
          matchingRecords.push(customRecord);
        }
      }

      const questionIds = matchingRecords.map((r) => r.id);
      const session = createVocabularySession(
        {
          levels: [book.level],
          grades: [],
          size: Math.min(20, questionIds.length) as any,
          ids: questionIds,
        },
        data
      );
      saveGameSession("vocabulary", session.sessionId, session);
      playGameSfx("temple-bell-gong");
      router.push(`/games/vocabulary/play/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start vocab practice:", err);
      setLaunchingPractice(null);
    }
  }

  async function handlePracticeKanji() {
    if (!lesson || !book || lesson.kanji.length === 0) return;
    setLaunchingPractice("kanji");
    try {
      const kanjiLevelNum = Number(book.level.replace("N", "")) || 5;
      const session = await createKanjiMeaningSession({
        levels: [kanjiLevelNum],
        grades: [1, 2, 3, 4, 5, 6, 8, 9],
        size: lesson.kanji.length,
        kanjiIds: lesson.kanji.map((k) => k.kanji),
      });
      saveGameSession("kanji", session.sessionId, session);
      playGameSfx("temple-bell-gong");
      router.push(`/games/kanji/meaning/play/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start kanji practice:", err);
      setLaunchingPractice(null);
    }
  }

  async function handlePracticeGrammar() {
    if (!lesson || !book || lesson.grammar.length === 0) return;
    setLaunchingPractice("grammar");
    try {
      const allPoints = await loadGrammarData([book.level]);
      const grammarIds = lesson.grammar
        .map((g) => g.linkedGrammarId || g.id)
        .filter(Boolean);

      const matchedPoints = allPoints.filter(
        (p) => grammarIds.includes(p.id) || grammarIds.includes(p.slug)
      );

      const session = await createGrammarSession({
        levels: [book.level],
        size: Math.min(10, lesson.grammar.length),
        grammarIds: matchedPoints.length > 0 ? matchedPoints.map((p) => p.id) : undefined,
        points: allPoints,
      });
      saveGameSession("grammar", session.sessionId, session);
      playGameSfx("temple-bell-gong");
      router.push(`/games/grammar/play/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start grammar practice:", err);
      setLaunchingPractice(null);
    }
  }

  // --- FSRS Enqueue Handler ---
  async function handleEnqueue(scope: "all" | "vocab" | "kanji" | "grammar") {
    if (!lesson || !book) return;
    setEnqueuingSrs(true);
    try {
      const result = await enqueueLessonInSrs(lesson, book.level, {
        vocab: scope === "all" || scope === "vocab",
        kanji: scope === "all" || scope === "kanji",
        grammar: scope === "all" || scope === "grammar",
      });
      playGameSfx("correct-chime");
      const label =
        scope === "all"
          ? `All ${result.total} lesson items`
          : scope === "vocab"
          ? `${result.vocabCount} vocabulary words`
          : scope === "kanji"
          ? `${result.kanjiCount} kanji characters`
          : `${result.grammarCount} grammar points`;

      setSrsSuccessMessage(`Enqueued ${label} into FSRS reviews!`);
      setTimeout(() => setSrsSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to enqueue in FSRS:", err);
    } finally {
      setEnqueuingSrs(false);
    }
  }

  if (loading) {
    return (
      <GameLayout label="TEXTBOOKS" glyph="本" homeHref="/books">
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <SakuraLoader label={`Loading Lesson ${lessonNumber}...`} />
        </div>
      </GameLayout>
    );
  }

  if (!lesson || !book) {
    return (
      <GameLayout label="TEXTBOOKS" glyph="本" homeHref="/books">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold">Lesson not found</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We could not find Lesson {lessonNumber} in {bookId}.
          </p>
          <Link
            href="/books"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white shadow-xs"
          >
            <ArrowLeft size={16} />
            <span>Return to Shelf</span>
          </Link>
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout label="TEXTBOOKS" glyph="本" homeHref="/books">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Navigation Breadcrumbs & Prev/Next Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Link
              href="/books"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[var(--muted)] hover:bg-[var(--sakura-light)]/40 hover:text-[var(--primary-fg)] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>All Books</span>
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)] font-bold">{book.title.split(":")[0]}</span>
            <span>/</span>
            <span className="text-[var(--primary-fg)] font-bold">Lesson {lesson.lessonNumber}</span>
          </div>

          {/* Prev / Next Switcher */}
          <div className="flex items-center gap-2">
            {prevLessonNumber && (
              <Link
                href={`/books/${bookId}/${prevLessonNumber}`}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] shadow-2xs transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Lesson {prevLessonNumber}</span>
              </Link>
            )}
            {nextLessonNumber && (
              <Link
                href={`/books/${bookId}/${nextLessonNumber}`}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] shadow-2xs transition-colors"
              >
                <span>Lesson {nextLessonNumber}</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* FSRS Toast Notification */}
        {srsSuccessMessage && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[var(--correct)]/40 bg-[var(--correct)]/15 p-4 text-xs font-bold text-[var(--correct)] shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <Check size={16} className="shrink-0" />
              <span>{srsSuccessMessage}</span>
            </div>
            <Link
              href="/review"
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] border border-[var(--line)] shadow-2xs hover:border-[var(--primary)] transition-colors"
            >
              <span>Open Review Hub</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Lesson Header Banner */}
        <header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--sakura)]/50 bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--sakura-light)]/40 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[var(--primary)] px-2.5 py-1 text-xs font-black text-white shadow-xs">
                  LESSON {lesson.lessonNumber}
                </span>
                {lesson.japaneseTitle && (
                  <span className="font-japanese text-sm font-bold text-[var(--muted)]">
                    {lesson.japaneseTitle}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
                {lesson.title}
              </h1>
              {lesson.subtitle && (
                <p className="text-sm font-medium text-[var(--muted)] max-w-2xl">
                  {lesson.subtitle}
                </p>
              )}
            </div>

            {/* Master Action: Enqueue Entire Lesson in FSRS */}
            <div className="flex flex-col gap-2 shrink-0 sm:items-end">
              <button
                onClick={() => handleEnqueue("all")}
                disabled={enqueuingSrs}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                <Zap size={16} />
                <span>Enqueue Lesson in FSRS</span>
              </button>
              <span className="text-[11px] font-medium text-[var(--muted)] text-center sm:text-right">
                Adds all {lesson.stats.vocabularyCount} vocab, {lesson.stats.kanjiCount} kanji & {lesson.stats.grammarCount} grammar
              </span>
            </div>
          </div>
        </header>

        {/* Sticky Content Tabs Navigation with Keyboard Shortcut Hints */}
        <div className="sticky top-0 z-30 mb-6 -mx-4 px-4 sm:-mx-8 sm:px-8 py-2.5 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)] shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("vocab")}
              role="button"
              aria-label="単語 Vocabulary"
              aria-pressed={activeTab === "vocab"}
              className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "vocab"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
              }`}
            >
              <span>単語 Vocabulary</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "vocab"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                }`}
              >
                {lesson.stats.vocabularyCount}
              </span>
              <kbd
                className={`hidden md:inline-block rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  activeTab === "vocab"
                    ? "bg-white/25 text-white border border-white/30"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                }`}
                title="Press 1 to switch to Vocabulary"
              >
                1
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab("grammar")}
              role="button"
              aria-label="文法 Grammar"
              aria-pressed={activeTab === "grammar"}
              className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "grammar"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
              }`}
            >
              <span>文法 Grammar</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "grammar"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                }`}
              >
                {lesson.stats.grammarCount}
              </span>
              <kbd
                className={`hidden md:inline-block rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  activeTab === "grammar"
                    ? "bg-white/25 text-white border border-white/30"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                }`}
                title="Press 2 to switch to Grammar"
              >
                2
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab("kanji")}
              role="button"
              aria-label="漢字 Kanji"
              aria-pressed={activeTab === "kanji"}
              className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "kanji"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
              }`}
            >
              <span>漢字 Kanji</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "kanji"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                }`}
              >
                {lesson.stats.kanjiCount}
              </span>
              <kbd
                className={`hidden md:inline-block rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                  activeTab === "kanji"
                    ? "bg-white/25 text-white border border-white/30"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                }`}
                title="Press 3 to switch to Kanji"
              >
                3
              </kbd>
            </button>

            {lesson.dialogues && lesson.dialogues.length > 0 && (
              <button
                onClick={() => setActiveTab("dialogues")}
                role="button"
                aria-label="会話 Dialogues"
                aria-pressed={activeTab === "dialogues"}
                className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "dialogues"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
                }`}
              >
                <span>会話 Dialogues</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === "dialogues"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                  }`}
                >
                  {lesson.dialogues.length}
                </span>
                <kbd
                  className={`hidden md:inline-block rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    activeTab === "dialogues"
                      ? "bg-white/25 text-white border border-white/30"
                      : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                  }`}
                  title="Press 4 to switch to Dialogues"
                >
                  4
                </kbd>
              </button>
            )}

            {lesson.practice && lesson.practice.length > 0 && (
              <button
                onClick={() => setActiveTab("practice")}
                role="button"
                aria-label="練習 Practice"
                aria-pressed={activeTab === "practice"}
                className={`relative shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "practice"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
                }`}
              >
                <span>練習 Practice</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === "practice"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                  }`}
                >
                  {lesson.stats.practiceCount || lesson.practice.reduce((acc, s) => acc + s.items.length, 0)}
                </span>
                <kbd
                  className={`hidden md:inline-block rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                    activeTab === "practice"
                      ? "bg-white/25 text-white border border-white/30"
                      : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]"
                  }`}
                  title="Press 5 to switch to Practice"
                >
                  5
                </kbd>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: VOCABULARY */}
        {activeTab === "vocab" && (
          <section aria-label="Vocabulary section" className="space-y-5">
            {/* Action Bar: Practice Vocab & Enqueue Vocab */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePracticeVocab}
                  disabled={launchingPractice === "vocab"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Practice Lesson Vocabulary</span>
                </button>
                <button
                  onClick={() => handleEnqueue("vocab")}
                  disabled={enqueuingSrs}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition-colors disabled:opacity-50"
                >
                  <Zap size={13} />
                  <span>Enqueue Vocab in FSRS</span>
                </button>
              </div>

              {/* Filter by Type */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { key: "all", label: "All" },
                  { key: "noun", label: "Nouns" },
                  { key: "verb", label: "Verbs" },
                  { key: "adj", label: "Adjectives" },
                  { key: "expr", label: "Expressions" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setVocabTypeFilter(f.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      vocabTypeFilter === f.key
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, Study Mode, and View Mode Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="Search word or meaning..."
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-10 pr-9 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-xs focus:border-[var(--primary)] focus:outline-hidden"
                />
                {vocabSearch && (
                  <button
                    onClick={() => setVocabSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    aria-label="Clear vocab search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Study Mode & View Mode Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Study Mode Toggles */}
                <div className="flex items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-2xs">
                  <button
                    onClick={() => setVocabStudyMode("show-all")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      vocabStudyMode === "show-all"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Show all vocabulary details"
                  >
                    <Eye size={13} />
                    <span>Show All</span>
                  </button>
                  <button
                    onClick={() => {
                      setVocabStudyMode("hide-en");
                      setRevealedVocabEn({});
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      vocabStudyMode === "hide-en"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Hide English meanings to practice recall"
                  >
                    <EyeOff size={13} />
                    <span>Hide English</span>
                  </button>
                  <button
                    onClick={() => {
                      setVocabStudyMode("hide-kana");
                      setRevealedVocabKana({});
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      vocabStudyMode === "hide-kana"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Hide Kana readings to practice reading Kanji"
                  >
                    <EyeOff size={13} />
                    <span>Hide Kana</span>
                  </button>
                </div>

                {/* View Mode Toggle: List vs Flip-Card */}
                <div className="flex items-center gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-2xs">
                  <button
                    onClick={() => setVocabViewMode("list")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      vocabViewMode === "list"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="List View"
                  >
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setVocabViewMode("flip")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      vocabViewMode === "flip"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    title="Flip-Card Flashcards View"
                  >
                    <RotateCw size={13} />
                    <span>Flip-Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vocab Content: Flip-Card View OR List View */}
            {filteredVocab.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                No vocabulary matches your search.
              </div>
            ) : vocabViewMode === "flip" ? (
              /* FLIP-CARD FLASHCARD VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[var(--muted)] font-semibold">
                  <span>Showing {filteredVocab.length} Flashcards (Tap any card to flip)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allFlipped: Record<string, boolean> = {};
                        filteredVocab.forEach((v) => (allFlipped[v.id] = true));
                        setFlippedVocabCards(allFlipped);
                      }}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 hover:text-[var(--ink)] transition-colors cursor-pointer"
                    >
                      Flip All
                    </button>
                    <button
                      onClick={() => setFlippedVocabCards({})}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 hover:text-[var(--ink)] transition-colors cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredVocab.map((v) => {
                    const isFlipped = Boolean(flippedVocabCards[v.id]);
                    const isKanaRevealed = Boolean(revealedVocabKana[v.id]);

                    return (
                      <div
                        key={v.id}
                        onClick={() =>
                          setFlippedVocabCards((prev) => ({
                            ...prev,
                            [v.id]: !prev[v.id],
                          }))
                        }
                        className={`group relative min-h-[190px] rounded-3xl border p-5 shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                          isFlipped
                            ? "border-[var(--primary)] bg-gradient-to-br from-[var(--surface)] to-[var(--sakura-light)]/40 shadow-md ring-2 ring-[var(--primary)]/30"
                            : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)] hover:shadow-md"
                        }`}
                      >
                        {!isFlipped ? (
                          /* FRONT OF FLASHCARD */
                          <>
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] uppercase">
                                  {v.type}
                                </span>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                >
                                  <AudioButton
                                    text={v.word}
                                    reading={v.readingKana}
                                    mode="vocab"
                                    size="sm"
                                    label={`Listen to ${v.word}`}
                                  />
                                </div>
                              </div>

                              <div className="mt-3 text-center space-y-1">
                                <h3 className="font-japanese text-3xl font-black text-[var(--ink)] group-hover:text-[var(--primary-fg)] transition-colors">
                                  {v.word}
                                </h3>
                                <div>
                                  {vocabStudyMode === "hide-kana" && !isKanaRevealed && v.readingKana !== v.word ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRevealedVocabKana((prev) => ({ ...prev, [v.id]: true }));
                                      }}
                                      className="inline-flex items-center gap-1 rounded bg-[var(--line)]/50 px-2 py-0.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                                    >
                                      <Eye size={11} />
                                      <span>Reveal Kana</span>
                                    </button>
                                  ) : (
                                    <p className="font-japanese text-sm font-semibold text-[var(--primary-fg)]">
                                      {v.readingKana !== v.word ? v.readingKana : v.reading}
                                    </p>
                                  )}
                                  <p className="font-mono text-xs text-[var(--muted)] opacity-75">
                                    {v.reading}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-bold text-[var(--muted)]">
                              <span className="flex items-center gap-1 group-hover:text-[var(--primary-fg)] transition-colors">
                                <RotateCw size={12} className="transition-transform group-hover:rotate-180 duration-300" />
                                <span>Tap to see English</span>
                              </span>
                              <span>Front</span>
                            </div>
                          </>
                        ) : (
                          /* BACK OF FLASHCARD */
                          <>
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="rounded-md bg-[var(--primary)] text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                                  {v.type}
                                </span>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0"
                                >
                                  <AudioButton
                                    text={v.word}
                                    reading={v.readingKana}
                                    mode="vocab"
                                    size="sm"
                                    label={`Listen to ${v.word}`}
                                  />
                                </div>
                              </div>

                              <div className="mt-3 text-center space-y-1.5">
                                <h3 className="text-xl font-black text-[var(--ink)] leading-snug">
                                  {v.meaning}
                                </h3>
                                <p className="font-japanese text-sm font-bold text-[var(--primary-fg)]">
                                  {v.word} {v.readingKana !== v.word ? `(${v.readingKana})` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-bold text-[var(--primary-fg)]">
                              <span className="flex items-center gap-1">
                                <RotateCw size={12} />
                                <span>Tap to flip back</span>
                              </span>
                              <span className="text-[var(--muted)]">Back</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* LIST VIEW WITH STUDY MODE */
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVocab.map((v) => {
                  const isEnRevealed = Boolean(revealedVocabEn[v.id]);
                  const isKanaRevealed = Boolean(revealedVocabKana[v.id]);

                  return (
                    <div
                      key={v.id}
                      className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xs hover:border-[var(--primary)]/40 transition-colors"
                    >
                      <div>
                        {/* Top row: Japanese Word, Audio Button, and Type Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="font-japanese text-lg font-bold text-[var(--ink)]">
                              {v.word}
                            </span>
                            <div className="text-xs font-medium text-[var(--muted)] flex items-center gap-1.5 flex-wrap">
                              {v.readingKana !== v.word && (
                                vocabStudyMode === "hide-kana" && !isKanaRevealed ? (
                                  <button
                                    onClick={() =>
                                      setRevealedVocabKana((prev) => ({
                                        ...prev,
                                        [v.id]: true,
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 rounded bg-[var(--line)]/50 px-1.5 py-0.2 text-[10px] font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                                    title="Click to reveal kana reading"
                                  >
                                    <Eye size={10} />
                                    <span>reveal kana</span>
                                  </button>
                                ) : (
                                  <span className="font-japanese font-semibold text-[var(--primary-fg)]">
                                    {v.readingKana}
                                  </span>
                                )
                              )}
                              <span className="font-mono text-[11px] opacity-75">{v.reading}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <AudioButton
                              text={v.word}
                              reading={v.readingKana}
                              mode="vocab"
                              size="sm"
                              label={`Listen to ${v.word}`}
                            />
                            <span className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] uppercase">
                              {v.type}
                            </span>
                          </div>
                        </div>

                        {/* English Meaning or Study Mode Hidden State */}
                        <div className="mt-2.5">
                          {vocabStudyMode === "hide-en" && !isEnRevealed ? (
                            <button
                              onClick={() =>
                                setRevealedVocabEn((prev) => ({
                                  ...prev,
                                  [v.id]: true,
                                }))
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--sakura)] bg-[var(--sakura-light)]/50 px-2.5 py-1 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--sakura-light)] transition-all cursor-pointer"
                              title="Click to reveal English meaning"
                            >
                              <Eye size={12} />
                              <span>Tap to reveal meaning</span>
                            </button>
                          ) : (
                            <p className="text-sm font-semibold text-[var(--ink)] leading-snug">
                              {v.meaning}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Linked JLPT tag if matched */}
                      {v.linkedVocabId && (
                        <div className="mt-3 pt-2 border-t border-[var(--line)]/60 flex items-center justify-between text-[11px]">
                          <span className="text-[var(--muted)]">JLPT Reference</span>
                          <span className="rounded-md bg-[var(--sakura-light)] px-1.5 py-0.5 font-bold text-[var(--primary-fg)]">
                            {book.level}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        

        {/* TAB 2: GRAMMAR */}
        {activeTab === "grammar" && (
          <section aria-label="Grammar patterns section" className="space-y-6">
            {/* Action Bar: Practice Grammar & Enqueue Grammar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePracticeGrammar}
                  disabled={launchingPractice === "grammar"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Practice Lesson Grammar Drill</span>
                </button>
                <button
                  onClick={() => handleEnqueue("grammar")}
                  disabled={enqueuingSrs}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition-colors disabled:opacity-50"
                >
                  <Zap size={13} />
                  <span>Enqueue Grammar in FSRS</span>
                </button>
              </div>

              {/* Search filter for grammar */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                  placeholder="Search grammar patterns or rules..."
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-2 pl-10 pr-9 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-xs focus:border-[var(--primary)] focus:outline-hidden"
                />
                {grammarSearch && (
                  <button
                    onClick={() => setGrammarSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Grammar Points Cards */}
            {filteredGrammar.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                No grammar points match your query.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGrammar.map((pt) => (
                  <article
                    key={pt.id}
                    className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xs transition-colors hover:border-[var(--primary)]/30"
                  >
                    {/* Header: Number, Pattern Title, and JLPT Link Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-xl bg-[var(--primary)] text-xs font-black text-white shadow-xs">
                          #{pt.index}
                        </span>
                        <div>
                          <h2 className="text-lg font-bold text-[var(--ink)]">
                            {pt.title}
                          </h2>
                          <span className="font-japanese text-xs font-semibold text-[var(--primary-fg)]">
                            {pt.pattern}
                          </span>
                        </div>
                      </div>

                      {/* Linked JLPT Grammar Point link */}
                      {pt.linkedGrammarId && (
                        <Link
                          href={`/grammar/${pt.linkedGrammarId.split("/")[0]}/${pt.linkedGrammarId.split("/")[1]}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--sakura)]/25 transition-colors"
                        >
                          <BookOpen size={13} />
                          <span>View in Grammar Library</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>

                    {/* Color-Coded Pattern Anatomy Breakdown Chips */}
                    {pt.pattern && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)] mr-1">
                          Pattern Anatomy:
                        </span>
                        {parseGrammarPattern(pt.pattern).map((chip, chipIdx, arr) => (
                          <div key={chipIdx} className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs shadow-2xs ${getPatternChipClass(chip.category)}`}
                            >
                              <span className="font-japanese font-bold">{chip.text}</span>
                              {chip.label && (
                                <span className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.2 text-[9px] font-black uppercase tracking-wider opacity-80">
                                  {chip.label}
                                </span>
                              )}
                            </span>
                            {chipIdx < arr.length - 1 && (
                              <span className="text-[var(--muted)] text-xs font-black opacity-50">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    {pt.explanation && (
                      <div className="mt-4 text-sm leading-relaxed text-[var(--ink)] whitespace-pre-line">
                        {pt.explanation}
                      </div>
                    )}

                    {/* Bullet Points */}
                    {pt.bulletPoints.length > 0 && (
                      <ul className="mt-4 space-y-2 border-l-2 border-[var(--sakura)] pl-4">
                        {pt.bulletPoints.map((bp, i) => (
                          <li key={i} className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                            {bp}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Example Sentences & Active Recall Self-Check */}
                    {pt.examples.length > 0 && (
                      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                            <Sparkles size={13} className="text-[var(--primary-fg)]" />
                            <span>Example Sentences & Active Recall</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-[var(--muted)]">
                            {pt.examples.length} examples
                          </span>
                        </div>

                        <div className="space-y-3">
                          {pt.examples.map((eg, idx) => {
                            const checkKey = `${pt.id}-${idx}`;
                            const isOpen = Boolean(selfCheckOpen[checkKey]);
                            const isRevealed = Boolean(selfCheckRevealed[checkKey]);
                            const feedback = selfCheckFeedback[checkKey];

                            return (
                              <div
                                key={idx}
                                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-2xs space-y-2.5 transition-all"
                              >
                                {!isOpen ? (
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <span className="font-japanese text-sm sm:text-base font-bold text-[var(--ink)]">
                                        {eg.ja}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <AudioButton
                                          text={eg.ja}
                                          mode="sentence"
                                          size="sm"
                                          id={eg.audioSrc}
                                          label={`Pronounce: ${eg.ja}`}
                                        />
                                        <button
                                          onClick={() =>
                                            setSelfCheckOpen((prev) => ({
                                              ...prev,
                                              [checkKey]: true,
                                            }))
                                          }
                                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-[11px] font-bold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                                          title="Test active recall of this sentence"
                                        >
                                          <HelpCircle size={12} />
                                          <span>Quick Self-Check</span>
                                        </button>
                                      </div>
                                    </div>

                                    {eg.en && (
                                      <p className="mt-1 text-xs text-[var(--muted)] font-medium leading-relaxed">
                                        {eg.en}
                                      </p>
                                    )}

                                    {/* Active Production Directive / Recall Prompt */}
                                    {eg.promptEn && (
                                      <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-[var(--sakura)]/60 bg-[var(--sakura-light)]/50 p-2 text-xs font-semibold text-[var(--primary-fg)]">
                                        <Sparkles size={13} className="shrink-0 mt-0.5" />
                                        <span>{eg.promptEn}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* QUICK SELF-CHECK EXPANDED MODE */
                                  <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--sakura-light)]/20 p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--primary-fg)]">
                                        <HelpCircle size={13} />
                                        <span>Quick Self-Check Recall Drill</span>
                                      </span>
                                      <button
                                        onClick={() => {
                                          setSelfCheckOpen((prev) => ({
                                            ...prev,
                                            [checkKey]: false,
                                          }));
                                          setSelfCheckRevealed((prev) => ({
                                            ...prev,
                                            [checkKey]: false,
                                          }));
                                        }}
                                        className="text-[11px] font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                                      >
                                        Close Self-Check ✕
                                      </button>
                                    </div>

                                    {/* English Prompt to Translate */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black uppercase text-[var(--muted)] tracking-wider">
                                        Translate to Japanese:
                                      </span>
                                      <p className="text-sm font-bold text-[var(--ink)]">
                                        {eg.promptEn || eg.en}
                                      </p>
                                    </div>

                                    {/* Reveal Answer Section */}
                                    {!isRevealed ? (
                                      <button
                                        onClick={() =>
                                          setSelfCheckRevealed((prev) => ({
                                            ...prev,
                                            [checkKey]: true,
                                          }))
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all cursor-pointer"
                                      >
                                        <Eye size={13} />
                                        <span>Reveal Japanese Answer</span>
                                      </button>
                                    ) : (
                                      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2.5">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                                              Model Answer:
                                            </span>
                                            <p className="font-japanese text-base font-bold text-[var(--ink)] mt-0.5">
                                              {eg.ja}
                                            </p>
                                            {eg.en && (
                                              <p className="text-xs text-[var(--muted)] mt-0.5">{eg.en}</p>
                                            )}
                                          </div>
                                          <AudioButton
                                            text={eg.ja}
                                            mode="sentence"
                                            size="sm"
                                            id={eg.audioSrc}
                                            label={`Listen to ${eg.ja}`}
                                          />
                                        </div>

                                        {/* Self-Assessment Feedback */}
                                        <div className="pt-2 border-t border-[var(--line)]/50 flex items-center justify-between">
                                          <span className="text-[11px] font-semibold text-[var(--muted)]">
                                            How did you do?
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() =>
                                                setSelfCheckFeedback((prev) => ({
                                                  ...prev,
                                                  [checkKey]: "review",
                                                }))
                                              }
                                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                                feedback === "review"
                                                  ? "bg-amber-500 text-white shadow-2xs"
                                                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                                              }`}
                                            >
                                              Need Review
                                            </button>
                                            <button
                                              onClick={() =>
                                                setSelfCheckFeedback((prev) => ({
                                                  ...prev,
                                                  [checkKey]: "got-it",
                                                }))
                                              }
                                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                                feedback === "got-it"
                                                  ? "bg-emerald-600 text-white shadow-2xs"
                                                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                                              }`}
                                            >
                                              Got It! ✓
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        

        {/* TAB 3: KANJI */}
        {activeTab === "kanji" && (
          <section aria-label="Kanji characters section" className="space-y-6">
            {lesson.kanji.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center sm:p-12">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--sakura-light)] text-[var(--primary-fg)] font-bold text-xl mb-3">
                  あ
                </div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  Hiragana & Katakana Foundation
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                  In Genki, Lessons 1 and 2 focus on mastering the 46 Hiragana and 46 Katakana
                  syllabaries. Kanji instruction begins in Lesson 3.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    href="/games/kana"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90"
                  >
                    <span>Practice Kana Drills</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href={`/books/${bookId}/3`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)]"
                  >
                    <span>Jump to Lesson 3 Kanji</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Action Bar: Practice Kanji & Enqueue Kanji */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePracticeKanji}
                      disabled={launchingPractice === "kanji"}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Practice Lesson Kanji Drill</span>
                    </button>
                    <button
                      onClick={() => handleEnqueue("kanji")}
                      disabled={enqueuingSrs}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition-colors disabled:opacity-50"
                    >
                      <Zap size={13} />
                      <span>Enqueue Kanji in FSRS</span>
                    </button>
                  </div>

                  {/* Search filter for kanji */}
                  <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={kanjiSearch}
                      onChange={(e) => setKanjiSearch(e.target.value)}
                      placeholder="Search character, meaning, reading..."
                      className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-2 pl-10 pr-9 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-xs focus:border-[var(--primary)] focus:outline-hidden"
                    />
                    {kanjiSearch && (
                      <button
                        onClick={() => setKanjiSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Kanji Grid */}
                {filteredKanji.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                    No kanji match your query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredKanji.map((k) => (
                      <div
                        key={k.id}
                        className="flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xs hover:border-[var(--primary)]/40 transition-colors"
                      >
                        <div>
                          {/* Top: Glyph + Strokes + Number */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="grid size-14 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)] font-japanese text-3xl font-extrabold text-[var(--primary-fg)] shadow-2xs">
                                {k.kanji}
                              </span>
                              <div>
                                <span className="text-[11px] font-bold text-[var(--muted)]">
                                  #{String(k.number).padStart(3, "0")}
                                </span>
                                <h3 className="text-base font-bold text-[var(--ink)] capitalize">
                                  {k.meaning}
                                </h3>
                              </div>
                            </div>

                            <span className="rounded-lg bg-[var(--bg)] border border-[var(--line)] px-2 py-1 text-[11px] font-bold text-[var(--muted)]">
                              {k.strokes} 画
                            </span>
                          </div>

                          {/* Readings Section with KanjiReadingPill */}
                          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-3">
                            {k.onyomi.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-[var(--muted)] min-w-[28px]">
                                  音
                                </span>
                                {k.onyomi.map((on, i) => (
                                  <KanjiReadingPill
                                    key={i}
                                    reading={on}
                                    type="on"
                                    size="sm"
                                  />
                                ))}
                              </div>
                            )}

                            {k.kunyomi.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase text-[var(--muted)] min-w-[28px]">
                                  訓
                                </span>
                                {k.kunyomi.map((kun, i) => (
                                  <KanjiReadingPill
                                    key={i}
                                    reading={kun}
                                    type="kun"
                                    size="sm"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom action: Inline Stroke Order Modal Trigger */}
                        <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[var(--muted)]">
                            JLPT N{k.jlpt || (lesson.lessonNumber <= 12 ? 5 : 4)}
                          </span>
                          <button
                            onClick={() => setSelectedStrokeKanji(k)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
                            aria-label={`Stroke Order for ${k.kanji}`}
                          >
                            <Pencil size={12} />
                            <span>Stroke Order</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Inline Kanji Stroke Order Animation Modal */}
            {selectedStrokeKanji && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
                role="dialog"
                aria-modal="true"
                aria-label={`Stroke order animation for ${selectedStrokeKanji.kanji}`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedStrokeKanji(null);
                }}
              >
                <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-12 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)] font-japanese text-2xl font-black text-[var(--primary-fg)] shadow-xs">
                        {selectedStrokeKanji.kanji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-[var(--ink)] capitalize">
                            {selectedStrokeKanji.meaning}
                          </h3>
                          <span className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                            {selectedStrokeKanji.strokes} 画
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[var(--muted)]">
                          Lesson {lesson.lessonNumber} Kanji · JLPT N{selectedStrokeKanji.jlpt || (lesson.lessonNumber <= 12 ? 5 : 4)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedStrokeKanji(null)}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--sakura-light)]/40 transition-colors cursor-pointer"
                      aria-label="Close stroke player"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Stroke Player Component */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <StrokePlayer
                      kanji={selectedStrokeKanji.kanji}
                      onClose={() => setSelectedStrokeKanji(null)}
                      className="w-full"
                    />
                  </div>

                  {/* Readings and Next/Prev Navigation */}
                  <div className="border-t border-[var(--line)] pt-3 space-y-3">
                    {/* Readings */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedStrokeKanji.onyomi.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black uppercase text-[var(--muted)]">音</span>
                          {selectedStrokeKanji.onyomi.map((on, i) => (
                            <KanjiReadingPill key={i} reading={on} type="on" size="sm" />
                          ))}
                        </div>
                      )}
                      {selectedStrokeKanji.kunyomi.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black uppercase text-[var(--muted)]">訓</span>
                          {selectedStrokeKanji.kunyomi.map((kun, i) => (
                            <KanjiReadingPill key={i} reading={kun} type="kun" size="sm" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Modal Footer: Prev / Next Kanji & External Link */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const currentIndex = filteredKanji.findIndex((k) => k.kanji === selectedStrokeKanji.kanji);
                          const prevKanji = currentIndex > 0 ? filteredKanji[currentIndex - 1] : null;
                          const nextKanji = currentIndex < filteredKanji.length - 1 ? filteredKanji[currentIndex + 1] : null;
                          return (
                            <>
                              <button
                                onClick={() => prevKanji && setSelectedStrokeKanji(prevKanji)}
                                disabled={!prevKanji}
                                className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] disabled:opacity-40 hover:border-[var(--primary)] cursor-pointer"
                                title={prevKanji ? `Previous kanji: ${prevKanji.kanji}` : "No previous kanji"}
                              >
                                <ChevronLeft size={13} />
                                <span>Prev</span>
                              </button>
                              <button
                                onClick={() => nextKanji && setSelectedStrokeKanji(nextKanji)}
                                disabled={!nextKanji}
                                className="inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--ink)] disabled:opacity-40 hover:border-[var(--primary)] cursor-pointer"
                                title={nextKanji ? `Next kanji: ${nextKanji.kanji}` : "No next kanji"}
                              >
                                <span>Next</span>
                                <ChevronRight size={13} />
                              </button>
                            </>
                          );
                        })()}
                      </div>

                      <Link
                        href={`/games/kanji/playground/${encodeURIComponent(selectedStrokeKanji.kanji)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-fg)] hover:underline"
                        target="_blank"
                      >
                        <span>Freehand Canvas</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        

        {/* TAB 4: DIALOGUES */}
        {activeTab === "dialogues" && (
          <section aria-label="Dialogues section" className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--muted)]">
                  {lesson.dialogues?.length || 0} Scenes Available
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setTapLookupEnabled((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    tapLookupEnabled
                      ? "border-[var(--primary)]/50 bg-[var(--sakura-light)]/40 text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--surface-overlay)] text-[var(--muted)]"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>{tapLookupEnabled ? "Tap-to-Lookup: ON" : "Tap-to-Lookup: OFF"}</span>
                </button>

                <button
                  onClick={() => setShowDialogueCloze((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    showDialogueCloze
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--line)] bg-[var(--surface-overlay)] text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <HelpCircle size={14} />
                  <span>{showDialogueCloze ? "Hide Cloze Test" : "Grammar Cloze Test"}</span>
                </button>

                {/* Toggle English Translation */}
                <button
                  onClick={() => setShowEnglishDialogues((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-3.5 py-1.5 text-xs font-bold text-[var(--ink)] hover:border-[var(--primary)] transition-colors"
                >
                  {showEnglishDialogues ? (
                    <>
                      <EyeOff size={14} className="text-[var(--muted)]" />
                      <span>Hide English</span>
                    </>
                  ) : (
                    <>
                      <Eye size={14} className="text-[var(--primary-fg)]" />
                      <span>Show English</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showDialogueCloze && (
              <DialogueClozeTest
                lesson={lesson}
                showEnglish={showEnglishDialogues}
                onClose={() => setShowDialogueCloze(false)}
              />
            )}

            {/* Genki Dialogue Quest Branching Adventure Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--primary)]/25 bg-[var(--sakura-light)]/20 p-5 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--primary-fg)]" />
                  <h4 className="text-sm font-black text-[var(--ink)]">
                    {book.id === "genki-1"
                      ? "Genki I Dialogue Quest: Little Asia Restaurant"
                      : "Genki II Dialogue Quest: Meeting Manager Yamada (Keigo)"}
                  </h4>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  {book.id === "genki-1"
                    ? "Test your N5 ordering & part-time job social register in a branching Visual Novel adventure."
                    : "Navigate Honorific (敬語) vs. Humble (謙譲語) speech with the Kuuki (空気) atmosphere gauge."}
                </p>
              </div>
              <Link
                href={
                  book.id === "genki-1"
                    ? "/games/dialogue/play/genki-little-asia"
                    : "/games/dialogue/play/genki-department-manager"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-90 active:scale-95 transition-all"
              >
                <Play size={14} />
                <span>Play Dialogue Quest</span>
              </Link>
            </div>

            {/* Scenes List */}
            {(!lesson.dialogues || lesson.dialogues.length === 0) ? (
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
                <MessageSquare size={36} className="mx-auto mb-3 text-[var(--muted)] opacity-60" />
                <h3 className="text-base font-bold text-[var(--ink)]">No dialogues recorded for this lesson yet</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Dialogue scenes are currently being transcribed from textbook materials.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {lesson.dialogues.map((scene) =>
                  activeRoleplaySceneId === scene.id ? (
                    <DialogueRoleplayPlayer
                      key={scene.id}
                      scene={scene}
                      showEnglish={showEnglishDialogues}
                      onClose={() => setActiveRoleplaySceneId(null)}
                    />
                  ) : (
                    <div
                      key={scene.id}
                      className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs"
                    >
                      {/* Scene Header with Play Full Scene Button & Roleplay */}
                      <div className="border-b border-[var(--line)] bg-[var(--surface-overlay)]/50 px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="rounded-lg bg-[var(--sakura-light)] px-2.5 py-1 text-xs font-black text-[var(--primary-fg)]">
                              Dialogue {scene.sceneNumber}
                            </span>
                            <span className="text-[11px] font-semibold text-[var(--muted)]">
                              {scene.lines.length} lines
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Play Full Scene Continuous Audio Button */}
                            <button
                              onClick={() => togglePlayFullScene(scene)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                playingSceneId === scene.id
                                  ? "bg-rose-500 text-white shadow-xs animate-pulse"
                                  : "border border-[var(--primary)]/50 bg-[var(--sakura-light)] text-[var(--primary-fg)] hover:bg-[var(--primary)] hover:text-white shadow-2xs"
                              }`}
                              aria-label={playingSceneId === scene.id ? "Stop full scene audio" : "Play full scene audio"}
                            >
                              {playingSceneId === scene.id ? (
                                <>
                                  <Square size={13} fill="currentColor" />
                                  <span>Stop Scene ({playingLineIndex + 1}/{scene.lines.length})</span>
                                </>
                              ) : (
                                <>
                                  <Play size={13} fill="currentColor" />
                                  <span>Play Full Scene</span>
                                </>
                              )}
                            </button>

                            {/* Roleplay & Shadowing Button */}
                            <button
                              onClick={() => setActiveRoleplaySceneId(scene.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                              <Mic size={13} />
                              <span>Roleplay & Shadow</span>
                            </button>
                          </div>
                        </div>

                        {scene.setting && (
                          <p className="mt-2 text-xs italic text-[var(--muted)]">
                            Setting: {scene.setting}
                          </p>
                        )}
                      </div>

                      {/* Alternating Chat-Bubble Dialogue Lines with Speaker Avatars */}
                      <div className="p-4 sm:p-6 space-y-4 bg-[var(--bg)]/30">
                        {scene.lines.map((line, idx) => {
                          const uniqueSpeakers = Array.from(new Set(scene.lines.map((l) => l.speakerJa)));
                          const speakerIndex = uniqueSpeakers.indexOf(line.speakerJa);
                          const isRightAligned = speakerIndex % 2 === 1;
                          const isCurrentlyPlaying = playingSceneId === scene.id && playingLineIndex === idx;

                          // Speaker initial (e.g. "メ" from "メアリー", "た" from "たけし")
                          const initial =
                            line.speakerJa.replace(/^[木村|田中|山下|鈴木|佐藤]/, "").charAt(0) ||
                            line.speakerJa.charAt(0);

                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 sm:gap-4 transition-all duration-300 ${
                                isRightAligned ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {/* Speaker Avatar Circle with Initial */}
                              <div className="shrink-0 flex flex-col items-center gap-1">
                                <div
                                  className={`grid size-10 place-items-center rounded-2xl font-japanese text-sm font-black shadow-xs ${
                                    isRightAligned
                                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                      : "bg-gradient-to-br from-[var(--sakura)] to-[var(--primary)] text-white"
                                  }`}
                                  title={`${line.speakerJa} (${line.speaker})`}
                                >
                                  {initial}
                                </div>
                                <span className="text-[10px] font-bold text-[var(--muted)] max-w-[64px] truncate text-center">
                                  {line.speakerJa}
                                </span>
                              </div>

                              {/* Chat Bubble Container */}
                              <div
                                className={`relative max-w-xl rounded-3xl p-4 shadow-xs transition-all duration-300 ${
                                  isRightAligned
                                    ? "rounded-tr-xs border border-[var(--sakura)]/50 bg-gradient-to-br from-[var(--surface)] to-[var(--sakura-light)]/40 text-left"
                                    : "rounded-tl-xs border border-[var(--line)] bg-[var(--surface)] text-left"
                                } ${
                                  isCurrentlyPlaying
                                    ? "ring-3 ring-[var(--primary)] shadow-lg bg-[var(--sakura-light)]/80 scale-[1.01]"
                                    : ""
                                }`}
                              >
                                {/* Bubble Header: Speaker Name & Audio */}
                                <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-[var(--line)]/50 pb-1">
                                  <span className="text-[11px] font-bold text-[var(--muted)]">
                                    {line.speakerJa}{" "}
                                    <span className="opacity-70 font-normal">({line.speaker})</span>
                                  </span>
                                  <AudioButton
                                    text={line.ja}
                                    mode="sentence"
                                    size="sm"
                                    id={line.audioSrc}
                                    label={`Listen to ${line.speakerJa}`}
                                  />
                                </div>

                                {/* Interactive StoryReaderLine (with tap-to-lookup tokenization intact) */}
                                <div className="font-japanese text-base leading-relaxed text-[var(--ink)]">
                                  <StoryReaderLine
                                    ja={line.ja}
                                    lessonVocab={lesson.vocabulary}
                                    lessonKanji={lesson.kanji}
                                    dictMaps={dictMaps}
                                    kuromojiTokens={kuromojiLineMap[line.ja]}
                                    level={book.level}
                                    enabled={tapLookupEnabled}
                                  />
                                </div>

                                {/* English Translation */}
                                {showEnglishDialogues && (
                                  <p className="mt-2 text-xs text-[var(--muted)] font-medium border-t border-[var(--line)]/50 pt-1.5 leading-snug">
                                    {line.en}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        

        {/* TAB 5: PRACTICE */}
        {activeTab === "practice" && (
          <section aria-label="Practice Drills Section" className="space-y-6">
            {/* Header / Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[var(--ink)]">練習 Practice Drills</h3>
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--primary-fg)]">
                    {filteredPractice.reduce((acc, s) => acc + s.items.length, 0)} items
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Textbook practice exercises for Lesson {lesson.lessonNumber}. Test your skills and reveal model answers.
                </p>
              </div>

              {/* Master Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {Object.keys(practiceFeedback).length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {Object.values(practiceFeedback).filter((f) => f === "correct").length} / {Object.keys(practiceFeedback).length} Correct
                    </span>
                    <button
                      onClick={() => {
                        setPracticeFeedback({});
                        setUserPracticeInputs({});
                      }}
                      title="Reset practice attempts"
                      className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setWorkbookDrillMode((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
                    workbookDrillMode
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--line)] bg-[var(--surface-overlay)] text-[var(--ink)] hover:bg-[var(--line)]/50"
                  }`}
                >
                  <Zap size={14} />
                  <span>{workbookDrillMode ? "List View" : "Workbook Drill Mode"}</span>
                </button>
                <button
                  onClick={() => setPracticeRomajiIme((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    practiceRomajiIme
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                  title="Convert typed Romaji to Hiragana automatically"
                >
                  <Keyboard size={14} />
                  <span>{practiceRomajiIme ? "Romaji IME: ON" : "Romaji IME: OFF"}</span>
                </button>
                <button
                  onClick={() => setAutoEnqueueMissed((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    autoEnqueueMissed
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                  title="Automatically add missed workbook items to your FSRS review queue"
                >
                  <span>{autoEnqueueMissed ? "Auto-FSRS Missed: ON" : "Auto-FSRS Missed: OFF"}</span>
                </button>
                <button
                  onClick={() => setShowAllPracticeAnswers((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--line)]/50 transition-colors"
                >
                  {showAllPracticeAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showAllPracticeAnswers ? "Hide All Model Answers" : "Reveal All Model Answers"}</span>
                </button>
                <button
                  onClick={handlePracticeGrammar}
                  disabled={launchingPractice !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-2xs disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>Grammar Drill Mode</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Part Selector & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedPracticePart("all")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    selectedPracticePart === "all"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  All Parts ({practiceParts.length})
                </button>
                {practiceParts.map((part) => (
                  <button
                    key={part}
                    onClick={() => setSelectedPracticePart(part)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      selectedPracticePart === part
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Part {part}
                  </button>
                ))}
                {Object.values(practiceFeedback).filter((f) => f === "incorrect").length > 0 && (
                  <button
                    onClick={() => setPracticeMissedOnly((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      practiceMissedOnly
                        ? "border-rose-500 bg-rose-500 text-white shadow-2xs"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                    }`}
                    title="Filter to show only missed exercises"
                  >
                    <Filter size={13} />
                    <span>
                      Missed Only ({Object.values(practiceFeedback).filter((f) => f === "incorrect").length})
                    </span>
                  </button>
                )}
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search practice cues, prompts, answers..."
                  value={practiceSearch}
                  onChange={(e) => setPracticeSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-9 pr-8 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                {practiceSearch && (
                  <button
                    onClick={() => setPracticeSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Workbook Drill Mode */}
            {workbookDrillMode ? (
              <WorkbookDrillMode
                sections={filteredPractice}
                autoEnqueueMissed={autoEnqueueMissed}
                onMissedItem={enqueueMissedPracticeItem}
                onClose={() => setWorkbookDrillMode(false)}
                initialRomajiIme={practiceRomajiIme}
              />
            ) : filteredPractice.length === 0 ? (
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center space-y-3">
                <Pencil size={36} className="mx-auto text-[var(--muted)]/50" />
                <h4 className="text-sm font-bold text-[var(--ink)]">
                  {practiceMissedOnly
                    ? "No missed exercises remaining!"
                    : "No practice sections found"}
                </h4>
                <p className="text-xs text-[var(--muted)]">
                  {practiceMissedOnly
                    ? "Great job! You've mastered all the exercises you previously missed."
                    : "Try adjusting your part filter or search query."}
                </p>
                {practiceMissedOnly && (
                  <button
                    onClick={() => setPracticeMissedOnly(false)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-90"
                  >
                    Show All Exercises
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {practiceMissedOnly && (
                  <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                      <Filter size={14} />
                      <span>
                        Targeted review: Showing {filteredPractice.reduce((acc, s) => acc + s.items.length, 0)} missed exercise{filteredPractice.reduce((acc, s) => acc + s.items.length, 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <button
                      onClick={() => setPracticeMissedOnly(false)}
                      className="font-bold text-rose-700 dark:text-rose-300 hover:underline"
                    >
                      Show All Exercises
                    </button>
                  </div>
                )}
                {filteredPractice.map((section) => (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs"
                  >
                    {/* Section Header */}
                    <div className="border-b border-[var(--line)] bg-[var(--surface-overlay)]/40 px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-lg bg-[var(--primary)] px-2.5 py-1 text-xs font-black text-white">
                            Part {section.part}{section.section ? ` · Sec ${section.section}` : ""}
                          </span>
                          <h4 className="font-japanese text-sm font-bold text-[var(--ink)] sm:text-base">
                            {section.title}
                          </h4>
                          {section.grammarIndex && (
                            <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                              Grammar {section.grammarIndex}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {section.audioTrack && (
                            <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--muted)]">
                              Track: {section.audioTrack}
                            </span>
                          )}
                          <span className="rounded-md bg-[var(--line)]/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            {section.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      {section.subTitle && (
                        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                          {section.subTitle}
                        </p>
                      )}
                    </div>

                    {/* Reference Table (if any) */}
                    {section.referenceTable && (
                      <div className="overflow-x-auto border-b border-[var(--line)] bg-[var(--surface-overlay)]/20 p-4 sm:p-6">
                        <div className="rounded-2xl border border-[var(--line)] overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--surface-overlay)] border-b border-[var(--line)]">
                              <tr>
                                {section.referenceTable.headers.map((h, idx) => (
                                  <th key={idx} className="px-4 py-2.5 font-bold text-[var(--ink)] font-japanese">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line)]">
                              {section.referenceTable.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-[var(--surface-overlay)]/30 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2 font-japanese text-[var(--ink)]">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="divide-y divide-[var(--line)]/50 p-4 sm:p-6 space-y-4">
                      {section.items.map((item, idx) => {
                        const isRevealed = showAllPracticeAnswers || revealedPracticeAnswers[item.id];
                        const feedback = practiceFeedback[item.id];
                        const currentInput = userPracticeInputs[item.id] || "";

                        return (
                          <div key={item.id} className="pt-4 first:pt-0 space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              {/* Prompt & Cue */}
                              <div className="flex-1 min-w-[240px]">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--line)]/70 text-[10px] font-bold text-[var(--muted)]">
                                    {idx + 1}
                                  </span>
                                  <span className="font-japanese text-sm font-bold text-[var(--ink)] sm:text-base">
                                    {item.prompt}
                                  </span>
                                  {item.cue && (
                                    <span className="rounded-md bg-[var(--surface-overlay)] px-2 py-0.5 text-xs text-[var(--muted)] font-medium">
                                      {item.cue}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Toggle Model Answer */}
                              <button
                                onClick={() => togglePracticeAnswer(item.id)}
                                className="shrink-0 text-xs font-semibold text-[var(--primary-fg)] hover:underline flex items-center gap-1"
                              >
                                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                <span>{isRevealed ? "Hide Answer" : "Show Answer"}</span>
                              </button>
                            </div>

                            {/* Interactive Typing & Check Input */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <div className="relative flex-1 min-w-[200px]">
                                <input
                                  type="text"
                                  placeholder={
                                    practiceRomajiIme
                                      ? "Type Japanese response to check (or romaji)..."
                                      : "Type Japanese response to check..."
                                  }
                                  value={currentInput}
                                  onChange={(e) => {
                                    const val = practiceRomajiIme
                                      ? romajiToHiragana(e.target.value)
                                      : e.target.value;
                                    setUserPracticeInputs((prev) => ({
                                      ...prev,
                                      [item.id]: val,
                                    }));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      checkPracticeAnswer(item, section);
                                    }
                                  }}
                                  className={`w-full rounded-xl border px-3 py-1.5 text-xs font-japanese text-[var(--ink)] placeholder-[var(--muted)]/60 focus:outline-hidden transition-colors ${
                                    feedback === "correct"
                                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                                      : feedback === "incorrect"
                                      ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                                      : "border-[var(--line)] bg-[var(--surface-overlay)]/30 focus:border-[var(--primary)]"
                                  }`}
                                />
                                {practiceRomajiIme && !feedback && (
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[var(--surface)] border border-[var(--line)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">
                                    かな
                                  </span>
                                )}
                                {feedback && (
                                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    {feedback === "correct" ? (
                                      <CheckCircle2 size={15} className="text-emerald-600" />
                                    ) : (
                                      <XCircle size={15} className="text-rose-500" />
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => checkPracticeAnswer(item, section)}
                                disabled={!currentInput.trim()}
                                className="rounded-xl border border-[var(--line)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--line)]/50 active:scale-95 transition-all disabled:opacity-40"
                              >
                                Check
                              </button>

                              {!missedEnqueuedIds[item.id] ? (
                                <button
                                  type="button"
                                  onClick={() => void enqueueMissedPracticeItem(item, section)}
                                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)] transition-colors"
                                  title="Add this exercise to FSRS spaced repetition"
                                >
                                  + FSRS
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                  <Zap size={11} />
                                  <span>Queued in FSRS</span>
                                </span>
                              )}
                            </div>

                            {/* Character-Level Diff Breakdown on Missed Items */}
                            {feedback === "incorrect" && (
                              <CharacterDiffView
                                userInput={currentInput}
                                expectedAnswer={item.answer}
                                className="mt-2"
                              />
                            )}

                            {/* Model Answer Display (if revealed and not already showing diff, or correct) */}
                            {isRevealed && feedback !== "incorrect" && (
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-2.5 mt-2 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    Model Answer
                                  </span>
                                  <p className="font-japanese text-sm font-semibold text-[var(--ink)]">
                                    {item.answer}
                                  </p>
                                </div>
                                <AudioButton
                                  text={item.answer}
                                  mode="sentence"
                                  size="sm"
                                  label="Listen to model answer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </GameLayout>
  );
}
