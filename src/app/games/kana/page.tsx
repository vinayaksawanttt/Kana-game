"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { saveGameSession } from "@/lib/game-core/storage";
import { createKanaSession } from "@/lib/game/session";
import { countCharacters, groupRows, type KanaGroup, type ScriptSelection } from "@/data/kana";

export default function Home() {
  const router = useRouter();
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
                      {rowsForGroup.map((row) => { const active = selectedRows.includes(row.key); const sample = script === "both" ? `${row.sample.hiragana} ${row.sample.katakana}` : row.sample[script]; return <button key={row.key} type="button" onClick={() => toggleRow(row.key)} aria-pressed={active} className={`flex min-h-[58px] items-center justify-between rounded-full border px-3 transition-colors ${active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-transparent bg-[var(--sakura-light)] text-[var(--muted)] hover:border-[var(--sakura)]"}`}><span className="text-xs font-bold">{row.romajiLabel}</span><span className="font-japanese text-xl">{sample}</span></button>; })}
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

        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-7 lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Your selection</p>
          <div className="my-5 flex items-end justify-between border-b border-[var(--line)] pb-5"><span className="font-japanese text-5xl leading-none text-[var(--primary-fg)]">{characterCount}</span><span className="pb-1 text-sm text-[var(--muted)]">characters</span></div>
          <div className="mb-5 flex items-center justify-between text-sm"><span className="text-[var(--muted)]">Questions</span><span className="font-bold">{questionMode === "all" ? characterCount : customCount}</span></div>
          <button type="button" disabled={selectedRows.length === 0} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-lg font-bold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-45" onClick={startPractice}>Start Practice <ArrowRight size={19} /></button>
        </aside>
        </div>
      </section>
    </GameLayout>
  );
}
