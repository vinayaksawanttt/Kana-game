"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import {
  PHONETIC_TRAP_ITEMS,
  PHONETIC_TRAP_LEVELS,
  createPhoneticTrapSession,
  getPhoneticTrapCountsByLevel,
  type PhoneticTrapLevel,
  type PhoneticTrapSessionSize,
  type PhoneticTrapSubMode,
} from "@/engine/jlptPhoneticTraps";

const SUB_MODE_CARDS: ReadonlyArray<{
  id: PhoneticTrapSubMode;
  badge: string;
  tag: string;
  title: string;
  description: string;
  examplePrompt: string;
  exampleOptions: string[];
}> = [
  {
    id: "reading",
    badge: "読",
    tag: "問題 1 · Kanji → Hiragana",
    title: "問題 1 · Kanji Reading (漢字読み)",
    description:
      "See a Kanji compound in a sentence and snipe the exact Hiragana reading past long-vowel (長音), dakuten/rendaku (連濁), and small っ (促音) traps.",
    examplePrompt: "明日の【会議】は十時からです。",
    exampleOptions: ["かいぎ ✓", "かいき", "かいぎい", "かぎ"],
  },
  {
    id: "orthography",
    badge: "表",
    tag: "問題 2 · Hiragana → Kanji",
    title: "問題 2 · Orthography Flip (表記)",
    description:
      "See a highlighted Hiragana word in context and snipe the right Kanji compound past look-alike radicals, stroke neighbors, and homophones.",
    examplePrompt: "あたらしい【かいぎ】の資料です。",
    exampleOptions: ["会議 ✓", "会義", "合議", "絵議"],
  },
  {
    id: "mixed",
    badge: "試",
    tag: "問題 1+2 · Full Section Drill",
    title: "問題 1+2 · Mixed Exam Drill",
    description:
      "Alternates Mondai 1 (Kanji Reading) and Mondai 2 (Orthography) in one session — mirroring the opening pages of the JLPT Language Knowledge paper.",
    examplePrompt: "漢字読み ↔ 表記 Alternating",
    exampleOptions: ["問題1 (読み)", "問題2 (表記)"],
  },
];

const SESSION_SIZES: readonly PhoneticTrapSessionSize[] = [10, 20, 30];

