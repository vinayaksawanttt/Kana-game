"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { GameLayout } from "@/lib/game-core/layout";
import { formatTime } from "@/lib/game-core/time";
import { getGameResult, saveGameSession } from "@/lib/game-core/storage";
import {
  createGrammarSession,
  type GrammarQuestionStatus,
  type GrammarSessionResult,
} from "@/engine/grammarSession";

type Filter = "All" | "Wrong" | "Correct";

export default function GrammarResultPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
          Preparing results...
        </main>
      }
    >
      <GrammarResultContent />
    </Suspense>
  );
}

function GrammarResultContent() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<GrammarSessionResult | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = getGameResult<GrammarSessionResult>("grammar", sessionId);
    if (!saved || saved.sessionId !== sessionId) {
      router.replace("/games/grammar");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!result) return null;
    const correct = result.questions.filter((q) => q.status === "correct").length;
    const wrong = result.questions.filter((q) => q.status === "wrong").length;
    const unanswered = result.questions.filter((q) => q.status === "unanswered").length;
    const total = result.questions.length;
    const elapsed = result.endedAt - result.startedAt;
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    return { correct, wrong, unanswered, total, elapsed, percentage };
  }, [result]);

  if (!result || !stats) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--bg)] text-[var(--muted)]">
        Preparing results...
      </main>
    );
  }

  const filtered = result.questions.filter(
    (q) => filter === "All" || q.status.toLowerCase() === filter.toLowerCase()
  );
  const missedGrammarIds = [
    ...new Set(result.questions.filter((q) => q.status !== "correct").map((q) => q.grammarId)),
  ];

  async function startPractice(missedOnly: boolean) {
    if (!result || working) return;
    setWorking(true);
    setError("");
    try {
      const nextSession = await createGrammarSession({
        levels: result.settings.levels,
        size: result.settings.size,
        clozeRatio: result.settings.clozeRatio,
        ...(missedOnly ? { grammarIds: missedGrammarIds } : {}),
      });
      saveGameSession("grammar", nextSession.sessionId, nextSession);
      router.push(`/games/grammar/play/${nextSession.sessionId}`);
    } catch (startError) {
      console.error("Could not start grammar session.", startError);
      setError("A new session could not be started.");
      setWorking(false);
    }
  }

  return (
    <GameLayout label="GRAMMAR" glyph="文">
      <section className="mx-auto w-full max-w-6xl flex-1 px-5 pb-8 sm:px-8">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(188,0,45,0.055)] sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Session complete
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">Grammar practice results</h1>
            </div>
            <div className="rounded-md bg-[var(--sakura-light)] px-5 py-3">
              <p className="text-2xl font-bold">
                {stats.correct} / {stats.total}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {stats.percentage}% · {formatTime(stats.elapsed)}
              </p>
            </div>
          </div>

          <div className="my-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold">
              Correct: {stats.correct}
            </span>
            <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold">
              Wrong: {stats.wrong}
            </span>
            {result.endedEarly && (
              <span className="rounded-full bg-[var(--sakura-light)] px-3 py-1.5 text-xs font-bold">
                Unanswered: {stats.unanswered}
              </span>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-2 border-b border-[var(--line)] pb-3">
            {(["All", "Wrong", "Correct"] as Filter[]).map((tab) => {
              const count =
                tab === "All" ? stats.total : tab === "Wrong" ? stats.wrong : stats.correct;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  aria-pressed={filter === tab}
                  className={`rounded-md px-3 py-2 text-sm font-bold ${
                    filter === tab ? "bg-[var(--primary)] text-white" : "secondary-button border"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--line)]">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-[var(--surface)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="p-3">Pattern</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sentence</th>
                  <th className="p-3">Your Answer</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-t border-[var(--line)]">
                    <td className="p-3">
                      <Link
                        href={`/grammar/${q.level}/${q.grammarSlug}`}
                        className="font-japanese font-bold text-[var(--primary)] hover:underline"
                      >
                        {q.grammarPattern}
                      </Link>
                      <span className="ml-2 rounded bg-[var(--paper-tint)] px-1.5 py-0.5 text-[11px] font-bold">
                        {q.level}
                      </span>
                    </td>
                    <td className="p-3 text-xs uppercase text-[var(--muted)]">{q.type}</td>
                    <td className="p-3">
                      <p lang="ja" className="font-japanese font-semibold">
                        {q.sentenceJp}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{q.en}</p>
                    </td>
                    <td className="p-3 font-japanese text-xs">
                      {q.chosenAnswer ?? "—"}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-[var(--wrong)]">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={!missedGrammarIds.length || working}
              onClick={() => void startPractice(true)}
              className="secondary-button flex h-12 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={17} />
              Practice missed grammar ({missedGrammarIds.length})
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => void startPractice(false)}
              className="primary-button flex h-12 flex-1 items-center justify-center gap-2 rounded-md text-sm font-bold"
            >
              Play again <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => router.push("/games/grammar")}
              className="secondary-button h-12 flex-1 rounded-md border text-sm font-bold"
            >
              Change settings
            </button>
          </div>
        </div>
      </section>
    </GameLayout>
  );
}

function StatusBadge({ status }: { status: GrammarQuestionStatus }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[var(--correct)]">
        <Check size={15} /> Correct
      </span>
    );
  }
  if (status === "wrong") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[var(--wrong)]">
        <X size={15} /> Wrong
      </span>
    );
  }
  return <span className="font-bold text-[var(--muted)]">— Unanswered</span>;
}
