import fs from "node:fs";
import path from "node:path";
import { learnCategories, type LearnCategory } from "../src/lib/content/learn-schema";

type Motif = "waves" | "asanoha" | "enso" | "clouds" | "sakura" | "torii";

interface Theme {
  glyph: string;
  motif: Motif;
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/images/learn/fallbacks");
const themes: Record<LearnCategory, Theme> = {
  "Writing and sounds": { glyph: "音", motif: "waves" },
  Kanji: { glyph: "漢", motif: "asanoha" },
  "Numbers, time and counting": { glyph: "数", motif: "waves" },
  Verbs: { glyph: "動", motif: "clouds" },
  "Adjectives and adverbs": { glyph: "形", motif: "sakura" },
  "Particles and grammar": { glyph: "文", motif: "enso" },
  Vocabulary: { glyph: "語", motif: "asanoha" },
  "Politeness and communication": { glyph: "礼", motif: "clouds" },
  "Reading and exam skills": { glyph: "試", motif: "enso" },
  "Japan basics": { glyph: "日", motif: "torii" },
  "Reference cards": { glyph: "典", motif: "asanoha" },
};

function categorySlug(category: string): string {
  return category.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function motifMarkup(motif: Motif): string {
  switch (motif) {
    case "waves":
      return `<path d="M0 24Q18 4 36 24T72 24M0 48Q18 28 36 48T72 48" fill="none" stroke="#D0104C" stroke-opacity=".22" stroke-width="2"/>`;
    case "asanoha":
      return `<path d="M36 0 54 18 72 0M36 0 18 18 0 0M36 0v48M0 24h72M0 24l18 18 18-18 18 18 18-18" fill="none" stroke="#D0104C" stroke-opacity=".2" stroke-width="1.5"/>`;
    case "enso":
      return `<circle cx="36" cy="36" r="24" fill="none" stroke="#F596AA" stroke-opacity=".32" stroke-width="6" stroke-dasharray="125 30"/>`;
    case "clouds":
      return `<path d="M0 36c0-10 14-14 20-6 4-16 28-14 30 2 12-6 24 2 22 12H0zM8 62h40" fill="none" stroke="#D0104C" stroke-opacity=".2" stroke-width="2"/>`;
    case "sakura":
      return `<path d="M36 4c5 12 12 12 24 6-6 12-6 19 6 26-14 2-19 7-18 21-9-10-16-10-25 0 1-14-4-19-18-21 12-7 12-14 6-26 12 6 19 6 25-6z" fill="none" stroke="#D0104C" stroke-opacity=".2" stroke-width="1.5"/>`;
    case "torii":
      return `<path d="M10 15h52M18 7h36M20 15l4 44m28-44-4 44M10 30h52" fill="none" stroke="#D0104C" stroke-opacity=".2" stroke-width="2"/>`;
  }
}

function buildSvg(category: string, theme: Theme): string {
  const safeCategory = escapeXml(category);
  const glyph = escapeXml(theme.glyph);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" role="img" aria-label="${safeCategory} study guide illustration">
  <defs>
    <pattern id="geometry" width="72" height="72" patternUnits="userSpaceOnUse">${motifMarkup(theme.motif)}</pattern>
  </defs>
  <rect width="600" height="400" fill="#FFFDFB"/>
  <rect width="600" height="400" fill="#FDE7EC" fill-opacity=".42"/>
  <rect width="600" height="400" fill="url(#geometry)"/>
  <path d="M26 26h548v348H26z" fill="none" stroke="#F596AA" stroke-opacity=".42" stroke-width="2"/>
  <circle cx="300" cy="180" r="91" fill="#FFFDFB" fill-opacity=".94" stroke="#F596AA" stroke-width="3"/>
  <circle cx="300" cy="180" r="78" fill="none" stroke="#D0104C" stroke-opacity=".36" stroke-width="1.5" stroke-dasharray="3 6"/>
  <text x="300" y="207" text-anchor="middle" font-family="serif" font-size="82" font-weight="700" fill="#D0104C">${glyph}</text>
  <rect x="162" y="305" width="276" height="43" rx="21" fill="#FFFDFB" fill-opacity=".94" stroke="#F596AA" stroke-opacity=".55"/>
  <text x="300" y="333" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#D0104C">${safeCategory}</text>
</svg>
`;
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const category of learnCategories) {
    fs.writeFileSync(
      path.join(OUT_DIR, `${categorySlug(category)}.svg`),
      buildSvg(category, themes[category]),
      "utf8"
    );
  }
  fs.writeFileSync(
    path.join(OUT_DIR, "default.svg"),
    buildSvg("Japanese study guide", themes["Japan basics"]),
    "utf8"
  );
  console.log(`Generated ${learnCategories.length} learn placeholders + default.svg in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