export default function PhoneticTrapSetupPage() {
  const router = useRouter();
  const [subMode, setSubMode] = useState<PhoneticTrapSubMode>("reading");
  const [selectedLevels, setSelectedLevels] = useState<PhoneticTrapLevel[]>(["N5"]);
  const [size, setSize] = useState<PhoneticTrapSessionSize>(10);
  const [showEnglishHint, setShowEnglishHint] = useState<boolean>(true);

  const countsByLevel = useMemo(
    () => getPhoneticTrapCountsByLevel(PHONETIC_TRAP_ITEMS),
    [],
  );

  const availablePoolCount = useMemo(
    () =>
      selectedLevels.reduce(
        (acc, level) => acc + (countsByLevel[level] ?? 0),
        0,
      ),
    [countsByLevel, selectedLevels],
  );

  function toggleLevel(level: PhoneticTrapLevel) {
    setSelectedLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== level);
      }
      return [...prev, level];
    });
  }

  function handleStartSession() {
    const session = createPhoneticTrapSession(PHONETIC_TRAP_ITEMS, {
      subMode,
      levels: selectedLevels,
      size,
      showEnglishHint,
    });
    saveGameSession("jlpt-traps", session.sessionId, session);
    router.push(`/games/jlpt/phonetic-traps/play/${session.sessionId}`);
  }

  return (
    <GameLayout
      label="PHONETIC TRAP SNIPER"
      glyph="読"
      homeHref="/games/jlpt"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-5 pb-14 sm:px-8">
        <header className="py-7 sm:py-9">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
              JLPT Vocabulary Mondai 1 &amp; 2 · 漢字読み・表記
            </span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
              長音 · 連濁 · 促音 · 同音異義字
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            Phonetic Trap Sniper{" "}
            <span className="font-japanese text-2xl font-normal text-[var(--muted)]">
              (漢字読み・表記)
            </span>
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Train against the exact phonetic and visual kanji traps used in JLPT &amp; NAT-TEST Vocabulary Mondai 1 and Mondai 2: long-vowel flips (<code className="font-japanese">おう/お</code>), voiced rendaku toggles (<code className="font-japanese">ぎ/き</code>), geminate <code className="font-japanese">っ</code> mutations, and look-alike radical compounds.
          </p>
        </header>

        <div className="grid gap-6">
          {/* 1. Mondai Sub-Mode Selector (3 Cards) */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="text-base font-bold">1. Choose Exam Mondai Mode</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Practice Kanji → Hiragana reading traps, Hiragana → Kanji orthography traps, or both.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {SUB_MODE_CARDS.map((card) => {
                const active = subMode === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSubMode(card.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-2 border-[var(--primary)] bg-[var(--sakura-light)]/60 shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span
                          className={`grid size-10 place-items-center rounded-full font-japanese text-lg font-bold ${
                            active
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                          }`}
                        >
                          {card.badge}
                        </span>
                        <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                          {card.tag}
                        </span>
                      </div>

                      <h3 className="text-base font-bold">{card.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                      <div className="font-japanese text-xs font-bold">
                        {card.examplePrompt}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {card.exampleOptions.map((opt, idx) => (
                          <span
                            key={opt}
                            className={`rounded-md px-2 py-0.5 font-japanese text-[11px] font-bold ${
                              idx === 0
                                ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                                : "bg-[var(--bg)] text-[var(--muted)]"
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. JLPT Level Filter Chips */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">2. Select JLPT Levels</h2>
                <p className="text-xs text-[var(--muted)]">
                  Multi-select JLPT levels ({availablePoolCount} words in active pool).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLevels([...PHONETIC_TRAP_LEVELS])}
                  className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
                >
                  All N5–N1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevels(["N5"])}
                  className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--sakura)] hover:text-[var(--primary-fg)]"
                >
                  Reset N5
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PHONETIC_TRAP_LEVELS.map((level) => {
                const active = selectedLevels.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLevel(level)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-sm"
                        : "border-[var(--line)] bg-[var(--bg)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    <span
                      className={`text-lg font-extrabold ${
                        active ? "text-[var(--primary-fg)]" : ""
                      }`}
                    >
                      {level}
                    </span>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)]">
                      {countsByLevel[level]} words
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. English Context Hint Toggle & 4. Session Length */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* English Context Hint Toggle */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="text-base font-bold">3. English Context Hint</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Control whether the English sentence translation is shown before answering.
              </p>

              <div className="mt-4 grid gap-2.5">
                <button
                  type="button"
                  aria-pressed={showEnglishHint}
                  onClick={() => setShowEnglishHint(true)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    showEnglishHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">
                      Show English sentence translation before answering
                    </div>
                    <div className="text-[11px] opacity-80">
                      Helps disambiguate homophones using context
                    </div>
                  </div>
                  <Eye size={18} className="shrink-0" />
                </button>

                <button
                  type="button"
                  aria-pressed={!showEnglishHint}
                  onClick={() => setShowEnglishHint(false)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    !showEnglishHint
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] hover:border-[var(--sakura)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">OFF — Real Exam Mode</div>
                    <div className="text-[11px] opacity-80">
                      Pure Japanese sentence prompt until you answer
                    </div>
                  </div>
                  <EyeOff size={18} className="shrink-0" />
                </button>
              </div>
            </div>

            {/* Session Length */}
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <div>
                <h2 className="text-base font-bold">4. Session Length</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Number of Phonetic &amp; Orthography Trap questions.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {SESSION_SIZES.map((count) => {
                    const active = size === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSize(count)}
                        className={`rounded-xl border py-3.5 text-center transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--sakura-light)] font-extrabold text-[var(--primary-fg)]"
                            : "border-[var(--line)] bg-[var(--bg)] font-bold text-[var(--muted)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        <div className="text-lg">{count}</div>
                        <div className="text-[11px] opacity-80">questions</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <Sparkles size={14} className="text-[var(--primary-fg)]" />
                  <span>
                    {selectedLevels.join(", ")} · {size} Questions
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStartSession}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  <span>Start Trap Sniper</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
