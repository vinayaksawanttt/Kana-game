"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Headphones,
  MapPin,
  Sparkles,
  Volume2,
} from "lucide-react";
import { saveGameSession } from "@/lib/game-core/storage";
import { playGameSfx } from "@/lib/game-core/sfx";
import {
  INSTANT_REPLY_ITEMS,
  createInstantReplySession,
  formatJlptLevel,
  getInstantReplyCountsByLevel,
  type InstantReplySessionSize,
  type JlptNumericLevel,
  type TimerPreset,
} from "@/engine/jlptInstantReply";
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

const LEVEL_OPTIONS: readonly JlptNumericLevel[] = [5, 4, 3, 2, 1];
const SESSION_SIZES: readonly InstantReplySessionSize[] = [10, 15, 20];
const TIMER_PRESETS: ReadonlyArray<{
  value: TimerPreset;
  title: string;
  subtitle: string;
}> = [
  {
    value: 8,
    title: "8s Exam Blitz (Official)",
    subtitle: "Authentic JLPT Mondai 4/5 split-second audio reflex window.",
  },
  {
    value: 12,
    title: "12s Standard",
    subtitle: "Extra breathing room to process keigo and conversational nuance.",
  },
  {
    value: 0,
    title: "Untimed Practice",
    subtitle: "No countdown pressure — replay and analyze each reply at your own pace.",
  },
];

function InstantReplySetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();
  const modeParam = searchParams.get("mode")?.toLowerCase();

  const initialLevels = useMemo<JlptNumericLevel[]>(() => {
    if (!levelParam) return [5];
    if (levelParam === "ALL") return [5, 4, 3, 2, 1];
    const num = parseInt(levelParam.replace("N", ""), 10);
    if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
      return [num as JlptNumericLevel];
    }
    return [5];
  }, [levelParam]);

  const initialCategory = useMemo<"all" | "situational-utterance" | "quick-response">(() => {
    if (modeParam === "situational" || modeParam === "situational-utterance" || modeParam === "mondai3") {
      return "situational-utterance";
    }
    if (modeParam === "quick" || modeParam === "quick-response" || modeParam === "mondai4") {
      return "quick-response";
    }
    return "all";
  }, [modeParam]);

  const [selectedLevels, setSelectedLevels] = useState<JlptNumericLevel[]>(initialLevels);
  const [categoryMode, setCategoryMode] = useState<"all" | "situational-utterance" | "quick-response">(initialCategory);
  const [timerSeconds, setTimerSeconds] = useState<TimerPreset>(8);
  const [autoSequenceAudio, setAutoSequenceAudio] = useState<boolean>(true);
  const [showSituationHint, setShowSituationHint] = useState<boolean>(true);
  const [size, setSize] = useState<InstantReplySessionSize>(10);

  const countsByLevel = useMemo(
    () => getInstantReplyCountsByLevel(INSTANT_REPLY_ITEMS),
    [],
  );

  const availablePoolCount = useMemo(() => {
    const levelSet = new Set(selectedLevels);
    return INSTANT_REPLY_ITEMS.filter((item) => {
      if (!levelSet.has(item.jlpt)) return false;
      if (categoryMode !== "all" && (item.category ?? "quick-response") !== categoryMode) return false;
      return true;
    }).length;
  }, [categoryMode, selectedLevels]);

  function toggleLevel(level: JlptNumericLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort((a, b) => b - a);
    });
  }

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([5, 4, 3, 2, 1]);
    } else {
      const num = parseInt(lvlStr.replace("N", ""), 10);
      if (LEVEL_OPTIONS.includes(num as JlptNumericLevel)) {
        setSelectedLevels([num as JlptNumericLevel]);
      }
    }
  }

  function handleStartSession() {
    const session = createInstantReplySession(INSTANT_REPLY_ITEMS, {
      levels: selectedLevels,
      size,
      timerSeconds,
      autoSequenceAudio,
      showSituationHint,
      category: categoryMode,
    });
    saveGameSession("jlpt-reply", session.sessionId, session);
    playGameSfx("temple-bell-gong");
    router.push(`/games/jlpt/instant-reply/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === LEVEL_OPTIONS.length
      ? "ALL"
      : formatJlptLevel(selectedLevels[0] ?? 5);

  return (
    <JlptBookletSetupShell
      label="INSTANT REPLY BLITZ · 即時応答"
      glyph="応"
      sectionTag="第3部：聴解 · 問題 3・4 (即時応答)"
      mondaiBadge="聴解・即時応答"
      sectionTitle={
        <span>
          聴解・即時応答 <span className="text-xl font-normal text-[var(--muted)] sm:text-2xl">(Instant Reply Blitz)</span>
        </span>
      }
      sectionSubtitle="短い音声発話を聞いて、反射的に最も適切な返答を瞬時に選び取る聴解訓練"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="spoken triads in active pool"
      instructions={
        <div className="space-y-1.5 font-japanese text-xs sm:text-sm">
          <p>
            <strong>【問題3 発話表現】</strong> えを見ながら質問を聞いてください。矢印（⬇）の人は何と言いますか。1・2・3からいちばんいいものを一つえらんでください。
          </p>
          <p>
            <strong>【問題4 即時応答】</strong> 質問を聞いて、1・2・3からいちばんいい返事を一つえらんでください。
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Exam Question Box 1: JLPT Level Selection */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第1問 · 判定対象レベル (JLPT Levels Selection)
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Choose one or more proficiency tiers ({availablePoolCount} spoken triads in selected pool).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
              className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
            >
              Select All N5–N1
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {LEVEL_OPTIONS.map((lvl) => {
              const label = formatJlptLevel(lvl);
              const isSelected = selectedLevels.includes(lvl);
              const count = countsByLevel[label] ?? 0;
              return (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleLevel(lvl)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 p-3.5 text-center transition ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-japanese text-lg font-black">{label}</span>
                  <span className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                    {count} dialogues
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 2: Mondai Question Format */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <Headphones size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第2問 · 聴解出題形式 (Listening Mondai Archetype)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Choose between Situational Utterances (Mondai 3) or Blind Quick Responses (Mondai 4/5).
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              aria-pressed={categoryMode === "all"}
              onClick={() => setCategoryMode("all")}
              className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                categoryMode === "all"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="font-bold text-xs sm:text-sm">All Archetypes</span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                Combined mix of Mondai 3 &amp; Mondai 4/5 questions
              </span>
            </button>

            <button
              type="button"
              aria-pressed={categoryMode === "situational-utterance"}
              onClick={() => setCategoryMode("situational-utterance")}
              className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                categoryMode === "situational-utterance"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="font-bold text-xs sm:text-sm">Mondai 3: ⬇ Situational Utterance</span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                発話表現 · Read the scene &amp; pick what ⬇ You says
              </span>
            </button>

            <button
              type="button"
              aria-pressed={categoryMode === "quick-response"}
              onClick={() => setCategoryMode("quick-response")}
              className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                categoryMode === "quick-response"
                  ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                  : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="font-bold text-xs sm:text-sm">Mondai 4/5: ⚡ Quick Response</span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                即時応答 · Blind audio dialogue reflex challenge
              </span>
            </button>
          </div>
        </div>

        {/* Exam Question Box 3: Reflex Timer Preset */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <Clock size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第3問 · 反射タイマー設定 (Reflex Timer Preset)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Once the 3 spoken candidate replies finish playing, the reflex countdown begins.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {TIMER_PRESETS.map((preset) => {
              const active = timerSeconds === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTimerSeconds(preset.value)}
                  className={`flex flex-col items-start rounded-sm border-2 p-4 text-left transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="text-xs font-bold sm:text-sm">{preset.title}</span>
                  <span className="mt-1 text-xs text-[var(--muted)]">
                    {preset.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 4: Audio Sequence Mode & Situation Context */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Audio Sequence Mode */}
          <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
              <Volume2 size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第4問 · 音声再生モード (Audio Sequence)
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Choose whether each round speaks all 4 lines automatically.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                aria-pressed={autoSequenceAudio}
                onClick={() => setAutoSequenceAudio(true)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  autoSequenceAudio
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">
                  Auto-play Prompt + 3 Replies sequentially (Official Exam)
                </p>
              </button>

              <button
                type="button"
                aria-pressed={!autoSequenceAudio}
                onClick={() => setAutoSequenceAudio(false)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  !autoSequenceAudio
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">Manual tap to listen</p>
              </button>
            </div>
          </div>

          {/* Situation Context Tag */}
          <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
              <MapPin size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第5問 · 場面タグ表示 (Situation Context Tag)
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Display a brief situational tag (e.g. &ldquo;At the station · Passenger&rdquo;) before answering.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                aria-pressed={showSituationHint}
                onClick={() => setShowSituationHint(true)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  showSituationHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">
                  Show situation hint (e.g. &ldquo;At the station&rdquo;) — ON
                </p>
              </button>

              <button
                type="button"
                aria-pressed={!showSituationHint}
                onClick={() => setShowSituationHint(false)}
                className={`w-full rounded-sm border-2 p-3.5 text-left transition ${
                  !showSituationHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                }`}
              >
                <p className="text-xs font-bold">
                  Hide situation hint (Pure Blind Audio) — OFF
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Exam Question Box 5: Session Length */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[var(--ink)]/10 pb-3">
            <Headphones size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第6問 · 出題数設定 (Session Length)
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Number of conversational triads in this blitz session.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {SESSION_SIZES.map((s) => {
              const active = size === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSize(s)}
                  className={`flex flex-col items-center justify-center rounded-sm border-2 py-4 text-center transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-mono text-xl font-black">{s}</span>
                  <span className="text-[11px] font-medium text-[var(--muted)]">
                    rounds
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Japan Red Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="flex items-center gap-2.5 text-xs text-[var(--muted)]">
            <Sparkles size={16} className="text-[var(--primary-fg)]" aria-hidden="true" />
            <span>
              Ready with <strong>{Math.min(size, availablePoolCount)}</strong> audio rounds from{" "}
              <strong>{selectedLevels.map(formatJlptLevel).join(", ")}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
          >
            <span>演習をはじめる / Start Instant Reply Blitz →</span>
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function InstantReplySetupPage() {
  return (
    <Suspense fallback={null}>
      <InstantReplySetupContent />
    </Suspense>
  );
}
