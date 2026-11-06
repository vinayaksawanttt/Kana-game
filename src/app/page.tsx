import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { DueReviewCount } from "@/components/due-review-count";
import { getAllLearnDocs } from "@/lib/content/learn";

function getSections(learnGuideCount: number) {
  return [
  {
    title: "Core Practice",
    description: "Build fluency with focused daily drills.",
    cards: [
      {
        title: "Kana",
        description: "Recognize hiragana and katakana, one row at a time.",
        badge: "あ",
        href: "/games/kana",
      },
      {
        title: "Kanji Meaning",
        description: "Learn the meanings of JLPT and school-grade kanji.",
        badge: "漢",
        href: "/games/kanji/meaning",
      },
      {
        title: "Radical Builder",
        description: "Explore kanji by their radicals, readings, meanings, and examples.",
        badge: "部",
        href: "/games/kanji/radicals",
      },
      {
        title: "Kanji Reading",
        description: "Browse kanji by JLPT and grade, inspect readings, and trace strokes in the playground.",
        badge: "読",
        href: "/games/kanji/reading",
      },
      {
        title: "Vocabulary",
        description: "Recall the meaning of Japanese words by JLPT level.",
        badge: "語",
        href: "/games/vocabulary",
      },
      {
        title: "Shiritori Word Chain",
        description: "Chain Japanese words by their final kana in survival, blitz, or friend mode.",
        badge: "鎖",
        href: "/games/shiritori",
        statusLabel: "Live",
      },
      {
        title: "Listening Practice",
        description: "Train your Japanese ear with Kana dictation, spoken JLPT vocabulary, and sentence comprehension.",
        badge: "聴",
        href: "/games/listening",
        statusLabel: "Live",
      },
    ],
  },
  {
    title: "Learn & Reference",
    description: "Study patterns, examples, and practical grammar guides.",
    cards: [
      {
        title: "Grammar Library",
        description: "Browse JLPT grammar points, formations, and examples.",
        badge: "文",
        href: "/grammar",
      },
      {
        title: "Grammar Practice",
        description: "Put grammar to work with cloze and sentence-scramble games.",
        badge: "学",
        href: "/games/grammar",
      },
      {
        title: "Stories & Reading",
        description: "Read JLPT N5–N4 graded stories and classic fairy tales with furigana and vocabulary notes.",
        badge: "話",
        href: "/stories",
      },
      {
        title: "Cheat Sheets & Study Guides",
        description: "Browse Japanese reference sheets grouped by topic and JLPT level.",
        badge: String(learnGuideCount),
        href: "/learn",
        statusLabel: "Live",
      },
    ],
  },
  {
    title: "Tools",
    description: "Look up words and explore how Japanese sentences fit together.",
    cards: [
      {
        title: "Dictionary & Sentence Analyzer",
        description: "Search words or break a sentence down into readings and meanings.",
        badge: "辞",
        href: "/dictionary",
      },
    ],
  },
  ];
}

function ModuleCard({
  title,
  description,
  badge,
  href,
  soon,
  statusLabel,
}: {
  title: string;
  description: string;
  badge: string;
  href: string;
  soon?: boolean;
  statusLabel?: string;
}) {
  const contents = (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-2xl text-[var(--primary-fg)]">
          {badge}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            soon
              ? "bg-[var(--sakura-light)] text-[var(--muted)]"
              : "bg-[var(--correct)]/15 text-[var(--correct)]"
          }`}
        >
          {soon ? "Coming soon" : statusLabel ?? "Ready"}
        </span>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      <span className="mt-5 flex items-center justify-between text-xs font-bold text-[var(--primary-fg)]">
        {soon ? "In development" : "Explore"}
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
    "group flex min-h-52 flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_34px_rgba(188,0,45,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_20px_40px_rgba(208,16,76,0.12)]";

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
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-12 sm:px-8">
        <header className="py-8 sm:py-11">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary-fg)]">
            Japanese, one small step at a time
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Choose your game</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Choose a focused practice mode, review what you know, or explore the language.
          </p>
        </header>

        <section aria-labelledby="daily-review-heading" className="mb-10">
          <h2
            id="daily-review-heading"
            className="mb-4 text-sm font-extrabold uppercase tracking-[0.14em]"
          >
            Daily Review
          </h2>
          <Link
            href="/review"
            className="group grid gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_38px_rgba(188,0,45,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--sakura)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.14)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] font-japanese text-3xl text-[var(--primary-fg)]">
                復
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Spaced repetition · Local-first
                </p>
                <h3 id="daily-review-title" className="mt-1 text-xl font-bold sm:text-2xl">
                  FSRS Review Hub
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                  Keep kana, kanji, vocabulary, and grammar fresh with reviews scheduled for your
                  memory.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <DueReviewCount />
              <ArrowRight
                size={20}
                className="text-[var(--primary-fg)] transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        </section>

        {getSections(learnGuideCount).map((section) => (
          <section key={section.title} aria-labelledby={`${section.title.replaceAll(" ", "-")}-heading`} className="mb-10">
            <div className="mb-4">
              <h2
                id={`${section.title.replaceAll(" ", "-")}-heading`}
                className="text-sm font-extrabold uppercase tracking-[0.14em]"
              >
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.cards.map((card) => (
                <ModuleCard key={card.title} {...card} />
              ))}
            </div>
          </section>
        ))}

        <footer className="border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">
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
        </footer>
      </section>
    </GameLayout>
  );
}
