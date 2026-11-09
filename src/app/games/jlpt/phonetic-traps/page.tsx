"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
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
import { JlptBookletSetupShell } from "@/components/jlpt/JlptBookletSetupShell";

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

function PhoneticTrapSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelParam = searchParams.get("level")?.toUpperCase();

  const initialLevels = useMemo<PhoneticTrapLevel[]>(() => {
    if (!levelParam) return ["N5"];
    if (levelParam === "ALL") return [...PHONETIC_TRAP_LEVELS];
    if (PHONETIC_TRAP_LEVELS.includes(levelParam as PhoneticTrapLevel)) {
      return [levelParam as PhoneticTrapLevel];
    }
    return ["N5"];
  }, [levelParam]);

  const [subMode, setSubMode] = useState<PhoneticTrapSubMode>("reading");
  const [selectedLevels, setSelectedLevels] = useState<PhoneticTrapLevel[]>(initialLevels);
  const [size, setSize] = useState<PhoneticTrapSessionSize>(10);
  const [showEnglishHint, setShowEnglishHint] = useState<boolean>(true);
  const [showFurigana, setShowFurigana] = useState<boolean>(false);

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

  function handleHeaderLevelChange(lvlStr: string) {
    if (lvlStr.toUpperCase() === "ALL") {
      setSelectedLevels([...PHONETIC_TRAP_LEVELS]);
    } else {
      setSelectedLevels([lvlStr.toUpperCase() as PhoneticTrapLevel]);
    }
  }

  function handleStartSession() {
    const session = createPhoneticTrapSession(PHONETIC_TRAP_ITEMS, {
      subMode,
      levels: selectedLevels,
      size,
      showEnglishHint,
      showFurigana,
    });
    saveGameSession("jlpt-traps", session.sessionId, session);
    router.push(`/games/jlpt/phonetic-traps/play/${session.sessionId}`);
  }

  const headerSelectedLevel =
    selectedLevels.length === PHONETIC_TRAP_LEVELS.length
      ? "ALL"
      : selectedLevels[0] ?? "N5";

  return (
    <JlptBookletSetupShell
      label="PHONETIC TRAP SNIPER · 漢字読み・表記"
      glyph="読"
      sectionTag="第1部：文字・語彙 · 問題 1・2"
      mondaiBadge="Mondai 1・2"
      sectionTitle={
        <span>
          漢字読み・表記 <span className="text-xl font-normal text-[var(--muted)] sm:text-2xl">(Phonetic Trap Sniper)</span>
        </span>
      }
      sectionSubtitle="長音・連濁・促音の罠を見破り、正しい読みと漢字表記を選択する演習"
      supportedLevels={["N5", "N4", "N3", "N2", "N1", "ALL"]}
      selectedLevel={headerSelectedLevel}
      onLevelChange={handleHeaderLevelChange}
      activeQuestionCount={availablePoolCount}
      activeQuestionCountLabel="words in active pool"
      instructions={
        <div className="space-y-1.5 font-japanese text-xs sm:text-sm">
          <p>
            <strong>【問題1】</strong> ＿＿のことばの読み方として最もよいものを、1・2・3・4から一つえらんでください。
          </p>
          <p>
            <strong>【問題2】</strong> ＿＿のことばを漢字で書くとき、最もよいものを、1・2・3・4から一つえらんでください。
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Exam Question Box 1: Mondai Sub-Mode */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第1問 · 出題形式の指定 (Exam Mondai Mode)
            </span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              Kanji Reading / Orthography / Mixed
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {SUB_MODE_CARDS.map((card) => {
              const active = subMode === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSubMode(card.id)}
                  className={`flex flex-col justify-between rounded-sm border-2 p-5 text-left transition-all ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-sm ring-1 ring-[var(--primary)]"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--ink)] hover:border-[var(--primary)]"
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span
                        className={`grid size-9 place-items-center rounded-sm font-japanese text-base font-bold ${
                          active
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--ink)]/30 bg-[var(--surface)] text-[var(--primary-fg)]"
                        }`}
                      >
                        {card.badge}
                      </span>
                      <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                        {card.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold sm:text-base">{card.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] p-2.5">
                    <div className="font-japanese text-xs font-bold text-[var(--ink)]">
                      {card.examplePrompt}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {card.exampleOptions.map((opt, idx) => (
                        <span
                          key={opt}
                          className={`rounded-sm px-2 py-0.5 font-japanese text-[11px] font-bold ${
                            idx === 0
                              ? "border border-[var(--correct)] bg-[var(--correct)]/10 text-[var(--correct)]"
                              : "border border-[var(--ink)]/10 bg-[var(--bg)] text-[var(--muted)]"
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

        {/* Exam Question Box 2: JLPT Level Filter Chips */}
        <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/10 pb-3">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第2問 · 判定対象レベル (JLPT Levels Selection)
              </span>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Multi-select proficiency tiers ({availablePoolCount} words in active pool).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedLevels([...PHONETIC_TRAP_LEVELS])}
                className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
              >
                All N5–N1
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevels(["N5"])}
                className="rounded-sm border border-[var(--ink)]/30 bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
              >
                Reset N5
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PHONETIC_TRAP_LEVELS.map((level) => {
              const active = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLevel(level)}
                  className={`flex items-center justify-between rounded-sm border-2 p-3.5 text-left transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] shadow-xs"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 hover:border-[var(--primary)]"
                  }`}
                >
                  <span
                    className={`font-japanese text-lg font-black ${
                      active ? "text-[var(--primary-fg)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {level}
                  </span>
                  <span className="rounded-sm border border-[var(--ink)]/15 bg-[var(--surface)] px-2 py-0.5 text-xs font-bold text-[var(--muted)]">
                    {countsByLevel[level]} words
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exam Question Box 3 & 4: Study Conditions & Session Length */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exam Question Box 3: English Context Hint & Furigana */}
          <div className="rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
              第3問 · 解答補助・ヒント条件 (Hint &amp; Furigana)
            </span>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Configure English translation assistance and Kanji furigana display.
            </p>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                aria-pressed={showEnglishHint}
                onClick={() => setShowEnglishHint(true)}
                className={`flex w-full items-center justify-between rounded-sm border-2 px-4 py-3 text-left transition ${
                  showEnglishHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold sm:text-sm">
                    Show English sentence translation
                  </div>
                  <div className="text-[11px] opacity-80">
                    Assists with homophone differentiation
                  </div>
                </div>
                <Eye size={18} className="shrink-0" />
              </button>

              <button
                type="button"
                aria-pressed={!showEnglishHint}
                onClick={() => setShowEnglishHint(false)}
                className={`flex w-full items-center justify-between rounded-sm border-2 px-4 py-3 text-left transition ${
                  !showEnglishHint
                    ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                    : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                }`}
              >
                <div>
                  <div className="text-xs font-bold sm:text-sm">OFF — Real Exam Mode</div>
                  <div className="text-[11px] opacity-80">
                    Pure Japanese sentence prompt until answered
                  </div>
                </div>
                <EyeOff size={18} className="shrink-0" />
              </button>
            </div>

            <div className="mt-4 border-t border-[var(--ink)]/10 pt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Kanji Furigana (読み仮名)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={showFurigana}
                  onClick={() => setShowFurigana(true)}
                  className={`rounded-sm border-2 px-3.5 py-2.5 text-center text-xs font-bold transition ${
                    showFurigana
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                  }`}
                >
                  あ Furigana ON
                </button>
                <button
                  type="button"
                  aria-pressed={!showFurigana}
                  onClick={() => setShowFurigana(false)}
                  className={`rounded-sm border-2 px-3.5 py-2.5 text-center text-xs font-bold transition ${
                    !showFurigana
                      ? "border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                      : "border-[var(--ink)]/25 bg-[var(--bg)]/50 text-[var(--muted)] hover:border-[var(--primary)]"
                  }`}
                >
                  漢 Furigana OFF (Exam)
                </button>
              </div>
            </div>
          </div>

          {/* Exam Question Box 4: Session Length */}
          <div className="flex flex-col justify-between rounded-sm border-2 border-[var(--ink)]/20 bg-[var(--surface)] p-5 sm:p-6 shadow-xs">
            <div>
              <span className="font-japanese text-xs font-black uppercase tracking-wider text-[var(--primary-fg)]">
                第4問 · 出題数設定 (Session Length)
              </span>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Target number of questions per drill session.
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
                      className={`rounded-sm border-2 py-3.5 text-center transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--sakura-light)] font-black text-[var(--primary-fg)] shadow-xs"
                          : "border-[var(--ink)]/25 bg-[var(--bg)]/50 font-bold text-[var(--muted)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="font-mono text-xl">{count}</div>
                      <div className="text-[11px] opacity-80">questions</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-sm border border-dashed border-[var(--ink)]/20 bg-[var(--bg)]/60 p-3 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <Sparkles size={14} className="text-[var(--primary-fg)]" />
                <span>Active Configuration Summary</span>
              </div>
              <div className="mt-1 font-japanese">
                {selectedLevels.join(", ")} · {size}問 · {subMode === "reading" ? "漢字読み" : subMode === "orthography" ? "表記" : "読み・表記 総合"}
              </div>
            </div>
          </div>
        </div>

        {/* Japan Red Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[var(--ink)]/20 pt-6">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="font-japanese font-bold text-[var(--ink)]">
              受験準備完了:
            </span>
            <span>
              <strong>{Math.min(size, availablePoolCount)}</strong> items selected from pool ({selectedLevels.join(", ")})
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
          >
            <span>演習をはじめる / Start Examination Drill →</span>
          </button>
        </div>
      </div>
    </JlptBookletSetupShell>
  );
}

export default function PhoneticTrapSetupPage() {
  return (
    <Suspense fallback={null}>
      <PhoneticTrapSetupContent />
    </Suspense>
  );
}
