import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Headphones, CheckCircle2 } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { JlptPaperIllustration } from "@/components/icons/JlptPaperIllustration";
import { STAR_SCRAMBLE_ITEMS, getStarScrambleCountsByLevel } from "@/engine/jlptStarScramble";

const EXAM_SECTIONS = [
  {
    code: "文字・語彙",
    title: "Language Knowledge (Vocabulary & Kanji)",
    description:
      "Tests kanji readings, orthographic accuracy, context-defined expressions, and near-synonym paraphrases.",
    icon: BookOpen,
  },
  {
    code: "文法・読解",
    title: "Grammar & Reading (Syntactic Structure)",
    description:
      "Evaluates sentence grammar, the notorious ★ Star Sentence Scramble (Mondai 2), and passage flow.",
    icon: Sparkles,
  },
  {
    code: "聴解",
    title: "Listening Comprehension (Spoken Response)",
    description:
      "Measures task-based listening, key-point extraction, and split-second conversational replies (即時応答).",
    icon: Headphones,
  },
] as const;

const EXAM_MODES = [
  {
    id: "star-scramble",
    badge: "★",
    mondaiTag: "文法・問題2 (Bunpō Mondai 2)",
    title: "★ Star Sentence Scramble (星問題 パズル)",
    description:
      "Reconstruct a 4-blank Japanese sentence from shuffled syntactic phrase tiles and pinpoint the exact tile that lands on the ★ Star slot — scored with both Official JLPT ★ Points and Full 4/4 Word-Order Mastery.",
    href: "/games/jlpt/star-scramble",
    status: "live" as const,
    ctaLabel: "Play Star Scramble",
    highlights: ["325+ N5–N1 Puzzles", "Dual ★ & Full-Order Scoring", "Exam Mode (No Hints)"],
  },
  {
    id: "phonetic-trap",
    badge: "読",
    mondaiTag: "文字・問題1 (Moji Mondai 1)",
    title: "Phonetic Trap Sniper (漢字読み・同音異義語)",
    description:
      "Defeat official JLPT reading traps: voiced rendaku vs. unvoiced readings, long vs. short vowels (おう/お), and small っ gemination distractors.",
    href: "/games/jlpt",
    status: "soon" as const,
    ctaLabel: "Coming Next",
    highlights: ["Rendaku & Chōon Traps", "N5–N1 Kanji In Context"],
  },
  {
    id: "paraphrase-match",
    badge: "類",
    mondaiTag: "語彙・問題4 & 5 (Goi Mondai 4–5)",
    title: "Synonym Paraphrase & Usage Match (言い換え類義・用法)",
    description:
      "Select the closest synonymous expression for an underlined word or spot the single natural usage of an advanced word across 4 sentences.",
    href: "/games/jlpt",
    status: "soon" as const,
    ctaLabel: "Coming Next",
    highlights: ["Near-Synonym Nuance", "Natural Context Detection"],
  },
  {
    id: "quick-response",
    badge: "応",
    mondaiTag: "聴解・問題4 (Chōkai Mondai 4)",
    title: "Quick Response Blitz (聴解・即時応答)",
    description:
      "Hear a short spoken utterance with zero printed options and choose the most natural immediate reply out of 3 spoken responses.",
    href: "/games/jlpt",
    status: "soon" as const,
    ctaLabel: "Coming Next",
    highlights: ["Pure Audio Reflex", "Keigo & Casual Register"],
  },
] as const;

