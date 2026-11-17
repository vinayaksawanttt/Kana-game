import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Flame, Sparkles } from "lucide-react";
import { GameLayout } from "@/components/layout/game-layout";
import { DueReviewCount } from "@/components/layout/due-review-count";
import { getAllLearnDocs } from "@/lib/content/learn";
import { DIALOGUE_SCENARIOS } from "@/data/dialogue";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import { StoriesBookIllustration } from "@/components/icons/StoriesBookIllustration";
import { DialogueSceneIllustration } from "@/components/icons/DialogueSceneIllustration";
import { GamesHubCatalog, type HubSectionConfig } from "@/components/hub/GamesHubCatalog";

function getSections(learnGuideCount: number, dialogueEpisodeCount: number): HubSectionConfig[] {
  return [
    {
      id: "daily-review",
      filterLabel: "Daily Review",
      title: "Daily Review & Weak Spots",
      titleJa: "毎日の復習・弱点克服",
      description: "Reinforce memory with adaptive FSRS spaced repetition and target past mistakes.",
      cards: [
        {
          title: "FSRS Review Hub",
          subtitleJa: "間隔反復・記憶定着",
          description: "Keep kana, kanji, vocabulary, and grammar fresh with adaptive reviews scheduled for your memory.",
          badge: "復",
          href: "/review",
          statusLabel: "Local-First",
          tags: ["Adaptive FSRS", "Kana & Kanji", "Vocab & Grammar"],
        },
        {
          title: "Mistake Bank",
          subtitleJa: "弱点ノート・間違い復習",
          description: "Review grammar, vocabulary, and JLPT questions you missed during practice sessions.",
          badge: "省",
          href: "/learn/mistake-bank",
          statusLabel: "Remediation",
          tags: ["Error Log", "Targeted Drills", "Self-Correction"],
        },
        {
          title: "Missed Kanji",
          subtitleJa: "苦手漢字リスト",
          description: "Focus specifically on kanji characters that tripped you up in meaning or reading drills.",
          badge: "苦",
          href: "/learn/missed-kanji",
          statusLabel: "Targeted",
          tags: ["Kanji Weak Spots", "Quick Retest", "Stroke & Meaning"],
        },
      ],
    },
    {
      id: "building-blocks",
      filterLabel: "Building Blocks",
      title: "Script & Building Blocks",
      titleJa: "文字・語彙の基礎固め",
      description: "Master Japanese scripts, kanji meanings and readings, radical composition, and core JLPT vocabulary.",
      cards: [
        {
          title: "Kana",
          subtitleJa: "ひらがな・カタカナ",
          description: "Recognize hiragana and katakana, one row at a time with native studio pronunciation.",
          badge: "あ",
          href: "/games/kana",
          statusLabel: "Ready",
          tags: ["Seion", "Dakuten", "Yōon Combo"],
        },
        {
          title: "Kanji Meaning",
          subtitleJa: "漢字の意味・暗記",
          description: "Learn the core meanings of JLPT N5–N1 and school-grade Jōyō kanji with fast recall drills.",
          badge: "漢",
          href: "/games/kanji/meaning",
          statusLabel: "Ready",
          tags: ["JLPT N5–N1", "Grades 1–8", "Heisig Keywords"],
        },
        {
          title: "Kanji Reading & Radicals Hub",
          subtitleJa: "部首パズル・筆順・読み",
          description: "Browse kanji by grade or combine constituent radicals, inspect readings, and trace strokes in the playground.",
          badge: "読",
          href: "/games/kanji/reading",
          statusLabel: "Ready",
          tags: ["Radical Forge", "Stroke Order", "On & Kun Readings"],
        },
        {
          title: "Vocabulary",
          subtitleJa: "JLPT語彙マスター",
          description: "Recall the meaning and reading of essential Japanese words organized by JLPT level.",
          badge: "語",
          href: "/games/vocabulary",
          statusLabel: "Ready",
          tags: ["N5–N1 Decks", "Audio Clips", "Context Clues"],
        },
      ],
    },
    {
      id: "immersion",
      filterLabel: "Immersion",
      title: "Immersion & Real-World Play",
      titleJa: "実践会話・多読・聴解ゲーム",
      description: "Step into voiced visual-novel roleplay, graded stories, ear training, and word-chain games.",
      cards: [
        {
          title: "Dialogue Quest: Real-World Japanese Roleplay",
          subtitleJa: "実践・会話ロールプレイング",
          description: "Navigate branching visual-novel conversations in authentic Japanese scenarios while reading the social atmosphere (空気).",
          badge: "対",
          href: "/games/dialogue",
          statusLabel: `${dialogueEpisodeCount} Episodes`,
          tags: [`${dialogueEpisodeCount} Episodes`, "N5–N1", "Voiced VN"],
        },
        {
          title: "Stories & Graded Reading",
          subtitleJa: "日本語多読・名作昔話・日常会話",
          description: "Immerse in voiced Japanese folk tales and everyday stories with interactive furigana and tap-to-inspect vocabulary.",
          badge: "話",
          href: "/stories",
          statusLabel: "62 Stories",
          tags: ["62 Stories", "N5–N3", "Voiced Audio"],
        },
        {
          title: "Listening Practice",
          subtitleJa: "聴解・ディクテーション",
          description: "Train your Japanese ear with Kana dictation, spoken JLPT vocabulary, and sentence comprehension.",
          badge: "聴",
          href: "/games/listening",
          statusLabel: "Live",
          tags: ["Kana Dictation", "Spoken Vocab", "Sentence Ear"],
        },
        {
          title: "Shiritori Word Chain",
          subtitleJa: "しりとり言葉連鎖",
          description: "Chain Japanese words by their final kana in survival, blitz, or local friend mode.",
          badge: "鎖",
          href: "/games/shiritori",
          statusLabel: "Live",
          tags: ["Survival", "Timed Blitz", "2P Friend Mode"],
        },
      ],
    },
    {
      id: "jlpt-prep",
      filterLabel: "JLPT Prep",
      title: "Grammar & JLPT Exam Prep",
      titleJa: "文法演習・日本語能力試験対策",
      description: "Sharpen sentence construction and train with interactive drills modeled on official JLPT question archetypes.",
      cards: [
        {
          title: "JLPT Exam Pattern Practice",
          subtitleJa: "日本語能力試験・問題演習",
          description: "Train across 8 official JLPT & NAT-TEST question archetypes (Star Scramble, Phonetic Traps, Instant Reply, Cloze, and more).",
          badge: "試",
          href: "/games/jlpt",
          statusLabel: "8 Exam Modes",
          tags: ["8 Exam Modes", "N5–N1", "Mondai Drills"],
        },
        {
          title: "Grammar Practice",
          subtitleJa: "文法問題・並べ替え",
          description: "Put grammar to work with interactive particle cloze and sentence-scramble games.",
          badge: "学",
          href: "/games/grammar",
          statusLabel: "Ready",
          tags: ["Cloze Fill", "Sentence Order", "Instant Explanations"],
        },
      ],
    },
    {
      id: "reference-tools",
      filterLabel: "Reference & Tools",
      title: "Reference & Tools",
      titleJa: "文法辞典・学習ガイド・形態素解析",
      description: "Look up grammar nuances, study topic cheat sheets, or break down any Japanese sentence into tokens.",
      cards: [
        {
          title: "Textbook Companion (Genki I & II)",
          subtitleJa: "教科書マスター・げんき",
          description: "Follow textbook-curated lessons for Genki I & II with synchronized vocabulary audio, kanji stroke diagrams, and grammar drills.",
          badge: "本",
          href: "/books",
          statusLabel: "23 Lessons",
          tags: ["Genki I (N5)", "Genki II (N4)", "Vocab / Kanji / Grammar"],
        },
        {
          title: "Grammar Library",
          subtitleJa: "日本語文法辞典",
          description: "Browse 828 JLPT N5–N1 grammar points, formation rules, nuances, and voiced example sentences.",
          badge: "文",
          href: "/grammar",
          statusLabel: "828 Points",
          tags: ["N5–N1 Index", "Formations", "Voiced Examples"],
        },
        {
          title: "Cheat Sheets & Study Guides",
          subtitleJa: "要点まとめ・学習ガイド",
          description: "Browse Japanese reference sheets grouped by topic and JLPT level.",
          badge: String(learnGuideCount),
          href: "/learn",
          statusLabel: "Live",
          tags: ["Keigo & Counters", "Conjugation Tables", "Print Ready"],
        },
        {
          title: "Dictionary & Sentence Analyzer",
          subtitleJa: "辞書・文章構造分解",
          description: "Search words or break any Japanese sentence down into Kuromoji tokens, readings, kanji cards, and meanings.",
          badge: "辞",
          href: "/dictionary",
          statusLabel: "Ready",
          tags: ["Kuromoji Tokenizer", "Kanji Breakdown", "Voice Playback"],
        },
      ],
    },
  ];
}

