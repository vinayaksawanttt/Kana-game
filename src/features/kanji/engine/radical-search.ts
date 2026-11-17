import type { KanjiRecord, KanjiLevel } from "@/data/kanji";
import type { RadicalExampleRecord, RadicalIndex, RadicalRecord } from "@/data/radicals";

export interface KanjiRadicalDetails extends KanjiRecord {
  examples: RadicalExampleRecord[];
}

export function getRadicals(radicals: readonly RadicalRecord[]): RadicalRecord[] {
  return [...radicals].sort(
    (left, right) =>
      right.kanjiCount - left.kanjiCount ||
      left.character.localeCompare(right.character, "ja")
  );
}

export function getKanjiForRadicals(
  radicalChars: readonly string[],
  radicalIndex: RadicalIndex,
  kanjiRecords: readonly KanjiRecord[],
  jlptFilter: readonly KanjiLevel[]
): KanjiRecord[] {
  if (radicalChars.length === 0) return [];
  const kanjiByCharacter = new Map(kanjiRecords.map((record) => [record.c, record]));
  const allowedLevels = new Set(jlptFilter.map((level) => Number(level.slice(1))));

  let commonChars: string[] | null = null;
  for (const rad of radicalChars) {
    const list = radicalIndex[rad] ?? [];
    if (commonChars === null) {
      commonChars = [...list];
    } else {
      const set = new Set(list);
      commonChars = commonChars.filter((c) => set.has(c));
    }
    if (commonChars.length === 0) break;
  }

  return (commonChars ?? [])
    .map((character) => kanjiByCharacter.get(character))
    .filter(
      (record): record is KanjiRecord =>
        record !== undefined && allowedLevels.has(record.jlpt)
    )
    .sort((left, right) => left.c.localeCompare(right.c, "ja"));
}

export function getKanjiForRadical(
  radicalChar: string,
  radicalIndex: RadicalIndex,
  kanjiRecords: readonly KanjiRecord[],
  jlptFilter: readonly KanjiLevel[]
): KanjiRecord[] {
  return getKanjiForRadicals([radicalChar], radicalIndex, kanjiRecords, jlptFilter);
}

export function getKanjiDetails(
  kanjiChar: string,
  kanjiRecords: readonly KanjiRecord[],
  examplesByKanji: Record<string, RadicalExampleRecord[]>
): KanjiRadicalDetails | null {
  const record = kanjiRecords.find((item) => item.c === kanjiChar);
  if (!record) return null;
  return {
    ...record,
    examples: examplesByKanji[kanjiChar] ?? [],
  };
}

export function parseRadicalWikiEntry(value: string): {
  meaning: string;
  reading: string;
} {
  const cleaned = value.trim();
  const match = cleaned.match(/^(.*?)\s*(?:\((.*)\))?$/);
  const tokens = match?.[2]?.split(",").map((token) => token.trim()) ?? [];
  return {
    meaning: (match?.[1] ?? cleaned).trim(),
    reading: tokens[0] ?? "",
  };
}
