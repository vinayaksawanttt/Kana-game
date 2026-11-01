"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadDictionaryDataMaps,
  type DictionaryDataMaps,
} from "@/data/dictionary";
import {
  analyzeJapanese,
  detectInputLanguage,
  KuromojiService,
  searchEnglishKeyword,
  type DictionaryAnalysisResult,
} from "@/engine/analyzer";

export interface UseDictionaryState {
  isLoadingTokenizer: boolean;
  isSearching: boolean;
  tokenizerError: string | null;
  results: DictionaryAnalysisResult | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useDictionary(): UseDictionaryState {
  const [isLoadingTokenizer, setIsLoadingTokenizer] = useState<boolean>(
    () => !KuromojiService.isReady()
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [tokenizerError, setTokenizerError] = useState<string | null>(null);
  const [results, setResults] = useState<DictionaryAnalysisResult | null>(null);
  const dataMapsRef = useRef<DictionaryDataMaps | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function warmup() {
      try {
        const [maps] = await Promise.all([
          loadDictionaryDataMaps(),
          KuromojiService.getTokenizer(),
        ]);
        if (!cancelled) {
          dataMapsRef.current = maps;
          setIsLoadingTokenizer(false);
          setTokenizerError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setIsLoadingTokenizer(false);
          setTokenizerError(
            error instanceof Error
              ? error.message
              : "Could not initialize local morphological dictionary."
          );
        }
      }
    }

    void warmup();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const dataMaps = dataMapsRef.current ?? (await loadDictionaryDataMaps());
      dataMapsRef.current = dataMaps;

      const mode = detectInputLanguage(trimmed);
      if (mode === "japanese") {
        const analysis = await analyzeJapanese(trimmed, dataMaps);
        setResults(analysis);
      } else {
        const englishMatches = searchEnglishKeyword(trimmed, dataMaps);
        setResults(englishMatches);
      }
    } catch (error) {
      setTokenizerError(
        error instanceof Error ? error.message : "Failed to analyze input."
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    isLoadingTokenizer,
    isSearching,
    tokenizerError,
    results,
    search,
    clearResults,
  };
}

