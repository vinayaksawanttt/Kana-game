"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Headphones, RotateCcw, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { kanaCharacters, type KanaGroup, type ScriptSelection } from "@/data/kana";
import { loadListeningPool } from "@/data/listening";
import {
  createListeningSession,
  type JlptLevel,
  type ListeningAnswerFormat,
  type ListeningSettings,
  type ListeningSubMode,
  type SentenceOptionLanguage,
} from "@/engine/listening";
import { SakuraLoader } from "@/components/ui/SakuraLoader";

const SUB_MODES: Array<{
  id: ListeningSubMode;
  mark: string;
  subtitleJa: string;
  badge: string;
  title: string;
  description: string;
}> = [
  {
    id: "kana",
    mark: "音",
    subtitleJa: "かな聴解",
    badge: "Romaji & Script",
    title: "Kana Ear Training",
    description: "Identify Hiragana, Katakana, Dakuten & Yōon sounds by ear.",
  },
  {
    id: "vocabulary",
    mark: "語",
    subtitleJa: "語彙聴解",
    badge: "JLPT Vocab",
    title: "Vocabulary Listening",
    description: "Hear spoken JLPT words and identify their meaning.",
  },
  {
    id: "sentences",
    mark: "文",
    subtitleJa: "文章聴解",
    badge: "Context & Stories",
    title: "Sentence Comprehension",
    description: "Listen to natural Japanese sentences in context.",
  },
];

const KANA_GROUPS: Array<{ id: KanaGroup; label: string; count: number }> = [
  { id: "basic", label: "Basic", count: 46 },
  { id: "dakuten", label: "Dakuten", count: 25 },
  { id: "yoon", label: "Yōon", count: 33 },
  { id: "extended", label: "Extended", count: 27 },
];

const JLPT_LEVELS: Array<{ level: JlptLevel; label: string; vocabCount: number; sentCount: number }> = [
  { level: 5, label: "N5", vocabCount: 669, sentCount: 363 },
  { level: 4, label: "N4", vocabCount: 634, sentCount: 373 },
  { level: 3, label: "N3", vocabCount: 1749, sentCount: 80 },
  { level: 2, label: "N2", vocabCount: 1833, sentCount: 80 },
  { level: 1, label: "N1", vocabCount: 3262, sentCount: 80 },
];

const STORAGE_KEY = "listening-last-setup";

