"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Filter,
  Headphones,
  HelpCircle,
  Keyboard,
  LayoutGrid,
  List,
  MessageSquare,
  Pencil,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import {
  type BookDetail,
  type BookDialogueScene,
  type BookKanjiItem,
  type BookLesson,
  type BookPracticeItem,
  type BookPracticeSection,
  type BookVocabItem,
  enqueueLessonInSrs,
  getBookById,
  getBookLesson,
} from "@/data/books";
import { DialogueRoleplayPlayer } from "@/features/books/components/DialogueRoleplayPlayer";
import { DialogueClozeTest } from "@/features/books/components/DialogueClozeTest";
import { WorkbookDrillMode } from "@/features/books/components/WorkbookDrillMode";
import { KanjiDetailModal } from "@/features/books/components/KanjiDetailModal";
import {
  VocabularyDetailDrawer,
  VocabularyFlashcardDeck,
} from "@/features/books/components/VocabularyDetailDrawer";
import { romajiToHiragana } from "@/features/shiritori/engine/shiritori";
import { loadDictionaryDataMaps, type DictionaryDataMaps } from "@/data/dictionary";
import { addGrammarToSrs, upsertPracticeItems } from "@/lib/srs/service";
import { srsDb, type SrsItem } from "@/lib/srs/db";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { KanaRevisionSheet } from "@/app/games/kana/KanaRevisionSheet";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { loadVocabularyData, type VocabularyRecord } from "@/data/vocabulary";
import { createVocabularySession } from "@/features/vocabulary/engine/vocabulary";
import { createKanjiMeaningSession } from "@/features/kanji/engine/kanji-meaning";
import { createGrammarSession } from "@/features/grammar/engine/grammar-session";
import { loadGrammarData, type GrammarPoint } from "@/data/grammar";
import {
  buildSrsLookup,
  computeDetailedLessonOverview,
  computeDialogueProgress,
  computePracticeDashboardStats,
  getAdjacentLessonNumbers,
  getContextualKanjiDetails,
  getGrammarSrsInfo,
  getKanjiSrsInfo,
  getVocabSrsInfo,
  loadLessonWorkspaceState,
  recordStudiedLesson,
  saveLessonWorkspaceState,
  validatePracticeAnswer,
  type BookTabKey,
  type DialogueLearningMode,
  type GrammarSrsInfo,
  type GrammarStudyStatus,
  type VocabSrsState,
} from "@/features/books/engine/progress";
import {
  ContentContainer,
  DialogueCard,
  EmptyState,
  ExerciseCard,
  FilterDropdown,
  GrammarCard,
  GrammarStatusBadge,
  KanjiCard,
  KanjiListTable,
  LessonWorkspaceHeader,
  ResponsiveGrid,
  SearchInput,
  StatusBadge,
  TabNavigation,
  TextbookButton,
  TextbookPageContainer,
  VocabularyCard,
  VocabularyListTable,
  type TabItem,
  type VocabLearningMode,
} from "@/features/books/components/ui";

type ActiveTab = BookTabKey;

const VALID_TABS = new Set<ActiveTab>(["vocab", "grammar", "kanji", "dialogues", "practice"]);

function parseTabFromLocation(): ActiveTab | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const qTab = params.get("tab") as ActiveTab | null;
    if (qTab && VALID_TABS.has(qTab)) return qTab;
    const hashTab = window.location.hash.replace(/^#/, "") as ActiveTab;
    if (hashTab && VALID_TABS.has(hashTab)) return hashTab;
  } catch {
    // ignore URL parsing errors
  }
  return null;
}

