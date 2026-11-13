import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Flame, Layers, MessageSquare, Sparkles } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { DueReviewCount } from "@/components/due-review-count";
import { getAllLearnDocs } from "@/lib/content/learn";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import { StoriesBookIllustration } from "@/components/icons/StoriesBookIllustration";
import { DialogueSceneIllustration } from "@/components/icons/DialogueSceneIllustration";

interface ModuleCardConfig {
  title: string;
  subtitleJa: string;
  description: string;
  badge: string;
  href: string;
  soon?: boolean;
  statusLabel?: string;
  tags?: string[];
}

function getSections(learnGuideCount: number): Array<{
  id: string;
  title: string;
  titleJa: string;
  description: string;
  cards: ModuleCardConfig[];
}> {
  return [
    {
      id: "core-practice",
      title: "Core Practice",
      titleJa: "基礎・実践トレーニング",
      description: "Build fluency with focused daily drills across characters, words, listening, and real-world conversation.",
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
          title: "Grammar Practice",
          subtitleJa: "文法問題・並べ替え",
          description: "Put grammar to work with interactive particle cloze and sentence-scramble games.",
          badge: "学",
          href: "/games/grammar",
          statusLabel: "Ready",
          tags: ["Cloze Fill", "Sentence Order", "Instant Explanations"],
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
        {
          title: "Shiritori Word Chain",
          subtitleJa: "しりとり言葉連鎖",
          description: "Chain Japanese words by their final kana in survival, blitz, or local friend mode.",
          badge: "鎖",
          href: "/games/shiritori",
          statusLabel: "Live",
          tags: ["Survival", "Timed Blitz", "2P Friend Mode"],
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
      ],
    },
    {
      id: "learn-reference",
      title: "Learn & Reference",
      titleJa: "文法・参考書・多読",
      description: "Study patterns, examples, practical grammar guides, and voiced graded stories.",
      cards: [
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
          title: "Kanji Reading & Radicals Hub",
          subtitleJa: "部首パズル・筆順・読み",
          description: "Browse kanji by grade or combine constituent radicals, inspect readings, and trace strokes in the playground.",
          badge: "読",
          href: "/games/kanji/reading",
          statusLabel: "Ready",
          tags: ["Radical Forge", "Stroke Order", "On & Kun Readings"],
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
      ],
    },
    {
      id: "tools",
      title: "Tools",
      titleJa: "辞書・形態素解析ツール",
      description: "Look up words and explore how Japanese sentences fit together.",
      cards: [
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

function ModuleCard({
  title,
  subtitleJa,
  description,
  badge,
  href,
  soon,
  statusLabel,
  tags = [],
}: ModuleCardConfig) {
  const contents = (
    <>
      {/* Subtle decorative corner watermark glyph */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-4 select-none font-japanese text-8xl font-bold text-[var(--primary-fg)] opacity-[0.045] transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.09]"
      >
        {badge}
      </span>

      <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)] font-japanese text-2xl font-bold text-[var(--primary-fg)] shadow-xs transition-transform duration-200 group-hover:scale-105">
            {badge}
          </span>
          <span className="font-japanese text-xs font-bold tracking-wider text-[var(--muted)]">
            {subtitleJa}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
            soon
              ? "bg-[var(--sakura-light)] text-[var(--muted)]"
              : "bg-[var(--correct)]/15 text-[var(--correct)]"
          }`}
        >
          {soon ? "Coming soon" : statusLabel ?? "Ready"}
        </span>
      </div>

      <h3 className="relative z-10 text-lg font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--primary-fg)] transition-colors">
        {title}
      </h3>
      <p className="relative z-10 mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>

      {tags.length > 0 && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[var(--line)] bg-[var(--paper-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <span className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--line)]/70 pt-3.5 text-xs font-bold text-[var(--primary-fg)]">
        <span>{soon ? "In development" : "Explore Module"}</span>
        {!soon && (
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}
      </span>
    </>
  );

  const className =
    "group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_34px_rgba(188,0,45,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_20px_40px_rgba(208,16,76,0.12)] sm:p-6";

  return soon ? (
    <div aria-disabled="true" className={`${className} opacity-75`}>
      {contents}
    </div>
  ) : (
    <Link href={href} className={className}>
      {contents}
    </Link>
  );
}

export default function GamesHub() {
  const learnGuideCount = getAllLearnDocs().length;
  const sections = getSections(learnGuideCount);

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
        {/* Redesigned Architectural Washi Hero Deck */}
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

              {/* Quick-Jump Pill Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <a
                  href="#Core-Practice-heading"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <Flame className="size-3.5" />
                  Core Drills
                </a>
                <Link
                  href="/games/dialogue"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sakura)] bg-[var(--sakura-light)] px-3.5 py-2 text-xs font-bold text-[var(--primary-fg)] transition-colors hover:border-[var(--primary)]"
                >
                  <MessageSquare className="size-3.5" />
                  Dialogue Quest (New)
                </Link>
                <Link
                  href="/games/jlpt"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)]"
                >
                  <Compass className="size-3.5 text-[var(--primary-fg)]" />
                  JLPT Arena
                </Link>
                <Link
                  href="/stories"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--sakura)]"
                >
                  <BookOpen className="size-3.5 text-[var(--primary-fg)]" />
                  62 Stories
                </Link>
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
                  6 Scenes
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--ink)]">Dialogue Roleplay</p>
                <p className="text-[11px] text-[var(--muted)]">Directions, Kōban, Sensei &amp; more</p>
              </div>
            </div>
          </div>
        </header>

        {/* Daily Review Command Bar */}
        <section aria-labelledby="daily-review-heading" className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="daily-review-heading"
              className="text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              Daily Review
            </h2>
            <span className="font-japanese text-xs font-bold text-[var(--muted)]">
              記憶の定着 · FSRS Spaced Repetition
            </span>
          </div>
          <Link
            href="/review"
            className="group relative grid gap-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"
          >
            <div className="flex items-start gap-4 sm:items-center">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--sakura-light)] font-japanese text-3xl font-bold text-[var(--primary-fg)] shadow-xs">
                復
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                    Spaced repetition · Local-first
                  </p>
                  <span className="rounded-full bg-[var(--paper-tint)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                    Kana · Kanji · Vocab · Grammar
                  </span>
                </div>
                <h3 id="daily-review-title" className="mt-1 text-xl font-bold sm:text-2xl">
                  FSRS Review Hub
                </h3>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                  Keep kana, kanji, vocabulary, and grammar fresh with adaptive reviews scheduled for your memory.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <DueReviewCount />
              <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper-tint)] text-[var(--primary-fg)] transition-transform group-hover:translate-x-1 group-hover:border-[var(--sakura)]">
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </div>
          </Link>
        </section>

        {/* Main Sections */}
        {sections.map((section) => (
          <section
            key={section.title}
            aria-labelledby={`${section.title.replaceAll(" ", "-")}-heading`}
            className="mb-12"
          >
            <div className="mb-5 flex flex-col justify-between gap-1 border-b border-[var(--line)] pb-3 sm:flex-row sm:items-end">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2
                    id={`${section.title.replaceAll(" ", "-")}-heading`}
                    className="text-base font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]"
                  >
                    {section.title}
                  </h2>
                  <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                    · {section.titleJa}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.cards.map((card) => (
                <ModuleCard key={card.title} {...card} />
              ))}

              {/* Core Practice Featured Banners: 1. Dialogue Quest & 2. JLPT Exam Pattern Practice */}
              {section.title === "Core Practice" && (
                <>
                  {/* Featured Banner 1: Interactive Dialogue Quest */}
                  <Link
                    href="/games/dialogue"
                    className="group col-span-1 grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:col-span-2 lg:col-span-3 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8"
                  >
                    <div className="flex flex-col">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-japanese text-2xl font-bold text-white shadow-sm">
                          対
                        </span>
                        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                          SITUATIONAL ROLEPLAY SIMULATOR · 会話クエスト
                        </span>
                        <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-[11px] font-bold text-[var(--correct)]">
                          New · 6 Scenarios · N5–N3
                        </span>
                      </div>

                      <h3 className="text-xl font-bold sm:text-2xl">
                        Dialogue Quest: Real-World Japanese Roleplay (
                        <span className="font-japanese">実践・会話ロールプレイング</span>)
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                        Practice branching multi-turn conversations in real Japanese situations — ask a passerby for directions to McDonald&apos;s, report a lost wallet to a police officer, request an extension from your teacher, call your house owner, or chat with a farmer while managing the social atmosphere (<span className="font-japanese">空気ゲージ</span>).
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          👩‍💼 Asking Directions (<span className="font-japanese">マクドナルドへの道案内</span> · N5)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          👮‍♂️ Police Officer (<span className="font-japanese">交番で財布の遺失届</span> · N4)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          👩‍🏫 Teacher Consultation (<span className="font-japanese">先生に宿題の相談</span> · N4)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          🏠 House Owner (<span className="font-japanese">大家さんにエアコン修理依頼</span> · N3)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          👔 Employer / Manager (<span className="font-japanese">店長にシフト変更相談</span> · N3)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          🌾 Local Farmer (<span className="font-japanese">朝市で野菜と果物を買う</span> · N5)
                        </span>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[var(--primary-fg)]">
                        <span>Start Roleplay Dialogue →</span>
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center lg:pl-4">
                      <DialogueSceneIllustration className="h-52 w-40 shrink-0 transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-[1.03] sm:h-56 sm:w-44" />
                    </div>
                  </Link>

                  {/* Featured Banner 2: JLPT Exam Pattern Practice */}
                  <Link
                    href="/games/jlpt"
                    className="group col-span-1 grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:col-span-2 lg:col-span-3 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8"
                  >
                    <div className="flex flex-col">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-japanese text-2xl font-bold text-white shadow-sm">
                          試
                        </span>
                        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                          JLPT &amp; NAT-TEST ARENA
                        </span>
                        <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-[11px] font-bold text-[var(--correct)]">
                          Live · N5–N1
                        </span>
                      </div>

                      <h3 className="text-xl font-bold sm:text-2xl">
                        JLPT Exam Pattern Practice (
                        <span className="font-japanese">日本語能力試験・問題演習</span>)
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                        Train with interactive drills modeled directly on official JLPT and NAT-TEST question archetypes (Mondai) across N5 to N1 — building speed, syntactic accuracy, and trap recognition without static PDF mock papers.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          ★ Star Sentence Scramble (<span className="font-japanese">星問題</span> · Live)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          <span className="font-japanese">漢字</span> Phonetic Trap Sniper (<span className="font-japanese">漢字読み・表記</span> · Live)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          <span className="font-japanese">類義</span> Synonym Paraphrase (<span className="font-japanese">言い換え類義</span> · Live)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          <span className="font-japanese">聴解</span> Quick Response Blitz (<span className="font-japanese">即時応答</span> · Live)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          <span className="font-japanese">文章</span> Paragraph Cloze (<span className="font-japanese">文章の文法</span> · Live)
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                          <span className="font-japanese">情報</span> Info Scanner (<span className="font-japanese">情報検索</span> · Live)
                        </span>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[var(--primary-fg)]">
                        <span>Enter Exam Arena →</span>
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center lg:pl-4">
                      <JlptPaperIllustration className="h-52 w-40 shrink-0 transition-transform duration-300 group-hover:rotate-1 group-hover:scale-[1.03] sm:h-56 sm:w-44" />
                    </div>
                  </Link>
                </>
              )}

              {/* Learn & Reference 4th Item: Inflated Stories & Graded Reading Banner */}
              {section.title === "Learn & Reference" && (
                <Link
                  href="/stories"
                  className="group col-span-1 grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:col-span-2 lg:col-span-3 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8"
                >
                  <div className="flex flex-col">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--primary)] font-japanese text-2xl font-bold text-white shadow-sm">
                        話
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                        JAPANESE GRADED READER · 多読・読み物
                      </span>
                      <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-[11px] font-bold text-[var(--correct)]">
                        Live · N5–N3 · 62 Stories
                      </span>
                    </div>

                    <h3 className="text-xl font-bold sm:text-2xl">
                      Stories &amp; Graded Reading (
                      <span className="font-japanese">日本語多読・名作昔話・日常会話</span>)
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                      Immerse in authentic Japanese graded stories, everyday conversational scenes, anime pop-culture tales, and timeless folklore with interactive furigana, tap-to-inspect word breakdowns, bilingual sentence translation, and native audio speech narration.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">昔話</span> Classic Fairy Tales (<span className="font-japanese">桃太郎・花咲か爺さん</span> · 12 Stories)
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">日常</span> Everyday Life Scenes (<span className="font-japanese">大学・新幹線・空港</span> · 30 Stories)
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">音声</span> Full Audio Narration (<span className="font-japanese">自然な音声読み上げ</span> · Live)
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">振仮名</span> Interactive Furigana &amp; Hover Vocabulary
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">対訳</span> Bilingual Sentence Breakdown (<span className="font-japanese">英語対訳</span>)
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)] bg-[var(--sakura-light)] px-3 py-1 text-xs font-bold text-[var(--primary-fg)]">
                        <span className="font-japanese">読解</span> Comprehension Quizzes (<span className="font-japanese">読解演習</span> · Live)
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[var(--primary-fg)]">
                      <span>Read Stories &amp; Folk Tales →</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:pl-4">
                    <StoriesBookIllustration className="h-52 w-40 shrink-0 transition-transform duration-300 group-hover:rotate-1 group-hover:scale-[1.03] sm:h-56 sm:w-44" />
                  </div>
                </Link>
              )}

              {/* Tools Section Companion Panel: Interactive Morphological Breakdown Preview */}
              {section.title === "Tools" && (
                <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper-tint)] p-6 sm:col-span-1 lg:col-span-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                        <Layers className="size-3.5" />
                        Live Morphological Engine Preview
                      </span>
                      <span className="font-japanese text-xs font-bold text-[var(--muted)]">
                        形態素解析・Kuromoji
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Paste any Japanese sentence into the analyzer to inspect parts of speech, dictionary base forms, pitch readings, and constituent kanji cards:
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
                      {[
                        { surface: "彼", reading: "かれ", pos: "Noun" },
                        { surface: "は", reading: "わ", pos: "Particle" },
                        { surface: "疲れて", reading: "つかれて", pos: "Verb (連用)" },
                        { surface: "いた", reading: "いた", pos: "Aux Verb" },
                        { surface: "。しかし、", reading: "しかし", pos: "Conjunction" },
                        { surface: "宿題", reading: "しゅくだい", pos: "Noun" },
                        { surface: "を", reading: "お", pos: "Particle" },
                        { surface: "終わらせた", reading: "おわらせた", pos: "Verb (Causative)" },
                      ].map((token, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center rounded-lg border border-[var(--sakura)]/50 bg-[var(--sakura-light)]/50 px-2.5 py-1.5 text-center"
                        >
                          <span className="text-[10px] font-semibold text-[var(--muted)]">
                            {token.reading}
                          </span>
                          <span className="font-japanese text-sm font-bold text-[var(--ink)]">
                            {token.surface}
                          </span>
                          <span className="mt-0.5 text-[9px] font-bold uppercase text-[var(--primary-fg)]">
                            {token.pos}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--line)]/70 pt-3 text-xs text-[var(--muted)]">
                    <span>Supports reverse English lookup, JLPT tagging &amp; instant VOICEVOX speech</span>
                    <Link
                      href="/dictionary"
                      className="font-bold text-[var(--primary-fg)] hover:underline"
                    >
                      Open Analyzer →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}

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