export default function ListeningSetupPage() {
  const router = useRouter();
  const [subMode, setSubMode] = useState<ListeningSubMode>("kana");
  const [answerFormat, setAnswerFormat] = useState<ListeningAnswerFormat>("multiple-choice");
  const [sentenceLanguage, setSentenceLanguage] = useState<SentenceOptionLanguage>("en");
  const [levels, setLevels] = useState<JlptLevel[]>([5]);
  const [kanaScript, setKanaScript] = useState<ScriptSelection>("hiragana");
  const [kanaGroups, setKanaGroups] = useState<KanaGroup[]>(["basic"]);
  const [size, setSize] = useState<10 | 20 | 30>(10);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ListeningSettings>;
        /* eslint-disable react-hooks/set-state-in-effect */
        if (saved.subMode === "kana" || saved.subMode === "vocabulary" || saved.subMode === "sentences") {
          setSubMode(saved.subMode);
        }
        if (saved.answerFormat === "multiple-choice" || saved.answerFormat === "typing") {
          setAnswerFormat(saved.answerFormat);
        }
        if (saved.sentenceLanguage === "en" || saved.sentenceLanguage === "ja") {
          setSentenceLanguage(saved.sentenceLanguage);
        }
        if (
          Array.isArray(saved.levels) &&
          saved.levels.length > 0 &&
          saved.levels.every((l): l is JlptLevel => [5, 4, 3, 2, 1].includes(l))
        ) {
          setLevels(saved.levels);
        }
        if (saved.kanaScript === "hiragana" || saved.kanaScript === "katakana" || saved.kanaScript === "both") {
          setKanaScript(saved.kanaScript);
        }
        if (Array.isArray(saved.kanaGroups) && saved.kanaGroups.length > 0) {
          setKanaGroups(saved.kanaGroups);
        }
        if (saved.size === 10 || saved.size === 20 || saved.size === 30) {
          setSize(saved.size);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // Ignore storage read error
    }
    setReady(true);
    setStarting(false);

    function resetStartingState() {
      setStarting(false);
    }
    window.addEventListener("pageshow", resetStartingState);
    window.addEventListener("popstate", resetStartingState);
    window.addEventListener("focus", resetStartingState);
    return () => {
      window.removeEventListener("pageshow", resetStartingState);
      window.removeEventListener("popstate", resetStartingState);
      window.removeEventListener("focus", resetStartingState);
    };
  }, []);

  const effectiveAnswerFormat: ListeningAnswerFormat =
    subMode === "sentences" ? "multiple-choice" : answerFormat;

  const availablePoolCount = useMemo(() => {
    if (subMode === "kana") {
      const groupSet = new Set(kanaGroups);
      return kanaCharacters.filter((c) => {
        const scriptMatch =
          kanaScript === "both"
            ? true
            : c.group === "extended"
              ? kanaScript === "katakana"
              : c.script === kanaScript;
        return scriptMatch && groupSet.has(c.group);
      }).length;
    }

    const levelSet = new Set(levels);
    if (subMode === "vocabulary") {
      return JLPT_LEVELS.filter((l) => levelSet.has(l.level)).reduce(
        (sum, l) => sum + l.vocabCount,
        0
      );
    }

    return JLPT_LEVELS.filter((l) => levelSet.has(l.level)).reduce(
      (sum, l) => sum + l.sentCount,
      0
    );
  }, [subMode, kanaScript, kanaGroups, levels]);

  const estimatedMinutes = useMemo(() => {
    const secPerQuestion =
      subMode === "kana"
        ? effectiveAnswerFormat === "typing"
          ? 10
          : 7
        : subMode === "vocabulary"
          ? effectiveAnswerFormat === "typing"
            ? 13
            : 9
          : 15;
    const effectiveQuestions = Math.min(size, Math.max(1, availablePoolCount));
    return Math.max(1, Math.round((effectiveQuestions * secPerQuestion) / 60));
  }, [subMode, effectiveAnswerFormat, size, availablePoolCount]);

  const selectedGroupsLabel = useMemo(() => {
    const active = KANA_GROUPS.filter(
      (g) => !(g.id === "extended" && kanaScript === "hiragana") && kanaGroups.includes(g.id)
    ).map((g) => g.label);
    return active.length > 0 ? active.join(", ") : "Basic";
  }, [kanaGroups, kanaScript]);

  const selectedLevelsLabel = useMemo(() => {
    return [...levels]
      .sort((a, b) => b - a)
      .map((l) => `N${l}`)
      .join(", ");
  }, [levels]);

  function toggleKanaGroup(group: KanaGroup) {
    setError("");
    setStarting(false);
    setKanaGroups((prev) =>
      prev.includes(group)
        ? prev.length > 1
          ? prev.filter((g) => g !== group)
          : prev
        : [...prev, group]
    );
  }

  function toggleLevel(level: JlptLevel) {
    setError("");
    setStarting(false);
    setLevels((prev) =>
      prev.includes(level)
        ? prev.length > 1
          ? prev.filter((l) => l !== level)
          : prev
        : [...prev, level]
    );
  }

  function resetSetup() {
    setSubMode("kana");
    setAnswerFormat("multiple-choice");
    setSentenceLanguage("en");
    setLevels([5]);
    setKanaScript("hiragana");
    setKanaGroups(["basic"]);
    setSize(10);
    setError("");
    setStarting(false);
  }

  async function startSession() {
    if (availablePoolCount === 0 || starting) return;
    setStarting(true);
    setError("");

    try {
      const settings: ListeningSettings = {
        subMode,
        answerFormat: effectiveAnswerFormat,
        levels,
        sentenceLanguage,
        kanaScript,
        kanaGroups,
        size,
      };

      const pool = await loadListeningPool(settings);
      const session = createListeningSession(pool, settings);
      saveGameSession("listening", session.sessionId, session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setStarting(false);
      playGameSfx("temple-bell-gong");
      router.push(`/games/listening/play/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start listening session:", err);
      setError("Could not load listening pool. Please try again.");
      setStarting(false);
    }
  }

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Preparing Listening Studio..." size="md" />
      </main>
    );
  }

  return (
    <GameLayout label="LISTENING" glyph="聴" homeHref="/">
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          {/* Left Configuration Card */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                  Japanese Ear Training
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">Listening quiz setup</h1>
              </div>
              <button
                type="button"
                onClick={resetSetup}
                className="flex min-h-10 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)] cursor-pointer"
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>

            <div className="space-y-6">
              {/* 1. Listening Mode Selector */}
              <fieldset>
                <legend className="mb-2.5 text-sm font-bold">1. Listening mode</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {SUB_MODES.map((item) => {
                    const selected = subMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSubMode(item.id);
                          setError("");
                          setStarting(false);
                        }}
                        className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--sakura-light)]/55 ring-2 ring-[var(--primary)]/20 shadow-xs"
                            : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/15"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <span
                            className={`grid size-10 place-items-center rounded-xl font-japanese text-lg font-bold transition-colors ${
                              selected
                                ? "bg-[var(--primary)] text-white shadow-xs"
                                : "bg-[var(--sakura-light)] text-[var(--primary)] group-hover:bg-[var(--sakura)]/25"
                            }`}
                          >
                            {item.mark}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                : "border-[var(--line)] bg-[var(--bg)] text-transparent"
                            }`}
                          >
                            <Check size={13} strokeWidth={3} />
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-japanese text-[11px] font-bold text-[var(--primary)]">
                              {item.subtitleJa}
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--muted)]">
                              • {item.badge}
                            </span>
                          </div>
                          <span className="mt-0.5 block text-sm font-bold text-[var(--ink)]">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                            {item.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Link
                  href="/games/jlpt/instant-reply"
                  className="group mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--sakura)] bg-[var(--sakura-light)]/45 p-3.5 transition-all hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]/80"
                >
                  <div className="flex items-start gap-3 sm:items-center">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] font-japanese text-lg font-bold text-white shadow-xs">
                      応
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--ink)]">
                          JLPT Instant Reply Blitz (<span className="font-japanese">聴解・即時応答</span>)
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] border border-[var(--sakura)]">
                          <Sparkles size={10} aria-hidden="true" />
                          JLPT Mondai 4/5 • 8s Reflex
                        </span>
                      </div>
                      <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                        Blind audio reflex drill — hear a spoken line and pick the best reply out of 3 in 8 seconds.
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform group-hover:translate-x-0.5">
                    <span>Launch Blitz</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </Link>
              </fieldset>

              {/* 2. Dynamic Filters */}
              {subMode === "kana" ? (
                <div className="space-y-5 border-t border-[var(--line)]/60 pt-5">
                  <fieldset>
                    <legend className="mb-2.5 text-sm font-bold">2. Script</legend>
                    <div className="inline-flex rounded-full bg-[var(--sakura-light)] p-1">
                      {(
                        [
                          ["hiragana", "Hiragana"],
                          ["katakana", "Katakana"],
                          ["both", "Both"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          aria-pressed={kanaScript === val}
                          onClick={() => setKanaScript(val)}
                          className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors cursor-pointer ${
                            kanaScript === val
                              ? "bg-[var(--primary)] text-white shadow-xs"
                              : "text-[var(--muted)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2.5 text-sm font-bold">Character sets</legend>
                    <div className="flex flex-wrap gap-2">
                      {KANA_GROUPS.map((g) => {
                        const disabled = g.id === "extended" && kanaScript === "hiragana";
                        const active = !disabled && kanaGroups.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            disabled={disabled}
                            aria-pressed={active}
                            onClick={() => toggleKanaGroup(g.id)}
                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                              active
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                                : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                            }`}
                          >
                            {active && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                            <span>{g.label}</span>
                            <span className="text-xs opacity-80">
                              {disabled ? "(Katakana)" : `(${g.count})`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              ) : (
                <fieldset className="border-t border-[var(--line)]/60 pt-5">
                  <legend className="mb-2.5 text-sm font-bold">2. JLPT Level (multi-select)</legend>
                  <div className="flex flex-wrap gap-2">
                    {JLPT_LEVELS.map((item) => {
                      const active = levels.includes(item.level);
                      const count =
                        subMode === "vocabulary" ? item.vocabCount : item.sentCount;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleLevel(item.level)}
                          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors cursor-pointer ${
                            active
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                              : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {active && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                          <span>{item.label}</span>
                          <span className="text-xs opacity-80">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* 3. Answer Style / Option Language Selector */}
              <fieldset className="border-t border-[var(--line)]/60 pt-5">
                <legend className="mb-2.5 text-sm font-bold">
                  {subMode === "sentences" ? "3. Option language" : "3. Answer style"}
                </legend>
                {subMode === "sentences" ? (
                  <div className="inline-flex flex-wrap rounded-full bg-[var(--sakura-light)] p-1">
                    <button
                      type="button"
                      aria-pressed={sentenceLanguage === "en"}
                      onClick={() => setSentenceLanguage("en")}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors cursor-pointer ${
                        sentenceLanguage === "en"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      English Options
                    </button>
                    <button
                      type="button"
                      aria-pressed={sentenceLanguage === "ja"}
                      onClick={() => setSentenceLanguage("ja")}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors cursor-pointer ${
                        sentenceLanguage === "ja"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Japanese Options (日本語)
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex flex-wrap rounded-full bg-[var(--sakura-light)] p-1">
                    <button
                      type="button"
                      aria-pressed={effectiveAnswerFormat === "multiple-choice"}
                      onClick={() => setAnswerFormat("multiple-choice")}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors cursor-pointer ${
                        effectiveAnswerFormat === "multiple-choice"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Multiple Choice (4 options)
                    </button>
                    <button
                      type="button"
                      aria-pressed={effectiveAnswerFormat === "typing"}
                      onClick={() => setAnswerFormat("typing")}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors cursor-pointer ${
                        effectiveAnswerFormat === "typing"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Type Answer (Dictation)
                    </button>
                  </div>
                )}
              </fieldset>

              {/* 4. Session Length */}
              <fieldset className="border-t border-[var(--line)]/60 pt-5">
                <legend className="mb-2.5 text-sm font-bold">4. Session length</legend>
                <div className="inline-flex flex-wrap rounded-full bg-[var(--sakura-light)] p-1">
                  {([10, 20, 30] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={size === count}
                      onClick={() => setSize(count)}
                      className={`min-h-10 rounded-full px-5 text-sm font-bold transition-colors cursor-pointer ${
                        size === count
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {count} questions
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Right Summary Sidebar Card */}
          <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-6 lg:sticky lg:top-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--primary)]">
                <Headphones size={22} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Audio Prompt Pool
                </p>
                <p className="text-2xl font-extrabold text-[var(--ink)] tabular-nums">
                  {availablePoolCount.toLocaleString()} items
                </p>
              </div>
            </div>

            <dl className="space-y-2.5 border-y border-[var(--line)]/70 py-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Mode</dt>
                <dd className="text-right font-bold text-[var(--ink)]">
                  {SUB_MODES.find((m) => m.id === subMode)?.title}
                </dd>
              </div>

              {subMode === "kana" ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--muted)]">Script</dt>
                    <dd className="text-right font-bold text-[var(--ink)]">
                      {kanaScript === "both"
                        ? "Both Scripts"
                        : kanaScript === "katakana"
                          ? "Katakana"
                          : "Hiragana"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--muted)]">Character sets</dt>
                    <dd className="text-right font-bold text-[var(--ink)]">
                      {selectedGroupsLabel}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--muted)]">JLPT levels</dt>
                  <dd className="text-right font-bold text-[var(--ink)]">
                    {selectedLevelsLabel}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">
                  {subMode === "sentences" ? "Option language" : "Answer format"}
                </dt>
                <dd className="text-right font-bold text-[var(--ink)]">
                  {subMode === "sentences"
                    ? sentenceLanguage === "ja"
                      ? "Japanese (日本語)"
                      : "English"
                    : effectiveAnswerFormat === "typing"
                      ? "Type Answer"
                      : "Multiple Choice (4)"}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Session length</dt>
                <dd className="text-right font-bold text-[var(--ink)]">{size} questions</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--muted)]">Est. duration</dt>
                <dd className="inline-flex items-center gap-1 font-bold text-[var(--ink)]">
                  <Clock size={13} className="text-[var(--primary)]" aria-hidden="true" />
                  <span>~{estimatedMinutes} min</span>
                </dd>
              </div>
            </dl>

            {error && (
              <p role="alert" className="mt-3 text-xs font-semibold text-[var(--wrong)]">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={availablePoolCount === 0 || starting}
              onClick={startSession}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span>{starting ? "Starting..." : "Start Listening"}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </aside>
        </div>
      </section>
    </GameLayout>
  );
}
