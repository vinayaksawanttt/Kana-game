"use client";

import React, { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { type BookKanjiItem, type BookVocabItem } from "@/data/books";
import {
  type DictionaryDataMaps,
  type DictionaryKanjiRecord,
  type DictionaryVocabRecord,
} from "@/data/dictionary";
import { AudioButton } from "@/components/ui/AudioButton";
import { StrokePlayer } from "@/features/kanji/components/StrokePlayer";
import { addVocabularyToSrs } from "@/lib/srs/service";
import { playGameSfx } from "@/lib/game-core/sfx";

export interface DialogueToken {
  surface: string;
  baseForm: string;
  reading?: string;
  pos?: string;
  isLookupable: boolean;
}

interface StoryReaderLineProps {
  ja: string;
  lessonVocab: BookVocabItem[];
  lessonKanji: BookKanjiItem[];
  dictMaps: DictionaryDataMaps | null;
  kuromojiTokens?: Array<{
    surface_form: string;
    basic_form?: string;
    reading?: string;
    pos?: string;
  }>;
  level: string;
  enabled: boolean;
}

const KANJI_REGEX = /[\u4E00-\u9FAF\u3400-\u4DBF]/;
const JAPANESE_WORD_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]+/;
const PUNCTUATION_REGEX = /^[。、！？「」『』（）・\s.,!?…]+$/;

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Fallback synchronous tokenizer when Kuromoji has not finished loading
 * or in non-browser test environments.
 */
function fallbackSegmentLine(
  text: string,
  lessonVocab: BookVocabItem[],
  dictMaps: DictionaryDataMaps | null
): DialogueToken[] {
  const tokens: DialogueToken[] = [];
  const knownWords = new Set<string>();
  for (const v of lessonVocab) {
    if (v.word.length >= 2) knownWords.add(v.word);
  }
  if (dictMaps) {
    for (const w of dictMaps.vocabByWord.keys()) {
      if (w.length >= 2 && w.length <= 8) knownWords.add(w);
    }
  }

  let i = 0;
  while (i < text.length) {
    if (PUNCTUATION_REGEX.test(text[i])) {
      tokens.push({ surface: text[i], baseForm: text[i], isLookupable: false });
      i++;
      continue;
    }

    // Try longest known word match up to 8 chars
    let matchedWord: string | null = null;
    const maxLen = Math.min(8, text.length - i);
    for (let len = maxLen; len >= 2; len--) {
      const sub = text.slice(i, i + len);
      if (knownWords.has(sub)) {
        matchedWord = sub;
        break;
      }
    }

    if (matchedWord) {
      tokens.push({
        surface: matchedWord,
        baseForm: matchedWord,
        isLookupable: true,
      });
      i += matchedWord.length;
      continue;
    }

    // Group contiguous kanji or katakana
    if (KANJI_REGEX.test(text[i])) {
      let end = i + 1;
      while (end < text.length && KANJI_REGEX.test(text[end])) end++;
      const seg = text.slice(i, end);
      tokens.push({ surface: seg, baseForm: seg, isLookupable: true });
      i = end;
      continue;
    }

    if (/[\u30A0-\u30FF]/.test(text[i])) {
      let end = i + 1;
      while (end < text.length && /[\u30A0-\u30FFー]/.test(text[end])) end++;
      const seg = text.slice(i, end);
      tokens.push({ surface: seg, baseForm: seg, isLookupable: seg.length >= 2 });
      i = end;
      continue;
    }

    // Single hiragana / ascii character
    tokens.push({
      surface: text[i],
      baseForm: text[i],
      isLookupable: false,
    });
    i++;
  }

  return tokens;
}

function estimatePitchAccent(readingKana: string, pos?: string): {
  pattern: string;
  label: string;
} {
  const len = readingKana.length;
  if (len <= 1) return { pattern: "0", label: "平板型 (Flat)" };
  if (pos?.includes("動詞") || pos === "verb") {
    return { pattern: `${Math.max(1, len - 1)}`, label: "中高型 (Mid-High)" };
  }
  if (pos?.includes("形容詞") || pos === "adjective") {
    return { pattern: `${Math.max(1, len - 1)}`, label: "起伏型 (Drop)" };
  }
  return { pattern: "0 / 1", label: "平板/頭高 (Standard)" };
}

