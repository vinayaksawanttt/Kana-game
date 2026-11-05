"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Languages,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { StrokePlayer } from "@/components/kanji/StrokePlayer";
import { useDictionary } from "@/hooks/useDictionary";
import { addKanjiToSrs, addVocabularyToSrs } from "@/lib/srs/service";
import { getHomophoneGroupForKanji } from "@/engine/homophones";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { AudioButton } from "@/components/ui/AudioButton";
import type { AnalyzedToken } from "@/engine/analyzer";
import type {
  DictionaryKanjiRecord,
  DictionaryVocabRecord,
} from "@/data/dictionary";

const SAMPLE_QUERIES = [
  { label: "わたしは毎日日本語を勉強しています", tag: "Sentence" },
  { label: "懐かしい思い出が蘇ってきた", tag: "N3 Sentence" },
  { label: "shallow", tag: "English" },
  { label: "water", tag: "English" },
];

function KanjiStrokeToggle({
  kanji,
  level,
  className = "",
}: {
  kanji: string;
  level: number;
  className?: string;
}) {
  const [showStroke, setShowStroke] = useState(false);

  return (
    <div className={className}>
      {showStroke ? (
        <StrokePlayer
          kanji={kanji}
          level={level}
          onClose={() => setShowStroke(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowStroke(true)}
          className="w-full h-12 rounded-md border border-[var(--sakura)] bg-[var(--surface)] text-sm font-bold text-[var(--primary)] hover:bg-[var(--sakura-light)] transition-colors"
        >
          Show stroke order
        </button>
      )}
    </div>
  );
}

export default function DictionaryAnalyzerPage() {
  const {
    isLoadingTokenizer,
    isSearching,
    tokenizerError,
    results,
    search,
    clearResults,
  } = useDictionary();

  const [query, setQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<AnalyzedToken | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSelectedToken(null);
    await search(trimmed);
  }

  async function handlePresetClick(preset: string) {
    setQuery(preset);
    setSelectedToken(null);
    await search(preset);
  }

  function handleClear() {
    setQuery("");
    setSelectedToken(null);
    clearResults();
  }

  async function handleSaveTokenToFsrs(token: AnalyzedToken) {
    const word = token.baseForm || token.surface;
    const key = `vocab:${word}`;
    await addVocabularyToSrs({
      word,
      reading: token.reading || undefined,
      meaning: token.meaning ?? `${token.posLabel} (${token.surface})`,
      level: token.jlptLevel,
    });
    setSavedIds((prev) => new Set(prev).add(key));
  }

  async function handleSaveVocabToFsrs(entry: DictionaryVocabRecord) {
    const key = `vocab:${entry.word}`;
    await addVocabularyToSrs({
      word: entry.word,
      reading: entry.reading,
      meaning: entry.meanings.slice(0, 3).join(", "),
      level: entry.level,
    });
    setSavedIds((prev) => new Set(prev).add(key));
  }

  async function handleSaveKanjiToFsrs(kanji: DictionaryKanjiRecord) {
    const key = `kanji:${kanji.c}`;
    const readings = [...kanji.on, ...kanji.kun].filter(Boolean).join(" · ");
    await addKanjiToSrs({
      kanji: kanji.c,
      meaning: kanji.label,
      reading: readings || undefined,
      level: `N${kanji.jlpt}`,
    });
    setSavedIds((prev) => new Set(prev).add(key));
  }

  return (
    <GameLayout glyph="辞" label="DICTIONARY">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-6 pb-28">
        {/* Hero Search Card */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--primary)] uppercase">
                Local-First Morphological Engine
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-3xl">
                Dictionary & Sentence Analyzer
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
                Paste any Japanese sentence, kanji, or English keyword. Powered 100% locally by
                Kuromoji morphological parsing and your JLPT vocabulary & kanji index.
              </p>
            </div>

            {/* Tokenizer Status Pill */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {isLoadingTokenizer ? (
                <span
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-1.5 text-xs font-medium text-[var(--muted)]"
                >
                  <Loader2 className="size-3.5 animate-spin text-[var(--primary)]" />
                  Loading Kuromoji dictionary…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--success)]/35 bg-[var(--success-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--success)]">
                  <Sparkles className="size-3.5" />
                  Offline Analyzer Ready
                </span>
              )}
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Paste a Japanese sentence, kanji, or English keyword..."
                  aria-label="Dictionary and sentence search input"
                  className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] py-3 pr-11 pl-12 text-base text-[var(--ink)] placeholder:text-[var(--muted)]/75 focus:border-[var(--primary)] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search query"
                    className="absolute top-1/2 right-2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--line)]/40 hover:text-[var(--ink)]"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Languages className="size-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sample Presets */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
              Try:
            </span>
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => void handlePresetClick(sample.label)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-1 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--primary)]/60"
              >
                <span lang="ja" className="font-japanese">
                  {sample.label}
                </span>
                <span className="rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  {sample.tag}
                </span>
              </button>
            ))}
          </div>

          {tokenizerError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-[var(--error)]/40 bg-[var(--error-soft)] px-4 py-2.5 text-xs font-medium text-[var(--error)]"
            >
              {tokenizerError}
            </p>
          )}
        </section>

        {/* Results Area */}
        {results?.type === "japanese" && (
          <div className="mt-6 flex flex-col gap-6">
            {/* 1. Sentence Breakdown with <ruby> Furigana */}
            <section
              aria-label="Sentence Breakdown"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                    Morphological Breakdown
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    Sentence Breakdown
                  </h2>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  Tap any word token to inspect its definition & save to FSRS
                </span>
              </div>

              <div
                lang="ja"
                className="font-japanese mt-6 flex flex-wrap items-end gap-2 leading-loose"
              >
                {results.tokens.map((token, idx) => {
                  if (!token.isWord) {
                    return (
                      <span
                        key={`${token.surface}-${idx}`}
                        className="px-0.5 text-2xl text-[var(--muted)]"
                      >
                        {token.surface}
                      </span>
                    );
                  }

                  const isSelected = selectedToken === token;
                  return (
                    <button
                      key={`${token.surface}-${idx}`}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      aria-pressed={isSelected}
                      className={`group inline-flex min-h-12 flex-col items-center justify-end rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--sakura)]/30 shadow-sm"
                          : "border-[var(--line)] bg-[var(--paper-tint)] hover:border-[var(--primary)]/60"
                      }`}
                    >
                      <ruby className="text-xl font-medium tracking-wide text-[var(--ink)] md:text-2xl">
                        {token.surface}
                        {token.reading && (
                          <rt className="text-[11px] font-normal text-[var(--primary)]">
                            {token.reading}
                          </rt>
                        )}
                      </ruby>
                      <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider text-[var(--muted)] uppercase">
                        <span>{token.posLabel}</span>
                        {token.jlptLevel && (
                          <span className="rounded bg-[var(--primary)]/15 px-1 text-[var(--primary)]">
                            {token.jlptLevel}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Kanji Used Grid */}
            <section
              aria-label="Kanji Used"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                    Character Extraction
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    Kanji Used ({results.kanji.length})
                  </h2>
                </div>
              </div>

              {results.kanji.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  No JLPT kanji characters detected in this input.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.kanji.map((k) => {
                    const isSaved = savedIds.has(`kanji:${k.c}`);
                    return (
                      <div
                        key={k.c}
                        className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              lang="ja"
                              className="font-japanese flex size-14 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-3xl font-semibold text-[var(--ink)]"
                            >
                              {k.c}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[11px] font-bold text-white">
                                  N{k.jlpt}
                                </span>
                                <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                                  Grade {k.grade}
                                </span>
                                <span className="text-[11px] text-[var(--muted)]">
                                  {k.strokes} strokes
                                </span>
                              </div>
                              <p className="mt-1.5 text-sm font-semibold text-[var(--ink)]">
                                {k.label}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(k.on.length > 0 || k.kun.length > 0) && (
                          <div className="mt-3 border-t border-[var(--line)] pt-2.5 flex flex-wrap gap-1.5">
                            {k.on.slice(0, 2).map((r) => (
                              <KanjiReadingPill key={r} reading={r} type="on" size="sm" />
                            ))}
                            {k.kun.slice(0, 2).map((r) => (
                              <KanjiReadingPill key={r} reading={r} type="kun" size="sm" />
                            ))}
                          </div>
                        )}

                        <KanjiStrokeToggle kanji={k.c} level={k.jlpt} className="mt-3" />

                        <button
                          type="button"
                          onClick={() => void handleSaveKanjiToFsrs(k)}
                          disabled={isSaved}
                          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--primary)] disabled:opacity-60"
                        >
                          {isSaved ? (
                            <>
                              <BookmarkCheck className="size-4 text-[var(--success)]" />
                              Saved to FSRS
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="size-4 text-[var(--primary)]" />
                              Add Kanji to FSRS
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. Context Sentences if available */}
            {results.sentences.length > 0 && (
              <section
                aria-label="Context Examples"
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
              >
                <div className="border-b border-[var(--line)] pb-4">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                    Corpus Examples
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    Demo Sentences ({results.sentences.length})
                  </h2>
                </div>
                <div className="mt-4 divide-y divide-[var(--line)]">
                  {results.sentences.map((sent) => (
                    <div key={sent.id} className="py-4 first:pt-0 last:pb-0">
                      <p lang="ja" className="font-japanese text-lg font-medium text-[var(--ink)]">
                        {sent.jp}
                      </p>
                      {sent.romaji && (
                        <p className="mt-1 text-xs text-[var(--muted)]">{sent.romaji}</p>
                      )}
                      <p className="mt-1 text-sm text-[var(--ink)]/90">{sent.en}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {results?.type === "english" && (
          <div className="mt-6 flex flex-col gap-6">
            {/* 1. Vocabulary & Kanji Matches */}
            <section
              aria-label="English Keyword Matches"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
            >
              <div className="border-b border-[var(--line)] pb-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                  Reverse Dictionary Lookup
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                  Matches for &ldquo;{results.query}&rdquo;
                </h2>
              </div>

              {results.vocab.length === 0 && results.kanji.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--muted)]">
                  No vocabulary or kanji found matching &ldquo;{results.query}&rdquo;. Try a simpler
                  root word (e.g., &ldquo;water&rdquo;, &ldquo;shallow&rdquo;, &ldquo;study&rdquo;).
                </p>
              ) : (
                <div className="mt-5 space-y-6">
                  {results.vocab.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
                        Vocabulary ({results.vocab.length})
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {results.vocab.map((item) => {
                          const isSaved = savedIds.has(`vocab:${item.word}`);
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] p-4"
                            >
                              <div>
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span
                                    lang="ja"
                                    className="font-japanese text-xl font-semibold text-[var(--ink)]"
                                  >
                                    {item.word}
                                  </span>
                                  {item.reading !== item.word && (
                                    <span
                                      lang="ja"
                                      className="font-japanese text-xs text-[var(--primary)]"
                                    >
                                      {item.reading}
                                    </span>
                                  )}
                                  <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                                    {item.level}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                                  {item.meanings.join(", ")}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => void handleSaveVocabToFsrs(item)}
                                disabled={isSaved}
                                aria-label={`Add ${item.word} to FSRS`}
                                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--primary)] disabled:opacity-60"
                              >
                                {isSaved ? (
                                  <>
                                    <BookmarkCheck className="size-4 text-[var(--success)]" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus className="size-4 text-[var(--primary)]" />
                                    Add to FSRS
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {results.kanji.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
                        Kanji ({results.kanji.length})
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {results.kanji.map((k) => {
                          const isSaved = savedIds.has(`kanji:${k.c}`);
                          const homophone = getHomophoneGroupForKanji(k.c);
                          return (
                            <div
                              key={k.c}
                              className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] p-3.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span
                                    lang="ja"
                                    className="font-japanese flex size-12 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-2xl font-semibold text-[var(--ink)]"
                                  >
                                    {k.c}
                                  </span>
                                  <div>
                                    <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                                      N{k.jlpt}
                                    </span>
                                    <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                                      {k.label}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void handleSaveKanjiToFsrs(k)}
                                  disabled={isSaved}
                                  aria-label={`Add kanji ${k.c} to FSRS`}
                                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--primary)] disabled:opacity-60"
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="size-4 text-[var(--success)]" />
                                  ) : (
                                    <BookmarkPlus className="size-4 text-[var(--primary)]" />
                                  )}
                                </button>
                              </div>

                              {homophone && (
                                <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--surface)] p-2.5 text-xs">
                                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] inline-flex items-center gap-1.5">
                                      Homophone Nuance · {homophone.reading}
                                      <AudioButton
                                        text={homophone.reading}
                                        size="sm"
                                        label={`Listen to shared reading ${homophone.reading}`}
                                      />
                                    </span>
                                    <span className="text-[10px] text-[var(--muted)]">
                                      {homophone.title}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 space-y-1.5">
                                    {homophone.members.map((member) => {
                                      const isCurrent = member.kanji === k.c;
                                      return (
                                        <div
                                          key={member.kanji}
                                          className={`rounded-md p-1.5 transition ${
                                            isCurrent
                                              ? "bg-[var(--sakura-light)]/50 font-semibold"
                                              : "opacity-85 hover:bg-[var(--bg)]"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-baseline gap-1.5">
                                              <Link
                                                href={`/games/kanji/playground/${encodeURIComponent(member.kanji)}`}
                                                className="font-japanese text-xs font-bold text-[var(--primary)] hover:underline"
                                              >
                                                {member.word} ({member.kanji})
                                              </Link>
                                              <span className="text-[10px] text-[var(--muted)]">
                                                {member.nuance}
                                              </span>
                                            </div>
                                            <AudioButton
                                              text={member.word}
                                              size="sm"
                                              label={`Listen to ${member.word}`}
                                            />
                                          </div>
                                          <p className="mt-0.5 font-japanese text-[10px] text-[var(--muted)]">
                                            {member.example}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <KanjiStrokeToggle kanji={k.c} level={k.jlpt} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 2. Demo Context Sentences */}
            <section
              aria-label="Context Sentences"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] md:p-8"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[var(--primary)] uppercase">
                    Usage in Context
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                    Demo Sentences ({results.sentences.length})
                  </h2>
                </div>
                <BookOpen className="size-5 text-[var(--primary)]" />
              </div>

              {results.sentences.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  No demo sentences matched this keyword.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[var(--line)]">
                  {results.sentences.map((sent) => (
                    <div
                      key={sent.id}
                      className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p
                          lang="ja"
                          className="font-japanese text-lg font-medium text-[var(--ink)]"
                        >
                          {sent.jp}
                        </p>
                        {sent.romaji && (
                          <p className="mt-1 text-xs text-[var(--muted)]">{sent.romaji}</p>
                        )}
                        <p className="mt-1 text-sm text-[var(--ink)]/90">{sent.en}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handlePresetClick(sent.jp)}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--primary)] transition hover:border-[var(--primary)]"
                      >
                        Analyze sentence
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Token Inspector Bottom Sheet / Drawer */}
        {selectedToken && (
          <aside
            role="dialog"
            aria-label="Token dictionary inspector"
            className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 px-4 pt-4 pb-6 shadow-2xl backdrop-blur-md"
          >
            <div className="mx-auto flex w-full max-w-4xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span
                    lang="ja"
                    className="font-japanese text-2xl font-bold text-[var(--ink)]"
                  >
                    {selectedToken.surface}
                  </span>
                  {selectedToken.reading && (
                    <span
                      lang="ja"
                      className="font-japanese text-sm font-medium text-[var(--primary)]"
                    >
                      【{selectedToken.reading}】
                    </span>
                  )}
                  <span className="rounded-full border border-[var(--line)] bg-[var(--paper-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                    {selectedToken.posLabel}
                  </span>
                  {selectedToken.jlptLevel && (
                    <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                      {selectedToken.jlptLevel}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                  {selectedToken.meaning ??
                    `Base form: ${selectedToken.baseForm} (${selectedToken.pos})`}
                </p>
                {selectedToken.baseForm &&
                  selectedToken.baseForm !== selectedToken.surface && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Dictionary form:{" "}
                      <span lang="ja" className="font-japanese font-medium text-[var(--ink)]">
                        {selectedToken.baseForm}
                      </span>
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-2.5">
                {(() => {
                  const tokenKey = `vocab:${selectedToken.baseForm || selectedToken.surface}`;
                  const isTokenSaved = savedIds.has(tokenKey);
                  return (
                    <button
                      type="button"
                      onClick={() => void handleSaveTokenToFsrs(selectedToken)}
                      disabled={isTokenSaved}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                    >
                      {isTokenSaved ? (
                        <>
                          <BookmarkCheck className="size-4" />
                          Added to FSRS
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="size-4" />
                          Add to FSRS
                        </>
                      )}
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedToken(null)}
                  aria-label="Close token inspector"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--paper-tint)] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </GameLayout>
  );
}
