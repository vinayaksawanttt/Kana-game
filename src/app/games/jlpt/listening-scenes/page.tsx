"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  Headphones,
  Sparkles,
} from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  createListeningSceneSession,
  getListeningSceneCountsByLevel,
  type ListeningSceneLevel,
} from "@/engine/jlptListeningScene";
import {
  ALL_LISTENING_SCENES,
  loadListeningScenesForLevels,
} from "@/data/jlpt/listeningScenesData";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

const LEVEL_OPTIONS: readonly ListeningSceneLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const SCENE_COUNTS: readonly (3 | 5 | 10)[] = [3, 5, 10];
const STORAGE_KEY = "jlpt-listening-scenes-settings";

interface SavedSettings {
  levels: ListeningSceneLevel[];
  sceneCount: 3 | 5 | 10;
  mode: "exam" | "study";
}

function loadSavedSettings(): Partial<SavedSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedSettings>) : null;
  } catch {
    return null;
  }
}

function persistSettings(settings: SavedSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore local storage write errors
  }
}

function ListeningScenesSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();

  const saved = useMemo(() => loadSavedSettings(), []);

  const initialLevels = useMemo<ListeningSceneLevel[]>(() => {
    if (levelParam) {
      if (levelParam === "ALL") return [...LEVEL_OPTIONS];
      const normalized = (levelParam.startsWith("N")
        ? levelParam
        : `N${levelParam}`) as ListeningSceneLevel;
      if (LEVEL_OPTIONS.includes(normalized)) {
        return [normalized];
      }
    }
    if (saved?.levels && saved.levels.length > 0) {
      const valid = saved.levels.filter((l) => LEVEL_OPTIONS.includes(l));
      if (valid.length > 0) return valid;
    }
    return ["N5"];
  }, [levelParam, saved]);

  const [selectedLevels, setSelectedLevels] =
    useState<ListeningSceneLevel[]>(initialLevels);
  const [sceneCount, setSceneCount] = useState<3 | 5 | 10>(
    saved?.sceneCount && SCENE_COUNTS.includes(saved.sceneCount)
      ? saved.sceneCount
      : 3
  );
  const [mode, setMode] = useState<"exam" | "study">(
    saved?.mode === "study" ? "study" : "exam"
  );

  useEffect(() => {
    persistSettings({ levels: selectedLevels, sceneCount, mode });
  }, [selectedLevels, sceneCount, mode]);

  const pool = useMemo(
    () => loadListeningScenesForLevels(selectedLevels),
    [selectedLevels]
  );

  const countsByLevel = useMemo(
    () => getListeningSceneCountsByLevel(ALL_LISTENING_SCENES),
    []
  );

  const availablePoolCount = pool.length;

  function toggleLevel(level: ListeningSceneLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort((a, b) => {
        const numA = parseInt(a.replace("N", ""), 10);
        const numB = parseInt(b.replace("N", ""), 10);
        return numB - numA;
      });
    });
  }

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([...LEVEL_OPTIONS]);
    } else {
      const normalized = (lvlStr.startsWith("N")
        ? lvlStr.toUpperCase()
        : `N${lvlStr}`) as ListeningSceneLevel;
      if (LEVEL_OPTIONS.includes(normalized)) {
        setSelectedLevels([normalized]);
      }
    }
  }

  function handleStartSession() {
    const session = createListeningSceneSession(pool, {
      levels: selectedLevels,
      sceneCount,
      mode,
    });

    saveGameSession("jlpt-scene", session.sessionId, session);
    router.push(`/games/jlpt/listening-scenes/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === LEVEL_OPTIONS.length
      ? "ALL"
      : selectedLevels[0] ?? "N5";

  const instructions = (
    <div className="space-y-3 font-japanese text-xs leading-relaxed text-[var(--ink)]">
      <p className="font-bold">
        はじめに質問を聞いてください。それから話を聞いて、問題用紙の1から4の中からいちばんいいものを一つ選んでください。
      </p>
      <div className="rounded border border-[var(--ink)]/15 bg-[var(--bg)]/40 p-3 text-[11px] text-[var(--muted)]">
        <div className="font-bold text-[var(--ink)]">
          【 聴解 実施上の注意 · Listening Exam Protocol 】
        </div>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>音声は一度しか流れません。話の途中で選択肢を選ぶことはできません。</li>
          <li>問題文の繰り返し（質問文）が終わると、1〜4の選択肢が解答可能になります。</li>
          <li>イラストや書類の状況・手順・時間順序・人間関係を注意深く聞き取ってください。</li>
        </ul>
      </div>
    </div>
  );

  return (
    <JlptBookletSetupShell
      label="AUDIO LISTENING SCENE · 問題 1・2"
      glyph="聴"
      homeHref="/games/jlpt"
      sectionTag="第3部：聴解 · Mondai 1・2"
      sectionTitle={
        <span>
          課題理解 · ポイント理解
          <span className="block text-xs font-normal text-[var(--muted)]">
            Real-World Audio Listening Scene & Task Detail Sniper
          </span>
        </span>
      }
      mondaiBadge="問題 1・2"
      supportedLevels={LEVEL_OPTIONS}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="scenes in active pool"
      instructions={instructions}
    >
      <div className="space-y-6">
        {/* Exam Question Box 1: JLPT Level Selection */}
        <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-5 shadow-xs">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--ink)]/10 pb-2">
            <span className="font-mono text-xs font-bold text-[var(--primary-fg)]">
              問 1 · Target Level Selection
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              Multiple tiers allowed
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {LEVEL_OPTIONS.map((lvl) => {
              const active = selectedLevels.includes(lvl);
              const count = countsByLevel[lvl] ?? 0;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => toggleLevel(lvl)}
                  aria-pressed={active}
                  className={`flex flex-1 min-w-[70px] flex-col items-center justify-center rounded-sm border px-3 py-2 text-center transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/20 bg-[var(--bg)]/40 text-[var(--muted)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)]"
                  }`}
                >
                  <span className="font-mono text-sm font-black">{lvl}</span>
                  <span className="text-[10px] opacity-75">{count} scenes</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 2: Scene Count Selection */}
        <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-5 shadow-xs">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--ink)]/10 pb-2">
            <span className="font-mono text-xs font-bold text-[var(--primary-fg)]">
              問 2 · Drill Length
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              Number of listening scenes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {SCENE_COUNTS.map((cnt) => {
              const active = sceneCount === cnt;
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSceneCount(cnt)}
                  aria-pressed={active}
                  className={`flex flex-col items-center justify-center rounded-sm border py-2.5 text-center transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs font-bold"
                      : "border-[var(--ink)]/20 bg-[var(--bg)]/40 text-[var(--muted)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)]"
                  }`}
                >
                  <span className="font-mono text-base font-black">{cnt}</span>
                  <span className="text-[10px]">
                    {cnt === 3 ? "Standard" : cnt === 5 ? "Extended" : "Marathon"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 3: Exam Mode */}
        <div className="rounded-sm border border-[var(--ink)]/20 bg-[var(--surface)] p-5 shadow-xs">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--ink)]/10 pb-2">
            <span className="font-mono text-xs font-bold text-[var(--primary-fg)]">
              問 3 · Examination Mode
            </span>
            <span className="text-[11px] text-[var(--muted)]">
              Visual cue & audio protocol
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMode("exam")}
              aria-pressed={mode === "exam"}
              className={`flex flex-col rounded-sm border p-3 text-left transition ${
                mode === "exam"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/20 bg-[var(--bg)]/40 text-[var(--muted)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} aria-hidden="true" />
                <span className="font-bold text-xs">Official JLPT Exam Mode</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed opacity-85">
                Single-pass audio playback. MCQ options are locked until the narrator repeats the closing question.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("study")}
              aria-pressed={mode === "study"}
              className={`flex flex-col rounded-sm border p-3 text-left transition ${
                mode === "study"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/20 bg-[var(--bg)]/40 text-[var(--muted)] hover:border-[var(--ink)]/40 hover:text-[var(--ink)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Headphones size={16} aria-hidden="true" />
                <span className="font-bold text-xs">Guided Study Mode</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed opacity-85">
                Practice mode with dialogue replay available after answering and bonus comprehension questions.
              </p>
            </button>
          </div>
        </div>

        {/* Start Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
            <Sparkles size={16} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span>
              Ready with <strong>{Math.min(sceneCount, availablePoolCount)}</strong> scene
              {Math.min(sceneCount, availablePoolCount) === 1 ? "" : "s"} from{" "}
              <strong>{selectedLevels.join(", ")}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={availablePoolCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 disabled:opacity-40"
          >
            <span>演習をはじめる / Start Listening Scene Drill →</span>
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function ListeningScenesSetupPage() {
  return (
    <Suspense fallback={null}>
      <ListeningScenesSetupContent />
    </Suspense>
  );
}