export function StoryReaderLine({
  ja,
  lessonVocab,
  lessonKanji,
  dictMaps,
  kuromojiTokens,
  level,
  enabled,
}: StoryReaderLineProps) {
  const [selectedToken, setSelectedToken] = useState<DialogueToken | null>(null);
  const [activeStrokeKanji, setActiveStrokeKanji] = useState<string | null>(null);
  const [addedToSrsKeys, setAddedToSrsKeys] = useState<Record<string, boolean>>({});
  const [addingSrs, setAddingSrs] = useState(false);

  const tokens: DialogueToken[] = useMemo(() => {
    if (!enabled) return [];
    if (kuromojiTokens && kuromojiTokens.length > 0) {
      return kuromojiTokens.map((t) => {
        const surface = t.surface_form;
        const baseForm =
          t.basic_form && t.basic_form !== "*" ? t.basic_form : surface;
        const isPunct = PUNCTUATION_REGEX.test(surface);
        const isParticleOrAux =
          t.pos === "助詞" || t.pos === "助動詞" || t.pos === "記号";
        const hasKanji = KANJI_REGEX.test(surface);
        const isWord =
          !isPunct &&
          JAPANESE_WORD_REGEX.test(surface) &&
          (hasKanji || !isParticleOrAux || surface.length >= 2);

        return {
          surface,
          baseForm,
          reading: t.reading ? katakanaToHiragana(t.reading) : undefined,
          pos: t.pos,
          isLookupable: isWord,
        };
      });
    }
    return fallbackSegmentLine(ja, lessonVocab, dictMaps);
  }, [dictMaps, enabled, ja, kuromojiTokens, lessonVocab]);

  const lookupDetails = useMemo(() => {
    if (!selectedToken) return null;

    const candidates = [selectedToken.baseForm, selectedToken.surface];
    let dictVocab: DictionaryVocabRecord | undefined;
    let bookVocab: BookVocabItem | undefined;

    for (const c of candidates) {
      if (!bookVocab) {
        bookVocab = lessonVocab.find(
          (v) => v.word === c || v.readingKana === c
        );
      }
      if (!dictVocab && dictMaps) {
        dictVocab =
          dictMaps.vocabByWord.get(c) ||
          (selectedToken.reading
            ? dictMaps.vocabByReading.get(selectedToken.reading)
            : undefined);
      }
    }

    const word = dictVocab?.word || bookVocab?.word || selectedToken.baseForm;
    const reading =
      dictVocab?.reading ||
      bookVocab?.readingKana ||
      selectedToken.reading ||
      selectedToken.surface;
    const meanings = dictVocab?.meanings || (bookVocab ? [bookVocab.meaning] : []);
    const jlptLevel = dictVocab?.level || level;
    const pos = dictVocab?.pos?.[0] || bookVocab?.type || selectedToken.pos;
    const pitch = estimatePitchAccent(reading, pos);

    // Extract unique Kanji in the word
    const kanjiChars = Array.from(
      new Set(Array.from(word).filter((ch) => KANJI_REGEX.test(ch)))
    );

    const kanjiDetails: Array<{
      char: string;
      meanings: string[];
      on: string[];
      kun: string[];
      strokes?: number;
      jlpt?: number;
    }> = kanjiChars.map((ch) => {
      const dKanji: DictionaryKanjiRecord | undefined = dictMaps?.index.kanji[ch];
      const bKanji = lessonKanji.find((k) => k.kanji === ch);
      return {
        char: ch,
        meanings: dKanji?.meanings || (bKanji ? [bKanji.meaning] : []),
        on: dKanji?.on || bKanji?.onyomi || [],
        kun: dKanji?.kun || bKanji?.kunyomi || [],
        strokes: dKanji?.strokes || bKanji?.strokes,
        jlpt: dKanji?.jlpt || bKanji?.jlpt,
      };
    });

    return {
      word,
      reading,
      romaji: dictVocab?.romaji || bookVocab?.reading,
      meanings,
      jlptLevel,
      pos,
      pitch,
      kanjiDetails,
    };
  }, [dictMaps, lessonKanji, lessonVocab, level, selectedToken]);

  const handleAddToSrs = async () => {
    if (!lookupDetails || addingSrs) return;
    setAddingSrs(true);
    try {
      await addVocabularyToSrs({
        word: lookupDetails.word,
        reading: lookupDetails.reading,
        meaning:
          lookupDetails.meanings.length > 0
            ? lookupDetails.meanings.slice(0, 3).join("; ")
            : `Textbook dialogue word (${lookupDetails.reading})`,
        level: lookupDetails.jlptLevel,
      });
      setAddedToSrsKeys((prev) => ({ ...prev, [lookupDetails.word]: true }));
      playGameSfx("correct-chime");
    } finally {
      setAddingSrs(false);
    }
  };

  if (!enabled) {
    return (
      <p className="font-japanese text-sm font-semibold text-[var(--ink)] sm:text-base leading-relaxed">
        {ja}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tappable Sentence */}
      <p
        aria-label={ja}
        className="font-japanese text-sm font-semibold text-[var(--ink)] sm:text-base leading-relaxed flex flex-wrap items-baseline"
      >
        {tokens.map((tok, idx) =>
          tok.isLookupable ? (
            <button
              key={`${idx}-${tok.surface}`}
              type="button"
              onClick={() => {
                if (
                  selectedToken &&
                  selectedToken.surface === tok.surface &&
                  selectedToken.baseForm === tok.baseForm
                ) {
                  setSelectedToken(null);
                  setActiveStrokeKanji(null);
                } else {
                  setSelectedToken(tok);
                  setActiveStrokeKanji(null);
                }
              }}
              className={`rounded px-0.5 transition-colors cursor-pointer ${
                selectedToken?.surface === tok.surface
                  ? "bg-[var(--primary)] text-white"
                  : "hover:bg-[var(--sakura-light)]/70 hover:text-[var(--primary-fg)] underline decoration-dotted decoration-[var(--muted)]/50 underline-offset-4"
              }`}
              title={`Tap to inspect "${tok.baseForm}"`}
            >
              {tok.surface}
            </button>
          ) : (
            <span key={`${idx}-${tok.surface}`}>{tok.surface}</span>
          )
        )}
      </p>

      {/* Instant Gloss Card Popover */}
      {selectedToken && lookupDetails && (
        <div className="rounded-2xl border border-[var(--primary)]/35 bg-[var(--surface-overlay)]/90 p-4 shadow-md space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-japanese text-lg font-black text-[var(--ink)]">
                  {lookupDetails.word}
                </span>
                {lookupDetails.reading && lookupDetails.reading !== lookupDetails.word && (
                  <span className="font-japanese text-xs font-bold text-[var(--primary-fg)]">
                    【{lookupDetails.reading}】
                  </span>
                )}
                <AudioButton
                  text={lookupDetails.word}
                  reading={lookupDetails.reading}
                  mode="vocab"
                  size="sm"
                  label={`Pronounce ${lookupDetails.word}`}
                />
              </div>

              {/* Badges: JLPT, Pitch Accent, POS */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                <span className="rounded-md bg-[var(--primary)] px-2 py-0.5 text-white">
                  JLPT {lookupDetails.jlptLevel}
                </span>
                <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[var(--ink)]">
                  Pitch: [{lookupDetails.pitch.pattern}] {lookupDetails.pitch.label}
                </span>
                {lookupDetails.pos && (
                  <span className="rounded-md bg-[var(--sakura-light)] px-2 py-0.5 text-[var(--primary-fg)]">
                    {lookupDetails.pos}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* One-tap Add to SRS */}
              <button
                type="button"
                onClick={handleAddToSrs}
                disabled={addingSrs || addedToSrsKeys[lookupDetails.word]}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  addedToSrsKeys[lookupDetails.word]
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-[var(--primary)] text-white hover:opacity-90 active:scale-95"
                }`}
              >
                {addedToSrsKeys[lookupDetails.word] ? (
                  <>
                    <Check size={13} />
                    <span>Added to SRS</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Add to SRS</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedToken(null);
                  setActiveStrokeKanji(null);
                }}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--ink)]"
                aria-label="Close gloss card"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Meanings */}
          <div className="text-xs font-medium text-[var(--ink)]">
            {lookupDetails.meanings.length > 0 ? (
              <p>{lookupDetails.meanings.slice(0, 4).join(" · ")}</p>
            ) : (
              <p className="italic text-[var(--muted)]">
                Contextual dialogue word ({lookupDetails.reading})
              </p>
            )}
          </div>

          {/* Kanji Breakdown & Stroke Order */}
          {lookupDetails.kanjiDetails.length > 0 && (
            <div className="border-t border-[var(--line)]/60 pt-2.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Kanji Breakdown & Stroke Order
              </span>
              <div className="flex flex-wrap gap-2">
                {lookupDetails.kanjiDetails.map((kd) => (
                  <div
                    key={kd.char}
                    className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-japanese text-base font-black text-[var(--ink)]">
                      {kd.char}
                    </span>
                    <div className="leading-tight">
                      <p className="font-bold text-[var(--ink)]">
                        {kd.meanings.slice(0, 2).join(", ") || "Kanji"}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {kd.strokes ? `${kd.strokes} strokes` : ""}
                        {kd.jlpt ? ` · N${kd.jlpt}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveStrokeKanji((prev) =>
                          prev === kd.char ? null : kd.char
                        )
                      }
                      className="ml-1 rounded-lg bg-[var(--sakura-light)]/70 px-2 py-1 text-[10px] font-bold text-[var(--primary-fg)] hover:opacity-80"
                    >
                      {activeStrokeKanji === kd.char ? "Hide Strokes" : "Stroke Order"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Embedded Stroke Player */}
              {activeStrokeKanji && (
                <div className="pt-2">
                  <StrokePlayer
                    kanji={activeStrokeKanji}
                    onClose={() => setActiveStrokeKanji(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
