"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookmarkCheck,
  BookmarkPlus,
  Search,
  Volume2,
} from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import {
  getKanjiByLevel,
  type KanjiLevel,
  kanjiLevels,
  type KanjiRecord,
  loadKanjiData,
  toKanjiLevel,
} from "@/data/kanji";
import { getKanjiComposites, type KanjiCompositeItem } from "@/data/kanjiVocab";
import { getRadicalsForKanji, type RadicalRecord } from "@/data/radicals";
import { getKanjiStrokeData, type KanjiStrokeData } from "@/data/strokes";
import { addKanjiToSrs } from "@/lib/srs/service";
import { StrokePracticeCanvas } from "@/components/kanji/StrokePracticeCanvas";
import { getHomophoneGroupForKanji } from "@/engine/homophones";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";
import { buildKanjiReadAllQueue } from "@/engine/audio";
import { KanjiReadingPill } from "@/components/ui/KanjiReadingPill";
import { AudioButton } from "@/components/ui/AudioButton";

interface LoadedPlaygroundBundle {
  kanji: string;
  record: KanjiRecord | null;
  levelRecords: KanjiRecord[];
  radicals: RadicalRecord[];
  composites: KanjiCompositeItem[];
  strokeData: KanjiStrokeData | null;
}

function KanjiPlaygroundContent() {
  const params = useParams<{ kanji: string }>();
  const router = useRouter();

  const targetKanji = useMemo(() => {
    const raw = typeof params?.kanji === "string" ? params.kanji : "";
    try {
      return decodeURIComponent(raw).trim() || "日";
    } catch {
      return raw.trim() || "日";
    }
  }, [params]);

  const [bundle, setBundle] = useState<LoadedPlaygroundBundle | null>(null);
  const [sidebarLevel, setSidebarLevel] = useState<KanjiLevel | null>(null);
  const [sidebarLevelCache, setSidebarLevelCache] = useState<
    Partial<Record<KanjiLevel, KanjiRecord[]>>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [savedKanjiSet, setSavedKanjiSet] = useState<Set<string>>(new Set());
  const { playReadingSequence } = useJapaneseAudio();

  useEffect(() => {
    let cancelled = false;

    async function loadCharacterBundle() {
      const allKanji = await loadKanjiData();
      const found =
        allKanji.find((item) => item.c === targetKanji) ?? allKanji[0] ?? null;
      const levelKey: KanjiLevel = found ? toKanjiLevel(found.jlpt) : "N5";

      const [levelRecords, radicals, composites, strokeData] = await Promise.all([
        getKanjiByLevel(levelKey),
        getRadicalsForKanji(found?.c ?? targetKanji),
        getKanjiComposites(found?.c ?? targetKanji, found?.jlpt),
        getKanjiStrokeData(found?.c ?? targetKanji, found?.jlpt),
      ]);

      if (!cancelled && typeof window !== "undefined") {
        setBundle({
          kanji: targetKanji,
          record: found,
          levelRecords,
          radicals,
          composites: composites.slice(0, 5),
          strokeData,
        });
        setSidebarLevel(levelKey);
        setSidebarLevelCache((prev) => ({
          ...prev,
          [levelKey]: levelRecords,
        }));
      }
    }

    void loadCharacterBundle();
    return () => {
      cancelled = true;
    };
  }, [targetKanji]);

  useEffect(() => {
    if (!sidebarLevel || sidebarLevelCache[sidebarLevel]) return;

    let cancelled = false;
    void getKanjiByLevel(sidebarLevel).then((records) => {
      if (!cancelled && typeof window !== "undefined") {
        setSidebarLevelCache((prev) => ({
          ...prev,
          [sidebarLevel]: records,
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sidebarLevel, sidebarLevelCache]);

  const activeLevel: KanjiLevel =
    sidebarLevel ??
    (bundle?.record ? toKanjiLevel(bundle.record.jlpt) : "N5");

  const sidebarKanjiList = useMemo(() => {
    const base = sidebarLevelCache[activeLevel] ?? bundle?.levelRecords ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (k) =>
        k.c.includes(q) ||
        k.meanings.some((m) => m.toLowerCase().includes(q)) ||
        k.on.some((r) => r.includes(q)) ||
        k.kun.some((r) => r.includes(q))
    );
  }, [activeLevel, bundle?.levelRecords, searchQuery, sidebarLevelCache]);

  const currentRecord = bundle?.record ?? null;
  const isSaved = currentRecord ? savedKanjiSet.has(currentRecord.c) : false;

  async function handleSaveToFsrs() {
    if (!currentRecord) return;
    await addKanjiToSrs({
      kanji: currentRecord.c,
      meaning: currentRecord.meanings.slice(0, 3).join(", "),
      reading: [...currentRecord.on, ...currentRecord.kun].join(" · ") || undefined,
      level: `N${currentRecord.jlpt}`,
    });
    setSavedKanjiSet((prev) => new Set(prev).add(currentRecord.c));
  }

  return (
    <GameLayout label="KANJI PLAYGROUND" glyph="書">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
        <div className="py-4">
          <Link
            href="/games/kanji/reading"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] transition-colors hover:text-[var(--primary-fg)]"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Kanji Reading Hub</span>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left Panel: Level Switcher & Character Search Sidebar */}
          <aside
            aria-label="Character Explorer Sidebar"
            className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm lg:max-h-[calc(100dvh-130px)]"
          >
            <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              Character Switcher
            </p>

            {/* Level Selector Pills */}
            <div className="mt-2.5 grid grid-cols-5 gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1">
              {kanjiLevels.map((lvl) => {
                const active = activeLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSidebarLevel(lvl)}
                    aria-pressed={active}
                    className={`min-h-8 rounded-lg text-xs font-bold transition-colors ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "text-[var(--ink)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)]"
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeLevel} kanji...`}
                aria-label="Search kanji in sidebar"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] pr-3 pl-8 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            {/* Character Grid */}
            <div className="mt-3 grid max-h-72 grid-cols-5 gap-1.5 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
              {sidebarKanjiList.map((k) => {
                const isSelected = currentRecord?.c === k.c;
                return (
                  <button
                    key={k.c}
                    type="button"
                    onClick={() =>
                      router.push(`/games/kanji/playground/${encodeURIComponent(k.c)}`)
                    }
                    aria-label={`Select kanji ${k.c} (${k.label})`}
                    aria-pressed={isSelected}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-colors ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                        : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]"
                    }`}
                  >
                    <span lang="ja" className="font-kanji text-xl leading-none">
                      {k.c}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Workspace: Top Information Panel + Bottom Stroke Practice */}
          <div className="flex flex-col gap-6">
            {/* Top Right Panel: Kanji Information, Radicals, and Composite Words */}
            <section
              aria-label="Kanji Information"
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6"
            >
              {currentRecord ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
                    <div className="flex items-center gap-5">
                      <div className="grid size-24 shrink-0 place-items-center rounded-2xl border border-[var(--sakura)]/60 bg-[var(--bg)] shadow-inner">
                        <span
                          lang="ja"
                          className="font-kanji text-6xl leading-none text-[var(--ink)]"
                        >
                          {currentRecord.c}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-bold text-white">
                            JLPT N{currentRecord.jlpt}
                          </span>
                          <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)]">
                            Grade {currentRecord.grade}
                          </span>
                          <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted)] tabular-nums">
                            {currentRecord.strokes} strokes
                          </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold text-[var(--ink)]">
                          {currentRecord.meanings.join(", ")}
                        </h1>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const queue = buildKanjiReadAllQueue(currentRecord);
                          void playReadingSequence(queue);
                        }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-xs font-bold text-[var(--ink)] shadow-xs transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-subtle,#fff1f2)] cursor-pointer"
                        title="Listen to primary On'yomi and Kun'yomi readings sequentially"
                      >
                        <Volume2 className="size-4 text-[var(--primary)]" />
                        <span>Pronounce</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleSaveToFsrs()}
                        disabled={isSaved}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2 text-xs font-bold text-[var(--ink)] shadow-xs transition-colors hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary)] disabled:opacity-60"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="size-4 text-[var(--correct)]" />
                            <span>Added to FSRS</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="size-4 text-[var(--primary-fg)]" />
                            <span>Add to FSRS</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Readings & Radicals Grid */}
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase block mb-1.5">
                        On&apos;yomi (音読み)
                      </span>
                      {currentRecord.on.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {currentRecord.on.map((r) => (
                            <KanjiReadingPill key={r} reading={r} type="on" size="sm" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--muted)]">—</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase block mb-1.5">
                        Kun&apos;yomi (訓読み)
                      </span>
                      {currentRecord.kun.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {currentRecord.kun.map((r) => (
                            <KanjiReadingPill key={r} reading={r} type="kun" size="sm" />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[var(--muted)]">—</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
                      <span className="text-[11px] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                        Constituent Radicals
                      </span>
                      {bundle?.radicals && bundle.radicals.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {bundle.radicals.map((rad) => (
                            <Link
                              key={rad.character}
                              href="/games/kanji/reading?view=radicals"
                              title={`Explore radical ${rad.character} (${rad.meaning})`}
                              className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs transition-colors hover:border-[var(--primary)] hover:bg-[var(--sakura-light)]"
                            >
                              <span lang="ja" className="font-japanese font-bold text-[var(--primary-fg)]">
                                {rad.character}
                              </span>
                              <span className="text-[var(--muted)]">{rad.meaning}</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs text-[var(--muted)]">
                          Elementary character
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Homophone Nuance Card */}
                  {(() => {
                    const homophoneGroup = getHomophoneGroupForKanji(currentRecord.c);
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
                            const isCurrent = member.kanji === currentRecord.c;
                            return (
                              <div
                                key={member.kanji}
                                className={`rounded-lg p-2.5 text-xs transition ${
                                  isCurrent
                                    ? "border border-[var(--primary)]/40 bg-[var(--surface)] shadow-sm"
                                    : "bg-transparent opacity-85 hover:bg-[var(--surface)]/50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-baseline gap-2">
                                    <Link
                                      href={`/games/kanji/playground/${encodeURIComponent(member.kanji)}`}
                                      className="font-japanese text-sm font-bold text-[var(--primary)] hover:underline"
                                    >
                                      {member.word} ({member.kanji})
                                    </Link>
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

                  {/* Composite Vocabulary Words */}
                  <div className="mt-5 border-t border-[var(--line)] pt-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
                        Composite Vocabulary Words
                      </h2>
                      <span className="text-[11px] font-semibold text-[var(--muted)]">
                        {bundle?.composites?.length ?? 0} compounds
                      </span>
                    </div>
                    {bundle?.composites && bundle.composites.length > 0 ? (
                      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {bundle.composites.map((comp) => (
                          <div
                            key={`${comp.word}-${comp.reading}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 shadow-2xs transition-colors hover:border-[var(--sakura)]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5">
                                <span
                                  lang="ja"
                                  className="font-japanese text-base font-bold text-[var(--ink)]"
                                >
                                  {comp.word}
                                </span>
                                <span
                                  lang="ja"
                                  className="font-japanese text-xs text-[var(--primary-fg)] font-medium"
                                >
                                  {comp.reading}
                                </span>
                              </div>
                              <p className="truncate text-xs text-[var(--muted)]">
                                {comp.meaning}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                                N{comp.jlpt}
                              </span>
                              <AudioButton
                                text={comp.word}
                                reading={comp.reading}
                                mode="vocab"
                                size="sm"
                                label={`Listen to ${comp.word}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        No composite JLPT vocabulary words recorded for this character.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-44 animate-pulse rounded-xl bg-[var(--bg)]" />
              )}
            </section>

            {/* Bottom Right Panel: Stroke Practice Canvas */}
            <StrokePracticeCanvas
              kanji={currentRecord?.c ?? targetKanji}
              level={currentRecord?.jlpt ?? null}
              strokeData={bundle?.strokeData ?? null}
            />
          </div>
        </div>
      </main>
    </GameLayout>
  );
}

export default function KanjiPlaygroundPage() {
  return (
    <Suspense
      fallback={
        <GameLayout label="KANJI PLAYGROUND" glyph="書">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
            <div className="mt-8 h-96 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
          </main>
        </GameLayout>
      }
    >
      <KanjiPlaygroundContent />
    </Suspense>
  );
}
