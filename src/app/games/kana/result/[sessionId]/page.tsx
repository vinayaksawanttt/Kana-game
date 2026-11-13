"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { playGameSfx } from "@/lib/game-core/sfx";
import { formatTime } from "@/lib/game-core/time";
import { getGameSession, saveGameSession } from "@/lib/game-core/storage";
import type { KanaSessionResult } from "@/lib/game/kana";
import { createKanaSession, type CardRecord, type StoredKanaSession } from "@/lib/game/session";
import { localStorageAdapter } from "@/lib/storage/kana";
import { SakuraLoader } from "@/components/ui/SakuraLoader";
import { AudioButton } from "@/components/ui/AudioButton";

type Filter = "All" | "Passed" | "Needs practice" | "Skipped" | "Not reached";

export default function KanaResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
          <SakuraLoader label="Calculating Performance..." size="md" />
        </main>
      }
    >
      <KanaResultContent />
    </Suspense>
  );
}

function KanaResultContent() {
  const router = useRouter();
  const params=useParams<{sessionId:string}>();
  const [filter,setFilter]=useState<Filter>("All");
  const [result,setResult]=useState<KanaSessionResult|null>(null);
  useEffect(() => {
    try {
      const saved = localStorageAdapter.getResult(params.sessionId);
      if (!saved || typeof saved !== "object") {
        router.replace("/games/kana");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(saved as KanaSessionResult);
      playGameSfx("victory-fanfare");
    } catch {
      router.replace("/games/kana");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  if (!result) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
        <SakuraLoader label="Calculating Performance..." size="md" />
      </main>
    );
  }
  const cards=[...result.cards];
  cards.sort((left,right)=>{
    const leftNeeds=["skipped","unfinished"].includes(left.status)||left.mistakes>0;
    const rightNeeds=["skipped","unfinished"].includes(right.status)||right.mistakes>0;
    if(leftNeeds!==rightNeeds)return leftNeeds?-1:1;
    if(left.status=== "not-reached" && right.status!== "not-reached")return 1;
    if(right.status=== "not-reached" && left.status!== "not-reached")return -1;
    return right.mistakes-left.mistakes;
  });
  const total=result.cards.length;
  const first=result.cards.filter((card)=>card.status=== "correct-first-try").length;
  const retry=result.cards.filter((card)=>card.status=== "correct-after-retry").length;
  const skipped=result.cards.filter((card)=>card.status=== "skipped").length;
  const unfinished=result.cards.filter((card)=>card.status=== "unfinished").length;
  const notReached=result.cards.filter((card)=>card.status=== "not-reached").length;
  const attempted=first+retry+skipped+unfinished;
  const mistakes=result.cards.reduce((sum,card)=>sum+card.mistakes,0);
  const percentage=total ? Math.round(first/total*100) : 0;
  const time=formatTime(result.endedAt-result.startedAt);
  const weakIds=result.cards.filter((card)=>card.status=== "skipped"||card.status=== "unfinished"||card.mistakes>0).map((card)=>card.id);
  const correctOverall=first+retry;
  const filtered=cards.filter((card)=>filter === "All" || (filter === "Passed" && card.status.startsWith("correct")) || (filter === "Needs practice" && (["skipped","unfinished","pending"].includes(card.status)||card.mistakes>0)) || (filter === "Skipped" && card.status=== "skipped") || (filter === "Not reached" && card.status=== "not-reached"));
  function practice(options: { weak?: boolean }) {
    const stored = getGameSession<StoredKanaSession>("kana", params.sessionId);
    const settings = stored?.settings ?? (stored as unknown as { script: "hiragana" | "katakana" | "both"; rowKeys: string[]; questionCount: number | null }) ?? {
      script: "both" as const,
      rowKeys: [],
      questionCount: null,
    };
    const newSession = createKanaSession({
      script: settings.script,
      rowKeys: options.weak ? [] : settings.rowKeys,
      questionCount: options.weak ? null : settings.questionCount,
      characterIds: options.weak ? weakIds : undefined,
    });
    saveGameSession("kana", newSession.sessionId, newSession);
    router.push(`/games/kana/play/${newSession.sessionId}`);
  }
  function resultLabel(card:CardRecord) { if(card.status=== "correct-first-try")return"✓ Passed first try"; if(card.status=== "correct-after-retry")return"✓ Passed after retry"; if(card.status=== "skipped")return"Skipped"; if(card.status=== "unfinished")return"× Unfinished"; if(card.status=== "not-reached")return"— Not reached"; return"— Pending"; }

  return (
    <GameLayout label="KANA" glyph="あ">
      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-6 sm:px-8 sm:py-8">
        <div className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(208,16,76,.08)] sm:p-8">
          {/* Header Deck with Performance Stamp */}
          <div className="flex flex-col items-start justify-between gap-6 border-b border-[var(--line)]/70 pb-6 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary-fg)]">
                <span>セッション完了</span>
                <span>·</span>
                <span>Session complete</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
                Report card
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-[var(--sakura-light)] shadow-xs">
                <Trophy size={24} className="text-[var(--primary-fg)]" />
              </div>
              <div>
                <div className="text-3xl font-black text-[var(--ink)] leading-none tabular-nums">
                  {first} / {total}
                </div>
                <div className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  {percentage}% first try
                </div>
              </div>
            </div>
          </div>

          {/* Subheader Attempt Counter */}
          <p className="py-4 text-sm font-bold text-[var(--muted)]">
            Correct overall (first try + retries): {correctOverall} · Attempted: {attempted} of {total}
          </p>

          {/* Multi-Segmented Progress Bar */}
          <div
            className="mb-4 h-3.5 overflow-hidden rounded-full border border-[var(--line)]/60 bg-[var(--bg)] p-0.5 shadow-inner"
            aria-label="Result status progress"
          >
            <div className="flex h-full overflow-hidden rounded-full">
              <span
                style={{ width: `${total ? (first / total) * 100 : 0}%` }}
                className="bg-[var(--correct)] transition-[width] duration-300"
                title={`Passed first try: ${first}`}
              />
              <span
                style={{ width: `${total ? (retry / total) * 100 : 0}%` }}
                className="bg-[var(--sakura)] transition-[width] duration-300"
                title={`After retries: ${retry}`}
              />
              <span
                style={{ width: `${total ? (skipped / total) * 100 : 0}%` }}
                className="bg-[var(--muted)] transition-[width] duration-300"
                title={`Skipped: ${skipped}`}
              />
              <span
                style={{ width: `${total ? (unfinished / total) * 100 : 0}%` }}
                className="bg-[var(--wrong)] transition-[width] duration-300"
                title={`Unfinished: ${unfinished}`}
              />
              <span
                style={{ width: `${total ? (notReached / total) * 100 : 0}%` }}
                className="bg-[var(--line)] transition-[width] duration-300"
                title={`Not reached: ${notReached}`}
              />
            </div>
          </div>

          {/* Distinct Semantic Legend */}
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--ink)]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--correct)]/20 bg-[var(--correct)]/10 px-2.5 py-1 text-[var(--correct)]">
              <span className="size-2 rounded-full bg-[var(--correct)]" />
              ■ First try <b className="tabular-nums">{first}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--sakura)]/30 bg-[var(--sakura-light)] px-2.5 py-1 text-[var(--primary-fg)]">
              <span className="size-2 rounded-full bg-[var(--sakura)]" />
              ■ Retries <b className="tabular-nums">{retry}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-[var(--muted)]">
              <span className="size-2 rounded-full bg-[var(--muted)]" />
              ■ Skipped <b className="tabular-nums">{skipped}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--wrong)]/20 bg-[var(--wrong)]/10 px-2.5 py-1 text-[var(--wrong)]">
              <span className="size-2 rounded-full bg-[var(--wrong)]" />
              ■ Unfinished <b className="tabular-nums">{unfinished}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[var(--muted)]">
              <span className="size-2 rounded-full bg-[var(--line)]" />
              ■ Not reached <b className="tabular-nums">{notReached}</b>
            </span>
          </div>

          {/* Metrics Scan Grid */}
          <div className="grid grid-cols-2 gap-2.5 py-2 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Passed first try", first, "text-[var(--correct)]"],
              ["After retries", retry, "text-[var(--primary-fg)]"],
              ["Skipped", skipped, "text-[var(--muted)]"],
              ["Unfinished", unfinished, "text-[var(--wrong)]"],
              ["Not reached", notReached, "text-[var(--muted)]"],
              ["Mistakes", mistakes, "text-[var(--wrong)]"],
              ["Time", time, "text-[var(--ink)]"],
            ].map(([label, value, colorClass]) => {
              const key = String(label);
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-3 shadow-2xs transition-all hover:border-[var(--sakura)]"
                >
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] truncate">
                    {label}
                  </span>
                  <span className={`mt-1 block text-lg font-black tabular-nums ${colorClass}`}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filter Tabs */}
          <div className="mt-5 flex flex-wrap gap-2 border-b border-[var(--line)]/70 pb-3">
            {(["All", "Passed", "Needs practice", "Skipped", "Not reached"] as Filter[]).map((tab) => {
              const count =
                tab === "All"
                  ? total
                  : tab === "Passed"
                  ? first + retry
                  : tab === "Skipped"
                  ? skipped
                  : tab === "Not reached"
                  ? notReached
                  : cards.filter(
                      (card) =>
                        ["skipped", "unfinished", "pending"].includes(card.status) ||
                        card.mistakes > 0
                    ).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    filter === tab
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "secondary-button border hover:border-[var(--primary)]/50"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Results Table */}
          <div className="result-table mt-4 max-h-[50vh] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xs">
            <div className="result-grid result-header sticky top-0 z-10 min-w-[620px] border-b border-[var(--line)] bg-[var(--surface)] text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)] select-none">
              <span>Character</span>
              <span>Romaji</span>
              <span>Result</span>
              <span className="text-center">Mistakes</span>
              <span>What you typed</span>
            </div>
            {filtered.map((card) => (
              <div
                key={card.id}
                className="result-grid result-row min-w-[620px] border-b border-[var(--line)]/60 transition-colors hover:bg-[var(--sakura-light)]/20"
              >
                <div className="flex items-center gap-2">
                  <span className="font-japanese text-2xl font-medium text-[var(--ink)]">{card.char}</span>
                  <AudioButton
                    text={card.char}
                    romaji={card.romaji[0]}
                    size="sm"
                    label={`Listen to ${card.char}`}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-[var(--ink)]">
                  {card.romaji.join(" / ")}
                </span>
                <span
                  className={`result-badge ${
                    card.status === "skipped" || card.status === "pending" || card.status === "not-reached"
                      ? "text-[var(--muted)]"
                      : card.status.startsWith("correct")
                      ? "text-[var(--correct)]"
                      : "text-[var(--wrong)]"
                  }`}
                >
                  {resultLabel(card)}
                </span>
                <span className="text-center font-bold tabular-nums">{card.mistakes}</span>
                <span className="flex flex-wrap gap-1.5">
                  {card.wrongAnswers.length ? (
                    card.wrongAnswers.map((answer, index) => (
                      <span
                        key={`${answer}-${index}`}
                        className="rounded-md border border-[var(--wrong)]/20 bg-[var(--wrong)]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[var(--wrong)]"
                      >
                        {answer}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => practice({ weak: true })}
              disabled={weakIds.length === 0}
              className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm leading-snug font-extrabold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                weakIds.length > 0
                  ? "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md"
                  : "secondary-button border"
              }`}
            >
              <RotateCcw size={16} />
              <span>Practice weak characters ({weakIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => practice({})}
              className="primary-button flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm leading-snug font-extrabold shadow-sm transition hover:shadow-md"
            >
              <span>Play again</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/games/kana")}
              className="secondary-button flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm leading-snug font-extrabold transition hover:border-[var(--primary)]"
            >
              Change settings
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}
