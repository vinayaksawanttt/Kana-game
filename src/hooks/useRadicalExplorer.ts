"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getKanjiDetails,
  getKanjiForRadical,
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
  const [selectedRadical, setSelectedRadical] = useState<string | null>(null);
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
        setSelectedRadical(
          sortedRadicals.find((radical) => (index[radical.character]?.length ?? 0) > 0)
            ?.character ?? null
        );
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
      selectedRadical
        ? getKanjiForRadical(
            selectedRadical,
            radicalIndex,
            kanjiRecords,
            activeJlptFilters
          )
        : [],
    [activeJlptFilters, kanjiRecords, radicalIndex, selectedRadical]
  );
  const selectedRadicalRecord =
    radicals.find((radical) => radical.character === selectedRadical) ?? null;
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
    setSelectedRadical(character);
    setSelectedKanji(null);
  }

  return {
    radicals,
    selectedRadical,
    selectedRadicalRecord,
    selectedKanji,
    kanjiDetails,
    kanjiForRadical,
    activeJlptFilters,
    toggleJlptFilter,
    chooseRadical,
    setSelectedKanji,
    loading,
    error,
  };
}
