"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { saveGameSession } from "@/lib/game-core/storage";
import { createKanaSession } from "@/lib/game/session";
import {
  countCharacters,
  groupRows,
  type KanaGroup,
  type ScriptSelection,
} from "@/data/kana";
import { KanaRevisionSheet } from "./KanaRevisionSheet";

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
    playGameSfx("temple-bell-gong");
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
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-6 sm:px-8 sm:py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--line)]/70 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                <span>五十音練習</span>
                <span>·</span>
                <span>New Session</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                Practice setup
              </h1>
            </div>
            <button
              type="button"
              onClick={() => {
                setScript("hiragana");
                setGroups(["basic"]);
                setSelectedRows([...groupRows.basic.map((row) => row.key)]);
                setQuestionMode("all");
                setCustomCount(20);
              }}
              className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition-all hover:border-[var(--sakura)] hover:bg-[var(--sakura-light)] hover:text-[var(--primary-fg)] shadow-2xs"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-8">
            {/* 1. Script Selection */}
            <fieldset>
              <div className="mb-3 flex items-center justify-between">
                <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  1. Script · 体系
                </legend>
                <span className="text-[11px] text-[var(--muted)]">
                  {script === "hiragana" ? "Curved phonetic kana" : script === "katakana" ? "Angular loanword kana" : "Mixed randomized kana"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-1.5 shadow-2xs">
                {(["hiragana", "katakana", "both"] as const).map((option) => {
                  const active = script === option;
                  const glyphPreview = option === "hiragana" ? "あ" : option === "katakana" ? "ア" : "あア";
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-label={option}
                      aria-pressed={active}
                      onClick={() => setScript(option as ScriptSelection)}
                      className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold capitalize transition-all duration-150 ${
                        active
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <span aria-hidden="true" className="font-japanese text-base opacity-90">{glyphPreview}</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 2. Character Sets */}
            <fieldset>
              <div className="mb-3 flex items-center justify-between">
                <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  2. Character sets · 種別
                </legend>
                <span className="text-[11px] text-[var(--muted)]">
                  {groups.length} selected
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {(["basic", "dakuten", "yoon", "extended"] as KanaGroup[]).map((group) => {
                  const disabled = group === "extended" && script === "hiragana";
                  const active = groups.includes(group);
                  const count = countCharacters({ script, rowKeys: groupRows[group].map((row) => row.key) });
                  const label = group === "yoon" ? "Yōon" : group[0].toUpperCase() + group.slice(1);
                  return (
                    <button
                      key={group}
                      type="button"
                      disabled={disabled}
                      aria-pressed={active && !disabled}
                      onClick={() => toggleGroup(group)}
                      className={`relative flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-all duration-150 ${
                        disabled
                          ? "cursor-not-allowed border-dashed border-[var(--line)] bg-[var(--bg)]/50 text-[var(--muted)] opacity-55"
                          : active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold tracking-wide">{label}</span>
                        <span className={`text-[10px] ${active ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {disabled ? "Katakana only" : `${count} chars`}
                        </span>
                      </div>
                      {active && !disabled && (
                        <span className="grid size-5 place-items-center rounded-full bg-white/20 text-white">
                          <Check size={12} className="stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 3. Rows Selection */}
            <fieldset>
              <div className="mb-3 flex items-center justify-between">
                <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  3. Rows · 行選択
                </legend>
                <span className="text-[11px] text-[var(--muted)]">
                  {selectedRows.length} rows active
                </span>
              </div>
              <div className="space-y-4">
                {(["basic","dakuten","yoon","extended"] as KanaGroup[])
                  .filter((group) => groups.includes(group) && (script !== "hiragana" || group !== "extended"))
                  .map((group) => {
                    const rowsForGroup = groupRows[group];
                    const selectedForGroup = rowsForGroup.filter((row) => selectedRows.includes(row.key));
                    return (
                      <div key={group} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-4">
                        <div className="mb-3 flex items-center justify-between border-b border-[var(--line)]/50 pb-2.5">
                          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--ink)]">
                            {group === "yoon" ? "Yōon (Contracted)" : group[0].toUpperCase() + group.slice(1)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setSelectedRows((current) => [...new Set([...current, ...rowsForGroup.map((row) => row.key)])])}
                              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-[var(--primary-fg)] transition-colors hover:bg-[var(--sakura-light)]"
                            >
                              Select all
                            </button>
                            <span className="text-[var(--line)]">·</span>
                            <button
                              type="button"
                              onClick={() => setSelectedRows((current) => current.filter((key) => !rowsForGroup.some((row) => row.key === key)))}
                              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--sakura-light)] hover:text-[var(--ink)]"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {rowsForGroup.map((row) => {
                            const active = selectedRows.includes(row.key);
                            const sample = script === "both" ? `${row.sample.hiragana} ${row.sample.katakana}` : row.sample[script];
                            return (
                              <button
                                key={row.key}
                                type="button"
                                onClick={() => toggleRow(row.key)}
                                aria-pressed={active}
                                className={`flex min-h-[58px] cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-all duration-150 select-none ${
                                  active
                                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40 hover:shadow-2xs"
                                }`}
                              >
                                <span className={`text-xs font-black tracking-wider ${active ? "text-white/90" : "text-[var(--muted)]"}`}>
                                  {row.romajiLabel}
                                </span>
                                <span className="font-japanese text-xl font-medium">
                                  {sample}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {selectedForGroup.length === 0 && (
                          <p className="mt-2 text-xs font-medium text-[var(--muted)]">No rows selected in this set</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </fieldset>

            {/* 4. Number of Questions */}
            <fieldset>
              <div className="mb-3 flex items-center justify-between">
                <legend className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">
                  4. Number of questions · 出題数
                </legend>
                <span className="text-[11px] text-[var(--muted)]">
                  {questionMode === "all" ? `All ${characterCount} cards` : `${customCount} custom cards`}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={questionMode === "all"}
                  onClick={() => setQuestionMode("all")}
                  className={`flex min-h-[64px] cursor-pointer flex-col justify-center rounded-2xl border p-4 text-left transition-all duration-150 ${
                    questionMode === "all"
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--primary)]/60 hover:bg-[var(--sakura-light)]/40"
                  }`}
                >
                  <span className="text-sm font-bold">All selected ({characterCount})</span>
                  <span className={`mt-0.5 text-xs ${questionMode === "all" ? "text-white/80" : "text-[var(--muted)]"}`}>
                    Practice every chosen character once
                  </span>
                </button>

                <div
                  className={`flex min-h-[64px] flex-col justify-center rounded-2xl border p-4 transition-all duration-150 ${
                    questionMode === "custom"
                      ? "border-[var(--primary)] bg-[var(--sakura-light)]/60 shadow-xs"
                      : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)]/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      aria-pressed={questionMode === "custom"}
                      onClick={() => setQuestionMode("custom")}
                      className="cursor-pointer text-sm font-bold text-[var(--ink)]"
                    >
                      Custom count
                    </button>
                    <div className="flex items-center gap-1.5">
                      {[10, 20, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setQuestionMode("custom");
                            setCustomCount(Math.min(characterCount || 1, preset));
                          }}
                          className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                            questionMode === "custom" && customCount === preset
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-2xs"
                              : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--sakura)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionMode("custom");
                        setCustomCount((c) => Math.max(1, c - 5));
                      }}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)] hover:bg-[var(--sakura-light)]"
                    >
                      -
                    </button>
                    <input
                      value={customCount}
                      onChange={(event) => {
                        setQuestionMode("custom");
                        setCustomCount(Math.max(1, Math.min(characterCount, Number(event.target.value) || 1)));
                      }}
                      onFocus={() => setQuestionMode("custom")}
                      type="number"
                      min={1}
                      max={characterCount || 1}
                      className="w-16 rounded-lg border border-[var(--line)] bg-[var(--surface)] py-1 text-center text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--sakura)]/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionMode("custom");
                        setCustomCount((c) => Math.min(characterCount, c + 5));
                      }}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)] hover:bg-[var(--sakura-light)]"
                    >
                      +
                    </button>
                    <span className="text-xs text-[var(--muted)]">
                      questions (max {characterCount})
                    </span>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <aside className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(188,0,45,0.06)]">
            <div className="flex items-center justify-between border-b border-[var(--line)]/70 pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Your selection
              </p>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[var(--primary-fg)]">
                {script}
              </span>
            </div>

            <div className="my-5 flex items-baseline justify-between border-b border-[var(--line)]/70 pb-5">
              <div>
                <span className="font-japanese text-5xl font-black leading-none text-[var(--primary-fg)]">
                  {characterCount}
                </span>
                <span className="ml-2 text-sm font-bold text-[var(--muted)]">characters</span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-[var(--muted)]">Estimated time</span>
                <span className="text-sm font-bold text-[var(--ink)]">
                  ~{Math.max(1, Math.round((questionMode === "all" ? characterCount : customCount) * 3 / 60))} min
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--muted)] pb-5 border-b border-[var(--line)]/70">
              <div className="flex items-center justify-between">
                <span>Questions in session:</span>
                <span className="font-bold text-[var(--ink)] tabular-nums">
                  {questionMode === "all" ? characterCount : customCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active rows:</span>
                <span className="font-bold text-[var(--ink)] tabular-nums">{selectedRows.length}</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                disabled={selectedRows.length === 0}
                className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] text-base font-extrabold text-white shadow-sm transition hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                onClick={startPractice}
              >
                <span>Start Practice</span>
                <ArrowRight size={18} />
              </button>
              {selectedRows.length === 0 && (
                <p className="mt-2 text-center text-xs text-[var(--wrong)]">
                  Please select at least one row to begin.
                </p>
              )}
            </div>
          </aside>

          {/* Revise the Kana Banner */}
          <button
            type="button"
            onClick={() => setIsRevising(true)}
            className="group w-full cursor-pointer rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left shadow-[0_18px_50px_rgba(188,0,45,0.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md sm:p-6"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--sakura-light)] text-[var(--primary-fg)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                <BookOpen size={20} />
              </span>
              <ArrowRight size={18} className="text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary-fg)]" />
            </span>
            <span className="mt-4 block text-base font-bold text-[var(--ink)]">
              Revise the Kana
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
              Interactive 5-column Gojūon chart for Hiragana & Katakana with audio pronunciation and romaji.
            </span>
          </button>
        </div>
        </div>
      </section>
      )}
    </GameLayout>
  );
}
