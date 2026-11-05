"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import { createKanaSession } from "@/lib/game/session";
import {
  countCharacters,
  groupRows,
  kanaCharacters,
  type KanaGroup,
  type KanaScript,
  type ScriptSelection,
} from "@/data/kana";
import { useJapaneseAudio } from "@/hooks/useJapaneseAudio";

export default function Home() {
  const router = useRouter();
  const [isRevising, setIsRevising] = useState(false);
  const [script, setScript] = useState<ScriptSelection>("hiragana");
  const [groups, setGroups] = useState<KanaGroup[]>(["basic"]);
  const [selectedRows, setSelectedRows] = useState<string[]>([...groupRows.basic.map((row) => row.key)]);
  const [questionMode, setQuestionMode] = useState<"all" | "custom">("all");
  const [customCount, setCustomCount] = useState(20);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kana-last-setup") || "null") as {
        script?: ScriptSelection;
        groups?: KanaGroup[];
        rowKeys?: string[];
        questionCount?: number | null;
      } | null;
      if (saved) {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (saved.script) setScript(saved.script);
        if (saved.groups) setGroups(saved.groups);
        if (saved.rowKeys) setSelectedRows(saved.rowKeys);
        if (saved.questionCount === null || saved.questionCount === undefined) {
          setQuestionMode("all");
        } else {
          setQuestionMode("custom");
          setCustomCount(saved.questionCount);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
  }, []);

  const characterCount = useMemo(() => countCharacters({ script, rowKeys: selectedRows }), [script, selectedRows]);

  function toggleRow(rowKey: string) {
    setSelectedRows((current) => current.includes(rowKey) ? current.filter((item) => item !== rowKey) : [...current, rowKey]);
  }

  function toggleGroup(group: KanaGroup) {
    setGroups((current) => {
      const active = current.includes(group);
      setSelectedRows((rows) => active
        ? rows.filter((key) => !key.startsWith(`${group}:`))
        : [...rows, ...groupRows[group].map((row) => row.key)]);
      return active ? current.filter((item) => item !== group) : [...current, group];
    });
  }

  function startPractice() {
    if (characterCount === 0) return;
    const session = createKanaSession({
      script,
      rowKeys: selectedRows.filter((key) => script === "hiragana" ? !key.startsWith("extended:") : true),
      questionCount: questionMode === "all" ? null : Math.min(customCount, characterCount),
    });

    localStorage.setItem(
      "kana-last-setup",
      JSON.stringify({
        script,
        groups,
        rowKeys: session.settings.rowKeys,
        questionCount: session.settings.questionCount,
      })
    );
    saveGameSession("kana", session.sessionId, session);
    router.push(`/games/kana/play/${session.sessionId}`);
  }

  return (
    <GameLayout label="KANA" glyph="あ">
      {isRevising ? (
        <KanaRevisionSheet onClose={() => setIsRevising(false)} />
      ) : (
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">New session</p><h1 className="text-2xl font-bold sm:text-3xl">Practice setup</h1></div>
            <button type="button" onClick={() => { setScript("hiragana"); setGroups(["basic"]); setSelectedRows([...groupRows.basic.map((row) => row.key)]); setQuestionMode("all"); setCustomCount(20); }} className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)]">
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          <div className="space-y-7">
            <fieldset>
              <legend className="mb-3 text-sm font-bold">Script</legend>
              <div className="grid grid-cols-3 gap-1 rounded-full bg-[var(--sakura-light)] p-1">
                {["hiragana", "katakana", "both"].map((option) => (
                  <button key={option} type="button" aria-pressed={script === option} onClick={() => setScript(option as ScriptSelection)} className={`min-h-11 rounded-full px-2 py-2.5 text-sm font-semibold capitalize transition-colors ${script === option ? "bg-[var(--primary)] text-white shadow-sm" : "bg-[var(--sakura-light)] text-[var(--muted)]"}`}>{option}</button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-bold">Character sets</legend>
              <div className="grid gap-2 sm:grid-cols-4">
                {(["basic", "dakuten", "yoon", "extended"] as KanaGroup[]).map((group) => {
                  const disabled = group === "extended" && script === "hiragana";
                  const active = groups.includes(group);
                  const count = countCharacters({ script, rowKeys: groupRows[group].map((row) => row.key) });
                  const label = group === "yoon" ? "Yōon" : group[0].toUpperCase() + group.slice(1);
                  return <button key={group} type="button" disabled={disabled} aria-pressed={active && !disabled} onClick={() => toggleGroup(group)} className={`relative min-h-11 rounded-full border px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${active && !disabled ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"}`}><span className="font-bold">{label}</span><span className="ml-2 text-xs opacity-80">{disabled ? "Katakana only" : `${count} chars`}</span>{active && !disabled && <Check className="ml-1 inline text-white" size={15} />}</button>;
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-4 text-sm font-bold">Rows</legend>
              <div className="space-y-4">
                {(["basic","dakuten","yoon","extended"] as KanaGroup[]).filter((group) => groups.includes(group) && (script !== "hiragana" || group !== "extended")).map((group) => {
                  const rowsForGroup = groupRows[group];
                  const selectedForGroup = rowsForGroup.filter((row) => selectedRows.includes(row.key));
                  return <div key={group} className="rounded-xl border border-[var(--line)] p-3">
                    <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.12em]">{group === "yoon" ? "Yōon" : group[0].toUpperCase() + group.slice(1)}</span><div className="flex gap-1 text-xs font-bold"><button type="button" onClick={() => setSelectedRows((current) => [...new Set([...current, ...rowsForGroup.map((row) => row.key)])])} className="rounded px-2 py-1 text-[var(--primary-fg)]">Select all</button><button type="button" onClick={() => setSelectedRows((current) => current.filter((key) => !rowsForGroup.some((row) => row.key === key)))} className="rounded px-2 py-1 text-[var(--muted)]">Clear</button></div></div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {rowsForGroup.map((row) => {
                        const active = selectedRows.includes(row.key);
                        const sample = script === "both" ? `${row.sample.hiragana} ${row.sample.katakana}` : row.sample[script];
                        return (
                          <div
                            key={row.key}
                            className={`flex min-h-[58px] items-center justify-between rounded-full border px-3 transition-colors ${
                              active
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleRow(row.key)}
                              aria-pressed={active}
                              className="flex flex-1 items-center justify-between text-left cursor-pointer pr-2"
                            >
                              <span className="text-xs font-bold">{row.romajiLabel}</span>
                              <span className="font-japanese text-xl">{sample}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {selectedForGroup.length === 0 && <p className="mt-2 text-xs text-[var(--muted)]">No rows selected</p>}
                  </div>;
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-bold">Number of questions</legend>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={questionMode === "all"} onClick={() => setQuestionMode("all")} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${questionMode === "all" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)]"}`}>All selected<span className={`mt-0.5 block text-xs font-normal ${questionMode === "all" ? "text-white/80" : "text-[var(--muted)]"}`}>Once each</span></button>
                <button type="button" aria-pressed={questionMode === "custom"} onClick={() => setQuestionMode("custom")} className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${questionMode === "custom" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)]"}`}><span>Custom</span><span className={`mt-0.5 flex items-center gap-1 text-xs font-normal ${questionMode === "custom" ? "text-white/80" : "text-[var(--muted)]"}`}><input value={customCount} onChange={(event) => setCustomCount(Math.max(1, Math.min(characterCount, Number(event.target.value) || 1)))} onFocus={() => setQuestionMode("custom")} type="number" min={1} max={characterCount || 1} className="w-14 border-b border-current bg-transparent text-inherit outline-none" />questions · max {characterCount}</span></button>
              </div>
            </fieldset>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Your selection</p>
          <div className="my-5 flex items-end justify-between border-b border-[var(--line)] pb-5"><span className="font-japanese text-5xl leading-none text-[var(--primary-fg)]">{characterCount}</span><span className="pb-1 text-sm text-[var(--muted)]">characters</span></div>
          <div className="mb-5 flex items-center justify-between text-sm"><span className="text-[var(--muted)]">Questions</span><span className="font-bold">{questionMode === "all" ? characterCount : customCount}</span></div>
          <button type="button" disabled={selectedRows.length === 0} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-lg font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45" onClick={startPractice}>Start Practice <ArrowRight size={19} /></button>
        </aside>
        <button
          type="button"
          onClick={() => setIsRevising(true)}
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left shadow-[0_18px_50px_rgba(188,0,45,0.055)] transition hover:-translate-y-0.5 hover:border-[var(--sakura)] sm:p-6"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--sakura-light)] text-[var(--primary-fg)]">
              <BookOpen size={19} />
            </span>
            <ArrowRight size={18} className="text-[var(--muted)]" />
          </span>
          <span className="mt-4 block text-base font-bold">Revise the Kana</span>
          <span className="mt-1 block text-sm text-[var(--muted)]">
            Browse Hiragana and Katakana, with optional romaji and pronunciation.
          </span>
        </button>
        </div>
        </div>
      </section>
      )}
    </GameLayout>
  );
}

const revisionGroups: Array<{ key: KanaGroup; title: string }> = [
  { key: "basic", title: "Basic" },
  { key: "dakuten", title: "Dakuten & Handakuten" },
  { key: "yoon", title: "Yōon" },
  { key: "extended", title: "Extended Katakana" },
];

function KanaRevisionSheet({ onClose }: { onClose: () => void }) {
  const [script, setScript] = useState<KanaScript>("hiragana");
  const [showRomaji, setShowRomaji] = useState(false);
  const { playKana } = useJapaneseAudio();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 sm:px-6">
      <header className="py-6 sm:py-8">
        <button
          type="button"
          onClick={onClose}
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} />
          Back to practice setup
        </button>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[var(--primary-fg)] uppercase">
              Kana reference
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Revise the Kana</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)]">
              Review each character, then tap a tile to hear its pronunciation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Kana script"
              className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm"
            >
              {(["hiragana", "katakana"] as KanaScript[]).map((option) => {
                const active = script === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setScript(option)}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold capitalize transition-colors ${
                      active
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--muted)] hover:bg-[var(--sakura-light)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showRomaji}
              onClick={() => setShowRomaji((visible) => !visible)}
              className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold transition-colors hover:border-[var(--sakura)]"
            >
              Romaji
              <span
                aria-hidden="true"
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  showRomaji ? "bg-[var(--primary)]" : "bg-[var(--line)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                    showRomaji ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {revisionGroups.map(({ key, title }) => {
          const characters = kanaCharacters.filter(
            (character) => character.script === script && character.group === key
          );
          if (characters.length === 0) return null;

          return (
            <section
              key={key}
              aria-label={title}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="text-sm font-extrabold tracking-[0.12em] text-[var(--ink)] uppercase">
                  {title}
                </h2>
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)] tabular-nums">
                  {characters.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 sm:gap-3 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                {characters.map((character) => {
                  return (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => playKana(character.char, character.romaji[0])}
                      aria-label={`Play pronunciation for ${character.char}`}
                      className="group flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--bg)] p-2 text-center transition duration-150 hover:-translate-y-0.5 hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)]/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    >
                      <span className="font-japanese text-3xl leading-none text-[var(--ink)] sm:text-4xl">
                        {character.char}
                      </span>
                      {showRomaji && (
                        <span className="mt-2 w-full truncate text-xs font-semibold text-[var(--muted)]">
                          {character.romaji[0]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
