export const learnCategories = [
  "Writing and sounds",
  "Kanji",
  "Numbers, time and counting",
  "Verbs",
  "Adjectives and adverbs",
  "Particles and grammar",
  "Vocabulary",
  "Politeness and communication",
  "Reading and exam skills",
  "Japan basics",
  "Reference cards",
] as const;

export const jlptLevels = ["N5", "N4", "N3", "N2", "N1"] as const;

export type LearnCategory = (typeof learnCategories)[number];
export type JlptLevel = (typeof jlptLevels)[number];

export interface LearnFrontmatter {
  title: string;
  slug: string;
  category: LearnCategory;
  jlpt: string;
  levels: JlptLevel[];
  summary?: string;
  order?: number;
  keywords?: string[];
}

export interface LearnDoc {
  frontmatter: LearnFrontmatter;
  content: string;
  headings: { id: string; text: string; level: number }[];
}