export default function GamesHub() {
  const learnGuideCount = getAllLearnDocs().length;
  const dialogueEpisodeCount = DIALOGUE_SCENARIOS.length;
  const sections = getSections(learnGuideCount, dialogueEpisodeCount);

  return (
    <GameLayout
      label="NIHONGO GAMES"
      glyph="遊"
      rightSlot={
        <a
          href="https://github.com/VinayakSawant859/Kana-game"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="grid size-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:text-[var(--primary-fg)]"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
          </svg>
        </a>
      }
    >
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-14 sm:px-8">
        {/* Compact Hero Command Center */}
        <header className="relative my-6 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_48px_rgba(188,0,45,0.065)] sm:my-8 sm:p-9">
          {/* Decorative Background Kanji Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-8 select-none font-japanese text-[11rem] font-black leading-none text-[var(--primary-fg)] opacity-[0.04] sm:text-[14rem]"
          >
            道場
          </div>

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--sakura-light)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                  <Sparkles className="size-3.5" />
                  Japanese, one small step at a time
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3 py-1 font-japanese text-xs font-bold text-[var(--muted)]">
                  日本語学習道場 · N5–N1
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
                Choose your game
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                Choose a focused practice mode, step into voiced real-world roleplay dialogues, review what you know with FSRS spaced repetition, or explore the language.
              </p>

              {/* Integrated Hero Command Bar: FSRS Review CTA + DueReviewCount */}
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/review"
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--sakura)]/80 bg-[var(--paper-tint)]/90 p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_14px_30px_rgba(208,16,76,0.12)] sm:p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--primary)] font-japanese text-2xl font-bold text-white shadow-xs">
                      復
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                          FSRS Review Hub
                        </span>
                        <span className="rounded-full bg-[var(--sakura-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-fg)]">
                          Adaptive Spaced Repetition
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-extrabold text-[var(--ink)] transition-colors group-hover:text-[var(--primary-fg)]">
                        Start FSRS Review →
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Kana, kanji, vocabulary &amp; grammar due today
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DueReviewCount />
                    <span className="grid size-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--primary-fg)] transition-transform group-hover:translate-x-1 group-hover:border-[var(--sakura)]">
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>

                {/* Quick-Jump Pill Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="#category-catalog"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                  >
                    <Flame className="size-3.5" />
                    Browse All Modules
                  </a>
                  <Link
                    href="/learn/mistake-bank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)]"
                  >
                    <Compass className="size-3.5 text-[var(--primary-fg)]" />
                    Mistake Bank
                  </Link>
                  <Link
                    href="/dictionary"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)]"
                  >
                    <BookOpen className="size-3.5 text-[var(--primary-fg)]" />
                    Sentence Analyzer
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Live Dojo Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4">
                <span className="font-japanese text-2xl font-extrabold text-[var(--primary-fg)]">
                  2,136
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--ink)]">Jōyō Kanji &amp; Radicals</p>
                <p className="text-[11px] text-[var(--muted)]">Stroke order &amp; component forge</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4">
                <span className="font-japanese text-2xl font-extrabold text-[var(--primary-fg)]">
                  828
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--ink)]">JLPT Grammar Points</p>
                <p className="text-[11px] text-[var(--muted)]">N5–N1 lessons &amp; cloze drills</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4">
                <span className="font-japanese text-2xl font-extrabold text-[var(--primary-fg)]">
                  62
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--ink)]">Voiced Graded Stories</p>
                <p className="text-[11px] text-[var(--muted)]">Folklore, anime &amp; daily life</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-4">
                <span className="font-japanese text-2xl font-extrabold text-[var(--primary-fg)]">
                  {dialogueEpisodeCount} Episodes
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--ink)]">Dialogue Roleplay</p>
                <p className="text-[11px] text-[var(--muted)]">JLPT N5–N1 voiced visual novel</p>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Experiences Bento Row (3-Column) */}
        <section aria-labelledby="featured-experiences-heading" className="mb-10">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2.5">
              <h2
                id="featured-experiences-heading"
                className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]"
              >
                Featured Experiences
              </h2>
              <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                · 注目コンテンツ
              </span>
            </div>
            <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">
              Immersive roleplay, official exam drills &amp; graded reading
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Featured 1: Dialogue Quest */}
            <Link
              href="/games/dialogue"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:p-6"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] font-japanese text-xl font-bold text-white shadow-xs">
                        対
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                        Roleplay VN · 会話クエスト
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--primary-fg)]">
                      Dialogue Quest: Real-World Japanese Roleplay
                    </h3>
                  </div>
                  <DialogueSceneIllustration className="h-24 w-20 shrink-0 transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105" />
                </div>

                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  Step into voiced visual-novel conversations across daily life, campus, business, and romance while reading the social atmosphere (<span className="font-japanese">空気</span>).
                </p>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap gap-1.5">
                  {[`${dialogueEpisodeCount} Episodes`, "N5–N1", "Voiced VN"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--sakura)]/70 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)]/70 pt-3 text-xs font-bold text-[var(--primary-fg)]">
                  <span>Start Roleplay Dialogue</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>

            {/* Featured 2: JLPT Exam Pattern Practice */}
            <Link
              href="/games/jlpt"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:p-6"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] font-japanese text-xl font-bold text-white shadow-xs">
                        試
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                        JLPT Arena · 問題演習
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--primary-fg)]">
                      JLPT Exam Pattern Practice
                    </h3>
                  </div>
                  <JlptPaperIllustration className="h-24 w-20 shrink-0 transition-transform duration-300 group-hover:rotate-2 group-hover:scale-105" />
                </div>

                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  Train with interactive drills modeled on official JLPT and NAT-TEST question archetypes — Star Scramble, Phonetic Traps, Instant Reply, and Cloze.
                </p>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap gap-1.5">
                  {["8 Exam Modes", "N5–N1", "Mondai Drills"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--sakura)]/70 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)]/70 pt-3 text-xs font-bold text-[var(--primary-fg)]">
                  <span>Enter Exam Arena</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>

            {/* Featured 3: Stories & Graded Reading */}
            <Link
              href="/stories"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:p-6"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] font-japanese text-xl font-bold text-white shadow-xs">
                        話
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                        Graded Reader · 多読
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--primary-fg)]">
                      Stories &amp; Graded Reading
                    </h3>
                  </div>
                  <StoriesBookIllustration className="h-24 w-20 shrink-0 transition-transform duration-300 group-hover:rotate-2 group-hover:scale-105" />
                </div>

                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  Immerse in voiced Japanese folk tales and everyday stories with interactive furigana, tap-to-inspect vocabulary, and comprehension quizzes.
                </p>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap gap-1.5">
                  {["62 Stories", "N5–N3", "Voiced Audio"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[var(--sakura)]/70 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)]/70 pt-3 text-xs font-bold text-[var(--primary-fg)]">
                  <span>Read Stories &amp; Folk Tales</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Interactive Category Filter & Module Grid */}
        <GamesHubCatalog sections={sections} />

        <footer className="border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <p>
              Kanji &amp; dictionary data derived from{" "}
              <a
                href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--primary-fg)]"
              >
                KANJIDIC2
              </a>{" "}
              and{" "}
              <a
                href="https://www.edrdg.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--primary-fg)]"
              >
                EDRDG
              </a>{" "}
              (CC BY-SA 3.0 / 4.0).
            </p>
            <p className="font-japanese text-[11px] font-bold text-[var(--muted)]">
              継続は力なり · Persistence is strength
            </p>
          </div>
        </footer>
      </section>
    </GameLayout>
  );
}