export default function BookLessonPage() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const params = useParams<{ bookId: string; lesson: string }>();
  const bookId = params?.bookId || "genki-1";
  const lessonNumber = parseInt(params?.lesson || "1", 10);

  const targetKey = `${bookId}:${lessonNumber}`;
  const [loadedState, setLoadedState] = useState<{
    key: string;
    book: BookDetail | null;
    lesson: BookLesson | null;
  } | null>(null);
  const loading = loadedState?.key !== targetKey;
  const book = loadedState?.key === targetKey ? loadedState.book : null;
  const lesson = loadedState?.key === targetKey ? loadedState.lesson : null;
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
  const [vocabStatusFilter, setVocabStatusFilter] = useState<"all" | VocabSrsState>("all");
  const [grammarSearch, setGrammarSearch] = useState("");
  const [kanjiSearch, setKanjiSearch] = useState("");
  const [practiceSearch, setPracticeSearch] = useState("");
  const [selectedPracticePart, setSelectedPracticePart] = useState<string>("all");
  const [practiceCategoryFilter, setPracticeCategoryFilter] = useState<string>("all");

  // Vocab Study Mode, Learning Mode, Display Mode & Detail Drawer states
  const [vocabStudyMode, setVocabStudyMode] = useState<"show-all" | "hide-en" | "hide-kana">("show-all");
  const [vocabLearningMode, setVocabLearningMode] = useState<VocabLearningMode>("ja-en");
  const [revealedVocabEn, setRevealedVocabEn] = useState<Record<string, boolean>>({});
  const [revealedVocabKana, setRevealedVocabKana] = useState<Record<string, boolean>>({});
  const [revealedVocabJa, setRevealedVocabJa] = useState<Record<string, boolean>>({});
  const [vocabViewMode, setVocabViewMode] = useState<"grid" | "list" | "flip">("grid");
  const [flippedVocabCards, setFlippedVocabCards] = useState<Record<string, boolean>>({});
  const [selectedDetailState, setSelectedDetailState] = useState<{
    lessonKey: string;
    item: BookVocabItem;
  } | null>(null);
  const [completedDialogueIds, setCompletedDialogueIds] = useState<string[]>([]);
  const [dialogueLearningMode, setDialogueLearningMode] = useState<DialogueLearningMode>("reading");
  const [dialogueActiveSceneFilter, setDialogueActiveSceneFilter] = useState<string>("all");
  const [dialoguePlaybackRate, setDialoguePlaybackRate] = useState<number>(1.0);
  const [srsItems, setSrsItems] = useState<SrsItem[]>([]);
  const [hydratedWorkspaceKey, setHydratedWorkspaceKey] = useState<string | null>(null);

  const activeDetailVocab =
    selectedDetailState?.lessonKey === targetKey ? selectedDetailState.item : null;
  const setSelectedDetailVocab = useCallback(
    (item: BookVocabItem | null) => {
      setSelectedDetailState(item ? { lessonKey: targetKey, item } : null);
    },
    [targetKey]
  );

  // Kanji Detail Modal & Filter states
  const [selectedStrokeState, setSelectedStrokeState] = useState<{
    lessonKey: string;
    item: BookKanjiItem;
  } | null>(null);
  const [kanjiViewMode, setKanjiViewMode] = useState<"grid" | "list">("grid");
  const [kanjiStatusFilter, setKanjiStatusFilter] = useState<"all" | VocabSrsState>("all");
  const [kanjiStrokeFilter, setKanjiStrokeFilter] = useState<"all" | "1-4" | "5-8" | "9+">("all");
  const [kanjiJlptFilter, setKanjiJlptFilter] = useState<string>("all");

  const selectedStrokeKanji =
    selectedStrokeState?.lessonKey === targetKey ? selectedStrokeState.item : null;
  const setSelectedStrokeKanji = useCallback(
    (item: BookKanjiItem | null) => {
      setSelectedStrokeState(item ? { lessonKey: targetKey, item } : null);
    },
    [targetKey]
  );

  // Audio hook for continuous dialogue playback
  const { playSentenceAsync, preloadSentenceAudio, stopAudio } = useJapaneseAudio();

  // Grammar Self-Check, Study Status & Focused View states
  const [selfCheckOpen, setSelfCheckOpen] = useState<Record<string, boolean>>({});
  const [selfCheckRevealed, setSelfCheckRevealed] = useState<Record<string, boolean>>({});
  const [selfCheckFeedback, setSelfCheckFeedback] = useState<Record<string, "got-it" | "review">>({});
  const [grammarStudyStatus, setGrammarStudyStatus] = useState<Record<string, GrammarStudyStatus>>({});
  const [grammarStatusFilter, setGrammarStatusFilter] = useState<"all" | GrammarStudyStatus | "in-srs">("all");
  const [grammarLevelFilter, setGrammarLevelFilter] = useState<string>("all");
  const [focusedGrammarState, setFocusedGrammarState] = useState<{
    lessonKey: string;
    id: string;
  } | null>(null);
  const [linkedGrammarMap, setLinkedGrammarMap] = useState<Record<string, GrammarPoint>>({});

  const focusedGrammarId =
    focusedGrammarState?.lessonKey === targetKey ? focusedGrammarState.id : null;
  const setFocusedGrammarId = useCallback(
    (id: string | null) => {
      setFocusedGrammarState(id ? { lessonKey: targetKey, id } : null);
    },
    [targetKey]
  );

  // Continuous Dialogue Scene Audio states
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [playingLineIndex, setPlayingLineIndex] = useState<number>(-1);
  const scenePlaybackAbortRef = useRef<boolean>(false);

  // Stop all continuous dialogue audio playback & active roleplay
  const stopAllDialogueAudio = useCallback(() => {
    scenePlaybackAbortRef.current = true;
    stopAudio();
    setPlayingSceneId(null);
    setPlayingLineIndex(-1);
    setActiveRoleplaySceneId(null);
  }, [stopAudio]);

  // Stop dialogue audio immediately when switching tabs away from dialogues
  useEffect(() => {
    if (activeTab !== "dialogues") {
      stopAllDialogueAudio();
    }
  }, [activeTab, stopAllDialogueAudio]);

  // Stop dialogue audio when switching lessons, changing routes, or unmounting
  useEffect(() => {
    return () => {
      stopAllDialogueAudio();
    };
  }, [targetKey, pathname, stopAllDialogueAudio]);

  // Stop dialogue audio when filtering or switching scenes inside the Dialogues tab
  useEffect(() => {
    scenePlaybackAbortRef.current = true;
    stopAudio();
    setPlayingSceneId(null);
    setPlayingLineIndex(-1);
  }, [dialogueActiveSceneFilter, dialogueLearningMode, stopAudio]);

  const markDialogueCompleted = useCallback((sceneId: string) => {
    setCompletedDialogueIds((prev) =>
      prev.includes(sceneId) ? prev : [...prev, sceneId]
    );
  }, []);

  const toggleDialogueCompleted = useCallback((sceneId: string) => {
    setCompletedDialogueIds((prev) =>
      prev.includes(sceneId) ? prev.filter((id) => id !== sceneId) : [...prev, sceneId]
    );
  }, []);

  const selectTab = useCallback((nextTab: ActiveTab, pushHistory: boolean = true) => {
    if (nextTab !== "dialogues") {
      stopAllDialogueAudio();
    }
    setActiveTab(nextTab);
    if (pushHistory && typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") !== nextTab) {
          url.searchParams.set("tab", nextTab);
          window.history.pushState({ tab: nextTab }, "", `${url.pathname}${url.search}${url.hash}`);
        }
      } catch {
        // Ignore history pushState errors in sandboxed frames
      }
    }
  }, [stopAllDialogueAudio]);

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

    // Pre-warm opening lines before starting playback loop
    if (typeof preloadSentenceAudio === "function") {
      for (const line of scene.lines.slice(0, 3)) {
        preloadSentenceAudio(line.ja, line.audioSrc);
      }
    }

    for (let i = 0; i < scene.lines.length; i++) {
      if (scenePlaybackAbortRef.current) break;
      setPlayingLineIndex(i);
      const nextLine = scene.lines[i + 1];
      if (nextLine && typeof preloadSentenceAudio === "function") {
        preloadSentenceAudio(nextLine.ja, nextLine.audioSrc);
      }
      try {
        await playSentenceAsync(scene.lines[i].ja, {
          audioSrc: scene.lines[i].audioSrc,
          rate: dialoguePlaybackRate,
        });
      } catch {
        // Continue to next line gracefully
      }
      if (scenePlaybackAbortRef.current) break;
      await new Promise((r) => setTimeout(r, dialoguePlaybackRate < 1 ? 650 : 450));
      if (scenePlaybackAbortRef.current) break;
    }

    if (!scenePlaybackAbortRef.current) {
      markDialogueCompleted(scene.id);
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

  // Load FSRS items for live lesson progress
  const refreshSrsItems = useCallback(async () => {
    if (typeof window === "undefined" || !srsDb?.items) return;
    try {
      const items = await srsDb.items.toArray();
      setSrsItems(items);
    } catch {
      // Ignore IndexedDB errors
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadInitialSrs() {
      try {
        if (typeof window !== "undefined" && srsDb?.items) {
          const items = await srsDb.items.toArray();
          if (mounted) setSrsItems(items);
        }
      } catch {
        // Ignore IndexedDB errors
      }
    }
    loadInitialSrs();
    return () => {
      mounted = false;
    };
  }, [bookId, lessonNumber]);

  // Restore deep-linked tab and persisted lesson workspace state + handle browser back/forward
  useEffect(() => {
    let mounted = true;
    const keyForEffect = `${bookId}:${lessonNumber}`;

    Promise.resolve().then(() => {
      if (!mounted) return;
      const urlTab = parseTabFromLocation();
      if (urlTab) setActiveTab(urlTab);

      const saved = loadLessonWorkspaceState(bookId, lessonNumber);
      if (saved.vocabTypeFilter) setVocabTypeFilter(saved.vocabTypeFilter);
      if (saved.vocabStatusFilter) setVocabStatusFilter(saved.vocabStatusFilter);
      if (saved.vocabStudyMode) setVocabStudyMode(saved.vocabStudyMode);
      if (saved.vocabViewMode) setVocabViewMode(saved.vocabViewMode);
      if (saved.vocabLearningMode) setVocabLearningMode(saved.vocabLearningMode);
      if (saved.grammarStudyStatus) setGrammarStudyStatus(saved.grammarStudyStatus);
      if (saved.grammarStatusFilter) setGrammarStatusFilter(saved.grammarStatusFilter);
      if (saved.kanjiViewMode) setKanjiViewMode(saved.kanjiViewMode);
      if (saved.kanjiStatusFilter) setKanjiStatusFilter(saved.kanjiStatusFilter);
      if (saved.kanjiStrokeFilter) setKanjiStrokeFilter(saved.kanjiStrokeFilter);
      if (saved.kanjiJlptFilter) setKanjiJlptFilter(saved.kanjiJlptFilter);
      if (saved.selectedPracticePart) setSelectedPracticePart(saved.selectedPracticePart);
      if (saved.practiceCategoryFilter) setPracticeCategoryFilter(saved.practiceCategoryFilter);
      if (saved.practiceMode) setWorkbookDrillMode(saved.practiceMode === "focused");
      if (saved.userPracticeInputs) setUserPracticeInputs(saved.userPracticeInputs);
      if (saved.practiceFeedback) setPracticeFeedback(saved.practiceFeedback);
      if (saved.selfCheckFeedback) setSelfCheckFeedback(saved.selfCheckFeedback);
      if (saved.completedDialogueIds) setCompletedDialogueIds(saved.completedDialogueIds);
      if (saved.dialogueLearningMode) setDialogueLearningMode(saved.dialogueLearningMode);
      if (saved.dialogueActiveSceneId) setDialogueActiveSceneFilter(saved.dialogueActiveSceneId);
      setHydratedWorkspaceKey(keyForEffect);
    });

    const handlePopState = () => {
      const nextUrlTab = parseTabFromLocation();
      if (nextUrlTab) {
        setActiveTab(nextUrlTab);
      } else {
        setActiveTab("vocab");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      mounted = false;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bookId, lessonNumber]);

  // Persist workspace filters and practice progress for this lesson
  useEffect(() => {
    if (hydratedWorkspaceKey !== targetKey) return;
    saveLessonWorkspaceState(bookId, lessonNumber, {
      vocabTypeFilter,
      vocabStatusFilter,
      vocabStudyMode,
      vocabViewMode,
      vocabLearningMode,
      grammarStudyStatus,
      grammarStatusFilter,
      kanjiViewMode,
      kanjiStatusFilter,
      kanjiStrokeFilter,
      kanjiJlptFilter,
      selectedPracticePart,
      practiceCategoryFilter,
      practiceMode: workbookDrillMode ? "focused" : "worksheet",
      userPracticeInputs,
      practiceFeedback,
      selfCheckFeedback,
      completedDialogueIds,
      dialogueLearningMode,
      dialogueActiveSceneId: dialogueActiveSceneFilter,
    });
  }, [
    bookId,
    completedDialogueIds,
    dialogueActiveSceneFilter,
    dialogueLearningMode,
    grammarStatusFilter,
    grammarStudyStatus,
    hydratedWorkspaceKey,
    kanjiJlptFilter,
    kanjiStatusFilter,
    kanjiStrokeFilter,
    kanjiViewMode,
    lessonNumber,
    practiceCategoryFilter,
    practiceFeedback,
    selectedPracticePart,
    selfCheckFeedback,
    targetKey,
    userPracticeInputs,
    vocabLearningMode,
    vocabStatusFilter,
    vocabStudyMode,
    vocabTypeFilter,
    vocabViewMode,
    workbookDrillMode,
  ]);

  // Load Book and Lesson data
  useEffect(() => {
    let mounted = true;
    const keyForEffect = `${bookId}:${lessonNumber}`;

    Promise.all([getBookById(bookId), getBookLesson(bookId, lessonNumber)])
      .then(([bookData, lessonData]) => {
        if (!mounted) return;
        setLoadedState({
          key: keyForEffect,
          book: bookData,
          lesson: lessonData,
        });

        if (bookData && lessonData) {
          recordStudiedLesson({
            bookId,
            lessonNumber,
            bookTitle: bookData.title.split(":")[0].trim(),
            lessonTitle: lessonData.title,
            japaneseTitle: lessonData.japaneseTitle || "",
            coverImage: bookData.coverImage,
            lastTab: parseTabFromLocation() || "vocab",
            updatedAt: Date.now(),
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load lesson:", err);
        if (mounted) {
          setLoadedState({
            key: keyForEffect,
            book: null,
            lesson: null,
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, [bookId, lessonNumber]);

  // Track visited section tab in study history
  useEffect(() => {
    if (!book || !lesson) return;
    recordStudiedLesson({
      bookId,
      lessonNumber,
      bookTitle: book.title.split(":")[0].trim(),
      lessonTitle: lesson.title,
      japaneseTitle: lesson.japaneseTitle || "",
      coverImage: book.coverImage,
      lastTab: activeTab,
      updatedAt: Date.now(),
    });
  }, [activeTab, book, bookId, lesson, lessonNumber]);

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

      if (activeDetailVocab || selectedStrokeKanji) {
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        selectTab("vocab");
      } else if (e.key === "2") {
        e.preventDefault();
        selectTab("grammar");
      } else if (e.key === "3") {
        e.preventDefault();
        selectTab("kanji");
      } else if (e.key === "4") {
        e.preventDefault();
        selectTab("dialogues");
      } else if (e.key === "5") {
        e.preventDefault();
        selectTab("practice");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDetailVocab, selectTab, selectedStrokeKanji]);

  // Load Dictionary for Vocab contextual details, Kanji->Vocab inspection & Dialogues Tap-to-Lookup
  useEffect(() => {
    if (!lesson || (activeTab !== "vocab" && activeTab !== "kanji" && activeTab !== "dialogues")) return;
    let mounted = true;

    loadDictionaryDataMaps()
      .then((maps) => {
        if (mounted) setDictMaps(maps);
      })
      .catch(() => {
        // Fallback to lesson vocab/kanji if dictionary fails to load
      });

    if (
      activeTab === "dialogues" &&
      lesson.dialogues?.length &&
      typeof window !== "undefined" &&
      !process.env?.VITEST
    ) {
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

  // Load linked JLPT Grammar Points when viewing Grammar tab
  useEffect(() => {
    if (activeTab !== "grammar" || !lesson?.grammar.some((g) => g.linkedGrammarId)) return;
    let mounted = true;
    loadGrammarData(["N5", "N4"])
      .then((points) => {
        if (!mounted) return;
        const map: Record<string, GrammarPoint> = {};
        for (const p of points) {
          map[p.id] = p;
        }
        setLinkedGrammarMap(map);
      })
      .catch(() => {
        // Fallback to textbook-only grammar data if JLPT grammar bank is unavailable
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, lesson]);

  // Practice dashboard analytics
  const practiceDashboardStats = useMemo(() => {
    return computePracticeDashboardStats(lesson?.practice ?? [], practiceFeedback);
  }, [lesson?.practice, practiceFeedback]);

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
        const matchesCategory =
          practiceCategoryFilter === "all" || sec.type === practiceCategoryFilter;
        return matchesPart && matchesCategory && sec.items.length > 0;
      });
  }, [
    lesson,
    selectedPracticePart,
    practiceCategoryFilter,
    practiceSearch,
    practiceMissedOnly,
    practiceFeedback,
  ]);

  const practiceParts = useMemo(() => {
    return practiceDashboardStats.parts.map((p) => p.part);
  }, [practiceDashboardStats.parts]);

  const hasAnyAnsweredInput = useMemo(() => {
    return filteredPractice.some((sec) =>
      sec.items.some((it) => (userPracticeInputs[it.id] || "").trim().length > 0)
    );
  }, [filteredPractice, userPracticeInputs]);

  const enqueueMissedPracticeItem = useCallback(
    async (item: BookPracticeItem, section: BookPracticeSection) => {
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
        refreshSrsItems();
      } catch (err) {
        console.error("Failed to enqueue missed practice item:", err);
      }
    },
    [book, refreshSrsItems]
  );

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

    const isMatch = validatePracticeAnswer(input, item.answer);

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

  const handleCheckSectionAnswers = useCallback(
    (section: BookPracticeSection) => {
      let anyChecked = false;
      let anyIncorrect = false;
      const nextFeedback = { ...practiceFeedback };

      for (const item of section.items) {
        const rawInput = userPracticeInputs[item.id] || "";
        const input = practiceRomajiIme ? romajiToHiragana(rawInput, true) : rawInput;
        if (input !== rawInput) {
          setUserPracticeInputs((prev) => ({ ...prev, [item.id]: input }));
        }
        if (input.trim()) {
          anyChecked = true;
          const isMatch = validatePracticeAnswer(input, item.answer);
          nextFeedback[item.id] = isMatch ? "correct" : "incorrect";
          if (!isMatch) {
            anyIncorrect = true;
            if (autoEnqueueMissed && !missedEnqueuedIds[item.id]) {
              void enqueueMissedPracticeItem(item, section);
            }
          }
        }
      }

      if (anyChecked) {
        setPracticeFeedback(nextFeedback);
        if (anyIncorrect) {
          playGameSfx("incorrect-chime");
        } else {
          playGameSfx("correct-chime");
        }
      }
    },
    [
      userPracticeInputs,
      practiceRomajiIme,
      practiceFeedback,
      autoEnqueueMissed,
      missedEnqueuedIds,
      enqueueMissedPracticeItem,
      setUserPracticeInputs,
      setPracticeFeedback,
    ]
  );

  const handleCheckAllAnswered = useCallback(() => {
    let anyChecked = false;
    let anyIncorrect = false;
    const nextFeedback = { ...practiceFeedback };

    for (const section of filteredPractice) {
      for (const item of section.items) {
        const rawInput = userPracticeInputs[item.id] || "";
        const input = practiceRomajiIme ? romajiToHiragana(rawInput, true) : rawInput;
        if (input !== rawInput) {
          setUserPracticeInputs((prev) => ({ ...prev, [item.id]: input }));
        }
        if (input.trim()) {
          anyChecked = true;
          const isMatch = validatePracticeAnswer(input, item.answer);
          nextFeedback[item.id] = isMatch ? "correct" : "incorrect";
          if (!isMatch) {
            anyIncorrect = true;
            if (autoEnqueueMissed && !missedEnqueuedIds[item.id]) {
              void enqueueMissedPracticeItem(item, section);
            }
          }
        }
      }
    }

    if (anyChecked) {
      setPracticeFeedback(nextFeedback);
      if (anyIncorrect) {
        playGameSfx("incorrect-chime");
      } else {
        playGameSfx("correct-chime");
      }
    }
  }, [
    filteredPractice,
    userPracticeInputs,
    practiceRomajiIme,
    practiceFeedback,
    autoEnqueueMissed,
    missedEnqueuedIds,
    enqueueMissedPracticeItem,
    setUserPracticeInputs,
    setPracticeFeedback,
  ]);

  function togglePracticeAnswer(itemId: string) {
    setRevealedPracticeAnswers((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  // Boundary-aware Previous & Next Lesson navigation
  const { prevLessonNumber, nextLessonNumber } = useMemo(
    () => getAdjacentLessonNumbers(book, lessonNumber),
    [book, lessonNumber]
  );

  const srsLookup = useMemo(() => buildSrsLookup(srsItems), [srsItems]);

  const { vocabSrsStateById, vocabStats } = useMemo(() => {
    const stateMap = new Map<string, VocabSrsState>();
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let dueCount = 0;

    if (lesson) {
      for (const v of lesson.vocabulary) {
        const info = getVocabSrsInfo(v.word, srsLookup);
        stateMap.set(v.id, info.state);
        if (info.state === "new") newCount++;
        else if (info.state === "learning") learningCount++;
        else if (info.state === "mastered") masteredCount++;
        else if (info.state === "due") dueCount++;
      }
    }

    const total = lesson?.vocabulary.length ?? 0;
    const studied = total - newCount;

    return {
      vocabSrsStateById: stateMap,
      vocabStats: {
        total,
        studied,
        newCount,
        learningCount,
        masteredCount,
        dueCount,
      },
    };
  }, [lesson, srsLookup]);

  const filteredVocab = useMemo(() => {
    if (!lesson) return [];
    const matchesCategory = (rawType: string, filterKey: string) => {
      const t = rawType.trim().toLowerCase();
      if (filterKey === "all") return true;
      if (filterKey === "noun") return t === "n" || t === "noun";
      if (filterKey === "verb") {
        return (
          t === "v" ||
          t === "verb" ||
          t === "u-v" ||
          t === "ru-v" ||
          t === "irr" ||
          t === "irr-v" ||
          t === "u-verb" ||
          t === "ru-verb"
        );
      }
      if (filterKey === "adj") return t.includes("adj");
      if (filterKey === "expr") {
        return t === "expr" || t === "expression" || t === "adv" || t === "ctr";
      }
      return true;
    };

    const q = vocabSearch.trim().toLowerCase();

    return lesson.vocabulary.filter((v) => {
      if (!matchesCategory(v.type, vocabTypeFilter)) return false;

      if (vocabStatusFilter !== "all") {
        const state = vocabSrsStateById.get(v.id) ?? "new";
        if (state !== vocabStatusFilter) return false;
      }

      if (!q) return true;
      return (
        v.word.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q) ||
        v.reading.toLowerCase().includes(q) ||
        v.readingKana.toLowerCase().includes(q)
      );
    });
  }, [lesson, vocabSearch, vocabStatusFilter, vocabSrsStateById, vocabTypeFilter]);

  const { grammarSrsInfoById, grammarStats, availableGrammarLevels } = useMemo(() => {
    const srsMap = new Map<string, GrammarSrsInfo>();
    const levels = new Set<string>();
    let notStudiedCount = 0;
    let studyingCount = 0;
    let understoodCount = 0;
    let inSrsCount = 0;

    if (lesson) {
      for (const pt of lesson.grammar) {
        const srsInfo = getGrammarSrsInfo(pt, srsLookup);
        srsMap.set(pt.id, srsInfo);
        if (srsInfo.inSrs) inSrsCount++;

        const status = grammarStudyStatus[pt.id] ?? "not-studied";
        if (status === "understood") understoodCount++;
        else if (status === "studying") studyingCount++;
        else notStudiedCount++;

        const ptLevel = pt.linkedGrammarId?.split("/")[0];
        if (ptLevel) levels.add(ptLevel);
      }
    }

    return {
      grammarSrsInfoById: srsMap,
      grammarStats: {
        total: lesson?.grammar.length ?? 0,
        studiedCount: studyingCount + understoodCount,
        notStudiedCount,
        studyingCount,
        understoodCount,
        inSrsCount,
      },
      availableGrammarLevels: Array.from(levels).sort(),
    };
  }, [grammarStudyStatus, lesson, srsLookup]);

  const filteredGrammar = useMemo(() => {
    if (!lesson) return [];
    const q = grammarSearch.trim().toLowerCase();

    return lesson.grammar.filter((g) => {
      if (grammarStatusFilter === "in-srs") {
        if (!grammarSrsInfoById.get(g.id)?.inSrs) return false;
      } else if (grammarStatusFilter !== "all") {
        const status = grammarStudyStatus[g.id] ?? "not-studied";
        if (status !== grammarStatusFilter) return false;
      }

      if (availableGrammarLevels.length > 1 && grammarLevelFilter !== "all") {
        if (g.linkedGrammarId?.split("/")[0] !== grammarLevelFilter) return false;
      }

      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.pattern.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q) ||
        g.examples.some(
          (eg) => eg.ja.toLowerCase().includes(q) || (eg.en || "").toLowerCase().includes(q)
        )
      );
    });
  }, [
    availableGrammarLevels.length,
    grammarLevelFilter,
    grammarSearch,
    grammarSrsInfoById,
    grammarStatusFilter,
    grammarStudyStatus,
    lesson,
  ]);

  const focusedGrammarIdx = focusedGrammarId
    ? filteredGrammar.findIndex((g) => g.id === focusedGrammarId)
    : -1;
  const focusedGrammarPoint =
    focusedGrammarIdx >= 0 ? filteredGrammar[focusedGrammarIdx] : null;
  const activeGrammarPoints = focusedGrammarPoint ? [focusedGrammarPoint] : filteredGrammar;

  const handleSelectGrammarPoint = useCallback(
    (id: string | null) => {
      setFocusedGrammarId(id);
      if (id && typeof document !== "undefined") {
        requestAnimationFrame(() => {
          document.getElementById(`grammar-point-${id}`)?.scrollIntoView?.({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    },
    [setFocusedGrammarId]
  );

  const defaultKanjiJlpt = lesson && lesson.lessonNumber <= 12 ? 5 : 4;

  const {
    kanjiSrsStateById,
    kanjiStats,
    kanjiVocabCountById,
    availableKanjiJlptLevels,
  } = useMemo(() => {
    const stateMap = new Map<string, VocabSrsState>();
    const vocabCountMap = new Map<string, number>();
    const jlptSet = new Set<string>();
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let dueCount = 0;

    if (lesson) {
      for (const k of lesson.kanji) {
        const srsInfo = getKanjiSrsInfo(k, srsLookup);
        stateMap.set(k.id, srsInfo.state);
        if (srsInfo.state === "new") newCount++;
        else if (srsInfo.state === "learning") learningCount++;
        else if (srsInfo.state === "mastered") masteredCount++;
        else if (srsInfo.state === "due") dueCount++;

        const contextual = getContextualKanjiDetails(k, lesson, defaultKanjiJlpt);
        vocabCountMap.set(k.id, contextual.lessonVocab.length);
        jlptSet.add(contextual.jlptLevel);
      }
    }

    const total = lesson?.kanji.length ?? 0;
    const studied = total - newCount;

    return {
      kanjiSrsStateById: stateMap,
      kanjiStats: {
        total,
        studied,
        newCount,
        learningCount,
        masteredCount,
        dueCount,
      },
      kanjiVocabCountById: vocabCountMap,
      availableKanjiJlptLevels: Array.from(jlptSet).sort().reverse(),
    };
  }, [defaultKanjiJlpt, lesson, srsLookup]);

  const filteredKanji = useMemo(() => {
    if (!lesson) return [];
    const q = kanjiSearch.trim().toLowerCase();

    return lesson.kanji.filter((k) => {
      if (kanjiStatusFilter !== "all") {
        const state = kanjiSrsStateById.get(k.id) ?? "new";
        if (state !== kanjiStatusFilter) return false;
      }

      if (kanjiStrokeFilter !== "all") {
        const strokes = k.strokes ?? 0;
        if (kanjiStrokeFilter === "1-4" && (strokes < 1 || strokes > 4)) return false;
        if (kanjiStrokeFilter === "5-8" && (strokes < 5 || strokes > 8)) return false;
        if (kanjiStrokeFilter === "9+" && strokes < 9) return false;
      }

      if (availableKanjiJlptLevels.length > 1 && kanjiJlptFilter !== "all") {
        const lvl = `N${k.jlpt || defaultKanjiJlpt}`;
        if (lvl !== kanjiJlptFilter) return false;
      }

      if (!q) return true;
      return (
        k.kanji.includes(q) ||
        k.meaning.toLowerCase().includes(q) ||
        (k.label?.toLowerCase().includes(q) ?? false) ||
        k.onyomi.some((o) => o.includes(q)) ||
        k.kunyomi.some((ku) => ku.includes(q))
      );
    });
  }, [
    availableKanjiJlptLevels.length,
    defaultKanjiJlpt,
    kanjiJlptFilter,
    kanjiSearch,
    kanjiSrsStateById,
    kanjiStatusFilter,
    kanjiStrokeFilter,
    lesson,
  ]);

  const detailedOverview = useMemo(() => {
    if (!lesson) return null;
    return computeDetailedLessonOverview(
      lesson,
      srsLookup,
      {
        practiceFeedback,
        selfCheckFeedback,
        completedDialogueIds,
      },
      true
    );
  }, [completedDialogueIds, lesson, practiceFeedback, selfCheckFeedback, srsLookup]);

  const dialogueProgressStats = useMemo(() => {
    if (!lesson) {
      return { totalScenes: 0, completedScenes: 0, percent: 0, totalLines: 0, uniqueSpeakersCount: 0 };
    }
    return computeDialogueProgress(lesson, completedDialogueIds);
  }, [lesson, completedDialogueIds]);

  const visibleDialogueScenes = useMemo(() => {
    if (!lesson?.dialogues) return [];
    if (dialogueActiveSceneFilter === "all") return lesson.dialogues;
    return lesson.dialogues.filter((d) => d.id === dialogueActiveSceneFilter);
  }, [dialogueActiveSceneFilter, lesson]);

  // --- Practice Drill Handlers ---
  async function handlePracticeVocab() {
    if (!lesson || !book || lesson.vocabulary.length === 0) return;
    setLaunchingPractice("vocab");
    try {
      const data = await loadVocabularyData([book.level]);
      const lessonWords = new Set(lesson.vocabulary.map((v) => v.word.trim()));
      const matchingRecords = data.records.filter((r) => lessonWords.has(r.word.trim()));

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
          size: questionIds.length <= 20 ? "all" : 20,
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
      refreshSrsItems();
      setTimeout(() => setSrsSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to enqueue in FSRS:", err);
    } finally {
      setEnqueuingSrs(false);
    }
  }

  // Build persistent 5-tab navigation items with live counts
  const tabs = useMemo<TabItem<ActiveTab>[]>(() => {
    if (!lesson) return [];
    return [
      {
        id: "vocab",
        label: "単語 Vocabulary",
        count: lesson.stats.vocabularyCount,
      },
      {
        id: "grammar",
        label: "文法 Grammar",
        count: lesson.stats.grammarCount,
      },
      {
        id: "kanji",
        label:
          lesson.kanji.length === 0
            ? lesson.lessonNumber === 2
              ? "片仮名 Katakana"
              : "平仮名 Hiragana"
            : "漢字 Kanji",
        count:
          lesson.kanji.length === 0
            ? 46
            : lesson.stats.kanjiCount,
      },
      {
        id: "dialogues",
        label: "会話 Dialogues",
        count: lesson.dialogues?.length ?? 0,
      },
      {
        id: "practice",
        label: "練習 Practice",
        count:
          lesson.stats.practiceCount ??
          (lesson.practice?.reduce((acc, s) => acc + s.items.length, 0) ?? 0),
      },
    ];
  }, [lesson]);

  if (loading) {
    return (
      <TextbookPageContainer label="TEXTBOOKS" glyph="本" homeHref="/books">
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <SakuraLoader label={`Loading Lesson ${lessonNumber}...`} />
        </div>
      </TextbookPageContainer>
    );
  }

  if (!lesson || !book) {
    return (
      <TextbookPageContainer label="TEXTBOOKS" glyph="本" homeHref="/books">
        <div className="mx-auto max-w-xl py-10">
          <EmptyState
            glyph="本"
            title="Lesson not found"
            description={`We could not find Lesson ${lessonNumber} in ${bookId}.`}
            action={
              <Link
                href="/books"
                className="tb-focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--tb-primary)] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[var(--tb-primary-hover)] transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Return to Shelf</span>
              </Link>
            }
          />
        </div>
      </TextbookPageContainer>
    );
  }

  return (
    <TextbookPageContainer label="TEXTBOOKS" glyph="本" homeHref="/books">
      {/* Compact Workspace Header with Breadcrumbs, Prev/Next Switch, Status & 5-Area Lesson Overview */}
      {detailedOverview && (
        <LessonWorkspaceHeader
          bookId={bookId}
          bookTitle={book.title.split(":")[0]}
          level={book.level}
          lessonNumber={lesson.lessonNumber}
          lessonTitle={lesson.title}
          japaneseTitle={lesson.japaneseTitle}
          subtitle={lesson.subtitle}
          prevLessonNumber={prevLessonNumber}
          nextLessonNumber={nextLessonNumber}
          overview={detailedOverview}
          activeTab={activeTab}
          enqueuingSrs={enqueuingSrs}
          onEnqueueAll={() => void handleEnqueue("all")}
          onSelectTab={selectTab}
        />
      )}

      {/* FSRS Toast Notification */}
      {srsSuccessMessage && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--tb-success-border)] bg-[var(--tb-success-bg)] p-4 text-xs font-bold text-[var(--tb-success)] shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Check size={16} className="shrink-0" />
            <span>{srsSuccessMessage}</span>
          </div>
          <Link
            href="/review"
            className="tb-focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--tb-surface)] px-3 py-1.5 text-xs font-bold text-[var(--primary-fg)] border border-[var(--tb-border)] shadow-2xs hover:border-[var(--tb-primary)] transition-colors"
          >
            <span>Open Review Hub</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Sticky Persistent 5-Tab Navigation with Keyboard Shortcut Hints */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelect={selectTab}
        sticky
      />

      <div key={activeTab} className="animate-in fade-in duration-150">

      {/* TAB 1: VOCABULARY */}
      {activeTab === "vocab" && (
        <section aria-label="Vocabulary section" className="space-y-5">
          {/* Header, FSRS Status Breakdown & Practice Actions */}
          <ContentContainer padding="sm" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-[var(--tb-text-primary)]">
                    Lesson Vocabulary
                  </h2>
                  <StatusBadge variant="neutral">
                    {vocabStats.total} Words
                  </StatusBadge>
                  <StatusBadge variant="info">
                    Studied {vocabStats.studied}
                  </StatusBadge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge variant="new">New {vocabStats.newCount}</StatusBadge>
                  <StatusBadge variant="in-progress">
                    Learning {vocabStats.learningCount}
                  </StatusBadge>
                  <StatusBadge variant="mastered">
                    Mastered {vocabStats.masteredCount}
                  </StatusBadge>
                  <StatusBadge variant="due">Due {vocabStats.dueCount}</StatusBadge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TextbookButton
                  variant="primary"
                  size="sm"
                  onClick={handlePracticeVocab}
                  loading={launchingPractice === "vocab"}
                  leftIcon={<Play size={13} fill="currentColor" />}
                >
                  Practice Lesson Vocabulary
                </TextbookButton>
                <TextbookButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEnqueue("vocab")}
                  disabled={enqueuingSrs}
                  leftIcon={<Zap size={13} />}
                >
                  Enqueue Vocab in FSRS
                </TextbookButton>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--tb-border)]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <SearchInput
                value={vocabSearch}
                onChange={setVocabSearch}
                placeholder="Search word or meaning..."
                clearLabel="Clear vocab search"
                size="sm"
                className="w-full lg:max-w-xs"
              />

              <div className="flex flex-wrap items-center gap-3">
                <FilterDropdown
                  label="Filter vocabulary by part of speech"
                  value={vocabTypeFilter}
                  onChange={setVocabTypeFilter}
                  options={[
                    { key: "all", label: "All" },
                    { key: "noun", label: "Nouns" },
                    { key: "verb", label: "Verbs" },
                    { key: "adj", label: "Adjectives" },
                    { key: "expr", label: "Expressions" },
                  ]}
                />

                <div
                  role="group"
                  aria-label="Filter vocabulary by FSRS status"
                  className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                >
                  {(
                    [
                      { key: "all", label: "All Status" },
                      { key: "new", label: "New" },
                      { key: "learning", label: "Learning" },
                      { key: "mastered", label: "Mastered" },
                      { key: "due", label: "Due" },
                    ] as const
                  ).map((statusOpt) => (
                    <button
                      key={statusOpt.key}
                      type="button"
                      aria-pressed={vocabStatusFilter === statusOpt.key}
                      onClick={() => setVocabStatusFilter(statusOpt.key)}
                      className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        vocabStatusFilter === statusOpt.key
                          ? "bg-[var(--tb-primary)] text-white shadow-xs"
                          : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      }`}
                    >
                      {statusOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ContentContainer>

          {/* Display Mode, Learning Mode & Study Mode Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Learning Modes */}
            <div
              role="group"
              aria-label="Vocabulary learning mode"
              className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-1 shadow-2xs"
            >
              {(
                [
                  { key: "ja-en", label: "JA → EN" },
                  { key: "en-ja", label: "EN → JA" },
                  { key: "reading", label: "Reading" },
                  { key: "typing", label: "Typing" },
                  { key: "listening", label: "Listening" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  aria-pressed={vocabLearningMode === mode.key}
                  onClick={() => {
                    setVocabLearningMode(mode.key);
                    setRevealedVocabJa({});
                  }}
                  className={`tb-focus-ring rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabLearningMode === mode.key
                      ? "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] ring-1 ring-[var(--tb-primary)]/30"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Study Toggles */}
              <div className="flex items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setVocabStudyMode("show-all")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabStudyMode === "show-all"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="Show all vocabulary details"
                >
                  <Eye size={13} />
                  <span>Show All</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVocabStudyMode("hide-en");
                    setRevealedVocabEn({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabStudyMode === "hide-en"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="Hide English meanings to practice recall"
                >
                  <EyeOff size={13} />
                  <span>Hide English</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVocabStudyMode("hide-kana");
                    setRevealedVocabKana({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabStudyMode === "hide-kana"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="Hide Kana readings to practice reading Kanji"
                >
                  <EyeOff size={13} />
                  <span>Hide Kana</span>
                </button>
              </div>

              {/* Display Mode Switcher: Grid vs List vs Flip-Cards */}
              <div
                role="group"
                aria-label="Vocabulary display mode"
                className="flex items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-1 shadow-2xs"
              >
                <button
                  type="button"
                  aria-pressed={vocabViewMode === "grid"}
                  onClick={() => setVocabViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabViewMode === "grid"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  aria-pressed={vocabViewMode === "list"}
                  onClick={() => setVocabViewMode("list")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabViewMode === "list"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="List View"
                >
                  <List size={13} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  aria-pressed={vocabViewMode === "flip"}
                  onClick={() => setVocabViewMode("flip")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    vocabViewMode === "flip"
                      ? "bg-[var(--tb-primary)] text-white shadow-xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                  title="Flip-Card Flashcards View"
                >
                  <RotateCw size={13} />
                  <span>Flip-Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vocab Content */}
          {filteredVocab.length === 0 ? (
            <EmptyState
              title="No vocabulary matches your search."
              description="Try clearing the search query or resetting category and FSRS status filters."
              action={
                (vocabSearch || vocabTypeFilter !== "all" || vocabStatusFilter !== "all") ? (
                  <TextbookButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setVocabSearch("");
                      setVocabTypeFilter("all");
                      setVocabStatusFilter("all");
                    }}
                  >
                    Reset Vocabulary Filters
                  </TextbookButton>
                ) : undefined
              }
            />
          ) : vocabViewMode === "flip" ? (
            <div className="space-y-6">
              <VocabularyFlashcardDeck
                items={filteredVocab}
                level={book.level}
                srsLookup={srsLookup}
                studyMode={vocabStudyMode}
                keyboardEnabled={!activeDetailVocab}
                onInspectVocab={setSelectedDetailVocab}
                onSrsUpdated={refreshSrsItems}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[var(--tb-text-secondary)] font-semibold">
                  <span>Showing {filteredVocab.length} Flashcards (Tap any card to flip)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allFlipped: Record<string, boolean> = {};
                        filteredVocab.forEach((v) => (allFlipped[v.id] = true));
                        setFlippedVocabCards(allFlipped);
                      }}
                      className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
                    >
                      Flip All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlippedVocabCards({})}
                      className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                </div>

                <ResponsiveGrid columns={3} gap="md">
                  {filteredVocab.map((v) => (
                    <VocabularyCard
                      key={v.id}
                      item={v}
                      level={book.level}
                      srsState={vocabSrsStateById.get(v.id)}
                      viewMode="flip"
                      studyMode={vocabStudyMode}
                      isFlipped={Boolean(flippedVocabCards[v.id])}
                      isKanaRevealed={Boolean(revealedVocabKana[v.id])}
                      onFlip={() =>
                        setFlippedVocabCards((prev) => ({ ...prev, [v.id]: !prev[v.id] }))
                      }
                      onRevealKana={() =>
                        setRevealedVocabKana((prev) => ({ ...prev, [v.id]: true }))
                      }
                      onInspect={() => setSelectedDetailVocab(v)}
                    />
                  ))}
                </ResponsiveGrid>
              </div>
            </div>
          ) : vocabViewMode === "list" ? (
            <VocabularyListTable
              items={filteredVocab}
              level={book.level}
              srsStateById={vocabSrsStateById}
              studyMode={vocabStudyMode}
              learningMode={vocabLearningMode}
              revealedEn={revealedVocabEn}
              revealedKana={revealedVocabKana}
              revealedJa={revealedVocabJa}
              selectedId={activeDetailVocab?.id ?? null}
              onRevealEn={(id) =>
                setRevealedVocabEn((prev) => ({ ...prev, [id]: true }))
              }
              onRevealKana={(id) =>
                setRevealedVocabKana((prev) => ({ ...prev, [id]: true }))
              }
              onRevealJa={(id) =>
                setRevealedVocabJa((prev) => ({ ...prev, [id]: true }))
              }
              onInspect={setSelectedDetailVocab}
            />
          ) : (
            <ResponsiveGrid columns={3} gap="sm">
              {filteredVocab.map((v) => (
                <VocabularyCard
                  key={v.id}
                  item={v}
                  level={book.level}
                  srsState={vocabSrsStateById.get(v.id)}
                  viewMode="grid"
                  studyMode={vocabStudyMode}
                  learningMode={vocabLearningMode}
                  isEnRevealed={Boolean(revealedVocabEn[v.id])}
                  isKanaRevealed={Boolean(revealedVocabKana[v.id])}
                  isJaRevealed={Boolean(revealedVocabJa[v.id])}
                  isSelected={activeDetailVocab?.id === v.id}
                  onRevealEn={() =>
                    setRevealedVocabEn((prev) => ({ ...prev, [v.id]: true }))
                  }
                  onRevealKana={() =>
                    setRevealedVocabKana((prev) => ({ ...prev, [v.id]: true }))
                  }
                  onRevealJa={() =>
                    setRevealedVocabJa((prev) => ({ ...prev, [v.id]: true }))
                  }
                  onInspect={() => setSelectedDetailVocab(v)}
                />
              ))}
            </ResponsiveGrid>
          )}
        </section>
      )}

      {/* TAB 2: GRAMMAR */}
      {activeTab === "grammar" && (
        <section aria-label="Grammar patterns section" className="space-y-6">
          {/* Grammar Overview Header */}
          <ContentContainer padding="sm" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-[var(--tb-text-primary)]">
                    Lesson Grammar Reference
                  </h2>
                  <StatusBadge variant="neutral">
                    {grammarStats.total} Grammar Points
                  </StatusBadge>
                  <StatusBadge variant="info">
                    In FSRS {grammarStats.inSrsCount}
                  </StatusBadge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge variant="mastered">
                    Understood {grammarStats.understoodCount}
                  </StatusBadge>
                  <StatusBadge variant="in-progress">
                    Studying {grammarStats.studyingCount}
                  </StatusBadge>
                  <StatusBadge variant="new">
                    Not Studied {grammarStats.notStudiedCount}
                  </StatusBadge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TextbookButton
                  variant="primary"
                  size="sm"
                  onClick={handlePracticeGrammar}
                  loading={launchingPractice === "grammar"}
                  leftIcon={<Play size={13} fill="currentColor" />}
                >
                  Practice Lesson Grammar Drill
                </TextbookButton>
                <TextbookButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEnqueue("grammar")}
                  disabled={enqueuingSrs}
                  leftIcon={<Zap size={13} />}
                >
                  Enqueue Grammar in FSRS
                </TextbookButton>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--tb-border)]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <SearchInput
                value={grammarSearch}
                onChange={setGrammarSearch}
                placeholder="Search grammar patterns or rules..."
                clearLabel="Clear grammar search"
                size="sm"
                className="w-full lg:max-w-xs"
              />

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Filter grammar by learning status"
                  className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                >
                  {(
                    [
                      { key: "all", label: "All Grammar" },
                      { key: "not-studied", label: "Not Studied" },
                      { key: "studying", label: "Studying" },
                      { key: "understood", label: "Understood" },
                      { key: "in-srs", label: "In FSRS" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={grammarStatusFilter === opt.key}
                      onClick={() => setGrammarStatusFilter(opt.key)}
                      className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        grammarStatusFilter === opt.key
                          ? "bg-[var(--tb-primary)] text-white shadow-xs"
                          : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {availableGrammarLevels.length > 1 && (
                  <div
                    role="group"
                    aria-label="Filter grammar by JLPT level"
                    className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                  >
                    <button
                      type="button"
                      aria-pressed={grammarLevelFilter === "all"}
                      onClick={() => setGrammarLevelFilter("all")}
                      className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        grammarLevelFilter === "all"
                          ? "bg-[var(--tb-primary)] text-white shadow-xs"
                          : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      }`}
                    >
                      All Levels
                    </button>
                    {availableGrammarLevels.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        aria-pressed={grammarLevelFilter === lvl}
                        onClick={() => setGrammarLevelFilter(lvl)}
                        className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          grammarLevelFilter === lvl
                            ? "bg-[var(--tb-primary)] text-white shadow-xs"
                            : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ContentContainer>

          {filteredGrammar.length === 0 ? (
            <EmptyState
              title="No grammar points match your query."
              description="Try searching for a different grammar pattern, rule, or resetting the status filter."
              action={
                grammarSearch ||
                grammarStatusFilter !== "all" ||
                grammarLevelFilter !== "all" ? (
                  <TextbookButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setGrammarSearch("");
                      setGrammarStatusFilter("all");
                      setGrammarLevelFilter("all");
                    }}
                  >
                    Reset Grammar Filters
                  </TextbookButton>
                ) : undefined
              }
            />
          ) : (
            <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">
              {/* Sticky Grammar Table of Contents */}
              <aside
                aria-label="Grammar table of contents"
                className="lg:sticky lg:top-20 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--tb-border)]/70">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--tb-text-secondary)]">
                    Grammar Contents
                  </span>
                  <button
                    type="button"
                    aria-pressed={focusedGrammarPoint === null}
                    onClick={() => handleSelectGrammarPoint(null)}
                    className={`tb-focus-ring rounded-lg px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                      focusedGrammarPoint === null
                        ? "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)]"
                        : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                    }`}
                  >
                    All Points
                  </button>
                </div>

                <nav aria-label="Grammar point navigation" className="space-y-1.5">
                  {filteredGrammar.map((pt) => {
                    const isFocused = focusedGrammarPoint?.id === pt.id;
                    const status = grammarStudyStatus[pt.id] ?? "not-studied";
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() =>
                          handleSelectGrammarPoint(isFocused ? null : pt.id)
                        }
                        className={`tb-focus-ring w-full rounded-xl border p-2.5 text-left transition-all cursor-pointer space-y-1 ${
                          isFocused
                            ? "border-[var(--tb-primary)] bg-[var(--tb-accent-soft)]/50 shadow-2xs"
                            : "border-transparent hover:border-[var(--tb-border)] hover:bg-[var(--tb-bg)]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-japanese text-xs font-extrabold text-[var(--primary-fg)] truncate">
                            #{pt.index} {pt.pattern}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--tb-text-secondary)] shrink-0">
                            L{lesson.lessonNumber}.{pt.index}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-[var(--tb-text-primary)] line-clamp-1">
                          {pt.title}
                        </p>
                        <div>
                          <GrammarStatusBadge status={status} />
                        </div>
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-2 border-t border-[var(--tb-border)]/70">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedGrammarId(null);
                      if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="tb-focus-ring w-full rounded-xl border border-[var(--tb-border)] bg-[var(--tb-bg)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-secondary)] hover:border-[var(--tb-primary)] hover:text-[var(--primary-fg)] transition-colors cursor-pointer"
                  >
                    Return to Lesson Overview
                  </button>
                </div>
              </aside>

              {/* Main Grammar Article Stream */}
              <div className="space-y-6 min-w-0">
                {focusedGrammarPoint && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--tb-border-strong)] bg-[var(--tb-accent-soft)]/40 px-4 py-2.5 text-xs">
                    <span className="font-bold text-[var(--primary-fg)]">
                      Focused on Point #{focusedGrammarPoint.index} of{" "}
                      {filteredGrammar.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={focusedGrammarIdx <= 0}
                        onClick={() =>
                          focusedGrammarIdx > 0 &&
                          handleSelectGrammarPoint(
                            filteredGrammar[focusedGrammarIdx - 1].id
                          )
                        }
                        className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 font-bold text-[var(--tb-text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={
                          focusedGrammarIdx < 0 ||
                          focusedGrammarIdx >= filteredGrammar.length - 1
                        }
                        onClick={() =>
                          focusedGrammarIdx >= 0 &&
                          focusedGrammarIdx < filteredGrammar.length - 1 &&
                          handleSelectGrammarPoint(
                            filteredGrammar[focusedGrammarIdx + 1].id
                          )
                        }
                        className="rounded-lg border border-[var(--tb-border)] bg-[var(--tb-surface)] px-2.5 py-1 font-bold text-[var(--tb-text-primary)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectGrammarPoint(null)}
                        className="rounded-lg bg-[var(--tb-primary)] px-2.5 py-1 font-bold text-white cursor-pointer"
                      >
                        Show All Grammar Points
                      </button>
                    </div>
                  </div>
                )}

                {activeGrammarPoints.map((pt) => {
                  const ptIdx = filteredGrammar.findIndex((g) => g.id === pt.id);
                  const prevPoint =
                    filteredGrammar.length > 1 && ptIdx > 0
                      ? filteredGrammar[ptIdx - 1]
                      : null;
                  const nextPoint =
                    filteredGrammar.length > 1 &&
                    ptIdx >= 0 &&
                    ptIdx < filteredGrammar.length - 1
                      ? filteredGrammar[ptIdx + 1]
                      : null;
                  const linkedPoint = pt.linkedGrammarId
                    ? linkedGrammarMap[pt.linkedGrammarId] ?? null
                    : null;

                  return (
                    <GrammarCard
                      key={pt.id}
                      point={pt}
                      lesson={lesson}
                      level={book.level}
                      linkedPoint={linkedPoint}
                      srsInfo={grammarSrsInfoById.get(pt.id)}
                      studyStatus={grammarStudyStatus[pt.id] ?? "not-studied"}
                      onChangeStudyStatus={(status) =>
                        setGrammarStudyStatus((prev) => ({ ...prev, [pt.id]: status }))
                      }
                      onAddToSrs={async () => {
                        await addGrammarToSrs({
                          id: pt.linkedGrammarId || pt.id,
                          pattern: pt.pattern,
                          romaji: linkedPoint?.romaji,
                          meaning: linkedPoint?.meaning || pt.title,
                          level: pt.linkedGrammarId?.split("/")[0] || book.level,
                        });
                        await refreshSrsItems();
                      }}
                      onOpenPracticeSection={(section) => {
                        setSelectedPracticePart(section.part);
                        selectTab("practice");
                      }}
                      prevPoint={prevPoint}
                      nextPoint={nextPoint}
                      onSelectGrammarPoint={handleSelectGrammarPoint}
                      selfCheckOpen={selfCheckOpen}
                      selfCheckRevealed={selfCheckRevealed}
                      selfCheckFeedback={selfCheckFeedback}
                      onToggleSelfCheck={(checkKey, nextOpen) => {
                        setSelfCheckOpen((prev) => ({ ...prev, [checkKey]: nextOpen }));
                        if (!nextOpen) {
                          setSelfCheckRevealed((prev) => ({ ...prev, [checkKey]: false }));
                        }
                      }}
                      onRevealSelfCheck={(checkKey) =>
                        setSelfCheckRevealed((prev) => ({ ...prev, [checkKey]: true }))
                      }
                      onRateSelfCheck={(checkKey, rating) =>
                        setSelfCheckFeedback((prev) => ({ ...prev, [checkKey]: rating }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: KANJI */}
      {activeTab === "kanji" && (
        <section aria-label="Kanji characters section" className="space-y-6">
          {lesson.kanji.length === 0 ? (
            <div className="space-y-6">
              <ContentContainer padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[var(--tb-primary-soft)] font-japanese text-sm font-black text-[var(--primary-fg)]">
                      {lesson.lessonNumber === 2 ? "ア" : "あ"}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-[var(--tb-text-primary)]">
                      Hiragana &amp; Katakana Foundation
                    </h2>
                    <StatusBadge variant="info">
                      {lesson.lessonNumber === 2 ? "Lesson 2 · Katakana" : "Lesson 1 · Hiragana"}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-[var(--tb-text-secondary)]">
                    {lesson.lessonNumber === 2
                      ? "Lesson 2 focuses on mastering the Katakana syllabary (Basic, Dakuten, Yōon, and Extended Katakana). Kanji instruction begins in Lesson 3."
                      : "Lesson 1 focuses on mastering the Hiragana syllabary (Basic, Dakuten, and Yōon). Kanji instruction begins in Lesson 3."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href="/games/kana"
                    className="tb-focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--tb-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--tb-primary-hover)] transition-colors"
                  >
                    <span>Practice Kana Drills</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href={`/books/${bookId}/3`}
                    className="tb-focus-ring inline-flex items-center gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] px-4 py-2 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors"
                  >
                    <span>Jump to Lesson 3 Kanji</span>
                  </Link>
                </div>
              </ContentContainer>

              <KanaRevisionSheet
                key={`lesson-kana-sheet-${lesson.lessonNumber}`}
                fixedScript={lesson.lessonNumber === 2 ? "katakana" : "hiragana"}
                embedded
              />
            </div>
          ) : (
            <>
              {/* Kanji Overview & Actions */}
              <ContentContainer padding="sm" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-extrabold text-[var(--tb-text-primary)]">
                        Lesson Kanji &amp; Stroke Studio
                      </h2>
                      <StatusBadge variant="neutral">
                        {kanjiStats.total} Kanji
                      </StatusBadge>
                      <StatusBadge variant="info">
                        Studied {kanjiStats.studied}
                      </StatusBadge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <StatusBadge variant="new">New {kanjiStats.newCount}</StatusBadge>
                      <StatusBadge variant="in-progress">
                        Learning {kanjiStats.learningCount}
                      </StatusBadge>
                      <StatusBadge variant="mastered">
                        Mastered {kanjiStats.masteredCount}
                      </StatusBadge>
                      <StatusBadge variant="due">Due {kanjiStats.dueCount}</StatusBadge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <TextbookButton
                      variant="primary"
                      size="sm"
                      onClick={handlePracticeKanji}
                      loading={launchingPractice === "kanji"}
                      leftIcon={<Play size={13} fill="currentColor" />}
                    >
                      Practice Lesson Kanji Drill
                    </TextbookButton>
                    <TextbookButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEnqueue("kanji")}
                      disabled={enqueuingSrs}
                      leftIcon={<Zap size={13} />}
                    >
                      Enqueue Kanji in FSRS
                    </TextbookButton>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--tb-border)]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <SearchInput
                    value={kanjiSearch}
                    onChange={setKanjiSearch}
                    placeholder="Search character, meaning, reading..."
                    clearLabel="Clear kanji search"
                    size="sm"
                    className="w-full lg:max-w-xs"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Stroke Count Filter */}
                    <div
                      role="group"
                      aria-label="Filter kanji by stroke count"
                      className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                    >
                      {(
                        [
                          { key: "all", label: "All Strokes" },
                          { key: "1-4", label: "1–4 画" },
                          { key: "5-8", label: "5–8 画" },
                          { key: "9+", label: "9+ 画" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          aria-pressed={kanjiStrokeFilter === opt.key}
                          onClick={() => setKanjiStrokeFilter(opt.key)}
                          className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            kanjiStrokeFilter === opt.key
                              ? "bg-[var(--tb-primary)] text-white shadow-xs"
                              : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* FSRS Status Filter */}
                    <div
                      role="group"
                      aria-label="Filter kanji by FSRS status"
                      className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                    >
                      {(
                        [
                          { key: "all", label: "All Status" },
                          { key: "new", label: "New" },
                          { key: "learning", label: "Learning" },
                          { key: "mastered", label: "Mastered" },
                          { key: "due", label: "Due" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          aria-pressed={kanjiStatusFilter === opt.key}
                          onClick={() => setKanjiStatusFilter(opt.key)}
                          className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            kanjiStatusFilter === opt.key
                              ? "bg-[var(--tb-primary)] text-white shadow-xs"
                              : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {availableKanjiJlptLevels.length > 1 && (
                      <div
                        role="group"
                        aria-label="Filter kanji by JLPT level"
                        className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                      >
                        <button
                          type="button"
                          aria-pressed={kanjiJlptFilter === "all"}
                          onClick={() => setKanjiJlptFilter("all")}
                          className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            kanjiJlptFilter === "all"
                              ? "bg-[var(--tb-primary)] text-white shadow-xs"
                              : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                          }`}
                        >
                          All JLPT
                        </button>
                        {availableKanjiJlptLevels.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            aria-pressed={kanjiJlptFilter === lvl}
                            onClick={() => setKanjiJlptFilter(lvl)}
                            className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                              kanjiJlptFilter === lvl
                                ? "bg-[var(--tb-primary)] text-white shadow-xs"
                                : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Display Mode Switcher */}
                    <div
                      role="group"
                      aria-label="Kanji display mode"
                      className="flex items-center gap-1 rounded-2xl border border-[var(--tb-border)] bg-[var(--tb-bg)] p-1"
                    >
                      <button
                        type="button"
                        aria-pressed={kanjiViewMode === "grid"}
                        onClick={() => setKanjiViewMode("grid")}
                        className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          kanjiViewMode === "grid"
                            ? "bg-[var(--tb-primary)] text-white shadow-xs"
                            : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                        }`}
                        title="Grid View"
                      >
                        <LayoutGrid size={13} />
                        <span>Grid</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={kanjiViewMode === "list"}
                        onClick={() => setKanjiViewMode("list")}
                        className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                          kanjiViewMode === "list"
                            ? "bg-[var(--tb-primary)] text-white shadow-xs"
                            : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                        }`}
                        title="List View"
                      >
                        <List size={13} />
                        <span>List</span>
                      </button>
                    </div>
                  </div>
                </div>
              </ContentContainer>

              {filteredKanji.length === 0 ? (
                <EmptyState
                  title="No kanji match your query."
                  description="Try clearing the search query or resetting stroke count, status, and JLPT filters."
                  action={
                    kanjiSearch ||
                    kanjiStatusFilter !== "all" ||
                    kanjiStrokeFilter !== "all" ||
                    kanjiJlptFilter !== "all" ? (
                      <TextbookButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setKanjiSearch("");
                          setKanjiStatusFilter("all");
                          setKanjiStrokeFilter("all");
                          setKanjiJlptFilter("all");
                        }}
                      >
                        Reset Kanji Filters
                      </TextbookButton>
                    ) : undefined
                  }
                />
              ) : kanjiViewMode === "list" ? (
                <KanjiListTable
                  items={filteredKanji}
                  defaultJlpt={defaultKanjiJlpt}
                  srsStateById={kanjiSrsStateById}
                  vocabCountById={kanjiVocabCountById}
                  selectedId={selectedStrokeKanji?.id ?? null}
                  onOpenStrokeOrder={setSelectedStrokeKanji}
                />
              ) : (
                <ResponsiveGrid columns={3} gap="md">
                  {filteredKanji.map((k) => (
                    <KanjiCard
                      key={k.id}
                      kanji={k}
                      defaultJlpt={defaultKanjiJlpt}
                      srsState={kanjiSrsStateById.get(k.id)}
                      exampleVocabCount={kanjiVocabCountById.get(k.id) ?? 0}
                      onOpenStrokeOrder={setSelectedStrokeKanji}
                    />
                  ))}
                </ResponsiveGrid>
              )}
            </>
          )}

          <KanjiDetailModal
            kanjiItem={selectedStrokeKanji}
            items={filteredKanji.length > 0 ? filteredKanji : lesson.kanji}
            lesson={lesson}
            defaultJlpt={defaultKanjiJlpt}
            srsLookup={srsLookup}
            onClose={() => setSelectedStrokeKanji(null)}
            onSelectKanji={setSelectedStrokeKanji}
            onSelectVocab={(vocabItem) => {
              setSelectedStrokeKanji(null);
              setSelectedDetailVocab(vocabItem);
            }}
            onSrsUpdated={refreshSrsItems}
          />
        </section>
      )}

      {/* TAB 4: DIALOGUES */}
      {activeTab === "dialogues" && (
        <section aria-label="Dialogues section" className="space-y-6">
          <ContentContainer padding="md" className="space-y-4 rounded-3xl border border-[var(--tb-border)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-black text-[var(--tb-text-primary)]">
                    会話 Dialogue Workspace
                  </h3>
                  <StatusBadge variant="in-progress">
                    {dialogueProgressStats.completedScenes} / {dialogueProgressStats.totalScenes} Mastered
                  </StatusBadge>
                  <span className="text-xs font-bold text-[var(--tb-text-secondary)]">
                    {dialogueProgressStats.totalLines} lines · {dialogueProgressStats.uniqueSpeakersCount} speakers
                  </span>
                </div>
                <p className="text-xs text-[var(--tb-text-secondary)]">
                  Master natural conversational flow, register shifts, and authentic pacing with interactive audio, shadowing, and sentence lookups.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTapLookupEnabled((prev) => !prev)}
                  className={`tb-focus-ring inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    tapLookupEnabled
                      ? "border-[var(--tb-primary)]/50 bg-[var(--tb-accent-soft)]/50 text-[var(--primary-fg)]"
                      : "border-[var(--tb-border)] bg-[var(--surface-overlay)] text-[var(--tb-text-secondary)]"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>{tapLookupEnabled ? "Tap-to-Lookup: ON" : "Tap-to-Lookup: OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDialogueCloze((prev) => !prev)}
                  className={`tb-focus-ring inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    showDialogueCloze
                      ? "border-[var(--tb-primary)] bg-[var(--tb-primary)] text-white"
                      : "border-[var(--tb-border)] bg-[var(--surface-overlay)] text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)]"
                  }`}
                >
                  <HelpCircle size={14} />
                  <span>{showDialogueCloze ? "Hide Cloze Test" : "Grammar Cloze Test"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnglishDialogues((prev) => !prev)}
                  className="tb-focus-ring inline-flex items-center gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs font-bold text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)] transition-colors cursor-pointer"
                >
                  {showEnglishDialogues ? (
                    <>
                      <EyeOff size={14} className="text-[var(--tb-text-secondary)]" />
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

            {/* Mode Switcher & Scene Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tb-border)]/80 pt-3">
              {/* 5 Learning Modes */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--tb-text-secondary)] mr-1">
                  Mode:
                </span>
                {(
                  [
                    { key: "reading", label: "Reading", icon: BookOpen },
                    { key: "listening", label: "Listening", icon: Headphones },
                    { key: "shadowing", label: "Shadowing", icon: Volume2 },
                    { key: "roleplay", label: "Role-play", icon: Users },
                    { key: "vocab", label: "Vocabulary", icon: Sparkles },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const isActive = dialogueLearningMode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setDialogueLearningMode(m.key)}
                      className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                          : "border border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] hover:border-[var(--tb-primary)]/40"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pacing Speed & Scene Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[var(--tb-text-secondary)]">
                    Pace:
                  </span>
                  <div className="inline-flex rounded-xl border border-[var(--tb-border)] bg-[var(--tb-surface)] p-0.5">
                    {[0.75, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setDialoguePlaybackRate(rate)}
                        className={`tb-focus-ring rounded-lg px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                          dialoguePlaybackRate === rate
                            ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                            : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {lesson.dialogues && lesson.dialogues.length > 1 && (
                  <div className="flex items-center gap-1 border-l border-[var(--tb-border)] pl-2.5">
                    <button
                      type="button"
                      onClick={() => setDialogueActiveSceneFilter("all")}
                      className={`tb-focus-ring rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        dialogueActiveSceneFilter === "all"
                          ? "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] font-black"
                          : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                      }`}
                    >
                      All Scenes
                    </button>
                    {lesson.dialogues.map((sc) => {
                      const isScActive = dialogueActiveSceneFilter === sc.id;
                      const isScDone = completedDialogueIds.includes(sc.id);
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setDialogueActiveSceneFilter(sc.id)}
                          className={`tb-focus-ring inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            isScActive
                              ? "bg-[var(--tb-accent-soft)] text-[var(--primary-fg)] font-black"
                              : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                          }`}
                        >
                          {isScDone && <Check size={11} className="text-emerald-500" />}
                          <span>Scene {sc.sceneNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ContentContainer>

          {showDialogueCloze && (
            <DialogueClozeTest
              lesson={lesson}
              showEnglish={showEnglishDialogues}
              onClose={() => setShowDialogueCloze(false)}
            />
          )}

          {/* Genki Dialogue Quest Branching Adventure Banner */}
          <ContentContainer
            padding="md"
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-[var(--tb-primary)]/25 bg-[var(--tb-accent-soft)]/25"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--primary-fg)]" />
                <h4 className="text-sm font-black text-[var(--tb-text-primary)]">
                  {book.id === "genki-1"
                    ? "Genki I Dialogue Quest: Little Asia Restaurant"
                    : "Genki II Dialogue Quest: Meeting Manager Yamada (Keigo)"}
                </h4>
              </div>
              <p className="text-xs text-[var(--tb-text-secondary)]">
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
              className="tb-focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--tb-primary)] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[var(--tb-primary-hover)] active:scale-95 transition-all"
            >
              <Play size={14} />
              <span>Play Dialogue Quest</span>
            </Link>
          </ContentContainer>

          {!lesson.dialogues || lesson.dialogues.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={36} />}
              title="No dialogues recorded for this lesson yet"
              description="Dialogue scenes are currently being transcribed from textbook materials."
            />
          ) : (
            <div className="space-y-6">
              {visibleDialogueScenes.map((scene) =>
                activeRoleplaySceneId === scene.id ? (
                  <DialogueRoleplayPlayer
                    key={scene.id}
                    scene={scene}
                    showEnglish={showEnglishDialogues}
                    onClose={() => {
                      stopAllDialogueAudio();
                      setActiveRoleplaySceneId(null);
                    }}
                  />
                ) : (
                  <DialogueCard
                    key={scene.id}
                    scene={scene}
                    lesson={lesson}
                    level={book.level}
                    showEnglish={showEnglishDialogues}
                    tapLookupEnabled={tapLookupEnabled}
                    isPlayingScene={playingSceneId === scene.id}
                    playingLineIndex={playingSceneId === scene.id ? playingLineIndex : -1}
                    dictMaps={dictMaps}
                    kuromojiLineMap={kuromojiLineMap}
                    learningMode={dialogueLearningMode}
                    isCompleted={completedDialogueIds.includes(scene.id)}
                    onToggleComplete={() => toggleDialogueCompleted(scene.id)}
                    onTogglePlayScene={() => void togglePlayFullScene(scene)}
                    onStartRoleplay={() => {
                      stopAllDialogueAudio();
                      markDialogueCompleted(scene.id);
                      setActiveRoleplaySceneId(scene.id);
                    }}
                    onSelectVocab={(vocabItem) => {
                      setSelectedDetailVocab(vocabItem);
                    }}
                  />
                )
              )}
            </div>
          )}
        </section>
      )}

      {/* TAB 5: PRACTICE */}
      {activeTab === "practice" && (
        <section aria-label="Practice Drills Section" className="space-y-6">
          <ContentContainer
            padding="md"
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[var(--tb-text-primary)]">
                  練習 Practice Drills
                </h3>
                <StatusBadge variant="neutral">
                  {practiceDashboardStats.totalExercises} Exercises
                </StatusBadge>
                {practiceDashboardStats.attemptedCount > 0 && (
                  <>
                    <StatusBadge variant="info">
                      {practiceDashboardStats.attemptedCount} / {practiceDashboardStats.totalExercises} Attempted
                    </StatusBadge>
                    <StatusBadge variant="mastered">
                      {practiceDashboardStats.accuracyPercent}% Accuracy
                    </StatusBadge>
                  </>
                )}
              </div>
              <p className="text-xs text-[var(--tb-text-secondary)]">
                Textbook practice exercises for Lesson {lesson.lessonNumber}. Test your skills and
                reveal model answers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {practiceDashboardStats.attemptedCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--tb-border)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {practiceDashboardStats.correctCount} / {practiceDashboardStats.attemptedCount} Correct
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPracticeFeedback({});
                      setUserPracticeInputs({});
                    }}
                    title="Reset practice attempts"
                    className="text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              )}

              <div className="inline-flex rounded-xl border border-[var(--tb-border)] bg-[var(--surface-overlay)] p-0.5">
                <button
                  type="button"
                  onClick={() => setWorkbookDrillMode(false)}
                  className={`tb-focus-ring px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    !workbookDrillMode
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  Worksheet View
                </button>
                <button
                  type="button"
                  onClick={() => setWorkbookDrillMode(true)}
                  className={`tb-focus-ring px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    workbookDrillMode
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  <Zap size={13} className="inline mr-1" />
                  Workbook Drill Mode
                </button>
              </div>

              {!workbookDrillMode && (
                <button
                  type="button"
                  onClick={handleCheckAllAnswered}
                  disabled={!hasAnyAnsweredInput}
                  className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                    hasAnyAnsweredInput
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                      : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)]/50 opacity-60 cursor-not-allowed"
                  }`}
                  title="Check all currently filled answers across visible exercises"
                >
                  <CheckCheck size={14} />
                  <span>Check All Answered</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPracticeRomajiIme((prev) => !prev)}
                className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  practiceRomajiIme
                    ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)]"
                }`}
                title="Convert typed Romaji to Hiragana automatically"
              >
                <Keyboard size={14} />
                <span>{practiceRomajiIme ? "Romaji IME: ON" : "Romaji IME: OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoEnqueueMissed((prev) => !prev)}
                className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  autoEnqueueMissed
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-[var(--tb-border)] bg-[var(--tb-surface)] text-[var(--tb-text-secondary)]"
                }`}
                title="Automatically add missed workbook items to your FSRS review queue"
              >
                <span>{autoEnqueueMissed ? "Auto-FSRS Missed: ON" : "Auto-FSRS Missed: OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAllPracticeAnswers((prev) => !prev)}
                className="tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--tb-border)] bg-[var(--surface-overlay)] px-3.5 py-2 text-xs font-bold text-[var(--tb-text-primary)] hover:bg-[var(--tb-border)]/40 transition-colors cursor-pointer"
              >
                {showAllPracticeAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>
                  {showAllPracticeAnswers ? "Hide All Model Answers" : "Reveal All Model Answers"}
                </span>
              </button>

              <TextbookButton
                variant="primary"
                size="sm"
                onClick={handlePracticeGrammar}
                disabled={launchingPractice !== null}
                leftIcon={<Play size={14} />}
              >
                Grammar Drill Mode
              </TextbookButton>
            </div>
          </ContentContainer>

          {/* Category Filter Chips */}
          {practiceDashboardStats.categoryBreakdown.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--tb-text-secondary)] mr-1">
                Category:
              </span>
              <button
                type="button"
                onClick={() => setPracticeCategoryFilter("all")}
                className={`tb-focus-ring rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  practiceCategoryFilter === "all"
                    ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                    : "border border-[var(--tb-border)] bg-[var(--surface-overlay)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                }`}
              >
                All Categories ({practiceDashboardStats.totalExercises})
              </button>
              {practiceDashboardStats.categoryBreakdown.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() =>
                    setPracticeCategoryFilter((prev) => (prev === cat.type ? "all" : cat.type))
                  }
                  className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    practiceCategoryFilter === cat.type
                      ? "bg-[var(--tb-primary)] text-white shadow-2xs"
                      : "border border-[var(--tb-border)] bg-[var(--surface-overlay)] text-[var(--tb-text-secondary)] hover:text-[var(--tb-text-primary)]"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      practiceCategoryFilter === cat.type
                        ? "bg-white/20 text-white"
                        : "bg-[var(--tb-border)]/60 text-[var(--tb-text-secondary)]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterDropdown
                label="Filter practice sections by part"
                value={selectedPracticePart}
                onChange={setSelectedPracticePart}
                options={[
                  { key: "all", label: "All Parts", count: practiceParts.length },
                  ...practiceParts.map((part) => ({
                    key: part,
                    label: `Part ${part}`,
                  })),
                ]}
              />

              {practiceDashboardStats.missedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPracticeMissedOnly((prev) => !prev)}
                  className={`tb-focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    practiceMissedOnly
                      ? "border-rose-500 bg-rose-500 text-white shadow-2xs"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                  }`}
                  title="Filter to show only missed exercises"
                >
                  <Filter size={13} />
                  <span>Missed Only ({practiceDashboardStats.missedCount})</span>
                </button>
              )}
            </div>

            <SearchInput
              value={practiceSearch}
              onChange={setPracticeSearch}
              placeholder="Search practice cues, prompts, answers..."
              clearLabel="Clear practice search"
              size="sm"
              className="flex-1 min-w-[200px]"
            />
          </div>

          {workbookDrillMode ? (
            <WorkbookDrillMode
              sections={filteredPractice}
              autoEnqueueMissed={autoEnqueueMissed}
              onMissedItem={enqueueMissedPracticeItem}
              onClose={() => setWorkbookDrillMode(false)}
              initialRomajiIme={practiceRomajiIme}
            />
          ) : filteredPractice.length === 0 ? (
            <EmptyState
              icon={<Pencil size={36} />}
              title={
                practiceMissedOnly
                  ? "No missed exercises remaining!"
                  : "No practice sections found"
              }
              description={
                practiceMissedOnly
                  ? "Great job! You've mastered all the exercises you previously missed."
                  : "Try adjusting your part filter or search query."
              }
              action={
                practiceMissedOnly ? (
                  <TextbookButton
                    variant="primary"
                    size="sm"
                    onClick={() => setPracticeMissedOnly(false)}
                  >
                    Show All Exercises
                  </TextbookButton>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-6">
              {practiceMissedOnly && (
                <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                    <Filter size={14} />
                    <span>
                      Targeted review: Showing{" "}
                      {filteredPractice.reduce((acc, s) => acc + s.items.length, 0)} missed exercise
                      {filteredPractice.reduce((acc, s) => acc + s.items.length, 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPracticeMissedOnly(false)}
                    className="font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                  >
                    Show All Exercises
                  </button>
                </div>
              )}

              {filteredPractice.map((section) => (
                <ExerciseCard
                  key={section.id}
                  section={section}
                  userInputs={userPracticeInputs}
                  feedbackMap={practiceFeedback}
                  revealedAnswers={revealedPracticeAnswers}
                  showAllAnswers={showAllPracticeAnswers}
                  missedEnqueuedIds={missedEnqueuedIds}
                  romajiImeEnabled={practiceRomajiIme}
                  onInputChange={(itemId, val) =>
                    setUserPracticeInputs((prev) => ({ ...prev, [itemId]: val }))
                  }
                  onCheckAnswer={checkPracticeAnswer}
                  onToggleAnswer={togglePracticeAnswer}
                  onEnqueueMissed={(item, sec) => void enqueueMissedPracticeItem(item, sec)}
                  onCheckSectionAnswers={handleCheckSectionAnswers}
                />
              ))}
            </div>
          )}
        </section>
      )}
      </div>

      <VocabularyDetailDrawer
        vocabItem={activeDetailVocab}
        items={filteredVocab.length > 0 ? filteredVocab : lesson.vocabulary}
        bookTitle={book.title.split(":")[0].trim()}
        lesson={lesson}
        level={book.level}
        srsLookup={srsLookup}
        dictMaps={dictMaps}
        onClose={() => setSelectedDetailVocab(null)}
        onSelectVocab={setSelectedDetailVocab}
        onSrsUpdated={refreshSrsItems}
      />
    </TextbookPageContainer>
  );
}
