import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nihongo Master — Kana, Kanji & JLPT",
    short_name: "Nihongo",
    description:
      "Local-first Japanese learning platform for Kana, Kanji, Vocabulary, Grammar, Graded Stories, and FSRS Spaced Repetition.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6F1",
    theme_color: "#D0104C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

