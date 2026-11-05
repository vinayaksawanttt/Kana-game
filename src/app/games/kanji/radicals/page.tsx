"use client";

import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { useRadicalExplorer } from "@/hooks/useRadicalExplorer";
import { addKanjiToSrs } from "@/lib/srs/service";
import { kanjiLevels } from "@/data/kanji";
import { StrokePlayer } from "@/components/kanji/StrokePlayer";
import { getHomophoneGroupForKanji } from "@/engine/homophones";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { AudioButton } from "@/components/ui/AudioButton";

export default function RadicalPracticePage() {
  const {
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
  } = useRadicalExplorer();
  const [savedKanji, setSavedKanji] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState("");
  const [showStroke, setShowStroke] = useState(false);

  async function saveKanji() {
    if (!kanjiDetails) return;
    try {
      await addKanjiToSrs({
        kanji: kanjiDetails.c,
        meaning: kanjiDetails.meanings.slice(0, 3).join(", "),
        reading: [...kanjiDetails.on, ...kanjiDetails.kun].join(" · ") || undefined,
        level: `N${kanjiDetails.jlpt}`,
      });
      setSavedKanji((current) => new Set(current).add(kanjiDetails.c));
      setActionError("");
    } catch (saveError) {
      console.error("Could not save radical kanji to FSRS.", saveError);
      setActionError("Could not add this kanji to FSRS. Please try again.");
    }
  }

  return (
    <GameLayout label="RADICAL BUILDER" glyph="部">
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Kanji components
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">Radical Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Choose a radical to find JLPT kanji that contain it, then open a character to explore
            its readings, meaning, and examples.
          </p>
        </header>

        <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_34px_rgba(188,0,45,0.045)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold">Filter by JLPT level</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kanji by JLPT level">
              {kanjiLevels.map((level) => {
                const active = activeJlptFilters.includes(level);
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleJlptFilter(level)}
                    className={`min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-[var(--wrong)]/30 bg-[var(--surface)] p-5 text-sm text-[var(--wrong)]">
            {error}
          </p>
        ) : loading ? (
          <p role="status" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">
            Loading radical library…
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(235px,0.9fr)_minmax(240px,1fr)_320px] lg:items-start">
            <section
              aria-label="Radical chart"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_34px_rgba(188,0,45,0.045)] sm:p-5"
            >
              <div className="mb-3 flex items-end justify-between gap-2">
                <div>
                  <h2 className="font-bold">Radical chart</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">{radicals.length} components</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Select one
                </span>
              </div>
              <div className="grid max-h-[58dvh] grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5 overflow-y-auto pr-1">
                {radicals.map((radical) => {
                  const active = selectedRadical === radical.character;
                  return (
                    <button
                      key={radical.character}
                      type="button"
                      title={`${radical.character}: ${radical.meaning} · ${radical.kanjiCount} kanji`}
                      aria-label={`${radical.character}, ${radical.meaning}, ${radical.kanjiCount} kanji`}
                      aria-pressed={active}
                      onClick={() => chooseRadical(radical.character)}
                      className={`flex min-h-[58px] min-w-[44px] flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition-colors ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-transparent bg-[var(--sakura-light)] text-[var(--ink)] hover:border-[var(--sakura)]"
                      }`}
                    >
                      <span className="font-japanese text-2xl leading-none">{radical.character}</span>
                      <span
                        className={`mt-1 max-w-full truncate text-[9px] leading-tight ${
                          active ? "text-white/80" : "text-[var(--muted)]"
                        }`}
                      >
                        {radical.meaning}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              aria-label="Kanji matching selected radical"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_34px_rgba(188,0,45,0.045)] sm:p-5"
            >
              <div className="mb-4 border-b border-[var(--line)] pb-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-fg)]">
                  {selectedRadicalRecord?.meaning ?? "Radical"}
                </p>
                <h2 className="mt-1 flex items-baseline gap-2 text-lg font-bold">
                  <span lang="ja" className="font-japanese text-3xl">
                    {selectedRadical ?? "—"}
                  </span>
                  <span>Matching kanji</span>
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {kanjiForRadical.length} of {selectedRadicalRecord?.kanjiCount ?? 0} in selected levels
                </p>
              </div>
              {kanjiForRadical.length ? (
                <div className="grid max-h-[60dvh] grid-cols-[repeat(auto-fill,minmax(58px,1fr))] gap-2 overflow-y-auto pr-1">
                  {kanjiForRadical.map((kanji) => {
                    const active = selectedKanji === kanji.c;
                    return (
                      <button
                        key={kanji.c}
                        type="button"
                        aria-label={`${kanji.c}, N${kanji.jlpt}, ${kanji.meanings[0] ?? "kanji"}`}
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedKanji(kanji.c);
                          setShowStroke(false);
                          setActionError("");
                        }}
                        className={`flex min-h-[68px] flex-col items-center justify-center rounded-xl border transition-colors ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[var(--line)] bg-[var(--paper-tint)] hover:border-[var(--sakura)]"
                        }`}
                      >
                        <span lang="ja" className="font-japanese text-3xl leading-none">
                          {kanji.c}
                        </span>
                        <span className={`mt-1 text-[10px] font-bold ${active ? "text-white/80" : "text-[var(--muted)]"}`}>
                          N{kanji.jlpt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[var(--muted)]">
                  {activeJlptFilters.length
                    ? "No kanji match this radical in the selected levels."
                    : "Select at least one JLPT level to see matching kanji."}
                </p>
              )}
            </section>

            <div className={kanjiDetails ? "fixed inset-0 z-30 flex items-end bg-black/45 lg:contents" : "lg:sticky lg:top-5"}>
              {kanjiDetails && (
                <button
                  type="button"
                  aria-label="Close kanji inspector"
                  onClick={() => setSelectedKanji(null)}
                  className="absolute inset-0 cursor-default lg:hidden"
                />
              )}
              <aside
                aria-label="Kanji inspector"
                className={`relative z-10 w-full overflow-y-auto rounded-t-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_20px_60px_rgba(35,26,28,0.2)] lg:rounded-2xl lg:shadow-[0_12px_34px_rgba(188,0,45,0.045)] ${
                  kanjiDetails ? "max-h-[84dvh]" : "hidden min-h-64 lg:flex lg:flex-col lg:justify-center"
                }`}
              >
                {kanjiDetails ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <span lang="ja" className="font-japanese text-7xl leading-none text-[var(--primary-fg)]">
                          {kanjiDetails.c}
                        </span>
                        <div>
                          <span className="inline-flex rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-bold text-white">
                            N{kanjiDetails.jlpt}
                          </span>
                          <p className="mt-2 text-sm font-semibold">Grade {kanjiDetails.grade}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {kanjiDetails.strokes} strokes
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Close kanji inspector"
                        onClick={() => setSelectedKanji(null)}
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--sakura-light)] text-[var(--muted)] hover:text-[var(--primary-fg)] lg:hidden"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="mt-4">
                      {showStroke ? (
                        <StrokePlayer
                          kanji={kanjiDetails.c}
                          level={kanjiDetails.jlpt}
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

                    <div className="mt-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Meanings
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed">
                          {kanjiDetails.meanings.join(", ") || "No meaning available"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-1.5">
                          On readings
                        </h3>
                        {kanjiDetails.on.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {kanjiDetails.on.map((r) => (
                              <KanjiReadingPill key={r} reading={r} type="on" size="sm" />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--muted)]">—</p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)] mb-1.5">
                          Kun readings
                        </h3>
                        {kanjiDetails.kun.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {kanjiDetails.kun.map((r) => (
                              <KanjiReadingPill key={r} reading={r} type="kun" size="sm" />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--muted)]">—</p>
                        )}
                      </div>
                    </div>

                    {/* Homophone Nuance Card */}
                    {(() => {
                      const homophoneGroup = getHomophoneGroupForKanji(kanjiDetails.c);
                      if (!homophoneGroup) return null;
                      return (
                        <div className="mt-5 rounded-xl border border-[var(--primary)]/30 bg-[var(--paper-tint)]/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--primary)]/20 pb-2">
                            <span className="text-[11px] font-bold tracking-wider text-[var(--primary)] uppercase inline-flex items-center gap-1.5">
                              Homophone Nuance · {homophoneGroup.reading}
                              <AudioButton
                                text={homophoneGroup.reading}
                                size="sm"
                                label={`Listen to shared reading ${homophoneGroup.reading}`}
                              />
                            </span>
                            <span className="text-xs font-semibold text-[var(--muted)]">
                              {homophoneGroup.title}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {homophoneGroup.members.map((member) => {
                              const isCurrent = member.kanji === kanjiDetails.c;
                              return (
                                <div
                                  key={member.kanji}
                                  className={`rounded-lg p-2.5 text-xs transition ${
                                    isCurrent
                                      ? "border border-[var(--primary)]/40 bg-[var(--surface)] shadow-sm"
                                      : "bg-transparent opacity-85"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-japanese text-sm font-bold text-[var(--ink)]">
                                        {member.word} ({member.kanji})
                                      </span>
                                      <span className="text-[11px] text-[var(--muted)]">
                                        {member.nuance}
                                      </span>
                                    </div>
                                    <AudioButton
                                      text={member.word}
                                      size="sm"
                                      label={`Listen to ${member.word}`}
                                    />
                                  </div>
                                  <p className="mt-1 font-japanese text-[11px] text-[var(--muted)]">
                                    {member.example}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-5 border-t border-[var(--line)] pt-4">
                      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Example sentences
                      </h3>
                      {kanjiDetails.examples.length ? (
                        <div className="mt-2 space-y-3">
                          {kanjiDetails.examples.slice(0, 3).map((example, index) => (
                            <article key={`${example.jp}-${index}`} className="border-b border-[var(--line)]/70 pb-3 last:border-0">
                              <p lang="ja" className="font-japanese text-sm leading-relaxed">
                                {example.jp}
                              </p>
                              {example.romaji && (
                                <p className="mt-1 text-[10px] text-[var(--muted)]">
                                  {example.romaji}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-[var(--muted)]">{example.en}</p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          No local example sentences found for this kanji.
                        </p>
                      )}
                    </div>

                    {actionError && (
                      <p role="alert" className="mt-3 text-xs font-semibold text-[var(--wrong)]">
                        {actionError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void saveKanji()}
                      disabled={savedKanji.has(kanjiDetails.c)}
                      className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savedKanji.has(kanjiDetails.c) ? (
                        <>
                          <BookmarkCheck size={17} /> Added to FSRS
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={17} /> Add to FSRS
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <p className="px-4 text-center text-sm text-[var(--muted)]">
                    Choose a kanji tile to inspect its readings, meanings, and example sentences.
                  </p>
                )}
              </aside>
            </div>
          </div>
        )}
      </section>
    </GameLayout>
  );
}
