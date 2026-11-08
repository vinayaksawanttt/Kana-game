// Paragraph Flow Cloze (文章の文法 パッセージ穴埋め — Official JLPT Grammar Mondai 3)
// Architecture: Strict data -> engine -> hooks -> components separation.

import staticPassages from "../../../public/data/v1/jlpt/paragraph-cloze.json";

export type ClozeSourceType = "exam-speech" | "diary-letter" | "story-scene";

export type DiscourseGrammarCategory =
  | "conjunction" // だから / しかし / それから / つまり
  | "deixis-perspective" // 来てから vs 行ってから, あげる/もらう/くれる
  | "demonstrative" // この / その / あの / そう
  | "particles-topic" // は vs が vs の vs も in discourse context
  | "modality-ending"; // 〜ませんか / 〜んです / 〜はずだ / 〜ことになっている

export interface ClozeBlankOption {
  id: string;
  ja: string;
  reading?: string;
  en?: string;
}

export interface ClozeBlankItem {
  blankIndex: number; // 0-based
  displayNumber: number; // 1, 2, 3, 4, 5
  category: DiscourseGrammarCategory;
  options: [ClozeBlankOption, ClozeBlankOption, ClozeBlankOption, ClozeBlankOption];
  correctIndex: 0 | 1 | 2 | 3;
  discourseRuleEn: string; // Why the surrounding sentences require this choice
  contextClueQuoteJa: string; // Exact phrase in the passage that proves the answer
}

export interface ClozeSentenceSegment {
  type: "text" | "blank";
  textJa?: string; // Present when type === "text"
  blankIndex?: number; // Present when type === "blank"
}

export interface ClozeSentence {
  sentenceIndex: number;
  rawCompletedJa: string; // Complete sentence with correct answers filled in (for Story Narrator audio)
  en: string; // English translation of the sentence
  segments: ClozeSentenceSegment[];
}

export interface ParagraphClozePassage {
  id: string;
  jlpt: 5 | 4 | 3 | 2 | 1;
  sourceType: ClozeSourceType;
  titleJa: string;
  titleEn: string;
  introContextJa?: string;
  introContextEn?: string;
  linkedStory?: {
    level: string; // "N5" | "N4" | "N3"
    slug: string;
    titleJa: string;
    titleEn: string;
  };
  paragraphs: {
    subheadingJa?: string;
    sentences: ClozeSentence[];
  }[];
  blanks: ClozeBlankItem[];
}

export const PARAGRAPH_CLOZE_PASSAGES: readonly ParagraphClozePassage[] =
  staticPassages as unknown as ParagraphClozePassage[];

let cachedPassages: readonly ParagraphClozePassage[] | null = null;

/**
 * Client-side loader for Paragraph Cloze dataset.
 * Fetches compiled JSON from /data/v1/jlpt/paragraph-cloze.json with in-memory caching.
 */
export async function loadParagraphClozeData(): Promise<readonly ParagraphClozePassage[]> {
  if (cachedPassages) {
    return cachedPassages;
  }

  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/data/v1/jlpt/paragraph-cloze.json");
      if (response.ok) {
        const data = (await response.json()) as ParagraphClozePassage[];
        if (Array.isArray(data) && data.length > 0) {
          cachedPassages = data;
          return data;
        }
      }
    } catch {
      // Fallback
    }
  }

  cachedPassages = PARAGRAPH_CLOZE_PASSAGES;
  return PARAGRAPH_CLOZE_PASSAGES;
}
