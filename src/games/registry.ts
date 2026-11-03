export interface GameEntry {
  id: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  status: "live" | "soon";
  ctaLabel?: string;
}

export const games: GameEntry[] = [
  {
    id: "kana",
    title: "Kana Practice",
    description: "Build confidence with hiragana and katakana.",
    href: "/games/kana",
    badge: "あ",
    status: "live",
    ctaLabel: "Practice kana",
  },
  {
    id: "kanji-meaning",
    title: "Kanji Meaning",
    description: "Recognize JLPT and school-grade kanji and learn what they mean.",
    href: "/games/kanji/meaning",
    badge: "漢",
    status: "live",
    ctaLabel: "Practice meanings",
  },
  {
    id: "kanji-radicals",
    title: "Radical Builder",
    description: "Explore kanji by their radicals, readings, meanings, and example sentences.",
    href: "/games/kanji/radicals",
    badge: "部",
    status: "live",
    ctaLabel: "Explore radicals",
  },
  {
    id: "vocabulary",
    title: "Vocabulary Meaning",
    description: "Type the English meaning of Japanese words.",
    href: "/games/vocabulary",
    badge: "語",
    status: "live",
    ctaLabel: "Practice words",
  },
  {
    id: "grammar",
    title: "Grammar Practice",
    description: "Master JLPT N5–N1 grammar patterns with Sentence Cloze and Syntax Scramble.",
    href: "/games/grammar",
    badge: "文",
    status: "live",
    ctaLabel: "Practice grammar",
  },
  {
    id: "grammar-library",
    title: "Grammar Reference",
    description: "Browse 800+ JLPT grammar guides with formations, examples, and 1-tap FSRS saving.",
    href: "/grammar",
    badge: "典",
    status: "live",
    ctaLabel: "Open library",
  },
  {
    id: "learn",
    title: "Cheat Sheets & Study Guides",
    description: "Browse Japanese reference sheets grouped by topic and JLPT level.",
    href: "/learn",
    badge: "学",
    status: "live",
    ctaLabel: "Browse study guides",
  },
  {
    id: "stories",
    title: "Reading Practice",
    badge: "読",
    description: "JLPT graded micro-stories and fairy tales with furigana and instant FSRS lookup.",
    href: "/stories",
    status: "live",
    ctaLabel: "Read stories",
  },
  {
    id: "dictionary",
    title: "Dictionary & Analyzer",
    badge: "辞",
    description: "Offline Japanese sentence analyzer with furigana breakdown, kanji extraction, and English keyword search.",
    href: "/dictionary",
    status: "live",
    ctaLabel: "Open analyzer",
  },
  {
    id: "review",
    title: "FSRS Review Hub",
    description: "Adaptive spaced-repetition reviews tailored to your memory curve.",
    href: "/review",
    badge: "復",
    status: "live",
    ctaLabel: "Open reviews",
  },
];