export default function JlptArenaHubPage() {
  const countsByLevel = getStarScrambleCountsByLevel(STAR_SCRAMBLE_ITEMS);
  const totalStarQuestions = STAR_SCRAMBLE_ITEMS.length;

  return (
    <GameLayout
      label="JLPT & NAT EXAM ARENA"
      glyph="試"
      homeHref="/"
    >
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-14 sm:px-8">
        {/* Hero Banner */}
        <div className="mt-6 grid gap-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_16px_42px_rgba(188,0,45,0.06)] sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                Official Exam Archetypes
              </span>
              <span className="rounded-full bg-[var(--correct)]/15 px-3 py-1 text-xs font-bold text-[var(--correct)]">
                JLPT N5–N1 &amp; NAT-TEST
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              JLPT &amp; NAT Exam Arena{" "}
              <span className="font-japanese text-2xl font-normal text-[var(--muted)] sm:text-3xl">
                (日本語能力試験・問題演習)
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              The Japanese-Language Proficiency Test (JLPT) and Japanese NAT-TEST evaluate practical proficiency across five tiers from <strong>N5</strong> (foundational) to <strong>N1</strong> (advanced mastery). Train directly on the highest-yield official question formats (<em>Mondai</em>) with instant syntactic feedback, native neural audio, and FSRS spaced-repetition integration.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {(["N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => (
                <span
                  key={lvl}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)] px-3 py-1 text-xs font-bold"
                >
                  <span className="text-[var(--primary-fg)]">{lvl}</span>
                  <span className="text-[var(--muted)]">{countsByLevel[lvl]} ★ puzzles</span>
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/games/jlpt/star-scramble"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(208,16,76,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
              >
                <span>Play ★ Star Sentence Scramble</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <span className="text-xs font-semibold text-[var(--muted)]">
                {totalStarQuestions} interactive puzzles ready offline
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <JlptPaperIllustration className="h-60 w-48 shrink-0" />
          </div>
        </div>

        {/* 3 Official JLPT Sections Overview */}
        <section aria-labelledby="jlpt-sections-heading" className="mt-10">
          <div className="mb-4">
            <h2
              id="jlpt-sections-heading"
              className="text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              The 3 Official Exam Pillars
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              How the JLPT and NAT-TEST structure their test sections across N5 to N1.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {EXAM_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.code}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1 font-japanese text-xs font-bold text-[var(--primary-fg)]">
                      {sec.code}
                    </span>
                    <Icon size={18} className="text-[var(--primary-fg)]" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold">{sec.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {sec.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4 Exam Game Mode Cards */}
        <section aria-labelledby="jlpt-modes-heading" className="mt-10">
          <div className="mb-4">
            <h2
              id="jlpt-modes-heading"
              className="text-sm font-extrabold uppercase tracking-[0.14em]"
            >
              Exam Archetype Drills (Mondai Modes)
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Select a specialized JLPT question pattern to start a focused drill session.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {EXAM_MODES.map((mode) => {
              const isLive = mode.status === "live";
              const cardBody = (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-12 place-items-center rounded-full font-japanese text-2xl font-bold ${
                          isLive
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "bg-[var(--sakura-light)] text-[var(--primary-fg)]"
                        }`}
                      >
                        {mode.badge}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                        {mode.mondaiTag}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        isLive
                          ? "bg-[var(--correct)]/15 text-[var(--correct)]"
                          : "bg-[var(--sakura-light)] text-[var(--muted)]"
                      }`}
                    >
                      {isLive ? "Live" : "Coming Next"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold sm:text-xl">{mode.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {mode.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {mode.highlights.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]"
                      >
                        <CheckCircle2 size={12} className="text-[var(--primary-fg)]" />
                        {h}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs font-bold text-[var(--primary-fg)]">
                    <span>{mode.ctaLabel}</span>
                    {isLive && (
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </>
              );

              return isLive ? (
                <Link
                  key={mode.id}
                  href={mode.href}
                  className="group flex flex-col rounded-2xl border-2 border-[var(--sakura)] bg-[var(--surface)] p-6 shadow-[0_14px_34px_rgba(208,16,76,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_22px_44px_rgba(208,16,76,0.16)]"
                >
                  {cardBody}
                </Link>
              ) : (
                <div
                  key={mode.id}
                  aria-disabled="true"
                  className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 opacity-80"
                >
                  {cardBody}
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </GameLayout>
  );
}
