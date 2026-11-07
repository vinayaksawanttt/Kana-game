"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getKanjiDetails,
  getKanjiForRadical,
  getKanjiForRadicals,
  getRadicals,
} from "@/engine/radicalSearch";
import {
  loadRadicalExamples,
  loadRadicalIndex,
  loadRadicals,
  type RadicalExamples,
  type RadicalIndex,
  type RadicalRecord,
} from "@/data/radicals";
import {
  kanjiLevels,
  loadKanjiData,
  type KanjiLevel,
  type KanjiRecord,
} from "@/data/kanji";

const ALL_LEVELS: KanjiLevel[] = [...kanjiLevels];

export function useRadicalExplorer() {
  const [radicalRecords, setRadicalRecords] = useState<RadicalRecord[]>([]);
  const [radicalIndex, setRadicalIndex] = useState<RadicalIndex>({});
  const [examplesByKanji, setExamplesByKanji] = useState<RadicalExamples>({});
  const [kanjiRecords, setKanjiRecords] = useState<KanjiRecord[]>([]);
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<string | null>(null);
  const [activeJlptFilters, setActiveJlptFilters] = useState<KanjiLevel[]>(ALL_LEVELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      loadRadicals(),
      loadRadicalIndex(),
      loadRadicalExamples(),
      loadKanjiData([5, 4, 3, 2, 1]),
    ])
      .then(([radicals, index, examples, records]) => {
        if (!active) return;
        const sortedRadicals = getRadicals(radicals);
        setRadicalRecords(sortedRadicals);
        setRadicalIndex(index);
        setExamplesByKanji(examples);
        setKanjiRecords(records);
        const defaultRad = sortedRadicals.find(
          (radical) => (index[radical.character]?.length ?? 0) > 0
        )?.character;
        if (defaultRad) {
          setSelectedRadicals([defaultRad]);
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        console.error("Could not load radical explorer data.", loadError);
        setError("Radical data could not be loaded. Please refresh and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const radicals = useMemo(() => getRadicals(radicalRecords), [radicalRecords]);
  const kanjiForRadical = useMemo(
    () =>
      selectedRadicals.length > 0
        ? getKanjiForRadicals(
            selectedRadicals,
            radicalIndex,
            kanjiRecords,
            activeJlptFilters
          )
        : [],
    [activeJlptFilters, kanjiRecords, radicalIndex, selectedRadicals]
  );
  const selectedRadicalRecords = useMemo(
    () =>
      selectedRadicals
        .map((char) => radicals.find((r) => r.character === char))
        .filter((r): r is RadicalRecord => r !== undefined),
    [radicals, selectedRadicals]
  );
  const selectedRadical = selectedRadicals[0] ?? null;
  const selectedRadicalRecord = selectedRadicalRecords[0] ?? null;

  const kanjiDetails = selectedKanji
    ? getKanjiDetails(selectedKanji, kanjiRecords, examplesByKanji)
    : null;

  function toggleJlptFilter(level: KanjiLevel) {
    setActiveJlptFilters((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : ALL_LEVELS.filter((item) => current.includes(item) || item === level)
    );
    setSelectedKanji(null);
  }

  function chooseRadical(character: string) {
    setSelectedRadicals([character]);
    setSelectedKanji(null);
  }

  function toggleRadical(character: string) {
    setSelectedRadicals((prev) =>
      prev.includes(character)
        ? prev.filter((c) => c !== character)
        : [...prev, character]
    );
    setSelectedKanji(null);
  }

  function clearSelectedRadicals() {
    setSelectedRadicals([]);
    setSelectedKanji(null);
  }

  return {
    radicals,
    selectedRadicals,
    selectedRadical,
    selectedRadicalRecord,
    selectedRadicalRecords,
    selectedKanji,
    kanjiDetails,
    kanjiForRadical,
    activeJlptFilters,
    toggleJlptFilter,
    chooseRadical,
    toggleRadical,
    clearSelectedRadicals,
    setSelectedKanji,
    loading,
    error,
  };
}
