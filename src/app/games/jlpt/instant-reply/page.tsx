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
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  INSTANT_REPLY_ITEMS,
  createInstantReplySession,
  formatJlptLevel,
  getInstantReplyCountsByLevel,
  type InstantReplySessionSize,
  type JlptNumericLevel,
  type TimerPreset,
} from "@/engine/jlptInstantReply";

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
    router.push(`/games/jlpt/instant-reply/play/${session.sessionId}`);
  }

  return (
    <GameLayout
      label="INSTANT REPLY BLITZ · 即時応答"
      glyph="応"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-4xl flex-1 px-5 pb-14 sm:px-8">
        {/* Header Card */}
        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_36px_rgba(188,0,45,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT &amp; NAT Listening · Mondai 4/5
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              聴解・即時応答
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Instant Reply Blitz{" "}
            <span className="font-japanese text-xl font-normal text-[var(--muted)] sm:text-2xl">
              (聴解・即時応答)
            </span>
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            In the JLPT Listening <em>Quick Response (即時応答)</em> section, you hear a short situational utterance from Speaker A followed by <strong>3 spoken candidate replies</strong> with zero text printed on your exam sheet. Lock in <code>1</code>, <code>2</code>, or <code>3</code> before the 8-second reflex timer runs out!
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* 1. JLPT Level Chips */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">1. Select JLPT Levels (Multi-Select)</h2>
                <p className="text-xs text-[var(--muted)]">
                  Choose one or more tiers ({availablePoolCount} spoken triads in selected pool).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLevels([5, 4, 3, 2, 1])}
                className="text-xs font-bold text-[var(--primary-fg)] hover:underline"
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
                    className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <span className="text-lg font-extrabold">{label}</span>
                    <span className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                      {count} dialogues
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mondai Question Format (発話表現 vs 即時応答) */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <h2 className="text-base font-bold">2. Exam Mondai Archetype</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Choose between Situational Utterances (Mondai 3) or Blind Quick Responses (Mondai 4/5).
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={categoryMode === "all"}
                onClick={() => setCategoryMode("all")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  categoryMode === "all"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                }`}
              >
                <span className="font-extrabold text-sm">All Archetypes</span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  Combined mix of Mondai 3 &amp; Mondai 4/5 questions
                </span>
              </button>

              <button
                type="button"
                aria-pressed={categoryMode === "situational-utterance"}
                onClick={() => setCategoryMode("situational-utterance")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  categoryMode === "situational-utterance"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                }`}
              >
                <span className="font-extrabold text-sm">Mondai 3: ⬇ Situational Utterance</span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  発話表現 · Read the scene &amp; pick what ⬇ You says
                </span>
              </button>

              <button
                type="button"
                aria-pressed={categoryMode === "quick-response"}
                onClick={() => setCategoryMode("quick-response")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  categoryMode === "quick-response"
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                }`}
              >
                <span className="font-extrabold text-sm">Mondai 4/5: ⚡ Quick Response</span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  即時応答 · Blind audio dialogue reflex challenge
                </span>
              </button>
            </div>
          </div>

          {/* 3. Reflex Timer Preset */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <h2 className="text-base font-bold">3. Reflex Timer Preset</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Once the 3 spoken replies finish playing, the reflex countdown begins.
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
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <span className="text-sm font-bold">{preset.title}</span>
                    <span className="mt-1 text-xs text-[var(--muted)]">
                      {preset.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Audio Sequence Mode & Situation Hint */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Audio Sequence Mode */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-2">
                <Volume2 size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                <h2 className="text-base font-bold">4. Audio Sequence Mode</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Choose whether each round speaks all 4 lines automatically.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  aria-pressed={autoSequenceAudio}
                  onClick={() => setAutoSequenceAudio(true)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    autoSequenceAudio
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
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
                  className={`rounded-xl border p-3.5 text-left transition ${
                    !autoSequenceAudio
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <p className="text-xs font-bold">Manual tap to listen</p>
                </button>
              </div>
            </div>

            {/* Situation Context Tag */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                <h2 className="text-base font-bold">4. Situation Context Tag</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Display a brief situational tag (e.g. &ldquo;At the station · Passenger&rdquo;) before answering.
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  aria-pressed={showSituationHint}
                  onClick={() => setShowSituationHint(true)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    showSituationHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
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
                  className={`rounded-xl border p-3.5 text-left transition ${
                    !showSituationHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <p className="text-xs font-bold">
                    Hide situation hint (Pure Blind Audio) — OFF
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Session Size */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-2">
              <Headphones size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
              <h2 className="text-base font-bold">5. Session Length</h2>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
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
                    className={`flex flex-col items-center justify-center rounded-xl border py-4 text-center transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <span className="text-xl font-extrabold">{s}</span>
                    <span className="text-[11px] font-medium text-[var(--muted)]">
                      rounds
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
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
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <span>Start Instant Reply Blitz</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </GameLayout>
  );
}

export default function InstantReplySetupPage() {
  return (
    <Suspense fallback={null}>
      <InstantReplySetupContent />
    </Suspense>
  );
}
