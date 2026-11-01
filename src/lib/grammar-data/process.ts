/**
 * Build-time helpers that turn raw hanabira grammar entries into game-ready
 * data: stable slugs, cloze blanks, and scramble chunks.
 *
 * Pure TypeScript — no React, no DOM. Used by `scripts/build-grammar.ts`
 * and covered by unit tests.
 */

export interface ClozeSplit {
  before: string;
  answer: string;
  after: string;
}

export interface GrammarSentenceCandidate {
  sentence_original?: string;
  sentence_romaji?: string;
  sentence_english?: string;
}

const JAPANESE_RUN = /[\u3040-\u30ff\u3400-\u9fff々ー]+/g;
const HIRAGANA_ONLY = /^[\u3040-\u309f]+$/;
const TRAILING_PUNCT = /[、。！？!?,.」』）)…]+$/;
const PUNCT_ONLY = /^[\s、。！？!?,.「」『』（）()・…〜～\-:;”“"'’‘]+$/;
const OPENING_ONLY = /^[「『（(“"‘]+$/;
const GENERIC_GRAMMAR_FRAGMENTS = new Set([
  "ある",
  "いる",
  "から",
  "こと",
  "これ",
  "それ",
  "ため",
  "だろう",
  "です",
  "でも",
  "では",
  "ない",
  "なる",
  "ので",
  "のに",
  "まで",
  "ます",
  "もの",
  "よう",
]);

/** Single-character or short function words that stand alone as their own pill. */
const PARTICLES = new Set([
  "は", "が", "を", "に", "で", "と", "へ", "も", "の", "や", "か", "ね", "よ", "な",
  "から", "まで", "より", "けど", "けれど", "けれども", "って", "でも", "には", "では",
  "とは", "には", "へは", "だけ", "しか", "ばかり", "など", "ほど", "くらい", "ぐらい",
]);

/** Tokens after which a particle candidate is actually okurigana (面白|か|っ|た). */
const OKURIGANA_FOLLOWERS = /^[っゃゅょぁぃぅぇぉ]/;

export function parseTitle(title: string): { pattern: string; romaji: string } {
  const match = title.trim().match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!match) return { pattern: title.trim(), romaji: "" };
  return { pattern: match[1]!.trim(), romaji: match[2]!.trim() };
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Short deterministic hash for titles that have no romaji. */
export function shortHash(text: string): string {
  let hash = 2166136261;
  for (const character of text) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}

/** Japanese fragments of a pattern, longest first ("A が いちばん～" → ["いちばん", "が"]). */
export function extractFragments(pattern: string): string[] {
  const runs = pattern.match(JAPANESE_RUN) ?? [];
  return [...new Set(runs.map((run) => run.replace(/^ー+|ー+$/g, "")).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );
}

/** Returns the strongest exact-pattern sentence matches, with unique Japanese examples. */
export function findMatchingGrammarSentences(
  pattern: string,
  sentences: readonly GrammarSentenceCandidate[],
  limit: number
): GrammarSentenceCandidate[] {
  const fragments = extractFragments(pattern).filter(
    (fragment) => [...fragment].length >= 3 && !GENERIC_GRAMMAR_FRAGMENTS.has(fragment)
  );
  if (!fragments.length || limit <= 0) return [];

  const scored = sentences.flatMap((sentence, index) => {
    const jp = sentence.sentence_original?.normalize("NFKC").replace(/\s+/g, "");
    if (!jp || !sentence.sentence_english?.trim()) return [];
    const score = fragments.reduce(
      (best, fragment) => (jp.includes(fragment.normalize("NFKC")) ? Math.max(best, [...fragment].length) : best),
      0
    );
    return score ? [{ sentence, index, score, jp }] : [];
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const used = new Set<string>();
  const matches: GrammarSentenceCandidate[] = [];
  for (const match of scored) {
    if (used.has(match.jp)) continue;
    used.add(match.jp);
    matches.push(match.sentence);
    if (matches.length === limit) break;
  }
  return matches;
}

/**
 * Locate the grammar point inside an example sentence and split it into
 * before / answer / after. Fragments shorter than two characters are ignored
 * (a lone particle blank is too ambiguous to grade). If a fragment only
 * matches after dropping its conjugating tail (てみる → てみます), the blank
 * is extended through the following hiragana so the answer stays natural.
 */
export function findCloze(sentence: string, fragments: string[]): ClozeSplit | null {
  const candidates = fragments.filter((fragment) => [...fragment].length >= 2);

  for (const fragment of candidates) {
    const index = sentence.indexOf(fragment);
    if (index >= 0) return split(sentence, index, fragment.length);
  }

  for (const fragment of candidates) {
    const characters = [...fragment];
    if (characters.length < 3 || !HIRAGANA_ONLY.test(characters[characters.length - 1]!)) continue;
    const stem = characters.slice(0, -1).join("");
    const index = sentence.indexOf(stem);
    if (index < 0) continue;
    let end = index + stem.length;
    while (end < sentence.length && HIRAGANA_ONLY.test(sentence[end]!)) end += 1;
    return split(sentence, index, end - index);
  }

  return null;
}

function split(sentence: string, index: number, length: number): ClozeSplit | null {
  const before = sentence.slice(0, index);
  const answer = sentence.slice(index, index + length);
  const after = sentence.slice(index + length);
  if (!answer.trim() || (!before.trim() && !after.replace(TRAILING_PUNCT, "").trim())) return null;
  return { before, answer, after };
}

function stripPunct(token: string): string {
  return token.replace(TRAILING_PUNCT, "");
}

function endsWithPunct(token: string): boolean {
  return TRAILING_PUNCT.test(token);
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("ja", { granularity: "word" })
    : null;

/**
 * Split a sentence into scramble pills that read as natural units:
 * content words, particles, and conjugated verb/adjective endings stay
 * together (食べ|ます → 食べます). Punctuation sticks to the preceding pill.
 * The result is capped at `maxChunks` by first attaching particles to their
 * phrase and then merging the shortest neighbours.
 */
export function chunkSentence(sentence: string, maxChunks = 8): string[] {
  const text = sentence.trim();
  if (!text) return [];
  if (!segmenter) return [text];

  const raw = [...segmenter.segment(text)].map((part) => part.segment).filter((part) => part.trim());

  // 1. Attach punctuation; carry opening brackets forward.
  const tokens: string[] = [];
  let opening = "";
  for (const token of raw) {
    if (OPENING_ONLY.test(token)) {
      opening += token;
      continue;
    }
    if (PUNCT_ONLY.test(token) && tokens.length) {
      tokens[tokens.length - 1] += token;
      continue;
    }
    tokens.push(opening + token);
    opening = "";
  }
  if (opening && tokens.length) tokens[tokens.length - 1] += opening;

  // 2. Glue okurigana / auxiliaries onto the word they inflect.
  const isParticle = (token: string, next: string | undefined) =>
    PARTICLES.has(stripPunct(token)) && !(next && OKURIGANA_FOLLOWERS.test(next));

  const glued: string[] = [];
  const particleFlags: boolean[] = [];
  tokens.forEach((token, index) => {
    const core = stripPunct(token);
    const particle = isParticle(token, tokens[index + 1]);
    const previous = glued[glued.length - 1];
    const previousIsParticle = particleFlags[particleFlags.length - 1];
    if (
      previous !== undefined &&
      !particle &&
      !previousIsParticle &&
      HIRAGANA_ONLY.test(core) &&
      !endsWithPunct(previous)
    ) {
      glued[glued.length - 1] = previous + token;
      return;
    }
    glued.push(token);
    particleFlags.push(particle);
  });

  // 3. Too many pills: attach particles to the phrase before them.
  let chunks = glued;
  if (chunks.length > maxChunks) {
    const attached: string[] = [];
    chunks.forEach((token, index) => {
      const previous = attached[attached.length - 1];
      if (previous !== undefined && particleFlags[index] && !endsWithPunct(previous)) {
        attached[attached.length - 1] = previous + token;
      } else {
        attached.push(token);
      }
    });
    chunks = attached;
  }

  // 4. Still too many: merge the shortest adjacent pair.
  while (chunks.length > maxChunks) {
    let best = 0;
    let bestLength = Number.POSITIVE_INFINITY;
    for (let index = 0; index < chunks.length - 1; index += 1) {
      const length = chunks[index]!.length + chunks[index + 1]!.length;
      if (length < bestLength) {
        bestLength = length;
        best = index;
      }
    }
    chunks = [...chunks.slice(0, best), chunks[best]! + chunks[best + 1]!, ...chunks.slice(best + 2)];
  }

  return chunks;
}
