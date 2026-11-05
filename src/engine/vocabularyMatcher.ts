export type VocabularyMatchType = "exact" | "typo" | "synonym" | "none";

export interface VocabularyMatchResult {
  isMatch: boolean;
  matchType: VocabularyMatchType;
  matchedGloss?: string;
}

interface GlossCandidate {
  phrase: string;
  display: string;
}

const FILLER_PREFIXES = ["to", "a", "an", "the", "be"];
const STOPWORDS = new Set([
  "of", "in", "for", "with", "at", "by", "from", "as", "into", "and", "the", "a", "an", "to", "be",
]);

const SYNONYM_GROUPS = [
  ["large", "big", "great", "huge", "many", "lot", "lots", "numerous"],
  ["crowd", "multitude", "people", "gathering", "group", "person"],
  ["return", "go back"],
  ["begin", "start"],
  ["finish", "end", "complete"],
  ["purchase", "buy"],
  ["speak", "talk", "say"],
  ["look", "see", "watch"],
  ["hear", "listen"],
  ["reside", "live"],
  ["aid", "help", "assist"],
  ["quick", "fast", "rapid"],
  ["glad", "happy"],
  ["ill", "sick"],
  ["error", "mistake"],
  ["reply", "answer"],
];

const SPELLING_VARIANTS: Record<string, string> = {
  colour: "color",
  favour: "favor",
  favourite: "favorite",
  honour: "honor",
  humour: "humor",
  labour: "labor",
  neighbour: "neighbor",
  organise: "organize",
  realise: "realize",
  recognise: "recognize",
  centre: "center",
  metre: "meter",
  theatre: "theater",
  travelling: "traveling",
  travelled: "traveled",
};

const NUMBER_VARIANTS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
};

const synonymByWord = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const word of group) synonymByWord.set(word, canonical);
}

function cleanPunctuation(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[’‘]/g, "'")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripFillerPrefix(value: string): string {
  let normalized = value;
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of FILLER_PREFIXES) {
      if (normalized.startsWith(`${prefix} `)) {
        normalized = normalized.slice(prefix.length + 1);
        changed = true;
        break;
      }
    }
  }
  return normalized;
}

function normalizeExact(value: string): string {
  const cleaned = stripFillerPrefix(cleanPunctuation(value));
  return cleaned
    .split(" ")
    .map((word) => SPELLING_VARIANTS[word] ?? NUMBER_VARIANTS[word] ?? word)
    .join(" ");
}

export function normalizeVocabularyMeaning(value: string): string {
  return normalizeExact(value);
}

function getGlossCandidates(meanings: string[]): GlossCandidate[] {
  const candidates: GlossCandidate[] = [];
  for (const meaning of meanings) {
    for (const part of meaning.split(/[;,/]+/)) {
      const phrase = part.trim();
      if (!phrase) continue;
      candidates.push({ phrase, display: phrase });
      const withoutParentheses = phrase.replace(/\s*\([^)]*\)/g, " ").trim();
      if (withoutParentheses && withoutParentheses !== phrase) {
        candidates.push({ phrase: withoutParentheses, display: phrase });
      }
    }
  }
  return candidates;
}

function canonicalizeSynonymPhrases(value: string): string {
  return value.replace(/\bgo back\b/g, "return");
}

function meaningfulTokens(value: string): string[] {
  const normalized = canonicalizeSynonymPhrases(normalizeExact(value));
  return normalized
    .split(" ")
    .filter((token) => token && !STOPWORDS.has(token))
    .map((token) => synonymByWord.get(token) ?? token);
}

function sharesPrimaryConcept(inputTokens: string[], candidateTokens: string[]): boolean {
  return inputTokens.length === 1 && candidateTokens.length > 1 &&
    inputTokens[0] === candidateTokens[candidateTokens.length - 1];
}

function hasConceptOverlap(input: string, candidate: string): boolean {
  const inputTokens = meaningfulTokens(input);
  const candidateTokens = meaningfulTokens(candidate);
  if (!inputTokens.length || !candidateTokens.length) return false;

  const remaining = [...candidateTokens];
  let overlap = 0;
  for (const token of inputTokens) {
    const index = remaining.indexOf(token);
    if (index >= 0) {
      overlap += 1;
      remaining.splice(index, 1);
    }
  }

  return sharesPrimaryConcept(inputTokens, candidateTokens) ||
    overlap / Math.max(inputTokens.length, candidateTokens.length) >= 0.6;
}

export function damerauLevenshteinDistance(left: string, right: string): number {
  const leftLength = left.length;
  const rightLength = right.length;
  const maximumDistance = leftLength + rightLength;
  const matrix = Array.from(
    { length: leftLength + 2 },
    () => Array<number>(rightLength + 2).fill(0)
  );
  matrix[0][0] = maximumDistance;

  for (let index = 0; index <= leftLength; index += 1) {
    matrix[index + 1][0] = maximumDistance;
    matrix[index + 1][1] = index;
  }
  for (let index = 0; index <= rightLength; index += 1) {
    matrix[0][index + 1] = maximumDistance;
    matrix[1][index + 1] = index;
  }

  const lastSeen = new Map<string, number>();
  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    let lastMatchColumn = 0;
    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const previousRow = lastSeen.get(right[rightIndex - 1]) ?? 0;
      const previousColumn = lastMatchColumn;
      let substitutionCost = 1;
      if (left[leftIndex - 1] === right[rightIndex - 1]) {
        substitutionCost = 0;
        lastMatchColumn = rightIndex;
      }

      matrix[leftIndex + 1][rightIndex + 1] = Math.min(
        matrix[leftIndex][rightIndex] + substitutionCost,
        matrix[leftIndex + 1][rightIndex] + 1,
        matrix[leftIndex][rightIndex + 1] + 1,
        matrix[previousRow][previousColumn] +
          (leftIndex - previousRow - 1) +
          1 +
          (rightIndex - previousColumn - 1)
      );
    }
    lastSeen.set(left[leftIndex - 1], leftIndex);
  }

  return matrix[leftLength + 1][rightLength + 1];
}

function typoThreshold(candidate: string): number {
  const length = candidate.replace(/\s/g, "").length;
  if (length >= 12) return 3;
  if (length >= 7) return 2;
  if (length >= 4) return 1;
  return 0;
}

export function checkVocabularyAnswer(
  answer: string,
  meanings: string[]
): VocabularyMatchResult {
  const normalizedAnswer = normalizeExact(answer);
  if (!normalizedAnswer) return { isMatch: false, matchType: "none" };

  const candidates = getGlossCandidates(meanings)
    .map((candidate) => ({
      ...candidate,
      normalized: normalizeExact(candidate.phrase),
    }))
    .filter((candidate) => candidate.normalized);

  const exact = candidates.find((candidate) => candidate.normalized === normalizedAnswer);
  if (exact) {
    return { isMatch: true, matchType: "exact", matchedGloss: exact.display };
  }

  const typo = candidates.find((candidate) => {
    const threshold = typoThreshold(candidate.normalized);
    return threshold > 0 &&
      damerauLevenshteinDistance(normalizedAnswer, candidate.normalized) <= threshold;
  });
  if (typo) {
    return { isMatch: true, matchType: "typo", matchedGloss: typo.display };
  }

  const synonym = candidates.find((candidate) => hasConceptOverlap(answer, candidate.phrase));
  if (synonym) {
    return { isMatch: true, matchType: "synonym", matchedGloss: synonym.display };
  }

  return { isMatch: false, matchType: "none" };
}
