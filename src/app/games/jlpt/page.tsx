"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Headphones, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import {
  STAR_SCRAMBLE_ITEMS,
  getStarScrambleCountsByLevel,
  type StarScrambleLevel,
} from "@/engine/jlptStarScramble";
import {
  PHONETIC_TRAP_ITEMS,
  getPhoneticTrapCountsByLevel,
  type PhoneticTrapLevel,
} from "@/engine/jlptPhoneticTraps";
import {
  SYNONYM_MATCH_ITEMS,
  getSynonymMatchCountsByLevel,
} from "@/engine/jlptSynonymMatch";
import {
  INSTANT_REPLY_ITEMS,
  getInstantReplyCountsByLevel,
} from "@/engine/jlptInstantReply";

type ActiveLevelSelection = "N5" | "N4" | "N3" | "N2" | "N1" | "all";

const LEVEL_STAMPS: readonly ActiveLevelSelection[] = [
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
  "all",
];

export default function JlptArenaHubPage() {
  const [selectedLevel, setSelectedLevel] = useState<ActiveLevelSelection>("N5");

  const starCounts = useMemo(() => getStarScrambleCountsByLevel(STAR_SCRAMBLE_ITEMS), []);
  const phoneticCounts = useMemo(() => getPhoneticTrapCountsByLevel(PHONETIC_TRAP_ITEMS), []);
  const synonymCounts = useMemo(() => getSynonymMatchCountsByLevel(SYNONYM_MATCH_ITEMS), []);
  const replyCounts = useMemo(() => getInstantReplyCountsByLevel(INSTANT_REPLY_ITEMS), []);

  const totalStar = STAR_SCRAMBLE_ITEMS.length;
  const totalPhonetic = PHONETIC_TRAP_ITEMS.length;
  const totalSynonym = SYNONYM_MATCH_ITEMS.length;
  const totalReply = INSTANT_REPLY_ITEMS.length;

  // Filtered counts for currently stamped level
  const activeStarCount =
    selectedLevel === "all" ? totalStar : starCounts[selectedLevel as StarScrambleLevel] ?? 0;
  const activePhoneticCount =
    selectedLevel === "all" ? totalPhonetic : phoneticCounts[selectedLevel as PhoneticTrapLevel] ?? 0;
  const activeSynonymCount =
    selectedLevel === "all" ? totalSynonym : synonymCounts[selectedLevel.toUpperCase() as "N5"] ?? 0;
  const activeReplyCount =
    selectedLevel === "all" ? totalReply : replyCounts[selectedLevel.toUpperCase() as "N5"] ?? 0;

  const targetLevelQuery = selectedLevel === "all" ? "all" : selectedLevel.toLowerCase();

  return (
    <GameLayout
      label="JLPT & NAT EXAM ARENA"
      glyph="試"
      homeHref="/"
    >
      <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* =========================================================================
            TACTILE OFFICIAL EXAM PAPER SHEET CONTAINER (問題用紙)
            ========================================================================= */}
        <div className="relative mx-auto rounded-sm border-2 border-[var(--ink)]/30 bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(35,26,28,0.12)] sm:p-10">
          {/* Subtle Corner Registration Marks (+) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
          >
            +
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-2 select-none font-mono text-xs font-light text-[var(--ink)]/35"
          >
            +
          </span>

          {/* Inner Double-Frame Border Line */}
          <div className="relative rounded-[2px] border border-[var(--ink)]/15 p-4 sm:p-8">
            {/* =======================================================================
                BOOKLET COVER HEADER (問題用紙 表紙ヘッダー)
                ======================================================================= */}
            <header className="border-b-2 border-[var(--ink)]/30 pb-7">
              {/* Top Row: Official Tag + Level Stamp Selector */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-1 font-japanese text-xs font-black tracking-widest text-[var(--ink)] shadow-sm">
                    日本語能力試験 · JLPT / NAT-TEST
                  </span>
                  <div className="hidden sm:block">
                    <JlptPaperIllustration className="h-8 w-6" />
                  </div>
                </div>

                {/* Interactive Level Stamp Selector */}
                <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="JLPT Level Stamps">
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Level Stamp:
                  </span>
                  {LEVEL_STAMPS.map((lvl) => {
                    const isSelected = selectedLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`relative rounded-sm border-2 px-3 py-1 font-japanese font-black text-sm uppercase transition-all duration-150 sm:text-base ${
                          isSelected
                            ? "scale-105 border-[var(--primary)] bg-[var(--sakura-light)] text-[var(--primary-fg)] shadow-[0_3px_10px_rgba(208,16,76,0.22)] ring-1 ring-[var(--primary)]"
                            : "border-[var(--ink)]/35 bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary-fg)]"
                        }`}
                      >
                        {lvl === "all" ? "All" : lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center Title Block */}
              <div className="mt-8 text-center">
                <h1 className="font-japanese text-3xl font-extrabold tracking-[0.25em] text-[var(--ink)] sm:text-5xl">
                  <ruby>
                    問題用紙<rt className="text-xs font-normal tracking-normal text-[var(--muted)]">もんだいようし</rt>
                  </ruby>
                </h1>
                <p className="mt-2 font-japanese text-sm font-semibold tracking-wide text-[var(--primary-fg)] sm:text-base">
                  言語知識（文字・語彙・文法）・読解・聴解 演習
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Official Examination Archetypes &amp; Mondai Drills · Offline Ready
                </p>
              </div>

              {/* Examinee Registration Box (受験番号・なまえ 表) */}
              <div className="mt-7 overflow-hidden rounded-sm border-2 border-[var(--ink)]/40 bg-[var(--bg)]/60 text-left">
                <div className="grid divide-y-2 divide-[var(--ink)]/20 sm:grid-cols-2 sm:divide-x-2 sm:divide-y-0">
                  {/* Cell 1: Examinee Number */}
                  <div className="p-3.5 sm:p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      受験番号 · Examinee No.
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-mono text-base font-black tracking-wider text-[var(--ink)] sm:text-lg">
                        EX-{selectedLevel.toUpperCase()}-0042
                      </span>
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        (Active Session)
                      </span>
                    </div>
                  </div>

                  {/* Cell 2: Target Level & Hanko Stamp Badge */}
                  <div className="flex items-center justify-between p-3.5 sm:p-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        判定対象 · Target Level
                      </div>
                      <div className="mt-1 font-japanese text-sm font-extrabold text-[var(--ink)] sm:text-base">
                        {selectedLevel === "all" ? "All JLPT Tiers (N5–N1)" : `JLPT ${selectedLevel} Focused`}
                      </div>
                    </div>

                    {/* Official Hanko Stamp Badge */}
                    <div className="inline-flex rotate-[-6deg] items-center rounded-sm border-2 border-[var(--primary)] bg-[var(--surface)] px-2.5 py-1 text-center shadow-sm">
                      <span className="font-japanese text-xs font-black tracking-widest text-[var(--primary-fg)]">
                        合格圏
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Booklet Instructions Box (ちゅうい · Notes) */}
              <div className="mt-6 rounded-sm border border-dashed border-[var(--ink)]/30 bg-[var(--bg)]/40 p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                    【 注意 · ちゅうい · Official Test Structure &amp; Timing 】
                  </span>
                </div>
                <div className="grid gap-3 text-xs sm:grid-cols-3">
                  <div className="border-l-2 border-[var(--primary)] pl-2.5">
                    <div className="font-japanese font-bold text-[var(--ink)]">
                      第1部：文字・語彙 (25分)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                      Mondai 1 (漢字読み), Mondai 2 (表記), Mondai 4/5 (言い換え類義)
                    </div>
                  </div>
                  <div className="border-l-2 border-[var(--primary)] pl-2.5">
                    <div className="font-japanese font-bold text-[var(--ink)]">
                      第2部：文法・読解 (50分)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                      Mondai 1 (文法形式), Mondai 2 (★ 星問題 パズル), Mondai 3–6 (読解)
                    </div>
                  </div>
                  <div className="border-l-2 border-[var(--primary)] pl-2.5">
                    <div className="font-japanese font-bold text-[var(--ink)]">
                      第3部：聴解 (30分)
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                      Mondai 1–2 (課題・ポイント), Mondai 3 (⬇ 発話表現), Mondai 4/5 (即時応答)
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* =======================================================================
                QUESTION PAPER INDEX OF DRILLS (もんだい一覧 · EXAM PAPER ROW LAYOUT)
                ======================================================================= */}
            <main className="mt-8 space-y-8">
              {/* -------------------------------------------------------------------
                  MONDAI 1 & 2: Phonetic Trap Sniper (漢字読み・表記)
                  ------------------------------------------------------------------- */}
              <section
                aria-labelledby="drill-phonetic-heading"
                className="group relative flex flex-col rounded-sm border border-[var(--ink)]/25 bg-[var(--bg)]/20 p-5 transition hover:border-[var(--primary)] sm:p-6"
              >
                {/* Left Margin Section Tab (PDF Style) */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-[var(--ink)] px-2 py-0.5 font-japanese text-[11px] font-black text-[var(--surface)]">
                      文字・語彙
                    </span>
                    <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                      もんだい 1 · 2
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    {activePhoneticCount} items in active pool
                  </span>
                </div>

                {/* Official Exam Instruction Header */}
                <p className="font-japanese text-xs font-bold leading-relaxed text-[var(--ink)] sm:text-sm">
                  ＿＿のことばはどう読みますか・どう書きますか。1・2・3・4からいちばんいいものを一つえらんでください。
                </p>

                {/* Drill Title & Description */}
                <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                  <h2 id="drill-phonetic-heading" className="text-base font-bold text-[var(--ink)] sm:text-lg">
                    Phonetic Trap Sniper (漢字読み・表記)
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    — Counter rendaku, loanwords &amp; kanji radical confusables
                  </span>
                </div>

                {/* Live Sample Question Preview (れい Box) */}
                <div className="mt-4 rounded-sm border border-dashed border-[var(--ink)]/25 bg-[var(--surface)] p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold text-[var(--primary-fg)]">
                    (れい) 例題 · Kanji Reading &amp; Katakana Orthography:
                  </div>
                  <div className="mt-1 font-japanese text-sm font-semibold text-[var(--ink)]">
                    明日の【会議】は十時からです。 / シャワーをあびました。
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 font-japanese text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-fg)]">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--primary)] text-[10px]">●</span>
                      1 かいぎ / シャワー
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">2</span>
                      かいき / シャウー
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">3</span>
                      かいぎい / ツャワー
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">4</span>
                      かぎ / ツャウー
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink)]/10 pt-3">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Counter Rendaku (六本)</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Katakana Traps (シャワー)</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Look-Alike Radicals</span>
                  </div>

                  <Link
                    href={`/games/jlpt/phonetic-traps?level=${targetLevelQuery}`}
                    className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    <span>演習をはじめる / Start Drill</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              {/* -------------------------------------------------------------------
                  MONDAI 4 & 5: Synonym Paraphrase Match (言い換え類義)
                  ------------------------------------------------------------------- */}
              <section
                aria-labelledby="drill-synonym-heading"
                className="group relative flex flex-col rounded-sm border border-[var(--ink)]/25 bg-[var(--bg)]/20 p-5 transition hover:border-[var(--primary)] sm:p-6"
              >
                {/* Left Margin Section Tab */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-[var(--ink)] px-2 py-0.5 font-japanese text-[11px] font-black text-[var(--surface)]">
                      語彙
                    </span>
                    <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                      もんだい 4 · 5
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    {activeSynonymCount} items in active pool
                  </span>
                </div>

                {/* Official Exam Instruction Header */}
                <p className="font-japanese text-xs font-bold leading-relaxed text-[var(--ink)] sm:text-sm">
                  ＿＿のぶんとだいたい同じ意味のものが 1・2・3・4にあります。いちばんいいものを一つえらんでください。
                </p>

                {/* Drill Title & Description */}
                <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                  <h2 id="drill-synonym-heading" className="text-base font-bold text-[var(--ink)] sm:text-lg">
                    Synonym Paraphrase Match (言い換え類義)
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    — Full-sentence equivalence, antonym negative flips &amp; time conversions
                  </span>
                </div>

                {/* Live Sample Question Preview (れい Box) */}
                <div className="mt-4 rounded-sm border border-dashed border-[var(--ink)]/25 bg-[var(--surface)] p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold text-[var(--primary-fg)]">
                    (れい) 例題 · Sentence Paraphrase Equivalence:
                  </div>
                  <div className="mt-1 font-japanese text-sm font-semibold text-[var(--ink)]">
                    その映画はとても【おもしろくなかったです】。 / 二年前に京都へ行きました。
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 font-japanese text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-fg)]">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--primary)] text-[10px]">●</span>
                      1 つまらなかったです / おととし
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">2</span>
                      短かったです / きょねん
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">3</span>
                      長かったです / さらいねん
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">4</span>
                      楽しかったです / らいねん
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink)]/10 pt-3">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Antonym Negative Flips</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Time Expressions</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Japanese-to-Japanese</span>
                  </div>

                  <Link
                    href={`/games/jlpt/synonym-match?level=${targetLevelQuery}`}
                    className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    <span>演習をはじめる / Start Drill</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              {/* -------------------------------------------------------------------
                  MONDAI 2: ★ Star Sentence Scramble (星問題 パズル)
                  ------------------------------------------------------------------- */}
              <section
                aria-labelledby="drill-star-heading"
                className="group relative flex flex-col rounded-sm border border-[var(--ink)]/25 bg-[var(--bg)]/20 p-5 transition hover:border-[var(--primary)] sm:p-6"
              >
                {/* Left Margin Section Tab */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-[var(--ink)] px-2 py-0.5 font-japanese text-[11px] font-black text-[var(--surface)]">
                      文法
                    </span>
                    <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                      もんだい 2
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    {activeStarCount} puzzles in active pool
                  </span>
                </div>

                {/* Official Exam Instruction Header */}
                <p className="font-japanese text-xs font-bold leading-relaxed text-[var(--ink)] sm:text-sm">
                  ★ に入るものはどれですか。1・2・3・4からいちばんいいものを一つえらんでください。
                </p>

                {/* Drill Title & Description */}
                <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                  <h2 id="drill-star-heading" className="text-base font-bold text-[var(--ink)] sm:text-lg">
                    ★ Star Sentence Scramble (星問題 パズル)
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    — Syntax clause order &amp; official star blank slot targeting
                  </span>
                </div>

                {/* Live Sample Question Preview (れい Box) */}
                <div className="mt-4 rounded-sm border border-dashed border-[var(--ink)]/25 bg-[var(--surface)] p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold text-[var(--primary-fg)]">
                    (れい) 例題 · Star Word-Order Reassembly:
                  </div>
                  <div className="mt-1 font-japanese text-sm font-semibold text-[var(--ink)]">
                    わたしは　＿＿　＿＿　<span className="text-[var(--primary-fg)] font-bold">★</span>　＿＿　好きです。
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-japanese">
                    <span className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5">1 が</span>
                    <span className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5">2 りんご</span>
                    <span className="rounded border-2 border-[var(--primary)] bg-[var(--sakura-light)] px-2 py-0.5 font-bold text-[var(--primary-fg)]">3 一番 ★</span>
                    <span className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5">4 より</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-japanese text-xs text-[var(--muted)]">
                    <span>(かいとうようし):</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-fg)]">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--primary)] text-[10px]">●</span>
                      ( 3 ) 一番 lands on ★
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink)]/10 pt-3">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Dual Star &amp; Full-Order Scoring</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Particle Syntax</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Exam Mode (No Hints)</span>
                  </div>

                  <Link
                    href={`/games/jlpt/star-scramble?level=${targetLevelQuery}`}
                    className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    <span>演習をはじめる / Start Drill</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              {/* -------------------------------------------------------------------
                  MONDAI 3 & 4: Instant Reply Blitz (聴解 · 発話表現 & 即時応答)
                  ------------------------------------------------------------------- */}
              <section
                aria-labelledby="drill-reply-heading"
                className="group relative flex flex-col rounded-sm border border-[var(--ink)]/25 bg-[var(--bg)]/20 p-5 transition hover:border-[var(--primary)] sm:p-6"
              >
                {/* Left Margin Section Tab */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)]/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm bg-[var(--ink)] px-2 py-0.5 font-japanese text-[11px] font-black text-[var(--surface)]">
                      聴解
                    </span>
                    <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                      もんだい 3 · 4/5
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
                    {activeReplyCount} dialogues in active pool
                  </span>
                </div>

                {/* Official Exam Instruction Header */}
                <p className="font-japanese text-xs font-bold leading-relaxed text-[var(--ink)] sm:text-sm">
                  ぶんをきいて、1から3のなかから いちばんいいものを一つえらんでください。
                </p>

                {/* Drill Title & Description */}
                <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                  <h2 id="drill-reply-heading" className="text-base font-bold text-[var(--ink)] sm:text-lg">
                    Instant Reply Blitz (聴解 · 発話表現 &amp; 即時応答)
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    — Mondai 3 Situational Utterances (⬇ You) &amp; Mondai 4/5 Quick Reflexes
                  </span>
                </div>

                {/* Live Sample Question Preview (れい Box) */}
                <div className="mt-4 rounded-sm border border-dashed border-[var(--ink)]/25 bg-[var(--surface)] p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold text-[var(--primary-fg)]">
                    (れい) 例題 · Situational Utterance (発話表現) &amp; Quick Response:
                  </div>
                  <div className="mt-1 font-japanese text-sm font-semibold text-[var(--ink)]">
                    ⬇ You: 電車の中で、お年寄りに席をゆずります。何と言いますか。
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 font-japanese text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--primary-fg)]">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--primary)] text-[10px]">●</span>
                      1 どうぞ、座ってください
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">2</span>
                      どうもすみませんでした
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="grid size-4 place-items-center rounded-full border border-[var(--ink)]/30 text-[10px]">3</span>
                      失礼しました
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ink)]/10 pt-3">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Mondai 3 ⬇ You (発話表現)</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">8s Exam Reflex Timer</span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 border border-[var(--line)]">Keigo Diagnostics</span>
                  </div>

                  <Link
                    href={`/games/jlpt/instant-reply?level=${targetLevelQuery}`}
                    className="inline-flex items-center gap-2 rounded-sm bg-[var(--primary)] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    <span>演習をはじめる / Start Drill</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </section>
            </main>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
